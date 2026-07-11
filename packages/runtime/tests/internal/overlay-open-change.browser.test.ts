import { describe, expect, it, vi } from "vitest";

import { runOverlayOpenChangeShell } from "../../src/internal/overlay-open-change";

describe("overlay open-change shell", () => {
  it("runs the uncontrolled open-change sequence in order", () => {
    const root = document.createElement("div");
    const order: string[] = [];
    let callbackDetails: unknown;
    let eventDetails: unknown;
    document.body.append(root);

    root.addEventListener("starwind:open-change", (event) => {
      order.push("dom-event");
      eventDetails = (event as CustomEvent).detail;
    });

    const result = runOverlayOpenChangeShell({
      root,
      controlled: false,
      open: true,
      previousOpen: false,
      request: { reason: "trigger-press" as const },
      onBeforeOpenChange: () => {
        order.push("intent");
      },
      onOpenChange: (_open, details) => {
        order.push("callback");
        callbackDetails = details;
      },
      onApplyControlledOpenState: () => {
        order.push("controlled");
      },
      onApplyUncontrolledOpenState: ({ details }) => {
        order.push("uncontrolled");
        expect(details.open).toBe(true);
      },
      onNotifyOpenChangeSubscribers: () => {
        order.push("notify");
      },
    });

    expect(result.status).toBe("applied");
    expect(order).toEqual(["intent", "callback", "dom-event", "uncontrolled", "notify"]);
    expect(eventDetails).toBe(callbackDetails);
  });

  it("blocks before details and events when the intent hook returns false", () => {
    const root = document.createElement("div");
    const onOpenChange = vi.fn();
    const onApplyUncontrolledOpenState = vi.fn();
    const onNotifyOpenChangeSubscribers = vi.fn();
    document.body.append(root);

    const result = runOverlayOpenChangeShell({
      root,
      controlled: false,
      open: false,
      previousOpen: true,
      request: { reason: "outside-press" as const },
      onBeforeOpenChange: () => false,
      onOpenChange,
      onApplyUncontrolledOpenState,
      onNotifyOpenChangeSubscribers,
    });

    expect(result.status).toBe("blocked");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onApplyUncontrolledOpenState).not.toHaveBeenCalled();
    expect(onNotifyOpenChangeSubscribers).not.toHaveBeenCalled();
  });

  it("mirrors DOM preventDefault cancellation before applying state or notifying subscribers", () => {
    const root = document.createElement("div");
    const onApplyUncontrolledOpenState = vi.fn();
    const onNotifyOpenChangeSubscribers = vi.fn();
    document.body.append(root);

    root.addEventListener("starwind:open-change", (event) => {
      event.preventDefault();
    });

    const result = runOverlayOpenChangeShell({
      root,
      controlled: false,
      open: true,
      previousOpen: false,
      request: { reason: "trigger-press" as const },
      onApplyUncontrolledOpenState,
      onNotifyOpenChangeSubscribers,
    });

    expect(result.status).toBe("canceled");
    if (result.status !== "canceled") {
      throw new Error(`Expected canceled result, received ${result.status}.`);
    }
    expect(result.details.isCanceled).toBe(true);
    expect(onApplyUncontrolledOpenState).not.toHaveBeenCalled();
    expect(onNotifyOpenChangeSubscribers).not.toHaveBeenCalled();
  });

  it("allows onOpenChange details cancellation before applying state or notifying subscribers", () => {
    const root = document.createElement("div");
    const onApplyUncontrolledOpenState = vi.fn();
    const onNotifyOpenChangeSubscribers = vi.fn();
    let callbackDetails: unknown;
    let eventDetails: unknown;
    document.body.append(root);

    root.addEventListener("starwind:open-change", (event) => {
      eventDetails = (event as CustomEvent).detail;
    });

    const result = runOverlayOpenChangeShell({
      root,
      controlled: false,
      open: true,
      previousOpen: false,
      request: { reason: "trigger-press" as const },
      onOpenChange: (_open, details) => {
        callbackDetails = details;
        details.cancel();
      },
      onApplyUncontrolledOpenState,
      onNotifyOpenChangeSubscribers,
    });

    expect(result.status).toBe("canceled");
    if (result.status !== "canceled") {
      throw new Error(`Expected canceled result, received ${result.status}.`);
    }
    expect(result.details.isCanceled).toBe(true);
    expect(eventDetails).toBe(callbackDetails);
    expect(onApplyUncontrolledOpenState).not.toHaveBeenCalled();
    expect(onNotifyOpenChangeSubscribers).not.toHaveBeenCalled();
  });

  it("routes controlled requests through the controlled lifecycle hook", () => {
    const root = document.createElement("div");
    const onApplyControlledOpenState = vi.fn();
    const onApplyUncontrolledOpenState = vi.fn();
    document.body.append(root);

    const result = runOverlayOpenChangeShell({
      root,
      controlled: true,
      open: true,
      previousOpen: false,
      request: { reason: "trigger-press" as const },
      onApplyControlledOpenState,
      onApplyUncontrolledOpenState,
    });

    expect(result.status).toBe("applied");
    expect(onApplyControlledOpenState).toHaveBeenCalledWith(
      expect.objectContaining({
        open: true,
        previousOpen: false,
        request: { reason: "trigger-press" },
      }),
    );
    expect(onApplyUncontrolledOpenState).not.toHaveBeenCalled();
  });

  it("maps component-specific trigger metadata into public details", () => {
    const root = document.createElement("div");
    const trigger = document.createElement("button");
    const shell = document.createElement("span");
    document.body.append(root, trigger);
    let eventDetails: unknown;

    root.addEventListener("starwind:open-change", (event) => {
      eventDetails = (event as CustomEvent).detail;
    });

    const result = runOverlayOpenChangeShell({
      root,
      controlled: false,
      open: true,
      previousOpen: false,
      request: { reason: "trigger-hover" as const, trigger: { shell, target: trigger } },
      getTrigger: (request) => request.trigger.target,
    });

    expect(result.status).toBe("applied");
    if (result.status !== "applied") {
      throw new Error(`Expected applied result, received ${result.status}.`);
    }
    expect(result.details.trigger).toBe(trigger);
    expect((eventDetails as CustomEvent["detail"]).trigger).toBe(trigger);
  });

  it("uses Element request triggers by default", () => {
    const root = document.createElement("div");
    const trigger = document.createElement("button");
    document.body.append(root, trigger);

    const result = runOverlayOpenChangeShell({
      root,
      controlled: false,
      open: true,
      previousOpen: false,
      request: { reason: "trigger-press" as const, trigger },
    });

    expect(result.status).toBe("applied");
    if (result.status !== "applied") {
      throw new Error(`Expected applied result, received ${result.status}.`);
    }
    expect(result.details.trigger).toBe(trigger);
  });
});
