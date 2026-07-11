import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputPropExtend,
  StyledOutputRenderNode,
  StyledOutputSlotNode,
  StyledOutputTargetScope,
  StyledOutputValueExpression,
} from "./types.js";

export type StyledOutputAnalysisOptions = {
  target?: StyledOutputTargetScope;
};

export type StyledOutputComponentReference = {
  component: string;
  exportName: string;
  localName?: string;
};

export type StyledOutputSlotReference = {
  name?: string;
};

export type StyledOutputTargetScopedFact = {
  componentExportName?: string;
  kind:
    | "attribute"
    | "comment"
    | "component"
    | "destructure-prop"
    | "group"
    | "import"
    | "prop-extend"
    | "prop-field"
    | "variable";
  name?: string;
  targetScopes: StyledOutputTargetScope[];
};

export type StyledOutputComponentAnalysis = {
  composedComponentReferences: StyledOutputComponentReference[];
  dependencyComponents: string[];
  exportName: string;
  primitiveReferences: string[];
  slots: StyledOutputSlotReference[];
  targetScopedFacts: StyledOutputTargetScopedFact[];
  usesDefaultSlot: boolean;
  variantReferences: string[];
};

export type StyledOutputGroupAnalysis = {
  component: string;
  components: StyledOutputComponentAnalysis[];
  composedComponentReferences: StyledOutputComponentReference[];
  dependencies: {
    primitives: string[];
    styledComponents: string[];
    variants: string[];
  };
  primitiveReferences: string[];
  slots: StyledOutputSlotReference[];
  targetScopedFacts: StyledOutputTargetScopedFact[];
  variantReferences: string[];
};

export function analyzeStyledOutputGroup(
  group: StyledOutputComponentGroup,
  options: StyledOutputAnalysisOptions = {},
): StyledOutputGroupAnalysis {
  const components = group.components
    .filter((component) => isInTargetScope(component, options))
    .map((component) => analyzeStyledOutputComponent(component, options));
  const primitiveReferences = uniqueSorted(
    components.flatMap((component) => component.primitiveReferences),
  );
  const composedComponentReferences = uniqueSortedComponentReferences(
    components.flatMap((component) => component.composedComponentReferences),
  );
  const variantReferences = uniqueSorted(
    components.flatMap((component) => component.variantReferences),
  );
  const slots = uniqueSortedSlots(components.flatMap((component) => component.slots));
  const targetScopedFacts = [
    ...collectScopedFact(group, {
      kind: "group",
      name: group.component,
      options,
    }),
    ...components.flatMap((component) => component.targetScopedFacts),
  ];

  return {
    component: group.component,
    components,
    composedComponentReferences,
    dependencies: {
      primitives: primitiveReferences,
      styledComponents: uniqueSorted(
        [
          ...(group.dependencies?.styledComponents ?? []),
          ...composedComponentReferences.map((reference) => reference.component),
        ].filter((component) => component !== group.component),
      ),
      variants: variantReferences,
    },
    primitiveReferences,
    slots,
    targetScopedFacts,
    variantReferences,
  };
}

export function analyzeStyledOutputComponent(
  component: StyledOutputComponent,
  options: StyledOutputAnalysisOptions = {},
): StyledOutputComponentAnalysis {
  const primitiveReferences = collectStyledOutputPrimitiveReferences(component.render);
  const composedComponentReferences = collectStyledOutputComposedComponentReferences(
    component,
    options,
  );
  const slots = collectStyledOutputSlots(component.render);
  const variantReferences = collectStyledOutputVariantReferences(component, options);
  const targetScopedFacts = collectComponentTargetScopedFacts(component, options);

  return {
    composedComponentReferences,
    dependencyComponents: uniqueSorted(
      composedComponentReferences.map((reference) => reference.component),
    ),
    exportName: component.exportName,
    primitiveReferences,
    slots,
    targetScopedFacts,
    usesDefaultSlot: usesStyledOutputDefaultSlot(component.render),
    variantReferences,
  };
}

export function collectStyledOutputPrimitiveReferences(
  nodes: readonly StyledOutputRenderNode[],
): string[] {
  const primitives = new Set<string>();

  visitRenderNodes(nodes, (node) => {
    if (node.type === "primitive") {
      primitives.add(node.component);
    }
  });

  return uniqueSorted([...primitives]);
}

