import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createStyledDialogConsumer } from "../../../../packages/svelte/tests/styled-dialog-consumer.js";
import { verifyStyledDialogBrowser } from "../../../../packages/svelte/tests/styled-dialog-browser.js";

import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { dialogStyledContract } from "../../contracts/styled/components/dialog.js";
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
  const consumer = await createStyledDialogConsumer(process.cwd());
  consumers.push(consumer);
  return consumer;
}

describe("generated Styled Dialog", () => {
  it("projects Dialog-only dependency closure and every contract file without source mutation", async () => {
    const group = projectStyledOutputComponentGroup(dialogStyledContract),
      before = structuredClone(group);
    const files = renderSvelteStyledFiles(
      projectSvelteStyledGroup(group, { primitiveImportBase: "@starwind-ui/svelte" }),
    );
    expect(group).toEqual(before);
    expect(files).toHaveLength(11);
    expect(files.find((file) => file.relativePath.endsWith("/Dialog.svelte"))!.content).toContain(
      "bind:open={open}",
    );
    expect(files.find((file) => file.relativePath.endsWith("/Dialog.svelte"))!.content).toContain(
      "children={children}",
    );
    expect(
      files.find((file) => file.relativePath.endsWith("/DialogContent.svelte"))!.content,
    ).toContain('from "../button/index.js"');
    const root = await mkdtemp(path.join(os.tmpdir(), "styled-dialog-"));
    try {
      await generateSvelteStyled({ outputRoot: root, roots: ["dialog"] });
      const first = await readSvelteStyledTree(root);
      expect(first.size).toBe(14);
      expect([...first.keys()].filter((name) => name.startsWith("button/"))).toHaveLength(3);
      expect(await readSvelteStyledTree(path.join(root, "dialog"))).toEqual(
        await readSvelteStyledTree(path.join(SVELTE_STYLED_OUTPUT_DIR, "dialog")),
      );
      await generateSvelteStyled({ outputRoot: root, roots: ["dialog"] });
      expect(await readSvelteStyledTree(root)).toEqual(first);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("server-renders Dialog state snippets with closed native markup and complete exports", async () => {
    const consumer = await fixture();
    await consumer.write({
      "SSR.svelte": `<script lang="ts">import Dialog from "./dialog/index.js";</script><Dialog.Root defaultOpen>{#snippet children(open)}<span>Accepted {String(open)}</span><Dialog.Trigger>Open</Dialog.Trigger><Dialog.Content><Dialog.Header><Dialog.Title>Title</Dialog.Title><Dialog.Description>Description</Dialog.Description></Dialog.Header><Dialog.Footer><Dialog.Close /></Dialog.Footer></Dialog.Content>{/snippet}</Dialog.Root>`,
      "ssr.mjs": `import assert from "node:assert/strict"; import { render } from "svelte/server"; import App from "./SSR.svelte"; import Parts, * as exports from "./dialog/index.js"; assert.equal(globalThis.document, undefined); assert.equal(Parts.Root, exports.Dialog); console.log(JSON.stringify({ body: render(App).body, names: Object.keys(exports).sort(), facade: import.meta.resolve("@starwind-ui/svelte/dialog") }));`,
    });
    const result = JSON.parse(await consumer.run("ssr.mjs", { loader: true }));
    expect(result.names).toEqual(
      [...dialogStyledContract.publicExports, "DialogVariants", "default"].sort(),
    );
    expect(result.facade).toContain(
      `${consumer.root}/node_modules/@starwind-ui/svelte/dist/dialog/index.js`,
    );
    expect(result.body).toContain("Accepted true");
    expect(result.body).toContain('data-slot="dialog-close"');
    expect(result.body).toContain("<dialog");
    expect(result.body).not.toMatch(/<dialog[^>]*\sopen(?:\s|[=>])/);
    expect(result.body.match(/data-sw-dialog-close/g)).toHaveLength(2);
  });

  it("preserves Dialog omitted, undefined, plain, bound, retained, and echoed models", async () => {
    const result = await verifyStyledDialogBrowser(
      await fixture(),
      [
        { id: "omitted", mode: "omitted", defaultOpen: true },
        { id: "plain", mode: "plain", defaultOpen: true },
        { id: "bound", mode: "bound", defaultOpen: true },
        { id: "undefined", defaultOpen: true },
        { id: "retained", initial: false, setter: "retain" },
        { id: "inverted", initial: false, setter: "invert" },
        { id: "echo", initial: false, proposal: "echo" },
        { id: "defined", initial: false, defaultOpen: true },
      ],
      `
      const initial = Object.fromEntries(Object.keys(cases).map((id) => [id, state(id)]));
      for (const id of ["undefined", "bound", "plain", "omitted"]) { close(id); await finish(); }
      await finish(); const closed = Object.fromEntries(["omitted", "plain", "bound", "undefined"].map((id) => [id, state(id)]));
      for (const id of ["retained", "inverted", "echo"]) { trigger(id); await finish(); }
      const accepted = Object.fromEntries(["retained", "inverted", "echo"].map((id) => [id, state(id)]));
      cases.plain.setModel(true); await settle(); cases.plain.setModel(undefined); await settle(); const laterUndefined = state("plain");
      cases.defined.options(); await finish(); const reconstructed = state("defined");
      return { initial, closed, accepted, laterUndefined, reconstructed };
    `,
    );
    expect(result.initial.omitted).toMatchObject({
      model: "undefined",
      native: true,
      rendered: "true",
      callbacks: [],
    });
    expect(result.initial.undefined).toMatchObject({ model: "undefined", writes: [], callbacks: [] });
    expect(result.initial.defined).toMatchObject({
      model: false,
      native: false,
      callbacks: [],
      writes: [],
    });
    for (const mode of ["omitted", "plain", "bound", "undefined"]) {
      expect(result.closed[mode]).toMatchObject({ native: false, rendered: "false" });
      expect(result.closed[mode].callbacks).toHaveLength(1);
      expect(result.closed[mode].completions).toHaveLength(1);
    }
    expect(result.closed.undefined.writes).toEqual([false]);
    expect(result.closed.bound.model).toBe(false);
    expect(result.closed.plain.model).toBe("undefined");
    for (const id of ["retained", "inverted"])
      expect(result.accepted[id]).toMatchObject({
        model: false,
        native: true,
        writes: [true],
        callbacks: [{ next: true, previous: false, owner: "a" }],
      });
    expect(result.accepted.echo).toMatchObject({
      model: true,
      native: true,
      callbacks: [{ next: true, previous: false, owner: "a" }],
    });
    expect(result.laterUndefined).toMatchObject({
      model: "undefined",
      native: true,
      rendered: "true",
    });
    expect(result.reconstructed).toMatchObject({
      model: false,
      native: false,
      writes: [],
      completions: [],
    });
  }, 60_000);

  it("preserves Dialog callback and DOM cancellation with reentrant parent commands", async () => {
    const result = await verifyStyledDialogBrowser(
      await fixture(),
      [
        { id: "cancel", initial: false, proposal: "cancel" },
        { id: "dom", initial: false },
        { id: "command", initial: false, proposal: "command-cancel" },
        { id: "two", initial: false, proposal: "two-commands" },
        { id: "unmount", initial: false, proposal: "unmount" },
      ],
      `
      root("dom").addEventListener("starwind:open-change", (event) => event.preventDefault());
      for (const id of Object.keys(cases)) { trigger(id); await finish(); }
      return { states: Object.fromEntries(Object.keys(cases).map((id) => [id, state(id)])) };
    `,
    );
    for (const id of ["cancel", "dom", "two"])
      expect(result.states[id]).toMatchObject({
        model: false,
        native: false,
        writes: [],
        callbacks: [{ next: true, previous: false, owner: "a" }],
      });
    expect(result.states.unmount).toMatchObject({ native: null, writes: [] });
  }, 60_000);

  it("keeps Dialog native close completion separate from accepted state and balances replaced owners", async () => {
    const result = await verifyStyledDialogBrowser(
      await fixture(),
      [{ id: "owner", initial: true, modal: true }],
      `
      const originalButton = button("owner"), originalPopup = popup("owner"); const before = state("owner");
      cases.owner.changeClass(); await settle(); const afterClass = state("owner");
      cases.owner.replaceOwners(); await settle(); const replaced = state("owner");
      assert(originalButton === button("owner") && originalPopup === popup("owner"), "Dialog ref replacement changed semantic owners");
      close("owner"); flushSync(); const pending = state("owner"); await finish(); const completed = state("owner");
      trigger("owner"); await finish(); cases.owner.replaceRoot(); await finish(); originalButton.click(); await settle();
      const replacement = { ...state("owner"), replacedPopup: originalPopup !== popup("owner"), oldDetached: !originalPopup.isConnected };
      const live = popup("owner"); close("owner"); flushSync(); cases.owner.setModel(true); await finish(); const interrupted = state("owner");
      cases.owner.hide(); await finish(); const removed = { ...state("owner"), detached: !live.isConnected };
      return { before, afterClass, replaced, pending, completed, replacement, interrupted, removed };
    `,
    );
    expect(result.afterClass.refs.at(-1)).toBe("a:BUTTON");
    expect(result.afterClass.attachments.at(-1)).toBe("a:setup");
    expect(result.afterClass.headerRefs.at(-1)).toBe("a:DIV");
    expect(result.afterClass.headerAttachments.at(-1)).toBe("a:setup");
    expect(
      result.afterClass.headerAttachments.filter((entry: string) => entry.endsWith(":setup"))
        .length,
    ).toBe(
      result.afterClass.headerAttachments.filter((entry: string) => entry.endsWith(":cleanup"))
        .length + 1,
    );
    expect(result.replaced.refs.at(-1)).toBe("b:BUTTON");
    expect(result.replaced.headerRefs.at(-1)).toBe("b:DIV");
    expect(result.pending).toMatchObject({
      model: false,
      native: true,
      topLayer: true,
      writes: [false],
      completions: [],
    });
    expect(result.completed).toMatchObject({
      model: false,
      native: false,
      topLayer: false,
      completions: [{ model: false, native: false }],
    });
    expect(result.replacement).toMatchObject({
      model: true,
      native: true,
      topLayer: true,
      replacedPopup: true,
      oldDetached: true,
    });
    expect(result.interrupted).toMatchObject({ model: true, native: true, topLayer: true });
    expect(result.removed).toMatchObject({ native: null, topLayer: false, detached: true });
    expect(result.final.owner.refs.at(-1)).toBe("b:null");
    expect(result.final.owner.headerRefs.at(-1)).toBe("b:null");
    expect(result.final.owner.attachments.at(-1)).toBe("b:cleanup");
    expect(result.final.owner.attachments.filter((entry: string) => entry.endsWith(":setup")))
      .toHaveLength(
        result.final.owner.attachments.filter((entry: string) => entry.endsWith(":cleanup"))
          .length,
      );
    expect(result.final.owner.headerAttachments[0]).toBe("a:setup");
    expect(result.final.owner.headerAttachments.at(-1)).toBe("b:cleanup");
    expect(
      result.final.owner.headerAttachments.filter((entry: string) => entry.endsWith(":setup"))
        .length,
    ).toBe(
      result.final.owner.headerAttachments.filter((entry: string) => entry.endsWith(":cleanup"))
        .length,
    );
  }, 60_000);

  it("keeps nested Styled Select keyboard selection, dismissal, focus return, and open unmount inside Dialog", async () => {
    const result = await verifyStyledDialogBrowser(
      await fixture(),
      [{ id: "nested", initial: false, modal: true, nested: true }],
      `
      const outerTrigger = button("nested"); outerTrigger.focus(); trigger("nested"); await finish();
      const selectTrigger = popup("nested").querySelector("[data-sw-select-trigger]"); selectTrigger.focus(); selectTrigger.click(); await finish();
      const list = document.querySelector('[aria-label="Nested choices"]'), portal = list.closest("[data-sw-select-portal]");
      assert(list.contains(document.activeElement), "Nested Select did not focus its list");
      document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true })); await settle();
      assert(document.activeElement.getAttribute("data-value") === "beta", "Nested Select failed disabled-item skipping");
      document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })); await finish();
      const selected = { ...state("nested"), focus: document.activeElement === selectTrigger, portalInDialog: popup("nested").contains(portal) };
      selectTrigger.click(); await finish(); document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); await finish();
      const dismissedSelect = { ...state("nested"), focus: document.activeElement === selectTrigger };
      popup("nested").dispatchEvent(new Event("cancel", { cancelable: true })); await finish();
      const dismissedDialog = { ...state("nested"), focus: document.activeElement === outerTrigger };
      trigger("nested"); await finish(); selectTrigger.click(); await finish(); cases.nested.hide(); await finish();
      return { selected, dismissedSelect, dismissedDialog, removed: !portal.isConnected };
    `,
    );
    expect(result.selected).toMatchObject({
      model: true,
      native: true,
      selected: "beta",
      selectOpen: false,
      focus: true,
      portalInDialog: true,
    });
    expect(result.dismissedSelect).toMatchObject({
      model: true,
      native: true,
      selectOpen: false,
      focus: true,
    });
    expect(result.dismissedDialog).toMatchObject({ model: false, native: false, focus: true });
    expect(result.removed).toBe(true);
  }, 60_000);
});
