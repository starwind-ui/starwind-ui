<script lang="ts">
  import {
    Combobox,
    ComboboxContent,
    ComboboxInput,
    ComboboxItem,
    ComboboxTrigger,
  } from "@conformance/styled-svelte/combobox";
  import { NavigationMenu } from "@starwind-ui/svelte/navigation-menu";
  import { Popover } from "@starwind-ui/svelte/popover";
  import { Tooltip } from "@starwind-ui/svelte/tooltip";
  import { parent } from "../shared/harness";

  function trackRef(id: string) {
    let tag: string | null = null;
    parent(id, { write() {}, read: () => tag });
    return (element: HTMLElement | null) => {
      tag = element?.tagName ?? null;
    };
  }

  const popoverRef = trackRef("lp-ref");
  const tooltipRef = trackRef("lt-ref");
  const navigationRef = trackRef("ln-ref");
</script>

<main>
  <Combobox>
    <ComboboxTrigger data-testid="ct-outer" aria-label="Outer" />
    <ComboboxInput data-testid="ct-input">
      <ComboboxTrigger data-testid="ct-authored" aria-label="Authored" />
    </ComboboxInput>
    <ComboboxContent data-testid="ct-popup">
      <ComboboxItem value="a">Apple</ComboboxItem>
    </ComboboxContent>
  </Combobox>

  <Popover.Root>
    <Popover.Trigger ref={popoverRef}>
      {#snippet child({ props })}
        <a {...props} href="#popover" data-testid="lp-trigger">Popover</a>
      {/snippet}
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Positioner>
        <Popover.Popup data-testid="lp-popup">Body</Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  </Popover.Root>

  <Tooltip.Root openDelay={0} closeDelay={0}>
    <Tooltip.Trigger ref={tooltipRef}>
      {#snippet child({ props })}
        <a {...props} href="#tooltip" data-testid="lt-trigger">Tooltip</a>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Positioner>
        <Tooltip.Popup data-testid="lt-popup">Tip</Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  </Tooltip.Root>

  <NavigationMenu.Root>
    <NavigationMenu.List>
      <NavigationMenu.Item value="docs">
        <NavigationMenu.Trigger ref={navigationRef}>
          {#snippet child({ props })}
            <a {...props} href="#docs" data-testid="ln-trigger">Docs</a>
          {/snippet}
        </NavigationMenu.Trigger>
        <NavigationMenu.Content data-testid="ln-content">Body</NavigationMenu.Content>
      </NavigationMenu.Item>
    </NavigationMenu.List>
    <NavigationMenu.Portal>
      <NavigationMenu.Positioner>
        <NavigationMenu.Popup>
          <NavigationMenu.Viewport />
        </NavigationMenu.Popup>
      </NavigationMenu.Positioner>
    </NavigationMenu.Portal>
  </NavigationMenu.Root>
</main>
