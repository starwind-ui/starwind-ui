import type {
  AdapterSharedViewportNavigationComponentProjection,
  AdapterSharedViewportNavigationFacts,
  AdapterSharedViewportNavigationIndexProjection,
  AdapterSharedViewportNavigationPartName,
} from "../types.js";

export function printAstroSharedViewportNavigationComponent(
  family: AdapterSharedViewportNavigationComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printRoot(facts);
  if (family.part === "item") return printItem(facts);
  if (family.part === "trigger") return printTrigger(facts);
  if (family.part === "content") return printContent(facts);
  if (family.part === "link") return printLink(facts);
  if (family.part === "positioner") return printPositioner(facts);

  return printSimplePart(facts, family.part);
}

export function printAstroSharedViewportNavigationIndex(
  family: AdapterSharedViewportNavigationIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.astro";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const namedExports = [facts.exports.namespace, ...facts.index.importMembers.map((member) => member.name)]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${namedExports}\n};\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";\n`;
}

function printRoot(facts: AdapterSharedViewportNavigationFacts): string {
  const props = facts.props;
  const valueState = facts.valueControl.state;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = Omit<HTMLAttributes<"${facts.parts.root.defaultElement}">, "onChange"> & {\n  ${props.value.name}?: ${props.value.type};\n  ${props.defaultValue.name}?: ${props.defaultValue.type};\n  ${props.openDelay.name}?: ${props.openDelay.type};\n  ${props.closeDelay.name}?: ${props.closeDelay.type};\n  ${props.closeOnEscape.name}?: ${props.closeOnEscape.type};\n  ${props.closeOnOutsideInteract.name}?: ${props.closeOnOutsideInteract.type};\n  ${props.orientation.name}?: ${props.orientation.type};\n};\n\nconst {\n  ${props.value.name},\n  ${props.defaultValue.name} = ${getDefault(props.defaultValue, "null")},\n  ${props.openDelay.name} = ${getDefault(props.openDelay, "50")},\n  ${props.closeDelay.name} = ${getDefault(props.closeDelay, "50")},\n  ${props.closeOnEscape.name} = ${getDefault(props.closeOnEscape, "true")},\n  ${props.closeOnOutsideInteract.name} = ${getDefault(props.closeOnOutsideInteract, "true")},\n  ${props.orientation.name} = ${getDefault(props.orientation, '"horizontal"')},\n  ...rest\n} = Astro.props;\n\nconst initialValue = ${props.value.name} === undefined ? ${props.defaultValue.name} : ${props.value.name};\n---\n\n<${facts.parts.root.defaultElement}\n  ${facts.attrs.root}\n  ${facts.attrs.value}={${props.value.name} ?? undefined}\n  ${valueState.controlledNullMarker.attribute}={${props.value.name} === null ? "${valueState.controlledNullMarker.value}" : undefined}\n  ${facts.attrs.defaultValue}={${props.value.name} === undefined ? (${props.defaultValue.name} ?? undefined) : undefined}\n  ${facts.attrs.openDelay}={${props.openDelay.name}}\n  ${facts.attrs.closeDelay}={${props.closeDelay.name}}\n  ${facts.attrs.closeOnEscape}={${props.closeOnEscape.name} ? "true" : "false"}\n  ${facts.attrs.closeOnOutsideInteract}={${props.closeOnOutsideInteract.name} ? "true" : "false"}\n  ${facts.attrs.orientation}={${props.orientation.name}}\n  ${valueState.renderedStateAttribute}={initialValue !== null ? "open" : "closed"}\n  {...rest}\n>\n  <slot />\n</${facts.parts.root.defaultElement}>\n\n${printRuntimeScript(facts)}\n`;
}

