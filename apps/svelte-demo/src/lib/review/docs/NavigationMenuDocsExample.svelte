<script lang="ts">
  import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
  } from "$lib/starwind-runtime/navigation-menu";
  const components = [
    {
      title: "Alert Dialog",
      href: "https://starwind.dev/docs/components/alert-dialog/",
      description:
        "A modal dialog that interrupts the user with important content and expects a response.",
    },
    {
      title: "Hover Card",
      href: "https://starwind.dev/docs/components/hover-card/",
      description: "For sighted users to preview content available behind a link.",
    },
    {
      title: "Progress",
      href: "https://starwind.dev/docs/components/progress/",
      description: "Displays an indicator showing the completion progress of a task.",
    },
    {
      title: "Scroll Area",
      href: "https://starwind.dev/docs/components/scroll-area/",
      description: "Augments native scroll functionality for custom, cross-browser styling.",
    },
    {
      title: "Tabs",
      href: "https://starwind.dev/docs/components/tabs/",
      description: "A set of layered sections of content displayed one at a time.",
    },
    {
      title: "Tooltip",
      href: "https://starwind.dev/docs/components/tooltip/",
      description: "A popup that provides information when an element is focused or hovered.",
    },
  ];
</script>

{#snippet AlertCircle()}<svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" /></svg
  >{/snippet}
{#snippet CircleCheck()}<svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" /></svg
  >{/snippet}
{#snippet CircleDashed()}<svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"><circle cx="12" cy="12" r="9" stroke-dasharray="4 4" /></svg
  >{/snippet}
<NavigationMenu size="md" aria-label="Documentation navigation">
  <NavigationMenuList class="flex-wrap sm:flex-nowrap">
    <NavigationMenuItem value="getting-started">
      <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul class="w-[min(27rem,calc(100vw-8rem))]">
          <li>
            <NavigationMenuLink href="https://starwind.dev/docs/getting-started/introduction/">
              <div class="flex flex-col gap-1.5">
                <div class="leading-none font-medium">Introduction</div>
                <div class="text-muted-foreground line-clamp-2">
                  Reusable components built with Tailwind CSS.
                </div>
              </div>
            </NavigationMenuLink>
          </li>
          <li>
            <NavigationMenuLink href="https://starwind.dev/docs/getting-started/installation/">
              <div class="flex flex-col gap-1.5">
                <div class="leading-none font-medium">Installation</div>
                <div class="text-muted-foreground line-clamp-2">
                  How to install dependencies and structure your app.
                </div>
              </div>
            </NavigationMenuLink>
          </li>
          <li>
            <NavigationMenuLink href="https://starwind.dev/docs/getting-started/theming/">
              <div class="flex flex-col gap-1.5">
                <div class="leading-none font-medium">Theming</div>
                <div class="text-muted-foreground line-clamp-2">
                  Customize colors, typography, and design tokens.
                </div>
              </div>
            </NavigationMenuLink>
          </li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem value="components" class="hidden md:flex">
      <NavigationMenuTrigger>Components</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul
          class="grid w-[min(31.25rem,calc(100vw-8rem))] gap-2 md:w-[min(37.5rem,calc(100vw-8rem))] md:grid-cols-2 lg:w-[43.75rem]"
        >
          {#each components as component (component.title)}
            <li>
              <NavigationMenuLink href={component.href}>
                <div class="flex flex-col gap-1.5">
                  <div class="leading-none font-medium">{component.title}</div>
                  <div class="text-muted-foreground line-clamp-2">{component.description}</div>
                </div>
              </NavigationMenuLink>
            </li>
          {/each}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem value="status">
      <NavigationMenuTrigger>With icon</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul class="grid w-[240px]">
          <li>
            <NavigationMenuLink href="#navigation-menu-review" class="flex-row items-center gap-2"
              >{@render AlertCircle()}Backlog</NavigationMenuLink
            >
            <NavigationMenuLink href="#navigation-menu-review" class="flex-row items-center gap-2"
              >{@render CircleDashed()}To Do</NavigationMenuLink
            >
            <NavigationMenuLink href="#navigation-menu-review" class="flex-row items-center gap-2"
              >{@render CircleCheck()}Done</NavigationMenuLink
            >
          </li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink href="https://starwind.dev/docs/" class={navigationMenuTriggerStyle()}
        >Docs</NavigationMenuLink
      >
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
