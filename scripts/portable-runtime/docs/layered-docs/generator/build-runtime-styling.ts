import { type RuntimeAdapterContract } from "../../../contracts/primitive/types.js";
import { starwindStyledContracts } from "../../../contracts/styled/components/index.js";
import {
  type AttributeContract,
  type ClassVariantDefinition,
  type FrameworkTarget as ContractFrameworkTarget,
  type RenderNode,
  type StyledAdapterContract,
  type StyledComponentContract,
  type StyledComponentStylesContract,
  type ValueExpression,
} from "../../../contracts/styled/types.js";
import {
  type ComponentGroupMetadata,
  type FrameworkAvailability,
  type PrimitiveDocsMetadata,
  type PrimitiveRuntimeOptionLifecycle,
  type RuntimeDocsMetadata,
  type RuntimeExportReferenceMetadata,
  type RuntimeFactoryMetadata,
  type RuntimeFactoryReferenceMetadata,
  type RuntimeRawHtmlInitializerMetadata,
  type StyledComponentDocsMetadata,
  type StyledDocsAnnotation,
  type StyledFrameworkTarget,
  type StylingComponentMetadata,
  type StylingDocsMetadata,
  type StylingLocalStylesMetadata,
  type StylingStateSelectorMetadata,
  type StylingThemeMetadata,
  type StylingVariantCollectionMetadata,
} from "../types.js";
import fs from "node:fs";
import { buildEmptyStyledApiMetadata } from "./build-styled-api.js";
import {
  FOUNDATION_LABELS,
  FRAMEWORK_TARGETS,
  RUNTIME_DOCS_PATH,
  RUNTIME_INITIALIZER_FACTORY_ALIASES,
  STYLING_DOCS_PATH,
  STYLING_RECIPES,
  STYLING_SECTIONS,
} from "./constants.js";
import {
  runtimeIndexPath,
  runtimeInitStarwindPath,
  runtimePackageJsonPath,
  themeTemplatePath,
} from "./paths.js";
import { dedupe, formatError, toKebabCase, toTitle } from "./shared.js";

export const buildRuntimeDocsMetadata = (
  primitives: readonly PrimitiveDocsMetadata[],
  runtimeExports: ReadonlySet<string>,
  runtimeIndexSource: string,
  initStarwindSource: string,
  validationIssues: string[],
): RuntimeDocsMetadata => {
  const initStarwind = {
    exportName: "initStarwind",
    importSource: "@starwind-ui/runtime/init-starwind",
    signature: "initStarwind(root?: ParentNode): StarwindCleanup",
    docsPath: `${RUNTIME_DOCS_PATH}#init-starwind`,
    cleanupMethod: "destroy()",
  } as const;
  const themeHelpers = [
    {
      exportName: "createThemeController",
      importSource: "@starwind-ui/runtime/theme",
      signature: "createThemeController(options?: ThemeControllerOptions): ThemeControllerInstance",
      docsPath: `${RUNTIME_DOCS_PATH}#theme-controller`,
    },
    {
      exportName: "initThemeController",
      importSource: "@starwind-ui/runtime/theme",
      signature:
        'initThemeController(root?: ParentNode, options?: Omit<ThemeControllerOptions, "root">): ThemeControllerInstance',
      docsPath: `${RUNTIME_DOCS_PATH}#theme-controller`,
    },
    {
      exportName: "getThemeInitScript",
      importSource: "@starwind-ui/runtime/theme",
      signature: "getThemeInitScript(options?: ThemeInitScriptOptions): string",
      docsPath: `${RUNTIME_DOCS_PATH}#theme-init-script`,
    },
  ] as const satisfies readonly RuntimeExportReferenceMetadata[];

  validateRuntimeExportReference(
    initStarwind,
    runtimeExports,
    runtimeIndexSource,
    validationIssues,
  );
  for (const helper of themeHelpers) {
    validateRuntimeExportReference(helper, runtimeExports, runtimeIndexSource, validationIssues);
  }

  const primitiveByFactory = new Map(
    primitives.map((primitive) => [primitive.runtime.factory, primitive]),
  );
  const factories = primitives.map(toRuntimeFactoryReference);
  const rawHtmlInitializers = parseRuntimeInitializers(initStarwindSource, primitiveByFactory);

  return {
    packageName: "@starwind-ui/runtime",
    docsPage: { status: "published", path: RUNTIME_DOCS_PATH },
    initStarwind,
    rawHtml: {
      docsPath: `${RUNTIME_DOCS_PATH}#raw-html`,
      initializers: rawHtmlInitializers,
      attributeConventions: [
        {
          prefix: "data-sw-*",
          purpose: "Runtime discovery hooks.",
          examples: ["data-sw-drawer", "data-sw-menu", "data-sw-theme-toggle"],
        },
        {
          prefix: "data-*",
          purpose: "Scoped state and option attributes owned by a primitive.",
          examples: ["data-state", "data-value", "data-side", "data-auto-init"],
        },
      ],
      adapterComparison: [
        {
          surface: "Raw HTML",
          importSource: "@starwind-ui/runtime/init-starwind",
          responsibility:
            "You write the DOM contract and call initStarwind(root?) or a create* factory.",
        },
        {
          surface: "Astro Primitive adapters",
          importSource: "@starwind-ui/astro",
          responsibility:
            "Adapters render primitive anatomy and attributes while the Runtime owns DOM behavior.",
        },
        {
          surface: "React Primitive adapters",
          importSource: "@starwind-ui/react",
          responsibility:
            "Adapters expose framework props and refs for the same Runtime primitive contract.",
        },
      ],
    },
    factories,
    theme: {
      docsPath: `${RUNTIME_DOCS_PATH}#theme`,
      helpers: themeHelpers,
      controlSelectors: ["[data-sw-theme-control]", "[data-sw-theme-toggle]"],
      controlAttributes: ["data-theme-value", "data-theme-on", "data-theme-off", "data-ready"],
      events: [
        {
          name: "starwind:theme-change",
          detailsType: "StarwindThemeChangeDetails",
        },
        {
          name: "theme:change",
          detailsType: "StarwindThemeChangeDetails",
        },
      ],
    },
  };
};

