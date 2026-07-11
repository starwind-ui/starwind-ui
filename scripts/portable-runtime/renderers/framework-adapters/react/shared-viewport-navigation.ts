import type {
  AdapterSharedViewportNavigationComponentProjection,
  AdapterSharedViewportNavigationFacts,
  AdapterSharedViewportNavigationIndexProjection,
  AdapterSharedViewportNavigationPartName,
} from "../types.js";
import {
  renderReactAsChildCloneBranch,
  renderReactAsChildImports,
  renderReactAsChildSetup,
} from "./as-child-trigger-fragments.js";

const REACT_CONTROLLED_VALUE_REF = "valueRef";
const REACT_PENDING_VALUE_CHANGE_DETAILS_REF = "pendingValueChangeDetailsRef";

export function printReactSharedViewportNavigationComponent(
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

export function printReactSharedViewportNavigationIndex(
  family: AdapterSharedViewportNavigationIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const namedExports = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${namedExports}\n};\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";\n`;
}

function printRoot(facts: AdapterSharedViewportNavigationFacts): string {
  const root = facts.exports.root;
  const props = facts.props;
  const event = facts.valueControl.event;
  const resync = facts.valueControl.controlledResync;
  const state = facts.valueControl.state;
  const stateRef = REACT_CONTROLLED_VALUE_REF;
  const pendingDetailsRef = REACT_PENDING_VALUE_CHANGE_DETAILS_REF;
  const preservedDetailFields = resync.preserveDetailFields
    .map((field) => `${field}: pendingDetails.${field},`)
    .join("\n");

  return `import { ${facts.runtime.factory}, type ${event.detailsType} } from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport type ${root}Props = Omit<React.HTMLAttributes<HTMLElement>, "defaultValue" | "onChange"> & {\n  ${props.defaultValue.name}?: ${props.defaultValue.type};\n  ${props.value.name}?: ${props.value.type};\n  ${props.openDelay.name}?: ${props.openDelay.type};\n  ${props.closeDelay.name}?: ${props.closeDelay.type};\n  ${props.closeOnEscape.name}?: ${props.closeOnEscape.type};\n  ${props.closeOnOutsideInteract.name}?: ${props.closeOnOutsideInteract.type};\n  ${props.orientation.name}?: ${props.orientation.type};\n  ${event.callbackProp}?: (${event.valueProperty}: ${event.valueType}, details: ${event.detailsType}) => void;\n};\n\nconst ${root} = React.forwardRef<HTMLElement, ${root}Props>(\n  function ${root}(\n    {\n      ${props.defaultValue.name} = ${getDefault(props.defaultValue, "null")},\n      ${props.value.name},\n      ${props.openDelay.name} = ${getDefault(props.openDelay, "50")},\n      ${props.closeDelay.name} = ${getDefault(props.closeDelay, "50")},\n      ${props.closeOnEscape.name} = ${getDefault(props.closeOnEscape, "true")},\n      ${props.closeOnOutsideInteract.name} = ${getDefault(props.closeOnOutsideInteract, "true")},\n      ${props.orientation.name} = ${getDefault(props.orientation, '"horizontal"')},\n      ${event.callbackProp},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const rootRef = React.useRef<HTMLElement>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(\n      undefined,\n    );\n    const ${stateRef} = React.useRef(${props.value.name});\n    const ${event.callbackProp}Ref = React.useRef(${event.callbackProp});\n    const ${pendingDetailsRef} = React.useRef<${event.detailsType} | null>(\n      null,\n    );\n    const ${props.defaultValue.name}Ref = React.useRef(${props.defaultValue.name});\n    const [uncontrolledValue, setUncontrolledValue] = React.useState<${props.value.type}>(\n      ${props.defaultValue.name}Ref.current,\n    );\n\n    React.useEffect(() => {\n      ${event.callbackProp}Ref.current = ${event.callbackProp};\n    }, [${event.callbackProp}]);\n\n    React.useEffect(() => {\n      ${stateRef}.current = ${props.value.name};\n      if (${props.value.name} !== undefined) {\n        const pendingDetails = ${pendingDetailsRef}.current;\n        ${pendingDetailsRef}.current = null;\n        instanceRef.current?.${resync.setter}(\n          ${props.value.name},\n          pendingDetails?.${resync.detailsValueProperty} === ${props.value.name}\n            ? {\n                emit: false,\n                ${preservedDetailFields}\n              }\n            : { emit: false },\n        );\n      }\n    }, [${props.value.name}]);\n\n    const composedRef = React.useCallback(\n      (node: HTMLElement | null) => {\n        rootRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    React.useEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root, {\n        ${props.defaultValue.name}: ${props.defaultValue.name}Ref.current,\n        ${props.openDelay.name},\n        ${props.closeDelay.name},\n        ${props.closeOnEscape.name},\n        ${props.closeOnOutsideInteract.name},\n        ...(${props.value.name} !== undefined ? { ${props.value.name} } : {}),\n        ${event.callbackProp}: (nextValue, details) => {\n          ${pendingDetailsRef}.current = details;\n          window.setTimeout(() => {\n            if (${pendingDetailsRef}.current === details) {\n              ${pendingDetailsRef}.current = null;\n            }\n          }, 0);\n          ${event.callbackProp}Ref.current?.(nextValue, details);\n        },\n      });\n      instanceRef.current = instance;\n      const unsubscribe = instance.subscribe("${event.name}", (details) => {\n        queueMicrotask(() => {\n          if (details.isCanceled) return;\n          if (${stateRef}.current === undefined) {\n            setUncontrolledValue(instance.${state.getter}());\n          }\n        });\n      });\n\n      return () => {\n        unsubscribe();\n        instance.${facts.runtime.destroyMethod}();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, [${props.openDelay.name}, ${props.closeDelay.name}, ${props.closeOnEscape.name}, ${props.closeOnOutsideInteract.name}]);\n\n    const initialValue = ${props.value.name} !== undefined ? ${props.value.name} : uncontrolledValue;\n\n    return (\n      <${facts.parts.root.defaultElement}\n        ${facts.attrs.root}=""\n        ${facts.attrs.defaultValue}={${props.value.name} === undefined ? (${props.defaultValue.name}Ref.current ?? undefined) : undefined}\n        ${facts.attrs.openDelay}={String(${props.openDelay.name})}\n        ${facts.attrs.closeDelay}={String(${props.closeDelay.name})}\n        ${facts.attrs.closeOnEscape}={${props.closeOnEscape.name} ? "true" : "false"}\n        ${facts.attrs.closeOnOutsideInteract}={${props.closeOnOutsideInteract.name} ? "true" : "false"}\n        ${facts.attrs.orientation}={${props.orientation.name}}\n        ${state.renderedStateAttribute}={initialValue !== null ? "open" : "closed"}\n        ref={composedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${root}.displayName = "${facts.displayName}.Root";\n\nexport default ${root};\n\n${printSetRef()}\n`;
}

