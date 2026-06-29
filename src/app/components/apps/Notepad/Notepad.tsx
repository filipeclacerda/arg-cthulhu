"use client";
import React, { useEffect, useState } from "react";
import "./style.scss";
import { files } from "@/app/data/filesystem";
import { useProgress } from "@/app/context/ProgressContext";
import { resolveTokens } from "@/app/utils/narrative";

interface NotepadProps {
  fileId: string;
}

const Notepad = ({ fileId }: NotepadProps) => {
  const { markFileRead, setFlag, hasFlag, raiseCorruption, playerName, absenceMs } =
    useProgress();
  const file = files.find((f) => f.id === fileId);
  const [answer, setAnswer] = useState("");
  const [wrongAttempt, setWrongAttempt] = useState(false);
  // The untypeable cipher: each keystroke rewrites itself.
  const [untypeableGlitch, setUntypeableGlitch] = useState(false);

  useEffect(() => {
    if (!file) return;
    markFileRead(file.id);
    if (file.raisesCorruptionTo != null) raiseCorruption(file.raisesCorruptionTo);
    if (file.setsFlagOnOpen) setFlag(file.setsFlagOnOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  if (!file) {
    return <div className="notepad">File not found.</div>;
  }

  const solved = file.unlocksFlag ? hasFlag(file.unlocksFlag) : false;

  const resolvedContent = resolveTokens(file.content, {
    playerName,
    absenceHours: absenceMs > 0 ? absenceMs / (1000 * 60 * 60) : undefined,
  });

  const handleCheck = () => {
    if (file.untypeable) return; // the name cannot be submitted
    const normalized = answer.trim().toLowerCase().replace(/\s+/g, "");
    if (normalized === file.answer) {
      if (file.unlocksFlag) setFlag(file.unlocksFlag);
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

  return (
    <div className="notepad">
      <div className="notepad-menubar">
        <span>File</span>
        <span>Edit</span>
        <span>Search</span>
        <span>Help</span>
      </div>
      <div className="notepad-meta">
        <span>{file.name}</span>
        {file.raisesCorruptionTo != null && <strong>unstable text</strong>}
        {file.unlocksFlag && solved && <strong>decoded</strong>}
      </div>
      <div className="notepad-textarea">
        <pre className="notepad-content">{resolvedContent}</pre>
      </div>
      {file.kind === "cipher" && !solved && (
        <div className="notepad-answer">
          <input
            type="text"
            value={answer}
            placeholder={isUntypeable ? "…" : "decoded word"}
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
              Submit
            </button>
          )}
          {wrongAttempt && (
            <p className="notepad-feedback">That&apos;s not it.</p>
          )}
          {isUntypeable && (
            <p className="notepad-feedback">
              The name will not be written down.
            </p>
          )}
        </div>
      )}
      {file.kind === "cipher" && solved && (
        <p className="notepad-feedback notepad-feedback--solved">Decoded.</p>
      )}
      <div className="notepad-statusbar">
        <span>
          {file.kind === "cipher"
            ? solved
              ? "Cipher accepted"
              : isUntypeable
              ? "Input buffer unstable"
              : "Awaiting decoded word"
            : "Plain text"}
        </span>
        <span>
          {file.raisesCorruptionTo != null
            ? resolveTokens("Modified: {TOMORROW}", {
                playerName,
                absenceHours:
                  absenceMs > 0 ? absenceMs / (1000 * 60 * 60) : undefined,
              })
            : "Ready"}
        </span>
      </div>
    </div>
  );
};

export default Notepad;
