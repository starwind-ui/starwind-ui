import type {
  AttributeContract,
  ComponentNode,
  FrameworkTarget,
  PropExtendContract,
  RenderNode,
  StyledAdapterContract,
  StyledComponentContract,
  ValueExpression,
} from "./types.js";
import {
  getLocalVariantAliasSourceComponent,
  resolveStyledVariantDefinition,
} from "./variant-resolution.js";

export type StyledAdapterContractIssue = {
  component: string;
  message: string;
  path: string;
};

const FRAMEWORK_TARGETS = ["astro", "react"] satisfies FrameworkTarget[];

export function validateStyledAdapterContracts(
  contracts: readonly StyledAdapterContract[],
): StyledAdapterContractIssue[] {
  const issues: StyledAdapterContractIssue[] = [];
  const contractsByComponent = new Map<string, StyledAdapterContract>();

  for (const contract of contracts) {
    if (contractsByComponent.has(contract.component)) {
      issues.push(
        issue(contract, "component", `Duplicate styled component "${contract.component}".`),
      );
    }
    contractsByComponent.set(contract.component, contract);
  }

  for (const contract of contracts) {
    validateContract(contract, contractsByComponent, issues);
  }

  return issues;
}

function validateContract(
  contract: StyledAdapterContract,
  contractsByComponent: ReadonlyMap<string, StyledAdapterContract>,
  issues: StyledAdapterContractIssue[],
): void {
  if (!contract.component.trim()) {
    issues.push(issue(contract, "component", "Missing styled component id."));
  }

  validateFrameworkTargets(contract, contract.frameworks, "frameworks", issues);
  validateDependencies(contract, contractsByComponent, issues);

  const componentExports = new Set<string>();
  for (const component of contract.components) {
    if (componentExports.has(component.exportName)) {
      issues.push(
        issue(
          contract,
          `components.${component.exportName}`,
          `Duplicate component export "${component.exportName}".`,
        ),
      );
    }
    componentExports.add(component.exportName);
  }

  for (const publicExport of contract.publicExports) {
    if (!componentExports.has(publicExport)) {
      issues.push(
        issue(
          contract,
          `publicExports.${publicExport}`,
          `Public export "${publicExport}" does not match a component export.`,
        ),
      );
    }
  }

  for (const [part, exportName] of Object.entries(contract.defaultExport)) {
    if (!componentExports.has(exportName)) {
      issues.push(
        issue(
          contract,
          `defaultExport.${part}`,
          `Default export target "${exportName}" does not match a component export.`,
        ),
      );
    }
  }

  if (
    contract.defaultExportMode === "component" &&
    Object.keys(contract.defaultExport).length !== 1
  ) {
    issues.push(
      issue(
        contract,
        "defaultExportMode",
        "Component default export mode must declare exactly one default export target.",
      ),
    );
  }

  validateStyles(contract, componentExports, issues);

  const variants = new Set([
    ...Object.keys(contract.variants ?? {}),
    ...Object.keys(contract.variantAliases ?? {}),
  ]);
  for (const [variantName, definition] of Object.entries(contract.variants ?? {})) {
    if (!variantName.trim()) {
      issues.push(issue(contract, "variants", "Variant names must be non-empty."));
    }
    for (const defaultVariant of Object.keys(definition.defaultVariants ?? {})) {
      if (!definition.variants?.[defaultVariant]) {
        issues.push(
          issue(
            contract,
            `variants.${variantName}.defaultVariants.${defaultVariant}`,
            `Default variant "${defaultVariant}" does not match a variant axis.`,
          ),
        );
      }
    }
  }
  for (const [aliasName, alias] of Object.entries(contract.variantAliases ?? {})) {
    if (!aliasName.trim()) {
      issues.push(issue(contract, "variantAliases", "Variant alias names must be non-empty."));
    }
    if (contract.variants?.[aliasName]) {
      issues.push(
        issue(
          contract,
          `variantAliases.${aliasName}`,
          `Variant alias "${aliasName}" duplicates a local variant name.`,
        ),
      );
    }
    if (!alias.importName.trim()) {
      issues.push(
        issue(
          contract,
          `variantAliases.${aliasName}.importName`,
          "Variant alias importName is required.",
        ),
      );
    }
    if (!alias.source.trim()) {
      issues.push(
        issue(contract, `variantAliases.${aliasName}.source`, "Variant alias source is required."),
      );
    }
    if (alias.localName !== undefined && !alias.localName.trim()) {
      issues.push(
        issue(
          contract,
          `variantAliases.${aliasName}.localName`,
          "Variant alias localName must be non-empty when provided.",
        ),
      );
    }
    const sourceComponent = getLocalVariantAliasSourceComponent(alias.source);
    if (!sourceComponent) {
      issues.push(
        issue(
          contract,
          `variantAliases.${aliasName}.source`,
          `Variant alias source "${alias.source}" must identify a local component variants module.`,
        ),
      );
      continue;
    }
    if (!contract.dependencies?.styledComponents?.includes(sourceComponent)) {
      issues.push(
        issue(
          contract,
          `variantAliases.${aliasName}.source`,
          `Variant alias source "${sourceComponent}" must be a styled component dependency.`,
        ),
      );
      continue;
    }
    const sourceDefinition =
      contractsByComponent.get(sourceComponent)?.variants?.[alias.importName];
    if (!sourceDefinition) {
      issues.push(
        issue(
          contract,
          `variantAliases.${aliasName}.importName`,
          `Variant alias import "${alias.importName}" is missing from ${sourceComponent}.`,
        ),
      );
      continue;
    }
    for (const defaultVariant of Object.keys(alias.defaultVariants ?? {})) {
      if (!sourceDefinition.variants?.[defaultVariant]) {
        issues.push(
          issue(
            contract,
            `variantAliases.${aliasName}.defaultVariants.${defaultVariant}`,
            `Default variant "${defaultVariant}" does not match an imported variant axis.`,
          ),
        );
      }
    }
  }

  for (const component of contract.components) {
    validateComponent(contract, component, contractsByComponent, variants, issues);
  }
}

