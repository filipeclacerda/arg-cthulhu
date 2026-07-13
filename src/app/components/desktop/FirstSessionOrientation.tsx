"use client";

import { useEffect, useState } from "react";

const GUIDES = [
  { id: "inbox", title: "Inbox", en: "Unread mail stays unread until you open it. Start here when the machine leaves a message.", pt: "Mensagens não lidas continuam assim até você abri-las. Comece aqui quando a máquina deixar uma mensagem." },
  { id: "recent", title: "Recent Documents", en: "The archive may return a document here before it explains why. Check the dates.", pt: "O arquivo pode devolver um documento aqui antes de explicar por quê. Observe as datas." },
  { id: "casefile", title: "Casefile", en: "Keep findings here, then connect them when the record is ready. Nothing is consumed by looking.", pt: "Guarde achados aqui e conecte-os quando o registro estiver pronto. Consultar não consome nada." },
] as const;

export type FirstSessionGuideId = (typeof GUIDES)[number]["id"];

export function FirstSessionOrientation({ locale, open }: { locale: "en" | "pt-BR"; open: (id: FirstSessionGuideId) => void }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => {
    setDismissed(GUIDES.filter((guide) => window.localStorage.getItem(`miskatonic-onboarding-${guide.id}`) === "dismissed").map((guide) => guide.id));
  }, []);
  const visible = GUIDES.filter((guide) => !dismissed.includes(guide.id));
  if (!visible.length) return null;
  return <aside className="archive-warning onboarding-orientation" role="status">
    <small>{locale === "pt-BR" ? "NOTA DO RELÉ // PRIMEIRA SESSÃO" : "RELAY NOTE // FIRST SESSION"}</small>
    {visible.map((guide) => <article key={guide.id}>
      <strong>{guide.title}</strong><p>{locale === "pt-BR" ? guide.pt : guide.en}</p>
      <button className="button" type="button" onClick={() => open(guide.id)}>{locale === "pt-BR" ? "Abrir" : "Open"}</button>
      <button className="button" type="button" aria-label={locale === "pt-BR" ? "Dispensar orientação" : "Dismiss orientation"} onClick={() => { window.localStorage.setItem(`miskatonic-onboarding-${guide.id}`, "dismissed"); setDismissed((current) => [...current, guide.id]); }}>×</button>
    </article>)}
  </aside>;
}
