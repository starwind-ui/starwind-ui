<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { DialogPopup } from "@starwind-ui/svelte/dialog";
  import { cx } from "tailwind-variants";
  import { dialogBackdrop, dialogContent, dialogCloseButton, dialogDescription, dialogFooter, dialogHeader, dialogTitle } from "./variants.js";
  import { DialogBackdrop } from "@starwind-ui/svelte/dialog";
  import { Button } from "../button/index.js";
  import "./styles.css";

  export type DialogContentProps = ComponentProps<typeof DialogPopup> & { backdrop?: Snippet; icon?: Snippet; };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    "backdrop": backdrop,
    "icon": icon,
    ...rest
  }: DialogContentProps = $props();
</script>

{#if backdrop}{@render backdrop()}{:else}<DialogBackdrop
  class={dialogBackdrop({  })}
  data-state={"closed"}
  hidden
  data-slot={"dialog-backdrop"}
/>{/if}
<DialogPopup
  class={dialogContent({ "class": cx(className) })}
  data-state={"closed"}
  {...rest}
  data-slot={"dialog-content"}
>
  {@render children?.()}
  <Button
    variant={"ghost"}
    size={"icon-sm"}
    class={dialogCloseButton({  })}
    aria-label={"Close dialog"}
    data-slot={"dialog-close"}
    data-sw-dialog-close
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
      Close
    </span>
  </Button>
</DialogPopup>
