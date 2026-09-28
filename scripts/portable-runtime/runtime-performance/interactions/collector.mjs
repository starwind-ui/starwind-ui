export const timestampToleranceMs = 1;
export const reportingThresholdMs = 16;

export function matchEntry(entry, events) {
  const candidates = events.filter(
    (event) =>
      event.name === entry.name &&
      Math.abs(event.timeStamp - entry.startTime) <= timestampToleranceMs &&
      (entry.targetId == null || event.targetId === entry.targetId),
  );
  const candidateOwners = [
    ...new Set(candidates.map(({ actionUid }) => actionUid).filter(Boolean)),
  ];
  if (candidates.length !== 1)
    return {
      event: null,
      candidateOwners,
      reason: candidates.length ? "ambiguous-event-match" : "unmatched-event",
    };
  const event = candidates[0];
  if (!event.trusted) return { event, candidateOwners, reason: "untrusted-input" };
  if (!event.actionUid) return { event, candidateOwners, reason: "unowned-input" };
  return { event, candidateOwners, reason: null };
}

export function validateDelivery(action, events) {
  const delivered = events.filter((event) => event.actionUid === action.uid);
  const names = delivered.map(({ name }) => name);
  const suppressedMouse =
    delivered.find(({ name }) => name === "pointerdown")?.defaultPrevented === true &&
    !names.includes("mousedown") &&
    !names.includes("mouseup");
  const expected =
    action.kind === "click"
      ? suppressedMouse
        ? ["pointerdown", "pointerup", "click"]
        : ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]
      : action.kind === "key"
        ? ["keydown", "keyup"]
        : [];
  if (delivered.filter(({ name }) => expected.includes(name)).some((event) => !event.trusted))
    return { valid: false, reason: "untrusted-input" };
  let previous = -1;
  for (const name of expected) {
    const indices = names.flatMap((candidate, index) => (candidate === name ? [index] : []));
    if (indices.length !== 1 || indices[0] <= previous)
      return { valid: false, reason: `invalid-${name}-delivery` };
    previous = indices[0];
  }
  if (
    action.kind === "key" &&
    delivered
      .filter(({ name }) => name === "keydown" || name === "keyup")
      .some(({ key }) => key !== action.key)
  )
    return { valid: false, reason: "wrong-key" };
  if (
    action.kind === "click" &&
    delivered.filter(({ name }) => expected.includes(name)).some(({ button }) => button !== 0)
  )
    return { valid: false, reason: "wrong-button" };
  return { valid: true, reason: null, eventCount: delivered.length };
}

export function collectObservations(
  data,
  { calibrationPassed = false, cellFailure = null, excluded = false } = {},
) {
  const deduplicated = [];
  const seen = new Set();
  for (const entry of data.entries) {
    const key = [entry.entryType, entry.name, entry.startTime, entry.interactionId].join("|");
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(entry);
    }
  }
  // first-input and event copies remain in raw data; one canonical event enters the group.
  const canonical = [];
  for (const entry of deduplicated) {
    if (entry.entryType === "first-input") {
      const duplicate = deduplicated.find(
        (other) =>
          other.entryType === "event" &&
          other.name === entry.name &&
          other.startTime === entry.startTime &&
          (other.interactionId === entry.interactionId || !entry.interactionId),
      );
      if (duplicate) continue;
    }
    canonical.push(entry);
  }
  const groups = new Map();
  const unassigned = [];
  for (const entry of canonical) {
    const match = matchEntry(entry, data.events);
    // First-input has threshold-independent duration even in implementations which report ID zero.
    const id =
      entry.interactionId ||
      (entry.entryType === "first-input" ? `first-input:${entry.startTime}` : null);
    if (!id) {
      unassigned.push({ entry, match, reason: "zero-interaction-id" });
      continue;
    }
    if (!groups.has(id))
      groups.set(id, {
        interactionId: id,
        entries: [],
        matches: [],
        actionUid: null,
        reason: null,
      });
    const group = groups.get(id);
    group.entries.push(entry);
    group.matches.push(match);
  }
  for (const group of groups.values()) {
    const owners = new Set(group.matches.flatMap(({ candidateOwners }) => candidateOwners));
    group.reason =
      group.matches.find(({ reason }) => reason)?.reason ??
      (owners.size === 1 ? null : "conflicting-action-owners");
    group.actionUid = group.reason ? null : [...owners][0];
    group.candidateOwners = [...owners];
  }
  const observations = data.actions
    .filter(({ kind }) => kind !== "pointer")
    .map((action) => {
      const delivery = validateDelivery(action, data.events);
      const assigned = [...groups.values()].filter(({ actionUid }) => actionUid === action.uid);
      const conflicts = [...groups.values()].filter(
        ({ reason, candidateOwners }) => reason && candidateOwners.includes(action.uid),
      );
      const common = {
        actionUid: action.uid,
        actionId: action.actionId,
        ordinal: action.ordinal ?? 0,
        flowId: action.flowId ?? action.flowPhase,
        flowPhase: action.flowPhase,
        excluded: excluded || action.flowPhase === "warmup",
        delivery,
        domCompletion: action.domCompletion,
        interactions: assigned.map((group) => ({
          ...group,
          durationMs: Math.max(...group.entries.map(({ duration }) => duration)),
          inputDelayMs: Math.max(
            ...group.entries.map((entry) => entry.processingStart - entry.startTime),
          ),
          processingDurationMs: Math.max(
            ...group.entries.map((entry) => entry.processingEnd - entry.processingStart),
          ),
          origins: [...new Set(group.entries.map(({ entryType }) => entryType))],
          firstInputOverlap: data.entries.some(
            (entry) =>
              entry.entryType === "first-input" &&
              group.entries.some(
                (other) => other.name === entry.name && other.startTime === entry.startTime,
              ),
          ),
        })),
      };
      if (cellFailure) return { ...common, state: "failed", reason: cellFailure };
      if (!delivery.valid) return { ...common, state: "failed", reason: delivery.reason };
      if (conflicts.length)
        return { ...common, state: "unavailable", reason: "ambiguous-interaction-ownership" };
      if (assigned.length > 1)
        return {
          ...common,
          state: "unavailable",
          reason: "multiple-interactions-for-one-discrete-command",
        };
      if (assigned.length === 1)
        return { ...common, state: "measured", durationMs: common.interactions[0].durationMs };
      const complete =
        data.support.event &&
        calibrationPassed &&
        data.explicitZeroLossSignal === true &&
        data.drains.length > 0 &&
        data.observerErrors.length === 0;
      if (complete)
        return {
          ...common,
          state: "censored",
          reportedDurationBound: {
            lessThanMs: reportingThresholdMs,
            domain: "browser reported duration (8 ms granularity)",
          },
        };
      return {
        ...common,
        state: "unavailable",
        reason: !data.support.event
          ? "event-timing-unsupported"
          : !calibrationPassed
            ? "observer-calibration-failed"
            : "no-explicit-zero-loss-proof",
      };
    });
  return {
    observations,
    interactionGroups: [...groups.values()],
    unassigned,
    rawEntryCount: data.entries.length,
    uniqueEntryCount: deduplicated.length,
  };
}