function validateDependencies(
  contract: StyledAdapterContract,
  contractsByComponent: ReadonlyMap<string, StyledAdapterContract>,
  issues: StyledAdapterContractIssue[],
): void {
  const seen = new Set<string>();

  for (const componentName of contract.dependencies?.styledComponents ?? []) {
    if (!componentName.trim()) {
      issues.push(
        issue(
          contract,
          "dependencies.styledComponents",
          "Styled component dependency must be non-empty.",
        ),
      );
      continue;
    }

    if (componentName === contract.component) {
      issues.push(
        issue(
          contract,
          `dependencies.styledComponents.${componentName}`,
          `Styled component "${contract.component}" cannot depend on itself.`,
        ),
      );
    }

    if (seen.has(componentName)) {
      issues.push(
        issue(
          contract,
          `dependencies.styledComponents.${componentName}`,
          `Duplicate styled component dependency "${componentName}".`,
        ),
      );
    }
    seen.add(componentName);

    if (!contractsByComponent.has(componentName)) {
      issues.push(
        issue(
          contract,
          `dependencies.styledComponents.${componentName}`,
          `Styled component dependency "${componentName}" is missing.`,
        ),
      );
    }
  }
}

function validateStyles(
  contract: StyledAdapterContract,
  componentExports: ReadonlySet<string>,
  issues: StyledAdapterContractIssue[],
): void {
  const styles = contract.styles;
  if (!styles) return;

  if (!styles.content.some((line) => line.trim().length > 0)) {
    issues.push(
      issue(contract, "styles.content", "Styles content must include at least one CSS line."),
    );
  }

  if (
    styles.fileName &&
    (!styles.fileName.endsWith(".css") ||
      styles.fileName.includes("/") ||
      styles.fileName.includes("\\"))
  ) {
    issues.push(
      issue(contract, "styles.fileName", 'Styles fileName must be a local ".css" file name.'),
    );
  }

  for (const exportName of styles.importFrom) {
    if (!componentExports.has(exportName)) {
      issues.push(
        issue(
          contract,
          `styles.importFrom.${exportName}`,
          `Styles import target "${exportName}" does not match a component export.`,
        ),
      );
    }
  }
}

