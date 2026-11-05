import { Checkbox } from "@starwind-ui/react/checkbox";
import { Combobox } from "@starwind-ui/react/combobox";
import { Input } from "@starwind-ui/react/input";
import { Select } from "@starwind-ui/react/select";
import { Slider } from "@starwind-ui/react/slider";
import { Switch } from "@starwind-ui/react/switch";
import SInput from "@conformance/styled-react/input/Input";
import { useEffect, useState } from "react";
import { parent } from "../shared/harness";

function useParent<T>(id: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    parent(id, { write: (next) => setValue(next as T), read: () => value });
  }, [id, value]);
  return [value, setValue] as const;
}

export default function FormDefaultPage() {
  const [select, setSelect] = useParent<string | null>("fd-sel", "a");
  const [combobox, setCombobox] = useParent<string | null>("fd-cmb", "a");
  const [checked, setChecked] = useParent("fd-chk", true);
  const [switched, setSwitched] = useParent("fd-swi", true);
  const [slider, setSlider] = useParent<number | readonly number[]>("fd-sld", 20);
  const [input, setInput] = useParent("fd-inp", "hello");
  const [styled, setStyled] = useParent("fd-sin", "hello");

  return (
    <form id="fd">
      <Select.Root
        name="sel"
        value={select}
        defaultValue="c"
        onValueChange={(value) => setSelect(value)}
      >
        <Select.Trigger data-testid="fd-sel-trigger">
          <Select.Value data-testid="fd-sel-value" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.List>
              <Select.Item value="a">
                <Select.ItemText>Apple</Select.ItemText>
              </Select.Item>
              <Select.Item value="b" data-testid="fd-sel-item-b">
                <Select.ItemText>Banana</Select.ItemText>
              </Select.Item>
              <Select.Item value="c">
                <Select.ItemText>Cherry</Select.ItemText>
              </Select.Item>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>
      <Combobox.Root
        name="cmb"
        value={combobox}
        defaultValue="c"
        onValueChange={(value) => setCombobox(value)}
      >
        <Combobox.InputGroup>
          <Combobox.Input data-testid="fd-cmb-input" />
          <Combobox.Trigger data-testid="fd-cmb-trigger">Open</Combobox.Trigger>
        </Combobox.InputGroup>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List>
              <Combobox.Item value="a">
                <Combobox.ItemText>Apple</Combobox.ItemText>
              </Combobox.Item>
              <Combobox.Item value="b" data-testid="fd-cmb-item-b">
                <Combobox.ItemText>Banana</Combobox.ItemText>
              </Combobox.Item>
              <Combobox.Item value="c">
                <Combobox.ItemText>Cherry</Combobox.ItemText>
              </Combobox.Item>
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Root>
      <Checkbox.Root
        name="chk"
        value="yes"
        data-testid="fd-chk"
        checked={checked}
        defaultChecked={false}
        onCheckedChange={(value) => setChecked(value)}
      >
        <Checkbox.Indicator />
      </Checkbox.Root>
      <Switch.Root
        name="swi"
        value="yes"
        data-testid="fd-swi"
        checked={switched}
        defaultChecked={false}
        onCheckedChange={(value) => setSwitched(value)}
      >
        <Switch.Thumb />
      </Switch.Root>
      <Slider.Root
        name="sld"
        value={slider}
        defaultValue={50}
        onValueChange={(value) => setSlider(value)}
      >
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb data-testid="fd-sld-thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Input.Root
        name="inp"
        data-testid="fd-inp"
        value={input}
        defaultValue="seed"
        onValueChange={(value) => setInput(String(value))}
      />
      <SInput
        name="sin"
        data-testid="fd-sin"
        value={styled}
        defaultValue="seed"
        onValueChange={(value: unknown) => setStyled(String(value))}
      />
    </form>
  );
}
