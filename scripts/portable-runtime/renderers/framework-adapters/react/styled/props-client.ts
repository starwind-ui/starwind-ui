import type {
  FrameworkTarget,
} from '../../../../contracts/styled/types.js';
import type {
  StyledOutputComponent,
  StyledOutputDestructure,
  StyledOutputPropExtend,
  StyledOutputProps,
  StyledOutputVariable,
} from '../../../styled-output-model/index.js';
import {
  collectStyledOutputNamedSlots,
  usesStyledOutputDefaultSlot,
} from '../../../styled-output-model/index.js';
import type { RuntimeImportRewriteContext } from '../../../styled-runtime-imports.js';
import {
  rewriteRuntimeImportReferences,
  rewriteRuntimeTypeImportReferences,
} from '../../../styled-runtime-imports.js';
import { getComponentReferenceName } from './component-discovery.js';
import { REACT_FRAMEWORK } from './constants.js';
import {
  formatObjectKey,
  indentBlock,
  isForFramework,
  isIdentifier,
  mapReactPropName,
  toReactSlotPropName,
} from './formatting.js';
import { collectPrimitiveComponents } from './primitive-helpers.js';
import { renderReturn, renderValueExpression } from './render-tree.js';

export function renderProps(
  component: StyledOutputComponent,
  runtimeImportContext: RuntimeImportRewriteContext,
): string {
  const props = component.props;
  const extendsParts = props ? renderPropsExtends(props, runtimeImportContext) : [];
  const extendsClause = extendsParts.join(" & ");
  const fieldLines = [
    ...(props?.fields ?? [])
      .filter((field) => isForFramework(field, REACT_FRAMEWORK))
      .map(
        (field) =>
          `  ${formatObjectKey(field.name)}${field.optional ? "?" : ""}: ${rewriteRuntimeTypeImports(
            field.type,
            runtimeImportContext,
          )};`,
      ),
    ...collectReactNamedSlots(component.render).map(
      (slotName) => `  ${slotName}?: React.ReactNode;`,
    ),
  ];

  if (fieldLines.length === 0) {
    const inlineType = `export type ${component.exportName}Props = ${extendsClause || "{}"};`;
    if (inlineType.length <= 100 || extendsParts.length === 0) return inlineType;

    return `export type ${component.exportName}Props =
  ${renderWrappedExtends(extendsParts)};`;
  }

  const fields = `{\n${fieldLines.join("\n")}\n}`;
  const inlineType = `export type ${component.exportName}Props = ${[extendsClause, fields]
    .filter(Boolean)
    .join(" & ")};`;

  if (inlineType.length <= 100) return inlineType;

  if (extendsParts.length === 1) {
    return `export type ${component.exportName}Props = ${extendsParts[0]} & {
${fieldLines.join("\n")}
};`;
  }

  if (extendsParts.length > 0) {
    const fieldBody = fieldLines.map((line) => `  ${line}`).join("\n");

    return `export type ${component.exportName}Props = ${renderWrappedExtends(extendsParts)} & {
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

function rewriteRuntimeTypeImports(
  type: string,
  runtimeImportContext: RuntimeImportRewriteContext,
) {
  return rewriteRuntimeTypeImportReferences(type, runtimeImportContext);
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
  const variables = renderVariables(component.variables ?? [], REACT_FRAMEWORK);
  const clientEffect = renderClientEffect(component, runtimeImportContext);
  const renderedReturn = renderReturn(component.render, primitiveAliases);

  return [destructure, variables, clientEffect, renderedReturn]
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
  const rest = destructure?.rest ?? "rest";
  const renderedProps = [...allProps, `...${rest}`];
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

function renderVariables(
  variables: StyledOutputVariable[],
  framework: FrameworkTarget,
): string {
  if (!variables || variables.length === 0) return "";

  return variables
    .filter((variable) => isForFramework(variable, framework))
    .map((variable) => `const ${variable.name} = ${renderValueExpression(variable.value)};`)
    .join("\n");
}
