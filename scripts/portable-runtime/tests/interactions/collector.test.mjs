import { describe, expect, it } from "vitest";
import {
  collectObservations,
  matchEntry,
  validateDelivery,
} from "../../runtime-performance/interactions/collector.mjs";
const action = {
  uid: "first/open/0",
  actionId: "open",
  flowPhase: "first",
  kind: "click",
  domCompletion: { inputToObservedDOMMs: 12 },
};
const events = ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].map((name, index) => ({
  name,
  timeStamp: 100 + index,
  trusted: true,
  actionUid: action.uid,
  targetId: 1,
  button: 0,
}));
const entry = {
  entryType: "event",
  name: "click",
  startTime: 104,
  duration: 24,
  processingStart: 105,
  processingEnd: 107,
  interactionId: 7,
  targetId: 1,
};
const data = (overrides = {}) => ({
  events,
  entries: [entry],
  actions: [action],
  support: { event: true, "first-input": true },
  drains: [{}],
  observerErrors: [],
  explicitZeroLossSignal: null,
  ...overrides,
});
const collect = (overrides, options = { calibrationPassed: true }) =>
  collectObservations(data(overrides), options);

describe("Event Timing ownership", () => {
  it("matches event name and timestamp within one ms with a unique target", () => {
    expect(matchEntry({ ...entry, startTime: 104.9 }, events).event).toBe(events[4]);
    expect(matchEntry({ ...entry, startTime: 105.01 }, events).reason).toBe("unmatched-event");
    expect(matchEntry(entry, [...events, { ...events[4] }]).reason).toBe("ambiguous-event-match");
  });
  it("uses the max event duration per interaction and keeps supporting duration fields", () => {
    const result = collect({
      entries: [entry, { ...entry, name: "pointerdown", startTime: 100, duration: 40 }],
    });
    expect(result.observations[0]).toMatchObject({
      state: "measured",
      durationMs: 40,
      flowPhase: "first",
      actionId: "open",
    });
    expect(result.observations[0].interactions).toHaveLength(1);
  });
  it("deduplicates repeats and first-input overlap, retaining raw counts and origin", () => {
    const result = collect({ entries: [entry, entry, { ...entry, entryType: "first-input" }] });
    expect(result.observations[0].interactions[0].entries).toHaveLength(1);
    expect(result.observations[0].interactions[0].firstInputOverlap).toBe(true);
    expect(result.rawEntryCount).toBe(3);
  });
  it("keeps a threshold-independent first-input duration when event is absent", () => {
    expect(
      collect({ entries: [{ ...entry, duration: 8, entryType: "first-input" }] }).observations[0],
    ).toMatchObject({ state: "measured", durationMs: 8 });
  });
  it("uses original timestamps for late entry delivery after a later action", () => {
    const later = { ...action, uid: "first/reopen/0", actionId: "reopen" };
    const result = collect({
      actions: [action, later],
      events: [
        ...events,
        ...events.map((event) => ({
          ...event,
          timeStamp: event.timeStamp + 50,
          actionUid: later.uid,
        })),
      ],
      entries: [{ ...entry, receivedAt: 1000 }],
    });
    expect(result.observations.map(({ state }) => state)).toEqual(["measured", "unavailable"]);
  });
  it("preserves conflicting ownership as unavailable for both owners", () => {
    const later = { ...action, uid: "repeated/open/0", flowPhase: "repeated" };
    const result = collect({
      actions: [action, later],
      events: [
        ...events,
        ...events.map((event) => ({
          ...event,
          timeStamp: event.timeStamp + 100,
          actionUid: later.uid,
        })),
      ],
      entries: [entry, { ...entry, startTime: 204 }],
    });
    expect(result.observations.every(({ state }) => state === "unavailable")).toBe(true);
    expect(result.interactionGroups[0].actionUid).toBeNull();
  });
  it("keeps unmatched and zero-ID raw entries without making a timing sample", () => {
    const result = collect({
      entries: [
        { ...entry, startTime: 200 },
        { ...entry, interactionId: 0 },
      ],
    });
    expect(result.observations[0].state).toBe("unavailable");
    expect(result.unassigned).toHaveLength(1);
    expect(result.interactionGroups[0].reason).toBe("unmatched-event");
  });
  it("marks untrusted delivery as failed", () => {
    expect(
      collect({ events: events.map((event) => ({ ...event, trusted: false })) }).observations[0],
    ).toMatchObject({ state: "failed", reason: "untrusted-input" });
  });
  it("keeps trusted keyboard delivery when a library dispatches a secondary virtual click", () => {
    const keyAction = { ...action, uid: "key", kind: "key", key: "Enter" };
    const keyEvents = [
      { name: "keydown", key: "Enter", trusted: true, actionUid: "key" },
      { name: "click", key: null, trusted: false, actionUid: "key" },
      { name: "keyup", key: "Enter", trusted: true, actionUid: "key" },
    ];
    expect(validateDelivery(keyAction, keyEvents)).toMatchObject({ valid: true });
  });
  it("keeps missing entries unavailable without explicit zero-loss proof", () => {
    expect(collect({ entries: [] }).observations[0]).toMatchObject({
      state: "unavailable",
      reason: "no-explicit-zero-loss-proof",
    });
    expect(collect({ entries: [], support: { event: false } }).observations[0].reason).toBe(
      "event-timing-unsupported",
    );
  });
  it("censors only with every completeness signal and never uses numeric zero", () => {
    const observation = collect({ entries: [], explicitZeroLossSignal: true }).observations[0];
    expect(observation).toMatchObject({
      state: "censored",
      reportedDurationBound: { lessThanMs: 16 },
    });
    expect(observation).not.toHaveProperty("durationMs");
    expect(collect({ entries: [], explicitZeroLossSignal: true }, {}).observations[0].state).toBe(
      "unavailable",
    );
    expect(
      collect({ entries: [], explicitZeroLossSignal: true, observerErrors: ["dropped"] })
        .observations[0].state,
    ).toBe("unavailable");
  });
  it("gates correctness failure independently of available timings", () => {
    expect(
      collect({}, { calibrationPassed: true, cellFailure: "wrong-result" }).observations[0],
    ).toMatchObject({ state: "failed", reason: "wrong-result" });
  });
  it("validates keyboard identity and preserves trace exclusion", () => {
    expect(
      validateDelivery({ uid: "key", kind: "key", key: "Enter" }, [
        { name: "keydown", key: "Escape", trusted: true, actionUid: "key" },
        { name: "keyup", key: "Escape", trusted: true, actionUid: "key" },
      ]).valid,
    ).toBe(false);
    expect(collect({}, { excluded: true }).observations[0].excluded).toBe(true);
  });
});

