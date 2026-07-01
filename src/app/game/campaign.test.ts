import { describe, expect, it } from "vitest";
import { chats } from "../data/chats";
import { emails } from "../data/emails";
import { EVIDENCE_CARDS } from "../data/evidenceBoard";
import { files } from "../data/filesystem";
import {
  localizedChatMessage,
  localizedBrowserText,
  localizedEmail,
  localizedFileContent,
} from "../data/localizedNarrative";
import { translate } from "../i18n";
import {
  CASE_STATEMENTS,
  TOKEN_SOURCE_EVIDENCE,
  TOKENS,
  validateCampaignGraph,
  validateStatement,
} from "./campaign";

describe("campaign graph", () => {
  it("keeps every mandatory finding reconstructable and corroborated", () => {
    expect(validateCampaignGraph()).toEqual([]);
    expect(CASE_STATEMENTS).toHaveLength(7);
  });

  it("validates each blank independently from its evidence", () => {
    expect(
      validateStatement(
        "locked_room_source",
        {
          place: "place-under-workstation",
          object: "object-pipe",
        },
        ["incident_report", "maintenance_record"]
      )
    ).toEqual({
      slots: { place: true, object: true },
      allSlotsCorrect: true,
      evidence: "ok",
      accepted: true,
    });
  });

  it("returns partial correctness for Golden-Idol-style lock-in", () => {
    const result = validateStatement(
      "volume_return",
      {
        cause: "cause-deliberately-sent",
        family: "family-whateley",
      },
      ["miriam_1998", "lot_114_order"]
    );
    expect(result.slots).toEqual({ cause: true, family: false });
    expect(result.accepted).toBe(false);
  });

  it("has an authored click-to-collect marker for every correct token", () => {
    const authored = [
      ...files.flatMap((file) =>
        (file.clues ?? []).map((clue) => ({
          tokenId: clue.tokenId,
          evidenceId: file.evidenceId,
        }))
      ),
      ...emails.flatMap((email) =>
        (email.clues ?? []).map((clue) => ({
          tokenId: clue.tokenId,
          evidenceId: email.evidenceId,
        }))
      ),
      ...chats.flatMap((chat) =>
        chat.messages.flatMap((message) =>
          (message.clues ?? []).map((clue) => ({
            tokenId: clue.tokenId,
            evidenceId: chat.evidenceId,
          }))
        )
      ),
    ];

    for (const token of TOKENS) {
      const expectedSource =
        token.sourceEvidenceId ?? TOKEN_SOURCE_EVIDENCE[token.id];
      expect(authored).toContainEqual({
        tokenId: token.id,
        evidenceId: expectedSource,
      });
    }
  });

  it("keeps every authored clue snippet present in both localized bodies", () => {
    for (const file of files) {
      for (const clue of file.clues ?? []) {
        expect(file.content).toContain(clue.snippet.en);
        expect(localizedFileContent(file.id, file.content, "pt-BR")).toContain(
          clue.snippet["pt-BR"]
        );
      }
    }
    for (const email of emails) {
      const translated = localizedEmail(
        email.id,
        { subject: email.subject, body: email.body },
        "pt-BR"
      );
      for (const clue of email.clues ?? []) {
        expect(email.body).toContain(clue.snippet.en);
        expect(translated.body).toContain(clue.snippet["pt-BR"]);
      }
    }
    for (const chat of chats) {
      for (const message of chat.messages) {
        for (const clue of message.clues ?? []) {
          expect(message.body).toContain(clue.snippet.en);
          expect(
            localizedChatMessage(message.id, message.body, "pt-BR")
          ).toContain(clue.snippet["pt-BR"]);
        }
      }
    }
  });

  it("keeps the Bishop welfare-check chronology and audio gate coherent", () => {
    const incident = files.find((file) => file.id === "police_report");
    const transcript = files.find((file) => file.id === "counting");
    const warning = emails.find((email) => email.id === "email-3");

    expect(incident?.content).toContain("INCIDENT 2026-0318-2");
    expect(incident?.content).toContain(
      "SUBJECT LAST CONFIRMED ON PREMISES: 2026-03-16"
    );
    expect(transcript?.unlock).toEqual({
      type: "puzzleSolved",
      puzzleId: "margin_cipher",
    });
    expect(warning).toMatchObject({
      date: "2026-03-15 03:12",
      messageId: "<SB-?????-0312-??@miskatonic-research.org>",
    });
    expect(
      localizedBrowserText("forum_7411_meta", "fallback", "pt-BR")
    ).toContain("Thread #7411");
  });

  it("plants Miriam's second-voice identity only through fields and metadata", () => {
    const marginMatch = files.find(
      (file) => file.id === "miriam_margin_match"
    );
    const transcript = files.find((file) => file.id === "counting");
    const todo = files.find((file) => file.id === "todo");
    const shutdownEmail = emails.find(
      (email) => email.id === "email-finale-shutdown"
    );

    expect(marginMatch).toMatchObject({
      folderId: "lineage-dossiers",
      evidenceId: "miriam_margin_match",
      unlock: { type: "flag", flag: "act1_reconstruction_complete" },
    });
    expect(marginMatch?.content).toContain("ATTRIBUTED HAND: M. BISHOP");
    expect(marginMatch?.content).not.toMatch(/M\. BISHOP:\s+[A-Za-z]/);
    expect(EVIDENCE_CARDS.miriam_margin_match).toBeDefined();
    expect(transcript?.content).toContain(
      "Closest match withheld by administrative order"
    );
    expect(todo?.content).toContain("did Mom count UP or DOWN?");
    expect(shutdownEmail?.body).toContain(
      "The counting paused when you chose"
    );
    expect(
      localizedFileContent(
        marginMatch?.id ?? "",
        marginMatch?.content ?? "",
        "pt-BR"
      )
    ).toContain("MÃO ATRIBUÍDA: M. BISHOP");
    expect(translate("en", "voiceTwoMiriamMatch")).toContain("M. BISHOP");
    expect(translate("pt-BR", "sysMiriamSession")).toContain("10.227 dias");
    expect(translate("en", "finaleRestoreTerminal")).toContain(
      "SECOND SESSION RETAINED — M.B."
    );
    expect(translate("pt-BR", "finaleSealCaption")).toContain(
      "mudou de direção"
    );
  });
});
