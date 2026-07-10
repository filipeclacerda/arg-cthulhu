"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProgress } from "../context/ProgressContext";
import { Locale } from "../game/progress";
import "./page.scss";

const COPY: Record<
  Locale,
  {
    kicker: string;
    relayLine: string;
    bootLines: string[];
    title: string;
    subtitle?: string;
    briefLabel: string;
    brief: string;
    actions: string[];
    sessionMeta: string;
    manifestLabel: string;
    manifestRows: string[];
    recipientLabel: string;
    integrityLabel: string;
    noteLabel: string;
    noteLines: string[];
    noteSignature: string;
    cta: string;
    ctaHint: string;
    footer: string;
    footerNote: string;
  }
> = {
  en: {
    kicker: "ORNE LIBRARY DARK ARCHIVE // RELAY 07",
    relayLine:
      "PACKAGE SB-0316 // SOURCE: T. ALVAREZ // CHAIN OF CUSTODY BROKEN",
    bootLines: [
      "RELAY 07 ..................... ONLINE",
      "LOCATING PACKAGE SB-0316 ...... FOUND",
      "SOURCE SIGNATURE ......... T. ALVAREZ",
      "CHAIN OF CUSTODY ............. BROKEN",
      "RECIPIENT MANIFEST FOLLOWS",
    ],
    title: "THE ARCHIVE OF TOMORROW",
    briefLabel: "REVIEW PROTOCOL // HUMAN ANALYSIS REQUIRED",
    brief:
      "Inspect the recovered desktop. Cross-reference files, messages, and cached pages. Record what the archive is trying to hide.",
    actions: ["INSPECT FILES", "CONNECT EVIDENCE", "RECONSTRUCT THE CASE"],
    sessionMeta: "SOLO // 3–5 HOURS // LOCAL CHECKPOINT",
    manifestLabel: "MANIFEST // RELAY 07",
    manifestRows: [
      "R. ██████ — QUEUED · UNCONFIRMED",
      "M. ██████████ — QUEUED · UNCONFIRMED",
      "A. ███████ — QUEUED · UNCONFIRMED",
    ],
    recipientLabel: "UNALLOCATED ROW ............",
    integrityLabel: "LAST INTEGRITY CHECK:",
    noteLabel: "ATTACHED NOTE // OUTSIDE THE IMAGE",
    noteLines: [
      "I made a forensic copy and queued it for three colleagues.",
      "The delivery table no longer agrees with the manifest.",
      "One row is not indexed. Do not alter the copy before you verify it.",
    ],
    noteSignature: "— T. Alvarez",
    cta: "OPEN PACKAGE SB-0316",
    ctaHint: "Free · no installation · headphones recommended",
    footer:
      "A browser investigation. Free. 3–5 hours. Headphones recommended.",
    footerNote: "No installation. Runs in this tab.",
  },
  "pt-BR": {
    kicker: "ARQUIVO ESCURO DA BIBLIOTECA ORNE // RELÉ 07",
    relayLine:
      "PACOTE SB-0316 // ORIGEM: T. ALVAREZ // CADEIA DE CUSTÓDIA ROMPIDA",
    bootLines: [
      "RELÉ 07 ...................... ONLINE",
      "LOCALIZANDO PACOTE SB-0316 ... ACHADO",
      "ASSINATURA DE ORIGEM ..... T. ALVAREZ",
      "CADEIA DE CUSTÓDIA .......... ROMPIDA",
      "MANIFESTO DE DESTINATÁRIOS A SEGUIR",
    ],
    title: "THE ARCHIVE OF TOMORROW",
    subtitle: "o arquivo de amanhã",
    briefLabel: "PROTOCOLO DE REVISÃO // ANÁLISE HUMANA NECESSÁRIA",
    brief:
      "Explore o computador recuperado. Cruze arquivos, mensagens e páginas em cache. Registre o que o arquivo está tentando esconder.",
    actions: ["EXAMINE ARQUIVOS", "CONECTE EVIDÊNCIAS", "RECONSTRUA O CASO"],
    sessionMeta: "SOLO // 3–5 HORAS // CHECKPOINT LOCAL",
    manifestLabel: "MANIFESTO // RELÉ 07",
    manifestRows: [
      "R. ██████ — NA FILA · NÃO CONFIRMADO",
      "M. ██████████ — NA FILA · NÃO CONFIRMADO",
      "A. ███████ — NA FILA · NÃO CONFIRMADO",
    ],
    recipientLabel: "LINHA NÃO ALOCADA ..........",
    integrityLabel: "ÚLTIMA VERIFICAÇÃO DE INTEGRIDADE:",
    noteLabel: "NOTA ANEXA // FORA DA IMAGEM",
    noteLines: [
      "Fiz uma cópia forense e a coloquei na fila para três colegas.",
      "A tabela de entrega não confere mais com o manifesto.",
      "Uma linha não está indexada. Não altere a cópia antes de verificá-la.",
    ],
    noteSignature: "— T. Alvarez",
    cta: "ABRIR PACOTE SB-0316",
    ctaHint: "Gratuito · sem instalação · recomenda-se fones",
    footer:
      "Uma investigação no navegador. Gratuito. 3–5 horas. Recomenda-se fones.",
    footerNote: "Sem instalação. Roda nesta aba.",
  },
};

