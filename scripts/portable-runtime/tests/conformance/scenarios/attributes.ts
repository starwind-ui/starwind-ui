import type { Ui } from "../ui";
import type { Scenario } from "./types";

/** Named attributes on one part. `null` means that the attribute must be absent. */
type PartAttributes = Record<string, Record<string, string | null>>;

type Component = {
  name: string;
  /** Parts captured for the cross-target comparison. */
  parts: string[];
  first: PartAttributes;
  interact(ui: Ui): Promise<void>;
  after: PartAttributes;
};

// Generated ids differ per render. Their presence is the fact that targets must share.
const ID_ATTRIBUTES = new Set([
  "aria-controls",
  "aria-labelledby",
  "aria-describedby",
  "aria-activedescendant",
  "aria-owns",
]);

const open = (id: string) => (ui: Ui) => ui.t(`${id}-trigger`).click();

const primitive: Component[] = [
  {
    name: "select",
    parts: ["as-root", "as-trigger", "as-value", "as-item-a"],
    first: {
      "as-root": { "data-state": "closed" },
      "as-trigger": { "data-state": "closed", "aria-expanded": "false" },
    },
    async interact(ui) {
      await ui.t("as-trigger").click();
      await ui.expectVisible("as-popup");
      await ui.t("as-item-a").click();
      await ui.expectVisible("as-popup", false);
      await ui.t("as-trigger").click();
      await ui.expectVisible("as-popup");
    },
    after: {
      "as-root": { "data-state": "open", "data-value": "a" },
      "as-trigger": { "data-state": "open", "aria-expanded": "true" },
      "as-item-a": { "data-selected": "", "aria-selected": "true" },
    },
  },
  {
    name: "combobox",
    parts: ["ac-root", "ac-input", "ac-trigger", "ac-item-a"],
    first: {
      "ac-root": { "data-state": "closed" },
      "ac-input": { "aria-expanded": "false", role: "combobox" },
    },
    interact: async (ui) => {
      await open("ac")(ui);
      await ui.expectVisible("ac-popup");
    },
    after: {
      "ac-root": { "data-state": "open" },
      "ac-input": { "aria-expanded": "true" },
      "ac-trigger": { "data-state": "open" },
    },
  },
  {
    name: "checkbox",
    parts: ["ak-root", "ak-indicator"],
    first: {
      "ak-root": { "aria-checked": "false", "data-unchecked": "", "data-checked": null },
    },
    interact: (ui) => ui.t("ak-root").click(),
    after: {
      "ak-root": { "aria-checked": "true", "data-checked": "", "data-unchecked": null },
    },
  },
  {
    name: "switch",
    parts: ["aw-root", "aw-thumb"],
    first: {
      "aw-root": { "aria-checked": "false", "data-unchecked": "", "data-checked": null },
    },
    interact: (ui) => ui.t("aw-root").click(),
    after: {
      "aw-root": { "aria-checked": "true", "data-checked": "", "data-unchecked": null },
    },
  },
  {
    name: "slider",
    parts: ["al-root", "al-thumb"],
    first: { "al-thumb": { "aria-valuenow": "20", role: "slider" } },
    async interact(ui) {
      await ui.t("al-thumb").focus();
      await ui.page.keyboard.press("ArrowRight");
    },
    after: { "al-thumb": { "aria-valuenow": "21", "data-focused": "" } },
  },
  {
    name: "input",
    parts: ["ai-root"],
    first: { "ai-root": { "data-disabled": null } },
    interact: (ui) => ui.t("ai-root").click(),
    after: { "ai-root": { "data-disabled": null } },
  },
  {
    name: "tabs",
    parts: ["at-root", "at-list", "at-tab-one", "at-tab-two", "at-panel-one", "at-panel-two"],
    first: {
      "at-tab-one": { "aria-selected": "true", "data-state": "active" },
      "at-tab-two": { "aria-selected": "false", "data-state": "inactive" },
      "at-panel-one": { "data-state": "active" },
      "at-panel-two": { "data-state": "inactive" },
    },
    interact: (ui) => ui.t("at-tab-two").click(),
    after: {
      "at-tab-one": { "aria-selected": "false", "data-state": "inactive" },
      "at-tab-two": { "aria-selected": "true", "data-state": "active" },
      "at-panel-one": { "data-state": "inactive" },
      "at-panel-two": { "data-state": "active" },
    },
  },
  {
    name: "dialog",
    parts: ["ad-root", "ad-trigger", "ad-popup"],
    first: {
      "ad-root": { "data-state": "closed" },
      "ad-trigger": { "data-state": "closed", "aria-haspopup": "dialog" },
    },
    interact: async (ui) => {
      await open("ad")(ui);
      await ui.expectVisible("ad-popup");
    },
    after: {
      "ad-root": { "data-state": "open" },
      "ad-trigger": { "data-state": "open", "aria-expanded": "true" },
      "ad-popup": { "data-state": "open" },
    },
  },
  {
    name: "menu",
    parts: ["am-root", "am-trigger", "am-item"],
    first: {
      "am-root": { "data-state": "closed" },
      "am-trigger": { "data-state": "closed", "aria-haspopup": "menu", "aria-expanded": "false" },
    },
    interact: async (ui) => {
      await open("am")(ui);
      await ui.expectVisible("am-popup");
    },
    after: {
      "am-root": { "data-state": "open" },
      "am-trigger": { "data-state": "open", "aria-expanded": "true" },
      "am-popup": { "data-state": "open", role: "menu" },
      "am-item": { role: "menuitem" },
    },
  },
  {
    name: "toggle group",
    parts: ["ag-root", "ag-a", "ag-b"],
    first: { "ag-a": { "aria-pressed": "false", "data-pressed": null } },
    interact: (ui) => ui.t("ag-a").click(),
    after: { "ag-a": { "aria-pressed": "true", "data-pressed": "" } },
  },
  {
    name: "tooltip",
    parts: ["ao-root", "ao-trigger"],
    first: {
      "ao-root": { "data-state": "closed" },
      "ao-trigger": { "data-state": "closed" },
    },
    interact: async (ui) => {
      await ui.t("ao-trigger").hover();
      await ui.expectVisible("ao-popup");
    },
    after: {
      "ao-root": { "data-state": "open" },
      "ao-trigger": { "data-state": "open" },
      "ao-popup": { "data-state": "open", role: "tooltip" },
    },
  },
];

