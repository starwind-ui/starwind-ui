export type FrameworkAdapterReadinessTarget = "astro" | "react" | "solid" | "vue";

export type FrameworkAdapterReadiness = {
  booleanAttributeStrategy: "html-empty-string" | "jsx-boolean" | "vue-bound-attribute";
  contextStrategy: "none" | "react-context" | "solid-context" | "vue-provide-inject";
  eventStrategy: "dom-custom-event" | "react-callback-prop" | "solid-callback-prop" | "vue-emit";
  fileExtension: ".astro" | ".tsx" | ".vue";
  lifecycleStrategy:
    | "astro-init-script"
    | "react-effect-cleanup"
    | "solid-mount-effect-cleanup"
    | "vue-mounted-watch-cleanup";
  normalizeAttributeName: (name: string) => string;
  portalStrategy: "react-portal" | "runtime-owned" | "solid-portal" | "vue-teleport";
  propStrategy: "astro-attributes" | "jsx-props" | "solid-jsx-props" | "vue-bindings";
  publicSupport: {
    cliRegistry: boolean;
    demoIntegration: boolean;
    packageExports: boolean;
    publicDocsClaim: boolean;
    status: "non-shipping-tracer" | "shipping";
  };
  refStrategy: "astro-dom-query" | "react-forward-ref" | "solid-ref" | "vue-template-ref";
  slotStrategy: "astro-slot" | "react-children" | "solid-children" | "vue-slot";
  target: FrameworkAdapterReadinessTarget;
};

export type FutureFrameworkAdapterReadiness = FrameworkAdapterReadiness & {
  publicSupport: {
    cliRegistry: false;
    demoIntegration: false;
    packageExports: false;
    publicDocsClaim: false;
    status: "non-shipping-tracer";
  };
  target: "solid" | "vue";
};

export const SVELTE_FRAMEWORK_ADAPTER_DEFERRED = {
  reason: "setup-model-undecided",
  status: "deferred",
  target: "svelte",
} as const;

export function defineFrameworkAdapterReadiness<TReadiness extends FrameworkAdapterReadiness>(
  readiness: TReadiness,
): TReadiness {
  return readiness;
}

export function normalizeHtmlAttributeName(name: string): string {
  if (name === "className") return "class";
  if (name === "htmlFor") return "for";
  if (name === "tabIndex") return "tabindex";

  return name;
}

export function normalizeReactAttributeName(name: string): string {
  if (name === "class") return "className";
  if (name === "for") return "htmlFor";
  if (name === "tabindex") return "tabIndex";

  return name;
}

export function normalizeSolidAttributeName(name: string): string {
  if (name === "className") return "class";
  if (name === "htmlFor") return "for";

  return name;
}
