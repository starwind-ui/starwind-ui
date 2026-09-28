import { sidebarAttrs } from "../../../shared-recipes/structured/sidebar/parts.js";
import type { AdapterSidebarFacts } from "../../types.js";

export function printSidebarMenuButton(f: AdapterSidebarFacts): string {
  return `<script module lang="ts">
  import type { Snippet as ModuleSnippet } from "svelte";
  import type { ButtonChildProps } from "../button/ButtonRoot.svelte";
  import type { HTMLAnchorAttributes } from "svelte/elements";
  export type AnchorChildProps = Omit<HTMLAnchorAttributes, "children">;
  export type SidebarMenuButtonChildPayload = ({ kind: "button"; props: ButtonChildProps } | { kind: "anchor"; props: AnchorChildProps }) & { children?: ModuleSnippet };
</script>
<script lang="ts">
  import { useSidebarContext } from "./SidebarContext.js";
  import { untrack, type Snippet } from "svelte";
  import { createAttachmentKey } from "svelte/attachments";
  type Props = { children?: Snippet; child?: Snippet<[SidebarMenuButtonChildPayload]> } & (
    (ButtonChildProps & { href?: undefined; ref?: (element: HTMLButtonElement|null)=>void }) |
    (AnchorChildProps & { href: Exclude<AnchorChildProps["href"],undefined>; ref?: (element: HTMLAnchorElement|null)=>void })
  );
  let props:Props=$props();
  const context=useSidebarContext();
  let children=$derived(props.children),child=$derived(props.child);
  let native=$derived.by(()=>{const {children:_children,child:_child,ref:_ref,...rest}=props;return {...rest,${sidebarAttrs(f, "menuButton", "svelte", "object")}};});
  const attachRef = (element: HTMLButtonElement | HTMLAnchorElement) => {
    const callback = props.ref as ((element: HTMLButtonElement | HTMLAnchorElement | null) => void) | undefined;
    untrack(() => callback?.(element));
    return () => untrack(() => callback?.(null));
  };
  const refKey=createAttachmentKey();
</script>
{#if props.href !== undefined}
  {#if child}{@render child({kind:"anchor",props:{...native,[refKey]:attachRef} as AnchorChildProps,children})}{:else}<a {...(native as AnchorChildProps)} {@attach attachRef}>{@render children?.()}</a>{/if}
{:else}
  {#if child}{@render child({kind:"button",props:{...native,type:"button",[refKey]:attachRef} as ButtonChildProps,children})}{:else}<button {...(native as ButtonChildProps)} type="button" {@attach attachRef}>{@render children?.()}</button>{/if}
{/if}
`;
}
