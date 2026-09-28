import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { format, resolveConfig } from "prettier";
import { describe, expect, it } from "vitest";
import {
  alertDialogRuntimeAdapterContract,
  avatarRuntimeAdapterContract,
  buttonRuntimeAdapterContract,
  checkboxGroupRuntimeAdapterContract,
  checkboxRuntimeAdapterContract,
  collapsibleRuntimeAdapterContract,
  dialogRuntimeAdapterContract,
  drawerRuntimeAdapterContract,
  fieldsetRuntimeAdapterContract,
  formRuntimeAdapterContract,
  inputRuntimeAdapterContract,
  popoverRuntimeAdapterContract,
  progressRuntimeAdapterContract,
  radioGroupRuntimeAdapterContract,
  radioRuntimeAdapterContract,
  scrollAreaRuntimeAdapterContract,
  switchRuntimeAdapterContract,
  toggleGroupRuntimeAdapterContract,
  toggleRuntimeAdapterContract,
} from "../contracts/primitive/representatives.js";
import type { RuntimeAdapterContract } from "../contracts/primitive/types.js";
import { createAstroHeader } from "../renderers/framework-adapters/astro/headers.js";
import { normalizeAstroPrimitiveOutput } from "../renderers/framework-adapters/astro/primitive-output-writer.js";
import {
  astroFrameworkAdapter,
  getPrimitiveFrameworkAdapterTargetsWithOutputModelCapability,
  reactFrameworkAdapter,
} from "../renderers/framework-adapters/index.js";
import {
  applyReactEffectTiming,
  applyReactPortalImportCanonicalization,
  applyReactRefCleanup,
} from "../renderers/framework-adapters/react/primitive-output-writer.js";
import { getPrimitiveFrameworkAdapterTargetsForComponent } from "../renderers/framework-adapters/target-registry.js";
import { isActionSurfaceOutputModelPlan } from "../renderers/generic-adapter-plan/families/action-surface.js";
import {
  booleanFormControlAdapterFamilyPlan,
  getBooleanFormControlFacts,
} from "../renderers/generic-adapter-plan/families/boolean-form-control.js";
import { disclosurePresenceAdapterFamilyPlan } from "../renderers/generic-adapter-plan/families/disclosure-presence.js";
import { formFieldCoordinatorAdapterFamilyPlan } from "../renderers/generic-adapter-plan/families/form-field-coordinator.js";
import { createGroupedValueControlAdapterFamilyPlan } from "../renderers/generic-adapter-plan/families/grouped-value-control.js";
import { mediaStatusAdapterFamilyPlan } from "../renderers/generic-adapter-plan/families/media-status.js";
import { nativeOverlayAdapterFamilyPlan } from "../renderers/generic-adapter-plan/families/native-overlay.js";
import { presenceFloatingOverlayAdapterFamilyPlan } from "../renderers/generic-adapter-plan/families/presence-floating-overlay.js";
import { singleBooleanControlAdapterFamilyPlan } from "../renderers/generic-adapter-plan/families/single-boolean-control.js";
import { viewportMeasurementAdapterFamilyPlan } from "../renderers/generic-adapter-plan/families/viewport-measurement.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
  GENERIC_ADAPTER_OUTPUT_MODEL_COMPONENTS,
  printGenericAdapterOutputModel,
} from "../renderers/generic-adapter-plan/index.js";
import type {
  GenericAdapterPlan,
  GenericAdapterPlanProp,
} from "../renderers/generic-adapter-plan/types.js";
import { primitiveGeneratorRegistry } from "../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../renderers/shared.js";
import {
  assertTypeScriptModule,
  compactCode,
  normalizeTypeScriptSource,
} from "./source-comparison.js";

function printAstroGenericAdapterOutputModel(plan: GenericAdapterPlan) {
  return printGenericAdapterOutputModel(
    astroFrameworkAdapter,
    buildGenericAdapterOutputModel(plan),
  );
}

function printReactGenericAdapterOutputModel(plan: GenericAdapterPlan) {
  return printGenericAdapterOutputModel(
    reactFrameworkAdapter,
    buildGenericAdapterOutputModel(plan),
  );
}

function buildTargetGenericAdapterOutputModel(
  plan: GenericAdapterPlan,
  target: "astro" | "react" | "vue",
) {
  const model = buildGenericAdapterOutputModel(plan);

  return {
    files: model.files.filter((file) => !file.target || file.target === target),
  };
}

