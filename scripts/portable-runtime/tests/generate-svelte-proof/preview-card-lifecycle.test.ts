import { afterEach, describe, expect, it } from "vitest";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import {
  verifyPreviewCardDiagnostics,
  verifyPreviewCardDisabledTimer,
  verifyPreviewCardLifecycle,
  verifyPreviewCardOrdinaryModel,
  verifyPreviewCardPendingOwners,
} from "../../../../packages/svelte/tests/preview-card-browser.js";
import { createPreviewCardConsumer } from "../../../../packages/svelte/tests/preview-card-consumer.js";

const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function fixture() {
  const consumer = await createPreviewCardConsumer(process.cwd());
  consumers.push(consumer);
  return consumer;
}

describe("generated Svelte PreviewCard lifecycle", () => {
  it("preserves ordinary accepted, canceled, and later parent model updates", async () => {
    expect((await verifyPreviewCardOrdinaryModel(await fixture())).result.ordinaryModel).toBe(true);
  }, 60_000);
  it("keeps pending work across callback/ref changes", async () => {
    expect((await verifyPreviewCardPendingOwners(await fixture(), false)).pendingOwners).toBe(true);
  }, 60_000);
  it("rejects hover while the trigger is disabled", async () => {
    expect((await verifyPreviewCardDisabledTimer(await fixture(), false)).disabledTimer).toBe(true);
  }, 60_000);
  it("diagnoses invalid anchor owners and recovers", async () => {
    expect(await verifyPreviewCardDiagnostics(await fixture(), false)).toEqual({
      invalidCases: 4,
      recovered: true,
    });
  }, 60_000);
  it("preserves accepted models, cancelable commands, timing and native anchor behavior, dynamic captures, portals, refs, hydration, and teardown through built exports", async () => {
    const { result } = await verifyPreviewCardLifecycle(await fixture());
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
      anchorNavigation: true,
      hoverableContent: true,
      teardown: true,
    });
  }, 120_000);
});
