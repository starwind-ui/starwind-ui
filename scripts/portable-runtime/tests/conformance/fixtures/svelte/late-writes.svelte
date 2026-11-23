<script lang="ts">
  import { Accordion } from "@starwind-ui/svelte/accordion";
  import { Checkbox } from "@starwind-ui/svelte/checkbox";
  import { CheckboxGroup } from "@starwind-ui/svelte/checkbox-group";
  import { ColorPicker } from "@starwind-ui/svelte/color-picker";
  import { Combobox } from "@starwind-ui/svelte/combobox";
  import { Input } from "@starwind-ui/svelte/input";
  import { InputOtp } from "@starwind-ui/svelte/input-otp";
  import { Radio } from "@starwind-ui/svelte/radio";
  import { RadioGroup } from "@starwind-ui/svelte/radio-group";
  import { Select } from "@starwind-ui/svelte/select";
  import { Slider } from "@starwind-ui/svelte/slider";
  import { Switch } from "@starwind-ui/svelte/switch";
  import { Tabs } from "@starwind-ui/svelte/tabs";
  import { Toggle } from "@starwind-ui/svelte/toggle";
  import { ToggleGroup } from "@starwind-ui/svelte/toggle-group";
  import { parseColor } from "@starwind-ui/runtime/color-picker";
  import { captureRuntimeEvents, parent, record, refused } from "../shared/harness";

  captureRuntimeEvents();

  /** A color input arrives as a fresh Color object on every write. An invalid string stays as is. */
  function toColor(next: unknown): unknown {
    return typeof next === "string" ? (parseColor(next) ?? next) : next;
  }

  function shown(value: unknown): unknown {
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as { toString(format: string): string }).toString("hex")
      : value;
  }

  // biome-ignore lint/suspicious/noExplicitAny: fixture values differ per component.
  type Late = { value: any; tick: number };
  const ids = ["lsu", "lsa", "lsm", "lou", "lom", "loc", "lcu", "lfu", "lcm", "tab", "acc", "cbg", "chk", "swi", "rdg", "tgg", "tgl", "sel", "cmb", "inp"] as const;
  type Id = (typeof ids)[number];

  // A parent that holds each model, starting `undefined`. Each scenario write also changes
  // `tick`. Svelte updates only what changed, so an equal primitive write is no new input, while
  // an array or color write arrives as a fresh equal object.
  const late = $state(
    Object.fromEntries(ids.map((id) => [id, { value: id === "loc" ? "12" : undefined, tick: 0 }])) as Record<Id, Late>,
  );
  for (const id of ids) {
    const adapt = id === "lcu" || id === "lcm" ? toColor : (next: unknown) => next;
    parent(id, {
      write: (next) => {
        late[id].value = adapt(next);
        late[id].tick += 1;
      },
      read: () => {
        const value = late[id].value;
        return Array.isArray(value) ? $state.snapshot(value) : shown(value);
      },
    });
  }

  const items = ["a", "b", "c"];
  const log = (id: string, event: string) => (value: unknown, details: unknown) =>
    record(id, event, shown(value), details);
</script>