describe("GenericAdapterPlan output model printers", () => {
  it("builds root-only and multi-part generic adapter plans", () => {
    const rootOnly = buildGenericAdapterPlan(syntheticRootOnlyContract);
    const multiPart = buildGenericAdapterPlan(syntheticMultiPartContract);

    expect(rootOnly.parts.map((part) => part.name)).toEqual(["root"]);
    expect(rootOnly.files.map((file) => file.path)).toEqual([
      "synthetic-root-only/SyntheticRootOnlyRoot",
      "synthetic-root-only/index",
    ]);
    expect(multiPart.parts.map((part) => part.name)).toEqual(["root", "label"]);
    expect(multiPart.files.map((file) => file.path)).toEqual([
      "synthetic-static/SyntheticStaticRoot",
      "synthetic-static/SyntheticStaticLabel",
      "synthetic-static/index",
    ]);
  });

  it("rejects unstructured static generic plans instead of falling back to target printers", () => {
    for (const contract of [
      syntheticRootOnlyContract,
      syntheticMultiPartContract,
      syntheticPropBackedContract,
      syntheticDivDisabledContract,
    ]) {
      const plan = buildGenericAdapterPlan(contract);

      expect(() => buildGenericAdapterOutputModel(plan)).toThrow(
        `${plan.displayName} generic adapter plan does not match a structured Adapter Output Model family.`,
      );
    }
  });

  it("prints the current Button primitive through the action-surface output family", () => {
    const plan = buildGenericAdapterPlan(buttonRuntimeAdapterContract);
    const astroOutputModel = buildGenericAdapterOutputModel(plan);
    const reactOutputModel = buildGenericAdapterOutputModel(plan);
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(astroOutputModel).toEqual(reactOutputModel);
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual(["component", "index"]);
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(
      astroOutputModel.files.map((file) =>
        file.kind === "component"
          ? file.component.family?.kind
          : file.kind === "index"
            ? file.family?.kind
            : undefined,
      ),
    ).toEqual(["action-surface", "action-surface"]);

    expect(plan.props.map((prop) => prop.name)).toEqual([
      "disabled",
      "focusableWhenDisabled",
      "type",
    ]);
    expect(plan.runtime.optionProps).toEqual(["disabled"]);
    const componentFile = astroOutputModel.files.find((file) => file.kind === "component");
    expect(componentFile?.kind === "component" ? componentFile.component : undefined).toEqual(
      expect.objectContaining({
        context: [],
        events: [],
        lifecycle: undefined,
        portals: [],
        stateSync: [],
      }),
    );
    expect(
      componentFile?.kind === "component" ? componentFile.component.render : undefined,
    ).toEqual(
      expect.objectContaining({
        children: [{ kind: "slot" }],
        defaultElement: "button",
        events: [],
        kind: "element",
        part: "root",
      }),
    );

    const astroRoot = astroFiles.find((file) => file.path === "button/ButtonRoot.astro")?.contents;
    const reactRoot = reactFiles.find((file) => file.path === "button/ButtonRoot.tsx")?.contents;
    const reactIndex = reactFiles.find((file) => file.path === "button/index.ts")?.contents;

    expect(astroRoot).toContain('interface Props extends HTMLAttributes<"button">');
    expect(astroRoot).toContain("focusableWhenDisabled?: boolean;");
    expect(astroRoot).toContain('type = "button"');
    expect(astroRoot).toContain("data-sw-button");
    expect(astroRoot).toContain(
      'data-focusable-when-disabled={focusableWhenDisabled ? "true" : undefined}',
    );
    expect(astroRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(astroRoot).toContain(
      'aria-disabled={disabled && focusableWhenDisabled ? "true" : undefined}',
    );
    expect(astroRoot).toContain("disabled={disabled && !focusableWhenDisabled}");
    expect(astroRoot).toContain("type={type}");
    expect(astroRoot).toContain('import { createButton } from "@starwind-ui/runtime/button";');
    expect(astroRoot).toContain(
      `getInitCandidates(event, '[data-sw-button][data-focusable-when-disabled="true"]')`,
    );
    expect(astroRoot).toContain(
      'createButton(button).setDisabled(button.hasAttribute("data-disabled"))',
    );

    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.

    expect(reactIndex).toMatch(/^"use client";\n\n/);

    expectPrintedFilesToMatchPackage("packages/astro/src", astroFiles);
    expectPrintedFilesToMatchPackage("packages/react/src", reactFiles);
  });

  it("keeps target-extra family files on the structured output-model path", () => {
    const plan = buildGenericAdapterPlan(checkboxGroupRuntimeAdapterContract);
    const model = buildGenericAdapterOutputModel(plan);

    expect(model.files.map((file) => file.kind)).not.toContain("static-adapter-plan");
    expect(
      model.files.some(
        (file) =>
          file.kind === "helper" &&
          file.path === "checkbox-group/CheckboxGroupContext.tsx" &&
          file.target === "react",
      ),
    ).toBe(true);
  });

  it("names every Generic Adapter Output Model component", () => {
    expect([...GENERIC_ADAPTER_OUTPUT_MODEL_COMPONENTS]).toEqual([
      "alert-dialog",
      "avatar",
      "button",
      "checkbox-group",
      "collapsible",
      "checkbox",
      "dialog",
      "drawer",
      "fieldset",
      "form",
      "input",
      "popover",
      "progress",
      "radio",
      "radio-group",
      "scroll-area",
      "switch",
      "toggle",
      "toggle-group",
    ]);
  });

  it("prints Dialog native overlay behavior through the Adapter Output Model", () => {
    const plan = buildGenericAdapterPlan(dialogRuntimeAdapterContract);
    const astroOutputModel = buildTargetGenericAdapterOutputModel(plan, "astro");
    const reactOutputModel = buildTargetGenericAdapterOutputModel(plan, "react");
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(GENERIC_ADAPTER_OUTPUT_MODEL_COMPONENTS).toContain("dialog");
    expect(astroOutputModel).toEqual(reactOutputModel);
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "index",
    ]);
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([
      expect.objectContaining({ kind: "native-overlay", part: "root" }),
      expect.objectContaining({ kind: "native-overlay", part: "trigger" }),
      expect.objectContaining({ kind: "native-overlay", part: "backdrop" }),
      expect.objectContaining({ kind: "native-overlay", part: "popup" }),
      expect.objectContaining({ kind: "native-overlay", part: "title" }),
      expect.objectContaining({ kind: "native-overlay", part: "description" }),
      expect.objectContaining({ kind: "native-overlay", part: "close" }),
    ]);
    expect(astroOutputModel.files.find((file) => file.kind === "index")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({ kind: "native-overlay" }),
      }),
    );

    expect(astroFiles).toEqual(printAstroGenericAdapterOutputModel(plan));
    expect(reactFiles).toEqual(printReactGenericAdapterOutputModel(plan));

    const astroRoot = astroFiles.find((file) => file.path === "dialog/DialogRoot.astro")?.contents;
    const astroTrigger = astroFiles.find(
      (file) => file.path === "dialog/DialogTrigger.astro",
    )?.contents;
    const astroBackdrop = astroFiles.find(
      (file) => file.path === "dialog/DialogBackdrop.astro",
    )?.contents;
    const astroClose = astroFiles.find(
      (file) => file.path === "dialog/DialogClose.astro",
    )?.contents;
    const astroPopup = astroFiles.find(
      (file) => file.path === "dialog/DialogPopup.astro",
    )?.contents;
    const astroIndex = astroFiles.find((file) => file.path === "dialog/index.ts")?.contents;
    const reactRoot = reactFiles.find((file) => file.path === "dialog/DialogRoot.tsx")?.contents;
    const reactTrigger = reactFiles.find(
      (file) => file.path === "dialog/DialogTrigger.tsx",
    )?.contents;
    const reactBackdrop = reactFiles.find(
      (file) => file.path === "dialog/DialogBackdrop.tsx",
    )?.contents;
    const reactClose = reactFiles.find((file) => file.path === "dialog/DialogClose.tsx")?.contents;
    const reactPopup = reactFiles.find((file) => file.path === "dialog/DialogPopup.tsx")?.contents;
    const reactIndex = reactFiles.find((file) => file.path === "dialog/index.ts")?.contents;

    expect(astroRoot).toContain(
      'import { createDialog, resolveDialogOwner } from "@starwind-ui/runtime/dialog";',
    );
    expect(astroRoot).toContain("defaultOpen = false");
    expect(astroRoot).toContain("closeOnOutsideInteract = true");
    expect(astroRoot).toContain("modal = true");
    expect(astroRoot).toContain('data-default-open={defaultOpen ? "true" : undefined}');
    expect(astroRoot).toContain('data-close-on-escape={closeOnEscape ? "true" : "false"}');
    expect(astroRoot).toContain(
      'data-close-on-outside-interact={closeOnOutsideInteract ? "true" : "false"}',
    );
    expect(astroRoot).toContain('data-modal={modal ? "true" : "false"}');
    expect(astroRoot).toContain('data-state={defaultOpen ? "open" : "closed"}');
    expect(astroRoot).toContain(
      'getInitCandidates(event, "[data-sw-dialog]:not([data-sw-alert-dialog]):not([data-sw-drawer])").forEach((root) => {',
    );
    expect(astroRoot).toContain('document.addEventListener("astro:after-swap", setupDialogs);');
    expect(astroRoot).toContain('document.addEventListener("starwind:init", setupDialogs);');
    expect(astroTrigger).toContain('type="button"');
    expect(astroTrigger).toContain('aria-haspopup="dialog"');
    expect(astroTrigger).toContain("data-sw-dialog-target-id={targetId}");
    expect(astroTrigger).toContain('data-state="closed"');
    expect(astroBackdrop).toContain("hidden");
    expect(astroBackdrop).toContain('data-state="closed"');
    expect(astroPopup).toContain("data-sw-dialog-content");
    expect(astroPopup).not.toContain('role="dialog"');
    expect(astroClose).toContain('type="button"');
    expect(astroClose).toContain("data-sw-dialog-close");
    expect(astroIndex).toContain('import DialogRoot from "./DialogRoot.astro";');
    expect(astroIndex).toContain("Root: DialogRoot");
    expect(astroIndex).toContain(
      "export type { DialogCloseCompleteDetails, DialogOpenChangeDetails }",
    );

    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.

    expect(compactCode(reactTrigger)).toContain(compactCode('type="button"'));
    expect(compactCode(reactTrigger)).toContain(compactCode("data-sw-dialog-target-id={targetId}"));
    expect(compactCode(reactTrigger)).toContain(compactCode('data-state="closed"'));
    expect(compactCode(reactBackdrop)).toContain(compactCode("data-sw-dialog-overlay"));
    expect(compactCode(reactBackdrop)).toContain(compactCode('data-state="closed"'));
    expect(compactCode(reactBackdrop)).toContain(compactCode("hidden"));
    expect(compactCode(reactPopup)).toContain(
      compactCode("React.DialogHTMLAttributes<HTMLDialogElement>"),
    );
    expect(compactCode(reactClose)).toContain(compactCode('type="button"'));
    expect(compactCode(reactClose)).toContain(compactCode("data-sw-dialog-close"));
    expect(compactCode(reactIndex)).toContain(
      compactCode('import DialogRoot from "./DialogRoot";'),
    );
    expect(compactCode(reactIndex)).toContain(compactCode("Root: DialogRoot"));
    expect(compactCode(reactIndex)).toContain(
      compactCode("export type { DialogCloseCompleteDetails, DialogOpenChangeDetails }"),
    );
  });

  it("keeps generated Dialog files equal to the checked-in packages", async () => {
    const outputRoot = mkdtempSync(join(tmpdir(), "starwind-dialog-native-overlay-plan-"));
    const astroOutputRoot = join(outputRoot, "astro");
    const reactOutputRoot = join(outputRoot, "react");

    try {
      await generateAstroPrimitive(
        "dialog",
        astroOutputRoot,
        createAstroHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
        createTsHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
      );
      await generateReactPrimitive(
        "dialog",
        reactOutputRoot,
        createTsHeader("scripts/portable-runtime/generate-react-wrappers.ts"),
      );

      for (const [targetPackage, fileName] of [
        ["astro", "DialogBackdrop.astro"],
        ["astro", "DialogClose.astro"],
        ["astro", "DialogDescription.astro"],
        ["astro", "DialogPopup.astro"],
        ["astro", "DialogRoot.astro"],
        ["astro", "DialogTitle.astro"],
        ["astro", "DialogTrigger.astro"],
        ["astro", "index.ts"],
        ["react", "DialogBackdrop.tsx"],
        ["react", "DialogClose.tsx"],
        ["react", "DialogDescription.tsx"],
        ["react", "DialogPopup.tsx"],
        ["react", "DialogRoot.tsx"],
        ["react", "DialogTitle.tsx"],
        ["react", "DialogTrigger.tsx"],
        ["react", "index.ts"],
      ] as const) {
        const packagePath = join(
          process.cwd(),
          "packages",
          targetPackage,
          "src",
          "dialog",
          fileName,
        );
        const targetOutputRoot = targetPackage === "astro" ? astroOutputRoot : reactOutputRoot;
        const generatedPath = join(targetOutputRoot, "dialog", fileName);

        expect(
          normalizePrintedComparison(
            await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath),
          ),
        ).toBe(normalizePrintedComparison(await readFormattedOutput(packagePath)));
      }
    } finally {
      rmSync(outputRoot, { recursive: true, force: true });
    }
  });

  it("prints Alert Dialog and Drawer native overlay variants through the Adapter Output Model", () => {
    for (const { component, contract, popupFile, rootFile, triggerFile } of [
      {
        component: "alert-dialog",
        contract: alertDialogRuntimeAdapterContract,
        popupFile: "AlertDialogPopup",
        rootFile: "AlertDialogRoot",
        triggerFile: "AlertDialogTrigger",
      },
      {
        component: "drawer",
        contract: drawerRuntimeAdapterContract,
        popupFile: "DrawerPopup",
        rootFile: "DrawerRoot",
        triggerFile: "DrawerTrigger",
      },
    ] as const) {
      const plan = buildGenericAdapterPlan(contract);
      const astroOutputModel = buildTargetGenericAdapterOutputModel(plan, "astro");
      const reactOutputModel = buildTargetGenericAdapterOutputModel(plan, "react");
      const astroFiles = printAstroGenericAdapterOutputModel(plan);
      const reactFiles = printReactGenericAdapterOutputModel(plan);

      expect(GENERIC_ADAPTER_OUTPUT_MODEL_COMPONENTS).toContain(component);
      expect(astroOutputModel).toEqual(reactOutputModel);
      expect(astroOutputModel.files.map((file) => file.kind)).toEqual([
        "component",
        "component",
        "component",
        "component",
        "component",
        "component",
        "component",
        "component",
        "component",
        "index",
      ]);
      expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
      expect(
        astroOutputModel.files
          .filter((file) => file.kind === "component")
          .map((file) => file.component.family),
      ).toEqual([
        expect.objectContaining({ kind: "native-overlay", part: "root" }),
        expect.objectContaining({ kind: "native-overlay", part: "trigger" }),
        expect.objectContaining({ kind: "native-overlay", part: "portal" }),
        expect.objectContaining({ kind: "native-overlay", part: "backdrop" }),
        expect.objectContaining({ kind: "native-overlay", part: "viewport" }),
        expect.objectContaining({ kind: "native-overlay", part: "popup" }),
        expect.objectContaining({ kind: "native-overlay", part: "title" }),
        expect.objectContaining({ kind: "native-overlay", part: "description" }),
        expect.objectContaining({ kind: "native-overlay", part: "close" }),
      ]);
      expect(astroFiles).toEqual(printAstroGenericAdapterOutputModel(plan));
      expect(reactFiles).toEqual(printReactGenericAdapterOutputModel(plan));

      const astroRoot = astroFiles.find(
        (file) => file.path === `${component}/${rootFile}.astro`,
      )?.contents;
      const astroTrigger = astroFiles.find(
        (file) => file.path === `${component}/${triggerFile}.astro`,
      )?.contents;
      const astroBackdrop = astroFiles.find(
        (file) => file.path === `${component}/${popupFile.replace("Popup", "Backdrop")}.astro`,
      )?.contents;
      const astroClose = astroFiles.find(
        (file) => file.path === `${component}/${popupFile.replace("Popup", "Close")}.astro`,
      )?.contents;
      const astroPortal = astroFiles.find(
        (file) => file.path === `${component}/${popupFile.replace("Popup", "Portal")}.astro`,
      )?.contents;
      const astroViewport = astroFiles.find(
        (file) => file.path === `${component}/${popupFile.replace("Popup", "Viewport")}.astro`,
      )?.contents;
      const astroPopup = astroFiles.find(
        (file) => file.path === `${component}/${popupFile}.astro`,
      )?.contents;
      const astroIndex = astroFiles.find((file) => file.path === `${component}/index.ts`)?.contents;
      const reactRoot = reactFiles.find(
        (file) => file.path === `${component}/${rootFile}.tsx`,
      )?.contents;
      const reactTrigger = reactFiles.find(
        (file) => file.path === `${component}/${triggerFile}.tsx`,
      )?.contents;
      const reactBackdrop = reactFiles.find(
        (file) => file.path === `${component}/${popupFile.replace("Popup", "Backdrop")}.tsx`,
      )?.contents;
      const reactClose = reactFiles.find(
        (file) => file.path === `${component}/${popupFile.replace("Popup", "Close")}.tsx`,
      )?.contents;
      const reactPortal = reactFiles.find(
        (file) => file.path === `${component}/${popupFile.replace("Popup", "Portal")}.tsx`,
      )?.contents;
      const reactViewport = reactFiles.find(
        (file) => file.path === `${component}/${popupFile.replace("Popup", "Viewport")}.tsx`,
      )?.contents;
      const reactPopup = reactFiles.find(
        (file) => file.path === `${component}/${popupFile}.tsx`,
      )?.contents;
      const reactIndex = reactFiles.find((file) => file.path === `${component}/index.ts`)?.contents;

      expect(astroRoot).toContain(
        `import { ${plan.runtime.factory}, resolveDialogOwner } from "${plan.runtime.importSource}";`,
      );
      expect(astroRoot).toContain("if (knownRoots.has(root)) instance.refresh()");
      expect(astroRoot).toContain("knownRoots.has(owner)");
      expect(astroRoot).toContain("const owner = resolveDialogOwner(scopedRoot)");
      assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.
      expect(astroRoot).toContain("defaultOpen = false");
      expect(astroRoot).toContain('data-default-open={defaultOpen ? "true" : undefined}');
      expect(astroRoot).toContain('data-close-on-escape={closeOnEscape ? "true" : "false"}');
      expect(astroRoot).toContain(
        'data-close-on-outside-interact={closeOnOutsideInteract ? "true" : "false"}',
      );
      expect(astroRoot).toContain('data-modal={modal ? "true" : "false"}');
      expect(astroRoot).toContain('data-state={defaultOpen ? "open" : "closed"}');
      expect(astroTrigger).toContain('type="button"');
      expect(astroTrigger).toContain('aria-haspopup="dialog"');
      expect(astroTrigger).toContain('data-state="closed"');

      expect(compactCode(reactTrigger)).toContain(compactCode('type="button"'));
      expect(compactCode(reactTrigger)).toContain(compactCode('data-state="closed"'));

      if (component === "alert-dialog") {
        expect(astroRoot).toContain("closeOnOutsideInteract = false");
        expect(astroRoot).toContain(
          'getInitCandidates(event, "[data-sw-alert-dialog]").forEach((root) => {',
        );
        expect(astroRoot).toContain(
          'document.addEventListener("astro:after-swap", setupAlertDialogs);',
        );
        expect(astroRoot).toContain(
          'document.addEventListener("starwind:init", setupAlertDialogs);',
        );
        expect(astroTrigger).toContain("data-sw-alert-dialog-target-id={targetId}");
        expect(astroBackdrop).toContain("data-sw-alert-dialog-backdrop");
        expect(astroBackdrop).toContain('data-state="closed"');
        expect(astroBackdrop).toContain("hidden");
        expect(astroPortal).toContain("data-sw-alert-dialog-portal");
        expect(astroViewport).toContain("data-sw-alert-dialog-viewport");
        expect(astroPopup).toContain('role="alertdialog"');
        expect(astroClose).toContain('type="button"');
        expect(astroClose).toContain("data-sw-alert-dialog-close");
        expect(astroIndex).toContain("Root: AlertDialogRoot");
        expect(astroIndex).toContain("Portal: AlertDialogPortal");
        expect(astroIndex).toContain("Viewport: AlertDialogViewport");
        expect(astroIndex).toContain(
          "AlertDialogCloseCompleteDetails,\n  AlertDialogOpenChangeDetails,",
        );

        expect(compactCode(reactTrigger)).toContain(
          compactCode("data-sw-alert-dialog-target-id={targetId}"),
        );
        expect(compactCode(reactBackdrop)).toContain(compactCode("data-sw-alert-dialog-backdrop"));
        expect(compactCode(reactBackdrop)).toContain(compactCode('data-state="closed"'));
        expect(compactCode(reactBackdrop)).toContain(compactCode("hidden"));
        expect(compactCode(reactPortal)).toContain(compactCode("data-sw-alert-dialog-portal"));
        expect(compactCode(reactViewport)).toContain(compactCode("data-sw-alert-dialog-viewport"));
        expect(compactCode(reactPopup)).toContain(compactCode('role="alertdialog"'));
        expect(compactCode(reactClose)).toContain(compactCode('type="button"'));
        expect(compactCode(reactClose)).toContain(compactCode("data-sw-alert-dialog-close"));
        expect(compactCode(reactIndex)).toContain(compactCode("Root: AlertDialogRoot"));
        expect(compactCode(reactIndex)).toContain(compactCode("Portal: AlertDialogPortal"));
        expect(compactCode(reactIndex)).toContain(compactCode("Viewport: AlertDialogViewport"));
        expect(compactCode(reactIndex)).toContain(
          compactCode("AlertDialogCloseCompleteDetails,\n  AlertDialogOpenChangeDetails,"),
        );
      } else {
        expect(astroRoot).toContain("closeOnOutsideInteract = true");
        expect(astroRoot).toContain(
          'getInitCandidates(event, "[data-sw-drawer]").forEach((root) => {',
        );
        expect(astroRoot).toContain('document.addEventListener("astro:after-swap", setupDrawers);');
        expect(astroRoot).toContain('document.addEventListener("starwind:init", setupDrawers);');
        expect(astroTrigger).toContain("data-sw-drawer-target-id={targetId}");
        expect(astroBackdrop).toContain("data-sw-drawer-backdrop");
        expect(astroBackdrop).toContain('data-state="closed"');
        expect(astroBackdrop).toContain("hidden");
        expect(astroPortal).toContain("data-sw-drawer-portal");
        expect(astroViewport).toContain("data-sw-drawer-viewport");
        expect(astroPopup).toContain('side?: "top" | "right" | "bottom" | "left";');
        expect(astroPopup).toContain('const { side = "right", ...rest } = Astro.props;');
        expect(astroPopup).toContain("data-sw-drawer-popup");
        expect(astroPopup).toContain('data-state="closed"');
        expect(astroPopup).toContain("data-side={side}");
        expect(astroClose).toContain('type="button"');
        expect(astroClose).toContain("data-sw-drawer-close");
        expect(astroIndex).toContain("Root: DrawerRoot");
        expect(astroIndex).toContain("Portal: DrawerPortal");
        expect(astroIndex).toContain("Viewport: DrawerViewport");
        expect(astroIndex).toContain("Popup: DrawerPopup");
        expect(astroIndex).toContain(
          "export type { DrawerCloseCompleteDetails, DrawerOpenChangeDetails }",
        );

        expect(compactCode(reactTrigger)).toContain(
          compactCode("data-sw-drawer-target-id={targetId}"),
        );
        expect(compactCode(reactBackdrop)).toContain(compactCode("data-sw-drawer-backdrop"));
        expect(compactCode(reactBackdrop)).toContain(compactCode('data-state="closed"'));
        expect(compactCode(reactBackdrop)).toContain(compactCode("hidden"));
        expect(compactCode(reactPortal)).toContain(compactCode("data-sw-drawer-portal"));
        expect(compactCode(reactViewport)).toContain(compactCode("data-sw-drawer-viewport"));
        expect(compactCode(reactPopup)).toContain(
          compactCode('side?: "top" | "right" | "bottom" | "left";'),
        );
        expect(compactCode(reactPopup)).toContain(
          compactCode("React.forwardRef<HTMLDialogElement, DrawerPopupProps>"),
        );
        expect(compactCode(reactPopup)).toContain(compactCode('{ side = "right", ...props }'));
        expect(compactCode(reactPopup)).toContain(compactCode("data-sw-drawer-popup"));
        expect(compactCode(reactPopup)).toContain(compactCode('data-state="closed"'));
        expect(compactCode(reactPopup)).toContain(compactCode("data-side={side}"));
        expect(compactCode(reactClose)).toContain(compactCode('type="button"'));
        expect(compactCode(reactClose)).toContain(compactCode("data-sw-drawer-close"));
        expect(compactCode(reactIndex)).toContain(compactCode("Root: DrawerRoot"));
        expect(compactCode(reactIndex)).toContain(compactCode("Portal: DrawerPortal"));
        expect(compactCode(reactIndex)).toContain(compactCode("Viewport: DrawerViewport"));
        expect(compactCode(reactIndex)).toContain(compactCode("Popup: DrawerPopup"));
        expect(compactCode(reactIndex)).toContain(
          compactCode("export type { DrawerCloseCompleteDetails, DrawerOpenChangeDetails }"),
        );
      }
    }
  });

  it("prints Popover floating overlay behavior through the Adapter Output Model", () => {
    const plan = buildGenericAdapterPlan(popoverRuntimeAdapterContract);
    const astroOutputModel = buildTargetGenericAdapterOutputModel(plan, "astro");
    const reactOutputModel = buildTargetGenericAdapterOutputModel(plan, "react");
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(GENERIC_ADAPTER_OUTPUT_MODEL_COMPONENTS).toContain("popover");
    expect(astroOutputModel).toEqual(reactOutputModel);
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "index",
    ]);
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([
      expect.objectContaining({ kind: "presence-floating-overlay", part: "root" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "trigger" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "portal" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "positioner" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "popup" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "arrow" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "backdrop" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "title" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "description" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "close" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "viewport" }),
    ]);
    expect(astroOutputModel.files.find((file) => file.kind === "index")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({ kind: "presence-floating-overlay" }),
      }),
    );
    expect(astroFiles).toEqual(printAstroGenericAdapterOutputModel(plan));
    expect(reactFiles).toEqual(printReactGenericAdapterOutputModel(plan));

    const astroRoot = astroFiles.find(
      (file) => file.path === "popover/PopoverRoot.astro",
    )?.contents;
    const astroTrigger = astroFiles.find(
      (file) => file.path === "popover/PopoverTrigger.astro",
    )?.contents;
    const astroPortal = astroFiles.find(
      (file) => file.path === "popover/PopoverPortal.astro",
    )?.contents;
    const astroPositioner = astroFiles.find(
      (file) => file.path === "popover/PopoverPositioner.astro",
    )?.contents;
    const astroPopup = astroFiles.find(
      (file) => file.path === "popover/PopoverPopup.astro",
    )?.contents;
    const astroArrow = astroFiles.find(
      (file) => file.path === "popover/PopoverArrow.astro",
    )?.contents;
    const astroBackdrop = astroFiles.find(
      (file) => file.path === "popover/PopoverBackdrop.astro",
    )?.contents;
    const astroClose = astroFiles.find(
      (file) => file.path === "popover/PopoverClose.astro",
    )?.contents;
    const astroViewport = astroFiles.find(
      (file) => file.path === "popover/PopoverViewport.astro",
    )?.contents;
    const astroIndex = astroFiles.find((file) => file.path === "popover/index.ts")?.contents;
    const reactRoot = reactFiles.find((file) => file.path === "popover/PopoverRoot.tsx")?.contents;
    const reactTrigger = reactFiles.find(
      (file) => file.path === "popover/PopoverTrigger.tsx",
    )?.contents;
    const reactPortal = reactFiles.find(
      (file) => file.path === "popover/PopoverPortal.tsx",
    )?.contents;
    const reactPositioner = reactFiles.find(
      (file) => file.path === "popover/PopoverPositioner.tsx",
    )?.contents;
    const reactPopup = reactFiles.find(
      (file) => file.path === "popover/PopoverPopup.tsx",
    )?.contents;
    const reactArrow = reactFiles.find(
      (file) => file.path === "popover/PopoverArrow.tsx",
    )?.contents;
    const reactBackdrop = reactFiles.find(
      (file) => file.path === "popover/PopoverBackdrop.tsx",
    )?.contents;
    const reactClose = reactFiles.find(
      (file) => file.path === "popover/PopoverClose.tsx",
    )?.contents;
    const reactViewport = reactFiles.find(
      (file) => file.path === "popover/PopoverViewport.tsx",
    )?.contents;
    const reactIndex = reactFiles.find((file) => file.path === "popover/index.ts")?.contents;

    expect(astroRoot).toContain('import { createPopover } from "@starwind-ui/runtime/popover";');
    expect(astroRoot).toContain("defaultOpen = false");
    expect(astroRoot).toContain("closeOnEscape = true");
    expect(astroRoot).toContain("closeOnOutsideInteract = true");
    expect(astroRoot).toContain("modal = false");
    expect(astroRoot).toContain("openOnHover = false");
    expect(astroRoot).toContain("closeDelay = 200");
    expect(astroRoot).toContain('data-default-open={defaultOpen ? "true" : undefined}');
    expect(astroRoot).toContain('data-close-on-escape={closeOnEscape ? "true" : "false"}');
    expect(astroRoot).toContain(
      'data-close-on-outside-interact={closeOnOutsideInteract ? "true" : "false"}',
    );
    expect(astroRoot).toContain('data-modal={modal ? "true" : "false"}');
    expect(astroRoot).toContain('data-open-on-hover={openOnHover ? "true" : undefined}');
    expect(astroRoot).toContain("data-close-delay={closeDelay}");
    expect(astroRoot).toContain('data-state={defaultOpen ? "open" : "closed"}');
    expect(astroRoot).toContain(
      'getInitCandidates(event, "[data-sw-popover]").forEach((root) => createPopover(root));',
    );
    expect(astroRoot).toContain('document.addEventListener("astro:after-swap", setupPopovers);');
    expect(astroRoot).toContain('document.addEventListener("starwind:init", setupPopovers);');
    expect(astroTrigger).toContain("asChild ? (");
    expect(astroTrigger).toContain("data-sw-popover-trigger");
    expect(astroTrigger).toContain("data-as-child");
    expect(astroTrigger).toContain('aria-haspopup="dialog"');
    expect(astroTrigger).toContain('aria-expanded="false"');
    expect(astroTrigger).toContain('type="button"');
    expect(astroPortal).toContain("data-sw-popover-portal");
    expect(astroPositioner).toContain('side = "bottom"');
    expect(astroPositioner).toContain('align = "center"');
    expect(astroPositioner).toContain("sideOffset = 4");
    expect(astroPositioner).toContain("avoidCollisions = true");
    expect(astroPositioner).toContain('collisionStrategy = "initial-placement"');
    expect(astroPositioner).toContain("data-sw-popover-positioner");
    expect(astroPositioner).toContain("data-side={side}");
    expect(astroPositioner).toContain("data-align={align}");
    expect(astroPositioner).toContain("data-side-offset={sideOffset}");
    expect(astroPositioner).toContain('data-avoid-collisions={avoidCollisions ? "true" : "false"}');
    expect(astroPositioner).toContain("data-collision-strategy={collisionStrategy}");
    expect(astroPopup).toContain('side = "bottom"');
    expect(astroPopup).toContain('align = "center"');
    expect(astroPopup).toContain("sideOffset = 4");
    expect(astroPopup).toContain('collisionStrategy = "initial-placement"');
    expect(astroPopup).toContain('role="dialog"');
    expect(astroPopup).toContain('tabindex="-1"');
    expect(astroPopup).toContain('data-state="closed"');
    expect(astroPopup).toContain("data-side={side}");
    expect(astroPopup).toContain("data-align={align}");
    expect(astroPopup).toContain("data-side-offset={sideOffset}");
    expect(astroPopup).toContain('data-avoid-collisions={avoidCollisions ? "true" : "false"}');
    expect(astroPopup).toContain("data-collision-strategy={collisionStrategy}");
    expect(astroPopup).toContain("hidden");
    expect(astroArrow).toContain("data-sw-popover-arrow");
    expect(astroBackdrop).toContain("data-sw-popover-backdrop");
    expect(astroBackdrop).toContain('data-state="closed"');
    expect(astroBackdrop).toContain("hidden");
    expect(astroClose).toContain('type="button"');
    expect(astroClose).toContain("data-sw-popover-close");
    expect(astroViewport).toContain("data-sw-popover-viewport");
    expect(astroIndex).toContain("Root: PopoverRoot");
    expect(astroIndex).toContain("Positioner: PopoverPositioner");
    expect(astroIndex).toContain("Arrow: PopoverArrow");
    expect(astroIndex).toContain("Viewport: PopoverViewport");
    expect(astroIndex).toContain(
      "export type { PopoverCloseCompleteDetails, PopoverOpenChangeDetails }",
    );

    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.

    expect(compactCode(reactTrigger)).toContain(compactCode("asChild?: boolean;"));
    expect(compactCode(reactTrigger)).toContain(compactCode("useComposedRefs"));
    expect(compactCode(reactTrigger)).toContain(compactCode("React.cloneElement"));
    expect(compactCode(reactTrigger)).toContain(compactCode('"aria-haspopup": "dialog"'));
    expect(compactCode(reactTrigger)).toContain(compactCode('"aria-expanded": "false"'));
    expect(compactCode(reactTrigger)).toContain(compactCode('"data-state": "closed"'));
    expect(compactCode(reactTrigger)).toContain(compactCode('type="button"'));
    expect(compactCode(reactPortal)).toContain(compactCode("data-sw-popover-portal"));
    expect(compactCode(reactPositioner)).toContain(compactCode("PopoverPositionerProps"));
    expect(compactCode(reactPositioner)).toContain(
      compactCode(
        '{ side = "bottom", align = "center", sideOffset = 4, avoidCollisions = true, collisionStrategy = "initial-placement", ...props }',
      ),
    );
    expect(compactCode(reactPositioner)).toContain(compactCode("data-sw-popover-positioner"));
    expect(compactCode(reactPositioner)).toContain(compactCode("data-side={side}"));
    expect(compactCode(reactPositioner)).toContain(compactCode("data-align={align}"));
    expect(compactCode(reactPositioner)).toContain(compactCode("data-side-offset={sideOffset}"));
    expect(compactCode(reactPositioner)).toContain(
      compactCode("data-avoid-collisions={String(avoidCollisions)}"),
    );
    expect(compactCode(reactPositioner)).toContain(
      compactCode("data-collision-strategy={collisionStrategy}"),
    );
    expect(compactCode(reactPopup)).toContain(compactCode("PopoverPopupProps"));
    expect(compactCode(reactPopup)).toContain(
      compactCode(
        '{ side = "bottom", align = "center", sideOffset = 4, avoidCollisions = true, collisionStrategy = "initial-placement", ...props }',
      ),
    );
    expect(compactCode(reactPopup)).toContain(compactCode("data-sw-popover-popup"));
    expect(compactCode(reactPopup)).toContain(compactCode('role="dialog"'));
    expect(compactCode(reactPopup)).toContain(compactCode("tabIndex={-1}"));
    expect(compactCode(reactPopup)).toContain(compactCode('data-state="closed"'));
    expect(compactCode(reactPopup)).toContain(compactCode("data-side={side}"));
    expect(compactCode(reactPopup)).toContain(compactCode("data-align={align}"));
    expect(compactCode(reactPopup)).toContain(compactCode("data-side-offset={sideOffset}"));
    expect(compactCode(reactPopup)).toContain(
      compactCode("data-avoid-collisions={String(avoidCollisions)}"),
    );
    expect(compactCode(reactPopup)).toContain(
      compactCode("data-collision-strategy={collisionStrategy}"),
    );
    expect(compactCode(reactPopup)).toContain(compactCode("hidden"));
    expect(compactCode(reactArrow)).toContain(compactCode("data-sw-popover-arrow"));
    expect(compactCode(reactBackdrop)).toContain(compactCode("data-sw-popover-backdrop"));
    expect(compactCode(reactBackdrop)).toContain(compactCode('data-state="closed"'));
    expect(compactCode(reactBackdrop)).toContain(compactCode("hidden"));
    expect(compactCode(reactClose)).toContain(compactCode('type="button"'));
    expect(compactCode(reactClose)).toContain(compactCode("data-sw-popover-close"));
    expect(compactCode(reactViewport)).toContain(compactCode("data-sw-popover-viewport"));
    expect(compactCode(reactIndex)).toContain(compactCode("Root: PopoverRoot"));
    expect(compactCode(reactIndex)).toContain(compactCode("Positioner: PopoverPositioner"));
    expect(compactCode(reactIndex)).toContain(compactCode("Arrow: PopoverArrow"));
    expect(compactCode(reactIndex)).toContain(compactCode("Viewport: PopoverViewport"));
    expect(compactCode(reactIndex)).toContain(
      compactCode("export type { PopoverCloseCompleteDetails, PopoverOpenChangeDetails }"),
    );
  });

  it("keeps presence floating overlay matching, floating facts, and file shape in its family module", () => {
    const plan = buildGenericAdapterPlan(popoverRuntimeAdapterContract);
    const nearMiss: GenericAdapterPlan = {
      ...plan,
      floating: {
        ...plan.floating!,
        popupPart: "positioner",
      },
    };
    const reorderedPlan: GenericAdapterPlan = {
      ...plan,
      parts: [plan.parts[1]!, plan.parts[0]!, ...plan.parts.slice(2)],
      props: [plan.props[1]!, plan.props[0]!, ...plan.props.slice(2)],
      runtime: {
        ...plan.runtime,
        optionProps: [
          plan.runtime.optionProps![1]!,
          plan.runtime.optionProps![0]!,
          ...plan.runtime.optionProps!.slice(2),
        ],
      },
    };

    expect(presenceFloatingOverlayAdapterFamilyPlan.matches(plan)).toBe(true);
    expect(presenceFloatingOverlayAdapterFamilyPlan.matches(nearMiss)).toBe(false);
    expect(presenceFloatingOverlayAdapterFamilyPlan.matches(reorderedPlan)).toBe(true);

    const outputModel = presenceFloatingOverlayAdapterFamilyPlan.buildOutputModel(plan);

    expect(outputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "index",
    ]);
    expect(
      outputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([
      expect.objectContaining({ kind: "presence-floating-overlay", part: "root" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "trigger" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "portal" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "positioner" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "popup" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "arrow" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "backdrop" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "title" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "description" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "close" }),
      expect.objectContaining({ kind: "presence-floating-overlay", part: "viewport" }),
    ]);
    expect(outputModel.files.find((file) => file.kind === "index")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({
          facts: expect.objectContaining({
            displayName: "Popover",
            floating: {
              anchorPart: "trigger",
              optionProps: ["side", "align", "sideOffset", "avoidCollisions", "collisionStrategy"],
              popupPart: "popup",
              portalPart: "portal",
              positionerPart: "positioner",
            },
            props: expect.objectContaining({
              closeDelay: expect.objectContaining({ name: "closeDelay" }),
              collisionStrategy: expect.objectContaining({ name: "collisionStrategy" }),
              openOnHover: expect.objectContaining({ name: "openOnHover" }),
              side: expect.objectContaining({ name: "side" }),
            }),
            runtime: expect.objectContaining({
              factory: "createPopover",
              importSource: "@starwind-ui/runtime/popover",
            }),
          }),
          kind: "presence-floating-overlay",
        }),
      }),
    );
    expect(() => presenceFloatingOverlayAdapterFamilyPlan.buildOutputModel(nearMiss)).toThrow(
      "Popover generic adapter plan is not a presence-floating-overlay plan.",
    );
  });

  it("keeps generated Popover files equal to the checked-in packages", async () => {
    const outputRoot = mkdtempSync(join(tmpdir(), "starwind-popover-floating-overlay-plan-"));
    const astroOutputRoot = join(outputRoot, "astro");
    const reactOutputRoot = join(outputRoot, "react");

    try {
      await generateAstroPrimitive(
        "popover",
        astroOutputRoot,
        createAstroHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
        createTsHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
      );
      await generateReactPrimitive(
        "popover",
        reactOutputRoot,
        createTsHeader("scripts/portable-runtime/generate-react-wrappers.ts"),
      );

      for (const [targetPackage, fileName] of [
        ["astro", "PopoverArrow.astro"],
        ["astro", "PopoverBackdrop.astro"],
        ["astro", "PopoverClose.astro"],
        ["astro", "PopoverDescription.astro"],
        ["astro", "PopoverPopup.astro"],
        ["astro", "PopoverPortal.astro"],
        ["astro", "PopoverPositioner.astro"],
        ["astro", "PopoverRoot.astro"],
        ["astro", "PopoverTitle.astro"],
        ["astro", "PopoverTrigger.astro"],
        ["astro", "PopoverViewport.astro"],
        ["astro", "index.ts"],
        ["react", "PopoverArrow.tsx"],
        ["react", "PopoverBackdrop.tsx"],
        ["react", "PopoverClose.tsx"],
        ["react", "PopoverDescription.tsx"],
        ["react", "PopoverPopup.tsx"],
        ["react", "PopoverPortal.tsx"],
        ["react", "PopoverPositioner.tsx"],
        ["react", "PopoverRoot.tsx"],
        ["react", "PopoverTitle.tsx"],
        ["react", "PopoverTrigger.tsx"],
        ["react", "PopoverViewport.tsx"],
        ["react", "index.ts"],
      ] as const) {
        const packagePath = join(
          process.cwd(),
          "packages",
          targetPackage,
          "src",
          "popover",
          fileName,
        );
        const targetOutputRoot = targetPackage === "astro" ? astroOutputRoot : reactOutputRoot;
        const generatedPath = join(targetOutputRoot, "popover", fileName);

        expect(
          normalizePrintedComparison(
            await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath),
          ),
        ).toBe(normalizePrintedComparison(await readFormattedOutput(packagePath)));
      }
    } finally {
      rmSync(outputRoot, { recursive: true, force: true });
    }
  });

  it("keeps native overlay matching, variant facts, and file shape in its family module", () => {
    for (const { contract, displayName, expectedFileCount, expectedParts, sideDefault } of [
      {
        contract: dialogRuntimeAdapterContract,
        displayName: "Dialog",
        expectedFileCount: 8,
        expectedParts: ["root", "trigger", "backdrop", "popup", "title", "description", "close"],
        sideDefault: undefined,
      },
      {
        contract: alertDialogRuntimeAdapterContract,
        displayName: "AlertDialog",
        expectedFileCount: 10,
        expectedParts: [
          "root",
          "trigger",
          "portal",
          "backdrop",
          "viewport",
          "popup",
          "title",
          "description",
          "close",
        ],
        sideDefault: undefined,
      },
      {
        contract: drawerRuntimeAdapterContract,
        displayName: "Drawer",
        expectedFileCount: 10,
        expectedParts: [
          "root",
          "trigger",
          "portal",
          "backdrop",
          "viewport",
          "popup",
          "title",
          "description",
          "close",
        ],
        sideDefault: '"right"',
      },
    ] as const) {
      const plan = buildGenericAdapterPlan(contract);
      const nearMiss: GenericAdapterPlan = {
        ...plan,
        presence: {
          ...plan.presence!,
          unmountPolicy: "runtime-owned-visibility",
        },
      };

      expect(nativeOverlayAdapterFamilyPlan.matches(plan)).toBe(true);
      expect(nativeOverlayAdapterFamilyPlan.matches(nearMiss)).toBe(false);

      const outputModel = nativeOverlayAdapterFamilyPlan.buildOutputModel(plan);

      expect(outputModel.files).toHaveLength(expectedFileCount);
      expect(
        outputModel.files
          .filter((file) => file.kind === "component")
          .map((file) => file.component.family),
      ).toEqual(
        expectedParts.map((part) => expect.objectContaining({ kind: "native-overlay", part })),
      );
      expect(outputModel.files.find((file) => file.kind === "index")).toEqual(
        expect.objectContaining({
          family: expect.objectContaining({
            facts: expect.objectContaining({
              displayName,
              props: expect.objectContaining({
                side:
                  sideDefault === undefined
                    ? undefined
                    : expect.objectContaining({ defaultValue: sideDefault }),
              }),
              runtime: expect.objectContaining({
                factory: plan.runtime.factory,
                importSource: plan.runtime.importSource,
              }),
              sideDefault,
            }),
            kind: "native-overlay",
          }),
        }),
      );
      expect(() => nativeOverlayAdapterFamilyPlan.buildOutputModel(nearMiss)).toThrow(
        `${displayName} generic adapter plan is not a native-overlay plan.`,
      );
    }
  });

  it("keeps generated Alert Dialog and Drawer files equal to the checked-in packages", async () => {
    const outputRoot = mkdtempSync(join(tmpdir(), "starwind-overlay-variant-plan-"));
    const astroOutputRoot = join(outputRoot, "astro");
    const reactOutputRoot = join(outputRoot, "react");

    try {
      await generateAstroPrimitive(
        "alert-dialog",
        astroOutputRoot,
        createAstroHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
        createTsHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
      );
      await generateReactPrimitive(
        "alert-dialog",
        reactOutputRoot,
        createTsHeader("scripts/portable-runtime/generate-react-wrappers.ts"),
      );
      await generateAstroPrimitive(
        "drawer",
        astroOutputRoot,
        createAstroHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
        createTsHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
      );
      await generateReactPrimitive(
        "drawer",
        reactOutputRoot,
        createTsHeader("scripts/portable-runtime/generate-react-wrappers.ts"),
      );

      for (const [targetPackage, component, fileName] of [
        ["astro", "alert-dialog", "AlertDialogBackdrop.astro"],
        ["astro", "alert-dialog", "AlertDialogClose.astro"],
        ["astro", "alert-dialog", "AlertDialogDescription.astro"],
        ["astro", "alert-dialog", "AlertDialogPopup.astro"],
        ["astro", "alert-dialog", "AlertDialogPortal.astro"],
        ["astro", "alert-dialog", "AlertDialogRoot.astro"],
        ["astro", "alert-dialog", "AlertDialogTitle.astro"],
        ["astro", "alert-dialog", "AlertDialogTrigger.astro"],
        ["astro", "alert-dialog", "AlertDialogViewport.astro"],
        ["astro", "alert-dialog", "index.ts"],
        ["react", "alert-dialog", "AlertDialogBackdrop.tsx"],
        ["react", "alert-dialog", "AlertDialogClose.tsx"],
        ["react", "alert-dialog", "AlertDialogDescription.tsx"],
        ["react", "alert-dialog", "AlertDialogPopup.tsx"],
        ["react", "alert-dialog", "AlertDialogPortal.tsx"],
        ["react", "alert-dialog", "AlertDialogRoot.tsx"],
        ["react", "alert-dialog", "AlertDialogTitle.tsx"],
        ["react", "alert-dialog", "AlertDialogTrigger.tsx"],
        ["react", "alert-dialog", "AlertDialogViewport.tsx"],
        ["react", "alert-dialog", "index.ts"],
        ["astro", "drawer", "DrawerBackdrop.astro"],
        ["astro", "drawer", "DrawerClose.astro"],
        ["astro", "drawer", "DrawerDescription.astro"],
        ["astro", "drawer", "DrawerPopup.astro"],
        ["astro", "drawer", "DrawerPortal.astro"],
        ["astro", "drawer", "DrawerRoot.astro"],
        ["astro", "drawer", "DrawerTitle.astro"],
        ["astro", "drawer", "DrawerTrigger.astro"],
        ["astro", "drawer", "DrawerViewport.astro"],
        ["astro", "drawer", "index.ts"],
        ["react", "drawer", "DrawerBackdrop.tsx"],
        ["react", "drawer", "DrawerClose.tsx"],
        ["react", "drawer", "DrawerDescription.tsx"],
        ["react", "drawer", "DrawerPopup.tsx"],
        ["react", "drawer", "DrawerPortal.tsx"],
        ["react", "drawer", "DrawerRoot.tsx"],
        ["react", "drawer", "DrawerTitle.tsx"],
        ["react", "drawer", "DrawerTrigger.tsx"],
        ["react", "drawer", "DrawerViewport.tsx"],
        ["react", "drawer", "index.ts"],
      ] as const) {
        const packagePath = join(
          process.cwd(),
          "packages",
          targetPackage,
          "src",
          component,
          fileName,
        );
        const targetOutputRoot = targetPackage === "astro" ? astroOutputRoot : reactOutputRoot;
        const generatedPath = join(targetOutputRoot, component, fileName);

        expect(
          normalizePrintedComparison(
            await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath),
          ),
        ).toBe(normalizePrintedComparison(await readFormattedOutput(packagePath)));
      }
    } finally {
      rmSync(outputRoot, { recursive: true, force: true });
    }
  });

  it("prints the current Avatar primitive media-status behavior through the generic adapter plan", () => {
    const plan = buildGenericAdapterPlan(avatarRuntimeAdapterContract);
    const astroOutputModel = buildTargetGenericAdapterOutputModel(plan, "astro");
    const reactOutputModel = buildTargetGenericAdapterOutputModel(plan, "react");
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(plan.parts.map((part) => part.name)).toEqual(["root", "image", "fallback"]);
    expect(plan.stateModels).toEqual([
      expect.objectContaining({
        initialAttribute: "data-image-loading-status",
        name: "imageLoadingStatus",
        runtimeGetter: "getImageLoadingStatus",
        runtimeSetter: "setImageLoadingStatus",
        valueType: "AvatarImageLoadingStatus",
      }),
    ]);
    expect(GENERIC_ADAPTER_OUTPUT_MODEL_COMPONENTS).toContain("avatar");
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "component",
      "index",
    ]);
    expect(reactOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "component",
      "index",
    ]);
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([
      expect.objectContaining({ kind: "media-status", part: "root" }),
      expect.objectContaining({ kind: "media-status", part: "image" }),
      expect.objectContaining({ kind: "media-status", part: "fallback" }),
    ]);
    expect(astroOutputModel.files.find((file) => file.kind === "index")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({ kind: "media-status" }),
      }),
    );
    expect(reactOutputModel.files.find((file) => file.kind === "index")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({ kind: "media-status" }),
      }),
    );

    expect(astroFiles).toEqual(printAstroGenericAdapterOutputModel(plan));
    expect(reactFiles).toEqual(printReactGenericAdapterOutputModel(plan));

    const astroRoot = astroFiles.find((file) => file.path === "avatar/AvatarRoot.astro")?.contents;
    const astroImage = astroFiles.find(
      (file) => file.path === "avatar/AvatarImage.astro",
    )?.contents;
    const astroFallback = astroFiles.find(
      (file) => file.path === "avatar/AvatarFallback.astro",
    )?.contents;
    const astroIndex = astroFiles.find((file) => file.path === "avatar/index.ts")?.contents;
    const reactRoot = reactFiles.find((file) => file.path === "avatar/AvatarRoot.tsx")?.contents;
    const reactImage = reactFiles.find((file) => file.path === "avatar/AvatarImage.tsx")?.contents;
    const reactFallback = reactFiles.find(
      (file) => file.path === "avatar/AvatarFallback.tsx",
    )?.contents;
    const reactIndex = reactFiles.find((file) => file.path === "avatar/index.ts")?.contents;

    expect(astroRoot).toContain('<span data-sw-avatar data-image-loading-status="idle" {...rest}>');
    expect(astroRoot).toContain('import { createAvatar } from "@starwind-ui/runtime/avatar";');
    expect(astroRoot).toContain("querySelectorAll<HTMLElement>(selector)");
    expect(astroRoot).toContain("owner && knownRoots.has(owner)");
    expect(astroRoot).toContain("if (knownRoots.has(root)) instance.refresh();");
    expect(astroImage).toContain('import { Image } from "astro:assets";');
    expect(astroImage).toContain("Either 'src' or 'image' is required for an avatar image.");
    expect(astroImage).toContain("data-sw-avatar-image");
    expect(astroImage).toContain('data-image-loading-status="idle"');
    expect(astroImage).toContain('visibility: "hidden"');
    expect(astroImage).toContain("style={initialStyle}");
    expect(astroImage).not.toMatch(/^\s+hidden(?:=|\s*$)/m);
    expect(astroImage).toContain("width={64}");
    expect(astroFallback).toContain("delay?: number;");
    expect(astroFallback).toContain("data-delay={delay}");
    expect(astroFallback).toContain("hidden={delay !== undefined}");
    expect(astroIndex).toContain('import AvatarFallback from "./AvatarFallback.astro";');
    expect(astroIndex).toContain('import AvatarImage from "./AvatarImage.astro";');
    expect(astroIndex).toContain('import AvatarRoot from "./AvatarRoot.astro";');
    expect(astroIndex).toContain("const Avatar = {");
    expect(astroIndex).toContain("Root: AvatarRoot");
    expect(astroIndex).toContain("Image: AvatarImage");
    expect(astroIndex).toContain("Fallback: AvatarFallback");
    expect(astroIndex).toContain("export { Avatar, AvatarFallback, AvatarImage, AvatarRoot };");
    expect(astroIndex).toContain("export default Avatar;");

    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.

    expect(compactCode(reactImage)).toContain(compactCode("React.useContext(MediaStatusContext)"));
    expect(compactCode(reactFallback)).toContain(compactCode("[requestRefresh, delay]"));
    expect(compactCode(reactImage)).toContain(compactCode("AvatarImageLoadingStatus,"));
    expect(compactCode(reactImage)).toContain(compactCode("AvatarLoadingStatusChangeDetails,"));
    expect(compactCode(reactImage)).toContain(
      compactCode('style={{ ...style, visibility: "hidden" }}'),
    );
    expect(compactCode(reactImage)).toContain(compactCode("hidden={false}"));
    expect(compactCode(reactImage)).not.toContain(compactCode("node.hidden"));
    expect(compactCode(reactImage)).toContain(
      compactCode(
        'root.addEventListener("starwind:loading-status-change", handleLoadingStatusChange);',
      ),
    );
    expect(compactCode(reactImage)).toContain(
      compactCode("onLoadingStatusChangeRef.current?.(details.status, details);"),
    );
    expect(compactCode(reactImage)).toContain(
      compactCode('const status = root.getAttribute("data-image-loading-status")'),
    );
    expect(compactCode(reactImage)).toContain(
      compactCode(
        'root.removeEventListener("starwind:loading-status-change", handleLoadingStatusChange);',
      ),
    );
    expect(compactCode(reactImage)).toContain(
      compactCode(
        'onLoadingStatusChangeRef.current?.(status, { previousStatus: "idle", status });',
      ),
    );
    expect(compactCode(reactFallback)).toContain(compactCode("delay?: number;"));
    expect(compactCode(reactFallback)).toContain(
      compactCode("node.hidden = delay !== undefined || Boolean(hidden);"),
    );
    expect(compactCode(reactFallback)).toContain(compactCode("data-delay={delay}"));
    expect(compactCode(reactIndex)).toContain(
      compactCode('import AvatarFallback from "./AvatarFallback";'),
    );
    expect(compactCode(reactIndex)).toContain(
      compactCode('import AvatarImage from "./AvatarImage";'),
    );
    expect(compactCode(reactIndex)).toContain(
      compactCode('import AvatarRoot from "./AvatarRoot";'),
    );
    expect(compactCode(reactIndex)).toContain(compactCode("const Avatar = {"));
    expect(compactCode(reactIndex)).toContain(compactCode("Root: AvatarRoot"));
    expect(compactCode(reactIndex)).toContain(compactCode("Image: AvatarImage"));
    expect(compactCode(reactIndex)).toContain(compactCode("Fallback: AvatarFallback"));
    expect(compactCode(reactIndex)).toContain(
      compactCode("export { Avatar, AvatarFallback, AvatarImage, AvatarRoot };"),
    );
    expect(compactCode(reactIndex)).toContain(compactCode("export default Avatar;"));
  });

  it("keeps Avatar media-status matching, facts, and output modeling in one family module", () => {
    const plan = buildGenericAdapterPlan(avatarRuntimeAdapterContract);
    const nearMiss: GenericAdapterPlan = {
      ...plan,
      component: "avatar-near-miss",
    };

    expect(mediaStatusAdapterFamilyPlan.matches(plan)).toBe(true);
    expect(mediaStatusAdapterFamilyPlan.matches(nearMiss)).toBe(false);

    const outputModel = mediaStatusAdapterFamilyPlan.buildOutputModel(plan);

    expect(outputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "component",
      "index",
    ]);
    expect(
      outputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([
      expect.objectContaining({ kind: "media-status", part: "root" }),
      expect.objectContaining({ kind: "media-status", part: "image" }),
      expect.objectContaining({ kind: "media-status", part: "fallback" }),
    ]);
    expect(outputModel.files.find((file) => file.kind === "index")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({ kind: "media-status" }),
      }),
    );
    expect(() => mediaStatusAdapterFamilyPlan.buildOutputModel(nearMiss)).toThrow(
      "Avatar generic adapter plan is not a media-status plan.",
    );
  });

  it("prints Scroll Area viewport measurement behavior through the Adapter Output Model", () => {
    const plan = buildGenericAdapterPlan(scrollAreaRuntimeAdapterContract);
    const astroOutputModel = buildTargetGenericAdapterOutputModel(plan, "astro");
    const reactOutputModel = buildTargetGenericAdapterOutputModel(plan, "react");
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(plan.category).toBe("viewport-measurement");
    expect(GENERIC_ADAPTER_OUTPUT_MODEL_COMPONENTS).toContain("scroll-area");
    expect(astroOutputModel).toEqual(reactOutputModel);
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "index",
    ]);
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([
      expect.objectContaining({ kind: "viewport-measurement", part: "root" }),
      expect.objectContaining({ kind: "viewport-measurement", part: "viewport" }),
      expect.objectContaining({ kind: "viewport-measurement", part: "content" }),
      expect.objectContaining({ kind: "viewport-measurement", part: "scrollbar" }),
      expect.objectContaining({ kind: "viewport-measurement", part: "thumb" }),
      expect.objectContaining({ kind: "viewport-measurement", part: "corner" }),
    ]);
    expect(astroOutputModel.files.find((file) => file.kind === "index")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({ kind: "viewport-measurement" }),
      }),
    );

    expect(astroFiles).toEqual(printAstroGenericAdapterOutputModel(plan));
    expect(reactFiles).toEqual(printReactGenericAdapterOutputModel(plan));

    const astroRoot = astroFiles.find(
      (file) => file.path === "scroll-area/ScrollAreaRoot.astro",
    )?.contents;
    const astroViewport = astroFiles.find(
      (file) => file.path === "scroll-area/ScrollAreaViewport.astro",
    )?.contents;
    const astroContent = astroFiles.find(
      (file) => file.path === "scroll-area/ScrollAreaContent.astro",
    )?.contents;
    const astroScrollbar = astroFiles.find(
      (file) => file.path === "scroll-area/ScrollAreaScrollbar.astro",
    )?.contents;
    const astroCorner = astroFiles.find(
      (file) => file.path === "scroll-area/ScrollAreaCorner.astro",
    )?.contents;
    const reactRoot = reactFiles.find(
      (file) => file.path === "scroll-area/ScrollAreaRoot.tsx",
    )?.contents;
    const reactViewport = reactFiles.find(
      (file) => file.path === "scroll-area/ScrollAreaViewport.tsx",
    )?.contents;
    const reactContent = reactFiles.find(
      (file) => file.path === "scroll-area/ScrollAreaContent.tsx",
    )?.contents;
    const reactScrollbar = reactFiles.find(
      (file) => file.path === "scroll-area/ScrollAreaScrollbar.tsx",
    )?.contents;
    const reactCorner = reactFiles.find(
      (file) => file.path === "scroll-area/ScrollAreaCorner.tsx",
    )?.contents;
    const reactIndex = reactFiles.find((file) => file.path === "scroll-area/index.ts")?.contents;

    expect(astroRoot).toContain(
      'import { createScrollArea } from "@starwind-ui/runtime/scroll-area";',
    );
    expect(astroRoot).toContain("getOverflowEdgeThresholdAttributes(overflowEdgeThreshold)");
    expect(astroRoot).toContain("data-overflow-edge-threshold={thresholdAttributes.shared}");
    expect(astroRoot).toContain(
      "data-overflow-edge-threshold-x-start={thresholdAttributes.xStart}",
    );
    expect(astroRoot).toContain("normalizeOverflowEdgeThresholdValue");
    expect(astroRoot).toContain('document.addEventListener("starwind:init", setupScrollAreas);');
    expect(astroViewport).toContain("data-sw-scroll-area-viewport");
    expect(astroViewport).toContain('tabindex="-1"');
    expect(astroViewport).toContain("const { style, ...rest } = Astro.props;");
    expect(astroViewport).toContain(
      'const viewportStyle = [style, "overflow: scroll"].filter(Boolean).join("; ");',
    );
    expect(astroViewport).toContain("style={viewportStyle}");
    expect(astroContent).toContain('role="presentation"');
    expect(astroScrollbar).toContain("type ScrollAreaOrientation");
    expect(astroScrollbar).toContain("keepMounted?: boolean;");
    expect(astroScrollbar).toContain('data-keep-mounted={keepMounted ? "" : undefined}');
    expect(astroScrollbar).toContain("data-orientation={orientation}");
    expect(astroScrollbar).toContain('aria-hidden="true"');
    expect(astroCorner).toContain('aria-hidden="true"');

    expect(compactCode(reactRoot)).toContain(
      compactCode('import { createScrollArea } from "@starwind-ui/runtime/scroll-area";'),
    );
    expect(compactCode(reactRoot)).toContain(
      compactCode("const instance = createScrollArea(root);"),
    );
    expect(compactCode(reactRoot)).toContain(compactCode("instance.refresh();"));
    expect(compactCode(reactRoot)).toContain(compactCode("instance.destroy();"));
    expect(compactCode(reactRoot)).toContain(
      compactCode("data-overflow-edge-threshold={thresholdAttributes.shared}"),
    );
    expect(compactCode(reactRoot)).toContain(compactCode("thresholdAttributes.xStart"));
    expect(compactCode(reactRoot)).toContain(compactCode("normalizeOverflowEdgeThresholdValue"));
    expect(compactCode(reactViewport)).toContain(compactCode("tabIndex={tabIndex ?? -1}"));
    expect(compactCode(reactViewport)).toContain(
      compactCode('style={{ ...style, overflow: "scroll" }}'),
    );
    expect(compactCode(reactContent)).toContain(compactCode('role="presentation"'));
    expect(compactCode(reactScrollbar)).toContain(compactCode("type ScrollAreaOrientation"));
    expect(compactCode(reactScrollbar)).toContain(compactCode("keepMounted?: boolean;"));
    expect(compactCode(reactScrollbar)).toContain(
      compactCode('data-keep-mounted={keepMounted ? "" : undefined}'),
    );
    expect(compactCode(reactScrollbar)).toContain(compactCode("data-orientation={orientation}"));
    expect(compactCode(reactScrollbar)).toContain(compactCode('aria-hidden="true"'));
    expect(compactCode(reactCorner)).toContain(compactCode('aria-hidden="true"'));
    expect(compactCode(reactIndex)).toContain(compactCode("Root: ScrollAreaRoot"));
    expect(compactCode(reactIndex)).toContain(compactCode("Viewport: ScrollAreaViewport"));
    expect(compactCode(reactIndex)).toContain(compactCode("Content: ScrollAreaContent"));
    expect(compactCode(reactIndex)).toContain(compactCode("Scrollbar: ScrollAreaScrollbar"));
    expect(compactCode(reactIndex)).toContain(compactCode("Thumb: ScrollAreaThumb"));
    expect(compactCode(reactIndex)).toContain(compactCode("Corner: ScrollAreaCorner"));
  });

  it("keeps viewport measurement matching, facts, and file shape in its family module", () => {
    const plan = buildGenericAdapterPlan(scrollAreaRuntimeAdapterContract);
    const nearMiss: GenericAdapterPlan = {
      ...plan,
      props: plan.props.map((prop) =>
        prop.name === "overflowEdgeThreshold" ? { ...prop, kind: "rendering" as const } : prop,
      ),
    };

    expect(viewportMeasurementAdapterFamilyPlan.matches(plan)).toBe(true);
    expect(viewportMeasurementAdapterFamilyPlan.matches(nearMiss)).toBe(false);

    const outputModel = viewportMeasurementAdapterFamilyPlan.buildOutputModel(plan);

    expect(outputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "component",
      "component",
      "component",
      "component",
      "index",
    ]);
    expect(
      outputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([
      expect.objectContaining({ kind: "viewport-measurement", part: "root" }),
      expect.objectContaining({ kind: "viewport-measurement", part: "viewport" }),
      expect.objectContaining({ kind: "viewport-measurement", part: "content" }),
      expect.objectContaining({ kind: "viewport-measurement", part: "scrollbar" }),
      expect.objectContaining({ kind: "viewport-measurement", part: "thumb" }),
      expect.objectContaining({ kind: "viewport-measurement", part: "corner" }),
    ]);
    expect(outputModel.files.find((file) => file.kind === "index")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({
          facts: expect.objectContaining({
            attrs: expect.objectContaining({
              overflowEdgeThresholdEdges: {
                xEnd: "data-overflow-edge-threshold-x-end",
                xStart: "data-overflow-edge-threshold-x-start",
                yEnd: "data-overflow-edge-threshold-y-end",
                yStart: "data-overflow-edge-threshold-y-start",
              },
            }),
            threshold: {
              attributesTypeName: "ScrollAreaOverflowEdgeThresholdAttributes",
              helperName: "getOverflowEdgeThresholdAttributes",
              normalizeHelperName: "normalizeOverflowEdgeThresholdValue",
              typeName: "ScrollAreaOverflowEdgeThreshold",
            },
          }),
          kind: "viewport-measurement",
        }),
      }),
    );
    expect(
      outputModel.files.find(
        (file) => file.kind === "component" && file.component.name === "ScrollAreaRoot",
      ),
    ).toEqual(
      expect.objectContaining({
        component: expect.objectContaining({
          props: [
            {
              kind: "unknown",
              name: "overflowEdgeThreshold",
              type: expect.stringContaining("xStart: number"),
            },
          ],
        }),
      }),
    );
    expect(() => viewportMeasurementAdapterFamilyPlan.buildOutputModel(nearMiss)).toThrow(
      "ScrollArea generic adapter plan is not a viewport-measurement plan.",
    );
  });

  it("keeps generated Scroll Area files equal to the checked-in packages", async () => {
    const outputRoot = mkdtempSync(join(tmpdir(), "starwind-scroll-area-plan-"));
    const astroOutputRoot = join(outputRoot, "astro");
    const reactOutputRoot = join(outputRoot, "react");

    try {
      await generateAstroPrimitive(
        "scroll-area",
        astroOutputRoot,
        createAstroHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
        createTsHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
      );
      await generateReactPrimitive(
        "scroll-area",
        reactOutputRoot,
        createTsHeader("scripts/portable-runtime/generate-react-wrappers.ts"),
      );

      const files = [
        ["astro", "ScrollAreaRoot.astro"],
        ["astro", "ScrollAreaViewport.astro"],
        ["astro", "ScrollAreaContent.astro"],
        ["astro", "ScrollAreaScrollbar.astro"],
        ["astro", "ScrollAreaThumb.astro"],
        ["astro", "ScrollAreaCorner.astro"],
        ["astro", "index.ts"],
        ["react", "ScrollAreaRoot.tsx"],
        ["react", "ScrollAreaViewport.tsx"],
        ["react", "ScrollAreaContent.tsx"],
        ["react", "ScrollAreaScrollbar.tsx"],
        ["react", "ScrollAreaThumb.tsx"],
        ["react", "ScrollAreaCorner.tsx"],
        ["react", "index.ts"],
      ] as const;

      for (const [framework, fileName] of files) {
        const outputPath = join(outputRoot, framework, "scroll-area", fileName);
        const packagePath = join(
          process.cwd(),
          "packages",
          framework,
          "src",
          "scroll-area",
          fileName,
        );

        expect(await formatGeneratedOutput(readFileSync(outputPath, "utf8"), packagePath)).toBe(
          await readFormattedOutput(packagePath),
        );
      }
    } finally {
      rmSync(outputRoot, { recursive: true, force: true });
    }
  });

  it("keeps viewport measurement output model matching on family shape instead of component id", () => {
    const plan = buildGenericAdapterPlan(syntheticViewportMeasurementContract);
    const astroOutputModel = buildTargetGenericAdapterOutputModel(plan, "astro");
    const reactOutputModel = buildTargetGenericAdapterOutputModel(plan, "react");
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(plan.component).toBe("synthetic-viewport-measurement");
    expect(plan.category).toBe("viewport-measurement");
    expect(astroOutputModel).toEqual(reactOutputModel);
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family?.kind),
    ).toEqual([
      "viewport-measurement",
      "viewport-measurement",
      "viewport-measurement",
      "viewport-measurement",
      "viewport-measurement",
      "viewport-measurement",
    ]);
    expect(
      astroFiles.find((file) => file.path.endsWith("SyntheticViewportRoot.astro"))?.contents,
    ).toContain(
      'import { createSyntheticViewport } from "@starwind-ui/runtime/synthetic-viewport";',
    );
    expect(
      reactFiles.find((file) => file.path.endsWith("SyntheticViewportRoot.tsx"))?.contents,
    ).toContain("type SyntheticViewportOverflowEdgeThreshold");
  });

  it("derives Button root names, element types, and public refs from the generic adapter plan", () => {
    const plan = buildGenericAdapterPlan(buttonRuntimeAdapterContract);
    const astroOutputModel = buildGenericAdapterOutputModel(plan);
    const reactOutputModel = buildGenericAdapterOutputModel(plan);
    const planDrivenButton = {
      ...plan,
      component: "action",
      displayName: "Action",
      exports: {
        ...plan.exports,
        members: plan.exports.members.map((member) =>
          member.part === "root" ? { ...member, name: "ActionSurface" } : member,
        ),
        namespace: "Action",
      },
      files: plan.files.map((file) =>
        file.kind === "part"
          ? { ...file, exportName: "ActionSurface", path: "button/ActionSurface" }
          : { ...file, exportName: "Action" },
      ),
      parts: plan.parts.map((part) =>
        part.name === "root" ? { ...part, defaultElement: "span" } : part,
      ),
      sourceContract: "action",
    } satisfies GenericAdapterPlan;

    expect(astroOutputModel).toEqual(reactOutputModel);
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual(["component", "index"]);
    const rootFile = astroOutputModel.files[0];
    expect(rootFile?.kind === "component" ? rootFile.component.family?.kind : undefined).toBe(
      "action-surface",
    );
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);

    const astroRoot = printAstroGenericAdapterOutputModel(planDrivenButton).find(
      (file) => file.path === "button/ActionSurface.astro",
    )?.contents;
    const reactRoot = printReactGenericAdapterOutputModel(planDrivenButton).find(
      (file) => file.path === "button/ActionSurface.tsx",
    )?.contents;

    expect(astroRoot).toContain('interface Props extends HTMLAttributes<"span">');
    expect(astroRoot).toContain("<span");
    expect(astroRoot).toContain("</span>");
    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.

    const noPublicRefButton = {
      ...plan,
      refs: [],
    } satisfies GenericAdapterPlan;

    expect(() => printReactGenericAdapterOutputModel(noPublicRefButton)).toThrow(
      "Button generic adapter plan does not match a structured Adapter Output Model family.",
    );
  });

  it("rejects action-surface near misses instead of truncating unsupported facts", () => {
    const plan = buildGenericAdapterPlan(buttonRuntimeAdapterContract);
    const extraProp = {
      ...plan,
      props: [...plan.props, { kind: "option", name: "variant", type: "string" }],
    } satisfies GenericAdapterPlan;
    const extraEvent = {
      ...plan,
      events: [
        {
          callbackProp: "onOpenChange",
          emitsFrom: "root",
          name: "open-change",
        },
      ],
    } satisfies GenericAdapterPlan;

    expect(isActionSurfaceOutputModelPlan(plan)).toBe(true);
    expect(isActionSurfaceOutputModelPlan(extraProp)).toBe(false);
    expect(isActionSurfaceOutputModelPlan(extraEvent)).toBe(false);
  });

  it("prints the current Progress primitive state and ARIA mapping through the range-status family", () => {
    const plan = buildGenericAdapterPlan(progressRuntimeAdapterContract);
    const astroOutputModel = buildTargetGenericAdapterOutputModel(plan, "astro");
    const reactOutputModel = buildTargetGenericAdapterOutputModel(plan, "react");
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(astroOutputModel).toEqual(reactOutputModel);
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "component",
      "component",
      "component",
      "index",
    ]);
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family?.kind),
    ).toEqual(["range-status", "range-status", "range-status", "range-status", "range-status"]);
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);

    expect(plan.stateModels).toEqual([
      expect.objectContaining({
        controlledProp: "value",
        initialAttribute: "data-value",
        name: "value",
        runtimeSetter: "setValue",
        valueType: "ProgressValue",
      }),
    ]);
    expect(plan.setters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: "setFormatOptions" }),
        expect.objectContaining({ method: "setValue" }),
      ]),
    );
    expect(plan.runtime.optionProps).toEqual([
      "format",
      "getAriaValueText",
      "locale",
      "max",
      "min",
      "value",
    ]);

    const astroRoot = astroFiles.find(
      (file) => file.path === "progress/ProgressRoot.astro",
    )?.contents;
    const astroValue = astroFiles.find(
      (file) => file.path === "progress/ProgressValue.astro",
    )?.contents;
    const astroLabel = astroFiles.find(
      (file) => file.path === "progress/ProgressLabel.astro",
    )?.contents;
    const reactRoot = reactFiles.find(
      (file) => file.path === "progress/ProgressRoot.tsx",
    )?.contents;
    const reactValue = reactFiles.find(
      (file) => file.path === "progress/ProgressValue.tsx",
    )?.contents;
    const reactLabel = reactFiles.find(
      (file) => file.path === "progress/ProgressLabel.tsx",
    )?.contents;

    expect(astroRoot).toContain('type Props = Omit<HTMLAttributes<"div">, "value"> & {');
    expect(astroRoot).toContain("const { max = 100, min = 0, value = null, ...rest }");
    expect(astroRoot).toContain("data-value={isIndeterminate ? undefined : value}");
    expect(astroRoot).toContain("data-min={min}");
    expect(astroRoot).toContain("data-max={max}");
    expect(astroRoot).toContain('data-indeterminate={isIndeterminate ? "" : undefined}');
    expect(astroRoot).toContain('role="progressbar"');
    expect(astroRoot).toContain("createProgress(root)");
    expect(astroValue).toContain("data-sw-progress-value");
    expect(astroValue).toContain('aria-hidden="true"');
    expect(astroValue).toContain('data-preserve-text={preserveText ? "" : undefined}');
    expect(astroLabel).toContain('role="presentation"');

    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.

    expect(compactCode(reactValue)).toContain(compactCode("data-sw-progress-value"));
    expect(compactCode(reactValue)).toContain(
      compactCode('data-preserve-text={children == null ? undefined : ""}'),
    );
    expect(compactCode(reactValue)).toContain(compactCode('aria-hidden="true"'));
    expect(compactCode(reactLabel)).toContain(compactCode('role="presentation"'));
  });

  it("derives Progress controlled prop and label role from the range-status family", () => {
    const plan = buildGenericAdapterPlan(progressRuntimeAdapterContract);
    const renamedValuePlan: GenericAdapterPlan = {
      ...plan,
      props: plan.props.map((prop) =>
        prop.name === "value" ? { ...prop, name: "currentValue" } : prop,
      ),
      setters: plan.setters.map((setter) =>
        "props" in setter && setter.props?.includes("value")
          ? {
              ...setter,
              props: setter.props.map((prop) => (prop === "value" ? "currentValue" : prop)) as [
                string,
                ...string[],
              ],
            }
          : setter,
      ),
      stateModels: plan.stateModels.map((stateModel) =>
        stateModel.name === "value"
          ? { ...stateModel, controlledProp: "currentValue" }
          : stateModel,
      ),
      runtime: {
        ...plan.runtime,
        optionProps: plan.runtime.optionProps?.map((prop) =>
          prop === "value" ? "currentValue" : prop,
        ),
      },
    };
    const renamedAstroRoot = printAstroGenericAdapterOutputModel(renamedValuePlan).find(
      (file) => file.path === "progress/ProgressRoot.astro",
    )?.contents;
    const renamedReactRoot = printReactGenericAdapterOutputModel(renamedValuePlan).find(
      (file) => file.path === "progress/ProgressRoot.tsx",
    )?.contents;

    expect(renamedAstroRoot).toContain(
      'type Props = Omit<HTMLAttributes<"div">, "currentValue"> & {',
    );
    expect(renamedAstroRoot).toContain(
      "const { max = 100, min = 0, currentValue = null, ...rest }",
    );
    expect(renamedAstroRoot).toContain("const isIndeterminate = currentValue == null;");
    expect(renamedAstroRoot).toContain("data-value={isIndeterminate ? undefined : currentValue}");
    assertTypeScriptModule(renamedReactRoot); // Shared lifecycle and browser tests cover the emitted behavior.

    const renamedRolePlan: GenericAdapterPlan = {
      ...plan,
      staticAttributes: plan.staticAttributes.map((attribute) =>
        attribute.part === "label" && attribute.name === "role"
          ? { ...attribute, value: "none" }
          : attribute,
      ),
    };
    const renamedAstroLabel = printAstroGenericAdapterOutputModel(renamedRolePlan).find(
      (file) => file.path === "progress/ProgressLabel.astro",
    )?.contents;
    const renamedReactLabel = printReactGenericAdapterOutputModel(renamedRolePlan).find(
      (file) => file.path === "progress/ProgressLabel.tsx",
    )?.contents;

    expect(renamedAstroLabel).toContain('role="none"');
    expect(compactCode(renamedReactLabel)).toContain(compactCode('role="none"'));

    const missingLabelRolePlan: GenericAdapterPlan = {
      ...plan,
      staticAttributes: plan.staticAttributes.filter(
        (attribute) => !(attribute.part === "label" && attribute.name === "role"),
      ),
    };

    expect(() => printAstroGenericAdapterOutputModel(missingLabelRolePlan)).toThrow(
      "Progress generic adapter plan is missing role attribute.",
    );
    expect(() => printReactGenericAdapterOutputModel(missingLabelRolePlan)).toThrow(
      "Progress generic adapter plan is missing role attribute.",
    );
  });

  it("matches Progress range-status value setter props by prop set rather than declaration order", () => {
    const plan = buildGenericAdapterPlan(progressRuntimeAdapterContract);
    const reorderedSetterPlan: GenericAdapterPlan = {
      ...plan,
      setters: plan.setters.map((setter) =>
        "props" in setter && setter.props !== undefined && setter.method === "setValue"
          ? {
              method: setter.method,
              props: [...setter.props].reverse() as [string, ...string[]],
              suppressesEmit: setter.suppressesEmit,
            }
          : setter,
      ),
    };

    const astroRoot = printAstroGenericAdapterOutputModel(reorderedSetterPlan).find(
      (file) => file.path === "progress/ProgressRoot.astro",
    )?.contents;
    const reactRoot = printReactGenericAdapterOutputModel(reorderedSetterPlan).find(
      (file) => file.path === "progress/ProgressRoot.tsx",
    )?.contents;

    expect(astroRoot).toContain("const { max = 100, min = 0, value = null, ...rest }");
    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.
  });

  it("prints Fieldset semantic grouping parts through the native-disabled output family", () => {
    const plan = buildGenericAdapterPlan(fieldsetRuntimeAdapterContract);
    const astroOutputModel = buildGenericAdapterOutputModel(plan);
    const reactOutputModel = buildGenericAdapterOutputModel(plan);
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(astroOutputModel).toEqual(reactOutputModel);
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "index",
    ]);
    expect(astroOutputModel.files.map((file) => String(file.kind))).not.toContain(
      "static-adapter-plan",
    );
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(
      astroOutputModel.files.map((file) =>
        file.kind === "component"
          ? file.component.family?.kind
          : file.kind === "index"
            ? file.family?.kind
            : undefined,
      ),
    ).toEqual(["native-disabled", "native-disabled", "native-disabled"]);

    expect(plan.parts).toEqual([
      expect.objectContaining({
        defaultElement: "fieldset",
        discoveryAttribute: "data-sw-fieldset",
        name: "root",
        ownsRuntime: true,
      }),
      expect.objectContaining({
        defaultElement: "div",
        discoveryAttribute: "data-sw-fieldset-legend",
        name: "legend",
      }),
    ]);
    expect(plan.staticAttributes).toEqual([
      expect.objectContaining({
        name: "data-disabled",
        part: "root",
        source: "prop",
      }),
    ]);
    expect(plan.refs).toEqual([
      { part: "root", public: true },
      { part: "legend", public: true },
    ]);
    expect(plan.exports.namespace).toBe("Fieldset");
    expect(plan.exports.members.map((member) => [member.part, member.name])).toEqual([
      ["root", "FieldsetRoot"],
      ["legend", "FieldsetLegend"],
    ]);
    expect(plan.setters).toEqual([expect.objectContaining({ method: "setDisabled" })]);

    const astroRoot = astroFiles.find(
      (file) => file.path === "fieldset/FieldsetRoot.astro",
    )?.contents;
    const astroLegend = astroFiles.find(
      (file) => file.path === "fieldset/FieldsetLegend.astro",
    )?.contents;
    const astroIndex = astroFiles.find((file) => file.path === "fieldset/index.ts")?.contents;
    const reactRoot = reactFiles.find(
      (file) => file.path === "fieldset/FieldsetRoot.tsx",
    )?.contents;
    const reactLegend = reactFiles.find(
      (file) => file.path === "fieldset/FieldsetLegend.tsx",
    )?.contents;
    const reactIndex = reactFiles.find((file) => file.path === "fieldset/index.ts")?.contents;

    expect(astroRoot).toContain('interface Props extends HTMLAttributes<"fieldset"> {');
    expect(astroRoot).toContain("disabled?: boolean;");
    expect(astroRoot).toContain("const { disabled = false, ...rest } = Astro.props;");
    expect(astroRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(astroRoot).toContain("disabled={disabled}");
    expect(astroRoot).toContain("createFieldset(root)");
    expect(astroLegend).toContain("<div data-sw-fieldset-legend {...rest}>");
    expect(astroIndex).toContain('import FieldsetLegend from "./FieldsetLegend.astro";');
    expect(astroIndex).toContain("Root: FieldsetRoot");

    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.

    expect(compactCode(reactLegend)).toContain(
      compactCode('export type FieldsetLegendProps = React.ComponentPropsWithoutRef<"div">;'),
    );
    expect(compactCode(reactLegend)).toContain(
      compactCode("<div data-sw-fieldset-legend ref={ref} {...props}>"),
    );
    expect(compactCode(reactIndex)).toContain(
      compactCode('import FieldsetRoot from "./FieldsetRoot";'),
    );
    expect(compactCode(reactIndex)).toContain(compactCode("Legend: FieldsetLegend"));
  });

  it("prints Input native value-control metadata through the native-input-value output family", () => {
    const plan = buildGenericAdapterPlan(inputRuntimeAdapterContract);
    const astroOutputModel = buildGenericAdapterOutputModel(plan);
    const reactOutputModel = buildGenericAdapterOutputModel(plan);
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(astroOutputModel).toEqual(reactOutputModel);
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual(["component", "index"]);
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(
      astroOutputModel.files.map((file) =>
        file.kind === "component"
          ? file.component.family?.kind
          : file.kind === "index"
            ? file.family?.kind
            : undefined,
      ),
    ).toEqual(["native-input-value", "native-input-value"]);

    expect(plan.parts).toEqual([
      expect.objectContaining({
        defaultElement: "input",
        discoveryAttribute: "data-sw-input",
        name: "root",
        ownsRuntime: true,
      }),
    ]);
    expect(plan.stateModels).toEqual([
      expect.objectContaining({
        controlledProp: "value",
        defaultProp: "defaultValue",
        name: "value",
        runtimeGetter: "getValue",
        runtimeSetter: "setValue",
        valueType: "InputValue",
      }),
    ]);
    expect(plan.events).toEqual([
      expect.objectContaining({
        callbackProp: "onValueChange",
        detailsType: "InputValueChangeDetails",
        name: "valueChange",
        valueProperty: "value",
        valueType: "string",
      }),
    ]);
    expect(plan.form).toEqual({
      fieldIntegration: true,
      props: ["name", "required", "value"],
    });
    expect(plan.staticAttributes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "data-disabled", part: "root", source: "prop" }),
        expect.objectContaining({ name: "disabled", part: "root", source: "prop" }),
        expect.objectContaining({ name: "value", part: "root", source: "prop" }),
      ]),
    );

    const astroRoot = astroFiles.find((file) => file.path === "input/InputRoot.astro")?.contents;
    const astroIndex = astroFiles.find((file) => file.path === "input/index.ts")?.contents;
    const reactRoot = reactFiles.find((file) => file.path === "input/InputRoot.tsx")?.contents;
    const reactIndex = reactFiles.find((file) => file.path === "input/index.ts")?.contents;

    expect(astroRoot).toContain('import type { InputValue } from "@starwind-ui/runtime/input";');
    expect(astroRoot).toContain(
      'interface Props extends Omit<HTMLAttributes<"input">, "children" | "defaultValue" | "value"> {',
    );
    expect(astroRoot).toContain("defaultValue?: InputValue;");
    expect(astroRoot).toContain("value?: InputValue;");
    expect(astroRoot).toContain(
      "const { defaultValue, disabled = false, value, ...rest } = Astro.props;",
    );
    expect(astroRoot).toContain("data-sw-input");
    expect(astroRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(astroRoot).toContain("disabled={disabled}");
    expect(astroRoot).toContain("value={value ?? defaultValue}");
    expect(astroRoot).toContain(`getInitCandidates(event, "[data-sw-input]").forEach((root) => {
      const instance = createInput(root);
      instance.refresh();
      knownRoots.add(root);
    });`);
    expect(astroIndex).toContain('import InputRoot from "./InputRoot.astro";');
    expect(astroIndex).toContain("Root: InputRoot");

    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.

    expect(compactCode(reactIndex)).toContain(compactCode('import InputRoot from "./InputRoot";'));
    expect(compactCode(reactIndex)).toContain(compactCode("Root: InputRoot"));
    expectPrintedFilesToMatchPackage("packages/astro/src", astroFiles);
    expectPrintedFilesToMatchPackage("packages/react/src", reactFiles);
  });

  it("fails loudly when native Input value-control plans leave the supported family boundary", () => {
    const plan = buildGenericAdapterPlan(inputRuntimeAdapterContract);
    const renamedValuePlan: GenericAdapterPlan = {
      ...plan,
      props: plan.props.map((prop) => {
        if (prop.name === "value") return { ...prop, name: "currentValue" };
        if (prop.name === "defaultValue") return { ...prop, name: "initialValue" };
        return prop;
      }),
      runtime: {
        ...plan.runtime,
        optionProps: plan.runtime.optionProps?.map((prop) => {
          if (prop === "value") return "currentValue";
          if (prop === "defaultValue") return "initialValue";
          return prop;
        }),
      },
      stateModels: plan.stateModels.map((stateModel) =>
        stateModel.name === "value"
          ? {
              ...stateModel,
              controlledProp: "currentValue",
              defaultProp: "initialValue",
            }
          : stateModel,
      ),
    };
    const nonStringEventPlan: GenericAdapterPlan = {
      ...plan,
      events: plan.events.map((event) =>
        event.name === "valueChange" ? { ...event, valueType: "number" } : event,
      ),
    };

    expect(() => printAstroGenericAdapterOutputModel(renamedValuePlan)).toThrow(
      'Input native input value plan requires controlledProp "value" and defaultProp "defaultValue".',
    );
    expect(() => printReactGenericAdapterOutputModel(renamedValuePlan)).toThrow(
      'Input native input value plan requires controlledProp "value" and defaultProp "defaultValue".',
    );
    expect(() => printAstroGenericAdapterOutputModel(nonStringEventPlan)).toThrow(
      'Input native input value plan requires valueChange valueType "string".',
    );
    expect(() => printReactGenericAdapterOutputModel(nonStringEventPlan)).toThrow(
      'Input native input value plan requires valueChange valueType "string".',
    );
  });

  it("prints Toggle boolean-control state mapping through the Generic Adapter Output Model path", () => {
    const plan = buildGenericAdapterPlan(toggleRuntimeAdapterContract);
    const astroOutputModel = buildTargetGenericAdapterOutputModel(plan, "astro");
    const reactOutputModel = buildTargetGenericAdapterOutputModel(plan, "react");
    const expectedAstroFiles = printAstroGenericAdapterOutputModel(plan);
    const expectedReactFiles = printReactGenericAdapterOutputModel(plan);
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(astroOutputModel).toEqual(reactOutputModel);
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual(["component", "index"]);
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    const rootModel = astroOutputModel.files.find((file) => file.kind === "component");
    const indexModel = astroOutputModel.files.find((file) => file.kind === "index");

    if (rootModel?.component.family?.kind !== "single-boolean-control") {
      throw new Error("Toggle root should use the single-boolean-control output model family.");
    }

    expect(rootModel.component.family.facts.attrs).toEqual(
      expect.objectContaining({
        ariaState: "aria-pressed",
        falsyPresence: "data-unpressed",
        truthyPresence: "data-pressed",
      }),
    );
    expect(rootModel.component.family.facts.render).toEqual({
      nonNativeElement: "span",
      nonNativeElementType: "HTMLSpanElement",
    });
    expect(rootModel.component.family.facts.initExclusionAttributes).toEqual([
      "data-sw-theme-toggle",
    ]);
    expect(rootModel.component.family.facts.runtime.destroyFunction).toBe("destroyToggles");
    expect(rootModel?.component.lifecycle?.factory).toBe("createToggle");
    expect(rootModel?.component.stateSync).toEqual([
      { setter: "setPressed", state: "pressed", valueProp: "pressed" },
    ]);
    expect(rootModel?.component.events).toEqual([
      expect.objectContaining({
        detailType: "TogglePressedChangeDetails",
        handlerProp: "onPressedChange",
        runtimeEvent: "pressedChange",
      }),
    ]);
    expect(indexModel?.family?.kind).toBe("single-boolean-control");
    expect(astroFiles).toEqual(expectedAstroFiles);
    expect(reactFiles.map((file) => file.path)).toEqual(
      expectedReactFiles.map((file) => file.path),
    );

    expect(plan.category).toBe("single-boolean-control");
    expect(plan.stateModels).toEqual([
      expect.objectContaining({
        controlledProp: "pressed",
        defaultProp: "defaultPressed",
        initialAttribute: "data-default-pressed",
        name: "pressed",
        runtimeGetter: "getPressed",
        runtimeSetter: "setPressed",
        valueType: "boolean",
      }),
    ]);
    expect(plan.events).toEqual([
      expect.objectContaining({
        callbackProp: "onPressedChange",
        detailsType: "TogglePressedChangeDetails",
        name: "pressedChange",
        valueProperty: "pressed",
      }),
    ]);
    expect(plan.runtime.optionProps).toEqual([
      "defaultPressed",
      "disabled",
      "nativeButton",
      "pressed",
      "syncGroup",
      "value",
    ]);
    expect(plan.staticAttributes.map((attribute) => attribute.name)).toEqual([
      "aria-disabled",
      "aria-pressed",
      "data-default-pressed",
      "data-disabled",
      "data-native",
      "data-pressed",
      "data-state",
      "data-sync-group",
      "data-unpressed",
      "data-value",
    ]);

    const astroRoot = astroFiles.find((file) => file.path === "toggle/ToggleRoot.astro")?.contents;
    const reactRoot = reactFiles.find((file) => file.path === "toggle/ToggleRoot.tsx")?.contents;

    expect(astroRoot).toContain('interface Props\n  extends Omit<\n    HTMLAttributes<"button">');
    expect(astroRoot).toContain('const Tag = nativeButton ? "button" : "span";');
    expect(astroRoot).toContain("const initialPressed = pressed ?? defaultPressed;");
    expect(astroRoot).toContain(
      'const defaultPressedAttribute = pressed === undefined && defaultPressed ? "true" : undefined;',
    );
    expect(astroRoot).toContain('aria-pressed={initialPressed ? "true" : "false"}');
    expect(astroRoot).toContain('data-state={initialPressed ? "on" : "off"}');
    expect(astroRoot).toContain('getInitCandidates(event, "[data-sw-toggle]")');
    expect(astroRoot).toContain("const setupToggles = (event?: Event)");
    expect(astroRoot).toContain('if (root.hasAttribute("data-sw-theme-toggle")) return;');
    expect(astroRoot).toContain("toggleInstances.add(createToggle(root));");
    expect(astroRoot).toContain('document.addEventListener("astro:before-swap", destroyToggles);');

    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.
  });

  it("keeps generated Toggle root and index files equal to the checked-in packages", async () => {
    const outputRoot = mkdtempSync(join(tmpdir(), "starwind-toggle-plan-"));
    const astroOutputRoot = join(outputRoot, "astro");
    const reactOutputRoot = join(outputRoot, "react");

    try {
      await generateAstroPrimitive(
        "toggle",
        astroOutputRoot,
        createAstroHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
        createTsHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
      );
      await generateReactPrimitive(
        "toggle",
        reactOutputRoot,
        createTsHeader("scripts/portable-runtime/generate-react-wrappers.ts"),
      );

      const files = [
        ["astro", "ToggleRoot.astro"],
        ["astro", "index.ts"],
        ["react", "ToggleRoot.tsx"],
        ["react", "index.ts"],
      ] as const;

      for (const [framework, fileName] of files) {
        const outputPath = join(outputRoot, framework, "toggle", fileName);
        const packagePath = join(process.cwd(), "packages", framework, "src", "toggle", fileName);

        expect(
          normalizePrintedComparison(
            await formatGeneratedOutput(readFileSync(outputPath, "utf8"), packagePath),
          ),
        ).toBe(normalizePrintedComparison(await readFormattedOutput(packagePath)));
      }
    } finally {
      rmSync(outputRoot, { recursive: true, force: true });
    }
  });

  it("prints Toggle Group grouped-value behavior through the Generic Adapter Output Model path", () => {
    const plan = buildGenericAdapterPlan(toggleGroupRuntimeAdapterContract);
    const astroOutputModel = buildTargetGenericAdapterOutputModel(plan, "astro");
    const reactOutputModel = buildTargetGenericAdapterOutputModel(plan, "react");
    const vueOutputModel = buildTargetGenericAdapterOutputModel(plan, "vue");
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(plan.category).toBe("controlled-value-group");
    expect(GENERIC_ADAPTER_OUTPUT_MODEL_COMPONENTS).toContain("toggle-group");
    expect(
      astroOutputModel.files.map(({ kind, path, target }) => ({ kind, path, target })),
    ).toEqual([
      { kind: "component", path: "toggle-group/ToggleGroupRoot", target: undefined },
      { kind: "index", path: "toggle-group/index.ts", target: "astro" },
    ]);
    expect(
      reactOutputModel.files.map(({ kind, path, target }) => ({ kind, path, target })),
    ).toEqual([
      { kind: "component", path: "toggle-group/ToggleGroupRoot", target: undefined },
      {
        kind: "helper",
        path: "toggle-group/ToggleGroupContext.tsx",
        target: "react",
      },
      { kind: "index", path: "toggle-group/index.ts", target: "react" },
    ]);
    expect(vueOutputModel.files.map(({ kind, path, target }) => ({ kind, path, target }))).toEqual([
      { kind: "component", path: "toggle-group/ToggleGroupRoot", target: undefined },
      { kind: "helper", path: "toggle-group/ToggleGroupContext.ts", target: "vue" },
      { kind: "index", path: "toggle-group/index.ts", target: "vue" },
    ]);
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family?.kind),
    ).toEqual(["grouped-value-control"]);
    expect(astroOutputModel.files.find((file) => file.kind === "index")?.family?.kind).toBe(
      "grouped-value-control",
    );
    expect(plan.files.map((file) => file.path)).toEqual([
      "toggle-group/ToggleGroupRoot",
      "toggle-group/index",
    ]);
    expect(plan.context).toEqual([
      {
        direction: "provides",
        name: "toggle-group",
        values: ["disabled", "loopFocus", "multiple", "orientation", "value"],
      },
    ]);
    expect(plan.stateModels).toEqual([
      expect.objectContaining({
        controlledProp: "value",
        defaultProp: "defaultValue",
        initialAttribute: "data-default-value",
        name: "value",
        runtimeGetter: "getValue",
        runtimeSetter: "setValue",
        valueType: "ToggleGroupValue",
      }),
    ]);
    expect(plan.events).toEqual([
      expect.objectContaining({
        callbackProp: "onValueChange",
        detailsType: "ToggleGroupValueChangeDetails",
        name: "valueChange",
        valueProperty: "value",
      }),
    ]);
    expect(plan.runtime.optionProps).toEqual([
      "defaultValue",
      "disabled",
      "loopFocus",
      "multiple",
      "orientation",
      "value",
    ]);

    const astroRoot = astroFiles.find(
      (file) => file.path === "toggle-group/ToggleGroupRoot.astro",
    )?.contents;
    const reactRoot = reactFiles.find(
      (file) => file.path === "toggle-group/ToggleGroupRoot.tsx",
    )?.contents;
    const reactContext = reactFiles.find(
      (file) => file.path === "toggle-group/ToggleGroupContext.tsx",
    )?.contents;
    const astroIndex = astroFiles.find((file) => file.path === "toggle-group/index.ts")?.contents;
    const reactIndex = reactFiles.find((file) => file.path === "toggle-group/index.ts")?.contents;

    expect(astroRoot).toContain('type Props = Omit<HTMLAttributes<"div">');
    expect(astroRoot).toContain("defaultValue?: string[];");
    expect(astroRoot).toContain('orientation?: "horizontal" | "vertical";');
    expect(astroRoot).toContain(
      "const defaultValueAttribute = defaultValue ? JSON.stringify(defaultValue) : undefined;",
    );
    expect(astroRoot).toContain("const valueAttribute = JSON.stringify(defaultValue ?? []);");
    expect(astroRoot).toContain("data-default-value={defaultValueAttribute}");
    expect(astroRoot).toContain('data-loop-focus={!loopFocus ? "false" : undefined}');
    expect(astroRoot).toContain('data-multiple={multiple ? "" : undefined}');
    expect(astroRoot).toContain("createToggleGroup(root)");

    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.

    expect(compactCode(reactContext)).toContain(
      compactCode(
        "export type ToggleGroupContextValue = {\n  disabled: boolean;\n  loopFocus: boolean;\n  multiple: boolean;\n  orientation:",
      ),
    );
    expect(compactCode(reactContext)).toContain(
      compactCode(
        "const ToggleGroupContext = React.createContext<ToggleGroupContextValue | undefined>(undefined);",
      ),
    );
    expect(compactCode(reactContext)).toContain(
      compactCode("function useToggleGroupContext(): ToggleGroupContextValue | undefined"),
    );

    expect(astroIndex).toContain('import ToggleGroupRoot from "./ToggleGroupRoot.astro";');
    expect(astroIndex).toContain("Root: ToggleGroupRoot");
    expect(astroIndex).toContain("export { ToggleGroup, ToggleGroupRoot };");
    expect(compactCode(reactIndex)).toContain(
      compactCode('import ToggleGroupRoot from "./ToggleGroupRoot";'),
    );
    expect(compactCode(reactIndex)).toContain(compactCode("Root: ToggleGroupRoot"));
    expect(compactCode(reactIndex)).toContain(compactCode("ToggleGroup,"));
    expect(compactCode(reactIndex)).toContain(compactCode("ToggleGroupContext,"));
    expect(compactCode(reactIndex)).toContain(compactCode("type ToggleGroupContextValue,"));
    expect(compactCode(reactIndex)).toContain(compactCode("ToggleGroupRoot,"));
    expect(compactCode(reactIndex)).toContain(compactCode("useToggleGroupContext,"));
  });

  it("keeps generated Toggle Group root files equal to the checked-in packages", async () => {
    const outputRoot = mkdtempSync(join(tmpdir(), "starwind-toggle-group-plan-"));

    try {
      await generateAstroPrimitive(
        "toggle-group",
        outputRoot,
        createAstroHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
        createTsHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
      );
      await generateReactPrimitive(
        "toggle-group",
        outputRoot,
        createTsHeader("scripts/portable-runtime/generate-react-wrappers.ts"),
      );

      const astroPackagePath = join(
        process.cwd(),
        "packages",
        "astro",
        "src",
        "toggle-group",
        "ToggleGroupRoot.astro",
      );
      const reactPackagePath = join(
        process.cwd(),
        "packages",
        "react",
        "src",
        "toggle-group",
        "ToggleGroupRoot.tsx",
      );

      expect(
        await formatGeneratedOutput(
          readFileSync(join(outputRoot, "toggle-group", "ToggleGroupRoot.astro"), "utf8"),
          astroPackagePath,
        ),
      ).toBe(await readFormattedOutput(astroPackagePath));
      expect(
        normalizePrintedComparison(
          await formatGeneratedOutput(
            readFileSync(join(outputRoot, "toggle-group", "ToggleGroupRoot.tsx"), "utf8"),
            reactPackagePath,
          ),
        ),
      ).toBe(normalizePrintedComparison(await readFormattedOutput(reactPackagePath)));
    } finally {
      rmSync(outputRoot, { recursive: true, force: true });
    }
  });

  it("prints Checkbox Group grouped-value behavior through the Generic Adapter Output Model path", () => {
    const plan = buildGenericAdapterPlan(checkboxGroupRuntimeAdapterContract);
    const astroOutputModel = buildTargetGenericAdapterOutputModel(plan, "astro");
    const reactOutputModel = buildTargetGenericAdapterOutputModel(plan, "react");
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(plan.category).toBe("controlled-value-group");
    expect(GENERIC_ADAPTER_OUTPUT_MODEL_COMPONENTS).toContain("checkbox-group");
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual(["component", "index"]);
    expect(reactOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "helper",
      "index",
    ]);
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(hasPrebuiltFile(reactOutputModel.files)).toBe(false);
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family?.kind),
    ).toEqual(["grouped-value-control"]);
    expect(
      reactOutputModel.files
        .filter((file) => file.kind === "helper")
        .map((file) => file.family?.kind),
    ).toEqual(["grouped-value-control"]);
    expect(reactOutputModel.files.find((file) => file.kind === "index")?.family?.kind).toBe(
      "grouped-value-control",
    );
    const reactIndexModel = reactOutputModel.files.find((file) => file.kind === "index");
    if (reactIndexModel?.kind !== "index") {
      throw new Error("Expected Checkbox Group React output model to include an index file.");
    }
    expect(reactIndexModel.exports.members).toEqual([
      { from: "./CheckboxGroupContext", name: "CheckboxGroupContext" },
      { from: "./CheckboxGroupContext", kind: "type", name: "CheckboxGroupContextValue" },
      { from: "./CheckboxGroupRoot", name: "CheckboxGroupRoot" },
      { from: "./CheckboxGroupContext", name: "useCheckboxGroupContext" },
    ]);
    expect(plan.files.map((file) => file.path)).toEqual([
      "checkbox-group/CheckboxGroupRoot",
      "checkbox-group/index",
    ]);
    expect(plan.context).toEqual([
      {
        direction: "provides",
        name: "checkbox-group",
        values: ["disabled", "value"],
      },
    ]);
    expect(plan.stateModels).toEqual([
      expect.objectContaining({
        controlledProp: "value",
        defaultProp: "defaultValue",
        initialAttribute: "data-default-value",
        name: "value",
        runtimeGetter: "getValue",
        runtimeSetter: "setValue",
        valueType: "CheckboxGroupValue",
      }),
    ]);
    expect(plan.events).toEqual([
      expect.objectContaining({
        callbackProp: "onValueChange",
        detailsType: "CheckboxGroupValueChangeDetails",
        name: "valueChange",
        valueProperty: "value",
      }),
    ]);
    expect(plan.runtime.optionProps).toEqual(["defaultValue", "disabled", "value"]);
    expect(astroFiles.map((file) => file.path)).toEqual([
      "checkbox-group/CheckboxGroupRoot.astro",
      "checkbox-group/index.ts",
    ]);
    expect(reactFiles.map((file) => file.path)).toEqual([
      "checkbox-group/CheckboxGroupRoot.tsx",
      "checkbox-group/CheckboxGroupContext.tsx",
      "checkbox-group/index.ts",
    ]);

    const astroRoot = astroFiles.find(
      (file) => file.path === "checkbox-group/CheckboxGroupRoot.astro",
    )?.contents;
    const reactRoot = reactFiles.find(
      (file) => file.path === "checkbox-group/CheckboxGroupRoot.tsx",
    )?.contents;
    const reactContext = reactFiles.find(
      (file) => file.path === "checkbox-group/CheckboxGroupContext.tsx",
    )?.contents;
    const astroIndex = astroFiles.find((file) => file.path === "checkbox-group/index.ts")?.contents;
    const reactIndex = reactFiles.find((file) => file.path === "checkbox-group/index.ts")?.contents;

    expect(astroRoot).toContain('type Props = HTMLAttributes<"div"> & {');
    expect(astroRoot).toContain("defaultValue?: string[];");
    expect(astroRoot).toContain("disabled?: boolean;");
    expect(astroRoot).toContain(
      "const defaultValueAttribute = defaultValue ? JSON.stringify(defaultValue) : undefined;",
    );
    expect(astroRoot).toContain("const valueAttribute = JSON.stringify(defaultValue ?? []);");
    expect(astroRoot).toContain("data-sw-checkbox-group");
    expect(astroRoot).toContain("data-default-value={defaultValueAttribute}");
    expect(astroRoot).toContain("data-value={valueAttribute}");
    expect(astroRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(astroRoot).toContain("createCheckboxGroup(root)");

    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.

    expect(compactCode(reactContext)).toContain(
      compactCode('import type { CheckboxGroupValue } from "@starwind-ui/runtime/checkbox-group";'),
    );
    expect(compactCode(reactContext)).toContain(
      compactCode("export type CheckboxGroupContextValue = {"),
    );
    expect(compactCode(reactContext)).toContain(compactCode("disabled: boolean;"));
    expect(compactCode(reactContext)).toContain(compactCode("value: CheckboxGroupValue;"));
    expect(compactCode(reactContext)).toContain(
      compactCode(
        "const CheckboxGroupContext = React.createContext<CheckboxGroupContextValue | undefined>(undefined);",
      ),
    );
    expect(compactCode(reactContext)).toContain(compactCode("function useCheckboxGroupContext()"));

    expect(astroIndex).toContain('import CheckboxGroupRoot from "./CheckboxGroupRoot.astro";');
    expect(astroIndex).toContain("Root: CheckboxGroupRoot");
    expect(astroIndex).toContain("export { CheckboxGroup, CheckboxGroupRoot };");
    expect(compactCode(reactIndex)).toContain(
      compactCode(
        'import {\n  CheckboxGroupContext,\n  type CheckboxGroupContextValue,\n  useCheckboxGroupContext,\n} from "./CheckboxGroupContext";',
      ),
    );
    expect(compactCode(reactIndex)).toContain(
      compactCode('import CheckboxGroupRoot from "./CheckboxGroupRoot";'),
    );
    expect(compactCode(reactIndex)).toContain(compactCode("Root: CheckboxGroupRoot"));
    expect(compactCode(reactIndex)).toContain(compactCode("CheckboxGroupContext,"));
    expect(compactCode(reactIndex)).toContain(compactCode("type CheckboxGroupContextValue,"));
    expect(compactCode(reactIndex)).toContain(compactCode("CheckboxGroupRoot,"));
    expect(compactCode(reactIndex)).toContain(compactCode("useCheckboxGroupContext,"));
    expect(compactCode(reactIndex)).toContain(compactCode("export default CheckboxGroup;"));
  });

  it("keeps generated Checkbox Group root and context files equal to the checked-in packages", async () => {
    const outputRoot = mkdtempSync(join(tmpdir(), "starwind-checkbox-group-plan-"));

    try {
      await generateAstroPrimitive(
        "checkbox-group",
        outputRoot,
        createAstroHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
        createTsHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
      );
      await generateReactPrimitive(
        "checkbox-group",
        outputRoot,
        createTsHeader("scripts/portable-runtime/generate-react-wrappers.ts"),
      );

      const astroRootPath = join(
        process.cwd(),
        "packages",
        "astro",
        "src",
        "checkbox-group",
        "CheckboxGroupRoot.astro",
      );
      const reactRootPath = join(
        process.cwd(),
        "packages",
        "react",
        "src",
        "checkbox-group",
        "CheckboxGroupRoot.tsx",
      );
      const reactContextPath = join(
        process.cwd(),
        "packages",
        "react",
        "src",
        "checkbox-group",
        "CheckboxGroupContext.tsx",
      );

      expect(
        await formatGeneratedOutput(
          readFileSync(join(outputRoot, "checkbox-group", "CheckboxGroupRoot.astro"), "utf8"),
          astroRootPath,
        ),
      ).toBe(await readFormattedOutput(astroRootPath));
      expect(
        normalizePrintedComparison(
          await formatGeneratedOutput(
            readFileSync(join(outputRoot, "checkbox-group", "CheckboxGroupRoot.tsx"), "utf8"),
            reactRootPath,
          ),
        ),
      ).toBe(normalizePrintedComparison(await readFormattedOutput(reactRootPath)));
      expect(
        await formatGeneratedOutput(
          readFileSync(join(outputRoot, "checkbox-group", "CheckboxGroupContext.tsx"), "utf8"),
          reactContextPath,
        ),
      ).toBe(await readFormattedOutput(reactContextPath));
    } finally {
      rmSync(outputRoot, { recursive: true, force: true });
    }
  });

  it("prints Radio Group grouped-value behavior through the Generic Adapter Output Model path", () => {
    const plan = buildGenericAdapterPlan(radioGroupRuntimeAdapterContract);
    const astroOutputModel = buildTargetGenericAdapterOutputModel(plan, "astro");
    const reactOutputModel = buildTargetGenericAdapterOutputModel(plan, "react");
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(plan.category).toBe("controlled-value-group");
    expect(GENERIC_ADAPTER_OUTPUT_MODEL_COMPONENTS).toContain("radio-group");
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual(["component", "index"]);
    expect(reactOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "helper",
      "index",
    ]);
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(hasPrebuiltFile(reactOutputModel.files)).toBe(false);
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family?.kind),
    ).toEqual(["grouped-value-control"]);
    expect(
      reactOutputModel.files
        .filter((file) => file.kind === "helper")
        .map((file) => file.family?.kind),
    ).toEqual(["grouped-value-control"]);
    const reactIndexModel = reactOutputModel.files.find((file) => file.kind === "index");
    if (reactIndexModel?.kind !== "index") {
      throw new Error("Expected Radio Group React output model to include an index file.");
    }
    expect(reactIndexModel.family?.kind).toBe("grouped-value-control");
    expect(reactIndexModel.exports.members).toEqual([
      { from: "./RadioGroupContext", name: "RadioGroupContext" },
      { from: "./RadioGroupContext", kind: "type", name: "RadioGroupContextValue" },
      { from: "./RadioGroupRoot", name: "RadioGroupRoot" },
      { from: "./RadioGroupContext", name: "useRadioGroupContext" },
    ]);
    expect(plan.files.map((file) => file.path)).toEqual([
      "radio-group/RadioGroupRoot",
      "radio-group/index",
    ]);
    expect(plan.form).toEqual(
      expect.objectContaining({
        fieldIntegration: true,
        props: ["form", "name", "required", "value"],
      }),
    );
    expect(plan.context).toEqual([
      {
        direction: "provides",
        name: "radio-group",
        values: ["disabled", "form", "name", "readOnly", "required", "value"],
      },
    ]);
    expect(plan.stateModels).toEqual([
      expect.objectContaining({
        controlledProp: "value",
        defaultProp: "defaultValue",
        initialAttribute: "data-default-value",
        name: "value",
        runtimeGetter: "getValue",
        runtimeSetter: "setValue",
        valueType: "RadioGroupValue",
      }),
    ]);
    expect(plan.events).toEqual([
      expect.objectContaining({
        callbackProp: "onValueChange",
        detailsType: "RadioGroupValueChangeDetails",
        name: "valueChange",
        valueProperty: "value",
        valueType: "string",
      }),
    ]);
    expect(plan.runtime.optionProps).toEqual([
      "defaultValue",
      "disabled",
      "form",
      "name",
      "orientation",
      "readOnly",
      "required",
      "value",
    ]);
    expect(astroFiles.map((file) => file.path)).toEqual([
      "radio-group/RadioGroupRoot.astro",
      "radio-group/index.ts",
    ]);
    expect(reactFiles.map((file) => file.path)).toEqual([
      "radio-group/RadioGroupRoot.tsx",
      "radio-group/RadioGroupContext.tsx",
      "radio-group/index.ts",
    ]);

    const astroRoot = astroFiles.find(
      (file) => file.path === "radio-group/RadioGroupRoot.astro",
    )?.contents;
    const reactRoot = reactFiles.find(
      (file) => file.path === "radio-group/RadioGroupRoot.tsx",
    )?.contents;
    const reactContext = reactFiles.find(
      (file) => file.path === "radio-group/RadioGroupContext.tsx",
    )?.contents;
    const reactIndex = reactFiles.find((file) => file.path === "radio-group/index.ts")?.contents;

    expect(astroRoot).toContain('type Props = Omit<HTMLAttributes<"div">, "defaultValue"> & {');
    expect(astroRoot).toContain("defaultValue?: string;");
    expect(astroRoot).toContain('orientation?: "horizontal" | "vertical";');
    expect(astroRoot).toContain("const renderedValue = value ?? defaultValue;");
    expect(astroRoot).toContain("data-sw-radio-group");
    expect(astroRoot).toContain("data-default-value={defaultValue}");
    expect(astroRoot).toContain("data-orientation={orientation}");
    expect(astroRoot).toContain("data-value={renderedValue}");
    expect(astroRoot).toContain('aria-disabled={disabled ? "true" : undefined}');
    expect(astroRoot).toContain("aria-orientation={orientation}");
    expect(astroRoot).toContain('aria-readonly={readOnly ? "true" : undefined}');
    expect(astroRoot).toContain('aria-required={required ? "true" : undefined}');
    expect(astroRoot).toContain("createRadioGroup(root)");

    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.

    expect(compactCode(reactContext)).toContain(
      compactCode('import type { RadioGroupValue } from "@starwind-ui/runtime/radio-group";'),
    );
    expect(compactCode(reactContext)).toContain(
      compactCode("export type RadioGroupContextValue = {"),
    );
    expect(compactCode(reactContext)).toContain(compactCode("disabled: boolean;"));
    expect(compactCode(reactContext)).toContain(compactCode("form?: string;"));
    expect(compactCode(reactContext)).toContain(compactCode("name?: string;"));
    expect(compactCode(reactContext)).toContain(compactCode("readOnly: boolean;"));
    expect(compactCode(reactContext)).toContain(compactCode("required: boolean;"));
    expect(compactCode(reactContext)).toContain(compactCode("value: RadioGroupValue;"));
    expect(compactCode(reactContext)).toContain(compactCode("function useRadioGroupContext()"));

    expect(compactCode(reactIndex)).toContain(
      compactCode(
        'import {\n  RadioGroupContext,\n  type RadioGroupContextValue,\n  useRadioGroupContext,\n} from "./RadioGroupContext";',
      ),
    );
    expect(compactCode(reactIndex)).toContain(
      compactCode('import RadioGroupRoot from "./RadioGroupRoot";'),
    );
    expect(compactCode(reactIndex)).toContain(compactCode("Root: RadioGroupRoot"));
    expect(compactCode(reactIndex)).toContain(compactCode("RadioGroupContext,"));
    expect(compactCode(reactIndex)).toContain(compactCode("type RadioGroupContextValue,"));
    expect(compactCode(reactIndex)).toContain(compactCode("RadioGroupRoot,"));
    expect(compactCode(reactIndex)).toContain(compactCode("useRadioGroupContext,"));
  });

  it("keeps generated Radio Group root, context, and index files equal to the checked-in packages", async () => {
    const outputRoot = mkdtempSync(join(tmpdir(), "starwind-radio-group-plan-"));
    const astroOutputRoot = join(outputRoot, "astro");
    const reactOutputRoot = join(outputRoot, "react");

    try {
      await generateAstroPrimitive(
        "radio-group",
        astroOutputRoot,
        createAstroHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
        createTsHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
      );
      await generateReactPrimitive(
        "radio-group",
        reactOutputRoot,
        createTsHeader("scripts/portable-runtime/generate-react-wrappers.ts"),
      );

      const astroRootPath = join(
        process.cwd(),
        "packages",
        "astro",
        "src",
        "radio-group",
        "RadioGroupRoot.astro",
      );
      const reactRootPath = join(
        process.cwd(),
        "packages",
        "react",
        "src",
        "radio-group",
        "RadioGroupRoot.tsx",
      );
      const reactContextPath = join(
        process.cwd(),
        "packages",
        "react",
        "src",
        "radio-group",
        "RadioGroupContext.tsx",
      );
      const reactIndexPath = join(
        process.cwd(),
        "packages",
        "react",
        "src",
        "radio-group",
        "index.ts",
      );
      const astroIndexPath = join(
        process.cwd(),
        "packages",
        "astro",
        "src",
        "radio-group",
        "index.ts",
      );

      expect(
        await formatGeneratedOutput(
          readFileSync(join(astroOutputRoot, "radio-group", "RadioGroupRoot.astro"), "utf8"),
          astroRootPath,
        ),
      ).toBe(await readFormattedOutput(astroRootPath));
      expect(
        await formatGeneratedOutput(
          readFileSync(join(reactOutputRoot, "radio-group", "RadioGroupRoot.tsx"), "utf8"),
          reactRootPath,
        ),
      ).toBe(await readFormattedOutput(reactRootPath));
      expect(
        await formatGeneratedOutput(
          readFileSync(join(reactOutputRoot, "radio-group", "RadioGroupContext.tsx"), "utf8"),
          reactContextPath,
        ),
      ).toBe(await readFormattedOutput(reactContextPath));
      expect(
        await formatGeneratedOutput(
          readFileSync(join(reactOutputRoot, "radio-group", "index.ts"), "utf8"),
          reactIndexPath,
        ),
      ).toBe(await readFormattedOutput(reactIndexPath));
      expect(
        await formatGeneratedOutput(
          readFileSync(join(astroOutputRoot, "radio-group", "index.ts"), "utf8"),
          astroIndexPath,
        ),
      ).toBe(await readFormattedOutput(astroIndexPath));
    } finally {
      rmSync(outputRoot, { recursive: true, force: true });
    }
  });

  it("prints Collapsible disclosure/presence behavior through the Generic Adapter Output Model path", () => {
    const plan = buildGenericAdapterPlan(collapsibleRuntimeAdapterContract);
    const astroOutputModel = buildTargetGenericAdapterOutputModel(plan, "astro");
    const reactOutputModel = buildTargetGenericAdapterOutputModel(plan, "react");
    const expectedAstroFiles = printAstroGenericAdapterOutputModel(plan);
    const expectedReactFiles = printReactGenericAdapterOutputModel(plan);
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(astroOutputModel).toEqual(reactOutputModel);
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "component",
      "index",
    ]);
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    const componentModels = astroOutputModel.files.filter((file) => file.kind === "component");
    const rootModel = componentModels.find((file) => file.component.family?.part === "root");
    const triggerModel = componentModels.find((file) => file.component.family?.part === "trigger");
    const panelModel = componentModels.find((file) => file.component.family?.part === "panel");
    const indexModel = astroOutputModel.files.find((file) => file.kind === "index");

    expect(rootModel?.component.family?.kind).toBe("disclosure-presence");
    expect(rootModel?.component.lifecycle?.factory).toBe("createCollapsible");
    expect(rootModel?.component.stateSync).toEqual([
      { setter: "setOpen", state: "open", valueProp: "open" },
    ]);
    const triggerRender = triggerModel?.component.render;
    expect(triggerRender?.kind).toBe("element");
    if (triggerRender?.kind === "element") {
      expect(triggerRender.children).toEqual([{ kind: "slot" }]);
    }
    expect(panelModel?.component.family?.kind).toBe("disclosure-presence");
    if (panelModel?.component.family?.kind === "disclosure-presence") {
      expect(panelModel.component.family.facts.attrs.panelHidden).toBe("hidden");
    }
    expect(indexModel?.family?.kind).toBe("disclosure-presence");
    expect(astroFiles).toEqual(expectedAstroFiles);
    expect(reactFiles).toEqual(expectedReactFiles);

    expect(plan.category).toBe("presence-disclosure-control");
    expect(plan.files.map((file) => file.path)).toEqual([
      "collapsible/CollapsibleRoot",
      "collapsible/CollapsibleTrigger",
      "collapsible/CollapsiblePanel",
      "collapsible/index",
    ]);
    expect(plan.presence).toEqual({
      initialHiddenParts: ["panel"],
      unmountPolicy: "runtime-owned-visibility",
    });
    expect(plan.stateModels).toEqual([
      expect.objectContaining({
        controlledProp: "open",
        defaultProp: "defaultOpen",
        initialAttribute: "data-default-open",
        name: "open",
        runtimeGetter: "getOpen",
        runtimeSetter: "setOpen",
        valueType: "boolean",
      }),
    ]);
    expect(plan.events).toEqual([
      expect.objectContaining({
        callbackProp: "onOpenChange",
        callbackTiming: "before-state-commit",
        cancelable: true,
        detailsType: "CollapsibleOpenChangeDetails",
        name: "openChange",
        valueProperty: "open",
      }),
    ]);
    expect(plan.runtime.optionProps).toEqual(["defaultOpen", "disabled", "open"]);

    const astroRoot = astroFiles.find(
      (file) => file.path === "collapsible/CollapsibleRoot.astro",
    )?.contents;
    const astroTrigger = astroFiles.find(
      (file) => file.path === "collapsible/CollapsibleTrigger.astro",
    )?.contents;
    const astroPanel = astroFiles.find(
      (file) => file.path === "collapsible/CollapsiblePanel.astro",
    )?.contents;
    const reactRoot = reactFiles.find(
      (file) => file.path === "collapsible/CollapsibleRoot.tsx",
    )?.contents;
    const reactTrigger = reactFiles.find(
      (file) => file.path === "collapsible/CollapsibleTrigger.tsx",
    )?.contents;
    const reactPanel = reactFiles.find(
      (file) => file.path === "collapsible/CollapsiblePanel.tsx",
    )?.contents;
    const astroIndex = astroFiles.find((file) => file.path === "collapsible/index.ts")?.contents;
    const reactIndex = reactFiles.find((file) => file.path === "collapsible/index.ts")?.contents;

    expect(astroRoot).toContain('type Props = HTMLAttributes<"div">');
    expect(astroRoot).toContain("defaultOpen?: boolean;");
    expect(astroRoot).toContain("disabled?: boolean;");
    expect(astroRoot).toContain('data-default-open={defaultOpen ? "true" : undefined}');
    expect(astroRoot).toContain('data-state={defaultOpen ? "open" : "closed"}');
    expect(astroRoot).toContain('getInitCandidates(event, "[data-sw-collapsible]")');
    expect(astroRoot).toContain("const setupCollapsibles = (event?: Event)");
    expect(astroRoot).toContain("createCollapsible(root)");

    expect(astroTrigger).toContain("asChild ? (");
    expect(astroTrigger).toContain("<div data-sw-collapsible-trigger data-as-child");
    expect(astroTrigger).toContain('aria-expanded="false"');
    expect(astroTrigger).toContain('<button type="button" data-sw-collapsible-trigger');

    expect(astroPanel).toContain("hiddenUntilFound?: boolean;");
    expect(astroPanel).toContain('data-hidden-until-found={hiddenUntilFound ? "" : undefined}');
    expect(astroPanel).toContain('hidden={hiddenUntilFound ? "until-found" : true}');

    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.

    expect(compactCode(reactTrigger)).toContain(
      compactCode(
        "import { getAsChildElement, getElementRef, mergeAsChildProps, useComposedRefs }",
      ),
    );
    expect(compactCode(reactTrigger)).toContain(compactCode("React.cloneElement(child"));
    expect(compactCode(reactTrigger)).toContain(
      compactCode("mergeAsChildProps({ ...triggerProps, className }, childProps"),
    );
    expect(compactCode(reactTrigger)).toContain(compactCode('"data-sw-collapsible-trigger": ""'));
    expect(compactCode(reactTrigger)).toContain(compactCode("ref: composedRef"));

    expect(compactCode(reactPanel)).toContain(compactCode("hiddenUntilFound?: boolean;"));
    expect(compactCode(reactPanel)).toContain(
      compactCode('node.setAttribute("hidden", "until-found");'),
    );
    expect(compactCode(reactPanel)).toContain(
      compactCode('node.getAttribute("hidden") === "until-found"'),
    );
    expect(compactCode(reactPanel)).toContain(compactCode("hidden"));

    expect(astroIndex).toContain('import CollapsiblePanel from "./CollapsiblePanel.astro";');
    expect(astroIndex).toContain("Panel: CollapsiblePanel");
    expect(astroIndex).toContain(
      "export { Collapsible, CollapsiblePanel, CollapsibleRoot, CollapsibleTrigger };",
    );
    expect(compactCode(reactIndex)).toContain(
      compactCode('import CollapsiblePanel from "./CollapsiblePanel";'),
    );
    expect(compactCode(reactIndex)).toContain(compactCode("Panel: CollapsiblePanel"));
    expect(compactCode(reactIndex)).toContain(
      compactCode("export { Collapsible, CollapsiblePanel, CollapsibleRoot, CollapsibleTrigger };"),
    );
  });

  it("does not treat drifted Collapsible anatomy as the disclosure/presence family", () => {
    const driftedRootContract = {
      ...collapsibleRuntimeAdapterContract,
      parts: collapsibleRuntimeAdapterContract.parts.map((part) =>
        part.name === "root" ? { ...part, defaultElement: "section" } : part,
      ),
    } as RuntimeAdapterContract;
    const plan = buildGenericAdapterPlan(driftedRootContract);

    expect(() => printReactGenericAdapterOutputModel(plan)).toThrow(
      /Collapsible generic adapter plan does not match a structured Adapter Output Model family\./,
    );
  });

  it("keeps generated Collapsible files equal to the checked-in packages", async () => {
    const outputRoot = mkdtempSync(join(tmpdir(), "starwind-collapsible-plan-"));
    const astroOutputRoot = join(outputRoot, "astro");
    const reactOutputRoot = join(outputRoot, "react");

    try {
      await generateAstroPrimitive(
        "collapsible",
        astroOutputRoot,
        createAstroHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
        createTsHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
      );
      await generateReactPrimitive(
        "collapsible",
        reactOutputRoot,
        createTsHeader("scripts/portable-runtime/generate-react-wrappers.ts"),
      );

      const files = [
        ["astro", "CollapsibleRoot.astro"],
        ["astro", "CollapsibleTrigger.astro"],
        ["astro", "CollapsiblePanel.astro"],
        ["astro", "index.ts"],
        ["react", "CollapsibleRoot.tsx"],
        ["react", "CollapsibleTrigger.tsx"],
        ["react", "CollapsiblePanel.tsx"],
        ["react", "index.ts"],
      ] as const;

      for (const [framework, fileName] of files) {
        const outputPath = join(outputRoot, framework, "collapsible", fileName);
        const packagePath = join(
          process.cwd(),
          "packages",
          framework,
          "src",
          "collapsible",
          fileName,
        );

        expect(
          normalizePrintedComparison(
            await formatGeneratedOutput(readFileSync(outputPath, "utf8"), packagePath),
          ),
        ).toBe(normalizePrintedComparison(await readFormattedOutput(packagePath)));
      }
    } finally {
      rmSync(outputRoot, { recursive: true, force: true });
    }
  });

  it("prints Form field-control coordinator behavior through the Adapter Output Model", () => {
    const plan = buildGenericAdapterPlan(formRuntimeAdapterContract);
    const astroOutputModel = buildTargetGenericAdapterOutputModel(plan, "astro");
    const reactOutputModel = buildTargetGenericAdapterOutputModel(plan, "react");
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(plan.category).toBe("field-control-coordinator");
    expect(GENERIC_ADAPTER_OUTPUT_MODEL_COMPONENTS).toContain("form");
    expect(astroOutputModel).toEqual(reactOutputModel);
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "index",
    ]);
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([
      expect.objectContaining({ kind: "form-field-coordinator", part: "root" }),
      expect.objectContaining({ kind: "form-field-coordinator", part: "error-summary" }),
    ]);
    const indexFile = astroOutputModel.files.find((file) => file.kind === "index");
    expect(indexFile).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({ kind: "form-field-coordinator" }),
        typeFacades: [
          expect.objectContaining({ exports: ["FormExternalErrorOptions"] }),
          expect.objectContaining({ exports: ["FormExternalErrors"] }),
          expect.objectContaining({ exports: ["FormInstance"] }),
          expect.objectContaining({ exports: ["FormOptions"] }),
          expect.objectContaining({ exports: ["FormResetValidationOptions"] }),
          expect.objectContaining({ exports: ["FormSchemaResult"] }),
          expect.objectContaining({ exports: ["FormValidateOptions"] }),
          expect.objectContaining({ exports: ["FormValidationCause"] }),
          expect.objectContaining({ exports: ["FormValidationOutcome"] }),
          expect.objectContaining({ exports: ["FormValidationTiming"] }),
          expect.objectContaining({ exports: ["FormValues"] }),
        ],
      }),
    );
    if (
      !indexFile ||
      indexFile.kind !== "index" ||
      indexFile.family?.kind !== "form-field-coordinator"
    ) {
      throw new Error("Expected Form index to use form-field-coordinator output model facts.");
    }
    expect(indexFile.family.facts.runtime.helperExports).toEqual([
      "createForm",
      "createFormSchemaValidator",
      "validateFormSchema",
    ]);
    for (const file of astroOutputModel.files) {
      if (file.kind !== "component") continue;

      expect(file.component.refs.map((ref) => ref.id)).toEqual(
        expect.arrayContaining([expect.stringMatching(/^[A-Za-z_$][\w$]*$/)]),
      );
    }
    expect(plan.files.map((file) => file.path)).toEqual([
      "form/FormRoot",
      "form/FormErrorSummary",
      "form/index",
    ]);
    expect(plan.parts.map((part) => part.name)).toEqual(["root", "error-summary"]);
    expect(plan.props.map((prop) => prop.name)).toEqual([
      "options",
      "errors",
      "errorOptions",
      "data-error-visibility",
      "data-revalidation-timing",
      "data-validation-timing",
      "errorVisibility",
      "revalidationTiming",
      "validationTiming",
    ]);
    expect(astroFiles).toEqual(printAstroGenericAdapterOutputModel(plan));
    expect(reactFiles).toEqual(printReactGenericAdapterOutputModel(plan));

    const astroRoot = astroFiles.find((file) => file.path === "form/FormRoot.astro")?.contents;
    const astroErrorSummary = astroFiles.find(
      (file) => file.path === "form/FormErrorSummary.astro",
    )?.contents;
    const reactRoot = reactFiles.find((file) => file.path === "form/FormRoot.tsx")?.contents;
    const reactErrorSummary = reactFiles.find(
      (file) => file.path === "form/FormErrorSummary.tsx",
    )?.contents;
    const astroIndex = astroFiles.find((file) => file.path === "form/index.ts")?.contents;
    const reactIndex = reactFiles.find((file) => file.path === "form/index.ts")?.contents;

    expect(astroRoot).toContain(
      'type FormValidationTiming = import("@starwind-ui/runtime/form").FormValidationTiming;',
    );
    expect(astroRoot).toContain('"data-error-visibility"?: FormValidationTiming;');
    expect(astroRoot).toContain("errorVisibility?: FormValidationTiming;");
    expect(astroRoot).toContain("data-error-visibility={dataErrorVisibility ?? errorVisibility}");
    expect(astroRoot).toContain('getInitCandidates(event, "[data-sw-form]")');
    expect(astroRoot).toContain("createForm(form)");
    expect(astroRoot).not.toContain("FormInstance");

    expect(astroErrorSummary).toContain("data-sw-form-error-summary");
    expect(astroErrorSummary).toContain('data-slot="form-error-summary"');
    expect(astroErrorSummary).toContain('role = "status"');
    expect(astroErrorSummary).toContain('"aria-live": ariaLive = "polite"');
    expect(astroErrorSummary).toContain("hidden={hidden}");

    assertTypeScriptModule(reactRoot); // Ordinary behavior is covered by the component browser suite.

    expect(compactCode(reactErrorSummary)).toContain(
      compactCode("React.forwardRef<HTMLDivElement, FormErrorSummaryProps>"),
    );
    expect(compactCode(reactErrorSummary)).toContain(compactCode("data-sw-form-error-summary"));
    expect(compactCode(reactErrorSummary)).toContain(compactCode('data-slot="form-error-summary"'));
    expect(compactCode(reactErrorSummary)).toContain(compactCode('role = "status"'));
    expect(compactCode(reactErrorSummary)).toContain(
      compactCode('"aria-live": ariaLive = "polite"'),
    );
    expect(compactCode(reactErrorSummary)).toContain(compactCode("hidden={hidden}"));

    expect(astroIndex).toContain('import FormErrorSummary from "./FormErrorSummary.astro";');
    expect(astroIndex).toContain("ErrorSummary: FormErrorSummary");
    expect(compactCode(reactIndex)).toContain(
      compactCode('import FormErrorSummary from "./FormErrorSummary";'),
    );
    expect(compactCode(reactIndex)).toContain(compactCode("Root: FormRoot"));
  });

  it("keeps generated Form component files equal while facade regeneration is deferred", async () => {
    const outputRoot = mkdtempSync(join(tmpdir(), "starwind-form-plan-"));
    const astroOutputRoot = join(outputRoot, "astro");
    const reactOutputRoot = join(outputRoot, "react");

    try {
      await generateAstroPrimitive(
        "form",
        astroOutputRoot,
        createAstroHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
        createTsHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
      );
      await generateReactPrimitive(
        "form",
        reactOutputRoot,
        createTsHeader("scripts/portable-runtime/generate-react-wrappers.ts"),
      );

      const files = [
        ["astro", "FormRoot.astro"],
        ["astro", "FormErrorSummary.astro"],
        ["react", "FormRoot.tsx"],
        ["react", "FormErrorSummary.tsx"],
      ] as const;

      for (const [framework, fileName] of files) {
        const outputPath = join(outputRoot, framework, "form", fileName);
        const packagePath = join(process.cwd(), "packages", framework, "src", "form", fileName);

        expect(
          normalizePrintedComparison(
            await formatGeneratedOutput(readFileSync(outputPath, "utf8"), packagePath),
          ),
        ).toBe(normalizePrintedComparison(await readFormattedOutput(packagePath)));
      }
    } finally {
      rmSync(outputRoot, { recursive: true, force: true });
    }
  });

  it("rejects widened Form field-control coordinator plans instead of using generic rendering", () => {
    const plan = buildGenericAdapterPlan(formRuntimeAdapterContract);
    const extraProp: GenericAdapterPlanProp = {
      kind: "option",
      name: "fieldMessage",
      targets: ["root"],
      type: "string",
    };
    const widenedPlan = {
      ...plan,
      props: [...plan.props, extraProp],
    };

    expect(() => printAstroGenericAdapterOutputModel(widenedPlan)).toThrow(
      /Form generic adapter plan does not match a structured Adapter Output Model family\./,
    );
    expect(() => printReactGenericAdapterOutputModel(widenedPlan)).toThrow(
      /Form generic adapter plan does not match a structured Adapter Output Model family\./,
    );
    expect(() => printAstroGenericAdapterOutputModel(widenedPlan)).toThrow(
      /structured Adapter Output Model family/,
    );
    expect(() => printReactGenericAdapterOutputModel(widenedPlan)).toThrow(
      /structured Adapter Output Model family/,
    );
  });

  it("prints Switch form-backed boolean-control state mapping through the Adapter Output Model", () => {
    const plan = buildGenericAdapterPlan(switchRuntimeAdapterContract);
    const astroOutputModel = buildTargetGenericAdapterOutputModel(plan, "astro");
    const reactOutputModel = buildTargetGenericAdapterOutputModel(plan, "react");
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(plan.category).toBe("single-boolean-control");
    expect(astroOutputModel).toEqual(reactOutputModel);
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "index",
    ]);
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family?.kind),
    ).toEqual(["boolean-form-control", "boolean-form-control"]);
    expect(plan.files.map((file) => file.path)).toEqual([
      "switch/SwitchRoot",
      "switch/SwitchThumb",
      "switch/index",
    ]);
    expect(plan.form).toEqual(
      expect.objectContaining({
        fieldIntegration: true,
        hiddenInput: { part: "input", type: "checkbox" },
        props: ["form", "id", "name", "required", "uncheckedValue", "value"],
      }),
    );
    expect(plan.stateModels).toEqual([
      expect.objectContaining({
        controlledProp: "checked",
        defaultProp: "defaultChecked",
        initialAttribute: "data-default-checked",
        name: "checked",
        runtimeGetter: "getChecked",
        runtimeSetter: "setChecked",
        valueType: "boolean",
      }),
    ]);
    expect(plan.events).toEqual([
      expect.objectContaining({
        callbackProp: "onCheckedChange",
        detailsType: "SwitchCheckedChangeDetails",
        name: "checkedChange",
        valueProperty: "checked",
      }),
    ]);
    expect(plan.runtime.optionProps).toEqual([
      "checked",
      "defaultChecked",
      "disabled",
      "form",
      "id",
      "name",
      "readOnly",
      "required",
      "uncheckedValue",
      "value",
    ]);
    expect(plan.setters).toContainEqual({
      method: "setFormOptions",
      props: ["form", "name", "required", "uncheckedValue", "value"],
    });

    const astroRoot = astroFiles.find((file) => file.path === "switch/SwitchRoot.astro")?.contents;
    const astroThumb = astroFiles.find(
      (file) => file.path === "switch/SwitchThumb.astro",
    )?.contents;
    const reactRoot = reactFiles.find((file) => file.path === "switch/SwitchRoot.tsx")?.contents;
    const reactThumb = reactFiles.find((file) => file.path === "switch/SwitchThumb.tsx")?.contents;

    expect(astroRoot).toContain(
      'interface Props extends Omit<HTMLAttributes<"span">, "aria-checked" | "onChange">',
    );
    expect(astroRoot).toContain('const Tag = nativeButton ? "button" : "span";');
    expect(astroRoot).toContain("const initialChecked = checked ?? defaultChecked;");
    expect(astroRoot).toContain('aria-checked={initialChecked ? "true" : "false"}');
    expect(astroRoot).toContain('data-filled={initialChecked ? "" : undefined}');
    expect(astroRoot).toContain("<input data-sw-switch-input id={inputId} hidden />");
    expect(astroRoot).toContain("createSwitch(root)");
    expect(astroThumb).toContain("<span data-sw-switch-thumb {...rest}>");
    expect(astroThumb).not.toContain("data-unchecked");

    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.

    expect(compactCode(reactThumb)).toContain(
      compactCode("return <span data-sw-switch-thumb ref={forwardedRef} {...props} />;"),
    );
    expect(compactCode(reactThumb)).not.toContain(compactCode("data-unchecked"));
  });

  it("keeps boolean control matching, facts, and output modeling in family modules", () => {
    const switchPlan = buildGenericAdapterPlan(switchRuntimeAdapterContract);
    const checkboxPlan = buildGenericAdapterPlan(checkboxRuntimeAdapterContract);
    const radioPlan = buildGenericAdapterPlan(radioRuntimeAdapterContract);
    const togglePlan = buildGenericAdapterPlan(toggleRuntimeAdapterContract);
    const renamedSwitch: GenericAdapterPlan = {
      ...switchPlan,
      component: "renamed-switch",
      sourceContract: "renamed-switch",
    };
    const extraEventSwitch: GenericAdapterPlan = {
      ...switchPlan,
      events: [
        ...switchPlan.events,
        { ...switchPlan.events[0]!, callbackProp: "onSecondaryChange", name: "secondaryChange" },
      ],
    };
    const customEscapeDeclaration = {
      boundary: "Synthetic supported metadata.",
      reason: "Proves the Boolean family preserves declarative escape metadata.",
      tests: ["synthetic.test.ts"],
    };
    const escapeDeclarationSwitch: GenericAdapterPlan = {
      ...switchPlan,
      escapeDeclarations: [...switchPlan.escapeDeclarations, customEscapeDeclaration],
    };
    const extraStateCheckbox: GenericAdapterPlan = {
      ...checkboxPlan,
      props: [
        ...checkboxPlan.props,
        { defaultValue: "false", kind: "control", name: "pressed", type: "boolean" },
      ],
      stateModels: [
        ...checkboxPlan.stateModels,
        {
          controlledProp: "pressed",
          controlledStateSync: "unsupported",
          name: "pressed",
          valueType: "boolean",
        },
      ],
    };
    const ambiguousUncheckedInputCheckbox: GenericAdapterPlan = {
      ...checkboxPlan,
      parts: [
        ...checkboxPlan.parts,
        {
          defaultElement: "input",
          discoveryAttribute: "data-sw-checkbox-secondary-hidden-input",
          name: "secondaryHiddenInput",
        },
      ],
      staticAttributes: [
        ...checkboxPlan.staticAttributes,
        {
          name: "type",
          part: "secondaryHiddenInput",
          source: "constant",
          value: "hidden",
        },
      ],
    };
    const toggleNearMiss: GenericAdapterPlan = {
      ...togglePlan,
      component: "toggle-near-miss",
    };

    expect(booleanFormControlAdapterFamilyPlan.matches(switchPlan)).toBe(true);
    expect(booleanFormControlAdapterFamilyPlan.matches(checkboxPlan)).toBe(true);
    expect(booleanFormControlAdapterFamilyPlan.matches(radioPlan)).toBe(true);
    expect(booleanFormControlAdapterFamilyPlan.matches(renamedSwitch)).toBe(true);
    expect(booleanFormControlAdapterFamilyPlan.matches(extraEventSwitch)).toBe(false);
    expect(booleanFormControlAdapterFamilyPlan.matches(escapeDeclarationSwitch)).toBe(true);
    expect(booleanFormControlAdapterFamilyPlan.matches(extraStateCheckbox)).toBe(false);
    expect(booleanFormControlAdapterFamilyPlan.matches(ambiguousUncheckedInputCheckbox)).toBe(
      false,
    );
    expect(() => getBooleanFormControlFacts(ambiguousUncheckedInputCheckbox)).toThrow(
      /exactly one Runtime-owned unchecked input part with constant type="hidden"/,
    );

    const checkboxFacts = getBooleanFormControlFacts(checkboxPlan);
    expect(checkboxFacts.escapeDeclarations).toEqual(checkboxPlan.escapeDeclarations);
    expect(getBooleanFormControlFacts(radioPlan).escapeDeclarations).toEqual(
      radioPlan.escapeDeclarations,
    );
    expect(checkboxFacts.behavior).toEqual(
      expect.objectContaining({
        acceptedChangeNotification: undefined,
        canCancelChange: true,
        formResetSync: true,
        groupStrategy: "array-includes",
        hasIndeterminate: true,
        inputIdStrategy: "always-prop",
        inputPlacement: "nested-when-non-native",
      }),
    );
    expect(checkboxFacts.parts.stateIndicator?.name).toBe("indicator");
    expect(checkboxFacts.parts.uncheckedInput?.name).toBe("uncheckedInput");

    const switchOutputModel = booleanFormControlAdapterFamilyPlan.buildOutputModel(switchPlan);
    const escapeDeclarationSwitchOutputModel =
      booleanFormControlAdapterFamilyPlan.buildOutputModel(escapeDeclarationSwitch);

    expect(switchOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "index",
    ]);
    expect(
      switchOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([
      expect.objectContaining({ kind: "boolean-form-control", part: "root" }),
      expect.objectContaining({ kind: "boolean-form-control", part: "state-indicator" }),
    ]);
    expect(switchOutputModel.files.find((file) => file.kind === "index")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({ kind: "boolean-form-control" }),
      }),
    );
    expect(() => booleanFormControlAdapterFamilyPlan.buildOutputModel(renamedSwitch)).not.toThrow();
    const escapeDeclarationIndex = escapeDeclarationSwitchOutputModel.files.find(
      (file) => file.kind === "index",
    );
    if (
      escapeDeclarationIndex?.kind !== "index" ||
      escapeDeclarationIndex.family?.kind !== "boolean-form-control"
    ) {
      throw new Error("Switch escape-declaration output-model index was not found.");
    }
    expect(escapeDeclarationIndex.family.facts.escapeDeclarations).toEqual([
      ...switchPlan.escapeDeclarations,
      customEscapeDeclaration,
    ]);

    expect(singleBooleanControlAdapterFamilyPlan.matches(togglePlan)).toBe(true);
    expect(singleBooleanControlAdapterFamilyPlan.matches(toggleNearMiss)).toBe(false);

    const toggleOutputModel = singleBooleanControlAdapterFamilyPlan.buildOutputModel(togglePlan);

    expect(toggleOutputModel.files.map((file) => file.kind)).toEqual(["component", "index"]);
    expect(
      toggleOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([expect.objectContaining({ kind: "single-boolean-control", part: "root" })]);
    expect(toggleOutputModel.files.find((file) => file.kind === "index")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({ kind: "single-boolean-control" }),
      }),
    );
    expect(() => singleBooleanControlAdapterFamilyPlan.buildOutputModel(toggleNearMiss)).toThrow(
      "Toggle generic adapter plan is not a single boolean-control plan.",
    );
  });

  it("keeps grouped-value matching, helper metadata, and output modeling in a family module", () => {
    const groupedValueControlAdapterFamilyPlan = createGroupedValueControlAdapterFamilyPlan({
      contextHelperTargets: getPrimitiveFrameworkAdapterTargetsWithOutputModelCapability(
        "groupedValueControlContextHelper",
      ).map(({ capability, target }) => ({
        fileExtension: capability.fileExtension,
        target,
      })),
      targetNames: getPrimitiveFrameworkAdapterTargetsForComponent("checkbox-group"),
    });
    const checkboxGroupPlan = buildGenericAdapterPlan(checkboxGroupRuntimeAdapterContract);
    const radioGroupPlan = buildGenericAdapterPlan(radioGroupRuntimeAdapterContract);
    const toggleGroupPlan = buildGenericAdapterPlan(toggleGroupRuntimeAdapterContract);
    const checkboxGroupNearMiss: GenericAdapterPlan = {
      ...checkboxGroupPlan,
      context: [],
    };

    expect(groupedValueControlAdapterFamilyPlan.matches(checkboxGroupPlan)).toBe(true);
    expect(groupedValueControlAdapterFamilyPlan.matches(radioGroupPlan)).toBe(true);
    expect(groupedValueControlAdapterFamilyPlan.matches(toggleGroupPlan)).toBe(true);
    expect(groupedValueControlAdapterFamilyPlan.matches(checkboxGroupNearMiss)).toBe(false);

    const checkboxGroupOutputModel =
      groupedValueControlAdapterFamilyPlan.buildOutputModel(checkboxGroupPlan);

    expect(checkboxGroupOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "helper",
      "helper",
      "index",
      "index",
      "index",
      "index",
    ]);
    expect(checkboxGroupOutputModel.files.map((file) => file.target ?? "all")).toEqual([
      "all",
      "react",
      "vue",
      "astro",
      "react",
      "vue",
      "svelte",
    ]);
    expect(checkboxGroupOutputModel.files.find((file) => file.kind === "component")).toEqual(
      expect.objectContaining({
        component: expect.objectContaining({
          family: expect.objectContaining({ kind: "grouped-value-control", part: "root" }),
        }),
      }),
    );
    expect(checkboxGroupOutputModel.files.find((file) => file.kind === "helper")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({ kind: "grouped-value-control" }),
        kind: "helper",
        name: "CheckboxGroupContext",
        path: "checkbox-group/CheckboxGroupContext.tsx",
        target: "react",
      }),
    );
    expect(
      checkboxGroupOutputModel.files
        .filter((file) => file.kind === "index")
        .map((file) => ({
          family: file.family?.kind,
          members: file.exports.members,
          target: file.target,
        })),
    ).toEqual([
      {
        family: "grouped-value-control",
        members: [{ from: "./CheckboxGroupRoot", name: "CheckboxGroupRoot" }],
        target: "astro",
      },
      {
        family: "grouped-value-control",
        members: [
          { from: "./CheckboxGroupContext", name: "CheckboxGroupContext" },
          { from: "./CheckboxGroupContext", kind: "type", name: "CheckboxGroupContextValue" },
          { from: "./CheckboxGroupRoot", name: "CheckboxGroupRoot" },
          { from: "./CheckboxGroupContext", name: "useCheckboxGroupContext" },
        ],
        target: "react",
      },
      {
        family: "grouped-value-control",
        members: [
          { from: "./CheckboxGroupContext", name: "CheckboxGroupContext" },
          { from: "./CheckboxGroupContext", kind: "type", name: "CheckboxGroupContextValue" },
          { from: "./CheckboxGroupRoot", name: "CheckboxGroupRoot" },
          { from: "./CheckboxGroupContext", name: "useCheckboxGroupContext" },
        ],
        target: "vue",
      },
      {
        family: "grouped-value-control",
        members: [{ from: "./CheckboxGroupRoot", name: "CheckboxGroupRoot" }],
        target: "svelte",
      },
    ]);

    const toggleGroupOutputModel =
      groupedValueControlAdapterFamilyPlan.buildOutputModel(toggleGroupPlan);

    expect(
      toggleGroupOutputModel.files.map((file) => ({
        kind: file.kind,
        target: file.target ?? "all",
      })),
    ).toEqual([
      { kind: "component", target: "all" },
      { kind: "helper", target: "react" },
      { kind: "helper", target: "vue" },
      { kind: "index", target: "astro" },
      { kind: "index", target: "react" },
      { kind: "index", target: "vue" },
      { kind: "index", target: "svelte" },
    ]);
    expect(toggleGroupOutputModel.files.filter((file) => file.kind === "index")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          family: expect.objectContaining({ kind: "grouped-value-control" }),
        }),
      ]),
    );
    expect(() =>
      groupedValueControlAdapterFamilyPlan.buildOutputModel(checkboxGroupNearMiss),
    ).toThrow(/grouped-value plan/);
  });

  it("keeps disclosure-presence matching, facts, and output modeling in a family module", () => {
    const plan = buildGenericAdapterPlan(collapsibleRuntimeAdapterContract);
    const nearMiss: GenericAdapterPlan = {
      ...plan,
      presence: {
        initialHiddenParts: [],
        unmountPolicy: "runtime-owned-visibility",
      },
    };

    expect(disclosurePresenceAdapterFamilyPlan.matches(plan)).toBe(true);
    expect(disclosurePresenceAdapterFamilyPlan.matches(nearMiss)).toBe(false);

    const outputModel = disclosurePresenceAdapterFamilyPlan.buildOutputModel(plan);

    expect(outputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "component",
      "index",
    ]);
    expect(
      outputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([
      expect.objectContaining({ kind: "disclosure-presence", part: "root" }),
      expect.objectContaining({ kind: "disclosure-presence", part: "trigger" }),
      expect.objectContaining({ kind: "disclosure-presence", part: "panel" }),
    ]);
    expect(outputModel.files.find((file) => file.kind === "index")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({ kind: "disclosure-presence" }),
      }),
    );
    expect(() => disclosurePresenceAdapterFamilyPlan.buildOutputModel(nearMiss)).toThrow(
      "Collapsible generic adapter plan is not a disclosure presence plan.",
    );
  });

  it("keeps form-field-coordinator matching, type facades, and output modeling in a family module", () => {
    const plan = buildGenericAdapterPlan(formRuntimeAdapterContract);
    const nearMiss: GenericAdapterPlan = {
      ...plan,
      component: "form-near-miss",
    };

    expect(formFieldCoordinatorAdapterFamilyPlan.matches(plan)).toBe(true);
    expect(formFieldCoordinatorAdapterFamilyPlan.matches(nearMiss)).toBe(false);

    const outputModel = formFieldCoordinatorAdapterFamilyPlan.buildOutputModel(plan);

    expect(outputModel.files.map((file) => file.kind)).toEqual(["component", "component", "index"]);
    expect(
      outputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family),
    ).toEqual([
      expect.objectContaining({ kind: "form-field-coordinator", part: "root" }),
      expect.objectContaining({ kind: "form-field-coordinator", part: "error-summary" }),
    ]);
    expect(outputModel.files.find((file) => file.kind === "index")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({ kind: "form-field-coordinator" }),
        typeFacades: [
          expect.objectContaining({ exports: ["FormExternalErrorOptions"] }),
          expect.objectContaining({ exports: ["FormExternalErrors"] }),
          expect.objectContaining({ exports: ["FormInstance"] }),
          expect.objectContaining({ exports: ["FormOptions"] }),
          expect.objectContaining({ exports: ["FormResetValidationOptions"] }),
          expect.objectContaining({ exports: ["FormSchemaResult"] }),
          expect.objectContaining({ exports: ["FormValidateOptions"] }),
          expect.objectContaining({ exports: ["FormValidationCause"] }),
          expect.objectContaining({ exports: ["FormValidationOutcome"] }),
          expect.objectContaining({ exports: ["FormValidationTiming"] }),
          expect.objectContaining({ exports: ["FormValues"] }),
        ],
      }),
    );
    expect(() => formFieldCoordinatorAdapterFamilyPlan.buildOutputModel(nearMiss)).toThrow(
      "Form generic adapter plan is not a form-field coordinator plan.",
    );
  });

  it("uses the declared Switch hidden input part for generated input discovery", () => {
    const plan = buildGenericAdapterPlan(switchRuntimeAdapterContract);
    const renamedInputPlan: GenericAdapterPlan = {
      ...plan,
      form: plan.form
        ? {
            ...plan.form,
            hiddenInput: { part: "nativeInput", type: "checkbox" },
          }
        : undefined,
      parts: plan.parts.map((part) =>
        part.name === "input"
          ? {
              ...part,
              discoveryAttribute: "data-sw-switch-native-input",
              name: "nativeInput",
            }
          : part,
      ),
      refs: plan.refs.map((ref) => (ref.part === "input" ? { ...ref, part: "nativeInput" } : ref)),
      staticAttributes: plan.staticAttributes.map((attribute) =>
        attribute.part === "input" ? { ...attribute, part: "nativeInput" } : attribute,
      ),
    };

    const astroRoot = printAstroGenericAdapterOutputModel(renamedInputPlan).find(
      (file) => file.path === "switch/SwitchRoot.astro",
    )?.contents;
    const reactRoot = printReactGenericAdapterOutputModel(renamedInputPlan).find(
      (file) => file.path === "switch/SwitchRoot.tsx",
    )?.contents;

    expect(astroRoot).toContain("<input data-sw-switch-native-input id={inputId} hidden />");
    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.
  });

  it("prints Checkbox form, indeterminate, indicator, and group-consumption behavior through the boolean-control family", () => {
    const plan = buildGenericAdapterPlan(checkboxRuntimeAdapterContract);
    const astroOutputModel = buildTargetGenericAdapterOutputModel(plan, "astro");
    const reactOutputModel = buildTargetGenericAdapterOutputModel(plan, "react");
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(plan.category).toBe("single-boolean-control");
    expect(astroOutputModel).toEqual(reactOutputModel);
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "index",
    ]);
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family?.kind),
    ).toEqual(["boolean-form-control", "boolean-form-control"]);
    expect(plan.files.map((file) => file.path)).toEqual([
      "checkbox/CheckboxRoot",
      "checkbox/CheckboxIndicator",
      "checkbox/index",
    ]);
    expect(plan.form).toEqual(
      expect.objectContaining({
        fieldIntegration: true,
        hiddenInput: { part: "input", type: "checkbox" },
        props: ["form", "id", "name", "required", "uncheckedValue", "value"],
      }),
    );
    expect(plan.presence).toEqual(
      expect.objectContaining({
        initialHiddenParts: ["indicator"],
        keepMountedProp: "keepMounted",
        unmountPolicy: "runtime-owned",
      }),
    );
    expect(plan.context).toEqual([
      {
        direction: "consumes",
        name: "checkbox-group",
        requirement: "optional",
        stateOwnership: "group-membership",
        values: ["disabled", "value"],
      },
    ]);
    expect(plan.stateModels).toEqual([
      expect.objectContaining({
        controlledProp: "checked",
        defaultProp: "defaultChecked",
        initialAttribute: "data-default-checked",
        name: "checked",
        runtimeGetter: "getChecked",
        runtimeSetter: "setChecked",
        valueType: "boolean",
      }),
      expect.objectContaining({
        controlledProp: "indeterminate",
        initialAttribute: "data-indeterminate",
        name: "indeterminate",
        runtimeSetter: "setIndeterminate",
        valueType: "boolean",
      }),
    ]);
    expect(plan.events).toEqual([
      expect.objectContaining({
        callbackProp: "onCheckedChange",
        detailsType: "CheckboxCheckedChangeDetails",
        name: "checkedChange",
        valueProperty: "checked",
      }),
    ]);

    const astroRoot = astroFiles.find(
      (file) => file.path === "checkbox/CheckboxRoot.astro",
    )?.contents;
    const astroIndicator = astroFiles.find(
      (file) => file.path === "checkbox/CheckboxIndicator.astro",
    )?.contents;
    const reactRoot = reactFiles.find(
      (file) => file.path === "checkbox/CheckboxRoot.tsx",
    )?.contents;
    const reactIndicator = reactFiles.find(
      (file) => file.path === "checkbox/CheckboxIndicator.tsx",
    )?.contents;

    if (!reactRoot) {
      throw new Error("Expected Checkbox React root output.");
    }

    expect(astroRoot).toContain('interface Props extends Omit<HTMLAttributes<"span">');
    expect(astroRoot).toContain("indeterminate?: boolean;");
    expect(astroRoot).toContain('const Tag = nativeButton ? "button" : "span";');
    expect(astroRoot).toContain(
      'const ariaChecked = indeterminate ? "mixed" : initialChecked ? "true" : "false";',
    );
    expect(astroRoot).toContain('data-indeterminate={indeterminate ? "" : undefined}');
    expect(astroRoot).toContain("<input data-sw-checkbox-input hidden />");
    expect(astroRoot).toContain("createCheckbox(root)");
    expect(astroIndicator).toContain("keepMounted?: boolean;");
    expect(astroIndicator).toContain("data-sw-checkbox-indicator");
    expect(astroIndicator).toContain('data-keep-mounted={keepMounted ? "true" : undefined}');
    expect(astroIndicator).toContain("data-unchecked");
    expect(astroIndicator).toContain("hidden={!keepMounted}");

    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.

    expect(compactCode(reactIndicator)).toContain(compactCode("keepMounted?: boolean;"));
    expect(compactCode(reactIndicator)).toContain(
      compactCode("React.useContext(CheckboxIndicatorContext)"),
    );
    expect(compactCode(reactIndicator)).toContain(
      compactCode("if (!keepMounted && !active) return null;"),
    );
    expect(compactCode(reactIndicator)).toContain(compactCode("node.hidden = hidden ?? false;"));
    expect(compactCode(reactIndicator)).toContain(compactCode("hidden={hidden ?? false}"));
    expect(compactCode(reactIndicator)).toContain(
      compactCode("data-disabled={indicatorState.disabled"),
    );
    expect(compactCode(reactIndicator)).toContain(
      compactCode("data-readonly={indicatorState.readOnly"),
    );
    expect(compactCode(reactIndicator)).toContain(
      compactCode("data-required={indicatorState.required"),
    );
    expect(compactCode(reactIndicator)).not.toContain(compactCode("React.useEffect"));
    expect(compactCode(reactIndicator)).toContain(compactCode("data-sw-checkbox-indicator"));
    expect(compactCode(reactIndicator)).toContain(compactCode("data-keep-mounted"));
    expect(compactCode(reactIndicator)).toContain(compactCode("data-unchecked"));
    expect(compactCode(reactIndicator)).toContain(compactCode("React.forwardRef<HTMLSpanElement"));
  });

  it("prints Checkbox namespace exports without exposing internal input parts", () => {
    const plan = buildGenericAdapterPlan(checkboxRuntimeAdapterContract);
    const astroIndex = printAstroGenericAdapterOutputModel(plan).find(
      (file) => file.path === "checkbox/index.ts",
    )?.contents;
    const reactIndex = printReactGenericAdapterOutputModel(plan).find(
      (file) => file.path === "checkbox/index.ts",
    )?.contents;

    expect(astroIndex).toContain('import CheckboxIndicator from "./CheckboxIndicator.astro";');
    expect(astroIndex).toContain('import CheckboxRoot from "./CheckboxRoot.astro";');
    expect(astroIndex).toContain("Root: CheckboxRoot");
    expect(astroIndex).toContain("Indicator: CheckboxIndicator");
    expect(astroIndex).toContain("export { Checkbox, CheckboxIndicator, CheckboxRoot };");
    expect(astroIndex).not.toContain("CheckboxInput");
    expect(astroIndex).not.toContain("CheckboxUncheckedInput");

    expect(compactCode(reactIndex)).toContain(
      compactCode('import CheckboxIndicator from "./CheckboxIndicator";'),
    );
    expect(compactCode(reactIndex)).toContain(
      compactCode('import CheckboxRoot from "./CheckboxRoot";'),
    );
    expect(compactCode(reactIndex)).toContain(compactCode("Root: CheckboxRoot"));
    expect(compactCode(reactIndex)).toContain(compactCode("Indicator: CheckboxIndicator"));
    expect(compactCode(reactIndex)).toContain(
      compactCode("export { Checkbox, CheckboxIndicator, CheckboxRoot };"),
    );
    expect(compactCode(reactIndex)).not.toContain(compactCode("CheckboxInput"));
    expect(compactCode(reactIndex)).not.toContain(compactCode("CheckboxUncheckedInput"));
  });

  it("prints Radio form, indicator, and radio-group behavior through the boolean-control family", () => {
    const plan = buildGenericAdapterPlan(radioRuntimeAdapterContract);
    const astroOutputModel = buildTargetGenericAdapterOutputModel(plan, "astro");
    const reactOutputModel = buildTargetGenericAdapterOutputModel(plan, "react");
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(plan.category).toBe("single-boolean-control");
    expect(astroOutputModel).toEqual(reactOutputModel);
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual([
      "component",
      "component",
      "index",
    ]);
    expect(hasPrebuiltFile(astroOutputModel.files)).toBe(false);
    expect(
      astroOutputModel.files
        .filter((file) => file.kind === "component")
        .map((file) => file.component.family?.kind),
    ).toEqual(["boolean-form-control", "boolean-form-control"]);
    expect(plan.files.map((file) => file.path)).toEqual([
      "radio/RadioRoot",
      "radio/RadioIndicator",
      "radio/index",
    ]);
    expect(plan.form).toEqual(
      expect.objectContaining({
        fieldIntegration: true,
        hiddenInput: { part: "input", type: "radio" },
        props: ["form", "id", "name", "required", "value"],
      }),
    );
    expect(plan.presence).toEqual(
      expect.objectContaining({
        initialHiddenParts: ["indicator"],
        keepMountedProp: "keepMounted",
        unmountPolicy: "runtime-owned",
      }),
    );
    expect(plan.context).toEqual([
      {
        direction: "consumes",
        name: "radio-group",
        requirement: "optional",
        values: ["disabled", "form", "name", "readOnly", "required", "value"],
      },
    ]);
    expect(plan.stateModels).toEqual([
      expect.objectContaining({
        controlledProp: "checked",
        defaultProp: "defaultChecked",
        initialAttribute: "data-default-checked",
        name: "checked",
        runtimeGetter: "getChecked",
        runtimeSetter: "setChecked",
        valueType: "boolean",
      }),
    ]);
    expect(plan.events).toEqual([
      expect.objectContaining({
        callbackProp: "onCheckedChange",
        detailsType: "RadioCheckedChangeDetails",
        name: "checkedChange",
        valueProperty: "checked",
      }),
    ]);

    const astroRoot = astroFiles.find((file) => file.path === "radio/RadioRoot.astro")?.contents;
    const astroIndicator = astroFiles.find(
      (file) => file.path === "radio/RadioIndicator.astro",
    )?.contents;
    const reactRoot = reactFiles.find((file) => file.path === "radio/RadioRoot.tsx")?.contents;
    const reactIndicator = reactFiles.find(
      (file) => file.path === "radio/RadioIndicator.tsx",
    )?.contents;

    expect(astroRoot).toContain('interface Props extends Omit<HTMLAttributes<"span">');
    expect(astroRoot).toContain("value: string;");
    expect(astroRoot).toContain("nativeButton ? (");
    expect(astroRoot).toContain("<button");
    expect(astroRoot).toContain("<input data-sw-radio-input hidden />");
    expect(astroRoot).toContain("<span");
    expect(astroRoot).toContain("<input data-sw-radio-input id={id} hidden />");
    expect(astroRoot).toContain("createRadio(root)");
    expect(astroIndicator).toContain("keepMounted?: boolean;");
    expect(astroIndicator).toContain("data-sw-radio-indicator");
    expect(astroIndicator).toContain('data-keep-mounted={keepMounted ? "true" : undefined}');
    expect(astroIndicator).toContain("data-unchecked");
    expect(astroIndicator).toContain("hidden={!keepMounted}");

    assertTypeScriptModule(reactRoot); // Shared lifecycle and browser tests cover the emitted behavior.

    expect(compactCode(reactIndicator)).toContain(compactCode("keepMounted?: boolean;"));
    expect(compactCode(reactIndicator)).toContain(compactCode("hidden={!keepMounted}"));
    expect(compactCode(reactIndicator)).toContain(compactCode("data-sw-radio-indicator"));
    expect(compactCode(reactIndicator)).toContain(compactCode("data-keep-mounted"));
    expect(compactCode(reactIndicator)).toContain(compactCode("data-unchecked"));
    expect(compactCode(reactIndicator)).toContain(compactCode("React.forwardRef<HTMLSpanElement"));
  });

  it("prints Radio namespace exports without exposing internal input parts", () => {
    const plan = buildGenericAdapterPlan(radioRuntimeAdapterContract);
    const astroIndex = printAstroGenericAdapterOutputModel(plan).find(
      (file) => file.path === "radio/index.ts",
    )?.contents;
    const reactIndex = printReactGenericAdapterOutputModel(plan).find(
      (file) => file.path === "radio/index.ts",
    )?.contents;

    expect(astroIndex).toContain('import RadioIndicator from "./RadioIndicator.astro";');
    expect(astroIndex).toContain('import RadioRoot from "./RadioRoot.astro";');
    expect(astroIndex).toContain("Root: RadioRoot");
    expect(astroIndex).toContain("Indicator: RadioIndicator");
    expect(astroIndex).toContain("export { Radio, RadioIndicator, RadioRoot };");
    expect(astroIndex).not.toContain("RadioInput");

    expect(compactCode(reactIndex)).toContain(
      compactCode('import RadioIndicator from "./RadioIndicator";'),
    );
    expect(compactCode(reactIndex)).toContain(compactCode('import RadioRoot from "./RadioRoot";'));
    expect(compactCode(reactIndex)).toContain(compactCode("Root: RadioRoot"));
    expect(compactCode(reactIndex)).toContain(compactCode("Indicator: RadioIndicator"));
    expect(compactCode(reactIndex)).toContain(
      compactCode("export { Radio, RadioIndicator, RadioRoot };"),
    );
    expect(compactCode(reactIndex)).not.toContain(compactCode("RadioInput"));
  });

  it("keeps generated Switch, Checkbox, and Radio files equal to the checked-in packages", async () => {
    const outputRoot = mkdtempSync(join(tmpdir(), "starwind-boolean-form-control-plan-"));
    const astroOutputRoot = join(outputRoot, "astro");
    const reactOutputRoot = join(outputRoot, "react");

    try {
      await generateAstroPrimitive(
        "switch",
        astroOutputRoot,
        createAstroHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
        createTsHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
      );
      await generateReactPrimitive(
        "switch",
        reactOutputRoot,
        createTsHeader("scripts/portable-runtime/generate-react-wrappers.ts"),
      );
      await generateAstroPrimitive(
        "checkbox",
        astroOutputRoot,
        createAstroHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
        createTsHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
      );
      await generateReactPrimitive(
        "checkbox",
        reactOutputRoot,
        createTsHeader("scripts/portable-runtime/generate-react-wrappers.ts"),
      );
      await generateAstroPrimitive(
        "radio",
        astroOutputRoot,
        createAstroHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
        createTsHeader("scripts/portable-runtime/generate-astro-wrappers.ts"),
      );
      await generateReactPrimitive(
        "radio",
        reactOutputRoot,
        createTsHeader("scripts/portable-runtime/generate-react-wrappers.ts"),
      );

      for (const [targetPackage, component, fileName] of [
        ["astro", "switch", "SwitchRoot.astro"],
        ["astro", "switch", "SwitchThumb.astro"],
        ["astro", "switch", "index.ts"],
        ["react", "switch", "SwitchRoot.tsx"],
        ["react", "switch", "SwitchThumb.tsx"],
        ["react", "switch", "index.ts"],
        ["astro", "checkbox", "CheckboxRoot.astro"],
        ["astro", "checkbox", "CheckboxIndicator.astro"],
        ["astro", "checkbox", "index.ts"],
        ["react", "checkbox", "CheckboxRoot.tsx"],
        ["react", "checkbox", "CheckboxIndicator.tsx"],
        ["react", "checkbox", "index.ts"],
        ["astro", "radio", "RadioRoot.astro"],
        ["astro", "radio", "RadioIndicator.astro"],
        ["astro", "radio", "index.ts"],
        ["react", "radio", "RadioRoot.tsx"],
        ["react", "radio", "RadioIndicator.tsx"],
        ["react", "radio", "index.ts"],
      ] as const) {
        const packagePath = join(
          process.cwd(),
          "packages",
          targetPackage,
          "src",
          component,
          fileName,
        );
        const targetOutputRoot = targetPackage === "astro" ? astroOutputRoot : reactOutputRoot;
        const generatedPath = join(targetOutputRoot, component, fileName);

        expect(
          normalizePrintedComparison(
            await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath),
          ),
        ).toBe(normalizePrintedComparison(await readFormattedOutput(packagePath)));
      }
    } finally {
      rmSync(outputRoot, { recursive: true, force: true });
    }
  });
});

