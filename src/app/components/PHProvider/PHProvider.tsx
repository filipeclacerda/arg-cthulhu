"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { getTelemetryConsent } from "@/app/game/telemetry";

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      defaults: "2026-01-30",
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
    });
    // Respect the game's existing consent choice at startup.
    if (getTelemetryConsent() !== "granted") {
      posthog.opt_out_capturing();
    }
  }, []);

  return <>{children}</>;
}
