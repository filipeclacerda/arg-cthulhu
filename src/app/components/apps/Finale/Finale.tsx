"use client";
import React, { useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { useSound } from "@/app/context/SoundContext";
import { resolveTokens, formatGameDate, tomorrow } from "@/app/utils/narrative";
import { useI18n } from "@/app/i18n";
import "./style.scss";

type FinaleState = "choice" | "restore" | "shutdown";

const Finale = () => {
  const { chooseEnding, playerName } = useProgress();
  const { play } = useSound();
  const { t } = useI18n();
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
      </div>
    </div>
  );
};

export default Finale;
