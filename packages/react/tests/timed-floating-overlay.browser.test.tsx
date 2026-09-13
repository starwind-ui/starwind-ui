import { createPreviewCard } from "@starwind-ui/runtime/preview-card";
import { createTooltip } from "@starwind-ui/runtime/tooltip";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PreviewCardPopup, PreviewCardRoot, PreviewCardTrigger } from "../src/preview-card/index";
import { TooltipPopup, TooltipPortal, TooltipRoot, TooltipTrigger } from "../src/tooltip/index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let renderer: Root | undefined;
let container: HTMLDivElement;
afterEach(async () => {
  await act(() => renderer?.unmount());
  renderer = undefined;
  container?.remove();
});

describe("React Tooltip initial opening", () => {
  const openingCases = [
    ["controlled", false],
    ["controlled", true],
    ["default", false],
    ["default", true],
  ] as const;
  it.each(openingCases)("opens %s through Portal (Strict Mode: %s)", async (mode, strict) => {
    const onOpenChange = vi.fn();
    const Wrapper = strict ? React.StrictMode : React.Fragment;
    await mount(
      <Wrapper>
        <TooltipRoot
          id="owner"
          {...(mode === "controlled" ? { open: true } : { defaultOpen: true })}
          onOpenChange={onOpenChange}
        >
          <TooltipTrigger id="trigger">Trigger</TooltipTrigger>
          <TooltipPortal>
            <TooltipPopup id="popup">Popup</TooltipPopup>
          </TooltipPortal>
        </TooltipRoot>
      </Wrapper>,
    );
    const root = document.getElementById("owner")!;
    const popup = document.getElementById("popup")!;
    const instance = createTooltip(root);
    expect(instance.getOpen()).toBe(true);
    expect(popup).toBeVisible();
    expect(root.contains(popup)).toBe(false);
    expect(document.getElementById("trigger")).toHaveAttribute("aria-describedby", popup.id);
    await settled();
    expect(createTooltip(root)).toBe(instance);
    expect(onOpenChange).not.toHaveBeenCalled();
    await act(() => renderer!.unmount());
    renderer = undefined;
    expect(popup.isConnected).toBe(false);
  });

  const missingPortalCases = ["controlled", "default", "closed"] as const;
  it.each(missingPortalCases)("rejects %s Tooltip without Portal", async (mode) => {
    const onOpenChange = vi.fn();
    await expect(
      mount(
        <TooltipRoot
          {...(mode === "controlled"
            ? { open: true }
            : mode === "default"
              ? { defaultOpen: true }
              : {})}
          onOpenChange={onOpenChange}
        >
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipPopup>Popup</TooltipPopup>
        </TooltipRoot>,
      ),
    ).rejects.toThrow("Starwind UI: <Tooltip.Portal> is missing.");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(document.querySelector("[data-sw-tooltip-popup]")).toBeNull();
  });

  it("allows a disabled Portal for inline placement", async () => {
    await mount(
      <TooltipRoot id="owner" open>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipPortal disabled>
          <TooltipPopup id="popup">Popup</TooltipPopup>
        </TooltipPortal>
      </TooltipRoot>,
    );
    expect(document.getElementById("owner")!.contains(document.getElementById("popup"))).toBe(true);
    expect(document.getElementById("popup")).toBeVisible();
  });

  it("refreshes an initially open explicit Portal when its container changes", async () => {
    let move!: () => void;
    function Fixture() {
      const [target, setTarget] = React.useState("#portal-a");
      move = () => setTarget("#portal-b");
      return (
        <>
          <div id="portal-a" />
          <div id="portal-b" />
          <TooltipRoot open>
            <TooltipTrigger id="trigger">Trigger</TooltipTrigger>
            <TooltipPortal container={target}>
              <TooltipPopup id="popup">Popup</TooltipPopup>
            </TooltipPortal>
          </TooltipRoot>
        </>
      );
    }
    await mount(<Fixture />);
    expect(document.getElementById("portal-a")!.contains(document.getElementById("popup"))).toBe(
      true,
    );
    await act(() => move());
    await settled();
    const popup = document.getElementById("popup")!;
    expect(document.getElementById("portal-b")!.contains(popup)).toBe(true);
    expect(popup).toBeVisible();
    expect(document.getElementById("trigger")).toHaveAttribute("aria-describedby", popup.id);
  });
});

