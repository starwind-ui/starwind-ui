export type DialogTopLayerHost = {
  readonly floatingRoot: HTMLElement;
  readonly host: HTMLElement;
  destroy(): void;
  hide(): void;
  show(): boolean;
};

const hosts = new WeakMap<HTMLDialogElement, DialogTopLayerHost>();

export function createDialogTopLayerHost(owner: HTMLDialogElement): DialogTopLayerHost {
  const existing = hosts.get(owner);
  if (existing) return existing;

  const host = owner.ownerDocument.createElement("div");
  host.setAttribute("data-sw-dialog-top-layer-host", "");
  host.setAttribute("popover", "manual");
  host.style.cssText = [
    "position: fixed",
    "inset: 0",
    "width: 100vw",
    "height: 100vh",
    "max-width: none",
    "max-height: none",
    "margin: 0",
    "padding: 0",
    "border: 0",
    "overflow: visible",
    "background: transparent",
    "pointer-events: none",
  ].join(";");
  const floatingRoot = owner.ownerDocument.createElement("div");
  floatingRoot.setAttribute("data-floating-root", "");
  floatingRoot.setAttribute("data-sw-floating-root", "dialog");
  floatingRoot.style.pointerEvents = "none";
  host.append(floatingRoot);
  owner.append(host);
  const unregisterFloatingRoot = registerDialogTopLayerFloatingRoot(owner, floatingRoot);

  let destroyed = false;
  const result: DialogTopLayerHost = {
    floatingRoot,
    host,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      this.hide();
      unregisterFloatingRoot();
      host.remove();
      if (hosts.get(owner) === result) hosts.delete(owner);
    },
    hide() {
      if (!host.matches(":popover-open")) return;
      try {
        host.hidePopover();
      } catch {
        // Removing or closing the owner also clears its native top-layer entry.
      }
    },
    show() {
      if (destroyed || !owner.open) return false;
      if (host.matches(":popover-open")) return true;
      if (typeof host.showPopover !== "function") return false;
      try {
        host.showPopover();
      } catch {
        return false;
      }
      return host.matches(":popover-open");
    },
  };
  hosts.set(owner, result);
  return result;
}
import { registerDialogTopLayerFloatingRoot } from "./portal-target-policy";
