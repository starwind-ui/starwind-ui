export type VueModelProjection = Readonly<{
  defaultProp: string;
  modelName: string;
  modelProp: string;
  updateEvent: `update:${string}`;
}>;

export type VueDetailedEventProjection = Readonly<{
  emit: string;
  propAlias: null;
  runtimeHandler: string;
}>;

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function assertSemanticName(name: string): void {
  if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) {
    throw new TypeError(`Vue model names must be lower-camel semantic names; received ${name}.`);
  }
}

/** Projects a framework-neutral state model into Vue's model prop and event vocabulary. */
export function projectVueModel(modelName: string): VueModelProjection {
  assertSemanticName(modelName);

  if (modelName === "modelValue" || modelName.startsWith("default")) {
    throw new TypeError(
      `Vue model aliases are target output, not Runtime model names; received ${modelName}.`,
    );
  }

  if (modelName === "value") {
    return {
      defaultProp: "defaultValue",
      modelName,
      modelProp: "modelValue",
      updateEvent: "update:modelValue",
    };
  }

  return {
    defaultProp: `default${capitalize(modelName)}`,
    modelName,
    modelProp: modelName,
    updateEvent: `update:${modelName}`,
  };
}

/** Maps an onValueChange-style Runtime handler to a declared Vue detailed event. */
export function projectVueDetailedEvent(runtimeHandler: string): VueDetailedEventProjection {
  const match = /^on([A-Z][a-zA-Z0-9]*Change)$/.exec(runtimeHandler);
  if (!match?.[1]) {
    throw new TypeError(
      `Vue detailed events require an onXChange Runtime handler; received ${runtimeHandler}.`,
    );
  }

  const semanticName = match[1];
  return {
    emit: `${semanticName.charAt(0).toLowerCase()}${semanticName.slice(1)}`,
    propAlias: null,
    runtimeHandler,
  };
}

const modelPolicy = {
  acceptedUncontrolledValue: "latest-accepted-value",
  controlledWhen: "model-prop-is-not-undefined",
  defaultPropChanges: "ignored-after-initial-seed",
  defaultValue: "seed-once-before-mount",
  projections: {
    checked: projectVueModel("checked"),
    inputValue: projectVueModel("inputValue"),
    open: projectVueModel("open"),
    pressed: projectVueModel("pressed"),
    value: projectVueModel("value"),
  },
  propToRuntimeSync: {
    equalValues: "skip-setter",
    emission: "suppress-runtime-emission",
    start: "after-mount",
    target: "contract-setter",
  },
} as const;

const eventPolicy = {
  cancellation: {
    check: "detail.isCanceled",
    timing: "after-synchronous-detailed-listeners",
  },
  detailedArguments: ["value", "detail"],
  order: [
    "emit-detailed-event",
    "inspect-synchronous-cancellation",
    "accept-state",
    "emit-model-update",
  ],
  reactCallbackPropAliases: false,
} as const;

const compositionPolicy = {
  asChild: {
    invalidChild: "throw-descriptive-type-error",
    mergeApi: "mergeProps",
    mergeOrder: ["defaulted-props", "consumer-props", "protected-props"],
    refPolicy: "compose-child-adapter-and-public-element-refs",
    renderApi: "cloneVNode",
    requiredChildren: 1,
    supportedVNode: "one-native-element-vnode",
    unsupportedVNodeTypes: ["Comment", "Text", "Fragment", "component"],
  },
  slots: {
    evaluation: "lazy-slot-functions",
    normalRendering: "typed-template-slots",
    privateVNodeFields: false,
    reuseVNodeInstances: false,
  },
} as const;

const lifecyclePolicy = {
  controller: {
    create: "onMounted-after-owned-element-exists",
    destroy: "exact-instance-before-unmount-or-recreation",
    ownership: "one-primitive-component-instance",
    visibility: "private",
  },
  options: {
    mutable: "prefer-runtime-setter",
    recreate: "only-without-setter-from-current-accepted-state",
  },
  setupRegistration: "synchronous",
  watchers: {
    asyncUnowned: false,
    domFlush: "post",
    sources: "explicit-contract-inputs",
  },
} as const;

const serverPolicy = {
  hydration: {
    firstClientMarkup: "identical-to-server-markup",
    idsAndPresence: "deterministic-contract-or-prop-backed",
  },
  ssr: {
    browserGlobals: false,
    cleanupDependentWork: false,
    domQueries: false,
    layoutReads: false,
    runtimeConstruction: false,
  },
  teleport: {
    activate: "after-owning-root-mounted",
    containerProp: "container?: string | HTMLElement",
    defaultContainer: "body",
    disabledProp: "disabled?: boolean",
    explicitContainer: "forward-unchanged",
    initialClientRender: "disabled",
    runtimeRefClear: "only-by-setting-instance",
    runtimeRefSet: "on-mount",
    serverRender: "disabled",
  },
} as const;

export const vueAdapterPublicContract = {
  attrs: {
    automaticFallthrough: "disabled-for-wrapper-or-multiple-roots",
    declaredComponentEventsAsNativeListeners: false,
    destination: "semantic-interactive-element",
    forwarding: "exactly-once",
    includes: ["attrs", "class", "style", "aria", "data", "undeclared-native-listeners"],
  },
  composition: compositionPolicy,
  context: {
    key: "typed-symbol-InjectionKey",
    optionalInjection: "only-when-contract-marks-optional",
    requiredMissingContext: "throw-descriptive-missing-root-error",
    stringKeys: false,
  },
  events: eventPolicy,
  framework: {
    minimumVersion: "3.5",
    packageIntent: "@starwind-ui/vue",
    vuePeerExternalized: true,
  },
  lifecycle: lifecyclePolicy,
  models: modelPolicy,
  publicSupport: {
    cliRegistry: false,
    demoIntegration: false,
    packageExports: false,
    publicDocsClaim: false,
    status: "non-shipping-tracer",
  },
  refs: {
    element: "semantic-dom-element",
    exposeTiming: "synchronous-setup",
    exposedMembers: "element-and-contract-required-imperative-methods-only",
    runtimeControllerExposed: false,
  },
  server: serverPolicy,
} as const;

export type VueAdapterPublicContract = typeof vueAdapterPublicContract;
