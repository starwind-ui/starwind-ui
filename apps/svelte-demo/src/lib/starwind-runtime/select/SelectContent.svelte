<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { SelectPopup, SelectPortal, SelectPositioner } from "@starwind-ui/svelte/select";
  import { select, selectContent, selectGroup, selectItem, selectItemIndicator, selectItemText, selectLabel, selectList, selectScrollButton, selectSeparator, selectTrigger, selectValue } from "./variants.js";
  import { SelectList } from "@starwind-ui/svelte/select";

  export type SelectContentProps = Omit<ComponentProps<typeof SelectPopup>, "children"> & Pick<ComponentProps<typeof SelectPositioner>, "alignItemWithTrigger"> & { portalContainer?: ComponentProps<typeof SelectPortal>["container"] } & { children?: Snippet;  align?: "start" | "center" | "end"; alignOffset?: number; alignItemWithTrigger?: boolean; avoidCollisions?: boolean; side?: "top" | "right" | "bottom" | "left"; sideOffset?: number; size?: "sm" | "md" | "lg"; disablePortal?: boolean; };
</script>

<script lang="ts">
  let {
    "align": align = "start",
    "alignOffset": alignOffset = 0,
    "alignItemWithTrigger": alignItemWithTrigger = true,
    "avoidCollisions": avoidCollisions = true,
    "class": className,
    "side": side = "bottom",
    "sideOffset": sideOffset = 4,
    "size": size = "md",
    "portalContainer": portalContainer,
    "disablePortal": disablePortal = false,
    "children": children,
    ...rest
  }: SelectContentProps = $props();

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

  let authoredRoot: HTMLElement | null = null;
  let positioner = $state.raw<HTMLDivElement | null>(null);
  const capturePositioner = (node: HTMLDivElement | null) => {
    if (node) authoredRoot = node.closest<HTMLElement>("[data-sw-select]");
    positioner = node;
  };
  $effect(() => {
    const node = positioner;
    const popup = node?.querySelector<HTMLElement>("[data-sw-select-popup]");
    const view = node?.ownerDocument.defaultView;
    if (!node || !popup || !view) return;
    const releaseNative = connectNativePopup(popup, () => Boolean(authoredRoot?.closest("[popover]:popover-open")));
    const initial = node.style.zIndex;
    const syncStacking = () => {
      const next = view.getComputedStyle(popup).zIndex;
      if (node.style.zIndex !== next) node.style.zIndex = next;
    };
    syncStacking();
    const observer = new view.MutationObserver(syncStacking);
    observer.observe(popup, { attributes: true, attributeFilter: ["class", "style", "data-state"] });
    view.addEventListener("resize", syncStacking);
    return () => {
      observer.disconnect();
      releaseNative();
      view.removeEventListener("resize", syncStacking);
      node.style.zIndex = initial;
    };
  });
</script>

<SelectPortal
  container={portalContainer}
  disabled={disablePortal}
  data-slot={"select-portal"}
>
  <SelectPositioner
    align={align}
    alignOffset={alignOffset}
    alignItemWithTrigger={alignItemWithTrigger}
    avoidCollisions={avoidCollisions}
    side={side}
    sideOffset={sideOffset}
    data-slot={"select-positioner"}
    ref={capturePositioner}
  >
    <SelectPopup
      class={selectContent({ "size": size, "class": cx(className) })}
      align={align}
      alignOffset={alignOffset}
      avoidCollisions={avoidCollisions}
      side={side}
      sideOffset={sideOffset}
      data-align-trigger={alignItemWithTrigger ? "true" : "false"}
      {...rest}
      data-size={size}
      data-slot={"select-content"}
    >
      <SelectList
        class={selectList({  })}
        data-slot={"select-list"}
      >
        {@render children?.()}
      </SelectList>
    </SelectPopup>
  </SelectPositioner>
</SelectPortal>
