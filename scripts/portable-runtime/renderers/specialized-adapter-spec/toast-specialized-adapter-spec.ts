import type {
  PrimitivePropContract,
  RuntimeAdapterContract,
} from "../../contracts/primitive/types.js";
import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterNotificationSystemFacts,
  AdapterNotificationSystemPartName,
  AdapterOutputModel,
} from "../framework-adapters/index.js";
import {
  buildBaseSpecializedAdapterSpec,
  validateSpecializedAdapterSpec,
} from "./base-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec } from "./types.js";

export type ToastSpecializedAdapterSpec = SpecializedAdapterSpec & {
  sourcePrimitiveContract: RuntimeAdapterContract;
  toast: {
    actions: ToastActionsRecipe;
    adapterKind: "notification-system";
    anatomy: ToastAnatomyRecipe[];
    manager: ToastManagerRecipe;
    namespace: ToastNamespaceRecipe;
    publicApi: ToastPublicApiRecipe;
    rootState: ToastRootStateRecipe;
    runtimeBoundary: string[];
    template: ToastTemplateRecipe;
    viewportOptions: ToastViewportOptionsRecipe;
  };
};

type ToastActionButtonRecipe = {
  part: "action";
  typeAttribute: "type";
  typeValue: "button";
};

type ToastActionsRecipe = {
  action: ToastActionButtonRecipe;
  close: ToastCloseButtonRecipe;
  runtimeBoundary: string;
};

type ToastAnatomyRecipe = {
  defaultElement: string;
  discoveryAttribute: string;
  forwardsRef: boolean;
  initialAttributes: string[];
  ownsRuntime: boolean;
  part: string;
  publicRef: boolean;
  role?: string;
};

type ToastCloseButtonRecipe = {
  ariaLabelAttribute: "aria-label";
  ariaLabelValue: "Close notification";
  part: "close";
  typeAttribute: "type";
  typeValue: "button";
};

type ToastManagerRecipe = {
  destroyMethod: "destroy";
  globalRegistration: "runtime-owned";
  lifecycle: "viewport-scoped-manager";
  options: {
    defaultDurationAttribute: "data-duration";
    limitAttribute: "data-limit";
  };
  part: "viewport";
  runtimeBoundary: string;
  runtimeFactory: string;
  runtimeImportSource: SpecializedAdapterSpec["root"]["runtimeImportSource"];
};

type ToastNamespaceRecipe = {
  defaultExport: "Toast";
  defaultNamespace: boolean;
  memberParts: string[];
  namedExports: string[];
  namespace: "Toast";
  objectEntries: ToastNamespaceObjectEntry[];
};

type ToastNamespaceObjectEntry = {
  exportName: string;
  part: string;
  property: string;
};

type ToastPublicApiRecipe = {
  exportName: "toast";
  methods: string[];
  runtimeBoundary: string;
  runtimeImportSource: "@starwind-ui/runtime/toast";
  typeImportSource: "@starwind-ui/runtime";
  typeExports: ["ToastApi", "ToastOptions", "ToastPromiseOptions"];
};

type ToastRootStateRecipe = {
  ariaModal: {
    attribute: "aria-modal";
    value: "false";
  };
  idAttribute: "data-toast-id";
  role: "dialog";
  runtimeBoundary: string;
  stateAttribute: "data-state";
  stateOpenValue: "open";
  variantAttribute: "data-variant";
};

type ToastTemplateRecipe = {
  part: "template";
  rootPart: "root";
  runtimeBoundary: string;
  variant: ToastVariantRecipe;
};

type ToastVariantRecipe = {
  defaultValue: '"default"';
  prop: "variant";
  rootAttribute: "data-variant";
  templateAttribute: "data-sw-toast-template";
  type: '"default" | "error" | "info" | "loading" | "success" | "warning"';
  values: ["default", "error", "info", "loading", "success", "warning"];
};

type ToastViewportOptionsRecipe = {
  duration: ToastViewportAttributeOptionRecipe<"duration", "data-duration", "number">;
  gap: ToastViewportCssOptionRecipe<"gap", "--gap", "string">;
  limit: ToastViewportAttributeOptionRecipe<"limit", "data-limit", "number">;
  peek: ToastViewportCssOptionRecipe<"peek", "--peek", "string">;
  position: ToastViewportPositionRecipe;
};

type ToastViewportAttributeOptionRecipe<
  Prop extends string,
  Attribute extends string,
  Type extends string,
> = {
  attribute: Attribute;
  defaultValue: string;
  prop: Prop;
  type: Type;
};

type ToastViewportCssOptionRecipe<
  Prop extends string,
  CssVariable extends string,
  Type extends string,