{#snippet otpSlots()}
  <InputOtp.Group>
    {#each Array.from({ length: 6 }, (_, index) => index) as index (index)}
      <InputOtp.Slot {index} />
    {/each}
  </InputOtp.Group>
{/snippet}

<main>
  <Slider.Root
    data-testid="lsu-root"
    data-tick={late.lsu.tick}
    defaultValue={0}
    value={late.lsu.value}
    onValueChange={log("lsu", "value")}
  >
    <Slider.Control class="late-slider">
      <Slider.Track>
        <Slider.Indicator />
        <Slider.Thumb data-testid="lsu-thumb" />
      </Slider.Track>
    </Slider.Control>
  </Slider.Root>

  <Slider.Root
    data-testid="lsa-root"
    data-tick={late.lsa.tick}
    defaultValue={[0, 100]}
    value={late.lsa.value}
    onValueChange={log("lsa", "value")}
  >
    <Slider.Control class="late-slider" data-testid="lsa-control">
      <Slider.Track>
        <Slider.Indicator />
        <Slider.Thumb index={0} data-testid="lsa-thumb" />
        <Slider.Thumb index={1} />
      </Slider.Track>
    </Slider.Control>
  </Slider.Root>

  <Slider.Root
    data-testid="lsm-root"
    data-tick={late.lsm.tick}
    max={100}
    bind:value={late.lsm.value}
    onValueChange={log("lsm", "value")}
  >
    <Slider.Control class="late-slider">
      <Slider.Track>
        <Slider.Indicator />
        <Slider.Thumb data-testid="lsm-thumb" />
      </Slider.Track>
    </Slider.Control>
  </Slider.Root>

  <InputOtp.Root
    data-testid="lou-root"
    data-tick={late.lou.tick}
    value={late.lou.value}
    onValueChange={log("lou", "value")}
  >
    {@render otpSlots()}
  </InputOtp.Root>

  <InputOtp.Root
    data-testid="lom-root"
    data-tick={late.lom.tick}
    bind:value={late.lom.value}
    onValueChange={log("lom", "value")}
  >
    {@render otpSlots()}
  </InputOtp.Root>

  <form id="late-form">
    <InputOtp.Root
      data-testid="loc-root"
      data-tick={late.loc.tick}
      name="code"
      value={late.loc.value}
      onValueChange={(value: string, details: unknown) => {
        record("loc", "value", value, details);
        if (!refused("loc")) late.loc.value = value;
      }}
    >
      {@render otpSlots()}
    </InputOtp.Root>
  </form>

  <ColorPicker.Root
    data-testid="lcu-root"
    data-tick={late.lcu.tick}
    defaultValue="#0000ff"
    value={late.lcu.value}
    onValueChange={log("lcu", "value")}
  >
    <ColorPicker.Swatch swatchValue="#ff0000" data-testid="lcu-swatch">Red</ColorPicker.Swatch>
  </ColorPicker.Root>

  <ColorPicker.Root
    data-testid="lfu-root"
    data-tick={late.lfu.tick}
    defaultValue="#0000ff"
    format={late.lfu.value}
    onFormatChange={log("lfu", "format")}
  >
    <ColorPicker.FormatSelect data-testid="lfu-select">
      <option value="hex">Hex</option>
      <option value="hsl">HSL</option>
      <option value="rgb">RGB</option>
    </ColorPicker.FormatSelect>
  </ColorPicker.Root>

  <ColorPicker.Root
    data-testid="lcm-root"
    data-tick={late.lcm.tick}
    defaultValue="#0000ff"
    bind:value={late.lcm.value}
    onValueChange={log("lcm", "value")}
  >
    <ColorPicker.Swatch swatchValue="#ff0000" data-testid="lcm-swatch">Red</ColorPicker.Swatch>
  </ColorPicker.Root>

  <Tabs.Root
    data-testid="tab-root"
    data-tick={late.tab.tick}
    defaultValue="a"
    value={late.tab.value}
    onValueChange={log("tab", "value")}
  >
    <Tabs.List>
      {#each items as item (item)}
        <Tabs.Tab value={item} data-testid={`tab-${item}`}>{item}</Tabs.Tab>
      {/each}
    </Tabs.List>
    {#each items as item (item)}
      <Tabs.Panel value={item}>{item}</Tabs.Panel>
    {/each}
  </Tabs.Root>

  <Accordion.Root
    data-testid="acc-root"
    data-tick={late.acc.tick}
    type="single"
    collapsible
    value={late.acc.value}
    onValueChange={log("acc", "value")}
  >
    {#each items as item (item)}
      <Accordion.Item value={item} data-testid={`acc-${item}`}>
        <Accordion.Header>
          <Accordion.Trigger data-testid={`acc-${item}-trigger`}>{item}</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>{item}</Accordion.Panel>
      </Accordion.Item>
    {/each}
  </Accordion.Root>

  <CheckboxGroup.Root
    data-testid="cbg-root"
    data-tick={late.cbg.tick}
    value={late.cbg.value}
    onValueChange={log("cbg", "value")}
  >
    {#each items as item (item)}
      <Checkbox.Root value={item} data-testid={`cbg-${item}`} />
    {/each}
  </CheckboxGroup.Root>

  <Checkbox.Root
    data-testid="chk-root"
    data-tick={late.chk.tick}
    checked={late.chk.value}
    onCheckedChange={log("chk", "checked")}
  />

  <Switch.Root
    data-testid="swi-root"
    data-tick={late.swi.tick}
    checked={late.swi.value}
    onCheckedChange={log("swi", "checked")}
  />

  <RadioGroup.Root
    data-testid="rdg-root"
    data-tick={late.rdg.tick}
    value={late.rdg.value}
    onValueChange={log("rdg", "value")}
  >
    {#each items as item (item)}
      <Radio.Root value={item} data-testid={`rdg-${item}`} />
    {/each}
  </RadioGroup.Root>

  <ToggleGroup.Root
    data-testid="tgg-root"
    data-tick={late.tgg.tick}
    value={late.tgg.value}
    onValueChange={log("tgg", "value")}
  >
    {#each items as item (item)}
      <Toggle.Root value={item} data-testid={`tgg-${item}`}>{item}</Toggle.Root>
    {/each}
  </ToggleGroup.Root>

  <Toggle.Root
    data-testid="tgl-root"
    data-tick={late.tgl.tick}
    pressed={late.tgl.value}
    onPressedChange={log("tgl", "pressed")}
  >
    Toggle
  </Toggle.Root>

  <Select.Root
    data-testid="sel-root"
    data-tick={late.sel.tick}
    value={late.sel.value}
    onValueChange={log("sel", "value")}
  >
    <Select.Trigger data-testid="sel-trigger">
      <Select.Value data-testid="sel-value" placeholder="Pick" />
    </Select.Trigger>
    <Select.Positioner>
      <Select.Popup data-testid="sel-popup">
        <Select.List>
          <Select.Item value="a" data-testid="sel-item-a">
            <Select.ItemText>Apple</Select.ItemText>
          </Select.Item>
          <Select.Item value="b" data-testid="sel-item-b">
            <Select.ItemText>Banana</Select.ItemText>
          </Select.Item>
        </Select.List>
      </Select.Popup>
    </Select.Positioner>
  </Select.Root>

  <Combobox.Root
    data-testid="cmb-root"
    data-tick={late.cmb.tick}
    value={late.cmb.value}
    onValueChange={log("cmb", "value")}
  >
    <Combobox.InputGroup>
      <Combobox.Input data-testid="cmb-input" />
      <Combobox.Trigger data-testid="cmb-trigger">Open</Combobox.Trigger>
    </Combobox.InputGroup>
    <Combobox.Positioner>
      <Combobox.Popup data-testid="cmb-popup">
        <Combobox.List>
          <Combobox.Item value="a" data-testid="cmb-item-a">
            <Combobox.ItemText>Apple</Combobox.ItemText>
          </Combobox.Item>
          <Combobox.Item value="b" data-testid="cmb-item-b">
            <Combobox.ItemText>Banana</Combobox.ItemText>
          </Combobox.Item>
        </Combobox.List>
      </Combobox.Popup>
    </Combobox.Positioner>
  </Combobox.Root>

  <Input.Root
    data-testid="inp-root"
    data-tick={late.inp.tick}
    value={late.inp.value}
    onValueChange={log("inp", "value")}
  />
</main>