const syntheticRootOnlyContract = {
  category: "static-semantic",
  component: "synthetic-root-only",
  displayName: "SyntheticRootOnly",
  frameworkNotes: {
    astro: ["Synthetic Astro note."],
    react: ["Synthetic React note."],
  },
  initialMarkup: [
    {
      attributes: ["data-sw-synthetic-root-only"],
      part: "root",
      reason: "Synthetic root-only initial markup.",
    },
  ],
  parts: [
    {
      defaultElement: "button",
      discoveryAttribute: "data-sw-synthetic-root-only",
      forwardsRef: true,
      name: "root",
      ownsRuntime: true,
    },
  ],
  props: [],
  refs: [{ part: "root", public: true }],
  runtime: {
    destroys: true,
    factory: "createSyntheticRootOnly",
    importSource: "@starwind-ui/runtime/synthetic-root-only",
    rootPart: "root",
  },
} as const satisfies RuntimeAdapterContract;

const syntheticMultiPartContract = {
  category: "static-semantic",
  component: "synthetic-static",
  displayName: "SyntheticStatic",
  frameworkNotes: {
    astro: ["Synthetic Astro note."],
    react: ["Synthetic React note."],
  },
  initialMarkup: [
    {
      attributes: ["data-sw-synthetic-static", "aria-live"],
      part: "root",
      reason: "Synthetic root initial markup.",
    },
    {
      attributes: ["data-sw-synthetic-static-label", "aria-hidden"],
      part: "label",
      reason: "Synthetic label initial markup.",
    },
  ],
  parts: [
    {
      defaultElement: "div",
      discoveryAttribute: "data-sw-synthetic-static",
      forwardsRef: true,
      name: "root",
      ownsRuntime: true,
      initialAttributes: [{ name: "aria-live", source: "constant", value: "polite" }],
    },
    {
      defaultElement: "span",
      discoveryAttribute: "data-sw-synthetic-static-label",
      forwardsRef: true,
      name: "label",
      initialAttributes: [{ name: "aria-hidden", source: "constant", value: "true" }],
    },
  ],
  props: [],
  refs: [
    { part: "root", public: true },
    { part: "label", public: true },
  ],
  runtime: {
    destroys: true,
    factory: "createSyntheticStatic",
    importSource: "@starwind-ui/runtime/synthetic-static",
    rootPart: "root",
  },
} as const satisfies RuntimeAdapterContract;

