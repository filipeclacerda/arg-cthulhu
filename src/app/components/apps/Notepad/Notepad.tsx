"use client";
import React, { useEffect, useState } from "react";
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
    state,
  } = useProgress();
  const { openWindow } = useWindowManager();
  const { t } = useI18n();
  const file = files.find((f) => f.id === fileId);
  const [answer, setAnswer] = useState("");
  const [wrongAttempt, setWrongAttempt] = useState(false);
  // The untypeable cipher: each keystroke rewrites itself.
  const [untypeableGlitch, setUntypeableGlitch] = useState(false);

  useEffect(() => {
    if (!file) return;
    markFileRead(file.id);
    if (file.evidenceId) discoverEvidence(file.evidenceId, file.id);
    if (file.id === "the_name" && isPuzzleSolved("lineage")) {
      recordSequenceAction("file:the_name");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  if (!file) {
    return <div className="notepad">File not found.</div>;
  }

  const solved = file.unlocksFlag ? hasFlag(file.unlocksFlag) : false;

  const baseContent = resolveTokens(
    localizedFileContent(file.id, file.content, state.locale),
    {
    playerName,
    absenceHours: absenceMs > 0 ? absenceMs / (1000 * 60 * 60) : undefined,
    }
  );
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
    setTimeout(() => {
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
