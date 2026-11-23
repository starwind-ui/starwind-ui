import type {
  LayeredDocsMetadata,
  PrimitiveDocsMetadata,
  PrimitiveEventMetadata,
  PrimitivePartApiReferenceMetadata,
  PublicFrameworkMetadata,
  PublicFrameworkTarget,
} from "../docs/layered-docs/types.js";
import {
  bulletList,
  codeFence,
  inlineCode,
  joinBlocks,
  kebabCase,
  pageHeader,
  section,
  table,
} from "./markdown.js";
import {
  type DocsFiles,
  describeDataAttributes,
  findApiPart,
  findPropReference,
  ISSUE_TRACKER,
  renderCssVariables,
  renderGuidance,
  renderRelatedStyled,
  STARWIND_SITE,
} from "./shared.js";
import {
  assertFamilySourceExists,
  type FamilySurface,
  findComponentSource,
  getFamilySurface,
  getTargetFamilies,
  readDeclaredType,
  type readFrameworkSurfaceManifest,
  readRuntimeTypeDeclaration,
  readSvelteComponentFacts,
  readSveltePropTypes,
  readSvelteWrappedComponentSource,
  readVueComponentFacts,
  sourceDeclaresProp,
} from "./source-facts.js";

import { installedSvelteExamples } from "./svelte-examples.js";

type AdapterContext = {
  readonly metadata: LayeredDocsMetadata;
  readonly repoRoot: string;
  readonly packageRoot: string;
  readonly manifest: ReturnType<typeof readFrameworkSurfaceManifest>;
  readonly framework: PublicFrameworkMetadata;
  readonly version: string;
  readonly runtimeRequirement: string;
  readonly peerDependencies: Readonly<Record<string, string>>;
};

const LANGUAGE: Record<PublicFrameworkTarget, string> = {
  astro: "astro",
  react: "tsx",
  vue: "vue",
  svelte: "svelte",
};

const status = (context: AdapterContext) =>
  context.framework.maturity === "beta"
    ? "public beta. The API can change during the `0.x` release series."
    : "stable";

const header = (context: AdapterContext, title: string, introduction?: string) =>
  pageHeader({
    title,
    introduction,
    packageName: context.framework.packageName,
    version: context.version,
    status: status(context),
  });

const target = (context: AdapterContext) => context.framework.target;

const importLine = (context: AdapterContext, name: string, family: string) =>
  `import { ${name} } from "${context.framework.packageName}/${family}";`;

/** Wraps markup and imports in the file syntax of the target framework. */
const frameworkFile = (context: AdapterContext, imports: readonly string[], markup: string) => {
  const importBlock = imports.join("\n");
  switch (target(context)) {
    case "astro":
      return `---\n${importBlock}\n---\n\n${markup}`;
    case "react":
      return `${importBlock}\n\nexport function Example() {\n  return (\n${indent(markup, 4)}\n  );\n}`;
    case "vue":
      return `<script setup lang="ts">\n${importBlock}\n</script>\n\n<template>\n${indent(markup, 2)}\n</template>`;
    case "svelte":
      return `<script lang="ts">\n${indent(importBlock, 2)}\n</script>\n\n${markup}`;
  }
};

const indent = (value: string, spaces: number) =>
  value
    .split("\n")
    .map((line) => (line ? " ".repeat(spaces) + line : line))
    .join("\n");

const getPrimitive = (context: AdapterContext, family: string) => {
  const primitive = context.metadata.primitives.find((entry) => entry.id === family);
  if (!primitive) throw new Error(`Layered docs metadata has no primitive ${family}.`);
  return primitive;
};

// --- Framework-specific prop, state, and event facts ---------------------------------------

const SVELTE_PROP_DESCRIPTIONS: Readonly<Record<string, string>> = {
  child: "Snippet that receives the part props, so you can render your own element.",
  children: "Snippet that renders the part content.",
  ref: "Callback that receives the rendered element.",
};

type PropRow = {
  readonly name: string;
  readonly type?: string;
  readonly defaultValue?: string;
  readonly binding?: string;
  readonly description?: string;
};

type EventRow = {
  readonly name: string;
  readonly payload?: string;
  readonly description?: string;
};

