import posthog from "posthog-js";
import { TelemetryEvent } from "./progress";

const CONSENT_KEY = "miskatonic-telemetry-consent";

export type TelemetryConsent = "unknown" | "granted" | "denied";

/** Consent is an optional preference; it must never gate access to the game. */
export const isPlayAllowed = (_consent: TelemetryConsent): boolean => true;

export const getTelemetryConsent = (): TelemetryConsent => {
  if (typeof window === "undefined") return "unknown";
  const value = window.localStorage.getItem(CONSENT_KEY);
  return value === "granted" || value === "denied" ? value : "unknown";
};

export const setTelemetryConsent = (consent: Exclude<TelemetryConsent, "unknown">) => {
  window.localStorage.setItem(CONSENT_KEY, consent);
};

export const captureTelemetry = (event: TelemetryEvent): void => {
  if (
    typeof window === "undefined" ||
    getTelemetryConsent() !== "granted"
  ) {
    return;
  }
  posthog.capture(event.name, {
    $process_person_profile: false,
    ...event.properties,
  });
};
