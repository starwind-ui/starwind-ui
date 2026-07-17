import { beforeEach, describe, expect, it, vi } from "vitest";

import { scheduleStarwindInit } from "../../src/internal/events";

describe("scheduleStarwindInit", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("coalesces connected nested roots and keeps same-document reparenting valid", async () => {
    const outer = document.createElement("section");
    const inner = document.createElement("div");
    outer.append(inner);
    document.body.append(outer);
    const nextParent = document.createElement("main");
    document.body.append(nextParent);
    const listener = vi.fn();
    document.addEventListener("starwind:init", listener);

    scheduleStarwindInit(inner);
    scheduleStarwindInit(outer);
    nextParent.append(outer);
    await waitForMicrotasks();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { root: outer } }));

    document.removeEventListener("starwind:init", listener);
  });

  it("cancels one request without dropping other roots", async () => {
    const canceledRoot = document.createElement("div");
    const validRoot = document.createElement("div");
    document.body.append(canceledRoot, validRoot);
    const listener = vi.fn();
    document.addEventListener("starwind:init", listener);

    const canceled = scheduleStarwindInit(canceledRoot);
    scheduleStarwindInit(validRoot);
    canceled.cancel();
    await waitForMicrotasks();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { root: validRoot } }));

    document.removeEventListener("starwind:init", listener);
  });

  it("transfers adopted roots to the current document and event realm", async () => {
    const adoptedRoot = document.createElement("div");
    document.body.append(adoptedRoot);
    const staleDocumentListener = vi.fn();
    const currentDocumentListener = vi.fn();
    document.addEventListener("starwind:init", staleDocumentListener);
    const otherDocument = document.implementation.createHTMLDocument("other");
    otherDocument.addEventListener("starwind:init", currentDocumentListener);

    scheduleStarwindInit(adoptedRoot);
    otherDocument.body.append(otherDocument.adoptNode(adoptedRoot));
    await waitForMicrotasks();
    await waitForMicrotasks();

    expect(adoptedRoot.isConnected).toBe(true);
    expect(staleDocumentListener).not.toHaveBeenCalled();
    expect(currentDocumentListener).toHaveBeenCalledTimes(1);
    expect(currentDocumentListener).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { root: adoptedRoot } }),
    );

    document.removeEventListener("starwind:init", staleDocumentListener);
    otherDocument.removeEventListener("starwind:init", currentDocumentListener);
  });
});

async function waitForMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
