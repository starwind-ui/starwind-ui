import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Combobox } from "../../src/combobox";
import { createCombobox } from "@starwind-ui/runtime/combobox";

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

describe("React Combobox connected models and reset", () => {
  it.each([
    { props: { value: "svelte" }, commands: { value: "react" }, text: "Astro", visible: ["astro"] },
    {
      props: { inputValue: "React" },
      commands: { inputValue: "Svelte" },
      text: "Svelte",
      visible: ["svelte"],
    },
    {
      props: { value: "svelte", inputValue: "Svelte" },
      commands: { inputValue: "React" },
      text: "React",
      visible: ["react"],
    },
  ])(
    "uses current controlled props after a command before first use $commands",
    async ({ props, commands, text, visible }) => {
      const fixture = await mountConnectedCombobox(props, false);
      await fixture.update({ commands });
      await act(() => query<HTMLElement>("[data-sw-combobox-trigger]").click());
      await settleConnectedCombobox();
      expect(fixture.runtime().getOpen()).toBe(true);
      expect(fixture.input().value).toBe(text);
      expect(fixture.visible()).toEqual(visible);
    },
  );
  it.each([
    { props: { value: "svelte" }, text: "Astro", selected: "svelte", visible: ["astro"] },
    { props: { inputValue: "React" }, text: "React", selected: "astro", visible: ["react"] },
    {
      props: { value: "svelte", inputValue: "Svelte" },
      text: "Svelte",
      selected: "svelte",
      visible: ["astro", "react", "svelte"],
    },
  ])(
    "preserves initial text and query for public props $props",
    async ({ props, text, selected, visible }) => {
      const fixture = await mountConnectedCombobox(props);
      expect(fixture.runtime().getOpen()).toBe(true);
      expect(fixture.input().value).toBe(text);
      expect(fixture.runtime().getValue()).toBe(selected);
      expect(fixture.visible()).toEqual(visible);
      expect(new FormData(fixture.form()).get("framework")).toBe(selected);
    },
  );
  it("reads restored text after Escape and a later render", async () => {
    const fixture = await mountConnectedCombobox();
    await fixture.edit();
    expect(fixture.visible()).toEqual(["react"]);
    await fixture.key("Escape");
    expect(fixture.input().value).toBe("Svelte");
    expect(fixture.runtime().getInputValue()).toBe("Svelte");
    await fixture.update({ commands: {} });
    expect(fixture.input().value).toBe("Svelte");
  });

  it.each(["accepted", "canceled", "new input", "new value"] as const)(
    "settles %s reset after editing",
    async (kind) => {
      const fixture = await mountConnectedCombobox();
      await fixture.edit();
      if (kind === "canceled")
        fixture.form().addEventListener("reset", (event) => event.preventDefault(), { once: true });
      await act(() => {
        fixture.form().reset();
        if (kind === "new input") fixture.dispatchInput("ast");
        if (kind === "new value")
          fixture.root().dispatchEvent(
            new CustomEvent("starwind:set-value", {
              bubbles: true,
              detail: { value: "react", emit: false },
            }),
          );
      });
      await settleConnectedCombobox();
      const expectedValue =
        kind === "accepted" ? "astro" : kind === "new value" ? "react" : "svelte";
      const expectedText =
        kind === "accepted"
          ? "Astro"
          : kind === "new value"
            ? "React"
            : kind === "new input"
              ? "ast"
              : "rea";
      expect(fixture.input().value).toBe(expectedText);
      expect(fixture.runtime().getInputValue()).toBe(expectedText);
      expect(new FormData(fixture.form()).get("framework")).toBe(expectedValue);
    },
  );

  it.each([false, true])(
    "retains app-owned value after reset with owned input %s",
    async (controlledInput) => {
      const fixture = await mountConnectedCombobox({
        value: "svelte",
        ...(controlledInput ? { inputValue: "rea" } : {}),
      });
      await fixture.type("rea");
      fixture.form().reset();
      await settleConnectedCombobox();
      expect(new FormData(fixture.form()).get("framework")).toBe("svelte");
      if (controlledInput) expect(fixture.input().value).toBe("rea");
    },
  );

  it("keeps component-owned text after a canceled reset with app-owned value", async () => {
    const fixture = await mountConnectedCombobox({ value: "svelte" });
    await fixture.type("rea");
    fixture.form().addEventListener("reset", (event) => event.preventDefault(), { once: true });
    fixture.form().reset();
    await settleConnectedCombobox();
    expect(fixture.input().value).toBe("rea");
    expect(new FormData(fixture.form()).get("framework")).toBe("svelte");
  });

  it.each(["callback", "dom"] as const)(
    "restores rejected native input after %s cancellation",
    async (kind) => {
      const fixture = await mountConnectedCombobox(
        kind === "callback" ? { onInputValueChange: (_value, details) => details.cancel() } : {},
      );
      if (kind === "dom")
        fixture
          .root()
          .addEventListener("starwind:input-value-change", (event) => event.preventDefault());
      await fixture.type("rejected");
      expect(fixture.input().value).toBe("Astro");
      expect(fixture.runtime().getInputValue()).toBe("Astro");
    },
  );
  it("keeps an input command from a later reset listener after native default work", async () => {
    const fixture = await mountConnectedCombobox();
    await fixture.edit();
    fixture.form().addEventListener("reset", () => fixture.dispatchInput("ast"), { once: true });
    fixture.form().reset();
    await settleConnectedCombobox();
    expect(fixture.input().value).toBe("ast");
    expect(fixture.runtime().getInputValue()).toBe("ast");
    expect(new FormData(fixture.form()).get("framework")).toBe("svelte");
  });
});

