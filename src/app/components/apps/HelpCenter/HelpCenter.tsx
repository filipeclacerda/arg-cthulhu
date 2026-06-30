"use client";

import React from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { PUZZLE_HINTS } from "@/app/game/puzzles";
import "../ArgTools/style.scss";

const HelpCenter = () => {
  const { activePuzzle, state, unlockHint } = useProgress();
  if (!activePuzzle) {
    return <div className="arg-tool"><div className="arg-tool__content">No unresolved index entries.</div></div>;
  }
  const progress = state.puzzles[activePuzzle];
  const hints = PUZZLE_HINTS[activePuzzle];
  return (
    <div className="arg-tool" style={{ width: 600, height: 470 }}>
      <div className="arg-tool__menubar"><span>Index</span><span>Search</span><span>Back</span></div>
      <div className="arg-tool__content">
        <p className="arg-tool__kicker">RECOVERED HELP INDEX / {activePuzzle.toUpperCase()}</p>
        <h2>The archive found {progress.hintsUnlocked} relevant fragment(s).</h2>
        {hints.slice(0, progress.hintsUnlocked).map((hint, index) => (
          <div className="arg-tool__result" key={hint}>
            <strong>Fragment {index + 1}</strong>
            <p>{hint}</p>
          </div>
        ))}
        {progress.hintsUnlocked < 3 && (
          <button className="button" onClick={() => unlockHint(activePuzzle)}>
            Recover another help fragment
          </button>
        )}
        {progress.hintsUnlocked === 0 && (
          <p>No automatic hint has surfaced yet. Manual recovery is available.</p>
        )}
      </div>
      <div className="arg-tool__status">
        <span>Active time: {Math.floor(progress.activeMs / 60000)} min</span>
        <span>Attempts: {progress.attempts}</span>
      </div>
    </div>
  );
};

export default HelpCenter;

