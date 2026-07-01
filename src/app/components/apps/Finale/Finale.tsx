"use client";
import React, { useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { useSound } from "@/app/context/SoundContext";
import { resolveTokens, formatGameDate, tomorrow } from "@/app/utils/narrative";
import { useI18n } from "@/app/i18n";
import "./style.scss";

type FinaleState = "choice" | "restore" | "shutdown" | "seal";

const Finale = () => {
  const { chooseEnding, playerName, hasFlag, state } = useProgress();
  const { play } = useSound();
  const { t, locale } = useI18n();
  const [screen, setScreen] = useState<FinaleState>("choice");

  const ctx = { playerName };
  const tomorrowStr = formatGameDate(tomorrow());

  const handleRestore = () => {
    chooseEnding("restore");
    play("chime");
    setScreen("restore");
  };

  const handleShutdown = () => {
    chooseEnding("shutdown");
    play("glitch");
    setScreen("shutdown");
  };

  const handleSeal = () => {
    chooseEnding("seal");
    play("glitch");
    setScreen("seal");
  };

  if (screen === "restore") {
    return (
      <div className="finale finale--restore">
        <div className="finale-terminal">
          <pre>{resolveTokens(t("finaleRestoreTerminal"), ctx)}</pre>
        </div>
        <p className="finale-caption">
          {t("finaleRestoreCaption")} {tomorrowStr}.
        </p>
      </div>
    );
  }

  if (screen === "shutdown") {
    return (
      <div className="finale finale--shutdown">
        <div className="finale-terminal">
          <pre>{t("finaleShutdownTerminal")}</pre>
        </div>
        <p className="finale-caption">
          {t("finaleShutdownCaption")}
        </p>
      </div>
    );
  }

  if (screen === "seal") {
    return (
      <div className="finale finale--seal">
        <div className="finale-terminal">
          <pre>{locale === "pt-BR"
            ? `INDEX /SEAL RELAY-07 /WITNESS ARCHIVE

FONTE ............ NÃO RESOLVIDA
ARQUIVO .......... SB-0316
TESTEMUNHA ....... SB-0316

RELAY 07 NÃO POSSUI MAIS UM CAMPO VAZIO.
RELAY 07 NÃO POSSUI MAIS UM CAMPO EXTERNO.

CHECKSUM: 7A:11:07
CHECKSUM: 7A:11:08

NENHUMA OPERAÇÃO DE ESCRITA FOI REGISTRADA.`
            : `INDEX /SEAL RELAY-07 /WITNESS ARCHIVE

SOURCE ........... UNRESOLVED
ARCHIVE .......... SB-0316
WITNESS .......... SB-0316

RELAY 07 NO LONGER HAS AN EMPTY FIELD.
RELAY 07 NO LONGER HAS AN OUTSIDE FIELD.

CHECKSUM: 7A:11:07
CHECKSUM: 7A:11:08

NO WRITE OPERATION WAS RECORDED.`}</pre>
        </div>
        <p className="finale-caption">
          {t("finaleSealCaption")}
        </p>
      </div>
    );
  }

  // Default: the choice
  return (
    <div className="finale">
      <div className="finale-terminal">
        <pre>{resolveTokens(t("finaleChoiceTerminal"), ctx)}</pre>
      </div>
      <div className="finale-actions">
        <button
          className="button btn-lg"
          type="button"
          onClick={handleRestore}
        >
          {t("restoreSarahLabel")}
        </button>
        <button
          className="button btn-lg"
          type="button"
          onClick={handleShutdown}
        >
          {t("shutDownChoiceLabel")}
        </button>
        {hasFlag("secret_ending_available") && (
          <button
            className="button btn-lg finale-seal-button"
            type="button"
            onClick={handleSeal}
            title={`${state.insightsUnlocked.length}/6 correlations retained`}
          >
            {locale === "pt-BR" ? "SELAR RELAY" : "SEAL RELAY"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Finale;
