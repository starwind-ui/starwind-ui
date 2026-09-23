import type { AdapterColorPickerFacts } from "../../primitive-output-model/color-picker.js";
import { requireColorPickerModelOwnership } from "../../primitive-output-model/color-picker.js";

/** Generation-only ColorPicker policy. Runtime owns color state, parsing, interaction and forms. */
export const colorPickerConnectionPolicy = {
  updateOrder: ["refresh", "options", "models", "observe"] as readonly (
    | "refresh"
    | "options"
    | "models"
    | "observe"
  )[],
};

export function colorPickerLiveOptions(f: AdapterColorPickerFacts): string[] {
  return f.runtime.optionProps.filter(
    (name) => f.optionLifecycles[name] === "setter-backed" && !["value", "format"].includes(name),
  );
}

export function printColorPickerConnection(f: AdapterColorPickerFacts): string {
  requireColorPickerModelOwnership(Object.values(f.controlledness.states));
  if (
    !f.controlledness.refreshBeforeSync ||
    !f.events.valueChange.cancelable ||
    f.events.valueChange.callbackTiming !== "before-state-commit" ||
    f.events.formatChange.callbackTiming !== "after-state-commit"
  )
    throw new Error(
      "ColorPicker requires refresh-before-sync and distinct proposal/accepted event phases.",
    );
  if (
    f.form.soleSubmissionPart !== "hiddenInput" ||
    !f.form.fieldIntegration ||
    f.controlledness.states.value.runtimeSyncEvent !==
      f.controlledness.states.format.runtimeSyncEvent
  )
    throw new Error(
      "ColorPicker requires one Runtime submission part and one reset settlement event.",
    );
  const value = f.controlledness.states.value,
    format = f.controlledness.states.format;
  const live = colorPickerLiveOptions(f);
  const nullable = new Set(["name", "form", "locale", "dir"]);
  const option = (name: string) =>
    `next.${name}${nullable.has(name) ? " ?? null" : f.props[name]?.type === "boolean" ? ` ?? ${f.props[name].defaultValue ?? "false"}` : ""}`;
  const options = f.setters
    .filter((setter) => !setter.stateModel)
    .map((setter) =>
      setter.prop
        ? `if (!Object.is(next.${setter.prop}, applied.${setter.prop})) owner.${setter.method}(${option(setter.prop)});`
        : `owner.${setter.method}({ ${setter.props!.map((name) => `${name}: ${option(name)}`).join(", ")} });`,
    )
    .join("\n");
  const updateSteps = {
    refresh: "if (refresh) owner.refresh({ preserveState: true });",
    options: "applyOptions(next);",
    models: "syncModels(next);",
    observe: `observedValue = owner.${value.runtimeGetter}(); observedFormat = owner.${format.runtimeGetter}();
    transport.observe(observedValue, observedFormat);`,
  };
  return `type ColorPickerConnectionTransport = {
  seed: Pick<ColorPickerOptions, "value" | "defaultValue" | "format">;
  read(): ColorPickerOptions;
  restoreAuthoredOwnership?(): void;
  captureAuthoredOwnership?(): void;
  own?(instance: ReturnType<typeof ${f.runtime.factory}> | undefined): void;
  observe(value: ColorPickerColor | null, format: ColorPickerFormat): void;
  publishValue?(value: ColorPickerColor | null): void;
  publishFormat?(format: ColorPickerFormat): void;
  afterUpdate(run: () => void): void;
};

function connectColorPicker(root: HTMLElement, transport: ColorPickerConnectionTransport) {
  const valueControlled = transport.seed.value !== undefined;
  const formatControlled = transport.seed.format !== undefined;
  let controlledValue = transport.seed.value;
  let controlledFormat = transport.seed.format;
  let active = true;
  let pending = false;
  let applied = transport.read();
  transport.restoreAuthoredOwnership?.();
  transport.captureAuthoredOwnership?.();
  const initialOptions = { ...applied, ...transport.seed };
  // Runtime captures value ownership from property presence at construction.
  if (!valueControlled) delete initialOptions.value;
  const owner = ${f.runtime.factory}(root, {
    ...initialOptions,
    ${f.events.valueChange.callbackProp}(next, details) {
      transport.read().${f.events.valueChange.callbackProp}?.(next, details);
      afterUpdate();
    },
    ${f.events.valueCommitted.callbackProp}(next, details) {
      transport.read().${f.events.valueCommitted.callbackProp}?.(next, details);
    },
    ${f.events.formatChange.callbackProp}(next, details) {
      transport.read().${f.events.formatChange.callbackProp}?.(next, details);
    },
  });
  transport.own?.(owner);
  // Keep the last valid command, including when later input is undefined.
  if (valueControlled) controlledValue = owner.${value.runtimeGetter}();
  if (formatControlled) controlledFormat = owner.${format.runtimeGetter}();
  let observedValue = owner.${value.runtimeGetter}();
  let observedFormat = owner.${format.runtimeGetter}();

  function sameValue(left: ColorPickerValue | undefined, right: ColorPickerValue | undefined): boolean {
    return Object.is(left, right) || (typeof left === "object" && left !== null && typeof right === "object" && right !== null && left.equals(right));
  }
  function syncModels(next: ColorPickerOptions): void {
    if (valueControlled) {
      const parsed = next.value === null ? (next.allowEmpty ? null : undefined) : typeof next.value === "string" ? parseColor(next.value) ?? undefined : next.value;
      if (parsed !== undefined) controlledValue = parsed;
      if (controlledValue !== undefined && !sameValue(owner.${value.runtimeGetter}(), controlledValue)) owner.${value.runtimeSetter}(controlledValue, { emit: false });
    }
    if (formatControlled) {
      if (next.format !== undefined) controlledFormat = next.format;
      if (controlledFormat !== undefined && owner.${format.runtimeGetter}() !== controlledFormat) owner.${format.runtimeSetter}(controlledFormat, { emit: false });
    }
  }
  function applyOptions(next: ColorPickerOptions): void {
    if (${live.map((name) => `Object.is(next.${name}, applied.${name})`).join(" && ")}) return;
    ${options}
    applied = next;
  }
  function update(refresh = true): void {
    if (!active) return;
    const next = transport.read();
    ${colorPickerConnectionPolicy.updateOrder.map((step) => updateSteps[step]).join("\n")}
  }
  function afterUpdate(): void {
    if (pending || !active) return;
    pending = true;
    transport.afterUpdate(() => { pending = false; update(); });
  }
  const unsubscribeValue = owner.subscribe("${f.events.valueChange.name}", details => {
    if (!active) return;
    transport.publishValue?.(details.${f.events.valueChange.valueProperty});
    afterUpdate();
  });
  const unsubscribeFormat = owner.subscribe("${f.events.formatChange.name}", details => {
    if (!active) return;
    transport.publishFormat?.(details.${f.events.formatChange.valueProperty});
    afterUpdate();
  });
  const unsubscribeReset = owner.subscribe("${value.runtimeSyncEvent}", () => {
    const previousValue = observedValue, previousFormat = observedFormat;
    update();
    if (!valueControlled && !sameValue(previousValue, observedValue)) transport.publishValue?.(observedValue);
    if (!formatControlled && previousFormat !== observedFormat) transport.publishFormat?.(observedFormat);
  });
  update();
  return {
    update,
    destroy() {
      active = false;
      unsubscribeReset(); unsubscribeFormat(); unsubscribeValue();
      transport.own?.(undefined);
      owner.destroy();
    },
  };
}
`;
}
