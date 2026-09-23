/** Native anchor ownership follows the private Breadcrumb child contract. */
export function printSvelteAnchorChild({
  name,
  imports,
  init,
  attributes,
  register,
  omitEmptyRegistration = false,
}: {
  name: string;
  imports: string;
  init: string;
  attributes: string;
  register: string;
  omitEmptyRegistration?: boolean;
}): string {
  return `<!-- Svelte 5 public beta adapter output. -->
<script module lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAnchorAttributes } from "svelte/elements";
  export type AnchorChildProps = Omit<HTMLAnchorAttributes, "children">;
  export type AnchorChildPayload = { props: AnchorChildProps; children?: Snippet };
</script>
<script lang="ts">
  import { onMount, tick, untrack } from "svelte";
  import { createAttachmentKey, type Attachment } from "svelte/attachments";
  ${imports}
  type Props = AnchorChildProps & {
    children?: Snippet;
    child?: Snippet<[AnchorChildPayload]>;
    ref?: (element: HTMLAnchorElement | null) => void;
    disabled?: boolean;
    openDelay?: number;
    closeDelay?: number;
  };
  let allProps: Props = $props();
${register || !omitEmptyRegistration ? "  let disabledInput = $derived(allProps.disabled);" : ""}
  let child = $derived(allProps.child), children = $derived(allProps.children), refCallback = $derived(allProps.ref);
  let nativeProps = $derived.by(() => {
    const { child: _child, children: _children, ref: _ref, disabled: _disabled, openDelay: _openDelay, closeDelay: _closeDelay, ...native } = allProps;
    return { ...native } as AnchorChildProps;
  });
  ${init}
${register || !omitEmptyRegistration ? `  const owner = Symbol("${name} owner");` : ""}
  const owners = new Set<Element>();
  let currentElement = $state.raw<HTMLAnchorElement | null>(null);
  let attachmentRevision = 0;
  let mounted = false;
  let ownerRevision = 0;
  let diagnoseOwner: (() => void) | undefined;
  $inspect(true).with(() => {
    let diagnostic: string | null = null;
    diagnoseOwner = () => {
      const message = [...owners].some(element => !(element instanceof HTMLAnchorElement))
        ? "${name} child props must attach to an HTMLAnchorElement."
        : owners.size > 1
          ? "${name} child props must attach to exactly one anchor; multiple owners were attached."
          : owners.size === 0
            ? "${name} child props did not attach to an anchor after mount. Spread the whole props object onto one anchor."
            : null;
      if (message !== diagnostic) {
        diagnostic = message;
        if (message) console.warn(message);
      }
    };
  });
  function settleOwner(): void {
    const revision = ++ownerRevision;
    void tick().then(() => {
      if (!mounted || revision !== ownerRevision) return;
      const [single] = owners;
      currentElement = owners.size === 1 && single instanceof HTMLAnchorElement ? single : null;
      diagnoseOwner?.();
    });
  }
  onMount(() => {
    mounted = true;
    settleOwner();
    return () => { mounted = false; ownerRevision += 1; attachmentRevision += 1; };
  });
  $effect(() => {
    const root = currentElement;
    if (!root) return;
    $effect(() => { const callback = refCallback; untrack(() => callback?.(root)); return () => untrack(() => callback?.(null)); });
${register || !omitEmptyRegistration ? `    $effect(() => {
      // Changed disabled input retires interaction work while refs keep the same semantic owner.
      const disabled = disabledInput;
      return untrack(() => { void disabled; ${register} });
    });` : ""}
  });
  const attachOwner: Attachment<Element> = (root) => {
    owners.add(root);
    settleOwner();
    attachmentRevision += 1;
    if (root instanceof HTMLAnchorElement) currentElement = root;
    return () => {
      owners.delete(root);
      settleOwner();
      if (!root.isConnected) { if (untrack(() => currentElement) === root) currentElement = null; return; }
      const revision = ++attachmentRevision;
      void tick().then(() => {
        if (!mounted || revision !== attachmentRevision) return;
        if (currentElement === root && !owners.has(root)) currentElement = null;
      });
    };
  };
  function handleClick(event: MouseEvent & { currentTarget: EventTarget & HTMLAnchorElement }): void {
    if (allProps.disabled) { event.preventDefault(); event.stopPropagation(); return; }
    nativeProps.onclick?.(event);
  }
  const ownerKey = createAttachmentKey();
  let anchorProps: AnchorChildProps = $derived({
    ...nativeProps,
    ${attributes}
    href: allProps.disabled ? undefined : nativeProps.href,
    tabindex: allProps.disabled ? -1 : nativeProps.tabindex,
    onclick: handleClick,
    [ownerKey]: attachOwner,
  });
</script>
{#if child}{@render child({props: anchorProps, children})}{:else}<a {...anchorProps}>{@render children?.()}</a>{/if}
`;
}
