import type {
  LayeredDocsMetadata,
  PrimitiveDocsMetadata,
  RuntimeFactoryReferenceMetadata,
} from "../docs/layered-docs/types.js";
import {
  bulletList,
  codeFence,
  inlineCode,
  joinBlocks,
  pageHeader,
  section,
  table,
} from "./markdown.js";
import {
  type DocsFiles,
  describeDataAttributes,
  findPropReference,
  ISSUE_TRACKER,
  renderCssVariables,
  renderGuidance,
  renderRelatedStyled,
  STARWIND_SITE,
} from "./shared.js";
import {
  findRuntimeComponentType,
  readDeclaredType,
  readRuntimeFactorySignature,
  readRuntimeTypeDeclaration,
} from "./source-facts.js";

const PACKAGE_NAME = "@starwind-ui/runtime";
const STATUS = "stable";

type RuntimeContext = {
  readonly metadata: LayeredDocsMetadata;
  readonly repoRoot: string;
  readonly version: string;
};

const header = (context: RuntimeContext, title: string, introduction?: string) =>
  pageHeader({
    title,
    introduction,
    packageName: PACKAGE_NAME,
    version: context.version,
    status: STATUS,
  });

const backLink = (depth: number) =>
  `Back to the [Runtime docs index](${depth === 0 ? "README.md" : "../README.md"}).`;

const getPrimitive = (context: RuntimeContext, id: string) => {
  const primitive = context.metadata.primitives.find((entry) => entry.id === id);
  if (!primitive) throw new Error(`Layered docs metadata has no primitive ${id}.`);
  return primitive;
};

const factoryEntries = (context: RuntimeContext) =>
  [...context.metadata.runtime.factories].sort((left, right) =>
    left.primitiveId.localeCompare(right.primitiveId),
  );

const renderOptions = (
  primitive: PrimitiveDocsMetadata,
  factory: RuntimeFactoryReferenceMetadata,
  optionsType: string | undefined,
) =>
  section(
    "## Options",
    "Pass options as the second factory argument. Markup attributes provide the same options when you do not pass them.",
    optionsType ? codeFence(optionsType, "ts") : undefined,
    table(
      ["Option", "Type", "Updates", "Description"],
      factory.optionProps.map((name) => {
        const prop = findPropReference(primitive, name);
        const lifecycle = factory.optionPropLifecycles?.[name];
        const type =
          (optionsType ? readDeclaredType(optionsType, name) : undefined) ??
          prop?.displayType ??
          prop?.type;
        return [
          inlineCode(name),
          type ? inlineCode(type) : "",
          lifecycle ? lifecycleLabel(lifecycle) : "",
          prop?.description ?? "",
        ];
      }),
    ),
  );

const lifecycleLabel = (lifecycle: string) =>
  ({
    "attribute-observed": "Reads attribute changes",
    "constructor-only": "Read once at creation",
    "refresh-required": "Call refresh() after a change",
    "setter-backed": "Use the setter method",
  })[lifecycle] ?? lifecycle;

const renderState = (factory: RuntimeFactoryReferenceMetadata) =>
  section(
    "## State",
    table(
      ["State", "Type", "Read", "Write", "Initial attribute", "Description"],
      factory.stateModels.map((state) => [
        inlineCode(state.name),
        inlineCode(state.valueType),
        state.runtimeGetter ? inlineCode(`${state.runtimeGetter}()`) : "",
        state.runtimeSetter ? inlineCode(`${state.runtimeSetter}()`) : "",
        state.initialAttribute ? inlineCode(state.initialAttribute) : "",
        state.description ?? "",
      ]),
    ),
  );

const renderEvents = (factory: RuntimeFactoryReferenceMetadata) =>
  section(
    "## Events",
    "Each change goes to the option callback and to a DOM event on the emitting part. A cancelable event stops the change when a listener calls `preventDefault()` or the callback cancels the details object.",
    table(
      ["Callback option", "DOM event", "Details", "Cancelable", "Description"],
      factory.events.map((event) => [
        inlineCode(event.callbackProp),
        event.domEvent ? inlineCode(event.domEvent) : "",
        event.detailsType ? inlineCode(event.detailsType) : "",
        event.cancelable ? "Yes" : "No",
        event.description ?? "",
      ]),
    ),
  );