export const buildStylingDocsMetadata = (
  styledComponents: readonly StyledComponentDocsMetadata[],
  primitives: readonly PrimitiveDocsMetadata[],
  themeTemplateSource: string,
  validationIssues: string[],
): StylingDocsMetadata => {
  const styledMetadataById = new Map(
    styledComponents.map((component) => [component.id, component]),
  );
  const primitiveById = new Map(primitives.map((primitive) => [primitive.id, primitive]));
  const components = starwindStyledContracts
    .map((contract) => {
      const styledMetadata = styledMetadataById.get(contract.component);

      if (!styledMetadata) {
        validationIssues.push(
          `Missing styled metadata while building styling docs for ${contract.component}.`,
        );
        return undefined;
      }

      return buildStylingComponentMetadata(contract, styledMetadata, primitiveById);
    })
    .filter((component): component is StylingComponentMetadata => component !== undefined)
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    docsPage: { status: "published", path: STYLING_DOCS_PATH },
    sections: STYLING_SECTIONS.map((section) => ({
      ...section,
      docsPath: `${STYLING_DOCS_PATH}#${section.id}`,
    })),
    theme: buildStylingThemeMetadata(themeTemplateSource),
    components,
    recipes: STYLING_RECIPES,
  };
};

const buildStylingThemeMetadata = (themeTemplateSource: string): StylingThemeMetadata => {
  const cssSource = extractTailwindConfigTemplate(themeTemplateSource);

  return {
    sourceFile: "packages/cli/src/templates/starwind.css.ts",
    docsPath: `${STYLING_DOCS_PATH}#theme-tokens`,
    tailwindIntegration: {
      imports: collectCssDirectiveValues(cssSource, "import"),
      plugins: collectCssDirectiveValues(cssSource, "plugin"),
      customVariants: [...cssSource.matchAll(/^@custom-variant\s+(\S+)\s+(.+);$/gm)].map(
        (match) => ({
          name: match[1] ?? "",
          selector: match[2] ?? "",
        }),
      ),
    },
    tokens: [
      ...collectCssTokenDeclarations(cssSource, /@theme\s*\{([\s\S]*?)\n\}/, "theme"),
      ...collectCssTokenDeclarations(
        cssSource,
        /@theme\s+inline\s*\{([\s\S]*?)\n\}/,
        "theme-inline",
      ),
      ...collectCssTokenDeclarations(cssSource, /:root\s*\{([\s\S]*?)\n\}/, "root"),
      ...collectCssTokenDeclarations(cssSource, /\.dark\s*\{([\s\S]*?)\n\}/, "dark"),
    ],
    darkModeSelector: ".dark",
    baseLayer: /@layer\s+base\s*\{/.test(cssSource),
    tokenNamingConventions: [
      "--color-* tokens bridge Tailwind utilities to Starwind CSS variables.",
      "--*-foreground tokens pair readable text colors with their background tokens.",
      "--radius-* tokens derive component radii from the shared --radius scale.",
      "--sidebar-* tokens scope navigation surfaces without changing the global palette.",
    ],
  };
};

const buildStylingComponentMetadata = (
  contract: StyledAdapterContract,
  styledMetadata: StyledComponentDocsMetadata,
  primitiveById: ReadonlyMap<string, PrimitiveDocsMetadata>,
): StylingComponentMetadata => ({
  id: styledMetadata.id,
  title: styledMetadata.title,
  ...(styledMetadata.docsPage.status === "published"
    ? { docsPath: styledMetadata.docsPage.path }
    : {}),
  primitiveDocsPaths: styledMetadata.primitiveIds
    .map((primitiveId) => primitiveById.get(primitiveId)?.docsPage.path)
    .filter((docsPath): docsPath is string => docsPath !== undefined),
  publicExports: [...styledMetadata.publicExports],
  frameworkAvailability: styledMetadata.frameworkAvailability,
  variantCollections: buildStylingVariantCollections(contract),
  slots: [...styledMetadata.slots],
  stateSelectors: collectStylingStateSelectors(contract),
  ...(contract.styles ? { localStyles: buildStylingLocalStylesMetadata(contract.styles) } : {}),
});

const buildStylingVariantCollections = (
  contract: StyledAdapterContract,
): StylingVariantCollectionMetadata[] =>
  Object.entries(contract.variants ?? {}).map(([name, definition]) => ({
    name,
    ...(contract.variantCollectionName ? { exportName: contract.variantCollectionName } : {}),
    baseClassCount: collectClassTokens(definition.base).length,
    options: Object.entries(definition.variants ?? {}).map(([optionName, values]) => ({
      name: optionName,
      values: Object.keys(values),
      ...(definition.defaultVariants?.[optionName] !== undefined
        ? { defaultValue: String(definition.defaultVariants[optionName]) }
        : {}),
    })),
    compoundVariantCount: definition.compoundVariants?.length ?? 0,
  }));

const buildStylingLocalStylesMetadata = (
  styles: StyledComponentStylesContract,
): StylingLocalStylesMetadata => ({
  ...(styles.fileName ? { fileName: styles.fileName } : {}),
  importFrom: [...styles.importFrom],
  selectorCount: styles.content.filter((line) => line.trim().endsWith("{")).length,
});

const collectStylingStateSelectors = (
  contract: StyledAdapterContract,
): StylingStateSelectorMetadata[] => {
  const selectors: StylingStateSelectorMetadata[] = [];

  for (const definition of Object.values(contract.variants ?? {})) {
    collectVariantClassStrings(definition).forEach((className) =>
      collectClassStateSelectors(className, "variant-class", selectors),
    );
  }

  for (const line of contract.styles?.content ?? []) {
    collectCssStateSelectors(line, selectors);
  }

  for (const component of contract.components) {
    collectRenderAttributeStateSelectors(component.render, selectors);
  }

  return dedupeStateSelectors(selectors).sort(
    (left, right) =>
      left.attribute.localeCompare(right.attribute) ||
      (left.value ?? "").localeCompare(right.value ?? "") ||
      left.selector.localeCompare(right.selector),
  );
};

const collectVariantClassStrings = (definition: ClassVariantDefinition): string[] => [
  ...collectClassTokens(definition.base),
  ...Object.values(definition.variants ?? {}).flatMap((values) =>
    Object.values(values).flatMap(collectClassTokens),
  ),
  ...(definition.compoundVariants ?? []).flatMap((compoundVariant) =>
    Object.values(compoundVariant).flatMap((value) =>
      typeof value === "string" || Array.isArray(value) ? collectClassTokens(value) : [],
    ),
  ),
];

const collectClassStateSelectors = (
  className: string,
  source: StylingStateSelectorMetadata["source"],
  selectors: StylingStateSelectorMetadata[],
) => {
  const arbitraryDataPattern = /data-\[([a-z-]+)=([^\]]+)\]/g;
  for (const match of className.matchAll(arbitraryDataPattern)) {
    selectors.push({
      attribute: `data-${match[1]}`,
      value: match[2],
      selector: className,
      source,
    });
  }

  const bracketDataPattern = /\[(data-[a-z-]+)(?:=(["']?)([^\]"']+)\2)?\]/g;
  for (const match of className.matchAll(bracketDataPattern)) {
    selectors.push({
      attribute: match[1] ?? "",
      ...(match[3] ? { value: match[3] } : {}),
      selector: className,
      source,
    });
  }

  const namedDataPattern =
    /(?:^|[:\s/])(?:not-|peer-|group-|group-has-|in-)?(data-[a-z-]+)(?=[:/\]])/g;
  for (const match of className.matchAll(namedDataPattern)) {
    selectors.push({
      attribute: match[1] ?? "",
      selector: className,
      source,
    });
  }
};

const collectCssStateSelectors = (cssLine: string, selectors: StylingStateSelectorMetadata[]) => {
  const selector = cssLine.trim();
  if (!selector.includes("[data-")) {
    return;
  }

  collectClassStateSelectors(selector, "local-style", selectors);
};

const collectRenderAttributeStateSelectors = (
  renderTree: RenderNode | readonly RenderNode[],
  selectors: StylingStateSelectorMetadata[],
) => {
  if (isRenderNodeArray(renderTree)) {
    for (const node of renderTree) {
      collectRenderAttributeStateSelectors(node, selectors);
    }

    return;
  }

  const attrs = "attrs" in renderTree && Array.isArray(renderTree.attrs) ? renderTree.attrs : [];
  for (const attr of attrs) {
    collectAttributeStateSelector(attr, selectors);
  }

  for (const child of getRenderNodeChildren(renderTree)) {
    collectRenderAttributeStateSelectors(child, selectors);
  }
};

const collectAttributeStateSelector = (
  attr: AttributeContract,
  selectors: StylingStateSelectorMetadata[],
) => {
  if (attr.name === "spread" || !attr.name.startsWith("data-")) {
    return;
  }

  if (attr.name === "data-slot" || attr.name.startsWith("data-sw-")) {
    return;
  }

  selectors.push({
    attribute: attr.name,
    ...(literalAttributeValue(attr.value) ? { value: literalAttributeValue(attr.value) } : {}),
    selector:
      literalAttributeValue(attr.value) !== undefined
        ? `${attr.name}="${literalAttributeValue(attr.value)}"`
        : attr.name,
    source: "render-attribute",
  });
};

const dedupeStateSelectors = (
  selectors: readonly StylingStateSelectorMetadata[],
): StylingStateSelectorMetadata[] => {
  const byKey = new Map<string, StylingStateSelectorMetadata>();

  for (const selector of selectors) {
    if (!selector.attribute) {
      continue;
    }

    byKey.set(
      `${selector.attribute}\0${selector.value ?? ""}\0${selector.selector}\0${selector.source}`,
      selector,
    );
  }

  return [...byKey.values()];
};

const collectClassTokens = (value: string | readonly string[] | undefined): string[] => {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  return values.flatMap((entry) => entry.split(/\s+/).filter(Boolean));
};

const extractTailwindConfigTemplate = (source: string) => {
  const match = /export const tailwindConfig = `([\s\S]*)`;\s*$/.exec(source.trim());

  return match?.[1] ?? source;
};

const collectCssDirectiveValues = (cssSource: string, directive: "import" | "plugin") =>
  [...cssSource.matchAll(new RegExp(`^@${directive} "([^"]+)";$`, "gm"))].map(
    (match) => match[1] ?? "",
  );

const collectCssTokenDeclarations = (
  cssSource: string,
  blockPattern: RegExp,
  scope: StylingThemeMetadata["tokens"][number]["scope"],
) => {
  const block = blockPattern.exec(cssSource)?.[1] ?? "";

  return [...block.matchAll(/^\s*(--[\w-]+):\s*([^;]+);$/gm)].map((match) => ({
    name: match[1] ?? "",
    value: (match[2] ?? "").trim().replace(/\s+/g, " "),
    scope,
  }));
};

export const buildPlaceholderStyledComponentMetadata = (
  contract: StyledAdapterContract,
  groups: readonly ComponentGroupMetadata[],
  annotations: Readonly<Record<string, StyledDocsAnnotation>>,
): StyledComponentDocsMetadata => ({
  id: contract.component,
  title: toTitle(contract.component),
  groupId: "layout-structure",
  docsPage: { status: "missing", path: `/docs/components/${contract.component}/` },
  foundation: {
    type: "styled-only",
    label: FOUNDATION_LABELS["styled-only"],
  },
  frameworkAvailability: buildFrameworkAvailability(contract),
  primitiveIds: [],
  runtimeFactories: [],
  publicExports: [...contract.publicExports],
  ...(contract.defaultExport ? { defaultExport: contract.defaultExport } : {}),
  ...(contract.variantCollectionName
    ? { variantCollectionName: contract.variantCollectionName }
    : {}),
  variantNames: [...Object.keys(contract.variants ?? {})].sort(),
  slots: collectSlots(contract),
  aliases: collectStyledAliases(contract, new Map(), groups, annotations, [], []),
  styledApi: buildEmptyStyledApiMetadata(),
});

export const loadRuntimePackageExports = (validationIssues: string[]) => {
  try {
    const packageJson = JSON.parse(fs.readFileSync(runtimePackageJsonPath, "utf8")) as {
      exports?: Record<string, unknown>;
    };

    return new Set(Object.keys(packageJson.exports ?? {}));
  } catch (error) {
    validationIssues.push(
      `Unable to read Runtime package exports from ${runtimePackageJsonPath}: ${formatError(error)}.`,
    );
    return new Set<string>();
  }
};

export const loadRuntimeIndexSource = (validationIssues: string[]) => {
  try {
    return fs.readFileSync(runtimeIndexPath, "utf8");
  } catch (error) {
    validationIssues.push(
      `Unable to read Runtime package index from ${runtimeIndexPath}: ${formatError(error)}.`,
    );
    return "";
  }
};

export const loadRuntimeInitStarwindSource = (validationIssues: string[]) => {
  try {
    return fs.readFileSync(runtimeInitStarwindPath, "utf8");
  } catch (error) {
    validationIssues.push(
      `Unable to read Runtime initStarwind source from ${runtimeInitStarwindPath}: ${formatError(error)}.`,
    );
    return "";
  }
};

export const loadThemeTemplateSource = (validationIssues: string[]) => {
  try {
    return fs.readFileSync(themeTemplatePath, "utf8");
  } catch (error) {
    validationIssues.push(
      `Unable to read Starwind CSS template from ${themeTemplatePath}: ${formatError(error)}.`,
    );
    return "";
  }
};

const validateRuntimeExportReference = (
  reference: Pick<RuntimeExportReferenceMetadata, "exportName" | "importSource">,
  runtimeExports: ReadonlySet<string>,
  runtimeIndexSource: string,
  validationIssues: string[],
) => {
  const exportPath = toRuntimePackageExportPath(reference.importSource);

  if (!runtimeExports.has(exportPath)) {
    validationIssues.push(
      `Runtime docs import ${reference.importSource} is not exported by packages/runtime/package.json.`,
    );
  }

  if (!runtimeIndexSource.includes(reference.exportName)) {
    validationIssues.push(
      `Runtime docs export ${reference.exportName} is not re-exported by packages/runtime/src/index.ts.`,
    );
  }
};

const toRuntimeFactoryReference = (
  primitive: PrimitiveDocsMetadata,
): RuntimeFactoryReferenceMetadata => ({
  ...primitive.runtime,
  docsPath: `${RUNTIME_DOCS_PATH}#${toKebabCase(primitive.runtime.factory)}`,
  optionProps: [...primitive.runtime.optionProps],
  stateModels: primitive.stateModels.map((stateModel) => ({ ...stateModel })),
  events: primitive.events.map((event) => ({ ...event })),
  setters: primitive.setters.map((setter) => ({ ...setter })),
});

const parseRuntimeInitializers = (
  initStarwindSource: string,
  primitiveByFactory: ReadonlyMap<string, PrimitiveDocsMetadata>,
): RuntimeRawHtmlInitializerMetadata[] => {
  const entries: RuntimeRawHtmlInitializerMetadata[] = [];
  const initializerBlockPattern =
    /\{\s*cleanupOrder:\s*(\d+),([\s\S]*?)selector:\s*"([^"]+)",\s*\}/g;

  for (const match of initStarwindSource.matchAll(initializerBlockPattern)) {
    const cleanupOrder = Number(match[1]);
    const body = match[2] ?? "";
    const selector = match[3] ?? "";
    const factory = toDocumentedRuntimeInitializerFactory(extractRuntimeInitializerFactory(body));
    const primitive = primitiveByFactory.get(factory);
    const notes = collectRuntimeInitializerNotes(body);

    entries.push({
      cleanupOrder,
      factory,
      ...(primitive
        ? {
            primitiveId: primitive.id,
            rootDiscoveryAttribute: getPrimitiveRootDiscoveryAttribute(primitive),
          }
        : {}),
      selector,
      once: /\bonce:\s*true\b/.test(body),
      notes,
    });
  }

  return entries.sort(
    (left, right) =>
      left.cleanupOrder - right.cleanupOrder || left.selector.localeCompare(right.selector),
  );
};

const extractRuntimeInitializerFactory = (initializerBody: string) => {
  const factoryMatches = [...initializerBody.matchAll(/\b(create[A-Z]\w+|init[A-Z]\w+)\(/g)].map(
    (match) => match[1],
  );

  return factoryMatches.at(-1) ?? "unknown";
};

const toDocumentedRuntimeInitializerFactory = (factory: string) =>
  RUNTIME_INITIALIZER_FACTORY_ALIASES[
    factory as keyof typeof RUNTIME_INITIALIZER_FACTORY_ALIASES
  ] ?? factory;

const collectRuntimeInitializerNotes = (initializerBody: string) => {
  const notes: string[] = [];

  if (/\bonce:\s*true\b/.test(initializerBody)) {
    notes.push("Initialized once per initStarwind root.");
  }

  if (initializerBody.includes("data-auto-init")) {
    notes.push('Skips elements with data-auto-init="false".');
  }

  if (initializerBody.includes("data-sw-context-menu")) {
    notes.push("Skips menu roots that are also context-menu roots.");
  }

  return notes;
};

const getPrimitiveRootDiscoveryAttribute = (primitive: PrimitiveDocsMetadata) =>
  primitive.parts.find((part) => part.name === primitive.runtime.rootPart)?.discoveryAttribute;

export const toRuntimePackageExportPath = (importSource: string) => {
  if (importSource === "@starwind-ui/runtime") {
    return ".";
  }

  return `.${importSource.slice("@starwind-ui/runtime".length)}`;
};

export const buildFrameworkAvailability = (
  contract: StyledAdapterContract,
  overrides: Partial<Record<StyledFrameworkTarget, FrameworkAvailability>> = {},
) => {
  const supportedFrameworks = new Set<ContractFrameworkTarget>(
    contract.frameworks ?? FRAMEWORK_TARGETS,
  );

  return Object.fromEntries(
    FRAMEWORK_TARGETS.map((framework) => [
      framework,
      {
        status: supportedFrameworks.has(framework) ? "available" : "not-yet-ported",
        ...overrides[framework],
      },
    ]),
  ) as Record<StyledFrameworkTarget, FrameworkAvailability>;
};

export const collectPrimitiveIds = (contract: StyledAdapterContract): string[] => {
  const primitiveIds: string[] = [];

  for (const component of contract.components) {
    primitiveIds.push(...Object.keys(component.primitiveAliases ?? {}));
    collectPrimitiveIdsFromTree(component.render, primitiveIds);
  }

  return dedupe(primitiveIds).sort();
};

const collectPrimitiveIdsFromTree = (
  renderTree: RenderNode | readonly RenderNode[],
  primitiveIds: string[],
) => {
  if (isRenderNodeArray(renderTree)) {
    for (const node of renderTree) {
      collectPrimitiveIdsFromTree(node, primitiveIds);
    }

    return;
  }

  collectPrimitiveIdsFromNode(renderTree, primitiveIds);
};

const collectPrimitiveIdsFromNode = (node: RenderNode, primitiveIds: string[]) => {
  if (node.type === "primitive") {
    primitiveIds.push(node.component);
  }

  for (const child of getRenderNodeChildren(node)) {
    collectPrimitiveIdsFromNode(child, primitiveIds);
  }
};

export const collectSlots = (contract: StyledAdapterContract): string[] => {
  const slots: string[] = [];

  for (const component of contract.components) {
    collectSlotsFromComponent(component, slots);
  }

  return dedupe(slots).sort();
};

const collectSlotsFromComponent = (component: StyledComponentContract, slots: string[]) => {
  collectSlotsFromTree(component.render, slots);

  const defaultDataSlot = component.destructure?.props
    .filter((prop) => prop.name === "data-slot")
    .map((prop) => parseContractStringLiteral(prop.defaultValue))
    .find((value) => value !== undefined);

  if (defaultDataSlot) {
    slots.push(defaultDataSlot);
  }
};

const collectSlotsFromTree = (renderTree: RenderNode | readonly RenderNode[], slots: string[]) => {
  if (isRenderNodeArray(renderTree)) {
    for (const node of renderTree) {
      collectSlotsFromTree(node, slots);
    }

    return;
  }

  collectSlotsFromNode(renderTree, slots);
};

const collectSlotsFromNode = (node: RenderNode, slots: string[]) => {
  const attrs = "attrs" in node && Array.isArray(node.attrs) ? node.attrs : [];
  const dataSlot = attrs.find((attr) => attr.name === "data-slot");
  const slotValue = dataSlot ? literalAttributeValue(dataSlot.value) : undefined;

  if (slotValue) {
    slots.push(slotValue);
  }

  for (const child of getRenderNodeChildren(node)) {
    collectSlotsFromNode(child, slots);
  }
};

const getRenderNodeChildren = (node: RenderNode): readonly RenderNode[] => {
  if (node.type === "conditional") {
    return [...node.then, ...node.else];
  }

  if (node.type === "slot" && Array.isArray(node.fallback)) {
    return node.fallback;
  }

  if ("children" in node && Array.isArray(node.children)) {
    return node.children;
  }

  return [];
};

const isRenderNodeArray = (
  renderTree: RenderNode | readonly RenderNode[],
): renderTree is readonly RenderNode[] => Array.isArray(renderTree);

const literalAttributeValue = (value: ValueExpression | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (value.type === "literal" && typeof value.value === "string") {
    return value.value;
  }

  return undefined;
};

const parseContractStringLiteral = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  const match = /^["'](.+)["']$/.exec(value);

  return match?.[1];
};

export const collectStyledAliases = (
  contract: StyledAdapterContract,
  primitiveById: ReadonlyMap<string, RuntimeAdapterContract>,
  groups: readonly ComponentGroupMetadata[],
  annotations: Readonly<Record<string, StyledDocsAnnotation>>,
  curatedAliases: readonly string[] = [],
  primitiveIds = collectPrimitiveIds(contract),
) => {
  const annotation = annotations[contract.component];
  const group = groups.find((componentGroup) => componentGroup.id === annotation?.groupId);

  return dedupe([
    contract.component,
    toTitle(contract.component),
    ...contract.publicExports,
    ...Object.keys(contract.defaultExport),
    ...Object.values(contract.defaultExport),
    ...(contract.variantCollectionName ? [contract.variantCollectionName] : []),
    ...primitiveIds,
    ...primitiveIds.map((primitiveId) => primitiveById.get(primitiveId)?.displayName),
    ...(group ? [group.title, ...(group.aliases ?? [])] : []),
    ...FRAMEWORK_TARGETS,
    FOUNDATION_LABELS[annotation?.foundation?.type ?? "styled-only"],
    ...curatedAliases,
  ]);
};

export const toRuntimeFactory = (contract: RuntimeAdapterContract): RuntimeFactoryMetadata => ({
  primitiveId: contract.component,
  factory: contract.runtime.factory,
  importSource: contract.runtime.importSource,
});

export const copyOptionPropLifecycles = (contract: RuntimeAdapterContract) => {
  const entries = Object.entries(contract.runtime.optionPropLifecycles ?? {}).filter(
    (entry): entry is [string, PrimitiveRuntimeOptionLifecycle] => entry[1] !== undefined,
  );

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};
