import { afterEach, describe, expect, it } from "vitest";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import {
  verifyPopoverDefaultMarkers,
  verifyPopoverOrdinaryModel,
  verifyPopoverOwnerOrdinary,
} from "../../../../packages/svelte/tests/popover-browser.js";
import { createPopoverConsumer } from "../../../../packages/svelte/tests/popover-consumer.js";

const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function fixture() {
  const consumer = await createPopoverConsumer(process.cwd());
  consumers.push(consumer);
  return consumer;
}

describe("generated Svelte Popover lifecycle", () => {
  it("preserves ordinary trigger, portal, focus, and hover ownership", async () => {
    expect((await verifyPopoverOwnerOrdinary(await fixture())).result.ownerOrdinary).toBe(true);
  }, 60_000);
  it("preserves ordinary accepted, canceled, and later parent model updates", async () => {
    expect((await verifyPopoverOrdinaryModel(await fixture())).result.ordinaryModel).toBe(true);
  }, 60_000);
  it("keeps default markers through hydration and later parent writes", async () => {
    expect((await verifyPopoverDefaultMarkers(await fixture())).result.defaultMarkers).toBe(true);
  }, 60_000);
});