const renderSetters = (factory: RuntimeFactoryReferenceMetadata) =>
  section(
    "## Methods",
    "Every controller also has `destroy()`. Call it when the root leaves the page.",
    table(
      ["Method", "Changes", "Sends change events", "Description"],
      factory.setters.map((setter) => [
        inlineCode(`${setter.method}()`),
        "stateModel" in setter
          ? setter.stateModel
          : "prop" in setter
            ? setter.prop
            : setter.props.join(", "),
        setter.suppressesEmit ? "No" : "Yes",
        setter.description ?? "",
      ]),
    ),
  );

const renderParts = (primitive: PrimitiveDocsMetadata) =>
  section(
    "## Parts",
    "Render these parts with their discovery attributes. The Runtime finds each part inside the root.",
    table(
      ["Part", "Element", "Discovery attribute", "Description"],
      primitive.docsReference.apiReference.parts.map((part) => [
        part.part,
        inlineCode(part.defaultElement),
        inlineCode(part.discoveryAttribute),
        part.description ?? "",
      ]),
    ),
  );

const renderDataAttributes = (primitive: PrimitiveDocsMetadata) =>
  section(
    "## Data attributes",
    ...primitive.docsReference.apiReference.parts.map((part) =>
      part.dataAttributes.length === 0
        ? undefined
        : section(`### ${part.part}`, describeDataAttributes(part.dataAttributes)),
    ),
  );

const renderRawHtmlExamples = (primitive: PrimitiveDocsMetadata) => {
  const examples = [
    ...primitive.docsReference.examples
      .filter((example) => example.framework === "raw-html" && example.code)
      .map((example) => ({ title: example.title, summary: example.summary, code: example.code! })),
    ...primitive.docsReference.authoredExamples
      .filter((example) => !example.draft)
      .flatMap((example) =>
        example.frameworks
          .filter((entry) => entry.framework === "raw-html")
          .map((entry) => ({ title: example.title, summary: example.summary, code: entry.code })),
      ),
  ];
  return section(
    "## Raw HTML example",
    ...examples.map((example) =>
      [
        examples.length > 1 ? `### ${example.title}` : undefined,
        example.summary,
        codeFence(example.code, "html"),
      ]
        .filter(Boolean)
        .join("\n\n"),
    ),
  );
};

const renderController = (context: RuntimeContext, factory: RuntimeFactoryReferenceMetadata) => {
  const primitive = getPrimitive(context, factory.primitiveId);
  const initializer = context.metadata.runtime.rawHtml.initializers.find(
    (entry) => entry.primitiveId === factory.primitiveId,
  );
  const signature = readRuntimeFactorySignature(
    context.repoRoot,
    factory.primitiveId,
    factory.factory,
  );
  const optionsTypeName = /options\?:\s*([\w$]+)/.exec(signature)?.[1];
  const optionsType = optionsTypeName
    ? findRuntimeComponentType(context.repoRoot, factory.primitiveId, optionsTypeName)
    : undefined;
  const instanceType = /\):\s*([\w$]+)(?:<[^()]*>)?$/.exec(signature)?.[1];
  const instance = instanceType
    ? findRuntimeComponentType(context.repoRoot, factory.primitiveId, instanceType)
    : undefined;
  return joinBlocks([
    header(context, `${primitive.displayName} controller`, primitive.docsReference.summary),
    renderRawHtmlExamples(primitive),
    ...renderGuidance(primitive),
    section(
      "## Signature",
      codeFence(
        `import { ${factory.factory} } from "${factory.importSource}";

${signature}`,
        "ts",
      ),
      [
        `Pass the element that has ${inlineCode(primitive.parts.find((part) => part.name === factory.rootPart)?.discoveryAttribute ?? factory.rootPart)}.`,
        "When that element already has a controller, the factory returns the live controller and ignores the options.",
        initializer
          ? `${inlineCode("initStarwind")} creates this controller for elements that match ${inlineCode(initializer.selector)}.`
          : undefined,
      ]
        .filter(Boolean)
        .join(" "),
    ),
    section("## Controller", instance ? codeFence(instance, "ts") : undefined),
    renderOptions(primitive, factory, optionsType),
    renderState(factory),
    renderEvents(factory),
    renderSetters(factory),
    renderParts(primitive),
    renderDataAttributes(primitive),
    renderCssVariables(primitive),
    renderRelatedStyled(primitive),
    backLink(1),
  ]);
};

