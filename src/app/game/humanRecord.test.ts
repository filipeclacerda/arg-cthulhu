import { describe, expect, it } from "vitest";
import { createInitialProgress } from "./progress";
import { selectHumanRecord } from "./humanRecord";

describe("final human record", () => {
  it("always preserves a human memory before adding horror", () => {
    const record = selectHumanRecord(createInitialProgress(), "en");
    expect(record.kind).toBe("fallback");
    expect(record.body).toContain("Sarah promised");
    expect(record.body).toContain("still in progress");
  });

  it("lets the 1998 reply alter the discovered cafe record", () => {
    const state = createInitialProgress();
    state.readFileIds.push("gull_0310_receipt");
    state.playerChoices.push({
      choiceId: "next_user_1998_reply",
      optionId: "warn",
      chosenAt: Date.now(),
    });
    const record = selectHumanRecord(state, "en");
    expect(record.kind).toBe("cafe");
    expect(record.body).toContain("DO NOT WRITE THE NAME");
  });

  it("is fully localized", () => {
    const state = createInitialProgress();
    state.readFileIds.push("voicemail_to_em");
    expect(selectHumanRecord(state, "pt-BR").body).toContain("trajeto até a casa");
  });
});
