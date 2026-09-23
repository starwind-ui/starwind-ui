import { Select } from "@starwind-ui/react/select";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  document.querySelectorAll("[data-select-portal-target]").forEach((node) => node.remove());
  reactRoot = undefined;
  container = undefined;
});

describe("React Select portal lifecycle", () => {
  it("keeps one wrapper and live part refs without leaving an orphan on unmount", async () => {
    const rootRef = React.createRef<HTMLDivElement>();
    const portalRef = React.createRef<HTMLDivElement>();
    const positionerRef = React.createRef<HTMLDivElement>();
    const popupRef = React.createRef<HTMLDivElement>();

    await mount(
      <React.StrictMode>
        <Select.Root defaultOpen modal={false} ref={rootRef}>
          <Select.Trigger>Select theme</Select.Trigger>
          <Select.Portal ref={portalRef}>
            <Select.Positioner alignItemWithTrigger={false} ref={positionerRef}>
              <Select.Popup keepMounted ref={popupRef}>
                Theme options
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </React.StrictMode>,
    );
    await waitForMacrotask();

    const rootElement = document.querySelector<HTMLDivElement>("[data-sw-select]");
    const portalElement = document.querySelector<HTMLDivElement>("[data-sw-select-portal]");
    const positionerElement = document.querySelector<HTMLDivElement>("[data-sw-select-positioner]");
    const popupElement = document.querySelector<HTMLDivElement>("[data-sw-select-popup]");

    expect(rootRef.current).toBe(rootElement);
    expect(portalRef.current).toBe(portalElement);
    expect(positionerRef.current).toBe(positionerElement);
    expect(popupRef.current).toBe(popupElement);
    expect(document.querySelectorAll("[data-sw-select-portal]")).toHaveLength(1);
    expect(document.querySelectorAll("[data-sw-select-positioner]")).toHaveLength(1);
    expect(document.querySelectorAll("[data-sw-select-popup]")).toHaveLength(1);
    expect(rootElement?.parentElement).toBe(container);
    expect(portalElement?.parentElement).toBe(document.body);
    expect(positionerElement?.parentElement).toBe(portalElement);
    expect(popupElement?.parentElement).toBe(positionerElement);
    expect(portalElement).toHaveAttribute("data-placement", "ready");

    await act(() => reactRoot?.unmount());
    reactRoot = undefined;

    expect(rootRef.current).toBeNull();
    expect(portalRef.current).toBeNull();
    expect(positionerRef.current).toBeNull();
    expect(popupRef.current).toBeNull();
    expect(document.querySelectorAll("[data-sw-select-portal]")).toHaveLength(0);
    expect(document.querySelectorAll("[data-sw-select-positioner]")).toHaveLength(0);
    expect(document.querySelectorAll("[data-sw-select-popup]")).toHaveLength(0);
    expect(document.querySelectorAll("[data-sw-floating-portal]")).toHaveLength(0);
  });

  it("removes a conditional Portal during a target transition under a persistent Root", async () => {
    const firstTarget = document.createElement("section");
    firstTarget.id = "select-portal-stable-target";
    firstTarget.dataset.selectPortalTarget = "first";
    document.body.append(firstTarget);
    let setPortalVisible: React.Dispatch<React.SetStateAction<boolean>> = () => undefined;

    function Harness() {
      const [showPortal, setShowPortal] = React.useState(true);
      const didUnmountForMoveRef = React.useRef(false);
      setPortalVisible = setShowPortal;
      return (
        <Select.Root defaultOpen modal={false}>
          <Select.Trigger>Select theme</Select.Trigger>
          {showPortal ? (
            <Select.Portal container="#select-portal-stable-target">
              <Select.Positioner alignItemWithTrigger={false}>
                <Select.Popup keepMounted>
                  Theme options
                  <UnmountPortalAfterMove
                    didUnmountForMoveRef={didUnmountForMoveRef}
                    setPortalVisible={setShowPortal}
                  />
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          ) : null}
        </Select.Root>
      );
    }

    await mount(<Harness />);
    const persistentRoot = document.querySelector<HTMLElement>("[data-sw-select]")!;
    const originalPortal = document.querySelector<HTMLElement>("[data-sw-select-portal]")!;
    expect(originalPortal.parentElement).toBe(firstTarget);

    firstTarget.remove();
    const secondTarget = document.createElement("section");
    secondTarget.id = "select-portal-stable-target";
    secondTarget.dataset.selectPortalTarget = "second";
    document.body.append(secondTarget);
    await waitForMacrotask();

    expect(document.querySelector("[data-sw-select]")).toBe(persistentRoot);
    expect(document.querySelectorAll("[data-sw-select-portal]")).toHaveLength(0);
    expect(document.querySelectorAll("[data-sw-select-positioner]")).toHaveLength(0);
    expect(document.querySelectorAll("[data-sw-select-popup]")).toHaveLength(0);
    expect(originalPortal.isConnected).toBe(false);

    await act(() => setPortalVisible(true));
    await waitForMacrotask();
    const remountedPortal = document.querySelector<HTMLElement>("[data-sw-select-portal]")!;
    expect(remountedPortal).not.toBe(originalPortal);
    expect(remountedPortal.parentElement).toBe(secondTarget);
    expect(remountedPortal).toHaveAttribute("data-placement", "ready");
    expect(document.querySelectorAll("[data-sw-select-portal]")).toHaveLength(1);
  });
});

