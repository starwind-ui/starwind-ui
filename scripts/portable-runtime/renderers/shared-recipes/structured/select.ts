import type { Target } from "./operations.js";
import { selectOperations } from "./select-operations.js";

/** Two independent accepted channels. The recipe owns order and command policy. */
export const selectPlan = {
  component: "Select",
  channels: [
    {
      name: "open",
      type: "boolean",
      getter: "getOpen",
      setter: "setOpen",
      event: "openChange",
      callback: "onOpenChange",
      default: "defaultOpen",
    },
    {
      name: "value",
      type: "string | null",
      getter: "getValue",
      setter: "setValue",
      event: "valueChange",
      callback: "onValueChange",
      default: "defaultValue",
    },
  ],
  constructorInputs: [
    "autoComplete",
    "disabled",
    "form",
    "highlightItemOnHover",
    "modal",
    "name",
    "readOnly",
    "required",
  ],
  connection: ["create", "own", "restore-value", "subscribe"] as const,
  parentCommandsEmit: false,
  optionUpdates: [
    { setter: "setDisabled", inputs: ["disabled"], acceptedOpen: true },
    { setter: "setReadOnly", inputs: ["readOnly"] },
    { setter: "setModal", inputs: ["modal"] },
    { setter: "setHighlightItemOnHover", inputs: ["highlightItemOnHover"] },
    {
      setter: "setFormOptions",
      inputs: ["autoComplete", "form", "name", "required"],
      bindReset: true,
    },
  ],
  selectedLabel: { textPart: "data-sw-select-item-text" },
} as const;
type Channel = (typeof selectPlan.channels)[number];
export type SelectPlan = Omit<typeof selectPlan, "parentCommandsEmit"> & {
  parentCommandsEmit: boolean;
};
const upper = (value: string) => value[0]!.toUpperCase() + value.slice(1);

export function selectFragments(target: Target, plan: SelectPlan = selectPlan) {
  const s = selectOperations[target];
  const scalar = (channel: Channel, expression: string) =>
    channel.name === "open" ? `${s.input("disabled")} ? false : (${expression})` : expression;
  const construction = `create${plan.component}(${s.root}, {
    ${plan.channels.map((c) => `${c.default}: ${scalar(c, s.initial(c))},`).join("\n")}
    ${plan.constructorInputs.map((name) => `${name}: ${s.input(name)},`).join("\n")}
    ${plan.channels.map((c) => `${c.callback}: (next, detail) => { ${s.fw.untracked(s.callback(c))} },`).join("\n")}
    ${s.portal}
    ${s.fw.modelAuthority === "parent-prop" ? plan.channels.map((c) => `...(${s.input(c.name)} !== undefined ? { ${c.name}: ${scalar(c, s.input(c.name))} } : {}),`).join("\n") : ""}
  })`.replace(/[ \t]+$/gm, "");
  // Initialization and parent commands update internal state; only accepted changes notify models.
  const accepted = (
    channel: Channel,
    value: string,
    item?: string,
    origin: "accepted" | "synchronization" = "accepted",
  ) =>
    [
      channel.name === "value" ? s.label(value, item) : "",
      s.fw.modelAuthority === "parent-prop"
        ? `if (${s.input(channel.name)} === undefined) { ${s.render(channel, value)} }`
        : s.render(channel, value),
      origin === "accepted" ? s.publish(channel, value) : "",
    ]
      .filter(Boolean)
      .join("\n");
  const subscriptions = plan.channels
    .map(
      (
        c,
      ) => `${target === "react" ? "" : target === "vue" ? `unsubscribe${upper(c.name)}Change = ` : `const unsubscribe${upper(c.name)} = `}owned.subscribe("${c.event}", detail => {
    if (${s.owner} !== owned) return;
    ${s.fw.untracked(accepted(c, `detail.${c.name}`, c.name === "value" ? "detail.item" : undefined))}
  });`,
    )
    .join("\n");
  const restore = `owned.setValue(${s.input("value")} !== undefined ? ${s.input("value")} : ${s.accepted(plan.channels[1])}, { emit: false });`;
  const connectionSteps = {
    create: `const owned = ${construction};`,
    own: `${s.owner} = owned;`,
    "restore-value": restore,
    subscribe: subscriptions,
  };
  const connectionCode = plan.connection.map((step) => connectionSteps[step]).join("\n");
  const connection =
    target === "react" ? connectionCode.replace(/\bowned\b/g, "instance") : connectionCode;
  const commands = plan.channels
    .map(
      (c) => `function synchronize${upper(c.name)}(next: ${c.type}): void {
    const normalized = ${scalar(c, "next")};
    if (instance.${c.getter}() !== normalized${c.name === "value" ? ' || normalized === ""' : ""}) instance.${c.setter}(normalized, { emit: ${plan.parentCommandsEmit} });
    ${target === "svelte" ? accepted(c, `instance.${c.getter}()`, undefined, "synchronization") : c.name === "value" ? s.label(`instance.${c.getter}()`) : ""}
  }`,
    )
    .join("\n");
  return {
    construction,
    connection,
    subscriptions,
    commands,
    // Shared DOM item-to-label rule. React additionally resolves unopened lazy children.
    labelReader: `if (!item) return null;
      const textElement = item.querySelector<HTMLElement>("[${plan.selectedLabel.textPart}]");
      if (textElement) return textElement.textContent?.trim() ?? "";
      const text = item.textContent?.trim() ?? "";
      return text.length > 0 ? text : null;`,
  };
}

