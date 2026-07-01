"use client";

import posthog from "posthog-js";
import React, { useMemo, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import "../ArgTools/style.scss";
import { puzzleHintsFor } from "@/app/game/puzzles";
import { useI18n } from "@/app/i18n";

type Algorithm = "caesar" | "substitution" | "vigenere";
const CIPHERTEXT = {
  en: "XMWBC TMVEM LDQDV ZSQRW LZEXQ DVVCA GVKVA YQAEW TPMGJ",
  "pt-BR": "OIEIL QEYLM RPAZV DEDEW HCAFD WFVZQ OWEBE ZAUVA NMALZ IS",
};
const EXPECTED = {
  en: "LEFTCHANNELREVERSEFOURELEVENCOUNTNAMESNOTDAYS",
  "pt-BR": "CANALESQUERDOREVERSOQUATROONZECONTENOMESNAODIAS",
};
const RECOVERED_MESSAGE = {
  en: "LEFT CHANNEL / REVERSE / 4:11 / COUNT NAMES, NOT DAYS",
  "pt-BR": "CANAL ESQUERDO / REVERSO / 4:11 / CONTE NOMES, NÃO DIAS",
};

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
  const {
    hasEvidence,
    solvePuzzle,
    attemptPuzzle,
    recordNearMiss,
    state,
  } = useProgress();
  const { t } = useI18n();
  const [algorithm, setAlgorithm] = useState<Algorithm>("caesar");
  const [key, setKey] = useState("");
  const [ciphertext, setCiphertext] = useState(
    hasEvidence("margin_ciphertext") ? CIPHERTEXT[state.locale] : ""
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
    const normalized = result.replace(/[^A-Z]/gi, "").toUpperCase();
    const expectedLocale =
      normalized === EXPECTED["pt-BR"] ? "pt-BR" : "en";
    const solved =
      algorithm === "vigenere" &&
      key.trim().toUpperCase() === "MIRIAM" &&
      Object.values(EXPECTED).includes(
        normalized as (typeof EXPECTED)[keyof typeof EXPECTED]
      );

    if (solved) {
      setOutput(RECOVERED_MESSAGE[expectedLocale]);
      solvePuzzle("margin_cipher");
      posthog.capture("cipher_decrypted", {
        algorithm,
        attempts: state.puzzles.margin_cipher.attempts + 1,
        hints_used: state.puzzles.margin_cipher.hintsUnlocked,
      });
    } else {
      setOutput(result);
      if (algorithm === "vigenere" && key.trim().toUpperCase() !== "MIRIAM") {
        recordNearMiss("margin_cipher", "cipher_key");
        setError(
          state.locale === "pt-BR"
            ? "O alfabeto móvel parece correto, mas a chave não pertence a este registro."
            : "The moving alphabet appears correct, but the key does not belong to this record."
        );
      } else if (
        algorithm !== "vigenere" &&
        key.trim().toUpperCase() === "MIRIAM"
      ) {
        recordNearMiss("margin_cipher", "cipher_method");
        setError(
          state.locale === "pt-BR"
            ? "A chave corresponde a uma pessoa, mas este método não move o alfabeto."
            : "The key belongs to a person, but this method does not move the alphabet."
        );
      } else {
        setError(
          state.locale === "pt-BR"
            ? "A saída não possui limites de palavras estáveis."
            : "The output has no stable word boundaries."
        );
      }
    }
  };

  return (
    <div className="arg-tool">
      <div className="arg-tool__menubar">
        <span>{t("menuFile")}</span><span>{t("menuTools")}</span><span>{t("menuFrequency")}</span><span>{t("help")}</span>
      </div>
      <div className="arg-tool__toolbar">
        <label>{t("methodLabel")}</label>
        <select value={algorithm} onChange={(event) => setAlgorithm(event.target.value as Algorithm)}>
          <option value="caesar">Caesar shift</option>
          <option value="substitution">Monoalphabetic substitution</option>
          <option value="vigenere">Vigenere / moving alphabet</option>
        </select>
        <label>{t("keyLabel")}</label>
        <input value={key} onChange={(event) => setKey(event.target.value)} />
        <button className="button" disabled={!canRecover} onClick={decode}>{t("decodeLabel")}</button>
      </div>
      <div className="arg-tool__content">
        {state.puzzles.margin_cipher.hintsUnlocked > 0 && (
          <div className="arg-tool__result">
            <strong>RECOVERED WORKSHEET MARGIN</strong>
            <p>
              {
                puzzleHintsFor(state.locale, "margin_cipher")[
                  state.puzzles.margin_cipher.hintsUnlocked - 1
                ]
              }
            </p>
          </div>
        )}
        <div className="arg-tool__split">
          <section>
            <p className="arg-tool__kicker">{t("inputBufferLabel")}</p>
            <textarea className="arg-tool__textarea" value={ciphertext} onChange={(event) => setCiphertext(event.target.value)} />
          </section>
          <section>
            <p className="arg-tool__kicker">{t("outputBufferLabel")}</p>
            <textarea className="arg-tool__textarea" readOnly value={output} />
            {error && <p className="arg-tool__result arg-tool__warning">{error}</p>}
          </section>
        </div>
      </div>
      <div className="arg-tool__status">
        <span>{t("noMethodDetection")}</span>
        <span>{hasEvidence("margin_ciphertext") ? t("marginBufferFound") : t("manualInputLabel")}</span>
      </div>
    </div>
  );
};

export default CipherLab;
