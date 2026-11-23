// Server output for default markers and false option flags, on all four targets. A `data-default-*`
// marker states only the default prop. A held value never adds it, and a held value that differs
// from the default never removes it. The browser scenarios in `scenarios/markers.ts` check the same
// markers after the Runtime connects, after interaction, and after later parent writes.
import { describe, expect, it } from "vitest";
import {
  EMISSION_TARGETS,
  type EmissionTarget,
  parseElements,
  partFile,
  type RenderNode,
  renderTree,
} from "./render";

type Props = Record<string, unknown>;

type Case = {
  name: string;
  family: string;
  /** The part whose attributes are read. */
  part: string;
  /** The read part renders under the family root `root` part. */
  child?: boolean;
  discovery: string;
  props: Props;
  expected: Record<string, string | null>;
  /** Parts between the root and the read part, outermost first. */
  between?: string[];
};

async function load(target: EmissionTarget, family: string, part: string): Promise<unknown> {
  const module = (await import(/* @vite-ignore */ partFile(target, family, part))) as {
    default: unknown;
  };
  return module.default;
}

function targetProps(target: EmissionTarget, props: Props): Props {
  if (target !== "vue" || !("value" in props)) return props;
  const { value, ...rest } = props;
  return { ...rest, modelValue: value };
}

async function tree(target: EmissionTarget, entry: Case): Promise<RenderNode> {
  const leaf: RenderNode = {
    component: await load(target, entry.family, entry.part),
    props: entry.child ? entry.props : targetProps(target, entry.props),
    children: [],
  };
  if (!entry.child) return leaf;
  let node = leaf;
  for (const part of [...(entry.between ?? [])].reverse()) {
    node = { component: await load(target, entry.family, part), props: {}, children: [node] };
  }
  return { component: await load(target, entry.family, "root"), props: {}, children: [node] };
}

const popover = (name: string, props: Props, expected: Case["expected"]): Case => ({
  name: `popover ${name}`,
  family: "popover",
  part: "root",
  discovery: "data-sw-popover",
  props,
  expected,
});
const toggle = (name: string, props: Props, expected: Case["expected"]): Case => ({
  name: `toggle ${name}`,
  family: "toggle",
  part: "root",
  discovery: "data-sw-toggle",
  props,
  expected,
});
const select = (name: string, props: Props, expected: Case["expected"]): Case => ({
  name: `select ${name}`,
  family: "select",
  part: "root",
  discovery: "data-sw-select",
  props,
  expected,
});
const combobox = (name: string, props: Props, expected: Case["expected"]): Case => ({
  name: `combobox ${name}`,
  family: "combobox",
  part: "root",
  discovery: "data-sw-combobox",
  props,
  expected,
});
const sidebar = (name: string, props: Props, expected: Case["expected"]): Case => ({
  name: `sidebar ${name}`,
  family: "sidebar",
  part: "provider",
  discovery: "data-sw-sidebar-provider",
  props,
  expected,
});
const menu = (name: string, props: Props, expected: Case["expected"]): Case => ({
  name: `menu ${name}`,
  family: "menu",
  part: "root",
  discovery: "data-sw-menu",
  props,
  expected,
});
const checkboxItem = (name: string, props: Props, expected: Case["expected"]): Case => ({
  name: `menu checkbox item ${name}`,
  family: "menu",
  part: "checkboxItem",
  child: true,
  discovery: "data-sw-menu-checkbox-item",
  props,
  expected,
});
const radioItem = (name: string, props: Props, expected: Case["expected"]): Case => ({
  name: `menu radio item ${name}`,
  family: "menu",
  part: "radioItem",
  child: true,
  discovery: "data-sw-menu-radio-item",
  props: { value: "a", ...props },
  expected,
  between: ["radioGroup"],
});

const cases: Case[] = [
  popover(
    "default only",
    { defaultOpen: true },
    { "data-default-open": "true", "data-open-on-hover": null },
  ),
  popover("held only", { open: true }, { "data-default-open": null }),
  popover("held and default", { open: false, defaultOpen: true }, { "data-default-open": "true" }),
  popover("hover", { openOnHover: true }, { "data-open-on-hover": "true" }),
  toggle("default only", { defaultPressed: true }, { "data-default-pressed": "true" }),
  toggle("held only", { pressed: true }, { "data-default-pressed": null }),
  toggle(
    "held and default",
    { pressed: false, defaultPressed: true },
    // The Runtime reads ARIA state first, so the marker never decides the pressed state.
    { "data-default-pressed": "true", "aria-pressed": "false" },
  ),
  select(
    "held only",
    { open: true, value: "a" },
    {
      "data-default-open": null,
      "data-default-value": null,
    },
  ),
  select(
    "default only",
    { defaultOpen: true, defaultValue: "a" },
    {
      "data-default-open": "true",
      "data-default-value": "a",
    },
  ),
  combobox(
    "held only",
    { open: true, value: "a", inputValue: "x" },
    { "data-default-open": null, "data-default-value": null, "data-default-input-value": null },
  ),
  combobox(
    "default only",
    { defaultOpen: true, defaultValue: "a", defaultInputValue: "x" },
    { "data-default-open": "true", "data-default-value": "a", "data-default-input-value": "x" },
  ),
  // Sidebar `defaultOpen` is true when it is absent.
  sidebar("held only", { open: true, defaultOpen: false }, { "data-default-open": null }),
  sidebar("default only", { defaultOpen: true }, { "data-default-open": "true" }),
  checkboxItem(
    "default only",
    { defaultChecked: true },
    { "data-default-checked": "true", "data-close-on-click": null },
  ),
  checkboxItem("held only", { checked: true }, { "data-default-checked": null }),
  checkboxItem(
    "held and default",
    { checked: false, defaultChecked: true },
    { "data-default-checked": "true" },
  ),
  checkboxItem("close on click", { closeOnClick: true }, { "data-close-on-click": "true" }),
  radioItem(
    "default only",
    { defaultChecked: true },
    { "data-default-checked": "true", "data-close-on-click": null },
  ),
  radioItem("held only", { checked: true }, { "data-default-checked": null }),
  // The Runtime lets explicit ARIA state decide, so the marker never selects this item.
  radioItem(
    "held and default",
    { checked: false, defaultChecked: true },
    { "data-default-checked": "true", "aria-checked": "false" },
  ),
  menu("click only", {}, { "data-open-on-hover": null }),
  menu("hover", { openOnHover: true }, { "data-open-on-hover": "true" }),
];

describe("default markers in server output", () => {
  for (const entry of cases) {
    it(entry.name, async () => {
      const results: Record<string, Record<string, string | null>> = {};
      for (const target of EMISSION_TARGETS) {
        const html = await renderTree(target, await tree(target, entry));
        const element = parseElements(html).find((item) => item.attributes.has(entry.discovery));
        if (!element) throw new Error(`${target} rendered no ${entry.discovery} element.`);
        results[target] = Object.fromEntries(
          Object.keys(entry.expected).map((name) => [name, element.attributes.get(name) ?? null]),
        );
      }
      expect(results).toEqual(
        Object.fromEntries(EMISSION_TARGETS.map((target) => [target, entry.expected])),
      );
    });
  }
});
