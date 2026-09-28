import { getPrimitiveInventoryEntry } from "../../../scripts/portable-runtime/renderers/primitive-inventory.js";
import { consumerFamilies } from "./dist-consumer.js";
import { verifyNamedRejections } from "./named-rejections.js";
import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";

import {
  negativeConsumers,
  positiveConsumer,
  ssrConsumer,
  typescriptConsumer,
} from "./dist-consumer-fixtures.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyPositiveConsumer(consumer: DistConsumer) {
  await consumer.write({
    "consumer.ts": typescriptConsumer,
    "Positive.svelte": positiveConsumer,
    "ssr.mjs": ssrConsumer,
  });
  const result = await consumer.check();
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /COMPLETED \d+ FILES 0 ERRORS 0 WARNINGS/);
  const rendered = JSON.parse(await consumer.run("ssr.mjs", { loader: true })) as {
    body: string;
    renderedExports: Record<string, string[]>;
    facades: string[];
    provenance: {
      tools: Record<string, string>;
      modules: Record<string, { modulePath: string; typePath: string }>;
    };
  };
  assert.deepEqual(rendered.renderedExports, primitivePublicComponentExports());
  return rendered;
}

export async function verifyNegativeConsumers(consumer: DistConsumer): Promise<number> {
  await consumer.write(
    Object.fromEntries(
      Object.entries(negativeConsumers).map(([file, fixture]) => [file, fixture.source]),
    ),
  );
  try {
    const result = await consumer.check();
    verifyNamedRejections(result, consumer.root, negativeConsumers);
    return Object.keys(negativeConsumers).length;
  } finally {
    await Promise.all(
      Object.keys(negativeConsumers).map((file) => rm(path.join(consumer.root, file))),
    );
  }
}

export const PRIMITIVE_NEGATIVE_FIXTURES = Object.keys(negativeConsumers).sort();

export function primitivePublicComponentExports(): Record<string, string[]> {
  const title = (value: string) =>
    value
      .split("-")
      .map((word) => word[0]!.toUpperCase() + word.slice(1))
      .join("");
  return Object.fromEntries(
    consumerFamilies.map((family) => {
      const entry = getPrimitiveInventoryEntry(family);
      assert.ok(entry && "contract" in entry, `${family}: Primitive contract absent`);
      // These native inputs belong to Root/Thumb and have no standalone Svelte export.
      const internalInputs: Record<string, string[]> = {
        combobox: ["hiddenInput"],
        "context-menu": ["anchor"],
        "input-otp": ["input", "slotChar", "slotCaret"],
        radio: ["input"],
        checkbox: ["input", "uncheckedInput"],
        switch: ["input", "uncheckedInput"],
        select: ["input"],
        slider: ["input"],
      };
      return [
        family,
        entry.contract.parts
          .filter((part) => !internalInputs[family]?.includes(part.name))
          .map((part) =>
            family === "sidebar" && part.name === "sidebar"
              ? "SidebarComponent"
              : title(family) + title(part.name),
          )
          .sort(),
      ];
    }),
  );
}
