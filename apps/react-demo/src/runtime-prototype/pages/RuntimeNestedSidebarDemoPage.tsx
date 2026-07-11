import {
  IconBook,
  IconChartPie,
  IconChevronRight,
  IconCode,
  IconFrame,
  IconLifebuoy,
  IconMap,
  IconRobot,
  IconSend,
  IconSettings2,
  IconTerminal2,
} from "@tabler/icons-react";
import { DialogDemo } from "../demos/DialogDemo";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  ThemeToggle,
} from "../kit";

const navMain = [
  {
    title: "Playground",
    url: "#",
    icon: IconTerminal2,
    isActive: true,
    items: [
      { title: "History", url: "#" },
      { title: "Starred", url: "#" },
      { title: "Settings", url: "#" },
    ],
  },
  {
    title: "Models",
    url: "#",
    icon: IconRobot,
    items: [
      { title: "Genesis", url: "#" },
      { title: "Explorer", url: "#" },
      { title: "Quantum", url: "#" },
    ],
  },
  {
    title: "Documentation",
    url: "#",
    icon: IconBook,
    items: [
      { title: "Introduction", url: "#" },
      { title: "Get Started", url: "#" },
      { title: "Tutorials", url: "#" },
      { title: "Changelog", url: "#" },
    ],
  },
  {
    title: "Settings",
    url: "#",
    icon: IconSettings2,
    items: [
      { title: "General", url: "#" },
      { title: "Team", url: "#" },
      { title: "Billing", url: "#" },
      { title: "Limits", url: "#" },
    ],
  },
];

const navSecondary = [
  { title: "Support", url: "#", icon: IconLifebuoy },
  { title: "Feedback", url: "#", icon: IconSend },
];

const projects = [
  { name: "Design Engineering", url: "#", icon: IconFrame },
  { name: "Sales & Marketing", url: "#", icon: IconChartPie },
  { name: "Travel", url: "#", icon: IconMap },
];

export function RuntimeNestedSidebarDemoPage() {
  return (
    <div id="react-runtime-nested-sidebar-demo" className="min-h-lvh">
      <SidebarProvider keyboardShortcut="b">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-10 items-center justify-center rounded-lg">
                    <IconCode className="size-5" aria-hidden="true" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Starwind UI</span>
                    <span className="text-sidebar-foreground/70 truncate text-xs">
                      Runtime Enterprise
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarSeparator />

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Platform</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navMain.map((item) => (
                    <Collapsible
                      key={item.title}
                      defaultOpen={item.isActive}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            <item.icon aria-hidden="true" />
                            <span>{item.title}</span>
                            <IconChevronRight
                              className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                              aria-hidden="true"
                            />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        {item.items ? (
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        ) : null}
                      </SidebarMenuItem>
                    </Collapsible>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projects.map((project) => (
                    <SidebarMenuItem key={project.name}>
                      <SidebarMenuButton href={project.url} tooltip={project.name}>
                        <project.icon className="size-4" aria-hidden="true" />
                        <span>{project.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  {navSecondary.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton href={item.url} tooltip={item.title}>
                        <item.icon className="size-4" aria-hidden="true" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="bg-background sticky top-0 flex h-14 items-center gap-4 border-b px-4">
            <SidebarTrigger id="react-runtime-nested-sidebar-trigger" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Runtime Nested Menus Demo</h1>
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
                href="/pages/runtime-sidebar-demo"
                className="border-input bg-background hover:bg-muted hover:text-foreground rounded-md border px-3 py-1.5 text-sm font-medium shadow-xs transition-colors"
              >
                Basic
              </a>
            </nav>
            <ThemeToggle />
          </header>

          <main className="flex-1 p-6">
            <div className="mx-auto max-w-4xl space-y-8">
              <section>
                <h2 className="mb-4 text-2xl font-bold">Nested Menu Items</h2>
                <p className="text-muted-foreground mb-6">
                  This demo showcases the nested menu feature using{" "}
                  <code className="bg-muted rounded px-1.5 py-0.5 text-sm">SidebarMenuSub</code>,{" "}
                  <code className="bg-muted rounded px-1.5 py-0.5 text-sm">SidebarMenuSubItem</code>
                  , and{" "}
                  <code className="bg-muted rounded px-1.5 py-0.5 text-sm">
                    SidebarMenuSubButton
                  </code>
                  .
                </p>

                <div className="bg-muted/50 space-y-4 rounded-lg border p-6">
                  <h3 className="font-semibold">Nested Menu Components</h3>
                  <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
                    <li>
                      <strong>SidebarMenuSub:</strong> Container for sub-menu items with connecting
                      border
                    </li>
                    <li>
                      <strong>SidebarMenuSubItem:</strong> Individual sub-menu item wrapper
                    </li>
                    <li>
                      <strong>SidebarMenuSubButton:</strong> Clickable sub-menu item with smaller
                      styling
                    </li>
                  </ul>
                </div>
              </section>

              <DialogDemo />

              <section>
                <h3 className="mb-4 text-xl font-semibold">Usage</h3>
                <pre className="bg-muted overflow-x-auto rounded-lg border p-4 text-sm">
                  <code>{`<SidebarMenuItem>
  <CollapsibleTrigger asChild>
    <SidebarMenuButton>
      <Icon />
      <span>Parent Item</span>
      <ChevronRight className="ml-auto" />
    </SidebarMenuButton>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <SidebarMenuSub>
      <SidebarMenuSubItem>
        <SidebarMenuSubButton href="#">
          Sub Item 1
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
      <SidebarMenuSubItem>
        <SidebarMenuSubButton href="#">
          Sub Item 2
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    </SidebarMenuSub>
  </CollapsibleContent>
</SidebarMenuItem>`}</code>
                </pre>
              </section>

              <section>
                <h3 className="mb-4 text-xl font-semibold">Navigation</h3>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="/pages/runtime-sidebar-demo"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                  >
                    Basic runtime sidebar demo
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
