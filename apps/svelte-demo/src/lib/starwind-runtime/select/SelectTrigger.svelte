<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { SelectTrigger } from "@starwind-ui/svelte/select";
  import { select, selectContent, selectGroup, selectItem, selectItemIndicator, selectItemText, selectLabel, selectList, selectScrollButton, selectSeparator, selectTrigger, selectValue } from "./variants.js";
  import { SelectValue } from "@starwind-ui/svelte/select";
  import { SelectIcon } from "@starwind-ui/svelte/select";

  export type SelectTriggerProps = Omit<ComponentProps<typeof SelectTrigger>, "children"> & VariantProps<typeof selectTrigger> & { children?: Snippet; icon?: Snippet; iconClass?: string; placeholder?: string; showIcon?: boolean; valueClass?: string; };
</script>

<script lang="ts">
  let {
    "class": className,
    "iconClass": iconClassName,
    "placeholder": placeholder,
    "showIcon": showIcon = true,
    "size": size = "md",
    "valueClass": valueClassName,
    "child": child,
    "children": children,
    "icon": icon,
    ...rest
  }: SelectTriggerProps = $props();
</script>

<SelectTrigger
  class={selectTrigger({ "size": size, "class": cx(className) })}
  child={child}
  {...rest}
  data-size={size}
  data-slot={"select-trigger"}
>
  {#if children}{@render children()}{:else}<SelectValue
    class={selectValue({ "class": cx(valueClassName) })}
    placeholder={placeholder}
    data-slot={"select-value"}
  >

  </SelectValue>{/if}
  {#if !child && showIcon}
    <SelectIcon
      class={["text-muted-foreground pointer-events-none size-4", iconClassName].filter(Boolean).join(" ")}
      data-slot={"select-icon"}
    >
      {#if icon}{@render icon()}{:else}<svg
        xmlns={"http://www.w3.org/2000/svg"}
        viewBox={"0 0 24 24"}
        fill={"none"}
        stroke={"currentColor"}
        stroke-width={"2"}
        stroke-linecap={"round"}
        stroke-linejoin={"round"}
        aria-hidden={"true"}
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
    </SelectIcon>
  {/if}
</SelectTrigger>
