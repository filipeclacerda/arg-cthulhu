"use client";
import { useEffect, useRef, useState } from "react";

// "Sarah Bishop" loses integrity across the system once the entity has
// enough of the pattern (future_log solved, corruption stage 3+). It never
// explains itself: a letter goes missing, the surname shortens, and rarely —
// on purpose, rarely — the name is briefly her mother's instead. Cadence
// mirrors Messenger's presencePulse: rare first, then irregular. Never wire
// this into a puzzle control, input, or anything the player must read to act.
const VARIANTS = ["S. BISHOP", "SAR H BISHOP", "M. BISHOP"] as const;

const pickVariant = (): (typeof VARIANTS)[number] => {
  const roll = Math.random();
  if (roll < 0.12) return "M. BISHOP";
  if (roll < 0.56) return "S. BISHOP";
  return "SAR H BISHOP";
};

const FLICKER_MS = 1000;
const MIN_FIRST_MS = 20_000;
const MAX_FIRST_MS = 60_000;
const MIN_REPEAT_MS = 3 * 60_000;
const MAX_REPEAT_MS = 7 * 60_000;

/**
 * Returns `baseName` most of the time, and an occasional degraded variant
 * while `active`. Consumers decide where it's safe to render this (identity
 * chrome, folder titles) — never a form control or puzzle input.
 */
export const useNameDegradation = (
  baseName: string,
  active: boolean,
  onDegrade?: () => void
): string => {
  const [degraded, setDegraded] = useState<string | null>(null);
  const onDegradeRef = useRef(onDegrade);
  useEffect(() => {
    onDegradeRef.current = onDegrade;
  });

  useEffect(() => {
    if (!active) {
      setDegraded(null);
      return;
    }
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let flickerTimer: ReturnType<typeof setTimeout>;
    let scheduleTimer: ReturnType<typeof setTimeout>;

    const schedule = (minMs: number, maxMs: number) => {
      scheduleTimer = setTimeout(trigger, minMs + Math.random() * (maxMs - minMs));
    };

    const trigger = () => {
      setDegraded(pickVariant());
      onDegradeRef.current?.();
      flickerTimer = setTimeout(() => setDegraded(null), FLICKER_MS);
      schedule(MIN_REPEAT_MS, MAX_REPEAT_MS);
    };

    schedule(MIN_FIRST_MS, MAX_FIRST_MS);

    return () => {
      clearTimeout(flickerTimer);
      clearTimeout(scheduleTimer);
    };
  }, [active]);

  return degraded ?? baseName;
};
