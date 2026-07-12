"use client";

import { useState } from "react";
import { useProgress } from "../../context/ProgressContext";
import { CASE_FINDING_DEFINITIONS } from "../../game/investigativeProgression";
import { LeadId, PUZZLE_IDS } from "../../game/progress";
import { ALL_EVIDENCE_IDS, ALL_TOKEN_IDS, INSIGHT_SOLUTIONS, STAGE_PRESETS, buildStageState, eventsForFinding, eventsForInsight, eventsToSolvePuzzle, suppressPendingEvents } from "../../game/devPresets";

const leads: LeadId[] = ["sarah_last_day", "lot_provenance", "locked_room", "manuscript", "historical", "acoustic", "observer"];
export default function ProgressionTab() {
  const { state, dispatchGameEvent } = useProgress(); const [quiet, setQuiet] = useState(true); const [evidence, setEvidence] = useState("");
  const hydrate = (next: typeof state) => dispatchGameEvent({ type: "HYDRATE", state: next });
  const run = (events: Parameters<typeof dispatchGameEvent>[0][]) => events.forEach(dispatchGameEvent);
  return <section>
    <label><input type="checkbox" checked={quiet} onChange={(event) => setQuiet(event.target.checked)} /> quiet mode</label>
    <h3>STAGE PRESETS</h3><div className="buttons">{STAGE_PRESETS.map((id) => <button key={id} onClick={() => { const next = buildStageState(id, state); hydrate(quiet ? suppressPendingEvents(next) : next); }}>{id}</button>)}</div>
    <h3>SOLVE WITH GATES</h3><div className="buttons">{PUZZLE_IDS.map((id) => <button key={id} onClick={() => run(eventsToSolvePuzzle(state, id))}>{id}</button>)}</div>
    <h3>INSIGHTS</h3><div className="buttons">{Object.keys(INSIGHT_SOLUTIONS).map((id) => <button key={id} onClick={() => run(eventsForInsight(id as keyof typeof INSIGHT_SOLUTIONS))}>{id}</button>)}</div>
    <h3>FINDINGS</h3><div className="buttons">{CASE_FINDING_DEFINITIONS.map(({ id }) => <button key={id} onClick={() => run(eventsForFinding(id))}>{id}</button>)}</div>
    <h3>LEADS</h3><div className="buttons">{leads.map((leadId) => <button key={leadId} onClick={() => dispatchGameEvent({ type: "UNLOCK_LEAD", leadId })}>{leadId}</button>)}</div>
    <h3>QUICK ADD</h3><div className="inline"><input value={evidence} list="dev-evidence" placeholder="evidence id" onChange={(event) => setEvidence(event.target.value)} /><datalist id="dev-evidence">{ALL_EVIDENCE_IDS.map((id) => <option key={id} value={id} />)}</datalist><button onClick={() => evidence && dispatchGameEvent({ type: "DISCOVER_EVIDENCE", evidenceId: evidence })}>add</button></div>
    <button onClick={() => ALL_TOKEN_IDS.forEach((tokenId) => dispatchGameEvent({ type: "COLLECT_TOKEN", tokenId }))}>collect all statement tokens</button>
    <h3>ENDING</h3><div className="buttons">{(["restore", "shutdown", "seal", "leave_blank", "archive_self"] as const).map((ending) => <button key={ending} onClick={() => dispatchGameEvent({ type: "CHOOSE_ENDING", ending })}>{ending}</button>)}</div>
    <button className="danger-button" onClick={() => hydrate({ ...state, ending: null, flags: Object.fromEntries(Object.entries(state.flags).filter(([key]) => !key.startsWith("ending_"))) })}>clear ending / unfreeze reducer</button>
  </section>;
}
