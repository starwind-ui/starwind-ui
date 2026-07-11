import type {
  AdapterCompositeMenuOverlayComponentProjection,
  AdapterCompositeMenuOverlayFacts,
  AdapterCompositeMenuOverlayIndexProjection,
  AdapterCompositeMenuOverlayPartName,
} from "../types.js";

export function printAstroCompositeMenuOverlayComponent(
  family: AdapterCompositeMenuOverlayComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printRoot(facts);
  if (family.part === "trigger") return printTrigger(facts);
  if (family.part === "positioner") return printFloatingPart(facts, "positioner");
  if (family.part === "popup") return printFloatingPart(facts, "popup");
  if (family.part === "item") return printActionItem(facts);
  if (family.part === "linkItem") return printLinkItem(facts);
  if (family.part === "checkboxItem") return printCheckboxItem(facts);
  if (family.part === "checkboxItemIndicator") {
    return printIndicator(facts, "checkboxItemIndicator", facts.checkboxItem.indicator);
  }
  if (family.part === "radioGroup") return printRadioGroup(facts);
  if (family.part === "radioItem") return printRadioItem(facts);
  if (family.part === "radioItemIndicator") {
    return printIndicator(facts, "radioItemIndicator", facts.radioItem.indicator);
  }
  if (family.part === "separator") return printSeparator(facts);
  if (family.part === "submenuRoot") return printSubmenuRoot(facts);
  if (family.part === "submenuTrigger") return printSubmenuTrigger(facts);

  return printSimplePart(facts, family.part);
}

export function printAstroCompositeMenuOverlayIndex(
  family: AdapterCompositeMenuOverlayIndexProjection,
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
  const typeExports = facts.index.typeExports.length
    ? `\n\nexport type {\n${facts.index.typeExports.map((name) => `  ${name},`).join("\n")}\n} from "${facts.runtime.typeImportSource}";`
    : "";

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${namedExports}\n};\n\nexport default ${facts.exports.namespace};${typeExports}\n`;
}

function printRoot(facts: AdapterCompositeMenuOverlayFacts): string {
  const props = facts.props;
  const runtime = facts.runtime;
  const rootExclusionChecks = runtime.rootExclusionAttributes
    .map((attribute) => `      if (root.hasAttribute("${attribute}")) return;`)
    .join("\n");

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"div"> & {\n  ${props.defaultOpen.name}?: ${props.defaultOpen.type};\n  ${props.disabled.name}?: ${props.disabled.type};\n  ${props.modal.name}?: ${props.modal.type};\n  ${props.openOnHover.name}?: ${props.openOnHover.type};\n  ${props.closeDelay.name}?: ${props.closeDelay.type};\n};\n\nconst {\n  ${props.defaultOpen.name} = ${getDefault(props.defaultOpen, "false")},\n  ${props.disabled.name} = ${getDefault(props.disabled, "false")},\n  ${props.modal.name} = ${getDefault(props.modal, "false")},\n  ${props.openOnHover.name} = ${getDefault(props.openOnHover, "false")},\n  ${props.closeDelay.name} = ${getDefault(props.closeDelay, "200")},\n  ...rest\n} = Astro.props;\n---\n\n<div\n  ${facts.attrs.root}\n  ${facts.attrs.defaultOpen}={${props.defaultOpen.name} ? "true" : undefined}\n  ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n  ${facts.attrs.modal}={${props.modal.name} ? "true" : "false"}\n  ${facts.attrs.openOnHover}={${props.openOnHover.name} ? "true" : undefined}\n  ${facts.attrs.closeDelay}={${props.closeDelay.name}}\n  data-state={${props.defaultOpen.name} ? "open" : "closed"}\n  {...rest}\n>\n  <slot />\n</div>\n\n<script>\n  import { ${runtime.factory} } from "${runtime.importSource}";\n\n  const ${runtime.instancesName} = new Set<ReturnType<typeof ${runtime.factory}>>();\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.attrs.root}]").forEach((root) => {\n${rootExclusionChecks}\n      ${runtime.instancesName}.add(${runtime.factory}(root));\n    });\n  };\n\n  const ${runtime.destroyFunction} = () => {\n    ${runtime.instancesName}.forEach((instance) => instance.destroy());\n    ${runtime.instancesName}.clear();\n  };\n\n  ${runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${runtime.setupFunction});\n  document.addEventListener("astro:before-swap", ${runtime.destroyFunction});\n  document.addEventListener("starwind:init", ${runtime.setupFunction});\n</script>\n`;
}

