<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { colorPicker, colorPickerLabel, colorPickerControl, colorPickerTrigger, colorPickerContent, colorPickerInput, colorPickerValueInputLayout, colorPickerArea, colorPickerAreaThumb, colorPickerSliders, colorPickerSliderActionRow, colorPickerValueFormatRow, colorPickerSeparator, colorPickerChannelSlider, colorPickerChannelSliderThumb, colorPickerChannelInputLayout, colorPickerSwatch, colorPickerSwatchGroup, colorPickerValueSwatch, colorPickerFormatSelectTrigger, colorPickerAction, colorPickerHiddenInput, colorPickerChannelInput, colorPickerValueInput, colorPickerNativeFormatSelectWrapper, colorPickerNativeFormatSelect, colorPickerNativeFormatSelectIcon } from "./variants.js";
  import { PopoverPopup } from "@starwind-ui/svelte/popover";
  import { popoverContent } from "../popover/variants.js";
  import { PopoverPortal } from "@starwind-ui/svelte/popover";
  import { default as ColorPickerDefaultEditor } from "./ColorPickerDefaultEditor.svelte";
  import "./styles.css";

  export type ColorPickerContentProps = ComponentProps<typeof PopoverPopup> & VariantProps<typeof colorPickerContent> & {children?:Snippet; showEyeDropper?: boolean; formatControl?: "select" | "native" | "none"; formats?: readonly import("@starwind-ui/svelte/color-picker").ColorPickerFormat[]; swatches?: readonly (import("@starwind-ui/svelte/color-picker").ColorPickerValue | { value: import("@starwind-ui/svelte/color-picker").ColorPickerValue; label: string; disabled?: boolean })[]; exitMotion?: "popover" | "fade"; portalContainer?: string; disablePortal?:boolean;};
</script>

<script lang="ts">
  let {
    "class": className,
    "size": size = "md",
    "showEyeDropper": showEyeDropper = true,
    "formatControl": formatControl = "select",
    "formats": formats = ["hex","rgb","hsl","hsb"],
    "swatches": swatches = [],
    "side": side = "bottom",
    "align": align = "start",
    "exitMotion": exitMotion = "fade",
    "portalContainer": portalContainer,
    "disablePortal": disablePortal = false,
    "children": children,
    ...rest
  }: ColorPickerContentProps = $props();

  function connectNativePopup(popup: HTMLElement, shouldPromote: () => boolean): () => void {
    const view = popup.ownerDocument.defaultView;
    if (!view || typeof popup.showPopover !== "function") return () => {};
    let releasePresentation: (() => void) | undefined;
    const hide = () => { if (popup.matches(":popover-open")) popup.hidePopover(); };
    const sync = () => {
      // Runtime sets hidden after its existing exit motion completes.
      if (popup.hidden) { hide(); return; }
      if (!popup.isConnected || popup.dataset.state !== "open" || !shouldPromote()) return;
      if (!releasePresentation) {
        const previous = popup.getAttribute("popover");
        const styles = ["right", "bottom"] as const;
        const original = styles.map((name) => [name, popup.style.getPropertyValue(name), popup.style.getPropertyPriority(name)] as const);
        popup.setAttribute("popover", "manual");
        // Keep Runtime's left/top coordinates; authored margins stay in the CSS cascade.
        popup.style.right = "auto";
        popup.style.bottom = "auto";
        releasePresentation = () => {
          hide();
          if (previous === null) popup.removeAttribute("popover"); else popup.setAttribute("popover", previous);
          for (const [name, value, priority] of original) {
            if (value) popup.style.setProperty(name, value, priority); else popup.style.removeProperty(name);
          }
        };
      }
      if (!popup.matches(":popover-open")) popup.showPopover();
    };
    sync();
    const observer = new view.MutationObserver(sync);
    observer.observe(popup, { attributes: true, attributeFilter: ["data-state", "hidden"] });
    return () => { observer.disconnect(); releasePresentation?.(); };
  }

  let localPortalContainer = $state.raw<HTMLElement>();
  let portalOwner = $state.raw<HTMLElement>();
  let portalNode = $state.raw<HTMLDivElement>();
  let portalReady = $state(false);
  let dialogLocal = $state(false);
  const capturePortal = (node: HTMLDivElement | null) => {
    if (!node) return;
    portalNode = node;
    portalOwner = node.parentElement?.closest<HTMLElement>("[data-sw-color-picker]") ?? undefined;
    const local = node.parentElement?.closest<HTMLElement>("[data-floating-root]");
    localPortalContainer = local && local.closest("[data-sw-color-picker]") === portalOwner ? local : portalOwner;
    dialogLocal = Boolean(portalOwner?.closest("dialog[data-sw-dialog-content]"));
    portalReady = true;
  };
  const ownedPortalContainer = $derived.by(() => {
    const owner = portalOwner;
    if (!owner || !portalContainer) return localPortalContainer;
    let target: HTMLElement | null = null;
    try { target = owner.ownerDocument.querySelector<HTMLElement>(portalContainer); } catch { /* Invalid selectors retain the local owner. */ }
    return target?.closest("[data-sw-color-picker]") === owner && !portalNode?.contains(target)
      ? target : localPortalContainer;
  });
  $effect(() => {
    const popup = portalNode?.querySelector<HTMLElement>("[data-sw-popover-popup]");
    const dialog = portalOwner?.closest<HTMLDialogElement>("dialog[data-sw-dialog-content]");
    if (!dialogLocal || !popup || !dialog) return;
    return connectNativePopup(popup, () => dialog.open);
  });
</script>

<PopoverPortal
  container={ownedPortalContainer}
  ref={capturePortal}
  disabled={disablePortal || !portalReady || dialogLocal}
  data-slot={"popover-portal"}
>
  <PopoverPopup
    class={[popoverContent({ exitMotion }), colorPickerContent({ "size": size, "class": cx(className) })].filter(Boolean).join(" ")}
    side={side}
    align={align}
    collisionStrategy={"best-fit"}
    {...rest}
    data-sw-color-picker-content={""}
    data-size={size}
    data-slot={"color-picker-content"}
  >
    {#if children}{@render children()}{:else}<ColorPickerDefaultEditor
      size={size}
      showEyeDropper={showEyeDropper}
      portalContainer={portalContainer}
      disablePortal={disablePortal}
      formatControl={formatControl}
      formats={formats}
      swatches={swatches}
    >

    </ColorPickerDefaultEditor>{/if}
  </PopoverPopup>
</PopoverPortal>
