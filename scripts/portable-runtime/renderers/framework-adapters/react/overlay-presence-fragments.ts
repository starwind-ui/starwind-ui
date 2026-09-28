import {
  floatingInputs,
  type PartPolicy,
  type PopoverPart,
  partAttributes,
  popoverPartPolicy,
} from "../../shared-recipes/structured/part-policy.js";
import type {
  AdapterPresenceFloatingOverlayFacts,
  AdapterTimedFloatingOverlayFacts,
} from "../types.js";
import { printReactTimedPlacement } from "./timed-recipe.js";

type FloatingPlacementProps = {
  align: { defaultValue?: string; name: string; type: string };
  avoidCollisions: { defaultValue?: string; name: string; type: string };
  collisionStrategy?: { defaultValue?: string; name: string; type: string };
  side: { defaultValue?: string; name: string; type: string };
  sideOffset: { defaultValue?: string; name: string; type: string };
};

type FloatingPlacementAttributes = {
  align: string;
  avoidCollisions: string;
  collisionStrategy?: string;
  discovery: string;
  hidden?: string;
  role?: string;
  side: string;
  sideOffset: string;
  state: string;
  tabIndex?: string;
};

type ReactFloatingPlacementFragmentOptions = {
  partPolicy?: PartPolicy;
  placementInputs?: [string, string][];
  attrs: FloatingPlacementAttributes;
  defaultElement: string;
  displayName: string;
  exportName: string;
  forwardRefStyle: "inline" | "wrapped";
  props: FloatingPlacementProps;
  propsBaseType: string;
  roleValue?: string;
};

