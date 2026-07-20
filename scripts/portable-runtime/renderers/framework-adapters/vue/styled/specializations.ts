import type {
  StyledOutputAttribute,
  StyledOutputComponent,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";

import type {
  VueExposedRefProjection,
  VueImportName,
  VueRootBinding,
  VueStyledSpecialization,
} from "./types.js";

export type VueSpecializationResult = {
  exposedRefs: VueExposedRefProjection[];
  imports: VueImportName[];
  rootBindings: VueRootBinding[];
  setup: string[];
  specialization: VueStyledSpecialization;
};

export function specializeVueStyledComponent(
  groupName: string,
  component: StyledOutputComponent,
): VueSpecializationResult {
  const result: VueSpecializationResult = {
    exposedRefs: [],
    imports: [],
    rootBindings: [],
    setup: [],
    specialization:
      groupName === "select" && component.exportName === "SelectTrigger"
        ? {
            contextName: "StyledTrigger",
            kind: "select-trigger",
            slots: [
              { name: "default", signature: "() => VNode[]" },
              { name: "icon", signature: "() => VNode[]" },
            ],
          }
        : groupName === "select" && component.exportName === "SelectValue"
          ? {
              kind: "select-value",
              slots: [
                {
                  name: "default",
                  signature: "(props: { label: string | null; value: string | null }) => unknown",
                },
              ],
            }
          : { kind: "generic" },
  };

  if (result.specialization.kind === "select-trigger") {
    result.exposedRefs.push({ bridge: "specialized", elementTypes: ["HTMLElement"] });
    result.rootBindings.push({ attribute: "ref", target: "select trigger render branches" });
    result.setup.push("defineExpose({ element });");
  }

  if (groupName === "avatar") {
    const elementType =
      component.exportName === "AvatarImage" ? "HTMLImageElement" : "HTMLSpanElement";
    addPrimitiveBinding(component.render, "avatar", avatarPart(component.exportName), refBinding());
    result.exposedRefs.push(primitiveRef(elementType));
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "avatar primitive root" });
    if (component.exportName === "AvatarImage") {
      renameAttribute(component.render, "onLoadingStatusChange", "@loading-status-change");
    }
  }

  if (groupName === "button" && component.exportName === "Button") {
    addElementBinding(component.render, "a", refBinding());
    addPrimitiveBinding(component.render, "button", "Root", refBinding());
    mapAttribute(component.render, "data-slot", () => ({
      name: "data-slot",
      value: { type: "raw", code: "dataSlot || 'button'" },
    }));
    result.exposedRefs.push({
      ...primitiveRef("HTMLButtonElement"),
      elementTypes: ["HTMLButtonElement", "HTMLAnchorElement"],
    });
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "button render branches" });
  }

  if (groupName === "checkbox" && component.exportName === "Checkbox") {
    addPrimitiveBinding(component.render, "checkbox", "Root", refBinding());
    result.exposedRefs.push(primitiveRef("HTMLElement"));
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "checkbox primitive root" });
  }

  if (groupName === "progress" && component.exportName === "Progress") {
    addPrimitiveBinding(component.render, "progress", "Root", refBinding());
    mapProgressAttrs(component.render);
    result.exposedRefs.push(primitiveRef("HTMLDivElement"));
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "progress primitive root" });
  }

  if (groupName === "select" && component.exportName === "Select") {
    addPrimitiveBinding(component.render, "select", "Root", refBinding());
    result.exposedRefs.push(primitiveRef("HTMLDivElement"));
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "select primitive root" });
  }

  if (groupName === "scroll-area") {
    addPrimitiveBinding(
      component.render,
      "scroll-area",
      scrollAreaPart(component.exportName),
      refBinding(),
    );
    result.exposedRefs.push(primitiveRef("HTMLDivElement"));
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "scroll-area primitive root" });
  }

  if (groupName === "theme-toggle" && component.exportName === "ThemeToggle") {
    const root = findElement(component.render, "button");
    if (root) {
      root.attrs = [
        { name: "ref", value: { type: "literal", value: "element" } },
        ...root.attrs.filter((attribute) => attribute.name !== "type"),
      ];
      const spreadIndex = root.attrs.findIndex((attribute) => attribute.name === "spread");
      root.attrs.splice(spreadIndex + 1, 0, {
        name: "type",
        value: { type: "literal", value: "button" },
      });
      mapAttribute([root], "data-slot", () => ({
        name: "data-slot",
        value: { type: "raw", code: "dataSlot || 'theme-toggle'" },
      }));
    }
    result.exposedRefs.push({ bridge: "element", elementTypes: ["HTMLButtonElement"] });
    result.imports.push({ kind: "value", name: "onMounted" }, { kind: "value", name: "ref" });
    result.setup.push("onMounted(() => {\n  initThemeController();\n});");
    result.rootBindings.push({ attribute: "ref", target: "theme toggle button" });
  }

  return result;
}

