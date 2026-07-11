import type {
  PrimitivePropContract,
  PrimitiveRuntimeOptionLifecycle,
  RuntimeAdapterContract,
} from "../../contracts/primitive/types.js";
import type {
  AdapterComponentFile,
  AdapterEngineViewportFacts,
  AdapterEngineViewportPartName,
  AdapterIndexFile,
  AdapterOutputModel,
} from "../framework-adapters/index.js";
import {
  buildBaseSpecializedAdapterSpec,
  validateSpecializedAdapterSpec,
} from "./base-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec } from "./types.js";

export type CarouselSpecializedAdapterSpec = SpecializedAdapterSpec & {
  sourcePrimitiveContract: RuntimeAdapterContract;
  carousel: {
    adapterKind: "engine-backed-carousel";
    anatomy: CarouselAnatomyRecipe[];
    controls: CarouselControlsRecipe;
    engine: CarouselEngineRecipe;
    namespace: CarouselNamespaceRecipe;
    options: CarouselOptionsRecipe;
    runtimeBoundary: string[];
  };
};

type CarouselAnatomyRecipe = {
  defaultElement: string;
  discoveryAttribute: string;
  initialAttributes: string[];
  part: string;
  publicRef: boolean;
  role?: string;
};

type CarouselControlRecipe = {
  disabledAttributes: ["aria-disabled", "data-disabled"];
  part: "previous" | "next";
  typeAttribute: "type";
  typeValue: "button";
};

type CarouselControlsRecipe = {
  next: CarouselControlRecipe;
  previous: CarouselControlRecipe;
  runtimeBoundary: string;
};

type CarouselEngineRecipe = {
  name: "Embla";
  runtimeBoundary: string;
  runtimeFactory: string;
  runtimeImportSource: SpecializedAdapterSpec["root"]["runtimeImportSource"];
};

type CarouselNamespaceRecipe = {
  defaultExport: "Carousel";
  defaultNamespace: boolean;
  memberParts: string[];
  namedExports: string[];
  namespace: "Carousel";
  objectEntries: CarouselNamespaceObjectEntry[];
};

type CarouselNamespaceObjectEntry = {
  exportName: string;
  part: string;
  property: string;
};

type CarouselOptionsRecipe = {
  autoInit: {
    attribute: "data-auto-init";
    defaultValue: "true";
    falseValue: "false";
    prop: "autoInit";
    type: "boolean";
    unsupportedTargets: ["react"];
  };
  opts: {
    attribute: "data-opts";
    defaultValue: "{}";
    lifecycle: "refresh-required";
    prop: "opts";
    serialization: "json";
    type: 'CarouselOptions["opts"]';
  };
  orientation: {
    attribute: "data-axis";
    axisMap: {
      horizontal: "x";
      vertical: "y";
    };
    defaultValue: '"horizontal"';
    lifecycle: "refresh-required";
    prop: "orientation";
    type: '"horizontal" | "vertical"';
  };
  plugins: {
    lifecycle: "refresh-required";
    prop: "plugins";
    type: 'CarouselOptions["plugins"]';
    unsupportedTargets: ["astro"];
  };
  setApi: {
    apiType: 'CarouselInstance["api"]';
    lifecycle: "constructor-only";
    prop: "setApi";
    refLifecycle: "latest-callback-ref";
    type: '(api: CarouselInstance["api"]) => void';
    unsupportedTargets: ["astro"];
  };
};

const CAROUSEL_ANATOMY_PARTS = [
  "root",
  "viewport",
  "container",
  "item",
  "previous",
  "next",
] as const;
const CAROUSEL_NAMED_EXPORT_PARTS = [
  "container",
  "item",
  "next",
  "previous",
  "root",
  "viewport",
] as const;
const CAROUSEL_RUNTIME_BOUNDARY = [
  "Embla engine creation and destruction",
  "option forwarding and plugin setup/cleanup",
  "keyboard navigation and slide state",
  "previous/next disabled state",
  "measurement and resize/viewport reinitialization",
  "scroll physics and carousel API mutation",
] as const;
const CAROUSEL_ENGINE_RUNTIME_BOUNDARY =
  "Runtime owns Embla creation, option forwarding, plugin setup, keyboard navigation, slide state, control disabled state, measurement, reinitialization, and cleanup.";
