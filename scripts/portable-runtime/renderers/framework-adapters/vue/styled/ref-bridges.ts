import type {
  StyledOutputComponent,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";

import { supportsVueScope } from "./scope.js";
import {
  getVueNativeElementSemantics,
  type VueExposedRefProjection,
  type VueImportName,
  type VueRootBinding,
} from "./types.js";

type GenericRefProjectionTarget = {
  exposedRefs: VueExposedRefProjection[];
  imports: VueImportName[];
  rootBindings: VueRootBinding[];
};

export function applyGenericNativeElementRef(
  component: StyledOutputComponent,
  projection: GenericRefProjectionTarget,
): void {
  if (
    !component.forwardRef ||
    !supportsVueScope(component.forwardRef.targetScopes) ||
    projection.exposedRefs.length > 0
  ) {
    return;
  }

  const elementTypes = component.forwardRef.targetType
    .split("|")
    .map((type) => type.trim())
    .filter(Boolean);
  const targets = new Set(elementTypes);
  const roots = collectNativeRefRoots(component.render, targets);
  const matchedTypes = new Set(
    roots.map((root) =>
      root.tagBinding ? "HTMLElement" : getVueNativeElementSemantics(root.tag)?.elementType,
    ),
  );
  const missingTypes = elementTypes.filter((elementType) =>
    elementType === "HTMLElement"
      ? ![...matchedTypes].some((type) => type?.startsWith("HTML"))
      : !matchedTypes.has(elementType),
  );
  if (!roots.length || missingTypes.length > 0) {
    throw new TypeError(
      `Vue Styled ${component.exportName} cannot place forwardRef target ${JSON.stringify(
        component.forwardRef.targetType,
      )} on its native render roots${
        missingTypes.length > 0 ? `; missing ${missingTypes.join(", ")}` : ""
      }.`,
    );
  }

  for (const root of roots) {
    const existingRef = root.attrs.find(
      (attribute) => attribute.name === "ref" && supportsVueScope(attribute.targetScopes),
    );
    if (existingRef) {
      if (existingRef.value?.type !== "literal" || existingRef.value.value !== "element") {
        throw new TypeError(
          `Vue Styled ${component.exportName} native render root already has a conflicting ref binding.`,
        );
      }
      continue;
    }
    root.attrs.unshift({
      name: "ref",
      targetScopes: ["vue"],
      value: { type: "literal", value: "element" },
    });
  }
  projection.exposedRefs.push({ bridge: "element", elementTypes });
  projection.imports.push({ kind: "value", name: "ref" });
  projection.rootBindings.push({ attribute: "ref", target: "native render roots" });
}

function collectNativeRefRoots(
  nodes: StyledOutputRenderNode[],
  targetTypes: ReadonlySet<string>,
): Array<Extract<StyledOutputRenderNode, { type: "element" }>> {
  return nodes.flatMap((node): Array<Extract<StyledOutputRenderNode, { type: "element" }>> => {
    if (node.type === "element") {
      if (node.tagBinding && targetTypes.has("HTMLElement")) return [node];
      const elementType = getVueNativeElementSemantics(node.tag)?.elementType;
      if (
        elementType &&
        (targetTypes.has(elementType) ||
          (targetTypes.has("HTMLElement") && elementType.startsWith("HTML")))
      ) {
        return [node];
      }
      return collectNativeRefRoots(node.children, targetTypes);
    }
    if (node.type === "condition") {
      return collectNativeRefRoots([...node.then, ...node.else], targetTypes);
    }
    if (node.type === "fragment" || node.type === "repeat") {
      return collectNativeRefRoots(node.children, targetTypes);
    }
    if (node.type === "slot") return collectNativeRefRoots(node.fallback, targetTypes);
    return [];
  });
}

export function renderExposedRef(ref: VueExposedRefProjection): string {
  if (ref.bridge === "specialized") {
    throw new TypeError("Specialized exposed refs must be rendered by their typed specialization.");
  }
  if (ref.bridge === "element") {
    const type = ref.elementTypes.join(" | ");
    return `const element = ref<${type} | null>(null);\ndefineExpose({ element });`;
  }

  const type = ref.elementTypes.join(" | ");
  const primitiveType = ref.primitiveElementType ?? ref.elementTypes[0]!;
  const directCheck = ref.elementTypes
    .map((elementType) => `value instanceof ${elementType}`)
    .join(" || ");
  return `const element = ref<${type} | null>(null);\nlet pendingPrimitiveRef: ({ element?: ${primitiveType} | null } & ComponentPublicInstance) | null = null;\ndefineExpose({ element });\n\nfunction setElement(value: Element | ComponentPublicInstance | null): void {\n  if (${directCheck}) {\n    pendingPrimitiveRef = null;\n    element.value = value;\n    return;\n  }\n  const exposed = value as ({ element?: ${primitiveType} | null } & ComponentPublicInstance) | null;\n  pendingPrimitiveRef = exposed;\n  element.value = exposed?.element instanceof ${primitiveType} ? exposed.element : null;\n  if (!exposed || element.value) return;\n\n  void nextTick(() => {\n    if (pendingPrimitiveRef !== exposed) return;\n    element.value = exposed.element instanceof ${primitiveType} ? exposed.element : null;\n  });\n}`;
}
