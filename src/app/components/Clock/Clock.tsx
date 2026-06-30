"use client";
import React, { useState, useEffect, useRef } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { formatGameDate, tomorrow } from "@/app/utils/narrative";

const Clock = () => {
  const { corruptionStage, isPuzzleSolved, collectReference } = useProgress();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  // Accumulated "wrongness" the clock has remembered into the future.
  const skewRef = useRef(0);

  useEffect(() => {
    setCurrentTime(new Date());
    const intervalId = setInterval(() => {
      // Stage 2+ the clock starts running fast; each tick it remembers a little
      // more time than has actually passed.
      const skewPerTick = corruptionStage >= 2 ? corruptionStage - 1 : 0;
      skewRef.current += skewPerTick * 1000;
      setCurrentTime(new Date(Date.now() + skewRef.current));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [corruptionStage]);

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

  return (
    <div
      className="clock"
      title={
        isPuzzleSolved("future_log")
          ? "Clock registry object reference: B9"
          : "System clock"
      }
      onClick={() => {
        if (isPuzzleSolved("future_log")) collectReference("B9");
      }}
      style={{
        fontSize: "14px",
        width: "70px",
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <p style={{ margin: 0 }}>
        {currentTime ? formatTime(currentTime) : "--:--:-- --"}
      </p>
      <p style={{ margin: 0 }}>{dateString}</p>
    </div>
  );
};

export default Clock;
