"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useProgress } from "@/app/context/ProgressContext";
import { useSound } from "@/app/context/SoundContext";
import { resolveTokens, formatGameDate, tomorrow } from "@/app/utils/narrative";
import { TranslationKey, useI18n } from "@/app/i18n";
import { completedOptionalMissionCount } from "@/app/game/optionalMissions";
import { desktopModeFromSearch } from "@/app/game/endingLifecycle";
import { selectInitialFinalePresentation } from "@/app/game/finalePresentation";
import "./style.scss";

type FinaleScreen =
  | "intro"
  | "identity"
  | "choice"
  | "restore_confirm"
  | "shutdown_confirm"
  | "restore"
  | "restore_incomplete"
  | "shutdown"
  | "seal_confirm"
  | "seal"
  | "leave_blank"
  | "archive_self"
  | "closure";
type EchoEnding = "restore" | "shutdown" | "seal";

const pad2 = (value: number) => String(value).padStart(2, "0");

const Finale = ({
  onRequestClose,
  onRequestMinimize,
}: {
  onRequestClose?: () => void;
  onRequestMinimize?: () => void;
}) => {
  const {
    chooseEnding,
    playerName,
    hasFlag,
    markEndingClosureSeen,
    state,
    setFlag,
  } = useProgress();
  const { play } = useSound();
  const { t, locale } = useI18n();
  const [endingReviewMode, setEndingReviewMode] = useState(false);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const takeoverRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [screen, setScreen] = useState<FinaleScreen>(() => {
    const presentation = selectInitialFinalePresentation(state);
    if (presentation.screen === "restore_incomplete") return "restore_incomplete";
    if (presentation.screen === "seal_confirm") return "seal_confirm";
    if (presentation.screen === "coda") {
      if (presentation.ending === "restore") return "restore";
      if (presentation.ending === "shutdown") return "shutdown";
      if (presentation.ending === "seal") return "seal";
      if (presentation.ending === "leave_blank") return "leave_blank";
      if (presentation.ending === "archive_self") return "archive_self";
    }
    return "intro";
  });

  // The choice is the narrative boundary: looking at the mounting screen is
  // not the same as deliberately leaving the canonical record open.
  useEffect(() => {
    if (screen === "choice" && !state.ending) setFlag("finale_choice_seen");
  }, [screen, setFlag, state.ending]);

  useEffect(() => {
    setEndingReviewMode(desktopModeFromSearch(window.location.search) === "ending");
  }, []);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const desktopRoot = document.getElementById("desktop-root");
    document.body.classList.add("finale-takeover-active");
    desktopRoot?.setAttribute("inert", "");
    return () => {
      document.body.classList.remove("finale-takeover-active");
      desktopRoot?.removeAttribute("inert");
      previousFocusRef.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => primaryActionRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [screen]);

  useEffect(() => {
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !state.ending) {
        onRequestClose?.();
        return;
      }
      if (event.key !== "Tab" || !takeoverRef.current) return;
      const targets = Array.from(
        takeoverRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.offsetParent !== null);
      if (!targets.length) return;
      const current = document.activeElement as HTMLElement | null;
      const index = targets.indexOf(current ?? targets[0]);
      event.preventDefault();
      const nextIndex = index === -1
        ? (event.shiftKey ? targets.length - 1 : 0)
        : (index + (event.shiftKey ? -1 : 1) + targets.length) % targets.length;
      targets[nextIndex].focus();
    };
    window.addEventListener("keydown", trapFocus);
    return () => window.removeEventListener("keydown", trapFocus);
  }, [onRequestClose, state.ending]);

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
  const personalCoda = useMemo(() => {
    if (state.readFileIds.includes("fellowship_draft"))
      return locale === "pt-BR"
        ? "O rascunho para Lisboa continua marcado como não enviado."
        : "The Lisbon draft remains marked unsent.";
    if (state.readFileIds.includes("voicemail_to_em"))
      return locale === "pt-BR"
        ? "A gravação termina antes de Sarah chegar ao ônibus."
        : "The recording ends before Sarah reaches the bus.";
    if (state.readFileIds.includes("dad_recipe"))
      return locale === "pt-BR"
        ? "A receita do pai ainda pede uma ligação de vinte minutos."
        : "Her father's recipe still asks for a twenty-minute call.";
    return null;
  }, [locale, state.readFileIds]);

  const recordedEndingKey = (): TranslationKey => {
    if (hasFlag("ending_restore_incomplete")) return "finaleEndingRestoreIncomplete";
    switch (state.ending) {
      case "restore": return "finaleEndingRestore";
      case "shutdown": return "finaleEndingShutdown";
      case "seal": return "finaleEndingSeal";
      case "leave_blank": return "finaleEndingLeaveBlank";
      case "archive_self": return "finaleEndingArchiveSelf";
      default: return "finaleEndingRestore";
    }
  };

  const completeRecord = () => {
    play("chime");
    setScreen("closure");
  };
  const returnToRelay = () => {
    markEndingClosureSeen();
    window.setTimeout(() => window.location.assign("/"), 0);
  };
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

  const codaActions = (
    <div className="finale-takeover__actions finale-takeover__actions--coda">
      {endingReviewMode && <p className="finale-takeover__readonly">{t("finaleEndingReadonly")}</p>}
      <button ref={primaryActionRef} className="button btn-lg" type="button" onClick={completeRecord}>
        {t("finaleCompleteRecord")}
      </button>
    </div>
  );

  const witnessBlock = () => {
    const firstOpened = new Date(state.createdAt);
    const observedMs = Object.values(state.puzzles).reduce((total, puzzle) => total + puzzle.activeMs, 0);
    const omissions = completedOptionalMissionCount(state.optionalDiscoveries);
    return locale === "pt-BR"
      ? `\n\nTESTEMUNHA ........ ${playerName ?? "USUÁRIO SEGUINTE"}\nPRIMEIRA ABERTURA . ${firstOpened.getFullYear()}-${pad2(firstOpened.getMonth() + 1)}-${pad2(firstOpened.getDate())} ${pad2(firstOpened.getHours())}:${pad2(firstOpened.getMinutes())}\nOBSERVAÇÃO ........ ${Math.floor(observedMs / 3600000)} H ${pad2(Math.floor((observedMs % 3600000) / 60000))} MIN\nOMISSÕES RETIDAS .. ${omissions}/3`
      : `\n\nWITNESS ........... ${playerName ?? "NEXT USER"}\nFIRST OPENED ...... ${firstOpened.getFullYear()}-${pad2(firstOpened.getMonth() + 1)}-${pad2(firstOpened.getDate())} ${pad2(firstOpened.getHours())}:${pad2(firstOpened.getMinutes())}\nOBSERVATION ....... ${Math.floor(observedMs / 3600000)} H ${pad2(Math.floor((observedMs % 3600000) / 60000))} MIN\nOMISSIONS RETAINED  ${omissions}/3`;
  };

  let content: React.ReactNode;
  if (screen === "intro") {
    content = <>
      <p className="finale-takeover__step">01 / 03 — {locale === "pt-BR" ? "MONTANDO ÍNDICE RECUPERADO" : "MOUNTING RECOVERED INDEX"}</p>
      <pre className="finale-takeover__terminal">{locale === "pt-BR"
        ? "RELAY-07 / IMAGEM MONTADA\n\n4 REFERÊNCIAS RECONHECIDAS\n3 DESTINATÁRIOS ENCERRADOS\n1 CAMPO AINDA ATIVO\n\nSINCRONIZAÇÃO DO DESKTOP INTERROMPIDA."
        : "RELAY-07 / IMAGE MOUNTED\n\n4 REFERENCES ACKNOWLEDGED\n3 RECIPIENTS CLOSED\n1 FIELD STILL ACTIVE\n\nDESKTOP SYNCHRONIZATION INTERRUPTED."}</pre>
      <div className="finale-takeover__actions"><button ref={primaryActionRef} className="button btn-lg" onClick={() => { play("future"); setScreen("identity"); }}>{locale === "pt-BR" ? "CONTINUAR" : "CONTINUE"}</button><button className="button" onClick={() => setScreen("choice")}>{locale === "pt-BR" ? "PULAR ANIMAÇÃO" : "SKIP ANIMATION"}</button></div>
    </>;
  } else if (screen === "identity") {
    content = <>
      <p className="finale-takeover__step">02 / 03 — {locale === "pt-BR" ? "COLISÃO DE IDENTIDADE" : "IDENTITY COLLISION"}</p>
      <pre className="finale-takeover__terminal finale-takeover__terminal--collision">{locale === "pt-BR"
        ? `REGISTRO DE ORIGEM ... SARAH BISHOP\nTESTEMUNHA ........ ${playerName ?? "USUÁRIO SEGUINTE"}\n\nNENHUMA ENTRADA PODE SER DESCARTADA.\nSELECIONE UM REGISTRO CANÔNICO.`
        : `SOURCE RECORD ........ SARAH BISHOP\nWITNESS .............. ${playerName ?? "NEXT USER"}\n\nNO ENTRY MAY BE DISCARDED.\nSELECT A CANONICAL RECORD.`}</pre>
      <div className="finale-takeover__actions"><button ref={primaryActionRef} className="button btn-lg" onClick={() => setScreen("choice")}>{locale === "pt-BR" ? "ABRIR REGISTRO" : "OPEN RECORD"}</button></div>
    </>;
  } else if (screen === "choice") {
    content = <>
      <p className="finale-takeover__step">03 / 03 — {locale === "pt-BR" ? "SELECIONAR REGISTRO CANÔNICO" : "SELECT CANONICAL RECORD"}</p>
      <pre className="finale-takeover__terminal finale-takeover__terminal--collision">{resolveTokens(t("finaleChoiceTerminal"), ctx) + witnessBlock()}</pre>
      <div className="finale-takeover__actions"><button ref={primaryActionRef} className="button btn-lg finale-takeover__restore" onClick={() => setScreen("restore_confirm")}>{t("restoreSarahLabel")}</button><button className="button btn-lg finale-takeover__shutdown" onClick={() => setScreen("shutdown_confirm")}>{t("shutDownChoiceLabel")}</button></div>
    </>;
  } else if (screen === "restore_confirm") {
    content = <><p className="finale-takeover__step">CONFIRMAÇÃO NECESSÁRIA</p><pre className="finale-takeover__terminal">{locale === "pt-BR" ? "INDEX /RESTORE S.BISHOP\n\nA OPERAÇÃO OCUPARÁ UM REGISTRO CANÔNICO.\nCONFIRMAR GRAVAÇÃO?" : "INDEX /RESTORE S.BISHOP\n\nTHIS OPERATION WILL OCCUPY ONE CANONICAL RECORD.\nCONFIRM WRITE?"}</pre><div className="finale-takeover__actions"><button ref={primaryActionRef} className="button btn-lg finale-takeover__restore" onClick={handleRestore}>{locale === "pt-BR" ? "CONCLUIR REGISTRO" : "COMPLETE RECORD"}</button>{incompleteRestoreAvailable && <button className="button" onClick={handleIncompleteRestore}>{locale === "pt-BR" ? "PRESERVAR CAMPO INCOMPLETO" : "PRESERVE INCOMPLETE FIELD"}</button>}<button className="button" onClick={() => setScreen("choice")}>{t("back")}</button></div></>;
  } else if (screen === "shutdown_confirm") {
    content = <><p className="finale-takeover__step">CONFIRMAÇÃO NECESSÁRIA</p><pre className="finale-takeover__terminal">{locale === "pt-BR" ? "SHUT DOWN RELAY-07\n\nSARAH BISHOP NÃO SERÁ RESTAURADA.\nO PRÓXIMO CAMPO CONTINUARÁ ABERTO.\n\nCONFIRMAR DESLIGAMENTO?" : "SHUT DOWN RELAY-07\n\nSARAH BISHOP WILL NOT BE RESTORED.\nTHE NEXT FIELD WILL REMAIN OPEN.\n\nCONFIRM SHUTDOWN?"}</pre><div className="finale-takeover__actions"><button ref={primaryActionRef} className="button btn-lg finale-takeover__shutdown" onClick={handleShutdown}>{t("shutDownChoiceLabel")}</button><button className="button" onClick={() => setScreen("choice")}>{t("back")}</button></div></>;
  } else if (screen === "seal_confirm") {
    content = <><p className="finale-takeover__step">RELAY EXTERNO DETECTADO</p><pre className="finale-takeover__terminal finale-takeover__terminal--seal">{locale === "pt-BR" ? "INDEX /SEAL RELAY-07 /WITNESS ARCHIVE\n\nUM CAMPO EXTERNO SERÁ REMOVIDO.\nNENHUMA OPERAÇÃO É REVERSÍVEL." : "INDEX /SEAL RELAY-07 /WITNESS ARCHIVE\n\nONE OUTSIDE FIELD WILL BE REMOVED.\nNO OPERATION IS REVERSIBLE."}</pre><div className="finale-takeover__actions"><button ref={primaryActionRef} className="button btn-lg finale-takeover__seal" onClick={handleSeal}>{locale === "pt-BR" ? "SELAR RELAY" : "SEAL RELAY"}</button>{archiveSelfAvailable && <button className="button btn-lg finale-takeover__seal" onClick={handleArchiveSelf}>{t("archiveYourselfLabel")}</button>}</div></>;
  } else if (screen === "restore" || screen === "restore_incomplete") {
    const incomplete = screen === "restore_incomplete";
    const terminal = incomplete
      ? locale === "pt-BR" ? `INDEX /RESTORE S.BISHOP /INCOMPLETE\n\nREGISTROS DE ORIGEM ... 3\nCAMPOS GRAVADOS ....... 6\nCAMPO 04 .............. RETIDO\n\nSARAH BISHOP .......... PRESENT\nSARAH BISHOP .......... INCOMPLETE\nDESTINATÁRIO ATIVO .... [não resolvido]` : `INDEX /RESTORE S.BISHOP /INCOMPLETE\n\nSOURCE RECORDS ........ 3\nFIELDS WRITTEN ........ 6\nFIELD 04 .............. WITHHELD\n\nSARAH BISHOP .......... PRESENT\nSARAH BISHOP .......... INCOMPLETE\nACTIVE RECIPIENT ...... [unresolved]`
      : resolveTokens(t("finaleRestoreTerminal"), ctx);
    content = <><p className="finale-takeover__step">REGISTRO RESTAURADO</p><pre className="finale-takeover__terminal finale-takeover__terminal--restore">{terminal}</pre><p className="finale-takeover__caption">{incomplete ? (locale === "pt-BR" ? `Sarah reaparece às 03:14, mas responde primeiro “${playerName?.trim() || "PRÓXIMO USUÁRIO"}”.` : `Sarah reappears at 03:14, but answers “${playerName?.trim() || "NEXT USER"}” first.`) : `${t("finaleRestoreCaption")} ${tomorrowStr}.`}</p><p className="finale-takeover__caption">{t(echoKey("restore"))}</p>{personalCoda && <p className="finale-takeover__caption">{personalCoda}</p>}{codaActions}</>;
  } else if (screen === "shutdown") {
    content = <><p className="finale-takeover__step">RELAY-07 DESLIGADO</p><pre className="finale-takeover__terminal finale-takeover__terminal--shutdown">{t("finaleShutdownTerminal")}</pre><article className="finale-takeover__mail"><header><span>{t("finaleShutdownInboxTitle")}</span><span>{tomorrowStr}</span></header><dl><dt>{t("fromLabel")}</dt><dd>sarah.bishop@miskatonic-research.org</dd><dt>{t("subjectLabel")}</dt><dd>{t("finaleShutdownInboxSubject")}</dd></dl><pre>{resolveTokens(t("finaleShutdownInboxBody"), ctx)}</pre><p>{t(echoKey("shutdown"))}</p>{personalCoda && <p>{personalCoda}</p>}</article>{codaActions}</>;
  } else if (screen === "seal") {
    content = <><p className="finale-takeover__step">CIRCUITO FECHADO</p><pre className="finale-takeover__terminal finale-takeover__terminal--seal">{locale === "pt-BR" ? "INDEX /SEAL RELAY-07 /WITNESS ARCHIVE\n\nFONTE ............ NÃO RESOLVIDA\nARQUIVO .......... SB-0316\nTESTEMUNHA ....... SB-0316\n\nRELAY 07 NÃO POSSUI MAIS UM CAMPO EXTERNO.\nCHECKSUM: 7A:11:07 → 7A:11:08\n\nNENHUMA OPERAÇÃO DE ESCRITA FOI REGISTRADA." : "INDEX /SEAL RELAY-07 /WITNESS ARCHIVE\n\nSOURCE ........... UNRESOLVED\nARCHIVE .......... SB-0316\nWITNESS .......... SB-0316\n\nRELAY 07 NO LONGER HAS AN OUTSIDE FIELD.\nCHECKSUM: 7A:11:07 → 7A:11:08\n\nNO WRITE OPERATION WAS RECORDED."}</pre><p className="finale-takeover__caption">{t("finaleSealCaption")}</p><p className="finale-takeover__caption">{t(echoKey("seal"))}</p>{personalCoda && <p className="finale-takeover__caption">{personalCoda}</p>}{codaActions}</>;
  } else if (screen === "archive_self") {
    content = <><p className="finale-takeover__step">TESTEMUNHA ARQUIVADA</p><pre className="finale-takeover__terminal finale-takeover__terminal--archive">{resolveTokens(t("finaleArchiveSelfTerminal"), ctx)}</pre><p className="finale-takeover__caption">{t("finaleArchiveSelfCaption")}</p>{codaActions}</>;
  } else if (screen === "leave_blank") {
    content = <><p className="finale-takeover__step">CAMPO RETIDO</p><pre className="finale-takeover__terminal finale-takeover__terminal--blank">{t("finaleLeaveBlankTerminal")}</pre><p className="finale-takeover__caption">{t("finaleLeaveBlankCaption")}</p>{codaActions}</>;
  } else {
    const closureTerminal = t("finaleClosureTerminal").replace("{ENDING}", t(recordedEndingKey()));
    content = <><p className="finale-takeover__step">ARQUIVO ENCERRADO</p><h1>{t("finaleStoryComplete")}</h1><pre className="finale-takeover__terminal finale-takeover__terminal--closure">{closureTerminal}</pre><p className="finale-takeover__caption">{t("finaleClosureLead")}</p><div className="finale-takeover__actions"><button ref={primaryActionRef} className="button btn-lg" onClick={returnToRelay}>{t("finaleReturnToRelay")}</button></div></>;
  }

  if (typeof document === "undefined") return null;
  return createPortal(
    <section
      ref={takeoverRef}
      className={`finale-takeover finale-takeover--${screen}`}
      role="dialog"
      aria-modal="true"
      aria-label="Miskatonic Recovery Indexer"
    >
      <div className="finale-takeover__veil" aria-hidden="true" />
      <header className="finale-takeover__header">
        <span>MISKATONIC RECOVERY INDEXER</span>
        <span>RELAY-07 / SB-0316</span>
        <div className="finale-takeover__window-controls">
          <button type="button" onClick={onRequestMinimize} aria-label={locale === "pt-BR" ? "Minimizar indexador" : "Minimize indexer"}>_</button>
          <button type="button" onClick={onRequestClose} aria-label={locale === "pt-BR" ? "Fechar indexador" : "Close indexer"}>×</button>
        </div>
      </header>
      <main className="finale-takeover__content">{content}</main>
    </section>,
    document.body
  );
};

export default Finale;
