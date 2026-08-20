import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { starwindStyledContracts } from "./contracts/styled/starwind.js";
import {
  getPrimitiveInventoryEntries,
  getRuntimeAdapterPrimitiveInventoryEntries,
} from "./renderers/primitive-inventory.js";
import {
  getPrimitiveFrameworkAdapterTarget,
  resolvePrimitiveFrameworkAdapterTargetComponents,
} from "./renderers/framework-adapters/target-registry.js";
import { frameworkAdapterTargetRenderedPortal } from "./renderers/framework-adapters/types.js";
import {
  generateFrameworkPrimitiveWrappers,
  generateFrameworkStyledWrappers,
} from "./renderers/framework-wrapper-generator.js";

const TARGETS = ["astro", "react", "vue"];
const PORTAL_FAMILIES = [
  "alert-dialog",
  "combobox",
  "drawer",
  "menu",
  "navigation-menu",
  "popover",
  "preview-card",
  "select",
  "tooltip",
];
const PORTABLE_STYLED_PORTAL_PROPS = ["portalContainer", "disablePortal"];
const EXPECTED_DIRECT_STYLED_PORTAL_OWNERS = [
  "combobox/ComboboxContent.component",
  "context-menu/ContextMenuContent.component",
  "context-menu/ContextMenuSubContent.component",
  "dropdown/DropdownContent.component",
  "dropdown/DropdownSubContent.component",
  "hover-card/HoverCardContent.component",
  "navigation-menu/NavigationMenuPositioner.component",
  "popover/PopoverContent.component",
  "select/SelectContent.component",
  "tooltip/TooltipContent.component",
];
const EXPECTED_COMPOSED_STYLED_PORTAL_OWNERS = [
  "color-picker/ColorPicker.component",
  "color-picker/ColorPickerContent.component",
  "color-picker/ColorPickerDefaultEditor.component",
  "color-picker/ColorPickerInput.component",
  "navigation-menu/NavigationMenu.component",
];
const EXPECTED_RENDERED_STYLED_PORTAL_SLOTS = {
  "combobox/ComboboxContent.component": ["combobox-portal"],
  "context-menu/ContextMenuContent.component": ["context-menu-portal"],
  "context-menu/ContextMenuSubContent.component": ["context-menu-sub-portal"],
  "dropdown/DropdownContent.component": ["dropdown-portal"],
  "dropdown/DropdownSubContent.component": ["dropdown-sub-portal"],
  "hover-card/HoverCardContent.component": ["hover-card-portal"],
  "navigation-menu/NavigationMenuPositioner.component": ["navigation-menu-portal"],
  "popover/PopoverContent.component": ["popover-portal"],
  "select/SelectContent.component": ["select-portal"],
  "tooltip/TooltipContent.component": ["tooltip-portal"],
};
// Follow-up: move rendered extensions and helper-file classification into target registration
// metadata. Current registrations do not expose these output anatomy facts.
const RENDERED_EXTENSIONS = { astro: ".astro", react: ".tsx", vue: ".vue" };
const EXPECTED_COUNTS = {
  astro: {
    familySubpaths: 37,
    namespaceParts: 242,
    renderedPrimitivePaths: 227,
    styledNormalizedPaths: 393,
    styledRoots: 55,
  },
  react: {
    familySubpaths: 37,
    namespaceParts: 242,
    renderedPrimitivePaths: 226,
    styledNormalizedPaths: 390,
    styledRoots: 54,
  },
  vue: {
    familySubpaths: 37,
    namespaceParts: 242,
    renderedPrimitivePaths: 226,
    styledNormalizedPaths: 390,
    styledRoots: 54,
  },
};

export const approvedFrameworkSurfaceExceptions = Object.freeze([
  Object.freeze({
    id: "astro-theme-init-script",
    target: "astro",
    surface: "primitive.renderedPaths",
    path: "theme/ThemeInitScript",
    reason: "Astro emits ThemeInitScript as a rendered .astro helper.",
  }),
  Object.freeze({
    id: "astro-image-styled-root",
    target: "astro",
    surface: "styled.roots",
    path: "image",
    reason: "Image is an Astro-only Styled root with three normalized files.",
  }),
]);

