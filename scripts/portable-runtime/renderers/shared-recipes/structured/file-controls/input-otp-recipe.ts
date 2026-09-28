import { inputOtpRuntimeAdapterContract } from "../../../../contracts/primitive/components/input-otp.js";
import type { AdapterHiddenInputVisualSlotFacts } from "../../../framework-adapters/types.js";
import { initialModelValue } from "../../initial-state.js";

export interface OtpOperations {
  authority: "parent" | "binding";
  parentAcceptance: "runtime" | "reconcile-model";
  read: string;
  seed: string;
  current: string;
  notify(value: string, detail: string): string;
  writeCurrent(value: string): string;
  publish(value: string): string;
  untrack(body: string): string;
  afterCommit(body: string): string;
}
/** Binding targets use their initial model as the reset seed when no explicit default is authored. */
export function otpInitialSeed(
  authority: OtpOperations["authority"],
  defaultValue: string,
  initialModel = "undefined",
): string {
  return authority === "binding"
    ? initialModelValue(defaultValue, initialModel, '""')
    : initialModelValue(defaultValue, '""');
}
export function otpTabIndex(disabled: string): string {
  return `${disabled} ? -1 : 0`;
}
const lifecycles = inputOtpRuntimeAdapterContract.runtime.optionPropLifecycles;
// Refresh retains Runtime's old cursor after a length increase. Reconstruct through its public factory to restore the next editable position.
const recreate = Object.entries(lifecycles)
  .filter(
    ([key, lifecycle]) =>
      lifecycle === "constructor-only" && key !== "defaultValue" && key !== "onValueChange",
  )
  .map(([key]) => key)
  .concat("maxLength");
export const otpCaretFallbackClass = "animate-caret-blink bg-foreground h-4 w-px duration-1000";
export function otpPattern(facts: AdapterHiddenInputVisualSlotFacts, value: string): string {
  return otpPatternSource(facts, `${value} instanceof RegExp ? ${value}.source : ${value}`);
}
export function otpPatternSource(facts: AdapterHiddenInputVisualSlotFacts, source: string): string {
  return `(${source} ?? ${JSON.stringify(facts.pattern.defaultPattern)}).replace(/^\\^|\\$$/g, "")`;
}
export function otpInputMode(facts: AdapterHiddenInputVisualSlotFacts, value: string): string {
  return `${JSON.stringify(facts.pattern.numericPatternExamples)}.includes(${value}) ? "numeric" : "text"`;
}
/** Runtime proposals may cancel; only its accepted subscription publishes adapter state. */
export function otpConnection(
  facts: AdapterHiddenInputVisualSlotFacts,
  ops: OtpOperations,
): string {
  if (!facts.event.cancelable || facts.event.callbackTiming !== "before-state-commit")
    throw new Error("InputOtp requires a cancelable before-commit callback.");
  const formSetter = inputOtpRuntimeAdapterContract.setters.find(
    (setter) => setter.method === facts.setters.formOptions,
  );
  if (!formSetter || !("props" in formSetter))
    throw new Error("InputOtp requires its grouped form setter contract.");
  const formOptions = formSetter.props;
  const silent = JSON.stringify({
    ...facts.setter.options,
  });
  const event = facts.event;
  const bind = ops.authority === "binding";
  const emitAccepted = `const accepted = instance.${facts.state.getter}();
    if (!controlled) { ${ops.writeCurrent("accepted")} }
    ${bind ? `if ((${ops.read}).value !== accepted) { ${ops.publish("accepted")} }` : ""}`;
  return `function connectOtp(root: HTMLElement) {
    let previous = ${ops.read};
    const controlled = ${bind ? "false" : "previous.value !== undefined"};
    let instance: ReturnType<typeof ${facts.runtime.factory}>;
    let unsubscribe = () => {};
    let disposed = false;
    let associated: HTMLFormElement | null = null;
    let resetTimer: number | undefined;
    function publishCurrent(): void { ${emitAccepted} }
    function synchronize(value: string | undefined): void {
      if (value === undefined) return;
      if (instance.${facts.state.getter}() !== value) instance.${facts.setter.method}(value, ${silent});
      publishCurrent();
    }
    function clearReset(): void {
      if (resetTimer !== undefined) window.clearTimeout(resetTimer);
      resetTimer = undefined;
    }
    function reset(event: Event): void {
      clearReset();
      resetTimer = window.setTimeout(() => {
        resetTimer = undefined;
        if (disposed || event.defaultPrevented) return;
        ${ops.untrack(`if (controlled) synchronize((${ops.read}).value); else publishCurrent();`)}
      }, 0);
    }
    function bindReset(): void {
      const form = root.querySelector<HTMLInputElement>('[${facts.parts.input.discoveryAttribute}]')?.form ?? null;
      if (associated === form) return;
      clearReset();
      associated?.removeEventListener('reset', reset);
      associated = form;
      associated?.addEventListener('reset', reset);
    }
    function stop(): void {
      clearReset();
      associated?.removeEventListener('reset', reset);
      associated = null;
      unsubscribe();
      instance.destroy();
    }
    function start(value: string): void {
      const options = ${ops.read};
      instance = ${facts.runtime.factory}(root, {
        ${Object.keys(lifecycles)
          .filter((key) => key !== "value" && key !== "defaultValue" && key !== "onValueChange")
          .map((key) => `${key}: options.${key},`)
          .join("\n")}
        defaultValue: ${ops.seed},
        ${event.callbackProp}(next, detail) { ${ops.untrack(ops.notify("next", "detail"))} },
        ...(controlled && options.value !== undefined ? { value: options.value } : {}),
      });
      instance.${facts.setter.method}(controlled ? options.value ?? value : value, ${silent});
      publishCurrent();
      const owner = instance;
      unsubscribe = instance.subscribe('${event.runtimeEvent}', () => { ${ops.untrack(`
        if (disposed || owner !== instance) return;
        publishCurrent();
        ${bind ? "" : ops.publish(`instance.${facts.state.getter}()`)}
        ${ops.parentAcceptance === "reconcile-model" ? `if (controlled) ${ops.afterCommit(`if (!disposed && owner === instance) synchronize((${ops.read}).value);`)}` : ""}
      `)} });
      bindReset();
    }
    start(previous.value ?? ${ops.current});
    return {
      update(): void {
        const next = ${ops.read};
        if (${recreate.map((key) => `next.${key} !== previous.${key}`).join(" || ")}) {
          const accepted = instance.${facts.state.getter}();
          stop();
          start(accepted);
        } else {
          instance.refresh();
        }
          if (next.disabled !== previous.disabled) instance.${facts.setters.disabled}(next.disabled);
          if (${formOptions.map((key) => `next.${key} !== previous.${key}`).join(" || ")}) {
            instance.${facts.setters.formOptions}({
              ${formOptions.map((key) => `...(next.${key} !== previous.${key} ? { ${key}: next.${key} } : {}),`).join("\n")}
            });
          }
        if (${bind ? "next.value !== previous.value" : "controlled"}) synchronize(next.value);
        publishCurrent();
        bindReset();
        previous = next;
      },
      destroy(): void {
        disposed = true;
        stop();
      },
    };
  }`;
}
