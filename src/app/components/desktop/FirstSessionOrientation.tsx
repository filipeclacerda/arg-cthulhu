"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const GUIDES = [
  { id: "inbox", title: "Inbox", en: "Unread mail stays unread until you open it. Start here when the machine leaves a message.", pt: "Mensagens não lidas continuam assim até você abri-las. Comece aqui quando a máquina deixar uma mensagem." },
  { id: "recent", title: "Recent Documents", en: "The archive may return a document here before it explains why. Check the dates.", pt: "O arquivo pode devolver um documento aqui antes de explicar por quê. Observe as datas." },
  { id: "casefile", title: "Casefile", en: "Keep findings here, then connect them when the record is ready. Nothing is consumed by looking.", pt: "Guarde achados aqui e conecte-os quando o registro estiver pronto. Consultar não consome nada." },
] as const;

export type FirstSessionGuideId = (typeof GUIDES)[number]["id"];

export function FirstSessionOrientation({ locale, open, suppressed = false }: { locale: "en" | "pt-BR"; open: (id: FirstSessionGuideId) => void; suppressed?: boolean }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => {
    setDismissed(GUIDES.filter((guide) => window.localStorage.getItem(`miskatonic-onboarding-${guide.id}`) === "dismissed").map((guide) => guide.id));
  }, []);

  const guide = GUIDES.find((candidate) => !dismissed.includes(candidate.id));
  if (!guide || suppressed) return null;

  const dismiss = () => {
    window.localStorage.setItem(`miskatonic-onboarding-${guide.id}`, "dismissed");
    setDismissed((current) => [...current, guide.id]);
  };

  return <aside className="archive-warning coordinator-toast onboarding-orientation" role="status">
    <Image src="/icons/help.png" alt="" width={34} height={34} />
    <div>
      <small>{locale === "pt-BR" ? "NOTA DO RELÉ // PRIMEIRA SESSÃO" : "RELAY NOTE // FIRST SESSION"}</small>
      <strong>{guide.title}</strong>
      <p>{locale === "pt-BR" ? guide.pt : guide.en}</p>
    </div>
    <button className="button" type="button" onClick={() => open(guide.id)}>{locale === "pt-BR" ? "Abrir" : "Open"}</button>
    <button className="button archive-warning__close" type="button" aria-label={locale === "pt-BR" ? "Dispensar orientação" : "Dismiss orientation"} onClick={dismiss}>×</button>
  </aside>;
}
