"use client";

import { useState } from "react";
import { useProgress } from "../../context/ProgressContext";

export default function FlagsTab() {
  const { state, dispatchGameEvent } = useProgress(); const [query, setQuery] = useState(""); const [newFlag, setNewFlag] = useState("");
  const unset = (flag: string) => { const flags = { ...state.flags }; delete flags[flag]; dispatchGameEvent({ type: "HYDRATE", state: { ...state, flags } }); };
  return <section><div className="inline"><input placeholder="search flags" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
    {Object.entries(state.flags).filter(([flag]) => flag.includes(query)).sort().map(([flag, value]) => <label className="flag" key={flag}><input type="checkbox" checked={value} onChange={() => value ? unset(flag) : dispatchGameEvent({ type: "SET_FLAG", flag })} /><code>{flag}</code></label>)}
    <h3>NEW FLAG</h3><div className="inline"><input value={newFlag} onChange={(event) => setNewFlag(event.target.value)} /><button onClick={() => { if (newFlag) dispatchGameEvent({ type: "SET_FLAG", flag: newFlag }); }}>set</button></div>
  </section>;
}
