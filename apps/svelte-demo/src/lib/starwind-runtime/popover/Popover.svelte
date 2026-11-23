<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { PopoverRoot } from "@starwind-ui/svelte/popover";
  import { cx } from "tailwind-variants";
  import { popover, popoverContent, popoverDescription, popoverHeader, popoverTitle, popoverTrigger } from "./variants.js";

  export type PopoverProps = ComponentProps<typeof PopoverRoot>;
</script>

<script lang="ts">
  let {
    defaultOpen = false,
    closeOnEscape = true,
    closeOnOutsideInteract = true,
    modal = false,
    openOnHover = false,
    closeDelay = 200,
    "class": className,
    open = $bindable(),
    onOpenChange,
    onCloseComplete,
    children,
    "open": commandOpen,
    ...rest
  }: PopoverProps = $props();
</script>

<PopoverRoot
  class={popover({ "class": cx(className) })}
  defaultOpen={defaultOpen}
  closeOnEscape={closeOnEscape}
  closeOnOutsideInteract={closeOnOutsideInteract}
  modal={modal}
  openOnHover={openOnHover}
  closeDelay={closeDelay}
  onOpenChange={onOpenChange}
  onCloseComplete={onCloseComplete}
  {...rest}
  data-slot={"popover"}
  children={children}
  bind:open={() => commandOpen, (next) => { open = next; }}
>

</PopoverRoot>
