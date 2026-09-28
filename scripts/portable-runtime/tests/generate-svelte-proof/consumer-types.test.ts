import { it, expect } from "vitest";
import {
  createSvelteConsumer,
  verifyConsumerTypes,
} from "../../../../packages/svelte/tests/consumer-types.js";

it("checks selected positive and negative Svelte API shapes in two batches", async () => {
  const repo = process.cwd();
  const consumer = await createSvelteConsumer(repo);
  try {
    const selected = process.env.SVELTE_VERIFY_COMPONENTS?.split(",").filter(Boolean);
    const result = await verifyConsumerTypes(consumer, repo, selected);
    expect(result.positiveFiles.length).toBeGreaterThan(0);
    if (!selected) expect(result.negativeFiles.length).toBeGreaterThan(0);
  } finally {
    await consumer.dispose();
  }
}, 60_000);
