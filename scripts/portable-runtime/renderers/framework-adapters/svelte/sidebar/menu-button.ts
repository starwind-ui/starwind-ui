import { sidebarAttrs } from "../../../shared-recipes/structured/sidebar/parts.js";
import type { AdapterSidebarFacts } from "../../types.js";

export function printSidebarMenuButton(f: AdapterSidebarFacts): string {
  return `<script module lang="ts">
  import type { Snippet as ModuleSnippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  export type SidebarMenuButtonChildPayload = { props: HTMLAttributes<HTMLElement>; children?: ModuleSnippet };
</script>
<script lang="ts">
  import { useSidebarContext } from "./SidebarContext.js";
  import type { ButtonChildProps } from "../button/ButtonRoot.svelte";
  import { untrack, type Snippet } from "svelte";
  import { createAttachmentKey } from "svelte/attachments";
  type Props = ButtonChildProps & { children?: Snippet; child?: Snippet<[SidebarMenuButtonChildPayload]>; ref?: (element: HTMLElement|null)=>void };
  let props:Props=$props();
  const context=useSidebarContext();
  let children=$derived(props.children),child=$derived(props.child);
  let native=$derived.by(()=>{const {children:_children,child:_child,ref:_ref,...rest}=props;return {...rest,${sidebarAttrs(f, "menuButton", "svelte", "object")},type:"button" as const};});
  const attachRef = (element: HTMLElement) => {
    const callback = props.ref;
    untrack(() => callback?.(element));
    return () => untrack(() => callback?.(null));
  };
  const refKey=createAttachmentKey();
</script>
{#if child}{@render child({props:{...native,[refKey]:attachRef} as HTMLAttributes<HTMLElement>,children})}{:else}<button {...native} {@attach attachRef}>{@render children?.()}</button>{/if}
`;
}
