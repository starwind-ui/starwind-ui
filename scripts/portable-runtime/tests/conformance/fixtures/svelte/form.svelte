<script lang="ts">
  import { Checkbox } from "@starwind-ui/svelte/checkbox";
  import { Combobox } from "@starwind-ui/svelte/combobox";
  import { Input } from "@starwind-ui/svelte/input";
  import { Select } from "@starwind-ui/svelte/select";
  import { Slider } from "@starwind-ui/svelte/slider";
  import { Switch } from "@starwind-ui/svelte/switch";
  import Textarea from "@conformance/styled-svelte/textarea/Textarea.svelte";
  import { parent } from "../shared/harness";

  let select = $state<string | null>("a");
  let combobox = $state<string | null>("a");
  let checked = $state(false);
  let switched = $state(false);
  let slider = $state<number | readonly number[]>(20);
  let input = $state("hello");
  let seeded = $state("notes");
  let empty = $state("");

  parent("fp-sel", { write: (next) => (select = next as string | null), read: () => select });
  parent("fp-cmb", { write: (next) => (combobox = next as string | null), read: () => combobox });
  parent("fp-chk", { write: (next) => (checked = next as boolean), read: () => checked });
  parent("fp-swi", { write: (next) => (switched = next as boolean), read: () => switched });
  parent("fp-sld", { write: (next) => (slider = next as number), read: () => slider });
  parent("fp-inp", { write: (next) => (input = next as string), read: () => input });
  parent("fp-txt", { write: (next) => (seeded = next as string), read: () => seeded });
  parent("fp-txe", { write: (next) => (empty = next as string), read: () => empty });
</script>

<main>
  <form id="fu">
    <Select.Root name="sel" defaultValue="a">
      <Select.Trigger data-testid="fu-sel-trigger">
        <Select.Value data-testid="fu-sel-value" />
      </Select.Trigger>
      <Select.Positioner>
        <Select.Popup>
          <Select.List>
            <Select.Item value="a"><Select.ItemText>Apple</Select.ItemText></Select.Item>
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
            <Combobox.Item value="a"><Combobox.ItemText>Apple</Combobox.ItemText></Combobox.Item>
            <Combobox.Item value="b" data-testid="fu-cmb-item-b">
              <Combobox.ItemText>Banana</Combobox.ItemText>
            </Combobox.Item>
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Root>
    <Checkbox.Root name="chk" value="yes" data-testid="fu-chk"><Checkbox.Indicator /></Checkbox.Root>
    <Switch.Root name="swi" value="yes" data-testid="fu-swi"><Switch.Thumb /></Switch.Root>
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
    <button type="submit" data-testid="fu-submit">Submit</button>
  </form>

  <form id="fp">
    <Select.Root name="sel" bind:value={select}>
      <Select.Trigger data-testid="fp-sel-trigger">
        <Select.Value data-testid="fp-sel-value" />
      </Select.Trigger>
      <Select.Positioner>
        <Select.Popup>
          <Select.List>
            <Select.Item value="a"><Select.ItemText>Apple</Select.ItemText></Select.Item>
            <Select.Item value="b" data-testid="fp-sel-item-b">
              <Select.ItemText>Banana</Select.ItemText>
            </Select.Item>
          </Select.List>
        </Select.Popup>
      </Select.Positioner>
    </Select.Root>
    <Combobox.Root name="cmb" bind:value={combobox}>
      <Combobox.InputGroup>
        <Combobox.Input data-testid="fp-cmb-input" />
        <Combobox.Trigger data-testid="fp-cmb-trigger">Open</Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Positioner>
        <Combobox.Popup>
          <Combobox.List>
            <Combobox.Item value="a"><Combobox.ItemText>Apple</Combobox.ItemText></Combobox.Item>
            <Combobox.Item value="b" data-testid="fp-cmb-item-b">
              <Combobox.ItemText>Banana</Combobox.ItemText>
            </Combobox.Item>
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Root>
    <Checkbox.Root name="chk" value="yes" data-testid="fp-chk" bind:checked>
      <Checkbox.Indicator />
    </Checkbox.Root>
    <Switch.Root name="swi" value="yes" data-testid="fp-swi" bind:checked={switched}>
      <Switch.Thumb />
    </Switch.Root>
    <Slider.Root name="sld" bind:value={slider}>
      <Slider.Control>
        <Slider.Track>
          <Slider.Indicator />
          <Slider.Thumb data-testid="fp-sld-thumb" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
    <Input.Root name="inp" data-testid="fp-inp" bind:value={input} />
    <Textarea name="txt" data-testid="fp-txt" bind:value={seeded} />
    <Textarea name="txe" data-testid="fp-txe" bind:value={empty} />
    <button type="submit" data-testid="fp-submit">Submit</button>
  </form>
</main>
