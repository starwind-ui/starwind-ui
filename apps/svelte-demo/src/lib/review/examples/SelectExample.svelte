<script lang="ts">
  import Select from "$lib/starwind-runtime/select";
  let value = $state<string | null | undefined>(undefined);
  let open = $state<boolean | undefined>(undefined);
</script>

<span id="choice-label">Choose a workspace</span>
<Select.Root name="choice" defaultValue="alpha" bind:value bind:open>
  <Select.Trigger aria-labelledby="choice-label" placeholder="Choose" />
  <Select.Content>
    <Select.Item value="alpha">Alpha</Select.Item>
    <Select.Item value="beta">Beta</Select.Item>
  </Select.Content>
</Select.Root>
<p aria-live="polite">Workspace: {value ?? "unset"}</p>