const plannedCorrections = Object.freeze([]);

export async function buildFrameworkSurfaceManifest({ repoRoot = process.cwd() } = {}) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-framework-surface-"));

  try {
    await Promise.all(
      TARGETS.map((target) =>
        generateFrameworkPrimitiveWrappers(target, {
          generatedBy: "scripts/portable-runtime/framework-surface-manifest.mjs",
          outputRoot: path.join(temporaryRoot, "primitive", target),
        }),
      ),
    );

    await Promise.all(
      TARGETS.map((target) =>
        generateFrameworkStyledWrappers(target, {
          contracts: starwindStyledContracts,
          generatedBy: "scripts/portable-runtime/framework-surface-manifest.mjs",
          outputRoot: path.join(temporaryRoot, "styled", target),
          primitiveOutputRoot: path.join(temporaryRoot, "primitive", target),
        }),
      ),
    );

    const targetEntries = await Promise.all(
      TARGETS.map(async (target) => [
        target,
        await inspectGeneratedTargetSurface(target, temporaryRoot),
      ]),
    );
    const manifest = {
      schemaVersion: 3,
      generatedFrom: {
        primitive:
          "registered targets, Primitive Inventory, Runtime Adapter Contracts, and fresh Adapter Output Model output",
        styled:
          "Styled Adapter Contracts, Styled Output Models, and fresh registered-target output",
      },
      approvedExceptions: approvedFrameworkSurfaceExceptions,
      plannedCorrections,
      targets: Object.fromEntries(targetEntries),
    };

    assertFrameworkSurfaceManifest(manifest);
    return manifest;
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true });
  }
}

