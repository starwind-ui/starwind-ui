import { describe, expect, it } from "vitest";
import {
  buildCaptureSchedule,
  captureFlows,
  createRunPlan,
} from "../../runtime-performance/interactions/plan.mjs";

describe("capture plan", () => {
  it("is deterministic, seed-sensitive, complete, and position-balanced", () => {
    const first = buildCaptureSchedule(20260912);
    expect(buildCaptureSchedule(20260912)).toEqual(first);
    expect(buildCaptureSchedule(20260913)).not.toEqual(first);
    expect(first).toHaveLength(108);
    expect(new Set(first.map(({ sessionId }) => sessionId)).size).toBe(108);
    for (const scenario of [
      "menu-20",
      "select-100",
      "combobox-500",
      "submenu-8x8",
      "select-page-1",
      "select-page-20",
    ]) {
      const rows = first.filter((cell) => cell.scenario === scenario);
      for (const provider of ["starwind", "base-ui", "ark-ui"]) {
        const providerRows = rows.filter((cell) => cell.provider === provider);
        expect(providerRows).toHaveLength(6);
        expect(providerRows.filter(({ passRole }) => passRole === "warmup")).toHaveLength(1);
        const measured = providerRows.filter(({ passRole }) => passRole === "measured");
        expect(measured).toHaveLength(5);
        const positions = [1, 2, 3].map(
          (position) => measured.filter((row) => row.position === position).length,
        );
        expect(Math.max(...positions) - Math.min(...positions)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("freezes one flow per pass with one excluded warmup and five measurements", () => {
    expect(captureFlows.map(({ flowPhase }) => flowPhase)).toEqual(["first"]);
    const plan = createRunPlan(
      {
        mode: "capture",
        providers: ["starwind", "base-ui", "ark-ui"],
        scenarios: [],
        cpu: 1,
        seed: 20260912,
      },
      "capture-id",
    );
    expect(plan).toMatchObject({
      sessionsPerCell: 6,
      warmupsPerCell: 1,
      measuredPerCell: 5,
      expectedContexts: 108,
    });
    expect(plan.cells.filter(({ passRole }) => passRole === "warmup")).toHaveLength(18);
    expect(plan.cells.filter(({ passRole }) => passRole === "measured")).toHaveLength(90);
  });
});
