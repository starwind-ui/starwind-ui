import assert from "node:assert/strict";
import ts from "typescript";
import { describe, it } from "vitest";
import type { Target } from "../renderers/shared-recipes/structured/operations.js";
import { type PopoverPlan, popoverPlan } from "../renderers/shared-recipes/structured/plan.js";
import { renderRoot } from "../renderers/shared-recipes/structured/popover.js";

/** Execute the lifecycle functions extracted from each fully generated root.
 * Framework scheduling is tested separately in real browsers. This probe isolates publication
 * timing with a small public-facade double so same-turn observations are deterministic.
 */
function lifecycleFromGeneratedRoot(target: Target, plan: PopoverPlan): string {
  const source = renderRoot(target, plan);
  const start = source.indexOf("function disconnectRuntime()");
  const end = source.indexOf("\n  }", source.indexOf("function applyParentCommand()", start));
  assert.ok(start >= 0 && end > start);
  return source.slice(start, end + 4);
}
function mountGenerated(target: Target, plan: PopoverPlan) {
  const events: string[] = [];
  let proposal: ((value: boolean) => void) | undefined;
  let canceled = false;
  let destroyed = 0;
  let liveSubscriptions = 0;
  const factory = (_root: unknown, options: Record<string, any>) => {
    let current = options.open ?? options.defaultOpen;
    let listener: ((detail: any) => void) | undefined;
    proposal = (value) => {
      const detail = {
        open: value,
        reason: "trigger-press",
        cancel() {
          canceled = true;
        },
      };
      canceled = false;
      options.onOpenChange(value, detail);
      if (canceled) return;
      current = value;
      events.push(`runtime-accepted:${value}`);
      listener?.(detail);
    };
    return {
      getOpen: () => current,
      setOpen: (value: boolean, setterOptions: Record<string, unknown>) => {
        assert.equal(setterOptions.emit, false);
        current = value;
      },
      subscribe: (name: string, callback: (detail: any) => void) => {
        assert.equal(name, "openChange");
        liveSubscriptions++;
        listener = callback;
        return () => {
          liveSubscriptions--;
          listener = undefined;
        };
      },
      destroy: () => {
        destroyed++;
      },
    };
  };
  const source = `
    const createPopover = factory;
    let cancelNext = false;
    let open: boolean | undefined;
    let renderedOpen = false;
    const closeOnEscape = true, closeOnOutsideInteract = true, modal = false, openOnHover = false;
    const onOpenChange = (next: boolean, detail: {cancel(): void}) => { events.push('proposal:' + next); if (cancelNext) detail.cancel(); };
    const onCloseComplete = () => { events.push('complete'); };
    const props = { open, closeOnEscape, closeOnOutsideInteract, modal, openOnHover, onOpenChange, onCloseComplete };
    const inputs = { current: props };
    const uncontrolledOpen = { get value() { return renderedOpen; }, set value(next) { renderedOpen = next; } };
    const setRenderedOpen = (next: boolean) => { renderedOpen = next; };
    const emit = (name: string, ...args: any[]) => {
      if (name === 'openChange') onOpenChange(args[0], args[1]);
      else events.push(name + ':' + args[0]);
    };
    const untrack = (callback: () => void) => callback();
    const connection = { accepted: false, initialized: false } as any;
    ${lifecycleFromGeneratedRoot(target, plan)}
    return {
      connect: () => connectRuntime({} as HTMLDivElement),
      dispose: disconnectRuntime,
      command: (value: boolean) => { open = value; props.open = value; applyParentCommand(); },
      cancel: (value: boolean) => { cancelNext = value; },
      read: () => ({ rendered: ${target === "svelte" ? "renderedOpen" : "props.open ?? renderedOpen"}, model: open, accepted: connection.instance?.getOpen() }),
    };
  `;
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const api = new Function("factory", "events", compiled)(factory, events) as {
    connect(): void;
    dispose(): void;
    command(value: boolean): void;
    cancel(value: boolean): void;
    read(): { rendered: boolean; model?: boolean; accepted?: boolean };
  };
  api.connect();
  return {
    ...api,
    events,
    click: () => proposal!(true),
    resources: () => ({ destroyed, liveSubscriptions }),
  };
}

describe("shared accepted overlay lifecycle", () => {
  it.each(["react", "vue", "svelte"] as const)(
    "keeps canceled state, accepts changes, applies silent props, and disposes in %s",
    (target) => {
      const f = mountGenerated(target, popoverPlan);
      f.cancel(true);
      f.click();
      assert.equal(f.read().rendered, false);
      assert.deepEqual(f.events, ["proposal:true"]);
      f.cancel(false);
      f.events.length = 0;
      f.click();
      assert.equal(f.read().accepted, true);
      assert.equal(f.read().rendered, true);
      assert.deepEqual(f.events.slice(0, 2), ["proposal:true", "runtime-accepted:true"]);
      f.command(false);
      assert.equal(f.read().accepted, false);
      assert.equal(f.read().rendered, false);
      f.dispose();
      assert.deepEqual(f.resources(), { destroyed: 1, liveSubscriptions: 0 });
    },
  );
});