export function collectStyledOutputComposedComponentReferences(
  component: StyledOutputComponent,
  options: StyledOutputAnalysisOptions = {},
): StyledOutputComponentReference[] {
  const references = new Map<string, StyledOutputComponentReference>();

  for (const propExtend of component.props?.extends ?? []) {
    if (propExtend.kind === "component-props" && isInTargetScope(propExtend, options)) {
      addComponentReference(references, propExtend);
    }
  }

  visitRenderNodes(component.render, (node) => {
    if (node.type === "component") {
      addComponentReference(references, node);
    }
  });

  return uniqueSortedComponentReferences([...references.values()]);
}

export function collectStyledOutputSlots(
  nodes: readonly StyledOutputRenderNode[],
): StyledOutputSlotReference[] {
  const slots = new Map<string, StyledOutputSlotReference>();

  visitRenderNodes(nodes, (node) => {
    if (node.type === "slot") {
      slots.set(getSlotKey(node), { name: node.name });
    }
  });

  return uniqueSortedSlots([...slots.values()]);
}

export function collectStyledOutputNamedSlots(nodes: readonly StyledOutputRenderNode[]): string[] {
  return collectStyledOutputSlots(nodes)
    .map((slot) => slot.name)
    .filter((name): name is string => name !== undefined);
}

export function usesStyledOutputDefaultSlot(nodes: readonly StyledOutputRenderNode[]): boolean {
  return collectStyledOutputSlots(nodes).some((slot) => slot.name === undefined);
}

export function collectStyledOutputVariantReferences(
  component: StyledOutputComponent,
  options: StyledOutputAnalysisOptions = {},
): string[] {
  const variants = new Set<string>();

  for (const propExtend of component.props?.extends ?? []) {
    if (propExtend.kind === "variant-props" && isInTargetScope(propExtend, options)) {
      variants.add(propExtend.variant);
    }
  }

  for (const variable of component.variables) {
    if (isInTargetScope(variable, options)) {
      collectValueVariants(variable.value, variants);
    }
  }

  visitRenderNodes(component.render, (node) => {
    if ("attrs" in node) {
      for (const attr of node.attrs) {
        if (attr.value && isInTargetScope(attr, options)) {
          collectValueVariants(attr.value, variants);
        }
      }
    }
  });

  return uniqueSorted([...variants]);
}

function collectComponentTargetScopedFacts(
  component: StyledOutputComponent,
  options: StyledOutputAnalysisOptions,
): StyledOutputTargetScopedFact[] {
  const facts: StyledOutputTargetScopedFact[] = [
    ...collectScopedFact(component, {
      componentExportName: component.exportName,
      kind: "component",
      name: component.exportName,
      options,
    }),
  ];

  for (const importModel of component.imports) {
    facts.push(
      ...collectScopedFact(importModel, {
        componentExportName: component.exportName,
        kind: "import",
        name: importModel.importName,
        options,
      }),
    );
  }

  for (const propExtend of component.props?.extends ?? []) {
    facts.push(
      ...collectScopedFact(propExtend, {
        componentExportName: component.exportName,
        kind: "prop-extend",
        name: getPropExtendName(propExtend),
        options,
      }),
    );
  }

  for (const field of component.props?.fields ?? []) {
    facts.push(
      ...collectScopedFact(field, {
        componentExportName: component.exportName,
        kind: "prop-field",
        name: field.name,
        options,
      }),
    );
  }

  for (const prop of component.destructure?.props ?? []) {
    facts.push(
      ...collectScopedFact(prop, {
        componentExportName: component.exportName,
        kind: "destructure-prop",
        name: prop.name,
        options,
      }),
    );
  }

  for (const variable of component.variables) {
    facts.push(
      ...collectScopedFact(variable, {
        componentExportName: component.exportName,
        kind: "variable",
        name: variable.name,
        options,
      }),
    );
  }

  visitRenderNodes(component.render, (node) => {
    if ("attrs" in node) {
      for (const attr of node.attrs) {
        facts.push(
          ...collectScopedFact(attr, {
            componentExportName: component.exportName,
            kind: "attribute",
            name: attr.name,
            options,
          }),
        );
      }
    }

    if (node.type === "element") {
      for (const comment of node.comments) {
        facts.push(
          ...collectScopedFact(comment, {
            componentExportName: component.exportName,
            kind: "comment",
            options,
          }),
        );
      }
    }
  });

  return facts;
}

