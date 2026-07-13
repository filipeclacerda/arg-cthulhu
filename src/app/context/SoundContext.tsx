"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useComfort } from "./ComfortContext";

const STORAGE_KEY = "arg-cthulhu-muted";

export type SoundName =
  | "click"
  | "error"
  | "chime"
  | "glitch"
  | "disk"
  | "wet"
  | "future"
  | "harmonized"
  | "mechanicalMoan"
  | "metalResonance"
  | "clock"
  | "deepMoan";

export type AmbientStage = 0 | 1 | 2 | 3 | 4 | null;

const SOUND_FILES: Record<SoundName, string> = {
  click: "/sounds/click.wav",
  error: "/sounds/error.wav",
  chime: "/sounds/chime.wav",
  glitch: "/sounds/glitch.wav",
  disk: "/sounds/disk-seek.wav",
  wet: "/sounds/wet-click.wav",
  future: "/sounds/future-chime.wav",
  harmonized: "/sounds/harmonized-tone.wav",
  mechanicalMoan: "/sounds/mechanical-moan.wav",
  metalResonance: "/sounds/metal-resonance.wav",
  clock: "/sounds/clock.wav",
  deepMoan: "/sounds/deep-moaning-tone.wav",
};

const SOUND_VOLUME: Record<SoundName, number> = {
  click: 0.4,
  error: 0.56,
  chime: 0.56,
  glitch: 0.52,
  disk: 0.33,
  wet: 0.4,
  future: 0.45,
  harmonized: 0.32,
  mechanicalMoan: 0.22,
  metalResonance: 0.3,
  clock: 0.2,
  deepMoan: 0.18,
};

const AMBIENT_FILES: Record<Exclude<AmbientStage, null>, string> = {
  0: "/sounds/room-tone.wav",
  1: "/sounds/room-tone.wav",
  2: "/sounds/room-tone-wet.wav",
  3: "/sounds/ambient-hum.wav",
  4: "/sounds/ambient-void.wav",
};

const AMBIENT_VOLUME: Record<Exclude<AmbientStage, null>, number> = {
  0: 0.1,
  1: 0.11,
  2: 0.13,
  3: 0.15,
  4: 0.13,
};

interface AmbientOverrideOptions {
  /** Absolute target volume (0–1) the room is ducked to while held. */
  volume: number;
  /** Fade duration to the target, in ms. Defaults to an immediate set. */
  fadeMs?: number;
}

