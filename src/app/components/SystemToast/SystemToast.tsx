"use client";

import { useProgress } from "@/app/context/ProgressContext";

const SystemToast = () => {
  const { systemNotice } = useProgress();

  return (
    <div
      className={`system-toast ${systemNotice ? "system-toast--visible" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span>{systemNotice}</span>
    </div>
  );
};

export default SystemToast;