type PartFacts = {
  readonly props: readonly PropRow[];
  readonly events: readonly EventRow[];
  readonly models: readonly string[];
};

const findEvent = (
  primitive: PrimitiveDocsMetadata,
  predicate: (event: PrimitiveEventMetadata) => boolean,
) => primitive.events.find(predicate);

const metadataPropRows = (
  context: AdapterContext,
  primitive: PrimitiveDocsMetadata,
  apiPart: PrimitivePartApiReferenceMetadata | undefined,
  source: string | undefined,
) =>
  (apiPart?.props ?? [])
    .filter((prop) => !prop.unsupportedTargets?.includes(target(context)))
    .filter((prop) => !(target(context) === "astro" && prop.kind === "callback"))
    // Native and data attributes pass through to the element. Other props must be declared by
    // the generated component, because some targets omit them (Astro has no controlled `open`).
    .filter(
      (prop) =>
        source === undefined ||
        prop.kind === "attribute" ||
        prop.kind === "rendering" ||
        prop.name.startsWith("data-") ||
        sourceDeclaresProp(source, prop.name),
    )
    .map((prop) => ({
      name: prop.name,
      type:
        (source ? readDeclaredType(source, prop.name) : undefined) ?? prop.displayType ?? prop.type,
      defaultValue: prop.defaultValue,
      description: prop.description ?? findPropReference(primitive, prop.name)?.description,
    }));

const readPartFacts = (
  context: AdapterContext,
  primitive: PrimitiveDocsMetadata,
  apiPart: PrimitivePartApiReferenceMetadata | undefined,
  source: string | undefined,
  wrappedSource?: string,
): PartFacts => {
  switch (target(context)) {
    case "astro":
      return {
        props: metadataPropRows(context, primitive, apiPart, source),
        events: [],
        models: [],
      };
    case "react":
      // React callbacks are props, so they stay in the prop table.
      return {
        props: metadataPropRows(context, primitive, apiPart, source),
        events: [],
        models: [],
      };
    case "vue": {
      if (!source) return { props: [], events: [], models: [] };
      const facts = readVueComponentFacts(source);
      return {
        props: facts.props.map((prop) => {
          const modelName = prop.name === "modelValue" ? "value" : prop.name;
          const state = primitive.stateModels.find(
            (model) => model.controlledProp === modelName || model.name === modelName,
          );
          const bound = facts.models.includes(prop.name);
          return {
            name: prop.name,
            type: prop.type,
            binding: bound
              ? prop.name === "modelValue"
                ? "`v-model`"
                : inlineCode(`v-model:${prop.name}`)
              : undefined,
            description:
              prop.name === "modelValue"
                ? state?.description
                : (findPropReference(primitive, prop.name, apiPart)?.description ??
                  (bound ? state?.description : undefined)),
          };
        }),
        events: facts.emits.map((emit) => ({
          name: `@${kebabCase(emit.name)}`,
          payload: emit.args,
          description: findEvent(primitive, (event) => event.name === emit.name)?.description,
        })),
        models: facts.models,
      };
    }
    case "svelte": {
      if (!source) return { props: [], events: [], models: [] };
      const ownFacts = readSvelteComponentFacts(source);
      const ownTypes = readSveltePropTypes(source);
      // A wrapper passes its other props through to the wrapped component, so list those too.
      const wrappedFacts = wrappedSource ? readSvelteComponentFacts(wrappedSource) : undefined;
      const wrappedTypes = wrappedSource ? readSveltePropTypes(wrappedSource) : undefined;
      const facts = {
        props: [
          ...ownFacts.props,
          ...(wrappedFacts?.props ?? []).filter(
            (prop) => !ownFacts.props.some((own) => own.name === prop.name),
          ),
        ],
      };
      const propTypes = new Map([...(wrappedTypes ?? []), ...ownTypes]);
      return {
        props: facts.props
          .filter((prop) => !/^on[A-Z]/.test(prop.name))
          .map((prop) => ({
            name: prop.name,
            type: propTypes.get(prop.name),
            binding: prop.bindable ? inlineCode(`bind:${prop.name}`) : undefined,
            description:
              SVELTE_PROP_DESCRIPTIONS[prop.name] ??
              findPropReference(primitive, prop.name, apiPart)?.description,
          })),
        events: facts.props
          .filter((prop) => /^on[A-Z]/.test(prop.name))
          .map((prop) => {
            const event = findEvent(primitive, (entry) => entry.callbackProp === prop.name);
            // Some Props types take callbacks from a named options type, which the reader
            // leaves out. The contract callback signature matches the `(value, details)` call.
            const contractType = findPropReference(primitive, prop.name, apiPart);
            return {
              name: prop.name,
              payload:
                propTypes.get(prop.name) ??
                contractType?.displayType ??
                contractType?.type ??
                event?.detailsType,
              description: event?.description ?? contractType?.description,
            };
          }),
        models: facts.props.filter((prop) => prop.bindable).map((prop) => prop.name),
      };
    }
  }
};