const renderInitStarwind = (context: RuntimeContext) => {
  const { initStarwind, rawHtml } = context.metadata.runtime;
  return joinBlocks([
    header(context, "initStarwind"),
    `${inlineCode("initStarwind")} scans a root node for Starwind discovery attributes and creates each matching controller in cleanup order. Keep the returned object and call ${inlineCode("destroy()")} when that root leaves the page.`,
    codeFence(
      [
        `import { initStarwind } from "${initStarwind.importSource}";`,
        "",
        "const starwind = initStarwind(document);",
        "",
        "// Later, when the root is removed:",
        "starwind.destroy();",
      ].join("\n"),
      "ts",
    ),
    section("## Signature", codeFence(initStarwind.signature, "ts")),
    section(
      "## Initializers",
      "The table lists each selector, the factory that owns it, and the cleanup order. Parent providers start before the children that depend on them.",
      table(
        ["Order", "Selector", "Factory", "Runs once", "Notes"],
        [...rawHtml.initializers]
          .sort((left, right) => left.cleanupOrder - right.cleanupOrder)
          .map((entry) => [
            String(entry.cleanupOrder),
            inlineCode(entry.selector),
            inlineCode(entry.factory),
            entry.once ? "Yes" : "No",
            entry.notes.join(" "),
          ]),
      ),
    ),
    backLink(0),
  ]);
};

const renderRawHtml = (context: RuntimeContext) => {
  const { rawHtml } = context.metadata.runtime;
  return joinBlocks([
    header(context, "Raw HTML"),
    "Raw HTML uses `data-sw-*` discovery hooks. You write the markup, then call `initStarwind(root)` for automatic discovery or call a `create*` factory for one component.",
    codeFence(
      [
        "<div data-sw-drawer>",
        "  <button data-sw-drawer-trigger>Open</button>",
        "  <div data-sw-drawer-popup hidden>",
        "    <button data-sw-drawer-close>Close</button>",
        "  </div>",
        "</div>",
      ].join("\n"),
      "html",
    ),
    section(
      "## Attribute conventions",
      table(
        ["Prefix", "Purpose", "Examples"],
        rawHtml.attributeConventions.map((convention) => [
          inlineCode(convention.prefix),
          convention.purpose,
          convention.examples.map(inlineCode).join(", "),
        ]),
      ),
      "Treat `data-sw-*` attributes as behavior hooks. Use `data-slot` as the public part name for styling.",
    ),
    section(
      "## Control a component from page code",
      "Call the factory with the root element and no options. The factory returns the live controller when the element already has one.",
      codeFence(
        [
          'import { createDialog } from "@starwind-ui/runtime/dialog";',
          "",
          'const dialog = createDialog(document.querySelector<HTMLElement>("#settings-dialog")!);',
          "dialog.open();",
        ].join("\n"),
        "ts",
      ),
      "When your script runs first, the options you pass take priority over the options from the markup. `createForm` applies the options you pass, such as `onSubmit` and validators, to the live form.",
    ),
    section(
      "## Framework adapters",
      table(
        ["Surface", "Import", "Responsibility"],
        [
          ...rawHtml.adapterComparison.map((entry) => [
            entry.surface,
            entry.importSource ? inlineCode(entry.importSource) : "",
            entry.responsibility,
          ]),
          ...context.metadata.frameworks
            .filter((framework) => framework.maturity === "beta")
            .map((framework) => [
              `${framework.label} Primitive adapters (public beta)`,
              inlineCode(framework.packageName),
              "Adapters render primitive anatomy and connect framework state to the same Runtime controllers.",
            ]),
        ],
      ),
    ),
    backLink(0),
  ]);
};

const renderTheme = (context: RuntimeContext) => {
  const { theme } = context.metadata.runtime;
  return joinBlocks([
    header(context, "Theme"),
    "Theme helpers apply a light, dark, or system color theme. Use `getThemeInitScript` before the first paint and a theme controller for interactive controls.",
    section(
      "## Helpers",
      table(
        ["Export", "Signature"],
        theme.helpers.map((helper) => [
          inlineCode(helper.exportName),
          inlineCode(helper.signature),
        ]),
      ),
      codeFence(
        [
          'import { getThemeInitScript, initThemeController } from "@starwind-ui/runtime/theme";',
          "",
          "// Put this string in an inline <script> in the document head.",
          'const script = getThemeInitScript({ defaultTheme: "system" });',
          "",
          "// After the page loads, connect theme controls.",
          "const controller = initThemeController(document);",
        ].join("\n"),
        "ts",
      ),
    ),
    section(
      "## Types",
      codeFence(
        [
          readRuntimeTypeDeclaration(context.repoRoot, "theme/theme.ts", "ThemeInitScriptOptions"),
          readRuntimeTypeDeclaration(context.repoRoot, "theme/theme.ts", "ThemeControllerOptions"),
          readRuntimeTypeDeclaration(context.repoRoot, "theme/theme.ts", "ThemeControllerInstance"),
          readRuntimeTypeDeclaration(
            context.repoRoot,
            "theme/theme.ts",
            "StarwindThemeChangeDetails",
          ),
        ].join("\n\n"),
        "ts",
      ),
    ),
    section(
      "## Theme controls",
      `The controller finds controls that match ${theme.controlSelectors.map(inlineCode).join(" or ")}. Controls read and write these attributes: ${theme.controlAttributes.map(inlineCode).join(", ")}.`,
      table(
        ["DOM event", "Details"],
        theme.events.map((event) => [inlineCode(event.name), inlineCode(event.detailsType)]),
      ),
    ),
    `The [dark mode guide](${STARWIND_SITE}/docs/getting-started/dark-mode/) shows the setup for each supported host.`,
    backLink(0),
  ]);
};

