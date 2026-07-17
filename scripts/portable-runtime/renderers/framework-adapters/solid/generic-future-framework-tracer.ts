import {
  formatOptions,
  getEvent,
  getPart,
  getPlanPropDefault,
  getRequiredValue,
  getRootPart,
  getStateModel,
  getStateSetter,
} from "../../generic-adapter-plan/future-framework-tracer-utils.js";
import type {
  GenericAdapterPlan,
  GenericAdapterPlanPart,
  GenericAdapterPlanPrintedFile,
} from "../../generic-adapter-plan/types.js";

export function printGenericFutureFrameworkTracerPlan(
  plan: GenericAdapterPlan,
): GenericAdapterPlanPrintedFile[] {
  if (plan.component === "button") {
    return [
      {
        contents: renderSolidButtonRoot(plan, getRootPart(plan)),
        path: "__future-fixtures/solid/button/ButtonRoot.tsx",
      },
    ];
  }

  if (plan.component === "toggle") {
    return [
      {
        contents: renderSolidToggleRoot(plan, getRootPart(plan)),
        path: "__future-fixtures/solid/toggle/ToggleRoot.tsx",
      },
    ];
  }

  if (plan.component === "collapsible") {
    return [
      {
        contents: renderSolidCollapsibleRoot(plan, getPart(plan, "root")),
        path: "__future-fixtures/solid/collapsible/CollapsibleRoot.tsx",
      },
      {
        contents: renderSolidCollapsibleTrigger(plan, getPart(plan, "trigger")),
        path: "__future-fixtures/solid/collapsible/CollapsibleTrigger.tsx",
      },
      {
        contents: renderSolidCollapsiblePanel(plan, getPart(plan, "panel")),
        path: "__future-fixtures/solid/collapsible/CollapsiblePanel.tsx",
      },
    ];
  }

  throw new Error(`${plan.displayName} does not have a Solid future-framework tracer fixture.`);
}

function renderSolidButtonRoot(plan: GenericAdapterPlan, part: GenericAdapterPlanPart): string {
  const factory = plan.runtime.factory;
  const disabledDefault = getPlanPropDefault(plan, "disabled");
  const focusableWhenDisabledDefault = getPlanPropDefault(plan, "focusableWhenDisabled");

  if (plan.component === "button") {
    return renderConditionalSolidButtonRoot(
      plan,
      part,
      disabledDefault,
      focusableWhenDisabledDefault,
    );
  }

  return `/* Non-shipping future framework tracer fixture. Do not publish, export, register, or copy into demo dependencies. */\nimport { ${factory} } from "${plan.runtime.importSource}";\nimport { mergeProps, onCleanup, onMount, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type ButtonRootProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {\n  disabled?: boolean;\n  focusableWhenDisabled?: boolean;\n  type?: "button" | "submit" | "reset";\n};\n\nexport function ButtonRoot(allProps: ButtonRootProps) {\n  const props = mergeProps(\n    {\n      disabled: ${disabledDefault},\n      focusableWhenDisabled: ${focusableWhenDisabledDefault},\n      type: "button" as const,\n    },\n    allProps,\n  );\n  const [local, rest] = splitProps(props, [\n    "children",\n    "disabled",\n    "focusableWhenDisabled",\n    "type",\n  ]);\n  let root!: HTMLButtonElement;\n\n  onMount(() => {\n    const instance = ${factory}(root, {\n      disabled: local.disabled,\n      focusableWhenDisabled: local.focusableWhenDisabled,\n    });\n\n    onCleanup(() => {\n      instance.destroy();\n    });\n  });\n\n  return (\n    <button\n      ref={root}\n      ${part.discoveryAttribute}\n      aria-disabled={local.disabled && local.focusableWhenDisabled ? "true" : undefined}\n      data-disabled={local.disabled ? "" : undefined}\n      data-focusable-when-disabled={local.focusableWhenDisabled ? "true" : undefined}\n      disabled={local.disabled && !local.focusableWhenDisabled}\n      type={local.type}\n      {...rest}\n    >\n      {local.children}\n    </button>\n  );\n}\n\nexport default ButtonRoot;\n`;
}

