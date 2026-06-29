"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "arg-cthulhu-zoom";
const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 2;
const ZOOM_DEFAULT = 1;

interface ZoomContextValue {
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

const ZoomContext = createContext<ZoomContextValue | null>(null);

const clamp = (value: number) =>
  Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100));

export const ZoomProvider = ({ children }: { children: React.ReactNode }) => {
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);

  // Mount-only: reading localStorage during initial render would mismatch
  // the server-rendered HTML (App Router renders this tree on the server first).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setZoom(clamp(parseFloat(raw)));
    } catch {
      // localStorage unavailable (private mode, etc.) — play without persistence.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(zoom));
    } catch {
      // ignore — see above.
    }
    // A CSS custom property multiplier, read via calc(var(--ui-scale, 1) * Npx)
    // in stylesheets — real layout, not a post-layout rendering hack like the
    // `zoom`/`transform: scale` CSS properties, which broke position:fixed/
    // absolute children (desktop icons, dragged windows) and viewport units.
    document.documentElement.style.setProperty("--ui-scale", String(zoom));
  }, [zoom]);

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (!(ev.ctrlKey || ev.metaKey)) return;
      if (ev.key === "+" || ev.key === "=") {
        ev.preventDefault();
        setZoom((z) => clamp(z + ZOOM_STEP));
      } else if (ev.key === "-" || ev.key === "_") {
        ev.preventDefault();
        setZoom((z) => clamp(z - ZOOM_STEP));
      } else if (ev.key === "0") {
        ev.preventDefault();
        setZoom(ZOOM_DEFAULT);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value: ZoomContextValue = {
    zoom,
    zoomIn: () => setZoom((z) => clamp(z + ZOOM_STEP)),
    zoomOut: () => setZoom((z) => clamp(z - ZOOM_STEP)),
    resetZoom: () => setZoom(ZOOM_DEFAULT),
  };

  return <ZoomContext.Provider value={value}>{children}</ZoomContext.Provider>;
};

export const useZoom = () => {
  const ctx = useContext(ZoomContext);
  if (!ctx) {
    throw new Error("useZoom must be used within a ZoomProvider");
  }
  return ctx;
};
