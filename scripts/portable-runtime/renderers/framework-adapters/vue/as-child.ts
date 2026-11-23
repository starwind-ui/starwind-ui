import { createTsHeader } from "../../shared.js";

export function renderVueAsChildHelper(generatedBy: string): string {
  return `${createTsHeader(generatedBy)}import {
  cloneVNode,
  isRef,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  onMounted,
  type ComponentPublicInstance,
  type Ref,
  type VNode,
} from "vue";
import { resolveVueAsChildTarget } from "./as-child-target";

type ComponentRoot = ComponentPublicInstance & {
  element?: unknown;
};

const nativeTargetChangeEvent = "starwind:vue-native-target-change";
const booleanDomAttributes = new Set([
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "hidden",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected",
]);

export type VueAsChildRenderOptions = {
  children: readonly VNode[];
  consumerProps?: Record<string, unknown>;
  defaultedProps?: Record<string, unknown>;
  defaultNativeButtonType?: string;
  protectedProps?: Record<string, unknown>;
};

export function createVueAsChild(name: string, element: Ref<HTMLElement | null>) {
  let lastNativeElement: HTMLElement | null = null;

  function setElement(value: Element | ComponentPublicInstance | null): void {
    if (value === null) {
      element.value = null;
      return;
    }

    const nativeElement = resolveNativeElement(value);
    if (!nativeElement) {
      element.value = null;
      throw new TypeError(
        \`\${name} asChild component must expose an HTMLElement as "element" or render one native HTMLElement root. Rootless and multiple-root components are invalid.\`,
      );
    }
    const previousNativeElement = lastNativeElement;
    lastNativeElement = nativeElement;
    element.value = nativeElement;
    if (previousNativeElement && previousNativeElement !== nativeElement) {
      void nextTick(() => {
        if (lastNativeElement !== nativeElement || !nativeElement.isConnected) return;
        nativeElement.dispatchEvent(
          new Event(nativeTargetChangeEvent, { bubbles: true, composed: true }),
        );
      });
    }
  }

  function render({
    children,
    consumerProps = {},
    defaultedProps = {},
    defaultNativeButtonType,
    protectedProps = {},
  }: VueAsChildRenderOptions): VNode {
    const child = resolveVueAsChildTarget(name, children);
    const nativeButtonDefault =
      defaultNativeButtonType !== undefined &&
      child.type === "button" &&
      child.props?.type === undefined &&
      consumerProps.type === undefined
        ? { type: defaultNativeButtonType }
        : {};

    const mergedProps = mergeProps(
      defaultedProps,
      nativeButtonDefault,
      consumerProps,
      protectedProps,
      {
        ref: setElement,
      },
    );
    // A child that declares its own part keeps it, as in React, unless the part protects its slot.
    const childSlot = child.props?.["data-slot"];
    if (childSlot !== undefined && protectedProps["data-slot"] === undefined) {
      mergedProps["data-slot"] = childSlot;
    }
    return cloneVNode(child, normalizeComponentBooleanAttrs(child, mergedProps), true);
  }

  return { render, setElement } as const;
}

export function useVueAsChildRuntimeOwner(
  root: Ref<HTMLElement | null>,
  recreateRuntime: () => void | Promise<void>,
): void {
  function handleNativeTargetChange(event: Event): void {
    event.stopPropagation();
    void recreateRuntime();
  }

  onMounted(() => root.value?.addEventListener(nativeTargetChangeEvent, handleNativeTargetChange));
  onBeforeUnmount(() =>
    root.value?.removeEventListener(nativeTargetChangeEvent, handleNativeTargetChange),
  );
}

/** True when the slot holds the one child that \`asChild\` can compose. */
export function hasVueAsChildTarget(name: string, children: readonly VNode[]): boolean {
  try {
    resolveVueAsChildTarget(name, children);
    return true;
  } catch {
    return false;
  }
}

function normalizeComponentBooleanAttrs(
  child: VNode,
  props: Record<string, unknown>,
): Record<string, unknown> {
  if (typeof child.type === "string") return props;

  const normalized = { ...props };
  for (const [key, value] of Object.entries(props)) {
    if (
      value === false &&
      booleanDomAttributes.has(normalizePropName(key)) &&
      !componentDeclaresProp(child.type, key)
    ) {
      normalized[key] = undefined;
    }
  }
  return normalized;
}

function componentDeclaresProp(type: VNode["type"], key: string): boolean {
  if ((typeof type !== "object" && typeof type !== "function") || type === null) return false;

  const declared = (type as { props?: readonly string[] | Record<string, unknown> }).props;
  if (Array.isArray(declared)) {
    return declared.some((name) => normalizePropName(name) === normalizePropName(key));
  }
  return Boolean(
    declared &&
      Object.keys(declared).some((name) => normalizePropName(name) === normalizePropName(key)),
  );
}

function normalizePropName(name: string): string {
  return name.replaceAll("-", "").toLowerCase();
}

function resolveNativeElement(value: Element | ComponentPublicInstance): HTMLElement | null {
  if (value instanceof HTMLElement) return value;

  const component = value as ComponentRoot;
  const exposedElement = isRef(component.element) ? component.element.value : component.element;
  if (exposedElement instanceof HTMLElement) return exposedElement;

  const publicRoot = component.$el;
  return publicRoot instanceof HTMLElement ? publicRoot : null;
}
`;
}