function UnmountPortalAfterMove({
  didUnmountForMoveRef,
  setPortalVisible,
}: {
  didUnmountForMoveRef: React.RefObject<boolean>;
  setPortalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const markerRef = React.useRef<HTMLSpanElement>(null);
  React.useLayoutEffect(() => {
    const target = markerRef.current?.closest<HTMLElement>("[data-select-portal-target]");
    if (target?.dataset.selectPortalTarget !== "second" || didUnmountForMoveRef.current) return;
    didUnmountForMoveRef.current = true;
    setPortalVisible(false);
  });
  return <span data-select-portal-marker ref={markerRef} />;
}

describe("React Select lazy selected labels", () => {
  it("preserves an intentionally empty item label and hidden form value while closed", async () => {
    await mount(
      <form data-case="form">
        <Select.Root defaultValue="empty" name="theme">
          <Select.Trigger>
            <Select.Value data-case="value" placeholder="Pick theme" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="empty">
                  <Select.ItemText>{""}</Select.ItemText>
                </Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </form>,
    );
    await waitForMacrotask();

    const form = document.querySelector<HTMLFormElement>('[data-case="form"]')!;
    const root = form.querySelector<HTMLElement>("[data-sw-select]")!;
    const value = root.querySelector<HTMLElement>('[data-case="value"]')!;
    const input = root.querySelector<HTMLInputElement>("[data-sw-select-input]")!;

    expect(root.querySelector("[data-sw-select-item]")).toBeNull();
    expect(root.getAttribute("data-selected-value")).toBe("empty");
    expect(root.getAttribute("data-selected-label")).toBe("");
    expect(root.getAttribute("data-value")).toBe("empty");
    expect(root.hasAttribute("data-placeholder")).toBe(false);
    expect(value.textContent).toBe("");
    expect(input.value).toBe("empty");
    expect(new FormData(form).get("theme")).toBe("empty");
  });

  it("accepts an intentionally empty item label and preserves its form value", async () => {
    await mount(
      <form data-case="form">
        <Select.Root defaultValue="light" name="theme">
          <Select.Trigger data-case="trigger">
            <Select.Value data-case="value" placeholder="Pick theme" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="light">
                  <Select.ItemText>Light</Select.ItemText>
                </Select.Item>
                <Select.Item value="empty">
                  <Select.ItemText>{""}</Select.ItemText>
                </Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </form>,
    );
    await waitForMacrotask();

    const form = document.querySelector<HTMLFormElement>('[data-case="form"]')!;
    const root = form.querySelector<HTMLElement>("[data-sw-select]")!;
    const value = root.querySelector<HTMLElement>('[data-case="value"]')!;
    const input = root.querySelector<HTMLInputElement>("[data-sw-select-input]")!;

    await click(root.querySelector<HTMLElement>('[data-case="trigger"]')!);
    await click(document.querySelector<HTMLElement>('[data-sw-select-item][data-value="empty"]')!);

    expect(root.getAttribute("data-selected-value")).toBe("empty");
    expect(root.getAttribute("data-selected-label")).toBe("");
    expect(root.getAttribute("data-value")).toBe("empty");
    expect(root.hasAttribute("data-placeholder")).toBe(false);
    expect(value.textContent).toBe("");
    expect(input.value).toBe("empty");
    expect(new FormData(form).get("theme")).toBe("empty");
  });

  it("keeps a generic empty item label absent while preserving its form value", async () => {
    await mount(
      <form data-case="form">
        <Select.Root defaultValue="empty" name="theme">
          <Select.Trigger>
            <Select.Value data-case="value" placeholder="Pick theme" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="empty">{""}</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </form>,
    );
    await waitForMacrotask();

    const form = document.querySelector<HTMLFormElement>('[data-case="form"]')!;
    const root = form.querySelector<HTMLElement>("[data-sw-select]")!;
    const value = root.querySelector<HTMLElement>('[data-case="value"]')!;
    const input = root.querySelector<HTMLInputElement>("[data-sw-select-input]")!;

    expect(root.querySelector("[data-sw-select-item]")).toBeNull();
    expect(root.hasAttribute("data-selected-value")).toBe(false);
    expect(root.hasAttribute("data-selected-label")).toBe(false);
    expect(root.getAttribute("data-value")).toBe("empty");
    expect(root.hasAttribute("data-placeholder")).toBe(false);
    expect(value.textContent).toBe("Pick theme");
    expect(input.value).toBe("empty");
    expect(new FormData(form).get("theme")).toBe("empty");
  });
});

describe("React Select group labels", () => {
  it("keeps the group name synchronized with a dynamic heading", async () => {
    let setHeading!: React.Dispatch<React.SetStateAction<string>>;
    let replacePopup!: React.DispatchWithoutAction;
    function DynamicSelect() {
      const [heading, updateHeading] = React.useState("Themes");
      const [popupKey, updatePopupKey] = React.useReducer((value) => value + 1, 0);
      setHeading = updateHeading;
      replacePopup = updatePopupKey;
      return (
        <Select.Root defaultOpen modal={false}>
          <Select.Trigger>Select theme</Select.Trigger>
          <Select.Portal key={popupKey}>
            <Select.Positioner>
              <Select.Popup keepMounted>
                <Select.Group>
                  <Select.GroupLabel>{heading}</Select.GroupLabel>
                  <Select.Item value="light">Light</Select.Item>
                </Select.Group>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      );
    }

    await mount(<DynamicSelect />);
    await waitForMacrotask();
    const group = document.querySelector<HTMLElement>("[data-sw-select-group]")!;

    expect(group).toHaveAccessibleName("Themes");
    await act(() => setHeading("Color themes"));
    await waitForMacrotask();
    expect(group).toHaveAccessibleName("Color themes");

    await act(() => replacePopup());
    await waitForMacrotask();
    const replacementGroup = document.querySelector<HTMLElement>("[data-sw-select-group]")!;
    expect(replacementGroup).not.toBe(group);
    expect(replacementGroup).toHaveAccessibleName("Color themes");
  });
});

async function mount(node: React.ReactNode): Promise<void> {
  container = document.createElement("div");
  document.body.append(container);
  reactRoot = createRoot(container);
  await act(async () => {
    reactRoot!.render(node);
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function waitForMacrotask(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  });
}

async function click(element: HTMLElement): Promise<void> {
  await act(() => {
    element.click();
  });
}

describe("React Select native reset", () => {
  it("keeps one lazy form listener through Strict Mode and removes all reset listeners on teardown", async () => {
    const active = new Map<EventTarget, Set<EventListenerOrEventListenerObject>>();
    const originalAdd = EventTarget.prototype.addEventListener;
    const originalRemove = EventTarget.prototype.removeEventListener;
    let additions = 0;
    const add = vi.spyOn(EventTarget.prototype, "addEventListener").mockImplementation(function (
      this: EventTarget,
      type,
      listener,
      options,
    ) {
      if (type === "reset" && this instanceof HTMLFormElement && listener) {
        const listeners = active.get(this) ?? new Set<EventListenerOrEventListenerObject>();
        listeners.add(listener);
        active.set(this, listeners);
        additions += 1;
      }
      originalAdd.call(this, type, listener, options);
    });
    const remove = vi
      .spyOn(EventTarget.prototype, "removeEventListener")
      .mockImplementation(function (this: EventTarget, type, listener, options) {
        if (type === "reset" && listener) active.get(this)?.delete(listener);
        originalRemove.call(this, type, listener, options);
      });
    try {
      const harness = await mountResetSelect();
      expect(active.get(harness.form)?.size).toBe(1);
      const mountedAdditions = additions;
      await act(() => harness.rerender());
      await harness.reset();
      expect(additions).toBe(mountedAdditions);
      expect(active.get(harness.form)?.size).toBe(1);
      await harness.activate();
      expect(active.get(harness.form)?.size).toBe(2);
      await act(() => {
        harness.form.reset();
        reactRoot!.unmount();
      });
      reactRoot = undefined;
      await settleReset();
      expect(active.get(harness.form)?.size).toBe(0);
    } finally {
      add.mockRestore();
      remove.mockRestore();
    }
  });

  for (const controlled of [false, true]) {
    for (const activated of [false, true]) {
      it(`${controlled ? "controlled" : "uncontrolled"} reset keeps value, label, and form data aligned ${activated ? "after" : "before"} activation`, async () => {
        const harness = await mountResetSelect({ controlled, activated });
        if (!controlled && activated) await harness.select("b");
        await act(() => harness.setDefault("c"));
        await harness.reset();
        harness.expectValue(controlled ? "b" : "a");
        await act(() => harness.rerender());
        harness.expectValue(controlled ? "b" : "a");
        expect(harness.proposals).toEqual(!controlled && activated ? ["b"] : []);
        if (!activated) {
          expect(harness.trigger.hasAttribute("aria-controls")).toBe(false);
          expect(document.querySelector("[data-sw-select-item]")).toBeNull();
          await harness.activate();
          await harness.reset();
          harness.expectValue(controlled ? "b" : "a");
        }
      });
    }

    it(`${controlled ? "controlled" : "uncontrolled"} restores accepted state after a later canceled reset`, async () => {
      const harness = await mountResetSelect({ controlled, activated: true });
      if (!controlled) await harness.select("b");
      harness.form.addEventListener("reset", (event) => event.preventDefault());
      await harness.reset();
      harness.expectValue("b");
      await act(() => harness.rerender());
      harness.expectValue("b");
      expect(harness.proposals).toEqual(controlled ? [] : ["b"]);
    });
  }

  it("keeps newer controlled commands after reset dispatch", async () => {
    const harness = await mountResetSelect({ controlled: true, activated: true });
    await act(() => {
      harness.form.reset();
      harness.setValue("c");
    });
    await settleReset();
    harness.expectValue("c");
    expect(harness.proposals).toEqual([]);
  });

  it("keeps a newer accepted interaction after reset dispatch", async () => {
    const harness = await mountResetSelect({ activated: true });
    await act(() => {
      harness.form.reset();
      document.querySelector<HTMLElement>('[data-sw-select-item][data-value="c"]')!.click();
    });
    await settleReset();
    harness.expectValue("c");
    expect(harness.proposals).toEqual(["c"]);
  });

  it("keeps a newer silent value command after reset dispatch", async () => {
    const harness = await mountResetSelect({ activated: true });
    await act(() => {
      harness.form.reset();
      harness.root.dispatchEvent(
        new CustomEvent("starwind:set-value", { detail: { value: "c", emit: false } }),
      );
    });
    await settleReset();
    harness.expectValue("c");
    expect(harness.proposals).toEqual([]);
  });

  it("retains the original seed when activation occurs between reset dispatch and settlement", async () => {
    const harness = await mountResetSelect();
    await act(() => harness.setDefault("c"));
    await act(() => {
      harness.form.reset();
      harness.trigger.click();
    });
    await settleReset();
    harness.expectValue("a");
    await harness.select("b");
    await harness.reset();
    harness.expectValue("a");
    expect(harness.proposals).toEqual(["b"]);
  });

  it("binds the actual external form and follows form ownership changes", async () => {
    const harness = await mountResetSelect({ activated: true, external: true });
    await harness.select("b");
    const nextForm = document.querySelector<HTMLFormElement>("#select-reset-next")!;
    await act(() => harness.setForm("select-reset-next"));
    harness.expectValue("b", nextForm);
    await act(() => harness.form.reset());
    await settleReset();
    harness.expectValue("b", nextForm);
    await act(() => nextForm.reset());
    await settleReset();
    harness.expectValue("a", nextForm);
    expect(harness.proposals).toEqual(["b"]);
  });

  it("cancels pending work on Strict Mode unmount and leaves replacement owners intact", async () => {
    const harness = await mountResetSelect({ activated: true });
    await harness.select("b");
    const oldInput = harness.root.querySelector<HTMLInputElement>("input")!;
    await act(() => {
      harness.form.reset();
      reactRoot!.unmount();
    });
    reactRoot = undefined;
    const detachedValue = oldInput.value;
    await settleReset();
    expect(oldInput.value).toBe(detachedValue);
    expect(harness.proposals).toEqual(["b"]);
    container?.remove();
    const replacement = await mountResetSelect({ controlled: true });
    await replacement.reset();
    replacement.expectValue("b");
    expect(replacement.proposals).toEqual([]);
  });

  it("normalizes an empty original reset seed to the placeholder", async () => {
    const harness = await mountResetSelect({ activated: true, seed: "" });
    await harness.select("b");
    await harness.reset();
    harness.expectValue(null);
    expect(harness.proposals).toEqual(["b"]);
  });
});

async function mountResetSelect(
  options: { controlled?: boolean; activated?: boolean; external?: boolean; seed?: string } = {},
) {
  let setValue!: React.Dispatch<React.SetStateAction<string>>;
  let setDefault!: React.Dispatch<React.SetStateAction<string>>;
  let setForm!: React.Dispatch<React.SetStateAction<string | undefined>>;
  let rerender!: React.DispatchWithoutAction;
  const proposals: Array<string | null> = [];
  function Harness() {
    const [value, updateValue] = React.useState("b");
    const [seed, updateDefault] = React.useState(options.seed ?? "a");
    const [form, updateForm] = React.useState(options.external ? "select-reset-owner" : undefined);
    const [tick, updateTick] = React.useReducer((value) => value + 1, 0);
    setValue = updateValue;
    setDefault = updateDefault;
    setForm = updateForm;
    rerender = updateTick;
    const select = (
      <Select.Root
        defaultValue={seed}
        value={options.controlled ? value : undefined}
        name="choice"
        form={form}
        modal={false}
        data-tick={tick}
        onValueChange={(next) => proposals.push(next)}
      >
        <Select.Trigger>
          <Select.Value placeholder="Choose" />
        </Select.Trigger>
        <Select.Portal disabled>
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value="a">
                <Select.ItemText>Alpha</Select.ItemText>
              </Select.Item>
              <Select.Item value="b">
                <Select.ItemText>Beta</Select.ItemText>
              </Select.Item>
              <Select.Item value="c">
                <Select.ItemText>Gamma</Select.ItemText>
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    );
    return (
      <React.StrictMode>
        <form id="select-reset-owner">{options.external ? null : select}</form>
        <form id="select-reset-next" />
        {options.external ? select : null}
      </React.StrictMode>
    );
  }
  await mount(<Harness />);
  await settleReset();
  const form = container!.querySelector<HTMLFormElement>("#select-reset-owner")!;
  const root = container!.querySelector<HTMLElement>("[data-sw-select]")!;
  const trigger = root.querySelector<HTMLElement>("[data-sw-select-trigger]")!;
  const activate = async () => {
    await click(trigger);
    await settleReset();
  };
  if (options.activated) await activate();
  return {
    root,
    form,
    trigger,
    proposals,
    setValue,
    setDefault,
    setForm,
    rerender,
    activate,
    async select(value: string) {
      if (trigger.getAttribute("aria-expanded") !== "true") await activate();
      await click(
        document.querySelector<HTMLElement>(`[data-sw-select-item][data-value="${value}"]`)!,
      );
      await settleReset();
    },
    async reset() {
      await act(() => form.reset());
      await settleReset();
    },
    expectValue(value: string | null, owner = form) {
      const native = root.querySelector<HTMLInputElement>("[data-sw-select-input]")!;
      expect(native.form).toBe(owner);
      expect(native.value).toBe(value ?? "");
      expect(new FormData(owner).get("choice")).toBe(value ?? "");
      expect(root.getAttribute("data-value")).toBe(value);
      expect(root.querySelector("[data-sw-select-value]")?.textContent).toBe(
        value === "a" ? "Alpha" : value === "b" ? "Beta" : value === "c" ? "Gamma" : "Choose",
      );
      expect(trigger.hasAttribute("data-placeholder")).toBe(value === null);
    },
  };
}

async function settleReset(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 30));
  });
}
