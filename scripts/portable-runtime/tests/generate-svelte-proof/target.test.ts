import { readFile, readdir } from "node:fs/promises";

import path from "node:path";
import { valid as validSemver } from "semver";

import { describe, expect, expectTypeOf, it } from "vitest";

import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import { getPrimitivePackageExportNames } from "../../renderers/primitive-inventory.js";
import { supportsSvelteScope } from "../../renderers/framework-adapters/svelte/styled/scope.js";

import {
  getPrimitiveFrameworkAdapterTarget,
  getPrimitiveFrameworkAdapterTargetNames,
  resolvePrimitiveFrameworkAdapterTargetComponents,
} from "../../renderers/framework-adapters/target-registry.js";
import {
  SVELTE_PRIMITIVE_COMPONENTS,
  svelteAdapterPublicContract,
  svelteFrameworkAdapterReadiness,
  svelteFrameworkAdapterTarget,
  sveltePackageExports,
} from "../../renderers/framework-adapters/svelte/index.js";

import {
  svelteInventory,
  SVELTE_MANUAL_FACADES,
  SVELTE_PACKAGE_COMPONENTS,
  SVELTE_STYLED_ROOTS,
  getImplementedSvelteStyledRoots,
  validateSvelteInventory,
  type SvelteInventory,
} from "../../renderers/framework-adapters/svelte/inventory.js";

function expectSliderRuntimeOwnership(implementation: string): void {
  const withoutResetObserver = implementation.replace(
    /^[\t ]*resetForm\?\.addEventListener\("reset", handleFormReset\);[\t ]*$/gm,
    "",
  );
  expect(withoutResetObserver).not.toMatch(
    /addEventListener|getBoundingClientRect|PointerEvent|KeyboardEvent|FormData|requestAnimationFrame|setPointerCapture|clientX|clientY/,
  );
}

