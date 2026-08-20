import { afterEach, describe, expect, it } from "vitest";

import { createDialogTopLayerHost } from "../../src/internal/dialog-top-layer-host";
import { resolveFloatingPortalTarget } from "../../src/internal/portal-target-policy";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("DialogTopLayerHost", () => {
  it("creates one manual-popover host inside each native Dialog", () => {
    const dialog = createOpenDialog();
    const first = createDialogTopLayerHost(dialog);
    const second = createDialogTopLayerHost(dialog);

    expect(second).toBe(first);
    expect(first.host.parentElement).toBe(dialog);
    expect(first.host).toHaveAttribute("popover", "manual");
    expect(first.host.style.pointerEvents).toBe("none");
    expect(first.floatingRoot.style.pointerEvents).toBe("none");
    expect(resolveFloatingPortalTarget(dialog)).toBe(first.floatingRoot);
    expect(first.show()).toBe(true);
    expect(first.host.matches(":popover-open")).toBe(true);

    first.hide();
    expect(first.host.matches(":popover-open")).toBe(false);
    first.destroy();
    expect(dialog.querySelector("[data-sw-dialog-top-layer-host]")).toBeNull();
    expect(resolveFloatingPortalTarget(dialog)).toBe(dialog);
    dialog.close();
  });

  it("keeps the local dialog descendant target when Popover promotion fails", () => {
    const dialog = createOpenDialog();
    const host = createDialogTopLayerHost(dialog);
    host.host.showPopover = () => {
      throw new DOMException("Popover promotion unavailable");
    };

    expect(host.show()).toBe(false);
    expect(host.host.parentElement).toBe(dialog);
    expect(resolveFloatingPortalTarget(dialog)).toBe(host.floatingRoot);

    host.destroy();
    dialog.close();
  });
});

function createOpenDialog(): HTMLDialogElement {
  const dialog = document.createElement("dialog");
  dialog.setAttribute("data-sw-dialog-content", "");
  document.body.append(dialog);
  dialog.showModal();
  return dialog;
}
