import { createStyledSheetConsumer } from "./styled-sheet-consumer.js";
export const createSidebarConsumer = createStyledSheetConsumer;
export const sidebarPositive = `<script lang="ts">
import Sidebar,{SidebarProvider,SidebarComponent,SidebarTrigger,SidebarRail,SidebarMenuButton,SidebarContext,useSidebarContext,type SidebarContextValue,type SidebarMenuButtonChildPayload,type ButtonChildPayload,type ButtonChildProps,type AnchorChildProps,type SidebarPersistenceStorage,type SidebarOpenChangeDetails,type SidebarMobileOpenChangeDetails} from "@starwind-ui/svelte/sidebar";
import {SidebarProvider as RootProvider,type SidebarAnchorChildProps} from "@starwind-ui/svelte";
import {createAttachmentKey,type Attachment} from "svelte/attachments";
let open=$state<boolean|undefined>(),mobileOpen=$state<boolean|undefined>();
const divRef=(element:HTMLDivElement|null)=>{},buttonRef=(element:HTMLButtonElement|null)=>{},anchorRef=(element:HTMLAnchorElement|null)=>{};
const buttonAttachment:Attachment<HTMLButtonElement>=(node)=>{void node.type;return()=>{};};
const anchorAttachment:Attachment<HTMLAnchorElement>=(node)=>{void node.href;return()=>{};};
const buttonProps:ButtonChildProps={name:"action",type:"button"},anchorProps:AnchorChildProps={href:""},rootAnchor:SidebarAnchorChildProps=anchorProps;
const storage:SidebarPersistenceStorage=false;
void [SidebarContext,useSidebarContext,RootProvider,rootAnchor];
</script>
{#snippet buttonChild({props,children}:ButtonChildPayload)}<button {...props}>{@render children?.()}</button>{/snippet}
{#snippet menuChild(payload:SidebarMenuButtonChildPayload)}{#if payload.kind==="button"}<button {...payload.props}>{@render payload.children?.()}</button>{:else}<a {...payload.props}>{@render payload.children?.()}</a>{/if}{/snippet}
<SidebarProvider bind:open bind:mobileOpen defaultOpen defaultMobileOpen={false} persistOpen persistenceStorage={storage} persistenceKey="sidebar-consumer" persistenceMaxAge={300} mobileQuery="(max-width: 600px)" keyboardShortcut="s" ref={divRef} onOpenChange={(next,details)=>{const detail:SidebarOpenChangeDetails=details;const accepted:boolean=next;void [detail,accepted];}} onMobileOpenChange={(next,details)=>{const detail:SidebarMobileOpenChangeDetails=details;void [detail,next];}}>
<SidebarComponent side="right" variant="floating" collapsible="icon" ref={divRef}><SidebarTrigger child={buttonChild} ref={buttonRef} {...{[createAttachmentKey()]:buttonAttachment}}>Toggle</SidebarTrigger><SidebarRail ref={buttonRef}/><SidebarMenuButton {...buttonProps} child={menuChild} ref={buttonRef} onclick={(event:MouseEvent&{currentTarget:HTMLButtonElement})=>{const owner:HTMLButtonElement=event.currentTarget;void owner;}}>Action</SidebarMenuButton><SidebarMenuButton href="" child={menuChild} ref={anchorRef} {...{[createAttachmentKey()]:anchorAttachment}} onclick={event=>{const owner:HTMLAnchorElement=event.currentTarget;void owner;}}>Home</SidebarMenuButton><SidebarMenuButton href="/settings" target="_blank" ref={anchorRef}>Settings</SidebarMenuButton></SidebarComponent>
</SidebarProvider><Sidebar.Provider open={false} mobileOpen={true}><Sidebar.Sidebar/><Sidebar.Trigger/></Sidebar.Provider>`;
