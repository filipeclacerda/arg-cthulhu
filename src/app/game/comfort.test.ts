import { describe, expect, it } from "vitest";
import {
  clampWindowPosition,
  defaultComfortSettings,
  shouldActivateDesktopItem,
} from "./comfort";

describe("comfort interaction contracts", () => {
  it("activates desktop items with keyboard and touch-friendly clicks", () => {
    expect(shouldActivateDesktopItem("Enter")).toBe(true);
    expect(shouldActivateDesktopItem(" ")).toBe(true);
    expect(shouldActivateDesktopItem("ArrowDown")).toBe(false);
  });

  it("keeps dragged windows within the visible desktop", () => {
    expect(clampWindowPosition({ x: -20, y: 900 }, { width: 300, height: 200 }, { width: 800, height: 600 }))
      .toEqual({ x: 0, y: 400 });
  });

  it("starts with conservative comfort defaults", () => {
    expect(defaultComfortSettings).toMatchObject({
      reducedMotion: false,
      reducedFlicker: false,
      highContrast: false,
      ambientVolume: 1,
      effectsVolume: 1,
      mediaVolume: 1,
    });
  });
});
