<script lang="ts">
  import Sidebar from "$lib/starwind-runtime/sidebar";
  import SidebarExample from "../examples/SidebarExample.svelte";

  let open = $state<boolean>();
  let mobileOpen = $state<boolean>();
  let persistOpen = $state(false);
  let active = $state("overview");
  const links = [
    {
      id: "overview",
      label: "Overview",
      icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    },
    { id: "projects", label: "Projects", icon: "M3 7V4h6l3 3h9v13H3z" },
    {
      id: "team",
      label: "Team",
      icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    },
  ];
</script>

<Sidebar.Root
  bind:open
  bind:mobileOpen
  {persistOpen}
  persistenceStorage="localStorage"
  persistenceKey="review-sidebar-workspace"
  class="min-h-[calc(100svh-4.5rem)]"
>
  <Sidebar.Sidebar
    collapsible="icon"
    variant="inset"
    style="top:4.5rem;height:calc(100svh - 4.5rem)"
  >
    <Sidebar.Header>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton href="#overview" size="lg" tooltip="Northstar workspace">
            <span
              class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
              >N</span
            >
            <span class="grid text-left leading-tight"
              ><span class="font-semibold">Northstar</span><span
                class="text-xs text-muted-foreground">Design workspace</span
              ></span
            >
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Header>
    <Sidebar.Separator />
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Workspace</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#each links as link (link.id)}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton
                  href={`#${link.id}`}
                  tooltip={link.label}
                  isActive={active === link.id}
                  aria-current={active === link.id ? "page" : undefined}
                  onclick={() => (active = link.id)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"><path d={link.icon} /></svg
                  >
                  <span>{link.label}</span>
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton href="/review/" tooltip="Component catalog">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"><path d="m12 4-8 8 8 8M4 12h16" /></svg
            >
            <span>Component catalog</span>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
      <Sidebar.Trigger class="md:hidden w-full" aria-label="Close workspace navigation"
        >Close navigation</Sidebar.Trigger
      >
    </Sidebar.Footer>
    <Sidebar.Rail />
  </Sidebar.Sidebar>
  <Sidebar.Inset class="min-w-0">
    <header class="flex min-h-16 flex-wrap items-center gap-3 border-b px-5">
      <Sidebar.Trigger aria-label="Toggle workspace navigation" data-workspace-toggle />
      <span class="text-sm font-medium"
        >Workspace / {links.find((link) => link.id === active)?.label}</span
      >
      <span class="ml-auto rounded-full border px-2.5 py-1 text-xs text-muted-foreground"
        >Sample workspace</span
      >
    </header>
    <div class="p-5 sm:p-8">
      <div class="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p class="eyebrow">Sidebar example</p>
          <h1 id="main" class="text-3xl font-semibold tracking-tight" tabindex="-1">
            A place for your work
          </h1>
          <p class="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Open a project or find your team. Collapse the navigation to see its icon tooltips, then
            try the same controls on a narrow screen.
          </p>
        </div>
        <label class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
          ><input type="checkbox" bind:checked={persistOpen} />Remember desktop state</label
        >
      </div>
      <SidebarExample />
    </div>
  </Sidebar.Inset>
</Sidebar.Root>
