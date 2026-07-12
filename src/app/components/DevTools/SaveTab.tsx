"use client";

import { useEffect, useState } from "react";
import { useProgress } from "../../context/ProgressContext";
import { ProgressStateV5 } from "../../game/progress";

const KEY = "arg-dev-snapshots";
type Snapshots = Record<string, ProgressStateV5>;
export default function SaveTab() {
  const { state, exportCode, importCode, dispatchGameEvent, newCase } = useProgress(); const [text, setText] = useState(""); const [name, setName] = useState(""); const [snapshots, setSnapshots] = useState<Snapshots>({});
  useEffect(() => { try { setSnapshots(JSON.parse(localStorage.getItem(KEY) ?? "{}")); } catch { setSnapshots({}); } }, []);
  const persist = (next: Snapshots) => { setSnapshots(next); localStorage.setItem(KEY, JSON.stringify(next)); };
  const copy = async (value: string) => { await navigator.clipboard.writeText(value); };
  return <section><h3>CASE CODE</h3><div className="buttons"><button onClick={async () => { const code = await exportCode(); setText(code); await copy(code); }}>export + copy</button><button onClick={() => void importCode(text)}>import</button></div>
    <textarea value={text} onChange={(event) => setText(event.target.value)} rows={8} />
    <h3>RAW JSON</h3><div className="buttons"><button onClick={() => { const json = JSON.stringify(state, null, 2); setText(json); void copy(json); }}>copy state JSON</button><button onClick={() => { try { dispatchGameEvent({ type: "HYDRATE", state: JSON.parse(text) as ProgressStateV5 }); } catch { /* keep current save */ } }}>hydrate JSON</button></div>
    <h3>SNAPSHOTS</h3><div className="inline"><input placeholder="snapshot name" value={name} onChange={(event) => setName(event.target.value)} /><button onClick={() => name && persist({ ...snapshots, [name]: state })}>save</button></div>
    {Object.entries(snapshots).map(([id, snapshot]) => <div className="row" key={id}><code>{id}</code><button onClick={() => dispatchGameEvent({ type: "HYDRATE", state: snapshot })}>load</button><button onClick={() => { const next = { ...snapshots }; delete next[id]; persist(next); }}>delete</button></div>)}
    <h3>RESET</h3><button className="danger-button" onClick={() => void newCase()}>new case</button>
  </section>;
}
