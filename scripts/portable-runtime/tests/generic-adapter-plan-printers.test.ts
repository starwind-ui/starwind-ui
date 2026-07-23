import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import { format, resolveConfig } from "prettier";
import { describe, expect, it } from "vitest";
import { normalizeAstroPrimitiveOutput } from "../renderers/framework-adapters/astro/primitive-output-writer.js";
import {
  applyReactEffectTiming,
  applyReactRefCleanup,
} from "../renderers/framework-adapters/react/primitive-output-writer.js";

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
import {
  astroFrameworkAdapter,
  getPrimitiveFrameworkAdapterTargetsWithOutputModelCapability,
  reactFrameworkAdapter,
} from "../renderers/framework-adapters/index.js";
import { getPrimitiveFrameworkAdapterTargetsForComponent } from "../renderers/framework-adapters/target-registry.js";
import { booleanFormControlAdapterFamilyPlan } from "../renderers/generic-adapter-plan/families/boolean-form-control.js";
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

function buildTargetGenericAdapterOutputModel(plan: GenericAdapterPlan, target: "astro" | "react") {
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

    const astroRoot = astroFiles.find((file) => file.path === "button/ButtonRoot.astro")?.contents;
    const reactRoot = reactFiles.find((file) => file.path === "button/ButtonRoot.tsx")?.contents;

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

    expect(reactRoot).toContain(
      "export type ButtonRootProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {",
    );
    expect(reactRoot).toContain("focusableWhenDisabled?: boolean;");
    expect(reactRoot).toContain('type?: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];');
    expect(reactRoot).toContain("React.forwardRef<HTMLButtonElement, ButtonRootProps>");
    expect(reactRoot).toContain(
      "const instanceRef = React.useRef<ReturnType<typeof createButton> | null>(null);",
    );
    expect(reactRoot).toContain("if (!focusableWhenDisabled)");
    expect(reactRoot).toContain("disabled: disabledRef.current,");
    expect(reactRoot).not.toContain("focusableWhenDisabled,\n    });");
    expect(reactRoot).toContain("instanceRef.current?.setDisabled(disabled);");
    expect(reactRoot).toContain("}, [focusableWhenDisabled]);");
    expect(reactRoot).toContain("}, [disabled]);");
    expect(reactRoot).toContain("data-sw-button");
    expect(reactRoot).toContain(
      'data-focusable-when-disabled={focusableWhenDisabled ? "true" : undefined}',
    );
    expect(reactRoot).toContain(
      'aria-disabled={disabled && focusableWhenDisabled ? "true" : undefined}',
    );
    expect(reactRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(reactRoot).toContain("disabled={disabled && !focusableWhenDisabled}");
    expect(reactRoot).toContain('type={type ?? "button"}');
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

    expect(astroRoot).toContain('import { createDialog } from "@starwind-ui/runtime/dialog";');
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
      'getInitCandidates(event, "[data-sw-dialog]").forEach((root) => createDialog(root));',
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

    expect(reactRoot).toContain('from "@starwind-ui/runtime/dialog";');
    expect(reactRoot).toContain("defaultOpen = false");
    expect(reactRoot).toContain("closeOnOutsideInteract = true");
    expect(reactRoot).toContain("modal = true");
    expect(reactRoot).toContain("const onCloseCompleteRef = React.useRef(onCloseComplete);");
    expect(reactRoot).toContain("const onOpenChangeRef = React.useRef(onOpenChange);");
    expect(reactRoot).toContain("const defaultOpenRef = React.useRef(defaultOpen);");
    expect(reactRoot).toContain("const [uncontrolledOpen, setUncontrolledOpenState]");
    expect(reactRoot).toContain("defaultOpen: uncontrolledOpenRef.current");
    expect(reactRoot).toContain("onCloseCompleteRef.current?.(details);");
    expect(reactRoot).toContain("onOpenChange: (nextOpen, details)");
    expect(reactRoot).toContain("if (details.isCanceled) return;");
    expect(reactRoot).toContain("setUncontrolledOpen(nextOpen);");
    expect(reactRoot).not.toContain('instance.subscribe("openChange"');
    expect(reactRoot).toContain("instance.setOpen(open, { emit: false });");
    expect(reactRoot).toContain("}, [closeOnEscape, closeOnOutsideInteract, modal]);");
    expect(reactRoot).toContain('data-default-open={defaultOpenRef.current ? "true" : undefined}');
    expect(reactRoot).toContain(
      'data-close-on-outside-interact={closeOnOutsideInteract ? "true" : "false"}',
    );
    expect(reactRoot).toContain('data-modal={modal ? "true" : "false"}');
    expect(reactTrigger).toContain('type="button"');
    expect(reactTrigger).toContain("data-sw-dialog-target-id={targetId}");
    expect(reactTrigger).toContain('data-state="closed"');
    expect(reactBackdrop).toContain("data-sw-dialog-overlay");
    expect(reactBackdrop).toContain('data-state="closed"');
    expect(reactBackdrop).toContain("hidden");
    expect(reactPopup).toContain("React.DialogHTMLAttributes<HTMLDialogElement>");
    expect(reactClose).toContain('type="button"');
    expect(reactClose).toContain("data-sw-dialog-close");
    expect(reactIndex).toContain('import DialogRoot from "./DialogRoot";');
    expect(reactIndex).toContain("Root: DialogRoot");
    expect(reactIndex).toContain(
      "export type { DialogCloseCompleteDetails, DialogOpenChangeDetails }",
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

        expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
          await readFormattedOutput(packagePath),
        );
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
        `import { ${plan.runtime.factory} } from "${plan.runtime.importSource}";`,
      );
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
      expect(reactRoot).toContain(`from "${plan.runtime.importSource}";`);
      expect(reactRoot).toContain("const onCloseCompleteRef = React.useRef(onCloseComplete);");
      expect(reactRoot).toContain("const onOpenChangeRef = React.useRef(onOpenChange);");
      expect(reactRoot).toContain("defaultOpen: uncontrolledOpenRef.current");
      expect(reactRoot).toContain("onCloseCompleteRef.current?.(details);");
      expect(reactRoot).toContain("onOpenChange: (nextOpen, details)");
      expect(reactRoot).toContain("if (details.isCanceled) return;");
      expect(reactRoot).toContain("instance.setOpen(open, { emit: false });");
      expect(reactRoot).toContain("}, [closeOnEscape, closeOnOutsideInteract, modal]);");
      expect(reactTrigger).toContain('type="button"');
      expect(reactTrigger).toContain('data-state="closed"');

      if (component === "alert-dialog") {
        expect(astroRoot).toContain("closeOnOutsideInteract = false");
        expect(astroRoot).toContain(
          'getInitCandidates(event, "[data-sw-alert-dialog]").forEach((root) => createAlertDialog(root));',
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
        expect(reactRoot).toContain("closeOnOutsideInteract = false");
        expect(reactTrigger).toContain("data-sw-alert-dialog-target-id={targetId}");
        expect(reactBackdrop).toContain("data-sw-alert-dialog-backdrop");
        expect(reactBackdrop).toContain('data-state="closed"');
        expect(reactBackdrop).toContain("hidden");
        expect(reactPortal).toContain("data-sw-alert-dialog-portal");
        expect(reactViewport).toContain("data-sw-alert-dialog-viewport");
        expect(reactPopup).toContain('role="alertdialog"');
        expect(reactClose).toContain('type="button"');
        expect(reactClose).toContain("data-sw-alert-dialog-close");
        expect(reactIndex).toContain("Root: AlertDialogRoot");
        expect(reactIndex).toContain("Portal: AlertDialogPortal");
        expect(reactIndex).toContain("Viewport: AlertDialogViewport");
        expect(reactIndex).toContain(
          "AlertDialogCloseCompleteDetails,\n  AlertDialogOpenChangeDetails,",
        );
      } else {
        expect(astroRoot).toContain("closeOnOutsideInteract = true");
        expect(astroRoot).toContain(
          'getInitCandidates(event, "[data-sw-drawer]").forEach((root) => createDrawer(root));',
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
        expect(reactRoot).toContain("export type DrawerRootProps");
        expect(reactRoot).toContain("closeOnOutsideInteract = true");
        expect(reactTrigger).toContain("data-sw-drawer-target-id={targetId}");
        expect(reactBackdrop).toContain("data-sw-drawer-backdrop");
        expect(reactBackdrop).toContain('data-state="closed"');
        expect(reactBackdrop).toContain("hidden");
        expect(reactPortal).toContain("data-sw-drawer-portal");
        expect(reactViewport).toContain("data-sw-drawer-viewport");
        expect(reactPopup).toContain('side?: "top" | "right" | "bottom" | "left";');
        expect(reactPopup).toContain("React.forwardRef<HTMLDialogElement, DrawerPopupProps>");
        expect(reactPopup).toContain('{ side = "right", ...props }');
        expect(reactPopup).toContain("data-sw-drawer-popup");
        expect(reactPopup).toContain('data-state="closed"');
        expect(reactPopup).toContain("data-side={side}");
        expect(reactClose).toContain('type="button"');
        expect(reactClose).toContain("data-sw-drawer-close");
        expect(reactIndex).toContain("Root: DrawerRoot");
        expect(reactIndex).toContain("Portal: DrawerPortal");
        expect(reactIndex).toContain("Viewport: DrawerViewport");
        expect(reactIndex).toContain("Popup: DrawerPopup");
        expect(reactIndex).toContain(
          "export type { DrawerCloseCompleteDetails, DrawerOpenChangeDetails }",
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

    expect(reactRoot).toContain('from "@starwind-ui/runtime/popover";');
    expect(reactRoot).toContain("export type PopoverRootProps");
    expect(reactRoot).toContain("closeDelay?: number;");
    expect(reactRoot).toContain("modal = false");
    expect(reactRoot).toContain("openOnHover = false");
    expect(reactRoot).toContain("closeDelay = 200");
    expect(reactRoot).toContain("const onCloseCompleteRef = React.useRef(onCloseComplete);");
    expect(reactRoot).toContain("const onOpenChangeRef = React.useRef(onOpenChange);");
    expect(reactRoot).toContain("defaultOpen: uncontrolledOpenRef.current");
    expect(reactRoot).toContain("openOnHover,");
    expect(reactRoot).toContain("onCloseCompleteRef.current?.(details);");
    expect(reactRoot).toContain("onOpenChange: (nextOpen, details)");
    expect(reactRoot).toContain("if (details.isCanceled) return;");
    expect(reactRoot).toContain("setUncontrolledOpen(nextOpen);");
    expect(reactRoot).toContain("instance.setOpen(open, { emit: false });");
    expect(reactRoot).toContain("}, [closeOnEscape, closeOnOutsideInteract, modal, openOnHover]);");
    expect(reactRoot).toContain('data-open-on-hover={openOnHover ? "true" : undefined}');
    expect(reactRoot).toContain("data-close-delay={closeDelay}");
    expect(reactTrigger).toContain("asChild?: boolean;");
    expect(reactTrigger).toContain("useComposedRefs");
    expect(reactTrigger).toContain("React.cloneElement");
    expect(reactTrigger).toContain('"aria-haspopup": "dialog"');
    expect(reactTrigger).toContain('"aria-expanded": "false"');
    expect(reactTrigger).toContain('"data-state": "closed"');
    expect(reactTrigger).toContain('type="button"');
    expect(reactPortal).toContain("data-sw-popover-portal");
    expect(reactPositioner).toContain("PopoverPositionerProps");
    expect(reactPositioner).toContain(
      '{ side = "bottom", align = "center", sideOffset = 4, avoidCollisions = true, collisionStrategy = "initial-placement", ...props }',
    );
    expect(reactPositioner).toContain("data-sw-popover-positioner");
    expect(reactPositioner).toContain("data-side={side}");
    expect(reactPositioner).toContain("data-align={align}");
    expect(reactPositioner).toContain("data-side-offset={sideOffset}");
    expect(reactPositioner).toContain('data-avoid-collisions={avoidCollisions ? "true" : "false"}');
    expect(reactPositioner).toContain("data-collision-strategy={collisionStrategy}");
    expect(reactPopup).toContain("PopoverPopupProps");
    expect(reactPopup).toContain(
      '{ side = "bottom", align = "center", sideOffset = 4, avoidCollisions = true, collisionStrategy = "initial-placement", ...props }',
    );
    expect(reactPopup).toContain("data-sw-popover-popup");
    expect(reactPopup).toContain('role="dialog"');
    expect(reactPopup).toContain("tabIndex={-1}");
    expect(reactPopup).toContain('data-state="closed"');
    expect(reactPopup).toContain("data-side={side}");
    expect(reactPopup).toContain("data-align={align}");
    expect(reactPopup).toContain("data-side-offset={sideOffset}");
    expect(reactPopup).toContain('data-avoid-collisions={avoidCollisions ? "true" : "false"}');
    expect(reactPopup).toContain("data-collision-strategy={collisionStrategy}");
    expect(reactPopup).toContain("hidden");
    expect(reactArrow).toContain("data-sw-popover-arrow");
    expect(reactBackdrop).toContain("data-sw-popover-backdrop");
    expect(reactBackdrop).toContain('data-state="closed"');
    expect(reactBackdrop).toContain("hidden");
    expect(reactClose).toContain('type="button"');
    expect(reactClose).toContain("data-sw-popover-close");
    expect(reactViewport).toContain("data-sw-popover-viewport");
    expect(reactIndex).toContain("Root: PopoverRoot");
    expect(reactIndex).toContain("Positioner: PopoverPositioner");
    expect(reactIndex).toContain("Arrow: PopoverArrow");
    expect(reactIndex).toContain("Viewport: PopoverViewport");
    expect(reactIndex).toContain(
      "export type { PopoverCloseCompleteDetails, PopoverOpenChangeDetails }",
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

        expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
          await readFormattedOutput(packagePath),
        );
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

        expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
          await readFormattedOutput(packagePath),
        );
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
    expect(astroRoot).toContain('querySelectorAll<HTMLElement>("[data-sw-avatar]")');
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

    expect(reactRoot).toContain('import { createAvatar } from "@starwind-ui/runtime/avatar";');
    expect(reactRoot).toContain("const instance = createAvatar(root);");
    expect(reactImage).toContain("AvatarImageLoadingStatus,");
    expect(reactImage).toContain("AvatarLoadingStatusChangeDetails,");
    expect(reactImage).toContain('style={{ ...style, visibility: "hidden" }}');
    expect(reactImage).toContain("hidden={false}");
    expect(reactImage).not.toContain("node.hidden");
    expect(reactImage).toContain(
      'root.addEventListener("starwind:loading-status-change", handleLoadingStatusChange);',
    );
    expect(reactImage).toContain("onLoadingStatusChangeRef.current?.(details.status, details);");
    expect(reactImage).toContain('const status = root.getAttribute("data-image-loading-status")');
    expect(reactImage).toContain(
      'root.removeEventListener("starwind:loading-status-change", handleLoadingStatusChange);',
    );
    expect(reactImage).toContain(
      'onLoadingStatusChangeRef.current?.(status, { previousStatus: "idle", status });',
    );
    expect(reactFallback).toContain("delay?: number;");
    expect(reactFallback).toContain("node.hidden = hidden ?? delay !== undefined;");
    expect(reactFallback).toContain("data-delay={delay}");
    expect(reactIndex).toContain('import AvatarFallback from "./AvatarFallback";');
    expect(reactIndex).toContain('import AvatarImage from "./AvatarImage";');
    expect(reactIndex).toContain('import AvatarRoot from "./AvatarRoot";');
    expect(reactIndex).toContain("const Avatar = {");
    expect(reactIndex).toContain("Root: AvatarRoot");
    expect(reactIndex).toContain("Image: AvatarImage");
    expect(reactIndex).toContain("Fallback: AvatarFallback");
    expect(reactIndex).toContain("export { Avatar, AvatarFallback, AvatarImage, AvatarRoot };");
    expect(reactIndex).toContain("export default Avatar;");
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

    expect(reactRoot).toContain(
      'import { createScrollArea } from "@starwind-ui/runtime/scroll-area";',
    );
    expect(reactRoot).toContain("const instance = createScrollArea(root);");
    expect(reactRoot).toContain("instance.refresh();");
    expect(reactRoot).toContain("instance.destroy();");
    expect(reactRoot).toContain("data-overflow-edge-threshold={thresholdAttributes.shared}");
    expect(reactRoot).toContain("thresholdAttributes.xStart");
    expect(reactRoot).toContain("normalizeOverflowEdgeThresholdValue");
    expect(reactViewport).toContain("tabIndex={tabIndex ?? -1}");
    expect(reactViewport).toContain('style={{ ...style, overflow: "scroll" }}');
    expect(reactContent).toContain('role="presentation"');
    expect(reactScrollbar).toContain("type ScrollAreaOrientation");
    expect(reactScrollbar).toContain("keepMounted?: boolean;");
    expect(reactScrollbar).toContain('data-keep-mounted={keepMounted ? "" : undefined}');
    expect(reactScrollbar).toContain("data-orientation={orientation}");
    expect(reactScrollbar).toContain('aria-hidden="true"');
    expect(reactCorner).toContain('aria-hidden="true"');
    expect(reactIndex).toContain("Root: ScrollAreaRoot");
    expect(reactIndex).toContain("Viewport: ScrollAreaViewport");
    expect(reactIndex).toContain("Content: ScrollAreaContent");
    expect(reactIndex).toContain("Scrollbar: ScrollAreaScrollbar");
    expect(reactIndex).toContain("Thumb: ScrollAreaThumb");
    expect(reactIndex).toContain("Corner: ScrollAreaCorner");
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
    expect(reactRoot).toContain(
      "export type ActionSurfaceProps = React.HTMLAttributes<HTMLSpanElement> & {",
    );
    expect(reactRoot).toContain(
      "const ActionSurface = React.forwardRef<HTMLSpanElement, ActionSurfaceProps>",
    );
    expect(reactRoot).toContain("const rootRef = React.useRef<HTMLSpanElement>(null);");
    expect(reactRoot).toContain("(node: HTMLSpanElement | null) =>");
    expect(reactRoot).toContain("<span");
    expect(reactRoot).toContain('ActionSurface.displayName = "Action.Root";');

    const noPublicRefButton = {
      ...plan,
      refs: [],
    } satisfies GenericAdapterPlan;

    expect(() => printReactGenericAdapterOutputModel(noPublicRefButton)).toThrow(
      "Button generic adapter plan root part must declare a public forwarded ref.",
    );
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

    expect(reactRoot).toContain(
      'import {\n  createProgress,\n  type ProgressValue,\n} from "@starwind-ui/runtime/progress";',
    );
    expect(reactRoot).toContain("format?: Intl.NumberFormatOptions;");
    expect(reactRoot).toContain("value?: ProgressValue;");
    expect(reactRoot).toContain("const instance = createProgress(root, {");
    expect(reactRoot).toContain("ariaValueText: ariaValueTextRef.current,");
    expect(reactRoot).toContain("getAriaValueText: getAriaValueTextRef.current,");
    expect(reactRoot).toContain("instance.setFormatOptions({");
    expect(reactRoot).toContain("ariaValueText,");
    expect(reactRoot).toContain("getAriaValueText,");
    expect(reactRoot).toContain("instance.setValue(value, { max, min })");
    expect(reactRoot).toContain("aria-valuetext={ariaValueText}");
    expect(reactRoot).toContain("data-value={isIndeterminate ? undefined : value}");
    expect(reactRoot).toContain('data-indeterminate={isIndeterminate ? "" : undefined}');
    expect(reactValue).toContain("data-sw-progress-value");
    expect(reactValue).toContain('data-preserve-text={children == null ? undefined : ""}');
    expect(reactValue).toContain('aria-hidden="true"');
    expect(reactLabel).toContain('role="presentation"');
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
    expect(renamedReactRoot).toContain(
      'export type ProgressRootProps = Omit<React.HTMLAttributes<HTMLDivElement>, "currentValue"> & {',
    );
    expect(renamedReactRoot).toContain("currentValue?: ProgressValue;");
    expect(renamedReactRoot).toContain("const isIndeterminate = currentValue == null;");
    expect(renamedReactRoot).toContain("instance.setValue(currentValue, { max, min })");

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
    expect(renamedReactLabel).toContain('role="none"');

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
    expect(reactRoot).toContain("instance.setValue(value, { max, min })");
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

    expect(reactRoot).toContain(
      'export type FieldsetRootProps = React.ComponentPropsWithoutRef<"fieldset">;',
    );
    expect(reactRoot).toContain("{ children, disabled = false, ...props }");
    expect(reactRoot).toContain("const instance = createFieldset(root, { disabled });");
    expect(reactRoot).toContain("instanceRef.current?.setDisabled(disabled);");
    expect(reactRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(reactRoot).toContain("disabled={disabled}");
    expect(reactLegend).toContain(
      'export type FieldsetLegendProps = React.ComponentPropsWithoutRef<"div">;',
    );
    expect(reactLegend).toContain("<div data-sw-fieldset-legend ref={ref} {...props}>");
    expect(reactIndex).toContain('import FieldsetRoot from "./FieldsetRoot";');
    expect(reactIndex).toContain("Legend: FieldsetLegend");
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
    expect(astroRoot).toContain("createInput(input)");
    expect(astroIndex).toContain('import InputRoot from "./InputRoot.astro";');
    expect(astroIndex).toContain("Root: InputRoot");

    expect(reactRoot).toContain("type InputValue,");
    expect(reactRoot).toContain("type InputValueChangeDetails,");
    expect(reactRoot).toContain("React.InputHTMLAttributes<HTMLInputElement>");
    expect(reactRoot).toContain('"defaultValue" | "value"');
    expect(reactRoot).toContain(
      "onValueChange?: (value: string, details: InputValueChangeDetails) => void;",
    );
    expect(reactRoot).toContain("const instance = createInput(root, {");
    expect(reactRoot).toContain("defaultValue: defaultValueRef.current,");
    expect(reactRoot).toContain("onValueChange: (_nextValue, details) => {");
    expect(reactRoot).toContain("if (instance.getValue() === String(value)) return;");
    expect(reactRoot).toContain("instance.setValue(value, { emit: false });");
    expect(reactRoot).toContain("instance.setDisabled(disabled);");
    expect(reactRoot).toContain("const handleChange = React.useCallback(");
    expect(reactRoot).toContain("onValueChangeRef.current?.(nextValue, details);");
    expect(reactRoot).toContain("const valueProps =");
    expect(reactRoot).toContain('data-disabled={disabled ? "" : undefined}');
    expect(reactIndex).toContain('import InputRoot from "./InputRoot";');
    expect(reactIndex).toContain("Root: InputRoot");
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

    expect(reactRoot).toContain(
      'import { createToggle, type TogglePressedChangeDetails } from "@starwind-ui/runtime/toggle";',
    );
    expect(reactRoot).toContain(
      'import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";',
    );
    expect(reactRoot).toContain(
      "onPressedChange?: (pressed: boolean, details: TogglePressedChangeDetails) => void;",
    );
    expect(reactRoot).toContain("const [uncontrolledPressed, setUncontrolledPressedState]");
    expect(reactRoot).toContain("const instance = createToggle(root, {");
    expect(reactRoot).toContain('const unsubscribe = instance.subscribe("pressedChange",');
    expect(reactRoot).toContain("setUncontrolledPressed(details.pressed);");
    expect(reactRoot).toContain("instance.setPressed(pressed, { emit: false, sync: true });");
    expect(reactRoot).toContain("instance.setDisabled(disabled);");
    expect(reactRoot).toContain("const renderedPressed = pressed ?? uncontrolledPressed;");
    expect(reactRoot).toContain('"data-state": renderedPressed ? "on" : "off"');
    expect(reactRoot).toContain("React.forwardRef<HTMLButtonElement | HTMLSpanElement");
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

        expect(await formatGeneratedOutput(readFileSync(outputPath, "utf8"), packagePath)).toBe(
          await readFormattedOutput(packagePath),
        );
      }
    } finally {
      rmSync(outputRoot, { recursive: true, force: true });
    }
  });

  it("prints Toggle Group grouped-value behavior through the Generic Adapter Output Model path", () => {
    const plan = buildGenericAdapterPlan(toggleGroupRuntimeAdapterContract);
    const astroOutputModel = buildTargetGenericAdapterOutputModel(plan, "astro");
    const reactOutputModel = buildTargetGenericAdapterOutputModel(plan, "react");
    const astroFiles = printAstroGenericAdapterOutputModel(plan);
    const reactFiles = printReactGenericAdapterOutputModel(plan);

    expect(plan.category).toBe("controlled-value-group");
    expect(GENERIC_ADAPTER_OUTPUT_MODEL_COMPONENTS).toContain("toggle-group");
    expect(astroOutputModel).toEqual(reactOutputModel);
    expect(astroOutputModel.files.map((file) => file.kind)).toEqual(["component", "index"]);
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

    expect(reactRoot).toContain(
      'import {\n  createToggleGroup,\n  type ToggleGroupValue,\n  type ToggleGroupValueChangeDetails,\n} from "@starwind-ui/runtime/toggle-group";',
    );
    expect(reactRoot).toContain("defaultValue?: ToggleGroupValue;");
    expect(reactRoot).toContain(
      "onValueChange?: (value: ToggleGroupValue, details: ToggleGroupValueChangeDetails) => void;",
    );
    expect(reactRoot).toContain(
      "normalizeRenderedValue(defaultValueRef.current ?? [], multipleRef.current)",
    );
    expect(reactRoot).toContain("const instance = createToggleGroup(root, {");
    expect(reactRoot).toContain('const unsubscribe = instance.subscribe("valueChange",');
    expect(reactRoot).toContain("onValueChangeRef.current?.(details.value, details);");
    expect(reactRoot).toContain("setUncontrolledValue(details.value);");
    expect(reactRoot).toContain("instance.setDisabled(disabled);");
    expect(reactRoot).toContain("instance.setLoopFocus(loopFocus);");
    expect(reactRoot).toContain("instance.setMultiple(multiple);");
    expect(reactRoot).toContain("instance.setOrientation(orientation);");
    expect(reactRoot).toContain("instance.setValue(value, { emit: false });");
    expect(reactRoot).toContain(
      "const renderedValue = normalizeRenderedValue(value ?? uncontrolledValue, multiple);",
    );
    expect(reactRoot).toContain("data-value={JSON.stringify(renderedValue)}");
    expect(reactRoot).toContain(
      "function normalizeRenderedValue(value: ToggleGroupValue, multiple: boolean): ToggleGroupValue",
    );
    expect(reactRoot).not.toContain(".Provider");

    expect(astroIndex).toContain('import ToggleGroupRoot from "./ToggleGroupRoot.astro";');
    expect(astroIndex).toContain("Root: ToggleGroupRoot");
    expect(astroIndex).toContain("export { ToggleGroup, ToggleGroupRoot };");
    expect(reactIndex).toContain('import ToggleGroupRoot from "./ToggleGroupRoot";');
    expect(reactIndex).toContain("Root: ToggleGroupRoot");
    expect(reactIndex).toContain("ToggleGroup,");
    expect(reactIndex).toContain("ToggleGroupRoot,");
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
        await formatGeneratedOutput(
          readFileSync(join(outputRoot, "toggle-group", "ToggleGroupRoot.tsx"), "utf8"),
          reactPackagePath,
        ),
      ).toBe(await readFormattedOutput(reactPackagePath));
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

    expect(reactRoot).toContain(
      'import {\n  type CheckboxGroupValue,\n  type CheckboxGroupValueChangeDetails,\n  createCheckboxGroup,\n} from "@starwind-ui/runtime/checkbox-group";',
    );
    expect(reactRoot).toContain('import { CheckboxGroupContext } from "./CheckboxGroupContext";');
    expect(reactRoot).toContain("defaultValue?: CheckboxGroupValue;");
    expect(reactRoot).toContain("disabled?: boolean;");
    expect(reactRoot).toContain(
      "onValueChange?: (\n    value: CheckboxGroupValue,\n    details: CheckboxGroupValueChangeDetails,\n  ) => void;",
    );
    expect(reactRoot).toContain("value?: CheckboxGroupValue;");
    expect(reactRoot).toContain("const [uncontrolledValue, setUncontrolledValueState]");
    expect(reactRoot).toContain(
      "const setUncontrolledValue = React.useCallback((nextValue: CheckboxGroupValue) => {",
    );
    expect(reactRoot).toContain("const instance = createCheckboxGroup(root, {");
    expect(reactRoot).toContain('const unsubscribe = instance.subscribe("valueChange",');
    expect(reactRoot).toContain("onValueChangeRef.current?.(details.value, details);");
    expect(reactRoot).toContain("setUncontrolledValue(details.value);");
    expect(reactRoot).toContain("const observer = new MutationObserver(syncUncontrolledValue);");
    expect(reactRoot).toContain(
      'parseCheckboxGroupValueAttribute(root.getAttribute("data-value"))',
    );
    expect(reactRoot).toContain("instance.setDisabled(disabled);");
    expect(reactRoot).toContain("instance.setValue(value, { emit: false });");
    expect(reactRoot).toContain(
      "const contextValue = React.useMemo(\n      () => ({ disabled, value: renderedValue }),",
    );
    expect(reactRoot).toContain("<CheckboxGroupContext.Provider value={contextValue}>");
    expect(reactRoot).toContain("data-sw-checkbox-group");
    expect(reactRoot).toContain("data-value={JSON.stringify(renderedValue)}");
    expect(reactRoot).toContain("function parseCheckboxGroupValueAttribute");

    expect(reactContext).toContain(
      'import type { CheckboxGroupValue } from "@starwind-ui/runtime/checkbox-group";',
    );
    expect(reactContext).toContain("export type CheckboxGroupContextValue = {");
    expect(reactContext).toContain("disabled: boolean;");
    expect(reactContext).toContain("value: CheckboxGroupValue;");
    expect(reactContext).toContain(
      "const CheckboxGroupContext = React.createContext<CheckboxGroupContextValue | undefined>(undefined);",
    );
    expect(reactContext).toContain("function useCheckboxGroupContext()");

    expect(astroIndex).toContain('import CheckboxGroupRoot from "./CheckboxGroupRoot.astro";');
    expect(astroIndex).toContain("Root: CheckboxGroupRoot");
    expect(astroIndex).toContain("export { CheckboxGroup, CheckboxGroupRoot };");
    expect(reactIndex).toContain(
      'import {\n  CheckboxGroupContext,\n  type CheckboxGroupContextValue,\n  useCheckboxGroupContext,\n} from "./CheckboxGroupContext";',
    );
    expect(reactIndex).toContain('import CheckboxGroupRoot from "./CheckboxGroupRoot";');
    expect(reactIndex).toContain("Root: CheckboxGroupRoot");
    expect(reactIndex).toContain("CheckboxGroupContext,");
    expect(reactIndex).toContain("type CheckboxGroupContextValue,");
    expect(reactIndex).toContain("CheckboxGroupRoot,");
    expect(reactIndex).toContain("useCheckboxGroupContext,");
    expect(reactIndex).toContain("export default CheckboxGroup;");
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
        await formatGeneratedOutput(
          readFileSync(join(outputRoot, "checkbox-group", "CheckboxGroupRoot.tsx"), "utf8"),
          reactRootPath,
        ),
      ).toBe(await readFormattedOutput(reactRootPath));
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

    expect(reactRoot).toContain(
      'import {\n  createRadioGroup,\n  type RadioGroupValue,\n  type RadioGroupValueChangeDetails,\n} from "@starwind-ui/runtime/radio-group";',
    );
    expect(reactRoot).toContain('import { RadioGroupContext } from "./RadioGroupContext";');
    expect(reactRoot).toContain("defaultValue?: RadioGroupValue;");
    expect(reactRoot).toContain("form?: string;");
    expect(reactRoot).toContain("name?: string;");
    expect(reactRoot).toContain(
      "onValueChange?: (value: string, details: RadioGroupValueChangeDetails) => void;",
    );
    expect(reactRoot).toContain('orientation?: "horizontal" | "vertical";');
    expect(reactRoot).toContain("const instance = createRadioGroup(root, {");
    expect(reactRoot).toContain('const unsubscribe = instance.subscribe("valueChange",');
    expect(reactRoot).toContain("setUncontrolledValue(details.value);");
    expect(reactRoot).toContain("onValueChangeRef.current?.(details.value, details);");
    expect(reactRoot).toContain("instance.setDisabled(disabled);");
    expect(reactRoot).toContain("instance.setFormOptions({");
    expect(reactRoot).toContain("instance.setOrientation(orientation);");
    expect(reactRoot).toContain("instance.setReadOnly(readOnly);");
    expect(reactRoot).toContain("instance.setValue(value, { emit: false });");
    expect(reactRoot).toContain("const renderedValue = value ?? uncontrolledValue;");
    expect(reactRoot).toContain("<RadioGroupContext.Provider value={contextValue}>");
    expect(reactRoot).toContain("data-sw-radio-group");
    expect(reactRoot).toContain("data-default-value={defaultValueRef.current}");
    expect(reactRoot).toContain("data-form={form}");
    expect(reactRoot).toContain("data-name={name}");
    expect(reactRoot).toContain("data-orientation={orientation}");
    expect(reactRoot).toContain("data-value={renderedValue}");
    expect(reactRoot).toContain('aria-disabled={disabled ? "true" : undefined}');
    expect(reactRoot).toContain("aria-orientation={orientation}");
    expect(reactRoot).toContain('aria-readonly={readOnly ? "true" : undefined}');
    expect(reactRoot).toContain('aria-required={required ? "true" : undefined}');

    expect(reactContext).toContain(
      'import type { RadioGroupValue } from "@starwind-ui/runtime/radio-group";',
    );
    expect(reactContext).toContain("export type RadioGroupContextValue = {");
    expect(reactContext).toContain("disabled: boolean;");
    expect(reactContext).toContain("form?: string;");
    expect(reactContext).toContain("name?: string;");
    expect(reactContext).toContain("readOnly: boolean;");
    expect(reactContext).toContain("required: boolean;");
    expect(reactContext).toContain("value: RadioGroupValue;");
    expect(reactContext).toContain("function useRadioGroupContext()");

    expect(reactIndex).toContain(
      'import {\n  RadioGroupContext,\n  type RadioGroupContextValue,\n  useRadioGroupContext,\n} from "./RadioGroupContext";',
    );
    expect(reactIndex).toContain('import RadioGroupRoot from "./RadioGroupRoot";');
    expect(reactIndex).toContain("Root: RadioGroupRoot");
    expect(reactIndex).toContain("RadioGroupContext,");
    expect(reactIndex).toContain("type RadioGroupContextValue,");
    expect(reactIndex).toContain("RadioGroupRoot,");
    expect(reactIndex).toContain("useRadioGroupContext,");
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

    expect(reactRoot).toContain(
      'import { type CollapsibleOpenChangeDetails, createCollapsible } from "@starwind-ui/runtime/collapsible";',
    );
    expect(reactRoot).toContain("open?: boolean;");
    expect(reactRoot).toContain(
      "onOpenChange?: (open: boolean, details: CollapsibleOpenChangeDetails) => void;",
    );
    expect(reactRoot).toContain("const instance = createCollapsible(root, {");
    expect(reactRoot).toContain('const unsubscribe = instance.subscribe("openChange",');
    expect(reactRoot).toContain("onOpenChangeRef.current?.(details.open, details);");
    expect(reactRoot).toContain("if (details.isCanceled) return;");
    expect(reactRoot).toContain("if (openRef.current === undefined) {");
    expect(reactRoot).toContain("setUncontrolledOpen(details.open);");
    expect(reactRoot).toContain("instance.setOpen(open, { emit: false });");
    expect(reactRoot).toContain("const renderedOpen = open ?? uncontrolledOpen;");
    expect(reactRoot).toContain('data-state={renderedOpen ? "open" : "closed"}');

    expect(reactTrigger).toContain(
      "import { getAsChildElement, getElementRef, mergeAsChildProps, useComposedRefs }",
    );
    expect(reactTrigger).toContain("React.cloneElement(child");
    expect(reactTrigger).toContain("mergeAsChildProps({ ...triggerProps, className }, childProps");
    expect(reactTrigger).toContain('"data-sw-collapsible-trigger": ""');
    expect(reactTrigger).toContain("ref: composedRef");

    expect(reactPanel).toContain("hiddenUntilFound?: boolean;");
    expect(reactPanel).toContain('node.setAttribute("hidden", "until-found");');
    expect(reactPanel).toContain('node.getAttribute("hidden") === "until-found"');
    expect(reactPanel).toContain("hidden");

    expect(astroIndex).toContain('import CollapsiblePanel from "./CollapsiblePanel.astro";');
    expect(astroIndex).toContain("Panel: CollapsiblePanel");
    expect(astroIndex).toContain(
      "export { Collapsible, CollapsiblePanel, CollapsibleRoot, CollapsibleTrigger };",
    );
    expect(reactIndex).toContain('import CollapsiblePanel from "./CollapsiblePanel";');
    expect(reactIndex).toContain("Panel: CollapsiblePanel");
    expect(reactIndex).toContain(
      "export { Collapsible, CollapsiblePanel, CollapsibleRoot, CollapsibleTrigger };",
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

        expect(await formatGeneratedOutput(readFileSync(outputPath, "utf8"), packagePath)).toBe(
          await readFormattedOutput(packagePath),
        );
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

    expect(reactRoot).toContain(
      'import { createForm, type FormValidationTiming } from "@starwind-ui/runtime/form";',
    );
    expect(reactRoot).toContain("React.forwardRef<HTMLFormElement, FormRootProps>");
    expect(reactRoot).not.toContain("useImperativeHandle");
    expect(reactRoot).toContain("validationTiming?: FormValidationTiming;");
    expect(reactRoot).toContain('"data-validation-timing": dataValidationTiming');
    expect(reactRoot).toContain(
      "data-validation-timing={dataValidationTiming ?? validationTiming}",
    );
    expect(reactRoot).toContain("const instance = createForm(root);");
    expect(reactRoot).toContain("instance.destroy();");
    expect(reactRoot).not.toContain("novalidate");
    expect(reactRoot).not.toContain("noValidate");

    expect(reactErrorSummary).toContain("React.forwardRef<HTMLDivElement, FormErrorSummaryProps>");
    expect(reactErrorSummary).toContain("data-sw-form-error-summary");
    expect(reactErrorSummary).toContain('data-slot="form-error-summary"');
    expect(reactErrorSummary).toContain('role = "status"');
    expect(reactErrorSummary).toContain('"aria-live": ariaLive = "polite"');
    expect(reactErrorSummary).toContain("hidden={hidden}");

    expect(astroIndex).toContain('import FormErrorSummary from "./FormErrorSummary.astro";');
    expect(astroIndex).toContain("ErrorSummary: FormErrorSummary");
    expect(reactIndex).toContain('import FormErrorSummary from "./FormErrorSummary";');
    expect(reactIndex).toContain("Root: FormRoot");
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

        expect(await formatGeneratedOutput(readFileSync(outputPath, "utf8"), packagePath)).toBe(
          await readFormattedOutput(packagePath),
        );
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

    expect(reactRoot).toContain(
      'import { createSwitch, type SwitchCheckedChangeDetails } from "@starwind-ui/runtime/switch";',
    );
    expect(reactRoot).toContain("inputRef?: React.Ref<HTMLInputElement>;");
    expect(reactRoot).toContain("const visuallyHiddenStyle = {");
    expect(reactRoot).toContain("const instance = createSwitch(root, {");
    expect(reactRoot).toContain(
      'formElement?.addEventListener("reset", syncUncontrolledAfterFormReset);',
    );
    expect(reactRoot).toContain("setUncontrolledChecked(details.checked);");
    expect(reactRoot).toContain("instance.setChecked(checked, { emit: false });");
    expect(reactRoot).toContain("instance.setDisabled(disabled);");
    expect(reactRoot).toContain("instance.setFormOptions({");
    expect(reactRoot).toContain("uncheckedValue,");
    expect(reactRoot).toContain("}, [form, name, required, uncheckedValue, value]);");
    expect(reactRoot).toContain("}, [id, nativeButton, readOnly]);");
    expect(reactRoot).not.toContain(
      "}, [form, id, name, nativeButton, readOnly, required, uncheckedValue, value]);",
    );
    expect(reactRoot).toContain('"data-filled": renderedChecked ? "" : undefined');
    expect(reactRoot).toContain("defaultChecked={defaultCheckedRef.current}");
    expect(reactRoot).toContain("id={getSwitchInputId(id, nativeButton)}");
    expect(reactThumb).toContain(
      "return <span data-sw-switch-thumb ref={forwardedRef} {...props} />;",
    );
    expect(reactThumb).not.toContain("data-unchecked");
  });

  it("keeps boolean control matching, facts, and output modeling in family modules", () => {
    const switchPlan = buildGenericAdapterPlan(switchRuntimeAdapterContract);
    const checkboxPlan = buildGenericAdapterPlan(checkboxRuntimeAdapterContract);
    const radioPlan = buildGenericAdapterPlan(radioRuntimeAdapterContract);
    const togglePlan = buildGenericAdapterPlan(toggleRuntimeAdapterContract);
    const switchNearMiss: GenericAdapterPlan = {
      ...switchPlan,
      component: "switch-near-miss",
    };
    const toggleNearMiss: GenericAdapterPlan = {
      ...togglePlan,
      component: "toggle-near-miss",
    };

    expect(booleanFormControlAdapterFamilyPlan.matches(switchPlan)).toBe(true);
    expect(booleanFormControlAdapterFamilyPlan.matches(checkboxPlan)).toBe(true);
    expect(booleanFormControlAdapterFamilyPlan.matches(radioPlan)).toBe(true);
    expect(booleanFormControlAdapterFamilyPlan.matches(switchNearMiss)).toBe(false);

    const switchOutputModel = booleanFormControlAdapterFamilyPlan.buildOutputModel(switchPlan);

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
    expect(() => booleanFormControlAdapterFamilyPlan.buildOutputModel(switchNearMiss)).toThrow(
      "Switch generic adapter plan is not a boolean form-control plan.",
    );

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
      "index",
      "index",
    ]);
    expect(checkboxGroupOutputModel.files.map((file) => file.target ?? "all")).toEqual([
      "all",
      "react",
      "astro",
      "react",
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
    ]);

    const toggleGroupOutputModel =
      groupedValueControlAdapterFamilyPlan.buildOutputModel(toggleGroupPlan);

    expect(toggleGroupOutputModel.files.map((file) => file.kind)).toEqual(["component", "index"]);
    expect(toggleGroupOutputModel.files.find((file) => file.kind === "index")).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({ kind: "grouped-value-control" }),
      }),
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
    expect(reactRoot).toContain("<input\n        data-sw-switch-native-input");
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

    expect(reactRoot).toContain(
      'import { type CheckboxCheckedChangeDetails, createCheckbox } from "@starwind-ui/runtime/checkbox";',
    );
    expect(reactRoot).toContain(
      'import { useCheckboxGroupContext } from "../checkbox-group/CheckboxGroupContext";',
    );
    expect(reactRoot).toContain("const checkboxGroup = useCheckboxGroupContext();");
    expect(reactRoot).toContain(
      "const groupChecked =\n      checkboxGroup && groupValue !== undefined\n        ? checkboxGroup.value.includes(groupValue)\n        : undefined;",
    );
    expect(reactRoot).toContain(
      "const effectiveDisabled = disabled || checkboxGroup?.disabled === true;",
    );
    expect(reactRoot).toContain("const nextControlledChecked = checked ?? groupChecked;");
    expect(reactRoot).toContain(
      "if (nextControlledChecked !== undefined && instance.getChecked() !== nextControlledChecked) {",
    );
    expect(reactRoot).toContain("instance.setChecked(nextControlledChecked, { emit: false });");
    expect(reactRoot).toContain("instance.setIndeterminate(indeterminate, { emit: false });");
    expect(reactRoot).toContain("}, [checked, groupChecked, indeterminate]);");
    expect(reactRoot).toContain("const indeterminateRef = React.useRef(indeterminate);");
    expect(reactRoot).toContain("indeterminateRef.current = indeterminate;");
    expect(reactRoot.match(/if \(!indeterminateRef\.current\) \{/g)).toHaveLength(2);
    expect(reactRoot).not.toContain("instance.setChecked(checked, { emit: false });");
    expect(reactRoot).not.toContain("instance.setChecked(groupChecked, { emit: false });");
    expect(reactRoot).toContain("instance.setDisabled(effectiveDisabled);");
    expect(reactRoot).toContain('const ariaChecked: React.AriaAttributes["aria-checked"]');
    expect(reactRoot).toContain('"aria-checked": ariaChecked');
    expect(reactRoot).toContain("<input\n        data-sw-checkbox-input");
    expect(reactIndicator).toContain("keepMounted?: boolean;");
    expect(reactIndicator).toContain("node.hidden = hidden ?? !keepMounted;");
    expect(reactIndicator).toContain("data-sw-checkbox-indicator");
    expect(reactIndicator).toContain('data-keep-mounted={keepMounted ? "true" : undefined}');
    expect(reactIndicator).toContain("data-unchecked");
    expect(reactIndicator).toContain("React.forwardRef<HTMLSpanElement");
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

    expect(reactIndex).toContain('import CheckboxIndicator from "./CheckboxIndicator";');
    expect(reactIndex).toContain('import CheckboxRoot from "./CheckboxRoot";');
    expect(reactIndex).toContain("Root: CheckboxRoot");
    expect(reactIndex).toContain("Indicator: CheckboxIndicator");
    expect(reactIndex).toContain("export { Checkbox, CheckboxIndicator, CheckboxRoot };");
    expect(reactIndex).not.toContain("CheckboxInput");
    expect(reactIndex).not.toContain("CheckboxUncheckedInput");
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

    expect(reactRoot).toContain(
      'import { createRadio, type RadioCheckedChangeDetails } from "@starwind-ui/runtime/radio";',
    );
    expect(reactRoot).toContain(
      'import { useRadioGroupContext } from "../radio-group/RadioGroupContext";',
    );
    expect(reactRoot).toContain("const radioGroup = useRadioGroupContext();");
    expect(reactRoot).toContain(
      "const groupChecked = radioGroup && value !== undefined ? radioGroup.value === value : undefined;",
    );
    expect(reactRoot).toContain("const effectiveForm = form ?? radioGroup?.form;");
    expect(reactRoot).toContain("const effectiveName = name ?? radioGroup?.name;");
    expect(reactRoot).toContain(
      "const effectiveReadOnly = readOnly || radioGroup?.readOnly === true;",
    );
    expect(reactRoot).toContain(
      "const effectiveRequired = required || radioGroup?.required === true;",
    );
    expect(reactRoot).toContain("instance.setChecked(checked, { emit: false });");
    expect(reactRoot).toContain("instance.setDisabled(effectiveDisabled);");
    expect(reactRoot).toContain("instance.setReadOnly(effectiveReadOnly);");
    expect(reactRoot).toContain("instance.setFormOptions({");
    expect(reactRoot).toContain("value,");
    expect(reactRoot).toContain("id={nativeButton ? undefined : id}");
    expect(reactRoot).toContain("<input\n        data-sw-radio-input");
    expect(reactIndicator).toContain("keepMounted?: boolean;");
    expect(reactIndicator).toContain("node.hidden = hidden ?? !keepMounted;");
    expect(reactIndicator).toContain("data-sw-radio-indicator");
    expect(reactIndicator).toContain('data-keep-mounted={keepMounted ? "true" : undefined}');
    expect(reactIndicator).toContain("data-unchecked");
    expect(reactIndicator).toContain("React.forwardRef<HTMLSpanElement");
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

    expect(reactIndex).toContain('import RadioIndicator from "./RadioIndicator";');
    expect(reactIndex).toContain('import RadioRoot from "./RadioRoot";');
    expect(reactIndex).toContain("Root: RadioRoot");
    expect(reactIndex).toContain("Indicator: RadioIndicator");
    expect(reactIndex).toContain("export { Radio, RadioIndicator, RadioRoot };");
    expect(reactIndex).not.toContain("RadioInput");
  });

  it("rejects unsupported boolean form-control behavior facts before printing", () => {
    const model = buildGenericAdapterOutputModel(
      buildGenericAdapterPlan(switchRuntimeAdapterContract),
    );
    const rootFile = model.files.find(
      (file) =>
        file.kind === "component" &&
        file.component.family?.kind === "boolean-form-control" &&
        file.component.family.part === "root",
    );

    if (!rootFile || rootFile.kind !== "component") {
      throw new Error("Switch root output-model component was not found.");
    }

    if (rootFile.component.family?.kind !== "boolean-form-control") {
      throw new Error("Switch root output-model component is not a boolean form-control.");
    }

    rootFile.component.family.facts.behavior.inputIdStrategy = "always-prop";

    expect(() => printGenericAdapterOutputModel(reactFrameworkAdapter, model)).toThrow(
      /behavior\.inputIdStrategy/,
    );
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

        expect(await formatGeneratedOutput(readFileSync(generatedPath, "utf8"), packagePath)).toBe(
          await readFormattedOutput(packagePath),
        );
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
      : applyReactRefCleanup(file.contents);
    expect(normalizePrintedComparison(contents)).toBe(
      normalizePrintedComparison(readGeneratedPackageBody(packageSourceDirectory, file.path)),
    );
  }
}

function normalizePrintedComparison(contents: string): string {
  return contents
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
    contents = applyReactRefCleanup(applyReactEffectTiming(contents));
  }
  const config = await resolveConfig(filepath);
  return format(contents, { ...(config ?? {}), filepath });
}

async function readFormattedOutput(filepath: string): Promise<string> {
  return formatGeneratedOutput(readFileSync(filepath, "utf8"), filepath);
}
