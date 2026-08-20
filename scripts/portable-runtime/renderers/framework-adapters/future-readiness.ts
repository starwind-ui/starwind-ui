export type FrameworkAdapterReadinessTarget = "astro" | "react" | "solid" | "svelte" | "vue";

export type FrameworkAdapterReadiness = {
  booleanAttributeStrategy:
    | "html-empty-string"
    | "jsx-boolean"
    | "svelte-boolean-attribute"
    | "vue-bound-attribute";
  contextStrategy:
    | "none"
    | "react-context"
    | "solid-context"
    | "svelte-context"
    | "vue-provide-inject";
  eventStrategy:
    | "dom-custom-event"
    | "react-callback-prop"
    | "solid-callback-prop"
    | "svelte-callback-prop"
    | "vue-emit";
  fileExtension: ".astro" | ".svelte" | ".tsx" | ".vue";
  lifecycleStrategy:
    | "astro-init-script"
    | "react-effect-cleanup"
    | "solid-mount-effect-cleanup"
    | "svelte-attachment-cleanup"
    | "vue-mounted-watch-cleanup";
  normalizeAttributeName: (name: string) => string;
  portalStrategy:
    | "react-portal"
    | "runtime-owned"
    | "solid-portal"
    | "svelte-attachment"
    | "vue-teleport";
  propStrategy:
    | "astro-attributes"
    | "jsx-props"
    | "solid-jsx-props"
    | "svelte-props"
    | "vue-bindings";
  publicSupport: {
    cliRegistry: boolean;
    demoIntegration: boolean;
    packageExports: boolean;
    publicDocsClaim: boolean;
    status: "non-shipping-tracer" | "shipping";
  };
  refStrategy:
    | "astro-dom-query"
    | "react-forward-ref"
    | "solid-ref"
    | "svelte-attachment-ref"
    | "vue-template-ref";
  slotStrategy: "astro-slot" | "react-children" | "solid-children" | "svelte-snippet" | "vue-slot";
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
  target: "solid" | "svelte" | "vue";
};

export const SVELTE_FRAMEWORK_ADAPTER_PRIVATE_TARGET = {
  reason: "private-package-verification-only",
  status: "non-shipping-tracer",
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
