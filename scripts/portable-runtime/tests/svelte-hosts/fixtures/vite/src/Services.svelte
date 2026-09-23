<script lang="ts">
  import Picker, {
    parseColor,
    type ColorPickerValue,
    type ColorPickerFormat,
  } from "@starwind-ui/svelte/color-picker";
  import Sidebar, { type SidebarMenuButtonChildPayload } from "@starwind-ui/svelte/sidebar";

  let value = $state<ColorPickerValue | undefined>();
  let format = $state<ColorPickerFormat | undefined>();
  let open = $state<boolean | undefined>();
  let changes = 0;
  export function snapshot() {
    return {
      color: value && typeof value === "object" ? value.toString("hex") : value,
      immutableColor: Boolean(
        value && typeof value === "object" && value.equals(parseColor("#336699")),
      ),
      format,
      open,
      changes,
    };
  }
</script>

<form data-test="services-form">
  <Picker.Root
    name="accent"
    defaultValue="#123456"
    bind:value
    bind:format
    onValueChange={() => changes++}
  >
    <Picker.Label>Accent</Picker.Label>
    <Picker.Control><Picker.ValueInput /></Picker.Control>
    <Picker.SwatchGroup
      ><Picker.Swatch swatchValue="#336699" data-test="services-swatch">Blue</Picker.Swatch
      ></Picker.SwatchGroup
    >
    <Picker.HiddenInput />
  </Picker.Root>
</form>
<Sidebar.Provider bind:open onOpenChange={() => changes++}>
  <Sidebar.Sidebar collapsible="icon">
    <Sidebar.MenuButton href="#services-destination" data-test="services-link">
      {#snippet child(payload: SidebarMenuButtonChildPayload)}
        {#if payload.kind === "anchor"}<a {...payload.props}>{@render payload.children?.()}</a>
        {:else}<button {...payload.props}>{@render payload.children?.()}</button>{/if}
      {/snippet}
      Workspace
    </Sidebar.MenuButton>
  </Sidebar.Sidebar>
  <Sidebar.Trigger data-test="services-toggle">Toggle workspace</Sidebar.Trigger>
  <p id="services-destination">Workspace destination</p>
</Sidebar.Provider>