for (const family of ["tooltip", "preview-card"] as const) {
  const OverlayRoot = family === "tooltip" ? TooltipRoot : PreviewCardRoot;
  const Trigger = family === "tooltip" ? TooltipTrigger : PreviewCardTrigger;
  const Popup = family === "tooltip" ? TooltipPopup : PreviewCardPopup;
  const Portal = family === "tooltip" ? TooltipPortal : React.Fragment;
  const factory = family === "tooltip" ? createTooltip : createPreviewCard;
  describe(`React ${family} trigger restoration`, () => {
    it("keeps the accepted anchor after cancellation and preserves pending work across callback/ref changes", async () => {
      let rerender!: () => void;
      let recreate!: () => void;
      const oldCallback = vi.fn();
      const newCallback = vi.fn();
      let reject = false;
      function Fixture() {
        const [revision, setRevision] = React.useState(0);
        const [delay, setDelay] = React.useState(50);
        rerender = () => setRevision(1);
        recreate = () => setDelay(60);
        return (
          <OverlayRoot
            id="owner"
            openDelay={delay}
            ref={() => {
              void revision;
            }}
            onOpenChange={(next, details) => {
              (revision ? newCallback : oldCallback)(next, details);
              if (reject) details.cancel();
            }}
          >
            <Trigger id="a" style={{ position: "fixed", left: 100, top: 200 }}>
              A
            </Trigger>
            <Trigger id="b" style={{ position: "fixed", left: 400, top: 200 }}>
              B
            </Trigger>
            <Portal>
              <Popup id="popup" side="bottom" align="start" avoidCollisions={false}>
                Popup
              </Popup>
            </Portal>
          </OverlayRoot>
        );
      }
      await mount(<Fixture />);
      const root = document.getElementById("owner")!;
      const instance = factory(root);
      const trigger = document.getElementById("b")!;
      await act(() =>
        trigger.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" })),
      );
      await act(() => rerender());
      expect(factory(root)).toBe(instance);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 75));
      });
      await settled();
      expect(instance.getOpen()).toBe(true);
      expect(left()).toBe(400);
      expect(oldCallback).not.toHaveBeenCalled();
      expect(newCallback).toHaveBeenCalledTimes(1);
      reject = true;
      await act(() => instance.setOpen(true, { trigger: document.getElementById("a")! }));
      await act(() => recreate());
      await settled();
      expect(left()).toBe(400);
      expect(newCallback).toHaveBeenCalledTimes(2);
      await act(() => factory(root).setOpen(false));
      // A retired connection cannot deliver its pending delay after unmount.
      reject = false;
      await act(() => factory(root).setOpen(false, { emit: false }));
      await act(() =>
        trigger.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" })),
      );
      const calls = newCallback.mock.calls.length;
      await act(() => renderer!.unmount());
      renderer = undefined;
      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(newCallback).toHaveBeenCalledTimes(calls);
      expect(document.getElementById("popup")).toBeNull();
    });

    if (family === "tooltip") {
      it("retains controlled B through disable, re-enable, and timing recreation", async () => {
        let setDisabled!: (disabled: boolean) => void;
        let recreate!: () => void;
        const proposal = vi.fn();
        function Fixture() {
          const [open, setOpen] = React.useState(false);
          const [disabled, updateDisabled] = React.useState(false);
          const [delay, setDelay] = React.useState(0);
          setDisabled = updateDisabled;
          recreate = () => setDelay(10);
          return (
            <TooltipRoot
              id="owner"
              open={open}
              disabled={disabled}
              openDelay={delay}
              onOpenChange={(next, details) => {
                proposal(next, details);
                setOpen(next);
              }}
            >
              <TooltipTrigger id="a" style={{ position: "fixed", left: 100, top: 200 }}>
                A
              </TooltipTrigger>
              <TooltipTrigger id="b" style={{ position: "fixed", left: 400, top: 200 }}>
                B
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipPopup id="popup" side="bottom" align="start" avoidCollisions={false}>
                  Popup
                </TooltipPopup>
              </TooltipPortal>
            </TooltipRoot>
          );
        }
        await mount(<Fixture />);
        const root = document.getElementById("owner")!;
        const original = createTooltip(root);
        await act(() =>
          document
            .getElementById("b")!
            .dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" })),
        );
        await settled();
        expect(left()).toBe(400);
        await act(() => setDisabled(true));
        expect(original.getOpen()).toBe(false);
        expect(document.getElementById("popup")!.hidden).toBe(true);
        await act(() => setDisabled(false));
        await settled();
        expect(createTooltip(root)).toBe(original);
        expect(original.getOpen()).toBe(true);
        expect(left()).toBe(400);
        await act(() => recreate());
        await settled();
        expect(createTooltip(root)).not.toBe(original);
        expect(createTooltip(root).getOpen()).toBe(true);
        expect(left()).toBe(400);
        expect(proposal).toHaveBeenCalledTimes(1);
      });
    }

    for (const controlled of [false, true]) {
      it(`retains accepted B through option recreation (${controlled ? "controlled" : "uncontrolled"})`, async () => {
        const proposal = vi.fn();
        let changeDelay!: () => void;
        function Fixture() {
          const [open, setOpen] = React.useState(false);
          const [delay, setDelay] = React.useState(0);
          changeDelay = () => setDelay(10);
          return (
            <OverlayRoot
              id="owner"
              openDelay={delay}
              {...(controlled ? { open } : {})}
              onOpenChange={(next, details) => {
                proposal(next, details);
                if (controlled) setOpen(next);
              }}
            >
              <Trigger id="a" style={{ position: "fixed", left: 100, top: 200, width: 40 }}>
                A
              </Trigger>
              <Trigger id="b" style={{ position: "fixed", left: 400, top: 200, width: 40 }}>
                B
              </Trigger>
              <Portal>
                <Popup id="popup" side="bottom" align="start" avoidCollisions={false}>
                  Popup
                </Popup>
              </Portal>
            </OverlayRoot>
          );
        }
        await mount(<Fixture />);
        const root = document.getElementById("owner")!;
        const first = factory(root);
        const accepted = vi.fn();
        first.subscribe("openChange", accepted);
        await act(() => {
          document
            .getElementById("a")!
            .dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
        });
        await act(() => {
          document
            .getElementById("b")!
            .dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
        });
        await settled();
        expect(first.getOpen()).toBe(true);
        expect(left()).toBe(400);
        expect(accepted).toHaveBeenCalledTimes(2);
        await act(() => changeDelay());
        await settled();
        const second = factory(root);
        expect(second).not.toBe(first);
        expect(second.getOpen()).toBe(true);
        expect(left()).toBe(400);
        expect(proposal).toHaveBeenCalledTimes(2);
        expect(accepted).toHaveBeenCalledTimes(2);
        await act(() => renderer!.unmount());
        renderer = undefined;
        document
          .getElementById("b")
          ?.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
        expect(document.getElementById("popup")).toBeNull();
      });
    }
  });
}

async function mount(element: React.ReactNode) {
  container = document.createElement("div");
  document.body.append(container);
  renderer = createRoot(container);
  await act(() => renderer!.render(element));
  await settled();
}
async function settled() {
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
}
function left() {
  return Math.round(document.getElementById("popup")!.getBoundingClientRect().left);
}
