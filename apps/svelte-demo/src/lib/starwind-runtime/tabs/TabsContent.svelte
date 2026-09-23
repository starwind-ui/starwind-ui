<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { cx } from "tailwind-variants";
  import { TabsPanel as PrimitivePart } from "@starwind-ui/svelte/tabs";
  import { tabs, tabsContent, tabsList, tabsTrigger } from "./variants.js";
  import { TabsPanel } from "@starwind-ui/svelte/tabs";

  export type TabsContentProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "keepMounted": keepMounted,
    "value": value,
    "class": className,
    "ref": ref,
    "children": children,
    ...rest
  }: TabsContentProps = $props();
</script>

<TabsPanel
  class={tabsContent({ "class": cx(className) })}
  keepMounted={keepMounted}
  ref={ref}
  value={value}
  {...rest}
  data-slot={"tabs-content"}
  children={children}
>

</TabsPanel>
