<script setup lang="ts">
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./starwind-runtime/navigation-menu";

const gettingStarted = [
  {
    title: "Introduction",
    href: "/docs/getting-started/introduction/",
    description: "Reusable components built with Tailwind CSS.",
  },
  {
    title: "Installation",
    href: "/docs/getting-started/installation/",
    description: "How to install dependencies and structure your app.",
  },
  {
    title: "Theming",
    href: "/docs/getting-started/theming/",
    description: "Customize colors, typography, and design tokens.",
  },
];
const components = [
  {
    title: "Alert Dialog",
    href: "/docs/components/alert-dialog/",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "/docs/components/hover-card/",
    description: "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "/docs/components/progress/",
    description: "Displays an indicator showing the completion progress of a task.",
  },
  {
    title: "Scroll Area",
    href: "/docs/components/scroll-area/",
    description: "Augments native scroll functionality for custom, cross-browser styling.",
  },
  {
    title: "Tabs",
    href: "/docs/components/tabs/",
    description: "A set of layered sections of content displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "/docs/components/tooltip/",
    description: "A popup that provides information when an element is focused or hovered.",
  },
];
</script>

<template>
  <NavigationMenu size="md" aria-label="Documentation navigation">
    <NavigationMenuList>
      <NavigationMenuItem value="getting-started">
        <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
        <NavigationMenuContent data-testid="docs-navigation-getting-started">
          <ul class="w-108">
            <li v-for="item in gettingStarted" :key="item.href">
              <NavigationMenuLink :href="`https://starwind.dev${item.href}`">
                <div class="flex flex-col gap-1.5">
                  <div class="leading-none font-medium">{{ item.title }}</div>
                  <div class="text-muted-foreground line-clamp-2">{{ item.description }}</div>
                </div>
              </NavigationMenuLink>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem value="components" class="hidden md:flex">
        <NavigationMenuTrigger>Components</NavigationMenuTrigger>
        <NavigationMenuContent data-testid="docs-navigation-components">
          <ul class="grid w-[500px] gap-2 md:w-[600px] md:grid-cols-2 lg:w-[700px]">
            <li v-for="component in components" :key="component.href">
              <NavigationMenuLink :href="`https://starwind.dev${component.href}`">
                <div class="flex flex-col gap-1.5">
                  <div class="leading-none font-medium">{{ component.title }}</div>
                  <div class="text-muted-foreground line-clamp-2">{{ component.description }}</div>
                </div>
              </NavigationMenuLink>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem value="status">
        <NavigationMenuTrigger>With icon</NavigationMenuTrigger>
        <NavigationMenuContent data-testid="docs-navigation-status">
          <ul class="grid w-[240px]">
            <li>
              <NavigationMenuLink href="#backlog" class="flex-row items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4m0 4h.01" />
                </svg>
                Backlog
              </NavigationMenuLink>
              <NavigationMenuLink href="#to-do" class="flex-row items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M8.56 3.69a9 9 0 0 1 6.88 0m4.87 4.87a9 9 0 0 1 0 6.88m-4.87 4.87a9 9 0 0 1-6.88 0m-4.87-4.87a9 9 0 0 1 0-6.88m12.81-3.92.01.01m2.12 2.12.01.01m0 11.22-.01.01m-2.12 2.12-.01.01m-11.22 0-.01-.01m-2.12-2.12-.01-.01m0-11.22.01-.01m2.12-2.12.01-.01"
                  />
                </svg>
                To Do
              </NavigationMenuLink>
              <NavigationMenuLink href="#done" class="flex-row items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                Done
              </NavigationMenuLink>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink href="https://starwind.dev/docs/" :class="navigationMenuTriggerStyle()"
          >Docs</NavigationMenuLink
        >
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>
