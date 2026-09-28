<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { cx } from "tailwind-variants";
  import { TabsList as PrimitivePart } from "@starwind-ui/svelte/tabs";
  import { tabs, tabsContent, tabsList, tabsTrigger } from "./variants.js";
  import { TabsList } from "@starwind-ui/svelte/tabs";

  export type TabsListProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "activateOnFocus": activateOnFocus,
    "loopFocus": loopFocus,
    "class": className,
    "ref": ref,
    "children": children,
    ...rest
  }: TabsListProps = $props();
</script>

<TabsList
  class={tabsList({ "class": cx(className) })}
  activateOnFocus={activateOnFocus}
  loopFocus={loopFocus}
  ref={ref}
  {...rest}
  data-slot={"tabs-list"}
  children={children}
>

</TabsList>
