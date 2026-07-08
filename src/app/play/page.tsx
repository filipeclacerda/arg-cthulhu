"use client";

import { useEffect, useState } from "react";
import { useProgress } from "../context/ProgressContext";
import { Locale, ProgressStateV4, puzzleAct } from "../game/progress";
import posthog from "posthog-js";
import {
  captureTelemetry,
  getTelemetryConsent,
  setTelemetryConsent,
  TelemetryConsent,
} from "../game/telemetry";
import { useI18n } from "../i18n";
import { resolveTokens } from "../utils/narrative";
import "./page.scss";

const SARAH_USERNAME = "sarah.bishop";
const SARAH_PASSWORD = "password";

const BOOT_LINES: Record<Locale, string[]> = {
  en: [
    "ORNE LIBRARY DARK ARCHIVE // RELAY 07",
    "HANDSHAKE ACCEPTED FROM UNLISTED OBSERVER",
    "CHECKING CHAIN OF CUSTODY ........ FAILED",
    "CHECKING SOURCE SIGNATURE .... T. ALVAREZ",
    "CHECKING RECIPIENT FIELD ......... [BLANK]",
    "COMPARING SYSTEM CLOCK ........... +24:00:00",
    "SEALED IMAGE SB-0316 FOUND",
  ],
  "pt-BR": [
    "ARQUIVO ESCURO DA BIBLIOTECA ORNE // RELÉ 07",
    "CONEXÃO ACEITA DE OBSERVADOR NÃO LISTADO",
    "VERIFICANDO CADEIA DE CUSTÓDIA .... FALHOU",
    "VERIFICANDO ASSINATURA DE ORIGEM .. T. ALVAREZ",
    "VERIFICANDO DESTINATÁRIO .......... [VAZIO]",
    "COMPARANDO RELÓGIO DO SISTEMA ..... +24:00:00",
    "IMAGEM SELADA SB-0316 ENCONTRADA",
  ],
};

