import { Checkbox as StyledCheckbox } from "@conformance/styled-react/checkbox";
import {
  ComboboxContent,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxTrigger,
  Combobox as StyledCombobox,
} from "@conformance/styled-react/combobox";
import StyledField from "@conformance/styled-react/field/Field";
import { Input as StyledInput } from "@conformance/styled-react/input";
import {
  RadioGroupItem,
  RadioGroup as StyledRadioGroup,
} from "@conformance/styled-react/radio-group";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Select as StyledSelect,
} from "@conformance/styled-react/select";
import { Slider as StyledSlider } from "@conformance/styled-react/slider";
import { Switch as StyledSwitch } from "@conformance/styled-react/switch";
import { Checkbox } from "@starwind-ui/react/checkbox";
import { Combobox } from "@starwind-ui/react/combobox";
import { Field } from "@starwind-ui/react/field";
import { Input } from "@starwind-ui/react/input";
import { Radio } from "@starwind-ui/react/radio";
import { RadioGroup } from "@starwind-ui/react/radio-group";
import { Select } from "@starwind-ui/react/select";
import { Slider } from "@starwind-ui/react/slider";
import { Switch } from "@starwind-ui/react/switch";
import { type ComponentType, useEffect, useState } from "react";
import { parent, record, refused } from "../shared/harness";

type Bound = Record<string, unknown>;
type Render = ComponentType<{ id: string; bound: Bound }>;

/** The first value of each control, and the prop pair that holds its value. */
const facts: Record<string, { initial: unknown; prop: string; event: string; fixed?: Bound }> = {
  sel: { initial: "a", prop: "value", event: "onValueChange" },
  cmb: { initial: "a", prop: "value", event: "onValueChange" },
  chk: { initial: false, prop: "checked", event: "onCheckedChange", fixed: { value: "yes" } },
  swi: { initial: false, prop: "checked", event: "onCheckedChange", fixed: { value: "yes" } },
  sld: { initial: 20, prop: "value", event: "onValueChange" },
  rad: { initial: "a", prop: "value", event: "onValueChange" },
  inp: { initial: "hello", prop: "value", event: "onValueChange" },
};

const primitive: Record<string, Render> = {
  sel: ({ id, bound }) => (
    <Select.Root data-testid={`${id}-root`} {...bound}>
      <Select.Trigger data-testid={`${id}-trigger`}>
        <Select.Value data-testid={`${id}-value`} />
      </Select.Trigger>
      <Select.Positioner>
        <Select.Popup>
          <Select.List>
            <Select.Item value="a">
              <Select.ItemText>Apple</Select.ItemText>
            </Select.Item>
            <Select.Item value="b" data-testid={`${id}-item-b`}>
              <Select.ItemText>Banana</Select.ItemText>
            </Select.Item>
          </Select.List>
        </Select.Popup>
      </Select.Positioner>
    </Select.Root>
  ),
  cmb: ({ id, bound }) => (
    <Combobox.Root data-testid={`${id}-root`} {...bound}>
      <Combobox.InputGroup>
        <Combobox.Input data-testid={`${id}-input`} />
        <Combobox.Trigger data-testid={`${id}-trigger`}>Open</Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Positioner>
        <Combobox.Popup>
          <Combobox.List>
            <Combobox.Item value="a">
              <Combobox.ItemText>Apple</Combobox.ItemText>
            </Combobox.Item>
            <Combobox.Item value="b" data-testid={`${id}-item-b`}>
              <Combobox.ItemText>Banana</Combobox.ItemText>
            </Combobox.Item>
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Root>
  ),
  chk: ({ id, bound }) => (
    <Checkbox.Root data-testid={`${id}-root`} {...bound}>
      <Checkbox.Indicator />
    </Checkbox.Root>
  ),
  swi: ({ id, bound }) => (
    <Switch.Root data-testid={`${id}-root`} {...bound}>
      <Switch.Thumb />
    </Switch.Root>
  ),
  sld: ({ id, bound }) => (
    <Slider.Root data-testid={`${id}-root`} {...bound}>
      <Slider.Control>
        <Slider.Track>
          <Slider.Indicator />
          <Slider.Thumb />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  ),
  rad: ({ id, bound }) => (
    <RadioGroup.Root data-testid={`${id}-root`} {...bound}>
      <Radio.Root value="a">
        <Radio.Indicator />
      </Radio.Root>
      <Radio.Root value="b" data-testid={`${id}-item-b`}>
        <Radio.Indicator />
      </Radio.Root>
    </RadioGroup.Root>
  ),
  inp: ({ id, bound }) => <Input.Root data-testid={`${id}-root`} {...bound} />,
};