function printItem(facts: AdapterSharedViewportNavigationFacts): string {
  const item = facts.exports.item;
  const valueProp = facts.item.valueProp;

  return `import * as React from "react";\n\nexport type ${item}Props = React.LiHTMLAttributes<HTMLLIElement> & {\n  ${valueProp.name}?: ${valueProp.type};\n};\n\nconst ${item} = React.forwardRef<HTMLLIElement, ${item}Props>(\n  function ${item}({ ${valueProp.name}, ...props }, forwardedRef) {\n    return (\n      <${facts.parts.item.defaultElement}\n        ${facts.attrs.item}=""\n        ${facts.attrs.itemValue}={${valueProp.name}}\n        ${facts.item.stateAttribute}="${facts.item.stateValue}"\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${item}.displayName = "${facts.displayName}.Item";\n\nexport default ${item};\n`;
}

function printTrigger(facts: AdapterSharedViewportNavigationFacts): string {
  const trigger = facts.exports.trigger;
  const triggerFacts = facts.trigger;

  return `import * as React from "react";\n${renderReactAsChildImports()}\n\nexport type ${trigger}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${triggerFacts.asChild.name}?: ${triggerFacts.asChild.type};\n  ${triggerFacts.disabled.prop.name}?: ${triggerFacts.disabled.prop.type};\n  ${triggerFacts.openDelay.name}?: ${triggerFacts.openDelay.type};\n  ${triggerFacts.closeDelay.name}?: ${triggerFacts.closeDelay.type};\n};\n\nconst ${trigger} = React.forwardRef<HTMLElement, ${trigger}Props>(\n  function ${trigger}(\n    {\n      ${triggerFacts.asChild.name} = ${getDefault(triggerFacts.asChild, "false")},\n      children,\n      className,\n      ${triggerFacts.disabled.prop.name} = ${getDefault(triggerFacts.disabled.prop, "false")},\n      ${triggerFacts.openDelay.name},\n      ${triggerFacts.closeDelay.name},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const protectedTriggerProps = {\n      ${JSON.stringify(facts.attrs.trigger)}: "",\n      ${JSON.stringify(facts.attrs.triggerOpenDelay)}: ${triggerFacts.openDelay.name} !== undefined ? String(${triggerFacts.openDelay.name}) : undefined,\n      ${JSON.stringify(facts.attrs.triggerCloseDelay)}: ${triggerFacts.closeDelay.name} !== undefined ? String(${triggerFacts.closeDelay.name}) : undefined,\n      ${JSON.stringify(triggerFacts.disabled.dataAttribute)}: ${triggerFacts.disabled.prop.name} ? "" : undefined,\n      ${JSON.stringify(triggerFacts.disabled.ariaAttribute)}: ${triggerFacts.disabled.prop.name} ? "true" : undefined,\n      ${JSON.stringify(triggerFacts.disclosure.ariaExpanded)}: "false",\n      ${JSON.stringify(triggerFacts.disclosure.ariaHaspopup.attribute)}: "${triggerFacts.disclosure.ariaHaspopup.value}",\n      ${JSON.stringify(triggerFacts.disclosure.stateAttribute)}: "${triggerFacts.disclosure.closedStateValue}",\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string | undefined>;\n    const triggerProps = {\n      ...protectedTriggerProps,\n      ...props,\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string | undefined>;\n\n${renderReactAsChildSetup("    ")}\n\n${renderReactAsChildCloneBranch(
    {
      asChildExpression: triggerFacts.asChild.name,
      indent: "    ",
      protectedPropsExpression: "protectedTriggerProps",
      propsExpression: "triggerProps",
    },
  )}\n\n    return (\n      <${facts.parts.trigger.defaultElement}\n        ${triggerFacts.typeAttribute.attribute}="${triggerFacts.typeAttribute.value}"\n        className={className}\n        ${triggerFacts.disabled.nativeAttribute}={${triggerFacts.disabled.prop.name}}\n        ref={forwardedRef as React.Ref<HTMLButtonElement>}\n        {...(triggerProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}\n      >\n        {children}\n      </${facts.parts.trigger.defaultElement}>\n    );\n  },\n);\n\n${trigger}.displayName = "${facts.displayName}.Trigger";\n\nexport default ${trigger};\n`;
}

