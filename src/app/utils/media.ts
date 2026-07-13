export const preferredAudioSource = (wavSource: string): string => {
  if (typeof document === "undefined") return wavSource;
  const audio = document.createElement("audio");
  return audio.canPlayType("audio/ogg; codecs=vorbis") ? wavSource.replace(/\.wav$/, ".ogg") : wavSource;
};
