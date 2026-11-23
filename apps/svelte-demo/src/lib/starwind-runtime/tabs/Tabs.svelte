<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { cx } from "tailwind-variants";
  import { TabsRoot as PrimitivePart } from "@starwind-ui/svelte/tabs";
  import { tabs, tabsContent, tabsList, tabsTrigger } from "./variants.js";
  import { TabsRoot } from "@starwind-ui/svelte/tabs";

  export type TabsProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    defaultValue,
    orientation = "horizontal",
    syncKey,
    "class": className,
    ref,
    children,
    value = $bindable(),
    "value": commandValue,
    onValueChange,
    ...rest
  }: TabsProps = $props();
</script>

<TabsRoot
  class={tabs({ "class": cx(className) })}
  defaultValue={defaultValue}
  onValueChange={onValueChange}
  orientation={orientation}
  ref={ref}
  syncKey={syncKey}
  {...rest}
  data-slot={"tabs"}
  children={children}
  bind:value={() => commandValue, (next) => { value = next; }}
>

</TabsRoot>