function printContent(facts: AdapterSharedViewportNavigationFacts): string {
  const content = facts.exports.content;

  return `import * as React from "react";\n\nexport type ${content}Props = React.HTMLAttributes<HTMLDivElement>;\n\nconst ${content} = React.forwardRef<HTMLDivElement, ${content}Props>(\n  function ${content}(props, forwardedRef) {\n    return (\n      <${facts.parts.content.defaultElement}\n        ${facts.attrs.content}=""\n        ${facts.content.stateAttribute}="${facts.content.stateValue}"\n        ${facts.content.hiddenAttribute}\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${content}.displayName = "${facts.displayName}.Content";\n\nexport default ${content};\n`;
}

function printLink(facts: AdapterSharedViewportNavigationFacts): string {
  const link = facts.exports.link;
  const activeProp = facts.link.active.prop;
  const closeOnClickProp = facts.link.closeOnClick.prop;

  return `import * as React from "react";\n\nexport type ${link}Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {\n  ${activeProp.name}?: ${activeProp.type};\n  ${closeOnClickProp.name}?: ${closeOnClickProp.type};\n};\n\nconst ${link} = React.forwardRef<HTMLAnchorElement, ${link}Props>(\n  function ${link}(\n    {\n      ${activeProp.name} = ${getDefault(activeProp, "false")},\n      ${closeOnClickProp.name} = ${getDefault(closeOnClickProp, "true")},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    return (\n      <${facts.parts.link.defaultElement}\n        ${facts.attrs.link}=""\n        ${facts.attrs.active}={${activeProp.name} ? "" : undefined}\n        ${facts.link.active.ariaCurrentAttribute}={${activeProp.name} ? "${facts.link.active.ariaCurrentValue}" : undefined}\n        ${facts.attrs.linkCloseOnClick}={${closeOnClickProp.name} ? undefined : "${facts.link.closeOnClick.falseValue}"}\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${link}.displayName = "${facts.displayName}.Link";\n\nexport default ${link};\n`;
}