const renderPropTable = (context: AdapterContext, props: readonly PropRow[]) => {
  switch (target(context)) {
    case "astro":
    case "react":
      return table(
        ["Prop", "Type", "Default", "Description"],
        props.map((prop) => [
          inlineCode(prop.name),
          prop.type ? inlineCode(prop.type) : "",
          prop.defaultValue ? inlineCode(prop.defaultValue) : "",
          prop.description ?? "",
        ]),
      );
    case "vue":
      return table(
        ["Prop", "Type", "Binding", "Description"],
        props.map((prop) => [
          inlineCode(prop.name),
          prop.type ? inlineCode(prop.type) : "",
          prop.binding ?? "",
          prop.description ?? "",
        ]),
      );
    case "svelte":
      return table(
        ["Prop", "Type", "Binding", "Description"],
        props.map((prop) => [
          inlineCode(prop.name),
          prop.type ? inlineCode(prop.type) : "",
          prop.binding ?? "",
          prop.description ?? "",
        ]),
      );
  }
};

const renderEventTable = (context: AdapterContext, events: readonly EventRow[]) =>
  table(
    [
      target(context) === "vue" ? "Event" : "Callback prop",
      target(context) === "vue" ? "Payload" : "Type",
      "Description",
    ],
    events.map((event) => [
      inlineCode(event.name),
      event.payload ? inlineCode(event.payload) : "",
      event.description ?? "",
    ]),
  );

// --- State guidance -------------------------------------------------------------------------

const renderStateGuidance = (
  context: AdapterContext,
  primitive: PrimitiveDocsMetadata,
  rootFacts: PartFacts | undefined,
  familySource: string,
) => {
  const factory = primitive.runtime.factory;
  switch (target(context)) {
    case "react":
    case "astro": {
      // Build each row from the listed APIs. Props must exist in the generated components.
      const rows = primitive.stateModels.flatMap((state) => {
        const behavior = state.frameworkBehavior.find((entry) => entry.target === target(context));
        if (!behavior) return [];
        const names = (kinds: readonly string[], verify: boolean) =>
          behavior.apis
            .filter((api) => kinds.includes(api.kind))
            .filter((api) => !verify || sourceDeclaresProp(familySource, api.name))
            .map((api) => inlineCode(api.kind === "runtime-method" ? `${api.name}()` : api.name))
            .join(", ");
        return [
          [
            inlineCode(state.name),
            names(["controlled-prop", "initial-prop", "default-prop"], true),
            names(["callback", "dom-event"], target(context) === "react"),
            ...(target(context) === "astro" ? [names(["runtime-method"], false)] : []),
          ],
        ];
      });
      const astroControl =
        target(context) === "astro" && primitive.stateModels.length > 0
          ? [
              `To change state after render, pass the root element to the Runtime factory. It returns the live controller. Add ${inlineCode(`@starwind-ui/runtime@${context.runtimeRequirement}`)} to your dependencies when your package manager does not expose it.`,
              codeFence(
                [
                  `import { ${factory} } from "${primitive.runtime.importSource}";`,
                  "",
                  `const root = document.querySelector<HTMLElement>("[${primitive.parts.find((part) => part.name === primitive.runtime.rootPart)?.discoveryAttribute ?? "data-sw-" + primitive.id}]");`,
                  `const controller = root ? ${factory}(root) : undefined;`,
                  ...primitive.stateModels
                    .filter((state) => state.runtimeSetter)
                    .map(
                      (state) =>
                        `// controller?.${state.runtimeSetter}(...) changes ${state.name}.`,
                    ),
                ].join("\n"),
                "ts",
              ),
            ].join("\n\n")
          : undefined;
      return section(
        "## State",
        table(
          [
            "State",
            target(context) === "react" ? "Value and default props" : "Initial props",
            ...(target(context) === "react"
              ? ["Change callback"]
              : ["DOM event", "Controller method"]),
          ],
          rows,
        ),
        astroControl,
      );
    }
    case "vue": {
      const models = rootFacts?.models ?? [];
      return section(
        "## State",
        models.length === 0
          ? undefined
          : `Bind state with ${models.map((model) => inlineCode(model === "modelValue" ? "v-model" : `v-model:${model}`)).join(" and ")} on the root. Each model has a matching ${inlineCode("update:*")} event.`,
      );
    }
    case "svelte": {
      const models = rootFacts?.models ?? [];
      return section(
        "## State",
        models.length === 0
          ? undefined
          : `Bind state with ${models.map((model) => inlineCode(`bind:${model}`)).join(" and ")} on the root. Pass a value without ${inlineCode("bind:")} to set it from your own state.`,
      );
    }
  }
};

