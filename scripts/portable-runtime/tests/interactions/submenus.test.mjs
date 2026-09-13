import { describe, expect, it } from "vitest";
import { parseArgs } from "../../runtime-performance/interactions/command.mjs";
import {
  linearPath,
  pacePointer,
  validatePointerDelivery,
} from "../../runtime-performance/interactions/driver.mjs";
import {
  validateSubmenuDwell,
  validateSubmenuInventory,
  validateSubmenuGeometry,
} from "../../runtime-performance/interactions/submenus.mjs";

describe("submenu journey", () => {
  it("keeps trace selection on the menu families", () => {
    expect(parseArgs(["--trace"]).scenarios.sort()).toEqual(["menu-20", "submenu-8x8"]);
    expect(() => parseArgs(["--trace", "--scenario", "select-page-20"])).toThrow("menu scenarios");
  });
  it("rejects stale submenu portals and duplicate child endpoints", () => {
    const snapshot = {
      popupShells: 2,
      renderedItems: 16,
      portalsInsideFixture: 0,
      orphanPopupShells: 0,
      popups: [
        { bench: "popup", role: "menu", inBodyPortal: true, visible: true },
        { bench: "child-popup", role: "menu", inBodyPortal: true, visible: true },
      ],
    };
    expect(validateSubmenuInventory(snapshot, "base-ui", "childOpen")).toEqual([]);
    expect(
      validateSubmenuInventory({ ...snapshot, orphanPopupShells: 1 }, "base-ui", "childOpen"),
    ).toContain("unsettled submenu portal");
    expect(
      validateSubmenuInventory(
        { ...snapshot, popups: [snapshot.popups[0], snapshot.popups[0]] },
        "base-ui",
        "childOpen",
      ),
    ).toContain("duplicate submenu endpoint");
  });
  it("rejects lost entry, stale active state, and an action during hover", () => {
    const valid = {
      childOpen: true,
      parentOpen: true,
      accessibleActive: true,
      targetAtPointer: "child-4",
      invoked: "[]",
    };
    expect(validateSubmenuDwell(valid)).toEqual([]);
    for (const wrong of [
      { childOpen: false },
      { parentOpen: false },
      { accessibleActive: false },
      { targetAtPointer: "parent-4" },
      { invoked: '["child-1"]' },
    ])
      expect(validateSubmenuDwell({ ...valid, ...wrong }).length).toBeGreaterThan(0);
  });
  it("rejects a wrong gap, clipped menu, and stale row identity", () => {
    const rows = (prefix) =>
      Array.from({ length: 8 }, (_, index) => ({
        height: 32,
        role: "menuitem",
        item: `${prefix}-${index + 1}`,
      }));
    const geometry = {
      parent: { x: 120, y: 250, width: 320, height: 258 },
      trigger: { x: 121, width: 318 },
      child: { x: 447, y: 347, width: 320, height: 258 },
      parents: rows("parent"),
      children: rows("child"),
    };
    expect(validateSubmenuGeometry(geometry)).toEqual([]);
    expect(
      validateSubmenuGeometry({ ...geometry, child: { ...geometry.child, x: 1000 } }),
    ).toContain("popup leaves the viewport");
    expect(
      validateSubmenuGeometry({ ...geometry, child: { ...geometry.child, x: 455 } }),
    ).toContain("submenu API gap differs from eight pixels");
    expect(validateSubmenuGeometry({ ...geometry, children: rows("stale") })).toContain(
      "child action 4 is missing",
    );
  });
  it("rejects uncommanded moves without deleting their raw evidence", () => {
    const points = [
      { x: 431, y: 361 },
      { x: 607, y: 458 },
    ];
    const moves = [
      { x: 431, y: 361, trusted: true },
      { x: 650.2, y: 711.7, trusted: true },
      { x: 607, y: 458, trusted: true },
    ];
    expect(validatePointerDelivery(moves, points)).toContain(
      "uncommanded or out-of-order pointer movement",
    );
    expect(moves).toHaveLength(3);
    expect(validatePointerDelivery([moves[0], moves[2]], points)).toEqual([]);
  });
  it("sends eighteen bounded commands over the 300 ms path without catch-up bursts", async () => {
    let clock = 0;
    const points = linearPath({ x: 280, y: 365 }, { x: 607, y: 460 }, 18);
    const result = await pacePointer({
      points,
      durationMs: 300,
      now: () => clock,
      sleep: async (ms) => {
        clock += ms;
      },
      move: async () => {
        clock += 25;
      },
    });
    expect(result.commandCount).toBe(18);
    expect(result.plannedDurationMs).toBe(300);
    expect(result.finalCoordinates).toEqual({ x: 607, y: 460 });
    expect(result.deliveries.at(-1).plannedAt).toBe(300);
    expect(
      result.deliveries.every(
        (delivery, index) =>
          !index || delivery.sentAt - result.deliveries[index - 1].sentAt >= 1000 / 60 - 0.001,
      ),
    ).toBe(true);
    expect(result.completedAt).toBeGreaterThan(300);
  });
});