const syntheticPropBackedContract = {
  category: "static-semantic",
  component: "synthetic-prop-backed",
  displayName: "SyntheticPropBacked",
  frameworkNotes: {
    astro: ["Synthetic Astro note."],
    react: ["Synthetic React note."],
  },
  initialMarkup: [
    {
      attributes: ["data-sw-synthetic-prop-backed", "data-disabled"],
      part: "root",
      reason: "Synthetic prop-backed initial markup.",
    },
  ],
  parts: [
    {
      defaultElement: "button",
      discoveryAttribute: "data-sw-synthetic-prop-backed",
      forwardsRef: true,
      name: "root",
      ownsRuntime: true,
      initialAttributes: [{ name: "data-disabled", source: "prop" }],
    },
  ],
  props: [{ defaultValue: "false", name: "disabled", kind: "option", type: "boolean" }],
  refs: [{ part: "root", public: true }],
  runtime: {
    destroys: true,
    factory: "createSyntheticPropBacked",
    importSource: "@starwind-ui/runtime/synthetic-prop-backed",
    rootPart: "root",
  },
} as const satisfies RuntimeAdapterContract;

const syntheticNativeDisabledContract = {
  category: "static-semantic",
  component: "synthetic-native-disabled",
  displayName: "SyntheticNativeDisabled",
  frameworkNotes: {
    astro: ["Synthetic Astro note."],
    react: ["Synthetic React note."],
  },
  initialMarkup: [
    {
      attributes: ["data-sw-synthetic-native-disabled", "data-disabled"],
      part: "root",
      reason: "Synthetic native disabled root initial markup.",
    },
    {
      attributes: ["data-sw-synthetic-native-disabled-help", "aria-hidden"],
      part: "help",
      reason: "Synthetic non-root static attributes must survive native disabled printing.",
    },
  ],
  parts: [
    {
      defaultElement: "fieldset",
      discoveryAttribute: "data-sw-synthetic-native-disabled",
      forwardsRef: true,
      name: "root",
      ownsRuntime: true,
      initialAttributes: [{ name: "data-disabled", source: "prop" }],
    },
    {
      defaultElement: "div",
      discoveryAttribute: "data-sw-synthetic-native-disabled-help",
      forwardsRef: true,
      name: "help",
      initialAttributes: [{ name: "aria-hidden", source: "constant", value: "true" }],
    },
  ],
  props: [{ defaultValue: "false", name: "disabled", kind: "option", type: "boolean" }],
  refs: [
    { part: "root", public: true },
    { part: "help", public: true },
  ],
  runtime: {
    destroys: true,
    factory: "createSyntheticNativeDisabled",
    importSource: "@starwind-ui/runtime/synthetic-native-disabled",
    optionProps: ["disabled"],
    rootPart: "root",
  },
  setters: [{ method: "setDisabled", prop: "disabled" }],
} as const satisfies RuntimeAdapterContract;

