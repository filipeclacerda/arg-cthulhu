import { describe, expect, it } from "vitest";
import { isPlayAllowed } from "./telemetry";

describe("telemetry consent", () => {
  it("never blocks play when the player has not decided", () => {
    expect(isPlayAllowed("unknown")).toBe(true);
  });

  it("keeps both explicit choices playable", () => {
    expect(isPlayAllowed("granted")).toBe(true);
    expect(isPlayAllowed("denied")).toBe(true);
  });
});
