import type {
  AdapterEditableCollectionOverlayComponentProjection,
  AdapterEditableCollectionOverlayFacts,
  AdapterEditableCollectionOverlayIndexProjection,
  AdapterEditableCollectionOverlayPartName,
} from "../types.js";

export function printAstroEditableCollectionOverlayComponent(
  family: AdapterEditableCollectionOverlayComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printRoot(facts);
  if (family.part === "input") return printInput(facts);
  if (family.part === "trigger") return printAsChildButton(facts, "trigger");
  if (family.part === "clear") return printAsChildButton(facts, "clear");
  if (family.part === "value") return printValue(facts);
  if (family.part === "positioner") return printFloatingPart(facts, "positioner");
  if (family.part === "popup") return printFloatingPart(facts, "popup");
  if (family.part === "empty") return printEmpty(facts);
  if (family.part === "group") return printSimplePart(facts, "group", `role="${facts.collection.group.role}"`);
  if (family.part === "item") return printItem(facts);
  if (family.part === "itemIndicator") return printItemIndicator(facts);
  if (family.part === "separator") return printSeparator(facts);
  if (family.part === "icon") return printSimplePart(facts, "icon", 'aria-hidden="true"');

  return printSimplePart(facts, family.part);
}

export function printAstroEditableCollectionOverlayIndex(
  family: AdapterEditableCollectionOverlayIndexProjection,
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
  const typeExport = printRuntimeTypeExport(facts);

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${namedExports}\n};\n\nexport default ${facts.exports.namespace};\n${typeExport}`;
}

function printRoot(facts: AdapterEditableCollectionOverlayFacts): string {
  const props = facts.props;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = Omit<HTMLAttributes<"${facts.parts.root.defaultElement}">, "${props.defaultValue.name}"> & {\n  ${props.autoComplete.name}?: ${props.autoComplete.type};\n  ${props.defaultInputValue.name}?: ${props.defaultInputValue.type};\n  ${props.defaultOpen.name}?: ${props.defaultOpen.type};\n  ${props.defaultValue.name}?: ${props.defaultValue.type};\n  ${props.disabled.name}?: ${props.disabled.type};\n  ${props.filterMode.name}?: ${props.filterMode.type};\n  ${props.form.name}?: ${props.form.type};\n  ${props.highlightItemOnHover.name}?: ${props.highlightItemOnHover.type};\n  ${props.locale.name}?: ${props.locale.type};\n  ${props.modal.name}?: ${props.modal.type};\n  ${props.name.name}?: ${props.name.type};\n  ${props.readOnly.name}?: ${props.readOnly.type};\n  ${props.required.name}?: ${props.required.type};\n};\n\nconst {\n  ${props.autoComplete.name},\n  ${props.defaultInputValue.name},\n  ${props.defaultOpen.name} = ${getDefault(props.defaultOpen, "false")},\n  ${props.defaultValue.name},\n  ${props.disabled.name} = ${getDefault(props.disabled, "false")},\n  ${props.filterMode.name} = ${getDefault(props.filterMode, '"contains"')},\n  ${props.form.name},\n  ${props.highlightItemOnHover.name} = ${getDefault(props.highlightItemOnHover, "true")},\n  ${props.locale.name},\n  ${props.modal.name} = ${getDefault(props.modal, "false")},\n  ${props.name.name},\n  ${props.readOnly.name} = ${getDefault(props.readOnly, "false")},\n  ${props.required.name} = ${getDefault(props.required, "false")},\n  ...rest\n} = Astro.props;\n---\n\n<${facts.parts.root.defaultElement}\n  ${facts.attrs.root}\n  ${facts.attrs.autoComplete}={${props.autoComplete.name}}\n  ${facts.attrs.defaultInputValue}={${props.defaultInputValue.name}}\n  ${facts.attrs.defaultOpen}={${props.defaultOpen.name} ? "true" : undefined}\n  ${facts.attrs.defaultValue}={${props.defaultValue.name} ?? undefined}\n  ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n  ${facts.attrs.filterMode}={${props.filterMode.name}}\n  ${facts.attrs.form}={${props.form.name}}\n  ${facts.attrs.highlightItemOnHover}={${props.highlightItemOnHover.name} ? "true" : "false"}\n  ${facts.attrs.locale}={${props.locale.name}}\n  ${facts.attrs.modal}={${props.modal.name} ? "true" : "false"}\n  ${facts.attrs.name}={${props.name.name}}\n  ${facts.attrs.readOnly}={${props.readOnly.name} ? "" : undefined}\n  ${facts.attrs.required}={${props.required.name} ? "" : undefined}\n  data-state={${props.defaultOpen.name} ? "open" : "closed"}\n  {...rest}\n>\n  <input\n    ${facts.attrs.hiddenInput}\n    type="${facts.hiddenInput.constantAttributes.type}"\n    form={${props.form.name}}\n    name={${props.name.name}}\n    value={${props.defaultValue.name} ?? ""}\n    aria-hidden="${facts.hiddenInput.constantAttributes.ariaHidden}"\n    tabindex="${facts.hiddenInput.constantAttributes.tabIndex}"\n  />\n  <slot />\n</${facts.parts.root.defaultElement}>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${facts.runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.attrs.root}]").forEach((root) => {\n      ${facts.runtime.factory}(root);\n    });\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printInput(facts: AdapterEditableCollectionOverlayFacts): string {
  const props = facts.props;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.input.defaultElement}"> & {\n  ${props.inputDefaultValue.name}?: ${props.inputDefaultValue.type};\n};\n\nconst { ${props.inputDefaultValue.name}, "aria-controls": ariaControls, ...rest } = Astro.props;\n---\n\n<${facts.parts.input.defaultElement}\n  ${facts.attrs.input}\n  role="${facts.inputSemantics.role}"\n  aria-autocomplete="${facts.inputSemantics.ariaAutocomplete}"\n  aria-controls={ariaControls}\n  aria-expanded="false"\n  autocomplete="${facts.inputSemantics.autocomplete}"\n  value={${props.inputDefaultValue.name}}\n  {...rest}\n/>\n`;
}

