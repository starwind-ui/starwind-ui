<script setup lang="ts">
import { ref } from "vue";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./starwind-runtime/collapsible";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from "./starwind-runtime/dropdown";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
} from "./starwind-runtime/sidebar";
import ThemeToggle from "./starwind-runtime/theme-toggle/ThemeToggle.vue";

const open = ref(true);
const mobileOpen = ref(false);
const menuItems = [
  {
    iconPath: "M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5z M9 21v-7h6v7",
    title: "Playground",
    items: ["History", "Starred", "Settings"],
  },
  {
    iconPath: "M4 4h16v16H4z M4 14h4l2 3h4l2-3h4",
    title: "Models",
    items: ["Genesis", "Explorer", "Quantum"],
  },
  {
    iconPath: "M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2z M8 2v4 M16 2v4 M3 9h18",
    title: "Documentation",
    items: ["Introduction", "Get Started", "Tutorials", "Changelog"],
  },
  {
    iconPath:
      "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55V21h-4v-.08a1.7 1.7 0 0 0-1.03-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1.03H3v-4h.05A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.97 4.6 1.7 1.7 0 0 0 10 3.05V3h4v.05a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1.03H21v4h-.05A1.7 1.7 0 0 0 19.4 15z",
    title: "Settings",
    items: ["General", "Team", "Billing", "Limits"],
  },
] as const;

const projects = [
  { color: "bg-blue-500", name: "Design Engineering", short: "DE" },
  { color: "bg-emerald-500", name: "Sales and Marketing", short: "SM" },
  { color: "bg-violet-500", name: "Travel", short: "TR" },
] as const;
</script>

<template>
  <SidebarProvider
    v-model:open="open"
    v-model:mobile-open="mobileOpen"
    :persist-open="false"
    class="min-h-lvh"
    style="--sidebar-width: 16rem"
    data-testid="styled-sidebar-page"
  >
    <Sidebar collapsible="icon" data-testid="styled-sidebar-page-sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <span
                class="bg-sidebar-primary text-sidebar-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold"
              >
                S
              </span>
              <span class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">Starwind UI</span>
                <span class="text-sidebar-foreground/70 truncate text-xs">Enterprise</span>
              </span>
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
              <SidebarMenuItem v-for="item in menuItems" :key="item.title">
                <Collapsible :default-open="item.title === 'Playground'" class="group/collapsible">
                  <CollapsibleTrigger as-child>
                    <SidebarMenuButton :tooltip="item.title" :title="item.title">
                      <svg
                        aria-hidden="true"
                        class="size-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                      >
                        <path :d="item.iconPath" />
                      </svg>
                      <span>{{ item.title }}</span>
                      <svg
                        class="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        aria-hidden="true"
                      >
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem v-for="child in item.items" :key="child">
                        <SidebarMenuSubButton href="#">{{ child }}</SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup class="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem v-for="project in projects" :key="project.name">
                <SidebarMenuButton as-child :tooltip="project.name" :title="project.name">
                  <a href="#">
                    <span
                      :class="[
                        project.color,
                        'flex size-4.5 shrink-0 items-center justify-center rounded-sm text-[9px] font-semibold text-white',
                      ]"
                    >
                      {{ project.short }}
                    </span>
                    <span>{{ project.name }}</span>
                  </a>
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
              <DropdownTrigger as-child>
                <SidebarMenuButton
                  size="lg"
                  class="justify-start"
                  title="Branden"
                  data-testid="sidebar-account-trigger"
                >
                  <span
                    class="bg-sidebar-primary text-sidebar-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-lg font-semibold"
                  >
                    BR
                  </span>
                  <span class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">Branden</span>
                    <span class="text-sidebar-foreground/70 truncate text-xs">@branden</span>
                  </span>
                  <svg
                    class="ml-auto size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path d="m6 15 6-6 6 6" />
                  </svg>
                </SidebarMenuButton>
              </DropdownTrigger>
              <DropdownContent
                side="right"
                align="end"
                class="min-w-48"
                data-testid="sidebar-account-content"
              >
                <DropdownLabel>Branden · @branden</DropdownLabel>
                <DropdownSeparator />
                <DropdownItem>Upgrade to Pro</DropdownItem>
                <DropdownSeparator />
                <DropdownItem>Account</DropdownItem>
                <DropdownItem>Billing</DropdownItem>
                <DropdownItem>Notifications</DropdownItem>
                <DropdownSeparator />
                <DropdownItem>Log out</DropdownItem>
              </DropdownContent>
            </Dropdown>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>

    <SidebarInset data-testid="styled-sidebar-page-inset">
      <header class="bg-background sticky top-0 z-20 flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger data-testid="styled-sidebar-page-trigger" />
        <h1 class="text-muted-foreground flex-1 text-sm">Main Content</h1>
        <ThemeToggle aria-label="Toggle Sidebar review theme" />
      </header>

      <div class="flex-1 p-6">
        <div class="mx-auto max-w-4xl space-y-8">
          <section>
            <p class="eyebrow">Starwind docs advanced Sidebar</p>
            <h2 class="text-3xl font-bold">Workspace overview</h2>
            <p class="text-muted-foreground mt-3 max-w-2xl">
              Try the expandable Platform groups and the account menu at the bottom of the Sidebar.
              This Vue example follows the advanced Sidebar on starwind.dev.
            </p>
            <output class="mt-4 block font-mono text-sm" data-testid="styled-sidebar-page-state">
              desktop: {{ open }}, mobile: {{ mobileOpen }}
            </output>
          </section>

          <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Workspace summary">
            <article class="bg-card rounded-xl border p-5 shadow-sm">
              <p class="text-muted-foreground text-sm">Open projects</p>
              <p class="mt-2 text-3xl font-semibold">12</p>
            </article>
            <article class="bg-card rounded-xl border p-5 shadow-sm">
              <p class="text-muted-foreground text-sm">Team members</p>
              <p class="mt-2 text-3xl font-semibold">24</p>
            </article>
            <article class="bg-card rounded-xl border p-5 shadow-sm">
              <p class="text-muted-foreground text-sm">Tasks this week</p>
              <p class="mt-2 text-3xl font-semibold">38</p>
            </article>
          </section>

          <section class="bg-card rounded-xl border p-6 shadow-sm">
            <h3 class="text-lg font-semibold">Sidebar review checks</h3>
            <p class="text-muted-foreground mt-2 text-sm">
              Use the header button, rail, or Control+B to switch the desktop layout. At a narrow
              width, the same button opens the mobile sheet. Expand the Platform groups and open the
              account menu.
            </p>
          </section>

          <a class="review-link" href="/review">Return to the 54-entry Styled review</a>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
