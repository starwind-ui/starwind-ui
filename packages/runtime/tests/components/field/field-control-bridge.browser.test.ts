import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createField } from "../../../src/components/field/field";
import {
  connectFieldControl,
  getFieldControlAccessibleSurfaces,
  getFieldControlFocusTarget,
  getFieldControlKind,
  getFieldControlNativeControls,
  getFieldControlStateSurfaces,
  readFieldControlCustomValidity,
  readFieldControlValue,
  registerFieldControlBridge,
  registerFieldControlLazyBridge,
} from "../../../src/components/field/field-control-bridge";

describe("field control bridge", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("represents Field-owned control operations through a registered bridge", () => {
    const field = document.createElement("div");
    const control = document.createElement("div");
    const focusTarget = document.createElement("button");
    const stateSurface = document.createElement("span");
    const nativeControl = document.createElement("input");

    control.append(focusTarget, stateSurface, nativeControl);
    field.append(control);

    const unregister = registerFieldControlBridge({
      kind: "unknown",
      connect(element, options) {
        element.toggleAttribute("data-connected", true);
        element.toggleAttribute("data-connected-disabled", options.disabled);
        element.setAttribute("data-connected-name", options.name ?? "");
        element.toggleAttribute("data-connected-sync-name", options.shouldSyncName);
      },
      getAccessibleSurfaces() {
        return [focusTarget];
      },
      getFocusTarget() {
        return focusTarget;
      },
      getNativeControls() {
        return [nativeControl];
      },
      getStateSurfaces() {
        return [control, stateSurface];
      },
      readCustomValidity() {
        return { valid: false, valueMissing: true };
      },
      readValue() {
        return "bridge-value";
      },
    });

    try {
      expect(getFieldControlKind(control)).toBe("unknown");

      connectFieldControl(control, {
        disabled: true,
        name: "account",
        shouldSyncName: true,
      });

      expect(control).toHaveAttribute("data-connected");
      expect(control).toHaveAttribute("data-connected-disabled");
      expect(control).toHaveAttribute("data-connected-name", "account");
      expect(control).toHaveAttribute("data-connected-sync-name");
      expect(readFieldControlValue(control)).toBe("bridge-value");
      expect(readFieldControlCustomValidity(control, "bridge-value")).toEqual({
        valid: false,
        valueMissing: true,
      });
      expect(getFieldControlFocusTarget(control)).toBe(focusTarget);
      expect(getFieldControlNativeControls(control)).toEqual([nativeControl]);
      expect(getFieldControlStateSurfaces(field, control)).toEqual([control, stateSurface]);
      expect(getFieldControlAccessibleSurfaces(field, control)).toEqual([focusTarget]);
    } finally {
      unregister();
    }
  });

  it("falls back to default operations when a registered bridge only connects", () => {
    const field = document.createElement("div");
    const control = document.createElement("div");
    const nativeControl = document.createElement("input");

    control.setAttribute("data-value", "fallback-value");
    nativeControl.value = "native-value";
    control.append(nativeControl);
    field.append(control);

    const unregister = registerFieldControlBridge({
      kind: "unknown",
      connect(element) {
        element.toggleAttribute("data-connected", true);
      },
    });

    try {
      connectFieldControl(control, {
        disabled: false,
        name: "account",
        shouldSyncName: false,
      });

      expect(control).toHaveAttribute("data-connected");
      expect(readFieldControlValue(control)).toBe("fallback-value");
      expect(readFieldControlCustomValidity(control, "fallback-value")).toBeUndefined();
      expect(getFieldControlFocusTarget(control)).toBe(nativeControl);
      expect(getFieldControlNativeControls(control)).toEqual([nativeControl]);
      expect(getFieldControlStateSurfaces(field, control)).toEqual([control]);
      expect(getFieldControlAccessibleSurfaces(field, control)).toEqual([]);
    } finally {
      unregister();
    }
  });

  it("keeps default operations when a lazy bridge load fails", async () => {
    const field = document.createElement("div");
    const control = document.createElement("div");
    const nativeControl = document.createElement("input");
    const onConnected = vi.fn();

    control.setAttribute("data-value", "fallback-value");
    nativeControl.value = "native-value";
    control.append(nativeControl);
    field.append(control);

    const unregister = registerFieldControlLazyBridge("unknown", () =>
      Promise.reject(new Error("bridge unavailable")),
    );

    try {
      expect(() =>
        connectFieldControl(control, {
          disabled: false,
          name: "account",
          onConnected,
          shouldSyncName: false,
        }),
      ).not.toThrow();
      await waitForMacrotask();

      expect(onConnected).not.toHaveBeenCalled();
      expect(readFieldControlValue(control)).toBe("fallback-value");
      expect(readFieldControlCustomValidity(control, "fallback-value")).toBeUndefined();
      expect(getFieldControlFocusTarget(control)).toBe(nativeControl);
      expect(getFieldControlNativeControls(control)).toEqual([nativeControl]);
      expect(getFieldControlStateSurfaces(field, control)).toEqual([control]);
      expect(getFieldControlAccessibleSurfaces(field, control)).toEqual([]);
    } finally {
      unregister();
    }
  });

  it("does not connect a destroyed Field when a live Field shares its lazy bridge load", async () => {
    document.body.innerHTML = `
      <div data-sw-field id="destroyed-field">
        <div data-sw-field-control></div>
      </div>
      <div data-sw-field id="live-field">
        <div data-sw-field-control></div>
      </div>
    `;

    const destroyedRoot = document.querySelector<HTMLElement>("#destroyed-field")!;
    const liveRoot = document.querySelector<HTMLElement>("#live-field")!;
    const destroyedControl = destroyedRoot.querySelector<HTMLElement>("[data-sw-field-control]")!;
    const liveControl = liveRoot.querySelector<HTMLElement>("[data-sw-field-control]")!;
    let resolveLoad!: () => void;
    const load = new Promise<void>((resolve) => {
      resolveLoad = resolve;
    });
    const connect = vi.fn();
    const unregisterLoader = registerFieldControlLazyBridge("unknown", () => load);

    try {
      const destroyedField = createField(destroyedRoot);
      destroyedField.destroy();
      createField(liveRoot);

      const unregisterBridge = registerFieldControlBridge({ kind: "unknown", connect });
      try {
        resolveLoad();
        await waitForMacrotask();

        const connectedControls = connect.mock.calls.map(([control]) => control);
        expect(connectedControls).not.toContain(destroyedControl);
        expect(connectedControls).toContain(liveControl);
      } finally {
        unregisterBridge();
      }
    } finally {
      unregisterLoader();
    }
  });

  it("cancels one pending request without canceling its shared lazy bridge load", async () => {
    const canceledControl = document.createElement("div");
    const liveControl = document.createElement("div");
    const abortController = new AbortController();
    const canceledOnConnected = vi.fn();
    const liveOnConnected = vi.fn();
    let resolveLoad!: () => void;
    const load = new Promise<void>((resolve) => {
      resolveLoad = resolve;
    });
    const loader = vi.fn(() => load);
    const connect = vi.fn();
    const unregisterLoader = registerFieldControlLazyBridge("unknown", loader);

    try {
      connectFieldControl(canceledControl, {
        disabled: false,
        onConnected: canceledOnConnected,
        shouldSyncName: false,
        signal: abortController.signal,
      });
      connectFieldControl(liveControl, {
        disabled: false,
        onConnected: liveOnConnected,
        shouldSyncName: false,
      });
      abortController.abort();

      const unregisterBridge = registerFieldControlBridge({ kind: "unknown", connect });
      try {
        resolveLoad();
        await waitForMacrotask();

        expect(loader).toHaveBeenCalledTimes(1);
        expect(connect).toHaveBeenCalledTimes(1);
        expect(connect.mock.calls[0]?.[0]).toBe(liveControl);
        expect(canceledOnConnected).not.toHaveBeenCalled();
        expect(liveOnConnected).toHaveBeenCalledTimes(1);
      } finally {
        unregisterBridge();
      }
    } finally {
      unregisterLoader();
    }
  });

  it("does not start a lazy bridge load for an already-aborted request", async () => {
    const control = document.createElement("div");
    const abortController = new AbortController();
    const onConnected = vi.fn();
    const loader = vi.fn(() => Promise.resolve());
    const unregisterLoader = registerFieldControlLazyBridge("unknown", loader);
    abortController.abort();

    try {
      connectFieldControl(control, {
        disabled: false,
        onConnected,
        shouldSyncName: false,
        signal: abortController.signal,
      });
      await waitForMacrotask();

      expect(loader).not.toHaveBeenCalled();
      expect(onConnected).not.toHaveBeenCalled();
    } finally {
      unregisterLoader();
    }
  });

  it("does not notify a request aborted while its lazy bridge connects", async () => {
    const control = document.createElement("div");
    const abortController = new AbortController();
    const onConnected = vi.fn();
    let resolveLoad!: () => void;
    const load = new Promise<void>((resolve) => {
      resolveLoad = resolve;
    });
    const unregisterLoader = registerFieldControlLazyBridge("unknown", () => load);

    try {
      connectFieldControl(control, {
        disabled: false,
        onConnected,
        shouldSyncName: false,
        signal: abortController.signal,
      });

      const connect = vi.fn(() => abortController.abort());
      const unregisterBridge = registerFieldControlBridge({ kind: "unknown", connect });
      try {
        resolveLoad();
        await waitForMacrotask();

        expect(connect).toHaveBeenCalledTimes(1);
        expect(onConnected).not.toHaveBeenCalled();
      } finally {
        unregisterBridge();
      }
    } finally {
      unregisterLoader();
    }
  });

  it("lets Field form registration focus through a registered bridge target", () => {
    document.body.innerHTML = `
      <div data-sw-field>
        <div data-sw-field-control>
          <button type="button">Focus target</button>
        </div>
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const control = field.querySelector<HTMLElement>("[data-sw-field-control]")!;
    const focusTarget = field.querySelector<HTMLButtonElement>("button")!;
    const unregister = registerFieldControlBridge({
      kind: "unknown",
      getFocusTarget() {
        return focusTarget;
      },
    });

    try {
      createField(field).getFormRegistration().focus();

      expect(getFieldControlKind(control)).toBe("unknown");
      expect(document.activeElement).toBe(focusTarget);
    } finally {
      unregister();
    }
  });

  it("keeps default value, focus, and native-control discovery for plain form controls", () => {
    document.body.innerHTML = `
      <div data-sw-field>
        <input name="email" value="ada@example.com" />
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = field.querySelector<HTMLInputElement>("input")!;

    expect(getFieldControlKind(input)).toBe("input");
    expect(readFieldControlValue(input)).toBe("ada@example.com");
    expect(getFieldControlFocusTarget(input)).toBe(input);
    expect(getFieldControlNativeControls(input)).toEqual([input]);
    expect(getFieldControlStateSurfaces(field, input)).toEqual([input]);
    expect(getFieldControlAccessibleSurfaces(field, input)).toEqual([]);
  });
});

async function waitForMacrotask(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
