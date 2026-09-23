import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { getPrimitiveGeneratorEntries } from "../../renderers/primitive-generator-registry.js";

it.each(["collapsible", "progress", "popover"])(
  "generates the supported %s lifetime boundary",
  async (component) => {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "svelte-lifetime-output-"));
    try {
      await getPrimitiveGeneratorEntries()
        .find((entry) => entry.component === component)!
        .generateTarget({ componentHeader: "", moduleHeader: "", outputRoot, target: "svelte" });
      const read = (file: string) =>
        readFile(path.join(outputRoot, component, file + ".svelte"), "utf8");
      if (component === "collapsible") {
        const root = await read("CollapsibleRoot"),
          trigger = await read("CollapsibleTrigger"),
          panel = await read("CollapsiblePanel");
        expect(root).toContain("initialOpen");
        expect(trigger).toContain('"aria-expanded": false');
        expect(trigger).toContain('"data-state": "closed"');
        expect(panel).toContain('data-state="closed" hidden={initialHidden}');
        expect(trigger + panel).not.toContain("disclosure?.initialOpen");
      } else if (component === "progress") {
        const root = await read("ProgressRoot"),
          value = await read("ProgressValue"),
          indicator = await read("ProgressIndicator"),
          label = await read("ProgressLabel");
        expect(value + indicator).not.toContain("getRangeStatusContext");
        expect(value + indicator).not.toContain("register(owner");
        expect(indicator).toContain("element.style.transform = transform");
        expect(root).toContain("setFormatOptions(");
        expect(label).not.toContain("context?.register(owner, element)");
        expect(label).toContain("{@attach attachRef}");
      } else {
        const root = await read("PopoverRoot");
        expect(root).not.toContain("acceptedTrigger");
        expect(root).not.toContain("isOwnedTrigger");
        expect(root).toContain("createPopover(root");
      }
    } finally {
      await rm(outputRoot, { recursive: true, force: true });
    }
  },
);