// Styled keeps the same state attributes and adds the public `data-slot` on each part.
const slots: Record<string, string> = {
  "as-root": "select",
  "as-trigger": "select-trigger",
  "as-value": "select-value",
  "as-item-a": "select-item",
  "ac-root": "combobox",
  "ac-input": "combobox-input",
  "ac-trigger": "combobox-trigger",
  "ac-item-a": "combobox-item",
  "ak-root": "checkbox",
  "aw-root": "switch-button",
  "al-root": "slider",
  "ai-root": "input",
  "ax-root": "textarea",
  "at-root": "tabs",
  "at-list": "tabs-list",
  "at-tab-one": "tabs-trigger",
  "at-tab-two": "tabs-trigger",
  "at-panel-one": "tabs-content",
  "at-panel-two": "tabs-content",
  "ad-root": "dialog",
  "ad-trigger": "dialog-trigger",
  "am-root": "dropdown",
  "am-trigger": "dropdown-trigger",
  "am-item": "dropdown-item",
  "ag-root": "toggle-group",
  "ag-a": "toggle-group-item",
  "ag-b": "toggle-group-item",
  "ao-root": "tooltip",
  "ao-trigger": "tooltip-trigger",
};

function withSlots(attributes: PartAttributes, parts: string[], phase: string): PartAttributes {
  const result: PartAttributes = {};
  for (const part of new Set([...parts, ...Object.keys(attributes)])) {
    const known = attributes[part];
    // Styled checkbox and switch render these parts themselves, so they have no test id.
    if (part === "al-thumb" || part === "ak-indicator" || part === "aw-thumb") continue;
    // React mounts Select and Combobox popups at first use, so items exist only after it.
    if (phase === "first" && /-item-/.test(part)) continue;
    result[part] = { ...known, ...(slots[part] ? { "data-slot": slots[part]! } : {}) };
  }
  return result;
}

const styled: Component[] = primitive
  .filter((component) => component.name !== "slider")
  .map((component) => ({
    ...component,
    parts: component.parts.filter((part) => slots[part]),
    first: withSlots(component.first, component.parts, "first"),
    after: withSlots(component.after, component.parts, "after"),
  }));
styled.push(
  {
    name: "slider",
    parts: ["al-root"],
    first: { "al-root": { "data-slot": "slider" } },
    interact: async () => {},
    after: { "al-root": { "data-slot": "slider" } },
  },
  {
    name: "textarea",
    parts: ["ax-root"],
    first: { "ax-root": { "data-slot": "textarea" } },
    interact: (ui) => ui.t("ax-root").click(),
    after: { "ax-root": { "data-slot": "textarea" } },
  },
);

async function expectNamed(ui: Ui, expected: PartAttributes): Promise<void> {
  for (const [part, attributes] of Object.entries(expected)) {
    for (const [name, value] of Object.entries(attributes)) {
      await ui.expectAttr(part, name, value);
    }
  }
}

/** Reads the public attribute surface of each part, for comparison with the other targets. */
async function snapshot(ui: Ui, parts: string[]): Promise<Record<string, Record<string, string>>> {
  const result: Record<string, Record<string, string>> = {};
  for (const part of parts) {
    if ((await ui.t(part).count()) === 0) {
      result[part] = { "not-rendered": "true" };
      continue;
    }
    const attributes = await ui
      .t(part)
      .first()
      .evaluate((element) =>
        Object.fromEntries(
          [...element.attributes]
            .filter(
              ({ name }) => name === "role" || name.startsWith("aria-") || name.startsWith("data-"),
            )
            .map(({ name, value }) => [name, value]),
        ),
      );
    delete attributes["data-testid"];
    // `data-sw-part` is adapter bookkeeping. A `data-sw-*` hook matters by presence, because JSX
    // prints a boolean hook as "true" and other targets print it as "".
    delete attributes["data-sw-part"];
    for (const name of Object.keys(attributes)) {
      if (ID_ATTRIBUTES.has(name)) attributes[name] = "<id>";
      else if (name.startsWith("data-sw-")) attributes[name] = "<hook>";
    }
    result[part] = attributes;
  }
  return result;
}

function scenarios(layer: string, page: string, components: Component[]): Scenario[] {
  return components.map((component) => ({
    id: `attributes ${layer} ${component.name}: first render and after interaction`,
    page,
    async run(ui) {
      await expectNamed(ui, component.first);
      const first = await snapshot(ui, component.parts);
      await component.interact(ui);
      await expectNamed(ui, component.after);
      await ui.settle();
      const after = await snapshot(ui, component.parts);
      await ui.matchesAstro(`${layer} ${component.name}`, { first, after }, async (astro) => {
        const astroFirst = await snapshot(astro, component.parts);
        await component.interact(astro);
        await expectNamed(astro, component.after);
        await astro.settle();
        return { first: astroFirst, after: await snapshot(astro, component.parts) };
      });
    },
  }));
}

export const attributeScenarios: Scenario[] = [
  ...scenarios("primitive", "attrs", primitive),
  ...scenarios("styled", "attrs-styled", styled),
];
