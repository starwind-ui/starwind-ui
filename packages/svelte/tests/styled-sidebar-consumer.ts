import { createStyledSheetConsumer } from "./styled-sheet-consumer.js";
import { writeStyledConsumerFiles } from "./styled-consumer-files.js";
export async function createStyledSidebarConsumer(repoRoot: string) {
  const consumer = await createStyledSheetConsumer(repoRoot);
  try {
    await writeStyledConsumerFiles(consumer, repoRoot, [
      "sidebar",
      "input",
      "separator",
      "skeleton",
      "tooltip",
    ]);
    return consumer;
  } catch (error) {
    await consumer.dispose();
    throw error;
  }
}
export const styledSidebarPositive = `<script lang="ts">
import S,* as named from "./sidebar/index.js";
import type {SidebarMenuButtonChildPayload} from "@starwind-ui/svelte/sidebar";
let open=$state<boolean|undefined>(),mobileOpen=$state<boolean|undefined>(),value=$state<string>(),sidebarRef=$state<HTMLDivElement>();
const exports=[named.Sidebar,named.SidebarContent,named.SidebarFooter,named.SidebarGroup,named.SidebarGroupAction,named.SidebarGroupContent,named.SidebarGroupLabel,named.SidebarHeader,named.SidebarInput,named.SidebarInset,named.SidebarMenu,named.SidebarMenuAction,named.SidebarMenuBadge,named.SidebarMenuButton,named.SidebarMenuItem,named.SidebarMenuSkeleton,named.SidebarMenuSub,named.SidebarMenuSubButton,named.SidebarMenuSubItem,named.SidebarProvider,named.SidebarRail,named.SidebarSeparator,named.SidebarTrigger];void exports;
named.SidebarVariants.sidebarMenuButton({variant:"outline",size:"sm"});
</script>
{#snippet custom(payload:SidebarMenuButtonChildPayload)}{#if payload.kind==="anchor"}<a {...payload.props}>{@render payload.children?.()}</a>{:else}<button {...payload.props}>{@render payload.children?.()}</button>{/if}{/snippet}
<S.Root bind:open bind:mobileOpen onOpenChange={(next,details)=>{const typed:boolean=next;void [typed,details.reason];}} onMobileOpenChange={(next,details)=>{void [next,details.reason];}}>
<S.Sidebar side="right" variant="inset" collapsible="icon" bind:ref={sidebarRef}><S.Header><S.Input bind:value aria-label="Search"/></S.Header><S.Content><S.Group><S.GroupLabel>Workspace</S.GroupLabel><S.GroupAction aria-label="Add">+</S.GroupAction><S.GroupContent><S.Menu><S.MenuItem><S.MenuButton href="" child={custom} tooltip="Overview" isActive ref={(node:HTMLAnchorElement|null)=>{void node;}}>Overview</S.MenuButton><S.MenuAction aria-label="More">...</S.MenuAction><S.MenuBadge>2</S.MenuBadge><S.MenuSub><S.MenuSubItem><S.MenuSubButton href="#project">Project</S.MenuSubButton></S.MenuSubItem></S.MenuSub></S.MenuItem><S.MenuItem><S.MenuButton child={custom} ref={(node:HTMLButtonElement|null)=>{void node;}}>Action</S.MenuButton></S.MenuItem></S.Menu></S.GroupContent></S.Group><S.MenuSkeleton showIcon width="65%"/></S.Content><S.Separator/><S.Footer>Account</S.Footer><S.Rail/></S.Sidebar><S.Inset><S.Trigger>{#snippet child({props,children})}<button {...props}>{@render children?.()}</button>{/snippet}</S.Trigger></S.Inset></S.Root>`;
