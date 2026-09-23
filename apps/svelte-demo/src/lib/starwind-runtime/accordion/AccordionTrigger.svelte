<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { cx } from "tailwind-variants";
  import { AccordionTrigger as PrimitivePart } from "@starwind-ui/svelte/accordion";
  import { accordion, accordionContent, accordionItem, accordionTrigger } from "./variants.js";
  import { AccordionTrigger } from "@starwind-ui/svelte/accordion";

  export type AccordionTriggerProps = ComponentProps<typeof PrimitivePart> & { icon?: Snippet };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    "icon": icon,
    ...rest
  }: AccordionTriggerProps = $props();
</script>

<AccordionTrigger
  class={accordionTrigger({ "class": cx(className) })}
  {...rest}
  data-slot={"accordion-trigger"}
>
  {@render children?.()}
  {#if icon}{@render icon()}{:else}<svg
    xmlns={"http://www.w3.org/2000/svg"}
    viewBox={"0 0 24 24"}
    fill={"none"}
    stroke={"currentColor"}
    stroke-width={"2"}
    stroke-linecap={"round"}
    stroke-linejoin={"round"}
    aria-hidden={"true"}
    class={"size-5 shrink-0 transition-transform duration-200"}
  >
    <path
      stroke={"none"}
      d={"M0 0h24v24H0z"}
      fill={"none"}
    />
    <path
      d={"M6 9l6 6l6 -6"}
    />
  </svg>{/if}
</AccordionTrigger>
