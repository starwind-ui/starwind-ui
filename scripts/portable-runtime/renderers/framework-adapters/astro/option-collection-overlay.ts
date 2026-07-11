import type {
  AdapterOptionCollectionOverlayComponentProjection,
  AdapterOptionCollectionOverlayFacts,
  AdapterOptionCollectionOverlayIndexProjection,
  AdapterOptionCollectionOverlayPartName,
} from "../types.js";

export function printAstroOptionCollectionOverlayComponent(
  family: AdapterOptionCollectionOverlayComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printRoot(facts);
  if (family.part === "trigger") return printTrigger(facts);
  if (family.part === "value") return printValue(facts);
  if (family.part === "positioner") return printPositioner(facts);
  if (family.part === "popup") return printPopup(facts);
  if (family.part === "item") return printItem(facts);
  if (family.part === "itemIndicator") return printItemIndicator(facts);
  if (family.part === "separator") return printSeparator(facts);
  if (family.part === "icon") return printSimpleSlotPart(facts, family.part, 'aria-hidden="true"');
  if (family.part === "group") return printSimpleSlotPart(facts, family.part, 'role="group"');
  if (family.part === "scrollUpArrow" || family.part === "scrollDownArrow") {
    return printSimpleSlotPart(facts, family.part, 'aria-hidden="true"');
  }

  return printSimpleSlotPart(facts, family.part);
}

export function printAstroOptionCollectionOverlayIndex(
  family: AdapterOptionCollectionOverlayIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.astro";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const namedExports = [facts.exports.namespace, ...facts.index.importMembers.map((member) => member.name)];
  const typeExports = `export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";`;

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n  ${namedExports.join(",\n  ")},\n};\n\nexport default ${facts.exports.namespace};\n\n${typeExports}\n`;
}

function printRoot(facts: AdapterOptionCollectionOverlayFacts): string {
  const props = facts.props;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = Omit<HTMLAttributes<"${facts.parts.root.defaultElement}">, "${props.defaultValue.name}"> & {\n  ${props.autoComplete.name}?: ${props.autoComplete.type};\n  ${props.defaultOpen.name}?: ${props.defaultOpen.type};\n  ${props.defaultValue.name}?: ${props.defaultValue.type};\n  ${props.disabled.name}?: ${props.disabled.type};\n  ${props.form.name}?: ${props.form.type};\n  ${props.highlightItemOnHover.name}?: ${props.highlightItemOnHover.type};\n  ${props.modal.name}?: ${props.modal.type};\n  ${props.name.name}?: ${props.name.type};\n  ${props.readOnly.name}?: ${props.readOnly.type};\n  ${props.required.name}?: ${props.required.type};\n};\n\nconst {\n  ${props.autoComplete.name},\n  ${props.defaultOpen.name} = ${facts.state.open.defaultValue},\n  ${props.defaultValue.name},\n  ${props.disabled.name} = ${getDefault(props.disabled, "false")},\n  ${props.form.name},\n  ${props.highlightItemOnHover.name} = ${getDefault(props.highlightItemOnHover, "true")},\n  ${props.modal.name} = ${getDefault(props.modal, "true")},\n  ${props.name.name},\n  ${props.readOnly.name} = ${getDefault(props.readOnly, "false")},\n  ${props.required.name} = ${getDefault(props.required, "false")},\n  ...rest\n} = Astro.props;\n---\n\n<${facts.parts.root.defaultElement}\n  ${facts.attrs.root}\n  ${facts.attrs.autoComplete}={${props.autoComplete.name}}\n  ${facts.attrs.defaultOpen}={${props.defaultOpen.name} ? "true" : undefined}\n  ${facts.attrs.defaultValue}={${props.defaultValue.name} ?? undefined}\n  ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n  ${facts.attrs.form}={${props.form.name}}\n  ${facts.attrs.highlightItemOnHover}={${props.highlightItemOnHover.name} ? "true" : "false"}\n  ${facts.attrs.modal}={${props.modal.name} ? "true" : "false"}\n  ${facts.attrs.name}={${props.name.name}}\n  ${facts.attrs.readOnly}={${props.readOnly.name} ? "" : undefined}\n  ${facts.attrs.required}={${props.required.name} ? "" : undefined}\n  data-state={${props.defaultOpen.name} ? "open" : "closed"}\n  {...rest}\n>\n  <input\n    ${facts.attrs.input}\n    type="hidden"\n    autocomplete={${props.autoComplete.name}}\n    form={${props.form.name}}\n    name={${props.name.name}}\n    value={${props.defaultValue.name} ?? ""}\n    aria-hidden="true"\n    tabindex="-1"\n  />\n  <slot />\n</${facts.parts.root.defaultElement}>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${facts.runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.attrs.root}]").forEach((root) => {\n      ${facts.runtime.factory}(root);\n    });\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printTrigger(facts: AdapterOptionCollectionOverlayFacts): string {
  const props = facts.props;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.trigger.defaultElement}"> & {\n  ${props.asChild.name}?: ${props.asChild.type};\n};\n\nconst { ${props.asChild.name} = false, "aria-controls": ariaControls, ...rest } = Astro.props;\n---\n\n{\n  ${props.asChild.name} ? (\n    <div\n      ${facts.attrs.trigger}\n      data-as-child\n      role="${facts.parts.trigger.role}"\n      aria-haspopup="listbox"\n      aria-controls={ariaControls}\n      aria-expanded="false"\n      data-state="closed"\n      {...rest}\n    >\n      <slot />\n    </div>\n  ) : (\n    <${facts.parts.trigger.defaultElement}\n      type="button"\n      ${facts.attrs.trigger}\n      role="${facts.parts.trigger.role}"\n      aria-haspopup="listbox"\n      aria-controls={ariaControls}\n      aria-expanded="false"\n      data-state="closed"\n      {...rest}\n    >\n      <slot />\n    </${facts.parts.trigger.defaultElement}>\n  )\n}\n`;
}

