"use client";

import React, { useEffect, useRef, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { useSound } from "@/app/context/SoundContext";
import { files } from "@/app/data/filesystem";
import { localizedTranscript } from "@/app/data/localizedNarrative";
import "../ArgTools/style.scss";
import "./style.scss";
import { puzzleHintsFor } from "@/app/game/puzzles";
import { useI18n } from "@/app/i18n";

type Channel = "stereo" | "left" | "right";
type CallMix = "sum" | "left" | "right";

// Ghost lines for the one-time post_end_transcript set piece. Dry, all-caps
// system voice per the "sting rule" — the memorable line stays reserved for
// human voices (the transcript's own "count names. not days." already used
// that budget). Line 1 only appears if the player paused during playback.
const GHOST_LINES: Record<"en" | "pt-BR", string[]> = {
  en: [
    "THE OBSERVER STOPPED THE RECORDING.",
    "THE OBSERVER IS STILL WATCHING.",
    "DO NOT CLOSE THE WINDOW.",
  ],
  "pt-BR": [
    "O OBSERVADOR PAROU A GRAVAÇÃO.",
    "O OBSERVADOR AINDA ESTÁ OLHANDO.",
    "NÃO FECHE A JANELA.",
  ],
};

const GHOST_LINE_INTERVAL_MS = 2700;
const GHOST_LINE_START_DELAY_MS = 400;
// The haunted loop needs to outlast the whole overtime sequence (three lines
// plus the ~5s of silence after) even if the player leaves the window open,
// and keep going for a while if they close it mid-sequence.
const SET_PIECE_LOOP_MS = 60_000;
const DEFAULT_LOOP_MS = 45_000;
const RECORDING_END_SECONDS = 4 * 60 + 11; // 04:11
const OVERTIME_CAP_SECONDS = 30;

const formatClock = (totalSeconds: number) => {
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

const MediaPlayer = ({ fileId }: { fileId: string }) => {
  const file = files.find((candidate) => candidate.id === fileId);
  const {
    discoverEvidence,
    markFileRead,
    isPuzzleSolved,
    recordSequenceAction,
    collectReference,
    recordNearMiss,
    state,
    dispatchGameEvent,
    setFlag,
  } = useProgress();
  const { playHauntedLoop } = useSound();
  const [channel, setChannel] = useState<Channel>("stereo");
  const [reverse, setReverse] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [properties, setProperties] = useState(false);
  const [nearMissKind, setNearMissKind] = useState<"channel" | "reverse" | null>(null);
  const [callMix, setCallMix] = useState<CallMix>("left");
  const [invertRight, setInvertRight] = useState(false);
  const [callAttempted, setCallAttempted] = useState(false);
  // Set piece (Part 1): only ever true during the one playthrough that
  // triggers it — never reconstructed from worldReactionsSeen on mount, so
  // reopening the file later never replays it.
  const [postEndActive, setPostEndActive] = useState(false);
  const [ghostLines, setGhostLines] = useState<string[]>([]);
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pausedDuringPlaybackRef = useRef(false);
  const ghostTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const overtimeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!file) return;
    if (file.evidenceId) discoverEvidence(file.evidenceId, file.id);
    markFileRead(file.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.id]);

  useEffect(() => {
    const timeoutRef = ghostTimeoutsRef;
    const intervalRef = overtimeIntervalRef;
    return () => {
      timeoutRef.current.forEach(clearTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!file) return <div className="arg-tool">{t("audioNotFound")}</div>;

  // counting.wav is the only track with the Channel/Reverse puzzle controls;
  // every other audio artifact (the voicemail included) is plain playback.
  const isPuzzleTrack = file.id === "counting_audio";
  const isSilentCall = file.id === "silent_call";
  const silentCallSolved = Boolean(state.flags.silent_call_solved);

  const startSetPiece = () => {
    setPostEndActive(true);
    setGhostLines([]);
    setOvertimeSeconds(0);

    overtimeIntervalRef.current = setInterval(() => {
      setOvertimeSeconds((value) => {
        if (value >= OVERTIME_CAP_SECONDS) {
          if (overtimeIntervalRef.current) clearInterval(overtimeIntervalRef.current);
          return value;
        }
        return value + 1;
      });
    }, 1000);

    const locale = state.locale === "pt-BR" ? "pt-BR" : "en";
    const lines = pausedDuringPlaybackRef.current
      ? GHOST_LINES[locale]
      : GHOST_LINES[locale].slice(1);

    lines.forEach((line, index) => {
      const timeout = setTimeout(() => {
        setGhostLines((current) => [...current, line]);
      }, GHOST_LINE_START_DELAY_MS + index * GHOST_LINE_INTERVAL_MS);
      ghostTimeoutsRef.current.push(timeout);
    });
  };

  const play = async () => {
    if (isSilentCall) {
      const correct = callMix === "sum" && invertRight;
      setCallAttempted(true);
      setRecovered(correct);
      if (correct && !silentCallSolved) {
        setFlag("silent_call_solved");
      }
      if (audioRef.current) {
        audioRef.current.src = correct
          ? "/artifacts/call-without-voice-recovered.wav"
          : file.content;
        audioRef.current.currentTime = 0;
        try {
          await audioRef.current.play();
        } catch {
          // The explicit Play button normally satisfies autoplay policies.
        }
      }
      return;
    }
    if (!isPuzzleTrack) {
      setRecovered(true);
      if (audioRef.current) {
        audioRef.current.src = file.content;
        audioRef.current.currentTime = 0;
        try {
          await audioRef.current.play();
        } catch {
          // Browser autoplay policy may require the player to press the native control.
        }
      }
      return;
    }

    pausedDuringPlaybackRef.current = false;
    const correct = channel === "left" && reverse;
    if (!correct) {
      if (channel === "left") {
        recordNearMiss("counting_audio", "audio_channel");
        setNearMissKind("channel");
      } else if (reverse) {
        recordNearMiss("counting_audio", "audio_reverse");
        setNearMissKind("reverse");
      } else {
        setNearMissKind(null);
      }
    } else {
      setNearMissKind(null);
    }
    setRecovered(correct);
    if (audioRef.current) {
      audioRef.current.src = correct
        ? "/artifacts/counting-recovered.wav"
        : file.content;
      audioRef.current.currentTime = 0;
      try {
        await audioRef.current.play();
      } catch {
        // Browser autoplay policy may require the player to press the native control.
      }
    }
    if (correct && isPuzzleSolved("lineage")) {
      recordSequenceAction("audio:left-reverse");
    }
  };

  const showProperties = () => {
    setProperties((value) => !value);
    if (isPuzzleTrack && isPuzzleSolved("future_log") && file.reference) {
      collectReference(file.reference);
    }
  };

  const handleEnded = () => {
    if (!isPuzzleTrack || !recovered) return;
    if (!state.worldReactionsSeen.includes("post_end_transcript")) {
      // First time only: the set piece replaces the immediate
      // minimized_audio trigger. minimized_audio (and its own haunted loop)
      // still applies exactly as before starting from the *next* correct
      // playthrough, since it hasn't been marked seen yet.
      dispatchGameEvent({ type: "TRIGGER_WORLD_REACTION", reactionId: "post_end_transcript" });
      setFlag("post_end_transcript_seen");
      playHauntedLoop("counting-echo", "/artifacts/counting-recovered.wav", SET_PIECE_LOOP_MS);
      startSetPiece();
      return;
    }
    if (state.worldReactionsSeen.includes("minimized_audio")) return;
    dispatchGameEvent({ type: "TRIGGER_WORLD_REACTION", reactionId: "minimized_audio" });
    // Whether the window stays open or gets minimized, the recovered
    // buffer keeps looping quietly for a while — it does not belong to
    // this window anymore.
    playHauntedLoop("counting-echo", "/artifacts/counting-recovered.wav", DEFAULT_LOOP_MS);
  };

  const overtimeLabel = formatClock(RECORDING_END_SECONDS + overtimeSeconds);

  return (
    <div className="arg-tool media-player">
      <div className="arg-tool__menubar">
        <span>{t("menuFile")}</span><span>{t("menuView")}</span><span>{t("menuPlayback")}</span><span>{t("help")}</span>
      </div>
      <div className="arg-tool__toolbar">
        {isPuzzleTrack && (
          <>
            <label>Channel</label>
            <select value={channel} onChange={(event) => setChannel(event.target.value as Channel)}>
              <option value="stereo">Stereo</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
            <label className="media-player__check">
              <input type="checkbox" checked={reverse} onChange={(event) => setReverse(event.target.checked)} />
              Reverse buffer
            </label>
          </>
        )}
        {isSilentCall && (
          <>
            <label>Mix</label>
            <select value={callMix} onChange={(event) => setCallMix(event.target.value as CallMix)}>
              <option value="sum">SUM L+R</option>
              <option value="left">LEFT ONLY</option>
              <option value="right">RIGHT ONLY</option>
            </select>
            <label className="media-player__check">
              <input
                type="checkbox"
                checked={invertRight}
                onChange={(event) => setInvertRight(event.target.checked)}
              />
              Invert R phase
            </label>
          </>
        )}
        <button className="button" onClick={play}>Play</button>
        <button className="button" onClick={showProperties}>{t("propertiesLabel")}</button>
      </div>
      {isPuzzleTrack && !recovered && nearMissKind && (
        <p className="arg-tool__result arg-tool__warning">
          {nearMissKind === "channel"
            ? state.locale === "pt-BR"
              ? "O canal esquerdo está certo. O buffer ainda precisa ser revertido."
              : "The left channel is right. The buffer still needs to reverse."
            : state.locale === "pt-BR"
              ? "O reverso está certo. Falta escolher o canal esquerdo."
              : "The reverse is right. The channel still needs to be left."}
        </p>
      )}
      {isPuzzleTrack && state.puzzles.counting_audio.hintsUnlocked > 0 && (
        <div className="media-player__cue-note">
          RECOVERED .CUE NOTE:{" "}
          {
            puzzleHintsFor(state.locale, "counting_audio")[
              state.puzzles.counting_audio.hintsUnlocked - 1
            ]
          }
        </div>
      )}
      {isSilentCall && callAttempted && !recovered && (
        <p className="arg-tool__result arg-tool__warning">
          {callMix === "sum" && !invertRight
            ? state.locale === "pt-BR"
              ? "O ruído comum ficou mais forte. Os canais precisam chegar à soma em fases opostas."
              : "The common noise became louder. The channels must reach the sum in opposite phase."
            : invertRight && callMix !== "sum"
              ? state.locale === "pt-BR"
                ? "A fase mudou, mas um canal isolado não possui a diferença."
                : "The phase changed, but one isolated channel does not contain the difference."
              : state.locale === "pt-BR"
                ? "O sinal está presente nos dois canais. Isolar um deles remove a relação."
                : "The signal exists across both channels. Isolating one removes the relation."}
        </p>
      )}
      <div className="arg-tool__content media-player__screen">
        <div className="media-player__display">
          <p>{file.name}</p>
          {isPuzzleTrack && (
            <strong
              className={
                postEndActive && overtimeSeconds > 0
                  ? "media-player__timer--overtime"
                  : undefined
              }
            >
              {overtimeLabel}
            </strong>
          )}
          <div className={`media-player__wave ${recovered ? "recovered" : ""}`}>
            {isPuzzleTrack && <span className="media-player__channel-label">L</span>}
            {Array.from({ length: 42 }).map((_, index) => <i key={index} />)}
            {isPuzzleTrack && <span className="media-player__cue-marker">4:11</span>}
          </div>
          {isPuzzleTrack && (
            <div className="media-player__channel-meter">
              <span className={channel === "left" ? "active" : ""}>LEFT / VOICE</span>
              <span className={channel === "right" ? "active" : ""}>RIGHT / ANSWER</span>
            </div>
          )}
          <audio
            ref={audioRef}
            controls
            preload="metadata"
            src={file.content}
            onPause={() => {
              if (audioRef.current && !audioRef.current.ended) {
                pausedDuringPlaybackRef.current = true;
              }
            }}
            onEnded={handleEnded}
          />
        </div>
        {isPuzzleTrack && recovered && (
          <div className="media-player__transcript">
            <p>
              {state.locale === "pt-BR"
                ? "SEGUNDA VOZ / BUFFER RECONSTRUÍDO"
                : "SECOND VOICE / BUFFER RECONSTRUCTED"}
            </p>
            <code>
              {state.locale === "pt-BR"
                ? "UM-DOIS / DOIS-DOIS / TRÊS-UM / QUATRO-SEIS / CINCO-QUATRO / SEIS-CINCO / SETE-DOIS / OITO-DOIS / NOVE-DOIS"
                : "ONE-TWO / TWO-TWO / THREE-ONE / FOUR-SIX / FIVE-FOUR / SIX-FIVE / SEVEN-TWO / EIGHT-TWO / NINE-TWO"}
            </code>
            <p>
              {state.locale === "pt-BR"
                ? "conte nomes. não dias."
                : "count names. not days."}
            </p>
            <small>
              {state.locale === "pt-BR"
                ? "O medidor ainda registra uma resposta curta no canal direito."
                : "The meter still records a brief answer in the right channel."}
            </small>
          </div>
        )}
        {isSilentCall && recovered && (
          <div className="media-player__transcript media-player__transcript--silent-call">
            <p>{state.locale === "pt-BR" ? "DIFERENÇA DE CANAIS RECUPERADA" : "CHANNEL DIFFERENCE RECOVERED"}</p>
            <pre>
              {state.locale === "pt-BR"
                ? "BISHOP [?]: você consegue me ouvir antes de eu gravar isto?\n\nBISHOP [?]: não restaure tudo. deixe uma coisa sem resposta."
                : "BISHOP [?]: can you hear me before I record this?\n\nBISHOP [?]: do not restore all of it. leave one thing unanswered."}
            </pre>
            <small>
              {state.locale === "pt-BR"
                ? "DO_NOT_COMPLETE.NFO recuperado no diretório sem proprietário."
                : "DO_NOT_COMPLETE.NFO recovered under the ownerless directory."}
            </small>
          </div>
        )}
        {!isPuzzleTrack && !isSilentCall && recovered && file.transcript && (
          <div className="media-player__transcript media-player__transcript--voicemail">
            <p>
              {state.locale === "pt-BR"
                ? "TRANSCRIÇÃO DIEGÉTICA"
                : "DIEGETIC TRANSCRIPT"}
            </p>
            <pre>{localizedTranscript(file.id, file.transcript, state.locale)}</pre>
          </div>
        )}
        {postEndActive && (
          <div
            className="media-player__ghost-transcript"
            role="status"
            aria-live="polite"
          >
            {ghostLines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
            <span className="media-player__ghost-cursor" aria-hidden="true" />
          </div>
        )}
        {properties && (
          <div className="media-player__properties">
            <dl className="arg-tool__properties">
              <dt>DOS alias</dt><dd>{file.alias}</dd>
              {isPuzzleTrack ? (
                <>
                  <dt>Duration</dt><dd>04:11</dd>
                  <dt>Channels</dt><dd>2 / phase conflict</dd>
                  {isPuzzleSolved("future_log") && (
                    <>
                      <dt>VOICE 1</dt><dd>S. BISHOP</dd>
                      <dt>VOICE 2</dt><dd>{t("voiceTwoMiriamMatch")}</dd>
                    </>
                  )}
                </>
              ) : isSilentCall ? (
                <>
                  <dt>Duration</dt><dd>00:18</dd>
                  <dt>Channels</dt><dd>2 / common signal 99.2%</dd>
                  <dt>Route</dt><dd>[none]</dd>
                  <dt>Recorded</dt><dd>{file.modified}</dd>
                </>
              ) : (
                file.modified && (
                  <>
                    <dt>Modified</dt><dd>{file.modified}</dd>
                  </>
                )
              )}
            </dl>
            {isPuzzleTrack && isPuzzleSolved("future_log") && (
              <div className="arg-tool__reference">CUE REF: {file.reference}</div>
            )}
          </div>
        )}
      </div>
      <div className="arg-tool__status">
        {isPuzzleTrack ? (
          <span>{channel} / {reverse ? "reverse" : "forward"}</span>
        ) : isSilentCall ? (
          <span>{callMix} / right phase {invertRight ? "inverted" : "normal"}</span>
        ) : (
          <span>&nbsp;</span>
        )}
        <span>
          {isPuzzleTrack
            ? recovered ? "second voice rendered" : "buffer ready"
            : isSilentCall
              ? recovered ? "channel difference rendered" : "no voice detected"
            : recovered ? "played" : "buffer ready"}
        </span>
      </div>
    </div>
  );
};

export default MediaPlayer;
