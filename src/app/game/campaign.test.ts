import { describe, expect, it } from "vitest";
import { chats } from "../data/chats";
import { emails } from "../data/emails";
import { EVIDENCE_CARDS } from "../data/evidenceBoard";
import { files } from "../data/filesystem";
import {
  localizedBoardCard,
  localizedChatMessage,
  localizedBrowserText,
  localizedEmail,
  localizedFileContent,
} from "../data/localizedNarrative";
import { translate } from "../i18n";
import {
  CASE_STATEMENTS,
  HYPOTHESES,
  TOKEN_SOURCE_EVIDENCE,
  TOKENS,
  hypothesisVerdict,
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

  it("keeps optional lore images discoverable and filed to the casefile", () => {
    const kitchenPhoto = files.find(
      (file) => file.id === "photo_sarah_em_kitchen"
    );
    const fridgeNote = files.find((file) => file.id === "fridge_postcard_note");
    const transferBox = files.find(
      (file) => file.id === "bishop_transfer_box_photo"
    );
    const transferInventory = files.find(
      (file) => file.id === "bishop_transfer_inventory"
    );
    const relayDisk = files.find((file) => file.id === "tom_relay_disk_photo");
    const uploadNotes = files.find((file) => file.id === "tom_upload_notes");

    expect(kitchenPhoto).toMatchObject({
      folderId: "pictures",
      kind: "image",
      evidenceId: "photo_sarah_em_kitchen_2025",
    });
    expect(fridgeNote?.unlock).toEqual({
      type: "evidenceOpened",
      evidenceId: "photo_sarah_em_kitchen_2025",
    });
    expect(transferBox).toMatchObject({
      folderId: "lineage-dossiers",
      kind: "image",
      evidenceId: "bishop_transfer_box_photo",
    });
    expect(transferInventory?.content).toContain("loose label is dated");
    expect(relayDisk).toMatchObject({
      folderId: "downloads",
      kind: "image",
      evidenceId: "tom_relay_disk_photo",
    });
    expect(uploadNotes?.unlock).toEqual({
      type: "evidenceOpened",
      evidenceId: "tom_relay_disk_photo",
    });
    for (const evidenceId of [
      "photo_sarah_em_kitchen_2025",
      "fridge_postcard_note",
      "bishop_transfer_box_photo",
      "bishop_transfer_inventory",
      "tom_relay_disk_photo",
      "tom_upload_notes",
    ]) {
      expect(EVIDENCE_CARDS[evidenceId]).toBeDefined();
    }
    expect(
      localizedFileContent(
        "bishop_transfer_inventory",
        transferInventory?.content ?? "",
        "pt-BR"
      )
    ).toContain("MESA AKELEY FECHADA");
    expect(
      localizedFileContent("tom_upload_notes", uploadNotes?.content ?? "", "pt-BR")
    ).toContain("CHECKLIST DE UPLOAD");
  });

  it("files the new emotional and relay artifacts in both locales", () => {
    const expected = [
      "calendar_0316",
      "voicemail_to_em",
      "reasons_to_stop",
      "read_receipts",
      "hash_manifest",
      "blank_space",
      "archived_observer",
      "unsent_to_dad",
      "desk_inventory",
      "printer_alignment",
      "browser_history_0316",
      "em_draft_reply",
      "field_04",
      "do_not_catalogue",
    ];

    for (const evidenceId of expected) {
      expect(EVIDENCE_CARDS[evidenceId]).toBeDefined();
    }

    expect(files.find((file) => file.id === "calendar_0316")?.content).toContain(
      "leave archive"
    );
    expect(
      localizedFileContent("calendar_0316", "", "pt-BR")
    ).toContain("sair do arquivo");
    expect(files.find((file) => file.id === "read_receipts")?.content).toContain(
      "Sender choice not found"
    );
    expect(
      localizedFileContent("read_receipts", "", "pt-BR")
    ).toContain("Escolha do remetente não encontrada");
    expect(files.find((file) => file.id === "hash_manifest")?.unlock).toEqual({
      type: "evidenceOpened",
      evidenceId: "tom_upload_notes",
    });
    expect(
      localizedFileContent("archived_observer_after", "", "pt-BR")
    ).toContain("OBSERVADOR ARQUIVADO");
    expect(
      localizedFileContent("desk_inventory", "", "pt-BR")
    ).toContain("INVENTÁRIO TEMPORÁRIO");
    expect(
      localizedFileContent("do_not_catalogue", "", "pt-BR")
    ).toContain("ARQUIVO SEM CORPO");
  });

  it("plants Miriam's second-voice identity only through fields and metadata", () => {
    const marginMatch = files.find(
      (file) => file.id === "miriam_margin_match"
    );
    const miriamDraft = files.find((file) => file.id === "miriam_draft");
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
    expect(miriamDraft?.content).toContain("PROSE CHANNEL REFUSED");
    expect(miriamDraft?.content).not.toContain("Robert —");
    expect(miriamDraft?.content).not.toMatch(/M\. BISHOP:\s+[A-Za-z]/);
    expect(EVIDENCE_CARDS.miriam_margin_match).toBeDefined();
    expect(transcript?.content).toContain(
      "Closest match withheld by administrative order"
    );
    expect(todo?.content).toContain("did Mom count UP or DOWN?");
    expect(shutdownEmail?.body).toContain("I'm sorry I have to try again.");
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

  it("keeps the observer hypothesis inconclusive instead of flatly refuted", () => {
    expect(hypothesisVerdict("sarah_chose_observer")).toBe("inconclusive");
    expect(hypothesisVerdict("tom_forged_image")).toBe("refuted");
    expect(hypothesisVerdict("sarah_fled")).toBe("refuted");
    expect(hypothesisVerdict("innsmouth_theft")).toBe("refuted");
    expect(HYPOTHESES.sarah_chose_observer.truth.en).not.toMatch(/^Refuted/);
    expect(HYPOTHESES.sarah_chose_observer.truth["pt-BR"]).not.toMatch(
      /^Refutada/
    );
    expect(HYPOTHESES.sarah_chose_observer.truth.en).toContain(
      "Inconclusive"
    );
    expect(HYPOTHESES.sarah_chose_observer.truth["pt-BR"]).toContain(
      "Inconclusiva"
    );
  });

  it("plants Sarah's fragmentation strategy as a late, dirty operational note", () => {
    const splitRecord = files.find((file) => file.id === "split_record");

    expect(splitRecord).toMatchObject({
      folderId: "chapter-seven",
      evidenceId: "split_record",
      unlock: { type: "puzzleSolved", puzzleId: "lineage" },
    });
    expect(splitRecord?.content).toContain("SPLITR~1.TXT");
    expect(splitRecord?.content).toContain("recipient field: left blank");
    expect(splitRecord?.content).not.toContain("find me");
    expect(splitRecord?.content).not.toContain("replace me");
    expect(EVIDENCE_CARDS.split_record).toBeDefined();
    expect(
      localizedFileContent("split_record", splitRecord?.content ?? "", "pt-BR")
    ).toContain("SPLITR~1.TXT");
    expect(
      localizedBoardCard(
        "split_record",
        { title: "split_record.txt", summary: "" },
        "pt-BR"
      ).summary
    ).toContain("destinatário");
  });

  it("supports three optional counter-index investigations without save schema changes", () => {
    const directory = files.find((file) => file.id === "directory_comparison");
    const pastPhoto = files.find((file) => file.id === "office_1998_overlay");
    const futurePhoto = files.find((file) => file.id === "office_tomorrow_overlay");
    const silentCall = files.find((file) => file.id === "silent_call");
    const counterIndex = files.find((file) => file.id === "counter_index_note");

    expect(directory?.unlock).toEqual({ type: "puzzleSolved", puzzleId: "margin_cipher" });
    expect(pastPhoto?.content).toBe("/photos/office_1998_overlay.webp");
    expect(futurePhoto?.content).toBe("/photos/office_tomorrow_overlay.webp");
    expect(silentCall).toMatchObject({
      kind: "audio",
      unlock: { type: "puzzleSolved", puzzleId: "lineage" },
    });
    expect(counterIndex?.unlock).toEqual({
      type: "flag",
      flag: "silent_call_solved",
    });
    [
      "directory_comparison",
      "observer_directory",
      "office_1998_overlay",
      "office_tomorrow_overlay",
      "three_times_alignment",
      "silent_call",
      "counter_index_note",
    ].forEach((id) => expect(EVIDENCE_CARDS[id]).toBeDefined());
  });

  it("keeps Tom uncertain about whether Sarah or the copy filled the blank", () => {
    const manifest = files.find((file) => file.id === "hash_manifest");
    expect(manifest?.content).toContain("I cannot prove which happened first");
    expect(manifest?.content).not.toContain("Sarah didn't choose them");
    expect(
      localizedFileContent("hash_manifest", manifest?.content ?? "", "pt-BR")
    ).toContain("Não consigo provar o que aconteceu primeiro");
  });
});