const syntheticDivDisabledContract = {
  ...syntheticNativeDisabledContract,
  component: "synthetic-div-disabled",
  displayName: "SyntheticDivDisabled",
  parts: syntheticNativeDisabledContract.parts.map((part) =>
    part.name === "root" ? { ...part, defaultElement: "div" } : part,
  ),
  runtime: {
    ...syntheticNativeDisabledContract.runtime,
    factory: "createSyntheticDivDisabled",
    importSource: "@starwind-ui/runtime/synthetic-div-disabled",
  },
} as const satisfies RuntimeAdapterContract;

const syntheticViewportMeasurementContract = {
  ...scrollAreaRuntimeAdapterContract,
  component: "synthetic-viewport-measurement",
  displayName: "SyntheticViewport",
  runtime: {
    ...scrollAreaRuntimeAdapterContract.runtime,
    factory: "createSyntheticViewport",
    importSource: "@starwind-ui/runtime/synthetic-viewport",
  },
  parts: scrollAreaRuntimeAdapterContract.parts.map((part) => ({
    ...part,
    discoveryAttribute: part.discoveryAttribute.replace(
      "data-sw-scroll-area",
      "data-sw-synthetic-viewport",
    ),
  })),
} as const satisfies RuntimeAdapterContract;

async function generateAstroPrimitive(
  component: string,
  outputRoot: string,
  astroHeader: string,
  tsHeader: string,
): Promise<void> {
  const entry = getPrimitiveGeneratorEntry(component);
  await entry.generateTarget({
    componentHeader: astroHeader,
    moduleHeader: tsHeader,
    outputRoot,
    target: "astro",
  });
}