function printValue(facts: AdapterOptionCollectionOverlayFacts): string {
  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.value.defaultElement}"> & {\n  placeholder?: string;\n};\n\nconst { placeholder, ...rest } = Astro.props;\n---\n\n<${facts.parts.value.defaultElement} ${facts.attrs.value} data-placeholder={placeholder} {...rest}>\n  <slot />\n</${facts.parts.value.defaultElement}>\n`;
}

function printPositioner(facts: AdapterOptionCollectionOverlayFacts): string {
  const props = facts.props;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.positioner.defaultElement}"> & {\n  ${props.align.name}?: ${props.align.type};\n  ${props.alignOffset.name}?: ${props.alignOffset.type};\n  ${props.alignItemWithTrigger.name}?: ${props.alignItemWithTrigger.type};\n  ${props.avoidCollisions.name}?: ${props.avoidCollisions.type};\n  ${props.side.name}?: ${props.side.type};\n  ${props.sideOffset.name}?: ${props.sideOffset.type};\n};\n\nconst {\n  ${props.align.name} = ${facts.floating.alignDefault},\n  ${props.alignOffset.name} = ${facts.floating.alignOffsetDefault},\n  ${props.alignItemWithTrigger.name} = ${facts.floating.alignItemWithTriggerDefault},\n  ${props.avoidCollisions.name} = ${facts.floating.avoidCollisionsDefault},\n  ${props.side.name} = ${facts.floating.sideDefault},\n  ${props.sideOffset.name} = ${facts.floating.sideOffsetDefault},\n  ...rest\n} = Astro.props;\n---\n\n<${facts.parts.positioner.defaultElement}\n  ${facts.attrs.positioner}\n  data-state="closed"\n  ${facts.attrs.side}={${props.side.name}}\n  ${facts.attrs.align}={${props.align.name}}\n  ${facts.attrs.sideOffset}={${props.sideOffset.name}}\n  ${facts.attrs.alignOffset}={${props.alignOffset.name}}\n  ${facts.attrs.alignItemWithTrigger}={${props.alignItemWithTrigger.name} ? "true" : "false"}\n  ${facts.attrs.avoidCollisions}={${props.avoidCollisions.name} ? "true" : "false"}\n  {...rest}\n>\n  <slot />\n</${facts.parts.positioner.defaultElement}>\n`;
}

