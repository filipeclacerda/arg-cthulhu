import { describe, expect, it, vi } from "vitest";
import { copyCaseCode } from "./caseCodeClipboard";

describe("case code clipboard", () => {
  it("reports copied when the browser accepts the write", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
    await expect(copyCaseCode("MISK6.test")).resolves.toBe("copied");
  });
  it("returns a selectable fallback when clipboard access throws", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    await expect(copyCaseCode("MISK6.test")).resolves.toBe("fallback");
  });
});