export async function inspectGeneratedTargetSurface(target, temporaryRoot) {
  const primitiveRoot = path.join(temporaryRoot, "primitive", target);
  const styledRoot = path.join(temporaryRoot, "styled", target);
  const supportedComponents = resolvePrimitiveFrameworkAdapterTargetComponents(target);
  const registration = getPrimitiveFrameworkAdapterTarget(target);
  const familySubpaths = supportedComponents.map((component) => `./${component}`);
  const runtimeEntries = getRuntimeAdapterPrimitiveInventoryEntries();
  const inventoryByComponent = new Map(
    getPrimitiveInventoryEntries().map((entry) => [entry.component, entry]),
  );
  const namespaces = {};
  const namespaceValues = {};
  const exports = {};

  const primitiveFiles = await listFiles(primitiveRoot);
  if (target === "astro" && !primitiveFiles.includes("theme/ThemeInitScript.astro")) {
    throw new Error(
      "Astro generated output must contain the approved theme/ThemeInitScript.astro helper.",
    );
  }
  const renderedFiles = primitiveFiles
    .filter((file) => isRenderedPrimitivePath(target, file, runtimeEntries))
    .map((file) => normalizeRenderedPath(file))
    .sort();

  for (const component of supportedComponents) {
    const source = await readFile(path.join(primitiveRoot, component, "index.ts"), "utf8");
    const namespace = parseNamespace(source);
    if (namespace) {
      namespaces[component] = namespace.members;
      namespaceValues[component] = namespace.values;
    }

    const inventory = inventoryByComponent.get(component);
    exports[component] = classifyPublicExports(source, {
      component,
      runtimeFacades: inventory?.runtimeFacades,
    });
  }

  const parts = Object.fromEntries(
    runtimeEntries.map((entry) => [
      entry.component,
      entry.contract.parts.map((part) => ({
        name: part.name,
        defaultElement: part.defaultElement,
        runtimeHooks: unique([
          part.discoveryAttribute,
          ...(part.initialAttributes ?? [])
            .map((attribute) => attribute.name)
            .filter((name) => name.startsWith("data-sw-")),
        ]),
      })),
    ]),
  );

  const portalAnatomy = await Promise.all(
    PORTAL_FAMILIES.map(async (family) => {
      const namespaceParts = namespaces[family] ?? [];
      const namespaceValueNames = namespaceValues[family] ?? [];
      const portalIndex = namespaceParts.indexOf("Portal");
      const portalPart = parts[family]?.find((part) => part.name === "portal");
      const renderedComponent = namespaceValueNames[portalIndex];
      if (portalIndex < 0 || !portalPart || !renderedComponent) {
        throw new Error(`${target} is missing the public ${family} Portal anatomy.`);
      }
      const renderedPortal = registration.primitive[frameworkAdapterTargetRenderedPortal];
      if (!renderedPortal) {
        throw new Error(`${target} does not register rendered Portal inspection.`);
      }
      const renderedWrapper = await renderedPortal.inspect({
        family,
        policy: portalPart,
        readSource(relativePath) {
          return readFile(path.join(primitiveRoot, relativePath), "utf8");
        },
        renderedComponent,
      });
      return {
        family,
        namespacePart: "Portal",
        renderedPath: `${family}/${renderedComponent}`,
        defaultElement: renderedWrapper.defaultElement,
        runtimeHooks: renderedWrapper.runtimeHooks,
        placement: renderedWrapper.placement,
        ...(renderedWrapper.nativeHelper
          ? {
              nativeHelper: renderedWrapper.nativeHelper,
              placementWiring: renderedWrapper.placementWiring,
            }
          : {}),
      };
    }),
  );
  const styledFiles = await listFiles(styledRoot);
  const styledRoots = unique(styledFiles.map((file) => file.split("/")[0])).sort();
  const normalizedStyledPaths = styledFiles.map(normalizeStyledPath).sort();
  const styledPortalControls = await inspectStyledPortalControls(styledRoot, styledFiles);
  const namespaceParts = Object.values(namespaces).reduce(
    (count, members) => count + members.length,
    0,
  );

  return {
    registration: {
      home: registration.home,
      publicSupport: registration.publicSupport,
      styled: Boolean(registration.styled),
    },
    counts: {
      familySubpaths: familySubpaths.length,
      namespaceParts,
      renderedPrimitivePaths: renderedFiles.length,
      styledNormalizedPaths: normalizedStyledPaths.length,
      styledRoots: styledRoots.length,
    },
    familySubpaths,
    primitive: {
      renderedPaths: renderedFiles,
      namespaces,
      namespaceValues,
      exports,
      parts,
      portalAnatomy,
    },
    styled: {
      roots: styledRoots,
      normalizedPaths: normalizedStyledPaths,
      portalControls: styledPortalControls,
    },
  };
}

