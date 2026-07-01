"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "arg-cthulhu-muted";

export type SoundName = "click" | "error" | "chime" | "glitch";

const SOUND_FILES: Record<SoundName, string> = {
  click: "/sounds/click.wav",
  error: "/sounds/error.wav",
  chime: "/sounds/chime.wav",
  glitch: "/sounds/glitch.wav",
};

const SOUND_VOLUME: Record<SoundName, number> = {
  click: 0.35,
  error: 0.5,
  chime: 0.5,
  glitch: 0.45,
};

interface SoundContextValue {
  muted: boolean;
  toggleMuted: () => void;
  play: (name: SoundName) => void;
  setAmbientActive: (active: boolean) => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);
  const poolRef = useRef<Partial<Record<SoundName, HTMLAudioElement>>>({});
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const ambientWantedRef = useRef(false);

  // Mount-only: reading localStorage during initial render would mismatch
  // the server-rendered HTML (App Router renders this tree on the server first).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "1") setMuted(true);
    } catch {
      // localStorage unavailable (private mode, etc.) — default unmuted.
    }
  }, []);

  useEffect(() => {
    mutedRef.current = muted;
    try {
      localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
    } catch {
      // ignore — see above.
    }
    if (muted) {
      ambientRef.current?.pause();
    } else if (ambientWantedRef.current) {
      ambientRef.current?.play().catch(() => {});
    }
  }, [muted]);

  const play = (name: SoundName) => {
    if (mutedRef.current) return;
    try {
      let audio = poolRef.current[name];
      if (!audio) {
        audio = new Audio(SOUND_FILES[name]);
        poolRef.current[name] = audio;
      }
      audio.currentTime = 0;
      audio.volume = SOUND_VOLUME[name];
      void audio.play().catch(() => {});
    } catch {
      // Audio unavailable in this environment — fail silently.
    }
  };

  const setAmbientActive = (active: boolean) => {
    ambientWantedRef.current = active;
    if (active) {
      if (!ambientRef.current) {
        const audio = new Audio("/sounds/ambient-hum.wav");
        audio.loop = true;
        audio.volume = 0.16;
        ambientRef.current = audio;
      }
      if (!mutedRef.current) ambientRef.current.play().catch(() => {});
    } else {
      ambientRef.current?.pause();
    }
  };

  const value: SoundContextValue = {
    muted,
    toggleMuted: () => setMuted((m) => !m),
    play,
    setAmbientActive,
  };

  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
};

export const useSound = () => {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return ctx;
};
