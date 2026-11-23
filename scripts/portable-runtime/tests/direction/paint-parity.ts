import assert from "node:assert/strict";

import type { DirectionAssertionContext } from "./assertion-receipts.js";
import type { DirectionExpectation } from "./inventory.js";

export const FIRST_PAINT_PARITY = "first-paint-parity";

type Kind = "status" | "slider" | "color";
/** Observation names for the server paint, the held first paint, and the hydrated paint. */
type Phases = readonly [disabled: string, delayed: string, hydrated: string];

function numeric(value: unknown, label: string): number {
  assert.equal(typeof value, "number", `${label} is not a measured number`);
  return value as number;
}

function close(first: unknown, second: unknown, label: string): void {
  assert(
    Math.abs(numeric(first, label) - numeric(second, label)) <= 1,
    `${label} changed by more than one pixel: ${first} versus ${second}`,
  );
}

function rows(value: unknown, label: string): Record<string, unknown>[] {
  assert(Array.isArray(value) && value.length > 0, `${label} has no measured controls`);
  return value as Record<string, unknown>[];
}

function values(value: unknown, label: string): unknown[] {
  assert(Array.isArray(value) && value.length > 0, `${label} has no measurements`);
  return value;
}

function record(value: unknown, label: string): Record<string, unknown> {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} is missing`);
  return value as Record<string, unknown>;
}

function comparePaint(id: string, kind: Kind, first: unknown, after: unknown): number {
  const before = rows(first, `${id} before`);
  const hydrated = rows(after, `${id} after`);
  assert.equal(before.length, hydrated.length, `${id} lost a control during hydration`);
  for (const [index, original] of before.entries()) {
    const current = hydrated[index]!;
    assert.equal(original.id, current.id, `${id} control order changed`);
    if (kind === "status") {
      for (const key of ["start", "end", "top", "bottom", "width", "trackWidth"]) {
        if (original[key] !== undefined)
          close(original[key], current[key], `${id}/${original.id}/${key}`);
      }
    } else if (kind === "slider") {
      for (const key of ["size", "origin"])
        close(original[key], current[key], `${id}/${original.id}/${key}`);
      const beforeFill = values(original.fill, `${id} fill`);
      const afterFill = values(current.fill, `${id} hydrated fill`);
      assert.equal(beforeFill.length, afterFill.length);
      beforeFill.forEach((value, i) =>
        close(value, afterFill[i], `${id}/${original.id}/fill-${i}`),
      );
      const beforeThumbs = rows(original.thumbs, `${id} thumbs`);
      const afterThumbs = rows(current.thumbs, `${id} hydrated thumbs`);
      assert.equal(beforeThumbs.length, afterThumbs.length);
      beforeThumbs.forEach((thumb, i) =>
        close(thumb.center, afterThumbs[i]!.center, `${id}/${original.id}/thumb-${i}`),
      );
    } else {
      const beforeArea = record(original.area, `${id} area`);
      const afterArea = record(current.area, `${id} hydrated area`);
      for (const key of ["x", "y", "w", "h"])
        close(beforeArea[key], afterArea[key], `${id}/${original.id}/area-${key}`);
      const beforeSliders = rows(original.sliders, `${id} channels`);
      const afterSliders = rows(current.sliders, `${id} hydrated channels`);
      assert.equal(beforeSliders.length, afterSliders.length);
      beforeSliders.forEach((slider, i) => {
        for (const key of ["x", "y", "w", "h"])
          close(slider[key], afterSliders[i]![key], `${id}/${original.id}/channel-${i}-${key}`);
      });
    }
  }
  return before.length;
}

/**
 * Add the `first-paint-parity` check after a paint expectation. The check compares the server
 * paint with the held first paint, and the held first paint with the hydrated paint. Each
 * measured edge must stay within one pixel.
 */
export function withFirstPaintParity(
  expectation: DirectionExpectation,
  kind: Kind,
  phases: Phases,
): DirectionExpectation {
  return {
    ...expectation,
    async run(page, target, ctx) {
      const observed = new Map<string, unknown>();
      const recording: DirectionAssertionContext = {
        check: (name, run) => ctx.check(name, run),
        observe(name, value) {
          observed.set(name, value);
          ctx.observe(name, value);
        },
      };
      await expectation.run(page, target, recording);
      await ctx.check(FIRST_PAINT_PARITY, () => {
        const [disabled, delayed, hydrated] = phases;
        const id = expectation.id;
        const controls = comparePaint(id, kind, observed.get(disabled), observed.get(delayed));
        comparePaint(id, kind, observed.get(delayed), observed.get(hydrated));
        ctx.observe("paintParity", { controls, tolerancePx: 1, phases: [...phases] });
      });
    },
  };
}
