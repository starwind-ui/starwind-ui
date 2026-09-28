<script>
  import Select from "./vendored/primitives/select/index.js";
  let value = $state();
  export function snapshot() {
    return value;
  }
</script>

<Select.Root bind:value defaultValue="alpha">
  <Select.Trigger data-test="vendored-trigger"><Select.Value /></Select.Trigger>
  <Select.Portal>
    <Select.Positioner>
      <Select.Popup>
        <Select.List>
          <Select.Item value="alpha"><Select.ItemText>Alpha</Select.ItemText></Select.Item>
          <Select.Item value="beta" data-test="vendored-beta">
            <Select.ItemText>Beta</Select.ItemText>
          </Select.Item>
        </Select.List>
      </Select.Popup>
    </Select.Positioner>
  </Select.Portal>
</Select.Root>
