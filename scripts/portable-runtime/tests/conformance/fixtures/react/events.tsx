import { Checkbox } from "@starwind-ui/react/checkbox";
import { Combobox } from "@starwind-ui/react/combobox";
import { Dialog } from "@starwind-ui/react/dialog";
import { Input } from "@starwind-ui/react/input";
import { Select } from "@starwind-ui/react/select";
import { Switch } from "@starwind-ui/react/switch";
import { Tabs } from "@starwind-ui/react/tabs";
import { useEffect, useState } from "react";
import { parent, record, refused } from "../shared/harness";

function ComboboxParts({ id }: { id: string }) {
  return (
    <>
      <Combobox.InputGroup>
        <Combobox.Input data-testid={`${id}-input`} />
        <Combobox.Trigger data-testid={`${id}-trigger`}>Open</Combobox.Trigger>
        <Combobox.Clear data-testid={`${id}-clear`}>Clear</Combobox.Clear>
      </Combobox.InputGroup>
      <Combobox.Positioner>
        <Combobox.Popup data-testid={`${id}-popup`}>
          <Combobox.List>
            <Combobox.Item value="a" data-testid={`${id}-item-a`}>
              <Combobox.ItemText>Apple</Combobox.ItemText>
            </Combobox.Item>
            <Combobox.Item value="b" data-testid={`${id}-item-b`}>
              <Combobox.ItemText>Banana</Combobox.ItemText>
            </Combobox.Item>
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Positioner>
    </>
  );
}

function SelectParts({ id }: { id: string }) {
  return (
    <>
      <Select.Trigger data-testid={`${id}-trigger`}>
        <Select.Value data-testid={`${id}-value`} placeholder="Pick" />
      </Select.Trigger>
      <Select.Positioner>
        <Select.Popup data-testid={`${id}-popup`}>
          <Select.List>
            <Select.Item value="a" data-testid={`${id}-item-a`}>
              <Select.ItemText>Apple</Select.ItemText>
            </Select.Item>
            <Select.Item value="b" data-testid={`${id}-item-b`}>
              <Select.ItemText>Banana</Select.ItemText>
            </Select.Item>
          </Select.List>
        </Select.Popup>
      </Select.Positioner>
    </>
  );
}

function DialogParts({ id }: { id: string }) {
  return (
    <>
      <Dialog.Trigger data-testid={`${id}-trigger`}>Open</Dialog.Trigger>
      <Dialog.Popup data-testid={`${id}-popup`}>
        <Dialog.Title>Title</Dialog.Title>
        <Dialog.Close data-testid={`${id}-close`}>Close</Dialog.Close>
      </Dialog.Popup>
    </>
  );
}

function TabsParts({ id }: { id: string }) {
  return (
    <>
      <Tabs.List>
        <Tabs.Tab value="one" data-testid={`${id}-tab-one`}>
          One
        </Tabs.Tab>
        <Tabs.Tab value="two" data-testid={`${id}-tab-two`}>
          Two
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="one" data-testid={`${id}-panel-one`}>
        Panel one
      </Tabs.Panel>
      <Tabs.Panel value="two" data-testid={`${id}-panel-two`}>
        Panel two
      </Tabs.Panel>
    </>
  );
}

function useParent<T>(id: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    parent(id, { write: (next) => setValue(next as T), read: () => value });
  }, [id, value]);
  return [value, setValue] as const;
}

