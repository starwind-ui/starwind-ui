import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createStyledCheckboxConsumer } from "../../../../packages/svelte/tests/styled-checkbox-consumer.js";
import { verifyStyledCheckboxBrowser } from "../../../../packages/svelte/tests/styled-checkbox-browser.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { checkboxStyledContract } from "../../contracts/styled/components/checkbox.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { projectSvelteStyledGroup } from "../../renderers/framework-adapters/svelte/styled/projection.js";
import { renderSvelteStyledFiles } from "../../renderers/framework-adapters/svelte/styled/render.js";
import { generateSvelteStyled, SVELTE_STYLED_OUTPUT_DIR } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";

const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function fixture() {
  const consumer = await createStyledCheckboxConsumer(process.cwd());
  consumers.push(consumer);
  return consumer;
}

describe("generated Styled Checkbox", () => {
  it("projects Checkbox model, label, icon, and CSS without changing the shared source", async () => {
    const group = projectStyledOutputComponentGroup(checkboxStyledContract);
    const before = structuredClone(group);
    const files = renderSvelteStyledFiles(
      projectSvelteStyledGroup(group, { primitiveImportBase: "@starwind-ui/svelte" }),
    );
    expect(group).toEqual(before);
    expect(files[0]!.content).toContain("bind:checked={checked}");
    expect(files[0]!.content).toContain("checked = $bindable()");
    expect(files[0]!.content).toContain("{label}");
    expect(files[0]!.content).toContain('import "./styles.css"');
    expect(files.find((file) => file.relativePath.endsWith(".css"))!.content).toBe(
      group.styles!.content.join("\n") + "\n",
    );
    const root = await mkdtemp(path.join(os.tmpdir(), "styled-checkbox-"));
    try {
      await generateSvelteStyled({ outputRoot: root, roots: ["checkbox"] });
      const first = await readSvelteStyledTree(path.join(root, "checkbox"));
      expect([...first.keys()].sort()).toEqual([
        "Checkbox.svelte",
        "index.ts",
        "styles.css",
        "variants.ts",
      ]);
      await generateSvelteStyled({ outputRoot: root, roots: ["checkbox"] });
      expect(await readSvelteStyledTree(path.join(root, "checkbox"))).toEqual(first);
      expect(await readSvelteStyledTree(path.join(SVELTE_STYLED_OUTPUT_DIR, "checkbox"))).toEqual(
        first,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("server-renders Checkbox seeds and label content through the built facade", async () => {
    const consumer = await fixture();
    await consumer.write({
      "SSR.svelte": `<script lang="ts">import Checkbox from "./checkbox/index.js";</script><Checkbox id="choice" label="Accept terms" defaultChecked name="terms" /><Checkbox id="other" checked={false} defaultChecked label="Unchecked" /><Checkbox id="mixed" indeterminate label="Mixed" />`,
      "ssr.mjs": `import assert from "node:assert/strict"; import { render } from "svelte/server"; import App from "./SSR.svelte"; import Default, * as exports from "./checkbox/index.js";
assert.equal(globalThis.document, undefined); assert.equal(Default, exports.Checkbox); assert.deepEqual(Object.keys(exports).sort(), ["Checkbox", "CheckboxVariants", "default"]); console.log(JSON.stringify({body: render(App).body, facade: import.meta.resolve("@starwind-ui/svelte/checkbox")}));`,
    });
    const { body, facade } = JSON.parse(await consumer.run("ssr.mjs", { loader: true }));
    expect(facade).toContain(
      `${consumer.root}/node_modules/@starwind-ui/svelte/dist/checkbox/index.js`,
    );
    expect(body).toContain('for="choice"');
    expect(body).toContain("Accept terms");
    expect(body).not.toContain("{label}");
    expect(body).toContain('aria-checked="mixed"');
    expect(body.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(body.match(/aria-checked="false"/g)).toHaveLength(1);
    expect(body.match(/data-sw-checkbox-check-icon/g)).toHaveLength(3);
  });

  it("preserves Checkbox accepted models, cancellation, parent echoes, form seeds, and native owners", async () => {
    const result = await verifyStyledCheckboxBrowser(await fixture());
    expect(result.initial).toMatchObject({
      omitted: { model: "undefined", checked: "false", form: "no", callbacks: [] },
      defaulted: { model: "undefined", checked: "true", form: "yes", callbacks: [] },
      plain: { model: false, checked: "false", callbacks: [] },
      undefined: { model: true, checked: "true", callbacks: [] },
    });
    expect(result.interactions).toMatchObject({
      omitted: { model: "undefined", checked: "true", form: "yes" },
      defaulted: { model: "undefined", checked: "false", form: "no" },
      plain: { model: false, checked: "true", form: "yes" },
      undefined: {
        model: false,
        checked: "false",
        callbacks: [{ next: false, previous: true, owner: "a" }],
      },
      bound: {
        model: true,
        checked: "true",
        callbacks: [{ next: true, previous: false, owner: "a" }],
      },
      function: { model: true, checked: "true", writes: [true] },
    });
    expect(result.observations).toEqual([
      { id: "cancel", canceled: true, model: false },
      { id: "dom", canceled: false, model: false },
    ]);
    for (const id of ["cancel", "dom"])
      expect(result.cancellation[id]).toMatchObject({
        checked: "false",
        model: false,
        writes: [],
        form: "no",
        callbacks: [{ next: true, previous: false, owner: "a" }],
      });
    expect(result.laterUndefined).toMatchObject({ checked: "true", model: "undefined" });
    expect(result.silent).toMatchObject({ checked: "false", model: false });
    expect(result.silent.callbacks).toHaveLength(1);
    expect(result.reset).toMatchObject({ checked: "true", model: false, form: "yes" });
    expect(result.reset.callbacks).toHaveLength(1);
    expect(result.disabled).toMatchObject({ form: null, checked: "true" });
    expect(result.mixed.checked).toBe("mixed");
    expect(result.readOnly.callbacks).toHaveLength(1);
    expect(result.ownersClass).toMatchObject({ model: false, checked: "false", callbacks: [] });
    expect(result.ownersClass.refs.at(-1)).toBe("a:SPAN");
    expect(result.ownersReplaced.refs.at(-1)).toBe("b:SPAN");
    expect(result.ownersReplaced.attachments.at(-1)).toBe("b:setup");
    expect(result.ownersClicked.callbacks).toEqual([{ next: true, previous: false, owner: "b" }]);
    expect(result.finalOwners.callbacks).toEqual(result.ownersClicked.callbacks);
    expect(result.finalOwners.refs.at(-1)).toBe("b:null");
    expect(result.finalOwners.attachments.at(-1)).toBe("b:cleanup");
    expect(result.finalOwners.attachments.filter((entry: string) => entry.endsWith(":setup")))
      .toHaveLength(
        result.finalOwners.attachments.filter((entry: string) => entry.endsWith(":cleanup"))
          .length,
      );
    expect(result.nativeForm).toBe("yes");
  }, 60_000);
});
