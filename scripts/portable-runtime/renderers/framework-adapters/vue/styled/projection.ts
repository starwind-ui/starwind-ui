import {
  collectStyledOutputNamedSlots,
  usesStyledOutputDefaultSlot,
  type StyledOutputComponent,
  type StyledOutputComponentGroup,
  type StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";

import { computedExpressionUsesReference, projectVueComputedExpression } from "./expressions.js";
import { projectVueAttributeAccess, type VueAttributeSetupReason } from "../public-contract.js";
import { projectVueImports } from "./imports.js";
import {
  applyVueStyledPublicContractBindings,
  collectVueStyledPublicEmits,
  collectVueStyledPublicModels,
  collectVueNativeAttributesTypes,
  getVueStyledPublicContract,
} from "./public-contracts.js";
import { hasVueDependentPropDefault } from "./props.js";
import { applyGenericNativeElementRef } from "./ref-bridges.js";
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
  const specialization = specializeVueStyledComponent(group.component, component);
  applyGenericNativeElementRef(component, specialization);
  const publicContract = getVueStyledPublicContract(group.component, component.exportName);
  applyVueStyledPublicContractBindings(component.render, publicContract);
  applyGenericNativeClassBindings(component);
  const manuallyForwardsAttrs = component.render.some((node) =>
    renderNodeUsesVueAttrs(node, component.destructure?.rest),
  );
  const filtersComponentAttrs = applyGenericComponentAttrForwarding(component);
  const props = projectProps(component, publicContract);
  const vueVariables = component.variables.filter(isForVue);
  const computedNames: string[] = [];
  const expressionProps = [
    ...props.destructure.map((prop) => {
      const localName = prop.alias ?? prop.name;
      return { sourceName: localName, targetName: localName };
    }),
    ...(component.destructure?.rest
      ? [{ sourceName: component.destructure.rest, targetName: "attrs" }]
      : []),
  ];
  const computed = vueVariables.map((variable) => {
    const projection = {
      expression: projectVueComputedExpression(variable.value, {
        computed: computedNames,
        props: expressionProps,
      }),
      name: variable.name,
    };
    computedNames.push(variable.name);
    return projection;
  });
  const emits = collectVueStyledPublicEmits(publicContract);
  const usesDynamicComposition = component.render.some(renderNodeUsesDynamicComposition);
  const usesMultipleAttrDestinations =
    component.render.reduce(
      (count, node) => count + countVueAttrDestinations(node, component.destructure?.rest),
      0,
    ) > 1;
  const usesEventWork = component.render.some(renderNodeUsesEventWork);
  const computedUsesAttrs = computed.some((variable) =>
    computedExpressionUsesReference(variable.expression, "attrs"),
  );
  const templateRequiresSetupAttrs = component.render.some((node) =>
    renderNodeRequiresSetupAttrs(node, component.destructure?.rest),
  );
  const usesAttrs = manuallyForwardsAttrs || computedUsesAttrs;
  const setupReasons: VueAttributeSetupReason[] = [
    ...(computedUsesAttrs ? (["setup-consumer"] as const) : []),
    ...(specialization.specialization.kind !== "generic" ? (["projection-helper"] as const) : []),
    ...(emits.length || usesEventWork ? (["event-work"] as const) : []),
    ...(usesDynamicComposition || usesMultipleAttrDestinations
      ? (["dynamic-composition"] as const)
      : []),
    ...(filtersComponentAttrs || templateRequiresSetupAttrs
      ? (["projection-helper", "protected-merge"] as const)
      : []),
  ];
  const attributeAccess = usesAttrs ? projectVueAttributeAccess(setupReasons) : null;
  const imports: VueImportName[] = [
    ...(vueVariables.length || hasVueDependentPropDefault(component.destructure?.props ?? [])
      ? [{ kind: "value" as const, name: "computed" }]
      : []),
    ...(attributeAccess?.vueImport
      ? [{ kind: "value" as const, name: attributeAccess.vueImport }]
      : []),
    ...specialization.imports,
    ...collectVueNativeAttributesTypes((component.props?.extends ?? []).filter(isForVue)).map(
      (name) => ({ kind: "type" as const, name }),
    ),
  ];
  return {
    attributeAccess,
    computed,
    emits,
    exposedRefs: specialization.exposedRefs,
    exportName: component.exportName,
    filtersComponentAttrs,
    manuallyForwardsAttrs,
    imports: projectVueImports(group, component, options, dedupeImports(imports)),
    models: collectVueStyledPublicModels(publicContract),
    props,
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

function applyGenericComponentAttrForwarding(component: StyledOutputComponent): boolean {
  const restBinding = component.destructure?.rest;
  if (!restBinding) return false;
  let filtersAttrs = false;

  visitRenderNodes(component.render, (node) => {
    if (node.type !== "component") return;
    const spread = node.attrs.find(
      (attribute) =>
        isForVue(attribute) &&
        attribute.name === "spread" &&
        attribute.value?.type === "variable" &&
        attribute.value.name === restBinding,
    );
    if (!spread) return;
    const ownedNames = [
      ...new Set(
        node.attrs
          .filter((attribute) => attribute !== spread && isForVue(attribute))
          .map((attribute) => toVueFallthroughName(attribute.name)),
      ),
    ];
    if (!ownedNames.length) return;
    const childName = node.localName ?? node.exportName;
    const keys = ownedNames.map((name) => `'${name}'`).join(" | ");
    const names = ownedNames.map((name) => `'${name}'`).join(", ");
    spread.value = {
      type: "raw",
      code: `omitForwardedAttrs(attrs, [${names}]) as Omit<InstanceType<typeof ${childName}>['$props'], ${keys}>`,
    };
    filtersAttrs = true;
  });

  return filtersAttrs;
}

function toVueFallthroughName(name: string): string {
  if (!name.startsWith("@")) return name;
  return `on${name
    .slice(1)
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("")}`;
}

function applyGenericNativeClassBindings(component: StyledOutputComponent): void {
  const classProp = component.destructure?.props.find(
    (prop) => isForVue(prop) && prop.name === "class",
  );
  if (!classProp) return;
  const classBinding = classProp.alias ?? classProp.name;

  visitRenderNodes(component.render, (node) => {
    if (node.type !== "element" || node.tagBinding) return;
    const classAttribute = node.attrs.find(
      (attribute) =>
        isForVue(attribute) &&
        attribute.name === "class" &&
        attribute.value?.type === "variable" &&
        attribute.value.name === classBinding,
    );
    if (!classAttribute) return;
    classAttribute.value = {
      type: "raw",
      code: `${classBinding} as import('vue').ClassValue`,
    };
  });
}

function visitRenderNodes(
  nodes: StyledOutputRenderNode[],
  visitor: (node: StyledOutputRenderNode) => void,
): void {
  for (const node of nodes) {
    visitor(node);
    switch (node.type) {
      case "component":
      case "element":
      case "fragment":
      case "primitive":
      case "repeat":
        visitRenderNodes(node.children, visitor);
        break;
      case "condition":
        visitRenderNodes(node.then, visitor);
        visitRenderNodes(node.else, visitor);
        break;
      case "slot":
        visitRenderNodes(node.fallback, visitor);
        break;
      case "icon":
      case "text":
        break;
    }
  }
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

function renderNodeUsesVueAttrs(
  node: StyledOutputRenderNode,
  restBinding: string | undefined,
): boolean {
  if (
    "attrs" in node &&
    node.attrs.filter(isForVue).some((attribute) => {
      if (attribute.name !== "spread" || attribute.value === undefined) return false;
      if (attribute.value.type === "variable") return attribute.value.name === restBinding;
      return attribute.value.type === "raw" && /\battrs\b/.test(attribute.value.code);
    })
  ) {
    return true;
  }
  switch (node.type) {
    case "component":
    case "element":
    case "fragment":
    case "primitive":
    case "repeat":
      return node.children.some((child) => renderNodeUsesVueAttrs(child, restBinding));
    case "condition":
      return [...node.then, ...node.else].some((child) =>
        renderNodeUsesVueAttrs(child, restBinding),
      );
    case "slot":
      return node.fallback.some((child) => renderNodeUsesVueAttrs(child, restBinding));
    case "icon":
    case "text":
      return false;
  }
}

function renderNodeRequiresSetupAttrs(
  node: StyledOutputRenderNode,
  restBinding: string | undefined,
): boolean {
  if (
    "attrs" in node &&
    node.attrs.filter(isForVue).some((attribute) => {
      if (
        attribute.name !== "spread" ||
        attribute.value?.type !== "raw" ||
        !/\battrs\b/.test(attribute.value.code)
      ) {
        return false;
      }
      return true;
    })
  ) {
    return true;
  }
  switch (node.type) {
    case "component":
    case "element":
    case "fragment":
    case "primitive":
    case "repeat":
      return node.children.some((child) => renderNodeRequiresSetupAttrs(child, restBinding));
    case "condition":
      return [...node.then, ...node.else].some((child) =>
        renderNodeRequiresSetupAttrs(child, restBinding),
      );
    case "slot":
      return node.fallback.some((child) => renderNodeRequiresSetupAttrs(child, restBinding));
    case "icon":
    case "text":
      return false;
  }
}

function renderNodeUsesDynamicComposition(node: StyledOutputRenderNode): boolean {
  if (node.type === "element" && node.tagBinding) return true;
  switch (node.type) {
    case "component":
    case "element":
    case "fragment":
    case "primitive":
    case "repeat":
      return node.children.some(renderNodeUsesDynamicComposition);
    case "condition":
      return [...node.then, ...node.else].some(renderNodeUsesDynamicComposition);
    case "slot":
      return node.fallback.some(renderNodeUsesDynamicComposition);
    case "icon":
    case "text":
      return false;
  }
}

function renderNodeUsesEventWork(node: StyledOutputRenderNode): boolean {
  if (
    "attrs" in node &&
    node.attrs.some((attribute) => isForVue(attribute) && attribute.name.startsWith("@"))
  ) {
    return true;
  }
  switch (node.type) {
    case "component":
    case "element":
    case "fragment":
    case "primitive":
    case "repeat":
      return node.children.some(renderNodeUsesEventWork);
    case "condition":
      return [...node.then, ...node.else].some(renderNodeUsesEventWork);
    case "slot":
      return node.fallback.some(renderNodeUsesEventWork);
    case "icon":
    case "text":
      return false;
  }
}

function countVueAttrDestinations(
  node: StyledOutputRenderNode,
  restBinding: string | undefined,
): number {
  const ownCount =
    "attrs" in node &&
    node.attrs.some(
      (attribute) =>
        isForVue(attribute) &&
        attribute.name === "spread" &&
        attribute.value?.type === "variable" &&
        attribute.value.name === restBinding,
    )
      ? 1
      : 0;
  switch (node.type) {
    case "component":
    case "element":
    case "fragment":
    case "primitive":
    case "repeat":
      return (
        ownCount +
        node.children.reduce(
          (count, child) => count + countVueAttrDestinations(child, restBinding),
          0,
        )
      );
    case "condition":
      return (
        ownCount +
        [...node.then, ...node.else].reduce(
          (count, child) => count + countVueAttrDestinations(child, restBinding),
          0,
        )
      );
    case "slot":
      return (
        ownCount +
        node.fallback.reduce(
          (count, child) => count + countVueAttrDestinations(child, restBinding),
          0,
        )
      );
    case "icon":
    case "text":
      return ownCount;
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
  const targetFields = publicContract.fields ?? [];
  const destructure = (component.destructure?.props ?? []).filter(
    (prop) => isForVue(prop) && !omittedPropFields.has(prop.name),
  );
  const declaredPropNames: Record<string, string> = {
    ...publicContract.declaredPropNames,
  };
  for (const prop of destructure) {
    const normalizedName = toVueRuntimePropName(prop.name);
    if (prop.alias === normalizedName && normalizedName !== prop.name) {
      declaredPropNames[prop.name] = normalizedName;
    }
  }
  const replacedPublicSourceFields = [
    ...new Set(
      Object.entries(declaredPropNames).flatMap(([sourceName, targetName]) =>
        sourceName === targetName ? [] : [sourceName],
      ),
    ),
  ].sort();
  const declaredDestructure = destructure.map((prop) => {
    const name = declaredPropNames[prop.name] ?? prop.name;
    return name === prop.name ? prop : { ...prop, name };
  });
  const models = collectVueStyledPublicModels(publicContract);
  const inheritedPublicFields = destructure.flatMap((prop) => {
    if (publicFields.some((field) => field.name === prop.name)) return [];
    const type = getInheritedPropType(component, prop.name);
    return type === "unknown" || type.includes(`${component.exportName}Props[`)
      ? []
      : [{ name: prop.name, optional: true, type }];
  });
  const knownFields = new Map([
    ...publicFields.map((field) => [field.name, field] as const),
    ...targetFields.map((field) => [field.name, field] as const),
    ...inheritedPublicFields.map((field) => [field.name, field] as const),
    ...models.map(
      (model) => [model.name, { name: model.name, optional: true, type: model.type }] as const,
    ),
  ]);
  const declaredSourceNames = new Set([
    ...knownFields.keys(),
    ...destructure.map((prop) => prop.name).filter((name) => !omittedPropFields.has(name)),
  ]);
  const declaredFields = new Map(
    [...declaredSourceNames].map((sourceName) => {
      const name = declaredPropNames[sourceName] ?? sourceName;
      return [
        name,
        {
          name,
          optional: knownFields.get(sourceName)?.optional !== false,
          type:
            publicContract.declaredFieldTypes?.[sourceName] ??
            knownFields.get(sourceName)?.type ??
            getInheritedPropType(component, sourceName),
        },
      ] as const;
    }),
  );
  return {
    declared: {
      extendsPublic: publicContract.declaredExtendsPublic ?? true,
      fields: [...declaredFields.values()],
      name: `${component.exportName}DeclaredProps`,
      replacedPublicSourceFields,
    },
    destructure: declaredDestructure,
    public: {
      extends: publicExtends,
      fields: [
        ...publicFields,
        ...targetFields.filter(
          (field) => !publicFields.some((candidate) => candidate.name === field.name),
        ),
        ...inheritedPublicFields,
        ...models
          .filter((model) => !publicFields.some((field) => field.name === model.name))
          .map((model) => ({ name: model.name, optional: true, type: model.type })),
      ],
      name: `${component.exportName}Props`,
    },
  };
}

function toVueRuntimePropName(name: string): string {
  let normalized = "";
  for (let index = 0; index < name.length; index += 1) {
    const character = name[index]!;
    const nextCode = name.charCodeAt(index + 1);
    if (character === "-" && nextCode >= 97 && nextCode <= 122) {
      normalized += String.fromCharCode(nextCode - 32);
      index += 1;
    } else {
      normalized += character;
    }
  }
  return normalized;
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
