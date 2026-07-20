import type { VueExposedRefProjection } from "./types.js";

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
