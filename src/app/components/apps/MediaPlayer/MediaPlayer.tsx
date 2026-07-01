"use client";

import React, { useEffect, useRef, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { files } from "@/app/data/filesystem";
import "../ArgTools/style.scss";
import "./style.scss";
import { puzzleHintsFor } from "@/app/game/puzzles";
import { useI18n } from "@/app/i18n";

type Channel = "stereo" | "left" | "right";

const MediaPlayer = ({ fileId }: { fileId: string }) => {
  const file = files.find((candidate) => candidate.id === fileId);
  const {
    discoverEvidence,
    isPuzzleSolved,
    recordSequenceAction,
    collectReference,
    recordNearMiss,
    state,
  } = useProgress();
  const [channel, setChannel] = useState<Channel>("stereo");
  const [reverse, setReverse] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [properties, setProperties] = useState(false);
  const [nearMissKind, setNearMissKind] = useState<"channel" | "reverse" | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (file?.evidenceId) discoverEvidence(file.evidenceId, file.id);
  }, [discoverEvidence, file]);

  if (!file) return <div className="arg-tool">{t("audioNotFound")}</div>;

  const play = async () => {
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
    if (isPuzzleSolved("future_log") && file.reference) {
      collectReference(file.reference);
    }
  };

  return (
    <div className="arg-tool media-player">
      <div className="arg-tool__menubar">
        <span>{t("menuFile")}</span><span>{t("menuView")}</span><span>{t("menuPlayback")}</span><span>{t("help")}</span>
      </div>
      <div className="arg-tool__toolbar">
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
        <button className="button" onClick={play}>Play</button>
        <button className="button" onClick={showProperties}>{t("propertiesLabel")}</button>
      </div>
      {!recovered && nearMissKind && (
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
      {state.puzzles.counting_audio.hintsUnlocked > 0 && (
        <div className="media-player__cue-note">
          RECOVERED .CUE NOTE:{" "}
          {
            puzzleHintsFor(state.locale, "counting_audio")[
              state.puzzles.counting_audio.hintsUnlocked - 1
            ]
          }
        </div>
      )}
      <div className="arg-tool__content media-player__screen">
        <div className="media-player__display">
          <p>counting.wav</p>
          <strong>04:11</strong>
          <div className={`media-player__wave ${recovered ? "recovered" : ""}`}>
            {Array.from({ length: 42 }).map((_, index) => <i key={index} />)}
          </div>
          <audio ref={audioRef} controls preload="metadata" src={file.content} />
        </div>
        {recovered && (
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
        {properties && (
          <div className="media-player__properties">
            <dl className="arg-tool__properties">
              <dt>DOS alias</dt><dd>{file.alias}</dd>
              <dt>Duration</dt><dd>04:11</dd>
              <dt>Channels</dt><dd>2 / phase conflict</dd>
              <dt>Modified</dt><dd>{file.modified}</dd>
            </dl>
            {isPuzzleSolved("future_log") && (
              <div className="arg-tool__reference">CUE REF: {file.reference}</div>
            )}
          </div>
        )}
      </div>
      <div className="arg-tool__status">
        <span>{channel} / {reverse ? "reverse" : "forward"}</span>
        <span>{recovered ? "second voice rendered" : "buffer ready"}</span>
      </div>
    </div>
  );
};

export default MediaPlayer;
