import { describe, expect, it } from "vitest";

import {
  createCancelableDetails,
  dispatchCancelableDetailsEvent,
} from "../../src/internal/cancelable-details";

describe("cancelable details", () => {
  it("adds cancel state without flattening custom detail fields", () => {
    const details = createCancelableDetails({
      event: new Event("click"),
      open: true,
      previousOpen: false,
      reason: "trigger-press" as const,
    });

    expect(details.open).toBe(true);
    expect(details.previousOpen).toBe(false);
    expect(details.reason).toBe("trigger-press");
    expect(details.isCanceled).toBe(false);

    details.cancel();

    expect(details.isCanceled).toBe(true);
  });

  it("mirrors cancelable DOM preventDefault into the details cancellation state", () => {
    const target = document.createElement("div");
    const details = createCancelableDetails({ open: true });
    document.body.append(target);

    target.addEventListener(
      "starwind:test-change",
      (event) => {
        expect((event as CustomEvent<typeof details>).detail).toBe(details);
        event.preventDefault();
      },
      { once: true },
    );

    const event = dispatchCancelableDetailsEvent(target, "starwind:test-change", details);

    expect(event.cancelable).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(details.isCanceled).toBe(true);
  });

  it("does not cancel details when a DOM event is not cancelable", () => {
    const target = document.createElement("div");
    const details = createCancelableDetails({ open: true });
    document.body.append(target);

    target.addEventListener(
      "starwind:test-change",
      (event) => {
        event.preventDefault();
      },
      { once: true },
    );

    const event = dispatchCancelableDetailsEvent(target, "starwind:test-change", details, {
      cancelable: false,
    });

    expect(event.cancelable).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(details.isCanceled).toBe(false);
  });
});
