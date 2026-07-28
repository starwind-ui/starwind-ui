import {
  createApp,
  createSSRApp,
  h,
  nextTick,
  reactive,
  ref,
  type ComponentPublicInstance,
} from "vue";
import { renderToString } from "vue/server-renderer";
import { userEvent } from "vitest/browser";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AccordionValue, AccordionValueChangeDetails } from "@starwind-ui/runtime/accordion";
import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionRoot,
  AccordionTrigger,
} from "@starwind-ui/vue/accordion";
import {
  Accordion as StyledAccordion,
  AccordionContent as StyledAccordionContent,
  AccordionItem as StyledAccordionItem,
  AccordionTrigger as StyledAccordionTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/accordion";

type ElementExpose = ComponentPublicInstance & { element: HTMLElement | null };
const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Accordion public behavior", () => {
  it("supports multiple defaults, dynamic items, disabled items, and Runtime presence", async () => {
    const values = ref(["alpha", "beta"]);
    const updates: unknown[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          AccordionRoot,
          {
            defaultValue: ["alpha"],
            type: "multiple",
            "onUpdate:modelValue": (value) => updates.push(value),
          },
          () => values.value.map((value) => disclosure(value, value === "beta")),
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    const triggers = () => [
      ...host.querySelectorAll<HTMLButtonElement>("[data-sw-accordion-trigger]"),
    ];
    const panels = () => [...host.querySelectorAll<HTMLElement>("[data-sw-accordion-content]")];
    expect(triggers()[0]!.getAttribute("aria-expanded")).toBe("true");
    expect(panels()[0]!.hidden).toBe(false);
    triggers()[1]!.click();
    await settle();
    expect(updates).toEqual([]);

    values.value.push("gamma");
    await settleMutation();
    expect(triggers()).toHaveLength(3);
    triggers()[2]!.click();
    await settle();
    expect(updates).toEqual([["alpha", "gamma"]]);
    expect(panels()[2]!.hidden).toBe(false);
  });

  it("keeps controlled and canceled proposals parent-owned and preserves event order", async () => {
    const state = reactive({ cancel: true, value: "alpha" as string | string[] | null });
    const events: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          AccordionRoot,
          {
            modelValue: state.value,
            onValueChange: (value: unknown, detail: AccordionValueChangeDetails) => {
              events.push(`detail:${String(value)}`);
              if (state.cancel) detail.cancel();
            },
            "onUpdate:modelValue": (value) => events.push(`update:${String(value)}`),
          },
          () => [disclosure("alpha"), disclosure("beta")],
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();
    const triggers = host.querySelectorAll<HTMLButtonElement>("[data-sw-accordion-trigger]");

    triggers[1]!.click();
    await settle();
    expect(events).toEqual(["detail:beta"]);
    expect(triggers[0]!.getAttribute("aria-expanded")).toBe("true");

    state.cancel = false;
    triggers[1]!.click();
    await settle();
    expect(events).toEqual(["detail:beta", "detail:beta", "update:beta"]);
    expect(triggers[0]!.getAttribute("aria-expanded")).toBe("true");

    state.value = "beta";
    await settle();
    expect(triggers[1]!.getAttribute("aria-expanded")).toBe("true");
  });

  it("preserves controlled null in the scoped slot and Runtime state", async () => {
    const modelValue = ref<AccordionValue>(null);
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          AccordionRoot,
          {
            defaultValue: "alpha",
            modelValue: modelValue.value,
          },
          {
            default: ({ value }: { value: AccordionValue }) => [
              h("output", { "data-testid": "accordion-slot-value" }, String(value)),
              disclosure("alpha"),
              disclosure("beta"),
            ],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    const slotValue = () =>
      host.querySelector<HTMLOutputElement>("[data-testid=accordion-slot-value]")!;
    const triggers = () => [
      ...host.querySelectorAll<HTMLButtonElement>("[data-sw-accordion-trigger]"),
    ];
    const panels = () => [...host.querySelectorAll<HTMLElement>("[data-sw-accordion-content]")];

    expect(slotValue().textContent).toBe("null");
    expect(triggers().map((trigger) => trigger.getAttribute("aria-expanded"))).toEqual([
      "false",
      "false",
    ]);
    expect(panels().every((panel) => panel.hidden)).toBe(true);

    modelValue.value = "beta";
    await settle();
    expect(slotValue().textContent).toBe("beta");
    expect(triggers()[1]!.getAttribute("aria-expanded")).toBe("true");
    expect(panels()[1]!.hidden).toBe(false);

    modelValue.value = null;
    await settle();
    expect(slotValue().textContent).toBe("null");
    expect(triggers().every((trigger) => trigger.getAttribute("aria-expanded") === "false")).toBe(
      true,
    );
    expect(panels().every((panel) => panel.hidden)).toBe(true);
  });

  it("uses native activation and sequential focus without roving or orientation", async () => {
    const host = appendHost();
    const app = createApp({
      render: () => h(AccordionRoot, null, () => [disclosure("alpha"), disclosure("beta")]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();
    const triggers = host.querySelectorAll<HTMLButtonElement>("[data-sw-accordion-trigger]");

    expect(host.querySelector("[data-orientation]")).toBeNull();
    expect([...triggers].map((trigger) => trigger.tabIndex)).toEqual([0, 0]);
    triggers[0]!.focus();
    triggers[0]!.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(document.activeElement).toBe(triggers[0]);
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(triggers[0]!.getAttribute("aria-expanded")).toBe("true");
    await userEvent.keyboard(" ");
    await settle();
    expect(triggers[0]!.getAttribute("aria-expanded")).toBe("false");
  });

  it("forwards attrs and refs, hydrates Styled output, and cleans up exact owners", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const rootRef = ref<ElementExpose | null>(null);
    const value = ref<string | string[] | null>("alpha");
    const root = () =>
      h(
        StyledAccordion,
        {
          class: "consumer-root",
          "data-consumer": "yes",
          modelValue: value.value,
          "onUpdate:modelValue": (next) => (value.value = next),
          ref: rootRef,
        },
        () => [
          h(StyledAccordionItem, { value: "alpha" }, () => [
            h(StyledAccordionTrigger, { "data-testid": "alpha" }, () => "Alpha"),
            h(StyledAccordionContent, null, () => "Alpha content"),
          ]),
          h(StyledAccordionItem, { value: "beta" }, () => [
            h(StyledAccordionTrigger, { "data-testid": "beta" }, () => "Beta"),
            h(StyledAccordionContent, null, () => "Beta content"),
          ]),
        ],
      );
    const html = await renderToString(createSSRApp({ render: root }));
    const host = appendHost();
    host.innerHTML = html;
    const warnings: string[] = [];
    const app = createSSRApp({ render: root });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    expect(warnings).toEqual([]);
    expect(rootRef.value?.element).toBe(host.querySelector("[data-sw-accordion]"));
    expect(rootRef.value?.element?.getAttribute("data-consumer")).toBe("yes");
    host.querySelector<HTMLButtonElement>("[data-testid=beta]")!.click();
    await settle();
    expect(value.value).toBe("beta");

    app.unmount();
    cleanups.pop();
    expect(abort).toHaveBeenCalled();
    expect(rootRef.value).toBeNull();
  });
});

function disclosure(value: string, disabled = false) {
  return h(AccordionItem, { disabled, value }, () => [
    h(AccordionHeader, null, () => h(AccordionTrigger, null, () => value)),
    h(AccordionPanel, null, () => `${value} content`),
  ]);
}

async function settle(): Promise<void> {
  await Promise.resolve();
  await nextTick();
}

async function settleMutation(): Promise<void> {
  await settle();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await settle();
}

function appendHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}
