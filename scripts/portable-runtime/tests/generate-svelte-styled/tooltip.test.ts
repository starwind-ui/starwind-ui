import { expect, it } from "vitest";
import { createStyledTooltipConsumer } from "../../../../packages/svelte/tests/styled-tooltip-consumer.js";
import { verifyTooltipBrowser } from "../../../../packages/svelte/tests/tooltip-browser.js";

it("forwards Styled Tooltip bindings, semantic children, and portal composition", async () => {
  const consumer = await createStyledTooltipConsumer(process.cwd());
  try {
    const result = await verifyTooltipBrowser(
      consumer,
      [
        { id: "main", initial: false, mode: "bound" },
        { id: "cancel", initial: false, proposal: "cancel" },
      ],
      `for (const item of Object.values(cases)) item.delays(0, 0); await settle();
await trigger("main"); await finish();
assert(state("main").visible && state("main").model === true, "Styled Root publishes accepted open");
assert(button("main").tagName === "BUTTON", "Styled trigger forwards the semantic child");
assert(wrapper("main").parentElement.id === "portal-a", "Content composes its portal");
cases.main.place("#portal-b"); await finish();
assert(wrapper("main").parentElement.id === "portal-b", "Content forwards a changed portal target");
const previous = popup("main"); cases.main.replace("popup"); await finish();
assert(popup("main") !== previous && state("main").visible, "Content replacement preserves accepted open");
cases.main.setModel(false); await finish();
assert(!state("main").visible, "Styled Root accepts a parent close");
await trigger("cancel"); await finish();
assert(!state("cancel").visible && state("cancel").writes.length === 0, "Styled callback cancellation blocks publication");
return { composition: true };`,
      true,
    );
    expect(result).toMatchObject({ composition: true, hydrationExact: true, teardown: true });
  } finally {
    await consumer.dispose();
  }
}, 60_000);

it("opens on a native link child on first load and after client navigation", async () => {
  const consumer = await createStyledTooltipConsumer(process.cwd());
  try {
    const result = await verifyTooltipBrowser(
      consumer,
      [{ id: "link", initial: false, linkChild: true }],
      `cases.link.delays(0, 0); await settle();
const enabled = element => !["disabled", "data-disabled", "data-trigger-disabled", "aria-disabled"].some(name => element.hasAttribute(name));
const first = button("link");
assert(first.tagName === "A", "The child owns the trigger");
assert(enabled(first), "A hydrated link stays enabled");
hover("link"); await finish();
assert(state("link").visible, "A hydrated link opens");
cases.link.setModel(false); await finish();
cases.link.hide(); await finish();
cases.link.show(); await finish();
const next = button("link");
assert(next !== first && next.tagName === "A", "Client navigation mounts a new link");
assert(enabled(next), "A client-rendered link stays enabled");
hover("link"); await finish();
assert(state("link").visible, "A client-rendered link opens");
return { link: true };`,
      true,
      // The contract says Tooltip works on any element, so a link gets no diagnostic.
      [],
    );
    expect(result).toMatchObject({ link: true, hydrationExact: true, teardown: true });
  } finally {
    await consumer.dispose();
  }
}, 60_000);

it("gives a text child trigger the React and Vue class list", async () => {
  const consumer = await createStyledTooltipConsumer(process.cwd());
  try {
    await consumer.write({
      "TextTrigger.svelte": `<script lang="ts">import Tooltip from "./tooltip/index.js";</script>
<Tooltip.Root><Tooltip.Trigger data-case="text">Help</Tooltip.Trigger><Tooltip.Trigger data-case="custom" class="custom">Help</Tooltip.Trigger><Tooltip.Trigger data-case="child">{#snippet child({ props, children })}<a href="#docs" {...props as any}>{@render children?.()}</a>{/snippet}Docs</Tooltip.Trigger><Tooltip.Content>Tip</Tooltip.Content></Tooltip.Root>`,
      "text-trigger.mjs":
        'import { render } from "svelte/server"; import App from "./TextTrigger.svelte"; console.log(JSON.stringify(render(App).body));',
    });
    const body: string = JSON.parse(await consumer.run("text-trigger.mjs", { loader: true }));
    const trigger = (name: string) => {
      const tag = body.match(new RegExp(`<(\\w+)[^>]*data-case="${name}"[^>]*>`));
      expect(tag, name).not.toBeNull();
      const classes = tag![0].match(/\sclass="([^"]*)"/)?.[1] ?? "";
      return { element: tag![1], classes: classes.split(/\s+/).filter(Boolean) };
    };
    // React and Vue give the fallback button only the consumer class.
    expect(trigger("text")).toEqual({ element: "button", classes: [] });
    expect(trigger("custom")).toEqual({ element: "button", classes: ["custom"] });
    expect(trigger("child")).toEqual({ element: "a", classes: [] });
  } finally {
    await consumer.dispose();
  }
}, 60_000);