const CAROUSEL_CONTROLS_RUNTIME_BOUNDARY =
  "Runtime owns previous/next disabled state, click handling, keyboard navigation, and slide selection.";
const CAROUSEL_OPTION_PROPS = ["orientation", "opts", "plugins", "setApi", "autoInit"] as const;
const CAROUSEL_RUNTIME_OPTION_PROPS = ["orientation", "opts", "plugins", "setApi"] as const;
const CAROUSEL_OPTIONS_MISMATCH =
  "Carousel specialized adapter spec options must match orientation, opts, plugins, setApi, and autoInit source contract facts.";

export function buildCarouselSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): CarouselSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "carousel") {
    throw new Error(
      `${spec.displayName} cannot be rendered as the Carousel specialized adapter spec.`,
    );
  }

  for (const part of CAROUSEL_ANATOMY_PARTS) {
    assertPart(spec, part);
  }

  return {
    ...spec,
    files: buildShippingFileRecipes(spec),
    sourcePrimitiveContract: contract,
    carousel: {
      adapterKind: "engine-backed-carousel",
      anatomy: buildAnatomyRecipes(spec),
      controls: buildControlsRecipe(spec),
      engine: buildEngineRecipe(spec),
      namespace: buildNamespaceRecipe(spec),
      options: buildOptionsRecipe(spec, contract),
      runtimeBoundary: [...CAROUSEL_RUNTIME_BOUNDARY],
    },
  };
}

const CAROUSEL_OUTPUT_MODEL_PARTS = [
  "container",
  "item",
  "next",
  "previous",
  "root",
  "viewport",
] as const satisfies readonly AdapterEngineViewportPartName[];

export function buildCarouselAdapterOutputModel(spec: CarouselSpecializedAdapterSpec): AdapterOutputModel {
  const facts = getCarouselEngineFacts(spec);

  return {
    files: [
      ...CAROUSEL_OUTPUT_MODEL_PARTS.map((partName) =>
        createCarouselComponentFile(spec, partName, facts),
      ),
      createCarouselIndexFile(spec, facts),
    ],
  } satisfies AdapterOutputModel;
}

