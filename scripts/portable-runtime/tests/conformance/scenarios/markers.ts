// Default markers and callback order that stable freezes. A `data-default-*` marker states only the
// default prop read at mount. A held value, interaction, readback, and a later parent write never
// change it. A false option such as `openOnHover` or `closeOnClick` prints no attribute. The Avatar
// callback runs from the root DOM event, so it runs before an ancestor listener sees that event.
import type { Ui } from "../ui";
import type { Scenario } from "./types";

type Expected = Record<string, Record<string, string | null>>;

async function expectAll(ui: Ui, expected: Expected): Promise<void> {
  for (const [part, attributes] of Object.entries(expected)) {
    for (const [name, value] of Object.entries(attributes)) {
      await ui.expectAttr(part, name, value);
    }
  }
}

async function openMenu(ui: Ui): Promise<void> {
  await ui.t("md-trigger").click();
  await ui.expectVisible("md-popup");
}

/** A 1x1 transparent PNG. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

/** Waits until `read` passes `check`. `expect.poll` needs a test context that concurrent scenarios lack. */
async function until<T>(label: string, read: () => Promise<T>, check: (value: T) => boolean) {
  const deadline = Date.now() + 2000;
  while (true) {
    const value = await read();
    if (check(value)) return value;
    if (Date.now() > deadline) throw new Error(`${label}: received ${JSON.stringify(value)}`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

export const markerScenarios: Scenario[] = [
  {
    id: "default markers: default props only, first render and after interaction",
    page: "markers",
    async run(ui) {
      await expectAll(ui, {
        "pd-root": { "data-default-open": "true", "data-open-on-hover": null },
        "td-root": { "data-default-pressed": "true", "aria-pressed": "true" },
      });
      await openMenu(ui);
      await expectAll(ui, {
        "md-check": {
          "data-default-checked": "true",
          "aria-checked": "true",
          "data-close-on-click": null,
        },
        "md-radio-a": { "data-default-checked": "true", "data-close-on-click": null },
        "md-radio-b": { "data-default-checked": null },
      });
      await ui.t("md-check").click();
      await ui.expectAttr("md-check", "aria-checked", "false");
      await ui.t("md-radio-b").click();
      await ui.page.keyboard.press("Escape");
      await ui.expectVisible("md-popup", false);
      await ui.t("td-root").click();
      await ui.settle();
      await expectAll(ui, {
        "pd-root": { "data-default-open": "true", "data-state": "closed" },
        "td-root": { "data-default-pressed": "true", "aria-pressed": "false" },
      });
      await openMenu(ui);
      await expectAll(ui, {
        "md-check": { "data-default-checked": "true", "aria-checked": "false" },
        "md-radio-a": { "data-default-checked": "true", "aria-checked": "false" },
        "md-radio-b": { "data-default-checked": null, "aria-checked": "true" },
      });
    },
  },
  {
    id: "default markers, parent-held: held values, readback, and later parent writes",
    page: "markers",
    async run(ui) {
      await expectAll(ui, {
        "ph-root": { "data-default-open": null, "data-state": "open" },
        "pb-root": { "data-default-open": "true", "data-state": "closed" },
        "th-root": { "data-default-pressed": null, "aria-pressed": "true" },
        "tb-root": { "data-default-pressed": "true", "aria-pressed": "false" },
        "tl-root": { "data-default-pressed": "true", "aria-pressed": "true" },
      });
      await ui.parentWrite("ph", false);
      await ui.parentWrite("pb", true);
      await ui.parentWrite("th", false);
      await ui.parentWrite("tb", true);
      await ui.parentWrite("tl", false);
      await expectAll(ui, {
        "ph-root": { "data-default-open": null, "data-state": "closed" },
        "pb-root": { "data-default-open": "true", "data-state": "open" },
        "th-root": { "data-default-pressed": null, "aria-pressed": "false" },
        "tb-root": { "data-default-pressed": "true", "aria-pressed": "true" },
        "tl-root": { "data-default-pressed": "true", "aria-pressed": "false" },
      });
      await ui.page.keyboard.press("Escape");
      await openMenu(ui);
      await expectAll(ui, {
        "mh-check": { "data-default-checked": null, "aria-checked": "true" },
        "mb-check": { "data-default-checked": "true", "aria-checked": "false" },
      });
      await expectAll(ui, {
        "mdl-check": { "data-default-checked": "true" },
        "mdl-radio": { "data-default-checked": "true" },
      });
      await ui.parentWrite("mh", false);
      await ui.parentWrite("mb", true);
      await ui.parentWrite("mdl", false);
      await expectAll(ui, {
        "mh-check": { "data-default-checked": null, "aria-checked": "false" },
        "mb-check": { "data-default-checked": "true", "aria-checked": "true" },
        "mdl-check": { "data-default-checked": "true" },
        "mdl-radio": { "data-default-checked": "true" },
      });
      await ui.t("mb-check").click();
      await expectAll(ui, {
        "mb-check": { "data-default-checked": "true", "aria-checked": "false" },
      });
    },
  },
  {
    id: "menu radio item: explicit checked state wins over the default marker",
    page: "markers",
    async run(ui) {
      await openMenu(ui);
      await expectAll(ui, {
        "mr-group": { "data-value": "b" },
        "mr-a": { "aria-checked": "false", "data-default-checked": "true" },
        "mr-b": { "aria-checked": "true", "data-default-checked": null },
      });
    },
  },
  {
    id: "avatar loading status: the callback runs before an ancestor listener",
    page: "markers",
    async run(ui) {
      let release!: () => void;
      const released = new Promise<void>((resolve) => {
        release = resolve;
      });
      await ui.page.route("**/conformance-avatar.png", async (route) => {
        await released;
        await route.fulfill({ status: 200, contentType: "image/png", body: PNG });
      });
      await ui.parentWrite("av", true);
      await until(
        "avatar loading",
        () => ui.changes("av"),
        (entries) => entries.some(([event, value]) => event === "callback" && value === "loading"),
      );
      release();
      const entries = await until(
        "avatar loaded",
        () => ui.changes("av"),
        (all) => all.filter(([, value]) => value === "loaded").length === 2,
      );
      const sequence = entries.map(([event, value]) => `${event}:${value}`);
      // The first status can arrive through the mount catch-up, and React StrictMode mounts twice.
      // The `loaded` step happens after every listener is in place, so its order is the contract.
      const loaded = sequence.filter((entry) => entry.endsWith(":loaded"));
      if (JSON.stringify(loaded) !== JSON.stringify(["callback:loaded", "ancestor:loaded"])) {
        throw new Error(`Avatar callback must run once, first: ${sequence.join(", ")}`);
      }
    },
  },
];