const renderAstroEvents = (primitive: PrimitiveDocsMetadata) =>
  section(
    "## Events",
    "Astro components do not take callback props. Listen for these DOM events on the emitting part.",
    table(
      ["DOM event", "Part", "Details", "Cancelable", "Description"],
      primitive.events
        .filter((event) => event.domEvent)
        .map((event) => [
          inlineCode(event.domEvent!),
          event.emitsFrom,
          event.detailsType ? inlineCode(event.detailsType) : "",
          event.cancelable ? "Yes" : "No",
          event.description ?? "",
        ]),
    ),
  );

// --- Examples and anatomy -------------------------------------------------------------------

const renderExamples = (context: AdapterContext, primitive: PrimitiveDocsMetadata) => {
  const prefix = `"${context.framework.packageName}/`;
  const svelteExample =
    target(context) === "svelte" ? installedSvelteExamples[primitive.id] : undefined;
  const examples = [
    ...(svelteExample ? [{ title: "Basic usage", ...svelteExample }] : []),
    ...primitive.docsReference.examples
      .filter((example) => example.framework === target(context) && example.code)
      .map((example) => ({ title: "Basic usage", summary: example.summary, code: example.code! })),
    ...primitive.docsReference.authoredExamples
      .filter((example) => !example.draft)
      .flatMap((example) =>
        example.frameworks
          .filter((entry) => entry.framework === target(context))
          .map((entry) => ({ title: example.title, summary: example.summary, code: entry.code })),
      ),
  ].filter((example) => example.code.includes(prefix));
  return section(
    "## Examples",
    ...examples.map((example) =>
      [`### ${example.title}`, example.summary, codeFence(example.code, LANGUAGE[target(context)])]
        .filter(Boolean)
        .join("\n\n"),
    ),
  );
};

const renderAnatomy = (
  context: AdapterContext,
  primitive: PrimitiveDocsMetadata | undefined,
  surface: FamilySurface,
) => {
  if (!surface.namespace || surface.parts.length === 0) return undefined;
  const available = new Set(surface.parts.map((part) => part.part));
  const shared = primitive?.docsReference.anatomy;
  const lines = shared
    ? shared.code
        .split("\n")
        .filter((line) => !line.startsWith("import") && line.trim())
        .filter((line) => {
          const part = new RegExp(`<\\/?${shared.namespace}\\.([A-Za-z]+)`).exec(line)?.[1];
          return part === undefined || available.has(part);
        })
    : surface.parts.map((part) => `<${surface.namespace}.${part.part} />`);
  const usesNamespace = lines.some((line) => line.includes(`<${surface.namespace}.`));
  if (!usesNamespace) return undefined;
  return section(
    "## Anatomy",
    "This outline lists the parts in order. It does not show the full nesting or content.",
    codeFence(
      frameworkFile(
        context,
        [importLine(context, surface.namespace, surface.family)],
        lines.join("\n"),
      ),
      LANGUAGE[target(context)],
    ),
  );
};