function validateComponent(
  contract: StyledAdapterContract,
  component: StyledComponentContract,
  contractsByComponent: ReadonlyMap<string, StyledAdapterContract>,
  variants: ReadonlySet<string>,
  issues: StyledAdapterContractIssue[],
): void {
  const componentPath = `components.${component.exportName}`;

  if (!component.exportName.trim()) {
    issues.push(issue(contract, "components", "Component exportName must be non-empty."));
  }

  validateProps(contract, component, contractsByComponent, variants, componentPath, issues);

  for (const field of component.props?.fields ?? []) {
    validateFrameworkTargets(
      contract,
      field.frameworks,
      `${componentPath}.props.fields.${field.name}.frameworks`,
      issues,
    );
  }

  for (const prop of component.destructure?.props ?? []) {
    validateFrameworkTargets(
      contract,
      prop.frameworks,
      `${componentPath}.destructure.props.${prop.name}.frameworks`,
      issues,
    );
  }

  for (const variable of component.variables ?? []) {
    validateFrameworkTargets(
      contract,
      variable.frameworks,
      `${componentPath}.variables.${variable.name}.frameworks`,
      issues,
    );
    validateValueExpression(
      contract,
      variable.value,
      variants,
      `${componentPath}.variables.${variable.name}.value`,
      issues,
    );
  }

  for (const importContract of component.imports ?? []) {
    validateFrameworkTargets(
      contract,
      importContract.frameworks,
      `${componentPath}.imports.${importContract.importName}.frameworks`,
      issues,
    );
  }

  for (const [index, node] of component.render.entries()) {
    validateRenderNode(
      contract,
      node,
      contractsByComponent,
      variants,
      `${componentPath}.render.${index}`,
      issues,
    );
  }
}

function validateProps(
  contract: StyledAdapterContract,
  component: StyledComponentContract,
  contractsByComponent: ReadonlyMap<string, StyledAdapterContract>,
  variants: ReadonlySet<string>,
  componentPath: string,
  issues: StyledAdapterContractIssue[],
): void {
  const props = component.props;
  if (!props) return;

  for (const [index, propExtend] of (props.extends ?? []).entries()) {
    const path = `${componentPath}.props.extends.${index}`;
    validateFrameworkTargets(contract, propExtend.frameworks, `${path}.frameworks`, issues);
    validatePropExtend(contract, propExtend, contractsByComponent, variants, path, issues);
  }
}

function validatePropExtend(
  contract: StyledAdapterContract,
  propExtend: PropExtendContract,
  contractsByComponent: ReadonlyMap<string, StyledAdapterContract>,
  variants: ReadonlySet<string>,
  path: string,
  issues: StyledAdapterContractIssue[],
): void {
  switch (propExtend.type) {
    case "componentProps":
      validateComponentReference(
        contract,
        propExtend,
        contractsByComponent,
        path,
        propExtend.frameworks,
        issues,
      );
      break;
    case "variantProps":
      if (!variants.has(propExtend.variant)) {
        issues.push(
          issue(
            contract,
            `${path}.variant`,
            `Variant props reference missing variant "${propExtend.variant}".`,
          ),
        );
      }
      if (new Set(propExtend.omit ?? []).size !== (propExtend.omit ?? []).length) {
        issues.push(issue(contract, `${path}.omit`, "Variant prop omissions must be unique."));
      }
      const resolvedVariant = resolveStyledVariantDefinition(
        contract,
        contractsByComponent,
        propExtend.variant,
      );
      for (const omittedProp of propExtend.omit ?? []) {
        if (!resolvedVariant?.definition.variants?.[omittedProp]) {
          issues.push(
            issue(
              contract,
              `${path}.omit.${omittedProp}`,
              `Variant prop omission "${omittedProp}" does not match a resolved variant axis.`,
            ),
          );
        }
      }
      break;
    case "htmlAttributes":
    case "omitHtmlAttributes":
    case "raw":
      break;
  }
}

