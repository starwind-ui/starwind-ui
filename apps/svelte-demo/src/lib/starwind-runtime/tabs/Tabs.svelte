<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { untrack } from "svelte";
  import { cx } from "tailwind-variants";
  import { TabsRoot as PrimitivePart } from "@starwind-ui/svelte/tabs";
  import { tabs, tabsContent, tabsList, tabsTrigger } from "./variants.js";
  import { TabsRoot } from "@starwind-ui/svelte/tabs";

  export type TabsProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "defaultValue": defaultValue,
    "orientation": orientation = "horizontal",
    "syncKey": syncKey,
    "class": className,
    "ref": ref,
    "children": children,
    value = $bindable(),
    "value": commandValue,
    "onValueChange": onValueChange,
    ...rest
  }: TabsProps = $props();

  let observedCommand=untrack(()=>commandValue);
  $effect(()=>{const next=commandValue;untrack(()=>{if(Object.is(next,observedCommand))return;observedCommand=next;if(!Object.is(next,value))value=next;});});
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
  bind:value={value}
>

</TabsRoot>
