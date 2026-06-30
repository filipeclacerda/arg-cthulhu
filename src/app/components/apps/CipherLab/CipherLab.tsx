"use client";

import React, { useMemo, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import "../ArgTools/style.scss";

type Algorithm = "caesar" | "substitution" | "vigenere";
const CIPHERTEXT = "XMWBC TMVEM LDQDV ZSQRW LZEXQ DVVCA GVKVA YQAEW TPMGJ";
const EXPECTED = "LEFTCHANNELREVERSEFOURELEVENCOUNTNAMESNOTDAYS";

const decodeVigenere = (text: string, key: string): string => {
  const normalizedKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  if (!normalizedKey) return text;
  let keyIndex = 0;
  return text
    .toUpperCase()
    .split("")
    .map((char) => {
      if (!/[A-Z]/.test(char)) return char;
      const decoded =
        (char.charCodeAt(0) - 65 -
          (normalizedKey.charCodeAt(keyIndex++ % normalizedKey.length) - 65) +
          26) %
        26;
      return String.fromCharCode(65 + decoded);
    })
    .join("");
};

const CipherLab = () => {
  const { hasEvidence, solvePuzzle, attemptPuzzle } = useProgress();
  const [algorithm, setAlgorithm] = useState<Algorithm>("caesar");
  const [key, setKey] = useState("");
  const [ciphertext, setCiphertext] = useState(
    hasEvidence("margin_ciphertext") ? CIPHERTEXT : ""
  );
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const canRecover = useMemo(
    () => hasEvidence("margin_ciphertext") || ciphertext.trim().length > 0,
    [ciphertext, hasEvidence]
  );

  const decode = () => {
    attemptPuzzle("margin_cipher");
    setError("");
    let result = ciphertext;
    if (algorithm === "vigenere") result = decodeVigenere(ciphertext, key);
    if (algorithm === "caesar") {
      result = ciphertext.replace(/[A-Z]/g, (letter) =>
        String.fromCharCode(65 + ((letter.charCodeAt(0) - 64) % 26))
      );
    }
    setOutput(result);
    const normalized = result.replace(/[^A-Z]/gi, "").toUpperCase();
    if (
      algorithm === "vigenere" &&
      key.trim().toUpperCase() === "MIRIAM" &&
      normalized === EXPECTED
    ) {
      solvePuzzle("margin_cipher");
    } else {
      setError("The output has no stable word boundaries.");
    }
  };

  return (
    <div className="arg-tool">
      <div className="arg-tool__menubar">
        <span>File</span><span>Tools</span><span>Frequency</span><span>Help</span>
      </div>
      <div className="arg-tool__toolbar">
        <label>Method</label>
        <select value={algorithm} onChange={(event) => setAlgorithm(event.target.value as Algorithm)}>
          <option value="caesar">Caesar shift</option>
          <option value="substitution">Monoalphabetic substitution</option>
          <option value="vigenere">Vigenere / moving alphabet</option>
        </select>
        <label>Key</label>
        <input value={key} onChange={(event) => setKey(event.target.value)} />
        <button className="button" disabled={!canRecover} onClick={decode}>Decode</button>
      </div>
      <div className="arg-tool__content">
        <div className="arg-tool__split">
          <section>
            <p className="arg-tool__kicker">INPUT BUFFER</p>
            <textarea className="arg-tool__textarea" value={ciphertext} onChange={(event) => setCiphertext(event.target.value)} />
          </section>
          <section>
            <p className="arg-tool__kicker">OUTPUT BUFFER</p>
            <textarea className="arg-tool__textarea" readOnly value={output} />
            {error && <p className="arg-tool__result arg-tool__warning">{error}</p>}
          </section>
        </div>
      </div>
      <div className="arg-tool__status">
        <span>No automatic method detection</span>
        <span>{hasEvidence("margin_ciphertext") ? "margin buffer found" : "manual input"}</span>
      </div>
    </div>
  );
};

export default CipherLab;

