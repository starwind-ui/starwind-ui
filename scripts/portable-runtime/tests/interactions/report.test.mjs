import { describe, expect, it } from "vitest";
import {
  buildCaptureReport,
  renderCaptureReport,
  summarizeObservationStates,
} from "../../runtime-performance/interactions/report.mjs";

const measured = (durationMs, extra = {}) => ({
  state: "measured",
  durationMs,
  excluded: false,
  domCompletion: { inputToObservedDOMMs: durationMs + 1 },
  ...extra,
});

describe("capture report statistics", () => {
  it("keeps valid input-to-DOM samples when Event Timing is unavailable or censored", () => {
    const observations = [
      measured(null, {
        state: "unavailable",
        delivery: { valid: true },
        domCompletion: { inputToObservedDOMMs: 0.5 },
      }),
      measured(null, {
        state: "censored",
        delivery: { valid: true },
        domCompletion: { inputToObservedDOMMs: 0.3 },
      }),
      measured(null, {
        state: "unavailable",
        delivery: { valid: false },
        domCompletion: { inputToObservedDOMMs: 0.4 },
      }),
    ];
    expect(
      summarizeObservationStates(observations, { metric: "domCompletion", independentDOM: true }),
    ).toMatchObject({
      counts: { measured: 2, failed: 1 },
      samples: [
        { state: "measured", valueMs: 0.5 },
        { state: "measured", valueMs: 0.3 },
        { state: "failed" },
      ],
    });
    expect(
      summarizeObservationStates(observations, { metric: "domCompletion" }).counts,
    ).toMatchObject({ unavailable: 2, censored: 1 });
    const session = {
      provider: "starwind",
      scenario: "select-100",
      sessionId: "saved",
      passRole: "measured",
      complete: true,
      eligible: true,
      failures: [],
      raw: { mount: { durationMs: 1 } },
      collected: {
        observations: [
          { ...observations[0], actionId: "navigate-next", ordinal: 1, flowPhase: "first" },
        ],
      },
    };
    const current = buildCaptureReport(
      { runId: "saved", mode: "capture", cpu: 1, schemaVersion: 4 },
      { complete: true, sourceUnchanged: true },
      [session],
    );
    const historical = buildCaptureReport(
      { runId: "saved", mode: "capture", cpu: 1, schemaVersion: 3 },
      { complete: true, sourceUnchanged: true },
      [session],
    );
    expect(
      current.actionRows.find(({ actionId }) => actionId === "navigate-next-1").domCompletion.counts
        .measured,
    ).toBe(1);
    expect(
      historical.actionRows.find(({ actionId }) => actionId === "navigate-next-1").domCompletion
        .counts.unavailable,
    ).toBe(1);
  });
  it("reports median, range, and five individual measured samples", () => {
    const values = Array.from({ length: 5 }, (_, index) => measured(index + 16));
    expect(summarizeObservationStates(values)).toMatchObject({
      sampleCount: 5,
      counts: { measured: 5, censored: 0, unavailable: 0, failed: 0 },
      median: { kind: "value", valueMs: 18 },
      range: { kind: "value", minMs: 16, maxMs: 20 },
      p95: null,
    });
    expect(summarizeObservationStates(values).samples.map(({ valueMs }) => valueMs)).toEqual([
      16, 17, 18, 19, 20,
    ]);
  });

  it("keeps censored ranks as bounds and unknown ranks unavailable", () => {
    const censored = Array.from({ length: 20 }, () => ({
      state: "censored",
      excluded: false,
    }));
    expect(summarizeObservationStates(censored)).toMatchObject({
      median: { kind: "bound", lessThanMs: 16 },
      p95: null,
    });
    expect(
      summarizeObservationStates([...censored, { state: "unavailable", excluded: false }]),
    ).toMatchObject({
      median: { kind: "unavailable" },
      p95: null,
    });
    const mixed = [
      ...Array.from({ length: 2 }, () => ({ state: "censored", excluded: false })),
      ...Array.from({ length: 18 }, (_, index) => measured(index + 16)),
    ];
    expect(summarizeObservationStates(mixed)).toMatchObject({
      median: { kind: "value", valueMs: 23.5 },
      p95: null,
    });
    expect(summarizeObservationStates([mixed[0], measured(8)])).toMatchObject({
      median: { kind: "unavailable", reason: "censor order overlaps measured values" },
    });
    const crossover = [
      ...Array.from({ length: 10 }, () => ({ state: "censored", excluded: false })),
      ...Array.from({ length: 10 }, (_, index) => measured(index + 24)),
    ];
    expect(summarizeObservationStates(crossover)).toMatchObject({
      median: { kind: "unavailable", reason: "quantile crosses censor boundary" },
    });
  });

  it("retains failed rows and avoids rankings or ratio claims", () => {
    const plan = { runId: "run", mode: "capture", cpu: 1 };
    const session = {
      provider: "base-ui",
      scenario: "select-100",
      sessionId: "session",
      blockId: "block-1",
      position: 2,
      complete: true,
      eligible: false,
      failures: [{ category: "correctness-failure" }],
      raw: { mount: { durationMs: 4 } },
      collected: {
        observations: [
          measured(24, {
            state: "failed",
            actionId: "navigate-next",
            flowPhase: "first",
          }),
        ],
      },
    };
    const report = buildCaptureReport(plan, { complete: true, sourceUnchanged: true }, [session]);
    expect(
      report.actionRows.find(({ actionId }) => actionId === "navigate-next").duration,
    ).toMatchObject({
      counts: { failed: 1 },
      p95: null,
    });
    expect(report.actionRows.find(({ actionId }) => actionId === "mount")).toMatchObject({
      flowPhase: null,
      duration: { sampleCount: 1 },
    });
    const markdown = renderCaptureReport(report);
    expect(markdown).toContain("| base-ui | select-100 | mount | once per context |");
    expect(markdown).toContain("absolute descriptive results");
    expect(markdown).not.toContain("p95");
    expect(markdown).toContain("no overall winner");
    expect(markdown).not.toContain("faster than");
  });

  it("keeps repeated command ordinals as separate action rows", () => {
    const plan = { runId: "run", mode: "capture", cpu: 1 };
    const session = {
      provider: "ark-ui",
      scenario: "combobox-500",
      sessionId: "session",
      blockId: "block-1",
      position: 1,
      complete: true,
      eligible: true,
      failures: [],
      raw: { mount: { durationMs: 4 } },
      collected: {
        observations: [
          measured(16, {
            actionId: "navigate-next",
            ordinal: 1,
            flowPhase: "repeated",
          }),
          measured(24, {
            actionId: "navigate-next",
            ordinal: 2,
            flowPhase: "repeated",
          }),
        ],
      },
    };
    const report = buildCaptureReport(plan, { complete: true, sourceUnchanged: true }, [session]);
    expect(
      report.actionRows
        .filter(({ actionId }) => actionId.startsWith("navigate-next-"))
        .map(({ actionId }) => actionId),
    ).toEqual(["navigate-next-1", "navigate-next-2"]);
  });

  it("excludes warmup action and mount values from five measured passes", () => {
    const plan = { runId: "run", mode: "capture", cpu: 1 };
    const sessions = Array.from({ length: 6 }, (_, index) => ({
      provider: "starwind",
      scenario: "menu-20",
      sessionId: `pass-${index}`,
      passRole: index === 0 ? "warmup" : "measured",
      position: (index % 3) + 1,
      complete: true,
      eligible: index > 0,
      failures: [],
      raw: { mount: { durationMs: index === 0 ? 999 : index + 4 } },
      collected: {
        observations: [
          measured(index === 0 ? 999 : index + 16, {
            actionId: "open",
            flowPhase: index === 0 ? "warmup" : "first",
            excluded: index === 0,
          }),
        ],
      },
    }));
    const report = buildCaptureReport(plan, { complete: true, sourceUnchanged: true }, sessions);
    const mount = report.actionRows.find(({ actionId }) => actionId === "mount").duration;
    const open = report.actionRows.find(
      ({ actionId, flowPhase }) => actionId === "open" && flowPhase === "first",
    ).duration;
    expect(mount).toMatchObject({
      sampleCount: 5,
      counts: { excluded: 1, measured: 5 },
      median: { kind: "value", valueMs: 7 },
      range: { kind: "value", minMs: 5, maxMs: 9 },
    });
    expect(open).toMatchObject({
      sampleCount: 5,
      median: { kind: "value", valueMs: 19 },
      range: { kind: "value", minMs: 17, maxMs: 21 },
    });
  });
});