async function generateReactPrimitive(
  component: string,
  outputRoot: string,
  tsHeader: string,
): Promise<void> {
  const entry = getPrimitiveGeneratorEntry(component);
  await entry.generateTarget({
    moduleHeader: tsHeader,
    outputRoot,
    target: "react",
  });
}

function getPrimitiveGeneratorEntry(component: string) {
  const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === component);

  if (!entry) {
    throw new Error(`Missing primitive generator entry for ${component}.`);
  }

  return entry;
}

function hasPrebuiltFile(files: readonly { kind: string }[]): boolean {
  return files.some((file) => file.kind === "prebuilt");
}

function expectPrintedFilesToMatchPackage(
  packageSourceDirectory: string,
  files: { contents: string; path: string }[],
): void {
  for (const file of files) {
    const contents = packageSourceDirectory.includes("/astro/")
      ? normalizeAstroPrimitiveOutput(file.path.split("/").at(-1)!, file.contents)
      : applyReactPortalImportCanonicalization(applyReactRefCleanup(file.contents));
    expect(normalizePrintedComparison(contents)).toBe(
      normalizePrintedComparison(readGeneratedPackageBody(packageSourceDirectory, file.path)),
    );
  }
}

function normalizePrintedComparison(contents: string): string {
  if (!contents.trimStart().startsWith("---")) return normalizeTypeScriptSource(contents);
  // Match the canonical formatter's order for the shared form discovery import.
  return contents
    .replace(
      'import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\nimport { observeFormDiscovery } from "../internal/form-discovery";',
      'import { observeFormDiscovery } from "../internal/form-discovery";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";',
    )
    .replace(/\s+/g, " ")
    .replace(/\s*([(){}\[\],;])\s*/g, "$1")
    .replace(/,([)\]}])/g, "$1");
}

