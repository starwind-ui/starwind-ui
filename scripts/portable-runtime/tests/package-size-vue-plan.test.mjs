import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

import { describe, expect, it } from "vitest";

import {
  ZAG_VUE_COMPARATOR_VERSION,
  STARWIND_VUE_MEASUREMENT_LABELS,
  buildNamespaceImportEntry,
  buildStarwindVueEntry,
  buildStarwindVueBrowserMeasurementRows,
  buildStarwindVueRootEntry,
  buildZagVueEntry,
  existingPublicSupportMappingSnapshot,
  starwindVueColdImportRows,
  starwindVueManualFacades,
  starwindVueRootHeadlineComponents,
  starwindVueRuntimeComponents,
  starwindVueStyledComponents,
  starwindVueStyledExclusions,
  starwindVueThemeHelperRow,
  starwindZagVueOverlapMappings,
  zagVueComparatorInstallSpecifiers,
  zagVueComparatorPackages,
  zagVueExpectedResolvedVersions,
  zagVueAdapterPlusMachineRows,
  zagVueInfrastructurePackages,
  zagVueMachinePackages,
  zagVueMatchedSupportRow,
  validateZagVueResolvedVersions,
} from "../package-size-vue-plan.mjs";
import {
  vueManualPrimitiveComponents,
  vuePackageSubpaths,
  vueRuntimePrimitiveComponents,
  vueStyledComponents,
} from "../renderers/framework-adapters/vue/inventory.ts";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const packageManifest = JSON.parse(
  readFileSync(path.join(REPO_ROOT, "packages/vue/package.json"), "utf8"),
);

describe("Starwind Vue size plan", () => {
  it("matches the authoritative Primitive inventory and package exports", () => {
    expect(starwindVueRuntimeComponents).toHaveLength(36);
    expect(starwindVueRuntimeComponents).toEqual([...vueRuntimePrimitiveComponents].sort());
    expect(starwindVueManualFacades).toEqual(["theme"]);
    expect(starwindVueManualFacades).toEqual([...vueManualPrimitiveComponents].sort());
    expect(starwindVueRootHeadlineComponents).toEqual(
      [...vueRuntimePrimitiveComponents, ...vueManualPrimitiveComponents].sort(),
    );

    const plannedSubpaths = starwindVueRootHeadlineComponents.map((component) => `./${component}`);
    const inventorySubpaths = vuePackageSubpaths
      .map(({ subpath }) => subpath)
      .filter((subpath) => subpath !== ".")
      .sort();
    const manifestSubpaths = Object.keys(packageManifest.exports)
      .filter((subpath) => subpath !== ".")
      .sort();
    expect(plannedSubpaths).toEqual(inventorySubpaths);
    expect(plannedSubpaths).toEqual(manifestSubpaths);
  });

  it("defines one cold import per Runtime family and a separate Theme helper", () => {
    expect(starwindVueColdImportRows).toHaveLength(36);
    expect(starwindVueColdImportRows.map(({ component }) => component)).toEqual(
      starwindVueRuntimeComponents,
    );
    expect(starwindVueColdImportRows.map(({ packageName }) => packageName)).toEqual(
      starwindVueRuntimeComponents.map((component) => `@starwind-ui/vue/${component}`),
    );
    expect(starwindVueThemeHelperRow).toMatchObject({
      component: "theme",
      packageName: "@starwind-ui/vue/theme",
    });
  });

  it("builds private browser rows from the approved inventory", () => {
    const vueAlias = { name: "vue-alias" };
    const runtimeAlias = { name: "runtime-alias" };
    const rows = buildStarwindVueBrowserMeasurementRows({ runtimeAlias, vueAlias });

    expect(rows.bundleRows.map(({ label }) => label)).toEqual([
      STARWIND_VUE_MEASUREMENT_LABELS.adapterOnly,
      STARWIND_VUE_MEASUREMENT_LABELS.combined,
      STARWIND_VUE_MEASUREMENT_LABELS.completeCatalog,
    ]);
    expect(rows.coldImportRows).toHaveLength(37);
    expect(rows.coldImportRows.slice(0, -1).map(({ component }) => component)).toEqual(
      starwindVueRuntimeComponents,
    );
    expect(rows.coldImportRows.at(-1).component).toBe("theme");
    expect(rows.matchedRows).toHaveLength(2);
    expect(rows.matchedRows.at(-1).machinePackages).toEqual(zagVueMachinePackages);
    expect(rows.matchedRows.at(-1).componentCount).toBe(30);
  });

  it("matches all 54 Styled roots and records Image as Astro-only", () => {
    expect(starwindVueStyledComponents).toHaveLength(54);
    expect(starwindVueStyledComponents).toEqual([...vueStyledComponents].sort());
    expect(starwindVueStyledExclusions).toEqual([
      { component: "image", reason: "Astro-only Styled contract" },
    ]);
    expect(starwindVueStyledComponents).not.toContain("image");
  });

  it("builds deterministic entries from sorted, deduplicated specifiers", () => {
    expect(buildNamespaceImportEntry(["z", "a", "z"])).toBe(
      'import * as pkg0 from "a";\nimport * as pkg1 from "z";\nconsole.log(pkg0, pkg1);',
    );
    expect(buildStarwindVueEntry(["tooltip", "accordion"])).toContain(
      'component0 from "@starwind-ui/vue/accordion"',
    );
    expect(buildStarwindVueRootEntry()).toBe(
      'import * as pkg0 from "@starwind-ui/vue";\nconsole.log(pkg0);',
    );
    expect(buildZagVueEntry([...starwindZagVueOverlapMappings].reverse())).toBe(
      zagVueMatchedSupportRow.entry,
    );
  });
});

