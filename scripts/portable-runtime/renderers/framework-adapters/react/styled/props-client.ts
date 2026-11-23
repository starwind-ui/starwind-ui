import type { FrameworkTarget } from "../../../../contracts/styled/types.js";
import type {
  StyledOutputComponent,
  StyledOutputDestructure,
  StyledOutputPropExtend,
  StyledOutputProps,
  StyledOutputVariable,
} from "../../../styled-output-model/index.js";
import {
  collectStyledOutputNamedSlots,
  getStyledOutputTypeParameters,
  renderStyledTypeParameterDeclarations,
  usesStyledOutputDefaultSlot,
} from "../../../styled-output-model/index.js";
import type { RuntimeImportRewriteContext } from "../../../styled-runtime-imports.js";
import {
  rewriteRuntimeImportReferences,
  rewriteRuntimeTypeImportReferences,
} from "../../../styled-runtime-imports.js";
import { getComponentReferenceName } from "./component-discovery.js";
import { REACT_FRAMEWORK } from "./constants.js";
import {
  formatObjectKey,
  indentBlock,
  isForFramework,
  isIdentifier,
  mapReactPropName,
  toReactSlotPropName,
} from "./formatting.js";
import { renderAlertDialogButtonControlSetup } from "./native-overlay.js";
import { collectPrimitiveComponents } from "./primitive-helpers.js";
import { renderReturn, renderValueExpression } from "./render-tree.js";

/** Admitted components whose props follow the `as` element. Item keeps its fixed attribute types. */
const ELEMENT_TYPED_AS_COMPONENTS = new Set(["AspectRatio"]);

/** The default `as` element when the props follow the `as` element, else undefined. */
export function getReactElementTypedAsDefault(
  component: StyledOutputComponent,
): string | undefined {
  if (!ELEMENT_TYPED_AS_COMPONENTS.has(component.exportName)) return undefined;
  const fail = (detail: string): never => {
    throw new TypeError(`React Styled ${component.exportName}: ${detail}.`);
  };
  const field = component.props?.fields.find(
    (entry) => entry.name === "as" && isForFramework(entry, REACT_FRAMEWORK),
  );
  const as = component.destructure?.props.find(
    (entry) => entry.name === "as" && isForFramework(entry, REACT_FRAMEWORK),
  );
  const bases = (component.props?.extends ?? []).filter(
    (entry) =>
      isForFramework(entry, REACT_FRAMEWORK) &&
      (entry.kind === "element-attributes" || entry.kind === "omit-element-attributes"),
  );
  if (field?.type !== "React.ElementType") fail("as must be a React.ElementType field");
  if (!as?.defaultValue) fail("as needs a default element");
  if (
    bases.length !== 1 ||
    bases[0]?.kind !== "element-attributes" ||
    JSON.stringify(bases[0].element) !== as?.defaultValue
  )
    fail("the element attributes must match the default as element");
  return as!.defaultValue;
}

/** Element attributes and the `as` field follow the type parameter T. */
function projectElementTypedAsProps(props: StyledOutputProps): StyledOutputProps {
  const ownKeys = props.fields
    .filter((field) => isForFramework(field, REACT_FRAMEWORK))
    .map((field) => JSON.stringify(field.name))
    .join(" | ");
  return {
    ...props,
    extends: props.extends.map((entry) =>
      entry.kind === "element-attributes" && isForFramework(entry, REACT_FRAMEWORK)
        ? {
            kind: "raw",
            code: `Omit<React.ComponentPropsWithoutRef<T>, ${ownKeys}>`,
            targetScopes: entry.targetScopes,
          }
        : entry,
    ),
    fields: props.fields.map((field) =>
      field.name === "as" && isForFramework(field, REACT_FRAMEWORK)
        ? { ...field, type: "T" }
        : field,
    ),
  };
}

