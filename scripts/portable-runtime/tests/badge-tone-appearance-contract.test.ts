import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { badgeStyledContract } from "../contracts/styled/components/badge.js";

type TailwindVariantsFactory = (config: unknown) => (props?: Record<string, unknown>) => string;

const demoRequire = createRequire(new URL("../../../apps/demo/package.json", import.meta.url));
const { tv } = demoRequire("tailwind-variants") as { tv: TailwindVariantsFactory };
const badgeDefinition = badgeStyledContract.variants?.badge;

if (!badgeDefinition) {
  throw new Error("Badge styled contract is missing its badge variant definition.");
}

const badge = tv(badgeDefinition as Parameters<typeof tv>[0]);
const supportedTones = [
  "neutral",
  "primary",
  "primary-accent",
  "secondary",
  "secondary-accent",
  "info",
  "success",
  "warning",
  "error",
] as const;
const supportedAppearances = ["solid", "soft", "outline", "text", "frosted"] as const;

describe("Badge tone and appearance styled contract", () => {
  it("keeps internal link styling out of generated public Badge props", () => {
    const variantProps = badgeStyledContract.components[0]?.props?.extends?.find(
      (entry) => entry.type === "variantProps" && entry.variant === "badge",
    );
    const astroSource = readFileSync(
      "apps/demo/src/components/starwind-runtime/badge/Badge.astro",
      "utf8",
    );
    const reactSource = readFileSync(
      "apps/react-demo/src/components/starwind-runtime/badge/Badge.tsx",
      "utf8",
    );

    expect(variantProps).toMatchObject({ omit: ["isLink"] });
    expect(astroSource).toContain('Omit<VariantProps<typeof badge>, "isLink">');
    expect(reactSource).toContain('Omit<VariantProps<typeof badge>, "isLink">');
    expect(astroSource).toContain("isLink: Boolean(rest.href)");
    expect(reactSource).toContain("isLink: Boolean(rest.href)");
  });

  it("defines the composed tone and chrome appearance axes", () => {
    expect(Object.keys(badgeDefinition.variants?.tone ?? {})).toEqual([...supportedTones]);
    expect(Object.keys(badgeDefinition.variants?.appearance ?? {})).toEqual([
      ...supportedAppearances,
    ]);
  });

  it("keeps legacy Badge variant recipes available without composed styling", () => {
    expect(renderBadge()).toContain("bg-foreground text-background");

    const legacyVariants = {
      default: "bg-foreground text-background",
      primary: "bg-primary text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      outline: "border-border focus-visible:border-outline",
      ghost: "bg-foreground/10 text-foreground",
      info: "bg-info text-info-foreground",
      success: "bg-success text-success-foreground",
      warning: "bg-warning text-warning-foreground",
      error: "bg-error text-error-foreground",
    };

    for (const [variant, className] of Object.entries(legacyVariants)) {
      expect(renderBadge({ variant })).toContain(className);
    }
  });

  it("supports solid, soft, and outline recipes for every composed tone", () => {
    const expectedClassByAppearanceAndTone = {
      solid: {
        neutral: "bg-foreground text-background",
        primary: "bg-primary text-primary-foreground",
        "primary-accent": "bg-primary-accent text-background",
        secondary: "bg-secondary text-secondary-foreground",
        "secondary-accent": "bg-secondary-accent text-background",
        info: "bg-info text-info-foreground",
        success: "bg-success text-success-foreground",
        warning: "bg-warning text-warning-foreground",
        error: "bg-error text-error-foreground",
      },
      soft: {
        neutral: "bg-foreground/10 text-foreground",
        primary: "bg-primary/10 text-foreground",
        "primary-accent": "bg-primary-accent/10 text-primary-accent",
        secondary: "bg-secondary/10 text-foreground",
        "secondary-accent": "bg-secondary-accent/10 text-secondary-accent",
        info: "bg-info/10 text-foreground",
        success: "bg-success/10 text-foreground",
        warning: "bg-warning/10 text-foreground",
        error: "bg-error/10 text-foreground",
      },
      outline: {
        neutral: "border-border text-foreground",
        primary: "border-primary text-foreground",
        "primary-accent": "border-primary-accent text-primary-accent",
        secondary: "border-secondary text-secondary-foreground",
        "secondary-accent": "border-secondary-accent text-secondary-accent",
        info: "border-info text-foreground",
        success: "border-success text-foreground",
        warning: "border-warning text-foreground",
        error: "border-error text-foreground",
      },
      text: {
        neutral: "text-foreground",
        primary: "text-primary",
        "primary-accent": "text-primary-accent",
        secondary: "text-secondary-foreground",
        "secondary-accent": "text-secondary-accent",
        info: "text-info",
        success: "text-success",
        warning: "text-warning",
        error: "text-error",
      },
      frosted: {
        neutral: "border-border/60 text-foreground",
        primary: "border-primary/40 text-foreground",
        "primary-accent": "border-primary-accent/40 text-primary-accent",
        secondary: "border-secondary/60 text-secondary-foreground",
        "secondary-accent": "border-secondary-accent/40 text-secondary-accent",
        info: "border-info/40 text-foreground",
        success: "border-success/40 text-foreground",
        warning: "border-warning/40 text-foreground",
        error: "border-error/40 text-foreground",
      },
    } satisfies Record<
      (typeof supportedAppearances)[number],
      Record<(typeof supportedTones)[number], string>
    >;

    for (const appearance of supportedAppearances) {
      for (const tone of supportedTones) {
        expect(renderBadge({ variant: null, tone, appearance })).toContain(
          expectedClassByAppearanceAndTone[appearance][tone],
        );
      }
    }
  });

  it("lets composed soft accent styling win over a legacy variant", () => {
    const className = renderBadgeThroughWrapperProps({
      variant: "primary",
      tone: "primary-accent",
    });

    expect(className).toContain("bg-primary-accent/10 text-primary-accent");
    expect(className).not.toContain("bg-primary text-primary-foreground");
  });

  it("uses neutral text styling by default and removes badge chrome without dropping size text", () => {
    const className = renderBadgeThroughWrapperProps({ appearance: "text", size: "lg" });

    expect(className).toContain("text-foreground");
    expect(className).toContain("text-base");
    expect(className).toContain("rounded-none border-0 bg-transparent p-0 shadow-none");
    expect(className).not.toContain("bg-foreground/10");
    expect(className).not.toContain("rounded-full");
    expect(className).not.toContain("px-4");
    expect(className).not.toContain("py-1");
  });

  it("adds only uppercase and tracking classes for eyebrow", () => {
    for (const appearance of supportedAppearances) {
      const regularClasses = classSet(
        renderBadge({ variant: null, tone: "primary-accent", appearance }),
      );
      const eyebrowClasses = classSet(
        renderBadge({ variant: null, tone: "primary-accent", appearance, eyebrow: true }),
      );
      const addedClasses = [...eyebrowClasses].filter(
        (className) => !regularClasses.has(className),
      );

      expect(addedClasses.sort()).toEqual(["tracking-wider", "uppercase"]);
    }
  });

  it("uses translucent frosted chrome while retaining link, size, and icon affordances", () => {
    const className = renderBadgeThroughWrapperProps({
      tone: "primary-accent",
      appearance: "frosted",
      size: "lg",
      href: "/",
    });

    expect(className).toContain("border bg-background/80 shadow-sm backdrop-blur-sm");
    expect(className).toContain("border-primary-accent/40 text-primary-accent");
    expect(className).toContain("text-base");
    expect(className).toContain("[&_svg:not([class*='size-'])]:size-4.5");
    expect(className).toContain("cursor-pointer");
    expect(className).toContain("hover:bg-background/90");
  });

  it("adds composed link hover states that preserve the selected appearance", () => {
    expect(
      renderBadgeThroughWrapperProps({
        appearance: "solid",
        href: "/",
        tone: "primary-accent",
      }),
    ).toContain("hover:bg-primary-accent/80");

    const softSecondary = renderBadgeThroughWrapperProps({
      appearance: "soft",
      href: "/",
      tone: "secondary",
    });

    expect(softSecondary).toContain("bg-secondary/10 text-foreground");
    expect(softSecondary).toContain("hover:bg-secondary/20");

    expect(
      renderBadgeThroughWrapperProps({
        appearance: "outline",
        href: "/",
        tone: "info",
      }),
    ).toContain("hover:bg-info/10");

    const textPrimary = renderBadgeThroughWrapperProps({
      appearance: "text",
      href: "/",
      tone: "primary",
    });

    expect(textPrimary).toContain("hover:underline");
    expect(textPrimary).toContain("underline-offset-4");

    expect(renderBadge({ appearance: "outline", tone: "info", variant: null })).not.toContain(
      "hover:bg-info/10",
    );
  });
});

function renderBadge(props?: Record<string, unknown>): string {
  return badge(props);
}

function renderBadgeThroughWrapperProps(props: Record<string, unknown>): string {
  const usesComposedBadgeStyle = props.tone !== undefined || props.appearance !== undefined;

  return renderBadge({
    variant: usesComposedBadgeStyle ? null : props.variant,
    tone: usesComposedBadgeStyle ? (props.tone ?? "neutral") : undefined,
    appearance: usesComposedBadgeStyle ? (props.appearance ?? "soft") : undefined,
    size: props.size,
    isLink: Boolean(props.href),
  });
}

function classSet(className: string): Set<string> {
  return new Set(className.split(/\s+/).filter(Boolean));
}
