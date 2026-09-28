import type {
  FrameworkAdapterTargetRenderedPortalCapability,
  FrameworkAdapterTargetRenderedPortalFacts,
  FrameworkAdapterTargetRenderedPortalPolicy,
} from "../types.js";

export const svelteRenderedPortalCapability = {
  async inspect({ family, policy, readSource, renderedComponent }) {
    const source = await readSource(`${family}/${renderedComponent}.svelte`);
    const template = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
    const openingTag = parseSveltePortalOpeningTag(template, family);
    const facts: FrameworkAdapterTargetRenderedPortalFacts = {
      defaultElement: openingTag.element,
      runtimeHooks: policy.runtimeHooks.filter((hook) =>
        parseSvelteRuntimeHooks(openingTag.source).includes(hook),
      ),
      placement: parseSveltePortalPlacement(openingTag.source, family),
    };
    assertSvelteRenderedPortal(facts, family, policy);
    return facts;
  },
  assert: assertSvelteRenderedPortal,
} satisfies FrameworkAdapterTargetRenderedPortalCapability;

function assertSvelteRenderedPortal(
  facts: FrameworkAdapterTargetRenderedPortalFacts,
  family: string,
  policy: FrameworkAdapterTargetRenderedPortalPolicy,
): void {
  if (facts.defaultElement !== policy.defaultElement) {
    throw new Error(
      `svelte ${family} rendered Portal wrapper uses ${facts.defaultElement} instead of ${policy.defaultElement}.`,
    );
  }
  for (const hook of policy.runtimeHooks) {
    if (!facts.runtimeHooks.includes(hook)) {
      throw new Error(`svelte ${family} rendered Portal wrapper is missing runtime hook ${hook}.`);
    }
  }
  if (facts.placement !== "framework") {
    throw new Error(
      `svelte ${family} rendered Portal wrapper uses ${facts.placement} placement instead of framework.`,
    );
  }
  if (facts.nativeHelper !== undefined || facts.placementWiring !== undefined) {
    throw new Error(
      `svelte ${family} rendered Portal wrapper has unexpected native helper wiring.`,
    );
  }
}

function parseSveltePortalOpeningTag(source: string, family: string) {
  const match = source.match(/<([a-z][a-z0-9-]*)\b([\s\S]*?)>/);
  if (!match) {
    throw new Error(`svelte ${family} rendered Portal wrapper is missing its native element.`);
  }
  return { element: match[1]!, source: match[0] };
}

function parseSvelteRuntimeHooks(openingTag: string): string[] {
  return [
    ...new Set(
      [...openingTag.matchAll(/\b(data-sw-[a-z0-9-]+)(?=[\s=>])/g)].map((match) => match[1]!),
    ),
  ];
}

function parseSveltePortalPlacement(openingTag: string, family: string): "framework" {
  const placement = openingTag.match(/data-sw-portal-placement=["']([^"']+)["']/)?.[1];
  if (placement !== "framework") {
    if (!placement) {
      throw new Error(
        `svelte ${family} rendered Portal wrapper is missing runtime hook data-sw-portal-placement.`,
      );
    }
    throw new Error(
      `svelte ${family} rendered Portal wrapper uses ${placement} placement instead of framework.`,
    );
  }
  return placement;
}
