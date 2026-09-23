import type { AdapterNativeInputValueFacts } from "../../../framework-adapters/types.js";
import { requireRefreshConnection } from "../../../primitive-output-model/refresh-connection.js";

/** Input notifications describe a native edit already accepted by Runtime. Cancellation does not roll it back. */
export interface NativeInputOperations {
  model: string;
  defaultValue: string;
  disabled: string;
  authority: "parent" | "binding";
  transport: "runtime-notification" | "after-native-change";
  notify(value: string, detail: string): string;
  publish(value: string): string;
  untrack(body: string): string;
}

export function nativeInputSeed(defaultValue: string, model: string): string {
  return `${defaultValue} ?? ${model}`;
}

/** Emit the native input connection itself. Framework frames only schedule and expose this connection. */
export function nativeInputConnection(
  facts: AdapterNativeInputValueFacts,
  ops: NativeInputOperations,
): string {
  const refresh = requireRefreshConnection(facts.runtime.refresh, "root");
  const { factory, valueGetter, valueSetter } = facts.runtime;
  const event = facts.events.valueChange;
  const silent = JSON.stringify({
    ...valueSetter.options,
  });
  const nativeTransport = ops.transport === "after-native-change";
  if (nativeTransport && ops.authority !== "parent")
    throw new Error("After-native-change transport requires parent authority.");
  const notification = nativeTransport
    ? "pendingDetail = detail;"
    : `${ops.authority === "parent" ? `const previous = ${ops.model};` : ""}
       ${ops.notify("next", "detail")}
       ${ops.publish("next")}
       ${ops.authority === "parent" ? "if (controlled) synchronize(previous);" : `synchronize(${ops.model});`}`;
  const settleReset =
    ops.authority === "parent"
      ? `synchronize(${ops.model});`
      : ops.publish(`instance.${valueGetter}()`);
  return `function connectInput(element: HTMLInputElement) {
    const initialModel = ${ops.model};
    ${ops.authority === "parent" ? "const controlled = initialModel !== undefined;" : ""}
    let disposed = false;
    let associated: HTMLFormElement | null = null;
    let resetTimer: number | undefined;
    ${
      nativeTransport
        ? `let pendingDetail: ${event.detailsType} | undefined;
    let nativeTimer: number | undefined;`
        : ""
    }
    function synchronize(next: ${facts.props.value.type} | undefined): void {
      if (next === undefined || disposed) return;
      const normalized = String(next);
      if (instance.${valueGetter}() === normalized && element.value === normalized) return;
      instance.${valueSetter.method}(next, ${silent});
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
        ${ops.untrack(settleReset)}
      }, 0);
    }
    function bindReset(): void {
      ${ops.authority === "parent" ? "if (!controlled) return;" : ""}
      const form = element.form;
      if (associated === form) return;
      clearReset();
      associated?.removeEventListener('reset', reset);
      associated = form;
      associated?.addEventListener('reset', reset);
    }
    ${ops.authority === "binding" ? `element.defaultValue = String(${ops.defaultValue} ?? initialModel ?? "");` : ""}
    const instance = ${factory}(element, {
      ${facts.props.defaultValue.name}: ${ops.defaultValue},
      ${facts.props.disabled.name}: ${ops.disabled},
      ${event.callbackProp}(${nativeTransport ? "_next" : "next"}, detail) { ${ops.untrack(notification)} },
      ${ops.authority === "parent" ? `...(initialModel === undefined ? {} : { ${facts.props.value.name}: initialModel }),` : ""}
    });
    ${
      ops.authority === "binding"
        ? `synchronize(initialModel);
    ${`if (${ops.model} === undefined || String(${ops.model}) !== instance.${valueGetter}()) { ${ops.publish(`instance.${valueGetter}()`)} }`} `
        : ""
    }
    bindReset();
    const stopDiscovery = observeFormDiscovery(element.ownerDocument, () => {
      instance.${refresh.method}();
      bindReset();
    });
    return {
      instance,
      synchronize,
      ${
        nativeTransport
          ? `change(next: string, forwardNative: () => void): void {
        const detail = pendingDetail;
        forwardNative();
        if (detail?.${event.valueProperty} === next) {
          pendingDetail = undefined;
          ${ops.notify("next", "detail")}
        }
        if (${ops.model} === undefined) return;
        if (nativeTimer !== undefined) window.clearTimeout(nativeTimer);
        nativeTimer = window.setTimeout(() => {
          nativeTimer = undefined;
          if (!disposed) synchronize(element.value);
        }, 0);
      },`
          : ""
      }
      destroy(): void {
        disposed = true;
        stopDiscovery();
        clearReset();
        associated?.removeEventListener('reset', reset);
        ${nativeTransport ? "if (nativeTimer !== undefined) window.clearTimeout(nativeTimer);" : ""}
        instance.destroy();
      },
    };
  }`;
}
