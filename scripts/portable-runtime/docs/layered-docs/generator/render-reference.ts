import {
  type PrimitiveDocsAuthoredExampleFrameworkMetadata,
  type PrimitiveDocsAuthoredExampleMetadata,
  type PrimitiveDocsFrameworkTarget,
  type PrimitiveDocsMetadata,
  type PrimitivePartApiReferenceMetadata,
  type PrimitiveSetterMetadata,
  type PrimitiveStateModelMetadata,
} from "../types.js";
import {
  GENERATED_MDX_COMMENT,
  PRIMITIVE_ANATOMY_FRAMEWORK_ORDER,
  PRIMITIVE_DOCS_FRAMEWORK_TARGETS,
} from "./constants.js";
import { formatNaturalList, toDisplayTitle } from "./shared.js";

export const renderPrimitiveIndexPage = () => `---
title: Runtime Primitives
description: A behavior-first reference for Starwind Runtime primitives and their styled component relationships.
sidebar:
  order: 1
  label: Overview
---

import PrimitiveInventory from "@/docs/components/primitive-reference/PrimitiveInventory.astro";

Starwind currently exposes 36 Runtime-backed primitives for Astro and React. They use the same
use-case groups as the styled component overview, making it easy to move between the styled and
behavior-first layers.

<PrimitiveInventory />

## Installation

\`starwind init\` installs the Primitive adapter for your project's primary framework. If you are
configuring Starwind manually, install the package that matches the files you are authoring:

\`\`\`bash
npm install @starwind-ui/astro
# or
npm install @starwind-ui/react
\`\`\`

You can also copy Primitive adapter source into your project with \`starwind primitives add\`. See
the [Getting Started Primitives guide](/docs/getting-started/primitives/) for the package, vendored
source, and Runtime/raw HTML tradeoffs.

## Import Pattern

Import each Primitive from its framework package and component subpath. The individual reference
pages show the available parts and complete examples for both frameworks.

**Astro**

\`\`\`ts
import { Accordion } from "@starwind-ui/astro/accordion";
\`\`\`

**React**

\`\`\`ts
import { Accordion } from "@starwind-ui/react/accordion";
\`\`\`

When you vendor Primitive source, import from the configured \`primitiveDir\` or
\`primitiveDirs.<framework>\` destination instead.

## Styling and Composition

Primitives provide behavior and framework-native anatomy without Starwind's styled wrapper. You
own the rendered markup and styling while the adapter coordinates the underlying Runtime contract.
Start with a [styled component](/docs/components/) when you want ready-to-render UI, or continue to
the [Runtime reference](/docs/runtime/) when you need to initialize behavior against raw HTML.
`;

export const renderPrimitiveReferencePage = (primitive: PrimitiveDocsMetadata) =>
  renderBaseUiStylePrimitiveReferencePage(primitive);

const renderBaseUiStylePrimitiveReferencePage = (primitive: PrimitiveDocsMetadata) => `---
title: ${primitive.displayName} Primitive
description: ${primitive.docsReference.summary}
sidebar:
  label: ${primitive.displayName}
---

${GENERATED_MDX_COMMENT}

${renderBaseUiStylePrimitiveReferenceMarkdown(primitive)}
`;

const renderBaseUiStylePrimitiveReferenceMarkdown = (primitive: PrimitiveDocsMetadata) =>
  joinMarkdownSections([
    primitive.docsReference.summary,
    "",
    renderPrimitiveUsageGuidelines(primitive),
    "",
    "## Anatomy",
    "",
    renderPrimitiveDocsExamplesTabs(primitive),
    "",
    renderPrimitiveAuthoredSections(primitive),
    "",
    renderPrimitiveFloatingReference(primitive),
    "",
    "## API Reference",
    "",
    primitive.docsReference.apiReference.parts
      .map((part) => renderPrimitivePartApiReference(primitive, part))
      .join("\n\n"),
    "",
    renderPrimitiveRuntimeApiReference(primitive),
    "",
    renderPrimitiveFormReference(primitive),
    "",
    renderPrimitiveCssVariablesReference(primitive),
    "",
    renderPrimitiveRelatedStyledComponentsReference(primitive),
    "",
    "## Changelog",
    "",
    `<PrimitiveChangelog docId="primitives/${primitive.id}" />`,
  ]);