export function assertFrameworkSurfaceManifest(manifest) {
  if (!manifest || manifest.schemaVersion !== 3) {
    throw new Error("Framework surface manifest must use schemaVersion 3.");
  }
  if (
    JSON.stringify(manifest.approvedExceptions) !==
    JSON.stringify(approvedFrameworkSurfaceExceptions)
  ) {
    throw new Error("Framework surface manifest approved exceptions changed.");
  }

  for (const target of TARGETS) {
    const surface = manifest.targets?.[target];
    if (!surface) throw new Error(`Framework surface manifest is missing target ${target}.`);
    assertDeepEqual(surface.counts, EXPECTED_COUNTS[target], `${target}.counts`);
    assertUnique(surface.familySubpaths, `${target}.familySubpaths`);
    assertUnique(surface.primitive.renderedPaths, `${target}.primitive.renderedPaths`);
    assertUnique(surface.styled.roots, `${target}.styled.roots`);
    assertUnique(surface.styled.normalizedPaths, `${target}.styled.normalizedPaths`);
    assertUnique(
      surface.primitive.portalAnatomy.map((entry) => entry.family),
      `${target}.primitive.portalAnatomy`,
    );
    assertDeepEqual(
      surface.primitive.portalAnatomy.map((entry) => entry.family),
      PORTAL_FAMILIES,
      `${target}.primitive.portalAnatomy families`,
    );
    const runtimePortalParts = new Map(
      getRuntimeAdapterPrimitiveInventoryEntries().map((entry) => [
        entry.component,
        entry.contract.parts.find((part) => part.name === "portal"),
      ]),
    );
    const renderedPortal =
      getPrimitiveFrameworkAdapterTarget(target).primitive[frameworkAdapterTargetRenderedPortal];
    if (!renderedPortal) {
      throw new Error(`${target} does not register rendered Portal inspection.`);
    }
    for (const entry of surface.primitive.portalAnatomy) {
      const expectedPart = runtimePortalParts.get(entry.family);
      if (!expectedPart) {
        throw new Error(`${target}.primitive.portalAnatomy.${entry.family} has no Portal policy.`);
      }
      renderedPortal.assert(entry, entry.family, {
        defaultElement: expectedPart.defaultElement,
        runtimeHooks: unique([
          expectedPart.discoveryAttribute,
          ...(expectedPart.initialAttributes ?? [])
            .map((attribute) => attribute.name)
            .filter((name) => name.startsWith("data-sw-")),
        ]),
      });
    }
    assertDeepEqual(
      surface.styled.portalControls.props,
      PORTABLE_STYLED_PORTAL_PROPS,
      `${target}.styled.portalControls props`,
    );
    assertDeepEqual(
      surface.styled.portalControls.directOwners,
      EXPECTED_DIRECT_STYLED_PORTAL_OWNERS,
      `${target}.styled.portalControls direct owners`,
    );
    assertDeepEqual(
      surface.styled.portalControls.composedOwners,
      EXPECTED_COMPOSED_STYLED_PORTAL_OWNERS,
      `${target}.styled.portalControls composed owners`,
    );
    assertDeepEqual(
      surface.styled.portalControls.renderedPortalSlots,
      EXPECTED_RENDERED_STYLED_PORTAL_SLOTS,
      `${target}.styled.portalControls rendered Portal slots`,
    );
    assertUnique(
      surface.styled.portalControls.directOwners,
      `${target}.styled.portalControls.directOwners`,
    );
    assertUnique(
      surface.styled.portalControls.composedOwners,
      `${target}.styled.portalControls.composedOwners`,
    );
    for (const [owner, slots] of Object.entries(
      surface.styled.portalControls.renderedPortalSlots,
    )) {
      assertUnique(slots, `${target}.styled.portalControls.renderedPortalSlots.${owner}`);
    }
    for (const owner of [
      ...surface.styled.portalControls.directOwners,
      ...surface.styled.portalControls.composedOwners,
    ]) {
      if (!surface.styled.normalizedPaths.includes(owner)) {
        throw new Error(`${target}.styled.portalControls references missing path ${owner}.`);
      }
    }
    for (const [component, members] of Object.entries(surface.primitive.namespaces)) {
      assertUnique(members, `${target}.primitive.namespaces.${component}`);
      assertUnique(
        surface.primitive.namespaceValues[component],
        `${target}.primitive.namespaceValues.${component}`,
      );
      if (members.length !== surface.primitive.namespaceValues[component].length) {
        throw new Error(`${target}.primitive namespace keys and values differ for ${component}.`);
      }
    }
    for (const [component, entries] of Object.entries(surface.primitive.exports)) {
      assertUnique(
        entries.map((entry) => `${entry.kind}:${entry.name}`),
        `${target}.primitive.exports.${component}`,
      );
      const namespaceName = toPascalCase(component);
      const inventory = getPrimitiveInventoryEntries().find(
        (entry) => entry.component === component,
      );
      const runtimeValues = new Set(inventory?.runtimeFacades?.values ?? []);
      const runtimeTypes = new Set(inventory?.runtimeFacades?.types ?? []);
      const namespaceValues = new Set(surface.primitive.namespaceValues[component] ?? []);
      for (const entry of entries) {
        const exportedValue = entry.kind === "default" ? entry.reference : entry.name;
        const expectedClassification =
          entry.kind === "type"
            ? runtimeTypes.has(entry.name)
              ? "runtime-facade"
              : "helper-type"
            : exportedValue === namespaceName && component !== "theme"
              ? "namespace"
              : namespaceValues.has(exportedValue) && component !== "theme"
                ? "rendered-component"
                : runtimeValues.has(exportedValue)
                  ? "runtime-facade"
                  : "helper";
        if (entry.classification !== expectedClassification) {
          throw new Error(
            `${target}.primitive.exports.${component}.${entry.name} has an invalid classification.`,
          );
        }
      }
      const defaultExports = entries.filter((entry) => entry.kind === "default");
      if (component === "theme") {
        assertDeepEqual(defaultExports, [], `${target}.primitive.exports.theme defaults`);
      } else {
        assertDeepEqual(
          defaultExports,
          [
            {
              name: "default",
              reference: namespaceName,
              kind: "default",
              classification: "namespace",
            },
          ],
          `${target}.primitive.exports.${component} defaults`,
        );
      }
    }
  }

  assertDeepEqual(
    manifest.targets.astro.primitive.renderedPaths.filter(
      (path) => path !== "theme/ThemeInitScript",
    ),
    manifest.targets.react.primitive.renderedPaths,
    "Astro and React rendered Primitive paths",
  );
  assertDeepEqual(
    manifest.targets.react.primitive.renderedPaths,
    manifest.targets.vue.primitive.renderedPaths,
    "React and Vue rendered Primitive paths",
  );
  assertDeepEqual(
    manifest.targets.astro.familySubpaths,
    manifest.targets.react.familySubpaths,
    "Astro and React family subpaths",
  );
  assertDeepEqual(
    manifest.targets.react.familySubpaths,
    manifest.targets.vue.familySubpaths,
    "React and Vue family subpaths",
  );
  assertDeepEqual(
    manifest.targets.react.styled.roots,
    manifest.targets.vue.styled.roots,
    "React and Vue Styled roots",
  );
  assertDeepEqual(
    manifest.targets.react.styled.normalizedPaths,
    manifest.targets.vue.styled.normalizedPaths,
    "React and Vue normalized Styled paths",
  );
  assertDeepEqual(
    manifest.targets.astro.styled.roots.filter((root) => root !== "image"),
    manifest.targets.react.styled.roots,
    "Astro Styled roots after the Image exception",
  );
  assertDeepEqual(
    manifest.targets.astro.styled.normalizedPaths.filter((file) => !file.startsWith("image/")),
    manifest.targets.react.styled.normalizedPaths,
    "Astro normalized Styled paths after the Image exception",
  );

  const namespaceComponents = Object.keys(manifest.targets.react.primitive.namespaces);
  for (const component of namespaceComponents) {
    const astro = manifest.targets.astro.primitive.namespaces[component];
    const react = manifest.targets.react.primitive.namespaces[component];
    const vue = manifest.targets.vue.primitive.namespaces[component];
    assertDeepEqual(astro, react, `Astro and React ${component} namespace order`);
    assertDeepEqual(vue, react, `React and Vue ${component} namespace order`);
  }

  for (const component of ["menu", "navigation-menu"]) {
    assertDeepEqual(
      manifest.targets.vue.primitive.exports[component],
      manifest.targets.react.primitive.exports[component],
      `React and Vue ${component} public exports`,
    );
  }

  assertDeepEqual(
    manifest.targets.astro.primitive.parts,
    manifest.targets.react.primitive.parts,
    "Astro and React part contracts",
  );
  assertDeepEqual(
    manifest.targets.react.primitive.parts,
    manifest.targets.vue.primitive.parts,
    "React and Vue part contracts",
  );
  const portablePortalAnatomy = (target) =>
    manifest.targets[target].primitive.portalAnatomy.map(
      ({
        placement: _placement,
        nativeHelper: _nativeHelper,
        placementWiring: _wiring,
        ...entry
      }) => entry,
    );
  assertDeepEqual(
    portablePortalAnatomy("astro"),
    portablePortalAnatomy("react"),
    "Astro and React portable Portal anatomy",
  );
  assertDeepEqual(
    portablePortalAnatomy("react"),
    portablePortalAnatomy("vue"),
    "React and Vue portable Portal anatomy",
  );
  assertDeepEqual(
    manifest.targets.astro.styled.portalControls,
    manifest.targets.react.styled.portalControls,
    "Astro and React Styled portal controls",
  );
  assertDeepEqual(
    manifest.targets.react.styled.portalControls,
    manifest.targets.vue.styled.portalControls,
    "React and Vue Styled portal controls",
  );
}

