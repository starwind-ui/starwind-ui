import { providers, scenarios, visualContract } from "./registry.mjs";

export const captureSessionsPerCell = 6;
export const captureMeasuredPerCell = 5;

export const smokeFlows = Object.freeze([
  Object.freeze({ flowPhase: "first", flowIndex: 1, flowId: "first-1", excluded: false }),
]);
export const captureFlows = smokeFlows;
const warmupFlow = Object.freeze({
  flowPhase: "warmup",
  flowIndex: 1,
  flowId: "warmup-1",
  excluded: true,
});

const seededRandom = (seed) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffled = (values, random) => {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
};

export function buildCaptureSchedule(seed) {
  const random = seededRandom(seed);
  const cells = [];
  let orderIndex = 0;
  for (const { id: scenario } of scenarios) {
    const providerCycle = shuffled(providers, random);
    const rotations = [Math.floor(random() * 3), ...shuffled([0, 1, 2, 0, 1], random)];
    for (let sessionIndex = 0; sessionIndex < captureSessionsPerCell; sessionIndex++) {
      const passRole = sessionIndex === 0 ? "warmup" : "measured";
      const rotation = rotations[sessionIndex];
      const order = providerCycle.map(
        (_, position) => providerCycle[(position + rotation) % providerCycle.length],
      );
      for (const [positionIndex, provider] of order.entries()) {
        cells.push({
          provider,
          scenario,
          passRole,
          flow: passRole === "warmup" ? warmupFlow : captureFlows[0],
          sessionIndex,
          position: positionIndex + 1,
          orderIndex: ++orderIndex,
          sessionId: `${scenario}/${passRole}-${sessionIndex}/${provider}`,
        });
      }
    }
  }
  return cells;
}

// Schema 2 is retained for checking frozen evidence from the superseded protocol.
export function buildLegacyCaptureSchedule(seed) {
  const random = seededRandom(seed);
  const cells = [];
  let orderIndex = 0;
  for (const { id: scenario } of scenarios) {
    const providerCycle = shuffled(providers, random);
    const rotations = Array.from({ length: 3 }, (_, block) =>
      shuffled([0, 1, 2, 0, 1, 2, 0, 1, 2, block], random),
    ).flat();
    for (let sessionIndex = 1; sessionIndex <= 30; sessionIndex++) {
      const block = Math.ceil(sessionIndex / 10);
      const rotation = rotations[sessionIndex - 1];
      const order = providerCycle.map(
        (_, position) => providerCycle[(position + rotation) % providerCycle.length],
      );
      for (const [positionIndex, provider] of order.entries()) {
        cells.push({
          provider,
          scenario,
          blockId: `block-${block}`,
          block,
          sessionIndex,
          position: positionIndex + 1,
          orderIndex: ++orderIndex,
          sessionId: `${scenario}/block-${block}/session-${sessionIndex}/${provider}`,
        });
      }
    }
  }
  return cells;
}

export function createRunPlan(config, runId) {
  const capture = config.mode === "capture";
  let orderIndex = 0;
  const cells = capture
    ? buildCaptureSchedule(config.seed).map((cell) => ({ ...cell, cpu: config.cpu }))
    : config.scenarios.flatMap((scenario) =>
        config.providers.map((provider, index) => ({
          provider,
          scenario,
          passRole: "validation",
          flow: smokeFlows[0],
          sessionIndex: 1,
          position: index + 1,
          orderIndex: ++orderIndex,
          sessionId: `${provider}/${scenario}/${config.mode}-0`,
          cpu: config.cpu,
        })),
      );
  return {
    schemaVersion: 4,
    runId,
    ...config,
    modeLabel:
      config.mode === "trace"
        ? "diagnostic trace; excluded from primary latency data"
        : capture
          ? config.cpu === 1
            ? "native publication capture; absolute descriptive results"
            : "simulated slowdown sensitivity capture; kept separate from native results"
          : "smoke; not a publication capture",
    visualContract,
    sessionsPerCell: capture ? captureSessionsPerCell : 1,
    measuredPerCell: capture ? captureMeasuredPerCell : 0,
    warmupsPerCell: capture ? 1 : 0,
    flows: smokeFlows,
    expectedContexts: cells.length,
    cells,
  };
}
