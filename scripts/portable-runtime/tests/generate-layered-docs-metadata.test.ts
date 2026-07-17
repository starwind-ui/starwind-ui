import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import * as ts from "typescript";
import { describe, expect, it } from "vitest";
import { runtimeAdapterContracts } from "../contracts/primitive/representatives.js";
import { starwindStyledContracts } from "../contracts/styled/components/index.js";
import type { StyledAdapterContract } from "../contracts/styled/types.js";
import { styledDocsAnnotations } from "../docs/layered-docs/annotations.js";
import { colorPickerPrimitiveDocsAuthoredExamples } from "../docs/layered-docs/examples.js";
import type { LayeredDocsMetadata, PrimitiveDocsEnrichment } from "../docs/layered-docs/types.js";
import * as layeredDocsGenerator from "../generate-layered-docs-metadata.js";
import { buildStyledApiMetadata } from "../docs/layered-docs/generator/build-styled-api.js";
import {
  buildLayeredDocsMetadata,
  checkLayeredDocsMetadata,
  findPrimitiveReferenceDescriptionGaps,
  formatPrimitiveStateControlSupport,
  generateLayeredDocsMetadata,
  getLayeredDocsCheckFailures,
  renderCanonicalLayeredDocsMetadata,
  validateLayeredDocsMetadata,
  validateLayeredDocsMetadataArtifact,
} from "../generate-layered-docs-metadata.js";

const execFileAsync = promisify(execFile);
const testRequire = createRequire(import.meta.url);
const LAYERED_DOCS_INTEGRATION_TIMEOUT_MS = 30000;

const getRuntimeSectionImports = (source: string) =>
  [...source.matchAll(/^import (Runtime[A-Za-z]+) from /gm)].map((match) => match[1]).sort();

const getRuntimeSectionInvocations = (source: string) =>
  [...source.matchAll(/^<(Runtime[A-Za-z]+) \/>/gm)].map((match) => match[1]).sort();

const getMarkdownHeadingSection = (source: string, heading: string) => {
  const start = source.indexOf(heading);
  if (start === -1) {
    return "";
  }

  const next = source.indexOf("\n### ", start + heading.length);
  return next === -1 ? source.slice(start) : source.slice(start, next);
};

const expectSubstringsInOrder = (source: string, substrings: readonly string[]) => {
  let previousIndex = -1;

  for (const substring of substrings) {
    const currentIndex = source.indexOf(substring);

    expect(currentIndex, `${substring} should exist`).toBeGreaterThanOrEqual(0);
    expect(
      currentIndex,
      `${substring} should be after the previous expected substring`,
    ).toBeGreaterThan(previousIndex);
    previousIndex = currentIndex;
  }
};

const toTestDisplayTitle = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[-\s]+/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");

const toTestPascalCase = (value: string) =>
  value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");

const writePrimitiveUsageFixture = async (
  primitiveId: string,
  source: string,
  files: Readonly<Record<string, string>> = {},
) => {
  const usageRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-primitive-usage-"));
  const primitiveUsageRoot = path.join(usageRoot, primitiveId);

  await mkdir(primitiveUsageRoot, { recursive: true });
  await writeFile(path.join(primitiveUsageRoot, "usage.md"), source);

  for (const [relativePath, fileSource] of Object.entries(files)) {
    const targetPath = path.join(primitiveUsageRoot, relativePath);

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, fileSource);
  }

  return usageRoot;
};

const selectAuthoredExampleManifest = (files: {
  readonly astro?: string;
  readonly react?: string;
  readonly html?: string;
}) => `export const primitiveAuthoredExamples = {
  "positioned-select": {
    title: "Positioned Select",
    summary: "Render Select with a positioned popup across supported framework surfaces.",
    files: {
${Object.entries(files)
  .map(
    ([framework, filePath]) => `      ${JSON.stringify(framework)}: ${JSON.stringify(filePath)},`,
  )
  .join("\n")}
    },
  },
} as const;
`;

const selectAstroExample = `---
import { Select } from "@starwind-ui/astro/select";
---

<Select.Root defaultValue="astro">
  <Select.Label>Framework</Select.Label>
  <Select.Trigger>
    <Select.Value>Astro</Select.Value>
    <Select.Icon>v</Select.Icon>
  </Select.Trigger>
  <Select.Positioner>
    <Select.Popup>
      <Select.List>
        <Select.Item value="astro">
          <Select.ItemText>Astro</Select.ItemText>
          <Select.ItemIndicator />
        </Select.Item>
      </Select.List>
    </Select.Popup>
  </Select.Positioner>
</Select.Root>
`;

const selectReactExample = `import { Select } from "@starwind-ui/react/select";

export function Example() {
  return (
    <Select.Root defaultValue="astro">
      <Select.Label>Framework</Select.Label>
      <Select.Trigger>
        <Select.Value>Astro</Select.Value>
        <Select.Icon>v</Select.Icon>
      </Select.Trigger>
      <Select.Positioner>
        <Select.Popup>
          <Select.List>
            <Select.Item value="astro">
              <Select.ItemText>Astro</Select.ItemText>
              <Select.ItemIndicator />
            </Select.Item>
          </Select.List>
        </Select.Popup>
      </Select.Positioner>
    </Select.Root>
  );
}
`;

const selectHtmlExample = `<div data-sw-select data-default-value="astro">
  <span data-sw-select-label>Framework</span>
  <button data-sw-select-trigger type="button">
    <span data-sw-select-value>Astro</span>
    <span data-sw-select-icon>v</span>
  </button>
  <div data-sw-select-positioner>
    <div data-sw-select-popup>
      <div data-sw-select-list>
        <div data-sw-select-item data-value="astro">
          <span data-sw-select-item-text>Astro</span>
          <span data-sw-select-item-indicator></span>
        </div>
      </div>
    </div>
  </div>
</div>

<script type="module">
  import { createSelect } from "@starwind-ui/runtime/select";

  const root = document.querySelector("[data-sw-select]");
  if (root) {
    createSelect(root);
  }
</script>
`;

const loadAstroCompiler = async () => {
  const rootRequire = createRequire(path.join(process.cwd(), "package.json"));
  const compilerPackageJsonPath = rootRequire.resolve("@astrojs/compiler/package.json");
  const compilerPackageJson = JSON.parse(await readFile(compilerPackageJsonPath, "utf8")) as {
    exports: { "./sync": { require: string } };
  };
  const compilerRequire = createRequire(compilerPackageJsonPath);

  return compilerRequire(compilerPackageJson.exports["./sync"].require) as {
    convertToTSX: (
      source: string,
      options: { filename: string },
    ) => { code: string; diagnostics: unknown[] };
  };
};

const getReactTypecheckDiagnostics = (entryPath: string) => {
  const reactDemoRequire = createRequire(path.join(process.cwd(), "apps/react-demo/package.json"));
  const reactTypesRoot = path.dirname(
    path.dirname(reactDemoRequire.resolve("@types/react/package.json")),
  );
  const reactDomTypesRoot = path.dirname(
    path.dirname(reactDemoRequire.resolve("@types/react-dom/package.json")),
  );
  const compilerOptions: ts.CompilerOptions = {
    allowSyntheticDefaultImports: true,
    baseUrl: process.cwd(),
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    noEmit: true,
    paths: {
      "@starwind-ui/react/*": ["packages/react/src/*"],
      "@starwind-ui/runtime": ["packages/runtime/src/index.ts"],
      "@starwind-ui/runtime/*": ["packages/runtime/src/components/*/index.ts"],
    },
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
    typeRoots: [reactTypesRoot, reactDomTypesRoot],
    types: ["react", "react-dom"],
  };
  const program = ts.createProgram([entryPath], compilerOptions);

  return ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
};

const cloneContract = (contract: StyledAdapterContract): StyledAdapterContract =>
  JSON.parse(JSON.stringify(contract)) as StyledAdapterContract;

const buildContractStyledApi = (contract: StyledAdapterContract) => {
  const validationIssues: string[] = [];
  const contracts = starwindStyledContracts.map((candidate) =>
    candidate.component === contract.component ? contract : candidate,
  );
  const metadata = buildStyledApiMetadata(
    contract,
    contracts,
    new Map(runtimeAdapterContracts.map((candidate) => [candidate.component, candidate])),
    styledDocsAnnotations[contract.component]!,
    validationIssues,
  );

  expect(validationIssues).toEqual([]);
  return metadata.astro;
};

const getStyledApiProp = (
  api: ReturnType<typeof buildContractStyledApi>,
  exportName: string,
  propName: string,
) =>
  api.exports
    .find((entry) => entry.exportName === exportName)
    ?.props.find((prop) => prop.name === propName);

const getStyledContractField = (
  contract: StyledAdapterContract,
  exportName: string,
  propName: string,
) => {
  const field = contract.components
    .find((component) => component.exportName === exportName)
    ?.props?.fields?.find((candidate) => candidate.name === propName);
  if (!field) throw new Error(`${exportName}.${propName} field is missing.`);
  return field;
};