const CHECKSUM_SEED = "8F03A61C";
const CHECKSUM_CHARS = "0123456789ABCDEF";

const mutateChecksum = (checksum: string): string => {
  const chars = checksum.split("");
  const swaps = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < swaps; i += 1) {
    const index = Math.floor(Math.random() * chars.length);
    chars[index] =
      CHECKSUM_CHARS[Math.floor(Math.random() * CHECKSUM_CHARS.length)];
  }
  return chars.join("");
};

const tomorrowStamp = (): string => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Home() {
  const { state, isHydrated, setLocale } = useProgress();
  const locale: Locale = isHydrated ? state.locale : "en";
  const copy = COPY[locale];
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [integrityStamp, setIntegrityStamp] = useState("");
  const [checksum, setChecksum] = useState(CHECKSUM_SEED);

  useEffect(() => {
    setIntegrityStamp(tomorrowStamp());
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      setReducedMotion(true);
      setVisibleLines(COPY.en.bootLines.length);
      setRevealed(true);
      return;
    }
    const isNarrow = window.matchMedia("(max-width: 640px)").matches;
    const lineDelay = isNarrow ? 120 : 150;
    const lineTimer = window.setInterval(() => {
      setVisibleLines((count) => {
        if (count >= COPY.en.bootLines.length) {
          window.clearInterval(lineTimer);
          return count;
        }
        return count + 1;
      });
    }, lineDelay);
    const revealTimer = window.setTimeout(
      () => setRevealed(true),
      lineDelay * (COPY.en.bootLines.length + 1) + 160
    );
    return () => {
      window.clearInterval(lineTimer);
      window.clearTimeout(revealTimer);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      setChecksum((value) => mutateChecksum(value));
    }, 7000);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  return (
    <main className="landing-shell">
      <div className="landing-shell__scanlines" aria-hidden="true" />
      <div className="landing-shell__static" aria-hidden="true" />
      <div className="landing-shell__vignette" aria-hidden="true" />

      <header className="landing-header">
        <div className="landing-header__lamps" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="landing-header__id">
          <strong>{copy.kicker}</strong>
          <small>{copy.relayLine}</small>
        </div>
        <span className="landing-header__checksum" aria-hidden="true">
          CHK {checksum}
        </span>
      </header>

      <div className="landing-body">
        <div className="landing-content">
          <div className="landing-bootlog" aria-live="polite">
            {copy.bootLines.slice(0, visibleLines).map((line, index) => (
              <p key={line}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {line}
              </p>
            ))}
            {!revealed && (
              <b className="landing-cursor" aria-hidden="true">
                █
              </b>
            )}
          </div>

          <div
            className={`landing-reveal ${revealed ? "is-revealed" : ""}`}
            aria-hidden={!revealed}
          >
            <h1 className="landing-title" data-text={copy.title}>
              {copy.title}
            </h1>
            {copy.subtitle && (
              <p className="landing-subtitle">{copy.subtitle}</p>
            )}

            <section className="landing-brief" aria-labelledby="review-protocol">
              <p className="landing-label" id="review-protocol">
                {copy.briefLabel}
              </p>
              <p className="landing-brief__copy">{copy.brief}</p>
              <ol className="landing-brief__actions">
                {copy.actions.map((action, index) => (
                  <li key={action}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {action}
                  </li>
                ))}
              </ol>
              <p className="landing-brief__meta">{copy.sessionMeta}</p>
            </section>

            <div className="landing-action">
              <Link href="/" className="landing-cta">
                <span>[ {copy.cta} ]</span>
                <small>{copy.ctaHint}</small>
              </Link>
            </div>

            <div className="landing-evidence">
              <div className="landing-manifest">
                <p className="landing-label">{copy.manifestLabel}</p>
                <ol>
                  {copy.manifestRows.map((row) => (
                    <li key={row}>{row}</li>
                  ))}
                  <li className="landing-manifest__recipient">
                    {copy.recipientLabel}{" "}
                    <b className="landing-cursor" aria-hidden="true">
                      ▮
                    </b>
                  </li>
                </ol>
                <p className="landing-manifest__meta">
                  {copy.integrityLabel}{" "}
                  {integrityStamp && `${integrityStamp} 03:14`}
                </p>
              </div>

              <div className="landing-note">
                <p className="landing-label">{copy.noteLabel}</p>
                <blockquote>
                  {copy.noteLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                  <footer>{copy.noteSignature}</footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="landing-footer">
        <span>{copy.footer}</span>
        <span>{copy.footerNote}</span>
        <div className="landing-locale" role="group" aria-label="Language">
          <button
            type="button"
            className={locale === "en" ? "active" : ""}
            onClick={() => setLocale("en")}
          >
            EN
          </button>
          <button
            type="button"
            className={locale === "pt-BR" ? "active" : ""}
            onClick={() => setLocale("pt-BR")}
          >
            PT-BR
          </button>
        </div>
      </footer>
    </main>
  );
}