it("accepts suppression of compatibility mouse events only after canceled pointerdown", () => {
  const suppressed = events.filter(({ name }) => !["mousedown", "mouseup"].includes(name));
  expect(validateDelivery(action, suppressed).valid).toBe(false);
  expect(
    validateDelivery(
      action,
      suppressed.map((event) => ({ ...event, defaultPrevented: event.name === "pointerdown" })),
    ).valid,
  ).toBe(true);
});

it("owns keypress entries through the original Enter command", () => {
  const keyAction = {
    ...action,
    uid: "first/enter/0",
    actionId: "enter",
    kind: "key",
    key: "Enter",
  };
  const keyEvents = ["keydown", "keypress", "keyup"].map((name, index) => ({
    name,
    timeStamp: 100 + index,
    trusted: true,
    actionUid: keyAction.uid,
    targetId: 1,
    key: "Enter",
  }));
  const keyEntries = keyEvents.map((event) => ({
    ...entry,
    name: event.name,
    startTime: event.timeStamp,
  }));
  const observation = collect({ actions: [keyAction], events: keyEvents, entries: keyEntries })
    .observations[0];
  expect(observation).toMatchObject({ state: "measured", actionId: "enter" });
  expect(observation.interactions[0].entries).toHaveLength(3);
});

it.each([null, true])(
  "keeps every ambiguous candidate unavailable with zero-loss proof %j",
  (explicitZeroLossSignal) => {
    const actions = [
      { ...action, uid: "action-0" },
      { ...action, uid: "action-1", actionId: "reopen" },
    ];
    const closeEvents = actions.flatMap((candidate, actionIndex) =>
      events.map((event, eventIndex) => ({
        ...event,
        actionUid: candidate.uid,
        timeStamp: 100 + actionIndex * 2 + eventIndex * 0.01,
      })),
    );
    const result = collect({
      actions,
      events: closeEvents,
      explicitZeroLossSignal,
      entries: [
        { ...entry, name: "pointerdown", startTime: 100, duration: 16, interactionId: 7 },
        { ...entry, name: "click", startTime: 101.04, duration: 200, interactionId: 8 },
      ],
    });
    const ambiguous = result.interactionGroups.find(({ interactionId }) => interactionId === 8);
    expect(ambiguous).toMatchObject({
      actionUid: null,
      candidateOwners: ["action-0", "action-1"],
      reason: "ambiguous-event-match",
    });
    expect(ambiguous.matches[0].event).toBeNull();
    expect(ambiguous.entries[0].duration).toBe(200);
    expect(result.observations.map(({ state, reason }) => ({ state, reason }))).toEqual([
      { state: "unavailable", reason: "ambiguous-interaction-ownership" },
      { state: "unavailable", reason: "ambiguous-interaction-ownership" },
    ]);
    // Retain the unique group as supporting evidence without publishing its 16 ms value
    // as a complete action observation or censoring the other possible owner.
    expect(result.observations[0].interactions[0].durationMs).toBe(16);
    for (const observation of result.observations) {
      expect(observation).not.toHaveProperty("durationMs");
      expect(observation).not.toHaveProperty("reportedDurationBound");
    }
  },
);
