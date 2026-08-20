import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SNAPSHOT_DIRECTORY = path.join(
  REPO_ROOT,
  "scripts/portable-runtime/product-package-size-snapshots",
);

export const PRODUCT_COMPARATOR_IDS = Object.freeze([
  "ark-react",
  "base-react",
  "ark-vue",
  "reka-vue",
]);

export const PRODUCT_COMPARISON_FIXTURE_REVISION = 2;

const componentMappings = Object.freeze([
  row("accordion", "accordion", "accordion", "Accordion"),
  row("alert-dialog", "dialog", "alert-dialog", "AlertDialog"),
  row("avatar", "avatar", "avatar", "Avatar"),
  row("button", null, "button", null),
  row("carousel", "carousel", null, null),
  row("checkbox", "checkbox", "checkbox", "Checkbox"),
  row("checkbox-group", "checkbox", "checkbox-group", null),
  row("collapsible", "collapsible", "collapsible", "Collapsible"),
  row("combobox", "combobox", "combobox", "Combobox"),
  row("context-menu", "menu", "context-menu", "ContextMenu"),
  row("dialog", "dialog", "dialog", "Dialog"),
  row("drawer", "drawer", "drawer", null),
  row("dropzone", "file-upload", null, null),
  row("field", "field", "field", null),
  row("input", null, "input", null),
  row("input-otp", "pin-input", "otp-field", "PinInput"),
  row("menu", "menu", "menu", "DropdownMenu"),
  row("navigation-menu", "navigation-menu", "navigation-menu", "NavigationMenu"),
  row("popover", "popover", "popover", "Popover"),
  row("preview-card", "hover-card", "preview-card", "HoverCard"),
  row("progress", "progress", "progress", "Progress"),
  row("radio", "radio-group", "radio", "RadioGroup"),
  row("radio-group", "radio-group", "radio-group", "RadioGroup"),
  row("scroll-area", "scroll-area", "scroll-area", "ScrollArea"),
  row("select", "select", "select", "Select"),
  row("slider", "slider", "slider", "Slider"),
  row("switch", "switch", "switch", "Switch"),
  row("tabs", "tabs", "tabs", "Tabs"),
  row("toast", "toast", "toast", "Toast"),
  row("toggle", "toggle", "toggle", "Toggle"),
  row("toggle-group", "toggle-group", "toggle-group", "ToggleGroup"),
  row("tooltip", "tooltip", "tooltip", "Tooltip"),
]);

const providerDefinitions = Object.freeze({
  "ark-react": provider("ark-react", "Ark UI React", "@ark-ui/react", "react"),
  "ark-vue": provider("ark-vue", "Ark UI Vue", "@ark-ui/vue", "vue"),
  "base-react": provider("base-react", "Base UI React", "@base-ui/react", "react"),
  "reka-vue": provider("reka-vue", "Reka UI", "reka-ui", "vue"),
  "starwind-react": provider("starwind-react", "Starwind React", "@starwind-ui/react", "react"),
  "starwind-vue": provider("starwind-vue", "Starwind Vue", "@starwind-ui/vue", "vue"),
});

