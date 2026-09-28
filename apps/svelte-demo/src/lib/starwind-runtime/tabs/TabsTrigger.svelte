<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { cx } from "tailwind-variants";
  import { TabsTab as PrimitivePart } from "@starwind-ui/svelte/tabs";
  import { tabs, tabsContent, tabsList, tabsTrigger } from "./variants.js";
  import { TabsTab } from "@starwind-ui/svelte/tabs";

  export type TabsTriggerProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "disabled": disabled = false,
    "value": value,
    "class": className,
    "ref": ref,
    "children": children,
    ...rest
  }: TabsTriggerProps = $props();
</script>

<TabsTab
  class={tabsTrigger({ "class": cx(className) })}
  disabled={disabled}
  ref={ref}
  value={value}
  {...rest}
  data-slot={"tabs-trigger"}
  children={children}
>

</TabsTab>
