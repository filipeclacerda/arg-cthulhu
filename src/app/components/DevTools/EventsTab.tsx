"use client";

import { useProgress } from "../../context/ProgressContext";
import { DIEGETIC_EVENTS, diegeticContext, isDiegeticEventPending, selectNextDiegeticEvent } from "../../game/diegeticEvents";
import { applyEvents, eventsToSatisfy, explainCondition } from "../../game/devPresets";
import { isUnlocked } from "../../game/unlock";

export default function EventsTab() {
  const { state, dispatchGameEvent } = useProgress(); const context = diegeticContext(state);
  const next = selectNextDiegeticEvent(context, { focalBusy: false, toastBusy: false });
  const hydrate = (nextState: typeof state) => dispatchGameEvent({ type: "HYDRATE", state: nextState });
  return <section><p>next if idle: <b>{next?.id ?? "none"}</b></p>{DIEGETIC_EVENTS.map((definition) => {
    const seen = Boolean(state.flags[definition.seenFlag]); const obsolete = Boolean(definition.obsoleteWhen && isUnlocked(definition.obsoleteWhen, context));
    const status = seen ? "SEEN" : obsolete ? "OBSOLETE" : isDiegeticEventPending(definition, context) ? "PENDING" : "BLOCKED";
    return <article className="event" key={definition.id}><div className="row"><code>{definition.id}</code><b>{status}</b><small>P{definition.priority}</small></div>
      {status === "BLOCKED" && <pre>{explainCondition(definition.when, state).join("\n")}</pre>}
      <div className="buttons"><button onClick={() => hydrate({ ...state, flags: { ...state.flags, [definition.seenFlag]: false } })}>replay</button><button onClick={() => { const events = eventsToSatisfy(state, definition.when); let nextState = events === null ? state : applyEvents(state, events); nextState = { ...nextState, flags: { ...nextState.flags, [definition.seenFlag]: false } }; hydrate(nextState); }}>force</button><button onClick={() => definition.caseFindingId ? dispatchGameEvent({ type: "MARK_CASE_FINDING_ANNOUNCED", findingId: definition.caseFindingId }) : dispatchGameEvent({ type: "SET_FLAG", flag: definition.seenFlag })}>mark seen</button></div>
    </article>;
  })}</section>;
}
