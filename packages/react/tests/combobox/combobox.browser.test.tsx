import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Combobox } from "../../src/combobox";
import { createCombobox } from "@starwind-ui/runtime/combobox";
import {
  Combobox as StyledCombobox,
  ComboboxClear as StyledComboboxClear,
  ComboboxContent as StyledComboboxContent,
  ComboboxInput as StyledComboboxInput,
  ComboboxItem as StyledComboboxItem,
} from "../../../../apps/react-demo/src/components/starwind-runtime/combobox";

let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  reactRoot = undefined;
  container = undefined;
});

describe("React Styled Combobox Clear", () => {
  it("clones an asChild child with the default icon setting and adds no second button", async () => {
    await mount(
      <StyledCombobox>
        <StyledComboboxInput />
        <StyledComboboxClear asChild>
          <button id="clear-child" type="button">
            Clear
          </button>
        </StyledComboboxClear>
        <StyledComboboxContent>
          <StyledComboboxItem value="astro">Astro</StyledComboboxItem>
        </StyledComboboxContent>
      </StyledCombobox>,
    );
    const child = query<HTMLButtonElement>("#clear-child");
    expect(child).toHaveAttribute("data-slot", "combobox-clear");
    expect(child.parentElement?.closest("button")).toBeNull();
    expect(child.querySelector("svg")).toBeNull();
  });
});

describe("React Combobox native input", () => {
  function typeInMiddle(input: HTMLInputElement): void {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "abXcd");
    input.setSelectionRange(3, 3);
    input.dispatchEvent(new InputEvent("input", { bubbles: true, data: "X" }));
  }

  it("keeps the caret when a parent accepts typed text", async () => {
    function Harness() {
      const [text, setText] = React.useState("abcd");
      return (
        <Combobox.Root inputValue={text} onInputValueChange={setText}>
          <Combobox.Input />
          <Combobox.Popup keepMounted>
            <Combobox.Item value="astro">Astro</Combobox.Item>
          </Combobox.Popup>
        </Combobox.Root>
      );
    }
    await mount(<Harness />);
    const input = query<HTMLInputElement>("[data-sw-combobox-input]");
    await act(async () => input.focus());
    await act(async () => typeInMiddle(input));
    await flush();
    expect(input.value).toBe("abXcd");
    expect(input.selectionStart).toBe(3);
  });

  it("repairs typed text that a parent refuses", async () => {
    await mount(
      <Combobox.Root inputValue="abcd">
        <Combobox.Input />
        <Combobox.Popup keepMounted>
          <Combobox.Item value="astro">Astro</Combobox.Item>
        </Combobox.Popup>
      </Combobox.Root>,
    );
    const input = query<HTMLInputElement>("[data-sw-combobox-input]");
    await act(async () => input.focus());
    await act(async () => typeInMiddle(input));
    await flush();
    expect(input.value).toBe("abcd");
  });

  it("opens from the first focus, as the Runtime does", async () => {
    const onOpenChange = vi.fn();
    await mount(
      <Combobox.Root onOpenChange={onOpenChange}>
        <Combobox.Input />
        <Combobox.Popup>
          <Combobox.Item value="astro">Astro</Combobox.Item>
        </Combobox.Popup>
      </Combobox.Root>,
    );
    await act(async () => query<HTMLInputElement>("[data-sw-combobox-input]").focus());
    await flush();
    expect(query<HTMLElement>("[data-sw-combobox]")).toHaveAttribute("data-state", "open");
    expect(onOpenChange.mock.calls[0]?.[1]).toMatchObject({ reason: "focus" });
  });
});