export function selectParentCommand(
  target: Target,
  name: "open" | "value",
  next: string,
  instance = "instance",
  plan: SelectPlan = selectPlan,
): string {
  const channel = plan.channels.find((channel) => channel.name === name)!;
  const disabled = selectOperations[target].input("disabled");
  const desired = name === "open" ? `(${disabled} ? false : ${next})` : next;
  return `if (${instance}.${channel.getter}() !== ${desired}${name === "value" ? ` || ${next} === ""` : ""}) ${instance}.${channel.setter}(${desired}, { emit: ${plan.parentCommandsEmit} });`;
}

/** Reset settlement follows Runtime's timer, then restores the authoritative model silently. */
export function selectResetDecision(target: Target): string {
  const s = selectOperations[target];
  const input = s.input("value");
  // A writable binding is output as well as input. Its unchanged previous output is not a command.
  const authority =
    s.fw.modelAuthority === "parent-prop" ? `${input} !== undefined ? ${input} : ` : "";
  return `${authority}event.defaultPrevented || superseded ? before : initialResetValue`;
}

export const selectResetPolicy = { commandsEmit: false };

/** Capture, liveness, authority, silent restoration and publication are one settlement path. */
export function selectResetSettlement(target: Target): string {
  const s = selectOperations[target],
    r = s.reset;
  const channel = selectPlan.channels[1];
  const capture = `${r.generation ? `const generation = ++${r.generation}; ` : ""}const revision = ${r.revision};`;
  const active = `${r.generation ? `${r.generation} === generation && ` : ""}${r.isCurrent}`;
  const lazy = r.runtime.availability === "lazy";
  const readback = lazy
    ? 'resetOwner ? resetOwner.getValue() : next === "" ? null : next'
    : "resetOwner.getValue()";
  const render = s.render(channel, "acceptedValue");
  const settle = `const resetOwner = ${r.runtime.read};
    resetOwner${lazy ? "?" : ""}.setValue(next, { emit: ${selectResetPolicy.commandsEmit} });
    const acceptedValue = ${readback};
    ${r.nativeControl ? `${r.nativeControl.value} = acceptedValue ?? "";` : ""}
    ${s.fw.modelAuthority === "parent-prop" ? `if (${s.input("value")} === undefined) { ${render} }` : render}
    ${r.nativeControl ? `${r.nativeControl.needsRender} = true;` : ""}
    ${r.label("acceptedValue")}
    ${s.fw.modelAuthority === "runtime-binding" ? `if (!event.defaultPrevented && !superseded) { ${s.publish(channel, "acceptedValue")} }` : ""}`;
  return `${capture}
    window.clearTimeout(${r.timer});
    queueMicrotask(() => {
      if (!(${active})) return;
      ${r.timer} = window.setTimeout(() => {
        if (!(${active})) return;
        ${s.fw.untracked(`const superseded = revision !== ${r.revision};
          const before = ${s.accepted(channel)};
          const initialResetValue = ${r.initialValue};
          const next = ${selectResetDecision(target)};
          ${settle}`)}
      }, 0);
    });`.replace(/^[\t ]+$/gm, "");
}

/** Recipe order and option policies are common; targets supply effect registration syntax. */
export function selectOptionObservers(target: Target): string {
  const s = selectOperations[target];
  const channel = selectPlan.channels[0];
  return selectPlan.optionUpdates
    .map((update) => {
      const argument =
        update.inputs.length === 1
          ? s.input(update.inputs[0]!)
          : `{ ${update.inputs.map((name) => `${name}: ${s.input(name)}`).join(", ")} }`;
      const restoreOpen =
        "acceptedOpen" in update
          ? `const desired = ${s.input("disabled")} ? false : (${s.input("open")} ?? ${s.accepted(channel)});
      if (owned.getOpen() !== desired) owned.setOpen(desired, { emit: false });
      ${s.fw.modelAuthority === "parent-prop" ? `if (${s.input("open")} === undefined) { ${s.render(channel, "owned.getOpen()")} }` : s.render(channel, "owned.getOpen()")}`
          : "";
      return s.observe(
        update.inputs,
        `const owned = ${s.owner}; if (!owned) return;
      owned.${update.setter}(${argument});
      ${restoreOpen}
      ${"bindReset" in update ? s.bindReset : ""}`,
      );
    })
    .join("\n")
    .replace(/[ \t]+$/gm, "");
}
