<script lang="ts">
  import { ComboboxContent, ComboboxItem } from "@conformance/styled-svelte/combobox";
  import { SelectContent, SelectItem } from "@conformance/styled-svelte/select";
  import { Combobox } from "@starwind-ui/svelte/combobox";
  import { Select } from "@starwind-ui/svelte/select";

  let { id, kind }: { id: string; kind: "ps" | "pc" | "ss" | "sc" } = $props();
</script>

{#if kind === "ps"}
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
{:else if kind === "pc"}
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
{:else if kind === "ss"}
  <SelectContent>
    <SelectItem value="a">Apple</SelectItem>
    <SelectItem value="b" data-testid={`${id}-item-b`}>Banana</SelectItem>
  </SelectContent>
{:else}
  <ComboboxContent>
    <ComboboxItem value="a">Apple</ComboboxItem>
    <ComboboxItem value="b" data-testid={`${id}-item-b`}>Banana</ComboboxItem>
  </ComboboxContent>
{/if}
