import { createTsHeader } from "../../shared.js";
import type {
  FrameworkAdapterTargetRenderedPortalCapability,
  FrameworkAdapterTargetRenderedPortalFacts,
  FrameworkAdapterTargetRenderedPortalPolicy,
} from "../types.js";

export function renderVuePortalHelper(generatedBy: string): string {
  return `${createTsHeader(generatedBy)}import {
  computed,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  shallowRef,
  watch,
  type ComputedRef,
  type Ref,
  type ShallowRef,
} from "vue";

type PortalTarget = string | HTMLElement;
const INLINE_TELEPORT_TARGET = "[data-sw-vue-inline-portal]";

type PortalPlacementRuntime = {
  reportPortalPlacement(
    wrapper: HTMLElement,
    placement: { ready: boolean; target: HTMLElement } | null,
  ): void;
  resolvePortalPlacement(
    wrapper: HTMLElement,
    options: {
      container?: Element | string | null;
      disabled?: boolean;
      mode: "framework";
      reference?: Element | null;
    },
  ): { target: HTMLElement };
};

export type UseVuePortalPlacementOptions = {
  active: () => boolean;
  container: () => PortalTarget | undefined;
  disabled: () => boolean;
  element: Ref<HTMLElement | null>;
  reference?: () => Element | null;
  runtime: PortalPlacementRuntime;
};

export type VuePortalPlacement = {
  disabled: ComputedRef<boolean>;
  ready: ShallowRef<boolean>;
  target: ShallowRef<PortalTarget>;
};

function acceptsTeleportTarget(wrapper: HTMLElement, target: HTMLElement): boolean {
  return (
    target.ownerDocument === wrapper.ownerDocument &&
    target !== wrapper &&
    !wrapper.contains(target)
  );
}

export function useVuePortalPlacement(
  options: UseVuePortalPlacementOptions,
): VuePortalPlacement {
  const ready = shallowRef(false);
  const target = shallowRef<PortalTarget>(INLINE_TELEPORT_TARGET);
  const hasAcceptedTarget = shallowRef(false);
  const disabled = computed(
    () => !options.active() || options.disabled() || !hasAcceptedTarget.value,
  );
  let disposed = false;
  let inlineReference: HTMLElement | null = null;
  let mounted = false;
  let observer: MutationObserver | undefined;
  let trackedWrapper: HTMLElement | null = null;

  function disconnectObserver(): void {
    observer?.disconnect();
    observer = undefined;
  }

  function getInlineReference(wrapper: HTMLElement): HTMLElement {
    const authoredRoot = options.reference?.();
    if (authoredRoot instanceof HTMLElement) return authoredRoot;
    if (trackedWrapper !== wrapper) {
      trackedWrapper = wrapper;
      inlineReference = wrapper.parentElement;
    }
    return inlineReference ?? wrapper.parentElement ?? wrapper.ownerDocument.body;
  }

  function observeOwnerDocument(wrapper: HTMLElement): void {
    disconnectObserver();
    if (!options.active() || options.disabled()) return;
    observer = new MutationObserver(() => {
      if (disposed || !options.active() || options.disabled()) return;
      const currentTarget = target.value;
      if (!currentTarget) return;
      const resolvedTarget = options.runtime.resolvePortalPlacement(wrapper, {
        container: options.container(),
        disabled: false,
        mode: "framework",
        reference: getInlineReference(wrapper),
      }).target;
      if (resolvedTarget !== currentTarget || wrapper.parentElement !== currentTarget) {
        void syncPlacement();
      }
    });
    observer.observe(wrapper.ownerDocument, { childList: true, subtree: true });
  }

  function targetChanged(wrapper: HTMLElement, placedTarget: HTMLElement): boolean {
    const resolvedTarget = options.runtime.resolvePortalPlacement(wrapper, {
      container: options.container(),
      disabled: false,
      mode: "framework",
      reference: getInlineReference(wrapper),
    }).target;
    return resolvedTarget !== placedTarget;
  }

  function syncPlacement(): void {
    const wrapper = options.element.value;
    if (!mounted || !wrapper) return;
    const reference = getInlineReference(wrapper);
    disconnectObserver();
    ready.value = false;
    hasAcceptedTarget.value = false;
    options.runtime.reportPortalPlacement(wrapper, null);

    const shouldTeleport = options.active() && !options.disabled();
    let nextTarget: HTMLElement | null = null;
    if (shouldTeleport) {
      nextTarget = options.runtime.resolvePortalPlacement(wrapper, {
        container: options.container(),
        disabled: false,
        mode: "framework",
        reference,
      }).target;
      if (!acceptsTeleportTarget(wrapper, nextTarget)) {
        const inlineTarget = wrapper.parentElement;
        if (!inlineTarget) return;
        wrapper.setAttribute("data-disabled", "");
        ready.value = true;
        observeOwnerDocument(wrapper);
        options.runtime.reportPortalPlacement(wrapper, { ready: true, target: inlineTarget });
        return;
      }
      target.value = nextTarget;
      hasAcceptedTarget.value = true;
      return;
    }

    const placedTarget = wrapper.parentElement;
    if (!placedTarget) return;
    wrapper.setAttribute("data-disabled", "");
    ready.value = true;
    options.runtime.reportPortalPlacement(wrapper, { ready: true, target: placedTarget });
  }

  onMounted(() => {
    mounted = true;
    syncPlacement();
  });
  onUpdated(() => {
    const wrapper = options.element.value;
    if (
      ready.value ||
      !wrapper ||
      (options.active() &&
        !options.disabled() &&
        (!hasAcceptedTarget.value || !target.value || wrapper.parentElement !== target.value))
    ) {
      return;
    }

    const placedTarget =
      options.active() && !options.disabled()
        ? target.value instanceof HTMLElement
          ? target.value
          : null
        : wrapper.parentElement;
    if (!placedTarget) return;
    if (options.active() && !options.disabled()) wrapper.removeAttribute("data-disabled");
    else wrapper.setAttribute("data-disabled", "");
    ready.value = true;
    if (options.active() && !options.disabled()) {
      observeOwnerDocument(wrapper);
      if (targetChanged(wrapper, placedTarget)) {
        syncPlacement();
        return;
      }
    }
    options.runtime.reportPortalPlacement(wrapper, { ready: true, target: placedTarget });
  });

  watch(
    [options.element, options.active, options.container, options.disabled],
    syncPlacement,
    { flush: "sync", immediate: true },
  );

  onBeforeUnmount(() => {
    disposed = true;
    mounted = false;
    disconnectObserver();
    const wrapper = options.element.value;
    if (wrapper) options.runtime.reportPortalPlacement(wrapper, null);
  });

  return { disabled, ready, target };
}
`;
}

