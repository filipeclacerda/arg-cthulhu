"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ComfortSettings, defaultComfortSettings } from "@/app/game/comfort";

const STORAGE_KEY = "arg-cthulhu-comfort";
const ComfortContext = createContext<{
  settings: ComfortSettings;
  updateSettings: (update: Partial<ComfortSettings>) => void;
} | null>(null);

export const ComfortProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState(defaultComfortSettings);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSettings({ ...defaultComfortSettings, ...JSON.parse(saved) });
    } catch { /* privacy modes retain safe defaults */ }
  }, []);

  useEffect(() => {
    const mediaReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.dataset.reducedMotion = String(settings.reducedMotion || mediaReduced);
    document.documentElement.dataset.reducedFlicker = String(settings.reducedFlicker);
    document.documentElement.dataset.highContrast = String(settings.highContrast);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* optional persistence */ }
  }, [settings]);

  const value = useMemo(() => ({
    settings,
    updateSettings: (update: Partial<ComfortSettings>) => setSettings((current) => ({ ...current, ...update })),
  }), [settings]);
  return <ComfortContext.Provider value={value}>{children}</ComfortContext.Provider>;
};

export const useComfort = () => {
  const context = useContext(ComfortContext);
  if (!context) throw new Error("useComfort must be used within a ComfortProvider");
  return context;
};