function printPopup(facts: AdapterOptionCollectionOverlayFacts): string {
  const props = facts.props;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.popup.defaultElement}"> & {\n  ${props.align.name}?: ${props.align.type};\n  ${props.alignOffset.name}?: ${props.alignOffset.type};\n  ${props.avoidCollisions.name}?: ${props.avoidCollisions.type};\n  ${props.side.name}?: ${props.side.type};\n  ${props.sideOffset.name}?: ${props.sideOffset.type};\n};\n\nconst {\n  ${props.align.name} = ${facts.floating.alignDefault},\n  ${props.alignOffset.name} = ${facts.floating.alignOffsetDefault},\n  ${props.avoidCollisions.name} = ${facts.floating.avoidCollisionsDefault},\n  ${props.side.name} = ${facts.floating.sideDefault},\n  ${props.sideOffset.name} = ${facts.floating.sideOffsetDefault},\n  ...rest\n} = Astro.props;\n---\n\n<${facts.parts.popup.defaultElement}\n  ${facts.attrs.popup}\n  role="${facts.parts.popup.role}"\n  tabindex="-1"\n  data-state="closed"\n  ${facts.attrs.side}={${props.side.name}}\n  ${facts.attrs.align}={${props.align.name}}\n  ${facts.attrs.sideOffset}={${props.sideOffset.name}}\n  ${facts.attrs.alignOffset}={${props.alignOffset.name}}\n  ${facts.attrs.avoidCollisions}={${props.avoidCollisions.name} ? "true" : "false"}\n  hidden\n  {...rest}\n>\n  <slot />\n</${facts.parts.popup.defaultElement}>\n`;
}

function printItem(facts: AdapterOptionCollectionOverlayFacts): string {
  const props = facts.props;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = Omit<HTMLAttributes<"${facts.parts.item.defaultElement}">, "role"> & {\n  ${props.disabled.name}?: ${props.disabled.type};\n  ${props.value.name}: string;\n};\n\nconst { ${props.disabled.name} = ${getDefault(props.disabled, "false")}, ${props.value.name}, ...rest } = Astro.props;\n---\n\n<${facts.parts.item.defaultElement}\n  ${facts.attrs.item}\n  ${facts.attrs.valueData}={${props.value.name}}\n  role="${facts.parts.item.role}"\n  aria-selected="false"\n  aria-disabled={${props.disabled.name} ? "true" : undefined}\n  ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n  tabindex="-1"\n  {...rest}\n>\n  <slot />\n</${facts.parts.item.defaultElement}>\n`;
}

function printItemIndicator(facts: AdapterOptionCollectionOverlayFacts): string {
  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.itemIndicator.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${facts.parts.itemIndicator.defaultElement} ${facts.attrs.itemIndicator} aria-hidden="true" data-state="unchecked" data-hidden hidden {...rest}>\n  <slot />\n</${facts.parts.itemIndicator.defaultElement}>\n`;
}

function printSeparator(facts: AdapterOptionCollectionOverlayFacts): string {
  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.separator.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${facts.parts.separator.defaultElement} ${facts.attrs.separator} role="${facts.parts.separator.role}" aria-orientation="horizontal" {...rest} />\n`;
}

function printSimpleSlotPart(
  facts: AdapterOptionCollectionOverlayFacts,
  partName: Exclude<
    AdapterOptionCollectionOverlayPartName,
    "item" | "itemIndicator" | "popup" | "positioner" | "root" | "separator" | "trigger" | "value"
  >,
  extraAttributes = "",
): string {
  const part = facts.parts[partName];
  const attribute = facts.attrs[partName];
  const extra = extraAttributes ? ` ${extraAttributes}` : "";

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${attribute}${extra} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function getDefault(prop: { defaultValue?: string }, fallback: string): string {
  return prop.defaultValue ?? fallback;
}
