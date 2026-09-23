<script lang="ts">
  import { ColorPicker } from "$lib/starwind-runtime/color-picker";
  import type { ColorPickerValue } from "@starwind-ui/svelte/color-picker";
  import Select from "$lib/starwind-runtime/select";
  import Dialog from "$lib/starwind-runtime/dialog";
  import Sheet from "$lib/starwind-runtime/sheet";
  import Popover from "$lib/starwind-runtime/popover";
  import Dropdown from "$lib/starwind-runtime/dropdown";
  import { Button } from "$lib/starwind-runtime/button";
  let selected = $state<string | null | undefined>("violet");
  let paletteColor = $state.raw<ColorPickerValue | undefined>("#0d9488");
  let action = $state("No action selected");
</script>

{#snippet choice(id: string)}
  <Select.Root bind:value={selected}>
    <Select.Trigger aria-label={`${id} accent`} class="w-48" />
    <Select.Content data-portal-layer={`${id}-select`} alignItemWithTrigger={id !== "sheet"}>
      <Select.Item value="violet">Violet</Select.Item>
      <Select.Item value="blue">Blue</Select.Item>
      <Select.Item value="teal">Teal</Select.Item>
    </Select.Content>
  </Select.Root>
{/snippet}

<div class="grid gap-6 lg:grid-cols-2" data-portal-compositions>
  <section class="review-card min-h-64" data-portal-scene="color-picker">
    <h2>Color Picker → Select</h2>
    <p>Open the editor and change its format.</p>
    <ColorPicker
      label="Brand accent"
      defaultValue="#7c3aed"
      showEyeDropper={false}
      swatches={["#7c3aed", "#2563eb", "#0d9488"]}
    />
  </section>
  <section class="review-card min-h-64" data-portal-scene="dialog-select">
    <h2>Dialog → Select</h2>
    <p>Choose an accent while the dialog stays open.</p>
    <Dialog.Root>
      <Dialog.Trigger>
        {#snippet child({ props, children })}<Button {...props} variant="outline"
            >{@render children?.()}</Button
          >{/snippet}
        Open accent dialog
      </Dialog.Trigger>
      <Dialog.Content data-portal-layer="dialog-select-dialog">
        <Dialog.Header
          ><Dialog.Title>Project accent</Dialog.Title><Dialog.Description
            >Choose the color used for project labels.</Dialog.Description
          ></Dialog.Header
        >
        {@render choice("dialog")}
        <Dialog.Close>Done</Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  </section>
  <section class="review-card min-h-64" data-portal-scene="dialog-picker">
    <h2>Dialog → Color Picker → Select</h2>
    <p>Open the editor inside the dialog, then switch color formats.</p>
    <Dialog.Root>
      <Dialog.Trigger>
        {#snippet child({ props, children })}<Button {...props} variant="outline"
            >{@render children?.()}</Button
          >{/snippet}
        Open palette dialog
      </Dialog.Trigger>
      <Dialog.Content data-portal-layer="dialog-picker-dialog">
        <Dialog.Header
          ><Dialog.Title>Project palette</Dialog.Title><Dialog.Description
            >Edit the accent and its format.</Dialog.Description
          ></Dialog.Header
        >
        <form id="portal-palette-form">
          <ColorPicker
            bind:value={paletteColor}
            name="accent"
            label="Dialog accent"
            showEyeDropper={false}
            swatches={["#7c3aed", "#2563eb", "#0d9488"]}
          />
          <output data-portal-palette class="mt-3 block text-sm text-muted-foreground"
            >{typeof paletteColor === "string"
              ? paletteColor
              : paletteColor?.toString("hex")}</output
          >
        </form>
        <Dialog.Close>Done</Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  </section>
  <section class="review-card min-h-64" data-portal-scene="sheet">
    <h2>Sheet → Popover → Select</h2>
    <p>Open display settings and choose an accent.</p>
    <Sheet.Root>
      <Sheet.Trigger>
        {#snippet child({ props, children })}<Button {...props} variant="outline"
            >{@render children?.()}</Button
          >{/snippet}
        Open display sheet
      </Sheet.Trigger>
      <Sheet.Content data-portal-layer="sheet">
        <Sheet.Header
          ><Sheet.Title>Display settings</Sheet.Title><Sheet.Description
            >Choose the appearance of your workspace.</Sheet.Description
          ></Sheet.Header
        >
        <div class="p-4">
          <Popover.Root>
            <Popover.Trigger>
              {#snippet child({ props, children })}<Button {...props} variant="outline"
                  >{@render children?.()}</Button
                >{/snippet}
              Edit sheet accent
            </Popover.Trigger>
            <Popover.Content data-portal-layer="sheet-popover" align="start">
              <Popover.Title>Workspace accent</Popover.Title>
              {@render choice("sheet")}
              <p class="text-sm text-muted-foreground">The menu stays above this panel.</p>
            </Popover.Content>
          </Popover.Root>
        </div>
        <Sheet.Footer><Sheet.Close>Done</Sheet.Close></Sheet.Footer>
      </Sheet.Content>
    </Sheet.Root>
  </section>
  <section class="review-card min-h-64" data-portal-scene="nested-popover">
    <h2>Popover → Popover</h2>
    <p>Open a detail panel from the workspace panel.</p>
    <Popover.Root>
      <Popover.Trigger>
        {#snippet child({ props, children })}<Button {...props} variant="outline"
            >{@render children?.()}</Button
          >{/snippet}
        Open workspace panel
      </Popover.Trigger>
      <Popover.Content data-portal-layer="outer-popover" align="start">
        <Popover.Title>Workspace</Popover.Title>
        <Popover.Root>
          <Popover.Trigger>
            {#snippet child({ props, children })}<Button {...props} variant="outline"
                >{@render children?.()}</Button
              >{/snippet}
            Open details
          </Popover.Trigger>
          <Popover.Content data-portal-layer="inner-popover" align="start" sideOffset={-12}>
            <Popover.Title>Workspace details</Popover.Title>
            <label class="grid gap-2"
              >Display name<input
                class="rounded-md border px-3 py-2"
                value="Design studio"
              /></label
            >
          </Popover.Content>
        </Popover.Root>
        <p class="text-sm text-muted-foreground">Press Escape to close one panel at a time.</p>
      </Popover.Content>
    </Popover.Root>
  </section>
  <section class="review-card min-h-64" data-portal-scene="menu">
    <h2>Popover → Menu → Submenu</h2>
    <p>Use workspace actions from an open panel.</p>
    <Popover.Root>
      <Popover.Trigger>
        {#snippet child({ props, children })}<Button {...props} variant="outline"
            >{@render children?.()}</Button
          >{/snippet}
        Open actions panel
      </Popover.Trigger>
      <Popover.Content data-portal-layer="menu-popover" align="start">
        <Popover.Title>Workspace actions</Popover.Title>
        <Dropdown.Root>
          <Dropdown.Trigger>
            {#snippet child({ props, children })}<Button {...props} variant="outline"
                >{@render children?.()}</Button
              >{/snippet}
            Open workspace actions
          </Dropdown.Trigger>
          <Dropdown.Content data-portal-layer="menu" class="w-48">
            <Dropdown.Item onclick={() => (action = "Workspace copied")}
              >Copy workspace</Dropdown.Item
            >
            <Dropdown.Sub>
              <Dropdown.SubTrigger>Share workspace</Dropdown.SubTrigger>
              <Dropdown.SubContent data-portal-layer="submenu">
                <Dropdown.Item onclick={() => (action = "Invite link copied")}
                  >Copy invite link</Dropdown.Item
                >
                <Dropdown.Item onclick={() => (action = "Email invitation selected")}
                  >Email invitation</Dropdown.Item
                >
              </Dropdown.SubContent>
            </Dropdown.Sub>
          </Dropdown.Content>
        </Dropdown.Root>
        <output data-portal-action class="text-sm text-muted-foreground">{action}</output>
      </Popover.Content>
    </Popover.Root>
  </section>
</div>
<output class="mt-6 block text-sm text-muted-foreground" data-portal-choice
  >Selected accent: {selected}</output
>
