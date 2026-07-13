"use client";

import { useEffect, useState } from "react";
import { useProgress } from "../context/ProgressContext";
import { Locale, ProgressStateV4, puzzleAct } from "../game/progress";
import {
  aftermathDesktopHref,
  endingDesktopHref,
  isEndingClosurePending,
  isStoryComplete,
} from "../game/endingLifecycle";
import posthog from "posthog-js";
import { getTelemetryConsent } from "../game/telemetry";
import { copyCaseCode } from "../game/caseCodeClipboard";
import { useI18n } from "../i18n";
import "./page.scss";

const VERIFIED_CREDENTIALS = "sarah.bishop / password";

const BOOT_LINES: Record<Locale, string[]> = {
  en: [
    "ORNE LIBRARY DARK ARCHIVE // RELAY 07",
    "HANDSHAKE ACCEPTED FROM UNLISTED CLIENT",
    "CHECKING CHAIN OF CUSTODY ........ FAILED",
    "CHECKING SOURCE SIGNATURE .... T. ALVAREZ",
    "RECIPIENTS VERIFIED .............. 3",
    "TABLE CHECKSUM ............ MISMATCH",
    "UNALLOCATED ROW ........ NOT INDEXED",
    "SEALED IMAGE SB-0316 FOUND",
  ],
  "pt-BR": [
    "ARQUIVO ESCURO DA BIBLIOTECA ORNE // RELÉ 07",
    "CONEXÃO ACEITA DE CLIENTE NÃO LISTADO",
    "VERIFICANDO CADEIA DE CUSTÓDIA .... FALHOU",
    "VERIFICANDO ASSINATURA DE ORIGEM .. T. ALVAREZ",
    "DESTINATÁRIOS VERIFICADOS ......... 3",
    "CHECKSUM DA TABELA ........ DIVERGE",
    "LINHA NÃO ALOCADA .... NÃO INDEXADA",
    "IMAGEM SELADA SB-0316 ENCONTRADA",
  ],
};

