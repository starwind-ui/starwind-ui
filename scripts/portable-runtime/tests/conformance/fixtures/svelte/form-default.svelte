<script lang="ts">
  import { Checkbox } from "@starwind-ui/svelte/checkbox";
  import { Combobox } from "@starwind-ui/svelte/combobox";
  import { Input } from "@starwind-ui/svelte/input";
  import { Select } from "@starwind-ui/svelte/select";
  import { Slider } from "@starwind-ui/svelte/slider";
  import { Switch } from "@starwind-ui/svelte/switch";
  import SInput from "@conformance/styled-svelte/input/Input.svelte";
  import Textarea from "@conformance/styled-svelte/textarea/Textarea.svelte";
  import { parent } from "../shared/harness";

  let select = $state<string | null>("a");
  let combobox = $state<string | null>("a");
  let checked = $state(true);
  let switched = $state(true);
  let slider = $state<number | readonly number[]>(20);
  let input = $state("hello");
  let styled = $state("hello");
  let text = $state("hello");

  parent("fd-sel", { write: (next) => (select = next as string | null), read: () => select });
  parent("fd-cmb", { write: (next) => (combobox = next as string | null), read: () => combobox });
  parent("fd-chk", { write: (next) => (checked = next as boolean), read: () => checked });
  parent("fd-swi", { write: (next) => (switched = next as boolean), read: () => switched });
  parent("fd-sld", { write: (next) => (slider = next as number), read: () => slider });
  parent("fd-inp", { write: (next) => (input = next as string), read: () => input });
  parent("fd-sin", { write: (next) => (styled = next as string), read: () => styled });
  parent("fd-txt", { write: (next) => (text = next as string), read: () => text });
</script>

<form id="fd">
  <Select.Root name="sel" bind:value={select} defaultValue="c">
    <Select.Trigger data-testid="fd-sel-trigger">
      <Select.Value data-testid="fd-sel-value" />
    </Select.Trigger>
    <Select.Positioner>
      <Select.Popup>
        <Select.List>
          <Select.Item value="a"><Select.ItemText>Apple</Select.ItemText></Select.Item>
          <Select.Item value="b" data-testid="fd-sel-item-b">
            <Select.ItemText>Banana</Select.ItemText>
          </Select.Item>
          <Select.Item value="c"><Select.ItemText>Cherry</Select.ItemText></Select.Item>
        </Select.List>
      </Select.Popup>
    </Select.Positioner>
  </Select.Root>
  <Combobox.Root name="cmb" bind:value={combobox} defaultValue="c">
    <Combobox.InputGroup>
      <Combobox.Input data-testid="fd-cmb-input" />
      <Combobox.Trigger data-testid="fd-cmb-trigger">Open</Combobox.Trigger>
    </Combobox.InputGroup>
    <Combobox.Positioner>
      <Combobox.Popup>
        <Combobox.List>
          <Combobox.Item value="a"><Combobox.ItemText>Apple</Combobox.ItemText></Combobox.Item>
          <Combobox.Item value="b" data-testid="fd-cmb-item-b">
            <Combobox.ItemText>Banana</Combobox.ItemText>
          </Combobox.Item>
          <Combobox.Item value="c"><Combobox.ItemText>Cherry</Combobox.ItemText></Combobox.Item>
        </Combobox.List>
      </Combobox.Popup>
    </Combobox.Positioner>
  </Combobox.Root>
  <Checkbox.Root name="chk" value="yes" data-testid="fd-chk" bind:checked defaultChecked={false}>
    <Checkbox.Indicator />
  </Checkbox.Root>
  <Switch.Root
    name="swi"
    value="yes"
    data-testid="fd-swi"
    bind:checked={switched}
    defaultChecked={false}
  >
    <Switch.Thumb />
  </Switch.Root>
  <Slider.Root name="sld" bind:value={slider} defaultValue={50}>
    <Slider.Control>
      <Slider.Track>
        <Slider.Indicator />
        <Slider.Thumb data-testid="fd-sld-thumb" />
      </Slider.Track>
    </Slider.Control>
  </Slider.Root>
  <Input.Root name="inp" data-testid="fd-inp" bind:value={input} defaultValue="seed" />
  <SInput name="sin" data-testid="fd-sin" bind:value={styled} defaultValue="seed" />
  <Textarea name="txt" data-testid="fd-txt" bind:value={text} defaultValue="seed" />
</form>
