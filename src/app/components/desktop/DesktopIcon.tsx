"use client";

import Image from "next/image";
import React from "react";
import { shouldActivateDesktopItem } from "@/app/game/comfort";

export function DesktopIcon({ id, label, icon, selected, attention, onSelect, onOpen }: { id: string; label: string; icon: string; selected: boolean; attention: boolean; onSelect: () => void; onOpen: () => void }) {
  const activate = (event: React.SyntheticEvent) => { event.stopPropagation(); onOpen(); };
  return <div className={`desktop-icon ${selected ? "selected" : ""} ${attention ? "desktop-icon--attention" : ""}`}
    data-app-id={id} role="button" tabIndex={0} aria-label={label} title="Double-click to open"
    onClick={(event) => { event.stopPropagation(); onSelect(); }}
    onDoubleClick={activate}
    onKeyDown={(event) => { if (!shouldActivateDesktopItem(event.key)) return; event.preventDefault(); activate(event); }}
    onPointerUp={(event) => { if (event.pointerType === "touch") activate(event); }}>
    <Image src={icon} alt={label} width={46} height={46} />
    <p>{label}</p>
  </div>;
}