const renderIndex = (context: RuntimeContext) =>
  joinBlocks([
    header(context, "Starwind Runtime docs"),
    "These docs ship inside the package and match its installed version. Runtime provides framework-neutral DOM controllers for Starwind UI behavior. It owns state, events, focus, forms, overlays, timers, and cleanup. Framework adapters render normal markup and connect it to the same controllers.",
    section(
      "## Start here",
      bulletList([
        "[initStarwind](init-starwind.md): start every controller under a root and clean up later.",
        "[Raw HTML](raw-html.md): write the discovery attributes yourself and control components from page code.",
        "[Theme](theme.md): apply the color theme before paint and connect theme controls.",
        "[llms.txt](llms.txt): give a coding agent the Runtime docs index.",
      ]),
    ),
    section(
      "## When to use Runtime directly",
      "Install a framework adapter for normal application work. Each adapter brings in a compatible Runtime version. Use Runtime directly for raw HTML, custom components, or a new framework adapter.",
      table(
        ["Framework", "Package", "Status"],
        context.metadata.frameworks.map((framework) => [
          framework.label,
          inlineCode(framework.installSpecifier),
          framework.maturity === "beta" ? "Public beta" : "Stable",
        ]),
      ),
    ),
    section(
      "## Controllers",
      table(
        ["Component", "Import", "Factory"],
        factoryEntries(context).map((factory) => [
          `[${getPrimitive(context, factory.primitiveId).displayName}](controllers/${factory.primitiveId}.md)`,
          inlineCode(factory.importSource),
          inlineCode(factory.factory),
        ]),
      ),
    ),
    section(
      "## More help",
      bulletList([
        `[Runtime website docs](${STARWIND_SITE}${context.metadata.runtime.docsPage.path})`,
        `[Issue tracker](${ISSUE_TRACKER})`,
      ]),
    ),
  ]);

const renderLlms = (context: RuntimeContext) =>
  joinBlocks([
    `# ${PACKAGE_NAME}`,
    "> Framework-neutral DOM controllers for Starwind UI. These docs match the installed package version.",
    [`- Version: ${context.version}`, `- Status: ${STATUS}`].join("\n"),
    section(
      "## Docs",
      bulletList([
        "[Overview](README.md): package purpose, framework adapters, and controller index.",
        "[initStarwind](init-starwind.md): root initialization, initializer order, and cleanup.",
        "[Raw HTML](raw-html.md): discovery attributes and control from page code.",
        "[Theme](theme.md): theme init script, theme controller, and theme controls.",
      ]),
    ),
    section(
      "## Controllers",
      bulletList(
        factoryEntries(context).map((factory) => {
          const primitive = getPrimitive(context, factory.primitiveId);
          return `[${primitive.displayName}](controllers/${factory.primitiveId}.md): ${inlineCode(factory.factory)} from ${inlineCode(factory.importSource)}.`;
        }),
      ),
    ),
  ]);

export const renderRuntimeDocs = (context: RuntimeContext): DocsFiles => {
  const files: DocsFiles = new Map([
    ["docs/README.md", renderIndex(context)],
    ["docs/llms.txt", renderLlms(context)],
    ["docs/init-starwind.md", renderInitStarwind(context)],
    ["docs/raw-html.md", renderRawHtml(context)],
    ["docs/theme.md", renderTheme(context)],
  ]);
  for (const factory of factoryEntries(context)) {
    files.set(`docs/controllers/${factory.primitiveId}.md`, renderController(context, factory));
  }
  return files;
};