const renderPrimitiveDocsExamplesTabs = (primitive: PrimitiveDocsMetadata) => {
  const examples = getPrimitiveDocsExamplesInDisplayOrder(primitive.docsReference.examples);

  return examples.length > 0
    ? joinMarkdownSections([
        '<DocsTabs syncKey="framework" defaultValue="astro">',
        "",
        "<DocsTabsList>",
        examples
          .map(
            (example) =>
              `<DocsTabsTrigger value="${example.framework}">${getPrimitiveDocsFrameworkLabel(example.framework)}</DocsTabsTrigger>`,
          )
          .join("\n"),
        "</DocsTabsList>",
        "",
        examples.map(renderPrimitiveDocsExampleTabContent).join("\n\n"),
        "",
        "</DocsTabs>",
      ])
    : "Examples for this primitive are planned.";
};

const renderPrimitiveDocsExampleTabContent = (
  example: PrimitiveDocsMetadata["docsReference"]["examples"][number],
) =>
  joinMarkdownSections([
    `<DocsTabsContent value="${example.framework}"${example.framework === "astro" ? " defaultVisible={true}" : ""}>`,
    "",
    example.summary ?? example.description,
    "",
    example.code
      ? renderCodeFence(example.code, example.language ?? getExampleLanguage(example.framework))
      : `Example for ${getPrimitiveDocsFrameworkLabel(example.framework)} is ${example.status ?? "planned"}.`,
    "",
    "</DocsTabsContent>",
  ]);

const renderPrimitiveUsageGuidelines = (primitive: PrimitiveDocsMetadata) =>
  primitive.docsReference.usageGuidelines.length > 0
    ? joinMarkdownSections([
        "## Usage Guidelines",
        "",
        primitive.docsReference.usageGuidelines
          .map((guideline) => `- **${guideline.title}** ${guideline.description}`)
          .join("\n"),
      ])
    : undefined;

const renderPrimitiveAuthoredSections = (primitive: PrimitiveDocsMetadata) =>
  primitive.docsReference.sections.length > 0
    ? primitive.docsReference.sections
        .map((section) =>
          joinMarkdownSections([
            `## ${section.title}`,
            "",
            renderPrimitiveAuthoredSectionContent(primitive, section.content, "mdx"),
          ]),
        )
        .join("\n\n")
    : undefined;

const renderPrimitiveAuthoredSectionContent = (
  primitive: PrimitiveDocsMetadata,
  content: string,
  format: "mdx" | "markdown",
) =>
  content.replace(/^\s*::example\{id="([A-Za-z0-9-]+)"\}\s*$/gm, (_, exampleId: string) => {
    const example = primitive.docsReference.authoredExamples.find(
      (candidate) => candidate.id === exampleId,
    );

    if (!example) {
      return `Missing authored example ${exampleId}.`;
    }

    return format === "mdx"
      ? renderPrimitiveAuthoredExampleMdx(example)
      : renderPrimitiveAuthoredExampleMarkdown(example);
  });

const renderPrimitiveAuthoredExampleMdx = (example: PrimitiveDocsAuthoredExampleMetadata) => {
  const frameworks = getPrimitiveAuthoredExampleFrameworksInDisplayOrder(example.frameworks);
  const defaultFramework = frameworks[0]?.framework ?? "astro";

  return joinMarkdownSections([
    `### ${example.title}`,
    "",
    example.summary,
    "",
    frameworks.length > 1
      ? joinMarkdownSections([
          `<DocsTabs syncKey="framework" defaultValue="${defaultFramework}">`,
          "",
          "<DocsTabsList>",
          frameworks
            .map(
              (framework) =>
                `<DocsTabsTrigger value="${framework.framework}">${getPrimitiveDocsFrameworkLabel(framework.framework)}</DocsTabsTrigger>`,
            )
            .join("\n"),
          "</DocsTabsList>",
          "",
          frameworks.map(renderPrimitiveAuthoredExampleTabContent).join("\n\n"),
          "",
          "</DocsTabs>",
        ])
      : frameworks.map(renderPrimitiveAuthoredExampleCodeBlock).join("\n\n"),
  ]);
};

