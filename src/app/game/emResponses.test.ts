import { describe, expect, it } from "vitest";
import { answeredEmResponses, nextEmResponse } from "./emResponses";
import { createInitialProgress } from "./progress";

describe("Em's optional responses", () => {
  it("never appears before the related personal fact is opened", () => {
    expect(nextEmResponse(createInitialProgress())).toBeNull();
  });

  it("reveals conversations progressively in a stable order", () => {
    const state = createInitialProgress();
    state.readFileIds.push("gull_0310_receipt", "voicemail_to_em");
    expect(nextEmResponse(state)?.id).toBe("cafe");
    state.playerChoices.push({
      choiceId: "em_optional_cafe",
      optionId: "cafe",
      chosenAt: Date.now(),
    });
    expect(nextEmResponse(state)?.id).toBe("voicemail");
    expect(answeredEmResponses(state).map((response) => response.id)).toEqual(["cafe"]);
  });

  it("keeps every response bilingual", () => {
    const state = createInitialProgress();
    state.readFileIds.push("dad_recipe");
    const response = nextEmResponse(state);
    expect(response?.prompt.en).toBeTruthy();
    expect(response?.prompt.pt).toBeTruthy();
    expect(response?.response.en).toBeTruthy();
    expect(response?.response.pt).toBeTruthy();
  });
});
