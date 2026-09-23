<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { cx } from "tailwind-variants";
  import { AccordionItem as PrimitivePart } from "@starwind-ui/svelte/accordion";
  import { accordion, accordionContent, accordionItem, accordionTrigger } from "./variants.js";
  import { AccordionItem } from "@starwind-ui/svelte/accordion";

  export type AccordionItemProps = Omit<ComponentProps<typeof PrimitivePart>, "value"> & { value: string };
</script>

<script lang="ts">
  let {
    "disabled": disabled = false,
    "class": className,
    "children": children,
    "value": value,
    ...rest
  }: AccordionItemProps = $props();
</script>

<AccordionItem
  class={accordionItem({ "class": cx(className) })}
  value={value}
  disabled={disabled}
  {...rest}
  data-slot={"accordion-item"}
>
  {@render children?.()}
</AccordionItem>