export function compareFrameworkSurfaceManifests(expected, actual) {
  const differences = [];
  collectDifferences(expected, actual, "$", differences);
  return differences;
}

export function serializeFrameworkSurfaceManifest(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function collectDifferences(expected, actual, location, differences) {
  if (Object.is(expected, actual)) return;
  if (Array.isArray(expected) && Array.isArray(actual)) {
    const length = Math.max(expected.length, actual.length);
    for (let index = 0; index < length; index += 1) {
      collectDifferences(expected[index], actual[index], `${location}[${index}]`, differences);
    }
    return;
  }
  if (isObject(expected) && isObject(actual)) {
    for (const key of unique([...Object.keys(expected), ...Object.keys(actual)]).sort()) {
      collectDifferences(expected[key], actual[key], `${location}.${key}`, differences);
    }
    return;
  }
  differences.push({ path: location, expected, actual });
}

function parseNamespace(source) {
  const match = source.match(/const\s+([A-Za-z0-9_$]+)\s*=\s*\{([\s\S]*?)\n\};/);
  if (!match) return undefined;
  const entries = [...match[2].matchAll(/^\s*([A-Za-z0-9_$]+)\s*:\s*([A-Za-z0-9_$]+)/gm)];
  return {
    name: match[1],
    members: entries.map((entry) => entry[1]),
    values: entries.map((entry) => entry[2]),
  };
}

export function classifyPublicExports(source, { component, runtimeFacades = {} }) {
  const namespace = parseNamespace(source);
  const namespaceName = namespace?.name;
  const namespaceValueNames = new Set(namespace?.values ?? []);
  const runtimeValues = new Set(runtimeFacades.values ?? []);
  const runtimeTypes = new Set(runtimeFacades.types ?? []);
  const parsed = parsePublicExports(source);

  return [
    ...parsed.defaults.map((reference) => ({
      name: "default",
      reference,
      kind: "default",
      classification: classifyValueExport({
        component,
        name: reference,
        namespaceName,
        namespaceValueNames,
        runtimeValues,
      }),
    })),
    ...parsed.values.map((name) => ({
      name,
      kind: "value",
      classification: classifyValueExport({
        component,
        name,
        namespaceName,
        namespaceValueNames,
        runtimeValues,
      }),
    })),
    ...parsed.types.map((name) => ({
      name,
      kind: "type",
      classification: runtimeTypes.has(name) ? "runtime-facade" : "helper-type",
    })),
  ].sort(compareExports);
}

function classifyValueExport({
  component,
  name,
  namespaceName,
  namespaceValueNames,
  runtimeValues,
}) {
  if (name === namespaceName && component !== "theme") return "namespace";
  if (namespaceValueNames.has(name) && component !== "theme") return "rendered-component";
  if (runtimeValues.has(name)) return "runtime-facade";
  return "helper";
}

function parsePublicExports(source) {
  const defaults = [];
  const values = [];
  const types = [];
  for (const match of source.matchAll(/export\s+(type\s+)?\{([\s\S]*?)\}(?:\s+from\s+[^;]+)?;/g)) {
    const destination = match[1] ? types : values;
    for (const item of match[2].split(",")) {
      const normalized = item.trim().replace(/^type\s+/, "");
      if (!normalized) continue;
      const parts = normalized.split(/\s+as\s+/);
      destination.push(parts.at(-1).trim());
    }
  }
  for (const match of source.matchAll(
    /^export\s+(?:async\s+)?(?:function|const|class)\s+([A-Za-z0-9_$]+)/gm,
  )) {
    values.push(match[1]);
  }
  for (const match of source.matchAll(/^export\s+(?:interface|type)\s+([A-Za-z0-9_$]+)/gm)) {
    types.push(match[1]);
  }
  for (const match of source.matchAll(/^export\s+default\s+([A-Za-z0-9_$]+)\s*;/gm)) {
    defaults.push(match[1]);
  }
  return {
    defaults: unique(defaults).sort(),
    values: unique(values).sort(),
    types: unique(types).sort(),
  };
}

function isRenderedPrimitivePath(target, file, runtimeEntries) {
  if (!file.endsWith(RENDERED_EXTENSIONS[target])) return false;
  if (target === "astro" && file === "theme/ThemeInitScript.astro") return true;
  const component = file.split("/")[0];
  if (!runtimeEntries.some((entry) => entry.component === component)) return false;
  return (
    target !== "react" ||
    !path.posix
      .basename(file)
      .replace(/\.tsx$/, "")
      .endsWith("Context")
  );
}

function normalizeRenderedPath(file) {
  return file.replace(/\.(?:astro|tsx|vue)$/, "");
}

function normalizeStyledPath(file) {
  return file.replace(/\.(?:astro|tsx|vue)$/, ".component");
}

async function inspectStyledPortalControls(styledRoot, styledFiles) {
  const directOwners = [];
  const composedOwners = [];
  const renderedPortalSlots = {};
  const primitivePortalPattern = /<[A-Za-z]+Primitive\.(?:[A-Za-z]+)?Portal\b/;

  for (const file of styledFiles) {
    if (!/\.(?:astro|tsx|vue)$/.test(file)) continue;
    const source = await readFile(path.join(styledRoot, file), "utf8");
    if (!PORTABLE_STYLED_PORTAL_PROPS.every((prop) => source.includes(prop))) continue;
    const owner = normalizeStyledPath(file);
    if (primitivePortalPattern.test(source)) {
      directOwners.push(owner);
      renderedPortalSlots[owner] = unique(
        [...source.matchAll(/data-slot="([^"]*-portal)"/g)].map((match) => match[1]),
      ).sort();
    } else {
      composedOwners.push(owner);
    }
  }

  return {
    props: PORTABLE_STYLED_PORTAL_PROPS,
    directOwners: directOwners.sort(),
    composedOwners: composedOwners.sort(),
    renderedPortalSlots: Object.fromEntries(Object.entries(renderedPortalSlots).sort()),
  };
}

async function listFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const candidate = path.join(root, entry.name);
      if (entry.isDirectory()) {
        return (await listFiles(candidate)).map((file) => `${entry.name}/${file}`);
      }
      return entry.isFile() ? [entry.name] : [];
    }),
  );
  return nested.flat().sort();
}

function compareExports(left, right) {
  return left.kind.localeCompare(right.kind) || left.name.localeCompare(right.name);
}

function assertUnique(values, label) {
  const duplicate = values.find((value, index) => values.indexOf(value) !== index);
  if (duplicate !== undefined) throw new Error(`${label} contains duplicate entry ${duplicate}.`);
}

function assertDeepEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} does not match the frozen framework surface.`);
  }
}

function unique(values) {
  return [...new Set(values)];
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toPascalCase(value) {
  return value
    .split("-")
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join("");
}

async function runCli() {
  const repoRoot = process.cwd();
  const manifestPath = path.join(
    repoRoot,
    "scripts/portable-runtime/framework-surface-manifest.json",
  );
  const generated = await buildFrameworkSurfaceManifest({ repoRoot });
  const serialized = serializeFrameworkSurfaceManifest(generated);
  if (process.argv.includes("--check")) {
    const committed = await readFile(manifestPath, "utf8");
    if (committed !== serialized)
      throw new Error(`Framework surface manifest is stale: ${manifestPath}`);
    return;
  }
  await writeFile(manifestPath, serialized, "utf8");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runCli();
}