const renderPrimitiveAuthoredExampleTabContent = (
  framework: PrimitiveDocsAuthoredExampleFrameworkMetadata,
  index: number,
) =>
  joinMarkdownSections([
    `<DocsTabsContent value="${framework.framework}"${index === 0 ? " defaultVisible={true}" : ""}>`,
    "",
    renderCodeFence(framework.code, framework.language),
    "",
    "</DocsTabsContent>",
  ]);

const renderPrimitiveAuthoredExampleMarkdown = (example: PrimitiveDocsAuthoredExampleMetadata) => {
  const frameworks = getPrimitiveAuthoredExampleFrameworksInDisplayOrder(example.frameworks);

  return joinMarkdownSections([
    `### ${example.title}`,
    "",
    example.summary,
    "",
    frameworks
      .map((framework) =>
        joinMarkdownSections([
          `#### ${getPrimitiveDocsFrameworkLabel(framework.framework)}`,
          "",
          renderCodeFence(framework.code, framework.language),
        ]),
      )
      .join("\n\n"),
  ]);
};

const renderPrimitiveAuthoredExampleCodeBlock = (
  framework: PrimitiveDocsAuthoredExampleFrameworkMetadata,
) =>
  joinMarkdownSections([
    `#### ${getPrimitiveDocsFrameworkLabel(framework.framework)}`,
    "",
    renderCodeFence(framework.code, framework.language),
  ]);

const renderPrimitivePartApiReference = (
  primitive: PrimitiveDocsMetadata,
  part: PrimitivePartApiReferenceMetadata,
) =>
  joinMarkdownSections([
    `### ${toDisplayTitle(part.part)}`,
    "",
    `<PrimitivePartReference docId="primitives/${primitive.id}" part="${part.part}" />`,
  ]);

const _renderPrimitivePartApiReferenceMarkdown = (
  primitive: PrimitiveDocsMetadata,
  part: PrimitivePartApiReferenceMetadata,
) =>
  joinMarkdownSections([
    `### ${toDisplayTitle(part.part)}`,
    "",
    part.description,
    "",
    renderMarkdownTable(
      ["Fact", "Value"],
      [
        ["Default element", `\`${part.defaultElement}\``],
        ["Discovery hook", `\`${part.discoveryAttribute}\``],
        ["Role", part.role ? `\`${part.role}\`` : ""],
      ],
    ),
    "",
    renderPrimitivePartPropsReference(part),
    "",
    renderPrimitivePartDataAttributesReference(part),
    "",
    renderPrimitivePartStateReference(part, primitive.events),
    "",
    renderPrimitivePartEventsReference(part),
    "",
    renderPrimitivePartSettersReference(part),
    "",
    renderPrimitivePartRefsReference(part),
    "",
    renderPrimitivePartContextReference(part),
    "",
    renderPrimitivePartAsChildReference(part),
    "",
    renderPrimitivePartInitialMarkupReference(part),
    "",
    renderPrimitivePartFormReference(part),
    "",
    renderPrimitivePartPresenceReference(part),
  ]);

const renderPrimitivePartPropsReference = (part: PrimitivePartApiReferenceMetadata) =>
  part.props.length > 0
    ? joinMarkdownSections([
        "#### Props",
        "",
        renderMarkdownTable(
          ["Prop", "Type", "Default", "Kind", "Description"],
          part.props.map((prop) => [
            prop.name,
            `\`${prop.displayType ?? prop.type}\``,
            prop.defaultValue ?? "",
            prop.kind,
            prop.description ?? "",
          ]),
        ),
      ])
    : undefined;

