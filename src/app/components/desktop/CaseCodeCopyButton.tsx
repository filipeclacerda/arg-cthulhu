"use client";

import { useState } from "react";

export function CaseCodeCopyButton({ copy, labels }: { copy: () => Promise<string>; labels: { copy: string; copied: string; failed: string } }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const handleCopy = async () => {
    try {
      const code = await copy();
      await navigator.clipboard.writeText(code);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  };
  return <><button className="button" type="button" onClick={handleCopy}>{status === "copied" ? labels.copied : labels.copy}</button>
    {status === "failed" && <p role="alert">{labels.failed}</p>}</>;
}