describe("generateLayeredDocsMetadata", () => {
  it("keeps the compatibility entrypoint public runtime exports stable", () => {
    expect(Object.keys(layeredDocsGenerator).sort()).toEqual([
      "buildLayeredDocsMetadata",
      "checkLayeredDocsMetadata",
      "findPrimitiveReferenceDescriptionGaps",
      "formatPrimitiveStateControlSupport",
      "generateLayeredDocsMetadata",
      "getLayeredDocsCheckFailures",
      "renderCanonicalLayeredDocsMetadata",
      "validateLayeredDocsMetadata",
      "validateLayeredDocsMetadataArtifact",
    ]);
  });

  it("generates target-scoped styled API metadata from the styled contracts", () => {
    const metadata = buildLayeredDocsMetadata();
    const byId = new Map(metadata.styledComponents.map((component) => [component.id, component]));

    expect([...byId.keys()]).toHaveLength(starwindStyledContracts.length);
    expect(byId.get("button")?.styledApi.astro.exports[0]).toMatchObject({
      exportName: "Button",
      props: expect.arrayContaining([
        expect.objectContaining({ name: "as", classification: "wrapper" }),
        expect.objectContaining({
          name: "size",
          classification: "variant",
          defaultValue: '"md"',
        }),
        expect.objectContaining({
          name: "variant",
          classification: "variant",
          defaultValue: '"default"',
        }),
      ]),
    });
    expect(byId.get("badge")?.styledApi.astro.exports[0]?.props.map((prop) => prop.name)).toEqual([
      "appearance",
      "eyebrow",
      "size",
      "tone",
      "variant",
    ]);
    expect(byId.get("image")?.styledApi.astro.exports[0]?.inheritance).toContainEqual(
      expect.objectContaining({
        kind: "raw",
        displayName: 'Partial<import("astro/types").ComponentProps<typeof AstroImage>>',
      }),
    );

    const selectContent = byId
      .get("select")
      ?.styledApi.astro.exports.find((entry) => entry.exportName === "SelectContent");
    expect(selectContent?.props.map((prop) => prop.name)).toEqual(["size"]);

    const selectTrigger = byId
      .get("select")
      ?.styledApi.astro.exports.find((entry) => entry.exportName === "SelectTrigger");
    const checkbox = byId.get("checkbox")?.styledApi.astro.exports[0];
    expect(selectTrigger?.inheritance.some((entry) => entry.kind === "primitive-props")).toBe(
      false,
    );
    expect(checkbox?.inheritance.some((entry) => entry.kind === "primitive-props")).toBe(false);

    const sidebar = byId.get("sidebar")?.styledApi.astro;
    expect(sidebar?.exports.length).toBeGreaterThan(20);
    expect(
      sidebar?.exports.find((entry) => entry.exportName === "SidebarMenuButton")?.props,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "size", classification: "variant" }),
        expect.objectContaining({ name: "tooltip", classification: "wrapper" }),
      ]),
    );

    for (const component of metadata.styledComponents) {
      for (const framework of ["astro", "react"] as const) {
        expect(component.styledApi[framework].framework).toBe(framework);
        for (const entry of component.styledApi[framework].exports) {
          expect(new Set(entry.props.map((prop) => prop.name)).size).toBe(entry.props.length);
          expect(entry.props.every((prop) => Boolean(prop.description?.length))).toBe(true);
          expect(
            entry.inheritance.some((inheritance) => inheritance.kind === "primitive-props"),
          ).toBe(false);
        }
      }
    }
  });

  it("automatically adds new consumed wrapper and variant props to the styled API", () => {
    const badgeContract = starwindStyledContracts.find(
      (contract) => contract.component === "badge",
    );
    expect(badgeContract).toBeDefined();
    if (!badgeContract) return;

    const badgeComponent = badgeContract.components[0];
    const mutatedBadge = {
      ...badgeContract,
      variants: {
        ...badgeContract.variants,
        badge: {
          ...badgeContract.variants?.badge,
          variants: {
            ...badgeContract.variants?.badge?.variants,
            position: { quiet: "opacity-80", strong: "opacity-100" },
          },
        },
      },
      components: [
        {
          ...badgeComponent,
          props: {
            ...badgeComponent?.props,
            extends: badgeComponent?.props?.extends ?? [],
            fields: [
              ...(badgeComponent?.props?.fields ?? []),
              { name: "label", optional: true, type: "string" },
            ],
          },
          destructure: {
            ...badgeComponent?.destructure,
            props: [
              ...(badgeComponent?.destructure?.props ?? []),
              { name: "position", defaultValue: '"quiet"' },
              { name: "label" },
            ],
          },
        },
      ],
    };
    const metadata = buildLayeredDocsMetadata({
      styledContracts: starwindStyledContracts.map((contract) =>
        contract.component === "badge" ? mutatedBadge : contract,
      ),
    });
    const props = metadata.styledComponents.find((component) => component.id === "badge")?.styledApi
      .astro.exports[0]?.props;

    expect(props).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "position", classification: "variant" }),
        expect.objectContaining({ name: "label", classification: "wrapper" }),
      ]),
    );
  });

  it("only delegates exact props that are forwarded to the matching Primitive part", () => {
    const selectContract = starwindStyledContracts.find(
      (contract) => contract.component === "select",
    );
    expect(selectContract).toBeDefined();
    if (!selectContract) return;

    const baseline = buildContractStyledApi(selectContract);
    expect(getStyledApiProp(baseline, "Select", "autoComplete")).toBeUndefined();

    const notForwarded = cloneContract(selectContract);
    const notForwardedRoot = notForwarded.components.find(
      (component) => component.exportName === "Select",
    )?.render[0];
    if (!notForwardedRoot || notForwardedRoot.type !== "primitive") {
      throw new Error("Select root Primitive render is missing.");
    }
    notForwardedRoot.attrs = notForwardedRoot.attrs?.filter((attr) => attr.name !== "autoComplete");
    const notForwardedProp = getStyledApiProp(
      buildContractStyledApi(notForwarded),
      "Select",
      "autoComplete",
    );
    expect(notForwardedProp).toMatchObject({ classification: "wrapper" });
    expect(notForwardedProp).not.toHaveProperty("primitive");

    const typeMismatch = cloneContract(selectContract);
    getStyledContractField(typeMismatch, "Select", "autoComplete").type = "number";
    expect(
      getStyledApiProp(buildContractStyledApi(typeMismatch), "Select", "autoComplete"),
    ).toMatchObject({
      classification: "primitive-override",
      type: "number",
    });

    const requiredMismatch = cloneContract(selectContract);
    getStyledContractField(requiredMismatch, "Select", "autoComplete").optional = false;
    expect(
      getStyledApiProp(buildContractStyledApi(requiredMismatch), "Select", "autoComplete"),
    ).toMatchObject({
      classification: "primitive-override",
      required: true,
    });

    const defaultMismatch = cloneContract(selectContract);
    const autoCompleteDestructure = defaultMismatch.components
      .find((component) => component.exportName === "Select")
      ?.destructure?.props.find((prop) => prop.name === "autoComplete");
    if (!autoCompleteDestructure) throw new Error("Select autoComplete destructure is missing.");
    autoCompleteDestructure.defaultValue = '"off"';
    expect(
      getStyledApiProp(buildContractStyledApi(defaultMismatch), "Select", "autoComplete"),
    ).toMatchObject({
      classification: "primitive-override",
      defaultValue: '"off"',
    });
  });

  it("rejects new styled props until an authored catalog or annotation description exists", () => {
    const badgeContract = starwindStyledContracts.find(
      (contract) => contract.component === "badge",
    );
    expect(badgeContract).toBeDefined();
    if (!badgeContract) return;

    const mutatedBadge = cloneContract(badgeContract);
    const badge = mutatedBadge.components[0];
    badge?.props?.fields?.push({
      name: "undocumentedProp",
      optional: true,
      type: "string",
    });
    badge?.destructure?.props.push({ name: "undocumentedProp" });

    expect(() =>
      buildLayeredDocsMetadata({
        styledContracts: starwindStyledContracts.map((contract) =>
          contract.component === "badge" ? mutatedBadge : contract,
        ),
      }),
    ).toThrow(/Badge styled API prop undocumentedProp is missing an authored description/);
  });

  it("rejects stale styled API annotation export, prop, and inheritance keys", () => {
    expect(() =>
      buildLayeredDocsMetadata({
        styledAnnotations: {
          ...styledDocsAnnotations,
          badge: {
            ...styledDocsAnnotations.badge,
            styledApi: {
              MissingExport: {},
              Badge: {
                props: { missingProp: { description: "stale" } },
                inheritance: { "html:missing": { description: "stale" } },
              },
            },
          },
        },
      }),
    ).toThrow(
      /unknown export MissingExport[\s\S]*unknown prop missingProp[\s\S]*unknown inheritance html:missing/,
    );
  });

  it("enriches generated styled API facts with authored annotations", () => {
    const metadata = buildLayeredDocsMetadata({
      styledAnnotations: {
        ...styledDocsAnnotations,
        badge: {
          ...styledDocsAnnotations.badge,
          styledApi: {
            Badge: {
              description: "Displays a compact status or category label.",
              props: {
                appearance: {
                  description: "Selects the Badge chrome treatment.",
                  deprecated: { reason: "Example only.", replacement: "variant" },
                },
              },
            },
          },
        },
      },
    });
    const badge = metadata.styledComponents.find((component) => component.id === "badge");
    const badgeExport = badge?.styledApi.astro.exports[0];

    expect(badgeExport?.description).toBe("Displays a compact status or category label.");
    expect(badgeExport?.props.find((prop) => prop.name === "appearance")).toMatchObject({
      description: "Selects the Badge chrome treatment.",
      descriptionSource: "annotation",
      deprecated: { reason: "Example only.", replacement: "variant" },
    });
  });

  it("reproduces every canonical generated path and byte from a temporary root", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-layered-docs-bytes-"));
    const canonicalRelativePath =
      "scripts/portable-runtime/docs/layered-docs/generated/layered-docs-metadata.ts";

    try {
      await generateLayeredDocsMetadata({
        docsRoot: path.join(tempRoot, "missing-docs"),
        outputRoot: tempRoot,
      });

      expect(await readFilesRecursively(tempRoot)).toEqual([
        {
          relativePath: canonicalRelativePath,
          source: await readFile(path.join(process.cwd(), canonicalRelativePath), "utf8"),
        },
      ]);
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  it("builds a complete layered docs inventory from contracts and curated annotations", () => {
    const metadata = buildLayeredDocsMetadata();

    expect(metadata.version).toBe(1);
    expect(metadata.groups.map((group) => group.id)).toEqual([
      "form-input",
      "navigation",
      "overlay-disclosure",
      "feedback-status",
      "layout-structure",
      "content-media",
    ]);

    expect(metadata.styledComponents.map((component) => component.id)).toContain("image");
    expect(metadata.styledComponents.map((component) => component.id)).toContain("sheet");
    expect(metadata.primitives.map((primitive) => primitive.id)).toContain("drawer");

    const drawer = metadata.primitives.find((primitive) => primitive.id === "drawer");
    expect(drawer).toMatchObject({
      docsPage: { status: "published", path: "/docs/primitives/drawer/" },
      runtime: {
        factory: "createDrawer",
        importSource: "@starwind-ui/runtime/drawer",
        rootPart: "root",
        destroys: true,
      },
      presence: {
        initialHiddenParts: ["backdrop"],
        unmountPolicy: "runtime-owned",
      },
    });
    expect(drawer?.runtime.optionProps).toEqual(
      expect.arrayContaining(["defaultOpen", "onOpenChange", "open"]),
    );
    expect(drawer?.runtime.optionPropLifecycles).toMatchObject({
      open: "setter-backed",
    });
    expect(drawer?.parts).toContainEqual(
      expect.objectContaining({
        name: "popup",
        defaultElement: "dialog",
        discoveryAttribute: "data-sw-drawer-popup",
        role: "dialog",
      }),
    );
    expect(drawer?.props).toContainEqual(
      expect.objectContaining({
        name: "open",
        kind: "control",
        type: "boolean",
      }),
    );
    expect(drawer?.stateModels).toContainEqual(
      expect.objectContaining({
        name: "open",
        controlledProp: "open",
        runtimeSetter: "setOpen",
      }),
    );
    expect(drawer?.events).toContainEqual(
      expect.objectContaining({
        name: "openChange",
        callbackProp: "onOpenChange",
        domEvent: "starwind:open-change",
      }),
    );
    expect(drawer?.setters).toContainEqual(
      expect.objectContaining({ method: "setOpen", stateModel: "open" }),
    );
    expect(drawer?.refs).toContainEqual({ part: "popup", public: true });
    expect(drawer?.frameworkNotes?.astro?.[0]).toMatch(/Render static drawer anatomy/);

    const checkbox = metadata.primitives.find((primitive) => primitive.id === "checkbox");
    const checkboxRoot = checkbox?.docsReference.apiReference.parts.find(
      (part) => part.part === "root",
    );
    const checkedState = checkboxRoot?.stateModels.find((state) => state.name === "checked");
    expect(checkboxRoot).toBeDefined();
    expect(checkedState).toBeDefined();
    const checkedStateSupport = formatPrimitiveStateControlSupport(checkboxRoot!, checkedState!);

    expect(checkedStateSupport).toContain("React supports controlled and default state");
    expect(checkedStateSupport).toContain("Runtime/HTML reads initial state");
    expect(checkedStateSupport).toContain("Astro adapters render initial/default state");
    expect(checkedStateSupport).not.toContain("Astro: unsupported");
    expect(checkedStateSupport).not.toContain("custom-event");
    expect(checkedStateSupport).not.toContain("imperative");

    const menu = metadata.primitives.find((primitive) => primitive.id === "menu");
    const menuRoot = menu?.docsReference.apiReference.parts.find((part) => part.part === "root");
    const menuRadioValueState = menuRoot?.stateModels.find((state) => state.name === "radioValue");
    expect(menuRoot).toBeDefined();
    expect(menuRadioValueState).toBeDefined();
    const menuRadioValueSupport = formatPrimitiveStateControlSupport(
      menuRoot!,
      menuRadioValueState!,
      menu!.events,
    );
    expect(menuRadioValueSupport).toContain(
      "Runtime/HTML reads initial state from data-value and emits starwind:value-change.",
    );

    const dropzone = metadata.primitives.find((primitive) => primitive.id === "dropzone");
    const dropzoneRoot = dropzone?.docsReference.apiReference.parts.find(
      (part) => part.part === "root",
    );
    const uploadingState = dropzoneRoot?.stateModels.find((state) => state.name === "uploading");
    expect(dropzoneRoot).toBeDefined();
    expect(uploadingState).toBeDefined();
    const uploadingStateSupport = formatPrimitiveStateControlSupport(
      dropzoneRoot!,
      uploadingState!,
      dropzone!.events,
    );
    expect(uploadingStateSupport).toContain(
      "Astro adapters render initial/default state and report changes through Runtime DOM events.",
    );
    expect(uploadingStateSupport).not.toContain("custom-event");

    const image = metadata.styledComponents.find((component) => component.id === "image");
    expect(image).toMatchObject({
      docsPage: { status: "published", path: "/docs/components/image/" },
      foundation: { type: "styled-only" },
      groupId: "content-media",
    });
    expect(image?.frameworkAvailability.react.status).toBe("framework-native");
    expect(image?.aliases).toContain("astro:assets");

    const sheet = metadata.styledComponents.find((component) => component.id === "sheet");
    expect(sheet).toMatchObject({
      foundation: { type: "renamed-primitive" },
      primitiveIds: ["drawer"],
    });
    expect(sheet?.runtimeFactories).toContainEqual({
      factory: "createDrawer",
      importSource: "@starwind-ui/runtime/drawer",
      primitiveId: "drawer",
    });
    expect(sheet?.aliases).toEqual(expect.arrayContaining(["Sheet", "Drawer", "drawer"]));

    expect(metadata.styledComponents.find((component) => component.id === "field")).toMatchObject({
      foundation: { type: "composite" },
      primitiveIds: ["field", "fieldset"],
    });
    expect(
      metadata.styledComponents.find((component) => component.id === "radio-group"),
    ).toMatchObject({
      foundation: { type: "composite" },
      primitiveIds: ["radio", "radio-group"],
    });
    expect(
      metadata.styledComponents.find((component) => component.id === "toggle-group"),
    ).toMatchObject({
      foundation: { type: "composite" },
      primitiveIds: ["toggle", "toggle-group"],
    });

    for (const component of metadata.styledComponents) {
      expect(component.foundation.type).toBeTruthy();
      expect(component.frameworkAvailability.astro.status).toBeTruthy();
      expect(component.frameworkAvailability.react.status).toBeTruthy();
      expect(component.groupId).toBeTruthy();
      expect(component.docsPage.status).toBeTruthy();
    }
  });

  it("publishes Navigation Menu primitive and styled docs", () => {
    const metadata = buildLayeredDocsMetadata();
    const primitive = metadata.primitives.find((item) => item.id === "navigation-menu");
    const styled = metadata.styledComponents.find((item) => item.id === "navigation-menu");
    const styling = metadata.styling.components.find((item) => item.id === "navigation-menu");

    expect(primitive).toBeDefined();
    expect(styled).toMatchObject({
      docsPage: { status: "published", path: "/docs/components/navigation-menu/" },
      foundation: { type: "direct-primitive" },
      groupId: "navigation",
      primitiveIds: ["navigation-menu"],
      runtimeFactories: [
        {
          factory: "createNavigationMenu",
          importSource: "@starwind-ui/runtime/navigation-menu",
          primitiveId: "navigation-menu",
        },
      ],
    });
    expect(styled?.publicExports).toEqual(
      expect.arrayContaining([
        "NavigationMenu",
        "NavigationMenuContent",
        "NavigationMenuItem",
        "NavigationMenuLink",
        "NavigationMenuList",
        "NavigationMenuPositioner",
        "NavigationMenuTrigger",
      ]),
    );
    expect(styling?.variantCollections).toContainEqual(
      expect.objectContaining({ exportName: "NavigationMenuVariants", name: "navigationMenu" }),
    );
    expect(styling?.slots).toEqual(
      expect.arrayContaining([
        "navigation-menu",
        "navigation-menu-content",
        "navigation-menu-link",
        "navigation-menu-positioner",
        "navigation-menu-trigger",
      ]),
    );
    expect(styling).toHaveProperty("docsPath", "/docs/components/navigation-menu/");

    expect(primitive).toMatchObject({
      docsPage: { status: "published", path: "/docs/primitives/navigation-menu/" },
      runtime: {
        factory: "createNavigationMenu",
        importSource: "@starwind-ui/runtime/navigation-menu",
        optionProps: expect.arrayContaining(["defaultValue", "openDelay", "closeDelay", "value"]),
      },
      floating: {
        anchorPart: "trigger",
        positionerPart: "positioner",
        popupPart: "popup",
        optionProps: expect.arrayContaining(["side", "align", "avoidCollisions"]),
      },
    });
    expect(primitive?.parts.map((part) => part.name)).toEqual(
      expect.arrayContaining([
        "root",
        "list",
        "item",
        "trigger",
        "icon",
        "content",
        "link",
        "portal",
        "positioner",
        "popup",
        "viewport",
        "arrow",
      ]),
    );

    const rootReference = primitive?.docsReference.apiReference.parts.find(
      (part) => part.part === "root",
    );
    const triggerReference = primitive?.docsReference.apiReference.parts.find(
      (part) => part.part === "trigger",
    );
    const linkReference = primitive?.docsReference.apiReference.parts.find(
      (part) => part.part === "link",
    );
    expect(rootReference?.dataAttributes).toContainEqual(
      expect.objectContaining({ name: "data-sw-nav-menu" }),
    );
    expect(triggerReference?.dataAttributes).toContainEqual(
      expect.objectContaining({ name: "data-sw-nav-menu-trigger" }),
    );
    expect(linkReference?.props).toContainEqual(expect.objectContaining({ name: "closeOnClick" }));

    const examplesByFramework = new Map(
      primitive?.docsReference.examples.map((example) => [example.framework, example]) ?? [],
    );
    expect(examplesByFramework.get("raw-html")?.code).toContain(
      'import { createNavigationMenu } from "@starwind-ui/runtime/navigation-menu";',
    );
    expect(examplesByFramework.get("raw-html")?.code).toContain("data-sw-nav-menu");
    expect(examplesByFramework.get("astro")?.code).toContain(
      'import { NavigationMenu } from "@starwind-ui/astro/navigation-menu";',
    );
    expect(examplesByFramework.get("react")?.code).toContain(
      'import { NavigationMenu } from "@starwind-ui/react/navigation-menu";',
    );

    const publicSectionTitles =
      primitive?.docsReference.sections.map((section) => section.title) ?? [];
    expect(publicSectionTitles).toContain("Shared Viewport");
    expect(publicSectionTitles).not.toContain("Deferred Base UI Parity");

    const publicDocsText = [
      ...(primitive?.docsReference.behaviorNotes ?? []),
      ...(primitive?.docsReference.sections.map((section) => section.content) ?? []),
    ].join("\n");
    expect(publicDocsText).not.toContain("nested Navigation Menu roots");
    expect(publicDocsText).not.toContain("provider-level delay grouping");
    expect(publicDocsText).not.toContain("open-change-complete callbacks");

    const primitiveSource = JSON.stringify(primitive);
    const normalizedPrimitiveSource = primitiveSource.toLowerCase();
    expect(normalizedPrimitiveSource).not.toContain("inline navigation menu roots");
    expect(normalizedPrimitiveSource).not.toContain("inline nested");
    expect(normalizedPrimitiveSource).not.toContain("portaled nested");
    expect(primitiveSource).not.toContain("NavigationMenuBackdrop");
    expect(primitiveSource).not.toContain("actionsRef");
    expect(primitiveSource).not.toContain("onOpenChangeComplete");
  });

  it("builds Base UI-style primitive reference metadata from contract facts and authored enrichment", () => {
    const metadata = buildLayeredDocsMetadata({
      primitiveDocsUsageRoot: false,
      primitiveDocsEnrichment: {
        checkbox: {
          summary: "Checkbox coordinates a visible boolean control with hidden form inputs.",
          behaviorNotes: ["Group context can provide checked and disabled state."],
          frameworkNotes: {
            astro: ["Astro renders static uncontrolled markup and self-initializes the Runtime."],
            react: ["React can bridge controlled state through primitive adapter props."],
          },
          usageGuidelines: [
            {
              title: "Use a checkbox for boolean form state.",
              description: "Use Checkbox when users can turn a single independent value on or off.",
            },
          ],
          examples: [
            {
              id: "checkbox-basic",
              title: "Basic checkbox",
              framework: "astro",
              description: "A simple uncontrolled checkbox using the Astro primitive adapter.",
              source: "src/examples/primitives/checkbox/basic.astro",
            },
          ],
          parts: {
            root: {
              description: "The focusable ARIA checkbox element.",
              props: {
                checked: "Controls the checked state.",
              },
              dataAttributes: {
                "data-checked": "Present when the checkbox is checked.",
              },
            },
            indicator: {
              description: "The visual indicator shown for checked state.",
              props: {
                keepMounted: "Keeps the indicator in the DOM when unchecked.",
              },
            },
          },
        },
      },
    });

    const checkbox = metadata.primitives.find((primitive) => primitive.id === "checkbox");
    const dialog = metadata.primitives.find((primitive) => primitive.id === "dialog");

    if (!checkbox || !dialog) {
      throw new Error("Expected checkbox and dialog primitive test fixtures.");
    }

    expect(checkbox.docsReference).toMatchObject({
      summary: "Checkbox coordinates a visible boolean control with hidden form inputs.",
      frameworkTargets: ["raw-html", "astro", "react", "solid", "svelte", "vue"],
      behaviorNotes: ["Group context can provide checked and disabled state."],
      anatomy: {
        importSource: "@starwind-ui/react/checkbox",
        namespace: "Checkbox",
        parts: ["root", "indicator", "input", "uncheckedInput"],
      },
      apiReference: {
        runtimeFactory: {
          factory: "createCheckbox",
          importSource: "@starwind-ui/runtime/checkbox",
          docsPath: "/docs/runtime/#create-checkbox",
        },
      },
    });
    expect(checkbox.frameworkNotes).toEqual({
      astro: [
        "Render uncontrolled initial state only; updates are runtime-owned after hydration.",
        "Astro renders static uncontrolled markup and self-initializes the Runtime.",
      ],
      react: [
        "Bridge controlled checked changes through setChecked without emitting duplicate events.",
        "React can bridge controlled state through primitive adapter props.",
      ],
    });
    expect(checkbox.docsReference.examples).toContainEqual(
      expect.objectContaining({
        id: "checkbox-basic",
        framework: "astro",
      }),
    );
    expect(checkbox.docsReference.usageGuidelines).toContainEqual(
      expect.objectContaining({
        title: "Use a checkbox for boolean form state.",
      }),
    );
    expect(checkbox.docsReference.apiReference.exportGroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Runtime",
          importSource: "@starwind-ui/runtime/checkbox",
          exports: ["createCheckbox"],
        }),
        expect.objectContaining({
          label: "React Primitive",
          importSource: "@starwind-ui/react/checkbox",
          exports: expect.arrayContaining(["Checkbox", "CheckboxRoot", "CheckboxIndicator"]),
        }),
      ]),
    );
    expect(checkbox.docsReference.apiReference.canonicalNames).toEqual(
      expect.arrayContaining([
        { kind: "namespace", name: "Checkbox" },
        { kind: "runtime-factory", name: "createCheckbox" },
        { kind: "part", name: "Checkbox.Root" },
        { kind: "part", name: "Checkbox.Indicator" },
      ]),
    );
    expect(checkbox.docsReference.apiReference.relatedStyledComponents).toContainEqual(
      expect.objectContaining({
        id: "checkbox",
        title: "Checkbox",
        docsPath: "/docs/components/checkbox/",
        foundationType: "direct-primitive",
      }),
    );

    const checkboxRoot = checkbox.docsReference.apiReference.parts.find(
      (part) => part.part === "root",
    );
    const checkboxIndicator = checkbox.docsReference.apiReference.parts.find(
      (part) => part.part === "indicator",
    );
    const checkboxInput = checkbox.docsReference.apiReference.parts.find(
      (part) => part.part === "input",
    );

    expect(checkboxRoot).toMatchObject({
      part: "root",
      description: "The focusable ARIA checkbox element.",
      descriptionSource: "authored",
      defaultElement: "span",
      discoveryAttribute: "data-sw-checkbox",
      role: "checkbox",
    });
    expect(checkboxRoot?.props).toContainEqual(
      expect.objectContaining({
        name: "checked",
        type: "boolean",
        description: "Controls the checked state.",
        descriptionSource: "authored",
      }),
    );
    expect(checkboxRoot?.dataAttributes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "data-sw-checkbox",
          source: "runtime",
          description: "Marks the Root part so Starwind Runtime can find it.",
          descriptionSource: "authored",
        }),
        expect.objectContaining({
          name: "data-checked",
          source: "state",
          description: "Present when the checkbox is checked.",
          descriptionSource: "authored",
        }),
      ]),
    );
    expect(checkboxRoot?.events).toContainEqual(
      expect.objectContaining({
        name: "checkedChange",
        callbackProp: "onCheckedChange",
        description: "Fires when the checked state changes for Checkbox.",
        descriptionSource: "authored",
      }),
    );
    expect(checkboxRoot?.stateModels).toContainEqual(
      expect.objectContaining({
        name: "checked",
        description: "Tracks whether Checkbox is checked.",
        descriptionSource: "authored",
      }),
    );
    expect(checkboxRoot?.setters).toContainEqual(
      expect.objectContaining({
        method: "setChecked",
        stateModel: "checked",
        description: "Updates whether Checkbox is checked from Runtime code.",
        descriptionSource: "authored",
      }),
    );
    expect(checkboxIndicator).toMatchObject({
      part: "indicator",
      description: "The visual indicator shown for checked state.",
    });
    expect(checkboxIndicator?.props).toContainEqual(
      expect.objectContaining({
        name: "keepMounted",
        targets: ["indicator"],
        description: "Keeps the indicator in the DOM when unchecked.",
      }),
    );
    expect(checkboxInput?.dataAttributes.map((attribute) => attribute.name)).toEqual([
      "data-sw-checkbox-input",
    ]);

    const dialogRoot = dialog.docsReference.apiReference.parts.find((part) => part.part === "root");
    const dialogPopup = dialog.docsReference.apiReference.parts.find(
      (part) => part.part === "popup",
    );

    expect(dialogPopup).toMatchObject({
      part: "popup",
      description: "The floating content container for Dialog.",
      descriptionSource: "authored",
      defaultElement: "dialog",
      discoveryAttribute: "data-sw-dialog-content",
      role: "dialog",
    });
    expect(dialogRoot?.stateModels).toContainEqual(
      expect.objectContaining({ name: "open", runtimeSetter: "setOpen" }),
    );
    expect(dialogRoot?.events).toContainEqual(
      expect.objectContaining({ name: "openChange", domEvent: "starwind:open-change" }),
    );
    expect(dialogRoot?.setters).toContainEqual(
      expect.objectContaining({ method: "setOpen", stateModel: "open" }),
    );
  });

  it("publishes source-backed Color Picker format, state, form, and styling documentation", () => {
    const metadata = buildLayeredDocsMetadata();
    const colorPicker = metadata.primitives.find((primitive) => primitive.id === "color-picker");

    expect(colorPicker).toBeDefined();
    expect(colorPicker?.docsReference.anatomy.parts).toEqual([
      "root",
      "label",
      "control",
      "valueInput",
      "valueSwatch",
      "valueText",
      "area",
      "areaBackground",
      "areaThumb",
      "areaInput",
      "channelSlider",
      "channelSliderTrack",
      "channelSliderThumb",
      "channelSliderInput",
      "channelInput",
      "formatSelect",
      "formatControl",
      "transparencyGrid",
      "swatchGroup",
      "swatch",
      "eyeDropperTrigger",
      "clear",
      "hiddenInput",
    ]);
    expect(colorPicker?.docsReference.authoredExamples).toEqual(
      colorPickerPrimitiveDocsAuthoredExamples,
    );
    expect(colorPicker?.docsReference.sections.map((section) => section.title)).toEqual([
      "Format Controls",
      "State, Events, and Commands",
      "Forms and Reset",
      "Styling Color Thumbs",
      "Accessibility",
    ]);

    const formatSelect = colorPicker?.docsReference.apiReference.parts.find(
      (part) => part.part === "formatSelect",
    );
    const formatControl = colorPicker?.docsReference.apiReference.parts.find(
      (part) => part.part === "formatControl",
    );
    expect(formatSelect).toMatchObject({
      defaultElement: "select",
      discoveryAttribute: "data-sw-color-picker-format-select",
    });
    expect(formatControl).toMatchObject({
      defaultElement: "div",
      discoveryAttribute: "data-sw-color-picker-format-control",
    });
    expect(formatControl?.dataAttributes.map((attribute) => attribute.name)).toEqual([
      "data-sw-color-picker-format-control",
      "data-format",
      "data-disabled",
      "data-readonly",
    ]);
    expect(colorPicker?.stateModels.map((state) => state.name)).toEqual(["value", "format"]);
    expect(colorPicker?.events.map((event) => event.domEvent)).toEqual([
      "starwind:value-change",
      "starwind:value-committed",
      "starwind:format-change",
    ]);
    expect(colorPicker?.setters.map((setter) => setter.method)).toEqual([
      "setValue",
      "setFormat",
      "setDisabled",
      "setReadOnly",
      "setName",
      "setOptions",
    ]);
    expect(colorPicker?.cssVariables).toEqual(
      expect.arrayContaining([
        {
          name: "--sw-color-picker-area-thumb-color",
          description: "Resolved display color painted by the color-area thumb.",
          parts: ["areaThumb"],
          source: "runtime",
        },
        {
          name: "--sw-color-picker-channel-thumb-color",
          description: "Resolved display color painted by a channel slider thumb.",
          parts: ["channelSliderThumb"],
          source: "runtime",
        },
      ]),
    );
    expect(colorPicker?.docsReference.apiReference.relatedStyledComponents).toContainEqual({
      id: "color-picker",
      title: "Color Picker",
      docsPath: "/docs/components/color-picker/",
      foundationType: "direct-primitive",
    });

    for (const example of colorPicker?.docsReference.authoredExamples ?? []) {
      expect(example.frameworks.map((framework) => framework.framework)).toEqual([
        "astro",
        "react",
        "raw-html",
      ]);
      for (const framework of example.frameworks) {
        expect(framework.source).toContain(
          "scripts/portable-runtime/docs/layered-docs/examples.ts#color-picker-",
        );
        expect(framework.code).toContain("hex");
        expect(framework.code).toContain("rgb");
        expect(framework.code).toContain("hsl");
        expect(framework.code).toContain("hsb");
      }
    }

    const compositeExample = colorPicker?.docsReference.authoredExamples.find(
      (example) => example.id === "composite-format-control",
    );
    expect(compositeExample?.frameworks.map((framework) => framework.code).join("\n")).toContain(
      "ColorPicker.FormatControl",
    );
    expect(compositeExample?.frameworks.map((framework) => framework.code).join("\n")).toContain(
      "data-sw-color-picker-format-control",
    );
    expect(compositeExample?.frameworks.map((framework) => framework.code).join("\n")).toContain(
      "createSelect",
    );
    expect(
      compositeExample?.frameworks
        .filter((framework) => framework.framework !== "raw-html")
        .map((framework) => framework.code)
        .join("\n"),
    ).not.toContain("<Select.Input");
    expect(
      compositeExample?.frameworks.find((framework) => framework.framework === "raw-html")?.code,
    ).toContain('<input data-sw-select-input type="hidden" />');
    const nativeExample = colorPicker?.docsReference.authoredExamples.find(
      (example) => example.id === "native-format-select",
    );
    expect(nativeExample?.frameworks.map((framework) => framework.code).join("\n")).toContain(
      "ColorPicker.FormatSelect",
    );
    expect(nativeExample?.frameworks.map((framework) => framework.code).join("\n")).toContain(
      "data-sw-color-picker-format-select",
    );
  });

  it("tracks primitive reference description completeness for representative primitives", () => {
    const metadata = buildLayeredDocsMetadata();
    const requiredPrimitiveIds = ["button", "checkbox", "menu"];

    for (const primitiveId of requiredPrimitiveIds) {
      const primitive = metadata.primitives.find((candidate) => candidate.id === primitiveId);
      expect(primitive, `${primitiveId} primitive should exist`).toBeDefined();

      for (const part of primitive!.docsReference.apiReference.parts) {
        expect(part.description, `${primitiveId}.${part.part} part description`).toMatch(/\S/);
        expect(part.descriptionSource, `${primitiveId}.${part.part} part source`).toBe("authored");

        for (const prop of part.props) {
          expect(prop.description, `${primitiveId}.${part.part}.prop.${prop.name}`).toMatch(/\S/);
          expect(prop.descriptionSource, `${primitiveId}.${part.part}.prop.${prop.name}`).toBe(
            "authored",
          );
        }

        for (const attribute of part.dataAttributes) {
          expect(
            attribute.description,
            `${primitiveId}.${part.part}.data-attribute.${attribute.name}`,
          ).toMatch(/\S/);
          expect(
            attribute.descriptionSource,
            `${primitiveId}.${part.part}.data-attribute.${attribute.name}`,
          ).toBe("authored");
        }

        for (const state of part.stateModels) {
          expect(state.description, `${primitiveId}.${part.part}.state.${state.name}`).toMatch(
            /\S/,
          );
          expect(state.descriptionSource, `${primitiveId}.${part.part}.state.${state.name}`).toBe(
            "authored",
          );
        }

        for (const event of part.events) {
          expect(event.description, `${primitiveId}.${part.part}.event.${event.name}`).toMatch(
            /\S/,
          );
          expect(event.descriptionSource, `${primitiveId}.${part.part}.event.${event.name}`).toBe(
            "authored",
          );
        }

        for (const setter of part.setters) {
          expect(setter.description, `${primitiveId}.${part.part}.setter.${setter.method}`).toMatch(
            /\S/,
          );
          expect(
            setter.descriptionSource,
            `${primitiveId}.${part.part}.setter.${setter.method}`,
          ).toBe("authored");
        }
      }
    }

    const report = validateLayeredDocsMetadata(metadata);
    const descriptionGapKeys = findPrimitiveReferenceDescriptionGaps(metadata);
    const descriptionGaps = report.optionalGaps.join("\n");

    expect(descriptionGaps).not.toContain("Primitive reference description gaps");
    expect(descriptionGapKeys).toEqual([]);
  });

  it("keeps primitive descriptions readable", () => {
    const metadata = buildLayeredDocsMetadata();
    const accordion = metadata.primitives.find((primitive) => primitive.id === "accordion");
    const accordionRoot = accordion?.docsReference.apiReference.parts.find(
      (part) => part.part === "root",
    );
    const valueChangeEvent = accordionRoot?.events.find((event) => event.name === "valueChange");
    const stateAttribute = accordionRoot?.dataAttributes.find(
      (attribute) => attribute.name === "data-state",
    );
    const descriptions = metadata.primitives.flatMap((primitive) =>
      primitive.docsReference.apiReference.parts.flatMap((part) => [
        part.description,
        ...part.props.map((prop) => prop.description),
        ...part.dataAttributes.map((attribute) => attribute.description),
        ...part.stateModels.map((state) => state.description),
        ...part.events.map((event) => event.description),
        ...part.setters.map((setter) => setter.description),
      ]),
    );

    expect(valueChangeEvent?.description).toBe("Fires when the value changes for Accordion.");
    expect(stateAttribute?.description).toBe("Reflects the current state on the Root part.");
    expect(descriptions.join("\n")).not.toMatch(/\b(state|value|prop|option|attribute)\s+\1\b/i);
    expect(descriptions.join("\n")).not.toMatch(/renders the `[^`]+` element for the .+ primitive/);
    expect(descriptions.join("\n")).not.toMatch(/\bthe primitive\b/i);
  });

  it("builds primitive examples from a structured framework example registry", () => {
    const metadata = buildLayeredDocsMetadata({
      primitiveDocsExamples: {
        button: {
          basic: {
            "raw-html": {
              title: "Raw HTML",
              summary: "Render the button DOM contract and initialize the Runtime directly.",
              language: "html",
              code: `<button data-sw-button>Save</button>`,
            },
          },
        },
      },
      primitiveDocsExampleCoveragePolicy: {
        requiredTargets: ["raw-html"],
      },
    });

    const button = metadata.primitives.find((primitive) => primitive.id === "button");

    expect(button?.docsReference.examples).toContainEqual({
      id: "basic",
      framework: "raw-html",
      title: "Raw HTML",
      summary: "Render the button DOM contract and initialize the Runtime directly.",
      language: "html",
      code: `<button data-sw-button>Save</button>`,
    });
    expect(button?.docsReference.exampleCoverage).toEqual({
      requiredTargets: ["raw-html"],
      missingTargets: [],
      allowedMissingTargets: [],
    });
  });

  it("generates source-backed raw HTML, Astro, and React examples for every primitive", () => {
    const metadata = buildLayeredDocsMetadata();
    const report = validateLayeredDocsMetadata(metadata);

    expect(report.requiredFailures).toEqual([]);
    expect(report.optionalGaps).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining("Primitive docs example gaps: framework examples missing for"),
      ]),
    );

    for (const contract of runtimeAdapterContracts) {
      const primitive = metadata.primitives.find(
        (candidate) => candidate.id === contract.component,
      );
      const rootPart = contract.parts.find((part) => part.name === contract.runtime.rootPart);
      const namespace = toTestPascalCase(contract.component);
      const rootNamespaceName = `${namespace}.${toTestPascalCase(contract.runtime.rootPart)}`;
      const examplesByFramework = new Map(
        primitive?.docsReference.examples.map((example) => [example.framework, example]) ?? [],
      );

      expect(primitive?.docsReference.exampleCoverage).toEqual({
        requiredTargets: ["raw-html", "astro", "react"],
        missingTargets: [],
        allowedMissingTargets: [],
      });

      const rawHtmlExample = examplesByFramework.get("raw-html");
      const astroExample = examplesByFramework.get("astro");
      const reactExample = examplesByFramework.get("react");

      expect(rawHtmlExample).toMatchObject({
        id: "basic",
        title: "Raw HTML",
        language: "html",
        source: `scripts/portable-runtime/docs/layered-docs/examples.ts#${contract.component}-basic-raw-html`,
      });
      expect(rawHtmlExample?.code).toContain(
        `import { ${contract.runtime.factory} } from "${contract.runtime.importSource}";`,
      );
      expect(rawHtmlExample?.code).toContain(rootPart?.discoveryAttribute);
      expect(rawHtmlExample?.code).toContain(`${contract.runtime.factory}(`);

      expect(astroExample).toMatchObject({
        id: "basic",
        title: "Astro",
        language: "astro",
        source: `scripts/portable-runtime/docs/layered-docs/examples.ts#${contract.component}-basic-astro`,
      });
      expect(astroExample?.code).toContain(
        `import { ${namespace} } from "@starwind-ui/astro/${contract.component}";`,
      );
      expect(astroExample?.code).toContain(`<${rootNamespaceName}`);

      expect(reactExample).toMatchObject({
        id: "basic",
        title: "React",
        language: "tsx",
        source: `scripts/portable-runtime/docs/layered-docs/examples.ts#${contract.component}-basic-react`,
      });
      expect(reactExample?.code).toContain(
        `import { ${namespace} } from "@starwind-ui/react/${contract.component}";`,
      );
      expect(reactExample?.code).toContain(`<${rootNamespaceName}`);
    }
  });

  it("rejects unknown primitive ids in the structured example registry", () => {
    expect(() =>
      buildLayeredDocsMetadata({
        primitiveDocsExamples: {
          "not-a-primitive": {
            basic: {
              "raw-html": {
                title: "Raw HTML",
                summary: "Unknown primitive example.",
                code: "<div></div>",
              },
            },
          },
        },
      }),
    ).toThrow("Unknown primitive docs example registry id not-a-primitive.");
  });

  it("rejects non-planned registry examples without source code", () => {
    expect(() =>
      buildLayeredDocsMetadata({
        primitiveDocsExamples: {
          button: {
            basic: {
              "raw-html": {
                title: "Raw HTML",
                summary: "Missing code should fail unless the example is marked planned.",
              },
            },
          },
        },
      }),
    ).toThrow("button primitive docs example basic.raw-html is missing source code.");
  });

  it("rejects blank registry example title and summary", () => {
    expect(() =>
      buildLayeredDocsMetadata({
        primitiveDocsExamples: {
          button: {
            basic: {
              "raw-html": {
                title: "",
                summary: " ",
                code: "<button data-sw-button>Save</button>",
              },
            },
          },
        },
      }),
    ).toThrow("button primitive docs example basic.raw-html is missing a title.");

    expect(() =>
      buildLayeredDocsMetadata({
        primitiveDocsExamples: {
          button: {
            basic: {
              "raw-html": {
                title: "Raw HTML",
                summary: "",
                code: "<button data-sw-button>Save</button>",
              },
            },
          },
        },
      }),
    ).toThrow("button primitive docs example basic.raw-html is missing a summary.");
  });

  it("fails validation when required framework examples are not allowed rollout gaps", () => {
    const metadata = buildLayeredDocsMetadata({
      primitiveDocsExamples: {},
      primitiveDocsExampleCoveragePolicy: {
        requiredTargets: ["raw-html"],
      },
    });
    const report = validateLayeredDocsMetadata(metadata);

    expect(report.requiredFailures).toEqual(
      expect.arrayContaining([
        "accordion primitive docs reference is missing required examples for raw-html.",
      ]),
    );
  });

  it("treats planned examples as missing required coverage until source code exists", () => {
    const metadata = buildLayeredDocsMetadata({
      primitiveDocsExamples: {
        button: {
          basic: {
            "raw-html": {
              title: "Raw HTML",
              summary: "A planned raw HTML example.",
              status: "planned",
            },
          },
        },
      },
      primitiveDocsExampleCoveragePolicy: {
        requiredTargets: ["raw-html"],
        allowedMissingTargets: {
          button: ["raw-html"],
        },
      },
    });
    const button = metadata.primitives.find((primitive) => primitive.id === "button");
    const report = validateLayeredDocsMetadata(metadata);

    expect(button?.docsReference.examples).toContainEqual(
      expect.objectContaining({
        framework: "raw-html",
        status: "planned",
      }),
    );
    expect(button?.docsReference.exampleCoverage).toEqual({
      requiredTargets: ["raw-html"],
      missingTargets: ["raw-html"],
      allowedMissingTargets: ["raw-html"],
    });
    expect(report.requiredFailures).not.toContain(
      "button primitive docs reference is missing required examples for raw-html.",
    );
    expect(report.optionalGaps).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Primitive docs example gaps: framework examples missing for"),
      ]),
    );
  });

  it("validates primitive reference generated facts separately from optional enrichment gaps", () => {
    const metadata = buildLayeredDocsMetadata();
    const brokenMetadata = {
      ...metadata,
      primitives: metadata.primitives.map((primitive) =>
        primitive.id === "checkbox"
          ? {
              ...primitive,
              docsReference: {
                ...primitive.docsReference,
                summary: "",
                anatomy: {
                  ...primitive.docsReference.anatomy,
                  parts: primitive.docsReference.anatomy.parts.filter((part) => part !== "root"),
                },
                apiReference: {
                  ...primitive.docsReference.apiReference,
                  parts: primitive.docsReference.apiReference.parts
                    .filter((part) => part.part !== "root")
                    .map((part) =>
                      part.part === "indicator"
                        ? {
                            ...part,
                            defaultElement: "div",
                            discoveryAttribute: "data-sw-checkbox-wrong",
                          }
                        : part,
                    ),
                },
              },
            }
          : primitive,
      ),
    } satisfies LayeredDocsMetadata;

    const report = validateLayeredDocsMetadata(brokenMetadata);

    expect(report.requiredFailures).toEqual(
      expect.arrayContaining([
        "checkbox primitive docs reference summary is missing.",
        "checkbox primitive docs reference anatomy omits part root.",
        "checkbox primitive docs reference omits API reference for part root.",
        "checkbox primitive docs reference part indicator defaultElement div does not match contract defaultElement span.",
        "checkbox primitive docs reference part indicator discoveryAttribute data-sw-checkbox-wrong does not match contract discoveryAttribute data-sw-checkbox-indicator.",
      ]),
    );
    expectSubstringsInOrder(report.requiredFailures.join("\n"), [
      "checkbox primitive docs reference summary is missing.",
      "checkbox primitive docs reference anatomy omits part root.",
      "checkbox primitive docs reference omits API reference for part root.",
      "checkbox primitive docs reference part indicator defaultElement div does not match contract defaultElement span.",
      "checkbox primitive docs reference part indicator discoveryAttribute data-sw-checkbox-wrong does not match contract discoveryAttribute data-sw-checkbox-indicator.",
    ]);
    expect(report.optionalGaps).not.toEqual(
      expect.arrayContaining([expect.stringContaining("Primitive reference description gaps")]),
    );
    expect(report.optionalGaps).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining("Primitive docs example gaps: framework examples missing for"),
      ]),
    );
  });

  it("fails primitive reference validation when generated public API facts are dropped", () => {
    const metadata = buildLayeredDocsMetadata();
    const brokenMetadata = {
      ...metadata,
      primitives: metadata.primitives.map((primitive) =>
        primitive.id === "checkbox"
          ? {
              ...primitive,
              docsReference: {
                ...primitive.docsReference,
                apiReference: {
                  ...primitive.docsReference.apiReference,
                  parts: primitive.docsReference.apiReference.parts.map((part) =>
                    part.part === "root"
                      ? {
                          ...part,
                          events: [],
                          setters: [],
                        }
                      : part,
                  ),
                  exportGroups: [],
                  canonicalNames: [],
                },
              },
            }
          : primitive,
      ),
    } satisfies LayeredDocsMetadata;

    const report = validateLayeredDocsMetadata(brokenMetadata);

    expect(report.requiredFailures).toEqual(
      expect.arrayContaining([
        "checkbox primitive docs reference part root omits event checkedChange.",
        "checkbox primitive docs reference part root omits setter setChecked.",
        "checkbox primitive docs reference omits export group for @starwind-ui/runtime/checkbox.",
        "checkbox primitive docs reference omits export group for @starwind-ui/astro/checkbox.",
        "checkbox primitive docs reference omits export group for @starwind-ui/react/checkbox.",
        "checkbox primitive docs reference omits canonical name Checkbox.",
        "checkbox primitive docs reference omits canonical name createCheckbox.",
        "checkbox primitive docs reference omits canonical name Checkbox.Root.",
        "checkbox primitive docs reference omits canonical name Checkbox.Indicator.",
      ]),
    );
  });

  it("rejects primitive docs enrichment that targets unknown contract facts", () => {
    let error: unknown;

    try {
      buildLayeredDocsMetadata({
        primitiveDocsEnrichment: {
          checkbox: {
            frameworkNotes: {
              angular: ["Unknown target."],
            } as unknown as PrimitiveDocsEnrichment["frameworkNotes"],
            parts: {
              rooot: { description: "Typoed root part." },
              root: {
                props: {
                  cheked: "Typoed checked prop.",
                },
                dataAttributes: {
                  "data-cheked": "Typoed checked data attribute.",
                },
              },
            },
          },
          "not-a-primitive": {
            summary: "Unknown primitive.",
          },
        },
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(String(error)).toContain("Unknown primitive docs enrichment id not-a-primitive.");
    expect(String(error)).toContain(
      "checkbox primitive docs enrichment references unknown part rooot.",
    );
    expect(String(error)).toContain(
      "checkbox primitive docs enrichment for part root references unknown prop cheked.",
    );
    expect(String(error)).toContain(
      "checkbox primitive docs enrichment for part root references unknown data attribute data-cheked.",
    );
    expect(String(error)).toContain(
      "checkbox primitive docs enrichment references unknown framework target angular.",
    );
  });

  it("loads authored primitive usage Markdown into primitive reference metadata", async () => {
    const usageRoot = await writePrimitiveUsageFixture(
      "checkbox",
      [
        "## Usage Guidelines",
        "",
        "- **Use authored usage.** The generated primitive references should project authored Markdown into every reference surface.",
        "",
        "## Positioning",
        "",
        "Checkbox is best when one independent boolean value needs a visible control and form submission behavior.",
      ].join("\n"),
    );

    try {
      const metadata = buildLayeredDocsMetadata({
        primitiveDocsUsageRoot: usageRoot,
        primitiveDocsEnrichment: {
          checkbox: {
            summary: "Checkbox test summary.",
          },
        },
      });
      const checkbox = metadata.primitives.find((primitive) => primitive.id === "checkbox");

      expect(checkbox?.docsReference.usageGuidelines).toEqual([
        {
          title: "Use authored usage.",
          description:
            "The generated primitive references should project authored Markdown into every reference surface.",
        },
      ]);
      expect(checkbox?.docsReference.sections).toContainEqual({
        title: "Positioning",
        content:
          "Checkbox is best when one independent boolean value needs a visible control and form submission behavior.",
      });
    } finally {
      await rm(usageRoot, { force: true, recursive: true });
    }
  });

  it("rejects primitive usage Markdown with generator-owned headings or MDX syntax", async () => {
    const invalidSources = [
      {
        source: "## Anatomy\n\nDo not author generated anatomy.",
        message: "checkbox primitive usage.md cannot define generator-owned heading Anatomy.",
      },
      {
        source: "## Examples\n\n### Anatomy\n\nDo not author generated anatomy.",
        message: "checkbox primitive usage.md cannot define generator-owned heading Anatomy.",
      },
      {
        source:
          "import DocsTabs from './DocsTabs.astro'\n\n## Usage Guidelines\n\n- **Use Markdown.** Avoid MDX imports.",
        message: "checkbox primitive usage.md cannot contain MDX imports or exports.",
      },
      {
        source: '## Examples\n\nimport "./setup.css"',
        message: "checkbox primitive usage.md cannot contain MDX imports or exports.",
      },
      {
        source: "## Usage Guidelines\n\n<DocsTabs />",
        message: "checkbox primitive usage.md cannot contain JSX component tags.",
      },
      {
        source: '## Examples\n\n<DocsTabs\n  syncKey="framework"\n/>',
        message: "checkbox primitive usage.md cannot contain JSX component tags.",
      },
      {
        source: '## Usage Guidelines\n\n::callout{type="note"}',
        message: "checkbox primitive usage.md cannot contain unsupported directives.",
      },
      {
        source:
          "## Examples\n\nExample prose.\n\n## Usage Guidelines\n\n- **Too late.** Usage must come first.",
        message:
          "checkbox primitive usage.md heading Usage Guidelines must appear before Examples.",
      },
    ] as const;

    for (const invalidSource of invalidSources) {
      const usageRoot = await writePrimitiveUsageFixture("checkbox", invalidSource.source);

      try {
        expect(() =>
          buildLayeredDocsMetadata({
            primitiveDocsUsageRoot: usageRoot,
          }),
        ).toThrow(invalidSource.message);
      } finally {
        await rm(usageRoot, { force: true, recursive: true });
      }
    }
  });

  it("loads authored primitive example manifests and allows example directives under Examples", async () => {
    const usageRoot = await writePrimitiveUsageFixture(
      "select",
      [
        "## Positioning",
        "",
        "Select positions its popup from the trigger while keeping the listbox relationship readable.",
        "",
        "## Examples",
        "",
        '::example{id="positioned-select"}',
      ].join("\n"),
      {
        "manifest.ts": selectAuthoredExampleManifest({
          astro: "./examples/positioned-select.astro",
          react: "./examples/positioned-select.tsx",
          html: "./examples/positioned-select.html",
        }),
        "examples/positioned-select.astro": selectAstroExample,
        "examples/positioned-select.tsx": selectReactExample,
        "examples/positioned-select.html": selectHtmlExample,
      },
    );

    try {
      const metadata = buildLayeredDocsMetadata({
        primitiveDocsUsageRoot: usageRoot,
      });
      const select = metadata.primitives.find((primitive) => primitive.id === "select");

      expect(select?.docsReference.sections).toContainEqual({
        title: "Positioning",
        content:
          "Select positions its popup from the trigger while keeping the listbox relationship readable.",
      });
      expect(select?.docsReference.sections).toContainEqual({
        title: "Examples",
        content: '::example{id="positioned-select"}',
      });
      expect(select?.docsReference.authoredExamples).toEqual([
        expect.objectContaining({
          id: "positioned-select",
          title: "Positioned Select",
          summary: "Render Select with a positioned popup across supported framework surfaces.",
          frameworks: [
            expect.objectContaining({
              framework: "astro",
              language: "astro",
              source: expect.stringContaining("positioned-select.astro"),
              code: selectAstroExample,
            }),
            expect.objectContaining({
              framework: "react",
              language: "tsx",
              source: expect.stringContaining("positioned-select.tsx"),
              code: selectReactExample,
            }),
            expect.objectContaining({
              framework: "raw-html",
              language: "html",
              source: expect.stringContaining("positioned-select.html"),
              code: selectHtmlExample,
            }),
          ],
        }),
      ]);
    } finally {
      await rm(usageRoot, { force: true, recursive: true });
    }
  });

  it("validates authored primitive example directives and manifest files", async () => {
    const validManifest = selectAuthoredExampleManifest({
      astro: "./examples/positioned-select.astro",
    });
    const invalidDocs = [
      {
        usage: '## Positioning\n\n::example{id="positioned-select"}',
        files: {
          "manifest.ts": validManifest,
          "examples/positioned-select.astro": selectAstroExample,
        },
        message: "select primitive usage.md example directives are only allowed under Examples.",
      },
      {
        usage: '## Examples\n\n::example{id="missing-example"}',
        files: {
          "manifest.ts": validManifest,
          "examples/positioned-select.astro": selectAstroExample,
        },
        message: "select primitive usage.md references unknown authored example missing-example.",
      },
      {
        usage: "## Examples\n\nNo examples referenced yet.",
        files: {
          "manifest.ts": validManifest,
          "examples/positioned-select.astro": selectAstroExample,
        },
        message:
          "select primitive authored example positioned-select is not referenced by usage.md.",
      },
      {
        usage: '## Examples\n\n::example{id="positioned-select"}',
        files: {
          "manifest.ts": validManifest,
        },
        message:
          "select primitive authored example positioned-select.astro references missing file ./examples/positioned-select.astro.",
      },
      {
        usage: '## Examples\n\n::example{id="positioned-select"}',
        files: {
          "manifest.ts": selectAuthoredExampleManifest({
            astro: "../outside.astro",
          }),
          "../outside.astro": selectAstroExample,
        },
        message:
          "select primitive authored example positioned-select.astro must stay inside the primitive docs folder.",
      },
      {
        usage: '## Examples\n\n::example{id="positioned-select"}',
        files: {
          "manifest.ts": selectAuthoredExampleManifest({
            astro: "./examples/positioned-select.astro",
          }).replace("export const primitiveAuthoredExamples", "const primitiveAuthoredExamples"),
          "examples/positioned-select.astro": selectAstroExample,
        },
        message:
          "select primitive authored examples manifest must export primitiveAuthoredExamples.",
      },
    ] as const;

    for (const invalidDoc of invalidDocs) {
      const usageRoot = await writePrimitiveUsageFixture(
        "select",
        invalidDoc.usage,
        invalidDoc.files,
      );

      try {
        expect(() =>
          buildLayeredDocsMetadata({
            primitiveDocsUsageRoot: usageRoot,
          }),
        ).toThrow(invalidDoc.message);
      } finally {
        await rm(usageRoot, { force: true, recursive: true });
      }
    }
  });

  it(
    "keeps authored Select examples compileable, typecheckable, and smokeable",
    async () => {
      const exampleRoot = path.join(
        process.cwd(),
        "scripts/portable-runtime/docs/layered-docs/primitives/select/examples",
      );
      const astroSource = await readFile(path.join(exampleRoot, "positioned-select.astro"), "utf8");
      const reactExamplePath = path.join(exampleRoot, "positioned-select.tsx");
      const htmlSource = await readFile(path.join(exampleRoot, "positioned-select.html"), "utf8");
      const astroCompiler = await loadAstroCompiler();
      const astroCompileResult = astroCompiler.convertToTSX(astroSource, {
        filename: "positioned-select.astro",
      });

      expect(astroCompileResult.code).toContain("@starwind-ui/astro/select");
      expect(astroCompileResult.diagnostics).toEqual([]);
      expect(getReactTypecheckDiagnostics(reactExamplePath)).toEqual([]);
      expect(htmlSource).toContain("data-sw-select");
      expect(htmlSource).toContain('import { createSelect } from "@starwind-ui/runtime/select";');
      expect(htmlSource).toContain("createSelect(root)");
    },
    LAYERED_DOCS_INTEGRATION_TIMEOUT_MS,
  );

  it("documents the authored primitive enrichment workflow and AI guardrails", async () => {
    const workflow = await readFile(
      path.join(process.cwd(), "docs/portable-runtime/primitive-docs-enrichment.md"),
      "utf8",
    );

    expect(workflow).toContain("scripts/portable-runtime/docs/layered-docs/annotations.ts");
    expect(workflow).toContain("scripts/portable-runtime/docs/layered-docs/examples.ts");
    expect(workflow).toContain("scripts/portable-runtime/docs/layered-docs/generated/");
    expect(workflow).toContain("pnpm runtime:docs:metadata");
    expect(workflow).toContain("pnpm runtime:docs:metadata:check");
    expect(workflow).toContain("--docs-root <path>");
    expect(workflow).not.toContain(".local/starwind-docs");
    expect(workflow).toContain("Runtime contracts");
    expect(workflow).toContain("primitive contract");
    expect(workflow).toContain("Base UI-style reference");
    expect(workflow).toContain("Do not edit generated primitive docs pages");
  });

  it("rejects direct primitive classifications that resolve to multiple primitives", () => {
    const fieldAnnotation = styledDocsAnnotations.field;

    expect(() =>
      buildLayeredDocsMetadata({
        styledAnnotations: {
          ...styledDocsAnnotations,
          field: {
            ...fieldAnnotation,
            foundation: { type: "direct-primitive" },
          },
        },
      }),
    ).toThrow("field is marked direct-primitive but references 2 primitives: field, fieldset.");
  });

  it("rejects styled annotations without a behavior foundation classification", () => {
    expect(() =>
      buildLayeredDocsMetadata({
        styledAnnotations: {
          ...styledDocsAnnotations,
          sheet: {
            ...styledDocsAnnotations.sheet,
            foundation: undefined,
          },
        } as unknown as typeof styledDocsAnnotations,
      }),
    ).toThrow("sheet is missing Behavior Foundation classification.");
  });

  it("rejects runtime links missing from the runtime package surface", () => {
    let error: unknown;

    try {
      buildLayeredDocsMetadata({
        runtimeExports: new Set(["."]),
        runtimeIndexSource: "export {};",
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(String(error)).toContain(
      "accordion runtime import @starwind-ui/runtime/accordion is not exported by packages/runtime/package.json.",
    );
    expect(String(error)).toContain(
      "accordion runtime factory createAccordion is not re-exported by packages/runtime/src/index.ts.",
    );
  });

  it("builds runtime reference metadata from the public runtime surface", () => {
    const metadata = buildLayeredDocsMetadata();

    expect(metadata.runtime).toMatchObject({
      packageName: "@starwind-ui/runtime",
      docsPage: { status: "published", path: "/docs/runtime/" },
      initStarwind: {
        exportName: "initStarwind",
        importSource: "@starwind-ui/runtime/init-starwind",
        signature: "initStarwind(root?: ParentNode): StarwindCleanup",
        cleanupMethod: "destroy()",
      },
    });
    expect(metadata.runtime.rawHtml.initializers).toContainEqual(
      expect.objectContaining({
        selector: "[data-sw-drawer]",
        factory: "createDrawer",
        primitiveId: "drawer",
        rootDiscoveryAttribute: "data-sw-drawer",
      }),
    );
    expect(metadata.runtime.rawHtml.attributeConventions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          prefix: "data-sw-*",
          purpose: "Runtime discovery hooks.",
        }),
        expect.objectContaining({
          prefix: "data-*",
          purpose: "Scoped state and option attributes owned by a primitive.",
        }),
      ]),
    );
    expect(metadata.runtime.rawHtml.initializers).toContainEqual(
      expect.objectContaining({
        selector: "[data-sw-sidebar-provider]",
        factory: "createSidebarController",
        primitiveId: "sidebar",
        rootDiscoveryAttribute: "data-sw-sidebar-provider",
      }),
    );
    const themeInitializer = metadata.runtime.rawHtml.initializers.find(
      (initializer) => initializer.selector === "[data-sw-theme-control], [data-sw-theme-toggle]",
    );
    expect(themeInitializer).toMatchObject({
      factory: "initThemeController",
      once: true,
    });
    expect(themeInitializer).not.toHaveProperty("primitiveId");
    expect(
      metadata.runtime.rawHtml.initializers.find(
        (initializer) => initializer.selector === "[data-sw-carousel]",
      )?.notes,
    ).toContain('Skips elements with data-auto-init="false".');
    expect(
      metadata.runtime.rawHtml.initializers.find(
        (initializer) => initializer.selector === "[data-sw-menu]",
      )?.notes,
    ).toContain("Skips menu roots that are also context-menu roots.");
    expect(
      metadata.runtime.rawHtml.initializers.every(
        (initializer) => initializer.factory !== "unknown",
      ),
    ).toBe(true);
    expect(metadata.runtime.factories).toContainEqual(
      expect.objectContaining({
        factory: "createDrawer",
        importSource: "@starwind-ui/runtime/drawer",
        primitiveId: "drawer",
        docsPath: "/docs/runtime/#create-drawer",
      }),
    );
    expect(metadata.runtime.theme.helpers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          exportName: "getThemeInitScript",
          importSource: "@starwind-ui/runtime/theme",
        }),
      ]),
    );
  });

  it("builds public styling metadata from the theme template and styled contracts", () => {
    const metadata = buildLayeredDocsMetadata();

    expect(metadata.styling).toMatchObject({
      docsPage: { status: "published", path: "/docs/styling/" },
      sections: [
        { id: "theme-tokens", title: "Theme Tokens", docsPath: "/docs/styling/#theme-tokens" },
        {
          id: "component-variants",
          title: "Component Variants",
          docsPath: "/docs/styling/#component-variants",
        },
        { id: "state-styling", title: "State Styling", docsPath: "/docs/styling/#state-styling" },
        {
          id: "slots-anatomy",
          title: "Slots And Anatomy",
          docsPath: "/docs/styling/#slots-anatomy",
        },
        {
          id: "framework-style-layers",
          title: "Framework Style Layers",
          docsPath: "/docs/styling/#framework-style-layers",
        },
        {
          id: "customization-recipes",
          title: "Customization Recipes",
          docsPath: "/docs/styling/#customization-recipes",
        },
      ],
    });
    expect(metadata.styling.theme).toMatchObject({
      sourceFile: "packages/cli/src/templates/starwind.css.ts",
      docsPath: "/docs/styling/#theme-tokens",
      darkModeSelector: ".dark",
      tailwindIntegration: {
        imports: ["tailwindcss", "tw-animate-css"],
        plugins: ["@tailwindcss/forms"],
        customVariants: [{ name: "dark", selector: "(&:where(.dark, .dark *))" }],
      },
    });
    expect(metadata.styling.theme.tokens).toEqual(
      expect.arrayContaining([
        { name: "--color-background", value: "var(--background)", scope: "theme-inline" },
        { name: "--background", value: "var(--color-white)", scope: "root" },
        { name: "--background", value: "var(--color-neutral-950)", scope: "dark" },
      ]),
    );
    expect(metadata.styling.theme.tokenNamingConventions).toContain(
      "--color-* tokens bridge Tailwind utilities to Starwind CSS variables.",
    );

    const button = metadata.styling.components.find((component) => component.id === "button");
    expect(button).toMatchObject({
      title: "Button",
      docsPath: "/docs/components/button/",
      primitiveDocsPaths: ["/docs/primitives/button/"],
      frameworkAvailability: {
        astro: { status: "available" },
        react: { status: "available" },
      },
    });
    expect(button?.variantCollections).toContainEqual(
      expect.objectContaining({
        name: "button",
        exportName: "ButtonVariants",
        options: [
          expect.objectContaining({
            name: "variant",
            values: expect.arrayContaining(["default", "primary", "outline"]),
            defaultValue: "default",
          }),
          expect.objectContaining({
            name: "size",
            values: expect.arrayContaining(["sm", "md", "icon"]),
            defaultValue: "md",
          }),
        ],
      }),
    );
    expect(button?.slots).toContain("button");
    expect(button?.stateSelectors).toContainEqual(
      expect.objectContaining({
        attribute: "data-disabled",
        selector: "data-disabled:pointer-events-none",
      }),
    );

    const tooltip = metadata.styling.components.find((component) => component.id === "tooltip");
    expect(tooltip?.stateSelectors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ attribute: "data-state", value: "closed" }),
        expect.objectContaining({ attribute: "data-side", value: "bottom" }),
      ]),
    );

    const toast = metadata.styling.components.find((component) => component.id === "toast");
    expect(toast?.localStyles).toEqual(
      expect.objectContaining({
        importFrom: expect.arrayContaining(["Toaster"]),
        selectorCount: expect.any(Number),
      }),
    );
  });

  it("reports required layered relationship failures separately from planned pages and optional API-depth gaps", () => {
    const metadata = buildLayeredDocsMetadata();
    const sheet = metadata.styledComponents.find((component) => component.id === "sheet");
    const drawer = metadata.primitives.find((primitive) => primitive.id === "drawer");

    if (!sheet || !drawer) {
      throw new Error("Expected sheet styled component and drawer primitive test fixtures.");
    }

    const brokenMetadata = {
      ...metadata,
      runtime: {
        ...metadata.runtime,
        factories: metadata.runtime.factories.filter((factory) => factory.primitiveId !== "drawer"),
      },
      styledComponents: metadata.styledComponents.map((component) =>
        component.id === "sheet"
          ? {
              ...component,
              primitiveIds: ["drawer", "missing-primitive"],
              runtimeFactories: [
                {
                  factory: "createMissingPrimitive",
                  importSource: "@starwind-ui/runtime/missing-primitive",
                  primitiveId: "missing-primitive",
                },
              ],
              aliases: component.aliases.filter(
                (alias) => alias !== "drawer" && alias !== "Drawer",
              ),
            }
          : component,
      ),
      primitives: metadata.primitives.map((primitive) =>
        primitive.id === "drawer"
          ? {
              ...primitive,
              runtime: {
                ...primitive.runtime,
                rootPart: "",
              },
              parts: [],
              props: [],
            }
          : primitive,
      ),
      styling: {
        ...metadata.styling,
        components: metadata.styling.components.map((component) =>
          component.id === "sheet"
            ? {
                ...component,
                docsPath: "/docs/components/not-sheet/",
                primitiveDocsPaths: [],
              }
            : component,
        ),
      },
    } satisfies LayeredDocsMetadata;

    const report = validateLayeredDocsMetadata(brokenMetadata);

    expect(report.requiredFailures).toEqual(
      expect.arrayContaining([
        "sheet links to missing primitive missing-primitive.",
        "sheet runtime factory createMissingPrimitive does not resolve to a runtime reference.",
        "sheet renamed primitive foundation must include primitive alias drawer.",
        "drawer primitive runtime rootPart is missing.",
        "drawer primitive must document at least one part.",
        "drawer primitive docs omit props from the public contract.",
        "drawer primitive runtime factory createDrawer does not resolve to a runtime reference.",
        "styling metadata for sheet is missing styled docs path /docs/components/sheet/.",
        "styling metadata for sheet is missing primitive docs path /docs/primitives/drawer/.",
      ]),
    );
    expect(report.plannedDocsPages).toEqual([]);
    expect(report.missingPublishedPages).toEqual([]);
    expect(report.missingDocsPages).toEqual([]);
    expect(report.optionalGaps).toEqual(
      expect.arrayContaining([
        "Deferred API-depth checks: prop prose, event narratives, setter examples, state prose, variant option prose, and per-framework API differences.",
      ]),
    );
  });

  it("reports missing docs page annotations separately from planned docs pages", () => {
    const metadata = buildLayeredDocsMetadata();
    const brokenMetadata = {
      ...metadata,
      styledComponents: metadata.styledComponents.map((component) =>
        component.id === "image"
          ? {
              ...component,
              docsPage: {
                ...component.docsPage,
                status: "missing" as const,
              },
            }
          : component,
      ),
    } satisfies LayeredDocsMetadata;

    const report = validateLayeredDocsMetadata(brokenMetadata);

    expect(report.requiredFailures).toEqual([]);
    expect(report.missingDocsPages).toEqual(["image (/docs/components/image/)"]);
    expect(report.plannedDocsPages).toEqual([]);
  });

  it("detects stale layered docs metadata artifact source", () => {
    const metadata = buildLayeredDocsMetadata();
    const currentSource = renderCanonicalLayeredDocsMetadata(metadata);
    const staleSource = currentSource.replace("version: 1,", "version: 2,");

    expect(validateLayeredDocsMetadataArtifact(metadata, currentSource).requiredFailures).toEqual(
      [],
    );
    expect(validateLayeredDocsMetadataArtifact(metadata, staleSource).requiredFailures).toEqual([
      "Generated layered docs metadata artifact is stale. Run pnpm runtime:docs:metadata.",
    ]);
  });

  it("checks generated metadata artifacts without exporting docs by default", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-layered-docs-"));

    try {
      const metadata = buildLayeredDocsMetadata();
      const canonicalDirectory = path.join(
        tempRoot,
        "scripts/portable-runtime/docs/layered-docs/generated",
      );
      const canonicalPath = path.join(canonicalDirectory, "layered-docs-metadata.ts");

      await mkdir(canonicalDirectory, { recursive: true });
      await writeFile(canonicalPath, renderCanonicalLayeredDocsMetadata(metadata));

      const passingResult = await checkLayeredDocsMetadata({
        docsRoot: path.join(tempRoot, "missing-docs"),
        outputRoot: tempRoot,
      });

      expect(passingResult.messages).toContain("Docs app not found; export skipped.");
      expect(passingResult.report.requiredFailures).toEqual([]);

      await writeFile(canonicalPath, "export const layeredDocsMetadata = { version: 0 };\n");

      const staleResult = await checkLayeredDocsMetadata({
        docsRoot: path.join(tempRoot, "missing-docs"),
        outputRoot: tempRoot,
      });

      expect(staleResult.report.requiredFailures).toContain(
        "Generated layered docs metadata artifact is stale. Run pnpm runtime:docs:metadata.",
      );

      const strictResult = await checkLayeredDocsMetadata({
        docsRoot: path.join(tempRoot, "missing-docs"),
        outputRoot: tempRoot,
        requireDocs: true,
      });

      expect(strictResult.report.requiredFailures).toContain(
        `Docs app not found; export skipped. Expected docs root at ${path.join(tempRoot, "missing-docs")}.`,
      );
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  it("reports missing published docs pages without failing default metadata checks", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-layered-docs-"));
    const docsRoot = path.join(tempRoot, "starwind-docs");

    try {
      const metadata = buildLayeredDocsMetadata();
      await mkdir(docsRoot, { recursive: true });
      await generateLayeredDocsMetadata({ docsRoot, outputRoot: tempRoot });

      const result = await checkLayeredDocsMetadata({ docsRoot, outputRoot: tempRoot });

      expect(
        result.messages.some((message) => message.startsWith("Missing published docs pages:")),
      ).toBe(true);
      expect(result.report.requiredFailures).toEqual([]);
      expect(result.report.missingPublishedPages.length).toBeGreaterThan(0);
      expect(getLayeredDocsCheckFailures(result.report)).toEqual([]);
      expect(getLayeredDocsCheckFailures(result.report, { requireDocs: true })).toEqual(
        result.report.missingPublishedPages,
      );

      const docsExportPath = path.join(
        docsRoot,
        "src/docs/data/starwind/generated/layered-docs-metadata.ts",
      );
      await writeFile(docsExportPath, "export const layeredDocsMetadata = { version: 0 };\n");

      const staleDocsResult = await checkLayeredDocsMetadata({ docsRoot, outputRoot: tempRoot });

      expect(staleDocsResult.report.requiredFailures).toContain(
        `Generated docs export is stale at ${docsExportPath}. Run pnpm runtime:docs:metadata.`,
      );
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  it(
    "keeps missing published docs pages as a CLI warning unless docs are required",
    async () => {
      const tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-layered-docs-"));
      const docsRoot = path.join(tempRoot, "starwind-docs");
      const tsxCliPath = testRequire.resolve("tsx/cli");
      const baseArguments = [
        tsxCliPath,
        "scripts/portable-runtime/generate-layered-docs-metadata.ts",
        "--check",
        "--docs-root",
        docsRoot,
        "--output-root",
        tempRoot,
      ];

      try {
        await mkdir(docsRoot, { recursive: true });
        await generateLayeredDocsMetadata({ docsRoot, outputRoot: tempRoot });

        const looseResult = await execFileAsync(process.execPath, baseArguments, {
          cwd: process.cwd(),
        });

        expect(looseResult.stdout).toContain("Layered docs metadata check passed");
        expect(looseResult.stderr).toContain("Missing published docs pages:");

        await expect(
          execFileAsync(process.execPath, [...baseArguments, "--require-docs"], {
            cwd: process.cwd(),
          }),
        ).rejects.toMatchObject({
          code: 1,
          stderr: expect.stringContaining("Missing published docs pages:"),
        });
      } finally {
        await rm(tempRoot, { force: true, recursive: true });
      }
    },
    LAYERED_DOCS_INTEGRATION_TIMEOUT_MS,
  );

  it("writes the canonical artifact and skips docs export when the docs app is absent", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-layered-docs-"));

    try {
      const result = await generateLayeredDocsMetadata({
        docsRoot: path.join(tempRoot, "missing-docs"),
        outputRoot: tempRoot,
      });

      const canonicalPath = path.join(
        tempRoot,
        "scripts/portable-runtime/docs/layered-docs/generated/layered-docs-metadata.ts",
      );
      const canonicalSource = await readFile(canonicalPath, "utf8");

      expect(result.docsExport.status).toBe("skipped");
      expect(result.messages).toContain("Docs app not found; export skipped.");
      expect(canonicalSource).toContain("export const layeredDocsMetadata");
      expect(canonicalSource).toContain("satisfies LayeredDocsMetadata");
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  it("fails require-docs mode when the docs working copy is absent", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-layered-docs-"));

    try {
      await expect(
        generateLayeredDocsMetadata({
          docsRoot: path.join(tempRoot, "missing-docs"),
          outputRoot: tempRoot,
          requireDocs: true,
        }),
      ).rejects.toThrow("Docs app not found; export skipped. Expected docs root");
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  it("defaults authored example framework tabs to the first available framework", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-layered-docs-"));
    const docsRoot = path.join(tempRoot, "starwind-docs");
    const usageRoot = await writePrimitiveUsageFixture(
      "select",
      ["## Examples", "", '::example{id="positioned-select"}'].join("\n"),
      {
        "manifest.ts": selectAuthoredExampleManifest({
          react: "./examples/positioned-select.tsx",
          html: "./examples/positioned-select.html",
        }),
        "examples/positioned-select.tsx": selectReactExample,
        "examples/positioned-select.html": selectHtmlExample,
      },
    );

    try {
      await mkdir(docsRoot, { recursive: true });
      await generateLayeredDocsMetadata({
        docsRoot,
        outputRoot: tempRoot,
        primitiveDocsUsageRoot: usageRoot,
      });

      const selectPrimitiveSource = await readFile(
        path.join(docsRoot, "src/docs/data/docs/en/primitives/select.mdx"),
        "utf8",
      );
      const selectAuthoredExampleSlice = selectPrimitiveSource.slice(
        selectPrimitiveSource.indexOf("### Positioned Select"),
        selectPrimitiveSource.indexOf("## API Reference"),
      );

      expectSubstringsInOrder(selectAuthoredExampleSlice, [
        '<DocsTabs syncKey="framework" defaultValue="react">',
        '<DocsTabsTrigger value="react">React</DocsTabsTrigger>',
        '<DocsTabsTrigger value="raw-html">HTML</DocsTabsTrigger>',
        '<DocsTabsContent value="react" defaultVisible={true}>',
        '<DocsTabsContent value="raw-html">',
      ]);
      expect(selectAuthoredExampleSlice).not.toContain(
        '<DocsTabsTrigger value="astro">Astro</DocsTabsTrigger>',
      );
      expect(selectAuthoredExampleSlice).not.toContain(
        '<DocsTabs syncKey="framework" defaultValue="astro">',
      );
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
      await rm(usageRoot, { force: true, recursive: true });
    }
  });

  it("exports to a docs working copy and verifies published docs pages", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-layered-docs-"));
    const docsRoot = path.join(tempRoot, "starwind-docs");
    const componentPagesRoot = path.join(docsRoot, "src/docs/data/docs/en/components");
    const primitivePagesRoot = path.join(docsRoot, "src/docs/data/docs/en/primitives");
    const runtimePagesRoot = path.join(docsRoot, "src/docs/data/docs/en/runtime");
    const stylingPagesRoot = path.join(docsRoot, "src/docs/data/docs/en/styling");
    const generatedMdxMarker =
      "Generated by scripts/portable-runtime/generate-layered-docs-metadata.ts.";

    try {
      const metadata = buildLayeredDocsMetadata();
      await mkdir(componentPagesRoot, { recursive: true });
      await mkdir(primitivePagesRoot, { recursive: true });
      await mkdir(runtimePagesRoot, { recursive: true });
      await mkdir(stylingPagesRoot, { recursive: true });
      await writeFile(
        path.join(primitivePagesRoot, "old-primitive.mdx"),
        "---\ntitle: Old Primitive\n---\n",
      );
      await writeFile(
        path.join(runtimePagesRoot, "old-generated-runtime.mdx"),
        `---\ntitle: Old\n---\n\n<!-- ${generatedMdxMarker} -->\n`,
      );
      await writeFile(
        path.join(runtimePagesRoot, "hand-written.mdx"),
        "---\ntitle: Hand Written\n---\n",
      );
      await writeFile(
        path.join(stylingPagesRoot, "index.mdx"),
        `---\ntitle: Generated Styling\n---\n\n{/* ${generatedMdxMarker} Do not edit directly. */}\n`,
      );
      await writeFile(
        path.join(stylingPagesRoot, "old-generated-styling.mdx"),
        `---\ntitle: Old Styling\n---\n\n<!-- ${generatedMdxMarker} -->\n`,
      );
      await writeFile(
        path.join(stylingPagesRoot, "hand-written.mdx"),
        "---\ntitle: Hand Written Styling\n---\n",
      );

      for (const component of metadata.styledComponents) {
        if (component.docsPage.status !== "published") {
          continue;
        }

        const slug = /^\/docs\/components\/([^/]+)\/$/.exec(component.docsPage.path)?.[1];
        if (!slug) {
          continue;
        }

        await writeFile(path.join(componentPagesRoot, `${slug}.mdx`), "---\ntitle: Stub\n---\n");
      }

      const result = await generateLayeredDocsMetadata({
        docsRoot,
        outputRoot: tempRoot,
        requireDocs: true,
      });

      const docsExportPath = path.join(
        docsRoot,
        "src/docs/data/starwind/generated/layered-docs-metadata.ts",
      );
      const docsExportSource = await readFile(docsExportPath, "utf8");
      const docsTypesSource = await readFile(
        path.join(path.dirname(docsExportPath), "layered-docs-types.ts"),
        "utf8",
      );
      const primitiveIndexSource = await readFile(
        path.join(docsRoot, "src/docs/data/docs/en/primitives/index.mdx"),
        "utf8",
      );
      const drawerPrimitiveSource = await readFile(
        path.join(docsRoot, "src/docs/data/docs/en/primitives/drawer.mdx"),
        "utf8",
      );
      const accordionPrimitiveSource = await readFile(
        path.join(docsRoot, "src/docs/data/docs/en/primitives/accordion.mdx"),
        "utf8",
      );
      const checkboxPrimitiveSource = await readFile(
        path.join(docsRoot, "src/docs/data/docs/en/primitives/checkbox.mdx"),
        "utf8",
      );
      const colorPickerPrimitiveSource = await readFile(
        path.join(docsRoot, "src/docs/data/docs/en/primitives/color-picker.mdx"),
        "utf8",
      );
      const comboboxPrimitiveSource = await readFile(
        path.join(docsRoot, "src/docs/data/docs/en/primitives/combobox.mdx"),
        "utf8",
      );
      const formPrimitiveSource = await readFile(
        path.join(docsRoot, "src/docs/data/docs/en/primitives/form.mdx"),
        "utf8",
      );
      const menuPrimitiveSource = await readFile(
        path.join(docsRoot, "src/docs/data/docs/en/primitives/menu.mdx"),
        "utf8",
      );
      const navigationMenuPrimitiveSource = await readFile(
        path.join(docsRoot, "src/docs/data/docs/en/primitives/navigation-menu.mdx"),
        "utf8",
      );
      const selectPrimitiveSource = await readFile(
        path.join(docsRoot, "src/docs/data/docs/en/primitives/select.mdx"),
        "utf8",
      );
      const runtimeIndexSource = await readFile(
        path.join(docsRoot, "src/docs/data/docs/en/runtime/index.mdx"),
        "utf8",
      );

      expect(result.docsExport).toEqual({ status: "written", path: docsExportPath });
      expect(result.messages).toEqual([]);
      expect(docsExportSource).toContain("export const layeredDocsMetadata");
      expect(docsExportSource).toContain(
        'import type { LayeredDocsMetadata } from "./layered-docs-types.js";',
      );
      expect(docsExportSource).toContain('"framework-native"');
      expect(docsTypesSource).toContain("export type LayeredDocsMetadata");
      expect(primitiveIndexSource).toContain("title: Runtime Primitives");
      expect(primitiveIndexSource).toContain("<PrimitiveInventory />");
      expectSubstringsInOrder(primitiveIndexSource, [
        "Starwind currently exposes 36 Runtime-backed primitives for Astro and React.",
        "<PrimitiveInventory />",
        "## Installation",
        "npm install @starwind-ui/astro",
        "npm install @starwind-ui/react",
        "[Getting Started Primitives guide](/docs/getting-started/primitives/)",
        "## Import Pattern",
        'import { Accordion } from "@starwind-ui/astro/accordion";',
        'import { Accordion } from "@starwind-ui/react/accordion";',
        "`primitiveDirs.<framework>` destination instead.",
        "## Styling and Composition",
        "[styled component](/docs/components/)",
        "[Runtime reference](/docs/runtime/)",
      ]);
      for (const primitive of metadata.primitives) {
        const primitiveSource = await readFile(
          path.join(primitivePagesRoot, `${primitive.id}.mdx`),
          "utf8",
        );

        expect(primitiveSource).toContain(`title: ${primitive.displayName} Primitive`);
        expect(primitiveSource).not.toContain("## Demo");
        expect(primitiveSource).toContain("## Anatomy");
        expect(primitiveSource).toContain('<DocsTabs syncKey="framework" defaultValue="astro">');
        expect(primitiveSource).toContain('<DocsTabsTrigger value="astro">Astro</DocsTabsTrigger>');
        expect(primitiveSource).toContain('<DocsTabsTrigger value="react">React</DocsTabsTrigger>');
        expect(primitiveSource).toContain(
          '<DocsTabsTrigger value="raw-html">HTML</DocsTabsTrigger>',
        );
        expectSubstringsInOrder(primitiveSource, [
          '<DocsTabsTrigger value="astro">Astro</DocsTabsTrigger>',
          '<DocsTabsTrigger value="react">React</DocsTabsTrigger>',
          '<DocsTabsTrigger value="raw-html">HTML</DocsTabsTrigger>',
        ]);
        expect(primitiveSource).not.toContain("### Raw HTML");
        expect(primitiveSource).not.toContain("### Astro");
        expect(primitiveSource).not.toContain("### React");
        expect(primitiveSource).not.toContain("### HTML");
        expect(primitiveSource).toContain("## API Reference");
        expect(primitiveSource).toContain("## Runtime API");
        expect(primitiveSource).toContain(
          `<PrimitiveRuntimeApiReference docId="primitives/${primitive.id}" />`,
        );
        expect(primitiveSource).not.toContain("## Runtime Factory");
        expect(primitiveSource).not.toContain("Examples for this primitive are planned.");
        expect(primitiveSource).not.toContain("## Adapter Usage");
        expect(primitiveSource).not.toContain("<PrimitiveOverview");
        expect(primitiveSource).not.toContain("<PrimitiveProps");
        expect(primitiveSource).not.toContain("| Factory |");
        expect(primitiveSource).not.toContain("## Exports");
        expect(primitiveSource).not.toContain("## Canonical Names");

        for (const part of primitive.docsReference.apiReference.parts) {
          expect(primitiveSource).toContain(`### ${toTestDisplayTitle(part.part)}`);
          expect(primitiveSource).toContain(
            `<PrimitivePartReference docId="primitives/${primitive.id}" part="${part.part}" />`,
          );
          expect(
            getMarkdownHeadingSection(primitiveSource, `### ${toTestDisplayTitle(part.part)}`),
          ).not.toMatch(/#### (Refs|Context|asChild|Initial Markup|Runtime Setters|Form|Presence)/);
        }
      }
      expect(drawerPrimitiveSource).toContain("title: Drawer Primitive");
      expect(drawerPrimitiveSource).toContain(
        'import { createDrawer } from "@starwind-ui/runtime/drawer";',
      );
      expect(drawerPrimitiveSource).toContain(
        'import { Drawer } from "@starwind-ui/astro/drawer";',
      );
      expect(drawerPrimitiveSource).toContain(
        'import { Drawer } from "@starwind-ui/react/drawer";',
      );
      expect(drawerPrimitiveSource).not.toContain("## Demo");
      expect(drawerPrimitiveSource).toContain("## Anatomy");
      expect(drawerPrimitiveSource).toContain("<Drawer.Root");
      expect(drawerPrimitiveSource).toContain("## API Reference");
      expect(drawerPrimitiveSource).toContain("### Root");
      expect(drawerPrimitiveSource).toContain("### Popup");
      expect(drawerPrimitiveSource).toContain("data-sw-drawer-popup");
      expect(drawerPrimitiveSource).toContain("## Runtime API");
      expect(drawerPrimitiveSource).toContain(
        '<PrimitiveRuntimeApiReference docId="primitives/drawer" />',
      );
      expect(drawerPrimitiveSource).not.toContain("## Runtime Factory");
      expect(drawerPrimitiveSource).toContain("## Related Styled Components");
      expect(drawerPrimitiveSource).toContain(
        '<PrimitiveRelatedStyledComponents docId="primitives/drawer" />',
      );
      expect(drawerPrimitiveSource).not.toContain("## Overview");
      expect(drawerPrimitiveSource).not.toContain("## Adapter Usage");
      expect(drawerPrimitiveSource).not.toContain("<PrimitiveRuntimeFactory");
      expect(drawerPrimitiveSource).not.toContain("<PrimitiveReference ");
      expect(drawerPrimitiveSource).not.toContain("PrimitiveFormParticipation");
      expect(drawerPrimitiveSource).not.toContain("## Form Participation");
      expect(menuPrimitiveSource).toContain("## Menu Behavior");
      expect(menuPrimitiveSource).toContain("Menu uses a trigger, popup, and item parts");
      expect(menuPrimitiveSource).toContain("## Floating Behavior");
      expect(menuPrimitiveSource).toContain("## API Reference");
      expect(menuPrimitiveSource).toContain("### Positioner");
      expect(menuPrimitiveSource).not.toContain("#### Context");
      expect(menuPrimitiveSource).not.toContain("#### asChild");
      expect(menuPrimitiveSource).not.toContain("#### Initial Markup");
      expect(menuPrimitiveSource).toContain("## Runtime API");
      expect(menuPrimitiveSource).not.toContain("## Runtime Factory");
      expect(menuPrimitiveSource).not.toContain("<PrimitiveFloatingBehavior");
      expect(navigationMenuPrimitiveSource).toContain("## Shared Viewport");
      expect(navigationMenuPrimitiveSource).not.toContain("## Deferred Base UI Parity");
      expect(navigationMenuPrimitiveSource).not.toContain("nested Navigation Menu roots");
      expect(navigationMenuPrimitiveSource).not.toContain("provider-level delay grouping");
      expect(navigationMenuPrimitiveSource).not.toContain("open-change-complete callbacks");
      expectSubstringsInOrder(menuPrimitiveSource, [
        "## Anatomy",
        "<DocsTabs",
        "## Menu Behavior",
        "## Floating Behavior",
        "## API Reference",
        "## Runtime API",
        "## Related Styled Components",
      ]);
      expectSubstringsInOrder(selectPrimitiveSource, [
        "## Anatomy",
        "## Positioning",
        "Select positions its popup from the trigger.",
        "## Examples",
        "### Positioned Select",
        "Render Select with a positioned popup across Astro, React, and HTML surfaces.",
        "## API Reference",
      ]);
      const selectAuthoredExampleSlice = selectPrimitiveSource.slice(
        selectPrimitiveSource.indexOf("### Positioned Select"),
        selectPrimitiveSource.indexOf("## API Reference"),
      );
      expectSubstringsInOrder(selectAuthoredExampleSlice, [
        '<DocsTabs syncKey="framework" defaultValue="astro">',
        '<DocsTabsTrigger value="astro">Astro</DocsTabsTrigger>',
        '<DocsTabsTrigger value="react">React</DocsTabsTrigger>',
        '<DocsTabsTrigger value="raw-html">HTML</DocsTabsTrigger>',
        "```astro",
        'import { Select } from "@starwind-ui/astro/select";',
        "```tsx",
        'import { Select } from "@starwind-ui/react/select";',
        "```html",
        'import { createSelect } from "@starwind-ui/runtime/select";',
      ]);
      expect(selectPrimitiveSource).not.toContain('::example{id="positioned-select"}');
      expect(checkboxPrimitiveSource).not.toContain("## Demo");
      const colorPicker = metadata.primitives.find((primitive) => primitive.id === "color-picker");
      expect(colorPicker?.cssVariables).toContainEqual({
        name: "--sw-color-picker-color",
        description: "Canonical accepted color serialized for CSS painting.",
        parts: ["root"],
        source: "runtime",
      });
      expect(colorPicker?.cssVariables).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "--sw-color-picker-area-thumb-color",
            parts: ["areaThumb"],
            source: "runtime",
          }),
          expect.objectContaining({
            name: "--sw-color-picker-channel-thumb-color",
            parts: ["channelSliderThumb"],
            source: "runtime",
          }),
        ]),
      );
      expect(colorPicker?.docsReference.apiReference.relatedStyledComponents).toContainEqual(
        expect.objectContaining({
          id: "color-picker",
          docsPath: "/docs/components/color-picker/",
        }),
      );
      expectSubstringsInOrder(colorPickerPrimitiveSource, [
        "## Usage Guidelines",
        "## Anatomy",
        'import { ColorPicker } from "@starwind-ui/astro/color-picker";',
        'import { ColorPicker } from "@starwind-ui/react/color-picker";',
        'import { createColorPicker } from "@starwind-ui/runtime/color-picker";',
        "## Format Controls",
        "### Composite Format Control",
        'import { Select } from "@starwind-ui/astro/select";',
        'import { Select } from "@starwind-ui/react/select";',
        'import { createSelect } from "@starwind-ui/runtime/select";',
        "### Native Format Select",
        "## State, Events, and Commands",
        "`starwind:value-change`",
        "`starwind:set-value`",
        "## Forms and Reset",
        "HiddenInput is the sole submitted color field.",
        "## Styling Color Thumbs",
        "`--sw-color-picker-area-thumb-color`",
        "`--sw-color-picker-channel-thumb-color`",
        "## Accessibility",
        "## API Reference",
        "### Format Select",
        "### Format Control",
        "### Hidden Input",
        "## Runtime API",
        "## Form Participation",
        "## CSS Variables",
        "`--sw-color-picker-color`",
        "`--sw-color-picker-transparency-grid-size`",
        "## Related Styled Components",
      ]);
      const colorPickerCssVariablesSlice = colorPickerPrimitiveSource.slice(
        colorPickerPrimitiveSource.indexOf("## CSS Variables"),
        colorPickerPrimitiveSource.indexOf("## Related Styled Components"),
      );
      expect(colorPickerCssVariablesSlice).toContain("`--sw-color-picker-area-thumb-color`");
      expect(colorPickerCssVariablesSlice).toContain("`--sw-color-picker-channel-thumb-color`");
      expect(colorPickerPrimitiveSource).toContain(
        '<PrimitiveRelatedStyledComponents docId="primitives/color-picker" />',
      );
      expect(colorPickerPrimitiveSource).toContain("data-sw-color-picker-area-input");
      expect(colorPickerPrimitiveSource).toContain("data-sw-color-picker-format-control");
      expect(colorPickerPrimitiveSource).toContain("data-sw-color-picker-format-select");
      expect(colorPickerPrimitiveSource).toContain("data-sw-color-picker-hidden-input");
      expect(colorPickerPrimitiveSource).toContain('data-value="#3b82f6"');
      expect(colorPickerPrimitiveSource).toContain('<option value="hex">HEX</option>');
      expect(colorPickerPrimitiveSource).toContain('<option value="rgb">RGB</option>');
      expect(colorPickerPrimitiveSource).toContain('<option value="hsl">HSL</option>');
      expect(colorPickerPrimitiveSource).toContain('<option value="hsb">HSB</option>');
      expect(colorPickerPrimitiveSource).not.toContain('::example{id="composite-format-control"}');
      expect(colorPickerPrimitiveSource).not.toContain('::example{id="native-format-select"}');
      expect(colorPickerPrimitiveSource).not.toContain("data-swatch-value");
      expectSubstringsInOrder(checkboxPrimitiveSource, [
        "## Usage Guidelines",
        "- **Use Checkbox for one independent boolean value.**",
        "- **Use the hidden input parts for form submission.**",
        "## Anatomy",
        '<DocsTabs syncKey="framework" defaultValue="astro">',
        '<DocsTabsTrigger value="astro">Astro</DocsTabsTrigger>',
        '<DocsTabsTrigger value="react">React</DocsTabsTrigger>',
        '<DocsTabsTrigger value="raw-html">HTML</DocsTabsTrigger>',
        '<DocsTabsContent value="astro" defaultVisible={true}>',
        "Use the Astro primitive adapter to render Checkbox anatomy with the Runtime wiring included.",
        "```astro",
        '<DocsTabsContent value="react">',
        "Use the React primitive adapter when Checkbox state participates in React rendering.",
        "```tsx",
        '<DocsTabsContent value="raw-html">',
        "Render the Checkbox data-sw-* contract yourself, then initialize createCheckbox.",
        "```html",
        "</DocsTabs>",
        "## API Reference",
      ]);
      expect(checkboxPrimitiveSource).not.toContain("### Raw HTML");
      expect(checkboxPrimitiveSource).toContain("```html");
      expect(checkboxPrimitiveSource).toContain("```astro");
      expect(checkboxPrimitiveSource).toContain("```tsx");
      expect(checkboxPrimitiveSource).toContain("## Anatomy");
      expect(checkboxPrimitiveSource).toContain("<Checkbox.Root");
      expect(checkboxPrimitiveSource).toContain("## API Reference");
      expect(checkboxPrimitiveSource).toContain("### Root");
      expect(checkboxPrimitiveSource).toContain("### Indicator");
      expect(checkboxPrimitiveSource).toContain("### Input");
      expect(checkboxPrimitiveSource).toContain(
        '<PrimitivePartReference docId="primitives/checkbox" part="root" />',
      );
      expect(checkboxPrimitiveSource).toContain(
        '<PrimitivePartReference docId="primitives/checkbox" part="indicator" />',
      );
      expect(checkboxPrimitiveSource).toContain(
        '<PrimitivePartReference docId="primitives/checkbox" part="input" />',
      );
      expect(checkboxPrimitiveSource).toContain("createCheckbox");
      expect(checkboxPrimitiveSource).toContain("## Form Participation");
      expect(checkboxPrimitiveSource).toContain("## Runtime API");
      expect(checkboxPrimitiveSource).toContain(
        '<PrimitiveRuntimeApiReference docId="primitives/checkbox" />',
      );
      expect(checkboxPrimitiveSource).not.toContain("## Runtime Factory");
      expect(checkboxPrimitiveSource).toContain("createCheckbox");
      expect(checkboxPrimitiveSource).toContain("## Related Styled Components");
      expect(checkboxPrimitiveSource).toContain(
        '<PrimitiveRelatedStyledComponents docId="primitives/checkbox" />',
      );
      expect(checkboxPrimitiveSource).not.toContain("## Exports");
      expect(checkboxPrimitiveSource).not.toContain("## Canonical Names");
      expect(checkboxPrimitiveSource).not.toContain("<PrimitiveProps ");
      expect(checkboxPrimitiveSource).not.toContain("<PrimitiveReference ");
      expect(checkboxPrimitiveSource).not.toContain(
        "| Prop | Type | Default | Kind | Description |",
      );
      expect(checkboxPrimitiveSource).not.toContain("Runtime Getter");
      expect(checkboxPrimitiveSource).not.toContain("Suppresses Emit");
      expect(getMarkdownHeadingSection(checkboxPrimitiveSource, "### Root")).not.toContain(
        "Keep mounted prop | keepMounted",
      );
      expect(getMarkdownHeadingSection(checkboxPrimitiveSource, "### Root")).toContain(
        '<PrimitivePartReference docId="primitives/checkbox" part="root" />',
      );
      expect(getMarkdownHeadingSection(checkboxPrimitiveSource, "### Indicator")).not.toContain(
        "Keep mounted prop | keepMounted",
      );
      expect(getMarkdownHeadingSection(checkboxPrimitiveSource, "### Indicator")).toContain(
        '<PrimitivePartReference docId="primitives/checkbox" part="indicator" />',
      );
      expect(getMarkdownHeadingSection(checkboxPrimitiveSource, "### Input")).not.toContain(
        "Keep mounted prop | keepMounted",
      );
      expect(getMarkdownHeadingSection(accordionPrimitiveSource, "### Root")).not.toContain(
        "| valueChange | onValueChange | starwind:value-change | value: `AccordionValue` | AccordionValueChangeDetails | - | - |",
      );
      expect(getMarkdownHeadingSection(comboboxPrimitiveSource, "### Root")).not.toContain(
        "| inputValueChange | onInputValueChange | starwind:input-value-change | inputValue: `string` | ComboboxInputValueChangeDetails | - | Yes |",
      );
      expect(getMarkdownHeadingSection(comboboxPrimitiveSource, "### Root")).not.toContain(
        "| openChange | onOpenChange | starwind:open-change | open: `boolean` | ComboboxOpenChangeDetails | - | Yes |",
      );
      expect(getMarkdownHeadingSection(comboboxPrimitiveSource, "### Root")).not.toContain(
        "| valueChange | onValueChange | starwind:value-change | value: `string \\| null` | ComboboxValueChangeDetails | - | Yes |",
      );
      expect(formPrimitiveSource).toContain("<Form.ErrorSummary");
      expect(formPrimitiveSource).toContain("Form.ErrorSummary");
      expect(formPrimitiveSource).not.toContain("Error-summary");
      expect(runtimeIndexSource).toContain("title: Runtime And Raw HTML");
      expect(runtimeIndexSource).toContain(generatedMdxMarker);
      expect(runtimeIndexSource).toContain("## Init Starwind");
      expect(runtimeIndexSource).toContain("## Raw HTML");
      expect(runtimeIndexSource).toContain("## Data Attributes");
      expect(runtimeIndexSource).toContain("## Runtime Factories");
      expect(runtimeIndexSource).toContain("## Lifecycle And Cleanup");
      expect(runtimeIndexSource).toContain("## Events And State");
      expect(runtimeIndexSource).toContain("## Theme");
      expect(runtimeIndexSource).toContain("<RuntimeFactoriesTable />");
      expect(runtimeIndexSource).not.toContain("RuntimeReference");
      expect(getRuntimeSectionImports(runtimeIndexSource)).toEqual(
        getRuntimeSectionInvocations(runtimeIndexSource),
      );
      await expect(
        readFile(path.join(primitivePagesRoot, "old-primitive.mdx"), "utf8"),
      ).rejects.toMatchObject({
        code: "ENOENT",
      });
      await expect(
        readFile(path.join(runtimePagesRoot, "old-generated-runtime.mdx"), "utf8"),
      ).rejects.toMatchObject({
        code: "ENOENT",
      });
      await expect(
        readFile(path.join(runtimePagesRoot, "hand-written.mdx"), "utf8"),
      ).resolves.toContain("Hand Written");
      await expect(
        readFile(path.join(stylingPagesRoot, "index.mdx"), "utf8"),
      ).rejects.toMatchObject({
        code: "ENOENT",
      });
      await expect(
        readFile(path.join(stylingPagesRoot, "old-generated-styling.mdx"), "utf8"),
      ).rejects.toMatchObject({
        code: "ENOENT",
      });
      await expect(
        readFile(path.join(stylingPagesRoot, "hand-written.mdx"), "utf8"),
      ).resolves.toContain("Hand Written Styling");
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });

  it("fails require-docs mode when a published docs page is missing", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-layered-docs-"));
    const docsRoot = path.join(tempRoot, "starwind-docs");

    try {
      await mkdir(docsRoot, { recursive: true });

      await expect(
        generateLayeredDocsMetadata({
          docsRoot,
          outputRoot: tempRoot,
          requireDocs: true,
        }),
      ).rejects.toThrow("Missing published docs pages:");
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  });
});

async function readFilesRecursively(
  directory: string,
  root: string = directory,
): Promise<Array<{ relativePath: string; source: string }>> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return readFilesRecursively(entryPath, root);
      }

      return [
        {
          relativePath: path.relative(root, entryPath).split(path.sep).join("/"),
          source: await readFile(entryPath, "utf8"),
        },
      ];
    }),
  );

  return files.flat().sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}
