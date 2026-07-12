"use client";

import React, { useEffect, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { formatGameDate, tomorrow } from "@/app/utils/narrative";
import "../ArgTools/style.scss";
import "./style.scss";
import { useI18n } from "@/app/i18n";
import { useWindowManager } from "@/app/context/WindowManagerContext";

const ClockProperties = () => {
  const { corruptionStage, isPuzzleSolved, collectReference, state } = useProgress();
  const { openWindow } = useWindowManager();
  const { t } = useI18n();
  const [now, setNow] = useState<Date | null>(null);
  const referenceVisible = isPuzzleSolved("future_log");
  const recallActive = Boolean(state.flags.recall_0314_clock_seen && !state.flags.recall_0314_complete && !state.flags.recall_0314_skipped);

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
            <p className="arg-tool__kicker">{t("dateTimeControlPanel")}</p>
            <h2>{displayedDate?.toLocaleTimeString() ?? "--:--:--"}</h2>
            <span>
              {displayedDate ? formatGameDate(displayedDate) : "--/--/----"}
            </span>
          </div>
        </div>

        <dl className="arg-tool__properties">
          <dt>{t("timeZoneLabel")}</dt>
          <dd>{Intl.DateTimeFormat().resolvedOptions().timeZone}</dd>
          <dt>{t("clockSourceLabel")}</dt>
          <dd>{recallActive ? "TIME SOURCE UNAVAILABLE" : "SB-ARCHIVE-02 / CMOS registry"}</dd>
          <dt>{t("synchronizationLabel")}</dt>
          <dd>{corruptionStage >= 2 ? t("driftExceedsTolerance") : t("notAvailable")}</dd>
          <dt>{t("registryKeyLabel")}</dt>
          <dd>HKLM\System\CurrentControlSet\Control\TimeZoneInformation</dd>
        </dl>

        {recallActive && (
          <div className="arg-tool__result arg-tool__warning">
            <p>LAST VALID SYNC: {formatGameDate(tomorrow(new Date()))} 03:14</p>
            <p>REQUESTING PROCESS: MSNMSGR.EXE</p>
            <button className="button" type="button" onClick={() => openWindow({ id: "msn-messenger", appType: "messenger", title: "MSN Messenger", props: { windowClassName: "corrupted", initialThreadId: "chat-sarah-live" } })}>
              MSNMSGR.EXE
            </button>
          </div>
        )}

        {referenceVisible ? (
          <div className="arg-tool__reference">OBJECT REF: B9</div>
        ) : (
          <p className="clock-properties__locked">
            {t("registryDataUnavailable")}
          </p>
        )}
      </div>
      <div className="arg-tool__status">
        <span>{t("systemClockLabel")}</span>
        <span>{referenceVisible ? t("indexedObjectLabel") : t("registryDataLabel")}</span>
      </div>
    </div>
  );
};

export default ClockProperties;