// --- Primitive page -------------------------------------------------------------------------

const renderPrimitivePage = (context: AdapterContext, family: string) => {
  const primitive = getPrimitive(context, family);
  const surface = getFamilySurface(context.manifest, target(context), family);
  if (!surface.namespace) throw new Error(`No namespace export for ${target(context)}/${family}.`);
  const partFacts = surface.parts.map(({ part, component }) => {
    const apiPart = findApiPart(primitive, part);
    const source = findComponentSource(context.packageRoot, target(context), family, component);
    if (!source)
      throw new Error(`Missing generated source for ${target(context)}/${family}/${component}.`);
    return {
      part,
      component,
      apiPart,
      source,
      facts: readPartFacts(
        context,
        primitive,
        apiPart,
        source,
        target(context) === "svelte"
          ? readSvelteWrappedComponentSource(context.packageRoot, family, source)
          : undefined,
      ),
    };
  });
  const root = partFacts.find((entry) => entry.part === "Root" || entry.part === "Provider");

  const partSections = partFacts.map(({ part, component, apiPart, facts }) => {
    const details = [
      apiPart?.description,
      [
        `Component: ${inlineCode(`${surface.namespace}.${part}`)} or ${inlineCode(component)}.`,
        apiPart
          ? `Renders ${inlineCode(`<${apiPart.defaultElement}>`)} with ${inlineCode(apiPart.discoveryAttribute)}.`
          : undefined,
      ]
        .filter(Boolean)
        .join(" "),
    ];
    return section(
      `### ${surface.namespace}.${part}`,
      ...details,
      facts.props.length > 0 ? renderPropTable(context, facts.props) : undefined,
      facts.events.length > 0
        ? section("Events:", renderEventTable(context, facts.events))
        : undefined,
      apiPart && apiPart.dataAttributes.length > 0
        ? section("Data attributes:", describeDataAttributes(apiPart.dataAttributes))
        : undefined,
    );
  });

  const exportNames = surface.exports
    .filter((entry) => entry.kind === "value")
    .map((entry) => entry.name);
  const typeNames = surface.exports
    .filter((entry) => entry.kind === "type")
    .map((entry) => entry.name);

  return joinBlocks([
    header(context, primitive.displayName, primitive.docsReference.summary),
    renderExamples(context, primitive),
    section(
      "## Import",
      codeFence(
        [
          importLine(context, surface.namespace, family),
          `// or: import ${surface.namespace} from "${context.framework.packageName}/${family}";`,
        ].join("\n"),
        "ts",
      ),
    ),
    renderAnatomy(context, primitive, surface),
    ...renderGuidance(primitive),
    renderStateGuidance(
      context,
      primitive,
      root?.facts,
      partFacts.map((entry) => entry.source).join("\n"),
    ),
    target(context) === "astro" ? renderAstroEvents(primitive) : undefined,
    section(
      "## Parts",
      target(context) === "vue" || target(context) === "svelte"
        ? `Props, bindings, and events come from the generated ${context.framework.label} components in this package. Descriptions come from the shared Runtime contract.`
        : undefined,
      ...partSections,
    ),
    renderCssVariables(primitive),
    section(
      "## Exports",
      table(
        ["Kind", "Names"],
        [
          ["Values", exportNames.map(inlineCode).join(", ")],
          ["Types", typeNames.map(inlineCode).join(", ")],
        ].filter(([, names]) => names),
      ),
    ),
    section(
      "## Runtime",
      `Behavior comes from ${inlineCode(primitive.runtime.factory)} in ${inlineCode(primitive.runtime.importSource)}. The adapter creates the controller when the root mounts and destroys it when the root leaves the page.`,
    ),
    renderRelatedStyled(primitive),
    "Back to the [package docs index](../README.md).",
  ]);
};

// --- Theme page -----------------------------------------------------------------------------

