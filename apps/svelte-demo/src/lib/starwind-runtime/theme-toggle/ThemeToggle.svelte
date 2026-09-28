<script module lang="ts">
  import type { Snippet } from "svelte";
  import { untrack } from "svelte";
  import type { HTMLButtonAttributes, ClassValue } from "svelte/elements";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { initThemeController } from "@starwind-ui/svelte/theme";
  import { themeToggle } from "./variants.js";

  export type ThemeToggleProps = Omit<HTMLButtonAttributes, "aria-pressed" | "defaultPressed" | "disabled" | "onChange" | "type" | "value" | "class" | "children" | "ariaLabel" | "data-slot" | "pressed" | "syncGroup"> & VariantProps<typeof themeToggle> & {
    "ariaLabel"?: string;
    "defaultPressed"?: boolean;
    "disabled"?: boolean;
    "data-slot"?: string;
    "pressed"?: boolean;
    "syncGroup"?: string;
    "value"?: string;
    class?: ClassValue;
    children?: Snippet;
    lightIcon?: Snippet;
    darkIcon?: Snippet;
    ref?: (element: HTMLButtonElement | null) => void;
  };
</script>

<script lang="ts">
  let {
    "ariaLabel": ariaLabel = "Toggle theme",
    "variant": variant = "outline",
    "size": size = "md",
    "defaultPressed": defaultPressed,
    "disabled": disabled = false,
    "pressed": pressed,
    "syncGroup": syncGroup = "starwind-theme",
    "value": value,
    "data-slot": dataSlot = "theme-toggle",
    "class": className,
    "children": children,
    "lightIcon": lightIcon,
    "darkIcon": darkIcon,
    "ref": ref,
    ...rest
  }: ThemeToggleProps = $props();

  let initialPressed = $derived(pressed ?? defaultPressed ?? false);

  let nativeProps = $derived({ ...rest } as HTMLButtonAttributes);
  function attachTheme(element: HTMLButtonElement): void {
    initThemeController(element.ownerDocument);
    $effect(() => {
      const callback = ref;
      untrack(() => callback?.(element));
      return () => untrack(() => callback?.(null));
    });
  }
</script>

<button
  class={themeToggle({ "variant": variant, "size": size, "class": cx(className) })}
  type={"button"}
  disabled={disabled}
  aria-label={ariaLabel}
  aria-pressed={initialPressed ? "true" : "false"}
  data-state={initialPressed ? "on" : "off"}
  data-sw-toggle
  data-sw-theme-toggle
  data-sw-theme-control
  data-theme-on={"dark"}
  data-theme-off={"light"}
  data-sync-group={syncGroup}
  data-value={value}
  data-pressed={initialPressed ? "" : undefined}
  data-unpressed={initialPressed ? undefined : ""}
  data-disabled={disabled ? "" : undefined}
  {...nativeProps}
  data-slot={dataSlot}
  {@attach attachTheme}
>
  {#if children}{@render children()}{:else}<span
    class={"size-5"}
    data-theme-icon-wrapper
  >
    {#if lightIcon}{@render lightIcon()}{:else}<svg
      xmlns={"http://www.w3.org/2000/svg"}
      viewBox={"0 0 24 24"}
      fill={"none"}
      stroke={"currentColor"}
      stroke-width={"2"}
      stroke-linecap={"round"}
      stroke-linejoin={"round"}
      class={"hidden size-5 group-data-[state=off]:data-ready:block"}
      aria-hidden={"true"}
      data-theme-icon
    >
      <path
        d={"M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"}
      />
      <path
        d={"M4 12h.01M12 4v.01M20 12h.01M12 20v.01M6.31 6.31l-.01 -.01M17.7 6.3l-.01 .01M17.7 17.7l-.01 -.01M6.3 17.7l.01 -.01"}
      />
    </svg>{/if}
    {#if darkIcon}{@render darkIcon()}{:else}<svg
      xmlns={"http://www.w3.org/2000/svg"}
      viewBox={"0 0 24 24"}
      fill={"none"}
      stroke={"currentColor"}
      stroke-width={"2"}
      stroke-linecap={"round"}
      stroke-linejoin={"round"}
      class={"hidden size-5 group-data-[state=on]:data-ready:block"}
      aria-hidden={"true"}
      data-theme-icon
    >
      <path
        d={"M12 3c.132 0 .263 0 .393 .008a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"}
      />
    </svg>{/if}
  </span>{/if}
</button>
