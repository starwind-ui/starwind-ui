import { afterEach, describe, expect, it } from "vitest";
import { verifyAlertDialogBrowser } from "../../../../packages/svelte/tests/alert-dialog-browser.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { createStyledAlertDialogConsumer } from "../../../../packages/svelte/tests/styled-alert-dialog-consumer.js";
import { alertDialogStyledContract } from "../../contracts/styled/components/alert-dialog.js";
import { projectSvelteStyledGroup } from "../../renderers/framework-adapters/svelte/styled/projection.js";
import { renderSvelteStyledFiles } from "../../renderers/framework-adapters/svelte/styled/render.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";

const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function fixture() {
  const consumer = await createStyledAlertDialogConsumer(process.cwd());
  consumers.push(consumer);
  return consumer;
}

describe("generated Styled Alert Dialog lifecycle", () => {
  it("notifies the existing Alert Dialog owner from both Styled Button attachments", () => {
    const files = renderSvelteStyledFiles(
      projectSvelteStyledGroup(projectStyledOutputComponentGroup(alertDialogStyledContract), {
        primitiveImportBase: "@starwind-ui/svelte",
      }),
    );
    for (const name of ["Action", "Cancel"]) {
      const source = files.find((file) =>
        file.relativePath.endsWith(`/AlertDialog${name}.svelte`),
      )!.content;
      expect(source).toContain("getAlertDialogControlRefresh()");
      expect(source).toContain("[createAttachmentKey()]");
      expect(source).toContain("return () => requestRefresh?.()");
      expect(source).toContain("{...controlAttachment}");
      expect(source).not.toContain("MutationObserver");
    }
  });

  it("retains the inherited Button anchor and semantic child branches during replacement", async () => {
    const result = await verifyAlertDialogBrowser(
      await fixture(),
      [{ id: "main", initial: false }],
      `
      trigger("main"); await finish();
      assert(state("main").model === true, "Styled Root publishes accepted open");
      const buttonClose = document.querySelector('[data-close="main"]');
      assert(buttonClose.tagName === "BUTTON", "Action button semantic child");
      cases.main.setAnchor(true); await finish();
      const anchor = document.querySelector('[data-close="main"]');
      assert(anchor.tagName === "A" && anchor.getAttribute("href") === "#confirmed", "inherited Action anchor props");
      const previous = state("main").callbacks.length; buttonClose.click(); await finish(); assert(state("main").callbacks.length === previous, "retired Action button");
      anchor.click(); await finish(); assert(!state("main").native, "replacement Action anchor closes");
      trigger("main"); await finish(); cases.main.setAnchor(false); await finish();
      anchor.click(); await finish(); assert(state("main").native, "retired Action anchor");
      document.querySelector('[data-cancel="main"]').click(); await finish(); assert(!state("main").native, "Cancel closes after compound replacement");
      return {branches:true};`,
      true,
    );
    expect(result.branches).toBe(true);
  }, 60_000);
  it("refreshes conditional Action and Cancel under a stable native owner", async () => {
    const result = await verifyAlertDialogBrowser(
      await fixture(),
      [{ id: "main", initial: false, controlsInitially: false, nested: true }],
      `
      const instance = createAlertDialog(root("main")), native = popup("main");
      trigger("main"); await finish();
      const focus = document.activeElement;
      cases.main.setControls(true); await finish();
      assert(createAlertDialog(root("main")) === instance && popup("main") === native, "conditional controls retain controller and popup");
      assert(document.activeElement === focus && document.body.hasAttribute("data-sw-scroll-locked"), "insertion retains focus and lock");
      const action = document.querySelector('[data-close="main"]'), cancel = document.querySelector('[data-cancel="main"]');
      document.querySelector('[data-nested-trigger="main"]').click(); await finish();
      action.click(); await finish(); assert(native.open, "outer control cannot dismiss nested owner");
      document.querySelector('[data-nested-close="main"]').click(); await finish(); assert(native.open, "nested close preserves outer owner");
      root("main").addEventListener("starwind:open-change", event => event.preventDefault(), { once:true });
      action.click(); await finish(); assert(native.open, "late Action retains DOM cancellation");
      cases.main.setControls(false); await finish();
      const count = state("main").callbacks.length;
      action.click(); cancel.click(); await finish(); assert(state("main").callbacks.length === count && native.open, "removed Styled controls inactive");
      cases.main.setControls(true); await finish();
      document.querySelector('[data-cancel="main"]').click(); await finish(); assert(!native.open, "reinserted Cancel closes");
      trigger("main"); await finish();
      cases.main.setControls(false); cases.main.hide(); await finish();
      assert(!native.isConnected && !document.body.hasAttribute("data-sw-scroll-locked"), "pending removal teardown");
      return { conditional:true };`,
      true,
    );
    expect(result).toMatchObject({ conditional: true, teardown: true });
  }, 60_000);
});
