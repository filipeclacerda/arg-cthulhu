"use client";

import { useProgress } from "../../context/ProgressContext";
import { CASE_FINDING_DEFINITIONS, caseFindingState, puzzleCasefileGate } from "../../game/investigativeProgression";
import { OPTIONAL_MISSIONS, canCompleteOptionalMission } from "../../game/optionalMissions";
import { PUZZLE_IDS, currentChapter, firstUnsolvedPuzzle, investigationStage, progressChapterSnapshot, puzzleAct, puzzleCorruptionStage } from "../../game/progress";

export default function StatusTab() {
  const { state, saveStatus, isReadOnly } = useProgress();
  return <section>
    {isReadOnly && <p className="danger">READ ONLY — another tab owns this case.</p>}
    <div className="grid">
      <span>stage <b>{investigationStage(state.puzzles)}</b></span><span>chapter <b>{currentChapter(progressChapterSnapshot(state))}</b></span>
      <span>act <b>{puzzleAct(state)}</b></span><span>corruption <b>{puzzleCorruptionStage(state.puzzles)}</b></span>
      <span>active <b>{firstUnsolvedPuzzle(state) ?? "none"}</b></span><span>ending <b>{state.ending ?? "none"}</b></span>
      <span>revision <b>{state.revision}</b></span><span>save <b>{saveStatus}</b></span>
    </div>
    <small>caseId: {state.caseId}</small>
    <h3>PUZZLES</h3>{PUZZLE_IDS.map((id) => { const puzzle = state.puzzles[id]; const gate = puzzleCasefileGate(state, id); return <div className="row" key={id}><code>{id}</code><span>{puzzle.solvedAt ? "SOLVED" : gate.allowed ? "READY" : `BLOCKED: ${gate.requirement?.kind}`}</span><small>a:{puzzle.attempts} h:{puzzle.hintsUnlocked}</small></div>; })}
    <h3>FINDINGS</h3>{CASE_FINDING_DEFINITIONS.map(({ id }) => <div className="row" key={id}><code>{id}</code><span>{caseFindingState(state, id)}</span><small>{state.announcedCaseFindingIds.includes(id) ? "announced" : "-"}/{state.viewedCaseFindingIds.includes(id) ? "viewed" : "-"}</small></div>)}
    <h3>INSIGHTS / LEADS</h3><p>{state.insightsUnlocked.join(", ") || "none"}</p><p>{state.leadsUnlocked.join(", ") || "none"}</p>
    <h3>STATE</h3><div className="grid"><span>live <b>{state.liveContact.status}</b></span><span>future step <b>{state.futureSequenceStep}</b></span><span>flags <b>{Object.keys(state.flags).length}</b></span><span>evidence <b>{state.discoveredEvidenceIds.length}</b></span><span>tokens <b>{state.collectedTokens.length}</b></span><span>refs <b>{state.collectedReferences.length}</b></span><span>files <b>{state.readFileIds.length}</b></span></div>
    <h3>OPTIONAL</h3>{OPTIONAL_MISSIONS.map((mission) => <div className="row" key={mission.id}><code>{mission.id}</code><span>{state.optionalDiscoveries.includes(mission.id) ? "DONE" : canCompleteOptionalMission(state, mission.id) ? "READY" : "LOCKED"}</span></div>)}
  </section>;
}