export function printReactPresenceFloatingOverlaySimplePart(
  facts: AdapterPresenceFloatingOverlayFacts,
  part: { defaultElement: string; name: string; namespaceKey: string },
  exportName: string,
  discoveryAttribute: string,
): string {
  const jsx = `<${part.defaultElement} {...props} ${partAttributes("react", popoverPartPolicy(facts, part.name as PopoverPart))} ref={forwardedRef} />`;
  const jsxReturn =
    part.name === "backdrop" ? `return (\n      ${jsx}\n    );` : renderReactJsxReturn(jsx);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<HTMLDivElement>;\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    ${jsxReturn}\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

export function printReactPresenceFloatingOverlayPositioner(
  facts: AdapterPresenceFloatingOverlayFacts,
): string {
  return renderReactFloatingPlacementPart({
    partPolicy: popoverPartPolicy(facts, "positioner"),
    placementInputs: floatingInputs(facts),
    attrs: {
      align: facts.attrs.floatingAlign,
      avoidCollisions: facts.attrs.floatingAvoidCollisions,
      collisionStrategy: facts.attrs.floatingCollisionStrategy,
      discovery: facts.attrs.positioner,
      side: facts.attrs.floatingSide,
      sideOffset: facts.attrs.floatingSideOffset,
      state: facts.attrs.positionerState,
    },
    defaultElement: facts.parts.positioner.defaultElement,
    displayName: `${facts.displayName}.Positioner`,
    exportName: facts.exports.positioner,
    forwardRefStyle: "wrapped",
    props: facts.props,
    propsBaseType: "React.HTMLAttributes<HTMLDivElement>",
  });
}

export function printReactPresenceFloatingOverlayPopup(
  facts: AdapterPresenceFloatingOverlayFacts,
): string {
  return renderReactFloatingPlacementPart({
    partPolicy: popoverPartPolicy(facts, "popup"),
    placementInputs: floatingInputs(facts),
    attrs: {
      align: facts.attrs.floatingAlign,
      avoidCollisions: facts.attrs.floatingAvoidCollisions,
      collisionStrategy: facts.attrs.floatingCollisionStrategy,
      discovery: facts.attrs.popup,
      hidden: facts.attrs.popupHidden,
      role: facts.attrs.popupRole,
      side: facts.attrs.floatingSide,
      sideOffset: facts.attrs.floatingSideOffset,
      state: facts.attrs.popupState,
      tabIndex: facts.attrs.popupTabIndex,
    },
    defaultElement: facts.parts.popup.defaultElement,
    displayName: `${facts.displayName}.Popup`,
    exportName: facts.exports.popup,
    forwardRefStyle: "inline",
    props: facts.props,
    propsBaseType: "React.HTMLAttributes<HTMLDivElement>",
    roleValue: facts.parts.popup.role,
  });
}

export function printReactTimedFloatingOverlayPositioner(
  facts: AdapterTimedFloatingOverlayFacts,
): string {
  return printReactTimedPlacement(facts, "positioner");
}
export function printReactTimedFloatingOverlayPopup(
  facts: AdapterTimedFloatingOverlayFacts,
): string {
  return printReactTimedPlacement(facts, "popup");
}

function renderReactFloatingPlacementPart(options: ReactFloatingPlacementFragmentOptions): string {
  if (options.forwardRefStyle === "inline") {
    return renderInlineReactFloatingPlacementPart(options);
  }

  return renderWrappedReactFloatingPlacementPart(options);
}

function renderWrappedReactFloatingPlacementPart({
  attrs,
  defaultElement,
  displayName,
  exportName,
  props,
  propsBaseType,
  roleValue,
  partPolicy,
  placementInputs,
}: ReactFloatingPlacementFragmentOptions): string {
  return `import * as React from "react";\n${placementInputs ? placementImports : ""}\n${renderReactFloatingPlacementPropsType(exportName, propsBaseType, props)}\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(\n  function ${exportName}(\n    ${renderReactFloatingPlacementDestructure(props)},\n    forwardedRef,\n  ) {\n    ${placementInputs ? registerAuthoredPlacement(placementInputs) : ""}\n    return (\n      ${renderReactFloatingPlacementElement(
    {
      attrs,
      defaultElement,
      indent: "        ",
      roleValue,
      partPolicy,
    },
  )}\n    );\n  },\n);\n\n${exportName}.displayName = "${displayName}";\n\nexport default ${exportName};\n`;
}

function renderInlineReactFloatingPlacementPart({
  attrs,
  defaultElement,
  displayName,
  exportName,
  props,
  propsBaseType,
  roleValue,
  partPolicy,
  placementInputs,
}: ReactFloatingPlacementFragmentOptions): string {
  return `import * as React from "react";\n${placementInputs ? placementImports : ""}\n${renderReactFloatingPlacementPropsType(exportName, propsBaseType, props)}\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(function ${exportName}(\n  ${renderReactFloatingPlacementDestructure(props)},\n  forwardedRef,\n) {\n  ${placementInputs ? registerAuthoredPlacement(placementInputs) : ""}\n  return (\n    ${renderReactFloatingPlacementElement(
    {
      attrs,
      defaultElement,
      indent: "      ",
      roleValue,
      partPolicy,
    },
  )}\n  );\n});\n\n${exportName}.displayName = "${displayName}";\n\nexport default ${exportName};\n`;
}

function renderReactFloatingPlacementPropsType(
  exportName: string,
  propsBaseType: string,
  props: FloatingPlacementProps,
): string {
  const collisionStrategyProp = props.collisionStrategy
    ? `  ${props.collisionStrategy.name}?: ${props.collisionStrategy.type};\n`
    : "";
  return `export type ${exportName}Props = ${propsBaseType} & {\n  ${props.side.name}?: ${props.side.type};\n  ${props.align.name}?: ${props.align.type};\n  ${props.sideOffset.name}?: ${props.sideOffset.type};\n  ${props.avoidCollisions.name}?: ${props.avoidCollisions.type};\n${collisionStrategyProp}};`;
}

function renderReactFloatingPlacementDestructure(props: FloatingPlacementProps): string {
  const collisionStrategy = props.collisionStrategy
    ? `, ${props.collisionStrategy.name} = ${props.collisionStrategy.defaultValue}`
    : "";
  return `{ ${props.side.name} = ${props.side.defaultValue}, ${props.align.name} = ${props.align.defaultValue}, ${props.sideOffset.name} = ${props.sideOffset.defaultValue}, ${props.avoidCollisions.name} = ${props.avoidCollisions.defaultValue}${collisionStrategy}, ...props }`;
}

function renderReactFloatingPlacementElement({
  attrs,
  defaultElement,
  indent,
  roleValue,
  partPolicy,
}: {
  partPolicy?: PartPolicy;
  attrs: FloatingPlacementAttributes;
  defaultElement: string;
  indent: string;
  roleValue?: string;
}): string {
  return `<${defaultElement}\n${partPolicy ? `{...props}\n${partAttributes("react", partPolicy)}\nref={composedRef}` : renderReactFloatingPlacementAttributes(attrs, indent, roleValue)}\n${indent.slice(2)}/>`;
}

function renderReactFloatingPlacementAttributes(
  attrs: FloatingPlacementAttributes,
  indent: string,
  roleValue?: string,
): string {
  const lines = [
    attrs.discovery,
    attrs.role ? `${attrs.role}="${roleValue}"` : undefined,
    attrs.tabIndex ? `${attrs.tabIndex}={-1}` : undefined,
    `${attrs.state}="closed"`,
    `${attrs.side}={side}`,
    `${attrs.align}={align}`,
    `${attrs.sideOffset}={sideOffset}`,
    `${attrs.avoidCollisions}={avoidCollisions ? "true" : "false"}`,
    attrs.collisionStrategy ? `${attrs.collisionStrategy}={collisionStrategy}` : undefined,
    attrs.hidden,
    "ref={forwardedRef}",
    "{...props}",
  ];

  return lines
    .filter((line): line is string => line !== undefined)
    .map((line) => `${indent}${line}`)
    .join("\n");
}

function renderReactJsxReturn(jsx: string): string {
  return `return ${jsx};`;
}

const placementImports = `import { PopoverPartContext } from "./PopoverRoot";
import { useComposedRefs } from "../internal/compose-refs";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";`;
function registerAuthoredPlacement(inputs: [string, string][]): string {
  return `const owner = React.useContext(PopoverPartContext);
const element = React.useRef<HTMLDivElement>(null);
const composedRef = useComposedRefs(forwardedRef, element);
useIsomorphicLayoutEffect(() => {
  const node = element.current;
  if (!node) return;
  owner?.registerPlacement(node, { ${inputs.map(([name, input]) => `${JSON.stringify(name)}: String(${input})`).join(", ")} });
  return () => owner?.registerPlacement(node, null);
}, [owner, ${inputs.map(([, input]) => input).join(", ")}]);`;
}
