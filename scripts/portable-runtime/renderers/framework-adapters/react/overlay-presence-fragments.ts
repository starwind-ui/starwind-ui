import type {
  AdapterPresenceFloatingOverlayFacts,
  AdapterTimedFloatingOverlayFacts,
} from "../types.js";

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
  const jsx = `<${part.defaultElement} ${discoveryAttribute} ref={forwardedRef} {...props} />`;
  const jsxReturn =
    part.name === "backdrop" ? `return (\n      ${jsx}\n    );` : renderReactJsxReturn(jsx);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<HTMLDivElement>;\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    ${jsxReturn}\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

export function printReactPresenceFloatingOverlayPositioner(
  facts: AdapterPresenceFloatingOverlayFacts,
): string {
  return renderReactFloatingPlacementPart({
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

export function printReactTimedFloatingOverlaySimplePart(
  facts: AdapterTimedFloatingOverlayFacts,
  part: AdapterTimedFloatingOverlayFacts["parts"]["portal"],
  exportName: string,
  discoveryAttribute: string,
): string {
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${discoveryAttribute} ref={forwardedRef} {...props} />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

export function printReactTimedFloatingOverlayPositioner(
  facts: AdapterTimedFloatingOverlayFacts,
): string {
  return renderReactFloatingPlacementPart({
    attrs: {
      align: facts.attrs.align,
      avoidCollisions: facts.attrs.avoidCollisions,
      discovery: facts.attrs.positioner,
      side: facts.attrs.side,
      sideOffset: facts.attrs.sideOffset,
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

export function printReactTimedFloatingOverlayPopup(
  facts: AdapterTimedFloatingOverlayFacts,
): string {
  const propsBaseType = facts.popup.omitTabIndexProps
    ? 'Omit<React.HTMLAttributes<HTMLDivElement>, "tabIndex" | "tabindex">'
    : "React.HTMLAttributes<HTMLDivElement>";

  return renderReactFloatingPlacementPart({
    attrs: {
      align: facts.attrs.align,
      avoidCollisions: facts.attrs.avoidCollisions,
      discovery: facts.attrs.popup,
      hidden: facts.attrs.popupHidden,
      role: "role",
      side: facts.attrs.side,
      sideOffset: facts.attrs.sideOffset,
      state: facts.attrs.popupState,
    },
    defaultElement: facts.parts.popup.defaultElement,
    displayName: `${facts.displayName}.Popup`,
    exportName: facts.exports.popup,
    forwardRefStyle: "wrapped",
    props: facts.props,
    propsBaseType,
    roleValue: facts.popupRole,
  });
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
}: ReactFloatingPlacementFragmentOptions): string {
  return `import * as React from "react";\n\n${renderReactFloatingPlacementPropsType(exportName, propsBaseType, props)}\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(\n  function ${exportName}(\n    ${renderReactFloatingPlacementDestructure(props)},\n    forwardedRef,\n  ) {\n    return (\n      ${renderReactFloatingPlacementElement(
    {
      attrs,
      defaultElement,
      indent: "        ",
      roleValue,
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
}: ReactFloatingPlacementFragmentOptions): string {
  return `import * as React from "react";\n\n${renderReactFloatingPlacementPropsType(exportName, propsBaseType, props)}\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(function ${exportName}(\n  ${renderReactFloatingPlacementDestructure(props)},\n  forwardedRef,\n) {\n  return (\n    ${renderReactFloatingPlacementElement(
    {
      attrs,
      defaultElement,
      indent: "      ",
      roleValue,
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
}: {
  attrs: FloatingPlacementAttributes;
  defaultElement: string;
  indent: string;
  roleValue?: string;
}): string {
  return `<${defaultElement}\n${renderReactFloatingPlacementAttributes(attrs, indent, roleValue)}\n${indent.slice(2)}/>`;
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

function getReactElementTypeForPart(tagName: string): string {
  const elementTypes: Record<string, string> = {
    button: "HTMLButtonElement",
    dialog: "HTMLDialogElement",
    div: "HTMLDivElement",
    h2: "HTMLHeadingElement",
    h3: "HTMLHeadingElement",
    img: "HTMLImageElement",
    input: "HTMLInputElement",
    label: "HTMLLabelElement",
    p: "HTMLParagraphElement",
    span: "HTMLSpanElement",
  };

  return elementTypes[tagName] ?? "HTMLElement";
}