const renderPrimitivePartDataAttributesReference = (part: PrimitivePartApiReferenceMetadata) =>
  part.dataAttributes.length > 0
    ? joinMarkdownSections([
        "#### Data Attributes",
        "",
        renderMarkdownTable(
          ["Attribute", "Source", "Value", "Description"],
          part.dataAttributes.map((attribute) => [
            `\`${attribute.name}\``,
            attribute.source,
            attribute.value ? `\`${attribute.value}\`` : "",
            attribute.description ?? "",
          ]),
        ),
      ])
    : undefined;

const renderPrimitivePartStateReference = (
  part: PrimitivePartApiReferenceMetadata,
  events: readonly PrimitiveDocsMetadata["events"][number][] = part.events,
) =>
  part.stateModels.length > 0
    ? joinMarkdownSections([
        "#### State",
        "",
        renderMarkdownTable(
          [
            "State",
            "Value Type",
            "Controlled Prop",
            "Default Prop",
            "Initial Attribute",
            "Runtime Getter",
            "Runtime Setter",
            "Description",
            "State Control Support",
          ],
          part.stateModels.map((state) => [
            state.name,
            `\`${state.valueType}\``,
            state.controlledProp ?? "",
            state.defaultProp ?? "",
            state.initialAttribute ? `\`${state.initialAttribute}\`` : "",
            state.runtimeGetter ? `\`${state.runtimeGetter}\`` : "",
            state.runtimeSetter ? `\`${state.runtimeSetter}\`` : "",
            state.description ?? "",
            formatPrimitiveStateControlSupport(part, state, events),
          ]),
        ),
      ])
    : undefined;

const renderPrimitivePartEventsReference = (part: PrimitivePartApiReferenceMetadata) =>
  part.events.length > 0
    ? joinMarkdownSections([
        "#### Events",
        "",
        renderMarkdownTable(
          [
            "Event",
            "Callback",
            "DOM Event",
            "Value",
            "Details",
            "Timing",
            "Cancelable",
            "Description",
          ],
          part.events.map((event) => [
            event.name,
            event.callbackProp,
            event.domEvent ?? "",
            formatPrimitiveEventValue(event),
            event.detailsType ?? "",
            event.callbackTiming ?? "",
            formatOptionalBoolean(event.cancelable),
            event.description ?? "",
          ]),
        ),
      ])
    : undefined;

const renderPrimitivePartSettersReference = (part: PrimitivePartApiReferenceMetadata) =>
  part.setters.length > 0
    ? joinMarkdownSections([
        "#### Runtime Setters",
        "",
        renderMarkdownTable(
          ["Method", "Target", "Options", "Suppresses Emit", "Description"],
          part.setters.map((setter) => [
            `\`${setter.method}\``,
            formatPrimitiveSetterTarget(setter),
            formatPrimitiveSetterOptions(setter),
            setter.suppressesEmit ? "Yes" : "No",
            setter.description ?? "",
          ]),
        ),
      ])
    : undefined;

const renderPrimitivePartRefsReference = (part: PrimitivePartApiReferenceMetadata) =>
  part.refs.length > 0
    ? joinMarkdownSections([
        "#### Refs",
        "",
        renderMarkdownTable(
          ["Part", "Public"],
          part.refs.map((ref) => [ref.part, formatBoolean(ref.public)]),
        ),
      ])
    : undefined;

const renderPrimitivePartContextReference = (part: PrimitivePartApiReferenceMetadata) =>
  part.context.length > 0
    ? joinMarkdownSections([
        "#### Context",
        "",
        renderMarkdownTable(
          ["Name", "Direction", "Values"],
          part.context.map((context) => [
            context.name,
            context.direction,
            formatMarkdownList(context.values),
          ]),
        ),
      ])
    : undefined;

const renderPrimitivePartAsChildReference = (part: PrimitivePartApiReferenceMetadata) =>
  part.asChild.length > 0
    ? joinMarkdownSections([
        "#### asChild",
        "",
        renderMarkdownTable(
          ["Part", "Merged Props"],
          part.asChild.map((asChild) => [asChild.part, formatMarkdownList(asChild.merges)]),
        ),
      ])
    : undefined;