export default function Home() {
  const {
    state,
    isHydrated,
    newCase,
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
  const [username, setUsername] = useState(SARAH_USERNAME);
  const [password, setPassword] = useState(SARAH_PASSWORD);
  const [authError, setAuthError] = useState("");
  const [tomorrowStamp, setTomorrowStamp] = useState("--/--/----");
  const [showImport, setShowImport] = useState(false);
  const [caseCode, setCaseCode] = useState("");
  const [casePreview, setCasePreview] = useState<ProgressStateV4 | null>(null);
  const [caseError, setCaseError] = useState("");
  const [telemetryChoice, setTelemetryChoice] =
    useState<TelemetryConsent>("unknown");
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setTomorrowStamp(resolveTokens("{TOMORROW}"));
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
    setTelemetryChoice(consent);
    if (consent !== "unknown") setPreferencesReady(true);
  }, [isHydrated]);

  const hasExistingCase =
    Boolean(state.playerName) ||
    state.readFileIds.length > 0 ||
    state.readEmailIds.length > 0 ||
    Object.values(state.puzzles).some((puzzle) => puzzle.solvedAt) ||
    Boolean(state.flags.relay_envelope_opened) ||
    Boolean(state.flags.registration_shown);

  const mountImage = () => {
    if (username !== SARAH_USERNAME || password !== SARAH_PASSWORD) {
      setAuthError("ACCESS DENIED // recovered credentials do not match image header");
      return;
    }
    setPlayerName(observerName.trim() || null);
    setFlag("relay_envelope_opened");
    posthog.capture("image_mounted", {
      has_observer_name: Boolean(observerName.trim()),
      is_returning: hasExistingCase,
      act: puzzleAct(state),
    });
    window.location.href = "/desktop/";
  };

  const chooseDiagnostics = (consent: "granted" | "denied") => {
    setTelemetryConsent(consent);
    setTelemetryChoice(consent);
    setPreferencesReady(true);
    if (consent === "granted") {
      posthog.opt_in_capturing();
      captureTelemetry({
        name: "session_start",
        properties: { act: puzzleAct(state), locale },
      });
    } else {
      posthog.opt_out_capturing();
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
          <div className="relay-preflight__privacy">
            <strong>{t("telemetryTitle")}</strong>
            <p>{t("telemetryBody")}</p>
            <small>{t("consentCanChange")}</small>
          </div>
          <div className="relay-preflight__actions">
            <button
              type="button"
              disabled={!isHydrated}
              onClick={() => chooseDiagnostics("denied")}
            >
              {t("telemetryDecline")}
            </button>
            <button
              type="button"
              disabled={!isHydrated}
              onClick={() => chooseDiagnostics("granted")}
            >
              {t("telemetryAccept")}
            </button>
          </div>
          {!isHydrated && <p>CHECKING LOCAL ARCHIVE...</p>}
          {telemetryChoice !== "unknown" && (
            <small>{telemetryChoice}</small>
          )}
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
              {isPt ? "DATA DA FILA" : "QUEUE DATE"} {tomorrowStamp}
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
              <dt>Status</dt><dd>{isPt ? "NÃO RESOLVIDO" : "UNRESOLVED"}</dd>
              <dt>{isPt ? "Destinatário" : "Recipient"}</dt><dd className="relay-unstable">{isPt ? "GERADO AO ABRIR" : "GENERATED AT OPEN"}</dd>
              <dt>{isPt ? "Horário" : "Timestamp"}</dt><dd>{tomorrowStamp}</dd>
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
                      ? "Fiz uma cópia forense antes que o arquivo o recolhesse. Coloquei três colegas na fila. Agora existe um quarto destinatário. Não fui eu que o adicionei."
                      : "I made a forensic copy before the archive took it. I queued it for three colleagues. There is a fourth recipient now. I did not add one."}
                  </p>
                  <p>
                    {isPt
                      ? "O campo está vazio na minha tela. Talvez não esteja vazio quando alguém abrir isto."
                      : "The field is blank on my screen. Maybe it will not be blank when somebody opens this."}
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
                      ? "SESSÃO DE OBSERVADOR CRIADA"
                      : "OBSERVER SESSION CREATED"}
                  </strong>
                  <span>
                    {isPt
                      ? "O relé não possui registro de ter convidado você. Abrir a imagem é a única credencial que ele possui."
                      : "The relay has no record of inviting you. Opening the image is the only credential it has for you."}
                  </span>
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    mountImage();
                  }}
                >
                  <label>
                    {isPt ? "Designação do observador" : "Observer designation"}
                    <input
                      value={observerName}
                      onChange={(event) => setObserverName(event.target.value)}
                      placeholder={isPt ? "opcional / armazenado no log" : "optional / stored in access log"}
                    />
                  </label>
                  <div className="relay-credentials">
                    <label>
                      {isPt ? "Usuário da imagem" : "Image username"}
                      <input
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        autoComplete="off"
                      />
                    </label>
                    <label>
                      {isPt ? "Senha recuperada" : "Recovered password"}
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="off"
                      />
                    </label>
                  </div>
                  <p className="relay-credential-source">
                    {isPt
                      ? "Credenciais recuperadas do manifesto de Alvarez:"
                      : "Credentials recovered from Alvarez upload manifest:"}
                    <code>sarah.bishop / password</code>
                  </p>
                  {authError && <p className="relay-error">{authError}</p>}
                  <button className="relay-command" type="submit">
                    [ {hasExistingCase
                      ? isPt ? "CONTINUAR CASO MONTADO" : "CONTINUE MOUNTED CASE"
                      : isPt ? "MONTAR IMAGEM SOMENTE LEITURA" : "MOUNT READ-ONLY IMAGE"} ]
                  </button>
                </form>

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
          <span>{isPt ? "ENDEREÇO DO OBSERVADOR: CURIOSIDADE" : "OBSERVER ADDRESS: CURIOSITY"}</span>
          <span>{isPt ? "INTEGRIDADE DO LINK 07%" : "LINK INTEGRITY 07%"}</span>
        </footer>
      </section>
    </main>
  );
}