describe("matched Zag Vue plan", () => {
  it("maps the exact 30-family overlap to 26 machines", () => {
    expect(starwindZagVueOverlapMappings).toHaveLength(30);
    expect(zagVueMachinePackages).toHaveLength(26);
    expect(zagVueAdapterPlusMachineRows).toHaveLength(30);
    expect(zagVueAdapterPlusMachineRows.map(({ starwindComponent }) => starwindComponent)).toEqual(
      starwindZagVueOverlapMappings.map(({ starwind }) => starwind),
    );
    expect(starwindZagVueOverlapMappings.map(({ starwind }) => starwind)).toEqual([
      "accordion",
      "alert-dialog",
      "avatar",
      "carousel",
      "checkbox",
      "checkbox-group",
      "collapsible",
      "color-picker",
      "combobox",
      "context-menu",
      "dialog",
      "drawer",
      "dropzone",
      "input-otp",
      "menu",
      "navigation-menu",
      "popover",
      "preview-card",
      "progress",
      "radio",
      "radio-group",
      "scroll-area",
      "select",
      "slider",
      "switch",
      "tabs",
      "toast",
      "toggle",
      "toggle-group",
      "tooltip",
    ]);
  });

  it("retains the four shared-machine relationships", () => {
    const mappings = Object.fromEntries(
      starwindZagVueOverlapMappings.map(({ starwind, zag }) => [starwind, zag]),
    );
    expect(mappings["alert-dialog"]).toBe(mappings.dialog);
    expect(mappings["checkbox-group"]).toBe(mappings.checkbox);
    expect(mappings["context-menu"]).toBe(mappings.menu);
    expect(mappings.radio).toBe(mappings["radio-group"]);
  });

  it("imports the exact aggregate and per-family comparator package sets", () => {
    expect(importSpecifiers(zagVueMatchedSupportRow.entry)).toEqual(
      ["@zag-js/vue", ...zagVueInfrastructurePackages, ...zagVueMachinePackages].sort(),
    );

    for (const row of zagVueAdapterPlusMachineRows) {
      expect(importSpecifiers(row.entry)).toEqual(
        ["@zag-js/vue", ...zagVueInfrastructurePackages, row.machinePackage].sort(),
      );
    }
  });

  it("pins the adapter, infrastructure, and every machine to 1.42.0", () => {
    expect(zagVueComparatorPackages).toHaveLength(28);
    expect(zagVueComparatorPackages).toContain("@zag-js/vue");
    expect(zagVueComparatorPackages).toContain("@zag-js/core");
    expect(zagVueComparatorInstallSpecifiers).toEqual(
      zagVueComparatorPackages.map((packageName) => `${packageName}@${ZAG_VUE_COMPARATOR_VERSION}`),
    );
    expect(new Set(Object.values(zagVueExpectedResolvedVersions))).toEqual(new Set(["1.42.0"]));
    expect(Object.keys(zagVueExpectedResolvedVersions)).toEqual(zagVueComparatorPackages);
    expect(() => validateZagVueResolvedVersions(zagVueExpectedResolvedVersions)).not.toThrow();
    expect(() =>
      validateZagVueResolvedVersions({
        ...zagVueExpectedResolvedVersions,
        "@zag-js/vue": "1.43.0",
      }),
    ).toThrow("@zag-js/vue: expected 1.42.0, received 1.43.0");

    const { "@zag-js/vue": _missingAdapter, ...missingAdapter } = zagVueExpectedResolvedVersions;
    expect(() => validateZagVueResolvedVersions(missingAdapter)).toThrow("- missing: @zag-js/vue");
    expect(() =>
      validateZagVueResolvedVersions({
        ...zagVueExpectedResolvedVersions,
        "@zag-js/unplanned": "1.42.0",
      }),
    ).toThrow("- unexpected: @zag-js/unplanned");
  });
});

describe("existing public comparison map", () => {
  it("keeps the current React, Base UI, and Zag React mapping identities unchanged", () => {
    const source = readFileSync(
      path.join(REPO_ROOT, "scripts/portable-runtime/measure-package-sizes.mjs"),
      "utf8",
    );
    const mappingLiteral = source.match(
      /const starwindSupportMappings = (\[[\s\S]*?\n\]);\nconst starwindComponentsWithZagMatches/,
    )?.[1];
    expect(mappingLiteral).toBeDefined();

    const currentMappings = vm
      .runInNewContext(`(${mappingLiteral})`)
      .map(({ starwind, zag, base }) => ({
        starwind,
        ...(zag ? { zag: [...zag] } : {}),
        ...(base ? { base } : {}),
      }));
    expect(currentMappings).toEqual(existingPublicSupportMappingSnapshot);
    expect(currentMappings).toHaveLength(31);
    expect(currentMappings.filter(({ zag }) => zag)).toHaveLength(28);
  });
});

function importSpecifiers(entry) {
  return [...entry.matchAll(/from "([^"]+)";/g)].map((match) => match[1]);
}