const renderPrimitivePartInitialMarkupReference = (part: PrimitivePartApiReferenceMetadata) =>
  part.initialMarkup.length > 0
    ? joinMarkdownSections([
        "#### Initial Markup",
        "",
        renderMarkdownTable(
          ["Attributes", "Reason"],
          part.initialMarkup.map((initialMarkup) => [
            formatMarkdownList(initialMarkup.attributes.map((attribute) => `\`${attribute}\``)),
            initialMarkup.reason,
          ]),
        ),
      ])
    : undefined;

const renderPrimitivePartFormReference = (part: PrimitivePartApiReferenceMetadata) =>
  part.form
    ? joinMarkdownSections([
        "#### Form",
        "",
        renderMarkdownTable(
          ["Fact", "Value"],
          [
            ["Form props", formatMarkdownList(part.form.props)],
            [
              "Hidden input",
              part.form.hiddenInput
                ? `${part.form.hiddenInput.part} (${part.form.hiddenInput.type})`
                : "",
            ],
          ],
        ),
      ])
    : undefined;

const renderPrimitivePartPresenceReference = (part: PrimitivePartApiReferenceMetadata) =>
  part.presence
    ? joinMarkdownSections([
        "#### Presence",
        "",
        renderMarkdownTable(
          ["Fact", "Value"],
          [
            ["Initial hidden", formatBoolean(part.presence.initialHidden)],
            ["Unmount policy", part.presence.unmountPolicy],
            ["Keep mounted prop", part.presence.keepMountedProp ?? ""],
          ],
        ),
      ])
    : undefined;

const renderPrimitiveRuntimeApiReference = (primitive: PrimitiveDocsMetadata) =>
  joinMarkdownSections([
    "## Runtime API",
    "",
    `<PrimitiveRuntimeApiReference docId="primitives/${primitive.id}" />`,
  ]);

const renderPrimitiveFloatingReference = (primitive: PrimitiveDocsMetadata) =>
  primitive.floating
    ? joinMarkdownSections([
        "## Floating Behavior",
        "",
        renderMarkdownTable(
          ["Fact", "Value"],
          [
            ["Anchor part", primitive.floating.anchorPart],
            ["Positioner part", primitive.floating.positionerPart],
            ["Popup part", primitive.floating.popupPart],
            ["Portal part", primitive.floating.portalPart ?? ""],
            ["Option props", formatMarkdownList(primitive.floating.optionProps)],
          ],
        ),
      ])
    : undefined;

const renderPrimitiveFormReference = (primitive: PrimitiveDocsMetadata) =>
  primitive.form
    ? joinMarkdownSections([
        "## Form Participation",
        "",
        renderMarkdownTable(
          ["Fact", "Value"],
          [
            ["Form props", formatMarkdownList(primitive.form.props)],
            [
              "Hidden input",
              primitive.form.hiddenInput
                ? `${primitive.form.hiddenInput.part} (${primitive.form.hiddenInput.type})`
                : "",
            ],
            ["Field integration", formatBoolean(primitive.form.fieldIntegration === true)],
          ],
        ),
      ])
    : undefined;

const renderPrimitiveCssVariablesReference = (primitive: PrimitiveDocsMetadata) =>
  (primitive.cssVariables?.length ?? 0) > 0
    ? joinMarkdownSections([
        "## CSS Variables",
        "",
        renderMarkdownTable(
          ["Variable", "Parts", "Source", "Description"],
          (primitive.cssVariables ?? []).map((variable) => [
            `\`${variable.name}\``,
            formatMarkdownList(variable.parts.map((part) => `\`${part}\``)),
            variable.source,
            variable.description,
          ]),
        ),
      ])
    : undefined;

const renderPrimitiveRelatedStyledComponentsReference = (primitive: PrimitiveDocsMetadata) =>
  primitive.docsReference.apiReference.relatedStyledComponents.length > 0
    ? joinMarkdownSections([
        "## Related Styled Components",
        "",
        `<PrimitiveRelatedStyledComponents docId="primitives/${primitive.id}" />`,
      ])
    : undefined;