function collectValueVariants(value: StyledOutputValueExpression, variants: Set<string>): void {
  switch (value.type) {
    case "class-join":
      value.items.forEach((item) => collectValueVariants(item, variants));
      break;
    case "class-variant":
      variants.add(value.variant);
      break;
    case "object":
      Object.values(value.entries).forEach((entry) => collectValueVariants(entry, variants));
      break;
    case "template":
      value.parts.forEach((part) => {
        if (typeof part !== "string") {
          collectValueVariants(part, variants);
        }
      });
      break;
    case "literal":
    case "raw":
    case "variable":
      break;
  }
}

function visitRenderNodes(
  nodes: readonly StyledOutputRenderNode[],
  visit: (node: StyledOutputRenderNode) => void,
): void {
  for (const node of nodes) {
    visit(node);

    if ("children" in node) {
      visitRenderNodes(node.children, visit);
    }

    if (node.type === "slot") {
      visitRenderNodes(node.fallback, visit);
    }

    if (node.type === "condition") {
      visitRenderNodes(node.then, visit);
      visitRenderNodes(node.else, visit);
    }
  }
}

function addComponentReference(
  references: Map<string, StyledOutputComponentReference>,
  reference: StyledOutputComponentReference,
): void {
  references.set(getComponentReferenceKey(reference), reference);
}

function collectScopedFact(
  value: { targetScopes?: readonly StyledOutputTargetScope[] },
  options: {
    componentExportName?: string;
    kind: StyledOutputTargetScopedFact["kind"];
    name?: string;
    options: StyledOutputAnalysisOptions;
  },
): StyledOutputTargetScopedFact[] {
  if (!value.targetScopes || !isInTargetScope(value, options.options)) return [];

  return [
    {
      componentExportName: options.componentExportName,
      kind: options.kind,
      name: options.name,
      targetScopes: [...value.targetScopes],
    },
  ];
}

function getPropExtendName(propExtend: StyledOutputPropExtend): string {
  switch (propExtend.kind) {
    case "component-props":
      return propExtend.exportName;
    case "element-attributes":
    case "omit-element-attributes":
      return propExtend.element;
    case "raw":
      return "raw";
    case "variant-props":
      return propExtend.variant;
  }
}

function isInTargetScope(
  value: { targetScopes?: readonly StyledOutputTargetScope[] },
  options: StyledOutputAnalysisOptions,
): boolean {
  return !options.target || !value.targetScopes || value.targetScopes.includes(options.target);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function uniqueSortedComponentReferences(
  references: readonly StyledOutputComponentReference[],
): StyledOutputComponentReference[] {
  const uniqueReferences = new Map<string, StyledOutputComponentReference>();

  for (const reference of references) {
    uniqueReferences.set(getComponentReferenceKey(reference), {
      component: reference.component,
      exportName: reference.exportName,
      localName: reference.localName,
    });
  }

  return [...uniqueReferences.values()].sort((left, right) =>
    getComponentReferenceKey(left).localeCompare(getComponentReferenceKey(right)),
  );
}

function uniqueSortedSlots(
  slots: readonly StyledOutputSlotReference[],
): StyledOutputSlotReference[] {
  const uniqueSlots = new Map<string, StyledOutputSlotReference>();

  for (const slot of slots) {
    uniqueSlots.set(getSlotKey(slot), { name: slot.name });
  }

  return [...uniqueSlots.values()].sort((left, right) =>
    getSlotKey(left).localeCompare(getSlotKey(right)),
  );
}

function getComponentReferenceKey(reference: StyledOutputComponentReference): string {
  return `${reference.component}:${reference.exportName}:${reference.localName ?? reference.exportName}`;
}

function getSlotKey(slot: StyledOutputSlotReference | StyledOutputSlotNode): string {
  return slot.name ?? "";
}
