import type { StyledOutputComponent } from "../../../styled-output-model/index.js";

type NativeOverlayControl = {
  component: "alert-dialog" | "dialog" | "drawer";
  part: "Close" | "Trigger";
  slot: string;
};

const nativeOverlayControls: Record<string, NativeOverlayControl> = {
  AlertDialogTrigger: {
    component: "alert-dialog",
    part: "Trigger",
    slot: "alert-dialog-trigger",
  },
  DialogClose: { component: "dialog", part: "Close", slot: "dialog-close" },
  DialogTrigger: { component: "dialog", part: "Trigger", slot: "dialog-trigger" },
  SheetClose: { component: "drawer", part: "Close", slot: "sheet-close" },
  SheetTrigger: { component: "drawer", part: "Trigger", slot: "sheet-trigger" },
};

export function projectNativeOverlayControl(
  component: StyledOutputComponent,
): StyledOutputComponent {
  const control = nativeOverlayControls[component.exportName];
  if (control) return projectDirectControl(component, control);
  if (component.exportName === "AlertDialogAction") {
    return projectAlertDialogButtonControl(component, "Action");
  }
  if (component.exportName === "AlertDialogCancel") {
    return projectAlertDialogButtonControl(component, "Cancel");
  }
  return component;
}

export function isAlertDialogButtonControl(component: StyledOutputComponent): boolean {
  return (
    component.exportName === "AlertDialogAction" || component.exportName === "AlertDialogCancel"
  );
}

export function renderAlertDialogButtonControlSetup(component: StyledOutputComponent): string {
  if (!isAlertDialogButtonControl(component)) return "";

  return `const consumerRef = (props as { ref?: React.Ref<HTMLElement> }).ref;
const { controlKey, setControlElement } = __useAlertDialogControl({
  asChild,
  children,
  forwardedRef: consumerRef,
});
const asChildRest = rest as unknown as React.HTMLAttributes<HTMLDivElement>;`;
}

function projectDirectControl(
  component: StyledOutputComponent,
  control: NativeOverlayControl,
): StyledOutputComponent {
  const projected = structuredClone(component);
  const isTrigger = control.part === "Trigger";
  const className = isTrigger ? "triggerClassName" : "closeClassName";
  projected.render = [
    {
      attrs: [
        { name: "asChild", value: { name: "asChild", type: "variable" } },
        { name: "class", value: { name: className, type: "variable" } },
        ...(isTrigger
          ? [{ name: "targetId", value: { name: "targetId", type: "variable" } } as const]
          : []),
        { name: "spread", value: { name: "rest", type: "variable" } },
        { name: "data-slot", value: { type: "literal", value: control.slot } },
      ],
      children: [
        isTrigger
          ? { fallback: [], type: "slot" }
          : { fallback: [{ type: "text", value: "Close" }], type: "slot" },
      ],
      component: control.component,
      part: control.part,
      selfClosing: false,
      type: "primitive",
    },
  ];
  return projected;
}

function projectAlertDialogButtonControl(
  component: StyledOutputComponent,
  kind: "Action" | "Cancel",
): StyledOutputComponent {
  const projected = structuredClone(component);
  const lowerKind = kind.toLowerCase();
  const variant = `alertDialog${kind}`;
  const asChildVariant = `${variant}AsChild`;
  const slot = `alert-dialog-${lowerKind}`;
  projected.render = [
    {
      condition: "asChild",
      else: [
        {
          attrs: [
            { name: "variant", value: { name: "variant", type: "variable" } },
            { name: "size", value: { name: "size", type: "variable" } },
            {
              name: "class",
              value: {
                args: { class: "className" },
                type: "class-variant",
                variant,
              },
            },
            { name: "spread", value: { name: "rest", type: "variable" } },
            { name: "data-slot", value: { type: "literal", value: slot } },
            { name: "data-sw-alert-dialog-close" },
            { name: "ref", value: { name: "setControlElement", type: "variable" } },
          ],
          children: [{ fallback: [], type: "slot" }],
          component: "button",
          exportName: "Button",
          selfClosing: false,
          type: "component",
        },
      ],
      then: [
        {
          attrs: [
            {
              name: "class",
              value: {
                args: { class: "className", size: "size", variant: "variant" },
                type: "class-variant",
                variant: asChildVariant,
              },
            },
            { name: "data-as-child" },
            { name: "spread", value: { name: "asChildRest", type: "variable" } },
            { name: "data-slot", value: { type: "literal", value: slot } },
            { name: "data-sw-alert-dialog-close" },
            { name: "key", value: { name: "controlKey", type: "variable" } },
            { name: "ref", value: { name: "setControlElement", type: "variable" } },
          ],
          children: [{ fallback: [], type: "slot" }],
          comments: [],
          tag: "div",
          selfClosing: false,
          type: "element",
        },
      ],
      type: "condition",
    },
  ];
  return projected;
}
