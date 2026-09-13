import { describe, expect, it } from "vitest";
import { recordMenuCallback } from "../../runtime-performance/interactions/fixtures/menu-actions.mjs";

describe("Menu application action guard", () => {
  it("keeps each raw callback receipt while blocking a disabled application action", () => {
    const raw = [];
    const actions = [];
    expect(
      recordMenuCallback(
        { id: "action-3", disabled: true },
        "onClick",
        (receipt) => raw.push(receipt),
        (id) => actions.push(id),
      ),
    ).toBe(false);
    expect(
      recordMenuCallback(
        { id: "action-8", disabled: false },
        "onSelect",
        (receipt) => raw.push(receipt),
        (id) => actions.push(id),
      ),
    ).toBe(true);
    expect(raw).toEqual([
      { id: "action-3", source: "onClick" },
      { id: "action-8", source: "onSelect" },
    ]);
    expect(actions).toEqual(["action-8"]);
  });
});
