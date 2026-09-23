<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { ComboboxTrigger } from "@starwind-ui/svelte/combobox";
  import { combobox, comboboxClear, comboboxContent, comboboxEmpty, comboboxGroup, comboboxGroupLabel, comboboxInput, comboboxInputGroup, comboboxItem, comboboxItemIndicator, comboboxItemText, comboboxLabel, comboboxList, comboboxSeparator, comboboxTrigger, comboboxValue } from "./variants.js";

  export type ComboboxTriggerProps = Omit<ComponentProps<typeof ComboboxTrigger>, "children"> & { children?: Snippet;  icon?: Snippet; iconClass?: string; showIcon?: boolean; };
</script>

<script lang="ts">
  let {
    "class": className,
    "iconClass": iconClassName,
    "showIcon": showIcon = true,
    "child": child,
    "children": children,
    "icon": icon,
    ...rest
  }: ComboboxTriggerProps = $props();
</script>

<ComboboxTrigger
  class={comboboxTrigger({ "class": cx(className) })}
  child={child}
  {...rest}
  data-slot={"combobox-trigger"}
>
  {@render children?.()}
  {#if !child && showIcon}
    {#if icon}{@render icon()}{:else}<svg
      xmlns={"http://www.w3.org/2000/svg"}
      viewBox={"0 0 24 24"}
      fill={"none"}
      stroke={"currentColor"}
      stroke-width={"2"}
      stroke-linecap={"round"}
      stroke-linejoin={"round"}
      aria-hidden={"true"}
      class={["text-muted-foreground pointer-events-none size-4", iconClassName].filter(Boolean).join(" ")}
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
  {/if}
</ComboboxTrigger>
