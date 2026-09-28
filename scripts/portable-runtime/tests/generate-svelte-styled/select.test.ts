import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createStyledSelectConsumer } from "../../../../packages/svelte/tests/styled-select-consumer.js";
import { verifyStyledSelectBrowser } from "../../../../packages/svelte/tests/styled-select-browser.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { selectStyledContract } from "../../contracts/styled/components/select.js";
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
  const consumer = await createStyledSelectConsumer(process.cwd());
  consumers.push(consumer);
  return consumer;
}

describe("generated Styled Select", () => {
  it("projects the complete Select group deterministically without changing shared models", async () => {
    const group = projectStyledOutputComponentGroup(selectStyledContract);
    const before = structuredClone(group);
    const files = renderSvelteStyledFiles(
      projectSvelteStyledGroup(group, { primitiveImportBase: "@starwind-ui/svelte" }),
    );
    expect(group).toEqual(before);
    expect(files).toHaveLength(14);
    const content = files.find((file) =>
      file.relativePath.endsWith("/SelectContent.svelte"),
    )!.content;
    expect(content).toContain("ref={capturePositioner}");
    expect(content).toContain("view.getComputedStyle(popup).zIndex");
    expect(content).toContain('class={selectContent({ "size": size, "class": cx(className) })}');
    expect(files.find((file) => file.relativePath.endsWith("/Select.svelte"))!.content).toContain(
      "bind:open={open}",
    );
    expect(files.find((file) => file.relativePath.endsWith("/Select.svelte"))!.content).toContain(
      "bind:value={value}",
    );
    expect(
      files.find((file) => file.relativePath.endsWith("/SelectValue.svelte"))!.content,
    ).toContain("children={children}");
    const root = await mkdtemp(path.join(os.tmpdir(), "styled-select-"));
    try {
      await generateSvelteStyled({ outputRoot: root, roots: ["select"] });
      const first = await readSvelteStyledTree(path.join(root, "select"));
      expect([...first.keys()].sort()).toEqual(
        [
          ...selectStyledContract.publicExports.map((name) => `${name}.svelte`),
          "index.ts",
          "variants.ts",
        ].sort(),
      );
      await generateSvelteStyled({ outputRoot: root, roots: ["select"] });
      expect(await readSvelteStyledTree(path.join(root, "select"))).toEqual(first);
      expect(await readSvelteStyledTree(path.join(SVELTE_STYLED_OUTPUT_DIR, "select"))).toEqual(
        first,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("keeps the positioner's stacking value with live popup classes, inline styles, and viewport rules", async () => {
    const result = await verifyStyledSelectBrowser(
      await fixture(),
      [{ id: "stacking", defaultOpen: true }],
      `
      const node = popup("stacking");
      const positioner = node.closest("[data-sw-select-positioner]");
      const read = () => ({ popup: getComputedStyle(node).zIndex, positioner: getComputedStyle(positioner).zIndex });
      const initial = read();
      cases.stacking.stylePopup("custom-layer", "color: rgb(1, 2, 3)"); await settle();
      const custom = { ...read(), color: getComputedStyle(node).color };
      cases.stacking.stylePopup("custom-layer", "z-index: 91; color: rgb(1, 2, 3)"); await settle();
      const inline = read();
      cases.stacking.stylePopup("responsive-layer", ""); await settle();
      const wide = read();
      await window.resizeSelectViewport(600);
      await new Promise(requestAnimationFrame); await settle();
      const narrow = read();
      cases.stacking.hide(); await settle();
      node.style.zIndex = "999";
      window.dispatchEvent(new Event("resize")); await settle();
      const released = positioner.style.zIndex;
      return { initial, custom, inline, wide, narrow, released };
      `,
      ".z-50 { z-index: 50; } .custom-layer { z-index: 73; } .responsive-layer { z-index: 81; } @media (max-width: 800px) { .responsive-layer { z-index: 83; } }",
    );
    expect(result.initial).toEqual({ popup: "50", positioner: "50" });
    expect(result.custom).toEqual({ popup: "73", positioner: "73", color: "rgb(1, 2, 3)" });
    expect(result.inline).toEqual({ popup: "91", positioner: "91" });
    expect(result.wide).toEqual({ popup: "81", positioner: "81" });
    expect(result.narrow).toEqual({ popup: "83", positioner: "83" });
    expect(result.released).toBe("");
  });

  it("server-renders Select seeds, fallback values, complete exports, and inline portal markup", async () => {
    const consumer = await fixture();
    await consumer.write({
      "SSR.svelte": `<script lang="ts">import Select from "./select/index.js";</script><Select.Root defaultValue="alpha" defaultOpen><Select.Trigger placeholder="Choose" /><Select.Value placeholder="Fallback" /><Select.Value>{#snippet children(label, value)}Custom {value}{/snippet}</Select.Value><Select.Content><Select.Item value="alpha">Alpha</Select.Item></Select.Content></Select.Root>`,
      "ssr.mjs": `import assert from "node:assert/strict"; import { render } from "svelte/server"; import App from "./SSR.svelte"; import Parts, * as exports from "./select/index.js"; assert.equal(globalThis.document, undefined); assert.equal(Parts.Root, exports.Select); console.log(JSON.stringify({ body: render(App).body, names: Object.keys(exports).sort(), facade: import.meta.resolve("@starwind-ui/svelte/select") }));`,
    });
    const result = JSON.parse(await consumer.run("ssr.mjs", { loader: true }));
    expect(result.names).toEqual(
      [...selectStyledContract.publicExports, "SelectVariants", "default"].sort(),
    );
    expect(result.facade).toContain(
      `${consumer.root}/node_modules/@starwind-ui/svelte/dist/select/index.js`,
    );
    expect(result.body).toContain("Choose");
    expect(result.body).toContain("Fallback");
    expect(result.body).toContain("Custom alpha");
    expect(result.body).toContain('aria-expanded="true"');
    expect(result.body).toContain('data-sw-select-portal=""');
    expect(result.body.indexOf('data-slot="select"')).toBeLessThan(
      result.body.indexOf('data-slot="select-portal"'),
    );
  });

  it("preserves independent Select models, undefined bindings, silent commands, and reset seeds", async () => {
    const result = await verifyStyledSelectBrowser(
      await fixture(),
      [
        { id: "omitted", mode: "omitted" },
        { id: "defaulted", mode: "omitted", defaultOpen: true, defaultValue: "alpha" },
        {
          id: "plain",
          mode: "plain",
          initialOpen: false,
          initialValue: "beta",
          defaultValue: "alpha",
        },
        { id: "undefined", defaultOpen: true, defaultValue: "alpha" },
        { id: "bound", mode: "bound", initialOpen: false, initialValue: null },
        { id: "open-only", mode: "open-only", initialOpen: false, defaultValue: "alpha" },
        { id: "value-only", mode: "value-only", initialValue: "alpha" },
        { id: "open-undefined", mode: "open-only", defaultOpen: true, defaultValue: "alpha" },
        { id: "value-undefined", mode: "value-only", defaultValue: "alpha" },
        { id: "empty", initialOpen: false, initialValue: "" },
        {
          id: "retained",
          initialOpen: false,
          initialValue: "alpha",
          openSetter: "retained",
          valueSetter: "retained",
        },
        { id: "transform", initialOpen: false, initialValue: "alpha", valueSetter: "transform" },
      ],
      `
      const initial = Object.fromEntries(Object.keys(cases).map((id) => [id, state(id)]));
      for (const id of ["omitted", "plain", "bound", "open-only", "value-only"]) { trigger(id); await settle(); choose(id, id === "plain" ? "gamma" : "beta"); await settle(); }
      choose("undefined", "beta"); await settle();
      trigger("retained"); await settle(); const retainedOpen = state("retained"); cases.retained.setOpen(true); await settle(); choose("retained", "beta"); await settle();
      trigger("transform"); await settle(); choose("transform", "beta"); await settle();
      const accepted = Object.fromEntries(Object.keys(cases).map((id) => [id, state(id)]));
      cases.undefined.setDefault("gamma"); reset("undefined"); await resetSettled(); const boundReset = state("undefined");
      cases.plain.setOpen(true); cases.plain.setValue("gamma"); await settle();
      cases.plain.setOpen(undefined); cases.plain.setValue(undefined); await settle(); const laterUndefined = state("plain");
      cases.plain.setOpen(false); cases.plain.setValue("beta"); cases.plain.setDefault("gamma"); await settle(); const silent = state("plain");
      reset("plain"); await resetSettled(); const resetSeed = state("plain");
      cases.bound.setDisabled(true); await settle(); const disabled = state("bound");
      cases["value-only"].setReadOnly(true); await settle(); trigger("value-only"); await settle(); choose("value-only", "gamma"); await settle(); const readonly = state("value-only");
      return { initial, accepted, retainedOpen, boundReset, laterUndefined, silent, resetSeed, disabled, readonly };
    `,
    );
    expect(result.initial.omitted).toMatchObject({
      open: false,
      value: null,
      openModel: "undefined",
      valueModel: "undefined",
      label: "Choose",
    });
    expect(result.initial.defaulted).toMatchObject({
      open: true,
      value: "alpha",
      openModel: "undefined",
      valueModel: "undefined",
    });
    expect(result.initial.undefined).toMatchObject({
      open: true,
      value: "alpha",
      openModel: true,
      valueModel: "alpha",
      openWrites: [true],
      valueWrites: ["alpha"],
      openCallbacks: [],
      valueCallbacks: [],
    });
    expect(result.initial["open-undefined"]).toMatchObject({
      open: true,
      value: "alpha",
      openModel: true,
      valueModel: "undefined",
      openWrites: [true],
      valueWrites: [],
    });
    expect(result.initial["value-undefined"]).toMatchObject({
      open: false,
      value: "alpha",
      openModel: "undefined",
      valueModel: "alpha",
      openWrites: [],
      valueWrites: ["alpha"],
    });
    expect(result.initial.plain).toMatchObject({
      open: false,
      value: "beta",
      openCallbacks: [],
      valueCallbacks: [],
    });
    expect(result.initial.empty).toMatchObject({
      value: null,
      valueModel: null,
      valueWrites: [null],
    });
    expect(result.accepted.bound).toMatchObject({
      openModel: false,
      valueModel: "beta",
      formValue: "beta",
      label: "Beta",
    });
    expect(result.accepted.plain).toMatchObject({
      open: false,
      value: "gamma",
      openModel: false,
      valueModel: "beta",
    });
    expect(result.accepted["open-only"]).toMatchObject({
      openModel: false,
      valueModel: "undefined",
      value: "beta",
      openWrites: [true, false],
      valueWrites: [],
    });
    expect(result.accepted["value-only"]).toMatchObject({
      openModel: "undefined",
      valueModel: "beta",
      valueWrites: ["beta"],
      openWrites: [],
    });
    expect(result.accepted.undefined).toMatchObject({
      openWrites: [true, false],
      valueWrites: ["alpha", "beta"],
    });
    expect(result.retainedOpen).toMatchObject({
      open: false,
      openModel: false,
      openWrites: [true],
    });
    expect(result.accepted.retained).toMatchObject({
      value: "alpha",
      valueModel: "alpha",
      valueWrites: ["beta"],
    });
    expect(result.accepted.transform).toMatchObject({
      value: "gamma",
      valueModel: "gamma",
      valueWrites: ["beta"],
    });
    expect(result.boundReset).toMatchObject({
      open: false,
      value: "alpha",
      valueModel: "alpha",
      formValue: "alpha",
      valueWrites: ["alpha", "beta", "alpha"],
    });
    expect(result.boundReset.valueCallbacks).toHaveLength(1);
    expect(result.laterUndefined).toMatchObject({
      open: true,
      value: "gamma",
      openModel: "undefined",
      valueModel: "undefined",
    });
    expect(result.silent.openCallbacks).toHaveLength(2);
    expect(result.silent.valueCallbacks).toHaveLength(1);
    expect(result.resetSeed).toMatchObject({
      open: false,
      value: "alpha",
      formValue: "alpha",
      valueModel: "beta",
    });
    expect(result.resetSeed.valueCallbacks).toHaveLength(1);
    expect(result.disabled.formValue).toBeNull();
    expect(result.readonly).toMatchObject({
      open: true,
      value: "beta",
      valueModel: "beta",
      valueWrites: ["beta"],
    });
    expect(result.readonly.valueCallbacks).toHaveLength(1);
  }, 60_000);

  it("preserves Select cancellation, parent echoes, and reentrant commands across both models", async () => {
    const result = await verifyStyledSelectBrowser(
      await fixture(),
      [
        { id: "open-cancel", initialOpen: false, initialValue: "alpha", openProposal: "cancel" },
        { id: "value-cancel", initialOpen: true, initialValue: "alpha", valueProposal: "cancel" },
        { id: "open-dom", initialOpen: false, initialValue: "alpha" },
        { id: "value-dom", initialOpen: true, initialValue: "alpha" },
        {
          id: "echo",
          initialOpen: false,
          initialValue: "alpha",
          openProposal: "echo",
          valueProposal: "echo",
        },
        {
          id: "open-command",
          initialOpen: false,
          initialValue: "alpha",
          openProposal: "value-command-cancel",
        },
        {
          id: "value-command",
          initialOpen: true,
          initialValue: "alpha",
          valueProposal: "both-command-cancel",
        },
      ],
      `
      root("open-dom").addEventListener("starwind:open-change", (event) => event.preventDefault());
      root("value-dom").addEventListener("starwind:value-change", (event) => event.preventDefault());
      for (const id of ["open-cancel", "open-dom", "open-command"]) { trigger(id); await settle(); }
      for (const id of ["value-cancel", "value-dom", "value-command"]) { choose(id, "beta"); await settle(); }
      trigger("echo"); await settle(); choose("echo", "beta"); await settle();
      return { states: Object.fromEntries(Object.keys(cases).map((id) => [id, state(id)])) };
    `,
    );
    for (const id of ["open-cancel", "open-dom"]) {
      expect(result.states[id]).toMatchObject({
        open: false,
        openModel: false,
        openWrites: [],
        valueWrites: [],
      });
      expect(result.states[id].openCallbacks).toHaveLength(1);
    }
    for (const id of ["value-cancel", "value-dom"]) {
      expect(result.states[id]).toMatchObject({
        value: "alpha",
        valueModel: "alpha",
        valueWrites: [],
        formValue: "alpha",
      });
      expect(result.states[id].valueCallbacks).toHaveLength(1);
    }
    expect(result.states.echo).toMatchObject({ open: false, value: "beta", valueModel: "beta" });
    expect(result.states.echo.openCallbacks).toHaveLength(2);
    expect(result.states.echo.valueCallbacks).toHaveLength(1);
    expect(result.states["open-command"]).toMatchObject({
      open: false,
      value: "gamma",
      valueModel: "gamma",
      openWrites: [],
      valueWrites: [],
    });
    expect(result.states["value-command"]).toMatchObject({
      open: true,
      value: "gamma",
      valueModel: "gamma",
      valueWrites: [],
    });
  }, 60_000);

  it("keeps Select portal presence, Styled Button owners, refs, and cleanup through close and unmount", async () => {
    const result = await verifyStyledSelectBrowser(
      await fixture(),
      [{ id: "owner", initialOpen: true, initialValue: "alpha" }],
      `
      const originalPortal = portal("owner"), originalPopup = popup("owner"), originalButton = button("owner");
      const before = state("owner"); cases.owner.changeClass(); await settle(); const afterClass = state("owner");
      cases.owner.replaceOwners(); await settle(); const replaced = state("owner");
      assert(originalButton === button("owner") && originalPopup === popup("owner"), "Select ref replacement changed elements");
      cases.owner.retarget(document.getElementById("portal-b")); await settle(); const retargeted = state("owner");
      cases.owner.setDisablePortal(true); await settle(); const inline = portal("owner").parentElement === root("owner");
      cases.owner.setDisablePortal(false); await settle();
      const animation = originalPopup.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 60000 }); animation.pause();
      cases.owner.setOpen(false); await settle(); const pending = { hidden: originalPopup.hidden, ending: originalPopup.hasAttribute("data-ending-style") };
      animation.finish(); await animation.finished; await settle(); const closed = state("owner");
      cases.owner.setOpen(true); await settle(); cases.owner.replaceTrigger(); await settle(); originalButton.click(); await settle();
      const replacement = { samePortal: originalPortal === portal("owner"), samePopup: originalPopup === popup("owner"), staleDetached: !originalButton.isConnected, ...state("owner") };
      button("owner").focus(); trigger("owner"); await settle(); const clicked = state("owner");
      cases.owner.setOpen(true); await settle(); const interrupted = originalPopup.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 60000 }); interrupted.pause();
      cases.owner.setOpen(false); await settle(); cases.owner.setOpen(true); await settle(); interrupted.finish(); await interrupted.finished; await settle(); const reopened = state("owner");
      cases.owner.hide(); await settle(); const detached = !originalPortal.isConnected;
      return { before, afterClass, replaced, retargeted, inline, pending, closed, replacement, clicked, reopened, detached };
    `,
    );
    expect(result.afterClass.refs).toEqual(result.before.refs);
    expect(result.afterClass.attachments.filter((value: string) => value.endsWith(":setup"))).toHaveLength(
      result.afterClass.attachments.filter((value: string) => value.endsWith(":cleanup")).length + 1,
    );
    expect(result.replaced.refs).toEqual(["a:BUTTON", "a:null", "b:BUTTON"]);
    expect(result.replaced.popupRefs).toEqual(["a:DIV", "a:null", "b:DIV"]);
    expect(result.replaced.attachments.filter((value: string) => value.endsWith(":setup"))).toHaveLength(
      result.replaced.attachments.filter((value: string) => value.endsWith(":cleanup")).length + 1,
    );
    expect(result.retargeted.portalParent).toBe("portal-b");
    expect(result.inline).toBe(true);
    expect(result.pending).toEqual({ hidden: false, ending: true });
    expect(result.closed.popupHidden).toBe(true);
    expect(result.replacement).toMatchObject({
      samePortal: true,
      samePopup: true,
      staleDetached: true,
      open: true,
      openCallbacks: [],
    });
    expect(result.clicked.openCallbacks).toEqual([
      { next: false, open: true, value: "alpha", owner: "b" },
    ]);
    expect(result.reopened).toMatchObject({ open: true, popupHidden: false });
    expect(result.detached).toBe(true);
    expect(result.final.owner.refs).toEqual([
      "a:BUTTON",
      "a:null",
      "b:BUTTON",
      "b:null",
      "b:BUTTON",
      "b:null",
    ]);
    expect(
      result.final.owner.attachments.filter((value: string) => value.endsWith(":setup")),
    ).toHaveLength(
      result.final.owner.attachments.filter((value: string) => value.endsWith(":cleanup")).length,
    );
    expect(result.final.owner.popupRefs).toEqual(["a:DIV", "a:null", "b:DIV", "b:null"]);
    expect(result.final.owner.rootRefs.at(0)).toBe("DIV");
    expect(result.final.owner.rootRefs.at(-1)).toBe("null");
    expect(result.final.owner.rootRefs.filter((value: string) => value === "DIV")).toHaveLength(
      result.final.owner.rootRefs.filter((value: string) => value === "null").length,
    );
  }, 60_000);
});
