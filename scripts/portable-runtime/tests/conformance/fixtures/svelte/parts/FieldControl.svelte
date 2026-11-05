<script lang="ts">
  import {
    Combobox as StyledCombobox,
    ComboboxContent,
    ComboboxInput,
    ComboboxInputGroup,
    ComboboxItem,
    ComboboxTrigger,
  } from "@conformance/styled-svelte/combobox";
  import {
    Select as StyledSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@conformance/styled-svelte/select";
  import { Combobox } from "@starwind-ui/svelte/combobox";
  import { Select } from "@starwind-ui/svelte/select";
  import FieldItems from "./FieldItems.svelte";

  let {
    id,
    kind,
    tick,
    child = false,
    name,
    defaultValue,
  }: {
    id: string;
    kind: "ps" | "pc" | "ss" | "sc";
    tick: number;
    child?: boolean;
    name?: string;
    defaultValue?: string;
  } = $props();
</script>

{#if kind === "ps"}
  <Select.Root data-tick={tick} {name} {defaultValue}>
    <Select.Trigger data-testid={`${id}-trigger`}><Select.Value /></Select.Trigger>
    {#if child}
      <FieldItems {id} {kind} />
    {:else}
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
    {/if}
  </Select.Root>
{:else if kind === "pc"}
  <Combobox.Root data-tick={tick} {name} {defaultValue}>
    <Combobox.InputGroup>
      <Combobox.Input />
      <Combobox.Trigger data-testid={`${id}-trigger`}>Open</Combobox.Trigger>
    </Combobox.InputGroup>
    {#if child}
      <FieldItems {id} {kind} />
    {:else}
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
    {/if}
  </Combobox.Root>
{:else if kind === "ss"}
  <StyledSelect data-tick={tick} {name} {defaultValue}>
    <SelectTrigger data-testid={`${id}-trigger`}><SelectValue /></SelectTrigger>
    {#if child}
      <FieldItems {id} {kind} />
    {:else}
      <SelectContent>
        <SelectItem value="a">Apple</SelectItem>
        <SelectItem value="b" data-testid={`${id}-item-b`}>Banana</SelectItem>
      </SelectContent>
    {/if}
  </StyledSelect>
{:else}
  <StyledCombobox data-tick={tick} {name} {defaultValue}>
    <ComboboxInputGroup>
      <ComboboxInput showTrigger={false} />
      <ComboboxTrigger data-testid={`${id}-trigger`} />
    </ComboboxInputGroup>
    {#if child}
      <FieldItems {id} {kind} />
    {:else}
      <ComboboxContent>
        <ComboboxItem value="a">Apple</ComboboxItem>
        <ComboboxItem value="b" data-testid={`${id}-item-b`}>Banana</ComboboxItem>
      </ComboboxContent>
    {/if}
  </StyledCombobox>
{/if}
