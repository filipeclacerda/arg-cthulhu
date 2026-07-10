"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useProgress } from "@/app/context/ProgressContext";
import { useSound } from "@/app/context/SoundContext";
import { resolveTokens, formatGameDate, tomorrow } from "@/app/utils/narrative";
import { TranslationKey, useI18n } from "@/app/i18n";
import { completedOptionalMissionCount } from "@/app/game/optionalMissions";
import "./style.scss";

type FinaleState =
  | "choice"
  | "restore_confirm"
  | "restore"
  | "restore_incomplete"
  | "shutdown"
  | "seal_confirm"
  | "seal"
  | "leave_blank"
  | "archive_self";
type EchoEnding = "restore" | "shutdown" | "seal";

const pad2 = (value: number) => String(value).padStart(2, "0");

const Finale = () => {
  const { chooseEnding, playerName, hasFlag, state, setFlag } = useProgress();
  const { play } = useSound();
  const { t, locale } = useI18n();
  const [screen, setScreen] = useState<FinaleState>(() => {
    if (hasFlag("ending_restore_incomplete")) return "restore_incomplete";
    if (state.ending === "restore") return "restore";
    if (state.ending === "shutdown") return "shutdown";
    if (state.ending === "seal") return "seal";
    if (state.ending === "leave_blank") return "leave_blank";
    if (state.ending === "archive_self") return "archive_self";
    if (hasFlag("seal_relay_prepared")) return "seal_confirm";
    return "choice";
  });

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
    (liveQuestion === "break" || hasFlag("break_protocol_recovered"));
  const incompleteRestoreAvailable = hasFlag("incomplete_restore_prepared");
  const echoKey = (ending: EchoEnding): TranslationKey => {
    const suffix =
      liveQuestion === "alive"
        ? "Alive"
        : liveQuestion === "restore"
          ? "Restore"
          : liveQuestion === "break"
            ? "Break"
            : liveQuestion === "fourth"
              ? "Fourth"
              : null;
    return suffix
      ? (`finaleEcho${ending[0].toUpperCase()}${ending.slice(1)}${suffix}` as TranslationKey)
      : "finaleEchoDefault";
  };
  const personalCoda = (() => {
    if (state.readFileIds.includes("fellowship_draft")) {
      return locale === "pt-BR"
        ? "O rascunho para Lisboa continua marcado como não enviado."
        : "The Lisbon draft remains marked unsent.";
    }
    if (state.readFileIds.includes("voicemail_to_em")) {
      return locale === "pt-BR"
        ? "A gravação termina antes de Sarah chegar ao ônibus."
        : "The recording ends before Sarah reaches the bus.";
    }
    if (state.readFileIds.includes("dad_recipe")) {
      return locale === "pt-BR"
        ? "A receita do pai ainda pede uma ligação de vinte minutos."
        : "Her father's recipe still asks for a twenty-minute call.";
    }
    return null;
  })();

  const handleRestore = () => {
    setFlag("ending_restore_complete");
    chooseEnding("restore");
    play("chime");
    setScreen("restore");
  };

  const handleShutdown = () => {
    chooseEnding("shutdown");
    play("glitch");
    setScreen("shutdown");
  };

  const handleIncompleteRestore = () => {
    setFlag("ending_restore_incomplete");
    chooseEnding("restore");
    play("future");
    setScreen("restore_incomplete");
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

  if (screen === "restore_confirm") {
    return (
      <div className="finale finale--confirm">
        <div className="finale-terminal">
          <pre>{locale === "pt-BR"
            ? `INDEX /RESTORE S.BISHOP\n\nA operação ocupará um registro canônico.\nCONFIRMAR GRAVAÇÃO?`
            : `INDEX /RESTORE S.BISHOP\n\nThis operation will occupy one canonical record.\nCONFIRM WRITE?`}</pre>
        </div>
        <div className="finale-actions">
          <button className="button btn-lg" type="button" onClick={handleRestore}>
            {locale === "pt-BR" ? "CONCLUIR REGISTRO" : "COMPLETE RECORD"}
          </button>
          {incompleteRestoreAvailable && (
            <button
              className="button btn-lg finale-incomplete-button"
              type="button"
              onClick={handleIncompleteRestore}
            >
              {locale === "pt-BR" ? "PRESERVAR CAMPO INCOMPLETO" : "PRESERVE INCOMPLETE FIELD"}
            </button>
          )}
          <button className="button" type="button" onClick={() => setScreen("choice")}>
            {locale === "pt-BR" ? "VOLTAR" : "BACK"}
          </button>
        </div>
      </div>
    );
  }

  if (screen === "seal_confirm") {
    return (
      <div className="finale finale--confirm">
        <div className="finale-terminal">
          <pre>{locale === "pt-BR"
            ? `INDEX /SEAL RELAY-07 /WITNESS ARCHIVE\n\nUM CAMPO EXTERNO SERÁ REMOVIDO.\nNENHUMA OPERAÇÃO É REVERSÍVEL.`
            : `INDEX /SEAL RELAY-07 /WITNESS ARCHIVE\n\nONE OUTSIDE FIELD WILL BE REMOVED.\nNO OPERATION IS REVERSIBLE.`}</pre>
        </div>
        <div className="finale-actions">
          <button className="button btn-lg finale-seal-button" type="button" onClick={handleSeal}>
            {locale === "pt-BR" ? "SELAR RELAY" : "SEAL RELAY"}
          </button>
          {archiveSelfAvailable && (
            <button className="button btn-lg finale-seal-button" type="button" onClick={handleArchiveSelf}>
              {t("archiveYourselfLabel")}
            </button>
          )}
        </div>
      </div>
    );
  }

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
        {personalCoda && <p className="finale-caption">{personalCoda}</p>}
      </div>
    );
  }

  if (screen === "restore_incomplete") {
    return (
      <div className="finale finale--restore finale--restore-incomplete">
        <div className="finale-terminal">
          <pre>{resolveTokens(
            locale === "pt-BR"
              ? `INDEX /RESTORE S.BISHOP /INCOMPLETE

REGISTROS DE ORIGEM ... 3
CAMPOS ENCONTRADOS .... 7
CAMPOS GRAVADOS ....... 6
CAMPO 04 .............. RETIDO

SARAH BISHOP .......... PRESENT
SARAH BISHOP .......... INCOMPLETE
DESTINATÁRIO ATIVO .... [não resolvido]
CHECKSUM .............. 7A:11:08
CHECKSUM .............. 7A:11:09`
              : `INDEX /RESTORE S.BISHOP /INCOMPLETE

SOURCE RECORDS ........ 3
FIELDS FOUND .......... 7
FIELDS WRITTEN ........ 6
FIELD 04 .............. WITHHELD

SARAH BISHOP .......... PRESENT
SARAH BISHOP .......... INCOMPLETE
ACTIVE RECIPIENT ...... [unresolved]
CHECKSUM .............. 7A:11:08
CHECKSUM .............. 7A:11:09`,
            ctx
          )}</pre>
        </div>
        <p className="finale-caption">
          {locale === "pt-BR"
            ? `Sarah reaparece no escritório às 03:14. Reconhece Em e o pai. Quando perguntam seu nome, responde primeiro “${playerName?.trim() || "PRÓXIMO USUÁRIO"}” e depois se corrige.`
            : `Sarah reappears in the office at 03:14. She recognizes Em and her father. When asked her name, she answers “${playerName?.trim() || "NEXT USER"}” first, then corrects herself.`}
        </p>
        <p className="finale-caption">
          {locale === "pt-BR"
            ? "Seu diretório continua em C:\\USERS, agora com o nome S. BISHOP. As propriedades ainda registram você como proprietário."
            : "Your directory remains under C:\\USERS, now named S. BISHOP. Its properties still list you as owner."}
        </p>
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
            {personalCoda && <p>{personalCoda}</p>}
          </article>
        </section>
      </div>
    );
    return typeof document === "undefined"
      ? null
      : createPortal(shutdownScreen, document.body);
  }

  if (screen === "leave_blank") {
    return (
      <div className="finale finale--seal">
        <div className="finale-terminal">
          <pre>{locale === "pt-BR"
            ? `INDEX /FIELD 04

DISPOSIÇÃO ........ [em branco]
FONTE ............. S. BISHOP
TESTEMUNHA ........ ${playerName?.trim() || "PRÓXIMO USUÁRIO"}
DESTINATÁRIO ...... [não resolvido]

ÚLTIMA ABERTURA ... ${tomorrowStr} 03:16`
            : `INDEX /FIELD 04

DISPOSITION ....... [blank]
SOURCE ............ S. BISHOP
WITNESS ........... ${playerName?.trim() || "NEXT USER"}
RECIPIENT ......... [unresolved]

LAST OPENED ....... ${tomorrowStr} 03:16`}</pre>
        </div>
        <p className="finale-caption">
          {locale === "pt-BR"
            ? "A ausência de uma escolha também foi preservada como registro."
            : "The absence of a choice was also preserved as a record."}
        </p>
      </div>
    );
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
        {personalCoda && <p className="finale-caption">{personalCoda}</p>}
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
  const retainedOmissions = completedOptionalMissionCount(
    state.optionalDiscoveries
  );
  const witnessBlock =
    locale === "pt-BR"
      ? `\n\nTESTEMUNHA ........ ${playerName ?? "USUÁRIO SEGUINTE"}\nPRIMEIRA ABERTURA . ${firstOpened.getFullYear()}-${pad2(firstOpened.getMonth() + 1)}-${pad2(firstOpened.getDate())} ${pad2(firstOpened.getHours())}:${pad2(firstOpened.getMinutes())}\nOBSERVAÇÃO ........ ${observedHours} H ${pad2(observedMinutes)} MIN\nOMISSÕES RETIDAS .. ${retainedOmissions}/3`
      : `\n\nWITNESS ........... ${playerName ?? "NEXT USER"}\nFIRST OPENED ...... ${firstOpened.getFullYear()}-${pad2(firstOpened.getMonth() + 1)}-${pad2(firstOpened.getDate())} ${pad2(firstOpened.getHours())}:${pad2(firstOpened.getMinutes())}\nOBSERVATION ....... ${observedHours} H ${pad2(observedMinutes)} MIN\nOMISSIONS RETAINED  ${retainedOmissions}/3`;

  return (
    <div className="finale">
      <div className="finale-terminal">
        <pre>{resolveTokens(t("finaleChoiceTerminal"), ctx) + witnessBlock}</pre>
      </div>
      <div className="finale-actions">
        <button
          className="button btn-lg"
          type="button"
          onClick={() => setScreen("restore_confirm")}
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
      </div>
    </div>
  );
};

export default Finale;
