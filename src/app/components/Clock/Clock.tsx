"use client";
import React, { useState, useEffect, useRef } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import { formatGameDate, tomorrow } from "@/app/utils/narrative";
import "./style.scss";

const Clock = () => {
  const { corruptionStage, isPuzzleSolved, setFlag, state } = useProgress();
  const { openWindow } = useWindowManager();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [skipping, setSkipping] = useState(false);
  // Accumulated "wrongness" the clock has remembered into the future.
  const skewRef = useRef(0);
  const hasLostSecond = state.worldReactionsSeen.includes("clock_lost_second");
  const hasUnindexedInterval = state.worldReactionsSeen.includes(
    "unindexed_interval"
  );
  const secondSkipped = useRef(false);
  const intervalRecall = useRef(false);
  const intervalRecallReplayed = useRef(false);
  const recallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replayPersisted = Boolean(state.flags.unindexed_clock_replayed);

  useEffect(() => {
    if (replayPersisted) intervalRecallReplayed.current = true;
  }, [replayPersisted]);

  useEffect(() => {
    if (!hasUnindexedInterval || intervalRecallReplayed.current) {
      return;
    }
    intervalRecallReplayed.current = true;
    intervalRecall.current = true;
    setFlag("unindexed_clock_replayed");
    setSkipping(true);
    setCurrentTime(new Date(Date.now() - 41 * 60 * 60 * 1000 - 58 * 60 * 1000 - 12 * 1000));
    recallTimer.current = setTimeout(() => {
      intervalRecall.current = false;
      setSkipping(false);
      setCurrentTime(new Date(Date.now() + skewRef.current));
    }, 1000);
    return () => {
      if (recallTimer.current) clearTimeout(recallTimer.current);
    };
  }, [hasUnindexedInterval, setFlag]);

  useEffect(() => {
    setCurrentTime(new Date());
    const intervalId = setInterval(() => {
      if (intervalRecall.current) return;
      // Stage 2+ the clock starts running fast; each tick it remembers a little
      // more time than has actually passed.
      const skewPerTick = corruptionStage >= 2 ? corruptionStage - 1 : 0;
      skewRef.current += skewPerTick * 1000;
      // Once the pattern names Sarah's displacement, the clock re-enacts it once:
      // one real second passes but the display silently keeps the previous reading,
      // then jumps two seconds at once to stay "correct" in total.
      if (hasLostSecond && !secondSkipped.current) {
        secondSkipped.current = true;
        setSkipping(true);
        window.setTimeout(() => setSkipping(false), 900);
        return;
      }
      setCurrentTime(new Date(Date.now() + skewRef.current));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [corruptionStage, hasLostSecond]);

  const formatTime = (date: Date) => {
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const ampm = date.getHours() >= 12 ? "PM" : "AM";
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  };

  // Stage 4: the date is always tomorrow — the state the manuscript calls "amanhã".
  const dateString = currentTime
    ? corruptionStage >= 4
      ? formatGameDate(tomorrow(new Date()))
      : formatGameDate(currentTime)
    : "--/--/----";
  const referenceVisible = isPuzzleSolved("future_log");

  const openProperties = () => {
    openWindow({
      id: "clock-properties",
      appType: "clock-properties",
      title: "Date/Time Properties",
    });
  };

  return (
    <button
      type="button"
      className={`clock ${skipping ? "clock--skipping" : ""}`}
      title={
        referenceVisible
          ? "Open Date/Time Properties — indexed registry data available"
          : "Open Date/Time Properties"
      }
      onClick={openProperties}
    >
      <span>
        {currentTime ? formatTime(currentTime) : "--:--:-- --"}
      </span>
      <span>{dateString}</span>
    </button>
  );
};

export default Clock;