export function buildProductComparisonPlan() {
  const reactProviders = ["starwind-react", "ark-react", "base-react"].map(
    (id) => providerDefinitions[id],
  );
  const vueProviders = ["starwind-vue", "ark-vue", "reka-vue"].map((id) => providerDefinitions[id]);
  const reactComponents = componentMappings.map((mapping) => ({
    component: mapping.component,
    entries: compactEntries({
      "ark-react": mapping.ark ? [`@ark-ui/react/${mapping.ark}`] : null,
      "base-react": mapping.base ? [`@base-ui/react/${mapping.base}`] : null,
      "starwind-react": [`@starwind-ui/react/${mapping.component}`],
    }),
  }));
  const vueComponents = componentMappings.map((mapping) => ({
    component: mapping.component,
    entries: compactEntries({
      "ark-vue": mapping.ark ? [`@ark-ui/vue/${mapping.ark}`] : null,
      "reka-vue": mapping.reka ? [{ package: "reka-ui", exportPrefix: mapping.reka }] : null,
      "starwind-vue": [`@starwind-ui/vue/${mapping.component}`],
    }),
  }));

  return Object.freeze({
    react: {
      components: reactComponents,
      overlaps: buildOverlaps("react", reactComponents, reactProviders),
      providers: reactProviders,
    },
    site: {
      scenarios: [
        { id: "empty", components: [] },
        { id: "select", components: ["select"] },
        { id: "form", components: ["select", "combobox", "checkbox", "field"] },
        { id: "overlays", components: ["dialog", "menu", "popover", "tooltip"] },
        {
          id: "full-overlap",
          components: reactComponents
            .filter(({ entries }) => reactProviders.every(({ id }) => entries[id]))
            .map(({ component }) => component),
        },
      ],
    },
    vue: {
      components: vueComponents,
      overlaps: buildOverlaps("vue", vueComponents, vueProviders),
      providers: vueProviders,
    },
  });
}

export function parseProductSizeCommand(arguments_) {
  const [command = "report", rawComparatorId, ...rest] = arguments_;
  const comparatorId = rawComparatorId?.replace(/^--/, "");
  if (rest.length > 0) throw new Error(`Unexpected arguments: ${rest.join(" ")}`);
  if (["report", "site", "starwind"].includes(command)) {
    if (comparatorId) throw new Error(`${command} does not accept a comparator id.`);
    return { command };
  }
  if (command === "refresh-comparator") {
    if (!PRODUCT_COMPARATOR_IDS.includes(comparatorId)) {
      throw new Error(`Unknown comparator: ${comparatorId ?? "(missing)"}`);
    }
    return { command, comparatorId };
  }
  throw new Error(`Unknown product package-size command: ${command}`);
}

export function buildSnapshotPath(comparatorId) {
  if (!PRODUCT_COMPARATOR_IDS.includes(comparatorId)) {
    throw new Error(`Unknown comparator: ${comparatorId}`);
  }
  return path.join(SNAPSHOT_DIRECTORY, `${comparatorId}.json`);
}

export function buildMeasurementEntries(providerId, exportNames = []) {
  const plan = buildProductComparisonPlan();
  const provider = getProviderDefinition(providerId);
  const frameworkPlan = plan[provider.framework];
  const components = Object.fromEntries(
    frameworkPlan.components.flatMap((component) => {
      const descriptors = component.entries[providerId];
      return descriptors
        ? [
            [
              component.component,
              descriptors.map((descriptor) => measurementEntry(descriptor, exportNames)),
            ],
          ]
        : [];
    }),
  );

  return {
    catalog: [{ exports: ["*"], specifier: provider.packageName }],
    components,
    overlaps: Object.fromEntries(
      frameworkPlan.overlaps
        .filter(({ providers }) => providers.includes(providerId))
        .map(({ components: names, id }) => [id, names]),
    ),
  };
}

export function validateComparatorSnapshot(snapshot, { expectedEnvironment } = {}) {
  if (snapshot?.schema !== "starwind.product-package-size-comparator") {
    throw new Error("Invalid product comparator snapshot schema.");
  }
  if (snapshot.schemaVersion !== 2) throw new Error("Unsupported comparator snapshot version.");
  if (!PRODUCT_COMPARATOR_IDS.includes(snapshot.comparatorId)) {
    throw new Error(`Unknown comparator snapshot id: ${snapshot.comparatorId}`);
  }
  if (snapshot.fixtureRevision !== PRODUCT_COMPARISON_FIXTURE_REVISION) {
    throw new Error("Comparator snapshot fixture revision is stale.");
  }
  if (!snapshot.package?.name || !snapshot.package?.version) {
    throw new Error("Comparator snapshot package provenance is incomplete.");
  }
  validateMeasurementEnvironment(snapshot.environment, expectedEnvironment, "Comparator snapshot");
  validateMeasurementEntries(snapshot.measurementEntries);
  validateSizeCollection(snapshot.components, "components");
  validateSizeCollection(snapshot.overlaps, "overlaps");
  validateSize(snapshot.catalog, "catalog");
  return snapshot;
}

