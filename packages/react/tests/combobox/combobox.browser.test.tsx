import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Combobox } from "../../src/combobox";

let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  reactRoot = undefined;
  container = undefined;
});

describe("React Combobox cancellation", () => {
  it("keeps rendered and form state unchanged when a programmatic value command is canceled", async () => {
    await mount(
      <Combobox.Root defaultInputValue="Astro" defaultValue="astro" name="framework">
        <Combobox.Input />
        <Combobox.Popup keepMounted>
          <Combobox.Item value="astro">Astro</Combobox.Item>
          <Combobox.Item value="next">Next.js</Combobox.Item>
        </Combobox.Popup>
      </Combobox.Root>,
    );
    const root = query<HTMLElement>("[data-sw-combobox]");
    root.addEventListener("starwind:value-change", (event) => event.preventDefault());

    await act(() => {
      root.dispatchEvent(
        new CustomEvent("starwind:set-value", {
          bubbles: true,
          detail: { value: "next" },
        }),
      );
    });
    await flush();

    expect(root).toHaveAttribute("data-value", "astro");
    expect(query<HTMLInputElement>("[data-sw-combobox-hidden-input]").value).toBe("astro");
    expect(query<HTMLInputElement>("[data-sw-combobox-input]").value).toBe("Astro");
    expect(queryAll<HTMLElement>("[data-sw-combobox-item]")[0]).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(queryAll<HTMLElement>("[data-sw-combobox-item]")[1]).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("synchronizes rendered and form state for a silent programmatic value command", async () => {
    const onValueChange = vi.fn();
    await mount(
      <Combobox.Root
        defaultInputValue="Astro"
        defaultValue="astro"
        name="framework"
        onValueChange={onValueChange}
      >
        <Combobox.Input />
        <Combobox.Popup keepMounted>
          <Combobox.Item value="astro">Astro</Combobox.Item>
          <Combobox.Item value="next">Next.js</Combobox.Item>
        </Combobox.Popup>
      </Combobox.Root>,
    );
    const root = query<HTMLElement>("[data-sw-combobox]");
    const domValueChange = vi.fn();
    root.addEventListener("starwind:value-change", domValueChange);

    await act(() => {
      root.dispatchEvent(
        new CustomEvent("starwind:set-value", {
          bubbles: true,
          detail: { emit: false, value: "next" },
        }),
      );
    });
    await flush();

    expect(onValueChange).not.toHaveBeenCalled();
    expect(domValueChange).not.toHaveBeenCalled();
    expect(root).toHaveAttribute("data-value", "next");
    expect(query<HTMLInputElement>("[data-sw-combobox-hidden-input]").value).toBe("next");
    expect(query<HTMLInputElement>("[data-sw-combobox-input]").value).toBe("Next.js");
    expect(queryAll<HTMLElement>("[data-sw-combobox-item]")[0]).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(queryAll<HTMLElement>("[data-sw-combobox-item]")[1]).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

async function mount(node: React.ReactNode): Promise<void> {
  container = document.createElement("div");
  document.body.append(container);
  reactRoot = createRoot(container);
  await act(() => reactRoot!.render(node));
}

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

function query<T extends Element>(selector: string): T {
  return container!.querySelector<T>(selector)!;
}

function queryAll<T extends Element>(selector: string): T[] {
  return Array.from(container!.querySelectorAll<T>(selector));
}