const _renderPrimitiveExportGroupsReference = (primitive: PrimitiveDocsMetadata) =>
  primitive.docsReference.apiReference.exportGroups.length > 0
    ? joinMarkdownSections([
        "## Exports",
        "",
        renderMarkdownTable(
          ["Group", "Import", "Exports"],
          primitive.docsReference.apiReference.exportGroups.map((group) => [
            group.label,
            `\`${group.importSource}\``,
            formatMarkdownList(group.exports.map((name) => `\`${name}\``)),
          ]),
        ),
      ])
    : undefined;

const _renderPrimitiveCanonicalNamesReference = (primitive: PrimitiveDocsMetadata) =>
  primitive.docsReference.apiReference.canonicalNames.length > 0
    ? joinMarkdownSections([
        "## Canonical Names",
        "",
        renderMarkdownTable(
          ["Kind", "Name"],
          primitive.docsReference.apiReference.canonicalNames.map((name) => [
            name.kind,
            `\`${name.name}\``,
          ]),
        ),
      ])
    : undefined;

export const renderRuntimeIndexPage = () => `---
title: Runtime And Raw HTML
description: Low-level Starwind Runtime initialization, raw HTML discovery hooks, factories, cleanup, events, and theme helpers.
sidebar:
  order: 1
  label: Overview
---

import RuntimeFactoriesTable from "@/docs/components/runtime-reference/RuntimeFactoriesTable.astro";
import RuntimeInitDetails from "@/docs/components/runtime-reference/RuntimeInitDetails.astro";
import RuntimeRawHtmlReference from "@/docs/components/runtime-reference/RuntimeRawHtmlReference.astro";
import RuntimeThemeReference from "@/docs/components/runtime-reference/RuntimeThemeReference.astro";

${GENERATED_MDX_COMMENT}

The Runtime surface is for raw HTML and framework adapters that already render the Starwind DOM
contract. It owns initialization, cleanup, discovery hooks, factories, DOM events, instance
methods, and theme helpers without requiring Astro or React.

Use styled components first when you want ready-to-render UI. Use the Runtime directly when you are
rendering static markup, building a framework adapter, or integrating Starwind behavior into a
non-framework surface.

## Init Starwind

\`initStarwind\` scans a root node for Starwind discovery attributes and initializes each matching
primitive in cleanup order. Store the returned cleanup object and call \`destroy()\` when that root
leaves the page.

\`\`\`ts
import { initStarwind } from "@starwind-ui/runtime/init-starwind";

const starwind = initStarwind(document);

// Later, when the root is removed.
starwind.destroy();
\`\`\`

<RuntimeInitDetails />

## Raw HTML

Raw HTML uses \`data-sw-*\` discovery hooks for Runtime ownership. You provide the DOM contract, then
call \`initStarwind(root?)\` for automatic discovery or call a \`create*\` factory for one primitive
instance.

\`\`\`html
<div data-sw-drawer>
  <button data-sw-drawer-trigger>Open</button>
  <div data-sw-drawer-popup hidden>
    <button data-sw-drawer-close>Close</button>
  </div>
</div>
\`\`\`

The initializer registry below shows which selectors are discovered by \`initStarwind\`, which
factory owns each selector, and the cleanup order used when a root is destroyed.

<RuntimeRawHtmlReference />

## Data Attributes

Runtime discovery attributes use the \`data-sw-*\` prefix. Primitive state, options, and measured
values use short scoped \`data-*\` attributes such as \`data-state\`, \`data-value\`, \`data-side\`, and
\`data-auto-init\`.

Treat \`data-sw-*\` attributes as behavior hooks. Treat \`data-slot\` as public part identity for
styling and documentation. Styled components may add classes, variants, and slots around the same
Runtime-owned behavior contract.

## Runtime Factories

Every primitive has a \`create*\` factory. Framework adapters call these factories after rendering
primitive anatomy; raw HTML can call them directly when you want explicit ownership instead of
document-wide discovery.

Factories expose option props, state models, DOM events, and setter methods. Setter calls update the
Runtime instance without requiring a framework render cycle.

<RuntimeFactoriesTable />

## Lifecycle And Cleanup

\`initStarwind\` returns a cleanup object for the initialized root. Calling \`destroy()\` tears down
listeners, observers, timers, floating behavior, portals, and runtime-owned presence for primitives
created under that root.

Some raw HTML initializers are ordered because child primitives depend on parent providers or form
state. Use the cleanup order in the raw HTML table when you build a custom adapter or manual
initializer.

## Events And State

Runtime factories bridge controlled and uncontrolled state with DOM events. For example,
\`createDrawer\` exposes open state, emits \`starwind:open-change\`, and provides setter methods for
updating state from framework adapters or custom DOM code.

Use event names from the factory table when listening from raw HTML. Use callback props from the
framework adapter when you are inside Astro or React primitives.

## Theme

Theme helpers are part of the Runtime surface. Use \`createThemeController\` for interactive controls
and \`getThemeInitScript\` before paint to apply the initial color theme.

Theme controls are discovered through selectors such as \`[data-sw-theme-control]\` and
\`[data-sw-theme-toggle]\`. The Runtime emits \`starwind:theme-change\` when the active theme changes.

<RuntimeThemeReference />
`;