interface SoundContextValue {
  muted: boolean;
  toggleMuted: () => void;
  play: (name: SoundName) => void;
  setAmbientStage: (stage: AmbientStage) => void;
  /**
   * Ducks the room tone under an owned override (e.g. the RECALL_0314 calm and
   * silence beats). Multiple owners stack; the quietest wins. Mute stays
   * sovereign — an override only lowers the target volume, it never plays or
   * unmutes audio.
   */
  pushAmbientOverride: (owner: string, options: AmbientOverrideOptions) => void;
  /** Releases an owned override, fading back toward the stage's base volume. */
  releaseAmbientOverride: (owner: string, options?: { fadeMs?: number }) => void;
  playHauntedLoop: (
    id: string,
    src: string,
    durationMs: number,
    volume?: number
  ) => void;
  stopHauntedLoop: (id: string) => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useComfort();
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);
  const poolRef = useRef<Partial<Record<SoundName, HTMLAudioElement>>>({});
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const ambientStageRef = useRef<AmbientStage>(null);
  const ambientOverridesRef = useRef<Map<string, number>>(new Map());
  const ambientFadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hauntedLoopsRef = useRef<
    Partial<Record<string, { audio: HTMLAudioElement; timer: ReturnType<typeof setTimeout> }>>
  >({});

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
      Object.values(hauntedLoopsRef.current).forEach((entry) => entry?.audio.pause());
    } else {
      if (ambientStageRef.current !== null) ambientRef.current?.play().catch(() => {});
      Object.values(hauntedLoopsRef.current).forEach((entry) =>
        entry?.audio.play().catch(() => {})
      );
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
      audio.volume = SOUND_VOLUME[name] * settings.effectsVolume;
      void audio.play().catch(() => {});
      // Browsers often block ambience until the first deliberate interaction.
      // Any successful interface sound is also a safe point to retry the room.
      if (ambientStageRef.current !== null && ambientRef.current?.paused) {
        void ambientRef.current.play().catch(() => {});
      }
    } catch {
      // Audio unavailable in this environment — fail silently.
    }
  };

  const clampVolume = (value: number) => Math.max(0, Math.min(1, value));

  // The stage's base volume, ducked by whichever owned override is quietest.
  const effectiveAmbientVolume = useCallback((): number => {
    const stage = ambientStageRef.current;
    const base = stage === null ? 0 : AMBIENT_VOLUME[stage] * settings.ambientVolume;
    if (ambientOverridesRef.current.size === 0) return base;
    return clampVolume(Math.min(base, ...ambientOverridesRef.current.values()));
  }, [settings.ambientVolume]);

  const fadeAmbientTo = (target: number, fadeMs = 0) => {
    const audio = ambientRef.current;
    if (ambientFadeRef.current) {
      clearInterval(ambientFadeRef.current);
      ambientFadeRef.current = null;
    }
    if (!audio) return;
    const goal = clampVolume(target);
    if (fadeMs <= 0) {
      audio.volume = goal;
      return;
    }
    const start = audio.volume;
    const startedAt = Date.now();
    ambientFadeRef.current = setInterval(() => {
      const active = ambientRef.current;
      if (!active) {
        if (ambientFadeRef.current) clearInterval(ambientFadeRef.current);
        ambientFadeRef.current = null;
        return;
      }
      const progress = Math.min(1, (Date.now() - startedAt) / fadeMs);
      active.volume = clampVolume(start + (goal - start) * progress);
      if (progress >= 1 && ambientFadeRef.current) {
        clearInterval(ambientFadeRef.current);
        ambientFadeRef.current = null;
      }
    }, 50);
  };

  const setAmbientStage = (stage: AmbientStage) => {
    ambientStageRef.current = stage;
    if (stage === null) {
      ambientRef.current?.pause();
      ambientRef.current = null;
      return;
    }
    const nextSrc = AMBIENT_FILES[stage];
    const currentSrc = ambientRef.current?.getAttribute("src");
    if (!ambientRef.current || currentSrc !== nextSrc) {
      ambientRef.current?.pause();
      const audio = new Audio(nextSrc);
      audio.loop = true;
      audio.volume = effectiveAmbientVolume();
      ambientRef.current = audio;
    } else {
      ambientRef.current.volume = effectiveAmbientVolume();
    }
    if (!mutedRef.current) ambientRef.current.play().catch(() => {});
  };

  const pushAmbientOverride = (
    owner: string,
    options: AmbientOverrideOptions
  ) => {
    ambientOverridesRef.current.set(owner, clampVolume(options.volume));
    fadeAmbientTo(effectiveAmbientVolume(), options.fadeMs ?? 0);
  };

  const releaseAmbientOverride = (
    owner: string,
    options?: { fadeMs?: number }
  ) => {
    if (!ambientOverridesRef.current.delete(owner)) return;
    fadeAmbientTo(effectiveAmbientVolume(), options?.fadeMs ?? 0);
  };

  // A window the player minimized keeps producing sound for a while after it is
  // gone from the taskbar view — it stops on its own; there is no button for it.
  const stopHauntedLoop = useCallback((id: string) => {
    const entry = hauntedLoopsRef.current[id];
    if (!entry) return;
    entry.audio.pause();
    clearTimeout(entry.timer);
    delete hauntedLoopsRef.current[id];
  }, []);

  const playHauntedLoop = useCallback((
    id: string,
    src: string,
    durationMs: number,
    volume = 0.22
  ) => {
    if (hauntedLoopsRef.current[id]) return;
    try {
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = volume * settings.mediaVolume;
      if (!mutedRef.current) audio.play().catch(() => {});
      const timer = setTimeout(() => stopHauntedLoop(id), durationMs);
      hauntedLoopsRef.current[id] = { audio, timer };
    } catch {
      // Audio unavailable in this environment — fail silently.
    }
  }, [settings.mediaVolume, stopHauntedLoop]);

  useEffect(() => {
    if (ambientRef.current) ambientRef.current.volume = effectiveAmbientVolume();
  }, [effectiveAmbientVolume]);

  const value: SoundContextValue = {
    muted,
    toggleMuted: () => setMuted((m) => !m),
    play,
    setAmbientStage,
    pushAmbientOverride,
    releaseAmbientOverride,
    playHauntedLoop,
    stopHauntedLoop,
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
