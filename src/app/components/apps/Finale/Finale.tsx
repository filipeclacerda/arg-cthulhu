"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useProgress } from "@/app/context/ProgressContext";
import { useSound } from "@/app/context/SoundContext";
import { resolveTokens, formatGameDate, tomorrow } from "@/app/utils/narrative";
import { TranslationKey, useI18n } from "@/app/i18n";
import "./style.scss";

type FinaleState =
  | "choice"
  | "restore"
  | "shutdown"
  | "seal"
  | "archive_self";
type EchoEnding = "restore" | "shutdown" | "seal";

const pad2 = (value: number) => String(value).padStart(2, "0");

const Finale = () => {
  const { chooseEnding, playerName, hasFlag, state, setFlag } = useProgress();
  const { play } = useSound();
  const { t, locale } = useI18n();
  const [screen, setScreen] = useState<FinaleState>("choice");

  // The open field is recorded the moment it is seen. Walking away from it
  // (closing the window, the tab, the day) is itself an answer — committed
  // on the next return, in ProgressContext, as ending_leave_blank.
  useEffect(() => {
    setFlag("finale_choice_seen");
  }, [setFlag]);

  const ctx = { playerName };
  const tomorrowStr = formatGameDate(tomorrow());
  const liveQuestion =
    state.playerChoices.find((choice) => choice.choiceId === "sarah_live_question")
      ?.optionId ?? "default";
  const archiveSelfAvailable =
    hasFlag("secret_ending_available") &&
    state.discoveredEvidenceIds.includes("hash_manifest") &&
    liveQuestion === "break";
  const echoKey = (ending: EchoEnding): TranslationKey => {
    const suffix =
      liveQuestion === "alive"
        ? "Alive"
        : liveQuestion === "restore"
          ? "Restore"
          : liveQuestion === "break"
            ? "Break"
            : null;
    return suffix
      ? (`finaleEcho${ending[0].toUpperCase()}${ending.slice(1)}${suffix}` as TranslationKey)
      : "finaleEchoDefault";
  };

  const handleRestore = () => {
    chooseEnding("restore");
    play("chime");
    setScreen("restore");
  };

  const handleShutdown = () => {
    chooseEnding("shutdown");
    play("glitch");
    setScreen("shutdown");
  };

  const handleSeal = () => {
    chooseEnding("seal");
    play("glitch");
    setScreen("seal");
  };

  const handleArchiveSelf = () => {
    chooseEnding("archive_self");
    play("glitch");
    setScreen("archive_self");
  };

  if (screen === "restore") {
    return (
      <div className="finale finale--restore">
        <div className="finale-terminal">
          <pre>{resolveTokens(t("finaleRestoreTerminal"), ctx)}</pre>
        </div>
        <p className="finale-caption">
          {t("finaleRestoreCaption")} {tomorrowStr}.
        </p>
        <p className="finale-caption">{t(echoKey("restore"))}</p>
      </div>
    );
  }

  if (screen === "shutdown") {
    const shutdownScreen = (
      <div
        className="finale-shutdown-screen"
        role="dialog"
        aria-modal="true"
        aria-label={t("finaleShutdownCaption")}
      >
        <div className="finale-shutdown-screen__glow" aria-hidden="true" />
        <section className="finale-shutdown-panel">
          <div className="finale-shutdown-terminal" aria-hidden="true">
            <p>{t("finaleShutdownTerminalTitle")}</p>
            <pre>{t("finaleShutdownTerminal")}</pre>
          </div>
          <article className="finale-shutdown-mail">
            <div className="finale-shutdown-mail__titlebar">
              <span>{t("finaleShutdownInboxTitle")}</span>
              <span>{tomorrowStr}</span>
            </div>
            <dl className="finale-shutdown-mail__meta">
              <dt>{t("fromLabel")}</dt>
              <dd>sarah.bishop@miskatonic-research.org</dd>
              <dt>{t("subjectLabel")}</dt>
              <dd>{t("finaleShutdownInboxSubject")}</dd>
            </dl>
            <pre>{resolveTokens(t("finaleShutdownInboxBody"), ctx)}</pre>
            <p>{t(echoKey("shutdown"))}</p>
          </article>
        </section>
      </div>
    );
    return typeof document === "undefined"
      ? null
      : createPortal(shutdownScreen, document.body);
  }

  if (screen === "seal") {
    return (
      <div className="finale finale--seal">
        <div className="finale-terminal">
          <pre>{locale === "pt-BR"
            ? `INDEX /SEAL RELAY-07 /WITNESS ARCHIVE

FONTE ............ NÃO RESOLVIDA
ARQUIVO .......... SB-0316
TESTEMUNHA ....... SB-0316

RELAY 07 NÃO POSSUI MAIS UM CAMPO VAZIO.
RELAY 07 NÃO POSSUI MAIS UM CAMPO EXTERNO.

CHECKSUM: 7A:11:07
CHECKSUM: 7A:11:08

NENHUMA OPERAÇÃO DE ESCRITA FOI REGISTRADA.`
            : `INDEX /SEAL RELAY-07 /WITNESS ARCHIVE

SOURCE ........... UNRESOLVED
ARCHIVE .......... SB-0316
WITNESS .......... SB-0316

RELAY 07 NO LONGER HAS AN EMPTY FIELD.
RELAY 07 NO LONGER HAS AN OUTSIDE FIELD.

CHECKSUM: 7A:11:07
CHECKSUM: 7A:11:08

NO WRITE OPERATION WAS RECORDED.`}</pre>
        </div>
        <p className="finale-caption">
          {t("finaleSealCaption")}
        </p>
        <p className="finale-caption">{t(echoKey("seal"))}</p>
      </div>
    );
  }

  if (screen === "archive_self") {
    return (
      <div className="finale finale--seal">
        <div className="finale-terminal">
          <pre>{resolveTokens(t("finaleArchiveSelfTerminal"), ctx)}</pre>
        </div>
        <p className="finale-caption">{t("finaleArchiveSelfCaption")}</p>
      </div>
    );
  }

  // Default: the choice. The observer's own conduct is part of the record.
  const firstOpened = new Date(state.createdAt);
  const observedMs = Object.values(state.puzzles).reduce(
    (total, puzzle) => total + puzzle.activeMs,
    0
  );
  const observedHours = Math.floor(observedMs / 3600000);
  const observedMinutes = Math.floor((observedMs % 3600000) / 60000);
  const witnessBlock =
    locale === "pt-BR"
      ? `\n\nTESTEMUNHA ........ ${playerName ?? "USUÁRIO SEGUINTE"}\nPRIMEIRA ABERTURA . ${firstOpened.getFullYear()}-${pad2(firstOpened.getMonth() + 1)}-${pad2(firstOpened.getDate())} ${pad2(firstOpened.getHours())}:${pad2(firstOpened.getMinutes())}\nOBSERVAÇÃO ........ ${observedHours} H ${pad2(observedMinutes)} MIN`
      : `\n\nWITNESS ........... ${playerName ?? "NEXT USER"}\nFIRST OPENED ...... ${firstOpened.getFullYear()}-${pad2(firstOpened.getMonth() + 1)}-${pad2(firstOpened.getDate())} ${pad2(firstOpened.getHours())}:${pad2(firstOpened.getMinutes())}\nOBSERVATION ....... ${observedHours} H ${pad2(observedMinutes)} MIN`;

  return (
    <div className="finale">
      <div className="finale-terminal">
        <pre>{resolveTokens(t("finaleChoiceTerminal"), ctx) + witnessBlock}</pre>
      </div>
      <div className="finale-actions">
        <button
          className="button btn-lg"
          type="button"
          onClick={handleRestore}
        >
          {t("restoreSarahLabel")}
        </button>
        <button
          className="button btn-lg"
          type="button"
          onClick={handleShutdown}
        >
          {t("shutDownChoiceLabel")}
        </button>
        {hasFlag("secret_ending_available") && (
          <button
            className="button btn-lg finale-seal-button"
            type="button"
            onClick={handleSeal}
            title={`${state.insightsUnlocked.length}/6 correlations retained`}
          >
            {locale === "pt-BR" ? "SELAR RELAY" : "SEAL RELAY"}
          </button>
        )}
        {archiveSelfAvailable && (
          <button
            className="button btn-lg finale-seal-button"
            type="button"
            onClick={handleArchiveSelf}
            title="hash_manifest + break reply retained"
          >
            {t("archiveYourselfLabel")}
          </button>
        )}
      </div>
    </div>
  );
};

export default Finale;