function printAsChildButton(
  facts: AdapterEditableCollectionOverlayFacts,
  partName: "clear" | "trigger",
): string {
  const part = facts.parts[partName];
  const props = facts.props;
  const triggerAttributes =
    partName === "trigger"
      ? `\n      aria-haspopup="${facts.popupRole}"\n      aria-expanded="false"\n      data-state="closed"`
      : "";

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${props.asChild.name}?: ${props.asChild.type};\n};\n\nconst { ${props.asChild.name} = ${getDefault(props.asChild, "false")}, ...rest } = Astro.props;\n---\n\n{\n  ${props.asChild.name} ? (\n    <div\n      ${part.discoveryAttribute}\n      data-as-child${triggerAttributes}\n      {...rest}\n    >\n      <slot />\n    </div>\n  ) : (\n    <${part.defaultElement}\n      ${facts.clearAction.typeAttribute.attribute}="${facts.clearAction.typeAttribute.value}"\n      ${part.discoveryAttribute}${triggerAttributes}\n      {...rest}\n    >\n      <slot />\n    </${part.defaultElement}>\n  )\n}\n`;
}

function printValue(facts: AdapterEditableCollectionOverlayFacts): string {
  const props = facts.props;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.value.defaultElement}"> & {\n  ${props.placeholder.name}?: ${props.placeholder.type};\n};\n\nconst { ${props.placeholder.name}, ...rest } = Astro.props;\n---\n\n<${facts.parts.value.defaultElement} ${facts.attrs.value} data-placeholder={${props.placeholder.name}} {...rest}>\n  <slot />\n</${facts.parts.value.defaultElement}>\n`;
}

