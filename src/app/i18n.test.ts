import { describe, expect, it } from "vitest";
import { translate, translationTables } from "./i18n";

describe("i18n translations", () => {
  it("returns stable core labels in both locales", () => {
    expect(translate("en", "restoreSarahLabel")).toBe("RESTORE SARAH");
    expect(translate("pt-BR", "restoreSarahLabel")).toBe("RESTAURAR SARAH");
    expect(translate("en", "casefileLabel")).toBe("Casefile.exe");
    expect(translate("pt-BR", "casefileLabel")).toBe("Dossiê do Caso");
  });

  it("localizes puzzle hint labels for all active locales", () => {
    expect(translate("en", "casefileStatusRetained")).toBe("retained");
    expect(translate("pt-BR", "casefileStatusRetained")).toBe("retido");
    expect(translate("en", "casefileNeedTimelineHint")).toContain("timeline");
    expect(translate("pt-BR", "casefileNeedTimelineHint")).toContain(
      "cronologia"
    );
  });

  it("keeps translation tables populated and key-compatible", () => {
    const enKeys = Object.keys(translationTables.en);
    const ptKeys = Object.keys(translationTables.pt);
    expect(ptKeys.sort()).toEqual(enKeys.sort());
    for (const table of Object.values(translationTables)) {
      for (const value of Object.values(table)) {
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps product/tool names invariant where the fiction requires it", () => {
    expect(translate("pt-BR", "cipherLabLabel")).toBe("Cipher Lab");
    expect(translate("pt-BR", "openInCipherLab")).toContain("Cipher Lab");
  });
});
