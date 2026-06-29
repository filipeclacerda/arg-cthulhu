"use client";
import React, { useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import "./style.scss";

// Diegetic visitor-log dialog — it looks like a mandatory Windows 98 registration
// step, completely mundane. The name is captured early, stored, and used against
// the player in Act 3 when the user folder takes their name.
const Registration = () => {
  const { setPlayerName, setFlag } = useProgress();
  const { closeWindow } = useWindowManager();
  const [name, setName] = useState("");

  const handleSubmit = () => {
    setPlayerName(name.trim() || null);
    setFlag("registration_shown");
    closeWindow("registration");
  };

  return (
    <div className="registration">
      <p className="registration-kicker">Evidence intake</p>
      <h2>Researcher Visitor Log</h2>
      <p>
        This copy of the disk image was signed out to a registered researcher.
        Please enter your name to continue. The archive uses this for access
        logs only.
      </p>
      <div className="registration-fields">
        <div className="registration-row">
          <label>Full name:</label>
          <input
            className="input"
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
        <div className="registration-actions">
          <button className="button btn-lg" type="button" onClick={handleSubmit}>
            Register
          </button>
          <button
            className="button btn-lg"
            type="button"
            onClick={() => {
              setPlayerName(null);
              setFlag("registration_shown");
              closeWindow("registration");
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default Registration;