const joinMarkdownSections = (sections: readonly (string | undefined)[]) =>
  sections
    .filter((section): section is string => section !== undefined && section.length > 0)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const renderCodeFence = (code: string, language: string) => `\`\`\`${language}\n${code}\n\`\`\``;

const renderMarkdownTable = (headers: readonly string[], rows: readonly (readonly string[])[]) => {
  const headerRow = `| ${headers.map(escapeMarkdownTableCell).join(" | ")} |`;
  const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;
  const bodyRows = rows.map(
    (row) => `| ${row.map((cell) => escapeMarkdownTableCell(cell || "-")).join(" | ")} |`,
  );

  return [headerRow, separatorRow, ...bodyRows].join("\n");
};

const escapeMarkdownTableCell = (value: string) =>
  value.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");

const formatMarkdownList = (values: readonly string[] | undefined) =>
  values && values.length > 0 ? values.join(", ") : "";

const _formatOptionLifecycles = (
  lifecycles: PrimitiveDocsMetadata["runtime"]["optionPropLifecycles"],
) =>
  lifecycles
    ? Object.entries(lifecycles)
        .map(([prop, lifecycle]) => `${prop}: ${lifecycle}`)
        .join(", ")
    : "";

const formatPrimitiveSetterTarget = (setter: PrimitiveSetterMetadata) => {
  if ("stateModel" in setter) return `state: ${setter.stateModel}`;
  if ("prop" in setter) return `prop: ${setter.prop}`;
  if ("props" in setter) return `props: ${setter.props.join(", ")}`;
  return "";
};

const formatPrimitiveSetterOptions = (setter: PrimitiveSetterMetadata) =>
  setter.options
    ? Object.entries(setter.options)
        .map(([name, value]) => `${name}: ${String(value)}`)
        .join(", ")
    : "";

const formatPrimitiveEventValue = (
  event: Pick<PrimitivePartApiReferenceMetadata["events"][number], "valueProperty" | "valueType">,
) => {
  if (!event.valueProperty && !event.valueType) {
    return "";
  }

  return [event.valueProperty ?? "value", event.valueType ? `\`${event.valueType}\`` : undefined]
    .filter((part): part is string => part !== undefined)
    .join(": ");
};

const formatReactStateControlSupport = (state: PrimitiveStateModelMetadata) => {
  if (state.controlledProp && state.defaultProp) {
    return `React supports controlled and default state with ${state.controlledProp} and ${state.defaultProp} props.`;
  }

  if (state.controlledProp) {
    return `React supports controlled state with the ${state.controlledProp} prop.`;
  }

  if (state.defaultProp) {
    return `React supports default state with the ${state.defaultProp} prop.`;
  }

  return "React coordinates this state through the primitive adapter instead of a dedicated state prop.";
};

const eventControlsState = (
  event: PrimitiveDocsMetadata["events"][number],
  state: PrimitiveStateModelMetadata,
) =>
  event.valueProperty === state.name ||
  (state.controlledProp !== undefined && event.valueProperty === state.controlledProp);