function createCarouselComponentFile(
  spec: CarouselSpecializedAdapterSpec,
  partName: AdapterEngineViewportPartName,
  facts: AdapterEngineViewportFacts,
): AdapterComponentFile {
  const part = getPart(spec, partName);
  const exportName = getCarouselFileExportName(spec, partName);

  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${spec.displayName}.${facts.parts[partName].namespaceKey}`,
      events: [],
      exports: { kind: "namespace", members: [], namespace: exportName },
      family: { facts, kind: "engine-viewport", part: partName },
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

function createCarouselIndexFile(
  spec: CarouselSpecializedAdapterSpec,
  facts: AdapterEngineViewportFacts,
): AdapterIndexFile {
  return {
    exports: {
      kind: "namespace",
      members: facts.index.importMembers,
      namespace: facts.exports.namespace,
    },
    family: { facts, kind: "engine-viewport" },
    imports: [],
    kind: "index",
    path: `${spec.component}/index.ts`,
    typeFacades: [],
  };
}

function getCarouselEngineFacts(spec: CarouselSpecializedAdapterSpec): AdapterEngineViewportFacts {
  const errors = validateCarouselSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(`Carousel output model cannot print invalid Carousel spec:\n${errors.join("\n")}`);
  }

  const namespace = spec.carousel.namespace;
  const exportsByPart = Object.fromEntries(
    CAROUSEL_OUTPUT_MODEL_PARTS.map((partName) => [
      partName,
      getCarouselFileExportName(spec, partName),
    ]),
  ) as Record<AdapterEngineViewportPartName, string>;

  return {
    attrs: {
      autoInit: spec.carousel.options.autoInit.attribute,
      axis: spec.carousel.options.orientation.attribute,
      container: getPart(spec, "container").discoveryAttribute,
      item: getPart(spec, "item").discoveryAttribute,
      itemRole: getStaticAttributeName(spec, "item", "role"),
      itemRoledescription: getStaticAttributeName(spec, "item", "aria-roledescription"),
      next: getPart(spec, "next").discoveryAttribute,
      opts: spec.carousel.options.opts.attribute,
      previous: getPart(spec, "previous").discoveryAttribute,
      role: getStaticAttributeName(spec, "root", "role"),
      root: getPart(spec, "root").discoveryAttribute,
      roledescription: getStaticAttributeName(spec, "root", "aria-roledescription"),
      viewport: getPart(spec, "viewport").discoveryAttribute,
    },
    controls: {
      next: {
        typeAttribute: spec.carousel.controls.next.typeAttribute,
        typeValue: spec.carousel.controls.next.typeValue,
      },
      previous: {
        typeAttribute: spec.carousel.controls.previous.typeAttribute,
        typeValue: spec.carousel.controls.previous.typeValue,
      },
    },
    displayName: spec.displayName,
    exports: {
      ...exportsByPart,
      namespace: namespace.namespace,
    },
    index: {
      importMembers: namespace.namedExports
        .filter((exportName) => exportName !== namespace.namespace)
        .map((exportName) => {
          const entry = namespace.objectEntries.find((candidate) => candidate.exportName === exportName);
          if (!entry) {
            throw new Error(`Carousel output model requires ${exportName} namespace entry.`);
          }

          return {
            from: `./${getCarouselFileExportName(spec, entry.part)}`,
            name: entry.exportName,
          };
        }),
      namespaceMembers: namespace.objectEntries.map((entry) => ({
        key: entry.property,
        name: entry.exportName,
      })),
      typeExportSource: "@starwind-ui/runtime",
      typeExports: ["CarouselInstance", "CarouselOptions"],
      valueExportSource: spec.root.runtimeImportSource,
      valueExports: [spec.root.runtimeFactory],
    },
    options: {
      autoInit: {
        defaultValue: spec.carousel.options.autoInit.defaultValue,
        falseValue: spec.carousel.options.autoInit.falseValue,
        name: spec.carousel.options.autoInit.prop,
        type: spec.carousel.options.autoInit.type,
      },
      opts: {
        defaultValue: spec.carousel.options.opts.defaultValue,
        name: spec.carousel.options.opts.prop,
        type: spec.carousel.options.opts.type,
      },
      orientation: {
        axisMap: spec.carousel.options.orientation.axisMap,
        defaultValue: spec.carousel.options.orientation.defaultValue,
        name: spec.carousel.options.orientation.prop,
        type: spec.carousel.options.orientation.type,
      },
      plugins: {
        name: spec.carousel.options.plugins.prop,
        type: spec.carousel.options.plugins.type,
      },
      setApi: {
        name: spec.carousel.options.setApi.prop,
        type: spec.carousel.options.setApi.type,
      },
    },
    parts: Object.fromEntries(
      CAROUSEL_OUTPUT_MODEL_PARTS.map((partName) => [
        partName,
        getCarouselOutputPart(spec, partName),
      ]),
    ) as AdapterEngineViewportFacts["parts"],
    runtime: {
      apiType: spec.carousel.options.setApi.apiType,
      factory: spec.root.runtimeFactory,
      importSource: spec.root.runtimeImportSource,
      instanceType: "CarouselInstance",
      optionsType: "CarouselOptions",
      setupFunction: "setupCarousels",
    },
    semantics: {
      itemRole: getStaticAttributeValue(spec, "item", "role"),
      itemRoledescription: getStaticAttributeValue(spec, "item", "aria-roledescription"),
      rootRole: getStaticAttributeValue(spec, "root", "role"),
      rootRoledescription: getStaticAttributeValue(spec, "root", "aria-roledescription"),
    },
  };
}

export function validateCarouselSpecializedAdapterSpec(
  spec: CarouselSpecializedAdapterSpec,
): string[] {
  const errors = validateSpecializedAdapterSpec(spec);
  if (!isRecord(spec) || spec.component !== "carousel") {
    errors.push("Carousel specialized adapter spec must target the carousel primitive.");
    return errors;
  }

  const carousel = isRecord(spec.carousel) ? spec.carousel : undefined;
  if (!carousel) {
    errors.push("Carousel specialized adapter spec is missing carousel metadata.");
    return errors;
  }

  if (carousel.adapterKind !== "engine-backed-carousel") {
    errors.push('Carousel specialized adapter spec adapterKind must be "engine-backed-carousel".');
  }

  const expectedFields = new Set([
    "adapterKind",
    "anatomy",
    "controls",
    "engine",
    "namespace",
    "options",
    "runtimeBoundary",
  ]);
  const behaviorFields = new Set([
    "disabledControlState",
    "emblaLifecycle",
    "engineCreation",
    "engineDestruction",
    "engineLifecycle",
    "keyboardNavigation",
    "measurement",
    "physics",
    "pluginSetup",
    "reinitialization",
    "resizeObserver",
    "scrollPhysics",
    "slideState",
  ]);
  collectCarouselBehaviorFieldErrors(carousel, ["carousel"], behaviorFields, errors);

  for (const key of Object.keys(carousel)) {
    if (behaviorFields.has(key)) continue;

    if (!expectedFields.has(key)) {
      errors.push(`Carousel specialized adapter spec must not declare unexpected field "${key}".`);
    }
  }

  for (const part of CAROUSEL_ANATOMY_PARTS) {
    if (!hasPart(spec, part)) {
      errors.push(`Carousel specialized adapter spec requires ${part} part.`);
    }
  }

  errors.push(...validateAnatomy(spec, carousel.anatomy));
  errors.push(...validateEngine(spec, carousel.engine));
  errors.push(...validateOptions(spec, carousel.options));
  errors.push(...validateControls(spec, carousel.controls));
  errors.push(...validateNamespace(spec, carousel.namespace));
  errors.push(...validateShippingFiles(spec));


  if (!arraysEqual(asArray(carousel.runtimeBoundary), CAROUSEL_RUNTIME_BOUNDARY)) {
    errors.push(
      "Carousel specialized adapter spec runtimeBoundary must match Runtime-owned Embla behavior.",
    );
  }

  return errors;
}

function collectCarouselBehaviorFieldErrors(
  value: unknown,
  path: string[],
  behaviorFields: ReadonlySet<string>,
  errors: string[],
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectCarouselBehaviorFieldErrors(item, [...path, String(index)], behaviorFields, errors);
    });
    return;
  }

  if (!isRecord(value)) return;

  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...path, key];
    if (behaviorFields.has(key)) {
      errors.push(
        `Carousel specialized adapter spec must not declare ${nextPath.join(".")}; keep Runtime-owned behavior in Runtime controllers.`,
      );
    }

    collectCarouselBehaviorFieldErrors(child, nextPath, behaviorFields, errors);
  }
}

function buildShippingFileRecipes(spec: SpecializedAdapterSpec): SpecializedAdapterSpec["files"] {
  return spec.files
    .filter(
      (file) =>
        file.kind === "index" ||
        CAROUSEL_ANATOMY_PARTS.includes(file.part as (typeof CAROUSEL_ANATOMY_PARTS)[number]),
    )
    .map((file) => ({ ...file }));
}

function buildAnatomyRecipes(spec: SpecializedAdapterSpec): CarouselAnatomyRecipe[] {
  return CAROUSEL_ANATOMY_PARTS.map((partName) => {
    const part = getPart(spec, partName);

    return {
      defaultElement: part.defaultElement,
      discoveryAttribute: part.discoveryAttribute,
      initialAttributes: getInitialAttributeNames(spec, partName),
      part: part.name,
      publicRef: hasPublicRef(spec, partName),
      role: part.role,
    };
  });
}

function buildControlsRecipe(spec: SpecializedAdapterSpec): CarouselControlsRecipe {
  return {
    next: buildControlRecipe(spec, "next"),
    previous: buildControlRecipe(spec, "previous"),
    runtimeBoundary: CAROUSEL_CONTROLS_RUNTIME_BOUNDARY,
  };
}

function buildControlRecipe(
  spec: SpecializedAdapterSpec,
  partName: "previous" | "next",
): CarouselControlRecipe {
  getPart(spec, partName);

  return {
    disabledAttributes: [
      getStaticAttributeName(spec, partName, "aria-disabled") as "aria-disabled",
      getStaticAttributeName(spec, partName, "data-disabled") as "data-disabled",
    ],
    part: partName,
    typeAttribute: getStaticAttributeName(spec, partName, "type") as "type",
    typeValue: getStaticAttributeValue(spec, partName, "type") as "button",
  };
}

function buildEngineRecipe(spec: SpecializedAdapterSpec): CarouselEngineRecipe {
  return {
    name: "Embla",
    runtimeBoundary: CAROUSEL_ENGINE_RUNTIME_BOUNDARY,
    runtimeFactory: spec.root.runtimeFactory,
    runtimeImportSource: spec.root.runtimeImportSource,
  };
}

function buildNamespaceRecipe(spec: SpecializedAdapterSpec): CarouselNamespaceRecipe {
  const membersByPart = new Map(spec.exports.members.map((member) => [member.part, member]));
  const objectEntries = CAROUSEL_ANATOMY_PARTS.map((part) => {
    const member = membersByPart.get(part);
    if (!member) {
      throw new Error(`Carousel specialized adapter spec requires ${part} namespace export.`);
    }

    return {
      exportName: member.name,
      part,
      property: toPascalCase(part),
    };
  });

  return {
    defaultExport: "Carousel",
    defaultNamespace: spec.exports.defaultNamespace,
    memberParts: objectEntries.map((entry) => entry.part),
    namedExports: [
      "Carousel",
      ...CAROUSEL_NAMED_EXPORT_PARTS.map((part) => {
        const member = membersByPart.get(part);
        if (!member) {
          throw new Error(`Carousel specialized adapter spec requires ${part} namespace export.`);
        }

        return member.name;
      }),
    ],
    namespace: "Carousel",
    objectEntries,
  };
}

function buildOptionsRecipe(
  spec: SpecializedAdapterSpec,
  contract: RuntimeAdapterContract,
): CarouselOptionsRecipe {
  const orientation = getTargetProp(spec, "orientation", "root");
  const opts = getTargetProp(spec, "opts", "root");
  const plugins = getTargetProp(spec, "plugins", "root");
  const setApi = getTargetProp(spec, "setApi", "root");
  const autoInit = getTargetProp(spec, "autoInit", "root");
  const sourcePlugins = getSourceTargetProp(contract, "plugins", "root");
  const sourceSetApi = getSourceTargetProp(contract, "setApi", "root");
  const sourceAutoInit = getSourceTargetProp(contract, "autoInit", "root");

  return {
    autoInit: {
      attribute: getStaticAttributeName(spec, "root", "data-auto-init") as "data-auto-init",
      defaultValue: getRequiredValue(autoInit.defaultValue, "autoInit default value") as "true",
      falseValue: "false",
      prop: "autoInit",
      type: autoInit.type as "boolean",
      unsupportedTargets: getUnsupportedTargets(sourceAutoInit) as ["react"],
    },
    opts: {
      attribute: getStaticAttributeName(spec, "root", "data-opts") as "data-opts",
      defaultValue: getRequiredValue(opts.defaultValue, "opts default value") as "{}",
      lifecycle: getOptionLifecycle(contract, "opts", "refresh-required"),
      prop: "opts",
      serialization: "json",
      type: opts.type as 'CarouselOptions["opts"]',
    },
    orientation: {
      attribute: getStaticAttributeName(spec, "root", "data-axis") as "data-axis",
      axisMap: { horizontal: "x", vertical: "y" },
      defaultValue: getRequiredValue(
        orientation.defaultValue,
        "orientation default value",
      ) as '"horizontal"',
      lifecycle: getOptionLifecycle(contract, "orientation", "refresh-required"),
      prop: "orientation",
      type: orientation.type as '"horizontal" | "vertical"',
    },
    plugins: {
      lifecycle: getOptionLifecycle(contract, "plugins", "refresh-required"),
      prop: "plugins",
      type: plugins.type as 'CarouselOptions["plugins"]',
      unsupportedTargets: getUnsupportedTargets(sourcePlugins) as ["astro"],
    },
    setApi: {
      apiType: 'CarouselInstance["api"]',
      lifecycle: getOptionLifecycle(contract, "setApi", "constructor-only"),
      prop: "setApi",
      refLifecycle: "latest-callback-ref",
      type: setApi.type as '(api: CarouselInstance["api"]) => void',
      unsupportedTargets: getUnsupportedTargets(sourceSetApi) as ["astro"],
    },
  };
}

function validateAnatomy(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["Carousel specialized adapter spec requires anatomy metadata."];
  }

  const errors: string[] = [];
  if (
    !arraysEqual(
      value.map((part) => (isRecord(part) ? part.part : undefined)),
      CAROUSEL_ANATOMY_PARTS,
    )
  ) {
    errors.push(
      "Carousel specialized adapter spec anatomy must match root, viewport, container, item, previous, next.",
    );
  }

  for (const partName of CAROUSEL_ANATOMY_PARTS) {
    const recipe = value.find((part) => isRecord(part) && part.part === partName);
    if (!isRecord(recipe)) {
      errors.push(`Carousel specialized adapter spec requires ${partName} anatomy part.`);
      continue;
    }

    const part = spec.parts.find((candidate) => candidate.name === partName);
    if (!part) {
      errors.push(`Carousel specialized adapter spec requires ${partName} part.`);
      continue;
    }
    if (recipe.defaultElement !== part.defaultElement) {
      errors.push(
        `Carousel specialized adapter spec ${partName} defaultElement must match contract.`,
      );
    }
    if (recipe.discoveryAttribute !== part.discoveryAttribute) {
      errors.push(
        `Carousel specialized adapter spec ${partName} discoveryAttribute must match contract.`,
      );
    }
    if (!arraysEqual(asArray(recipe.initialAttributes), getInitialAttributeNames(spec, partName))) {
      errors.push(
        `Carousel specialized adapter spec ${partName} initialAttributes must match contract.`,
      );
    }
    if (recipe.publicRef !== hasPublicRef(spec, partName)) {
      errors.push(`Carousel specialized adapter spec ${partName} publicRef must match contract.`);
    }
    if (recipe.role !== part.role) {
      errors.push(`Carousel specialized adapter spec ${partName} role must match contract.`);
    }
  }

  return errors;
}

function validateControls(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Carousel specialized adapter spec requires controls metadata."];
  }

  return recipeEquals(() => buildControlsRecipe(spec), value)
    ? []
    : [
        "Carousel specialized adapter spec controls metadata must match previous/next button and disabled-state facts.",
      ];
}

function validateEngine(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Carousel specialized adapter spec requires engine metadata."];
  }

  return recipeEquals(() => buildEngineRecipe(spec), value)
    ? []
    : [
        "Carousel specialized adapter spec engine metadata must match Runtime Embla factory and ownership facts.",
      ];
}

function validateNamespace(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Carousel specialized adapter spec requires namespace metadata."];
  }

  let expected: CarouselNamespaceRecipe;
  try {
    expected = buildNamespaceRecipe(spec);
  } catch {
    return ["Carousel specialized adapter spec namespace metadata is incomplete."];
  }

  const errors: string[] = [];
  if (value.defaultExport !== expected.defaultExport || value.namespace !== expected.namespace) {
    errors.push("Carousel specialized adapter spec namespace default export must be Carousel.");
  }
  if (value.defaultNamespace !== true) {
    errors.push("Carousel specialized adapter spec namespace must keep defaultNamespace enabled.");
  }
  if (!arraysEqual(asArray(value.memberParts), expected.memberParts)) {
    errors.push(
      "Carousel specialized adapter spec namespace memberParts must match generated export order.",
    );
  }
  if (!arraysEqual(asArray(value.namedExports), expected.namedExports)) {
    errors.push(
      "Carousel specialized adapter spec namespace namedExports must match generated export order.",
    );
  }
  if (!recordsArrayEqual(asArray(value.objectEntries), expected.objectEntries)) {
    errors.push(
      "Carousel specialized adapter spec namespace objectEntries must match generated export order.",
    );
  }

  return errors;
}

function validateOptions(spec: CarouselSpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Carousel specialized adapter spec requires option metadata."];
  }

  if (
    !arraysEqual(
      asArray(spec.sourcePrimitiveContract.runtime.optionProps),
      CAROUSEL_RUNTIME_OPTION_PROPS,
    ) ||
    !arraysEqual(asArray(spec.renderPlan.runtime.optionProps), CAROUSEL_RUNTIME_OPTION_PROPS)
  ) {
    return [CAROUSEL_OPTIONS_MISMATCH];
  }

  const hasAllOptionProps = CAROUSEL_OPTION_PROPS.every((propName) =>
    findTargetAwareProp(spec.props, propName, "root"),
  );
  if (!hasAllOptionProps) {
    return [CAROUSEL_OPTIONS_MISMATCH];
  }

  return recipeEquals(() => buildOptionsRecipe(spec, spec.sourcePrimitiveContract), value)
    ? []
    : [CAROUSEL_OPTIONS_MISMATCH];
}

function validateShippingFiles(spec: CarouselSpecializedAdapterSpec): string[] {
  const expected = buildShippingFileRecipes({
    ...spec,
    files: spec.renderPlan.files,
  });

  return recordsArrayEqual(spec.renderPlan.files, expected) &&
    recordsArrayEqual(spec.files, expected)
    ? []
    : [
        "Carousel specialized adapter spec files must match root, viewport, container, item, previous, next, plus index.",
      ];
}

function getCarouselFileExportName(
  spec: CarouselSpecializedAdapterSpec,
  partName: string,
): string {
  const file = spec.files.find(
    (candidate) => candidate.kind === "part" && candidate.part === partName,
  );
  if (!file || file.kind !== "part") {
    throw new Error(`Carousel output model requires ${partName} part file metadata.`);
  }

  const expectedPath = `${spec.component}/${file.exportName}`;
  if (file.path !== expectedPath) {
    throw new Error(`Carousel output model requires ${partName} file path ${expectedPath}.`);
  }

  return file.exportName;
}

function getCarouselOutputPart(
  spec: CarouselSpecializedAdapterSpec,
  partName: AdapterEngineViewportPartName,
): AdapterEngineViewportFacts["parts"][AdapterEngineViewportPartName] {
  const part = getPart(spec, partName);
  const namespaceEntry = spec.carousel.namespace.objectEntries.find(
    (entry) => entry.part === partName,
  );
  if (!namespaceEntry) {
    throw new Error(`Carousel output model requires ${partName} namespace metadata.`);
  }

  return {
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    name: part.name,
    namespaceKey: namespaceEntry.property,
    ...(part.role ? { role: part.role } : {}),
  };
}

function assertPart(spec: SpecializedAdapterSpec, partName: string): void {
  if (!hasPart(spec, partName)) {
    throw new Error(`Carousel specialized adapter spec requires ${partName} part.`);
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

function findTargetAwareProp<T extends { name: string; targets?: readonly string[] }>(
  props: readonly T[],
  propName: string,
  targetPart: string,
): T | undefined {
  return props.find(
    (candidate) => candidate.name === propName && candidate.targets?.includes(targetPart),
  );
}

function getInitialAttributeNames(spec: SpecializedAdapterSpec, partName: string): string[] {
  return spec.renderPlan.staticAttributes
    .filter((attribute) => attribute.part === partName)
    .map((attribute) => attribute.name);
}

function getOptionLifecycle<T extends PrimitiveRuntimeOptionLifecycle>(
  contract: RuntimeAdapterContract,
  propName: string,
  expected: T,
): T {
  const lifecycle = contract.runtime.optionPropLifecycles?.[propName];
  if (lifecycle !== expected) {
    throw new Error(
      `Carousel specialized adapter spec requires ${expected} lifecycle for ${propName}.`,
    );
  }

  return expected;
}

function getPart(spec: SpecializedAdapterSpec, partName: string) {
  const part = spec.parts.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`Carousel specialized adapter spec requires ${partName} part.`);
  }

  return part;
}

function getRequiredValue<T>(value: T | undefined, context: string): T {
  if (value === undefined) {
    throw new Error(`Carousel specialized adapter spec requires ${context}.`);
  }

  return value;
}

function getSourceTargetProp(
  contract: RuntimeAdapterContract,
  propName: string,
  targetPart: string,
): PrimitivePropContract {
  const prop = findTargetAwareProp(contract.props, propName, targetPart);
  if (!prop) {
    throw new Error(
      `Carousel specialized adapter spec requires ${propName} source prop metadata for ${targetPart}.`,
    );
  }

  return prop;
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
    throw new Error(`Carousel specialized adapter spec requires ${name} metadata for ${partName}.`);
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
      `Carousel specialized adapter spec requires ${name} value metadata for ${partName}.`,
    );
  }

  return attribute.value;
}

function getTargetProp(spec: SpecializedAdapterSpec, propName: string, targetPart: string) {
  const prop = findTargetAwareProp(spec.props, propName, targetPart);
  if (!prop) {
    throw new Error(
      `Carousel specialized adapter spec requires ${propName} prop metadata for ${targetPart}.`,
    );
  }

  return prop;
}

function getUnsupportedTargets(prop: PrimitivePropContract): string[] {
  return prop.unsupportedTargets ? [...prop.unsupportedTargets] : [];
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
