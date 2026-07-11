import { describe, expect, it } from "vitest";

import {
  buttonRuntimeAdapterContract,
  checkboxRuntimeAdapterContract,
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
  it("prints deterministic non-shipping Vue SFC tracer fixtures for Button and Toggle", () => {
    const buttonPlan = buildGenericAdapterPlan(buttonRuntimeAdapterContract);
    const togglePlan = buildGenericAdapterPlan(toggleRuntimeAdapterContract);
    const firstRun = [
      ...printFutureFrameworkTracerPlan("vue", buttonPlan),
      ...printFutureFrameworkTracerPlan("vue", togglePlan),
    ];
    const secondRun = [
      ...printFutureFrameworkTracerPlan("vue", buttonPlan),
      ...printFutureFrameworkTracerPlan("vue", togglePlan),
    ];

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/vue/button/ButtonRoot.vue",
      "__future-fixtures/vue/toggle/ToggleRoot.vue",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Non-shipping"))).toBe(true);

    const buttonRoot = firstRun.find((file) => file.path.endsWith("ButtonRoot.vue"))?.contents;
    const toggleRoot = firstRun.find((file) => file.path.endsWith("ToggleRoot.vue"))?.contents;

    expect(buttonRoot).toContain('<script setup lang="ts">');
    expect(buttonRoot).toContain("const props = withDefaults(\n  defineProps<");
    expect(buttonRoot).toContain("onMounted(() => {");
    expect(buttonRoot).toContain("createButton(root.value, {");
    expect(buttonRoot).toContain(":data-disabled=\"props.disabled ? '' : undefined\"");
    expect(buttonRoot).toContain("<slot />");

    expect(toggleRoot).toContain("defineEmits<{");
    expect(toggleRoot).toContain(
      "pressedChange: [pressed: boolean, details: TogglePressedChangeDetails];",
    );
    expect(toggleRoot).toContain("const renderedPressed = computed(() =>");
    expect(toggleRoot).toContain("createToggle(root.value, {");
    expect(toggleRoot).toContain("instance.setPressed(pressed, { emit: false, sync: true });");
    expect(toggleRoot).toContain("<component");
    expect(toggleRoot).toContain(":is=\"props.nativeButton ? 'button' : 'span'\"");
  });

  it("prints a deterministic non-shipping Vue Checkbox form-participation fixture", () => {
    const plan = buildGenericAdapterPlan(checkboxRuntimeAdapterContract);
    const firstRun = printFutureFrameworkTracerPlan("vue", plan);
    const secondRun = printFutureFrameworkTracerPlan("vue", plan);

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/vue/checkbox/CheckboxRoot.vue",
      "__future-fixtures/vue/checkbox/CheckboxIndicator.vue",
      "__future-fixtures/vue/checkbox/index.ts",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Non-shipping"))).toBe(true);

    const root = firstRun.find((file) => file.path.endsWith("CheckboxRoot.vue"))?.contents;
    const indicator = firstRun.find((file) =>
      file.path.endsWith("CheckboxIndicator.vue"),
    )?.contents;

    expect(root).toContain("type CheckboxCheckedChangeDetails");
    expect(root).toContain(
      "checkedChange: [checked: boolean, details: CheckboxCheckedChangeDetails];",
    );
    expect(root).toContain("const renderedChecked = computed(() =>");
    expect(root).toContain("createCheckbox(root.value, {");
    expect(root).toContain('instance.subscribe("checkedChange"');
    expect(root).toContain('emit("checkedChange", details.checked, details);');
    expect(root).toContain("instance.setChecked(checked, { emit: false });");
    expect(root).toContain("instance?.setDisabled(disabled);");
    expect(root).toContain(
      "() => [props.form, props.id, props.name, props.required, props.uncheckedValue, props.value] as const",
    );
    expect(root).toContain("const checked = instance?.getChecked();");
    expect(root).not.toContain(
      'uncontrolledChecked.value = root.value.getAttribute("aria-checked") === "true";',
    );
    expect(root).toContain("data-sw-checkbox-input");
    expect(root).toContain(':name="props.name"');
    expect(root).toContain(':form="props.form"');
    expect(root).toContain(':required="props.required"');
    expect(root).toContain(":value=\"props.value ?? 'on'\"");
    expect(root).toContain('v-bind="$attrs"');
    expect(indicator).toContain("data-sw-checkbox-indicator");
    expect(indicator).toContain("keepMounted?: boolean");
    expect(indicator).toContain('ref="indicator"');
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

    expect(buttonRoot).toContain("import { mergeProps, onCleanup, onMount, splitProps }");
    expect(buttonRoot).toContain("export type ButtonRootProps =");
    expect(buttonRoot).toContain("const instance = createButton(root, {");
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

  it("prints deterministic non-shipping Vue SFC tracer fixtures for Collapsible", () => {
    const plan = buildGenericAdapterPlan(collapsibleRuntimeAdapterContract);
    const firstRun = printFutureFrameworkTracerPlan("vue", plan);
    const secondRun = printFutureFrameworkTracerPlan("vue", plan);

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual([
      "__future-fixtures/vue/collapsible/CollapsibleRoot.vue",
      "__future-fixtures/vue/collapsible/CollapsibleTrigger.vue",
      "__future-fixtures/vue/collapsible/CollapsiblePanel.vue",
    ]);
    expect(firstRun.every((file) => file.contents.includes("Non-shipping"))).toBe(true);

    const root = firstRun.find((file) => file.path.endsWith("CollapsibleRoot.vue"))?.contents;
    const trigger = firstRun.find((file) => file.path.endsWith("CollapsibleTrigger.vue"))?.contents;
    const panel = firstRun.find((file) => file.path.endsWith("CollapsiblePanel.vue"))?.contents;

    expect(root).toContain("type CollapsibleOpenChangeDetails");
    expect(root).toContain("const renderedOpen = computed(() =>");
    expect(root).toContain("createCollapsible(root.value, {");
    expect(root).toContain('emit("openChange", details.open, details);');
    expect(root).toContain("instance.setOpen(open, { emit: false });");
    expect(root).toContain(":data-state=\"renderedOpen ? 'open' : 'closed'\"");

    expect(trigger).toContain("asChild?: boolean");
    expect(trigger).toContain(":is=\"props.asChild ? 'div' : 'button'\"");
    expect(trigger).toContain("data-sw-collapsible-trigger");

    expect(panel).toContain("hiddenUntilFound?: boolean");
    expect(panel).toContain(":hidden=\"props.hiddenUntilFound ? 'until-found' : true\"");
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
        component: "button/vue",
        reason:
          "Non-shipping Vue SFC tracer fixture for the Button generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "toggle/vue",
        reason:
          "Non-shipping Vue SFC tracer fixture for the Toggle boolean-control generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "collapsible/vue",
        reason:
          "Non-shipping Vue SFC tracer fixture for the Collapsible disclosure/presence generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "checkbox/vue",
        reason:
          "Non-shipping Vue SFC tracer fixture for the Checkbox boolean form-control Adapter Family Plan; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "select/vue",
        reason:
          "Non-shipping Vue SFC tracer fixture for the Select Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "menu/vue",
        reason:
          "Non-shipping Vue SFC tracer fixture for the Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "navigation-menu/vue",
        reason:
          "Non-shipping Vue SFC tracer fixture for the Navigation Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
        strategy: "future-framework-tracer",
      },
      {
        component: "combobox/vue",
        reason:
          "Non-shipping Vue SFC tracer fixture for the Combobox Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
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
