export function median(values) {
  const sorted = normalizeValues(values);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function eligibleP95(values) {
  const sorted = normalizeValues(values);
  if (sorted.length < 20) return null;
  return sorted[Math.ceil(sorted.length * 0.95) - 1];
}

export function minimum(values) {
  return normalizeValues(values)[0];
}

export function maximum(values) {
  return normalizeValues(values).at(-1);
}

export function spread(values) {
  const sorted = normalizeValues(values);
  return sorted.at(-1) - sorted[0];
}

export function medianAbsoluteDeviation(values) {
  const normalized = normalizeValues(values);
  const center = median(normalized);
  return median(normalized.map((value) => Math.abs(value - center)));
}

export function coefficientOfVariation(values) {
  const normalized = normalizeValues(values);
  const mean = normalized.reduce((sum, value) => sum + value, 0) / normalized.length;
  if (mean === 0) return null;
  const variance =
    normalized.reduce((sum, value) => sum + (value - mean) ** 2, 0) / normalized.length;
  return Math.sqrt(variance) / mean;
}

export function summarizeRuntimePerformanceSamples(values) {
  const samples = validateValues(values);
  return Object.freeze({
    samples: Object.freeze([...samples]),
    medianMs: median(samples),
    p95Ms: eligibleP95(samples),
  });
}

export function evaluateRuntimePerformanceStability(values) {
  const runMedians = normalizeValues(values);
  if (runMedians.length !== 5) {
    throw new Error(
      `Runtime performance stability requires exactly five run medians; received ${runMedians.length}`,
    );
  }
  const minimumMs = minimum(runMedians);
  const maximumMs = maximum(runMedians);
  const spreadMs = maximumMs - minimumMs;
  const medianMs = median(runMedians);
  const madMs = medianAbsoluteDeviation(runMedians);
  const cv = coefficientOfVariation(runMedians);
  const spreadLimitMs = Math.max(medianMs * 0.3, 5);
  return Object.freeze({
    runMedians: Object.freeze([...runMedians]),
    minimumMs,
    maximumMs,
    spreadMs,
    medianMs,
    madMs,
    coefficientOfVariation: cv,
    spreadLimitMs,
    stable: (cv == null ? spreadMs === 0 : cv <= 0.2) && spreadMs <= spreadLimitMs,
  });
}

export function buildRuntimePerformanceCandidateCeiling(runMedians) {
  if (!Array.isArray(runMedians)) {
    throw new Error("Runtime performance ceiling requires five raw run medians");
  }
  const stability = evaluateRuntimePerformanceStability(runMedians);
  if (stability?.stable !== true) {
    throw new Error("Cannot derive a runtime performance ceiling from unstable evidence");
  }
  const headroomMs = Math.max(stability.madMs * 3, stability.maximumMs * 0.2, 5);
  return Object.freeze({
    maximumMs: stability.maximumMs,
    madMs: stability.madMs,
    headroomMs,
    ceilingMs: stability.maximumMs + headroomMs,
  });
}

function normalizeValues(values) {
  return validateValues(values).sort((left, right) => left - right);
}

function validateValues(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Runtime performance values must be a nonempty array");
  }
  const normalized = values.map((value, index) => {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Runtime performance value ${index} must be a finite nonnegative number`);
    }
    return value;
  });
  return normalized;
}
