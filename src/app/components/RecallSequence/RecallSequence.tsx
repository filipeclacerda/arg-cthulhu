"use client";

import { useEffect, useRef, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { useSound } from "@/app/context/SoundContext";
import { useWindowManager } from "@/app/context/WindowManagerContext";
import { firstIncompletePhase, shouldShowRecallRecoveryNotice } from "@/app/game/recall0314";
import "./style.scss";

const AMBIENT_OWNER = "recall-0314";

/**
 * Non-visual incident controller. RECALL_0314 is an internal event name: every
 * visible beat lives in an existing desktop application. This component owns
 * only the silence between the changed photograph and the confirmed ledger.
 */
const RecallSequence = ({ enabled }: { enabled: boolean; focalBusy: boolean }) => {
  const { flags, setFlag } = useProgress();
  const { pushAmbientOverride, releaseAmbientOverride } = useSound();
  const { openWindow } = useWindowManager();
  const [recoveryNotice, setRecoveryNotice] = useState(false);
  const hydrationChecked = useRef(false);
  const active = Boolean(
    enabled && flags.recall_0314_started && !flags.recall_0314_complete && !flags.recall_0314_skipped
  );

  useEffect(() => {
    if (!enabled || hydrationChecked.current) return;
    hydrationChecked.current = true;
    // Only a sequence that was already active in the hydrated save was
    // interrupted. A new sequence armed later in this same page load must not
    // inherit a generic browser-reload notice.
    if (shouldShowRecallRecoveryNotice(flags)) {
      setRecoveryNotice(true);
    }
  }, [enabled, flags]);

  useEffect(() => {
    if (!active) return;
    pushAmbientOverride(AMBIENT_OWNER, { volume: 0, fadeMs: 8_000 });
    return () => releaseAmbientOverride(AMBIENT_OWNER, { fadeMs: 5_000 });
  }, [active, pushAmbientOverride, releaseAmbientOverride]);

  useEffect(() => {
    if (!active || !flags.recall_0314_photo_seen || flags.recall_0314_silence_seen) return;
    let accrued = 0;
    let last = Date.now();
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        last = Date.now();
        return;
      }
      const now = Date.now();
      accrued += now - last;
      last = now;
      if (accrued >= 24_000) {
        window.clearInterval(timer);
        setFlag("recall_0314_silence_seen");
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [active, flags.recall_0314_photo_seen, flags.recall_0314_silence_seen, setFlag]);

  if (!active || !recoveryNotice) return null;
  const resume = () => {
    const phase = firstIncompletePhase(flags);
    setRecoveryNotice(false);
    if (!phase || phase.id === "clock") {
      setFlag("recall_0314_clock_seen");
      openWindow({ id: "clock-properties", appType: "clock-properties", title: "Date/Time Properties" });
    } else if (phase.id === "receipt") {
      openWindow({ id: "msn-messenger", appType: "messenger", title: "MSN Messenger", props: { windowClassName: "corrupted", initialThreadId: "chat-sarah-live" } });
    } else {
      openWindow({ id: "recall-history", appType: "browser", title: "Microsoft Internet Explorer", props: { initialAddress: "cache://sb-archive-02/history/0314", windowClassName: "corrupted" } });
    }
  };
  return (
    <div className="archive-warning coordinator-toast recall-recovery-toast" role="status">
      <div><small>SYSTEM RECOVERY</small><strong>Recovery interrupted</strong><p>An unfinished system reconciliation was found.</p></div>
      <button className="button" type="button" onClick={resume}>Resume</button>
      <button className="button" type="button" onClick={() => { setRecoveryNotice(false); setFlag("recall_0314_skipped"); }}>Stop</button>
    </div>
  );
};

export default RecallSequence;
