"use client";

import React, { useEffect, useRef, useState } from "react";
import { useProgress } from "@/app/context/ProgressContext";
import { files } from "@/app/data/filesystem";
import "../ArgTools/style.scss";
import "./style.scss";

type Channel = "stereo" | "left" | "right";

const MediaPlayer = ({ fileId }: { fileId: string }) => {
  const file = files.find((candidate) => candidate.id === fileId);
  const {
    discoverEvidence,
    isPuzzleSolved,
    recordSequenceAction,
    collectReference,
  } = useProgress();
  const [channel, setChannel] = useState<Channel>("stereo");
  const [reverse, setReverse] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [properties, setProperties] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (file?.evidenceId) discoverEvidence(file.evidenceId, file.id);
  }, [discoverEvidence, file]);

  if (!file) return <div className="arg-tool">Audio not found.</div>;

  const play = async () => {
    const correct = channel === "left" && reverse;
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
        <span>File</span><span>View</span><span>Playback</span><span>Help</span>
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
        <button className="button" onClick={showProperties}>Properties</button>
      </div>
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
            <p>SECOND VOICE / BUFFER RECONSTRUCTED</p>
            <code>
              ONE-TWO / TWO-TWO / THREE-ONE / FOUR-SIX / FIVE-FOUR /
              SIX-FIVE / SEVEN-TWO / EIGHT-TWO / NINE-TWO
            </code>
            <p>count names. not days.</p>
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

