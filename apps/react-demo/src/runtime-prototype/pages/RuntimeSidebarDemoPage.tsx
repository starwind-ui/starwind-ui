import {
  IconBell,
  IconCalendar,
  IconChevronUp,
  IconCreditCard,
  IconHome,
  IconInbox,
  IconLogout,
  IconRosetteDiscountCheck,
  IconSearch,
  IconSettings,
  IconSparkles,
} from "@tabler/icons-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  ThemeToggle,
} from "../kit";

const menuItems = [
  { title: "Home", url: "#", icon: IconHome },
  { title: "Inbox", url: "#", icon: IconInbox },
  { title: "Calendar", url: "#", icon: IconCalendar },
  { title: "Search", url: "#", icon: IconSearch },
  { title: "Settings", url: "#", icon: IconSettings },
];

export function RuntimeSidebarDemoPage() {
  return (
    <div id="react-runtime-sidebar-demo" className="min-h-lvh">
      <SidebarProvider
        keyboardShortcut="b"
        persistOpen
        persistenceStorage="localStorage"
        persistenceKey="starwind-react-runtime-sidebar-demo-open"
      >
        <Sidebar collapsible="icon" variant="inset">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton variant="outline" size="lg">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-10 items-center justify-center rounded-lg">
                    <span className="text-lg font-bold">S</span>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Starwind UI</span>
                    <span className="text-sidebar-foreground/70 truncate text-xs">Runtime App</span>
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
              <SidebarGroupLabel>Application</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        href={item.url}
                        isActive={item.title === "Home"}
                        tooltip={item.title}
                        variant="outline"
                      >
                        <item.icon aria-hidden="true" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton variant="outline" href="#" tooltip="Project Alpha">
                      <span className="flex size-4.5 shrink-0 items-center justify-center rounded-sm bg-blue-500 text-[10px] text-white">
                        P1
                      </span>
                      <span>Project Alpha</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton variant="outline" href="#" tooltip="Project Beta">
                      <span className="flex size-4.5 shrink-0 items-center justify-center rounded-sm bg-green-500 text-[10px] text-white">
                        P2
                      </span>
                      <span>Project Beta</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton variant="outline" href="#" tooltip="Project Gamma">
                      <span className="flex size-4.5 shrink-0 items-center justify-center rounded-sm bg-purple-500 text-[10px] text-white">
                        P3
                      </span>
                      <span>Project Gamma</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <Dropdown>
                  <DropdownTrigger asChild>
                    <SidebarMenuButton
                      variant="outline"
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <Avatar className="shrink-0 rounded-lg">
                        <AvatarImage src="https://i.pravatar.cc/150?u=johndoe" alt="John Doe" />
                        <AvatarFallback className="rounded-lg">JD</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">John Doe</span>
                        <span className="text-sidebar-foreground/70 truncate text-xs">
                          john@example.com
                        </span>
                      </div>
                      <IconChevronUp className="ml-auto size-4" aria-hidden="true" />
                    </SidebarMenuButton>
                  </DropdownTrigger>
                  <DropdownContent
                    className="w-[--trigger-width] min-w-56 rounded-lg"
                    side="top"
                    align="end"
                    sideOffset={4}
                  >
                    <DropdownLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="size-8 rounded-lg">
                          <AvatarImage src="https://i.pravatar.cc/150?u=johndoe" alt="John Doe" />
                          <AvatarFallback className="rounded-lg">JD</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">John Doe</span>
                          <span className="text-muted-foreground truncate text-xs">
                            john@example.com
                          </span>
                        </div>
                      </div>
                    </DropdownLabel>
                    <DropdownSeparator />
                    <DropdownItem>
                      <IconSparkles className="mr-2 size-4" aria-hidden="true" />
                      Upgrade to Pro
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem>
                      <IconRosetteDiscountCheck className="mr-2 size-4" aria-hidden="true" />
                      Account
                    </DropdownItem>
                    <DropdownItem>
                      <IconCreditCard className="mr-2 size-4" aria-hidden="true" />
                      Billing
                    </DropdownItem>
                    <DropdownItem>
                      <IconBell className="mr-2 size-4" aria-hidden="true" />
                      Notifications
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem>
                      <IconLogout className="mr-2 size-4" aria-hidden="true" />
                      Log out
                    </DropdownItem>
                  </DropdownContent>
                </Dropdown>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="bg-background sticky top-0 flex h-14 items-center gap-4 border-b px-4">
            <SidebarTrigger id="react-runtime-sidebar-trigger" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Runtime Sidebar Demo</h1>
            </div>
            <nav
              className="hidden items-center gap-2 sm:flex"
              aria-label="Runtime sidebar page navigation"
            >
              <a
                href="/"
                className="border-input bg-background hover:bg-muted hover:text-foreground rounded-md border px-3 py-1.5 text-sm font-medium shadow-xs transition-colors"
              >
                Prototype
              </a>
              <a
                href="/pages/runtime-nested-sidebar"
                className="border-input bg-background hover:bg-muted hover:text-foreground rounded-md border px-3 py-1.5 text-sm font-medium shadow-xs transition-colors"
              >
                Nested
              </a>
            </nav>
            <ThemeToggle />
          </header>

          <main className="flex-1 p-6">
            <div className="mx-auto max-w-4xl space-y-8">
              <section>
                <h2 className="mb-4 text-2xl font-bold">Starwind UI Runtime Sidebar Component</h2>
                <p className="text-muted-foreground mb-6">
                  A composable, themeable, and customizable sidebar component backed by the portable
                  runtime. This demo showcases the{" "}
                  <code className="bg-muted rounded px-1.5 py-0.5 text-sm">
                    collapsible=&quot;icon&quot;
                  </code>{" "}
                  mode.
                </p>

                <div className="bg-muted/50 space-y-4 rounded-lg border p-6">
                  <h3 className="font-semibold">Features</h3>
                  <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
                    <li>
                      <strong>Collapsible modes:</strong>{" "}
                      <code className="bg-muted rounded px-1 text-xs">icon</code>,{" "}
                      <code className="bg-muted rounded px-1 text-xs">offcanvas</code>, or{" "}
                      <code className="bg-muted rounded px-1 text-xs">none</code>
                    </li>
                    <li>
                      <strong>Side positioning:</strong>{" "}
                      <code className="bg-muted rounded px-1 text-xs">left</code> or{" "}
                      <code className="bg-muted rounded px-1 text-xs">right</code>
                    </li>
                    <li>
                      <strong>Variants:</strong>{" "}
                      <code className="bg-muted rounded px-1 text-xs">sidebar</code>,{" "}
                      <code className="bg-muted rounded px-1 text-xs">floating</code>, or{" "}
                      <code className="bg-muted rounded px-1 text-xs">inset</code>
                    </li>
                    <li>
                      <strong>Keyboard shortcut:</strong> Press{" "}
                      <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-xs">
                        Ctrl
                      </kbd>{" "}
                      +{" "}
                      <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-xs">
                        B
                      </kbd>{" "}
                      to toggle
                    </li>
                    <li>
                      <strong>Opt-in localStorage persistence:</strong> Remembers desktop sidebar
                      state across sessions
                    </li>
                    <li>
                      <strong>Mobile support:</strong> Opens as a sheet on mobile devices
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-xl font-semibold">Usage</h3>
                <pre className="bg-muted overflow-x-auto rounded-lg border p-4 text-sm">
                  <code>{`<SidebarProvider
  persistOpen
  persistenceStorage="localStorage"
  persistenceKey="starwind-react-runtime-sidebar-demo-open"
>
  <Sidebar collapsible="icon">
    <SidebarHeader>...</SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="#">
                <Icon />
                <span>Label</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>...</SidebarFooter>
    <SidebarRail />
  </Sidebar>

  <SidebarInset>
    <main>Your content here</main>
  </SidebarInset>
</SidebarProvider>`}</code>
                </pre>
              </section>

              <section>
                <h3 className="mb-4 text-xl font-semibold">Try It</h3>
                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                    onClick={() => {
                      document
                        .querySelector("[data-slot=sidebar-provider]")
                        ?.dispatchEvent(new CustomEvent("sidebar:toggle"));
                    }}
                  >
                    Toggle Sidebar
                  </button>
                  <a
                    href="/pages/runtime-nested-sidebar"
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                  >
                    Nested runtime demo
                  </a>
                  <a
                    href="/"
                    className="bg-foreground text-background hover:bg-foreground/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                  >
                    Back to runtime prototype
                  </a>
                </div>
              </section>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