const renderThemePage = (context: AdapterContext) => {
  const surface = getFamilySurface(context.manifest, target(context), "theme");
  const helpers = context.metadata.runtime.theme.helpers;
  const values = surface.exports
    .filter((entry) => entry.kind === "value")
    .map((entry) => entry.name);
  const hasComponent = values.includes("ThemeInitScript");
  const componentUsage: Partial<Record<PublicFrameworkTarget, string>> = {
    astro: frameworkFile(
      context,
      [importLine(context, "ThemeInitScript", "theme")],
      '<head>\n  <ThemeInitScript defaultTheme="system" />\n</head>',
    ),
    react: [
      importLine(context, "ThemeInitScript", "theme"),
      "",
      "export function Head() {",
      "  return (",
      "    <head>",
      '      <ThemeInitScript defaultTheme="system" />',
      "    </head>",
      "  );",
      "}",
    ].join("\n"),
  };
  return joinBlocks([
    header(context, "Theme"),
    `Use the theme helpers to apply the stored color theme before the first paint and to connect theme controls. Import them from ${inlineCode(`${context.framework.packageName}/theme`)}.`,
    section(
      "## Exports",
      table(
        ["Export", "Signature"],
        values.map((name) => {
          const helper = helpers.find((entry) => entry.exportName === name);
          return [
            inlineCode(name),
            helper
              ? inlineCode(helper.signature)
              : name === "ThemeInitScript"
                ? `Component. Takes ${inlineCode("ThemeInitScriptOptions")} as props and renders the init script.`
                : "",
          ];
        }),
      ),
    ),
    hasComponent && componentUsage[target(context)]
      ? section(
          "## Apply the theme before paint",
          `Render ${inlineCode("ThemeInitScript")} in the document head.`,
          codeFence(componentUsage[target(context)]!, LANGUAGE[target(context)]),
        )
      : section(
          "## Apply the theme before paint",
          `${inlineCode("getThemeInitScript")} returns a script string. Put it in an inline ${inlineCode("<script>")} in the document head so it runs before the page renders.`,
          codeFence(
            [
              `import { getThemeInitScript } from "${context.framework.packageName}/theme";`,
              "",
              'const themeScript = getThemeInitScript({ defaultTheme: "system" });',
            ].join("\n"),
            "ts",
          ),
        ),
    section(
      "## Connect theme controls",
      `Call ${inlineCode("initThemeController")} in the browser after the page loads. It finds controls that match ${context.metadata.runtime.theme.controlSelectors.map(inlineCode).join(" or ")} and sends ${inlineCode("starwind:theme-change")} when the theme changes.`,
    ),
    section(
      "## Options",
      codeFence(
        readRuntimeTypeDeclaration(context.repoRoot, "theme/theme.ts", "ThemeInitScriptOptions"),
        "ts",
      ),
    ),
    `The [dark mode guide](${STARWIND_SITE}/docs/getting-started/dark-mode/) shows the setup for each supported host.`,
    "Back to the [package docs index](README.md).",
  ]);
};

// --- Index and llms.txt ---------------------------------------------------------------------

const conventions = (context: AdapterContext): readonly string[] => {
  const pkg = context.framework.packageName;
  switch (target(context)) {
    case "astro":
      return [
        `Import a namespace from a subpath, such as ${inlineCode(`import { Dialog } from "${pkg}/dialog";`)}.`,
        "Components render on the server and start their Runtime controllers in the browser.",
        "Props set the initial state. Listen for `starwind:*` DOM events and call controller methods for later changes.",
        "Behavior starts again after `astro:after-swap` and `starwind:init`.",
      ];
    case "react":
      return [
        `Import a namespace from a subpath, such as ${inlineCode(`import { Dialog } from "${pkg}/dialog";`)}.`,
        "Use a value prop, such as `open`, for controlled state and a default prop, such as `defaultOpen`, for uncontrolled state.",
        "Callback props, such as `onOpenChange`, receive each change with a details object.",
        'Component files include `"use client"`.',
      ];
    case "vue":
      return [
        `Import a namespace from a subpath, such as ${inlineCode(`import Dialog from "${pkg}/dialog";`)}.`,
        "State works with `v-model` and named models, such as `v-model:open`, with matching `update:*` events.",
        "Detailed change events, such as `@open-change`, are normal Vue listeners.",
        "Each page lists the props, models, and events that the generated components declare.",
      ];
    case "svelte":
      return [
        `Import a namespace from a subpath, such as ${inlineCode(`import Dialog from "${pkg}/dialog";`)}.`,
        "State works with `bind:` props, such as `bind:open` and `bind:value`.",
        "Callback props, such as `onOpenChange`, receive each change with a details object.",
        "Each page lists the props, bindings, and callbacks that the generated components declare.",
      ];
  }
};

