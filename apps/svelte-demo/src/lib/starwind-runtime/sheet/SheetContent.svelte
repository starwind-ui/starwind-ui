<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { DrawerPopup } from "@starwind-ui/svelte/drawer";
  import { cx } from "tailwind-variants";
  import { sheetBackdrop, sheetContent, sheetCloseButton, sheetDescription, sheetFooter, sheetHeader, sheetTitle } from "./variants.js";
  import { DrawerBackdrop } from "@starwind-ui/svelte/drawer";
  import { Button } from "../button/index.js";

  export type SheetContentProps = ComponentProps<typeof DrawerPopup> & { backdrop?: Snippet; icon?: Snippet; };
</script>

<script lang="ts">
  let {
    "class": className,
    "side": side = "right",
    "children": children,
    "backdrop": backdrop,
    "icon": icon,
    ...rest
  }: SheetContentProps = $props();
</script>

{#if backdrop}{@render backdrop()}{:else}<DrawerBackdrop
  class={sheetBackdrop({  })}
  data-state={"closed"}
  hidden
  data-slot={"sheet-backdrop"}
/>{/if}
<DrawerPopup
  class={sheetContent({ "side": side, "class": cx(className) })}
  data-state={"closed"}
  side={side}
  {...rest}
  data-slot={"sheet-content"}
>
  {@render children?.()}
  <Button
    variant={"ghost"}
    size={"icon-sm"}
    class={sheetCloseButton({  })}
    data-slot={"sheet-close"}
    data-sw-drawer-close
  >
    {#if icon}{@render icon()}{:else}<svg
      xmlns={"http://www.w3.org/2000/svg"}
      viewBox={"0 0 24 24"}
      fill={"none"}
      stroke={"currentColor"}
      stroke-width={"2"}
      stroke-linecap={"round"}
      stroke-linejoin={"round"}
      aria-hidden={"true"}
      class={"size-5 transition-opacity"}
    >
      <path
        stroke={"none"}
        d={"M0 0h24v24H0z"}
        fill={"none"}
      />
      <path
        d={"M18 6l-12 12"}
      />
      <path
        d={"M6 6l12 12"}
      />
    </svg>{/if}
    <span
      class={"sr-only"}
    >
      Close sheet
    </span>
  </Button>
  <div
    class={"pointer-events-none fixed inset-0"}
    data-floating-root
    data-slot={"floating-root"}
  >

  </div>
</DrawerPopup>
