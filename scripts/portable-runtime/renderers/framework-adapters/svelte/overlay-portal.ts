import { printSvelteRefAttachment } from "./attachments.js";
type OverlayPortalFacts = {
  displayName: string;
  parts: { portal?: { name: string } };
  runtime: { importSource: string };
  exports: { root: string };
  attrs: { root: string; portal?: string };
};
const NON_SHIPPING_COMMENT = "Svelte 5 public beta adapter output.";

export function printSvelteOverlayPortal(
  facts: OverlayPortalFacts,
  contextGetter = "getDialogButtonContext",
  referenceExpression = `element.closest<HTMLElement>("[${facts.attrs.root}]") ?? element`,
  preserveFocus = false,
): string {
  const part = facts.parts.portal!;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { createPortalPlacement } from "../_internal/portal-placement.js";
  import { reportPortalPlacement, resolvePortalPlacement } from "${facts.runtime.importSource}";
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  import { ${contextGetter} } from "./${facts.exports.root}.svelte";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & { children?: Snippet; container?: string | HTMLElement; disabled?: boolean; ref?: (element: HTMLDivElement | null) => void };
  let { children, container, disabled = false, ref, ...rest }: Props = $props();
  const select = ${contextGetter}()!;
  const owner = Symbol("${facts.displayName}PortalOwner");
${printSvelteRefAttachment("HTMLDivElement")}
  const attachPortal: Attachment<HTMLDivElement> = (element) => {
    const placement = createPortalPlacement(element, ${referenceExpression}, {
      reportPortalPlacement, resolvePortalPlacement,
    }, ${preserveFocus});
    select.registerPortal(owner, element, placement.authoredParent as HTMLElement, placement.prepare);
    $effect(() => placement.update(select.mounted && !disabled, container));
    $effect(() => attachRef(element));
    return () => {
      placement.disconnect();
      select.registerPortal(owner, null);
      placement.restore();
      // Svelte removes the authored range; a moved wrapper needs explicit release.
      element.remove();
    };
  };
</script>
<div {...rest} ${facts.attrs.portal}="" data-sw-part="${part.name}" data-floating-root data-placement="pending" data-sw-portal-placement="framework" data-disabled={disabled ? "" : undefined} {@attach attachPortal}>{@render children?.()}</div>
`;
}
