export interface ComfortSettings {
  reducedMotion: boolean;
  reducedFlicker: boolean;
  highContrast: boolean;
  ambientVolume: number;
  effectsVolume: number;
  mediaVolume: number;
}

export const defaultComfortSettings: ComfortSettings = {
  reducedMotion: false,
  reducedFlicker: false,
  highContrast: false,
  ambientVolume: 1,
  effectsVolume: 1,
  mediaVolume: 1,
};

export const shouldActivateDesktopItem = (key: string) => key === "Enter" || key === " ";

export const clampWindowPosition = (
  position: { x: number; y: number },
  windowSize: { width: number; height: number },
  desktopSize: { width: number; height: number }
) => ({
  x: Math.max(0, Math.min(position.x, Math.max(0, desktopSize.width - windowSize.width))),
  y: Math.max(0, Math.min(position.y, Math.max(0, desktopSize.height - windowSize.height))),
});