function validateRenderNode(
  contract: StyledAdapterContract,
  node: RenderNode,
  contractsByComponent: ReadonlyMap<string, StyledAdapterContract>,
  variants: ReadonlySet<string>,
  path: string,
  issues: StyledAdapterContractIssue[],
): void {
  switch (node.type) {
    case "component":
      validateComponentReference(
        contract,
        node,
        contractsByComponent,
        path,
        getReferenceFrameworks(contract, node),
        issues,
      );
      validateAttributes(contract, node.attrs ?? [], variants, `${path}.attrs`, issues);
      validateRenderNodes(
        contract,
        node.children ?? [],
        contractsByComponent,
        variants,
        `${path}.children`,
        issues,
      );
      break;
    case "conditional":
      validateRenderNodes(
        contract,
        node.then,
        contractsByComponent,
        variants,
        `${path}.then`,
        issues,
      );
      validateRenderNodes(
        contract,
        node.else,
        contractsByComponent,
        variants,
        `${path}.else`,
        issues,
      );
      break;
    case "element":
      if (!node.tag.trim()) {
        issues.push(issue(contract, `${path}.tag`, "Element nodes must declare a tag."));
      }
      for (const [index, comment] of (node.leadingComments ?? []).entries()) {
        validateFrameworkTargets(
          contract,
          comment.frameworks,
          `${path}.leadingComments.${index}.frameworks`,
          issues,
        );
      }
      validateAttributes(contract, node.attrs ?? [], variants, `${path}.attrs`, issues);
      validateRenderNodes(
        contract,
        node.children ?? [],
        contractsByComponent,
        variants,
        `${path}.children`,
        issues,
      );
      break;
    case "fragment":
      validateRenderNodes(
        contract,
        node.children,
        contractsByComponent,
        variants,
        `${path}.children`,
        issues,
      );
      break;
    case "icon":
      if (!node.importName.trim()) {
        issues.push(
          issue(contract, `${path}.importName`, "Icon nodes must declare an importName."),
        );
      }
      validateAttributes(contract, node.attrs ?? [], variants, `${path}.attrs`, issues);
      break;
    case "primitive":
      if (!node.component.trim()) {
        issues.push(
          issue(contract, `${path}.component`, "Primitive nodes must declare a component."),
        );
      }
      if (!node.part.trim()) {
        issues.push(issue(contract, `${path}.part`, "Primitive nodes must declare a part."));
      }
      validateAttributes(contract, node.attrs ?? [], variants, `${path}.attrs`, issues);
      validateRenderNodes(
        contract,
        node.children ?? [],
        contractsByComponent,
        variants,
        `${path}.children`,
        issues,
      );
      break;
    case "repeat":
      if (!node.each.trim()) {
        issues.push(
          issue(contract, `${path}.each`, "Repeat nodes must declare an iterable expression."),
        );
      }
      if (!node.item.trim()) {
        issues.push(issue(contract, `${path}.item`, "Repeat nodes must declare an item binding."));
      }
      validateRenderNodes(
        contract,
        node.children,
        contractsByComponent,
        variants,
        `${path}.children`,
        issues,
      );
      break;
    case "slot":
      validateRenderNodes(
        contract,
        node.fallback ?? [],
        contractsByComponent,
        variants,
        `${path}.fallback`,
        issues,
      );
      break;
    case "text":
      break;
    default:
      issues.push(
        issue(
          contract,
          `${path}.type`,
          `Unsupported render node type "${(node as { type?: string }).type}".`,
        ),
      );
  }
}

function validateRenderNodes(
  contract: StyledAdapterContract,
  nodes: readonly RenderNode[],
  contractsByComponent: ReadonlyMap<string, StyledAdapterContract>,
  variants: ReadonlySet<string>,
  path: string,
  issues: StyledAdapterContractIssue[],
): void {
  for (const [index, node] of nodes.entries()) {
    validateRenderNode(contract, node, contractsByComponent, variants, `${path}.${index}`, issues);
  }
}

function validateComponentReference(
  contract: StyledAdapterContract,
  reference: ComponentReference,
  contractsByComponent: ReadonlyMap<string, StyledAdapterContract>,
  path: string,
  referenceFrameworks: readonly FrameworkTarget[] | undefined,
  issues: StyledAdapterContractIssue[],
): void {
  const targetContract = contractsByComponent.get(reference.component);
  if (!targetContract) {
    issues.push(
      issue(
        contract,
        `${path}.component`,
        `Component reference "${reference.component}" is missing.`,
      ),
    );
    return;
  }

  if (
    !targetContract.components.some((component) => component.exportName === reference.exportName)
  ) {
    issues.push(
      issue(
        contract,
        `${path}.exportName`,
        `Component reference "${reference.component}.${reference.exportName}" is missing.`,
      ),
    );
  }

  const sourceFrameworks = getEffectiveFrameworks(contract, referenceFrameworks);
  const targetFrameworks = getEffectiveFrameworks(targetContract);
  for (const framework of sourceFrameworks) {
    if (!targetFrameworks.includes(framework)) {
      issues.push(
        issue(
          contract,
          `${path}.frameworks.${framework}`,
          `Component reference "${reference.component}.${reference.exportName}" is not available for framework "${framework}".`,
        ),
      );
    }
  }
}