export default function Home() {
  const {
    state,
    isHydrated,
    newCase,
    exportCode,
    previewCode,
    importCode,
    setPlayerName,
    setFlag,
    dispatchGameEvent,
  } = useProgress();
  const { locale, setLocale, t } = useI18n();
  const isPt = locale === "pt-BR";
  const [phase, setPhase] = useState<"sealed" | "mount">("sealed");
  const [visibleLines, setVisibleLines] = useState(0);
  const [observerName, setObserverName] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [caseCode, setCaseCode] = useState("");
  const [casePreview, setCasePreview] = useState<ProgressStateV4 | null>(null);
  const [caseError, setCaseError] = useState("");
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [exportedCode, setExportedCode] = useState("");
  const [exportError, setExportError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    setVisibleLines(0);
    const timer = window.setInterval(() => {
      setVisibleLines((count) => {
        if (count >= BOOT_LINES.en.length) {
          window.clearInterval(timer);
          return count;
        }
        return count + 1;
      });
    }, 125);
    return () => window.clearInterval(timer);
  }, [preferencesReady]);

  useEffect(() => {
    if (isHydrated) setObserverName(state.playerName ?? "");
  }, [isHydrated, state.playerName]);

  useEffect(() => {
    if (!isHydrated) return;
    const consent = getTelemetryConsent();
    setPreferencesReady(true);
  }, [isHydrated]);

  const hasExistingCase =
    Boolean(state.playerName) ||
    state.readFileIds.length > 0 ||
    state.readEmailIds.length > 0 ||
    Object.values(state.puzzles).some((puzzle) => puzzle.solvedAt) ||
    Boolean(state.flags.relay_envelope_opened) ||
    Boolean(state.flags.registration_shown);
  const storyComplete = isStoryComplete(state);
  const endingClosurePending = isEndingClosurePending(state);
  const endingLabel = state.ending
    ? {
        restore: isPt ? "RESTAURAR SARAH" : "RESTORE SARAH",
        shutdown: isPt ? "DESLIGAR" : "SHUT DOWN",
        seal: isPt ? "SELAR RELÉ" : "SEAL RELAY",
        leave_blank: isPt ? "DEIXAR EM BRANCO" : "LEAVE BLANK",
        archive_self: isPt ? "ARQUIVAR OBSERVADOR" : "ARCHIVE OBSERVER",
      }[state.ending]
    : null;

  const mountImage = () => {
    setPlayerName(observerName.trim() || null);
    setFlag("relay_envelope_opened");
    posthog.capture("image_mounted", {
      has_observer_name: Boolean(observerName.trim()),
      is_returning: hasExistingCase,
      act: puzzleAct(state),
    });
    window.location.href = storyComplete ? endingDesktopHref : "/desktop/";
  };

  const exportCompletedCase = async () => {
    try {
      setExportError("");
      setExportedCode(await exportCode());
    } catch {
      setExportError(
        isPt
          ? "Não foi possível exportar o código do caso."
          : "The case code could not be exported."
      );
    }
  };


  if (!hasMounted) {
    return (
      <main className="relay-preflight">
        <section
          className="relay-preflight__panel"
          aria-busy="true"
          aria-live="polite"
        >
          <p className="relay-label">RELAY DISPLAY CONFIGURATION</p>
          <p>CHECKING LOCAL ARCHIVE...</p>
        </section>
      </main>
    );
  }

  if (!isHydrated || !preferencesReady) {
    return (
      <main className="relay-preflight">
        <section className="relay-preflight__panel">
          <p className="relay-label">RELAY DISPLAY CONFIGURATION</p>
          <h1>{t("language")}</h1>
          <div className="relay-preflight__languages">
            <button
              type="button"
              className={locale === "en" ? "active" : ""}
              disabled={!isHydrated}
              onClick={() => setLocale("en")}
            >
              {t("english")}
            </button>
            <button
              type="button"
              className={locale === "pt-BR" ? "active" : ""}
              disabled={!isHydrated}
              onClick={() => setLocale("pt-BR")}
            >
              {t("portuguese")}
            </button>
          </div>
          {!isHydrated && <p>CHECKING LOCAL ARCHIVE...</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="relay-shell">
      <div className="relay-shell__noise" aria-hidden="true" />
      <div className="relay-shell__sigil" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </div>

      <section className="relay-terminal" aria-label="Miskatonic forensic relay">
        <header className="relay-terminal__header">
          <div className="relay-terminal__lamps" aria-hidden="true">
            <span /><span /><span />
          </div>
          <div>
            <strong>
              {isPt
                ? "UNIVERSIDADE MISKATONIC // PERÍCIA DIGITAL"
                : "MISKATONIC UNIVERSITY // DIGITAL FORENSICS"}
            </strong>
            <small>
              {isPt
                ? "NÓ DE RELÉ NÃO AUTORIZADO 07"
                : "UNAUTHORIZED RELAY NODE 07"}
            </small>
          </div>
          <div className="relay-terminal__tools">
            <span className="relay-terminal__date">
              {isPt ? "FILA" : "QUEUE"} {isPt ? "ASSINATURA INVÁLIDA" : "SIGNATURE INVALID"}
            </span>
            <div
              className="relay-terminal__languages"
              role="group"
              aria-label={t("language")}
            >
              <button
                type="button"
                className={locale === "en" ? "active" : ""}
                aria-pressed={locale === "en"}
                onClick={() => setLocale("en")}
              >
                EN
              </button>
              <button
                type="button"
                className={locale === "pt-BR" ? "active" : ""}
                aria-pressed={locale === "pt-BR"}
                onClick={() => setLocale("pt-BR")}
              >
                PT-BR
              </button>
            </div>
          </div>
        </header>

        <div className="relay-terminal__body">
          <aside className="relay-manifest">
            <p className="relay-label">
              {isPt ? "EVIDÊNCIA SELADA" : "SEALED EVIDENCE"}
            </p>
            <h1>SB-0316</h1>
            <dl>
              <dt>{isPt ? "Sujeito" : "Subject"}</dt><dd>BISHOP, SARAH</dd>
              <dt>{isPt ? "Mídia" : "Medium"}</dt><dd>{isPt ? "IMAGEM DE DISCO" : "DISK IMAGE"}</dd>
              <dt>{isPt ? "Origem" : "Source"}</dt><dd>T. ALVAREZ</dd>
              <dt>Status</dt><dd>{storyComplete ? (isPt ? "CASO CONCLUÍDO" : "CASE COMPLETED") : (isPt ? "NÃO RESOLVIDO" : "UNRESOLVED")}</dd>
              {storyComplete && (
                <>
                  <dt>{isPt ? "Final registrado" : "Ending recorded"}</dt>
                  <dd className="relay-unstable">{endingLabel}</dd>
                </>
              )}
              {state.flags.ending_shutdown ? (
                <>
                  <dt>{isPt ? "Destinatários" : "Recipients"}</dt>
                  <dd className="relay-unstable">
                    {isPt
                      ? `5 // 4º ARQUIVADO: ${(state.playerName ?? "USUÁRIO SEGUINTE").toUpperCase()} // 5º: GERANDO`
                      : `5 // 4TH ARCHIVED: ${(state.playerName ?? "NEXT USER").toUpperCase()} // 5TH: GENERATING`}
                  </dd>
                </>
              ) : (
                <>
                  <dt>{isPt ? "Linhas verificadas" : "Verified rows"}</dt><dd>3</dd>
                  <dt>{isPt ? "Tabela" : "Table"}</dt><dd className="relay-unstable">{isPt ? "CHECKSUM DIVERGENTE" : "CHECKSUM MISMATCH"}</dd>
                </>
              )}
              <dt>{isPt ? "Horário" : "Timestamp"}</dt><dd>{isPt ? "NÃO CONFIÁVEL" : "UNRELIABLE"}</dd>
              <dt>Referrer</dt>
              <dd className={phase === "mount" ? "relay-unstable" : ""}>
                {phase === "sealed"
                  ? "miskanet-forums.org/thread/7411"
                  : isPt
                    ? "[REMOVIDO APÓS SOLICITAÇÃO]"
                    : "[PURGED AFTER MOUNT REQUEST]"}
              </dd>
            </dl>
            <div className="relay-boundary">
              {isPt
                ? "Tudo exibido aqui pertence ao envelope do relé. O sistema Windows depois da montagem pertence a Sarah Bishop."
                : "Everything shown here belongs to the relay envelope. The Windows system beyond the mount belongs to Sarah Bishop."}
            </div>
          </aside>

          <div className="relay-console">
            <div className="relay-console__output" aria-live="polite">
              {BOOT_LINES[locale].slice(0, visibleLines).map((line, index) => (
                <p key={line}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {line}
                </p>
              ))}
              <b className="relay-cursor" aria-hidden="true">█</b>
            </div>

            {visibleLines >= BOOT_LINES.en.length && phase === "sealed" && (
              <div className="relay-envelope">
                <p className="relay-label">
                  {isPt
                    ? "ENVELOPE DE UPLOAD // FORA DA IMAGEM"
                    : "UPLOAD ENVELOPE // OUTSIDE DISK IMAGE"}
                </p>
                <blockquote>
                  <p>
                    {isPt
                      ? "Encontrei o computador que pertencia a Sarah Bishop."
                      : "I found the computer that belonged to Sarah Bishop."}
                  </p>
                  <p>
                    {isPt
                      ? "Fiz uma cópia forense antes que o arquivo o recolhesse. Coloquei três colegas na fila. A tabela de entrega não confere com o manifesto."
                      : "I made a forensic copy before the archive took it. I queued it for three colleagues. The delivery table no longer agrees with the manifest."}
                  </p>
                  <p>
                    {isPt
                      ? "Há uma linha que não consigo indexar. Não altere o pacote antes de verificar a cópia."
                      : "There is one row I cannot index. Do not alter the package before you verify the copy."}
                  </p>
                  <footer>— Tom Alvarez</footer>
                </blockquote>
                <button
                  className="relay-command"
                  type="button"
                  onClick={() => {
                    setPhase("mount");
                    dispatchGameEvent({
                      type: "SEE_NARRATIVE_BEAT",
                      beatId: "relay_referrer_lost",
                    });
                  }}
                >
                  [ {isPt ? "ABRIR ANEXO SELADO" : "OPEN SEALED ATTACHMENT"} ]
                </button>
              </div>
            )}

            {phase === "mount" && (
              <div className="relay-mount">
                <div className="relay-warning">
                  <strong>
                    {isPt
                      ? "SESSÃO NÃO LISTADA CRIADA"
                      : "UNLISTED SESSION CREATED"}
                  </strong>
                  <span>
                    {isPt
                      ? "O relé criou uma sessão local não listada. A designação é opcional e fica apenas neste checkpoint."
                      : "The relay created an unlisted local session. A designation is optional and remains in this checkpoint only."}
                  </span>
                </div>

                {storyComplete ? (
                  <div className="relay-envelope" aria-live="polite">
                    <p className="relay-label">
                      {isPt ? "ARQUIVO DO CASO // ENCERRADO" : "CASE ARCHIVE // CLOSED"}
                    </p>
                    <strong>
                      {endingClosurePending
                        ? isPt
                          ? "APRESENTAÇÃO FINAL PENDENTE"
                          : "FINAL PRESENTATION PENDING"
                        : isPt
                          ? "HISTÓRIA CONCLUÍDA"
                          : "STORY COMPLETE"}
                    </strong>
                    <p>
                      {endingClosurePending
                        ? isPt
                          ? "O resultado registrado ainda precisa ser encerrado no terminal do caso."
                          : "The recorded result still needs to be closed from the case terminal."
                        : isPt
                          ? "A investigação principal terminou. Os registros permanecem disponíveis para consulta."
                          : "The main investigation is over. Its records remain available for review."}
                    </p>
                    <div>
                      <button
                        className="relay-command"
                        type="button"
                        onClick={() => {
                          window.location.href = endingDesktopHref;
                        }}
                      >
                        [ {isPt ? "REVER FINAL" : "REVIEW ENDING"} ]
                      </button>
                      {!endingClosurePending && (
                        <button
                          className="relay-command"
                          type="button"
                          onClick={() => {
                            window.location.href = aftermathDesktopHref;
                          }}
                        >
                          [ {isPt ? "EXPLORAR CONSEQUÊNCIAS" : "EXPLORE AFTERMATH"} ]
                        </button>
                      )}
                      <button
                        className="relay-command"
                        type="button"
                        onClick={() => void exportCompletedCase()}
                      >
                        [ {isPt ? "EXPORTAR CÓDIGO DO CASO" : "EXPORT CASE CODE"} ]
                      </button>
                    </div>
                    {exportError && <p className="relay-error">{exportError}</p>}
                    {exportedCode && (
                      <label>
                        {isPt ? "Código portátil do caso" : "Portable case code"}
                        <textarea id="exported-case-code" value={exportedCode} readOnly rows={3} onFocus={(event) => event.currentTarget.select()} />
                        <button type="button" className="relay-inline-command" onClick={async () => {
                          const result = await copyCaseCode(exportedCode);
                          setCopyFeedback(result === "copied" ? (isPt ? "Código copiado." : "Code copied.") : (isPt ? "Não foi possível copiar; o código está selecionado para copiar manualmente." : "Could not copy; the code is selected for manual copying."));
                          if (result !== "copied") document.getElementById("exported-case-code")?.focus();
                        }}>{isPt ? "Copiar código" : "Copy code"}</button>
                        {copyFeedback && <p role="status">{copyFeedback}</p>}
                      </label>
                    )}
                  </div>
                ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    mountImage();
                  }}
                >
                  <label>
                    {isPt ? "Designação da sessão" : "Session designation"}
                    <input
                      value={observerName}
                      onChange={(event) => setObserverName(event.target.value)}
                      placeholder={isPt ? "opcional / armazenado no log" : "optional / stored in access log"}
                    />
                  </label>
                  <div className="relay-credentials" aria-label={isPt ? "Credenciais verificadas" : "Verified credentials"}>
                    <strong>{isPt ? "Credenciais verificadas" : "Verified credentials"}</strong>
                    <code>{VERIFIED_CREDENTIALS}</code>
                  </div>
                  <p className="relay-credential-source">
                    {isPt
                      ? "Credenciais recuperadas do manifesto de Alvarez:"
                      : "Credentials recovered from Alvarez upload manifest:"}
                    {isPt ? "Acesso confirmado no manifesto de upload de Alvarez." : "Access confirmed against Alvarez's upload manifest."}
                  </p>
                  <button className="relay-command" type="submit">
                    [ {hasExistingCase
                      ? isPt ? "CONTINUAR CASO MONTADO" : "CONTINUE MOUNTED CASE"
                      : isPt ? "MONTAR IMAGEM SOMENTE LEITURA" : "MOUNT READ-ONLY IMAGE"} ]
                  </button>
                </form>
                )}

                {isHydrated && (
                  <div className="relay-case-controls">
                    <span>
                      {hasExistingCase
                        ? `LOCAL CHECKPOINT // ${state.playerName || "NEXT USER"} // ACT ${puzzleAct(state)}`
                        : "NO LOCAL CHECKPOINT FOUND"}
                    </span>
                    <div>
                      <button
                        type="button"
                        className="relay-inline-command"
                        onClick={async () => {
                          if (
                            hasExistingCase &&
                            !window.confirm(
                              "Create a new observer session? The current case will be checkpointed."
                            )
                          ) {
                            return;
                          }
                          posthog.capture("new_session_started", {
                            had_existing_case: hasExistingCase,
                            prior_act: puzzleAct(state),
                          });
                          await newCase();
                          setObserverName("");
                        }}
                      >
                        {isPt ? "Nova sessão" : "New session"}
                      </button>
                      <button
                        type="button"
                        className={`relay-inline-command ${showImport ? "active" : ""}`}
                        aria-expanded={showImport}
                        aria-controls="case-code-import"
                        onClick={() => {
                          setShowImport((value) => !value);
                          setCasePreview(null);
                          setCaseError("");
                        }}
                      >
                        {isPt ? "Importar MISK6 / MISK5 / MISK4 / MISK3" : "Import MISK6 / MISK5 / MISK4 / MISK3"}
                      </button>
                    </div>
                  </div>
                )}

                {showImport && (
                  <div className="relay-import" id="case-code-import">
                    <label htmlFor="case-code">Portable case code</label>
                    <textarea
                      id="case-code"
                      value={caseCode}
                      onChange={(event) => {
                        setCaseCode(event.target.value);
                        setCasePreview(null);
                        setCaseError("");
                      }}
                      placeholder="MISK6.payload.checksum"
                    />
                    {caseError && <p className="relay-error">{caseError}</p>}
                    {casePreview && (
                      <p>
                        VERIFIED {"//"} {casePreview.playerName || "NEXT USER"}{" "}
                        {"//"} ACT {puzzleAct(casePreview)} {"//"}{" "}
                        {new Date(casePreview.updatedAt).toLocaleString()}
                      </p>
                    )}
                    <div>
                      {!casePreview ? (
                        <button
                          type="button"
                          className="relay-inline-command relay-inline-command--emphasis"
                          onClick={async () => {
                            try {
                              setCasePreview(await previewCode(caseCode));
                            } catch (error) {
                              setCaseError(
                                error instanceof Error
                                  ? error.message
                                  : "Invalid case code."
                              );
                            }
                          }}
                        >
                          Verify checksum
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="relay-inline-command relay-inline-command--emphasis"
                          onClick={async () => {
                            const imported = await importCode(caseCode);
                            posthog.capture("case_code_imported", {
                              act: puzzleAct(imported),
                            });
                            window.location.href = "/desktop/";
                          }}
                        >
                          Replace and mount
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="relay-terminal__footer">
          <span>{isPt ? "SEM CAMINHO DE RETORNO" : "NO RETURN PATH"}</span>
          <span>{isPt ? "LINHA NÃO ALOCADA: NÃO INDEXADA" : "UNALLOCATED ROW: NOT INDEXED"}</span>
          <span>{isPt ? "INTEGRIDADE DO LINK 07%" : "LINK INTEGRITY 07%"}</span>
        </footer>
      </section>
    </main>
  );
}