export function validateMeasurementEnvironment(actual, expected, label = "Measurement") {
  if (!actual?.esbuild || !actual?.node) {
    throw new Error(`${label} environment provenance is incomplete.`);
  }
  if (!expected) return actual;
  if (actual.esbuild !== expected.esbuild) {
    throw new Error(
      `${label} esbuild ${actual.esbuild} does not match active esbuild ${expected.esbuild}.`,
    );
  }
  if (nodeMajor(actual.node) !== nodeMajor(expected.node)) {
    throw new Error(
      `${label} Node major ${nodeMajor(actual.node)} does not match active Node major ${nodeMajor(expected.node)}.`,
    );
  }
  return actual;
}

export function getProviderDefinition(providerId) {
  const definition = providerDefinitions[providerId];
  if (!definition) throw new Error(`Unknown product size provider: ${providerId}`);
  return definition;
}

function buildOverlaps(framework, components, providers) {
  const exact = components.filter(({ entries }) => providers.every(({ id }) => entries[id]));
  const starwindId = `starwind-${framework}`;
  return [
    {
      id: `${framework}-exact-three-way`,
      components: exact.map(({ component }) => component),
      providers: providers.map(({ id }) => id),
    },
    ...providers.slice(1).map(({ id }) => ({
      id: `${framework}-${id}-overlap`,
      components: components
        .filter(({ entries }) => entries[starwindId] && entries[id])
        .map(({ component }) => component),
      providers: [starwindId, id],
    })),
  ];
}

function compactEntries(entries) {
  return Object.fromEntries(Object.entries(entries).filter(([, entry]) => entry));
}

function provider(id, label, packageName, framework) {
  return Object.freeze({ framework, id, label, packageName });
}

function row(component, ark, base, reka) {
  return Object.freeze({ ark, base, component, reka });
}

function validateSizeCollection(collection, label) {
  if (!collection || Object.keys(collection).length === 0) {
    throw new Error(`Comparator snapshot ${label} are missing.`);
  }
  for (const [key, value] of Object.entries(collection)) validateSize(value, `${label}.${key}`);
}

function validateSize(value, label) {
  for (const key of ["minifiedBytes", "gzipBytes", "brotliBytes"]) {
    if (!Number.isInteger(value?.[key]) || value[key] < 0) {
      throw new Error(`Comparator snapshot ${label}.${key} is invalid.`);
    }
  }
}

function measurementEntry(descriptor, exportNames) {
  if (typeof descriptor === "string") {
    return { exports: ["*"], specifier: descriptor };
  }
  const names = exportNames.filter((name) => matchesExportPrefix(name, descriptor.exportPrefix));
  if (names.length === 0) {
    throw new Error(`No ${descriptor.package} exports matched ${descriptor.exportPrefix}.`);
  }
  return { exports: names, specifier: descriptor.package };
}

function validateMeasurementEntries(entries) {
  if (!Array.isArray(entries?.catalog) || entries.catalog.length === 0) {
    throw new Error("Comparator snapshot measurement entry catalog is missing.");
  }
  if (!entries.components || Object.keys(entries.components).length === 0) {
    throw new Error("Comparator snapshot component measurement entries are missing.");
  }
  if (!entries.overlaps || Object.keys(entries.overlaps).length === 0) {
    throw new Error("Comparator snapshot overlap measurement entries are missing.");
  }
  for (const entry of [...entries.catalog, ...Object.values(entries.components).flat()]) {
    if (!entry?.specifier || !Array.isArray(entry.exports) || entry.exports.length === 0) {
      throw new Error("Comparator snapshot contains an invalid measurement entry.");
    }
  }
}

function matchesExportPrefix(name, prefix) {
  if (!name.startsWith(prefix)) return false;
  if (prefix === "Toggle" && name.startsWith("ToggleGroup")) return false;
  return true;
}

function nodeMajor(version) {
  return String(version ?? "").split(".")[0];
}