export function renderProps(
  component: StyledOutputComponent,
  runtimeImportContext: RuntimeImportRewriteContext,
): string {
  const asDefault = getReactElementTypedAsDefault(component);
  const typeParameters = getStyledOutputTypeParameters(component);
  if (asDefault && typeParameters)
    throw new TypeError(
      `React Styled ${component.exportName}: as typing cannot combine with type parameters.`,
    );
  const props =
    asDefault && component.props ? projectElementTypedAsProps(component.props) : component.props;
  const typeName = `${component.exportName}Props${
    asDefault
      ? `<T extends React.ElementType = ${asDefault}>`
      : typeParameters
        ? `<${renderStyledTypeParameterDeclarations(typeParameters)}>`
        : ""
  }`;
  const extendsParts = props ? renderPropsExtends(props, runtimeImportContext) : [];
  const extendsClause = extendsParts.join(" & ");
  const fieldLines = [
    ...(props?.fields ?? [])
      .filter((field) => isForFramework(field, REACT_FRAMEWORK))
      .map(
        (field) =>
          `${field.comment ? `  // ${field.comment}\n` : ""}  ${formatObjectKey(field.name)}${field.optional ? "?" : ""}: ${rewriteRuntimeTypeImportReferences(
            field.type,
            runtimeImportContext,
          )};`,
      ),
    ...collectReactNamedSlots(component.render).map(
      (slotName) => `  ${slotName}?: React.ReactNode;`,
    ),
  ];

  if (fieldLines.length === 0) {
    const inlineType = `export type ${typeName} = ${extendsClause || "{}"};`;
    if (inlineType.length <= 100 || extendsParts.length === 0) return inlineType;

    return `export type ${typeName} =
  ${renderWrappedExtends(extendsParts)};`;
  }

  const fields = `{\n${fieldLines.join("\n")}\n}`;
  const inlineType = `export type ${typeName} = ${[extendsClause, fields]
    .filter(Boolean)
    .join(" & ")};`;

  if (inlineType.length <= 100) return inlineType;

  if (extendsParts.length === 1) {
    return `export type ${typeName} = ${extendsParts[0]} & {
${fieldLines.join("\n")}
};`;
  }

  if (extendsParts.length > 0) {
    const fieldBody = fieldLines.map((line) => `  ${line}`).join("\n");

    return `export type ${typeName} = ${renderWrappedExtends(extendsParts)} & {
${fieldBody}
  };`;
  }

  return inlineType;
}

export function getRuntimeImportRewriteContext(
  component: StyledOutputComponent,
  primitiveImportBase: string | undefined,
): RuntimeImportRewriteContext {
  const primitiveComponents = collectPrimitiveComponents(component.render);

  return {
    primitiveImportBase,
    rootImportSource:
      primitiveImportBase && primitiveComponents.length === 1
        ? `${primitiveImportBase}/${primitiveComponents[0]}`
        : primitiveImportBase,
  };
}

function renderWrappedExtends(extendsParts: string[]): string {
  return extendsParts.map((part, index) => (index === 0 ? part : `  ${part}`)).join(" &\n");
}

function renderPropsExtends(
  props: StyledOutputProps,
  runtimeImportContext: RuntimeImportRewriteContext,
): string[] {
  return (props.extends ?? [])
    .filter((propExtend) => isForFramework(propExtend, REACT_FRAMEWORK))
    .map((propExtend) => renderPropExtend(propExtend, runtimeImportContext));
}

function renderPropExtend(
  propExtend: StyledOutputPropExtend,
  runtimeImportContext: RuntimeImportRewriteContext,
): string {
  switch (propExtend.kind) {
    case "element-attributes":
      return `React.ComponentPropsWithoutRef<${JSON.stringify(propExtend.element)}>`;
    case "omit-element-attributes":
      return `Omit<React.ComponentPropsWithoutRef<${JSON.stringify(propExtend.element)}>, ${propExtend.keys
        .map((key) => JSON.stringify(key))
        .join(" | ")}>`;
    case "component-props":
      return renderReactComponentPropsExtend(propExtend);
    case "raw":
      return rewriteRuntimeTypeImportReferences(propExtend.code, runtimeImportContext);
    case "variant-props":
      return renderVariantPropsExtend(propExtend);
  }
}

function renderVariantPropsExtend(
  propExtend: Extract<StyledOutputPropExtend, { kind: "variant-props" }>,
): string {
  const variantProps = `VariantProps<typeof ${propExtend.variant}>`;
  if ((propExtend.omit ?? []).length === 0) return variantProps;

  return `Omit<${variantProps}, ${(propExtend.omit ?? []).map((key) => JSON.stringify(key)).join(" | ")}>`;
}

function renderReactComponentPropsExtend(
  propExtend: Extract<StyledOutputPropExtend, { kind: "component-props" }>,
): string {
  const componentProps = `React.ComponentProps<typeof ${getComponentReferenceName(propExtend)}>`;
  if (propExtend.keys.length === 0) return componentProps;

  return `Omit<${componentProps}, ${propExtend.keys.map((key) => JSON.stringify(key)).join(" | ")}>`;
}

export function renderComponentBody(
  component: StyledOutputComponent,
  primitiveAliases: Record<string, string>,
  runtimeImportContext: RuntimeImportRewriteContext,
): string {
  const namedSlots = collectReactNamedSlots(component.render);
  const hasChildren = usesStyledOutputDefaultSlot(component.render);
  const destructure = renderDestructure(component.destructure, namedSlots, hasChildren);
  const nativeOverlayControl = renderAlertDialogButtonControlSetup(component);
  const variables = renderVariables(component.variables ?? [], REACT_FRAMEWORK);
  const clientEffect = renderClientEffect(component, runtimeImportContext);
  const renderedReturn = renderReturn(component.render, primitiveAliases);

  return [destructure, nativeOverlayControl, variables, clientEffect, renderedReturn]
    .filter(Boolean)
    .map((block) => indentBlock(block, 1))
    .join("\n\n");
}

function collectReactNamedSlots(componentRender: StyledOutputComponent["render"]): string[] {
  return [...new Set(collectStyledOutputNamedSlots(componentRender).map(toReactSlotPropName))];
}

function renderClientEffect(
  component: StyledOutputComponent,
  runtimeImportContext: RuntimeImportRewriteContext,
): string {
  const effect = component.client?.effects;
  if (!effect || effect.length === 0) return "";

  const dependencies = component.client?.effectDependencies ?? "[]";

  return `React.useEffect(() => {
${effect.map((line) => `  ${rewriteRuntimeImportReferences(line, runtimeImportContext)}`).join("\n")}
}, ${dependencies});`;
}

function renderDestructure(
  destructure: StyledOutputDestructure | undefined,
  namedSlots: string[],
  hasChildren: boolean,
): string {
  const props = (destructure?.props ?? [])
    .filter((prop) => isForFramework(prop, REACT_FRAMEWORK))
    .map((prop) => {
      const mappedName = mapReactPropName(prop.name);
      const defaultValue = prop.defaultValue ? ` = ${prop.defaultValue}` : "";
      if (!isIdentifier(mappedName)) {
        const alias = prop.alias ?? mappedName;

        return `${JSON.stringify(mappedName)}: ${alias}${defaultValue}`;
      }

      const alias = prop.alias && prop.alias !== mappedName ? `: ${prop.alias}` : "";

      return `${mappedName}${alias}${defaultValue}`;
    });

  const slotProps = [...(hasChildren ? ["children"] : []), ...namedSlots].filter(
    (prop) => !props.some((existingProp) => getDestructuredPropName(existingProp) === prop),
  );
  const allProps = [...props, ...slotProps];
  const renderedProps = [...allProps, ...(destructure?.rest ? [`...${destructure.rest}`] : [])];
  if (renderedProps.length === 0) return "";
  const inlineDestructure = `const { ${renderedProps.join(", ")} } = props;`;
  if (inlineDestructure.length <= 100) return inlineDestructure;

  return `const {
${renderedProps.map(renderDestructureLine).join("\n")}
} = props;`;
}

function renderDestructureLine(prop: string, index: number, props: string[]): string {
  const isFinalRestProp = index === props.length - 1 && prop.startsWith("...");

  return `  ${prop}${isFinalRestProp ? "" : ","}`;
}

function getDestructuredPropName(prop: string): string {
  return prop.trim().match(/^[$A-Z_a-z][$\w]*/)?.[0] ?? prop.trim();
}

function renderVariables(variables: StyledOutputVariable[], framework: FrameworkTarget): string {
  if (!variables || variables.length === 0) return "";

  return variables
    .filter((variable) => isForFramework(variable, framework))
    .map((variable) => `const ${variable.name} = ${renderValueExpression(variable.value)};`)
    .join("\n");
}
