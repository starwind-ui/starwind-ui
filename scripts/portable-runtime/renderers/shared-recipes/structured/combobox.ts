import { comboboxOperations } from "./combobox-operations.js";
import type { Target } from "./operations.js";
export const comboboxPlan = {
  component: "Combobox",
  channels: [
    {
      name: "value",
      type: "string | null",
      getter: "getValue",
      setter: "setValue",
      event: "valueChange",
      callback: "onValueChange",
      default: "defaultValue",
    },
    {
      name: "inputValue",
      type: "string",
      getter: "getInputValue",
      setter: "setInputValue",
      event: "inputValueChange",
      callback: "onInputValueChange",
      default: "defaultInputValue",
    },
    {
      name: "open",
      type: "boolean",
      getter: "getOpen",
      setter: "setOpen",
      event: "openChange",
      callback: "onOpenChange",
      default: "defaultOpen",
    },
  ],
  constructorInputs: [
    "autoComplete",
    "disabled",
    "filterMode",
    "form",
    "highlightItemOnHover",
    "locale",
    "modal",
    "name",
    "readOnly",
    "required",
  ],
  constructorOnlyInputs: ["filterMode", "highlightItemOnHover", "locale", "modal", "readOnly"],
  requiredParts: ["input", "popup"],
  optionUpdates: [
    { setter: "setDisabled", inputs: ["disabled"], restoreOpen: true },
    {
      setter: "setFormOptions",
      inputs: ["autoComplete", "form", "name", "required"],
      bindReset: true,
    },
  ],
  inputCommandsFilter: false,
  selectedLabelIsFilter: false,
  parentCommandsEmit: false,
} as const;
const upper = (name: string) => name[0]!.toUpperCase() + name.slice(1);
type Channel = (typeof comboboxPlan.channels)[number];
export function comboboxFragments(target: Target) {
  const p = comboboxPlan,
    s = comboboxOperations[target];
  const instance = target === "vue" ? "created" : "instance";
  const render = (c: Channel, value: string) =>
    s.fw.modelAuthority === "parent-prop"
      ? `if (${s.input(c.name)} === undefined) { ${s.render(c, value)} }`
      : s.render(c, value);
  const publish = (c: Channel, value: string) => s.publish(c, value);
  const canUpdate = (c: Channel) =>
    s.fw.modelAuthority === "runtime-binding" ? "true" : `${s.input(c.name)} === undefined`;
  const set = (c: Channel, next: string, owner = instance) =>
    `if (${owner}.${c.getter}() !== ${next}) ${owner}.${c.setter}(${next}, { emit: ${p.parentCommandsEmit}${c.name === "inputValue" ? `, filter: ${p.inputCommandsFilter}` : ""} });`;
  const proposal = (c: Channel) =>
    `${s.fw.untracked(s.callback(c))}${
      c.name === "inputValue" && !s.nativeInputRestoresCanceledValue
        ? `
    if (detail.event?.type === "input") queueMicrotask(() => {
      if (!detail.isCanceled || ${s.owner} !== ${instance}) return;
      ${instance}.setInputValue(${instance}.getInputValue(), { emit: false, filter: false });
    });`
        : ""
    }`;
  const lazyInitialLabel = s.resolveLazyInitialText ? "selectedInitialInputValue" : undefined;
  const effectiveInitialInput = `${s.input("inputValue")} ?? defaultRuntimeInputValue`;
  const constructorPreparation = s.resolveLazyInitialText
    ? `const selectedInitialValue = ${s.input("value")} !== undefined ? ${s.input("value")} : ${s.accepted(p.channels[0])} ?? null;
    const selectedInitialInputValue = ${s.resolveLazyInitialText("selectedInitialValue")};
    const defaultRuntimeInputValue = ${s.accepted(p.channels[1])} ?? selectedInitialInputValue ?? "";
`
    : "";
  // Reconstructed controllers start from accepted models in every target. React's
  // lazy popup needs its existing text fallback before the selected Item DOM exists.
  const currentAcceptedConstructorSeed = (c: Channel) =>
    c.name === "inputValue" && lazyInitialLabel ? "defaultRuntimeInputValue" : s.accepted(c);
  const construction = `${constructorPreparation}
    const ${instance} = create${p.component}(${s.root}, {
      ${p.channels.map((c) => `${c.default}: ${c.name === "open" ? `${s.input("disabled")} ? false : (${currentAcceptedConstructorSeed(c)})` : currentAcceptedConstructorSeed(c)},`).join("\n")}
      ${p.constructorInputs.map((name) => `${name}: ${s.input(name)},`).join("\n")}
      ${p.channels.map((c) => `${c.callback}: (next, detail) => { ${proposal(c)} },`).join("\n")}
      ${
        lazyInitialLabel
          ? `defaultFilterValue: ${p.selectedLabelIsFilter ? "" : `(${effectiveInitialInput}) === ${lazyInitialLabel} ? "" : `}(${effectiveInitialInput}),
      ...(${lazyInitialLabel} !== null ? {defaultValueText:${lazyInitialLabel}} : {}),`
          : ""
      }
      ${s.portal}
      ${s.fw.modelAuthority === "parent-prop" ? p.channels.map((c) => `...(${s.input(c.name)} !== undefined ? { ${c.name}: ${s.input(c.name)} } : {}),`).join("\n") : ""}
    });
    ${s.own(instance)}`;
  const input = p.channels[1];
  const subscriptions = p.channels
    .map((c) =>
      s.subscribe(
        instance,
        c.event,
        `
    if (${s.owner} !== ${instance}) return;
    ${s.fw.untracked(`${
      c.name === "value"
        ? `const nextText = ${s.selectedText("detail.value", "detail.item")};
      ${s.rememberLabel("detail.value", "nextText")}
      if (${canUpdate(input)}) {
        const nextInput = detail.value === null ? "" : nextText ?? ${instance}.getInputValue();
        ${set(input, "nextInput")}
        ${render(input, "nextInput")}
        ${publish(input, "nextInput")}
      }`
        : ""
    }
      ${render(c, `detail.${c.name}`)}
      ${publish(c, `detail.${c.name}`)}`)}
  `,
      ),
    )
    .join("\n");
  const readback = p.channels.map((c) => render(c, `${instance}.${c.getter}()`)).join("\n");
  const synchronization = `const owned = ${s.owner}; if (!owned) return;
    ${p.channels
      .map(
        (c) => `if (${s.input(c.name)} !== undefined) {
      const next = ${c.name === "open" ? `${s.input("disabled")} ? false : ${s.input(c.name)}` : s.input(c.name)};
      ${set(c, "next", "owned")}
    }`,
      )
      .join("\n")}
    ${p.channels.map((c) => render(c, `owned.${c.getter}()`)).join("\n")}`;
  return { construction, subscriptions, readback, synchronization };
}

