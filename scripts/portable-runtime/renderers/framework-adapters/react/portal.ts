import type {
  FrameworkAdapterTargetRenderedPortalCapability,
  FrameworkAdapterTargetRenderedPortalFacts,
  FrameworkAdapterTargetRenderedPortalPolicy,
} from "../types.js";

export type ReactPortalComponentOptions = {
  componentName: string;
  discoveryAttribute: string;
  displayName: string;
  rootDiscoveryAttribute: string;
  runtimeImportSource: string;
};

export type ReactPortalRuntimeOwner = {
  factory: string;
  importSource: string;
};

export function printReactPortalComponent({
  componentName,
  discoveryAttribute,
  displayName,
  runtimeImportSource,
}: ReactPortalComponentOptions): string {
  return `import { reportPortalPlacement, resolvePortalPlacement } from "${runtimeImportSource}";
import * as React from "react";
import { ReactPortal, type ReactPortalProps } from "../internal/portal";

export type ${componentName}Props = ReactPortalProps;

const ${componentName} = React.forwardRef<HTMLDivElement, ${componentName}Props>(
  function ${componentName}(props, forwardedRef) {
    return (
      <ReactPortal
        discoveryAttribute="${discoveryAttribute}"
        reportPlacement={reportPortalPlacement}
        resolvePlacement={resolvePortalPlacement}
        ref={forwardedRef}
        {...props}
      />
    );
  },
);

${componentName}.displayName = "${displayName}.Portal";

export default ${componentName};
`;
}