function validateAttributes(
  contract: StyledAdapterContract,
  attrs: readonly AttributeContract[],
  variants: ReadonlySet<string>,
  path: string,
  issues: StyledAdapterContractIssue[],
): void {
  for (const [index, attr] of attrs.entries()) {
    const attrPath = `${path}.${index}`;
    validateFrameworkTargets(contract, attr.frameworks, `${attrPath}.frameworks`, issues);

    if (attr.name === "spread" && !attr.value) {
      issues.push(
        issue(contract, `${attrPath}.value`, "Spread attributes require a value expression."),
      );
      continue;
    }

    if (attr.value) {
      validateValueExpression(contract, attr.value, variants, `${attrPath}.value`, issues);
    }
  }
}

function validateValueExpression(
  contract: StyledAdapterContract,
  value: ValueExpression,
  variants: ReadonlySet<string>,
  path: string,
  issues: StyledAdapterContractIssue[],
): void {
  switch (value.type) {
    case "classJoin":
      for (const [index, item] of value.items.entries()) {
        validateValueExpression(contract, item, variants, `${path}.items.${index}`, issues);
      }
      break;
    case "classVariant":
      if (!variants.has(value.variant)) {
        issues.push(
          issue(
            contract,
            `${path}.variant`,
            `Class variant reference "${value.variant}" does not match a contract variant.`,
          ),
        );
      }
      break;
    case "object":
      for (const [key, entry] of Object.entries(value.entries)) {
        validateValueExpression(contract, entry, variants, `${path}.entries.${key}`, issues);
      }
      break;
    case "template":
      for (const [index, part] of value.parts.entries()) {
        if (typeof part !== "string") {
          validateValueExpression(contract, part, variants, `${path}.parts.${index}`, issues);
        }
      }
      break;
    case "literal":
    case "raw":
    case "variable":
      break;
    default:
      issues.push(
        issue(
          contract,
          `${path}.type`,
          `Unsupported value expression type "${(value as { type?: string }).type}".`,
        ),
      );
  }
}

function validateFrameworkTargets(
  contract: StyledAdapterContract,
  frameworks: readonly FrameworkTarget[] | undefined,
  path: string,
  issues: StyledAdapterContractIssue[],
): void {
  if (!frameworks) return;

  if (frameworks.length === 0) {
    issues.push(issue(contract, path, "Framework filter must include at least one target."));
    return;
  }

  const seen = new Set<string>();
  for (const framework of frameworks) {
    if (!FRAMEWORK_TARGETS.includes(framework)) {
      issues.push(
        issue(contract, `${path}.${framework}`, `Unsupported framework target "${framework}".`),
      );
    }
    if (seen.has(framework)) {
      issues.push(
        issue(contract, `${path}.${framework}`, `Duplicate framework target "${framework}".`),
      );
    }
    seen.add(framework);
  }
}

type ComponentReference = Pick<ComponentNode, "component" | "exportName"> & {
  frameworks?: readonly FrameworkTarget[];
};

function getReferenceFrameworks(
  contract: StyledAdapterContract,
  reference: ComponentReference,
): readonly FrameworkTarget[] | undefined {
  if ("frameworks" in reference) {
    return reference.frameworks;
  }

  return contract.frameworks;
}

function getEffectiveFrameworks(
  contract: StyledAdapterContract,
  scopedFrameworks?: readonly FrameworkTarget[],
): FrameworkTarget[] {
  const contractFrameworks = contract.frameworks ?? FRAMEWORK_TARGETS;
  if (!scopedFrameworks) return [...contractFrameworks];

  return scopedFrameworks.filter((framework) => contractFrameworks.includes(framework));
}

function issue(
  contract: StyledAdapterContract,
  path: string,
  message: string,
): StyledAdapterContractIssue {
  return { component: contract.component, path, message };
}