const formatRuntimeHtmlStateControlSupport = (
  part: PrimitivePartApiReferenceMetadata,
  state: PrimitiveStateModelMetadata,
  events: readonly PrimitiveDocsMetadata["events"][number][] = part.events,
) => {
  const relatedEvents = events
    .filter((event) => eventControlsState(event, state) && event.domEvent)
    .map((event) => event.domEvent as string);
  const actions = [
    state.initialAttribute ? `reads initial state from ${state.initialAttribute}` : undefined,
    relatedEvents.length > 0 ? `emits ${formatNaturalList(relatedEvents)}` : undefined,
    state.runtimeSetter ? `updates with ${state.runtimeSetter}` : undefined,
  ].filter((action): action is string => action !== undefined);

  return actions.length > 0
    ? `Runtime/HTML ${formatNaturalList(actions)}.`
    : "Runtime/HTML coordinates this state through the primitive controller.";
};

const formatAstroStateControlSupport = (state: PrimitiveStateModelMetadata) => {
  switch (state.controlledStateSync) {
    case "unsupported":
      return "Astro adapters render initial/default state, but do not expose reactive controlled-state props for this state.";
    case "custom-event":
      return "Astro adapters render initial/default state and report changes through Runtime DOM events.";
    case "imperative":
      return "Astro adapters render initial/default state and apply changes through Runtime setter methods after load.";
    default:
      return "Astro adapters render initial/default state from props when the page loads.";
  }
};

export const formatPrimitiveStateControlSupport = (
  part: PrimitivePartApiReferenceMetadata,
  state: PrimitiveStateModelMetadata,
  events: readonly PrimitiveDocsMetadata["events"][number][] = part.events,
) =>
  [
    formatReactStateControlSupport(state),
    formatRuntimeHtmlStateControlSupport(part, state, events),
    formatAstroStateControlSupport(state),
  ].join(" ");

const formatOptionalBoolean = (value: boolean | undefined) =>
  value === undefined ? "" : formatBoolean(value);

const formatBoolean = (value: boolean | undefined) => (value ? "Yes" : "No");

const getExampleLanguage = (framework: PrimitiveDocsFrameworkTarget) => {
  switch (framework) {
    case "raw-html":
      return "html";
    case "astro":
      return "astro";
    case "react":
      return "tsx";
    default:
      return framework;
  }
};

const getPrimitiveDocsExamplesInDisplayOrder = <
  T extends { readonly framework: PrimitiveDocsFrameworkTarget },
>(
  examples: readonly T[],
) => {
  const frameworkOrder = new Map<PrimitiveDocsFrameworkTarget, number>();

  [...PRIMITIVE_ANATOMY_FRAMEWORK_ORDER, ...PRIMITIVE_DOCS_FRAMEWORK_TARGETS].forEach(
    (framework) => {
      if (!frameworkOrder.has(framework)) {
        frameworkOrder.set(framework, frameworkOrder.size);
      }
    },
  );

  return [...examples].sort(
    (left, right) =>
      (frameworkOrder.get(left.framework) ?? Number.MAX_SAFE_INTEGER) -
      (frameworkOrder.get(right.framework) ?? Number.MAX_SAFE_INTEGER),
  );
};

export const getPrimitiveAuthoredExampleFrameworksInDisplayOrder = <
  T extends { readonly framework: PrimitiveDocsAuthoredExampleFrameworkMetadata["framework"] },
>(
  frameworks: readonly T[],
) => getPrimitiveDocsExamplesInDisplayOrder(frameworks);

const getPrimitiveDocsFrameworkLabel = (framework: PrimitiveDocsFrameworkTarget) =>
  framework === "raw-html" ? "HTML" : toDisplayTitle(framework);

export const isPrimitiveDocsFrameworkTarget = (
  value: string,
): value is PrimitiveDocsFrameworkTarget =>
  (PRIMITIVE_DOCS_FRAMEWORK_TARGETS as readonly string[]).includes(value);
