<script lang="ts">
  import ToggleGroup from "$lib/starwind-runtime/toggle-group";
  let value = $state<string[] | undefined>();
</script>

<ToggleGroup.Root multiple bind:value defaultValue={["bold"]}>
  <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
  <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
</ToggleGroup.Root>
