import type {
  AdapterAnchoredMenuOverlayComponentProjection,
  AdapterAnchoredMenuOverlayFacts,
  AdapterAnchoredMenuOverlayIndexProjection,
} from "../types.js";

export function printAstroAnchoredMenuOverlayComponent(
  family: AdapterAnchoredMenuOverlayComponentProjection,
): string {
  if (family.part === "root") return printRoot(family.facts);

  return printTrigger(family.facts);
}

export function printAstroAnchoredMenuOverlayIndex(
  family: AdapterAnchoredMenuOverlayIndexProjection,
): string {
  const facts = family.facts;
  const menuImports = facts.index.menuAliasMembers
    .map((alias) => `  ${alias.menuName} as ${alias.contextName},`)
    .join("\n");
  const localImports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.astro";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const namedMembers = [
    ...facts.index.importMembers.map((member) => member.name),
    ...facts.index.menuAliasMembers.map((alias) => alias.contextName),
  ].sort((a, b) => a.localeCompare(b));
  const namedExports = [facts.exports.namespace, ...namedMembers]
    .map((name) => `  ${name},`)
    .join("\n");
  const typeExports = facts.index.typeExports.length
    ? `\n\nexport type {\n${facts.index.typeExports.map((name) => `  ${name},`).join("\n")}\n} from "${facts.runtime.typeImportSource}";`
    : "";

  return `import {\n${menuImports}\n} from "../menu";\n${localImports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${namedExports}\n};\n\nexport default ${facts.exports.namespace};${typeExports}\n`;
}

function printRoot(facts: AdapterAnchoredMenuOverlayFacts): string {
  const props = facts.props;
  const runtime = facts.runtime;
  const cleanupEvent = toAstroLifecycleEvent(runtime.cleanupEvent);
  const initEvents = runtime.initEvents.map(toAstroLifecycleEvent);

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.root.defaultElement}"> & {\n  ${props.defaultOpen.name}?: ${props.defaultOpen.type};\n  ${props.disabled.name}?: ${props.disabled.type};\n  ${props.modal.name}?: ${props.modal.type};\n  ${props.closeDelay.name}?: ${props.closeDelay.type};\n};\n\nconst {\n  ${props.defaultOpen.name} = ${getDefault(props.defaultOpen, "false")},\n  ${props.disabled.name} = ${getDefault(props.disabled, "false")},\n  ${props.modal.name} = ${getDefault(props.modal, "true")},\n  ${props.closeDelay.name} = ${getDefault(props.closeDelay, "200")},\n  ...rest\n} = Astro.props;\n---\n\n<${facts.parts.root.defaultElement}\n  ${facts.attrs.root}\n  ${facts.attrs.menuRoot}\n  ${facts.attrs.defaultOpen}={${props.defaultOpen.name} ? "true" : undefined}\n  ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n  ${facts.attrs.modal}={${props.modal.name} ? "true" : "false"}\n  ${facts.attrs.closeDelay}={${props.closeDelay.name}}\n  ${facts.attrs.state}={${props.defaultOpen.name} ? "${facts.root.stateAttributes.openValue}" : "${facts.root.stateAttributes.closedValue}"}\n  {...rest}\n>\n  <slot />\n</${facts.parts.root.defaultElement}>\n\n<script>\n  import { ${runtime.factory} } from "${runtime.importSource}";\n\n  const ${runtime.instancesName} = new Set<ReturnType<typeof ${runtime.factory}>>();\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.attrs.root}]").forEach((root) =>\n      ${runtime.instancesName}.add(${runtime.factory}(root)),\n    );\n  };\n\n  const ${runtime.destroyFunction} = () => {\n    ${runtime.instancesName}.forEach((instance) => instance.${runtime.destroyMethod}());\n    ${runtime.instancesName}.clear();\n  };\n\n  ${runtime.setupFunction}();\n  document.addEventListener("${initEvents[1]}", ${runtime.setupFunction});\n  document.addEventListener("${cleanupEvent}", ${runtime.destroyFunction});\n  document.addEventListener("${initEvents[2]}", ${runtime.setupFunction});\n</script>\n`;
}

function printTrigger(facts: AdapterAnchoredMenuOverlayFacts): string {
  const trigger = facts.trigger;
  const disabled = facts.trigger.disabled;
  const tabIndexAttribute =
    facts.props.tabIndex.name === "tabIndex" ? "tabindex" : facts.props.tabIndex.name;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.trigger.defaultElement}"> & {\n  ${disabled.prop.name}?: ${disabled.prop.type};\n};\n\nconst { ${disabled.prop.name} = false, style, ...rest } = Astro.props;\nconst triggerStyle = ["${trigger.touchCalloutStyle.property}: ${trigger.touchCalloutStyle.value}", style].filter(Boolean).join("; ");\n---\n\n<${facts.parts.trigger.defaultElement}\n  ${facts.attrs.trigger}\n  ${facts.attrs.menuTrigger}\n  ${trigger.disclosure.ariaHaspopup.attribute}="${trigger.disclosure.ariaHaspopup.value}"\n  ${trigger.disclosure.ariaExpanded}="false"\n  ${disabled.ariaAttribute}={${disabled.prop.name} ? "true" : undefined}\n  ${disabled.dataAttribute}={${disabled.prop.name} ? "" : undefined}\n  ${trigger.disclosure.stateAttribute}="${trigger.disclosure.closedStateValue}"\n  ${tabIndexAttribute}={${disabled.prop.name} ? -1 : ${trigger.tabIndexDefaultValue}}\n  style={triggerStyle}\n  {...rest}\n>\n  <slot />\n</${facts.parts.trigger.defaultElement}>\n`;
}

function getDefault(prop: { defaultValue?: string }, fallback: string): string {
  return prop.defaultValue ?? fallback;
}

function toAstroLifecycleEvent(event: string): string {
  if (event === "after-swap") return "astro:after-swap";
  if (event === "before-swap") return "astro:before-swap";

  return event;
}
