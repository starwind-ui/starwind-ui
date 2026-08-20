import { Select } from "@starwind-ui/react/select";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

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
