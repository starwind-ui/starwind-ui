<script lang="ts">
  import Select from "$lib/starwind-runtime/select";
  import { Button } from "$lib/starwind-runtime/button";
</script>

<Select.Root defaultValue="alpha">
  <Select.Trigger aria-label="Action choice">
    {#snippet child({ props, children })}
      <Button {...props} variant="outline">{@render children?.()}</Button>
    {/snippet}
    <Select.Value placeholder="Choose" />
  </Select.Trigger>
  <Select.Content>
    <Select.Item value="alpha">Alpha</Select.Item>
    <Select.Item value="beta">Beta</Select.Item>
  </Select.Content>
</Select.Root>