function renderConditionalSolidButtonRoot(
  plan: GenericAdapterPlan,
  part: GenericAdapterPlanPart,
  disabledDefault: string,
  focusableWhenDisabledDefault: string,
): string {
  const factory = plan.runtime.factory;

  return `/* Non-shipping future framework tracer fixture. Do not publish, export, register, or copy into demo dependencies. */
import { ${factory} } from "${plan.runtime.importSource}";
import { createEffect, mergeProps, onCleanup, splitProps } from "solid-js";
import type { JSX } from "solid-js";

export type ButtonRootProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  disabled?: boolean;
  focusableWhenDisabled?: boolean;
  type?: "button" | "submit" | "reset";
};

export function ButtonRoot(allProps: ButtonRootProps) {
  const props = mergeProps(
    {
      disabled: ${disabledDefault},
      focusableWhenDisabled: ${focusableWhenDisabledDefault},
      type: "button" as const,
    },
    allProps,
  );
  const [local, rest] = splitProps(props, [
    "children",
    "disabled",
    "focusableWhenDisabled",
    "type",
  ]);
  let root!: HTMLButtonElement;
  let instance: ReturnType<typeof ${factory}> | undefined;

  createEffect(() => {
    if (!local.focusableWhenDisabled) {
      instance?.destroy();
      instance = undefined;
      return;
    }

    instance ??= ${factory}(root, {
      disabled: local.disabled,
    });
  });

  createEffect(() => {
    instance?.setDisabled(local.disabled);
  });

  onCleanup(() => {
    instance?.destroy();
    instance = undefined;
  });

  return (
    <button
      ref={root}
      ${part.discoveryAttribute}
      aria-disabled={local.disabled && local.focusableWhenDisabled ? "true" : undefined}
      data-disabled={local.disabled ? "" : undefined}
      data-focusable-when-disabled={local.focusableWhenDisabled ? "true" : undefined}
      disabled={local.disabled && !local.focusableWhenDisabled}
      type={local.type}
      {...rest}
    >
      {local.children}
    </button>
  );
}

export default ButtonRoot;
`;
}

function renderSolidToggleRoot(plan: GenericAdapterPlan, part: GenericAdapterPlanPart): string {
  const factory = plan.runtime.factory;
  const event = getEvent(plan, "pressedChange");
  const pressedEventDetailsType = getRequiredValue(
    event.detailsType,
    `${plan.displayName} pressedChange event is missing detailsType.`,
  );
  const pressedValueProperty = getRequiredValue(
    event.valueProperty,
    `${plan.displayName} pressedChange event is missing valueProperty.`,
  );
  const defaultPressedDefault = getPlanPropDefault(plan, "defaultPressed");
  const disabledDefault = getPlanPropDefault(plan, "disabled");
  const nativeButtonDefault = getPlanPropDefault(plan, "nativeButton");
  const stateModel = getStateModel(plan, "pressed");
  const runtimeGetter = getRequiredValue(
    stateModel.runtimeGetter,
    `${plan.displayName} pressed state is missing runtimeGetter.`,
  );
  const pressedSetter = getStateSetter(plan, "pressed");

  return `/* Non-shipping future framework tracer fixture. Do not publish, export, register, or copy into demo dependencies. */\nimport { ${factory}, type ${pressedEventDetailsType} } from "${plan.runtime.importSource}";\nimport { createEffect, createSignal, mergeProps, onCleanup, onMount, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { Dynamic } from "solid-js/web";\n\nexport type ToggleRootProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> &\n  JSX.HTMLAttributes<HTMLSpanElement> & {\n    defaultPressed?: boolean;\n    disabled?: boolean;\n    nativeButton?: boolean;\n    onPressedChange?: (pressed: boolean, details: ${pressedEventDetailsType}) => void;\n    pressed?: boolean;\n    syncGroup?: string;\n    value?: string;\n  };\n\nexport function ToggleRoot(allProps: ToggleRootProps) {\n  const props = mergeProps(\n    {\n      defaultPressed: ${defaultPressedDefault},\n      disabled: ${disabledDefault},\n      nativeButton: ${nativeButtonDefault},\n    },\n    allProps,\n  );\n  const [local, rest] = splitProps(props, [\n    "children",\n    "defaultPressed",\n    "disabled",\n    "nativeButton",\n    "onPressedChange",\n    "pressed",\n    "syncGroup",\n    "value",\n  ]);\n  const defaults = { defaultPressed: local.defaultPressed };\n  const [uncontrolledPressed, setUncontrolledPressed] = createSignal(defaults.defaultPressed);\n  const renderedPressed = () => local.pressed ?? uncontrolledPressed();\n  let root!: HTMLButtonElement | HTMLSpanElement;\n  let instance: ReturnType<typeof ${factory}> | undefined;\n\n  onMount(() => {\n    instance = ${factory}(root, {\n      defaultPressed: uncontrolledPressed(),\n      disabled: local.disabled,\n      nativeButton: local.nativeButton,\n      pressed: local.pressed,\n      syncGroup: local.syncGroup,\n      value: local.value,\n    });\n    const unsubscribe = instance.subscribe("${event.name}", (details) => {\n      local.onPressedChange?.(details.${pressedValueProperty}, details);\n      queueMicrotask(() => {\n        if (details.isCanceled) return;\n        if (local.pressed === undefined) {\n          setUncontrolledPressed(details.${pressedValueProperty});\n        }\n      });\n    });\n\n    onCleanup(() => {\n      unsubscribe();\n      instance?.destroy();\n      instance = undefined;\n    });\n  });\n\n  createEffect(() => {\n    const pressed = local.pressed;\n    if (pressed === undefined || !instance) return;\n    if (instance.${runtimeGetter}() === pressed) return;\n\n    instance.${pressedSetter.method}(pressed, ${formatOptions(pressedSetter.options)});\n  });\n\n  createEffect(() => {\n    instance?.setDisabled(local.disabled);\n  });\n\n  return (\n    <Dynamic\n      component={local.nativeButton ? "button" : "span"}\n      ref={root}\n      ${part.discoveryAttribute}\n      aria-disabled={!local.nativeButton && local.disabled ? "true" : undefined}\n      aria-pressed={renderedPressed() ? "true" : "false"}\n      data-default-pressed={local.pressed === undefined && local.defaultPressed ? "true" : undefined}\n      data-disabled={local.disabled ? "" : undefined}\n      data-native={!local.nativeButton ? "false" : undefined}\n      data-pressed={renderedPressed() ? "" : undefined}\n      data-state={renderedPressed() ? "on" : "off"}\n      data-sync-group={local.syncGroup}\n      data-unpressed={!renderedPressed() ? "" : undefined}\n      data-value={local.value}\n      disabled={local.nativeButton && local.disabled ? true : undefined}\n      role={!local.nativeButton ? "button" : undefined}\n      tabIndex={!local.nativeButton ? (local.disabled ? -1 : 0) : undefined}\n      type={local.nativeButton ? "button" : undefined}\n      value={local.nativeButton ? local.value : undefined}\n      {...rest}\n    >\n      {local.children}\n    </Dynamic>\n  );\n}\n\nexport default ToggleRoot;\n`;
}

