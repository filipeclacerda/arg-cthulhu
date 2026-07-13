"use client";

import { useEffect, useRef } from "react";
import { DIEGETIC_EVENTS, diegeticEventDelayMs, selectNextDiegeticEvent, type DiegeticEventDefinition } from "@/app/game/diegeticEvents";

/** Schedules exactly one eligible narrative manifestation at a time. */
export function useDiegeticEventCoordinator({ enabled, context, gates, present }: {
  enabled: boolean;
  context: Parameters<typeof selectNextDiegeticEvent>[0];
  gates: Parameters<typeof selectNextDiegeticEvent>[1];
  present: (event: DiegeticEventDefinition) => void;
}) {
  const presentRef = useRef(present);
  useEffect(() => { presentRef.current = present; });
  const nextEventId = enabled ? selectNextDiegeticEvent(context, gates)?.id ?? null : null;
  useEffect(() => {
    if (!nextEventId) return;
    const definition = DIEGETIC_EVENTS.find((event) => event.id === nextEventId);
    if (!definition) return;
    const timer = window.setTimeout(() => presentRef.current(definition), diegeticEventDelayMs(definition));
    return () => window.clearTimeout(timer);
  }, [nextEventId]);
  return nextEventId;
}
