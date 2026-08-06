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
      groupName === "alert-dialog" &&
      (component.exportName === "AlertDialogTrigger" ||
        component.exportName === "AlertDialogAction" ||
        component.exportName === "AlertDialogCancel")
        ? {
            kind: "alert-dialog-as-child",
            part: component.exportName.slice("AlertDialog".length) as
              | "Action"
              | "Cancel"
              | "Trigger",
            slots: [{ name: "default", signature: "() => VNode[]" }],
          }
        : groupName === "dialog" &&
            (component.exportName === "DialogTrigger" || component.exportName === "DialogClose")
          ? {
              family: "Dialog",
              kind: "dialog-as-child",
              part: component.exportName === "DialogTrigger" ? "Trigger" : "Close",
              slots: [{ name: "default", signature: "() => VNode[]" }],
            }
          : groupName === "sheet" &&
              (component.exportName === "SheetTrigger" || component.exportName === "SheetClose")
            ? {
                family: "Sheet",
                kind: "dialog-as-child",
                part: component.exportName === "SheetTrigger" ? "Trigger" : "Close",
                slots: [{ name: "default", signature: "() => VNode[]" }],
              }
            : groupName === "select" && component.exportName === "SelectTrigger"
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
                        signature:
                          "(props: { label: string | null; value: string | null }) => unknown",
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

  if (result.specialization.kind === "dialog-as-child") {
    result.exposedRefs.push({ bridge: "specialized", elementTypes: ["HTMLElement"] });
    result.rootBindings.push({ attribute: "ref", target: "dialog asChild render branches" });
    result.setup.push("defineExpose({ element });");
  }

  if (result.specialization.kind === "alert-dialog-as-child") {
    result.exposedRefs.push({ bridge: "specialized", elementTypes: ["HTMLElement"] });
    result.rootBindings.push({ attribute: "ref", target: "alert dialog render branches" });
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

  if (groupName === "accordion") {
    const part = accordionPart(component.exportName);
    addPrimitiveBinding(component.render, "accordion", part, refBinding());
    result.exposedRefs.push(primitiveRef(part === "Trigger" ? "HTMLButtonElement" : "HTMLElement"));
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "accordion primitive root" });
  }

  if (groupName === "tabs") {
    const part = tabsPart(component.exportName);
    addPrimitiveBinding(component.render, "tabs", part, refBinding());
    result.exposedRefs.push(primitiveRef(part === "Tab" ? "HTMLButtonElement" : "HTMLElement"));
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "tabs primitive root" });
  }

  if (groupName === "slider" && component.exportName === "Slider") {
    addPrimitiveBinding(component.render, "slider", "Root", refBinding());
    addPrimitiveBinding(component.render, "slider", "Thumb", {
      name: "key",
      targetScopes: ["vue"],
      value: { type: "variable", name: "index" },
    });
    result.exposedRefs.push(primitiveRef("HTMLDivElement"));
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "slider primitive root" });
  }

  if (groupName === "input-otp") {
    const part = component.exportName.slice("InputOtp".length) || "Root";
    addPrimitiveBinding(component.render, "input-otp", part, refBinding());
    result.exposedRefs.push(primitiveRef("HTMLDivElement"));
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "input otp primitive root" });
  }

  if (groupName === "dropzone") {
    const part = component.exportName.slice("Dropzone".length) || "Root";
    projectDropzoneNativeAttrs(component.render);
    addPrimitiveBinding(component.render, "dropzone", part, refBinding());
    result.exposedRefs.push(primitiveRef(part === "Root" ? "HTMLLabelElement" : "HTMLDivElement"));
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "dropzone primitive root" });
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

  if (groupName === "carousel" && component.exportName === "Carousel") {
    addPrimitiveBinding(component.render, "carousel", "Root", refBinding());
    result.exposedRefs.push(primitiveRef("HTMLDivElement"));
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "carousel primitive root" });
  }

  if (groupName === "sidebar" && component.exportName === "SidebarProvider") {
    addPrimitiveBinding(component.render, "sidebar", "Provider", refBinding());
    result.exposedRefs.push(primitiveRef("HTMLDivElement"));
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "sidebar provider primitive root" });
  }

  if (groupName === "color-picker" && component.exportName === "ColorPicker") {
    addPrimitiveBinding(component.render, "color-picker", "Root", refBinding());
    result.exposedRefs.push(primitiveRef("HTMLDivElement"));
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "color picker primitive root" });
  }

  if (groupName === "toast" && component.exportName === "Toaster") {
    addPrimitiveBinding(component.render, "toast", "Viewport", refBinding());
    result.exposedRefs.push(primitiveRef("HTMLDivElement"));
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "toast viewport primitive root" });
  }

  if (groupName === "dialog") {
    const part = dialogPart(component.exportName);
    if (part && result.specialization.kind !== "dialog-as-child") {
      addPrimitiveBinding(component.render, "dialog", part, refBinding());
      result.exposedRefs.push(
        primitiveRef(
          part === "Root"
            ? "HTMLDivElement"
            : part === "Popup"
              ? "HTMLDialogElement"
              : part === "Title"
                ? "HTMLHeadingElement"
                : part === "Description"
                  ? "HTMLParagraphElement"
                  : part === "Trigger" || part === "Close"
                    ? "HTMLButtonElement"
                    : "HTMLDivElement",
        ),
      );
      result.imports.push(...primitiveRefImports());
      result.rootBindings.push({ attribute: "ref", target: "dialog primitive root" });
    }
  }

  if (groupName === "field") {
    const target = fieldPrimitiveTarget(component.exportName);
    if (target) {
      addPrimitiveBinding(component.render, target.component, target.part, refBinding());
      result.exposedRefs.push(primitiveRef(target.elementType));
      result.imports.push(...primitiveRefImports());
      result.rootBindings.push({ attribute: "ref", target: "field primitive root" });
    } else {
      const root = findElement(component.render, "div");
      if (root) {
        root.attrs.unshift({ name: "ref", value: { type: "literal", value: "element" } });
        result.exposedRefs.push({ bridge: "element", elementTypes: ["HTMLDivElement"] });
        result.imports.push({ kind: "value", name: "ref" });
        result.rootBindings.push({ attribute: "ref", target: "field styled root" });
      }
    }

    if (component.exportName === "FieldSeparator") {
      result.imports.push({ kind: "value", name: "useSlots" });
      result.setup.push("const hasContent = Boolean(useSlots().default);");
    }
  }

  if (groupName === "sheet") {
    const part = sheetPart(component.exportName);
    if (part && result.specialization.kind !== "dialog-as-child") {
      addPrimitiveBinding(component.render, "drawer", part, refBinding());
      result.exposedRefs.push(
        primitiveRef(
          part === "Root"
            ? "HTMLDivElement"
            : part === "Popup"
              ? "HTMLDialogElement"
              : part === "Title"
                ? "HTMLHeadingElement"
                : part === "Description"
                  ? "HTMLParagraphElement"
                  : "HTMLDivElement",
        ),
      );
      result.imports.push(...primitiveRefImports());
      result.rootBindings.push({ attribute: "ref", target: "sheet primitive root" });
    }
  }

  if (groupName === "alert-dialog") {
    const part = alertDialogPart(component.exportName);
    if (part && result.specialization.kind !== "alert-dialog-as-child") {
      addPrimitiveBinding(component.render, "alert-dialog", part, refBinding());
      result.exposedRefs.push(
        primitiveRef(
          part === "Root"
            ? "HTMLDivElement"
            : part === "Popup"
              ? "HTMLDialogElement"
              : part === "Title"
                ? "HTMLHeadingElement"
                : part === "Description"
                  ? "HTMLParagraphElement"
                  : "HTMLDivElement",
        ),
      );
      result.imports.push(...primitiveRefImports());
      result.rootBindings.push({ attribute: "ref", target: "alert dialog primitive root" });
    }
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

  if (groupName === "switch" && component.exportName === "Switch") {
    mergeAriaLabelIntoAttrs(component.render, "switch", "Root");
  }

  if (groupName === "toggle" && component.exportName === "Toggle") {
    addPrimitiveBinding(component.render, "toggle", "Root", refBinding());
    result.exposedRefs.push({
      bridge: "primitive-element",
      elementTypes: ["HTMLButtonElement", "HTMLSpanElement"],
      primitiveElementType: "HTMLElement",
    });
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "toggle primitive root" });
  }

  if (groupName === "toggle-group" && component.exportName === "ToggleGroup") {
    addPrimitiveBinding(component.render, "toggle-group", "Root", refBinding());
    result.exposedRefs.push(primitiveRef("HTMLDivElement"));
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "toggle group primitive root" });
  }

  if (groupName === "toggle-group" && component.exportName === "ToggleGroupItem") {
    addPrimitiveBinding(component.render, "toggle", "Root", refBinding());
    result.exposedRefs.push({
      bridge: "primitive-element",
      elementTypes: ["HTMLButtonElement", "HTMLSpanElement"],
      primitiveElementType: "HTMLElement",
    });
    result.imports.push(...primitiveRefImports());
    result.rootBindings.push({ attribute: "ref", target: "toggle group item primitive root" });
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

function accordionPart(exportName: string): string {
  if (exportName === "Accordion") return "Root";
  if (exportName === "AccordionContent") return "Panel";
  return exportName.slice("Accordion".length);
}

function tabsPart(exportName: string): string {
  if (exportName === "Tabs") return "Root";
  if (exportName === "TabsContent") return "Panel";
  if (exportName === "TabsTrigger") return "Tab";
  return exportName.slice("Tabs".length);
}

function fieldPrimitiveTarget(
  exportName: string,
): { component: "field" | "fieldset"; elementType: string; part: string } | undefined {
  switch (exportName) {
    case "Field":
      return { component: "field", elementType: "HTMLDivElement", part: "Root" };
    case "FieldControl":
      return { component: "field", elementType: "HTMLInputElement", part: "Control" };
    case "FieldDescription":
      return { component: "field", elementType: "HTMLParagraphElement", part: "Description" };
    case "FieldError":
      return { component: "field", elementType: "HTMLDivElement", part: "Error" };
    case "FieldItem":
      return { component: "field", elementType: "HTMLDivElement", part: "Item" };
    case "FieldLabel":
      return { component: "field", elementType: "HTMLLabelElement", part: "Label" };
    case "FieldLegend":
      return { component: "fieldset", elementType: "HTMLDivElement", part: "Legend" };
    case "FieldSet":
      return { component: "fieldset", elementType: "HTMLFieldSetElement", part: "Root" };
    case "FieldValidity":
      return { component: "field", elementType: "HTMLDivElement", part: "Validity" };
    default:
      return undefined;
  }
}

function scrollAreaPart(exportName: string): string {
  if (exportName === "ScrollArea") return "Root";
  if (exportName === "ScrollBar") return "Scrollbar";
  return exportName.slice("ScrollArea".length);
}

function dialogPart(exportName: string): string | undefined {
  if (exportName === "Dialog") return "Root";
  if (exportName === "DialogTrigger") return "Trigger";
  if (exportName === "DialogContent") return "Popup";
  if (exportName === "DialogTitle") return "Title";
  if (exportName === "DialogDescription") return "Description";
  if (exportName === "DialogClose") return "Close";
  return undefined;
}

function alertDialogPart(exportName: string): string | undefined {
  if (exportName === "AlertDialog") return "Root";
  if (exportName === "AlertDialogContent") return "Popup";
  if (exportName === "AlertDialogTitle") return "Title";
  if (exportName === "AlertDialogDescription") return "Description";
  return undefined;
}

function sheetPart(exportName: string): string | undefined {
  if (exportName === "Sheet") return "Root";
  if (exportName === "SheetContent") return "Popup";
  if (exportName === "SheetTitle") return "Title";
  if (exportName === "SheetDescription") return "Description";
  return undefined;
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

function mergeAriaLabelIntoAttrs(
  nodes: StyledOutputRenderNode[],
  component: string,
  part: string,
): void {
  visitNodes(nodes, (node) => {
    if (node.type !== "primitive" || node.component !== component || node.part !== part) return;

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

function projectDropzoneNativeAttrs(nodes: StyledOutputRenderNode[]): void {
  visitNodes(nodes, (node) => {
    if (node.type !== "primitive" || node.component !== "dropzone") return;

    if (node.part === "Root") {
      node.attrs = node.attrs
        .filter((attribute) => attribute.name !== "id")
        .map((attribute) =>
          attribute.name === "aria-invalid"
            ? {
                name: "spread",
                value: { type: "raw", code: "{ id, 'aria-invalid': ariaInvalid }" },
              }
            : attribute,
        );
      return;
    }

    if (node.part === "Input") {
      node.attrs = node.attrs
        .filter((attribute) => attribute.name !== "aria-invalid")
        .map((attribute) =>
          attribute.name === "spread"
            ? {
                name: "spread",
                value: { type: "raw", code: "{ ...attrs, 'aria-invalid': ariaInvalid }" },
              }
            : attribute,
        );
      return;
    }

    if (node.part === "FilesList") {
      node.attrs = node.attrs
        .filter((attribute) => attribute.name !== "aria-live" && attribute.name !== "aria-label")
        .map((attribute) =>
          attribute.name === "spread"
            ? {
                name: "spread",
                value: {
                  type: "raw",
                  code: "{ 'aria-live': 'polite', 'aria-label': 'Uploaded files', ...attrs }",
                },
              }
            : attribute,
        );
    }
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
