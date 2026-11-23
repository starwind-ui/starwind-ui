import { describe, expect, it } from "vitest";

import { createAssertionReceipts } from "./assertion-receipts.js";

describe("direction assertion receipts", () => {
  it("counts only named checks that executed", async () => {
    const { ctx, finish } = createAssertionReceipts(["visible", "geometry"]);
    await ctx.check("visible", async () => {});
    const evidence = finish();
    expect(evidence.status).toBe("failed");
    expect(evidence.passedAssertions).toBe(1);
    expect(evidence.failedAssertionIds).toEqual(["geometry"]);
    expect(evidence.checks).toEqual([
      { name: "visible", status: "passed" },
      { name: "geometry", status: "unrun" },
    ]);
  });

  it("rejects a duplicate check without replacing its first receipt", async () => {
    const { ctx, finish } = createAssertionReceipts(["visible"]);
    await ctx.check("visible", async () => {});
    await expect(ctx.check("visible", async () => {})).rejects.toThrow(
      "Duplicate assertion visible",
    );
    const evidence = finish();
    expect(evidence.checks).toEqual([{ name: "visible", status: "passed" }]);
    expect(evidence.status).toBe("failed");
    expect(evidence.executionErrors).toContain("Duplicate assertion visible");
  });

  it("rejects an unknown check and leaves the declared check unrun", async () => {
    const { ctx, finish } = createAssertionReceipts(["visible"]);
    await expect(ctx.check("other", async () => {})).rejects.toThrow("Unknown assertion other");
    const evidence = finish();
    expect(evidence.checks).toEqual([{ name: "visible", status: "unrun" }]);
    expect(evidence.status).toBe("failed");
  });

  it("keeps observations and later receipts after a failed check", async () => {
    const { ctx, finish } = createAssertionReceipts(["geometry", "focus"]);
    await ctx.check("geometry", async () => {
      ctx.observe("bounds", { left: 12, width: 48 });
      throw new Error("wrong edge");
    });
    ctx.observe("afterFailure", ["retained", 2]);
    await ctx.check("focus", async () => {});
    const evidence = finish();
    expect(evidence.status).toBe("failed");
    expect(evidence.failedAssertionIds).toEqual(["geometry"]);
    expect(evidence.checks[0]).toMatchObject({ name: "geometry", status: "failed" });
    expect(evidence.checks[0]?.error).toContain("wrong edge");
    expect(evidence.checks[1]).toEqual({ name: "focus", status: "passed" });
    expect(evidence.observations).toEqual({
      bounds: { left: 12, width: 48 },
      afterFailure: ["retained", 2],
    });
  });
});
