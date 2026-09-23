<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { cx } from "tailwind-variants";
  import { AccordionPanel as PrimitivePart } from "@starwind-ui/svelte/accordion";
  import { accordion, accordionContent, accordionItem, accordionTrigger } from "./variants.js";
  import { AccordionPanel } from "@starwind-ui/svelte/accordion";

  export type AccordionContentProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: AccordionContentProps = $props();
</script>

<AccordionPanel
  class={accordionContent({ "class": cx(className) })}
  {...rest}
  data-slot={"accordion-content"}
>
  <div
    class={"pt-0 pb-4"}
  >
    {@render children?.()}
  </div>
</AccordionPanel>
