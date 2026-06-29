"use client";
import React, { useEffect, useState } from "react";
import "./style.scss";
import { files } from "@/app/data/filesystem";
import { useProgress } from "@/app/context/ProgressContext";

interface NotepadProps {
  fileId: string;
}

const Notepad = ({ fileId }: NotepadProps) => {
  const { markFileRead, setFlag, hasFlag } = useProgress();
  const file = files.find((f) => f.id === fileId);
  const [answer, setAnswer] = useState("");
  const [wrongAttempt, setWrongAttempt] = useState(false);

  useEffect(() => {
    if (file) markFileRead(file.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  if (!file) {
    return <div className="notepad">File not found.</div>;
  }

  const solved = file.unlocksFlag ? hasFlag(file.unlocksFlag) : false;

  const handleCheck = () => {
    const normalized = answer.trim().toLowerCase().replace(/\s+/g, "");
    if (normalized === file.answer) {
      if (file.unlocksFlag) setFlag(file.unlocksFlag);
      setWrongAttempt(false);
    } else {
      setWrongAttempt(true);
    }
  };

  return (
    <div className="notepad">
      <div className="notepad-textarea">
        <pre className="notepad-content">{file.content}</pre>
      </div>
      {file.kind === "cipher" && !solved && (
        <div className="notepad-answer">
          <input
            type="text"
            value={answer}
            placeholder="decoded word"
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
          />
          <button type="button" onClick={handleCheck}>
            Submit
          </button>
          {wrongAttempt && (
            <p className="notepad-feedback">That&apos;s not it.</p>
          )}
        </div>
      )}
      {file.kind === "cipher" && solved && (
        <p className="notepad-feedback notepad-feedback--solved">Decoded.</p>
      )}
    </div>
  );
};

export default Notepad;
