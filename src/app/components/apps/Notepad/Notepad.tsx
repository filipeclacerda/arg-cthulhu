"use client";
import React, { useEffect, useRef, useState } from "react";
import "./style.scss";
import { files } from "@/app/data/filesystem";
import { useProgress } from "@/app/context/ProgressContext";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import { resolveTokens } from "@/app/utils/narrative";
import { puzzleHintsFor } from "@/app/game/puzzles";
import { localizedFileContent } from "@/app/data/localizedNarrative";
import ClueText from "@/app/components/ClueText/ClueText";
import { useI18n } from "@/app/i18n";

interface NotepadProps {
  fileId: string;
}

const Notepad = ({ fileId }: NotepadProps) => {
  const {
    markFileRead,
    hasFlag,
    playerName,
    absenceMs,
    discoverEvidence,
    recordSequenceAction,
    isPuzzleSolved,
    setFlag,
    state,
  } = useProgress();
  const { openWindow } = useWindowManager();
  const { t } = useI18n();
  const file = files.find((f) => f.id === fileId);
  const [wasReadBeforeOpen] = useState(() => state.readFileIds.includes(fileId));
  const [answer, setAnswer] = useState("");
  const [wrongAttempt, setWrongAttempt] = useState(false);
  const [directoryAttempt, setDirectoryAttempt] = useState<string | null>(null);
  // The untypeable cipher: each keystroke rewrites itself.
  const [untypeableGlitch, setUntypeableGlitch] = useState(false);
  const untypeableTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!file) return;
    markFileRead(file.id);
    if (file.setsFlagOnOpen) setFlag(file.setsFlagOnOpen);
    if (file.evidenceId) discoverEvidence(file.evidenceId, file.id);
    if (file.id === "the_name" && isPuzzleSolved("lineage")) {
      recordSequenceAction("file:the_name");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  useEffect(
    () => () => {
      if (untypeableTimer.current) clearTimeout(untypeableTimer.current);
    },
    []
  );

  if (!file) {
    return <div className="notepad">File not found.</div>;
  }

  const solved = file.unlocksFlag ? hasFlag(file.unlocksFlag) : false;

  let baseContent = resolveTokens(
    localizedFileContent(file.id, file.content, state.locale),
    {
    playerName,
    absenceHours: absenceMs > 0 ? absenceMs / (1000 * 60 * 60) : undefined,
    }
  );
  if (file.id === "observer_outbox") {
    const attachmentNames = state.readFileIds
      .filter((id) => id !== file.id)
      .slice(-3)
      .map((id) => files.find((candidate) => candidate.id === id)?.name ?? id);
    baseContent = baseContent.replace(
      "{RECENT_ATTACHMENTS}",
      attachmentNames.length > 0
        ? attachmentNames.map((name) => `- ${name}`).join("\n")
        : state.locale === "pt-BR"
          ? "- [nenhum arquivo local resolvido]"
          : "- [no local file resolved]"
    );
  }
  if (file.id === "status_query_sheet" && hasFlag("status_sheet_duplicated")) {
    // The printed sheet keeps the resolved line after the live swap on the
    // spool alert; rereads never show PRESENT again.
    baseContent = baseContent.replace("STATUS: PRESENT", "STATUS: DUPLICATED");
  }
  if (file.id === "miriam_draft" && wasReadBeforeOpen) {
    baseContent = baseContent
      .replace(/LINE 04:.*(?:\n|$)/, "LINE 04: [UNRECOVERABLE AFTER LAST READ]\n")
      .replace(/LINHA 04:.*(?:\n|$)/, "LINHA 04: [IRRECUPERÁVEL APÓS A ÚLTIMA LEITURA]\n");
  }
  const sequenceEcho =
    file.id === "access_log" && state.futureSequenceStep > 0
      ? `\n\n--- LIVE VERIFICATION ---\n${[
          "03:12  114VER~1.TIF /MIRROR ........ OBSERVED",
          "03:13  COUNTI~1.WAV /LEFT /REVERSE  OBSERVED",
          "03:14  THENAM~1.TXT /OPEN ........... OBSERVED",
        ]
          .slice(0, state.futureSequenceStep)
          .join("\n")}${
          state.futureSequenceFaults > 0
            ? `\nSEQUENCE REWRITTEN ${state.futureSequenceFaults} TIME(S)`
            : ""
        }`
      : file.id === "access_log" && state.futureSequenceFaults > 0
        ? `\n\n--- LIVE VERIFICATION ---\nSEQUENCE REWRITTEN ${state.futureSequenceFaults} TIME(S)\nWAITING FOR 03:12`
        : "";
  const hintPuzzle =
    file.id === "access_log"
      ? "future_log"
      : file.id === "index_help"
        ? "index_name"
        : null;
  const hintEcho =
    hintPuzzle && state.puzzles[hintPuzzle].hintsUnlocked > 0
      ? `\n\n[RECOVERED FRAGMENT]\n${
          puzzleHintsFor(state.locale, hintPuzzle)[
            state.puzzles[hintPuzzle].hintsUnlocked - 1
          ]
        }`
      : "";
  const resolvedContent = `${baseContent}${sequenceEcho}${hintEcho}`;

  const handleCheck = () => {
    if (file.untypeable) return; // the name cannot be submitted
    const normalized = answer.trim().toLowerCase().replace(/\s+/g, "");
    if (normalized === file.answer) {
      setWrongAttempt(false);
    } else {
      setWrongAttempt(true);
    }
  };

  const handleUntypeableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      setAnswer("");
      setUntypeableGlitch(false);
      return;
    }
    // Each character typed scrambles into a runic fragment — the alphabet
    // the player learned to trust refuses to spell this name.
    const glitchChars = ["ᚨ", "ᛒ", "ᛖ", "ᚱ", "ᛗ", "ᛁ", "ᛉ", "ᚾ", "ᛚ"];
    const scrambled = val
      .split("")
      .map(() => glitchChars[Math.floor(Math.random() * glitchChars.length)])
      .join("");
    setAnswer(scrambled);
    setUntypeableGlitch(true);
    // Erase it again after a beat — it won't hold.
    if (untypeableTimer.current) clearTimeout(untypeableTimer.current);
    untypeableTimer.current = setTimeout(() => {
      setAnswer("");
      setUntypeableGlitch(false);
    }, 400);
  };

  const isUntypeable = !!file.untypeable;
  const openProperties = () => {
    openWindow({
      id: `properties-${file.id}`,
      appType: "properties",
      title: `${file.name} Properties`,
      props: { fileId: file.id },
    });
  };

  const openInCipherLab = () => {
    if (!file) return;
    openWindow({
      id: "cipher-lab",
      appType: "cipher-lab",
      title: t("cipherLabLabel"),
      props: { initialCiphertext: resolvedContent },
    });
  };

  const isDirectoryComparison = file.id === "directory_comparison";
  const directorySolved = hasFlag("directory_gap_solved");
  const directoryRows = [
    { id: "accession", label: "\\ACCESSION", left: "DIR", right: "DIR" },
    { id: "correspondence", label: "\\CORRESPONDENCE", left: "DIR", right: "DIR" },
    { id: "temp", label: "\\TEMP\\~CACHE", left: "DIR", right: "DIR" },
    {
      id: "observer",
      label: `\\WINDOWS\\Profiles\\${playerName?.trim() || "NEXT USER"}`,
      left: "—",
      right: "—",
    },
  ];

  const inspectDirectoryEntry = (entryId: string) => {
    setDirectoryAttempt(entryId);
    if (entryId !== "observer") return;
    if (!directorySolved) {
      setFlag("directory_gap_solved");
      discoverEvidence("observer_directory", "observer_first_seen");
    }
    openWindow({
      id: "explorer-observer-cache",
      appType: "explorer",
      title: playerName?.trim() || "NEXT USER",
      props: { folderId: "observer-cache", windowClassName: "corrupted" },
    });
  };

  return (
    <div className="notepad">
      <div className="notepad-menubar">
        <span>{t("menuFile")}</span>
        <span>{t("menuEdit")}</span>
        <span>{t("menuSearch")}</span>
        <span>{t("help")}</span>
      </div>
      <div className="notepad-meta">
        <span>{file.name}</span>
        {file.raisesCorruptionTo != null && <strong>unstable text</strong>}
        {file.unlocksFlag && solved && <strong>decoded</strong>}
        {file.name.toLowerCase().endsWith(".enc") && (
          <button
            type="button"
            className="notepad-open-cipher"
            onClick={openInCipherLab}
          >
            {t("openInCipherLab")}
          </button>
        )}
        <button
          type="button"
          className="notepad-properties"
          onClick={openProperties}
        >
          {t("propertiesLabel")}
        </button>
      </div>
      <div className="notepad-textarea">
        <ClueText
          as="pre"
          className="notepad-content"
          text={resolvedContent}
          clues={file.clues}
        />
        {isDirectoryComparison && (
          <section className="directory-compare" aria-label="Directory comparison">
            <div className="directory-compare__header" aria-hidden="true">
              <span>{state.locale === "pt-BR" ? "ENTRADA" : "ENTRY"}</span>
              <span>M.BISHOP / 1998</span>
              <span>S.BISHOP / 2026</span>
            </div>
            {directoryRows.map((row) => (
              <button
                key={row.id}
                type="button"
                className={directoryAttempt === row.id ? "selected" : ""}
                onClick={() => inspectDirectoryEntry(row.id)}
              >
                <span>{row.label}</span>
                <span>{row.left}</span>
                <span>{row.right}</span>
              </button>
            ))}
            {directoryAttempt && directoryAttempt !== "observer" && (
              <p className="directory-compare__feedback">
                {state.locale === "pt-BR"
                  ? "PROPRIEDADE DE ORIGEM CONFIRMADA. A entrada pertence às duas imagens."
                  : "SOURCE OWNERSHIP CONFIRMED. The entry belongs to both images."}
              </p>
            )}
            {directorySolved && (
              <p className="directory-compare__feedback directory-compare__feedback--solved">
                {state.locale === "pt-BR"
                  ? "SEM PROPRIETÁRIO DE ORIGEM. DIRETÓRIO MATERIALIZADO EM C:\\USERS."
                  : "NO SOURCE OWNER. DIRECTORY MATERIALIZED UNDER C:\\USERS."}
              </p>
            )}
          </section>
        )}
      </div>
      {file.kind === "cipher" && !solved && (
        <div className="notepad-answer">
          <input
            type="text"
            value={answer}
            placeholder={isUntypeable ? "…" : t("decodedWordPlaceholder")}
            onChange={
              isUntypeable
                ? handleUntypeableChange
                : (e) => setAnswer(e.target.value)
            }
            onKeyDown={(e) => !isUntypeable && e.key === "Enter" && handleCheck()}
            className={untypeableGlitch ? "input-glitch" : undefined}
            style={isUntypeable ? { fontFamily: "monospace" } : undefined}
          />
          {!isUntypeable && (
            <button type="button" onClick={handleCheck}>
              {t("submitLabel")}
            </button>
          )}
          {wrongAttempt && (
            <p className="notepad-feedback">{t("notThatAnswer")}</p>
          )}
          {isUntypeable && (
            <p className="notepad-feedback">
              {t("nameWontWrite")}
            </p>
          )}
        </div>
      )}
      {file.kind === "cipher" && solved && (
        <p className="notepad-feedback notepad-feedback--solved">{t("decodedLabel")}</p>
      )}
      <div className="notepad-statusbar">
        <span>
          {file.kind === "cipher"
            ? solved
              ? t("cipherAccepted")
              : isUntypeable
              ? t("inputBufferUnstable")
              : t("awaitingDecodedWord")
            : t("plainText")}
        </span>
        <span>
          {file.raisesCorruptionTo != null
            ? resolveTokens("Modified: {TOMORROW}", {
                playerName,
                absenceHours:
                  absenceMs > 0 ? absenceMs / (1000 * 60 * 60) : undefined,
              })
            : t("readyLabel")}
        </span>
      </div>
    </div>
  );
};

export default Notepad;