function printPositioner(facts: AdapterSharedViewportNavigationFacts): string {
  const positioner = facts.exports.positioner;
  const floating = facts.floating;

  return `import * as React from "react";\n\nexport type ${positioner}Props = React.HTMLAttributes<HTMLDivElement> & {\n  ${floating.side.name}?: ${floating.side.type};\n  ${floating.align.name}?: ${floating.align.type};\n  ${floating.sideOffset.name}?: ${floating.sideOffset.type};\n  ${floating.alignOffset.name}?: ${floating.alignOffset.type};\n  ${floating.avoidCollisions.name}?: ${floating.avoidCollisions.type};\n  ${floating.collisionPadding.name}?: ${floating.collisionPadding.type};\n};\n\nconst ${positioner} = React.forwardRef<HTMLDivElement, ${positioner}Props>(\n  function ${positioner}(\n    {\n      ${floating.side.name} = ${getDefault(floating.side, '"bottom"')},\n      ${floating.align.name} = ${getDefault(floating.align, '"center"')},\n      ${floating.sideOffset.name} = ${getDefault(floating.sideOffset, "0")},\n      ${floating.alignOffset.name} = ${getDefault(floating.alignOffset, "0")},\n      ${floating.avoidCollisions.name} = ${getDefault(floating.avoidCollisions, "true")},\n      ${floating.collisionPadding.name} = ${getDefault(floating.collisionPadding, "0")},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    return (\n      <${facts.parts.positioner.defaultElement}\n        ${facts.attrs.positioner}=""\n        ${facts.positioner.stateAttribute}="${facts.positioner.stateValue}"\n        ${facts.attrs.side}={${floating.side.name}}\n        ${facts.attrs.align}={${floating.align.name}}\n        ${facts.attrs.sideOffset}={String(${floating.sideOffset.name})}\n        ${facts.attrs.alignOffset}={String(${floating.alignOffset.name})}\n        ${facts.attrs.avoidCollisions}={${floating.avoidCollisions.name} ? "true" : "false"}\n        ${facts.attrs.collisionPadding}={String(${floating.collisionPadding.name})}\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${positioner}.displayName = "${facts.displayName}.Positioner";\n\nexport default ${positioner};\n`;
}

function printSimplePart(
  facts: AdapterSharedViewportNavigationFacts,
  partName: Exclude<
    AdapterSharedViewportNavigationPartName,
    "content" | "item" | "link" | "positioner" | "root" | "trigger"
  >,
): string {
  const part = facts.parts[partName];
  const component = facts.exports[partName];
  const { propsType, refType } = getReactDomTypes(part.defaultElement);
  const state =
    part.stateAttribute && part.stateValue ? `${part.stateAttribute}="${part.stateValue}"` : "";

  return `import * as React from "react";\n\nexport type ${component}Props = ${propsType};\n\nconst ${component} = React.forwardRef<${refType}, ${component}Props>(\n  function ${component}(props, forwardedRef) {\n    return (\n      <${part.defaultElement}\n        ${part.discoveryAttribute}=""\n        ${part.ariaHidden ? 'aria-hidden="true"' : ""}\n        ${state}\n        ${part.hidden ? part.hiddenAttribute : ""}\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${component}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${component};\n`;
}

function getDefault(prop: { defaultValue?: string }, fallback: string): string {
  return prop.defaultValue ?? fallback;
}

function getReactDomTypes(element: string): {
  propsType: string;
  refType: string;
} {
  switch (element) {
    case "div":
      return {
        propsType: "React.HTMLAttributes<HTMLDivElement>",
        refType: "HTMLDivElement",
      };
    case "span":
      return {
        propsType: "React.HTMLAttributes<HTMLSpanElement>",
        refType: "HTMLSpanElement",
      };
    case "ul":
      return {
        propsType: "React.HTMLAttributes<HTMLUListElement>",
        refType: "HTMLUListElement",
      };
    default:
      throw new Error(
        `shared-viewport-navigation adapter cannot infer DOM types for <${element}>.`,
      );
  }
}

function printSetRef(): string {
  return `function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {\n  if (!ref) return;\n\n  if (typeof ref === "function") {\n    ref(value);\n    return;\n  }\n\n  ref.current = value;\n}`;
}