describe("Svelte public beta target", () => {
  it("registers the current inventory as public beta", () => {
    expect(getPrimitiveFrameworkAdapterTargetNames()).toContain("svelte");
    expect(getPrimitiveFrameworkAdapterTarget("svelte")).toBe(svelteFrameworkAdapterTarget);
    expect(resolvePrimitiveFrameworkAdapterTargetComponents("svelte")).toEqual([
      ...[...SVELTE_PRIMITIVE_COMPONENTS].sort(),
      "theme",
    ]);
    expect(svelteFrameworkAdapterTarget.styled).toEqual({
      project: expect.any(Function),
      write: expect.any(Function),
    });
    expect(svelteFrameworkAdapterTarget.packageName).toBe("@starwind-ui/svelte");
    expect(svelteFrameworkAdapterTarget.publicSupport).toEqual({
      cliRegistry: true,
      demoIntegration: true,
      packageExports: true,
      publicDocsClaim: true,
      status: "public-beta",
    });
    expect(svelteFrameworkAdapterReadiness.publicSupport).toBe(
      svelteAdapterPublicContract.publicSupport,
    );
    expect(svelteFrameworkAdapterReadiness.portalStrategy).toBe("svelte-attachment");
    expect(svelteAdapterPublicContract.framework.minimumVersion).toBe("5.29.0");
  });

  it("validates inventory identities, manual ownership, and implemented test owners", async () => {
    validateSvelteInventory(undefined, {
      manualFacades: Object.keys(svelteFrameworkAdapterTarget.primitive.manualPrimitives ?? {}),
    });
    expect(SVELTE_MANUAL_FACADES).toEqual(["theme"]);
    expect(SVELTE_PRIMITIVE_COMPONENTS).toHaveLength(36);
    expect(svelteInventory.primitives.filter((entry) => entry.kind === "primitive")).toHaveLength(
      36,
    );
    expect(
      svelteInventory.primitives.filter((entry) => entry.kind === "manual-facade"),
    ).toHaveLength(1);
    expect(getImplementedSvelteStyledRoots()).toHaveLength(54);
    expect(getImplementedSvelteStyledRoots()).toEqual(SVELTE_STYLED_ROOTS);
    expect(SVELTE_PACKAGE_COMPONENTS).toEqual([...SVELTE_PRIMITIVE_COMPONENTS, "theme"]);
    expect([...SVELTE_PACKAGE_COMPONENTS].sort()).toEqual(getPrimitivePackageExportNames().sort());
    expect(SVELTE_STYLED_ROOTS).toEqual(svelteInventory.styled.map((entry) => entry.component));
    expect([...SVELTE_STYLED_ROOTS].sort()).toEqual(
      starwindStyledContracts
        .filter((contract) => supportsSvelteScope(contract.frameworks))
        .map((contract) => contract.component)
        .sort(),
    );
    expect(getImplementedSvelteStyledRoots()).toEqual(
      svelteInventory.styled
        .filter((entry) => entry.status === "implemented")
        .map((entry) => entry.component),
    );
    for (const entry of svelteInventory.primitives) {
      expect(await readFile(entry.testOwner, "utf8"), entry.component).toContain("it(");
    }
    expect(() => validateSvelteInventory(undefined, { requireStyledClosure: true })).not.toThrow();
  });

  it.each([
    [
      "duplicate identity",
      (inventory: SvelteInventory) => {
        inventory.primitives = [
          ...inventory.primitives,
          inventory.primitives.find((entry) => entry.component === "button")!,
        ];
      },
      /primitives.*duplicate identity "button"/,
    ],
    [
      "unknown Primitive",
      (inventory: SvelteInventory) => {
        inventory.primitives = [{ component: "unknown", kind: "primitive", testOwner: "test.ts" }];
      },
      /Primitive.*unknown identity "unknown"/,
    ],
    [
      "unknown Styled",
      (inventory: SvelteInventory) => {
        inventory.styled = [{ component: "unknown", status: "planned" }];
      },
      /Styled.*unknown identity "unknown"/,
    ],
    [
      "duplicate Styled",
      (inventory: SvelteInventory) => {
        inventory.styled = [
          ...inventory.styled,
          inventory.styled.find((entry) => entry.component === "button")!,
        ];
      },
      /styled.*duplicate identity "button"/,
    ],
    [
      "missing test owner",
      (inventory: SvelteInventory) => {
        inventory.primitives = [{ component: "button", kind: "primitive", testOwner: "" }];
      },
      /button.*missing testOwner/,
    ],
    [
      "wrong manual owner",
      (inventory: SvelteInventory) => {
        inventory.primitives = [{ component: "theme", kind: "primitive", testOwner: "test.ts" }];
      },
      /theme.*expected manual-facade ownership/,
    ],
    [
      "missing Styled owner",
      (inventory: SvelteInventory) => {
        inventory.styled = [
          {
            component: "button",
            status: "implemented",
            testOwner: "test.ts",
            demoOwner: "",
            hostOwner: "host.ts",
          },
        ];
      },
      /button.*missing demoOwner/,
    ],
  ])("rejects %s with its identity and ownership context", (_label, mutate, diagnostic) => {
    const inventory: SvelteInventory = structuredClone(svelteInventory);
    mutate(inventory);
    expect(() => validateSvelteInventory(inventory)).toThrow(diagnostic);
  });

  it.each([{ manualFacades: [] }, { manualFacades: ["theme", "unknown"] }])(
    "rejects mismatched manual generator ownership %j",
    ({ manualFacades }) => {
      expect(() => validateSvelteInventory(undefined, { manualFacades })).toThrow(
        /manual facade.*inventory and generator ownership disagree/,
      );
    },
  );

  it("records exact model shapes and accepted transaction policy", () => {
    const { models, events } = svelteAdapterPublicContract;
    expectTypeOf(models.table).toEqualTypeOf<{
      readonly sidebar: { readonly open: "boolean"; readonly mobileOpen: "boolean" };
      readonly "color-picker": {
        readonly value: "ColorPickerColor | null";
        readonly format: "ColorPickerFormat";
      };
      readonly combobox: {
        readonly value: "string | null";
        readonly inputValue: "string";
        readonly open: "boolean";
      };
      readonly "navigation-menu": { readonly value: "string | null" };
      readonly "input-otp": { readonly value: "string" };
      readonly toggle: { readonly pressed: "boolean" };
      readonly "toggle-group": { readonly value: "string[]" };
      readonly radio: { readonly checked: "boolean" };
      readonly "radio-group": { readonly value: "string | undefined" };
      readonly "checkbox-group": { readonly value: "string[]" };
      readonly switch: { readonly checked: "boolean" };
      readonly input: { readonly value: "string | number | string[]" };
      readonly collapsible: { readonly open: "boolean" };
      readonly checkbox: { readonly checked: "boolean" };
      readonly select: { readonly open: "boolean"; readonly value: "string | null" };
      readonly accordion: { readonly value: "string | string[] | null" };
      readonly "alert-dialog": { readonly open: "boolean" };
      readonly drawer: { readonly open: "boolean" };
      readonly menu: { readonly open: "boolean" };
      readonly "context-menu": { readonly open: "boolean" };
      readonly "context-menu-checkbox-item": { readonly checked: "boolean" };
      readonly "context-menu-radio-group": { readonly value: "string | undefined" };
      readonly "menu-checkbox-item": { readonly checked: "boolean" };
      readonly "menu-radio-group": { readonly value: "string | undefined" };
      readonly popover: { readonly open: "boolean" };
      readonly "preview-card": { readonly open: "boolean" };
      readonly tooltip: { readonly open: "boolean" };
      readonly dialog: { readonly open: "boolean" };
      readonly slider: { readonly value: "number | number[]" };
      readonly tabs: { readonly value: "string | null" };
    }>();
    expect(models.table).toEqual({
      sidebar: { open: "boolean", mobileOpen: "boolean" },
      "color-picker": { value: "ColorPickerColor | null", format: "ColorPickerFormat" },
      combobox: { value: "string | null", inputValue: "string", open: "boolean" },
      "navigation-menu": { value: "string | null" },
      "input-otp": { value: "string" },
      toggle: { pressed: "boolean" },
      "toggle-group": { value: "string[]" },
      radio: { checked: "boolean" },
      "radio-group": { value: "string | undefined" },
      "checkbox-group": { value: "string[]" },
      switch: { checked: "boolean" },
      input: { value: "string | number | string[]" },
      collapsible: { open: "boolean" },
      checkbox: { checked: "boolean" },
      select: { open: "boolean", value: "string | null" },
      accordion: { value: "string | string[] | null" },
      "alert-dialog": { open: "boolean" },
      drawer: { open: "boolean" },
      menu: { open: "boolean" },
      "context-menu": { open: "boolean" },
      "context-menu-checkbox-item": { checked: "boolean" },
      "context-menu-radio-group": { value: "string | undefined" },
      "menu-checkbox-item": { checked: "boolean" },
      "menu-radio-group": { value: "string | undefined" },
      popover: { open: "boolean" },
      "preview-card": { open: "boolean" },
      tooltip: { open: "boolean" },
      dialog: { open: "boolean" },
      slider: { value: "number | number[]" },
      tabs: { value: "string | null" },
    });
    expect(models.declaration).toBe("$bindable()");
    expect(models.bindingDetection).toBe(false);
    expect(models.reset.seed).toEqual([
      "explicit-default",
      "initial-defined-model",
      "component-default",
    ]);
    expect(models.arrays).toEqual({ input: "copy", output: "copy", equality: "contents" });
    expect(events.order).toEqual([
      "detailed-proposal-callback",
      "cancelable-dom-dispatch",
      "runtime-cancellation-decision",
      "runtime-accepted-state",
      "accepted-subscription-model-publication",
    ]);
    expect(events.silentInputProposalCallbacks).toBe(false);
    expect(events.functionBinding.fixedPointLoops).toBe(false);
    expect(events.reentrantParent).toBe("outside-direct-model-contract");
    expect(events.functionBinding.transformedReadback).toBe("out-of-scope");
    expect(models.reset.inputOtp).toBe(
      "runtime-and-dom-reset-without-external-model-publication",
    );
  });

  it("records the button child payload and exact composition cohort", () => {
    const { composition, exports: exportPolicy } = svelteAdapterPublicContract;
    expectTypeOf(composition.child).toEqualTypeOf<"child?: Snippet<[ButtonChildPayload]>">();
    expect(composition.parts).toEqual([
      "SidebarTrigger",
      "SelectTrigger",
      "DialogTrigger",
      "DialogClose",
      "CollapsibleTrigger",
      "MenuTrigger",
      "NavigationMenuTrigger",
      "ComboboxTrigger",
      "ComboboxClear",
    ]);
    expect(composition.payload).toEqual({
      props: "ButtonChildProps",
      children: "children?: Snippet",
    });
    expect(composition.buttonProps).toEqual([
      "native-button-attributes",
      "native-callbacks",
      "attachment-symbols",
    ]);
    expect(composition.typeExports).toEqual(["ButtonChildPayload", "ButtonChildProps"]);
    expect(composition.replacementWrapper).toBe(false);
    expect(composition.developmentDiagnostics).toEqual([
      "wrong-element-type",
      "multiple-attached-owners",
      "missing-owner-after-settled-mount",
    ]);
    expect(composition.buttonRoot).toEqual({
      element: "fixed-native-button",
      childProp: false,
      payloadTypes: "retained-for-trigger-composition",
    });
    expect(composition.accordionTrigger).toEqual({
      element: "fixed-native-button",
      childProp: false,
      ownerMap: false,
      liveDisabledRelease: "shared-runtime-limitation-remount-to-clear",
    });
    expect(exportPolicy.componentSubpaths).toEqual([
      "named-parts",
      "named-namespace",
      "default-namespace",
    ]);
    expect(exportPolicy.root).toBe("named-only");
  });

  it("records consumer ownership for Breadcrumb custom links", () => {
    expect(svelteAdapterPublicContract.breadcrumbLink).toEqual({
      asChild: "asChild?: boolean = false",
      children: "children?: Snippet",
      defaultElement: "styled-native-anchor",
      customElement: "render-children-directly",
      customProps: "consumer-owned-href-router-props-classes-callbacks-and-ref",
      wrapperPropTransfer: false,
      replacementWrapper: false,
      ownerDiscovery: false,
    });
  });

  it("records SSR and attachment boundaries independently of family implementation", () => {
    const { server, lifecycle, framework, compatibility } = svelteAdapterPublicContract;
    expect(server).toEqual({
      browserGlobals: false,
      domWork: false,
      bindingPublication: false,
      callbacks: false,
      initialState: "deterministic-type-valid-initial-model-or-default",
      collapsibleParts: "closed-trigger-and-hidden-panel-before-connection",
      normalization: "after-client-mount",
      geometry: "after-client-mount",
      duplicateOwnersAndHandlers: false,
      hydration: "exact-server-markup",
    });
    expect(lifecycle.connection).toBe("attachment");
    expect(lifecycle.refs.callback).toBe("element-then-null");
    expect(lifecycle.refs.callbackReplacement).toBe("exact-order-out-of-scope");
    expect(lifecycle.refs.nativeStyled).toBe("bindable-element-ref-through-bind-this");
    expect(lifecycle.forwardedAttachments).toBe(
      "reactive-public-symbols-with-balanced-setup-cleanup",
    );
    expect(lifecycle.queuedWorkAfterUnmount).toBe(false);
    expect(framework.comparisonVersion).toBe("5.57.0");
    expect(compatibility.sourceAliasesAndWorkspaceFallback).toBe(false);
  });

  it("dispatches Carousel output only through the engine-viewport family", async () => {
    const sourceRoot = path.join(
      process.cwd(),
      "scripts/portable-runtime/renderers/framework-adapters/svelte",
    );
    const sources = await Promise.all(
      ["adapter.ts", "engine-viewport.ts"].map((file) =>
        readFile(path.join(sourceRoot, file), "utf8"),
      ),
    );
    const implementation = sources.join("\n");

    expect(implementation).toContain('kind === "engine-viewport"');
    expect(implementation).not.toMatch(
      /(?:component|componentName|componentId)\s*={2,3}\s*["']carousel["']/i,
    );
  });

  it("dispatches Dialog output only through the native-overlay family", async () => {
    const sourceRoot = path.join(
      process.cwd(),
      "scripts/portable-runtime/renderers/framework-adapters/svelte",
    );
    const sources = await Promise.all(
      ["adapter.ts", "native-overlay.ts"].map((file) =>
        readFile(path.join(sourceRoot, file), "utf8"),
      ),
    );
    const implementation = sources.join("\n");

    expect(implementation).toContain('kind === "native-overlay"');
    expect(implementation).not.toMatch(
      /(?:component|componentName|componentId)\s*={2,3}\s*["']dialog["']/i,
    );
  });

  it("dispatches Slider output only through the range-control family", async () => {
    const sourceRoot = path.join(
      process.cwd(),
      "scripts/portable-runtime/renderers/framework-adapters/svelte",
    );
    const sources = await Promise.all(
      ["adapter.ts", "range-control.ts"].map((file) =>
        readFile(path.join(sourceRoot, file), "utf8"),
      ),
    );
    const implementation = sources.join("\n");

    expect(implementation).toContain('kind === "range-control"');
    expect(implementation).not.toMatch(
      /(?:component|componentName|componentId)\s*={2,3}\s*["']slider["']/i,
    );
    expectSliderRuntimeOwnership(implementation);
  });

  it.each([
    'resetForm?.addEventListener("pointerdown", handleFormReset);',
    'root.addEventListener("reset", handleFormReset);',
    'resetForm?.addEventListener("reset", handleInteraction);',
    "root.getBoundingClientRect();",
  ])("retains the Slider Runtime ownership guard for %s", (unapprovedBehavior) => {
    const resetObserver = '      resetForm?.addEventListener("reset", handleFormReset);';
    expectSliderRuntimeOwnership(resetObserver);
    expect(() => expectSliderRuntimeOwnership(`${resetObserver}\n${unapprovedBehavior}`)).toThrow();
  });

  it("dispatches Toast output only through the notification-system family", async () => {
    const sourceRoot = path.join(
      process.cwd(),
      "scripts/portable-runtime/renderers/framework-adapters/svelte",
    );
    const sources = await Promise.all(
      ["adapter.ts", "notification-system.ts"].map((file) =>
        readFile(path.join(sourceRoot, file), "utf8"),
      ),
    );
    const implementation = sources.join("\n");

    expect(implementation).toContain('kind === "notification-system"');
    expect(implementation).not.toMatch(
      /(?:component|componentName|componentId)\s*={2,3}\s*["']toast["']/i,
    );
    expect(implementation).not.toMatch(
      /(?:queue|setTimeout|pointermove|cloneNode|ToastManagerController|toast\.promise)/,
    );
  });

  it("dispatches holdout output by family kind without Accordion identity branches", async () => {
    const sourceRoot = path.join(
      process.cwd(),
      "scripts/portable-runtime/renderers/framework-adapters/svelte",
    );
    const sources = await Promise.all(
      ["adapter.ts", "repeated-disclosure.ts"].map((file) =>
        readFile(path.join(sourceRoot, file), "utf8"),
      ),
    );
    const implementation = sources.join("\n");

    expect(implementation).toContain('kind === "repeated-disclosure"');
    expect(implementation).not.toMatch(
      /(?:component|componentName|componentId)\s*={2,3}\s*["']accordion["']/i,
    );
  });

  it("keeps Svelte public-beta metadata isolated from unrelated manifests", async () => {
    const nonSvelteManifests = [
      "apps/demo/package.json",
      "apps/react-demo/package.json",
      "apps/vue-demo/package.json",
      "packages/astro/package.json",
      "packages/cli/package.json",
      "packages/react/package.json",
      "packages/runtime/package.json",
      "packages/vue/package.json",
    ];

    for (const manifest of nonSvelteManifests) {
      const source = await readFile(path.join(process.cwd(), manifest), "utf8");
      expect(source.toLowerCase(), manifest).not.toContain("svelte");
    }

    const packageManifest = JSON.parse(
      await readFile(path.join(process.cwd(), "packages/svelte/package.json"), "utf8"),
    );
    expect(packageManifest).toMatchObject({
      name: "@starwind-ui/svelte",
      sideEffects: false,
    });
    expect(packageManifest.private).not.toBe(true);
    expect(validSemver(packageManifest.version)).toBe(packageManifest.version);
    expect(packageManifest.exports).toEqual(sveltePackageExports);
    for (const component of SVELTE_PACKAGE_COMPONENTS) {
      expect(packageManifest.exports[`./${component}`], component).toEqual({
        types: `./dist/${component}/index.d.ts`,
        svelte: `./dist/${component}/index.js`,
        default: `./dist/${component}/index.js`,
      });
      expect(
        await readFile(`packages/svelte/src/${component}/index.ts`, "utf8"),
        component,
      ).toContain("export");
    }
    const packageReadme = (
      await readFile(path.join(process.cwd(), "packages/svelte/README.md"), "utf8")
    ).replace(/\s+/g, " ");
    expect(packageReadme).toContain(
      "The target inventory in `scripts/portable-runtime/renderers/framework-adapters/svelte/inventory.ts` lists its implemented Primitive families and their test owners.",
    );
    expect(packageReadme).toContain("This Svelte 5 public-beta adapter package");

    for (const absentPath of [
      "docs/svelte",
      "packages/cli/registry/svelte",
      "packages/cli/src/registry/svelte",
    ]) {
      await expect(readdir(path.join(process.cwd(), absentPath)), absentPath).rejects.toMatchObject(
        {
          code: "ENOENT",
        },
      );
    }

    expect(
      await readFile(
        path.join(process.cwd(), "packages/cli/src/registry/bundled-registry.json"),
        "utf8",
      ),
    ).toContain("@starwind-ui/svelte");

    expect(await readFile(path.join(process.cwd(), "README.md"), "utf8")).toContain(
      "@starwind-ui/svelte",
    );
    for (const publicReadme of [
      "packages/astro/README.md",
      "packages/cli/README.md",
      "packages/react/README.md",
      "packages/runtime/README.md",
    ]) {
      expect(
        await readFile(path.join(process.cwd(), publicReadme), "utf8"),
        publicReadme,
      ).not.toContain("@starwind-ui/svelte");
    }
  });
});
