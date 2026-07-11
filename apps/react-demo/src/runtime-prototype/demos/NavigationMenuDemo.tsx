import { useState } from "react";

import {
  Button,
  IconAlertCircle,
  IconCircleCheck,
  IconCircleDashed,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "../kit";

const productLinks = [
  {
    href: "/",
    title: "Runtime prototype",
    description: "Generated Astro and React components backed by the shared runtime.",
  },
  {
    href: "/pages/runtime-sidebar-demo",
    title: "Sidebar demo",
    description: "A full application shell using the runtime sidebar primitive.",
  },
];
const resourceLinks = [
  {
    href: "/",
    title: "Primitive docs",
    description: "Raw data-sw-* anatomy, framework adapters, and styled wrappers.",
  },
  {
    href: "/pages/runtime-nested-sidebar",
    title: "Nested sidebar",
    description: "A deeper layout for validating runtime composition.",
  },
];
const featureLinks = [
  {
    href: "/",
    title: "Contracts",
    description: "Adapter metadata, anatomy, and generator inputs.",
  },
  {
    href: "/",
    title: "Styled kit",
    description: "Editable components generated for app projects.",
  },
  {
    href: "/",
    title: "Primitive APIs",
    description: "Framework adapters backed by shared browser behavior.",
  },
];
const companyLinks = [
  {
    href: "/",
    title: "About",
  },
  {
    href: "/",
    title: "Customers",
  },
  {
    href: "/",
    title: "Roadmap",
  },
  {
    href: "/",
    title: "Contact",
  },
];

const gettingStartedLinks = [
  {
    href: "#introduction",
    title: "Introduction",
    description: "Re-usable components built with Tailwind CSS.",
  },
  {
    href: "#installation",
    title: "Installation",
    description: "How to install dependencies and structure your app.",
  },
  {
    href: "#typography",
    title: "Typography",
    description: "Styles for headings, paragraphs, lists...etc",
  },
];

const shadcnComponentLinks = [
  {
    title: "Alert Dialog",
    href: "#alert-dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "#hover-card",
    description: "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "#progress",
    description:
      "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
  {
    title: "Scroll-area",
    href: "#scroll-area",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "#tabs",
    description:
      "A set of layered sections of content, known as tab panels, that are displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "#tooltip",
    description:
      "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
];

function hasDescription(item: unknown): item is { description: string } {
  return (
    typeof item === "object" &&
    item !== null &&
    "description" in item &&
    typeof (item as { description?: unknown }).description === "string"
  );
}

export function NavigationMenuDemo() {
  const [controlledValue, setControlledValue] = useState<string | null>("suite");

  return (
    <section className="space-y-8">
      <h2 className="font-heading text-xl font-semibold">Navigation Menu</h2>

      <div className="space-y-3">
        <h3 className="font-heading text-lg font-semibold">Shadcn-style docs navigation</h3>
        <NavigationMenu
          id="react-runtime-navigation-menu-shadcn-style"
          aria-label="Documentation navigation"
        >
          <NavigationMenuList>
            <NavigationMenuItem value="getting-started">
              <NavigationMenuTrigger id="react-runtime-navigation-menu-getting-started-trigger">
                Getting started
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="w-96">
                  {gettingStartedLinks.map((item) => (
                    <li key={item.title}>
                      <NavigationMenuLink href={item.href}>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="leading-none font-medium">{item.title}</div>
                          <div className="text-muted-foreground line-clamp-2">
                            {item.description}
                          </div>
                        </div>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem value="components" className="hidden md:flex">
              <NavigationMenuTrigger id="react-runtime-navigation-menu-components-trigger">
                Components
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {shadcnComponentLinks.map((item) => (
                    <li key={item.title}>
                      <NavigationMenuLink href={item.href}>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="leading-none font-medium">{item.title}</div>
                          <div className="text-muted-foreground line-clamp-2">
                            {item.description}
                          </div>
                        </div>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem value="with-icon">
              <NavigationMenuTrigger id="react-runtime-navigation-menu-with-icon-trigger">
                With Icon
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[200px]">
                  <li>
                    <NavigationMenuLink href="#backlog" className="flex-row items-center gap-2">
                      <IconAlertCircle />
                      Backlog
                    </NavigationMenuLink>
                    <NavigationMenuLink href="#to-do" className="flex-row items-center gap-2">
                      <IconCircleDashed />
                      To Do
                    </NavigationMenuLink>
                    <NavigationMenuLink href="#done" className="flex-row items-center gap-2">
                      <IconCircleCheck />
                      Done
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink href="#docs" className={navigationMenuTriggerStyle()}>
                Docs
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="space-y-3">
        <h3 className="font-heading text-lg font-semibold">Shared viewport</h3>
        <NavigationMenu id="react-runtime-navigation-menu" aria-label="Runtime navigation">
          <NavigationMenuList>
            <NavigationMenuItem value="products">
              <NavigationMenuTrigger id="react-runtime-navigation-menu-products-trigger">
                Products
              </NavigationMenuTrigger>
              <NavigationMenuContent className="w-[28rem]">
                <div className="grid gap-2 p-2 md:grid-cols-2">
                  {productLinks.map((item) => (
                    <NavigationMenuLink key={item.title} href={item.href}>
                      <div className="font-medium">{item.title}</div>
                      <p className="text-muted-foreground text-sm leading-snug">
                        {item.description}
                      </p>
                    </NavigationMenuLink>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem value="resources">
              <NavigationMenuTrigger id="react-runtime-navigation-menu-resources-trigger">
                Resources
              </NavigationMenuTrigger>
              <NavigationMenuContent className="w-[30rem]">
                <div className="grid gap-2 p-2 md:grid-cols-2">
                  {resourceLinks.map((item) => (
                    <NavigationMenuLink key={item.title} href={item.href}>
                      <div className="font-medium">{item.title}</div>
                      <p className="text-muted-foreground text-sm leading-snug">
                        {item.description}
                      </p>
                    </NavigationMenuLink>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink href="/" active>
                Overview
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="space-y-3">
        <h3 className="font-heading text-lg font-semibold">Large panel</h3>
        <NavigationMenu
          id="react-runtime-navigation-menu-large"
          aria-label="Large navigation panel"
        >
          <NavigationMenuList>
            <NavigationMenuItem value="platform">
              <NavigationMenuTrigger id="react-runtime-navigation-menu-platform-trigger">
                Platform
              </NavigationMenuTrigger>
              <NavigationMenuContent className="w-[44rem] max-w-[calc(100vw-2rem)]">
                <div className="grid gap-2 p-3 md:grid-cols-2">
                  {[...productLinks, ...featureLinks].map((item) => (
                    <NavigationMenuLink key={item.title} href="#platform">
                      <div className="font-medium">{item.title}</div>
                      <p className="text-muted-foreground text-sm leading-snug">
                        {item.description}
                      </p>
                    </NavigationMenuLink>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem value="solutions">
              <NavigationMenuTrigger id="react-runtime-navigation-menu-solutions-trigger">
                Solutions
              </NavigationMenuTrigger>
              <NavigationMenuContent className="w-[36rem] max-w-[calc(100vw-2rem)]">
                <div className="grid gap-2 p-3 md:grid-cols-2">
                  {[...resourceLinks, ...companyLinks].map((item) => (
                    <NavigationMenuLink key={item.title} href="#solutions">
                      <div className="font-medium">{item.title}</div>
                      {hasDescription(item) && (
                        <p className="text-muted-foreground text-sm leading-snug">
                          {item.description}
                        </p>
                      )}
                    </NavigationMenuLink>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-heading text-lg font-semibold">Default value and links</h3>
          <NavigationMenu
            id="react-runtime-navigation-menu-default-value"
            aria-label="Default navigation value"
            defaultValue="docs"
          >
            <NavigationMenuList>
              <NavigationMenuItem value="docs">
                <NavigationMenuTrigger id="react-runtime-navigation-menu-docs-trigger">
                  Docs
                </NavigationMenuTrigger>
                <NavigationMenuContent className="w-[26rem]">
                  <div className="space-y-2 p-2">
                    <NavigationMenuLink href="#docs-home" active>
                      <div className="font-medium">Docs home</div>
                      <p className="text-muted-foreground text-sm leading-snug">
                        Guides, API notes, and migration references in one place.
                      </p>
                    </NavigationMenuLink>
                    <NavigationMenuLink href="#docs-preview" closeOnClick={false}>
                      <div className="font-medium">Persistent preview</div>
                      <p className="text-muted-foreground text-sm leading-snug">
                        Draft pages and interactive previews for runtime releases.
                      </p>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem value="examples">
                <NavigationMenuTrigger id="react-runtime-navigation-menu-examples-trigger">
                  Examples
                </NavigationMenuTrigger>
                <NavigationMenuContent className="w-[22rem]">
                  <div className="space-y-2 p-2">
                    {featureLinks.slice(0, 2).map((item) => (
                      <NavigationMenuLink key={item.title} href="#examples">
                        <div className="font-medium">{item.title}</div>
                        <p className="text-muted-foreground text-sm leading-snug">
                          {item.description}
                        </p>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading mr-2 text-lg font-semibold">Controlled value</h3>
            <Button
              size="sm"
              variant={controlledValue === "suite" ? "default" : "outline"}
              onClick={() => setControlledValue("suite")}
            >
              Suite
            </Button>
            <Button
              size="sm"
              variant={controlledValue === "teams" ? "default" : "outline"}
              onClick={() => setControlledValue("teams")}
            >
              Teams
            </Button>
            <Button size="sm" variant="outline" onClick={() => setControlledValue(null)}>
              Closed
            </Button>
          </div>
          <NavigationMenu
            id="react-runtime-navigation-menu-controlled-value"
            aria-label="Controlled navigation value"
            value={controlledValue}
            onValueChange={(nextValue) => setControlledValue(nextValue)}
          >
            <NavigationMenuList>
              <NavigationMenuItem value="suite">
                <NavigationMenuTrigger id="react-runtime-navigation-menu-suite-trigger">
                  Suite
                </NavigationMenuTrigger>
                <NavigationMenuContent className="w-[24rem]">
                  <div className="space-y-2 p-2">
                    {productLinks.map((item) => (
                      <NavigationMenuLink key={item.title} href="#suite">
                        <div className="font-medium">{item.title}</div>
                        <p className="text-muted-foreground text-sm leading-snug">
                          {item.description}
                        </p>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem value="teams">
                <NavigationMenuTrigger id="react-runtime-navigation-menu-teams-trigger">
                  Teams
                </NavigationMenuTrigger>
                <NavigationMenuContent className="w-[20rem]">
                  <div className="space-y-1 p-2">
                    {companyLinks.slice(0, 3).map((item) => (
                      <NavigationMenuLink key={item.title} href="#teams">
                        <div className="font-medium">{item.title}</div>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-heading text-lg font-semibold">Hover timing</h3>
        <NavigationMenu
          id="react-runtime-navigation-menu-timing"
          aria-label="Navigation timing"
          openDelay={250}
          closeDelay={300}
        >
          <NavigationMenuList>
            <NavigationMenuItem value="delayed">
              <NavigationMenuTrigger id="react-runtime-navigation-menu-delayed-trigger">
                Delayed
              </NavigationMenuTrigger>
              <NavigationMenuContent className="w-[22rem]">
                <div className="space-y-2 p-2">
                  {featureLinks.slice(0, 2).map((item) => (
                    <NavigationMenuLink key={item.title} href={item.href}>
                      <div className="font-medium">{item.title}</div>
                      <p className="text-muted-foreground text-sm leading-snug">
                        {item.description}
                      </p>
                    </NavigationMenuLink>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem value="instant">
              <NavigationMenuTrigger
                id="react-runtime-navigation-menu-instant-trigger"
                openDelay={0}
                closeDelay={0}
              >
                Instant
              </NavigationMenuTrigger>
              <NavigationMenuContent className="w-[24rem]">
                <div className="space-y-2 p-2">
                  {featureLinks.map((item) => (
                    <NavigationMenuLink key={item.title} href={item.href}>
                      <div className="font-medium">{item.title}</div>
                      <p className="text-muted-foreground text-sm leading-snug">
                        {item.description}
                      </p>
                    </NavigationMenuLink>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-heading text-lg font-semibold">Composition</h3>
          <NavigationMenu
            id="react-runtime-navigation-menu-composition"
            aria-label="Composed navigation controls"
          >
            <NavigationMenuList>
              <NavigationMenuItem value="custom-trigger">
                <NavigationMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Custom trigger
                  </Button>
                </NavigationMenuTrigger>
                <NavigationMenuContent className="w-[24rem]">
                  <div className="space-y-2 p-2">
                    {featureLinks.slice(0, 2).map((item) => (
                      <NavigationMenuLink key={item.title} href="#composition">
                        <div className="font-medium">{item.title}</div>
                        <p className="text-muted-foreground text-sm leading-snug">
                          {item.description}
                        </p>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem value="disabled-trigger">
                <NavigationMenuTrigger disabled>Disabled</NavigationMenuTrigger>
                <NavigationMenuContent className="w-[18rem]">
                  <div className="space-y-2 p-2">
                    <NavigationMenuLink href="#disabled">
                      <div className="font-medium">Unavailable</div>
                      <p className="text-muted-foreground text-sm leading-snug">
                        Planned releases and draft pages stay hidden.
                      </p>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-lg font-semibold">Vertical orientation</h3>
          <NavigationMenu
            id="react-runtime-navigation-menu-vertical"
            aria-label="Vertical navigation"
            orientation="vertical"
            side="right"
            align="start"
          >
            <NavigationMenuList>
              <NavigationMenuItem value="libraries">
                <NavigationMenuTrigger id="react-runtime-navigation-menu-libraries-trigger">
                  Libraries
                </NavigationMenuTrigger>
                <NavigationMenuContent className="w-[24rem]">
                  <div className="space-y-2 p-2">
                    {productLinks.map((item) => (
                      <NavigationMenuLink key={item.title} href="#libraries">
                        <div className="font-medium">{item.title}</div>
                        <p className="text-muted-foreground text-sm leading-snug">
                          {item.description}
                        </p>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem value="support">
                <NavigationMenuTrigger id="react-runtime-navigation-menu-support-trigger">
                  Support
                </NavigationMenuTrigger>
                <NavigationMenuContent className="w-[20rem]">
                  <div className="space-y-1 p-2">
                    {companyLinks.slice(0, 3).map((item) => (
                      <NavigationMenuLink key={item.title} href="#support">
                        <div className="font-medium">{item.title}</div>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-heading text-lg font-semibold">Placement</h3>
        <NavigationMenu
          id="react-runtime-navigation-menu-placement"
          aria-label="Navigation placement"
          side="right"
          align="start"
          sideOffset={8}
        >
          <NavigationMenuList>
            <NavigationMenuItem value="features">
              <NavigationMenuTrigger id="react-runtime-navigation-menu-features-trigger">
                Features
              </NavigationMenuTrigger>
              <NavigationMenuContent className="w-[26rem]">
                <div className="space-y-2 p-2">
                  {featureLinks.map((item) => (
                    <NavigationMenuLink key={item.title} href={item.href}>
                      <div className="font-medium">{item.title}</div>
                      <p className="text-muted-foreground text-sm leading-snug">
                        {item.description}
                      </p>
                    </NavigationMenuLink>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem value="company">
              <NavigationMenuTrigger id="react-runtime-navigation-menu-company-trigger">
                Company
              </NavigationMenuTrigger>
              <NavigationMenuContent className="w-[14rem]">
                <div className="space-y-1 p-2">
                  {companyLinks.map((item) => (
                    <NavigationMenuLink key={item.title} href={item.href}>
                      <div className="font-medium">{item.title}</div>
                    </NavigationMenuLink>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </section>
  );
}
