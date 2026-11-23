// Compares server HTML attributes across targets for parts that SvelteKit, Nuxt and Next users see
// before hydration. Svelte must print the same Runtime state hooks as the other targets.
import { describe, expect, it } from "vitest";
import {
  type EmissionTarget,
  parseElements,
  partFile,
  type RenderNode,
  renderTree,
} from "./render";

type Case = {
  name: string;
  family: string;
  targets: readonly EmissionTarget[];
  tree: Tree;
  // The part to read, and the attributes it must print. `null` means the attribute is absent.
  part: string;
  expected: Record<string, string | null>;
};

type Tree = { part: string; props?: Record<string, unknown>; children?: Tree[] };

const markers: Record<string, string> = {
  "navigation-menu": "data-sw-nav-menu",
  select: "data-sw-select",
  combobox: "data-sw-combobox",
};

const navigationMenu: Tree = {
  part: "root",
  props: { defaultValue: "a" },
  children: [
    {
      part: "list",
      children: [{ part: "item", props: { value: "a" }, children: [{ part: "trigger" }] }],
    },
  ],
};

const select = (props: Record<string, unknown> = {}): Tree => ({
  part: "root",
  props,
  children: [{ part: "trigger" }],
});

const combobox = (props: Record<string, unknown> = {}): Tree => ({
  part: "root",
  props,
  children: [{ part: "input" }, { part: "trigger" }, { part: "clear" }],
});

const cases: Case[] = [
  {
    name: "Navigation Menu Root prints its uncontrolled default value",
    family: "navigation-menu",
    targets: ["astro", "react", "vue", "svelte"],
    tree: navigationMenu,
    part: "root",
    expected: { "data-default-value": "a", "data-state": "open" },
  },
  {
    name: "Select Trigger leaves aria-disabled out while enabled",
    family: "select",
    targets: ["astro", "react", "vue", "svelte"],
    tree: select(),
    part: "trigger",
    expected: { "aria-disabled": null, "data-state": "closed" },
  },
  {
    name: "Combobox Trigger prints its closed state",
    family: "combobox",
    targets: ["astro", "react", "vue", "svelte"],
    tree: combobox(),
    part: "trigger",
    expected: { "aria-disabled": null, "data-state": "closed" },
  },
  // Astro has no framework state before its Runtime starts, so it writes these at init.
  {
    name: "disabled Combobox Trigger prints aria-disabled",
    family: "combobox",
    targets: ["react", "vue", "svelte"],
    tree: combobox({ disabled: true }),
    part: "trigger",
    expected: { "aria-disabled": "true", "data-state": "closed" },
  },
  {
    name: "disabled Combobox Clear prints aria-disabled",
    family: "combobox",
    targets: ["react", "vue", "svelte"],
    tree: combobox({ disabled: true }),
    part: "clear",
    expected: { "aria-disabled": "true" },
  },
];

function pascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match, _dash, letter: string) => letter.toUpperCase());
}

async function toNode(target: EmissionTarget, family: string, tree: Tree): Promise<RenderNode> {
  const module = (await import(/* @vite-ignore */ partFile(target, family, tree.part))) as {
    default: unknown;
  };
  return {
    component: module.default,
    props: tree.props ?? {},
    children: await Promise.all(
      (tree.children ?? []).map((child) => toNode(target, family, child)),
    ),
  };
}

describe("server attribute parity", () => {
  for (const testCase of cases) {
    describe(testCase.name, () => {
      for (const target of testCase.targets) {
        it(target, async () => {
          const html = await renderTree(
            target,
            await toNode(target, testCase.family, testCase.tree),
          );
          const hook = `${markers[testCase.family]}${testCase.part === "root" ? "" : `-${testCase.part}`}`;
          const element = parseElements(html).find((candidate) => candidate.attributes.has(hook));
          expect(element, `${pascal(testCase.family)} ${testCase.part} in ${html}`).toBeDefined();
          const actual = Object.fromEntries(
            Object.keys(testCase.expected).map((name) => [
              name,
              element!.attributes.get(name) ?? null,
            ]),
          );
          expect(actual).toEqual(testCase.expected);
        });
      }
    });
  }
});
