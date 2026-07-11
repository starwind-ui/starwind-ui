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
import type { RuntimeImportRewriteContext } from '../../../styled-runtime-imports.js';
import {
  rewriteRuntimeImportReferences,
  rewriteRuntimeTypeImportReferences,
} from '../../../styled-runtime-imports.js';
import { getComponentReferenceName } from './component-discovery.js';
import { ASTRO_FRAMEWORK } from './constants.js';
import { formatObjectKey, isForFramework, isIdentifier } from './formatting.js';
import { renderValueExpression } from './render-tree.js';

export function renderProps(
  props: StyledOutputProps | undefined,
  runtimeImportContext: RuntimeImportRewriteContext,
): string {
  if (!props) return "";

  if (hasAstroPolymorphicAsProp(props)) {
    return renderAstroPolymorphicProps(props, runtimeImportContext);
  }

  const interfaceExtendsClause = renderPropsExtends(props, ", ", runtimeImportContext);
  const typeExtendsClause = renderPropsExtends(props, " & ", runtimeImportContext);
  const fields = (props.fields ?? []).filter((field) => isForFramework(field, ASTRO_FRAMEWORK));
  const fieldLines = fields.map(
    (field) =>
      `  ${formatObjectKey(field.name)}${field.optional ? "?" : ""}: ${rewriteRuntimeTypeImportReferences(
        field.type,
        runtimeImportContext,
      )};`,
  );

  if (props.declaration === "interface") {
    if (fieldLines.length === 0) {
      return `type Props = ${typeExtendsClause || "Record<string, never>"};`;
    }

    if (interfaceExtendsClause) {
      const inlineHeader = `interface Props extends ${interfaceExtendsClause} {`;
      const header =
        inlineHeader.length > 100
          ? `interface Props\n  extends ${interfaceExtendsClause} {`
          : inlineHeader;

      return `${header}\n${fieldLines.join("\n")}\n}`;
    }

    return `interface Props {\n${fieldLines.join("\n")}\n}`;
  }

  if (fieldLines.length === 0) {
    return `type Props = ${typeExtendsClause || "Record<string, never>"};`;
  }

  const fieldType = `{\n${fieldLines.join("\n")}\n}`;

  return `type Props = ${[typeExtendsClause, fieldType].filter(Boolean).join(" & ")};`;
}

function renderAstroPolymorphicProps(
  props: StyledOutputProps,
  runtimeImportContext: RuntimeImportRewriteContext,
): string {
  const typeExtendsClause = renderPropsExtends(props, " & ", runtimeImportContext, {
    omitHtmlAttributes: true,
  });
  const fields = (props.fields ?? []).filter(
    (field) => isForFramework(field, ASTRO_FRAMEWORK) && !isAstroPolymorphicAsField(field),
  );
  const fieldLines = fields.map(
    (field) =>
      `  ${formatObjectKey(field.name)}${field.optional ? "?" : ""}: ${rewriteRuntimeTypeImportReferences(
        field.type,
        runtimeImportContext,
      )};`,
  );
  const fieldType = fieldLines.length > 0 ? `{\n${fieldLines.join("\n")}\n}` : "";
  const propsParts = ["Polymorphic<{ as: Tag }>", typeExtendsClause, fieldType].filter(Boolean);

  return `type Props<Tag extends HTMLTag> = ${propsParts.join(" & ")};`;
}

function renderPropsExtends(
  props: StyledOutputProps,
  separator: string,
  runtimeImportContext: RuntimeImportRewriteContext,
  options: { omitHtmlAttributes?: boolean } = {},
): string {
  return (props.extends ?? [])
    .filter(
      (propExtend) =>
        isForFramework(propExtend, ASTRO_FRAMEWORK) &&
        (!options.omitHtmlAttributes ||
          (propExtend.kind !== "element-attributes" &&
            propExtend.kind !== "omit-element-attributes")),
    )
    .map((propExtend) => renderPropExtend(propExtend, runtimeImportContext))
    .join(separator);
}

function renderPropExtend(
  propExtend: StyledOutputPropExtend,
  runtimeImportContext: RuntimeImportRewriteContext,
): string {
  switch (propExtend.kind) {
    case "element-attributes":
      return `HTMLAttributes<${JSON.stringify(renderAstroHtmlAttributesElement(propExtend.element))}>`;
    case "omit-element-attributes":
      return `Omit<HTMLAttributes<${JSON.stringify(renderAstroHtmlAttributesElement(propExtend.element))}>, ${propExtend.keys
        .map((key) => JSON.stringify(key))
        .join(" | ")}>`;
    case "component-props":
      return renderAstroComponentPropsExtend(propExtend);
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

function renderAstroHtmlAttributesElement(element: string): string {
  return element === "template" ? "div" : element;
}

export function hasAstroPolymorphicAsProp(props?: StyledOutputProps): boolean {
  return Boolean(props?.fields?.some(isAstroPolymorphicAsField));
}

function isAstroPolymorphicAsField(
  field: NonNullable<StyledOutputProps["fields"]>[number],
): boolean {
  return (
    field.name === "as" &&
    field.type === "keyof HTMLElementTagNameMap" &&
    isForFramework(field, ASTRO_FRAMEWORK)
  );
}

function renderAstroComponentPropsExtend(
  propExtend: Extract<StyledOutputPropExtend, { kind: "component-props" }>,
): string {
  const componentProps = `ComponentProps<typeof ${getComponentReferenceName(propExtend)}>`;
  if (propExtend.keys.length === 0) return componentProps;

  return `Omit<${componentProps}, ${propExtend.keys.map((key) => JSON.stringify(key)).join(" | ")}>`;
}

export function renderDestructure(destructure?: StyledOutputDestructure): string {
  if (!destructure) return "";

  const props = destructure.props
    .filter((prop) => isForFramework(prop, ASTRO_FRAMEWORK))
    .map((prop) => {
      const defaultValue = prop.defaultValue ? ` = ${prop.defaultValue}` : "";
      if (!isIdentifier(prop.name)) {
        const alias = prop.alias ?? prop.name;

        return `${JSON.stringify(prop.name)}: ${alias}${defaultValue}`;
      }

      const alias = prop.alias ? `: ${prop.alias}` : "";

      return `${prop.name}${alias}${defaultValue}`;
    });
  const allProps = destructure.rest ? [...props, `...${destructure.rest}`] : props;

  const inlineDestructure = `const { ${allProps.join(", ")} } = Astro.props;`;
  if (inlineDestructure.length <= 100) return inlineDestructure;

  return `const {
${allProps.map(renderDestructureLine).join("\n")}
} = Astro.props;`;
}

function renderDestructureLine(prop: string, index: number, props: string[]): string {
  const isFinalRestProp = index === props.length - 1 && prop.startsWith("...");

  return `  ${prop}${isFinalRestProp ? "" : ","}`;
}

export function renderVariables(
  variables: StyledOutputVariable[],
  framework: FrameworkTarget,
): string {
  if (!variables || variables.length === 0) return "";

  return variables
    .filter((variable) => isForFramework(variable, framework))
    .map((variable) => `const ${variable.name} = ${renderValueExpression(variable.value)};`)
    .join("\n");
}

export function renderClientScript(
  component: StyledOutputComponent,
  runtimeImportContext: RuntimeImportRewriteContext,
): string {
  const script = component.client?.setup;
  if (!script || script.length === 0) return "";

  return `
<script>
${script.map((line) => rewriteRuntimeImportReferences(line, runtimeImportContext)).join("\n")}
</script>
`;
}