function renderSolidCollapsibleRoot(
  plan: GenericAdapterPlan,
  part: GenericAdapterPlanPart,
): string {
  const factory = plan.runtime.factory;
  const event = getEvent(plan, "openChange");
  const openEventDetailsType = getRequiredValue(
    event.detailsType,
    `${plan.displayName} openChange event is missing detailsType.`,
  );
  const openValueProperty = getRequiredValue(
    event.valueProperty,
    `${plan.displayName} openChange event is missing valueProperty.`,
  );
  const defaultOpenDefault = getPlanPropDefault(plan, "defaultOpen");
  const disabledDefault = getPlanPropDefault(plan, "disabled");
  const stateModel = getStateModel(plan, "open");
  const runtimeGetter = getRequiredValue(
    stateModel.runtimeGetter,
    `${plan.displayName} open state is missing runtimeGetter.`,
  );
  const openSetter = getStateSetter(plan, "open");

  return `/* Non-shipping future framework tracer fixture. Do not publish, export, register, or copy into demo dependencies. */\nimport { ${factory}, type ${openEventDetailsType} } from "${plan.runtime.importSource}";\nimport { createEffect, createSignal, mergeProps, onCleanup, onMount, splitProps, untrack } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type CollapsibleRootProps = JSX.HTMLAttributes<HTMLDivElement> & {\n  defaultOpen?: boolean;\n  disabled?: boolean;\n  onOpenChange?: (open: boolean, details: ${openEventDetailsType}) => void;\n  open?: boolean;\n};\n\nexport function CollapsibleRoot(allProps: CollapsibleRootProps) {\n  const props = mergeProps(\n    {\n      defaultOpen: ${defaultOpenDefault},\n      disabled: ${disabledDefault},\n    },\n    allProps,\n  );\n  const [local, rest] = splitProps(props, [\n    "children",\n    "defaultOpen",\n    "disabled",\n    "onOpenChange",\n    "open",\n  ]);\n  const defaults = { defaultOpen: local.defaultOpen };\n  const [uncontrolledOpen, setUncontrolledOpen] = createSignal(defaults.defaultOpen);\n  const renderedOpen = () => local.open ?? uncontrolledOpen();\n  let root!: HTMLDivElement;\n  let instance: ReturnType<typeof ${factory}> | undefined;\n  let unsubscribe: (() => void) | undefined;\n\n  function setup() {\n    unsubscribe?.();\n    instance?.destroy();\n    instance = ${factory}(root, {\n      defaultOpen: uncontrolledOpen(),\n      disabled: local.disabled,\n      ...(local.open !== undefined ? { open: local.open } : {}),\n    });\n    unsubscribe = instance.subscribe("${event.name}", (details) => {\n      local.onOpenChange?.(details.${openValueProperty}, details);\n      if (details.isCanceled) return;\n\n      if (local.open === undefined) {\n        setUncontrolledOpen(details.${openValueProperty});\n      }\n    });\n  }\n\n  onMount(() => {\n    setup();\n    onCleanup(() => {\n      unsubscribe?.();\n      instance?.destroy();\n      unsubscribe = undefined;\n      instance = undefined;\n    });\n  });\n\n  createEffect(() => {\n    local.disabled;\n    if (!instance) return;\n    untrack(setup);\n  });\n\n  createEffect(() => {\n    const open = local.open;\n    if (open === undefined || !instance) return;\n    if (instance.${runtimeGetter}() === open) return;\n\n    instance.${openSetter.method}(open, ${formatOptions(openSetter.options)});\n  });\n\n  return (\n    <div\n      ref={root}\n      ${part.discoveryAttribute}\n      data-default-open={local.open === undefined && defaults.defaultOpen ? "true" : undefined}\n      data-disabled={local.disabled ? "" : undefined}\n      data-state={renderedOpen() ? "open" : "closed"}\n      {...rest}\n    >\n      {local.children}\n    </div>\n  );\n}\n\nexport default CollapsibleRoot;\n`;
}

