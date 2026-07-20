import { describe, expect, it } from "vitest";

import {
  buttonRuntimeAdapterContract,
  collapsibleRuntimeAdapterContract,
  progressRuntimeAdapterContract,
  toggleRuntimeAdapterContract,
} from "../contracts/primitive/representatives.js";
import {
  buildGenericAdapterPlan,
  genericAdapterFutureFrameworkTracerClassifications,
  printFutureFrameworkTracerPlan,
} from "../renderers/generic-adapter-plan/index.js";

describe("GenericAdapterPlan future framework tracer printers", () => {
  it("prints deterministic unsupported-only Vue Toggle contract evidence", () => {
    const buttonPlan = buildGenericAdapterPlan(buttonRuntimeAdapterContract);
    const togglePlan = buildGenericAdapterPlan(toggleRuntimeAdapterContract);
    const firstRun = printFutureFrameworkTracerPlan("vue", togglePlan);
    const secondRun = printFutureFrameworkTracerPlan("vue", togglePlan);

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/vue/toggle/ToggleRoot.vue",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Unsupported, non-normative"))).toBe(
      true,
    );
    expect(() => printFutureFrameworkTracerPlan("vue", buttonPlan)).toThrow(
      "Button does not have a Vue future-framework tracer fixture.",
    );
    const toggleRoot = firstRun.find((file) => file.path.endsWith("ToggleRoot.vue"))?.contents;

    expect(toggleRoot).toContain("defineEmits<{");
    expect(toggleRoot).toContain(
      "pressedChange: [pressed: boolean, details: TogglePressedChangeDetails];",
    );
    expect(toggleRoot).toContain('"update:pressed": [pressed: boolean];');
    expect(toggleRoot).toContain('emit("pressedChange", details.pressed, details);');
    expect(toggleRoot).toContain("if (details.isCanceled) return;");
    expect(toggleRoot).toContain("if (props.pressed === undefined) {");
    expect(toggleRoot).toContain('emit("update:pressed", details.pressed);');
    expect(toggleRoot).not.toContain("queueMicrotask");
    expect(toggleRoot).toContain("const renderedPressed = computed(() =>");
    expect(toggleRoot).toContain("createToggle(root.value, {");
    expect(toggleRoot).toContain("instance.setPressed(pressed, { emit: false, sync: true });");
    expect(toggleRoot).toContain("<component");
    expect(toggleRoot).toContain(":is=\"props.nativeButton ? 'button' : 'span'\"");
  });

  it("prints deterministic non-shipping Solid TSX tracer fixtures for Button and Toggle", () => {
    const buttonPlan = buildGenericAdapterPlan(buttonRuntimeAdapterContract);
    const togglePlan = buildGenericAdapterPlan(toggleRuntimeAdapterContract);
    const firstRun = [
      ...printFutureFrameworkTracerPlan("solid", buttonPlan),
      ...printFutureFrameworkTracerPlan("solid", togglePlan),
    ];
    const secondRun = [
      ...printFutureFrameworkTracerPlan("solid", buttonPlan),
      ...printFutureFrameworkTracerPlan("solid", togglePlan),
    ];

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/solid/button/ButtonRoot.tsx",
      "__future-fixtures/solid/toggle/ToggleRoot.tsx",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Non-shipping"))).toBe(true);

    const buttonRoot = firstRun.find((file) => file.path.endsWith("ButtonRoot.tsx"))?.contents;
    const toggleRoot = firstRun.find((file) => file.path.endsWith("ToggleRoot.tsx"))?.contents;

    expect(buttonRoot).toContain("import { createEffect, mergeProps, onCleanup, splitProps }");
    expect(buttonRoot).toContain("export type ButtonRootProps =");
    expect(buttonRoot).toContain("if (!local.focusableWhenDisabled)");
    expect(buttonRoot).toContain("instance ??= createButton(root, {");
    expect(buttonRoot).not.toContain("focusableWhenDisabled: local.focusableWhenDisabled");
    expect(buttonRoot).toContain("instance?.setDisabled(local.disabled);");
    expect(buttonRoot).toContain("data-sw-button");
    expect(buttonRoot).toContain("{local.children}");

    expect(toggleRoot).toContain('import { Dynamic } from "solid-js/web";');
    expect(toggleRoot).toContain("createSignal(defaults.defaultPressed)");
    expect(toggleRoot).toContain("const renderedPressed = () =>");
    expect(toggleRoot).toContain("instance = createToggle(root, {");
    expect(toggleRoot).toContain("local.onPressedChange?.(details.pressed, details);");
    expect(toggleRoot).toContain("instance.setPressed(pressed, { emit: false, sync: true });");
    expect(toggleRoot).toContain("<Dynamic");
  });

  it("prints deterministic unsupported-only Vue Collapsible contract evidence", () => {
    const plan = buildGenericAdapterPlan(collapsibleRuntimeAdapterContract);
    const firstRun = printFutureFrameworkTracerPlan("vue", plan);
    const secondRun = printFutureFrameworkTracerPlan("vue", plan);

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/vue/collapsible/CollapsibleRoot.vue",
      "__future-fixtures/vue/collapsible/CollapsibleTrigger.vue",
      "__future-fixtures/vue/collapsible/CollapsiblePanel.vue",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Unsupported, non-normative"))).toBe(
      true,
    );

    const root = firstRun.find((file) => file.path.endsWith("CollapsibleRoot.vue"))?.contents;
    const trigger = firstRun.find((file) => file.path.endsWith("CollapsibleTrigger.vue"))?.contents;
    const panel = firstRun.find((file) => file.path.endsWith("CollapsiblePanel.vue"))?.contents;

    expect(root).toContain("type CollapsibleOpenChangeDetails");
    expect(root).toContain("const renderedOpen = computed(() =>");
    expect(root).toContain("createCollapsible(root.value, {");
    expect(root).toContain('emit("openChange", details.open, details);');
    expect(root).toContain('"update:open": [open: boolean]');
    expect(root).toContain("if (details.isCanceled) return;");
    expect(root).toContain("if (props.open === undefined) {");
    expect(root).toContain('emit("update:open", details.open);');
    expect(root).not.toContain("queueMicrotask");
    expect(root).toContain("instance.setOpen(open, { emit: false });");
    expect(root).toContain(":data-state=\"renderedOpen ? 'open' : 'closed'\"");

    expect(trigger).toContain("asChild?: boolean");
    expect(trigger).toContain("const AsChildTrigger = defineComponent({");
    expect(trigger).toContain("return cloneVNode(child, mergeProps(");
    expect(trigger).toContain('<AsChildTrigger v-if="props.asChild">');
    expect(trigger).toContain("defineExpose({ element });");
    expect(trigger).toContain("data-sw-collapsible-trigger");

    expect(panel).toContain("hiddenUntilFound?: boolean");
    expect(panel).toContain(":hidden=\"props.hiddenUntilFound ? 'until-found' : true\"");
    expect(panel).toContain("defineExpose({ element });");
    expect(panel).toContain("data-sw-collapsible-panel");
  });

  it("prints deterministic non-shipping Solid TSX tracer fixtures for Collapsible", () => {
    const plan = buildGenericAdapterPlan(collapsibleRuntimeAdapterContract);
    const firstRun = printFutureFrameworkTracerPlan("solid", plan);
    const secondRun = printFutureFrameworkTracerPlan("solid", plan);

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/solid/collapsible/CollapsibleRoot.tsx",
      "__future-fixtures/solid/collapsible/CollapsibleTrigger.tsx",
      "__future-fixtures/solid/collapsible/CollapsiblePanel.tsx",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Non-shipping"))).toBe(true);

    const root = firstRun.find((file) => file.path.endsWith("CollapsibleRoot.tsx"))?.contents;
    const trigger = firstRun.find((file) => file.path.endsWith("CollapsibleTrigger.tsx"))?.contents;
    const panel = firstRun.find((file) => file.path.endsWith("CollapsiblePanel.tsx"))?.contents;

    expect(root).toContain("type CollapsibleOpenChangeDetails");
    expect(root).toContain("const [uncontrolledOpen, setUncontrolledOpen]");
    expect(root).toContain("instance = createCollapsible(root, {");
    expect(root).toContain("local.onOpenChange?.(details.open, details);");
    expect(root).toContain("instance.setOpen(open, { emit: false });");
    expect(root).toContain("untrack(setup);");
    expect(root).toContain('data-state={renderedOpen() ? "open" : "closed"}');

    expect(trigger).toContain("asChild?: boolean");
    expect(trigger).toContain("<Dynamic");
    expect(trigger).toContain('component={local.asChild ? "div" : "button"}');
    expect(trigger).toContain("data-sw-collapsible-trigger");

    expect(panel).toContain("hiddenUntilFound?: boolean");
    expect(panel).toContain('hidden={local.hiddenUntilFound ? "until-found" : true}');
    expect(panel).toContain("data-sw-collapsible-panel");
  });

  it("records future tracer fixtures separately from shipping primitive classifications", () => {
    expect(genericAdapterFutureFrameworkTracerClassifications).toEqual([
      {
        component: "toggle/vue",
        reason:
          "Unsupported, non-normative Vue SFC tracer evidence for the Toggle boolean-control generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "collapsible/vue",
        reason:
          "Unsupported, non-normative Vue SFC tracer evidence for the Collapsible disclosure/presence generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "menu/vue",
        reason:
          "Unsupported, non-normative Vue SFC tracer evidence for the Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "navigation-menu/vue",
        reason:
          "Unsupported, non-normative Vue SFC tracer evidence for the Navigation Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "combobox/vue",
        reason:
          "Unsupported, non-normative Vue SFC tracer evidence for the Combobox Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "button/solid",
        reason:
          "Non-shipping Solid TSX tracer fixture for the Button generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "toggle/solid",
        reason:
          "Non-shipping Solid TSX tracer fixture for the Toggle boolean-control generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "collapsible/solid",
        reason:
          "Non-shipping Solid TSX tracer fixture for the Collapsible disclosure/presence generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "select/solid",
        reason:
          "Non-shipping Solid TSX tracer fixture for the Select Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "menu/solid",
        reason:
          "Non-shipping Solid TSX tracer fixture for the Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "navigation-menu/solid",
        reason:
          "Non-shipping Solid TSX tracer fixture for the Navigation Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "combobox/solid",
        reason:
          "Non-shipping Solid TSX tracer fixture for the Combobox Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
    ]);
  });

  it("fails loudly for primitive plans outside the non-shipping tracer scope", () => {
    const plan = buildGenericAdapterPlan(progressRuntimeAdapterContract);

    expect(() => printFutureFrameworkTracerPlan("vue", plan)).toThrow(
      "Progress does not have a Vue future-framework tracer fixture.",
    );
    expect(() => printFutureFrameworkTracerPlan("solid", plan)).toThrow(
      "Progress does not have a Solid future-framework tracer fixture.",
    );
  });
});
