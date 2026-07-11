import { describe, expect, it } from "vitest";
import { localizedEndingClosureContent, localizedFileContent } from "./localizedNarrative";
import { files } from "./filesystem";
import { isUnlocked } from "../game/unlock";

describe("post-ending archive artifacts", () => {
  const endingFlags = {
    ending_restore: true,
    ending_shutdown: false,
    ending_seal: false,
    ending_leave_blank: false,
    ending_archive_self: false,
    ending_restore_incomplete: true,
  };

  it("exposes the closure record for every recorded ending", () => {
    const closure = files.find((file) => file.id === "case_closure_log");
    expect(closure).toBeDefined();
    expect(isUnlocked(closure!.unlock, { flags: endingFlags })).toBe(true);
  });

  it("keeps the incomplete restore checkpoint distinct from full restoration", () => {
    const checkpoint = files.find(
      (file) => file.id === "restore_incomplete_checkpoint"
    );
    expect(checkpoint).toBeDefined();
    expect(
      isUnlocked(checkpoint!.unlock, { flags: { ending_restore_incomplete: true } })
    ).toBe(true);
    expect(
      isUnlocked(checkpoint!.unlock, { flags: { ending_restore: true } })
    ).toBe(false);
  });

  it("records LEAVE BLANK as closed in both locales", () => {
    const blank = files.find((file) => file.id === "blank_space_after");
    expect(blank?.content).toContain("STATUS: CLOSED");
    expect(localizedFileContent(blank!.id, blank!.content, "pt-BR")).toContain(
      "STATUS: ENCERRADO"
    );
    expect(blank?.content).not.toContain("\nRECHECK SCHEDULED:");
  });

  it("writes a final-specific, read-only closure record", () => {
    expect(localizedEndingClosureContent("restore", true, "en")).toContain(
      "RESTORE INCOMPLETE"
    );
    expect(localizedEndingClosureContent("shutdown", false, "pt-BR")).toContain(
      "RELAY DESLIGADO"
    );
    expect(localizedEndingClosureContent("archive_self", false, "en")).toContain(
      "OBSERVER ARCHIVED"
    );
  });
});
