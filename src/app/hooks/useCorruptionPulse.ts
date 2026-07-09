"use client";
import { useEffect, useRef } from "react";
import type { SoundName } from "../context/SoundContext";

// Corruption used to be a permanent tremor — every corrupted window jittered
// forever, which reads as a headache rather than horror. Instead we pulse:
// long stretches of dead-still, wrong-feeling stillness, broken by a brief
// (250-400ms) burst of movement. The interval shortens as the stage rises.
const INTERVALS: Record<number, [number, number]> = {
  1: [15_000, 30_000],
  2: [12_000, 24_000],
  3: [8_000, 16_000],
  4: [5_000, 12_000],
};
const PULSE_MIN_MS = 250;
const PULSE_MAX_MS = 400;
const SOUND_EVERY_N = 4;
const SOUND_MIN_STAGE = 3;

export const useCorruptionPulse = (
  stage: number,
  play?: (name: SoundName) => void
) => {
  // `play` is recreated on every SoundContext render; putting it in the
  // effect deps would restart the scheduler constantly and the pulse would
  // never actually fire. Track the latest value in a ref instead.
  const playRef = useRef(play);
  useEffect(() => {
    playRef.current = play;
  });

  useEffect(() => {
    const range = INTERVALS[stage];
    if (!range) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let nextTimer: ReturnType<typeof setTimeout>;
    let endTimer: ReturnType<typeof setTimeout>;
    let pulseCount = 0;

    const schedule = () => {
      const [min, max] = range;
      nextTimer = setTimeout(firePulse, min + Math.random() * (max - min));
    };

    const firePulse = () => {
      document.documentElement.dataset.glitch = "1";
      pulseCount += 1;
      if (stage >= SOUND_MIN_STAGE && pulseCount % SOUND_EVERY_N === 0) {
        playRef.current?.("glitch");
      }
      const duration =
        PULSE_MIN_MS + Math.random() * (PULSE_MAX_MS - PULSE_MIN_MS);
      endTimer = setTimeout(() => {
        delete document.documentElement.dataset.glitch;
        schedule();
      }, duration);
    };

    schedule();

    return () => {
      clearTimeout(nextTimer);
      clearTimeout(endTimer);
      delete document.documentElement.dataset.glitch;
    };
  }, [stage]);
};
