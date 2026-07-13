"use client";

import Image from "next/image";

export function Legacy1998Overlay({ locale, onExit, onOpenAccession, children }: { locale: "en" | "pt-BR"; onExit: () => void; onOpenAccession: () => void; children?: React.ReactNode }) {
  return <div className="desktop-1998-overlay" role="dialog" aria-modal="true" aria-label={locale === "pt-BR" ? "Sessão legada de 1998 detectada" : "Legacy 1998 session detected"}>
    <div className="desktop-1998-overlay__taskbar"><span className="desktop-1998-overlay__user">M. BISHOP</span><span className="desktop-1998-overlay__clock">03:14</span></div>
    <button type="button" className="desktop-1998-overlay__exit" onClick={onExit}>RETURN_2026.EXE</button>
    <button type="button" className="desktop-1998-overlay__icon" onClick={onOpenAccession} autoFocus><Image src="/icons/notepad.png" alt="" width={40} height={40} /><p>accession_notes_wk3.txt</p></button>
    {children}
  </div>;
}
