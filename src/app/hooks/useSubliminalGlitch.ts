"use client";
import { useEffect, useRef, useState } from "react";

// Two rare, barely-there "did I just see that?" beats — only at full
// corruption. Never gates or explains anything; the point is that the player
// can never be quite sure it happened.

const MIN_DELAY_MS = 45_000;
const MAX_DELAY_MS = 100_000;
const LABEL_FLASH_MS = 160;
const CURSOR_ECHO_MS = 900;

interface CursorEcho {
  x: number;
  y: number;
}

export const useSubliminalGlitch = (
  active: boolean,
  playerName: string | null
) => {
  const [labelGlitch, setLabelGlitch] = useState<string | null>(null);
  const [cursorEcho, setCursorEcho] = useState<CursorEcho | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!active) {
      setLabelGlitch(null);
      setCursorEcho(null);
      return;
    }

    const texts = [
      "STILL COUNTING",
      "NOT ALONE",
      "IT SEES YOU TOO",
      "READER NINE OF NINE",
      `${(playerName || "NEXT USER").toUpperCase()} / VOL_114`,
    ];

    const handleMouseMove = (event: MouseEvent) => {
      mousePos.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    let nextTimer: ReturnType<typeof setTimeout>;
    let labelTimer: ReturnType<typeof setTimeout>;
    let echoTimer: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
      nextTimer = setTimeout(triggerMoment, delay);
    };

    const triggerMoment = () => {
      setLabelGlitch(texts[Math.floor(Math.random() * texts.length)]);
      setCursorEcho({
        x: mousePos.current.x - 18 - Math.random() * 30,
        y: mousePos.current.y + 14 + Math.random() * 24,
      });
      labelTimer = setTimeout(() => setLabelGlitch(null), LABEL_FLASH_MS);
      echoTimer = setTimeout(() => setCursorEcho(null), CURSOR_ECHO_MS);
      scheduleNext();
    };

    scheduleNext();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(nextTimer);
      clearTimeout(labelTimer);
      clearTimeout(echoTimer);
    };
  }, [active, playerName]);

  return { labelGlitch, cursorEcho };
};
