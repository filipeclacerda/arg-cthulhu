"use client";

import { useEffect, useState } from "react";
import EventsTab from "./EventsTab";
import FlagsTab from "./FlagsTab";
import ProgressionTab from "./ProgressionTab";
import SaveTab from "./SaveTab";
import StatusTab from "./StatusTab";
import "./style.scss";

const tabs = ["STATUS", "PROGRESS", "EVENTS", "FLAGS", "SAVE"] as const;
type Tab = (typeof tabs)[number];

export default function DevToolsPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("STATUS");
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault(); setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  if (!open) return null;
  return <aside className="devtools" role="dialog" aria-label="Development tools">
    <header><strong>DEV TOOLS</strong><button onClick={() => setOpen(false)}>×</button></header>
    <nav>{tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</nav>
    <main>
      {tab === "STATUS" && <StatusTab />}
      {tab === "PROGRESS" && <ProgressionTab />}
      {tab === "EVENTS" && <EventsTab />}
      {tab === "FLAGS" && <FlagsTab />}
      {tab === "SAVE" && <SaveTab />}
    </main>
  </aside>;
}