function primitiveRef(elementType: string): VueExposedRefProjection {
  return {
    bridge: "primitive-element",
    elementTypes: [elementType],
    primitiveElementType: elementType,
  };
}

function primitiveRefImports(): VueImportName[] {
  return [
    { kind: "value", name: "nextTick" },
    { kind: "value", name: "ref" },
    { kind: "type", name: "ComponentPublicInstance" },
  ];
}

function refBinding(): StyledOutputAttribute {
  return { name: "ref", value: { type: "variable", name: "setElement" } };
}

function avatarPart(exportName: string): string {
  return exportName === "Avatar" ? "Root" : exportName.slice("Avatar".length);
}

function scrollAreaPart(exportName: string): string {
  if (exportName === "ScrollArea") return "Root";
  if (exportName === "ScrollBar") return "Scrollbar";
  return exportName.slice("ScrollArea".length);
}

function addElementBinding(
  nodes: StyledOutputRenderNode[],
  tag: string,
  attribute: StyledOutputAttribute,
): void {
  visitNodes(nodes, (node) => {
    if (node.type === "element" && node.tag === tag) node.attrs.unshift(structuredClone(attribute));
  });
}

function addPrimitiveBinding(
  nodes: StyledOutputRenderNode[],
  component: string,
  part: string,
  attribute: StyledOutputAttribute,
): void {
  visitNodes(nodes, (node) => {
    if (node.type === "primitive" && node.component === component && node.part === part) {
      node.attrs.unshift(structuredClone(attribute));
    }
  });
}

function renameAttribute(nodes: StyledOutputRenderNode[], from: string, to: string): void {
  mapAttribute(nodes, from, (attribute) => ({ ...attribute, name: to }));
}

function mapAttribute(
  nodes: StyledOutputRenderNode[],
  name: string,
  mapper: (attribute: StyledOutputAttribute) => StyledOutputAttribute,
): void {
  visitNodes(nodes, (node) => {
    if (!("attrs" in node)) return;
    node.attrs = node.attrs.map((attribute) =>
      attribute.name === name ? mapper(attribute) : attribute,
    );
  });
}

function mapProgressAttrs(nodes: StyledOutputRenderNode[]): void {
  visitNodes(nodes, (node) => {
    if (node.type !== "primitive" || node.component !== "progress" || node.part !== "Root") return;
    const attrs: StyledOutputAttribute[] = [];
    for (let index = 0; index < node.attrs.length; index += 1) {
      const attribute = node.attrs[index]!;
      if (attribute.name === "spread" && node.attrs[index + 1]?.name === "aria-label") {
        attrs.push({
          name: "spread",
          value: { type: "raw", code: "{ ...attrs, 'aria-label': ariaLabel }" },
        });
        index += 1;
      } else {
        attrs.push(attribute);
      }
    }
    node.attrs = attrs;
  });
}

function findElement(nodes: StyledOutputRenderNode[], tag: string) {
  let found: Extract<StyledOutputRenderNode, { type: "element" }> | undefined;
  visitNodes(nodes, (node) => {
    if (!found && node.type === "element" && node.tag === tag) found = node;
  });
  return found;
}

function visitNodes(
  nodes: StyledOutputRenderNode[],
  visitor: (node: StyledOutputRenderNode) => void,
): void {
  for (const node of nodes) {
    visitor(node);
    if ("children" in node) visitNodes(node.children, visitor);
    if (node.type === "condition") {
      visitNodes(node.then, visitor);
      visitNodes(node.else, visitor);
    }
    if (node.type === "slot") visitNodes(node.fallback, visitor);
  }
}