export const reactRenderedPortalCapability = {
  async inspect({ family, policy, readSource, renderedComponent }) {
    const componentSource = await readSource(`${family}/${renderedComponent}.tsx`);
    const helperMatch = componentSource.match(
      /import\s*\{[\s\S]*?\b([A-Za-z0-9_$]+Portal)\b[\s\S]*?\}\s*from\s*["']\.\.\/internal\/portal["'];/,
    );
    const helperName = helperMatch?.[1];
    if (!helperName || !componentSource.includes(`<${helperName}`)) {
      throw new Error(`react ${family} rendered Portal wrapper is missing its native helper.`);
    }
    const publicHook = componentSource.match(/discoveryAttribute=["']([^"']+)["']/)?.[1];
    const placementWiring = {
      report: componentSource.match(/reportPlacement=\{([A-Za-z0-9_$]+)\}/)?.[1] ?? "",
      resolve: componentSource.match(/resolvePlacement=\{([A-Za-z0-9_$]+)\}/)?.[1] ?? "",
    };
    const helperSource = await readSource("internal/portal.tsx");
    const wrapperSource = helperSource.match(
      /const\s+wrapper\s*=\s*\(\s*(<[a-z][\s\S]*?)\n\s*\);/,
    )?.[1];
    if (!wrapperSource) {
      throw new Error(`react ${family} rendered Portal wrapper is missing its native element.`);
    }
    const openingTag = parseReactPortalOpeningTag(wrapperSource, family);
    const literalHooks = parseReactRuntimeHooks(openingTag.source);
    const hasPublicHookBinding = openingTag.source.includes('[discoveryAttribute]: ""');
    const renderedHooks = [
      ...(hasPublicHookBinding && publicHook ? [publicHook] : []),
      ...literalHooks,
    ];
    const facts: FrameworkAdapterTargetRenderedPortalFacts = {
      defaultElement: openingTag.element,
      nativeHelper: `internal/${helperName}`,
      placement: parseReactPortalPlacement(openingTag.source, family),
      placementWiring,
      runtimeHooks: policy.runtimeHooks.filter((hook) => renderedHooks.includes(hook)),
    };
    assertReactRenderedPortal(facts, family, policy);
    return facts;
  },
  assert: assertReactRenderedPortal,
} satisfies FrameworkAdapterTargetRenderedPortalCapability;

function assertReactRenderedPortal(
  facts: FrameworkAdapterTargetRenderedPortalFacts,
  family: string,
  policy: FrameworkAdapterTargetRenderedPortalPolicy,
): void {
  if (facts.defaultElement !== policy.defaultElement) {
    throw new Error(
      `react ${family} rendered Portal wrapper uses ${facts.defaultElement} instead of ${policy.defaultElement}.`,
    );
  }
  for (const hook of policy.runtimeHooks) {
    if (!facts.runtimeHooks.includes(hook)) {
      throw new Error(`react ${family} rendered Portal wrapper is missing runtime hook ${hook}.`);
    }
  }
  if (facts.placement !== "framework") {
    throw new Error(
      `react ${family} rendered Portal wrapper uses ${facts.placement} placement instead of framework.`,
    );
  }
  if (
    facts.nativeHelper !== "internal/ReactPortal" ||
    facts.placementWiring?.report !== "reportPortalPlacement" ||
    facts.placementWiring.resolve !== "resolvePortalPlacement"
  ) {
    throw new Error(`react ${family} rendered Portal wrapper has invalid placement wiring.`);
  }
}

function parseReactPortalOpeningTag(source: string, family: string) {
  const match = source.match(/<([a-z][a-z0-9-]*)\b([\s\S]*?)>/);
  if (!match) {
    throw new Error(`react ${family} rendered Portal wrapper is missing its native element.`);
  }
  return { element: match[1]!, source: match[0] };
}

function parseReactRuntimeHooks(openingTag: string): string[] {
  return [
    ...new Set(
      [...openingTag.matchAll(/\b(data-sw-[a-z0-9-]+)(?=[\s=>])/g)].map((match) => match[1]!),
    ),
  ];
}

function parseReactPortalPlacement(openingTag: string, family: string): "framework" {
  const placement = openingTag.match(/data-sw-portal-placement=["']([^"']+)["']/)?.[1];
  if (placement !== "framework") {
    if (!placement) {
      throw new Error(
        `react ${family} rendered Portal wrapper is missing runtime hook data-sw-portal-placement.`,
      );
    }
    throw new Error(
      `react ${family} rendered Portal wrapper uses ${placement} placement instead of framework.`,
    );
  }
  return placement;
}

export function addReactPortalScope(
  contents: string,
  runtimeFactory: string,
  portalOwner?: ReactPortalRuntimeOwner,
): string {
  const reactImport = 'import * as React from "react";';
  const rootRefPattern = /(\s+const rootRef = React\.useRef<[^;]+;\n)/;
  const factoryCall = `const instance = ${runtimeFactory}(root, {`;
  const portalRuntimeFactory = portalOwner?.factory ?? runtimeFactory;
  const refreshPortalSurface = `${portalRuntimeFactory.replace(/^create/, "refresh")}PortalSurface`;
  if (!contents.includes(reactImport) || !rootRefPattern.test(contents)) {
    throw new Error(`Cannot add React Portal scope support for ${runtimeFactory}.`);
  }

  let result = contents;
  if (portalOwner) {
    result = result.replace(
      reactImport,
      `import { createPortalBinding, ${refreshPortalSurface} } from "${portalOwner.importSource}";\n${reactImport}`,
    );
  } else {
    const runtimeImportEnd = result.indexOf(`} from "@starwind-ui/runtime/`);
    const runtimeImportStart = result.lastIndexOf("import {", runtimeImportEnd);
    if (runtimeImportStart < 0 || runtimeImportEnd < 0) {
      throw new Error(`Cannot find the ${runtimeFactory} Runtime import.`);
    }
    result = `${result.slice(0, runtimeImportStart + "import {".length)}\n  createPortalBinding,\n  ${refreshPortalSurface},${result.slice(runtimeImportStart + "import {".length)}`;
  }
  const usesLazyRuntime = contents.includes("const ensureInstance = React.useCallback");
  const portalImports = usesLazyRuntime
    ? "ReactPortalScopeProvider, useReactPortalScope"
    : "ReactPortalScopeProvider, useReactPortalRuntimeLifecycle, useReactPortalScope";
  result = result.replace(
    reactImport,
    `${reactImport}\nimport { ${portalImports} } from "../internal/portal";`,
  );
  result = result.replace(
    rootRefPattern,
    `$1  const portalScope = useReactPortalScope(rootRef, createPortalBinding);\n  const portalRuntimeActivation = portalScope.activation;\n`,
  );

  let factoryIndex = result.indexOf(factoryCall);
  if (factoryIndex < 0) throw new Error(`Cannot find the ${runtimeFactory} lifecycle.`);

  if (usesLazyRuntime) {
    const factoryLineStart = result.lastIndexOf("\n", factoryIndex) + 1;
    const factoryIndent = result.slice(factoryLineStart, factoryIndex);
    result = `${result.slice(0, factoryLineStart)}${factoryIndent}if (!portalScope.isReady()) return;\n\n${result.slice(factoryLineStart)}`;
    factoryIndex = result.indexOf(factoryCall);
  } else {
    const lifecycleCalls = ["React.useEffect(() => {", "useIsomorphicLayoutEffect(() => {"];
    const lifecycleCall = lifecycleCalls
      .map((candidate) => ({ candidate, index: result.lastIndexOf(candidate, factoryIndex) }))
      .sort((left, right) => right.index - left.index)[0];
    const lifecycleStart = lifecycleCall.index;
    if (lifecycleStart < 0) throw new Error(`Cannot find the ${runtimeFactory} lifecycle start.`);
    result = `${result.slice(0, lifecycleStart)}const initializePortalRuntime = React.useCallback(() => {${result.slice(lifecycleStart + lifecycleCall.candidate.length)}`;
  }

  const dependencyEnd = result.indexOf("]);", factoryIndex);
  const dependencyStart = result.lastIndexOf("[", dependencyEnd);
  if (dependencyStart < factoryIndex || dependencyEnd < 0) {
    throw new Error(`Cannot find the ${runtimeFactory} lifecycle dependencies.`);
  }
  if (usesLazyRuntime) {
    const dependencies = result.slice(dependencyStart + 1, dependencyEnd);
    const nextDependencies = dependencies.includes("\n")
      ? `${dependencies}      portalRuntimeActivation,\n    `
      : [dependencies.trim(), "portalRuntimeActivation"].filter(Boolean).join(", ");
    result = `${result.slice(0, dependencyStart + 1)}${nextDependencies}${result.slice(dependencyEnd)}`;
  }
  const lifecycleEnd = result.indexOf("]);", factoryIndex) + "]);".length;
  const runtimeLifecycle = usesLazyRuntime
    ? ""
    : "\n\n  useReactPortalRuntimeLifecycle(portalScope, initializePortalRuntime);";
  result = `${result.slice(0, lifecycleEnd)}${runtimeLifecycle}\n\n  useIsomorphicLayoutEffect(() => {\n    if (!portalScope.isReady()) return;\n    const root = rootRef.current;\n    if (!root) return;\n    ${refreshPortalSurface}(root);\n  }, [portalRuntimeActivation]);${result.slice(lifecycleEnd)}`;

  const returnMatches = [...result.matchAll(/^([ \t]*)return \(\n/gm)];
  const returnMatch = returnMatches.at(-1);
  const returnStart = returnMatch?.index ?? -1;
  const returnIndent = returnMatch?.[1] ?? "";
  const returnEnd = result.indexOf(`\n${returnIndent});`, returnStart);
  if (returnStart < 0 || returnEnd < returnStart) {
    throw new Error(`Cannot wrap the ${runtimeFactory} Root with its Portal scope.`);
  }
  const jsxStart = returnStart + returnIndent.length + "return (\n".length;
  const jsx = result.slice(jsxStart, returnEnd);
  const indentedJsx = jsx
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
  result = `${result.slice(0, jsxStart)}${returnIndent}  <ReactPortalScopeProvider scope={portalScope}>\n${indentedJsx}\n${returnIndent}  </ReactPortalScopeProvider>${result.slice(returnEnd)}`;
  return result;
}

export function renderReactPortalHelperFile(tsHeader: string): string {
  return `${tsHeader}import * as React from "react";
import { createPortal } from "react-dom";
import { setRef } from "./compose-refs";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";

export type ReactPortalContainer =
  | HTMLElement
  | React.RefObject<HTMLElement | null>
  | string
  | null;

export type ReactPortalProps = Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
  children?: React.ReactNode;
  container?: ReactPortalContainer;
  disabled?: boolean;
};

type PortalPlacement = { disabled: boolean; target: HTMLElement };
type ResolvePortalPlacement = (
  wrapper: HTMLElement,
  options: {
    container?: Element | string | null;
    disabled?: boolean;
    mode?: "framework" | "runtime";
    reference?: Element | null;
  },
) => PortalPlacement;
type ReportPortalPlacement = (
  wrapper: HTMLElement,
  placement: { ready: boolean; target: HTMLElement } | null,
) => void;
type PortalBinding = {
  destroy(): void;
  getSnapshot(): { status: "pending" | "ready" };
  publish(snapshot: unknown): void;
};
type CreatePortalBinding = (root: HTMLElement) => PortalBinding;
type PortalRecord = {
  authoredParent: HTMLElement;
  node: HTMLDivElement;
  ready: boolean;
  target: HTMLElement | null;
};
type PortalToken = string;
type ReactPortalScopeValue = {
  activation: number;
  isReady(): boolean;
  phase: "inline" | "placed";
  register(token: PortalToken, record: PortalRecord): () => void;
  update(token: PortalToken, record: PortalRecord): void;
};
type ReactPortalScopeProviderProps = {
  children?: React.ReactNode;
  scope: ReactPortalScopeValue;
};
type ReactPortalImplementationProps = ReactPortalProps & {
  discoveryAttribute: string;
  reportPlacement: ReportPortalPlacement;
  resolvePlacement: ResolvePortalPlacement;
};

const ReactPortalScopeContext = React.createContext<ReactPortalScopeValue | null>(null);

export function useReactPortalScope<T extends HTMLElement>(
  rootRef: React.RefObject<T | null>,
  createBinding: CreatePortalBinding,
): ReactPortalScopeValue {
  const recordsRef = React.useRef(new Map<PortalToken, PortalRecord>());
  const bindingRef = React.useRef<PortalBinding | null>(null);
  const readyRef = React.useRef(false);
  const [activation, setActivation] = React.useState(0);
  const [phase, setPhase] = React.useState<"inline" | "placed">("inline");
  const [, setRevision] = React.useState(0);

  const publishPending = React.useCallback(() => {
    readyRef.current = false;
    bindingRef.current?.publish(Object.freeze({ status: "pending" }));
  }, []);

  const register = React.useCallback(
    (token: PortalToken, record: PortalRecord) => {
      recordsRef.current.set(token, record);
      publishPending();
      setRevision((current) => current + 1);
      return () => {
        if (recordsRef.current.get(token)?.node !== record.node) return;
        recordsRef.current.delete(token);
        publishPending();
        setRevision((current) => current + 1);
      };
    },
    [publishPending],
  );

  const update = React.useCallback(
    (token: PortalToken, record: PortalRecord) => {
      const current = recordsRef.current.get(token);
      if (
        current?.node === record.node &&
        current.ready === record.ready &&
        current.target === record.target
      ) return;
      recordsRef.current.set(token, record);
      publishPending();
      setRevision((currentRevision) => currentRevision + 1);
    },
    [publishPending],
  );

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const binding = createBinding(root);
    bindingRef.current = binding;
    if (phase === "inline") {
      publishPending();
      setPhase("placed");
      return;
    }

    const records = [...recordsRef.current.values()];
    if (records.some((record) => !record.ready)) {
      publishPending();
      return;
    }
    const portals = Object.freeze(
      records.map((record) =>
        Object.freeze({ authoredParent: record.authoredParent, wrapper: record.node }),
      ),
    );
    const wrappers = Object.freeze(portals.map((portal) => portal.wrapper));
    binding.publish(
      Object.freeze({
        parts: Object.freeze({ portals, root, wrappers }),
        status: "ready",
      }),
    );
    if (!readyRef.current) setActivation((current) => current + 1);
    readyRef.current = true;
  });

  React.useEffect(() => () => bindingRef.current?.destroy(), []);

  return React.useMemo(
    () => ({ activation, isReady: () => readyRef.current, phase, register, update }),
    [activation, phase, register, update],
  );
}

export function useReactPortalRuntimeLifecycle(
  scope: ReactPortalScopeValue,
  initialize: () => (() => void) | undefined,
): void {
  const cleanupRef = React.useRef<(() => void) | null>(null);
  const initializeRef = React.useRef(initialize);
  const scopeRef = React.useRef(scope);
  initializeRef.current = initialize;
  scopeRef.current = scope;

  useIsomorphicLayoutEffect(() => {
    if (!cleanupRef.current && scopeRef.current.isReady()) {
      cleanupRef.current = initializeRef.current() ?? null;
    }
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [initialize]);

  useIsomorphicLayoutEffect(() => {
    if (cleanupRef.current || !scopeRef.current.isReady()) return;
    cleanupRef.current = initializeRef.current() ?? null;
  }, [scope.activation]);
}

export function ReactPortalScopeProvider({ children, scope }: ReactPortalScopeProviderProps) {
  return (
    <ReactPortalScopeContext.Provider value={scope}>
      {children}
    </ReactPortalScopeContext.Provider>
  );
}

export const ReactPortal = React.forwardRef<HTMLDivElement, ReactPortalImplementationProps>(
  function ReactPortal(
    {
      children,
      container = null,
      disabled = false,
      discoveryAttribute,
      reportPlacement,
      resolvePlacement,
      ...props
    },
    forwardedRef,
  ) {
    const scope = React.useContext(ReactPortalScopeContext);
    const token = React.useId();
    const wrapperRef = React.useRef<HTMLDivElement | null>(null);
    const referenceRef = React.useRef<Element | null>(null);
    const [standalonePhase, setStandalonePhase] = React.useState<"inline" | "placed">("inline");
    const [placement, setPlacement] = React.useState<{ ready: boolean; target: HTMLElement | null }>({
      ready: disabled,
      target: null,
    });
    const placementRef = React.useRef(placement);
    placementRef.current = placement;
    const phase = scope?.phase ?? standalonePhase;
    const registerPortal = scope?.register;
    const updatePortal = scope?.update;

    const composedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        if (!node) return setRef(forwardedRef, null);
        wrapperRef.current = node;
        if (!referenceRef.current) referenceRef.current = node.parentElement;
        const cleanupForwardedRef = setRef(forwardedRef, node);
        const cleanupRegistration = registerPortal?.(token, {
          authoredParent: (referenceRef.current as HTMLElement | null) ?? node,
          node,
          ready: placementRef.current.ready,
          target: placementRef.current.target,
        });
        return () => {
          cleanupRegistration?.();
          reportPlacement(node, null);
          if (wrapperRef.current === node) wrapperRef.current = null;
          cleanupForwardedRef?.();
        };
      },
      [forwardedRef, registerPortal, reportPlacement, token],
    );

    const refreshPlacement = React.useCallback(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const resolved = resolvePlacement(wrapper, {
        container: resolveContainer(container),
        disabled,
        mode: "framework",
        reference: referenceRef.current ?? wrapper,
      });
      const target = resolved.disabled || phase === "inline" ? null : resolved.target;
      const ready = resolved.disabled || Boolean(target && wrapper.parentElement === target);
      reportPlacement(wrapper, { ready, target: resolved.target });
      updatePortal?.(token, {
        authoredParent: (referenceRef.current as HTMLElement | null) ?? wrapper,
        node: wrapper,
        ready,
        target,
      });
      const current = placementRef.current;
      if (current.ready !== ready || current.target !== target) setPlacement({ ready, target });
    }, [container, disabled, phase, reportPlacement, resolvePlacement, token, updatePortal]);

    useIsomorphicLayoutEffect(() => {
      if (!scope && standalonePhase === "inline") {
        setStandalonePhase("placed");
        return;
      }
      refreshPlacement();
    });

    React.useEffect(() => {
      const wrapper = wrapperRef.current;
      const mutationRoot = wrapper?.ownerDocument.documentElement;
      if (disabled || !mutationRoot) return;
      const observer = new MutationObserver(refreshPlacement);
      observer.observe(mutationRoot, { childList: true, subtree: true });
      return () => observer.disconnect();
    }, [disabled, refreshPlacement]);

    const wrapper = (
      <div
        {...props}
        {...{ [discoveryAttribute]: "" }}
        data-container={typeof container === "string" ? container : undefined}
        data-disabled={disabled ? "" : undefined}
        data-placement={disabled || placement.ready ? "ready" : "pending"}
        data-sw-portal-placement="framework"
        ref={composedRef}
      >
        {children}
      </div>
    );
    return phase === "placed" && placement.target
      ? createPortal(wrapper, placement.target, token)
      : wrapper;
  },
);

function resolveContainer(container: ReactPortalContainer): Element | string | null {
  if (container && typeof container === "object" && "current" in container) {
    return container.current;
  }
  return container;
}
`;
}
