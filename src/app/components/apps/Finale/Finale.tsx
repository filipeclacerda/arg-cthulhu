"use client";
import React, { useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { resolveTokens, formatGameDate, tomorrow } from "@/app/utils/narrative";
import "./style.scss";

type FinaleState = "choice" | "restore" | "shutdown";

const Finale = () => {
  const { setFlag, playerName } = useProgress();
  const [screen, setScreen] = useState<FinaleState>("choice");

  const ctx = { playerName };
  const tomorrowStr = formatGameDate(tomorrow());

  const handleRestore = () => {
    setFlag("ending_restore");
    setScreen("restore");
  };

  const handleShutdown = () => {
    setFlag("ending_shutdown");
    setScreen("shutdown");
  };

  if (screen === "restore") {
    return (
      <div className="finale finale--restore">
        <div className="finale-terminal">
          <pre>
          {resolveTokens(
            `[SIGNAL RECEIVED — {TOMORROW}]

S: i'm here
S: i can hear you on the other side of it
S: come back i'm right here

[SIGNAL LOST]

[REBOOTING]
[USER: sarah.bishop]
[LAST LOGIN: {TOMORROW}]

New documents found in this folder.
Owner: {PLAYER}
Created: {TOMORROW}`,
            ctx
          )}
          </pre>
        </div>
        <p className="finale-caption">
          Sarah&apos;s account is restored. Your files are dated {tomorrowStr}.
        </p>
      </div>
    );
  }

  if (screen === "shutdown") {
    return (
      <div className="finale finale--shutdown">
        <div className="finale-terminal">
          <pre>
{`Windows 98 is shutting down.

It is now safe to turn off your computer.

...

...

...`}
          </pre>
        </div>
        <p className="finale-caption">
          Check your inbox.
        </p>
      </div>
    );
  }

  // Default: the choice
  return (
    <div className="finale">
      <div className="finale-terminal">
        <pre>
        {resolveTokens(
          `[RECOVERED PROGRAM — last modified {TOMORROW}]

Chapter seven is not in the book.
Chapter seven is the person trying to understand it.

Two options remain.`,
          ctx
        )}
        </pre>
      </div>
      <div className="finale-actions">
        <button
          className="button btn-lg"
          type="button"
          onClick={handleRestore}
        >
          RESTORE SARAH
        </button>
        <button
          className="button btn-lg"
          type="button"
          onClick={handleShutdown}
        >
          SHUT DOWN
        </button>
      </div>
    </div>
  );
};

export default Finale;
