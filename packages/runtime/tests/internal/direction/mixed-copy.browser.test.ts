import { afterEach, describe, expect, it, vi } from "vitest";

import { type Direction, subscribeDirection } from "../../../src/internal/direction";
import { shared } from "../../../src/internal/shared";

type DirectionChangeService = {
  projections: Set<() => boolean>;
  owners: Set<() => unknown>;
  handle: (event: Event) => void;
};

type BuiltColorPicker = {
  createColorPicker(root: HTMLElement): { destroy(): void };
};

const services = shared<WeakMap<Document, DirectionChangeService>>("direction-change");

async function loadBuiltColorPicker(): Promise<BuiltColorPicker> {
  // Build packages/runtime first. A missing or broken build must fail this test.
  const moduleUrl = new URL("../../../dist/color-picker.js", import.meta.url).href;
  return (await import(/* @vite-ignore */ moduleUrl)) as BuiltColorPicker;
}

const directionChange = () => {
  document.dispatchEvent(new Event("starwind:direction-change"));
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("direction-change listener across source and built Runtime copies", () => {
  it.each(["source-first", "dist-first"] as const)(
    "installs one listener, reaches both copies, and removes it in %s order",
    async (order) => {
      const built = await loadBuiltColorPicker();
      const scope = document.createElement("div");
      scope.dir = "ltr";
      scope.innerHTML = `<div data-sw-color-picker></div><div data-source-owner></div>`;
      document.body.append(scope);
      const root = scope.querySelector<HTMLElement>("[data-sw-color-picker]")!;
      const sourceOwner = scope.querySelector<HTMLElement>("[data-source-owner]")!;
      const sourceChanges: Direction[] = [];
      let source: ReturnType<typeof subscribeDirection> | undefined;
      let picker: ReturnType<BuiltColorPicker["createColorPicker"]> | undefined;
      const add = vi.spyOn(document, "addEventListener");
      const remove = vi.spyOn(document, "removeEventListener");
      const listenerCalls = (spy: typeof add | typeof remove) =>
        spy.mock.calls.filter(([type]) => type === "starwind:direction-change");

      try {
        expect(services.has(document)).toBe(false);
        const startSource = () => {
          source = subscribeDirection(sourceOwner, (direction) => sourceChanges.push(direction));
        };
        const startBuilt = () => {
          picker = built.createColorPicker(root);
        };
        if (order === "source-first") {
          startSource();
          startBuilt();
        } else {
          startBuilt();
          startSource();
        }

        const service = services.get(document);
        expect(service).toBeDefined();
        expect(service!.projections.size).toBe(1);
        expect(service!.owners.size).toBe(1);
        expect(listenerCalls(add)).toHaveLength(1);
        expect(root.dir).toBe("ltr");

        scope.dir = "rtl";
        expect(root.dir).toBe("ltr");
        directionChange();
        expect(root.dir).toBe("rtl");
        expect(sourceChanges).toEqual(["rtl"]);
        scope.dir = "ltr";
        directionChange();
        expect(root.dir).toBe("ltr");
        expect(sourceChanges).toEqual(["rtl", "ltr"]);

        if (order === "source-first") {
          source!.destroy();
          expect(services.get(document)).toBe(service);
          expect(service!.projections.size).toBe(1);
          picker!.destroy();
        } else {
          picker!.destroy();
          expect(services.get(document)).toBe(service);
          expect(service!.owners.size).toBe(1);
          source!.destroy();
        }
        expect(services.has(document)).toBe(false);
        expect(listenerCalls(remove)).toEqual([["starwind:direction-change", service!.handle]]);
        scope.dir = "rtl";
        directionChange();
        expect(sourceChanges).toEqual(["rtl", "ltr"]);
        expect(root.hasAttribute("dir")).toBe(false);
      } finally {
        source?.destroy();
        picker?.destroy();
        add.mockRestore();
        remove.mockRestore();
      }
    },
  );

  it("works beside an older copy's direction-service registry value", () => {
    const legacy = shared<WeakMap<Document, { owners: Set<unknown> }>>("direction-service");
    const legacyValue = { owners: new Set<unknown>() };
    legacy.set(document, legacyValue);
    const scope = document.createElement("div");
    const owner = document.createElement("span");
    scope.append(owner);
    document.body.append(scope);
    const changes: Direction[] = [];
    const subscription = subscribeDirection(owner, (direction) => changes.push(direction));
    try {
      scope.dir = "rtl";
      directionChange();
      expect(changes).toEqual(["rtl"]);
      expect(legacy.get(document)).toBe(legacyValue);
      expect(legacyValue.owners.size).toBe(0);
    } finally {
      subscription.destroy();
      legacy.delete(document);
    }
  });
});