> = {
  cssVariable: CssVariable;
  defaultValue: string;
  prop: Prop;
  type: Type;
};

type ToastViewportPositionRecipe = ToastViewportAttributeOptionRecipe<
  "position",
  "data-position",
  '"top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"'
> & {
  values: ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"];
};

const TOAST_ANATOMY_PARTS = [
  "viewport",
  "template",
  "root",
  "content",
  "title",
  "titleText",
  "description",
  "action",
  "close",
] as const satisfies readonly AdapterNotificationSystemPartName[];
const TOAST_NAMED_EXPORT_PARTS = [
  "action",
  "close",
  "content",
  "description",
  "root",
  "template",
  "title",
  "titleText",
  "viewport",
] as const;
const TOAST_POSITION_VALUES = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;
const TOAST_VARIANT_VALUES = ["default", "error", "info", "loading", "success", "warning"] as const;
const TOAST_PUBLIC_API_METHODS = [
  "call",
  "success",
  "error",
  "warning",
  "info",
  "loading",
  "update",
  "dismiss",
  "promise",
] as const;
const TOAST_TYPE_EXPORTS = ["ToastApi", "ToastOptions", "ToastPromiseOptions"] as const;
const TOAST_RUNTIME_BOUNDARY = [
  "global toast manager registration and lookup",
  "imperative toast API routing",
  "template lookup, cloning, rerendering, and managed content updates",
  "timer scheduling, pause/resume, update, promise, and removal lifecycle",
  "stacking, viewport expansion, height measurement, and limited toast state",
  "swipe gesture handling and dismissal thresholds",
  "action callbacks, close callbacks, and global cleanup",
] as const;
const TOAST_MANAGER_RUNTIME_BOUNDARY =
  "Runtime owns toast manager state, global registration, viewport setup, mutation observers, expansion/collapse, timers, stacking, swipe dismissal, and cleanup.";
const TOAST_TEMPLATE_RUNTIME_BOUNDARY =
  "Runtime owns template lookup, cloning, rerendering, managed content updates, and cloned DOM mutation.";
const TOAST_ROOT_STATE_RUNTIME_BOUNDARY =
  "Runtime owns cloned toast ids, state transitions, aria-labelledby/aria-describedby mutation, and removal timing.";
const TOAST_ACTIONS_RUNTIME_BOUNDARY =
  "Runtime owns action callback invocation, close lifecycle, dismissal, and removal callbacks.";
const TOAST_PUBLIC_API_RUNTIME_BOUNDARY =
  "Runtime owns global manager lookup, imperative routing, promise/update lifecycle, and warnings when no viewport manager is registered.";

export function buildToastSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): ToastSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "toast") {
    throw new Error(
      `${spec.displayName} cannot be rendered as the Toast specialized adapter spec.`,
    );
  }

  for (const part of TOAST_ANATOMY_PARTS) {
    assertPart(spec, part);
  }

  return {
    ...spec,
    files: buildShippingFileRecipes(spec),
    sourcePrimitiveContract: contract,
    toast: {
      actions: buildActionsRecipe(spec),
      adapterKind: "notification-system",
      anatomy: buildAnatomyRecipes(spec),
      manager: buildManagerRecipe(spec),
      namespace: buildNamespaceRecipe(spec),
      publicApi: buildPublicApiRecipe(spec),
      rootState: buildRootStateRecipe(spec),
      runtimeBoundary: [...TOAST_RUNTIME_BOUNDARY],
      template: buildTemplateRecipe(spec),
      viewportOptions: buildViewportOptionsRecipe(spec),
    },
  };
}


export function buildToastAdapterOutputModel(spec: ToastSpecializedAdapterSpec): AdapterOutputModel {
  const errors = validateToastSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(`Invalid Toast specialized adapter spec:\n${errors.join("\n")}`);
  }

  const facts = getToastNotificationSystemFacts(spec);
  const files: Array<AdapterComponentFile | AdapterIndexFile> = [
    ...TOAST_ANATOMY_PARTS.map((partName) => createToastComponentFile(spec, partName, facts)),
    createToastIndexFile(spec, facts),
  ];

  return { files };
}