type ConnectedState = {
  commands: Partial<
    Pick<React.ComponentProps<typeof Combobox.Root>, "value" | "inputValue" | "open">
  >;
};
async function mountConnectedCombobox(
  props: React.ComponentProps<typeof Combobox.Root> = {},
  connect = true,
) {
  let update!: React.Dispatch<React.SetStateAction<ConnectedState>>;
  function Fixture() {
    const [state, setState] = React.useState<ConnectedState>({ commands: {} });
    update = setState;
    return (
      <form>
        <Combobox.Root
          defaultValue="astro"
          defaultInputValue="Astro"
          name="framework"
          {...props}
          {...state.commands}
        >
          <Combobox.Input />
          <Combobox.Trigger>Open</Combobox.Trigger>
          <Combobox.Popup keepMounted>
            <Combobox.Item value="astro">Astro</Combobox.Item>
            <Combobox.Item value="react">React</Combobox.Item>
            <Combobox.Item value="svelte">Svelte</Combobox.Item>
          </Combobox.Popup>
        </Combobox.Root>
      </form>
    );
  }
  await mount(<Fixture />);
  const root = () => query<HTMLElement>("[data-sw-combobox]");
  const input = () => query<HTMLInputElement>("[data-sw-combobox-input]");
  const dispatchInput = (value: string) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input(), value);
    input().dispatchEvent(
      new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }),
    );
  };
  const type = async (value: string) => {
    await act(() => dispatchInput(value));
    await settleConnectedCombobox();
  };
  const key = async (key: string) => {
    await act(() => input().dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })));
    await settleConnectedCombobox();
  };
  if (connect) await act(() => query<HTMLElement>("[data-sw-combobox-trigger]").click());
  await settleConnectedCombobox();
  return {
    root,
    input,
    type,
    key,
    dispatchInput,
    runtime: () => createCombobox(root()),
    form: () => query<HTMLFormElement>("form"),
    visible: () =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-sw-combobox-item]"))
        .filter((item) => !item.hidden)
        .map((item) => item.dataset.value),
    update: async (patch: Partial<ConnectedState>) => {
      await act(() => update((state) => ({ ...state, ...patch })));
      await settleConnectedCombobox();
    },
    edit: async () => {
      await act(() =>
        root().dispatchEvent(
          new CustomEvent("starwind:set-value", {
            bubbles: true,
            detail: { value: "svelte", emit: false },
          }),
        ),
      );
      await key("Escape");
      await act(() => query<HTMLElement>("[data-sw-combobox-trigger]").click());
      await type("rea");
      expect(createCombobox(root()).getValue()).toBe("svelte");
      expect(input().value).toBe("rea");
    },
  };
}
async function settleConnectedCombobox(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 30));
  });
}