describe("React Combobox items inside a user component", () => {
  function Parts() {
    return (
      <>
        <Combobox.Input />
        <Combobox.Trigger>Open</Combobox.Trigger>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List>
              <Combobox.Item value="a">
                <Combobox.ItemText>Apple</Combobox.ItemText>
              </Combobox.Item>
              <Combobox.Item value="b">
                <Combobox.ItemText>Banana</Combobox.ItemText>
              </Combobox.Item>
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </>
    );
  }

  it("shows the label of a default value and keeps it after the first focus", async () => {
    await mount(
      <Combobox.Root defaultValue="b">
        <Parts />
      </Combobox.Root>,
    );
    await settleConnectedCombobox();
    const input = query<HTMLInputElement>("[data-sw-combobox-input]");
    expect(input.value).toBe("Banana");
    expect(document.querySelector("[data-sw-combobox-item]")).toBeNull();

    await act(async () => input.focus());
    await settleConnectedCombobox();

    expect(input.value).toBe("Banana");
  });

  it("keeps a default text over the label of a default value", async () => {
    await mount(
      <Combobox.Root defaultInputValue="typed" defaultValue="b">
        <Parts />
      </Combobox.Root>,
    );
    await settleConnectedCombobox();

    expect(query<HTMLInputElement>("[data-sw-combobox-input]").value).toBe("typed");
  });

  it("keeps the form value of a parent write when the JSX holds the items", async () => {
    let write: (value: string) => void = () => {};
    function Parent() {
      const [value, setValue] = React.useState<string | null>(null);
      write = setValue;
      return (
        <Combobox.Root name="fruit" value={value}>
          <Combobox.Input />
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="b">
                  <Combobox.ItemText>Banana</Combobox.ItemText>
                </Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Root>
      );
    }
    await mount(<Parent />);
    const input = query<HTMLInputElement>("[data-sw-combobox-input]");
    await act(async () => input.focus());
    await settleConnectedCombobox();
    await act(async () => input.blur());
    await settleConnectedCombobox();

    await act(async () => write("b"));
    await settleConnectedCombobox();

    expect(input.value).toBe("Banana");
    expect(query<HTMLInputElement>("[data-sw-combobox-hidden-input]").value).toBe("b");
    expect(query("[data-sw-combobox]").getAttribute("data-value")).toBe("b");
  });

  describe("a parent write before the first interaction", () => {
    function mountControlled(asUserComponent: boolean) {
      let write: (value: string | null) => void = () => {};
      function Parent() {
        const [value, setValue] = React.useState<string | null>("a");
        write = setValue;
        return (
          <Combobox.Root name="fruit" value={value}>
            {asUserComponent ? (
              <Parts />
            ) : (
              <>
                <Combobox.Input />
                <Combobox.Positioner>
                  <Combobox.Popup>
                    <Combobox.List>
                      <Combobox.Item value="a">
                        <Combobox.ItemText>Apple</Combobox.ItemText>
                      </Combobox.Item>
                      <Combobox.Item value="b">
                        <Combobox.ItemText>Banana</Combobox.ItemText>
                      </Combobox.Item>
                    </Combobox.List>
                  </Combobox.Popup>
                </Combobox.Positioner>
              </>
            )}
          </Combobox.Root>
        );
      }
      return { element: <Parent />, write: (value: string | null) => write(value) };
    }

    for (const asUserComponent of [true, false]) {
      const label = asUserComponent ? "a user component" : "the JSX";

      it(`moves the text to the new value when ${label} holds the items`, async () => {
        const { element, write } = mountControlled(asUserComponent);
        await mount(element);
        await settleConnectedCombobox();
        const input = query<HTMLInputElement>("[data-sw-combobox-input]");
        expect(input.value).toBe("Apple");

        await act(async () => write("b"));
        await settleConnectedCombobox();

        expect(input.value).toBe("Banana");
        expect(query<HTMLInputElement>("[data-sw-combobox-hidden-input]").value).toBe("b");

        await act(async () => input.focus());
        await settleConnectedCombobox();

        expect(input.value).toBe("Banana");
      });

      it(`clears the text with a null value when ${label} holds the items`, async () => {
        const { element, write } = mountControlled(asUserComponent);
        await mount(element);
        await settleConnectedCombobox();
        const input = query<HTMLInputElement>("[data-sw-combobox-input]");
        expect(input.value).toBe("Apple");

        await act(async () => write(null));
        await settleConnectedCombobox();

        expect(input.value).toBe("");
        expect(query<HTMLInputElement>("[data-sw-combobox-hidden-input]").value).toBe("");

        await act(async () => input.focus());
        await settleConnectedCombobox();

        expect(input.value).toBe("");
      });
    }
  });

  it("keeps the form value of a parent write with the popup closed", async () => {
    let write: (value: string) => void = () => {};
    function Parent() {
      const [value, setValue] = React.useState<string | null>(null);
      write = setValue;
      return (
        <Combobox.Root name="fruit" value={value}>
          <Parts />
        </Combobox.Root>
      );
    }
    await mount(<Parent />);
    const input = query<HTMLInputElement>("[data-sw-combobox-input]");
    await act(async () => input.focus());
    await settleConnectedCombobox();
    await act(async () => input.blur());
    await settleConnectedCombobox();

    await act(async () => write("b"));
    await settleConnectedCombobox();

    expect(input.value).toBe("Banana");
    expect(query<HTMLInputElement>("[data-sw-combobox-hidden-input]").value).toBe("b");
    expect(query("[data-sw-combobox]").getAttribute("data-value")).toBe("b");
  });
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
      expect(fixture.input().value).toBe(controlledInput ? "rea" : "Svelte");
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

describe("React Combobox event order", () => {
  type OrderProps = React.ComponentProps<typeof Combobox.Root>;
  const items = (
    <Combobox.Popup>
      <Combobox.Item value="astro">Astro</Combobox.Item>
      <Combobox.Item value="react">React</Combobox.Item>
    </Combobox.Popup>
  );
  function recorder(cancelText = false) {
    const events: string[] = [];
    const props: OrderProps = {
      onValueChange: (value) => events.push(`value:${value}`),
      onInputValueChange: (text, details) => {
        events.push(`input:${text}:${details.reason}`);
        if (cancelText) details.cancel();
      },
      onOpenChange: (open) => events.push(`open:${open}`),
    };
    return { events, props };
  }
  function ControlledFixture({
    input,
    props,
    value,
  }: {
    input?: string;
    props: OrderProps;
    value: string | null;
  }) {
    const [state, setState] = React.useState({ input, value });
    return (
      <Combobox.Root
        {...props}
        value={state.value}
        {...(input === undefined ? {} : { inputValue: state.input })}
        onValueChange={(next, details) => {
          props.onValueChange?.(next, details);
          setState((current) => ({ ...current, value: next }));
        }}
        onInputValueChange={(next, details) => {
          props.onInputValueChange?.(next, details);
          if (!details.isCanceled) setState((current) => ({ ...current, input: next }));
        }}
      >
        <Combobox.Input />
        <Combobox.Trigger>Open</Combobox.Trigger>
        <Combobox.Clear>Clear</Combobox.Clear>
        {items}
      </Combobox.Root>
    );
  }
  const input = () => query<HTMLInputElement>("[data-sw-combobox-input]");
  const press = async (selector: string) => {
    await act(() => document.querySelector<HTMLElement>(selector)!.click());
    await settleConnectedCombobox();
  };
  const pressItem = async () => {
    await press("[data-sw-combobox-trigger]");
    await press('[data-sw-combobox-item][data-value="react"]');
  };

  it("runs item press as value, input, open with uncontrolled text", async () => {
    const { events, props } = recorder();
    await mount(
      <Combobox.Root {...props} defaultValue="astro">
        <Combobox.Input />
        <Combobox.Trigger>Open</Combobox.Trigger>
        {items}
      </Combobox.Root>,
    );
    await pressItem();
    expect(events).toEqual(["open:true", "value:react", "input:React:item-press", "open:false"]);
    expect(input().value).toBe("React");
  });

  it("runs clear as value, then empty input with uncontrolled text", async () => {
    const { events, props } = recorder();
    await mount(
      <Combobox.Root {...props} defaultValue="astro" defaultInputValue="Astro">
        <Combobox.Input />
        <Combobox.Clear>Clear</Combobox.Clear>
        {items}
      </Combobox.Root>,
    );
    await press("[data-sw-combobox-clear]");
    expect(events).toEqual(["value:null", "input::clear"]);
    expect(input().value).toBe("");
  });

  it("runs the same order with a controlled value and controlled text", async () => {
    const { events, props } = recorder();
    await mount(<ControlledFixture input="Astro" props={props} value="astro" />);
    await pressItem();
    expect(events).toEqual(["open:true", "value:react", "input:React:item-press", "open:false"]);
    expect(input().value).toBe("React");
    events.length = 0;
    await press("[data-sw-combobox-clear]");
    expect(events).toEqual(["value:null", "input::clear"]);
    expect(input().value).toBe("");
  });

  it("can cancel item press text with an uncontrolled value", async () => {
    const { events, props } = recorder(true);
    await mount(
      <form>
        <Combobox.Root {...props} defaultValue="astro" defaultInputValue="Astro" name="framework">
          <Combobox.Input />
          <Combobox.Trigger>Open</Combobox.Trigger>
          {items}
        </Combobox.Root>
      </form>,
    );
    await pressItem();
    expect(events).toContain("input:React:item-press");
    expect(input().value).toBe("Astro");
    expect(new FormData(query<HTMLFormElement>("form")).get("framework")).toBe("react");
  });

  it("can cancel item press text with a controlled value", async () => {
    const { props } = recorder(true);
    await mount(<ControlledFixture props={props} value="astro" />);
    await act(() => query<HTMLElement>("[data-sw-combobox-trigger]").click());
    await settleConnectedCombobox();
    const before = input().value;
    await press('[data-sw-combobox-item][data-value="react"]');
    expect(query<HTMLElement>("[data-sw-combobox]").getAttribute("data-value")).toBe("react");
    expect(input().value).toBe(before);
  });

  it("can cancel clear text with a controlled value", async () => {
    const { props } = recorder(true);
    await mount(<ControlledFixture props={props} value="astro" />);
    await act(() => query<HTMLElement>("[data-sw-combobox-trigger]").click());
    await settleConnectedCombobox();
    const before = input().value;
    await press("[data-sw-combobox-clear]");
    expect(query<HTMLElement>("[data-sw-combobox]").hasAttribute("data-value")).toBe(false);
    expect(input().value).toBe(before);
  });

  it("shows the label of an imperative value while the lazy popup is closed", async () => {
    const { events, props } = recorder();
    await mount(
      <Combobox.Root {...props} defaultValue="astro">
        <Combobox.Input />
        <Combobox.Trigger>Open</Combobox.Trigger>
        {items}
      </Combobox.Root>,
    );
    await press("[data-sw-combobox-trigger]");
    await press("[data-sw-combobox-trigger]");
    events.length = 0;
    await act(() => {
      query<HTMLElement>("[data-sw-combobox]").dispatchEvent(
        new CustomEvent("starwind:set-value", { bubbles: true, detail: { value: "react" } }),
      );
    });
    await settleConnectedCombobox();
    expect(events).toEqual(["value:react"]);
    expect(input().value).toBe("React");
  });

  it("shows the label of a parent value while the lazy popup is closed", async () => {
    let setValue!: (value: string) => void;
    function Fixture() {
      const [value, update] = React.useState("astro");
      setValue = update;
      return (
        <Combobox.Root value={value}>
          <Combobox.Input />
          <Combobox.Trigger>Open</Combobox.Trigger>
          {items}
        </Combobox.Root>
      );
    }
    await mount(<Fixture />);
    await press("[data-sw-combobox-trigger]");
    await press("[data-sw-combobox-trigger]");
    await act(() => setValue("react"));
    await settleConnectedCombobox();
    expect(input().value).toBe("React");
  });

  it("keeps text and form value together after reset with a parent value and lazy popup", async () => {
    await mount(
      <form>
        <Combobox.Root defaultValue="astro" name="framework" value="react">
          <Combobox.Input />
          <Combobox.Trigger>Open</Combobox.Trigger>
          {items}
        </Combobox.Root>
      </form>,
    );
    await press("[data-sw-combobox-trigger]");
    await press("[data-sw-combobox-trigger]");
    const form = query<HTMLFormElement>("form");
    await act(() => form.reset());
    await settleConnectedCombobox();
    expect(new FormData(form).get("framework")).toBe("react");
    expect(input().value).toBe("React");
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
