import { Combobox } from "@starwind-ui/react/combobox";
import { Select } from "@starwind-ui/react/select";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import {
  Combobox as StyledCombobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxTrigger,
} from "../../../apps/react-demo/src/components/starwind-runtime/combobox";
import StyledField from "../../../apps/react-demo/src/components/starwind-runtime/field/Field";
import {
  Select as StyledSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../apps/react-demo/src/components/starwind-runtime/select";
import { Field } from "../src/field";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let owner: Root | undefined;
let host: HTMLDivElement;

afterEach(async () => {
  if (owner) await act(() => owner?.unmount());
  owner = undefined;
  host?.remove();
  document.body.innerHTML = "";
});

async function render(tree: React.ReactNode, strict = true) {
  host = document.createElement("div");
  document.body.append(host);
  owner = createRoot(host);
  await act(async () => {
    owner!.render(strict ? <React.StrictMode>{tree}</React.StrictMode> : tree);
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

/** A real submit, so the browser decides which entries the form sends. */
function submit(): Record<string, string> {
  const form = host.querySelector("form")!;
  const entries: Record<string, string> = {};
  const capture = (event: Event) => {
    event.preventDefault();
    new FormData(event.target as HTMLFormElement).forEach((value, name) => {
      entries[name] = String(value);
    });
  };
  form.addEventListener("submit", capture);
  form.requestSubmit();
  form.removeEventListener("submit", capture);
  return entries;
}

async function press(selector: string) {
  await act(async () => {
    const element = document.querySelector<HTMLElement>(selector)!;
    element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    element.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0 }));
    element.click();
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

function PrimitiveSelectItems() {
  return (
    <Select.Positioner>
      <Select.Popup>
        <Select.List>
          <Select.Item value="apple">
            <Select.ItemText>Apple</Select.ItemText>
          </Select.Item>
          <Select.Item value="banana" data-testid="pick">
            <Select.ItemText>Banana</Select.ItemText>
          </Select.Item>
        </Select.List>
      </Select.Popup>
    </Select.Positioner>
  );
}

function PrimitiveSelect(props: React.ComponentProps<typeof Select.Root>) {
  return (
    <Select.Root {...props}>
      <Select.Trigger data-testid="open">
        <Select.Value />
      </Select.Trigger>
      <PrimitiveSelectItems />
    </Select.Root>
  );
}

function PrimitiveComboboxItems() {
  return (
    <Combobox.Positioner>
      <Combobox.Popup>
        <Combobox.List>
          <Combobox.Item value="apple">
            <Combobox.ItemText>Apple</Combobox.ItemText>
          </Combobox.Item>
          <Combobox.Item value="banana" data-testid="pick">
            <Combobox.ItemText>Banana</Combobox.ItemText>
          </Combobox.Item>
        </Combobox.List>
      </Combobox.Popup>
    </Combobox.Positioner>
  );
}

function PrimitiveCombobox(props: React.ComponentProps<typeof Combobox.Root>) {
  return (
    <Combobox.Root {...props}>
      <Combobox.InputGroup>
        <Combobox.Input />
        <Combobox.Trigger data-testid="open">Open</Combobox.Trigger>
      </Combobox.InputGroup>
      <PrimitiveComboboxItems />
    </Combobox.Root>
  );
}

function StyledSelectItems() {
  return (
    <SelectContent>
      <SelectItem value="apple">Apple</SelectItem>
      <SelectItem value="banana" data-testid="pick">
        Banana
      </SelectItem>
    </SelectContent>
  );
}

function StyledSelectControl(props: React.ComponentProps<typeof StyledSelect>) {
  return (
    <StyledSelect {...props}>
      <SelectTrigger data-testid="open">
        <SelectValue />
      </SelectTrigger>
      <StyledSelectItems />
    </StyledSelect>
  );
}

function StyledComboboxItems() {
  return (
    <ComboboxContent>
      <ComboboxItem value="apple">Apple</ComboboxItem>
      <ComboboxItem value="banana" data-testid="pick">
        Banana
      </ComboboxItem>
    </ComboboxContent>
  );
}

function StyledComboboxControl(props: React.ComponentProps<typeof StyledCombobox>) {
  return (
    <StyledCombobox {...props}>
      <ComboboxInputGroup>
        <ComboboxInput showTrigger={false} />
        <ComboboxTrigger data-testid="open" />
      </ComboboxInputGroup>
      <StyledComboboxItems />
    </StyledCombobox>
  );
}

const shapes = [
  { label: "Primitive Select", Root: Field.Root, Control: PrimitiveSelect, strict: true },
  { label: "Primitive Combobox", Root: Field.Root, Control: PrimitiveCombobox, strict: true },
  {
    label: "Primitive Select no strict",
    Root: Field.Root,
    Control: PrimitiveSelect,
    strict: false,
  },
  {
    label: "Primitive Combobox no strict",
    Root: Field.Root,
    Control: PrimitiveCombobox,
    strict: false,
  },
  { label: "Styled Select", Root: StyledField, Control: StyledSelectControl, strict: true },
  { label: "Styled Combobox", Root: StyledField, Control: StyledComboboxControl, strict: true },
] as const;

describe.each(shapes)("$label inside a Field with a name", ({ Root, Control, strict }) => {
  const Any = Control as React.ComponentType<Record<string, unknown>>;

  it("submits the defaultValue under the Field name", async () => {
    await render(
      <form>
        <Root name="fruit">
          <Any defaultValue="apple" />
        </Root>
      </form>,
      strict,
    );
    expect(submit()).toEqual({ fruit: "apple" });
  });

  it("keeps the name of the control over the Field name", async () => {
    await render(
      <form>
        <Root name="fruit">
          <Any name="own" defaultValue="apple" />
        </Root>
      </form>,
      strict,
    );
    expect(submit()).toEqual({ own: "apple" });
  });

  it("submits an empty entry under the Field name before a pick", async () => {
    await render(
      <form>
        <Root name="fruit">
          <Any />
        </Root>
      </form>,
      strict,
    );
    expect(submit()).toEqual({ fruit: "" });
  });

  it("submits a pick under the Field name", async () => {
    await render(
      <form>
        <Root name="fruit">
          <Any />
        </Root>
      </form>,
      strict,
    );
    await press('[data-testid="open"]');
    await press('[data-testid="pick"]');
    expect(submit()).toEqual({ fruit: "banana" });
  });

  it("still calls onValueChange", async () => {
    const seen: unknown[] = [];
    await render(
      <form>
        <Root name="fruit">
          <Any onValueChange={(value: unknown) => seen.push(value)} />
        </Root>
      </form>,
      strict,
    );
    await press('[data-testid="open"]');
    await press('[data-testid="pick"]');
    expect(seen).toEqual(["banana"]);
  });

  it("follows a parent that holds the value", async () => {
    const seen: unknown[] = [];
    function Parent() {
      const [value, setValue] = React.useState<string | null>("apple");
      return (
        <form>
          <output>{value}</output>
          <Root name="fruit">
            <Any
              value={value}
              onValueChange={(next: string | null) => {
                seen.push(next);
                setValue(next);
              }}
            />
          </Root>
        </form>
      );
    }
    await render(<Parent />, strict);
    await press('[data-testid="open"]');
    await press('[data-testid="pick"]');
    expect(seen).toEqual(["banana"]);
    expect(host.querySelector("output")!.textContent).toBe("banana");
    expect(submit()).toEqual({ fruit: "banana" });
  });
});