/** Native reset settles after Runtime, preserving canceled reset and parent authority. */
export function comboboxResetSettlement(target: Target): string {
  const s = comboboxOperations[target],
    value = comboboxPlan.channels[0],
    input = comboboxPlan.channels[1];
  const timer = target === "react" ? "timer" : "resetTimer";
  const channels = [value, input];
  return `const owned = ${s.owner}; if (!owned) return;
    const beforeValue = owned.getValue(); const beforeInputValue = owned.getInputValue();
    window.clearTimeout(${timer});
    queueMicrotask(() => {
      if (${s.owner} !== owned) return;
      ${timer} = window.setTimeout(() => {
        ${timer} = undefined;
        if (${s.owner} !== owned) return;
        ${s.fw.untracked(
          channels
            .map(
              (c) =>
                `const next${upper(c.name)} = ${s.fw.modelAuthority === "parent-prop" ? `${s.input(c.name)} !== undefined ? ${s.input(c.name)} : ` : ""}event.defaultPrevented ? before${upper(c.name)} : owned.${c.getter}();`,
            )
            .join("\n") +
            "\n" +
            channels
              .map(
                (c) => `
          owned.${c.setter}(next${upper(c.name)}, {emit:false${c.name === "inputValue" ? ",filter:false" : ""}});
          ${s.fw.modelAuthority === "parent-prop" ? `if (${s.input(c.name)} === undefined) { ${s.render(c, `owned.${c.getter}()`)} }` : s.render(c, `owned.${c.getter}()`)}
          ${s.fw.modelAuthority === "runtime-binding" ? `if (!event.defaultPrevented) { ${s.publish(c, `owned.${c.getter}()`)} }` : ""}`,
              )
              .join("\n"),
        )}
        ${s.settleLabel("owned.getValue()")}
      },0);
    });`;
}
/** Setters and their watched props have a single component owner. */
export function comboboxOptionObservers(target: Target): string {
  const s = comboboxOperations[target],
    open = comboboxPlan.channels[2];
  return comboboxPlan.optionUpdates
    .map((update) =>
      s.observe(
        update.inputs,
        `const owned = ${s.owner}; if (!owned) return;
    owned.${update.setter}(${update.inputs.length === 1 ? s.input(update.inputs[0]!) : `{${update.inputs.map((name) => `${name}:${s.input(name)}`).join(",")}}`});
    ${
      "restoreOpen" in update
        ? `const next = ${s.input("disabled")} ? false : (${s.input("open")} ?? ${s.accepted(open)});
      if (owned.getOpen() !== next) owned.setOpen(next,{emit:false});
      ${s.fw.modelAuthority === "parent-prop" ? `if (${s.input("open")} === undefined) { ${s.render(open, "owned.getOpen()")} }` : s.render(open, "owned.getOpen()")}`
        : ""
    }
    ${"bindReset" in update ? (target === "react" ? "" : "bindReset();") : ""}`,
      ),
    )
    .join("\n");
}
export function comboboxModelObservers(target: Target): string {
  const s = comboboxOperations[target];
  if (target === "svelte")
    return s.observe(
      comboboxPlan.channels.map((c) => c.name),
      comboboxFragments(target).synchronization,
    );
  return comboboxPlan.channels
    .map((c) => {
      const command = `const next = ${c.name === "open" ? `${s.input("disabled")} ? false : nextValue` : "nextValue"};
      if (owned.${c.getter}() !== next) owned.${c.setter}(next, {emit:${comboboxPlan.parentCommandsEmit}${c.name === "inputValue" ? ",filter:false" : ""}});
      ${c.name === "value" ? `if (${s.input("inputValue")} === undefined) { ${s.render(comboboxPlan.channels[1], "owned.getInputValue()")} }` : ""}`;
      return s.observeModel(c, command);
    })
    .join("\n");
}
