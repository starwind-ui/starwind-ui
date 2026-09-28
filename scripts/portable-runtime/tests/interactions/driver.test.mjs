import { describe, expect, it } from "vitest";
import {
  linearPath,
  navigateSelectToValue,
  pacePointer,
} from "../../runtime-performance/interactions/driver.mjs";

describe("trusted pointer command pacing", () => {
  it("delivers 60 precomputed points over one second with exact final coordinates", async () => {
    let clock = 0;
    const sent = [];
    const points = linearPath({ x: 200, y: 100 }, { x: 200, y: 324 }, 60);
    const result = await pacePointer({
      points,
      durationMs: 1000,
      now: () => clock,
      sleep: async (ms) => {
        clock += ms;
      },
      move: async (point) => {
        sent.push(point);
      },
    });
    expect(sent).toEqual(points);
    expect(result.completedAt).toBeCloseTo(1000);
    expect(result.deliveries).toHaveLength(60);
    expect(result.finalCoordinates).toEqual({ x: 200, y: 324 });
  });
  it("retains lag without a catch-up burst when delivery stalls", async () => {
    let clock = 0;
    let index = 0;
    const result = await pacePointer({
      points: linearPath({ x: 0, y: 0 }, { x: 10, y: 10 }, 60),
      durationMs: 1000,
      now: () => clock,
      sleep: async (ms) => {
        clock += ms;
      },
      move: async () => {
        if (++index === 10) clock += 125;
      },
    });
    expect(result.deliveries[10].lagMs).toBeGreaterThan(100);
    for (let i = 1; i < result.deliveries.length; i++)
      expect(result.deliveries[i].sentAt - result.deliveries[i - 1].sentAt).toBeGreaterThanOrEqual(
        1000 / 60 - 1e-8,
      );
    expect(result.completedAt).toBeGreaterThan(1100);
    expect(result.commandCount).toBe(60);
  });
});

describe("Select target navigation", () => {
  const option = (number) => ({ value: `option-${number}`, disabled: number === 3 });
  it("records supported paths that focus or skip the disabled item", async () => {
    for (const path of [
      [2, 3, 4],
      [2, 4],
    ]) {
      const press = async (ordinal) => option(path[ordinal - 1]);
      const gap = async () => {};
      const result = await navigateSelectToValue({
        initial: option(1),
        target: "option-4",
        press,
        gap,
      });
      expect(result.activePath.map(({ value }) => value)).toEqual([
        "option-1",
        ...path.map((n) => `option-${n}`),
      ]);
      expect(result.actualKeyCount).toBe(path.length);
    }
  });
  it("rejects a stuck path and a missing target within the bound", async () => {
    await expect(
      navigateSelectToValue({
        initial: option(1),
        target: "option-4",
        press: async () => option(1),
      }),
    ).rejects.toThrow("kept the previous");
    await expect(
      navigateSelectToValue({
        initial: option(1),
        target: "option-42",
        press: async (n) => option(n + 1),
        gap: async () => {},
      }),
    ).rejects.toThrow("not reachable within ten keys");
  });
});