const styled: Record<string, Render> = {
  sel: ({ id, bound }) => (
    <StyledSelect data-testid={`${id}-root`} {...bound}>
      <SelectTrigger data-testid={`${id}-trigger`}>
        <SelectValue data-testid={`${id}-value`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">Apple</SelectItem>
        <SelectItem value="b" data-testid={`${id}-item-b`}>
          Banana
        </SelectItem>
      </SelectContent>
    </StyledSelect>
  ),
  cmb: ({ id, bound }) => (
    <StyledCombobox data-testid={`${id}-root`} {...bound}>
      <ComboboxInputGroup>
        <ComboboxInput data-testid={`${id}-input`} showTrigger={false} />
        <ComboboxTrigger data-testid={`${id}-trigger`} />
      </ComboboxInputGroup>
      <ComboboxContent>
        <ComboboxItem value="a">Apple</ComboboxItem>
        <ComboboxItem value="b" data-testid={`${id}-item-b`}>
          Banana
        </ComboboxItem>
      </ComboboxContent>
    </StyledCombobox>
  ),
  chk: ({ id, bound }) => <StyledCheckbox data-testid={`${id}-root`} {...bound} />,
  swi: ({ id, bound }) => <StyledSwitch data-testid={`${id}-root`} {...bound} />,
  sld: ({ id, bound }) => <StyledSlider data-testid={`${id}-root`} {...bound} />,
  rad: ({ id, bound }) => (
    <StyledRadioGroup data-testid={`${id}-root`} {...bound}>
      <RadioGroupItem value="a" />
      <RadioGroupItem value="b" data-testid={`${id}-item-b`} />
    </StyledRadioGroup>
  ),
  inp: ({ id, bound }) => <StyledInput data-testid={`${id}-root`} {...bound} />,
};

function Control({
  kind,
  id,
  Render,
  held,
}: {
  kind: string;
  id: string;
  Render: Render;
  held: boolean;
}) {
  const fact = facts[kind]!;
  const [value, setValue] = useState(fact.initial);
  useEffect(() => {
    if (held) parent(id, { write: setValue, read: () => value });
  }, [held, id, value]);
  const change = (next: unknown, details: unknown) => {
    record(id, "change", next, details);
    if (!refused(id)) setValue(next);
  };
  const defaultProp = `default${fact.prop[0]!.toUpperCase()}${fact.prop.slice(1)}`;
  const bound: Bound = held
    ? { ...fact.fixed, [fact.prop]: value, [fact.event]: change }
    : {
        ...fact.fixed,
        [defaultProp]: fact.initial,
        [fact.event]: (next: unknown, details: unknown) => record(id, "change", next, details),
      };
  return <Render id={id} bound={bound} />;
}

const sets = [
  { style: "p", FieldRoot: Field.Root, parts: primitive },
  { style: "s", FieldRoot: StyledField, parts: styled },
];

export default function FieldControlsPage() {
  return (
    <main>
      <form id="pcmb-n">
        <Control kind="cmb" id="pcmb-n" Render={primitive.cmb!} held />
      </form>
      {sets.flatMap(({ style, FieldRoot, parts }) =>
        Object.keys(facts).flatMap((kind) =>
          [false, true].map((held) => {
            const id = `${style}${kind}-${held ? "h" : "u"}`;
            return (
              <form id={id} key={id}>
                <FieldRoot name="f">
                  <Control kind={kind} id={id} Render={parts[kind]!} held={held} />
                </FieldRoot>
                <button type="submit" data-testid={`${id}-submit`}>
                  Submit
                </button>
              </form>
            );
          }),
        ),
      )}
    </main>
  );
}
