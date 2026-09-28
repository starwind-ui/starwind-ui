import { describe, expect, it, vi } from "vitest";
import { assertCompleteRun, finalizeCell } from "../../runtime-performance/interactions/run.mjs";

describe("final observation read", () => {
  it.each(["rejected", "absent"])(
    "invalidates completed flows when the final browser data is %s",
    async (failure) => {
      const flows = [
        { flowPhase: "first", outcome: { invoked: ["action-8"] } },
        { flowPhase: "repeated", outcome: { invoked: ["action-8"] } },
      ];
      const cell = { complete: true, eligible: true, flows, failures: [] };
      const error = new Error("Target closed during final observation drain");
      const page = {
        evaluate:
          failure === "rejected"
            ? vi.fn().mockRejectedValue(error)
            : vi.fn().mockResolvedValue(null),
      };
      await finalizeCell({
        cell,
        page,
        calibration: { passed: true, observerCalibrationPassed: true },
        mode: "smoke",
      });
      expect(page.evaluate).toHaveBeenCalledOnce();
      expect(cell).toMatchObject({ complete: false, eligible: false, raw: null, collected: null });
      expect(cell.flows).toEqual(flows);
      expect(cell.failures).toHaveLength(1);
      expect(cell.failures[0]).toMatchObject({
        category: "incomplete-capture",
        reason: "final-observation-read-failed",
      });
      expect(cell.failures[0].message).toContain(
        failure === "rejected" ? error.message : "collector data is absent",
      );
      expect(() =>
        assertCompleteRun({ complete: cell.complete, failures: cell.failures }, "/saved-run"),
      ).toThrow("failed or incomplete");
    },
  );
});

describe("provider task failures", () => {
  it("keeps a supported correctness failure without failing the harness run", () => {
    expect(() =>
      assertCompleteRun(
        {
          complete: true,
          failures: [{ category: "correctness-failure", message: "provider task failed" }],
        },
        "/saved-run",
      ),
    ).not.toThrow();
  });
});