function printRuntimeScript(facts: AdapterSharedViewportNavigationFacts): string {
  const cleanupEvent = toAstroLifecycleEvent(facts.runtime.cleanupEvent);
  const initEvents = facts.runtime.initEvents.map(toAstroLifecycleEvent);

  return `<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const ${facts.runtime.instancesName} = new Set<ReturnType<typeof ${facts.runtime.factory}>>();\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${facts.runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.attrs.root}]").forEach((root) =>\n      ${facts.runtime.instancesName}.add(${facts.runtime.factory}(root)),\n    );\n  };\n\n  const ${facts.runtime.destroyFunction} = () => {\n    ${facts.runtime.instancesName}.forEach((instance) => instance.${facts.runtime.destroyMethod}());\n    ${facts.runtime.instancesName}.clear();\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("${initEvents[1]}", ${facts.runtime.setupFunction});\n  document.addEventListener("${cleanupEvent}", ${facts.runtime.destroyFunction});\n  document.addEventListener("${initEvents[2]}", ${facts.runtime.setupFunction});\n</script>`;
}

function printItem(facts: AdapterSharedViewportNavigationFacts): string {
  const part = facts.parts.item;
  const valueProp = facts.item.valueProp;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${valueProp.name}?: ${valueProp.type};\n};\n\nconst { ${valueProp.name}, ...rest } = Astro.props;\n---\n\n<${part.defaultElement}\n  ${facts.attrs.item}\n  ${facts.attrs.itemValue}={${valueProp.name}}\n  ${facts.item.stateAttribute}="${facts.item.stateValue}"\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printTrigger(facts: AdapterSharedViewportNavigationFacts): string {
  const part = facts.parts.trigger;
  const trigger = facts.trigger;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${trigger.asChild.name}?: ${trigger.asChild.type};\n  ${trigger.disabled.prop.name}?: ${trigger.disabled.prop.type};\n  ${trigger.openDelay.name}?: ${trigger.openDelay.type};\n  ${trigger.closeDelay.name}?: ${trigger.closeDelay.type};\n};\n\nconst {\n  ${trigger.asChild.name} = ${getDefault(trigger.asChild, "false")},\n  ${trigger.disabled.prop.name} = ${getDefault(trigger.disabled.prop, "false")},\n  ${trigger.openDelay.name},\n  ${trigger.closeDelay.name},\n  ...rest\n} = Astro.props;\n---\n\n{\n  ${trigger.asChild.name} ? (\n    <div\n      ${facts.attrs.trigger}\n      ${facts.attrs.asChild}\n      ${facts.attrs.triggerOpenDelay}={${trigger.openDelay.name}}\n      ${facts.attrs.triggerCloseDelay}={${trigger.closeDelay.name}}\n      ${facts.attrs.disabled}={${trigger.disabled.prop.name} ? "" : undefined}\n      ${trigger.disabled.ariaAttribute}={${trigger.disabled.prop.name} ? "true" : undefined}\n      ${trigger.disclosure.ariaExpanded}="false"\n      ${trigger.disclosure.ariaHaspopup.attribute}="${trigger.disclosure.ariaHaspopup.value}"\n      ${trigger.disclosure.stateAttribute}="${trigger.disclosure.closedStateValue}"\n      {...rest}\n    >\n      <slot />\n    </div>\n  ) : (\n    <${part.defaultElement}\n      ${trigger.typeAttribute.attribute}="${trigger.typeAttribute.value}"\n      ${facts.attrs.trigger}\n      ${facts.attrs.triggerOpenDelay}={${trigger.openDelay.name}}\n      ${facts.attrs.triggerCloseDelay}={${trigger.closeDelay.name}}\n      ${facts.attrs.disabled}={${trigger.disabled.prop.name} ? "" : undefined}\n      ${trigger.disclosure.ariaExpanded}="false"\n      ${trigger.disclosure.ariaHaspopup.attribute}="${trigger.disclosure.ariaHaspopup.value}"\n      ${trigger.disclosure.stateAttribute}="${trigger.disclosure.closedStateValue}"\n      ${trigger.disabled.nativeAttribute}={${trigger.disabled.prop.name}}\n      {...rest}\n    >\n      <slot />\n    </${part.defaultElement}>\n  )\n}\n`;
}

function printContent(facts: AdapterSharedViewportNavigationFacts): string {
  const part = facts.parts.content;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement}\n  ${facts.attrs.content}\n  ${facts.content.stateAttribute}="${facts.content.stateValue}"\n  ${facts.content.hiddenAttribute}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printLink(facts: AdapterSharedViewportNavigationFacts): string {
  const part = facts.parts.link;
  const activeProp = facts.link.active.prop;
  const closeOnClickProp = facts.link.closeOnClick.prop;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${activeProp.name}?: ${activeProp.type};\n  ${closeOnClickProp.name}?: ${closeOnClickProp.type};\n};\n\nconst {\n  ${activeProp.name} = ${getDefault(activeProp, "false")},\n  ${closeOnClickProp.name} = ${getDefault(closeOnClickProp, "true")},\n  ...rest\n} = Astro.props;\n---\n\n<${part.defaultElement}\n  ${facts.attrs.link}\n  ${facts.attrs.active}={${activeProp.name} ? "" : undefined}\n  ${facts.link.active.ariaCurrentAttribute}={${activeProp.name} ? "${facts.link.active.ariaCurrentValue}" : undefined}\n  ${facts.attrs.linkCloseOnClick}={${closeOnClickProp.name} ? undefined : "${facts.link.closeOnClick.falseValue}"}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printPositioner(facts: AdapterSharedViewportNavigationFacts): string {
  const part = facts.parts.positioner;
  const floating = facts.floating;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${floating.side.name}?: ${floating.side.type};\n  ${floating.align.name}?: ${floating.align.type};\n  ${floating.sideOffset.name}?: ${floating.sideOffset.type};\n  ${floating.alignOffset.name}?: ${floating.alignOffset.type};\n  ${floating.avoidCollisions.name}?: ${floating.avoidCollisions.type};\n  ${floating.collisionPadding.name}?: ${floating.collisionPadding.type};\n};\n\nconst {\n  ${floating.side.name} = ${getDefault(floating.side, '"bottom"')},\n  ${floating.align.name} = ${getDefault(floating.align, '"center"')},\n  ${floating.sideOffset.name} = ${getDefault(floating.sideOffset, "0")},\n  ${floating.alignOffset.name} = ${getDefault(floating.alignOffset, "0")},\n  ${floating.avoidCollisions.name} = ${getDefault(floating.avoidCollisions, "true")},\n  ${floating.collisionPadding.name} = ${getDefault(floating.collisionPadding, "0")},\n  ...rest\n} = Astro.props;\n---\n\n<${part.defaultElement}\n  ${facts.attrs.positioner}\n  ${facts.positioner.stateAttribute}="${facts.positioner.stateValue}"\n  ${facts.attrs.side}={${floating.side.name}}\n  ${facts.attrs.align}={${floating.align.name}}\n  ${facts.attrs.sideOffset}={${floating.sideOffset.name}}\n  ${facts.attrs.alignOffset}={${floating.alignOffset.name}}\n  ${facts.attrs.avoidCollisions}={${floating.avoidCollisions.name} ? "true" : "false"}\n  ${facts.attrs.collisionPadding}={${floating.collisionPadding.name}}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printSimplePart(
  facts: AdapterSharedViewportNavigationFacts,
  partName: Exclude<
    AdapterSharedViewportNavigationPartName,
    "content" | "item" | "link" | "positioner" | "root" | "trigger"
  >,
): string {
  const part = facts.parts[partName];
  const state = part.stateAttribute && part.stateValue ? `${part.stateAttribute}="${part.stateValue}"` : "";

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement}\n  ${part.discoveryAttribute}\n  ${part.ariaHidden ? 'aria-hidden="true"' : ""}\n  ${state}\n  ${part.hidden ? part.hiddenAttribute : ""}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function getDefault(prop: { defaultValue?: string }, fallback: string): string {
  return prop.defaultValue ?? fallback;
}

function toAstroLifecycleEvent(event: string): string {
  if (event === "after-swap") return "astro:after-swap";
  if (event === "before-swap") return "astro:before-swap";

  return event;
}
