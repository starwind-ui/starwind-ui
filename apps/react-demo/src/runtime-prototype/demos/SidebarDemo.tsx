import { useState } from "react";
import {
  IconBell,
  IconChartBar,
  IconDots,
  IconFolder,
  IconHome,
  IconPlus,
  IconSearch,
  IconSettings,
  IconUserCircle,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "../kit";

export function SidebarDemo() {
  const [controlledOpen, setControlledOpen] = useState(true);
  const [controlledMobileOpen, setControlledMobileOpen] = useState(false);
  const [controlledChanges, setControlledChanges] = useState(0);

  return (
    <section className="space-y-4" id="react-runtime-sidebar-demo">
      <h2 className="font-heading text-xl font-semibold">Sidebar</h2>

      <SidebarProvider
        className="relative min-h-[34rem] overflow-hidden rounded-lg border"
        keyboardShortcut="b"
        persistOpen
        persistenceStorage="localStorage"
        persistenceKey="starwind-react-runtime-sidebar-prototype-open"
      >
        <Sidebar
          collapsible="icon"
          variant="inset"
          className="relative [&_[data-slot=sidebar-container]]:!absolute [&_[data-slot=sidebar-container]]:!h-full"
        >
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton variant="outline" size="lg" tooltip="Starwind">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-10 items-center justify-center rounded-lg">
                    <span className="text-sm font-semibold">SW</span>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Starwind</span>
                    <span className="text-sidebar-foreground/70 truncate text-xs">
                      Runtime demo
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <div className="relative group-data-[collapsible=icon]:hidden">
              <IconSearch
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <SidebarInput placeholder="Search workspace" className="pl-9" />
            </div>
          </SidebarHeader>

          <SidebarSeparator />

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupAction aria-label="Create workspace item">
                <IconPlus aria-hidden="true" />
              </SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="#" isActive tooltip="Home">
                      <IconHome aria-hidden="true" />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="#" tooltip="Reports">
                      <IconChartBar aria-hidden="true" />
                      <span>Reports</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>12</SidebarMenuBadge>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="#" tooltip="Projects">
                      <IconFolder aria-hidden="true" />
                      <span>Projects</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction showOnHover aria-label="Project actions">
                      <IconDots aria-hidden="true" />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Nested</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Settings">
                      <IconSettings aria-hidden="true" />
                      <span>Settings</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton href="#" isActive>
                          <span>Profile</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton href="#">
                          <span>Team</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                  <SidebarMenuSkeleton />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton variant="outline" size="lg" tooltip="Account">
                  <IconUserCircle aria-hidden="true" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Demo User</span>
                    <span className="text-sidebar-foreground/70 truncate text-xs">
                      demo@example.com
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="flex h-14 items-center gap-3 border-b px-4">
            <SidebarTrigger id="react-runtime-sidebar-trigger" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-medium">Runtime Sidebar Fixture</h3>
            </div>
            <IconBell className="text-muted-foreground size-4" aria-hidden="true" />
          </header>

          <div className="grid flex-1 gap-4 p-4 md:grid-cols-2">
            <div className="bg-muted/50 rounded-lg border p-4">
              <p className="text-sm font-medium">Keyboard and trigger state</p>
              <p className="text-muted-foreground mt-2 text-sm">
                Toggle with the trigger, rail, or Ctrl+B while focus is outside an input.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg border p-4">
              <p className="text-sm font-medium">Collapsed tooltips</p>
              <p className="text-muted-foreground mt-2 text-sm">
                Menu tooltips are gated until the icon sidebar is collapsed.
              </p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <SidebarProvider
        className="relative min-h-[22rem] overflow-hidden rounded-lg border"
        keyboardShortcut="j"
        open={controlledOpen}
        mobileOpen={controlledMobileOpen}
        onOpenChange={(nextOpen) => {
          setControlledOpen(nextOpen);
          setControlledChanges((count) => count + 1);
        }}
        onMobileOpenChange={(nextOpen) => {
          setControlledMobileOpen(nextOpen);
          setControlledChanges((count) => count + 1);
        }}
      >
        <Sidebar
          collapsible="icon"
          className="relative [&_[data-slot=sidebar-container]]:!absolute [&_[data-slot=sidebar-container]]:!h-full"
        >
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Controlled" size="lg">
                  <IconSettings aria-hidden="true" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Controlled</span>
                    <span className="text-sidebar-foreground/70 truncate text-xs">React state</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarSeparator />

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>State</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={controlledOpen} tooltip="Desktop">
                      <IconHome aria-hidden="true" />
                      <span>Desktop {controlledOpen ? "expanded" : "collapsed"}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={controlledMobileOpen} tooltip="Mobile">
                      <IconBell aria-hidden="true" />
                      <span>Mobile {controlledMobileOpen ? "open" : "closed"}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="flex h-14 items-center gap-3 border-b px-4">
            <SidebarTrigger id="react-runtime-controlled-sidebar-trigger" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-medium">Controlled React Sidebar</h3>
            </div>
          </header>

          <div className="grid flex-1 gap-4 p-4 md:grid-cols-2">
            <div className="bg-muted/50 rounded-lg border p-4">
              <p className="text-sm font-medium">Desktop open</p>
              <p className="text-muted-foreground mt-2 text-sm">
                Current state: {controlledOpen ? "expanded" : "collapsed"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="border-input bg-background hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
                  onClick={() => setControlledOpen(true)}
                >
                  Expand
                </button>
                <button
                  type="button"
                  className="border-input bg-background hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
                  onClick={() => setControlledOpen(false)}
                >
                  Collapse
                </button>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg border p-4">
              <p className="text-sm font-medium">Mobile open</p>
              <p className="text-muted-foreground mt-2 text-sm">
                Current state: {controlledMobileOpen ? "open" : "closed"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="border-input bg-background hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
                  onClick={() => setControlledMobileOpen((open) => !open)}
                >
                  Toggle mobile
                </button>
                <span className="text-muted-foreground self-center text-sm">
                  Changes: {controlledChanges}
                </span>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </section>
  );
}
