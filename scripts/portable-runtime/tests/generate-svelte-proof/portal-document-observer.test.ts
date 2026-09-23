import { afterEach, expect, it, vi } from "vitest";
import { observePortalDocument } from "../../../../packages/svelte/src/_internal/portal-document-observer.js";
import {
  buildPrimitiveVendoringArtifacts,
  createCliRegistryBuildPolicy,
} from "../../generate-cli-registry.js";
import { svelteFrameworkAdapterTarget } from "../../renderers/framework-adapters/svelte/index.js";
import { SVELTE_OVERLAY_CAPTURE_COMPONENTS } from "../../renderers/framework-adapters/svelte/overlay-capture.js";
import { SVELTE_PORTAL_OBSERVER_COMPONENTS } from "../../renderers/framework-adapters/svelte/portal-document-observer.js";

afterEach(() => vi.restoreAllMocks());

function documentFixture() {
  const instances: Observer[] = [];
  class Observer {
    observe = vi.fn();
    disconnect = vi.fn();
    constructor(readonly dispatch: () => void) {
      instances.push(this);
    }
  }
  const document = { defaultView: { MutationObserver: Observer } } as unknown as Document;
  return { document, instances };
}

it("shares a document observer while each subscription has its own lifetime", () => {
  const { document, instances } = documentFixture();
  const refresh = vi.fn();
  const first = observePortalDocument(document, refresh);
  const second = observePortalDocument(document, refresh);
  expect(instances).toHaveLength(1);
  expect(instances[0].observe).toHaveBeenCalledExactlyOnceWith(document, {
    childList: true,
    subtree: true,
  });
  instances[0].dispatch();
  expect(refresh).toHaveBeenCalledTimes(2);
  first();
  first();
  instances[0].dispatch();
  expect(refresh).toHaveBeenCalledTimes(3);
  expect(instances[0].disconnect).not.toHaveBeenCalled();
  second();
  second();
  expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
  instances[0].dispatch();
  expect(refresh).toHaveBeenCalledTimes(3);
  const stop = observePortalDocument(document, refresh);
  expect(instances).toHaveLength(2);
  stop();
});

it("uses each document's constructor and isolates its subscriptions", () => {
  const a = documentFixture(),
    b = documentFixture();
  const first = vi.fn(),
    second = vi.fn();
  const stopA = observePortalDocument(a.document, first);
  const stopB = observePortalDocument(b.document, second);
  a.instances[0].dispatch();
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).not.toHaveBeenCalled();
  stopA();
  b.instances[0].dispatch();
  expect(second).toHaveBeenCalledTimes(1);
  expect(b.instances[0].disconnect).not.toHaveBeenCalled();
  stopB();
});

it("skips removed subscribers and defers new subscribers to the next dispatch", () => {
  const { document, instances } = documentFixture();
  const calls: string[] = [];
  let stopLast = () => {},
    added = false;
  const stopFirst = observePortalDocument(document, () => {
    calls.push("first");
    stopSecond();
    if (!added) {
      added = true;
      stopLast = observePortalDocument(document, () => calls.push("last"));
    }
  });
  const stopSecond = observePortalDocument(document, () => calls.push("second"));
  instances[0].dispatch();
  expect(calls).toEqual(["first"]);
  instances[0].dispatch();
  expect(calls).toEqual(["first", "first", "last"]);
  stopFirst();
  stopLast();
});

it("reports callback failures asynchronously after dispatching the remaining snapshot", () => {
  const { document, instances } = documentFixture();
  const queued: VoidFunction[] = [];
  vi.spyOn(globalThis, "queueMicrotask").mockImplementation((callback) => {
    queued.push(callback);
  });
  const error = new Error("placement failed"),
    next = vi.fn();
  const stopFirst = observePortalDocument(document, () => {
    throw error;
  });
  const stopNext = observePortalDocument(document, next);
  expect(() => instances[0].dispatch()).not.toThrow();
  expect(next).toHaveBeenCalledTimes(1);
  expect(queued).toHaveLength(1);
  expect(queued[0]).toThrow(error);
  stopFirst();
  stopNext();
});

it("keeps a new registry alive when an old subscription retires during dispatch", () => {
  const { document, instances } = documentFixture();
  const next = vi.fn();
  let stopNext = () => {};
  const stop = observePortalDocument(document, () => {
    stop();
    stopNext = observePortalDocument(document, next);
  });
  instances[0].dispatch();
  expect(instances).toHaveLength(2);
  expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
  stop();
  instances[0].dispatch();
  expect(next).not.toHaveBeenCalled();
  instances[1].dispatch();
  expect(next).toHaveBeenCalledTimes(1);
  stopNext();
  expect(instances[1].disconnect).toHaveBeenCalledTimes(1);
});

it("performs no observer work without a document window or observer constructor", () => {
  expect(globalThis).not.toHaveProperty("document");
  for (const document of [{ defaultView: null }, { defaultView: {} }]) {
    const stop = observePortalDocument(document as Document, () => {
      throw new Error("unexpected refresh");
    });
    expect(() => {
      stop();
      stop();
    }).not.toThrow();
  }
});

it.each(["portal-document-observer.ts", "portal-placement.ts"])(
  "delivers one shared %s path through every private Portal artifact",
  async (helper) => {
    const artifacts = await buildPrimitiveVendoringArtifacts({
      targetPolicy: createCliRegistryBuildPolicy([svelteFrameworkAdapterTarget]),
    });
    const helpers = [];
    for (const name of SVELTE_PORTAL_OBSERVER_COMPONENTS) {
      const artifact = artifacts.primitives.find(
        (item) => item.component === name && item.framework === "svelte",
      )!;
      const found = artifact.files.filter((file) => file.path.endsWith(`/_internal/${helper}`));
      expect(found, name).toHaveLength(1);
      expect(found[0].content).toContain("You own this file");
      helpers.push(found[0]);
    }
    expect(new Set(helpers.map((file) => file.path)).size).toBe(1);
    expect(new Set(helpers.map((file) => file.content)).size).toBe(1);
  },
);

it("delivers shared capture discovery through each scoped overlay artifact", async () => {
  const artifacts = await buildPrimitiveVendoringArtifacts({
    targetPolicy: createCliRegistryBuildPolicy([svelteFrameworkAdapterTarget]),
  });
  const helpers = [];
  for (const name of SVELTE_OVERLAY_CAPTURE_COMPONENTS.filter(
    (name) => !["popover", "tooltip", "preview-card"].includes(name),
  )) {
    const artifact = artifacts.primitives.find(
      (item) => item.component === name && item.framework === "svelte",
    )!;
    const found = artifact.files.filter((file) =>
      file.path.endsWith("/_internal/overlay-capture.ts"),
    );
    expect(found, name).toHaveLength(1);
    expect(found[0].content).toContain("You own this file");
    helpers.push(found[0]);
  }
  expect(new Set(helpers.map((file) => file.path)).size).toBe(1);
  expect(new Set(helpers.map((file) => file.content)).size).toBe(1);
});
