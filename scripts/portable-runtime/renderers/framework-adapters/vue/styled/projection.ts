import {
  collectStyledOutputNamedSlots,
  usesStyledOutputDefaultSlot,
  type StyledOutputComponent,
  type StyledOutputComponentGroup,
  type StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";

import { computedExpressionUsesReference, projectVueComputedExpression } from "./expressions.js";
import { projectVueImports } from "./imports.js";
import {
  applyVueStyledPublicContractBindings,
  collectVueNativeAttributesTypes,
  getVueStyledPublicContract,
} from "./public-contracts.js";
import { supportsVueScope } from "./scope.js";
import { specializeVueStyledComponent } from "./specializations.js";
import type {
  RenderVueComponentOptions,
  VueImportName,
  VuePropsProjection,
  VueStyledComponentProjection,
} from "./types.js";

export function projectVueStyledComponent(
  group: StyledOutputComponentGroup,
  sourceComponent: StyledOutputComponent,
  options: RenderVueComponentOptions,
): VueStyledComponentProjection {
  const component = structuredClone(sourceComponent);
  const manuallyForwardsAttrs = component.render.some(renderNodeUsesVueAttrs);
  const specialization = specializeVueStyledComponent(group.component, component);
  const publicContract = getVueStyledPublicContract(group.component, component.exportName);
  applyVueStyledPublicContractBindings(component.render, publicContract);
  const vueVariables = component.variables.filter(isForVue);
  const computed = vueVariables.map((variable) => ({
    expression: projectVueComputedExpression(variable.value),
    name: variable.name,
  }));
  const usesAttrs =
    manuallyForwardsAttrs ||
    computed.some((variable) => computedExpressionUsesReference(variable.expression, "attrs"));
  const imports: VueImportName[] = [
    ...(vueVariables.length ? [{ kind: "value" as const, name: "computed" }] : []),
    ...(usesAttrs ? [{ kind: "value" as const, name: "useAttrs" }] : []),
    ...specialization.imports,
    ...collectVueNativeAttributesTypes((component.props?.extends ?? []).filter(isForVue)).map(
      (name) => ({ kind: "type" as const, name }),
    ),
  ];
  return {
    computed,
    emits: publicContract.emits ?? [],
    exposedRefs: specialization.exposedRefs,
    exportName: component.exportName,
    manuallyForwardsAttrs,
    imports: projectVueImports(group, component, options, dedupeImports(imports)),
    models: publicContract.models ?? [],
    props: projectProps(component, publicContract),
    render: component.render,
    rootBindings: specialization.rootBindings,
    setup: specialization.setup,
    slots:
      specialization.specialization.kind === "generic"
        ? [
            ...(usesStyledOutputDefaultSlot(component.render)
              ? [{ name: "default", signature: "() => unknown" }]
              : []),
            ...collectStyledOutputNamedSlots(component.render).map((name) => ({
              name,
              signature: "() => unknown",
            })),
          ]
        : specialization.specialization.slots,
    specialization: specialization.specialization,
    usesAttrs,
  };
}

function dedupeImports(imports: VueImportName[]): VueImportName[] {
  const seen = new Set<string>();
  return imports.filter((entry) => {
    const key = `${entry.kind}:${entry.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderNodeUsesVueAttrs(node: StyledOutputRenderNode): boolean {
  if (
    "attrs" in node &&
    node.attrs
      .filter(isForVue)
      .some((attribute) => attribute.name === "spread" && attribute.value !== undefined)
  ) {
    return true;
  }
  switch (node.type) {
    case "component":
    case "element":
    case "fragment":
    case "primitive":
    case "repeat":
      return node.children.some(renderNodeUsesVueAttrs);
    case "condition":
      return [...node.then, ...node.else].some(renderNodeUsesVueAttrs);
    case "slot":
      return node.fallback.some(renderNodeUsesVueAttrs);
    case "icon":
    case "text":
      return false;
  }
}

function projectProps(
  component: StyledOutputComponent,
  publicContract: ReturnType<typeof getVueStyledPublicContract>,
): VuePropsProjection {
  const publicExtends = (component.props?.extends ?? []).filter(isForVue);
  const omittedPropFields = new Set(publicContract.omittedPropFields ?? []);
  const publicFields = (component.props?.fields ?? []).filter(
    (field) => isForVue(field) && !omittedPropFields.has(field.name),
  );
  const destructure = (component.destructure?.props ?? []).filter(
    (prop) => isForVue(prop) && !omittedPropFields.has(prop.name),
  );
  const models = publicContract.models ?? [];
  const inheritedPublicFields = destructure.flatMap((prop) => {
    if (publicFields.some((field) => field.name === prop.name)) return [];
    const type = getInheritedPropType(component, prop.name);
    return type === "unknown" || type.includes(`${component.exportName}Props[`)
      ? []
      : [{ name: prop.name, optional: true, type }];
  });
  const knownFields = new Map([
    ...publicFields.map((field) => [field.name, field] as const),
    ...inheritedPublicFields.map((field) => [field.name, field] as const),
    ...models.map(
      (model) => [model.name, { name: model.name, optional: true, type: model.type }] as const,
    ),
  ]);
  const declaredNames = new Set([
    ...knownFields.keys(),
    ...destructure.map((prop) => prop.name).filter((name) => !omittedPropFields.has(name)),
  ]);
  return {
    declared: {
      fields: [...declaredNames].map((name) => ({
        name,
        optional: knownFields.get(name)?.optional !== false,
        type: knownFields.get(name)?.type ?? getInheritedPropType(component, name),
      })),
      name: `${component.exportName}DeclaredProps`,
    },
    destructure,
    public: {
      extends: publicExtends,
      fields: [
        ...publicFields,
        ...inheritedPublicFields,
        ...models
          .filter((model) => !publicFields.some((field) => field.name === model.name))
          .map((model) => ({ name: model.name, optional: true, type: model.type })),
      ],
      name: `${component.exportName}Props`,
    },
  };
}

function getInheritedPropType(component: StyledOutputComponent, name: string): string {
  if (name === "class") return "ClassValue";
  if (name === "disabled" || name === "inset") return "boolean";
  if (name === "href") return "string";
  if (name === "tabindex") return "number";
  if (
    (component.props?.extends ?? []).some(
      (propExtend) => isForVue(propExtend) && propExtend.kind === "variant-props",
    )
  ) {
    return `${component.exportName}Props[${JSON.stringify(name)}]`;
  }
  return "unknown";
}

function isForVue(value: { targetScopes?: readonly string[] }): boolean {
  return supportsVueScope(value.targetScopes);
}