export default function Events() {
  const [comboText, setComboText] = useParent("cc", "");
  const [comboValue, setComboValue] = useParent<string | null>("cv", null);
  const [wrappedValue, setWrappedValue] = useParent<string | null>("cw", null);
  const [dialogOpen, setDialogOpen] = useParent("dp", false);
  const [selectValue, setSelectValue] = useParent<string | null>("sp", "a");
  const [tab, setTab] = useParent<string | null>("tp", "one");
  const [checked, setChecked] = useParent("kp", false);
  const [switched, setSwitched] = useParent("wp", false);
  const [inputValue, setInputValue] = useParent("ip", "hello");

  return (
    <main>
      <button type="button" data-testid="outside">
        Outside
      </button>

      <Combobox.Root
        data-testid="cu-root"
        onValueChange={(value, details) => record("cu", "value", value, details)}
        onInputValueChange={(value, details) => record("cu", "input", value, details)}
        onOpenChange={(value, details) => record("cu", "open", value, details)}
      >
        <ComboboxParts id="cu" />
      </Combobox.Root>

      <Combobox.Root
        data-testid="cc-root"
        inputValue={comboText}
        onValueChange={(value, details) => record("cc", "value", value, details)}
        onInputValueChange={(value, details) => {
          record("cc", "input", value, details);
          if (!refused("cc") && !details.isCanceled) setComboText(value);
        }}
        onOpenChange={(value, details) => record("cc", "open", value, details)}
      >
        <ComboboxParts id="cc" />
      </Combobox.Root>

      <Combobox.Root
        data-testid="cv-root"
        value={comboValue}
        onValueChange={(value, details) => {
          record("cv", "value", value, details);
          if (!refused("cv") && !details.isCanceled) setComboValue(value);
        }}
        onInputValueChange={(value, details) => record("cv", "input", value, details)}
        onOpenChange={(value, details) => record("cv", "open", value, details)}
      >
        <Combobox.InputGroup>
          <Combobox.Input data-testid="cv-input" />
          <Combobox.Trigger data-testid="cv-trigger">Open</Combobox.Trigger>
        </Combobox.InputGroup>
        <Combobox.Positioner>
          <Combobox.Popup data-testid="cv-popup">
            <Combobox.List>
              <Combobox.Item value="a" data-testid="cv-item-a">
                <Combobox.ItemText>Apple</Combobox.ItemText>
              </Combobox.Item>
              <Combobox.Item value="b" data-testid="cv-item-b">
                <Combobox.ItemText>Banana</Combobox.ItemText>
              </Combobox.Item>
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Root>

      <Combobox.Root
        data-testid="cw-root"
        value={wrappedValue}
        onValueChange={(value) => setWrappedValue(value)}
      >
        <ComboboxParts id="cw" />
      </Combobox.Root>

      <Dialog.Root
        data-testid="du-root"
        onOpenChange={(value, details) => record("du", "open", value, details)}
      >
        <DialogParts id="du" />
      </Dialog.Root>

      <Dialog.Root
        data-testid="dp-root"
        open={dialogOpen}
        onOpenChange={(value, details) => {
          record("dp", "open", value, details);
          if (!refused("dp") && !details.isCanceled) setDialogOpen(value);
        }}
      >
        <DialogParts id="dp" />
      </Dialog.Root>

      <Select.Root
        data-testid="su-root"
        onValueChange={(value, details) => record("su", "value", value, details)}
        onOpenChange={(value, details) => record("su", "open", value, details)}
      >
        <Select.Trigger data-testid="su-trigger">
          <Select.Value data-testid="su-value" placeholder="Pick" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Popup data-testid="su-popup">
            <Select.List>
              <Select.Item value="a" data-testid="su-item-a">
                <Select.ItemText>Apple</Select.ItemText>
              </Select.Item>
              <Select.Item value="b" data-testid="su-item-b">
                <Select.ItemText>Banana</Select.ItemText>
              </Select.Item>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>

      <Select.Root
        data-testid="sp-root"
        value={selectValue}
        onValueChange={(value, details) => {
          record("sp", "value", value, details);
          if (!refused("sp") && !details.isCanceled) setSelectValue(value);
        }}
      >
        <Select.Trigger data-testid="sp-trigger">
          <Select.Value data-testid="sp-value" placeholder="Pick" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Popup data-testid="sp-popup">
            <Select.List>
              <Select.Item value="a" data-testid="sp-item-a">
                <Select.ItemText>Apple</Select.ItemText>
              </Select.Item>
              <Select.Item value="b" data-testid="sp-item-b">
                <Select.ItemText>Banana</Select.ItemText>
              </Select.Item>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>

      <Select.Root
        data-testid="sw-root"
        onValueChange={(value, details) => record("sw", "value", value, details)}
      >
        <SelectParts id="sw" />
      </Select.Root>

      <Tabs.Root
        data-testid="tu-root"
        defaultValue="one"
        onValueChange={(value, details) => record("tu", "value", value, details)}
      >
        <TabsParts id="tu" />
      </Tabs.Root>

      <Tabs.Root
        data-testid="tp-root"
        value={tab}
        onValueChange={(value, details) => {
          record("tp", "value", value, details);
          if (!refused("tp") && !details.isCanceled) setTab(value);
        }}
      >
        <TabsParts id="tp" />
      </Tabs.Root>

      <Checkbox.Root
        data-testid="ku-root"
        onCheckedChange={(value, details) => record("ku", "checked", value, details)}
      >
        <Checkbox.Indicator />
      </Checkbox.Root>

      <Checkbox.Root
        data-testid="kp-root"
        checked={checked}
        onCheckedChange={(value, details) => {
          record("kp", "checked", value, details);
          if (!refused("kp") && !details.isCanceled) setChecked(value);
        }}
      >
        <Checkbox.Indicator />
      </Checkbox.Root>

      <Switch.Root
        data-testid="wp-root"
        checked={switched}
        onCheckedChange={(value, details) => {
          record("wp", "checked", value, details);
          if (!refused("wp") && !details.isCanceled) setSwitched(value);
        }}
      >
        <Switch.Thumb />
      </Switch.Root>

      <Input.Root
        data-testid="ip-root"
        value={inputValue}
        onValueChange={(value, details) => {
          record("ip", "value", value, details);
          if (!refused("ip")) setInputValue(String(value));
        }}
      />
    </main>
  );
}