function createToastComponentFile(
  spec: ToastSpecializedAdapterSpec,
  partName: AdapterNotificationSystemPartName,
  facts: AdapterNotificationSystemFacts,
): AdapterComponentFile {
  const part = getPart(spec, partName);
  const exportName = getToastFileExportName(spec, partName);

  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${spec.displayName}.${facts.parts[partName].namespaceKey}`,
      events: [],
      exports: { kind: "namespace", members: [], namespace: exportName },
      family: { facts, kind: "notification-system", part: partName },
      imports: [],
      lifecycle: undefined,
      name: exportName,
      portals: [],
      props: [],
      refs: [],
      render: {
        attrs: [],
        children: [],
        defaultElement: part.defaultElement,
        events: [],
        kind: "element",
        part: part.name,
        refs: [],
      },
      stateSync: [],
      typeFacades: [],
    },
    kind: "component",
    path: `${spec.component}/${exportName}`,
  };
}

function createToastIndexFile(
  spec: ToastSpecializedAdapterSpec,
  facts: AdapterNotificationSystemFacts,
): AdapterIndexFile {
  const indexFile = spec.files.find((file) => file.kind === "index");
  if (!indexFile) {
    throw new Error("Toast specialized adapter spec requires an index file.");
  }

  return {
    exports: {
      kind: "namespace",
      members: facts.index.importMembers.map((member) => ({
        from: member.from,
        kind: "value",
        name: member.name,
      })),
      namespace: facts.exports.namespace,
    },
    family: { facts, kind: "notification-system" },
    imports: [],
    kind: "index",
    path: `${indexFile.path}.ts`,
    typeFacades: [],
  };
}

function getToastNotificationSystemFacts(
  spec: ToastSpecializedAdapterSpec,
): AdapterNotificationSystemFacts {
  const namespaceEntriesByPart = new Map(
    spec.toast.namespace.objectEntries.map((entry) => [entry.part, entry]),
  );
  const exportsByPart = Object.fromEntries(
    TOAST_ANATOMY_PARTS.map((partName) => [partName, getToastFileExportName(spec, partName)]),
  ) as Record<AdapterNotificationSystemPartName, string>;

  return {
    actions: spec.toast.actions,
    attrs: Object.fromEntries(
      TOAST_ANATOMY_PARTS.map((partName) => [partName, getPart(spec, partName).discoveryAttribute]),
    ) as Record<AdapterNotificationSystemPartName, string>,
    displayName: spec.displayName,
    exports: {
      ...exportsByPart,
      namespace: spec.toast.namespace.namespace,
    },
    index: {
      importMembers: spec.toast.namespace.namedExports
        .filter((exportName) => exportName !== spec.toast.namespace.namespace)
        .map((exportName) => {
          const entry = getToastNamespaceEntryByExportName(spec, exportName);

          return {
            from: `./${getToastSpecFileBasename(spec, entry.part)}`,
            kind: "value" as const,
            name: entry.exportName,
          };
        }),
      namespaceMembers: spec.toast.namespace.objectEntries.map((entry) => ({
        key: entry.property,
        name: entry.exportName,
      })),
      typeExportSource: spec.toast.publicApi.typeImportSource,
      typeExports: [...spec.toast.publicApi.typeExports],
      valueExportSource: spec.toast.publicApi.runtimeImportSource,
      valueExports: [spec.toast.publicApi.exportName],
    },
    parts: Object.fromEntries(
      TOAST_ANATOMY_PARTS.map((partName) => {
        const part = getPart(spec, partName);
        const entry = namespaceEntriesByPart.get(partName);
        if (!entry) {
          throw new Error(`Toast specialized adapter spec requires ${partName} namespace entry.`);
        }

        return [
          partName,
          {
            defaultElement: part.defaultElement,
            discoveryAttribute: part.discoveryAttribute,
            name: part.name,
            namespaceKey: entry.property,
            role: part.role,
          },
        ];
      }),
    ) as AdapterNotificationSystemFacts["parts"],
    rootState: {
      ariaModalAttribute: spec.toast.rootState.ariaModal.attribute,
      ariaModalValue: spec.toast.rootState.ariaModal.value,
      role: spec.toast.rootState.role,
      stateAttribute: spec.toast.rootState.stateAttribute,
      stateOpenValue: spec.toast.rootState.stateOpenValue,
      variantAttribute: spec.toast.rootState.variantAttribute,
    },
    runtime: {
      destroyMethod: spec.toast.manager.destroyMethod,
      factory: spec.toast.manager.runtimeFactory,
      importSource: spec.toast.manager.runtimeImportSource,
      setupFunction: `setup${spec.displayName}s`,
    },
    template: {
      variant: {
        defaultValue: spec.toast.template.variant.defaultValue,
        name: spec.toast.template.variant.prop,
        rootAttribute: spec.toast.template.variant.rootAttribute,
        templateAttribute: spec.toast.template.variant.templateAttribute,
        type: spec.toast.template.variant.type,
        values: [...spec.toast.template.variant.values],
      },
    },
    viewportOptions: {
      duration: {
        attribute: spec.toast.viewportOptions.duration.attribute,
        defaultValue: spec.toast.viewportOptions.duration.defaultValue,
        name: spec.toast.viewportOptions.duration.prop,
        type: spec.toast.viewportOptions.duration.type,
      },
      gap: {
        cssVariable: spec.toast.viewportOptions.gap.cssVariable,
        defaultValue: spec.toast.viewportOptions.gap.defaultValue,
        name: spec.toast.viewportOptions.gap.prop,
        type: spec.toast.viewportOptions.gap.type,
      },
      limit: {
        attribute: spec.toast.viewportOptions.limit.attribute,
        defaultValue: spec.toast.viewportOptions.limit.defaultValue,
        name: spec.toast.viewportOptions.limit.prop,
        type: spec.toast.viewportOptions.limit.type,
      },
      peek: {
        cssVariable: spec.toast.viewportOptions.peek.cssVariable,
        defaultValue: spec.toast.viewportOptions.peek.defaultValue,
        name: spec.toast.viewportOptions.peek.prop,
        type: spec.toast.viewportOptions.peek.type,
      },
      position: {
        attribute: spec.toast.viewportOptions.position.attribute,
        defaultValue: spec.toast.viewportOptions.position.defaultValue,
        name: spec.toast.viewportOptions.position.prop,
        type: spec.toast.viewportOptions.position.type,
        values: [...spec.toast.viewportOptions.position.values],
      },
    },
    viewportSemantics: {
      ariaAtomicAttribute: getStaticAttributeName(spec, "viewport", "aria-atomic"),
      ariaAtomicValue: getStaticAttributeValue(spec, "viewport", "aria-atomic"),
      ariaLabelAttribute: getStaticAttributeName(spec, "viewport", "aria-label"),
      ariaLabelValue: getStaticAttributeValue(spec, "viewport", "aria-label"),
      ariaLiveAttribute: getStaticAttributeName(spec, "viewport", "aria-live"),
      ariaLiveValue: getStaticAttributeValue(spec, "viewport", "aria-live"),
      ariaRelevantAttribute: getStaticAttributeName(spec, "viewport", "aria-relevant"),
      ariaRelevantValue: getStaticAttributeValue(spec, "viewport", "aria-relevant"),
      role: getRequiredValue(getPart(spec, "viewport").role, "viewport role"),
      tabIndexAttribute: getStaticAttributeName(spec, "viewport", "tabIndex"),
      tabIndexValue: getStaticAttributeValue(spec, "viewport", "tabIndex"),
    },
  };
}

export function validateToastSpecializedAdapterSpec(spec: ToastSpecializedAdapterSpec): string[] {
  const errors = validateSpecializedAdapterSpec(spec);
  if (!isRecord(spec) || spec.component !== "toast") {
    errors.push("Toast specialized adapter spec must target the toast primitive.");
    return errors;
  }

  const toast = isRecord(spec.toast) ? spec.toast : undefined;
  if (!toast) {
    errors.push("Toast specialized adapter spec is missing toast metadata.");
    return errors;
  }

  if (toast.adapterKind !== "notification-system") {
    errors.push('Toast specialized adapter spec adapterKind must be "notification-system".');
  }

  const expectedFields = new Set([
    "actions",
    "adapterKind",
    "anatomy",
    "manager",
    "namespace",
    "publicApi",
    "rootState",
    "runtimeBoundary",
    "template",
    "viewportOptions",
  ]);
  const behaviorFields = new Set([
    "actionCallbacks",
    "globalManagerRegistration",
    "globalRegistration",
    "managerState",
    "promiseLifecycle",
    "stacking",
    "swipeDismissal",
    "templateCloning",
    "timers",
    "timerScheduling",
    "updateLifecycle",
  ]);
  collectToastBehaviorFieldErrors(toast, ["toast"], behaviorFields, errors);

  for (const field of Object.keys(toast)) {
    if (behaviorFields.has(field)) continue;

    if (!expectedFields.has(field)) {
      errors.push(`Toast specialized adapter spec must not declare unexpected field "${field}".`);
    }
  }

  for (const part of TOAST_ANATOMY_PARTS) {
    if (!hasPart(spec, part)) {
      errors.push(`Toast specialized adapter spec requires ${part} part.`);
    }
  }

  errors.push(...validateAnatomy(spec, toast.anatomy));
  errors.push(...validateViewportOptions(spec, toast.viewportOptions));
  errors.push(...validateTemplate(spec, toast.template));
  errors.push(...validateManager(spec, toast.manager));
  errors.push(...validateRootState(spec, toast.rootState));
  errors.push(...validateActions(spec, toast.actions));
  errors.push(...validatePublicApi(spec, toast.publicApi));
  errors.push(...validateNamespace(spec, toast.namespace));
  errors.push(...validateShippingFiles(spec));


  if (!arraysEqual(asArray(toast.runtimeBoundary), TOAST_RUNTIME_BOUNDARY)) {
    errors.push(
      "Toast specialized adapter spec runtimeBoundary must match Runtime-owned notification behavior.",
    );
  }

  return errors;
}

function collectToastBehaviorFieldErrors(
  value: unknown,
  path: string[],
  behaviorFields: ReadonlySet<string>,
  errors: string[],
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectToastBehaviorFieldErrors(item, [...path, String(index)], behaviorFields, errors);
    });
    return;
  }

  if (!isRecord(value)) return;

  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...path, key];
    const isAllowedManagerRegistration =
      key === "globalRegistration" && nextPath.join(".") === "toast.manager.globalRegistration";

    if (behaviorFields.has(key) && !isAllowedManagerRegistration) {
      errors.push(
        `Toast specialized adapter spec must not declare ${nextPath.join(".")}; keep Runtime-owned behavior in Runtime controllers.`,
      );
    }

    collectToastBehaviorFieldErrors(child, nextPath, behaviorFields, errors);
  }
}

function buildActionsRecipe(spec: SpecializedAdapterSpec): ToastActionsRecipe {
  return {
    action: {
      part: "action",
      typeAttribute: getStaticAttributeName(spec, "action", "type") as "type",
      typeValue: getStaticAttributeValue(spec, "action", "type") as "button",
    },
    close: {
      ariaLabelAttribute: getStaticAttributeName(spec, "close", "aria-label") as "aria-label",
      ariaLabelValue: getStaticAttributeValue(spec, "close", "aria-label") as "Close notification",
      part: "close",
      typeAttribute: getStaticAttributeName(spec, "close", "type") as "type",
      typeValue: getStaticAttributeValue(spec, "close", "type") as "button",
    },
    runtimeBoundary: TOAST_ACTIONS_RUNTIME_BOUNDARY,
  };
}

function buildAnatomyRecipes(spec: SpecializedAdapterSpec): ToastAnatomyRecipe[] {
  return TOAST_ANATOMY_PARTS.map((partName) => {
    const part = getPart(spec, partName);

    return {
      defaultElement: part.defaultElement,
      discoveryAttribute: part.discoveryAttribute,
      forwardsRef: part.forwardsRef === true,
      initialAttributes: getInitialAttributeNames(spec, partName),
      ownsRuntime: part.ownsRuntime === true,
      part: part.name,
      publicRef: hasPublicRef(spec, partName),
      role: part.role,
    };
  });
}

function buildManagerRecipe(spec: SpecializedAdapterSpec): ToastManagerRecipe {
  return {
    destroyMethod: "destroy",
    globalRegistration: "runtime-owned",
    lifecycle: "viewport-scoped-manager",
    options: {
      defaultDurationAttribute: getStaticAttributeName(
        spec,
        "viewport",
        "data-duration",
      ) as "data-duration",
      limitAttribute: getStaticAttributeName(spec, "viewport", "data-limit") as "data-limit",
    },
    part: "viewport",
    runtimeBoundary: TOAST_MANAGER_RUNTIME_BOUNDARY,
    runtimeFactory: spec.root.runtimeFactory,
    runtimeImportSource: spec.root.runtimeImportSource,
  };
}

function buildNamespaceRecipe(spec: SpecializedAdapterSpec): ToastNamespaceRecipe {
  const membersByPart = new Map(spec.exports.members.map((member) => [member.part, member]));
  const objectEntries = TOAST_ANATOMY_PARTS.map((part) => {
    const member = membersByPart.get(part);
    if (!member) {
      throw new Error(`Toast specialized adapter spec requires ${part} namespace export.`);
    }

    return {
      exportName: member.name,
      part,
      property: toPascalCase(part),
    };
  });

  return {
    defaultExport: "Toast",
    defaultNamespace: spec.exports.defaultNamespace,
    memberParts: objectEntries.map((entry) => entry.part),
    namedExports: [
      "Toast",
      ...TOAST_NAMED_EXPORT_PARTS.map((part) => {
        const member = membersByPart.get(part);
        if (!member) {
          throw new Error(`Toast specialized adapter spec requires ${part} named export.`);
        }

        return member.name;
      }),
    ],
    namespace: "Toast",
    objectEntries,
  };
}

function buildPublicApiRecipe(spec: SpecializedAdapterSpec): ToastPublicApiRecipe {
  return {
    exportName: "toast",
    methods: [...TOAST_PUBLIC_API_METHODS],
    runtimeBoundary: TOAST_PUBLIC_API_RUNTIME_BOUNDARY,
    runtimeImportSource: spec.root.runtimeImportSource as "@starwind-ui/runtime/toast",
    typeImportSource: "@starwind-ui/runtime",
    typeExports: [...TOAST_TYPE_EXPORTS],
  };
}

function buildRootStateRecipe(spec: SpecializedAdapterSpec): ToastRootStateRecipe {
  return {
    ariaModal: {
      attribute: "aria-modal",
      value: "false",
    },
    idAttribute: getStaticAttributeName(spec, "root", "data-toast-id") as "data-toast-id",
    role: "dialog",
    runtimeBoundary: TOAST_ROOT_STATE_RUNTIME_BOUNDARY,
    stateAttribute: getStaticAttributeName(spec, "root", "data-state") as "data-state",
    stateOpenValue: "open",
    variantAttribute: getStaticAttributeName(spec, "root", "data-variant") as "data-variant",
  };
}

function buildShippingFileRecipes(spec: SpecializedAdapterSpec): SpecializedAdapterSpec["files"] {
  return spec.files.map((file) => ({ ...file }));
}

function buildTemplateRecipe(spec: SpecializedAdapterSpec): ToastTemplateRecipe {
  const variant = getTargetProp(spec, "variant", "template");
  getTargetProp(spec, "variant", "root");

  return {
    part: "template",
    rootPart: "root",
    runtimeBoundary: TOAST_TEMPLATE_RUNTIME_BOUNDARY,
    variant: {
      defaultValue: getRequiredValue(variant.defaultValue, "variant default value") as '"default"',
      prop: "variant",
      rootAttribute: getStaticAttributeName(spec, "root", "data-variant") as "data-variant",
      templateAttribute: getPart(spec, "template").discoveryAttribute as "data-sw-toast-template",
      type: variant.type as '"default" | "error" | "info" | "loading" | "success" | "warning"',
      values: [...TOAST_VARIANT_VALUES],
    },
  };
}

function buildViewportOptionsRecipe(spec: SpecializedAdapterSpec): ToastViewportOptionsRecipe {
  const duration = getProp(spec, "duration");
  const gap = getProp(spec, "gap");
  const limit = getProp(spec, "limit");
  const peek = getProp(spec, "peek");
  const position = getProp(spec, "position");

  return {
    duration: {
      attribute: getStaticAttributeName(spec, "viewport", "data-duration") as "data-duration",
      defaultValue: getRequiredValue(duration.defaultValue, "duration default value"),
      prop: "duration",
      type: duration.type as "number",
    },
    gap: {
      cssVariable: "--gap",
      defaultValue: getRequiredValue(gap.defaultValue, "gap default value"),
      prop: "gap",
      type: gap.type as "string",
    },
    limit: {
      attribute: getStaticAttributeName(spec, "viewport", "data-limit") as "data-limit",
      defaultValue: getRequiredValue(limit.defaultValue, "limit default value"),
      prop: "limit",
      type: limit.type as "number",
    },
    peek: {
      cssVariable: "--peek",
      defaultValue: getRequiredValue(peek.defaultValue, "peek default value"),
      prop: "peek",
      type: peek.type as "string",
    },
    position: {
      attribute: getStaticAttributeName(spec, "viewport", "data-position") as "data-position",
      defaultValue: getRequiredValue(position.defaultValue, "position default value"),
      prop: "position",
      type: position.type as ToastViewportPositionRecipe["type"],
      values: [...TOAST_POSITION_VALUES],
    },
  };
}

function validateActions(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Toast specialized adapter spec requires actions metadata."];
  }

  return recipeEquals(() => buildActionsRecipe(spec), value)
    ? []
    : [
        "Toast specialized adapter spec actions metadata must match action/close button facts and Runtime callback boundary.",
      ];
}

function validateAnatomy(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["Toast specialized adapter spec requires anatomy metadata."];
  }

  const errors: string[] = [];
  if (
    !arraysEqual(
      value.map((part) => (isRecord(part) ? part.part : undefined)),
      TOAST_ANATOMY_PARTS,
    )
  ) {
    errors.push(
      "Toast specialized adapter spec anatomy must match viewport, template, root, content, title, titleText, description, action, close.",
    );
  }

  for (const partName of TOAST_ANATOMY_PARTS) {
    const recipe = value.find((part) => isRecord(part) && part.part === partName);
    if (!isRecord(recipe)) {
      errors.push(`Toast specialized adapter spec requires ${partName} anatomy part.`);
      continue;
    }

    const part = spec.parts.find((candidate) => candidate.name === partName);
    if (!part) {
      errors.push(`Toast specialized adapter spec requires ${partName} part.`);
      continue;
    }
    if (recipe.defaultElement !== part.defaultElement) {
      errors.push(`Toast specialized adapter spec ${partName} defaultElement must match contract.`);
    }
    if (recipe.discoveryAttribute !== part.discoveryAttribute) {
      errors.push(
        `Toast specialized adapter spec ${partName} discoveryAttribute must match contract.`,
      );
    }
    if (!arraysEqual(asArray(recipe.initialAttributes), getInitialAttributeNames(spec, partName))) {
      errors.push(
        `Toast specialized adapter spec ${partName} initialAttributes must match contract.`,
      );
    }
    if (recipe.forwardsRef !== (part.forwardsRef === true)) {
      errors.push(`Toast specialized adapter spec ${partName} forwardsRef must match contract.`);
    }
    if (recipe.ownsRuntime !== (part.ownsRuntime === true)) {
      errors.push(`Toast specialized adapter spec ${partName} ownsRuntime must match contract.`);
    }
    if (recipe.publicRef !== hasPublicRef(spec, partName)) {
      errors.push(`Toast specialized adapter spec ${partName} publicRef must match contract.`);
    }
    if (recipe.role !== part.role) {
      errors.push(`Toast specialized adapter spec ${partName} role must match contract.`);
    }
  }

  return errors;
}

function validateManager(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Toast specialized adapter spec requires manager metadata."];
  }

  return recipeEquals(() => buildManagerRecipe(spec), value)
    ? []
    : [
        "Toast specialized adapter spec manager metadata must match viewport runtime factory, options, lifecycle, and registration boundary.",
      ];
}

function validateNamespace(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Toast specialized adapter spec requires namespace metadata."];
  }

  let expected: ToastNamespaceRecipe;
  try {
    expected = buildNamespaceRecipe(spec);
  } catch {
    return ["Toast specialized adapter spec namespace metadata is incomplete."];
  }

  const errors: string[] = [];
  if (value.defaultExport !== expected.defaultExport || value.namespace !== expected.namespace) {
    errors.push("Toast specialized adapter spec namespace default export must be Toast.");
  }
  if (value.defaultNamespace !== true) {
    errors.push("Toast specialized adapter spec namespace must keep defaultNamespace enabled.");
  }
  if (!arraysEqual(asArray(value.memberParts), expected.memberParts)) {
    errors.push(
      "Toast specialized adapter spec namespace memberParts must match generated export order.",
    );
  }
  if (!arraysEqual(asArray(value.namedExports), expected.namedExports)) {
    errors.push(
      "Toast specialized adapter spec namespace namedExports must match generated export order.",
    );
  }
  if (!recordsArrayEqual(asArray(value.objectEntries), expected.objectEntries)) {
    errors.push(
      "Toast specialized adapter spec namespace objectEntries must match generated export order.",
    );
  }

  return errors;
}

function validatePublicApi(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Toast specialized adapter spec requires publicApi metadata."];
  }

  return recipeEquals(() => buildPublicApiRecipe(spec), value)
    ? []
    : [
        "Toast specialized adapter spec publicApi metadata must match toast export, runtime import, type exports, methods, and Runtime ownership boundary.",
      ];
}

function validateRootState(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Toast specialized adapter spec requires rootState metadata."];
  }

  return recipeEquals(() => buildRootStateRecipe(spec), value)
    ? []
    : [
        "Toast specialized adapter spec rootState metadata must match toast root id, state, variant, role, and ARIA facts.",
      ];
}

function validateShippingFiles(spec: ToastSpecializedAdapterSpec): string[] {
  const expected = buildShippingFileRecipes({
    ...spec,
    files: spec.renderPlan.files,
  });

  return recordsArrayEqual(spec.files, expected)
    ? []
    : ["Toast specialized adapter spec files must match exported Toast parts plus index."];
}

function validateTemplate(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Toast specialized adapter spec requires template metadata."];
  }

  return recipeEquals(() => buildTemplateRecipe(spec), value)
    ? []
    : [
        "Toast specialized adapter spec template metadata must match variant prop, template/root attributes, and Runtime cloning boundary.",
      ];
}

function validateViewportOptions(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Toast specialized adapter spec requires viewportOptions metadata."];
  }

  return recipeEquals(() => buildViewportOptionsRecipe(spec), value)
    ? []
    : [
        "Toast specialized adapter spec viewportOptions metadata must match duration, gap, limit, peek, and position facts.",
      ];
}

function assertPart(spec: SpecializedAdapterSpec, partName: string): void {
  if (!hasPart(spec, partName)) {
    throw new Error(`Toast specialized adapter spec requires ${partName} part.`);
  }
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function arraysEqual(actual: readonly unknown[], expected: readonly unknown[]): boolean {
  return (
    actual.length === expected.length && actual.every((value, index) => value === expected[index])
  );
}

function findTargetProp(spec: SpecializedAdapterSpec, propName: string, targetPart: string) {
  return spec.props.find(
    (candidate) => candidate.name === propName && candidate.targets?.includes(targetPart),
  );
}

function getInitialAttributeNames(spec: SpecializedAdapterSpec, partName: string): string[] {
  return spec.renderPlan.staticAttributes
    .filter((attribute) => attribute.part === partName)
    .map((attribute) => attribute.name);
}

function getPart(spec: SpecializedAdapterSpec, partName: string) {
  const part = spec.parts.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`Toast specialized adapter spec requires ${partName} part.`);
  }

  return part;
}

function getProp(spec: SpecializedAdapterSpec, propName: string): PrimitivePropContract {
  const prop = spec.props.find((candidate) => candidate.name === propName);
  if (!prop) {
    throw new Error(`Toast specialized adapter spec requires ${propName} prop metadata.`);
  }

  return prop;
}

function getRequiredValue<T>(value: T | undefined, context: string): T {
  if (value === undefined) {
    throw new Error(`Toast specialized adapter spec requires ${context}.`);
  }

  return value;
}

function getToastFileExportName(
  spec: ToastSpecializedAdapterSpec,
  partName: AdapterNotificationSystemPartName | string,
): string {
  const entry = spec.toast.namespace.objectEntries.find((candidate) => candidate.part === partName);
  if (!entry) {
    throw new Error(`Toast specialized adapter spec requires ${partName} namespace export.`);
  }

  return entry.exportName;
}

function getToastNamespaceEntryByExportName(
  spec: ToastSpecializedAdapterSpec,
  exportName: string,
) {
  const entry = spec.toast.namespace.objectEntries.find(
    (candidate) => candidate.exportName === exportName,
  );
  if (!entry) {
    throw new Error(
      `Toast specialized adapter spec requires ${exportName} namespace export.`,
    );
  }

  return entry;
}

function getToastSpecFileBasename(
  spec: ToastSpecializedAdapterSpec,
  partName: AdapterNotificationSystemPartName | string,
): string {
  const file = spec.files.find(
    (candidate) => candidate.kind === "part" && candidate.part === partName,
  );
  if (!file) {
    throw new Error(`Toast specialized adapter spec requires ${partName} file metadata.`);
  }

  return file.path.split("/").at(-1) ?? file.path;
}

function getStaticAttributeName(
  spec: SpecializedAdapterSpec,
  partName: string,
  name: string,
): string {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) => candidate.part === partName && candidate.name === name,
  );
  if (!attribute) {
    throw new Error(`Toast specialized adapter spec requires ${name} metadata for ${partName}.`);
  }

  return attribute.name;
}

function getStaticAttributeValue(
  spec: SpecializedAdapterSpec,
  partName: string,
  name: string,
): string {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) => candidate.part === partName && candidate.name === name,
  );
  if (!attribute?.value) {
    throw new Error(
      `Toast specialized adapter spec requires ${name} value metadata for ${partName}.`,
    );
  }

  return attribute.value;
}

function getTargetProp(
  spec: SpecializedAdapterSpec,
  propName: string,
  targetPart: string,
): PrimitivePropContract {
  const prop = findTargetProp(spec, propName, targetPart);
  if (!prop) {
    throw new Error(
      `Toast specialized adapter spec requires ${propName} prop metadata for ${targetPart}.`,
    );
  }

  return prop;
}

function hasPart(spec: SpecializedAdapterSpec, partName: string): boolean {
  return spec.parts.some((part) => part.name === partName);
}

function hasPublicRef(spec: SpecializedAdapterSpec, partName: string): boolean {
  return spec.refs.some((ref) => ref.part === partName && ref.public);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function recipeEquals(buildExpected: () => unknown, actual: unknown): boolean {
  try {
    return recordsEqual(actual, buildExpected());
  } catch {
    return false;
  }
}

function recordsArrayEqual(actual: unknown[], expected: unknown[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every((entry, index) => recordsEqual(entry, expected[index]))
  );
}

function recordsEqual(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function toPascalCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => `${segment[0].toUpperCase()}${segment.slice(1)}`)
    .join("");
}
