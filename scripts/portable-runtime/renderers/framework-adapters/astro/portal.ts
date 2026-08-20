import type {
  FrameworkAdapterTargetRenderedPortalCapability,
  FrameworkAdapterTargetRenderedPortalFacts,
  FrameworkAdapterTargetRenderedPortalPolicy,
} from "../types.js";

export function printAstroRuntimePortal(
  part: { defaultElement: string },
  discoveryAttribute: string,
): string {
  return `---
import type { HTMLAttributes } from "astro/types";

interface Props extends HTMLAttributes<"${part.defaultElement}"> {
  container?: string;
  disabled?: boolean;
}

const { container, disabled = false, ...rest } = Astro.props;
---

<${part.defaultElement}
  ${discoveryAttribute}
  data-container={container}
  data-disabled={disabled ? "" : undefined}
  data-sw-portal-placement="runtime"
  data-placement="pending"
  {...rest}
>
  <slot />
</${part.defaultElement}>
`;
}

export const astroRenderedPortalCapability = {
  async inspect({ family, policy, readSource, renderedComponent }) {
    const source = await readSource(`${family}/${renderedComponent}.astro`);
    const frontmatterEnd = source.lastIndexOf("---");
    const template = frontmatterEnd >= 0 ? source.slice(frontmatterEnd + 3) : source;
    const openingTag = parseAstroPortalOpeningTag(template, family);
    const facts: FrameworkAdapterTargetRenderedPortalFacts = {
      defaultElement: openingTag.element,
      runtimeHooks: policy.runtimeHooks.filter((hook) =>
        parseAstroRuntimeHooks(openingTag.source).includes(hook),
      ),
      placement: parseAstroPortalPlacement(openingTag.source, family),
    };
    assertAstroRenderedPortal(facts, family, policy);
    return facts;
  },
  assert: assertAstroRenderedPortal,
} satisfies FrameworkAdapterTargetRenderedPortalCapability;

function assertAstroRenderedPortal(
  facts: FrameworkAdapterTargetRenderedPortalFacts,
  family: string,
  policy: FrameworkAdapterTargetRenderedPortalPolicy,
): void {
  if (facts.defaultElement !== policy.defaultElement) {
    throw new Error(
      `astro ${family} rendered Portal wrapper uses ${facts.defaultElement} instead of ${policy.defaultElement}.`,
    );
  }
  for (const hook of policy.runtimeHooks) {
    if (!facts.runtimeHooks.includes(hook)) {
      throw new Error(`astro ${family} rendered Portal wrapper is missing runtime hook ${hook}.`);
    }
  }
  if (facts.placement !== "runtime") {
    throw new Error(
      `astro ${family} rendered Portal wrapper uses ${facts.placement} placement instead of runtime.`,
    );
  }
  if (facts.nativeHelper !== undefined || facts.placementWiring !== undefined) {
    throw new Error(`astro ${family} rendered Portal wrapper has unexpected native helper wiring.`);
  }
}

function parseAstroPortalOpeningTag(source: string, family: string) {
  const match = source.match(/<([a-z][a-z0-9-]*)\b([\s\S]*?)>/);
  if (!match) {
    throw new Error(`astro ${family} rendered Portal wrapper is missing its native element.`);
  }
  return { element: match[1]!, source: match[0] };
}

function parseAstroRuntimeHooks(openingTag: string): string[] {
  return [
    ...new Set(
      [...openingTag.matchAll(/\b(data-sw-[a-z0-9-]+)(?=[\s=>])/g)].map((match) => match[1]!),
    ),
  ];
}

function parseAstroPortalPlacement(openingTag: string, family: string): "runtime" {
  const placement = openingTag.match(/data-sw-portal-placement=["']([^"']+)["']/)?.[1];
  if (placement !== "runtime") {
    if (!placement) {
      throw new Error(
        `astro ${family} rendered Portal wrapper is missing runtime hook data-sw-portal-placement.`,
      );
    }
    throw new Error(
      `astro ${family} rendered Portal wrapper uses ${placement} placement instead of runtime.`,
    );
  }
  return placement;
}
