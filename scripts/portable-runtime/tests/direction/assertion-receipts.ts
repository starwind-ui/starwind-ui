export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type AssertionReceipt = {
  name: string;
  status: "passed" | "failed" | "unrun";
  error?: string;
};

export type AssertionEvidence = {
  checks: AssertionReceipt[];
  observations: Record<string, JsonValue>;
  executionErrors: string[];
  failedAssertionIds: string[];
  passedAssertions: number;
  /** Wall time of each executed check in milliseconds, for profiling slow cases. */
  checkDurations: Record<string, number>;
  status: "passed" | "failed";
};

export type DirectionAssertionContext = {
  check(name: string, assertion: () => void | Promise<void>): Promise<void>;
  observe(name: string, value: unknown): void;
};

function jsonValue(value: unknown, seen = new Set<object>()): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "object" || seen.has(value))
    throw new Error("Observation must be JSON compatible");
  seen.add(value);
  if (Array.isArray(value)) {
    const result = value.map((item) => jsonValue(item, seen));
    seen.delete(value);
    return result;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
    throw new Error("Observation must be a plain JSON object");
  const result: Record<string, JsonValue> = {};
  for (const [key, item] of Object.entries(value)) result[key] = jsonValue(item, seen);
  seen.delete(value);
  return result;
}

export function createAssertionReceipts(declared: readonly string[]): {
  ctx: DirectionAssertionContext;
  finish(): AssertionEvidence;
} {
  if (new Set(declared).size !== declared.length || declared.some((name) => !name.trim()))
    throw new Error("Declared assertion names must be unique and nonempty");
  const allowed = new Set(declared);
  const receipts = new Map<string, AssertionReceipt>();
  const observations: Record<string, JsonValue> = {};
  const executionErrors: string[] = [];
  const checkDurations: Record<string, number> = {};
  let finished = false;

  function reject(message: string): never {
    executionErrors.push(message);
    throw new Error(message);
  }

  const ctx: DirectionAssertionContext = {
    async check(name, assertion) {
      if (finished) reject(`Assertion ${name} ran after evidence closed`);
      if (!allowed.has(name)) reject(`Unknown assertion ${name}`);
      if (receipts.has(name)) reject(`Duplicate assertion ${name}`);
      receipts.set(name, { name, status: "unrun" });
      const started = performance.now();
      try {
        await assertion();
        receipts.set(name, { name, status: "passed" });
      } catch (error) {
        receipts.set(name, { name, status: "failed", error: String(error) });
      } finally {
        checkDurations[name] = Math.round(performance.now() - started);
      }
    },
    observe(name, value) {
      if (finished) reject(`Observation ${name} ran after evidence closed`);
      if (!name.trim()) reject("Observation name is empty");
      if (Object.hasOwn(observations, name)) reject(`Duplicate observation ${name}`);
      try {
        observations[name] = jsonValue(value);
      } catch (error) {
        reject(`Invalid observation ${name}: ${String(error)}`);
      }
    },
  };

  return {
    ctx,
    finish() {
      if (finished) throw new Error("Assertion evidence is already closed");
      finished = true;
      const checks = declared.map(
        (name) => receipts.get(name) ?? { name, status: "unrun" as const },
      );
      const failedAssertionIds = checks
        .filter((receipt) => receipt.status !== "passed")
        .map((receipt) => receipt.name);
      const passedAssertions = checks.filter((receipt) => receipt.status === "passed").length;
      return {
        checks,
        observations: { ...observations },
        executionErrors: [...executionErrors],
        failedAssertionIds,
        passedAssertions,
        checkDurations: { ...checkDurations },
        status: failedAssertionIds.length || executionErrors.length ? "failed" : "passed",
      };
    },
  };
}
