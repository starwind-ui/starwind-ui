import { afterEach, describe, expect, it } from "vitest";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";

import {
  verifyTooltipLifecycle,
  verifyTooltipOrdinaryModel,
  verifyTooltipPortalRequirement,
} from "../../../../packages/svelte/tests/tooltip-browser.js";
import { createTooltipConsumer } from "../../../../packages/svelte/tests/tooltip-consumer.js";

const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function fixture() {
  const consumer = await createTooltipConsumer(process.cwd());
  consumers.push(consumer);
  return consumer;
}

describe("generated Svelte Tooltip lifecycle", () => {
  it("preserves ordinary accepted, canceled, and later parent model updates", async () => {
    expect((await verifyTooltipOrdinaryModel(await fixture())).result.ordinaryModel).toBe(true);
  }, 60_000);
  it("rejects missing Portals and preserves standard and disabled Portal placement", async () => {
    const result = await verifyTooltipPortalRequirement(await fixture());
    expect(result).toMatchObject({ portalRequired: true, hydrationExact: true, teardown: true });
  }, 60_000);

  it("preserves accepted models, cancelable commands, timing and disabled normalization, dynamic captures, portals, refs, hydration, and teardown through built exports", async () => {
    const { result } = await verifyTooltipLifecycle(await fixture());
    expect(result).toMatchObject({
      complete: true,
      activeTriggerRestoration: true,
      hydrationExact: true,
      modelTruthTable: true,
      cancellation: true,
      parentCommands: true,
      refsAndAttachments: true,
      portalLifecycle: true,
      placement: true,
      timing: true,
      disabledNormalization: true,
      descriptionSemantics: true,
      teardown: true,
    });
  }, 120_000);
});
