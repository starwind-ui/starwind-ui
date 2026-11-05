import { Checkbox } from "@starwind-ui/react/checkbox";
import { Combobox } from "@starwind-ui/react/combobox";
import { Input } from "@starwind-ui/react/input";
import { Select } from "@starwind-ui/react/select";
import { Slider } from "@starwind-ui/react/slider";
import { Switch } from "@starwind-ui/react/switch";
import Textarea from "@conformance/styled-react/textarea/Textarea";
import { useEffect, useState } from "react";
import { parent } from "../shared/harness";

function useParent<T>(id: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    parent(id, { write: (next) => setValue(next as T), read: () => value });
  }, [id, value]);
  return [value, setValue] as const;
}

export default function FormPage() {
  const [select, setSelect] = useParent<string | null>("fp-sel", "a");
  const [combobox, setCombobox] = useParent<string | null>("fp-cmb", "a");
  const [checked, setChecked] = useParent("fp-chk", false);
  const [switched, setSwitched] = useParent("fp-swi", false);
  const [slider, setSlider] = useParent<number | readonly number[]>("fp-sld", 20);
  const [input, setInput] = useParent("fp-inp", "hello");
  const [seeded, setSeeded] = useParent("fp-txt", "notes");
  const [empty, setEmpty] = useParent("fp-txe", "");

  return (
    <main>
      <form id="fu">
        <Select.Root name="sel" defaultValue="a">
          <Select.Trigger data-testid="fu-sel-trigger">
            <Select.Value data-testid="fu-sel-value" />
          </Select.Trigger>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                <Select.Item value="a">
                  <Select.ItemText>Apple</Select.ItemText>
                </Select.Item>
                <Select.Item value="b" data-testid="fu-sel-item-b">
                  <Select.ItemText>Banana</Select.ItemText>
                </Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Root>
        <Combobox.Root name="cmb" defaultValue="a">
          <Combobox.InputGroup>
            <Combobox.Input data-testid="fu-cmb-input" />
            <Combobox.Trigger data-testid="fu-cmb-trigger">Open</Combobox.Trigger>
          </Combobox.InputGroup>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="a">
                  <Combobox.ItemText>Apple</Combobox.ItemText>
                </Combobox.Item>
                <Combobox.Item value="b" data-testid="fu-cmb-item-b">
                  <Combobox.ItemText>Banana</Combobox.ItemText>
                </Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Root>
        <Checkbox.Root name="chk" value="yes" data-testid="fu-chk">
          <Checkbox.Indicator />
        </Checkbox.Root>
        <Switch.Root name="swi" value="yes" data-testid="fu-swi">
          <Switch.Thumb />
        </Switch.Root>
        <Slider.Root name="sld" defaultValue={20}>
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb data-testid="fu-sld-thumb" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
        <Input.Root name="inp" defaultValue="hello" data-testid="fu-inp" />
        <Textarea name="txt" defaultValue="notes" data-testid="fu-txt" />
        <Textarea name="txe" data-testid="fu-txe" />
        <button type="submit" data-testid="fu-submit">
          Submit
        </button>
      </form>

      <form id="fp">
        <Select.Root name="sel" value={select} onValueChange={(value) => setSelect(value)}>
          <Select.Trigger data-testid="fp-sel-trigger">
            <Select.Value data-testid="fp-sel-value" />
          </Select.Trigger>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                <Select.Item value="a">
                  <Select.ItemText>Apple</Select.ItemText>
                </Select.Item>
                <Select.Item value="b" data-testid="fp-sel-item-b">
                  <Select.ItemText>Banana</Select.ItemText>
                </Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Root>
        <Combobox.Root name="cmb" value={combobox} onValueChange={(value) => setCombobox(value)}>
          <Combobox.InputGroup>
            <Combobox.Input data-testid="fp-cmb-input" />
            <Combobox.Trigger data-testid="fp-cmb-trigger">Open</Combobox.Trigger>
          </Combobox.InputGroup>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="a">
                  <Combobox.ItemText>Apple</Combobox.ItemText>
                </Combobox.Item>
                <Combobox.Item value="b" data-testid="fp-cmb-item-b">
                  <Combobox.ItemText>Banana</Combobox.ItemText>
                </Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Root>
        <Checkbox.Root
          name="chk"
          value="yes"
          data-testid="fp-chk"
          checked={checked}
          onCheckedChange={(value) => setChecked(value)}
        >
          <Checkbox.Indicator />
        </Checkbox.Root>
        <Switch.Root
          name="swi"
          value="yes"
          data-testid="fp-swi"
          checked={switched}
          onCheckedChange={(value) => setSwitched(value)}
        >
          <Switch.Thumb />
        </Switch.Root>
        <Slider.Root name="sld" value={slider} onValueChange={(value) => setSlider(value)}>
          <Slider.Control>
            <Slider.Track>
              <Slider.Indicator />
              <Slider.Thumb data-testid="fp-sld-thumb" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
        <Input.Root
          name="inp"
          data-testid="fp-inp"
          value={input}
          onValueChange={(value) => setInput(String(value))}
        />
        <Textarea
          name="txt"
          data-testid="fp-txt"
          value={seeded}
          onChange={(event) => setSeeded(event.target.value)}
        />
        <Textarea
          name="txe"
          data-testid="fp-txe"
          value={empty}
          onChange={(event) => setEmpty(event.target.value)}
        />
        <button type="submit" data-testid="fp-submit">
          Submit
        </button>
      </form>
    </main>
  );
}
