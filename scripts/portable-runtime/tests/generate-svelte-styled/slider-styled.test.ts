import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
import { sliderStyledContract } from "../../contracts/styled/components/slider.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { projectSvelteStyledGroup } from "../../renderers/framework-adapters/svelte/styled/projection.js";

it("regenerates stock Slider with a thumb repeat keyed by index", async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "svelte-styled-slider-"));
  try {
    await generateSvelteStyled({ outputRoot, roots: ["slider"] });
    const first = await readSvelteStyledTree(outputRoot);
    expect([...first.keys()].sort()).toEqual([
      "slider/Slider.svelte",
      "slider/index.ts",
      "slider/variants.ts",
    ]);
    expect(first.get("slider/Slider.svelte")).toContain("{#each values as _, index (index)}");
    for (const part of ["Root", "Control", "Track", "Indicator", "Thumb"])
      expect(first.get("slider/Slider.svelte")).toContain("<Slider" + part);
    await generateSvelteStyled({ outputRoot, roots: ["slider"] });
    expect(await readSvelteStyledTree(outputRoot)).toEqual(first);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(new Map([...committed].filter(([file]) => first.has(file)))).toEqual(first);
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});
it.each(["collection", "item", "index", "part", "extra-child"])(
  "rejects an unsupported Slider repeat %s",
  (kind) => {
    const group = projectStyledOutputComponentGroup(sliderStyledContract);
    const original = structuredClone(group);
    const owner = group.components[0]!.render[0]!;
    if (owner.type !== "primitive") throw new Error("Slider root changed");
    const control = owner.children[0]!;
    if (control.type !== "primitive") throw new Error("Slider control changed");
    const repeat = control.children[1]!;
    if (repeat.type !== "repeat") throw new Error("Slider repeat changed");
    if (kind === "collection") repeat.each = "other";
    if (kind === "item") repeat.item = "value";
    if (kind === "index") repeat.index = undefined;
    if (kind === "part" && repeat.children[0]?.type === "primitive")
      repeat.children[0].part = "Track";
    if (kind === "extra-child") repeat.children.push({ type: "text", value: "extra" });
    expect(() =>
      projectSvelteStyledGroup(group, { primitiveImportBase: "@starwind-ui/svelte" }),
    ).toThrow(/unsupported.*repeat/);
    expect(original.components[0]!.render).not.toEqual(group.components[0]!.render);
  },
);

import { createStyledSliderConsumer } from "../../../../packages/svelte/tests/styled-slider-consumer.js";
import { verifyStyledSlider } from "../../../../packages/svelte/tests/styled-slider-browser.js";
it("hydrates Styled Slider models, thumb identity, input and form behavior", async () => {
  const consumer = await createStyledSliderConsumer(process.cwd());
  try {
    await verifyStyledSlider(consumer);
  } finally {
    await consumer.dispose();
  }
}, 60000);