function printTrigger(facts: AdapterCompositeMenuOverlayFacts): string {
  const asChild = facts.props.asChild;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.trigger.defaultElement}"> & {\n  ${asChild.name}?: ${asChild.type};\n};\n\nconst { ${asChild.name} = ${getDefault(asChild, "false")}, ...rest } = Astro.props;\n---\n\n{\n  ${asChild.name} ? (\n    <div\n      ${facts.attrs.trigger}\n      data-as-child\n      aria-haspopup="menu"\n      aria-expanded="false"\n      data-state="closed"\n      {...rest}\n    >\n      <slot />\n    </div>\n  ) : (\n    <button\n      type="button"\n      ${facts.attrs.trigger}\n      aria-haspopup="menu"\n      aria-expanded="false"\n      data-state="closed"\n      {...rest}\n    >\n      <slot />\n    </button>\n  )\n}\n`;
}

function printFloatingPart(
  facts: AdapterCompositeMenuOverlayFacts,
  partName: "popup" | "positioner",
): string {
  const props = facts.props;
  const part = facts.parts[partName];
  const type = `HTMLAttributes<"${part.defaultElement}">`;
  const roleAttributes =
    partName === "popup" ? `\n  role="${part.role}"\n  tabindex="-1"` : "";
  const hiddenAttribute = partName === "popup" ? "\n  hidden" : "";

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = ${type} & {\n  ${props.side.name}?: ${props.side.type};\n  ${props.align.name}?: ${props.align.type};\n  ${props.sideOffset.name}?: ${props.sideOffset.type};\n  ${props.avoidCollisions.name}?: ${props.avoidCollisions.type};\n};\n\nconst {\n  ${props.side.name} = ${facts.floating.sideDefault},\n  ${props.align.name} = ${facts.floating.alignDefault},\n  ${props.sideOffset.name} = ${facts.floating.sideOffsetDefault},\n  ${props.avoidCollisions.name} = ${facts.floating.avoidCollisionsDefault},\n  ...rest\n} = Astro.props;\n---\n\n<${part.defaultElement}\n  ${facts.attrs[partName]}${roleAttributes}\n  data-state="closed"\n  ${facts.attrs.side}={${props.side.name}}\n  ${facts.attrs.align}={${props.align.name}}\n  ${facts.attrs.sideOffset}={${props.sideOffset.name}}\n  ${facts.attrs.avoidCollisions}={${props.avoidCollisions.name} ? "true" : "false"}${hiddenAttribute}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printActionItem(facts: AdapterCompositeMenuOverlayFacts): string {
  const branch = facts.staticBranches.item;
  const tabIndex = branch.tabIndex;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${branch.defaultElement}"> & {\n  ${branch.disabled.prop.name}?: ${branch.disabled.prop.type};\n  ${branch.closeOnClick.prop.name}?: ${branch.closeOnClick.prop.type};\n};\n\nconst { ${branch.disabled.prop.name} = false, ${branch.closeOnClick.prop.name} = ${branch.closeOnClick.defaultValue}, ...rest } = Astro.props;\n---\n\n<${branch.defaultElement}\n  ${facts.attrs.item}\n  role="${branch.role}"\n  ${tabIndex.attribute}="${tabIndex.value}"\n  ${branch.closeOnClick.attribute}={${branch.closeOnClick.prop.name} ? undefined : "false"}\n  ${branch.disabled.ariaAttribute}={${branch.disabled.prop.name} ? "true" : undefined}\n  ${branch.disabled.dataAttribute}={${branch.disabled.prop.name} ? "" : undefined}\n  {...rest}\n>\n  <slot />\n</${branch.defaultElement}>\n`;
}

function printLinkItem(facts: AdapterCompositeMenuOverlayFacts): string {
  const branch = facts.staticBranches.linkItem;
  const tabIndex = branch.tabIndex;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${branch.defaultElement}"> & {\n  ${branch.disabled.prop.name}?: ${branch.disabled.prop.type};\n  ${branch.closeOnClick.prop.name}?: ${branch.closeOnClick.prop.type};\n};\n\nconst { ${branch.disabled.prop.name} = false, href, ${branch.closeOnClick.prop.name} = ${branch.closeOnClick.defaultValue}, ...rest } = Astro.props;\n---\n\n<${branch.defaultElement}\n  ${facts.attrs.linkItem}\n  href={${branch.disabled.prop.name} ? undefined : href}\n  role="${branch.role}"\n  ${tabIndex.attribute}="${tabIndex.value}"\n  ${branch.closeOnClick.attribute}={${branch.closeOnClick.prop.name} ? "true" : undefined}\n  ${branch.disabled.ariaAttribute}={${branch.disabled.prop.name} ? "true" : undefined}\n  ${branch.disabled.dataAttribute}={${branch.disabled.prop.name} ? "" : undefined}\n  {...rest}\n>\n  <slot />\n</${branch.defaultElement}>\n`;
}

function printCheckboxItem(facts: AdapterCompositeMenuOverlayFacts): string {
  const item = facts.checkboxItem;
  const controlled = item.checkedState.controlledProp;
  const defaultProp = item.checkedState.defaultProp;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = Omit<HTMLAttributes<"${facts.parts.checkboxItem.defaultElement}">, "${item.stateAttributes.ariaChecked}" | "role"> & {\n  ${controlled.name}?: ${controlled.type};\n  ${defaultProp.name}?: ${defaultProp.type};\n  ${item.closeOnClick.prop.name}?: ${item.closeOnClick.prop.type};\n  ${item.disabled.prop.name}?: ${item.disabled.prop.type};\n};\n\nconst {\n  ${controlled.name},\n  ${defaultProp.name} = false,\n  ${item.closeOnClick.prop.name} = ${item.closeOnClick.defaultValue},\n  ${item.disabled.prop.name} = false,\n  ...rest\n} = Astro.props;\n\nconst initialChecked = ${controlled.name} ?? ${defaultProp.name};\n---\n\n<${facts.parts.checkboxItem.defaultElement}\n  ${facts.attrs.checkboxItem}\n  ${item.checkedState.initialAttribute}={initialChecked ? "true" : undefined}\n  ${item.closeOnClick.attribute}={${item.closeOnClick.prop.name} ? "true" : undefined}\n  role="${item.role}"\n  ${item.stateAttributes.ariaChecked}={initialChecked ? "true" : "false"}\n  ${item.disabled.ariaAttribute}={${item.disabled.prop.name} ? "true" : undefined}\n  ${item.stateAttributes.checked}={initialChecked ? "" : undefined}\n  ${item.disabled.dataAttribute}={${item.disabled.prop.name} ? "" : undefined}\n  ${item.stateAttributes.unchecked}={!initialChecked ? "" : undefined}\n  tabindex="0"\n  {...rest}\n>\n  <slot />\n</${facts.parts.checkboxItem.defaultElement}>\n`;
}

function printRadioGroup(facts: AdapterCompositeMenuOverlayFacts): string {
  const value = facts.radioGroup.valueState.controlledProp;
  const defaultValue = facts.radioGroup.valueState.defaultProp;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.radioGroup.defaultElement}"> & {\n  ${value.name}?: ${value.type};\n  ${defaultValue.name}?: ${defaultValue.type};\n};\n\nconst { ${value.name}, ${defaultValue.name}, ...rest } = Astro.props;\n\nconst initialValue = ${value.name} ?? ${defaultValue.name};\n---\n\n<${facts.parts.radioGroup.defaultElement} ${facts.attrs.radioGroup} role="${facts.radioGroup.role}" ${facts.radioGroup.valueState.initialAttribute}={initialValue} {...rest}>\n  <slot />\n</${facts.parts.radioGroup.defaultElement}>\n`;
}

function printRadioItem(facts: AdapterCompositeMenuOverlayFacts): string {
  const item = facts.radioItem;
  const controlled = item.checkedState.controlledProp;
  const defaultProp = item.checkedState.defaultProp;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = Omit<HTMLAttributes<"${facts.parts.radioItem.defaultElement}">, "${item.stateAttributes.ariaChecked}" | "role"> & {\n  ${item.valueProp.name}: ${item.valueProp.type};\n  ${controlled.name}?: ${controlled.type};\n  ${defaultProp.name}?: ${defaultProp.type};\n  ${item.closeOnClick.prop.name}?: ${item.closeOnClick.prop.type};\n  ${item.disabled.prop.name}?: ${item.disabled.prop.type};\n};\n\nconst {\n  ${item.valueProp.name},\n  ${controlled.name},\n  ${defaultProp.name} = false,\n  ${item.closeOnClick.prop.name} = ${item.closeOnClick.defaultValue},\n  ${item.disabled.prop.name} = false,\n  ...rest\n} = Astro.props;\n\nconst initialChecked = ${controlled.name} ?? ${defaultProp.name};\n---\n\n<${facts.parts.radioItem.defaultElement}\n  ${facts.attrs.radioItem}\n  ${item.valueProp.attribute}={${item.valueProp.name}}\n  ${item.checkedState.initialAttribute}={initialChecked ? "true" : undefined}\n  ${item.closeOnClick.attribute}={${item.closeOnClick.prop.name} ? "true" : undefined}\n  role="${item.role}"\n  ${item.stateAttributes.ariaChecked}={initialChecked ? "true" : "false"}\n  ${item.disabled.ariaAttribute}={${item.disabled.prop.name} ? "true" : undefined}\n  ${item.stateAttributes.checked}={initialChecked ? "" : undefined}\n  ${item.disabled.dataAttribute}={${item.disabled.prop.name} ? "" : undefined}\n  ${item.stateAttributes.unchecked}={!initialChecked ? "" : undefined}\n  tabindex="0"\n  {...rest}\n>\n  <slot />\n</${facts.parts.radioItem.defaultElement}>\n`;
}

function printIndicator(
  facts: AdapterCompositeMenuOverlayFacts,
  partName: "checkboxItemIndicator" | "radioItemIndicator",
  projection: AdapterCompositeMenuOverlayFacts["checkboxItem"]["indicator"],
): string {
  const part = facts.parts[partName];

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs[partName]} aria-hidden="${projection.ariaHidden}" ${projection.stateAttribute}="${projection.uncheckedStateValue}" {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printSeparator(facts: AdapterCompositeMenuOverlayFacts): string {
  const branch = facts.staticBranches.separator;
  const aria = branch.ariaAttributes[0];

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${branch.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${branch.defaultElement} ${facts.attrs.separator} role="${branch.role}" ${aria.name}="${aria.value}" {...rest}></${branch.defaultElement}>\n`;
}

function printSubmenuRoot(facts: AdapterCompositeMenuOverlayFacts): string {
  const root = facts.submenu.root;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.submenuRoot.defaultElement}"> & {\n  ${root.closeDelay.name}?: ${root.closeDelay.type};\n};\n\nconst { ${root.closeDelay.name} = ${root.closeDelay.defaultValue}, ...rest } = Astro.props;\n---\n\n<${facts.parts.submenuRoot.defaultElement} ${facts.attrs.submenuRoot} ${root.closeDelay.attribute}={${root.closeDelay.name}} ${root.stateAttributes.state}="${root.stateAttributes.closedValue}" {...rest}>\n  <slot />\n</${facts.parts.submenuRoot.defaultElement}>\n`;
}

