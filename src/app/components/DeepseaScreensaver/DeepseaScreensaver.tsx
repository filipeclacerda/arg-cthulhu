"use client";

import React, { useEffect, useRef, useState } from "react";
import { resolveTokens } from "@/app/utils/narrative";

export const DEEPSEA_IDLE_MS = 3 * 60 * 1000 + 14 * 1000;

const DeepseaScreensaver = ({
  enabled,
  playerName,
}: {
  enabled: boolean;
  playerName: string | null;
}) => {
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      activeRef.current = false;
      setActive(false);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    const arm = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        activeRef.current = true;
        setActive(true);
      }, DEEPSEA_IDLE_MS);
    };
    const wake = () => {
      if (activeRef.current) {
        activeRef.current = false;
        setActive(false);
      }
      arm();
    };

    const events: (keyof WindowEventMap)[] = [
      "pointermove",
      "pointerdown",
      "keydown",
      "touchstart",
    ];
    events.forEach((event) => window.addEventListener(event, wake));
    arm();
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, wake));
    };
  }, [enabled]);

  if (!enabled || !active) return null;

  return (
    <div className="deepsea-screensaver" data-testid="deepsea-screensaver">
      <div className="deepsea-screensaver__water" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i />
      </div>
      <div className="deepsea-screensaver__status">
        <strong>DEEPSEA.SCR</strong>
        <span>{resolveTokens("{TOMORROW} 03:14")}</span>
        <small>{playerName?.trim() || "NEXT USER"} / MONITOR MAY FAIL TO WAKE</small>
      </div>
    </div>
  );
};

export default DeepseaScreensaver;
