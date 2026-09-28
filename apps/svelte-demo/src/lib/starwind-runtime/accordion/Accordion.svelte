<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { cx } from "tailwind-variants";
  import { AccordionRoot as PrimitivePart } from "@starwind-ui/svelte/accordion";
  import { accordion, accordionContent, accordionItem, accordionTrigger } from "./variants.js";
  import { AccordionRoot } from "@starwind-ui/svelte/accordion";

  export type AccordionProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "type": type = "single",
    "defaultValue": defaultValue,
    "collapsible": collapsible = true,
    "class": className,
    "children": children,
    value = $bindable(),
    "onValueChange": onValueChange,
    ...rest
  }: AccordionProps = $props();
</script>

<AccordionRoot
  class={accordion({ "class": cx(className) })}
  type={type}
  defaultValue={defaultValue}
  collapsible={collapsible}
  onValueChange={onValueChange}
  {...rest}
  data-slot={"accordion"}
  children={children}
  bind:value={value}
>

</AccordionRoot>
