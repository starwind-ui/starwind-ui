import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Accordion } from "../../src/accordion";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;

type AccordionValueChangeHandler = NonNullable<
  React.ComponentProps<typeof Accordion.Root>["onValueChange"]
>;
type AccordionValueChangeDetails = Parameters<AccordionValueChangeHandler>[0];

afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  reactRoot = undefined;
  container = undefined;
});

describe("React Accordion cancellation", () => {
  it("keeps a canceled uncontrolled value through Runtime recreation", async () => {
    const onValueChange = vi.fn((details: AccordionValueChangeDetails) => details.cancel());

    await mount(<TestAccordion collapsible onValueChange={onValueChange} />);
    await click(trigger("billing"));

    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith(
      expect.objectContaining({
        isCanceled: true,
        previousValue: "shipping",
        value: "billing",
      }),
    );
    expect(trigger("shipping")).toHaveAttribute("aria-expanded", "true");
    expect(panel("shipping").hidden).toBe(false);
    expect(trigger("billing")).toHaveAttribute("aria-expanded", "false");
    expect(panel("billing").hidden).toBe(true);

    await render(<TestAccordion collapsible={false} onValueChange={onValueChange} />);

    expect(trigger("shipping")).toHaveAttribute("aria-expanded", "true");
    expect(panel("shipping").hidden).toBe(false);
    expect(trigger("billing")).toHaveAttribute("aria-expanded", "false");
    expect(panel("billing").hidden).toBe(true);
  });

  it("commits an accepted proposal after the callback exactly once", async () => {
    const observations: boolean[] = [];
    const onValueChange = vi.fn(() => {
      observations.push(panel("billing").hidden);
    });

    await mount(<TestAccordion collapsible onValueChange={onValueChange} />);
    await click(trigger("billing"));

    expect(observations).toEqual([true]);
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(trigger("shipping")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("billing")).toHaveAttribute("aria-expanded", "true");
    expect(panel("billing").hidden).toBe(false);
  });
});

function TestAccordion({
  collapsible,
  onValueChange,
}: {
  collapsible: boolean;
  onValueChange: AccordionValueChangeHandler;
}) {
  return (
    <Accordion.Root collapsible={collapsible} defaultValue="shipping" onValueChange={onValueChange}>
      <Accordion.Item value="shipping">
        <Accordion.Header>
          <Accordion.Trigger>Shipping</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>Shipping details</Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="billing">
        <Accordion.Header>
          <Accordion.Trigger>Billing</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>Billing details</Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
}

async function mount(node: React.ReactNode): Promise<void> {
  container = document.createElement("div");
  document.body.append(container);
  reactRoot = createRoot(container);
  await render(node);
}

async function render(node: React.ReactNode): Promise<void> {
  await act(async () => {
    reactRoot!.render(node);
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function click(element: HTMLElement): Promise<void> {
  await act(async () => {
    element.click();
    await Promise.resolve();
    await Promise.resolve();
  });
}

function trigger(value: string): HTMLButtonElement {
  return item(value).querySelector<HTMLButtonElement>("[data-sw-accordion-trigger]")!;
}

function panel(value: string): HTMLElement {
  return item(value).querySelector<HTMLElement>("[data-sw-accordion-content]")!;
}

function item(value: string): HTMLElement {
  return container!.querySelector<HTMLElement>(`[data-sw-accordion-item][data-value="${value}"]`)!;
}