export const vueRenderedPortalCapability = {
  async inspect({ family, policy, readSource, renderedComponent }) {
    const source = await readSource(`${family}/${renderedComponent}.vue`);
    const template = source.match(/<template>([\s\S]*?)<\/template>/)?.[1] ?? "";
    const openingTag = parseVuePortalOpeningTag(template, family);
    const facts: FrameworkAdapterTargetRenderedPortalFacts = {
      defaultElement: openingTag.element,
      runtimeHooks: policy.runtimeHooks.filter((hook) =>
        parseVueRuntimeHooks(openingTag.source).includes(hook),
      ),
      placement: parseVuePortalPlacement(openingTag.source, family),
    };
    assertVueRenderedPortal(facts, family, policy);
    return facts;
  },
  assert: assertVueRenderedPortal,
} satisfies FrameworkAdapterTargetRenderedPortalCapability;

function assertVueRenderedPortal(
  facts: FrameworkAdapterTargetRenderedPortalFacts,
  family: string,
  policy: FrameworkAdapterTargetRenderedPortalPolicy,
): void {
  if (facts.defaultElement !== policy.defaultElement) {
    throw new Error(
      `vue ${family} rendered Portal wrapper uses ${facts.defaultElement} instead of ${policy.defaultElement}.`,
    );
  }
  for (const hook of policy.runtimeHooks) {
    if (!facts.runtimeHooks.includes(hook)) {
      throw new Error(`vue ${family} rendered Portal wrapper is missing runtime hook ${hook}.`);
    }
  }
  if (facts.placement !== "framework") {
    throw new Error(
      `vue ${family} rendered Portal wrapper uses ${facts.placement} placement instead of framework.`,
    );
  }
  if (facts.nativeHelper !== undefined || facts.placementWiring !== undefined) {
    throw new Error(`vue ${family} rendered Portal wrapper has unexpected native helper wiring.`);
  }
}

function parseVuePortalOpeningTag(source: string, family: string) {
  const match = source.match(/<([a-z][a-z0-9-]*)\b([\s\S]*?)>/);
  if (!match) {
    throw new Error(`vue ${family} rendered Portal wrapper is missing its native element.`);
  }
  return { element: match[1]!, source: match[0] };
}

function parseVueRuntimeHooks(openingTag: string): string[] {
  return [
    ...new Set(
      [...openingTag.matchAll(/\b(data-sw-[a-z0-9-]+)(?=[\s=>])/g)].map((match) => match[1]!),
    ),
  ];
}

function parseVuePortalPlacement(openingTag: string, family: string): "framework" {
  const placement = openingTag.match(/data-sw-portal-placement=["']([^"']+)["']/)?.[1];
  if (placement !== "framework") {
    if (!placement) {
      throw new Error(
        `vue ${family} rendered Portal wrapper is missing runtime hook data-sw-portal-placement.`,
      );
    }
    throw new Error(
      `vue ${family} rendered Portal wrapper uses ${placement} placement instead of framework.`,
    );
  }
  return placement;
}
