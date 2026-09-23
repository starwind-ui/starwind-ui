import assert from "node:assert/strict";
import ts from "typescript";
import { describe, it } from "vitest";
import { emitCommands } from "../renderers/shared-recipes/simple/emit.js";
import {
  type CommandRecipe,
  progress,
  type Target,
} from "../renderers/shared-recipes/simple/recipe.js";

function run(target: Target, recipe: CommandRecipe) {
  const events: string[] = [];
  const scheduled: (() => void)[] = [];
  const cleanups: (() => void)[] = [];
  const effect = (callback: () => void | (() => void)) =>
    scheduled.push(() => {
      const cleanup = callback();
      if (cleanup) cleanups.push(cleanup);
    });
  const props = {
    value: 25,
    min: 0,
    max: 100,
    format: undefined,
    locale: undefined,
    getAriaValueText: undefined,
    ariaValuetext: undefined,
  };
  const controller = {
    setFormatOptions: () => events.push("format"),
    setValue: () => events.push("value"),
    destroy: () => events.push("destroy"),
  };
  const rootRef = target === "react" ? { current: {} } : { value: {} };
  const body = ts.transpileModule(
    `${emitCommands(recipe, target)}\n${target === "svelte" ? "attachRuntime({});" : ""}`,
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } },
  ).outputText;
  const execute = new Function(
    "React",
    "useIsomorphicLayoutEffect",
    "onMounted",
    "onBeforeUnmount",
    "watch",
    "$effect",
    "untrack",
    "rootRef",
    "props",
    "createProgress",
    "value",
    "min",
    "max",
    "format",
    "locale",
    "getAriaValueText",
    "ariaValueText",
    body,
  );
  execute(
    { useRef: (current: unknown) => ({ current }) },
    effect,
    effect,
    (cb: () => void) => cleanups.push(cb),
    (_reads: unknown, cb: () => void) => effect(cb),
    effect,
    (cb: () => unknown) => cb(),
    rootRef,
    props,
    () => {
      events.push("create");
      return controller;
    },
    25,
    0,
    100,
    undefined,
    undefined,
    undefined,
    undefined,
  );
  while (scheduled.length) scheduled.shift()!();
  for (const cleanup of cleanups.reverse()) cleanup();
  return events;
}

describe("shared recipe command order", () => {
  it.each(["react", "vue", "svelte"] as const)(
    "executes Progress format before value and cleans up in %s",
    (target) => {
      assert.deepEqual(run(target, progress), ["create", "format", "value", "destroy"]);
      assert.deepEqual(run(target, { ...progress, commands: [...progress.commands].reverse() }), [
        "create",
        "value",
        "format",
        "destroy",
      ]);
    },
  );
});
