"use client";

import React from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { puzzleHintsFor } from "@/app/game/puzzles";
import { useI18n } from "@/app/i18n";
import "../ArgTools/style.scss";

const HelpCenter = () => {
  const { activePuzzle, state, unlockHint } = useProgress();
  const { t } = useI18n();
  if (!activePuzzle) {
    return <div className="arg-tool"><div className="arg-tool__content">{t("noUnresolvedEntries")}</div></div>;
  }
  const progress = state.puzzles[activePuzzle];
  const hints = puzzleHintsFor(state.locale, activePuzzle);
  return (
    <div className="arg-tool" style={{ width: 600, height: 470 }}>
      <div className="arg-tool__menubar"><span>{t("menuIndex")}</span><span>{t("menuSearch")}</span><span>{t("back")}</span></div>
      <div className="arg-tool__content">
        <p className="arg-tool__kicker">{t("recoveredHelp")} / {activePuzzle.toUpperCase()}</p>
        <h2>{t("archiveFoundPrefix")} {progress.hintsUnlocked} {t("fragmentsSuffix")}</h2>
        {hints.slice(0, progress.hintsUnlocked).map((hint, index) => (
          <div className="arg-tool__result" key={hint}>
            <strong>{t("fragmentLabel")} {index + 1}</strong>
            <p>{hint}</p>
          </div>
        ))}
        {progress.hintsUnlocked < 3 && (
          <button className="button" onClick={() => unlockHint(activePuzzle)}>
            {t("recoverHint")}
          </button>
        )}
        {progress.hintsUnlocked === 0 && (
          <p>{t("noAutomaticHint")}</p>
        )}
      </div>
      <div className="arg-tool__status">
        <span>{t("activeTime")}: {Math.floor(progress.activeMs / 60000)} min</span>
        <span>{t("attempts")}: {progress.attempts}</span>
      </div>
    </div>
  );
};

export default HelpCenter;
