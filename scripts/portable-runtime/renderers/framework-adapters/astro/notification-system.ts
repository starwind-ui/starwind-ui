import type {
  AdapterNotificationSystemComponentProjection,
  AdapterNotificationSystemFacts,
  AdapterNotificationSystemIndexProjection,
  AdapterNotificationSystemPartName,
} from "../types.js";

export function printAstroNotificationSystemComponent(
  family: AdapterNotificationSystemComponentProjection,
): string {
  if (family.part === "viewport") return printViewport(family.facts);
  if (family.part === "template") return printTemplate(family.facts);
  if (family.part === "root") return printRoot(family.facts);
  if (family.part === "action") return printAction(family.facts);
  if (family.part === "close") return printClose(family.facts);

  return printSimplePart(family.facts, family.part);
}

export function printAstroNotificationSystemIndex(
  family: AdapterNotificationSystemIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.astro";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const exportNames = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exportNames}\n};\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.index.typeExports.join(", ")} } from "${facts.index.typeExportSource}";\nexport { ${facts.index.valueExports.join(", ")} } from "${facts.index.valueExportSource}";\n`;
}

function printViewport(facts: AdapterNotificationSystemFacts): string {
  const part = facts.parts.viewport;
  const options = facts.viewportOptions;
  const semantics = facts.viewportSemantics;
  const tabIndexAttribute =
    semantics.tabIndexAttribute === "tabIndex" ? "tabindex" : semantics.tabIndexAttribute;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Position = ${options.position.type};\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${options.duration.name}?: ${options.duration.type};\n  ${options.gap.name}?: ${options.gap.type};\n  ${options.limit.name}?: ${options.limit.type};\n  ${options.peek.name}?: ${options.peek.type};\n  ${options.position.name}?: Position;\n};\n\nconst {\n  ${options.duration.name} = ${options.duration.defaultValue},\n  ${options.gap.name} = ${options.gap.defaultValue},\n  ${options.limit.name} = ${options.limit.defaultValue},\n  ${options.peek.name} = ${options.peek.defaultValue},\n  ${options.position.name} = ${options.position.defaultValue},\n  style,\n  ...rest\n} = Astro.props;\n\nconst viewportStyle = [\`${options.gap.cssVariable}: \${${options.gap.name}}\`, \`${options.peek.cssVariable}: \${${options.peek.name}}\`, style]\n  .filter(Boolean)\n  .join("; ");\n---\n\n<${part.defaultElement}\n  ${facts.attrs.viewport}\n  ${options.position.attribute}={${options.position.name}}\n  ${options.limit.attribute}={${options.limit.name}}\n  ${options.duration.attribute}={${options.duration.name}}\n  role="${semantics.role}"\n  ${semantics.ariaLiveAttribute}="${semantics.ariaLiveValue}"\n  ${semantics.ariaAtomicAttribute}="${semantics.ariaAtomicValue}"\n  ${semantics.ariaRelevantAttribute}="${semantics.ariaRelevantValue}"\n  ${semantics.ariaLabelAttribute}="${semantics.ariaLabelValue}"\n  ${tabIndexAttribute}="${semantics.tabIndexValue}"\n  style={viewportStyle}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${facts.runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.attrs.viewport}]").forEach((viewport) => {\n      ${facts.runtime.factory}(viewport);\n    });\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printTemplate(facts: AdapterNotificationSystemFacts): string {
  const part = facts.parts.template;
  const variant = facts.template.variant;

  return `---\ntype Variant = ${variant.type};\n\ntype Props = {\n  ${variant.name}?: Variant;\n};\n\nconst { ${variant.name} = ${variant.defaultValue} } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.template}={${variant.name}}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printRoot(facts: AdapterNotificationSystemFacts): string {
  const part = facts.parts.root;
  const variant = facts.template.variant;
  const rootState = facts.rootState;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Variant = ${variant.type};\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${variant.name}?: Variant;\n};\n\nconst { ${variant.name} = ${variant.defaultValue}, ...rest } = Astro.props;\n---\n\n<${part.defaultElement}\n  ${facts.attrs.root}\n  ${rootState.stateAttribute}="${rootState.stateOpenValue}"\n  ${rootState.variantAttribute}={${variant.name}}\n  role="${rootState.role}"\n  ${rootState.ariaModalAttribute}="${rootState.ariaModalValue}"\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printSimplePart(
  facts: AdapterNotificationSystemFacts,
  partName: Exclude<
    AdapterNotificationSystemPartName,
    "action" | "close" | "root" | "template" | "viewport"
  >,
): string {
  const part = facts.parts[partName];

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs[partName]} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAction(facts: AdapterNotificationSystemFacts): string {
  const part = facts.parts.action;
  const action = facts.actions.action;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${action.typeAttribute}="${action.typeValue}" ${facts.attrs.action} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printClose(facts: AdapterNotificationSystemFacts): string {
  const part = facts.parts.close;
  const close = facts.actions.close;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${close.typeAttribute}="${close.typeValue}" ${facts.attrs.close} ${close.ariaLabelAttribute}="${close.ariaLabelValue}" {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}