function renderSolidCollapsibleTrigger(
  _plan: GenericAdapterPlan,
  part: GenericAdapterPlanPart,
): string {
  return `/* Non-shipping future framework tracer fixture. Do not publish, export, register, or copy into demo dependencies. */\nimport { mergeProps, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\nimport { Dynamic } from "solid-js/web";\n\nexport type CollapsibleTriggerProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> &\n  JSX.HTMLAttributes<HTMLDivElement> & {\n    asChild?: boolean;\n  };\n\nexport function CollapsibleTrigger(allProps: CollapsibleTriggerProps) {\n  const props = mergeProps({ asChild: false }, allProps);\n  const [local, rest] = splitProps(props, ["asChild", "children"]);\n\n  return (\n    <Dynamic\n      component={local.asChild ? "div" : "button"}\n      ${part.discoveryAttribute}\n      data-as-child={local.asChild ? "" : undefined}\n      aria-expanded=\"false\"\n      data-state=\"closed\"\n      type={local.asChild ? undefined : \"button\"}\n      {...rest}\n    >\n      {local.children}\n    </Dynamic>\n  );\n}\n\nexport default CollapsibleTrigger;\n`;
}

function renderSolidCollapsiblePanel(
  _plan: GenericAdapterPlan,
  part: GenericAdapterPlanPart,
): string {
  return `/* Non-shipping future framework tracer fixture. Do not publish, export, register, or copy into demo dependencies. */\nimport { mergeProps, splitProps } from "solid-js";\nimport type { JSX } from "solid-js";\n\nexport type CollapsiblePanelProps = JSX.HTMLAttributes<HTMLDivElement> & {\n  hiddenUntilFound?: boolean;\n};\n\nexport function CollapsiblePanel(allProps: CollapsiblePanelProps) {\n  const props = mergeProps({ hiddenUntilFound: false }, allProps);\n  const [local, rest] = splitProps(props, ["children", "hiddenUntilFound"]);\n\n  return (\n    <div\n      ${part.discoveryAttribute}\n      data-hidden-until-found={local.hiddenUntilFound ? \"\" : undefined}\n      data-state=\"closed\"\n      hidden={local.hiddenUntilFound ? \"until-found\" : true}\n      {...rest}\n    >\n      {local.children}\n    </div>\n  );\n}\n\nexport default CollapsiblePanel;\n`;
}