const families = (context: AdapterContext) =>
  getTargetFamilies(context.manifest, target(context)).filter((family) => family !== "theme");

const renderIndex = (context: AdapterContext) => {
  const peers = Object.entries(context.peerDependencies).map(([name, range]) => `${name}@${range}`);
  return joinBlocks([
    header(context, `Starwind UI ${context.framework.label} Primitive docs`),
    `These docs ship inside the package and match its installed version. ${context.framework.label} Primitive adapters render accessible, unstyled parts and connect them to ${inlineCode("@starwind-ui/runtime")} controllers.`,
    context.framework.maturity === "beta"
      ? `${context.framework.label} support is a public beta. Report problems through the [issue tracker](${ISSUE_TRACKER}).`
      : undefined,
    "For coding agents, start with [llms.txt](llms.txt) to find the page for each Primitive.",
    section(
      "## Install",
      codeFence(
        `npm install ${[context.framework.installSpecifier, ...peers.map((peer) => (/^[\w@./^~-]+$/.test(peer) ? peer : `"${peer}"`))].join(" ")}`,
        "bash",
      ),
      `This version requires ${inlineCode(`@starwind-ui/runtime@${context.runtimeRequirement}`)}. The package manager installs it for you.`,
      `For ready-made styled components, use the Starwind CLI: ${inlineCode(`npx starwind@latest init --framework ${target(context)}`)}.`,
    ),
    section(`## ${context.framework.label} conventions`, bulletList(conventions(context))),
    section(
      "## Primitives",
      table(
        ["Primitive", "Import", "Parts"],
        families(context).map((family) => {
          const surface = getFamilySurface(context.manifest, target(context), family);
          const primitive = getPrimitive(context, family);
          return [
            `[${primitive.displayName}](primitives/${family}.md)`,
            inlineCode(`${context.framework.packageName}/${family}`),
            surface.parts.map((part) => part.part).join(", "),
          ];
        }),
      ),
    ),
    section(
      "## Helpers",
      bulletList([
        `[Theme](theme.md): apply the color theme before paint and connect theme controls.`,
      ]),
    ),
    section(
      "## More help",
      bulletList([
        `[Primitive website docs](${STARWIND_SITE}/docs/primitives/)`,
        `[Issue tracker](${ISSUE_TRACKER})`,
      ]),
    ),
  ]);
};

const renderLlms = (context: AdapterContext) =>
  joinBlocks([
    `# ${context.framework.packageName}`,
    `> ${context.framework.label} Primitive adapters for Starwind UI, powered by @starwind-ui/runtime. These docs match the installed package version.`,
    [
      `- Version: ${context.version}`,
      `- Status: ${status(context)}`,
      `- Install: ${inlineCode(context.framework.installSpecifier)}`,
    ].join("\n"),
    section(
      "## Docs",
      bulletList([
        `[Overview](README.md): install, ${context.framework.label} conventions, and primitive index.`,
        "[Theme](theme.md): theme init script and theme controls.",
      ]),
    ),
    section(
      "## Primitives",
      bulletList(
        families(context).map((family) => {
          const primitive = getPrimitive(context, family);
          return `[${primitive.displayName}](primitives/${family}.md): ${primitive.docsReference.summary}`;
        }),
      ),
    ),
  ]);

export const renderAdapterDocs = (context: AdapterContext): DocsFiles => {
  const files: DocsFiles = new Map([
    ["docs/README.md", renderIndex(context)],
    ["docs/llms.txt", renderLlms(context)],
    ["docs/theme.md", renderThemePage(context)],
  ]);
  for (const family of families(context)) {
    assertFamilySourceExists(context.packageRoot, family);
    files.set(`docs/primitives/${family}.md`, renderPrimitivePage(context, family));
  }
  return files;
};

export type { AdapterContext };
