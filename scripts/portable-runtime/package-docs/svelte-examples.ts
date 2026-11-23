export const installedSvelteExamples: Readonly<
  Record<string, { readonly summary: string; readonly code: string }>
> = {
  dialog: {
    summary:
      "Select **Open settings**, then press Escape or select **Close**. The `open` binding tracks whether the dialog is open.",
    code: `<script lang="ts">
  import { Dialog } from "@starwind-ui/svelte/dialog";

  let open = $state(false);
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>Open settings</Dialog.Trigger>
  <Dialog.Popup>
    <Dialog.Title>Settings</Dialog.Title>
    <Dialog.Description>Review your settings.</Dialog.Description>
    <Dialog.Close>Close</Dialog.Close>
  </Dialog.Popup>
</Dialog.Root>`,
  },
  select: {
    summary:
      "Open the Framework list and choose Svelte. The trigger shows Svelte and the `value` binding updates.",
    code: `<script lang="ts">
  import { Select } from "@starwind-ui/svelte/select";

  let value = $state<string | null>("astro");
</script>

<Select.Root name="framework" bind:value>
  <Select.Label>Framework</Select.Label>
  <Select.Trigger><Select.Value placeholder="Choose a framework" /></Select.Trigger>
  <Select.Portal>
    <Select.Positioner>
      <Select.Popup>
        <Select.List>
          <Select.Item value="astro"><Select.ItemText>Astro</Select.ItemText></Select.Item>
          <Select.Item value="svelte"><Select.ItemText>Svelte</Select.ItemText></Select.Item>
        </Select.List>
      </Select.Popup>
    </Select.Positioner>
  </Select.Portal>
</Select.Root>`,
  },
};