function printSubmenuTrigger(facts: AdapterCompositeMenuOverlayFacts): string {
  const trigger = facts.submenu.trigger;
  const disabled = trigger.disabled;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.submenuTrigger.defaultElement}"> & {\n  ${disabled.prop.name}?: ${disabled.prop.type};\n};\n\nconst { ${disabled.prop.name} = false, ...rest } = Astro.props;\n---\n\n<${facts.parts.submenuTrigger.defaultElement}\n  ${facts.attrs.submenuTrigger}\n  role="${trigger.role}"\n  ${trigger.disclosure.ariaHaspopup.attribute}="${trigger.disclosure.ariaHaspopup.value}"\n  ${trigger.disclosure.ariaExpanded}="false"\n  ${disabled.ariaAttribute}={${disabled.prop.name} ? "true" : undefined}\n  ${disabled.dataAttribute}={${disabled.prop.name} ? "" : undefined}\n  ${trigger.disclosure.stateAttribute}="${trigger.disclosure.closedStateValue}"\n  ${trigger.tabIndex.attribute}="${trigger.tabIndex.value}"\n  {...rest}\n>\n  <slot />\n</${facts.parts.submenuTrigger.defaultElement}>\n`;
}

function printSimplePart(
  facts: AdapterCompositeMenuOverlayFacts,
  partName: Exclude<
    AdapterCompositeMenuOverlayPartName,
    | "checkboxItem"
    | "checkboxItemIndicator"
    | "item"
    | "linkItem"
    | "popup"
    | "positioner"
    | "radioGroup"
    | "radioItem"
    | "radioItemIndicator"
    | "root"
    | "separator"
    | "submenuRoot"
    | "submenuTrigger"
    | "trigger"
  >,
): string {
  const part = facts.parts[partName];
  const role = part.role ? ` role="${part.role}"` : "";

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs[partName]}${role} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function getDefault(prop: { defaultValue?: string }, fallback: string): string {
  return prop.defaultValue ?? fallback;
}