function printFloatingPart(
  facts: AdapterEditableCollectionOverlayFacts,
  partName: "popup" | "positioner",
): string {
  const props = facts.props;
  const part = facts.parts[partName];
  const popupAttributes =
    partName === "popup" ? `\n  role="${facts.popupRole}"\n  tabindex="-1"` : "";
  const hiddenAttribute = partName === "popup" ? "\n  hidden" : "";

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${props.align.name}?: ${props.align.type};\n  ${props.alignOffset.name}?: ${props.alignOffset.type};\n  ${props.avoidCollisions.name}?: ${props.avoidCollisions.type};\n  ${props.side.name}?: ${props.side.type};\n  ${props.sideOffset.name}?: ${props.sideOffset.type};\n};\n\nconst {\n  ${props.align.name} = ${facts.floating.alignDefault},\n  ${props.alignOffset.name} = ${facts.floating.alignOffsetDefault},\n  ${props.avoidCollisions.name} = ${facts.floating.avoidCollisionsDefault},\n  ${props.side.name} = ${facts.floating.sideDefault},\n  ${props.sideOffset.name} = ${facts.floating.sideOffsetDefault},\n  ...rest\n} = Astro.props;\n---\n\n<${part.defaultElement}\n  ${part.discoveryAttribute}${popupAttributes}\n  data-state="closed"\n  ${facts.attrs.side}={${props.side.name}}\n  ${facts.attrs.align}={${props.align.name}}\n  ${facts.attrs.sideOffset}={${props.sideOffset.name}}\n  ${facts.attrs.alignOffset}={${props.alignOffset.name}}\n  ${facts.attrs.avoidCollisions}={${props.avoidCollisions.name} ? "true" : "false"}${hiddenAttribute}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printEmpty(facts: AdapterEditableCollectionOverlayFacts): string {
  return printSimplePart(facts, "empty", facts.collection.empty.hiddenAttribute);
}

function printItem(facts: AdapterEditableCollectionOverlayFacts): string {
  const props = facts.props;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = Omit<HTMLAttributes<"${facts.parts.item.defaultElement}">, "role"> & {\n  ${props.itemDisabled.name}?: ${props.itemDisabled.type};\n  ${props.itemValue.name}: ${props.itemValue.type};\n};\n\nconst { ${props.itemDisabled.name} = ${getDefault(props.itemDisabled, "false")}, ${props.itemValue.name}, ...rest } = Astro.props;\n---\n\n<${facts.parts.item.defaultElement}\n  ${facts.attrs.item}\n  ${facts.attrs.valueData}={${props.itemValue.name}}\n  role="${facts.collection.item.role}"\n  aria-selected="${facts.collection.item.initialProjection.ariaSelected}"\n  ${facts.collection.item.disabled.ariaAttribute}={${props.itemDisabled.name} ? "true" : undefined}\n  ${facts.attrs.disabled}={${props.itemDisabled.name} ? "" : undefined}\n  tabindex="${facts.collection.item.initialProjection.tabIndex}"\n  {...rest}\n>\n  <slot />\n</${facts.parts.item.defaultElement}>\n`;
}

function printItemIndicator(facts: AdapterEditableCollectionOverlayFacts): string {
  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.itemIndicator.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${facts.parts.itemIndicator.defaultElement}\n  ${facts.attrs.itemIndicator}\n  aria-hidden="true"\n  ${facts.collection.itemIndicator.selectedStateAttribute}="${facts.collection.itemIndicator.initialState}"\n  ${facts.collection.itemIndicator.dataHiddenAttribute}\n  ${facts.collection.itemIndicator.hiddenAttribute}\n  {...rest}\n>\n  <slot />\n</${facts.parts.itemIndicator.defaultElement}>\n`;
}

function printSeparator(facts: AdapterEditableCollectionOverlayFacts): string {
  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.separator.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${facts.parts.separator.defaultElement} ${facts.attrs.separator} role="${facts.collection.separator.role}" aria-orientation="${facts.collection.separator.ariaOrientation}" {...rest}></${facts.parts.separator.defaultElement}>\n`;
}

function printSimplePart(
  facts: AdapterEditableCollectionOverlayFacts,
  partName: Exclude<
    AdapterEditableCollectionOverlayPartName,
    "clear" | "empty" | "group" | "icon" | "input" | "item" | "itemIndicator" | "popup" | "positioner" | "root" | "separator" | "trigger" | "value"
  > | "empty" | "group" | "icon",
  extraAttributes = "",
): string {
  const part = facts.parts[partName];
  const extra = extraAttributes ? ` ${extraAttributes}` : "";

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${part.discoveryAttribute}${extra} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function getDefault(prop: { defaultValue?: string }, fallback: string): string {
  return prop.defaultValue ?? fallback;
}

function printRuntimeTypeExport(facts: AdapterEditableCollectionOverlayFacts): string {
  if (!facts.index.typeExportSource || !facts.index.typeExports?.length) return "";

  return `\nexport type {\n${facts.index.typeExports.map((typeName) => `  ${typeName},`).join("\n")}\n} from "${facts.index.typeExportSource}";\n`;
}
