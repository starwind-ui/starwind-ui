<script lang="ts">
  import { Checkbox as StyledCheckbox } from "@conformance/styled-svelte/checkbox";
  import {
    ComboboxContent,
    ComboboxInput,
    ComboboxInputGroup,
    ComboboxItem,
    ComboboxTrigger,
    Combobox as StyledCombobox,
  } from "@conformance/styled-svelte/combobox";
  import { Input as StyledInput } from "@conformance/styled-svelte/input";
  import {
    RadioGroupItem,
    RadioGroup as StyledRadioGroup,
  } from "@conformance/styled-svelte/radio-group";
  import {
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Select as StyledSelect,
  } from "@conformance/styled-svelte/select";
  import { Slider as StyledSlider } from "@conformance/styled-svelte/slider";
  import { Switch as StyledSwitch } from "@conformance/styled-svelte/switch";
  import { Checkbox } from "@starwind-ui/svelte/checkbox";
  import { Combobox } from "@starwind-ui/svelte/combobox";
  import { Input } from "@starwind-ui/svelte/input";
  import { Radio } from "@starwind-ui/svelte/radio";
  import { RadioGroup } from "@starwind-ui/svelte/radio-group";
  import { Select } from "@starwind-ui/svelte/select";
  import { Slider } from "@starwind-ui/svelte/slider";
  import { Switch } from "@starwind-ui/svelte/switch";
  import { untrack } from "svelte";
  import { parent, record, refused } from "../../shared/harness";

  let {
    id,
    kind,
    styled,
    held,
  }: { id: string; kind: string; styled: boolean; held: boolean } = $props();

  const fact = untrack(() => {
    const checks = kind === "chk" || kind === "swi";
    return {
      checks,
      initial: (checks ? false : kind === "sld" ? 20 : kind === "inp" ? "hello" : "a") as any,
    };
  });
  let value = $state<any>(fact.initial);
  untrack(() => {
    if (held) parent(id, { write: (next) => (value = next), read: () => value });
  });

  const log = (next: unknown, details: unknown) => record(id, "change", next, details);
  const accept = (next: unknown, details: unknown) => {
    log(next, details);
    if (!refused(id)) value = next;
  };
  const bound = $derived.by((): Record<string, any> => {
    const fixed = fact.checks ? { value: "yes" } : {};
    const eventName = fact.checks ? "onCheckedChange" : "onValueChange";
    return held
      ? { ...fixed, [fact.checks ? "checked" : "value"]: value, [eventName]: accept }
      : { ...fixed, [fact.checks ? "defaultChecked" : "defaultValue"]: fact.initial, [eventName]: log };
  });
</script>

{#if !styled}
  {#if kind === "sel"}
    <Select.Root data-testid={`${id}-root`} {...bound}>
      <Select.Trigger data-testid={`${id}-trigger`}>
        <Select.Value data-testid={`${id}-value`} />
      </Select.Trigger>
      <Select.Positioner>
        <Select.Popup>
          <Select.List>
            <Select.Item value="a"><Select.ItemText>Apple</Select.ItemText></Select.Item>
            <Select.Item value="b" data-testid={`${id}-item-b`}>
              <Select.ItemText>Banana</Select.ItemText>
            </Select.Item>
          </Select.List>
        </Select.Popup>
      </Select.Positioner>
    </Select.Root>
  {:else if kind === "cmb"}
    <Combobox.Root data-testid={`${id}-root`} {...bound}>
      <Combobox.InputGroup>
        <Combobox.Input data-testid={`${id}-input`} />
        <Combobox.Trigger data-testid={`${id}-trigger`}>Open</Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Positioner>
        <Combobox.Popup>
          <Combobox.List>
            <Combobox.Item value="a"><Combobox.ItemText>Apple</Combobox.ItemText></Combobox.Item>
            <Combobox.Item value="b" data-testid={`${id}-item-b`}>
              <Combobox.ItemText>Banana</Combobox.ItemText>
            </Combobox.Item>
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Root>
  {:else if kind === "chk"}
    <Checkbox.Root data-testid={`${id}-root`} {...bound}><Checkbox.Indicator /></Checkbox.Root>
  {:else if kind === "swi"}
    <Switch.Root data-testid={`${id}-root`} {...bound}><Switch.Thumb /></Switch.Root>
  {:else if kind === "sld"}
    <Slider.Root data-testid={`${id}-root`} {...bound}>
      <Slider.Control>
        <Slider.Track>
          <Slider.Indicator />
          <Slider.Thumb />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  {:else if kind === "rad"}
    <RadioGroup.Root data-testid={`${id}-root`} {...bound}>
      <Radio.Root value="a"><Radio.Indicator /></Radio.Root>
      <Radio.Root value="b" data-testid={`${id}-item-b`}><Radio.Indicator /></Radio.Root>
    </RadioGroup.Root>
  {:else}
    <Input.Root data-testid={`${id}-root`} {...bound} />
  {/if}
{:else if kind === "sel"}
  <StyledSelect data-testid={`${id}-root`} {...bound}>
    <SelectTrigger data-testid={`${id}-trigger`}>
      <SelectValue data-testid={`${id}-value`} />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="a">Apple</SelectItem>
      <SelectItem value="b" data-testid={`${id}-item-b`}>Banana</SelectItem>
    </SelectContent>
  </StyledSelect>
{:else if kind === "cmb"}
  <StyledCombobox data-testid={`${id}-root`} {...bound}>
    <ComboboxInputGroup>
      <ComboboxInput data-testid={`${id}-input`} showTrigger={false} />
      <ComboboxTrigger data-testid={`${id}-trigger`} />
    </ComboboxInputGroup>
    <ComboboxContent>
      <ComboboxItem value="a">Apple</ComboboxItem>
      <ComboboxItem value="b" data-testid={`${id}-item-b`}>Banana</ComboboxItem>
    </ComboboxContent>
  </StyledCombobox>
{:else if kind === "chk"}
  <StyledCheckbox data-testid={`${id}-root`} {...bound} />
{:else if kind === "swi"}
  <StyledSwitch data-testid={`${id}-root`} {...bound} />
{:else if kind === "sld"}
  <StyledSlider data-testid={`${id}-root`} {...bound} />
{:else if kind === "rad"}
  <StyledRadioGroup data-testid={`${id}-root`} {...bound}>
    <RadioGroupItem value="a" />
    <RadioGroupItem value="b" data-testid={`${id}-item-b`} />
  </StyledRadioGroup>
{:else}
  <StyledInput data-testid={`${id}-root`} {...bound} />
{/if}
