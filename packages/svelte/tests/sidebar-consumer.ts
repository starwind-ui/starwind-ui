import { createStyledSheetConsumer } from "./styled-sheet-consumer.js";
export const createSidebarConsumer = createStyledSheetConsumer;
export const sidebarPositive = `<script lang="ts">
import Sidebar,{SidebarProvider,SidebarComponent,SidebarTrigger,SidebarRail,SidebarMenuButton,SidebarContext,useSidebarContext,type SidebarContextValue,type SidebarMenuButtonChildPayload,type ButtonChildPayload,type ButtonChildProps,type SidebarPersistenceStorage,type SidebarOpenChangeDetails,type SidebarMobileOpenChangeDetails} from "@starwind-ui/svelte/sidebar";
import {SidebarProvider as RootProvider} from "@starwind-ui/svelte";
import {createAttachmentKey,type Attachment} from "svelte/attachments";
let open=$state<boolean|undefined>(),mobileOpen=$state<boolean|undefined>();
const divRef=(element:HTMLDivElement|null)=>{},buttonRef=(element:HTMLButtonElement|null)=>{},elementRef=(element:HTMLElement|null)=>{};
const buttonAttachment:Attachment<HTMLButtonElement>=(node)=>{void node.type;return()=>{};};
const elementAttachment:Attachment<HTMLElement>=(node)=>{void node.id;return()=>{};};
const buttonProps:ButtonChildProps={name:"action",type:"button"};
const storage:SidebarPersistenceStorage=false;
void [SidebarContext,useSidebarContext,RootProvider];
</script>
{#snippet buttonChild({props,children}:ButtonChildPayload)}<button {...props}>{@render children?.()}</button>{/snippet}
{#snippet menuChild(payload:SidebarMenuButtonChildPayload)}<a {...payload.props} href="/settings" target="_blank">{@render payload.children?.()}</a>{/snippet}
<SidebarProvider bind:open bind:mobileOpen defaultOpen defaultMobileOpen={false} persistOpen persistenceStorage={storage} persistenceKey="sidebar-consumer" persistenceMaxAge={300} mobileQuery="(max-width: 600px)" keyboardShortcut="s" ref={divRef} onOpenChange={(next,details)=>{const detail:SidebarOpenChangeDetails=details;const accepted:boolean=next;void [detail,accepted];}} onMobileOpenChange={(next,details)=>{const detail:SidebarMobileOpenChangeDetails=details;void [detail,next];}}>
<SidebarComponent side="right" variant="floating" collapsible="icon" ref={divRef}><SidebarTrigger child={buttonChild} ref={buttonRef} {...{[createAttachmentKey()]:buttonAttachment}}>Toggle</SidebarTrigger><SidebarRail ref={buttonRef}/><SidebarMenuButton {...buttonProps} ref={elementRef} onclick={(event:MouseEvent&{currentTarget:HTMLButtonElement})=>{const owner:HTMLButtonElement=event.currentTarget;void owner;}}>Action</SidebarMenuButton><SidebarMenuButton child={menuChild} ref={elementRef} {...{[createAttachmentKey()]:elementAttachment}}>Settings</SidebarMenuButton></SidebarComponent>
</SidebarProvider><Sidebar.Provider open={false} mobileOpen={true}><Sidebar.Sidebar/><Sidebar.Trigger/></Sidebar.Provider>`;
