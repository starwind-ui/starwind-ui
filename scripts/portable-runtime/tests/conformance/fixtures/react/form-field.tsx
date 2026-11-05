import {
  Combobox as StyledCombobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxTrigger,
} from "@conformance/styled-react/combobox";
import StyledField from "@conformance/styled-react/field/Field";
import {
  Select as StyledSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@conformance/styled-react/select";
import { Combobox } from "@starwind-ui/react/combobox";
import { Field } from "@starwind-ui/react/field";
import { Select } from "@starwind-ui/react/select";
import { type FunctionComponent, type ReactNode, useState } from "react";

type Items = FunctionComponent<{ id: string }>;
type Control = {
  id: string;
  name?: string;
  defaultValue?: string;
  tick: number;
  items: ReactNode;
};

const PrimitiveSelectItems: Items = ({ id }) => (
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
);

const PrimitiveComboboxItems: Items = ({ id }) => (
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
);

const StyledSelectItems: Items = ({ id }) => (
  <SelectContent>
    <SelectItem value="a">Apple</SelectItem>
    <SelectItem value="b" data-testid={`${id}-item-b`}>
      Banana
    </SelectItem>
  </SelectContent>
);

const StyledComboboxItems: Items = ({ id }) => (
  <ComboboxContent>
    <ComboboxItem value="a">Apple</ComboboxItem>
    <ComboboxItem value="b" data-testid={`${id}-item-b`}>
      Banana
    </ComboboxItem>
  </ComboboxContent>
);

const kinds = [
  {
    kind: "ps",
    FieldRoot: Field.Root,
    Items: PrimitiveSelectItems,
    Control: ({ id, tick, items, ...props }: Control) => (
      <Select.Root data-tick={tick} {...props}>
        <Select.Trigger data-testid={`${id}-trigger`}>
          <Select.Value />
        </Select.Trigger>
        {items}
      </Select.Root>
    ),
  },
  {
    kind: "pc",
    FieldRoot: Field.Root,
    Items: PrimitiveComboboxItems,
    Control: ({ id, tick, items, ...props }: Control) => (
      <Combobox.Root data-tick={tick} {...props}>
        <Combobox.InputGroup>
          <Combobox.Input />
          <Combobox.Trigger data-testid={`${id}-trigger`}>Open</Combobox.Trigger>
        </Combobox.InputGroup>
        {items}
      </Combobox.Root>
    ),
  },
  {
    kind: "ss",
    FieldRoot: StyledField,
    Items: StyledSelectItems,
    Control: ({ id, tick, items, ...props }: Control) => (
      <StyledSelect data-tick={tick} {...props}>
        <SelectTrigger data-testid={`${id}-trigger`}>
          <SelectValue />
        </SelectTrigger>
        {items}
      </StyledSelect>
    ),
  },
  {
    kind: "sc",
    FieldRoot: StyledField,
    Items: StyledComboboxItems,
    Control: ({ id, tick, items, ...props }: Control) => (
      <StyledCombobox data-tick={tick} {...props}>
        <ComboboxInputGroup>
          <ComboboxInput showTrigger={false} />
          <ComboboxTrigger data-testid={`${id}-trigger`} />
        </ComboboxInputGroup>
        {items}
      </StyledCombobox>
    ),
  },
];

const cases = [
  { name: "def", defaultValue: "a" },
  { name: "pick" },
  { name: "kid", defaultValue: "a", child: true },
  { name: "own", defaultValue: "a", own: "own" },
];

export default function FormFieldPage() {
  const [tick, setTick] = useState(0);

  return (
    <main>
      <button type="button" data-testid="ff-tick" onClick={() => setTick((value) => value + 1)}>
        Render again
      </button>
      {kinds.flatMap(({ kind, FieldRoot, Items, Control }) =>
        cases.map(({ name, defaultValue, child, own }) => {
          const id = `${kind}-${name}`;
          return (
            <form id={id} key={id}>
              <FieldRoot name="fruit">
                <Control
                  id={id}
                  tick={tick}
                  {...(own ? { name: own } : {})}
                  {...(defaultValue ? { defaultValue } : {})}
                  // A plain call gives the root its items directly. The element puts them in a child.
                  items={child ? <Items id={id} /> : Items({ id })}
                />
              </FieldRoot>
              <button type="submit" data-testid={`${id}-submit`}>
                Submit
              </button>
            </form>
          );
        }),
      )}
    </main>
  );
}
