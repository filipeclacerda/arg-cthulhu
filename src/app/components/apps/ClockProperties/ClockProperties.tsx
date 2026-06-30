"use client";

import React, { useEffect, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { formatGameDate, tomorrow } from "@/app/utils/narrative";
import "../ArgTools/style.scss";
import "./style.scss";

const ClockProperties = () => {
  const { corruptionStage, isPuzzleSolved, collectReference } = useProgress();
  const [now, setNow] = useState<Date | null>(null);
  const referenceVisible = isPuzzleSolved("future_log");

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (referenceVisible) collectReference("B9");
  }, [collectReference, referenceVisible]);

  const displayedDate = now
    ? corruptionStage >= 4
      ? tomorrow(now)
      : now
    : null;

  return (
    <div className="arg-tool clock-properties">
      <div className="arg-tool__content">
        <div className="clock-properties__header">
          <div className="clock-properties__dial" aria-hidden="true">
            <i />
            <b />
          </div>
          <div>
            <p className="arg-tool__kicker">DATE/TIME CONTROL PANEL</p>
            <h2>{displayedDate?.toLocaleTimeString() ?? "--:--:--"}</h2>
            <span>
              {displayedDate ? formatGameDate(displayedDate) : "--/--/----"}
            </span>
          </div>
        </div>

        <dl className="arg-tool__properties">
          <dt>Time zone</dt>
          <dd>{Intl.DateTimeFormat().resolvedOptions().timeZone}</dd>
          <dt>Clock source</dt>
          <dd>SB-ARCHIVE-02 / CMOS registry</dd>
          <dt>Synchronization</dt>
          <dd>{corruptionStage >= 2 ? "drift exceeds tolerance" : "not available"}</dd>
          <dt>Registry key</dt>
          <dd>HKLM\System\CurrentControlSet\Control\TimeZoneInformation</dd>
        </dl>

        {referenceVisible ? (
          <div className="arg-tool__reference">OBJECT REF: B9</div>
        ) : (
          <p className="clock-properties__locked">
            Additional registry index data is unavailable.
          </p>
        )}
      </div>
      <div className="arg-tool__status">
        <span>System clock</span>
        <span>{referenceVisible ? "indexed object" : "registry data"}</span>
      </div>
    </div>
  );
};

export default ClockProperties;