function readGeneratedPackageBody(packageSourceDirectory: string, path: string): string {
  return readFileSync(join(process.cwd(), packageSourceDirectory, path), "utf8")
    .replace(/\r\n/g, "\n")
    .replace(
      /\/\*\*\n \* Generated by scripts\/portable-runtime\/generate-astro-wrappers\.ts\.\n \* Do not edit by hand; update the contract\/template instead\.\n \*\/\n/g,
      "",
    )
    .replace(/^\n(?=import )/, "")
    .replace(
      /^---\n\/\*\*\n \* Generated by scripts\/portable-runtime\/generate-astro-wrappers\.ts\.\n \* Do not edit by hand; update the contract\/template instead\.\n \*\/\n/,
      "---\n",
    )
    .replace(
      /^\/\*\*\n \* Generated by scripts\/portable-runtime\/generate-astro-wrappers\.ts\.\n \* Do not edit by hand; update the contract\/template instead\.\n \*\/\n\n/,
      "",
    )
    .replace(
      /^\/\*\*\n \* Generated by scripts\/portable-runtime\/generate-react-wrappers\.ts\.\n \* Do not edit by hand; update the contract\/template instead\.\n \*\/\n\n/,
      "",
    );
}

async function formatGeneratedOutput(contents: string, filepath: string): Promise<string> {
  if (filepath.endsWith(".astro")) {
    contents = normalizeAstroPrimitiveOutput(basename(filepath), contents);
  } else if (filepath.endsWith(".tsx")) {
    contents = applyReactPortalImportCanonicalization(
      applyReactRefCleanup(applyReactEffectTiming(contents)),
    );
  }
  const config = await resolveConfig(filepath);
  return format(contents, { ...(config ?? {}), filepath });
}

async function readFormattedOutput(filepath: string): Promise<string> {
  const config = await resolveConfig(filepath);
  return format(readFileSync(filepath, "utf8"), { ...(config ?? {}), filepath });
}
