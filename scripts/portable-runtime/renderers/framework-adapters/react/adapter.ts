import { assertBooleanStatePolicy } from "../../primitive-output-model/boolean-state-policy.js";
import { requireRefreshConnection } from "../../primitive-output-model/refresh-connection.js";
import { assertSidebarConnection } from "../../primitive-output-model/sidebar-connection.js";
import { renderFormGroup } from "../../shared-recipes/grouped/groups.js";
import { renderRadioIndicator, renderRadioRoot } from "../../shared-recipes/grouped/radio.js";
import {
  avatarFallbackHidden,
  avatarRecipe,
  avatarRefresh,
  avatarRefreshInputs,
  avatarSubscription,
} from "../../shared-recipes/media/avatar.js";
import { scrollAreaRecipe, scrollAreaThresholds } from "../../shared-recipes/media/scroll-area.js";
import { renderTabs as renderRecipeTabs } from "../../shared-recipes/selection/tabs.js";
import { renderAccordionRoot as renderSharedAccordionRoot } from "../../shared-recipes/structured/accordion-root.js";
import { renderCollapsibleRoot } from "../../shared-recipes/structured/disclosure/frame.js";
import {
  collapsibleParts,
  disclosureDisabled,
} from "../../shared-recipes/structured/disclosure/recipe.js";
import {
  connectField,
  disconnectField,
  fieldMatch,
  fieldSynchronizations,
} from "../../shared-recipes/structured/document-controls/field-recipe.js";
import {
  connectDocumentOwner,
  disposeDocumentOwner,
  formReactivePropTypes,
  formReactiveTypeImports,
  formSummaryDefaults,
  formTimingValue,
  updateFormErrors,
  updateFormOptions,
} from "../../shared-recipes/structured/document-controls/form-policy.js";
import { dropzoneIndicatorHidden } from "../../shared-recipes/structured/file-controls/dropzone-recipe.js";
import { otpCaretFallbackClass } from "../../shared-recipes/structured/file-controls/input-otp-recipe.js";
import { checkboxIndicatorPolicy } from "../../shared-recipes/structured/forms/indicator.js";
import { renderFormRoot } from "../../shared-recipes/structured/forms/root.js";
import { renderNativeRoot } from "../../shared-recipes/structured/native.js";
import {
  accordionDisabled,
  accordionPartPolicy,
  controlAttributes,
  partAttributes,
  popoverPartPolicy,
} from "../../shared-recipes/structured/part-policy.js";
import { renderRoot as renderSharedPopoverRoot } from "../../shared-recipes/structured/popover.js";
import { renderSlider } from "../../shared-recipes/structured/range/frame.js";
import { renderSidebarProvider } from "../../shared-recipes/structured/sidebar/frame.js";
import { sidebarAttrs } from "../../shared-recipes/structured/sidebar/parts.js";
import { renderTimedRoot } from "../../shared-recipes/structured/timed/frame.js";
import { timedTriggerPolicy } from "../../shared-recipes/structured/timed/recipe.js";
import {
  renderToggle as renderRecipeToggle,
  renderToggleGroup as renderRecipeToggleGroup,
} from "../../shared-recipes/toggle-selection/recipe.js";
import { defineFrameworkAdapter } from "../conformance.js";
import { checkboxIndicatorTransport } from "../form-control-operations.js";
import type {
  AdapterAttribute,
  AdapterBooleanFormControlComponentProjection,
  AdapterBooleanFormControlFacts,
  AdapterBooleanFormControlIndexProjection,
  AdapterComponentFile,
  AdapterComponentModel,
  AdapterContextProjection,
  AdapterControlledValuePresenceComponentProjection,
  AdapterControlledValuePresenceFacts,
  AdapterControlledValuePresenceHelperProjection,
  AdapterControlledValuePresenceIndexProjection,
  AdapterDisclosurePresenceComponentProjection,
  AdapterDisclosurePresenceFacts,
  AdapterDisclosurePresenceIndexProjection,
  AdapterElementRenderNode,
  AdapterEventBridge,
  AdapterExportMember,
  AdapterFileDropControlComponentProjection,
  AdapterFileDropControlFacts,
  AdapterFileDropControlIndexProjection,
  AdapterFormControlCompositionComponentProjection,
  AdapterFormControlCompositionFacts,
  AdapterFormControlCompositionIndexProjection,
  AdapterFormFieldCoordinatorComponentProjection,
  AdapterFormFieldCoordinatorFacts,
  AdapterFormFieldCoordinatorIndexProjection,
  AdapterGroupedValueControlComponentProjection,
  AdapterGroupedValueControlFacts,
  AdapterGroupedValueControlHelperProjection,
  AdapterHiddenInputVisualSlotComponentProjection,
  AdapterHiddenInputVisualSlotFacts,
  AdapterHiddenInputVisualSlotIndexProjection,
  AdapterImport,
  AdapterIndexFile,
  AdapterMediaStatusComponentProjection,
  AdapterMediaStatusFacts,
  AdapterMediaStatusIndexProjection,
  AdapterNamespaceExport,
  AdapterNativeOverlayComponentProjection,
  AdapterNativeOverlayFacts,
  AdapterNativeOverlayIndexProjection,
  AdapterPortal,
  AdapterPresenceFloatingOverlayComponentProjection,
  AdapterPresenceFloatingOverlayFacts,
  AdapterPresenceFloatingOverlayIndexProjection,
  AdapterPrintedFile,
  AdapterProp,
  AdapterRangeControlComponentProjection,
  AdapterRangeControlFacts,
  AdapterRangeControlIndexProjection,
  AdapterRenderNode,
  AdapterRepeatedDisclosureComponentProjection,
  AdapterRepeatedDisclosureFacts,
  AdapterRepeatedDisclosureIndexProjection,
  AdapterSidebarComponentProjection,
  AdapterSidebarFacts,
  AdapterSidebarHelperProjection,
  AdapterSidebarIndexProjection,
  AdapterSingleBooleanControlComponentProjection,
  AdapterSingleBooleanControlFacts,
  AdapterSingleBooleanControlIndexProjection,
  AdapterTimedFloatingOverlayComponentProjection,
  AdapterTimedFloatingOverlayFacts,
  AdapterTimedFloatingOverlayIndexProjection,
  AdapterViewportMeasurementComponentProjection,
  AdapterViewportMeasurementFacts,
  AdapterViewportMeasurementIndexProjection,
  FrameworkAdapter,
} from "../types.js";
import {
  printReactActionSurfaceComponent,
  printReactActionSurfaceIndex,
} from "./action-surface.js";
import {
  printReactAnchoredMenuOverlayComponent,
  printReactAnchoredMenuOverlayIndex,
} from "./anchored-menu-overlay.js";
import {
  renderReactAsChildCloneBranch,
  renderReactAsChildImports,
  renderReactAsChildSetup,
} from "./as-child-trigger-fragments.js";
import {
  assertBooleanFormControlBehavior,
  renderReactBooleanControlledSetters,
  renderReactBooleanDisabledSetter,
  renderReactBooleanIndeterminateControlledSetters,
  renderReactBooleanMutationSync,
  renderVisuallyHiddenStyle,
  requireGroupFacts,
} from "./boolean-form-control-fragments.js";
import {
  printReactColorPickerComponent,
  printReactColorPickerIndex,
  type ReactColorPickerComponentProjection,
  type ReactColorPickerIndexProjection,
} from "./color-picker.js";
import {
  printReactCompositeMenuOverlayComponent,
  printReactCompositeMenuOverlayHelper,
  printReactCompositeMenuOverlayIndex,
} from "./composite-menu-overlay.js";
import { printReactDropzoneRoot } from "./dropzone-root.js";
import {
  printReactEditableCollectionOverlayComponent,
  printReactEditableCollectionOverlayHelper,
  printReactEditableCollectionOverlayIndex,
} from "./editable-collection-overlay.js";
import {
  printReactEngineViewportComponent,
  printReactEngineViewportIndex,
} from "./engine-viewport.js";
import { exportPrinter } from "./exports.js";
import { printReactInputOtpRoot } from "./input-otp-root.js";
import {
  printReactNativeDisabledComponent,
  printReactNativeDisabledIndex,
} from "./native-disabled.js";
import {
  printReactNativeInputValueComponent,
  printReactNativeInputValueIndex,
} from "./native-input-value.js";
import {
  printReactNotificationSystemComponent,
  printReactNotificationSystemIndex,
} from "./notification-system.js";
import {
  printReactOptionCollectionOverlayComponent,
  printReactOptionCollectionOverlayHelper,
  printReactOptionCollectionOverlayIndex,
} from "./option-collection-overlay.js";
import {
  printReactPresenceFloatingOverlayPopup,
  printReactPresenceFloatingOverlayPositioner,
  printReactPresenceFloatingOverlaySimplePart,
  printReactTimedFloatingOverlayPopup,
  printReactTimedFloatingOverlayPositioner,
} from "./overlay-presence-fragments.js";
import { addReactPortalScope, printReactPortalComponent } from "./portal.js";
import { printReactRangeStatusComponent, printReactRangeStatusIndex } from "./range-status.js";
import { groupOperations } from "./recipe-form-group.js";
import { radioOperations } from "./recipe-radio.js";
import { toggleOperations } from "./recipe-toggle.js";
import {
  printReactSharedViewportNavigationComponent,
  printReactSharedViewportNavigationIndex,
} from "./shared-viewport-navigation.js";
import { printReactTimedPassive } from "./timed-recipe.js";

const REACT_FIELD_CONTROL_INPUT_PRIMITIVE = {
  importSource: "../input/InputRoot",
  valueChangeDetailsType: "InputValueChangeDetails",
  valueChangeProp: "onValueChange",
  valueType: "InputValue",
} as const;

export const reactFrameworkAdapter = defineFrameworkAdapter({
  target: "react",
  fileExtension: ".tsx",
  printOutput(model) {
    return model.files
      .filter((file) => !file.target || file.target === this.target)
      .map((file) => {
        let printedFile: AdapterPrintedFile;
        if (file.kind === "component") printedFile = this.printComponentFile(file);
        else if (file.kind === "helper") printedFile = this.printHelperFile(file);
        else if (file.kind === "index") printedFile = this.printIndexFile(file);
        else printedFile = this.printTypeFacadeFile(file);

        return applyReactClientDirective(printedFile);
      });
  },
  printComponentFile(file) {
    return {
      contents: applyReactFamilyPrintNormalizations(file, printReactComponent(file)),
      path: `${file.path}${this.fileExtension}`,
    };
  },
  printHelperFile(file) {
    if (file.family?.kind === "controlled-value-presence") {
      return {
        contents: printReactControlledValuePresenceHelper(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "grouped-value-control") {
      return {
        contents: printReactGroupedValueControlHelper(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "option-collection-overlay") {
      return {
        contents: printReactOptionCollectionOverlayHelper(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "editable-collection-overlay") {
      return {
        contents: printReactEditableCollectionOverlayHelper(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "sidebar-context") {
      return {
        contents: printReactSidebarContext(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "composite-menu-overlay-radio-context") {
      return {
        contents: printReactCompositeMenuOverlayHelper(file.family),
        path: file.path,
      };
    }

    return {
      contents: [
        printImports(file.imports),
        `export function ${file.name}(value: unknown) {`,
        indent(file.body.code),
        "}",
      ]
        .filter(Boolean)
        .join("\n"),
      path: file.path,
    };
  },
  printIndexFile(file) {
    if (isReactColorPickerIndexProjection(file.family)) {
      return {
        contents: printReactColorPickerIndex(
          file.family as unknown as ReactColorPickerIndexProjection,
        ),
        path: file.path,
      };
    }

    if (file.family?.kind === "action-surface") {
      return {
        contents: printReactActionSurfaceIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "boolean-form-control") {
      return {
        contents: printReactBooleanFormControlIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "disclosure-presence") {
      return {
        contents: printReactDisclosurePresenceIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "controlled-value-presence") {
      return {
        contents: printReactControlledValuePresenceIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "grouped-value-control") {
      return {
        contents: printReactGroupedValueControlIndex(file),
        path: file.path,
      };
    }

    if (file.family?.kind === "hidden-input-visual-slot") {
      return {
        contents: printReactHiddenInputVisualSlotIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "file-drop-control") {
      return {
        contents: printReactFileDropControlIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "form-field-coordinator") {
      return {
        contents: printReactFormFieldCoordinatorIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "field-composition") {
      return {
        contents: printReactFormControlCompositionIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "media-status") {
      return {
        contents: printReactMediaStatusIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "native-input-value") {
      return {
        contents: printReactNativeInputValueIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "native-disabled") {
      return {
        contents: printReactNativeDisabledIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "viewport-measurement") {
      return {
        contents: printReactViewportMeasurementIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "native-overlay") {
      return {
        contents: printReactNativeOverlayIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "presence-floating-overlay") {
      return {
        contents: printReactPresenceFloatingOverlayIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "range-status") {
      return {
        contents: printReactRangeStatusIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "timed-floating-overlay") {
      return {
        contents: printReactTimedFloatingOverlayIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "option-collection-overlay") {
      return {
        contents: printReactOptionCollectionOverlayIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "composite-menu-overlay") {
      return {
        contents: printReactCompositeMenuOverlayIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "anchored-menu-overlay") {
      return {
        contents: printReactAnchoredMenuOverlayIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "shared-viewport-navigation") {
      return {
        contents: printReactSharedViewportNavigationIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "sidebar") {
      return {
        contents: printReactSidebarIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "editable-collection-overlay") {
      return {
        contents: printReactEditableCollectionOverlayIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "engine-viewport") {
      return {
        contents: printReactEngineViewportIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "notification-system") {
      return {
        contents: printReactNotificationSystemIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "range-control") {
      return {
        contents: printReactRangeControlIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "repeated-disclosure") {
      return {
        contents: printReactRepeatedDisclosureIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "single-boolean-control") {
      return {
        contents: printReactSingleBooleanControlIndex(file.family),
        path: file.path,
      };
    }

    return {
      contents: exportPrinter.printIndexFileExports(file),
      path: file.path,
    };
  },
  printTypeFacadeFile(file) {
    return {
      contents: exportPrinter.printTypeFacadeFileExports(file),
      path: file.path,
    };
  },
  normalizeAttributeName: normalizeReactAttributeName,
  projectBooleanAttribute(attribute) {
    return attribute;
  },
  projectProp: identity,
  projectDefaultValue: identity,
  projectRenderTree: identity,
  projectSlot: identity,
  projectRuntimeLifecycle: identity,
  projectRef: identity,
  projectEventBridge: identity,
  projectControlledStateSync: identity,
  projectContext: identity,
  projectPortal: identity,
  printExports(exportsModel) {
    return exportPrinter.printNamespaceExport(exportsModel);
  },
}) satisfies FrameworkAdapter;

function applyReactClientDirective(file: AdapterPrintedFile): AdapterPrintedFile {
  if (!isReactClientEntry(file.path)) return file;

  return {
    ...file,
    contents: `"use client";\n\n${file.contents}`,
  };
}

function isReactClientEntry(filePath: string): boolean {
  return filePath.endsWith(".tsx") || filePath === "index.ts" || /[/\\]index\.ts$/.test(filePath);
}

function printReactComponent(file: AdapterComponentFile): string {
  const form = file.component.family;
  if (
    form?.kind === "boolean-form-control" &&
    form.part === "root" &&
    (form.facts.displayName === "Checkbox" || form.facts.displayName === "Switch")
  ) {
    assertBooleanStatePolicy(form.facts);
    return renderFormRoot(form.facts.displayName, "react");
  }
  const component = file.component;

  if (isReactColorPickerComponentProjection(component.family)) {
    return printReactColorPickerComponent(
      component.family as unknown as ReactColorPickerComponentProjection,
    );
  }

  if (component.family?.kind === "action-surface") {
    return printReactActionSurfaceComponent(component.family);
  }

  if (component.family?.kind === "disclosure-presence") {
    return printReactDisclosurePresenceComponent(component.family);
  }

  if (component.family?.kind === "controlled-value-presence") {
    return printReactControlledValuePresenceComponent(component.family);
  }

  if (component.family?.kind === "boolean-form-control") {
    return printReactBooleanFormControlComponent(component.family);
  }

  if (component.family?.kind === "grouped-value-control") {
    return printReactGroupedValueControlComponent(component.family);
  }

  if (component.family?.kind === "hidden-input-visual-slot") {
    return printReactHiddenInputVisualSlotComponent(component.family);
  }

  if (component.family?.kind === "file-drop-control") {
    return printReactFileDropControlComponent(component.family);
  }

  if (component.family?.kind === "form-field-coordinator") {
    return printReactFormFieldCoordinatorComponent(component.family);
  }

  if (component.family?.kind === "field-composition") {
    return printReactFormControlCompositionComponent(component.family);
  }

  if (component.family?.kind === "media-status") {
    return printReactMediaStatusComponent(component.family);
  }

  if (component.family?.kind === "native-input-value") {
    return printReactNativeInputValueComponent(component.family);
  }

  if (component.family?.kind === "native-disabled") {
    return printReactNativeDisabledComponent(component.family);
  }

  if (component.family?.kind === "viewport-measurement") {
    return printReactViewportMeasurementComponent(component.family);
  }

  if (component.family?.kind === "native-overlay") {
    return printReactNativeOverlayComponent(component.family);
  }

  if (component.family?.kind === "presence-floating-overlay") {
    return printReactPresenceFloatingOverlayComponent(component.family);
  }

  if (component.family?.kind === "range-status") {
    return printReactRangeStatusComponent(component.family);
  }

  if (component.family?.kind === "timed-floating-overlay") {
    return printReactTimedFloatingOverlayComponent(component.family);
  }

  if (component.family?.kind === "option-collection-overlay") {
    return printReactOptionCollectionOverlayComponent(component.family);
  }

  if (component.family?.kind === "composite-menu-overlay") {
    return printReactCompositeMenuOverlayComponent(component.family);
  }

  if (component.family?.kind === "anchored-menu-overlay") {
    return printReactAnchoredMenuOverlayComponent(component.family);
  }

  if (component.family?.kind === "shared-viewport-navigation") {
    return printReactSharedViewportNavigationComponent(component.family);
  }

  if (component.family?.kind === "sidebar") {
    return printReactSidebarComponent(component.family);
  }

  if (component.family?.kind === "editable-collection-overlay") {
    return printReactEditableCollectionOverlayComponent(component.family);
  }

  if (component.family?.kind === "engine-viewport") {
    return printReactEngineViewportComponent(component.family);
  }

  if (component.family?.kind === "notification-system") {
    return printReactNotificationSystemComponent(component.family);
  }

  if (component.family?.kind === "range-control") {
    return printReactRangeControlComponent(component.family);
  }

  if (component.family?.kind === "repeated-disclosure") {
    return printReactRepeatedDisclosureComponent(component.family);
  }

  if (component.family?.kind === "single-boolean-control") {
    return printReactSingleBooleanControlComponent(component.family);
  }

  return [
    'import * as React from "react";',
    'import { createPortal } from "react-dom";',
    printImports(component.imports),
    printReactPropsType(component),
    printReactForwardRef(component),
  ]
    .filter(Boolean)
    .join("\n");
}

function isReactColorPickerComponentProjection(
  family: AdapterComponentModel["family"] | undefined,
): boolean {
  return (family as { kind?: string } | undefined)?.kind === "react-color-picker";
}

function isReactColorPickerIndexProjection(
  family: AdapterIndexFile["family"] | undefined,
): boolean {
  return (family as { kind?: string } | undefined)?.kind === "react-color-picker";
}

function applyReactFamilyPrintNormalizations(file: AdapterComponentFile, contents: string): string {
  const form = file.component.family;
  if (form?.kind === "boolean-form-control" && form.facts.runtime.factory === "createRadio")
    return contents;
  if (
    form?.kind === "boolean-form-control" &&
    form.part === "root" &&
    (form.facts.displayName === "Checkbox" || form.facts.displayName === "Switch")
  )
    return contents;
  const family = file.component.family;
  if (
    family?.kind === "grouped-value-control" &&
    ["createRadioGroup", "createCheckboxGroup"].includes(family.facts.runtime.factory)
  )
    return contents;

  if (family?.kind === "repeated-disclosure" && family.part === "root") {
    return contents;
  }

  if (family?.kind === "controlled-value-presence" && family.part === "root") {
    return contents;
  }

  if (family?.kind === "boolean-form-control" && family.part === "root") {
    return normalizeReactBooleanFormControlRoot(family.facts, contents);
  }

  if (family?.kind === "grouped-value-control" && family.part === "root") {
    return family.facts.runtime.factory === "createToggleGroup"
      ? contents
      : normalizeReactGroupedValueControlRoot(family.facts, contents);
  }

  if (family?.kind === "disclosure-presence" && family.part === "root") {
    return contents;
  }

  if (family?.kind === "range-control" && family.part === "root") {
    return contents;
  }

  if (family?.kind === "single-boolean-control" && family.part === "root") {
    return contents;
  }

  if (family?.kind === "native-overlay" && family.part === "root") return contents;

  if (family?.kind === "presence-floating-overlay" && family.part === "root") return contents;

  if (family?.kind === "timed-floating-overlay" && family.part === "root") return contents;

  if (family?.kind === "composite-menu-overlay" && family.part === "root") {
    return addReactPortalScope(contents, family.facts.runtime.factory);
  }

  if (family?.kind === "composite-menu-overlay" && family.part === "checkboxItem") {
    return contents;
  }

  if (family?.kind === "composite-menu-overlay" && family.part === "radioGroup") {
    return contents;
  }

  if (family?.kind === "anchored-menu-overlay" && family.part === "root") {
    return addReactPortalScope(
      contents,
      family.facts.runtime.factory,
      family.facts.runtime.portalOwner,
    );
  }

  if (family?.kind === "hidden-input-visual-slot" && family.part === "root") {
    return contents;
  }

  return contents;
}

function normalizeReactRepeatedDisclosureRoot(
  facts: AdapterRepeatedDisclosureFacts,
  contents: string,
): string {
  const stateType = facts.state.type;
  const defaultValueRef = `${facts.props.defaultValue.name}Ref`;
  const valueRef = `${facts.props.value.name}Ref`;
  const eventValueProperty = facts.events.valueChange.valueProperty;

  let next = replaceRequired(
    contents,
    `  const [uncontrolledValue, setUncontrolledValueState] = React.useState<${stateType} | undefined>(
    () => ${defaultValueRef}.current,
  );
  const uncontrolledValueRef = React.useRef(uncontrolledValue);

  const setUncontrolledValue = React.useCallback((nextValue: ${stateType}) => {
    uncontrolledValueRef.current = nextValue;
    setUncontrolledValueState(nextValue);
  }, []);
`,
    `  const uncontrolledValueRef = React.useRef<${stateType} | undefined>(
    ${defaultValueRef}.current,
  );
`,
    "repeated-disclosure root uncontrolled value render state normalization",
  );

  next = replaceRequired(
    next,
    `      ${facts.props.collapsible.name},
      ...(${valueRef}.current !== undefined`,
    `      ${facts.props.collapsible.name},
      ${facts.events.valueChange.callbackProp}: (details) => {
        ${facts.events.valueChange.callbackProp}Ref.current?.(details);
      },
      ...(${valueRef}.current !== undefined`,
    "repeated-disclosure cancelable callback Runtime option",
  );

  next = replaceRequired(
    next,
    `      ${facts.events.valueChange.callbackProp}Ref.current?.(details);
      if (${valueRef}.current === undefined) {
        setUncontrolledValue(details.${eventValueProperty});
      }
`,
    `      if (details.isCanceled) return;

      if (${valueRef}.current === undefined) {
        uncontrolledValueRef.current = details.${eventValueProperty};
      }
`,
    "repeated-disclosure root uncontrolled value subscription ref write",
  );

  return next;
}

function normalizeReactBooleanFormControlRoot(
  facts: AdapterBooleanFormControlFacts,
  contents: string,
): string {
  assertBooleanStatePolicy(facts);
  const group = facts.group;
  let next = contents;

  if (group && facts.behavior.hasIndeterminate) {
    next = replaceRequired(
      next,
      `    const group${facts.state.pascalName} =
      ${group.variableName} && groupValue !== undefined ? ${group.variableName}.value.includes(groupValue) : undefined;
`,
      `    const group${facts.state.pascalName} =
      ${group.variableName} && groupValue !== undefined
        ? ${group.variableName}.value.includes(groupValue)
        : undefined;
`,
      "boolean form-control group state projection line wrapping",
    );
  }

  if (facts.behavior.canCancelChange) {
    next = insertCancelableCallbackBeforeControlledState(
      next,
      facts.event.callbackProp,
      facts.props.state.name,
      `(${facts.event.valueProperty}, details) => {
          ${facts.event.callbackProp}Ref.current?.(${facts.event.valueProperty}, details);
        }`,
      "boolean form-control cancelable callback Runtime option",
    );
    next = replaceRequired(
      next,
      `        ${facts.event.callbackProp}Ref.current?.(details.${facts.event.valueProperty}, details);
`,
      "",
      "boolean form-control accepted subscription callback removal",
    );
  }

  if (facts.behavior.inputPlacement === "external") {
    const form = requireFamilyProp(facts.props.form, "form").name;
    const name = requireFamilyProp(facts.props.name, "name").name;
    const required = requireFamilyProp(facts.props.required, "required").name;
    const uncheckedValue = requireFamilyProp(facts.props.uncheckedValue, "uncheckedValue").name;
    const value = requireFamilyProp(facts.props.value, "value").name;
    next = replaceRequired(
      next,
      `    const inputElementRef = React.useRef<${facts.input.elementType}>(null);
    const instanceRef =`,
      `    const inputElementRef = React.useRef<${facts.input.elementType}>(null);
    const runtimeInputNameRef = React.useRef<string | undefined>(${name});
    const instanceRef =`,
      "external boolean form-control Runtime-owned input name ref",
    );
    next = replaceRequired(
      next,
      `    const setUncontrolled${facts.state.pascalName} = React.useCallback((next${facts.state.pascalName}: ${facts.event.valueType}) => {
      uncontrolled${facts.state.pascalName}Ref.current =`,
      `    const setUncontrolled${facts.state.pascalName} = React.useCallback((next${facts.state.pascalName}: ${facts.event.valueType}) => {
      runtimeInputNameRef.current = inputElementRef.current?.name || undefined;
      uncontrolled${facts.state.pascalName}Ref.current =`,
      "external boolean form-control pre-render input name capture",
    );
    next = replaceRequired(
      next,
      `    }, [${form}, ${name}, ${required}, ${uncheckedValue}, ${value}]);

    const rendered${facts.state.pascalName} =`,
      `    }, [${form}, ${name}, ${required}, ${uncheckedValue}, ${value}]);

    useIsomorphicLayoutEffect(() => {
      if (${name} !== undefined) return;
      const inputElement = inputElementRef.current;
      if (!inputElement || typeof MutationObserver === "undefined") return;

      const syncRuntimeInputName = () => {
        runtimeInputNameRef.current = inputElement.name || undefined;
      };
      const observer = new MutationObserver(syncRuntimeInputName);
      observer.observe(inputElement, { attributes: true, attributeFilter: ["name"] });
      syncRuntimeInputName();

      return () => {
        observer.disconnect();
      };
    }, [${name}]);

    useIsomorphicLayoutEffect(() => {
      if (${name} !== undefined) return;
      const inputElement = inputElementRef.current;
      const runtimeInputName = runtimeInputNameRef.current;
      if (!inputElement || runtimeInputName === undefined || inputElement.name === runtimeInputName) {
        return;
      }

      inputElement.name = runtimeInputName;
    });

    const rendered${facts.state.pascalName} =`,
      "external boolean form-control Runtime-owned input name reconciliation",
    );
  }

  if (facts.behavior.acceptedChangeNotification !== "detail-on-accepted") return next;

  const syncEvent = requireString(facts.state.syncEvent, "state sync event");
  const groupGuard = group ? ` && ${group.variableName} === undefined` : "";
  next = replaceRequired(
    next,
    `        if (details.isCanceled) return;

        if (${facts.props.state.name}Ref.current === undefined${groupGuard}) {
          setUncontrolled${facts.state.pascalName}(details.${facts.event.valueProperty});
        }
`,
    `        details.onAccepted(() => {
          if (${facts.props.state.name}Ref.current === undefined${groupGuard}) {
            setUncontrolled${facts.state.pascalName}(details.${facts.event.valueProperty});
          }
        });
`,
    "boolean form-control accepted state publication",
  );

  next = replaceRequired(
    next,
    `      });

      return () => {
        unsubscribe();
`,
    `      });
      const unsubscribeStateSync = instance.subscribe("${syncEvent}", () => {
        if (${facts.props.state.name}Ref.current === undefined${groupGuard}) {
          setUncontrolled${facts.state.pascalName}(instance.${facts.state.getter}());
        }
      });

      return () => {
        unsubscribeStateSync();
        unsubscribe();
`,
    "boolean form-control Runtime state-sync subscription",
  );

  return next;
}

function normalizeReactGroupedValueControlRoot(
  facts: AdapterGroupedValueControlFacts,
  contents: string,
): string {
  let normalizedContents = contents;

  if (facts.behavior.canCancelChange) {
    normalizedContents = replaceRequired(
      normalizedContents,
      `        ${facts.event.callbackProp}Ref.current?.(details.${facts.event.valueProperty}, details);
`,
      "",
      "grouped-value accepted subscription callback removal",
    );
    const callback =
      facts.behavior.callbackArguments === "details"
        ? `(details) => {
          ${facts.event.callbackProp}Ref.current?.(details.${facts.event.valueProperty}, details);
        }`
        : `(${facts.event.valueProperty}, details) => {
          ${facts.event.callbackProp}Ref.current?.(${facts.event.valueProperty}, details);
        }`;
    normalizedContents = insertCancelableCallbackBeforeControlledState(
      normalizedContents,
      facts.event.callbackProp,
      facts.props.value.name,
      callback,
      "grouped-value cancelable callback Runtime option",
    );
  }

  if (facts.behavior.acceptedChangeNotification !== "detail-on-accepted") {
    return normalizedContents;
  }

  const syncEvent = requireString(facts.state.syncEvent, "state sync event");
  let next = replaceRequired(
    normalizedContents,
    `        if (details.isCanceled) return;

        if (${facts.props.value.name}Ref.current === undefined) {
          setUncontrolledValue(details.${facts.event.valueProperty});
        }
`,
    `        details.onAccepted(() => {
          if (${facts.props.value.name}Ref.current === undefined) {
            setUncontrolledValue(details.${facts.event.valueProperty});
          }
        });
`,
    "grouped-value accepted state publication",
  );

  next = replaceRequired(
    next,
    `      });

      return () => {
        unsubscribe();
`,
    `      });
      const unsubscribeStateSync = instance.subscribe("${syncEvent}", () => {
        if (${facts.props.value.name}Ref.current === undefined) {
          setUncontrolledValue(instance.${facts.state.getter}());
        }
      });

      return () => {
        unsubscribeStateSync();
        unsubscribe();
`,
    "grouped-value Runtime state-sync subscription",
  );

  return next;
}

function insertCancelableCallbackBeforeControlledState(
  contents: string,
  callbackProp: string,
  controlledProp: string,
  callback: string,
  description: string,
  indent = "        ",
): string {
  const controlledStateSpread = `${indent}...(${controlledProp}Ref.current !== undefined`;
  return replaceRequired(
    contents,
    controlledStateSpread,
    `${indent}${callbackProp}: ${callback},
${controlledStateSpread}`,
    description,
  );
}

type ReactCancelableSingleStateRoot = {
  retainOpenTrigger?: boolean;
  callbackProp: string;
  controlledProp: string;
  eventName: string;
  valueProperty: string;
};

function normalizeReactCancelableSingleStateRoot(
  contents: string,
  event: ReactCancelableSingleStateRoot,
): string {
  const callbackInvocation = `${event.callbackProp}Ref.current?.(next${toPascalCase(event.valueProperty)}, details);`;
  const callbackIndex = contents.indexOf(callbackInvocation);
  if (callbackIndex < 0) {
    throw new Error(
      `Could not apply React family print normalization: ${event.callbackProp} Runtime callback.`,
    );
  }

  const lineStart = contents.lastIndexOf("\n", callbackIndex) + 1;
  const indent = contents.slice(lineStart, callbackIndex);
  const nextValue = `next${toPascalCase(event.valueProperty)}`;
  const earlyStatePublication = `${indent}${callbackInvocation}
${indent}if (details.isCanceled) return;

${indent}if (${event.controlledProp}Ref.current === undefined) {
${indent}  setUncontrolled${toPascalCase(event.valueProperty)}(${nextValue});
${indent}}`;
  let next = replaceRequired(
    contents,
    earlyStatePublication,
    `${indent}${callbackInvocation}`,
    `${event.callbackProp} pre-DOM state publication removal`,
  );

  const instanceMarker = "instanceRef.current = instance;";
  const instanceIndex = next.indexOf(instanceMarker, callbackIndex);
  if (instanceIndex < 0) {
    throw new Error(
      `Could not apply React family print normalization: ${event.callbackProp} accepted subscription insertion.`,
    );
  }
  const instanceLineStart = next.lastIndexOf("\n", instanceIndex) + 1;
  const instanceIndent = next.slice(instanceLineStart, instanceIndex);
  const unsubscribeName = `unsubscribe${toPascalCase(event.eventName)}`;
  const acceptedSubscription = `${instanceIndent}${instanceMarker}
${instanceIndent}const ${unsubscribeName} = instance.subscribe("${event.eventName}", (details) => {
${
  event.retainOpenTrigger
    ? `${instanceIndent}  if (details.open && details.trigger instanceof HTMLElement) {
${instanceIndent}    acceptedTriggerRef.current = details.trigger;
${instanceIndent}  }
`
    : ""
}${instanceIndent}  if (${event.controlledProp}Ref.current === undefined) {
${instanceIndent}    setUncontrolled${toPascalCase(event.valueProperty)}(details.${event.valueProperty});
${instanceIndent}  }
${instanceIndent}});`;
  next =
    next.slice(0, instanceLineStart) +
    acceptedSubscription +
    next.slice(instanceIndex + instanceMarker.length);

  const destroyMarker = `${instanceIndent}  instance.destroy();`;
  next = replaceRequired(
    next,
    destroyMarker,
    `${instanceIndent}  ${unsubscribeName}();
${destroyMarker}`,
    `${event.callbackProp} accepted subscription cleanup`,
  );
  return next;
}

function toPascalCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function replaceRequired(
  contents: string,
  search: string,
  replacement: string,
  description: string,
): string {
  if (!contents.includes(search)) {
    throw new Error(`Could not apply React family print normalization: ${description}.`);
  }

  return contents.replace(search, replacement);
}

function printReactBooleanFormControlComponent(
  family: AdapterBooleanFormControlComponentProjection,
): string {
  if (family.facts.runtime.factory === "createRadio")
    return family.part === "root"
      ? renderRadioRoot(radioOperations, family.facts)
      : renderRadioIndicator(radioOperations, family.facts);
  if (family.part === "state-indicator") {
    const output = printReactBooleanFormControlStateIndicator(family.facts);
    return family.facts.behavior.hasIndeterminate
      ? addReactIndeterminateIndicatorPresenceBridge(output, family.facts)
      : output;
  }

  const output = printReactBooleanFormControlRoot(family.facts);
  return family.facts.behavior.hasIndeterminate
    ? addReactIndeterminateRootIndicatorPresenceBridge(output, family.facts)
    : output;
}

function addReactIndeterminateRootIndicatorPresenceBridge(
  output: string,
  facts: AdapterBooleanFormControlFacts,
): string {
  const contextName = `${facts.displayName}IndicatorContext`;
  const contextType = `${facts.displayName}IndicatorState`;
  const renderedState = `rendered${facts.state.pascalName}`;

  let next = replaceRequired(
    output,
    `const ${facts.exports.root} = React.forwardRef`,
    `type ${contextType} = {\n  checked: boolean;\n  disabled: boolean;\n  indeterminate: boolean;\n  readOnly: boolean;\n  registerIndicatorVisibility(node: HTMLElement, explicitlyHidden: boolean): void;\n  required: boolean;\n};\n\nexport const ${contextName} = React.createContext<${contextType}>({\n  checked: false,\n  disabled: false,\n  indeterminate: false,\n  readOnly: false,\n  registerIndicatorVisibility: () => {},\n  required: false,\n});\n\nconst ${facts.exports.root} = React.forwardRef`,
    "indeterminate indicator context declaration",
  );
  next = replaceRequired(
    next,
    "    const rootRef = React.useRef<",
    `    const explicitlyHiddenIndicatorsRef = React.useRef(new Set<HTMLElement>());\n    const registerIndicatorVisibility = React.useCallback(\n      (node: HTMLElement, explicitlyHidden: boolean) => {\n        if (explicitlyHidden) {\n          explicitlyHiddenIndicatorsRef.current.add(node);\n        } else {\n          explicitlyHiddenIndicatorsRef.current.delete(node);\n        }\n      },\n      [],\n    );\n    const rootRef = React.useRef<`,
    "indeterminate indicator visibility registry",
  );
  next = replaceRequired(
    next,
    `    const aria${facts.state.pascalName}: React.AriaAttributes`,
    `    const indicatorState = React.useMemo(\n      () => ({\n        checked: ${renderedState},\n        disabled: effectiveDisabled,\n        indeterminate: renderedIndeterminate,\n        readOnly: ${facts.props.readOnly?.name},\n        registerIndicatorVisibility,\n        required: ${facts.props.required?.name},\n      }),\n      [\n        effectiveDisabled,\n        ${facts.props.readOnly?.name},\n        registerIndicatorVisibility,\n        ${renderedState},\n        renderedIndeterminate,\n        ${facts.props.required?.name},\n      ],\n    );\n\n    useIsomorphicLayoutEffect(() => {\n      explicitlyHiddenIndicatorsRef.current.forEach((indicator) => {\n        indicator.hidden = true;\n      });\n    });\n\n    const aria${facts.state.pascalName}: React.AriaAttributes`,
    "indeterminate rendered indicator state",
  );
  next = replaceRequired(
    next,
    "            {children}\n          </button>",
    `            <${contextName}.Provider value={indicatorState}>\n              {children}\n            </${contextName}.Provider>\n          </button>`,
    "indeterminate native root indicator provider",
  );

  return replaceRequired(
    next,
    "        {children}\n        {input}\n      </span>",
    `        <${contextName}.Provider value={indicatorState}>\n          {children}\n        </${contextName}.Provider>\n        {input}\n      </span>`,
    "indeterminate non-native root indicator provider",
  );
}

function addReactIndeterminateIndicatorPresenceBridge(
  output: string,
  facts: AdapterBooleanFormControlFacts,
): string {
  const contextName = `${facts.displayName}IndicatorContext`;
  const exportName = requireString(facts.exports.stateIndicator, "stateIndicator export");
  const keepMounted = requireFamilyProp(facts.props.keepMounted, "keepMounted").name;

  const visibility = checkboxIndicatorPolicy(checkboxIndicatorTransport.react, {
    checked: "indicatorState.checked",
    indeterminate: "indicatorState.indeterminate",
    keepMounted,
    hidden: "hidden",
  });
  let next = replaceRequired(
    output,
    'import * as React from "react";\n',
    `import * as React from "react";\nimport { ${contextName} } from "./${facts.exports.root}";\n`,
    "indeterminate indicator context import",
  );
  next = replaceRequired(
    next,
    `  function ${exportName}({ hidden, ${keepMounted} = false, ...props }, forwardedRef) {\n    const composedRef`,
    `  function ${exportName}({ hidden, ${keepMounted} = false, ...props }, forwardedRef) {\n    const indicatorState = React.useContext(${contextName});\n    const active = ${visibility.active};\n    const indicatorRef = React.useRef<HTMLSpanElement>(null);\n    const composedRef`,
    "indeterminate indicator rendered state read",
  );
  next = replaceRequired(
    next,
    "        if (node) {\n          node.hidden = hidden ?? !keepMounted;\n        }",
    `        const previousNode = indicatorRef.current;\n        if (previousNode && previousNode !== node) {\n          indicatorState.registerIndicatorVisibility(previousNode, false);\n        }\n\n        indicatorRef.current = node;\n        if (node) {\n          indicatorState.registerIndicatorVisibility(node, hidden === true);\n          node.hidden = ${visibility.hidden};\n        }`,
    "indeterminate indicator ref presence",
  );
  next = replaceRequired(
    next,
    `      [forwardedRef, hidden, ${keepMounted}],`,
    "      [forwardedRef, hidden, indicatorState],",
    "indeterminate indicator ref dependencies",
  );
  next = replaceRequired(
    next,
    `    );\n\n    return (`,
    `    );\n\n    if (${visibility.unmounted}) return null;\n\n    return (`,
    "indeterminate indicator root-owned hidden precedence",
  );
  next = replaceRequired(
    next,
    "        data-unchecked\n        ref={composedRef}",
    `        data-checked={indicatorState.checked ? "" : undefined}\n        data-disabled={indicatorState.disabled ? "" : undefined}\n        data-indeterminate={indicatorState.indeterminate ? "" : undefined}\n        data-readonly={indicatorState.readOnly ? "" : undefined}\n        data-required={indicatorState.required ? "" : undefined}\n        data-unchecked={!indicatorState.checked ? "" : undefined}\n        hidden={${visibility.hidden}}\n        ref={composedRef}`,
    "indeterminate indicator rendered attributes",
  );

  return next;
}

function printReactBooleanFormControlRoot(facts: AdapterBooleanFormControlFacts): string {
  if (facts.behavior.hasIndeterminate) {
    return printReactBooleanFormControlIndeterminateRoot(facts);
  }

  if (facts.behavior.groupStrategy === "value-equals") {
    return printReactBooleanFormControlRequiredValueRoot(facts);
  }

  return printReactBooleanFormControlExternalInputRoot(facts);
}

function printReactRangeControlComponent(family: AdapterRangeControlComponentProjection): string {
  const facts = family.facts;

  if (family.part === "root") return printReactRangeControlRoot(facts);
  if (family.part === "thumb") return printReactRangeControlThumb(facts);

  return printReactRangeControlSimplePart(facts, family.part);
}

function printReactRangeControlRoot(facts: AdapterRangeControlFacts): string {
  return renderSlider("react", facts);
}

function printReactRangeControlSimplePart(
  facts: AdapterRangeControlFacts,
  partName: Exclude<AdapterRangeControlComponentProjection["part"], "root" | "thumb">,
): string {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${facts.attrs[partName]} ref={forwardedRef} {...props} />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactRangeControlThumb(facts: AdapterRangeControlFacts): string {
  const part = facts.parts.thumb;
  const exportName = facts.exports.thumb;
  const props = facts.props;
  const inputTabIndexAttribute = normalizeReactAttributeName(facts.attrs.inputTabIndex);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<HTMLDivElement> & {\n  ${props.index.name}?: ${props.index.type};\n  ${facts.inputRefPropName}?: React.Ref<HTMLInputElement>;\n};\n\nconst visuallyHiddenStyle = {\n  border: 0,\n  clipPath: "inset(50%)",\n  height: "1px",\n  margin: "-1px",\n  overflow: "hidden",\n  position: "absolute",\n  whiteSpace: "nowrap",\n  width: "1px",\n} satisfies React.CSSProperties;\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(function ${exportName}(\n  { children, ${props.index.name}, ${facts.inputRefPropName}, ...props },\n  forwardedRef,\n) {\n  return (\n    <${part.defaultElement} ${facts.attrs.thumb} ${facts.attrs.index}={${props.index.name}} ref={forwardedRef} {...props}>\n      {children}\n      <input\n        ${facts.attrs.input}\n        ${facts.attrs.inputAriaHidden}="${facts.thumbInput.hiddenRangeInput.ariaHiddenValue}"\n        ref={${facts.inputRefPropName}}\n        style={visuallyHiddenStyle}\n        ${inputTabIndexAttribute}={${facts.thumbInput.hiddenRangeInput.tabIndexValue}}\n        ${facts.attrs.inputType}="${facts.thumbInput.hiddenRangeInput.typeValue}"\n      />\n    </${part.defaultElement}>\n  );\n});\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactRangeControlIndex(family: AdapterRangeControlIndexProjection): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const exportNames = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exportNames}\n};\n\nexport default ${facts.exports.namespace};\n\n${exportPrinter.printRuntimeTypeReExport({ names: facts.index.typeExports, source: facts.runtime.typeImportSource })}\n`;
}

function printReactHiddenInputVisualSlotComponent(
  family: AdapterHiddenInputVisualSlotComponentProjection,
): string {
  const facts = normalizeReactHiddenInputVisualSlotFacts(family.facts);

  if (family.part === "root") return printReactHiddenInputVisualSlotRoot(facts);
  if (family.part === "slot") return printReactHiddenInputVisualSlotSlot(facts);
  if (family.part === "separator") return printReactHiddenInputVisualSlotSeparator(facts);

  return printReactHiddenInputVisualSlotGroup(facts);
}

function normalizeReactHiddenInputVisualSlotFacts(
  facts: AdapterHiddenInputVisualSlotFacts,
): AdapterHiddenInputVisualSlotFacts {
  return {
    ...facts,
    attrs: Object.fromEntries(
      Object.entries(facts.attrs).map(([key, value]) => [key, normalizeReactAttributeName(value)]),
    ) as AdapterHiddenInputVisualSlotFacts["attrs"],
  };
}

function printReactHiddenInputVisualSlotRoot(facts: AdapterHiddenInputVisualSlotFacts): string {
  return printReactInputOtpRoot(facts);
}

function printReactHiddenInputVisualSlotGroup(facts: AdapterHiddenInputVisualSlotFacts): string {
  const part = facts.parts.group;
  const exportName = facts.exports.group;
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${facts.attrs.group} ref={forwardedRef} {...props} />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactHiddenInputVisualSlotSlot(facts: AdapterHiddenInputVisualSlotFacts): string {
  const part = facts.parts.slot;
  const exportName = facts.exports.slot;
  const elementType = getReactElementTypeForPart(part.defaultElement);
  const props = facts.props;

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}> & {\n  ${props.caret.name}?: ${props.caret.type};\n  ${props.index.name}?: ${props.index.type};\n};\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(function ${exportName}(\n  { ${props.caret.name}, ${props.index.name}, ...props },\n  forwardedRef,\n) {\n  return (\n    <${part.defaultElement} ${facts.attrs.slot} ${facts.attrs.slotIndex}={${props.index.name}} ref={forwardedRef} {...props}>\n      <${facts.parts.slotChar.defaultElement} ${facts.attrs.slotChar} />\n      <${facts.parts.slotCaret.defaultElement}\n        ${facts.attrs.slotCaret}\n        ${facts.attrs.slotCaretClass}="${facts.visualSlots.slotCaret.classValue}"\n        ${facts.attrs.slotCaretHidden}\n      >\n        {${props.caret.name} ?? <div className="${otpCaretFallbackClass}" />}\n      </${facts.parts.slotCaret.defaultElement}>\n    </${part.defaultElement}>\n  );\n});\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactHiddenInputVisualSlotSeparator(
  facts: AdapterHiddenInputVisualSlotFacts,
): string {
  const part = facts.parts.separator;
  const exportName = facts.exports.separator;
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${facts.attrs.separator} ${facts.attrs.separatorAriaHidden}="${facts.visualSlots.separator.ariaHiddenValue}" ref={forwardedRef} role="${facts.visualSlots.separator.role}" {...props} />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactHiddenInputVisualSlotIndex(
  family: AdapterHiddenInputVisualSlotIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const exportNames = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ];

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport { ${exportNames.join(", ")} };\n\nexport default ${facts.exports.namespace};\n\n${exportPrinter.printRuntimeTypeReExport({ names: facts.index.typeExports, source: facts.runtime.typeImportSource })}\n`;
}

function printReactFileDropControlComponent(
  family: AdapterFileDropControlComponentProjection,
): string {
  const facts = normalizeReactFileDropControlFacts(family.facts);

  if (family.part === "root") return printReactFileDropControlRoot(facts);
  if (family.part === "input") return printReactFileDropControlInput(facts);
  if (family.part === "uploadIndicator") return printReactFileDropControlUploadIndicator(facts);
  if (family.part === "loadingIndicator") return printReactFileDropControlLoadingIndicator(facts);

  return printReactFileDropControlFilesList(facts);
}

function normalizeReactFileDropControlFacts(
  facts: AdapterFileDropControlFacts,
): AdapterFileDropControlFacts {
  return {
    ...facts,
    attrs: Object.fromEntries(
      Object.entries(facts.attrs).map(([key, value]) => [key, normalizeReactAttributeName(value)]),
    ) as AdapterFileDropControlFacts["attrs"],
  };
}

function printReactFileDropControlRoot(facts: AdapterFileDropControlFacts): string {
  return printReactDropzoneRoot(facts);
}

function printReactFileDropControlInput(facts: AdapterFileDropControlFacts): string {
  const props = facts.props;
  const input = facts.exports.input;

  return `import * as React from "react";\n\nexport type ${input}Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "${facts.attrs.inputType}">;\n\nconst ${input} = React.forwardRef<HTMLInputElement, ${input}Props>(function ${input}(\n  { className, ${props.disabled.name} = ${props.disabled.defaultValue}, ...props },\n  forwardedRef,\n) {\n  return (\n    <input\n      {...props}\n      ${facts.attrs.input}\n      ${facts.attrs.inputType}="${facts.fileInput.typeValue}"\n      ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n      ${facts.attrs.inputClass}={["${facts.fileInput.hiddenClassValue}", className].filter(Boolean).join(" ") || undefined}\n      ${facts.fileInput.disabledForwardedAttribute}={${props.disabled.name}}\n      ref={forwardedRef}\n      ${facts.attrs.inputTabIndex}={${Number(facts.fileInput.tabIndexValue)}}\n    />\n  );\n});\n\n${input}.displayName = "${facts.displayName}.${facts.parts.input.namespaceKey}";\n\nexport default ${input};\n`;
}

function printReactFileDropControlUploadIndicator(facts: AdapterFileDropControlFacts): string {
  const props = facts.props;
  const part = facts.parts.uploadIndicator;
  const exportName = facts.exports.uploadIndicator;
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}> & {\n  ${props.isUploading.name}?: ${props.isUploading.type};\n};\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(\n    { ${props.isUploading.name} = ${props.isUploading.defaultValue}, hidden = ${dropzoneIndicatorHidden("uploadIndicator", props.isUploading.name)}, ...props },\n    forwardedRef,\n  ) {\n    return (\n      <${part.defaultElement}\n        {...props}\n        ${facts.attrs.uploadIndicator}\n        ${facts.attrs.isUploading}={${props.isUploading.name} ? "true" : "false"}\n        hidden={hidden}\n        ref={forwardedRef}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactFileDropControlLoadingIndicator(facts: AdapterFileDropControlFacts): string {
  const props = facts.props;
  const part = facts.parts.loadingIndicator;
  const exportName = facts.exports.loadingIndicator;
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}> & {\n  ${props.isUploading.name}?: ${props.isUploading.type};\n};\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(\n    { ${props.isUploading.name} = ${props.isUploading.defaultValue}, hidden = ${dropzoneIndicatorHidden("loadingIndicator", props.isUploading.name)}, ...props },\n    forwardedRef,\n  ) {\n    return (\n      <${part.defaultElement}\n        {...props}\n        ${facts.attrs.loadingIndicator}\n        ${facts.attrs.isUploading}={${props.isUploading.name} ? "true" : "false"}\n        hidden={hidden}\n        ref={forwardedRef}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactFileDropControlFilesList(facts: AdapterFileDropControlFacts): string {
  const part = facts.parts.filesList;
  const exportName = facts.exports.filesList;
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${facts.attrs.filesList} ${facts.fileList.stateAttribute}="${facts.fileList.emptyInitialState}" ref={forwardedRef} {...props} />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactFileDropControlIndex(family: AdapterFileDropControlIndexProjection): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const exportNames = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exportNames}\n};\n\nexport default ${facts.exports.namespace};\n\n${exportPrinter.printRuntimeTypeReExport({ names: facts.index.typeExports, source: facts.runtime.typeImportSource })}\n`;
}

function printReactFormFieldCoordinatorComponent(
  family: AdapterFormFieldCoordinatorComponentProjection,
): string {
  if (family.part === "root") {
    return printReactFormFieldCoordinatorRoot(family.facts);
  }

  return printReactFormFieldCoordinatorErrorSummary(family.facts);
}

function printReactFormFieldCoordinatorRoot(facts: AdapterFormFieldCoordinatorFacts): string {
  const part = facts.parts.root;
  const exportName = facts.exports.root;
  const dataErrorVisibility = toAttributeVariableName(facts.attrs.errorVisibility);
  const dataRevalidationTiming = toAttributeVariableName(facts.attrs.revalidationTiming);
  const dataValidationTiming = toAttributeVariableName(facts.attrs.validationTiming);
  const errorVisibility = facts.props.errorVisibility.name;
  const revalidationTiming = facts.props.revalidationTiming.name;
  const validationTiming = facts.props.validationTiming.name;

  return `import { ${facts.runtime.factory}, type ${facts.runtime.validationTimingType}, ${formReactiveTypeImports} } from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nexport type ${exportName}Props = React.ComponentPropsWithoutRef<"${part.defaultElement}"> & {\n  ${formReactivePropTypes}\n  "${facts.attrs.errorVisibility}"?: ${facts.runtime.validationTimingType};\n  "${facts.attrs.revalidationTiming}"?: ${facts.runtime.validationTimingType};\n  "${facts.attrs.validationTiming}"?: ${facts.runtime.validationTimingType};\n  ${errorVisibility}?: ${facts.props.errorVisibility.type};\n  ${revalidationTiming}?: ${facts.props.revalidationTiming.type};\n  ${validationTiming}?: ${facts.props.validationTiming.type};\n};\n\nconst ${exportName} = React.forwardRef<HTMLFormElement, ${exportName}Props>(\n  function ${exportName}(\n    {\n      children, options, errors, errorOptions,\n      "${facts.attrs.errorVisibility}": ${dataErrorVisibility},\n      "${facts.attrs.revalidationTiming}": ${dataRevalidationTiming},\n      "${facts.attrs.validationTiming}": ${dataValidationTiming},\n      ${errorVisibility},\n      ${revalidationTiming},\n      ${validationTiming},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const configured = React.useRef({ options: false, errors: false }).current;\n    const rootRef = React.useRef<HTMLFormElement>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(\n      undefined,\n    );\n\n    const composedRef = React.useCallback(\n      (node: HTMLFormElement | null) => {\n        rootRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    useIsomorphicLayoutEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      ${connectDocumentOwner(facts.runtime.factory, "root", "instanceRef.current", "instance").replaceAll("\n", "\n      ")}\n\n      return () => {\n        ${disposeDocumentOwner("instanceRef.current", "instance").replaceAll("\n", "\n        ")}\n      };\n    }, []);\n\n    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (instance) { ${updateFormOptions("instance", "options")} }\n    }, [options]);\n    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (instance) { ${updateFormErrors("instance", "errors", "errorOptions")} }\n    }, [errors, errorOptions]);\n\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.root}\n        ${facts.attrs.rootSlot}="${part.slotValue}"\n        ${facts.attrs.errorVisibility}={${formTimingValue(dataErrorVisibility, errorVisibility)}}\n        ${facts.attrs.revalidationTiming}={${formTimingValue(dataRevalidationTiming, revalidationTiming)}}\n        ${facts.attrs.validationTiming}={${formTimingValue(dataValidationTiming, validationTiming)}}\n        ref={composedRef}\n        {...props}\n      >\n        {children}\n      </${part.defaultElement}>\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n\n${renderSetRefFunction()}`;
}

function printReactFormFieldCoordinatorErrorSummary(
  facts: AdapterFormFieldCoordinatorFacts,
): string {
  const part = facts.parts.errorSummary;
  const exportName = facts.exports.errorSummary;
  const ariaAtomic = toAttributeVariableName(facts.attrs.errorSummaryAriaAtomic);
  const ariaLive = toAttributeVariableName(facts.attrs.errorSummaryAriaLive);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.ComponentPropsWithoutRef<"${part.defaultElement}">;\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(\n  function ${exportName}(\n    {\n      children,\n      ${facts.attrs.errorSummaryHidden} = ${formSummaryDefaults.hidden},\n      ${facts.attrs.errorSummaryRole} = ${formSummaryDefaults.role},\n      "${facts.attrs.errorSummaryAriaLive}": ${ariaLive} = ${formSummaryDefaults.ariaLive},\n      "${facts.attrs.errorSummaryAriaAtomic}": ${ariaAtomic} = ${formSummaryDefaults.ariaAtomic},\n      ...props\n    },\n    ref,\n  ) {\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.errorSummary}\n        ${facts.attrs.errorSummarySlot}="${part.slotValue}"\n        ${facts.attrs.errorSummaryRole}={${facts.attrs.errorSummaryRole}}\n        ${facts.attrs.errorSummaryAriaLive}={${ariaLive}}\n        ${facts.attrs.errorSummaryAriaAtomic}={${ariaAtomic}}\n        ${facts.attrs.errorSummaryHidden}={${facts.attrs.errorSummaryHidden}}\n        ref={ref}\n        {...props}\n      >\n        {children}\n      </${part.defaultElement}>\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactFormFieldCoordinatorIndex(
  family: AdapterFormFieldCoordinatorIndexProjection,
): string {
  const facts = family.facts;

  return `import ${facts.exports.errorSummary} from "./${facts.exports.errorSummary}";\nimport ${facts.exports.root} from "./${facts.exports.root}";\n\nconst ${facts.exports.namespace} = {\n  ErrorSummary: ${facts.exports.errorSummary},\n  Root: ${facts.exports.root},\n};\n\nexport { ${facts.exports.namespace}, ${facts.exports.errorSummary}, ${facts.exports.root} };\n\nexport default ${facts.exports.namespace};\n\nexport type {\n  ${facts.runtime.typeExports.join(",\n  ")},\n} from "${facts.runtime.typeImportSource}";\nexport {\n  ${facts.runtime.helperExports.join(",\n  ")},\n} from "${facts.runtime.importSource}";\n`;
}

function printReactFormControlCompositionComponent(
  family: AdapterFormControlCompositionComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printReactFormControlCompositionRoot(facts);
  if (family.part === "control") return printReactFormControlCompositionControl(facts);
  if (family.part === "error") return printReactFormControlCompositionError(facts);
  if (family.part === "validity") return printReactFormControlCompositionValidity(facts);

  return printReactFormControlCompositionSimplePart(
    facts,
    facts.parts[family.part],
    facts.attrs[family.part],
  );
}

function printReactFormControlCompositionRoot(facts: AdapterFormControlCompositionFacts): string {
  const root = facts.exports.root;
  const dirty = facts.rootState.dirty.prop.name;
  const disabled = facts.rootState.disabled.prop.name;
  const invalid = facts.rootState.invalid.prop.name;
  const name = facts.rootState.name.prop.name;
  const touched = facts.rootState.touched.prop.name;
  const errorVisibility = facts.formTiming.errorVisibility.prop.name;
  const revalidationTiming = facts.formTiming.revalidationTiming.prop.name;
  const validationTiming = facts.formTiming.validationTiming.prop.name;

  return `import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\nimport type { ${facts.formTiming.typeImport.name} } from "${facts.formTiming.typeImport.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nexport type ${root}Props = Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> & {\n  "${facts.formTiming.errorVisibility.attribute}"?: ${facts.formTiming.errorVisibility.prop.type};\n  "${facts.formTiming.revalidationTiming.attribute}"?: ${facts.formTiming.revalidationTiming.prop.type};\n  "${facts.formTiming.validationTiming.attribute}"?: ${facts.formTiming.validationTiming.prop.type};\n  ${dirty}?: ${facts.rootState.dirty.prop.type};\n  ${disabled}?: ${facts.rootState.disabled.prop.type};\n  ${errorVisibility}?: ${facts.formTiming.errorVisibility.prop.type};\n  ${invalid}?: ${facts.rootState.invalid.prop.type};\n  ${name}?: ${facts.rootState.name.prop.type};\n  ${revalidationTiming}?: ${facts.formTiming.revalidationTiming.prop.type};\n  ${touched}?: ${facts.rootState.touched.prop.type};\n  ${validationTiming}?: ${facts.formTiming.validationTiming.prop.type};\n};\n\nconst ${root} = React.forwardRef<HTMLDivElement, ${root}Props>(function ${root}(\n  {\n    children,\n    "${facts.formTiming.errorVisibility.attribute}": ${facts.formTiming.errorVisibility.dataPropName},\n    "${facts.formTiming.revalidationTiming.attribute}": ${facts.formTiming.revalidationTiming.dataPropName},\n    "${facts.formTiming.validationTiming.attribute}": ${facts.formTiming.validationTiming.dataPropName},\n    ${dirty},\n    ${disabled} = ${facts.rootState.disabled.prop.defaultValue},\n    ${errorVisibility},\n    ${invalid},\n    ${name},\n    ${revalidationTiming},\n    ${touched},\n    ${validationTiming},\n    ...props\n  },\n  forwardedRef,\n) {\n  const rootRef = React.useRef<HTMLDivElement>(null);\n  const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n\n  const composedRef = React.useCallback(\n    (node: HTMLDivElement | null) => {\n      rootRef.current = node;\n      setRef(forwardedRef, node);\n    },\n    [forwardedRef],\n  );\n\n  useIsomorphicLayoutEffect(() => {\n    const root = rootRef.current;\n    if (!root) return;\n\n    ${connectField(facts, { read: (name) => name }, "root", "instanceRef.current", "instance")}\n\n    return () => {\n      ${disconnectField("instanceRef.current", "instance", { kind: "local" })}\n    };\n  }, []);\n\n  ${fieldSynchronizations(
    facts,
    {
      read: (name) => name,
      observe: (name, body) => `useIsomorphicLayoutEffect(() => { ${body} }, [${name}]);`,
    },
    "instanceRef.current",
  )}\n\n  return (\n    <div\n      ${facts.attrs.root}\n      ${facts.attrs.dirty}={${dirty} ? "" : undefined}\n      ${facts.attrs.disabled}={${disabled} ? "" : undefined}\n      ${facts.formTiming.errorVisibility.attribute}={${formTimingValue(facts.formTiming.errorVisibility.dataPropName, errorVisibility)}}\n      ${facts.attrs.invalid}={${invalid} ? "" : undefined}\n      ${facts.attrs.name}={${name}}\n      ${facts.formTiming.revalidationTiming.attribute}={${formTimingValue(facts.formTiming.revalidationTiming.dataPropName, revalidationTiming)}}\n      ${facts.attrs.touched}={${touched} ? "" : undefined}\n      ${facts.formTiming.validationTiming.attribute}={${formTimingValue(facts.formTiming.validationTiming.dataPropName, validationTiming)}}\n      ref={composedRef}\n      {...props}\n    >\n      {children}\n    </div>\n  );\n});\n\n${root}.displayName = "${facts.displayName}.${facts.parts.root.namespaceKey}";\n\nexport default ${root};\n\n${renderSetRefFunction()}`;
}

function printReactFormControlCompositionControl(
  facts: AdapterFormControlCompositionFacts,
): string {
  const control = facts.exports.control;
  const inputPrimitive = REACT_FIELD_CONTROL_INPUT_PRIMITIVE;

  return `import type { ${inputPrimitive.valueType}, ${inputPrimitive.valueChangeDetailsType} } from "@starwind-ui/runtime/input";\nimport * as React from "react";\n\nimport InputRoot from "${inputPrimitive.importSource}";\n\nexport type ${control}Props = Omit<\n  React.InputHTMLAttributes<HTMLInputElement>,\n  "defaultValue" | "value"\n> & {\n  defaultValue?: ${inputPrimitive.valueType};\n  ${inputPrimitive.valueChangeProp}?: (value: string, details: ${inputPrimitive.valueChangeDetailsType}) => void;\n  value?: ${inputPrimitive.valueType};\n};\n\nconst ${control} = React.forwardRef<HTMLInputElement, ${control}Props>(\n  function ${control}(props, ref) {\n    return <InputRoot ${facts.attrs.control} ref={ref} {...props} />;\n  },\n);\n\n${control}.displayName = "${facts.displayName}.${facts.parts.control.namespaceKey}";\n\nexport default ${control};\n`;
}

function printReactFormControlCompositionSimplePart(
  facts: AdapterFormControlCompositionFacts,
  part: AdapterFormControlCompositionFacts["parts"]["description"],
  discoveryAttribute: string,
): string {
  const exportName =
    facts.exports[part.name as keyof AdapterFormControlCompositionFacts["exports"]];
  if (typeof exportName !== "string") {
    throw new Error(
      `${facts.displayName} field-composition facts are missing ${part.name} export.`,
    );
  }
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.ComponentPropsWithoutRef<"${part.defaultElement}">;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(function ${exportName}(\n  { children, ...props },\n  ref,\n) {\n  return (\n    <${part.defaultElement} ${discoveryAttribute} ref={ref} {...props}>\n      {children}\n    </${part.defaultElement}>\n  );\n});\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactFormControlCompositionError(facts: AdapterFormControlCompositionFacts): string {
  const error = facts.exports.error;
  const match = facts.message.error.matchProp.name;
  const messageSource = facts.message.error.messageSource.prop.name;

  return `import * as React from "react";\n\nexport type ${facts.message.matchType} =\n${renderFormControlCompositionMatchUnion(facts.message.matchValues)};\n\nexport type ${facts.message.error.messageSource.typeName} = ${facts.message.error.messageSource.prop.type};\n\nexport type ${error}Props = React.ComponentPropsWithoutRef<"div"> & {\n  ${match}?: ${facts.message.matchType};\n  ${messageSource}?: ${facts.message.error.messageSource.typeName};\n};\n\nconst ${error} = React.forwardRef<HTMLDivElement, ${error}Props>(function ${error}(\n  {\n    children,\n    hidden = ${facts.message.error.hiddenDefault},\n    ${match} = ${facts.message.error.matchDefault},\n    ${messageSource},\n    ...props\n  },\n  ref,\n) {\n  const serializedMatch = ${fieldMatch(match)};\n\n  return (\n    <div\n      ${facts.attrs.error}\n      ${facts.message.error.matchAttribute}={serializedMatch}\n      ${facts.message.error.messageSource.attribute}={${messageSource}}\n      hidden={hidden}\n      ref={ref}\n      {...props}\n    >\n      {children}\n    </div>\n  );\n});\n\n${error}.displayName = "${facts.displayName}.${facts.parts.error.namespaceKey}";\n\nexport default ${error};\n`;
}

function printReactFormControlCompositionValidity(
  facts: AdapterFormControlCompositionFacts,
): string {
  const validity = facts.exports.validity;
  const match = facts.message.validity.matchProp.name;

  return `import * as React from "react";\n\nexport type ${facts.message.matchType} =\n${renderFormControlCompositionMatchUnion(facts.message.matchValues)};\n\nexport type ${validity}Props = React.ComponentPropsWithoutRef<"div"> & {\n  ${match}?: ${facts.message.matchType};\n};\n\nconst ${validity} = React.forwardRef<HTMLDivElement, ${validity}Props>(function ${validity}(\n  { children, hidden = ${facts.message.validity.hiddenDefault}, ${match} = ${facts.message.validity.matchDefault}, ...props },\n  ref,\n) {\n  const serializedMatch = ${fieldMatch(match)};\n\n  return (\n    <div ${facts.attrs.validity} ${facts.message.validity.matchAttribute}={serializedMatch} hidden={hidden} ref={ref} {...props}>\n      {children}\n    </div>\n  );\n});\n\n${validity}.displayName = "${facts.displayName}.${facts.parts.validity.namespaceKey}";\n\nexport default ${validity};\n`;
}

function printReactFormControlCompositionIndex(
  family: AdapterFormControlCompositionIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const exportNames = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exportNames}\n};\n\nexport default ${facts.exports.namespace};\n\n${exportPrinter.printRuntimeTypeReExport({ names: facts.index.typeExports, source: facts.runtime.typeImportSource })}\n`;
}

function printReactNativeOverlayComponent(family: AdapterNativeOverlayComponentProjection): string {
  const facts = family.facts;

  if (family.part === "root") return printReactNativeOverlayRoot(facts);
  if (family.part === "trigger") return printReactNativeOverlayTrigger(facts);
  if (family.part === "backdrop") return printReactNativeOverlayBackdrop(facts);
  if (family.part === "popup") return printReactNativeOverlayPopup(facts);
  if (family.part === "title") {
    return printReactNativeOverlaySimplePart(facts, facts.parts.title, facts.attrs.title);
  }
  if (family.part === "description") {
    return printReactNativeOverlaySimplePart(
      facts,
      facts.parts.description,
      facts.attrs.description,
    );
  }
  if (family.part === "close") return printReactNativeOverlayClose(facts);
  if (family.part === "portal" && facts.parts.portal) {
    return printReactPortalComponent({
      componentName: getNativeOverlayExportName(facts, facts.parts.portal.name),
      discoveryAttribute: facts.attrs.portal as string,
      displayName: facts.displayName,
      rootDiscoveryAttribute: facts.attrs.root,
      runtimeImportSource: facts.runtime.importSource,
    });
  }
  if (family.part === "viewport" && facts.parts.viewport) {
    return printReactNativeOverlaySimplePart(facts, facts.parts.viewport, facts.attrs.viewport);
  }

  throw new Error(`${facts.displayName} native-overlay adapter cannot print ${family.part}.`);
}

function printReactNativeOverlayRoot(facts: AdapterNativeOverlayFacts): string {
  return renderNativeRoot("react", facts.displayName);
}

function printReactNativeOverlayTrigger(facts: AdapterNativeOverlayFacts): string {
  const part = facts.parts.trigger;
  const exportName = facts.exports.trigger;

  return `import * as React from "react";\nimport { useNativeOverlayControl } from "../internal/native-overlay-control";\nimport { NativeOverlayControlContext } from "./${facts.exports.root}";\n\nexport type ${exportName}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${facts.props.asChild.name}?: ${facts.props.asChild.type};\n  ${facts.props.targetId.name}?: ${facts.props.targetId.type};\n};\n\nconst ${exportName} = React.forwardRef<HTMLButtonElement, ${exportName}Props>(\n  function ${exportName}(\n    { ${facts.props.asChild.name} = ${facts.props.asChild.defaultValue}, children, className, ${facts.props.targetId.name}, ...props },\n    forwardedRef,\n  ) {\n    const requestRefresh = React.useContext(NativeOverlayControlContext);\n    const { controlKey, setControlElement } = useNativeOverlayControl({\n      ${facts.props.asChild.name},\n      children,\n      forwardedRef,\n      requestRefresh,\n    });\n\n    if (${facts.props.asChild.name}) {\n      return (\n        <div\n          className={className}\n          data-as-child\n          ${facts.attrs.targetId}={${facts.props.targetId.name}}\n          {...(props as React.HTMLAttributes<HTMLDivElement>)}\n          ${facts.attrs.trigger}\n          key={controlKey}\n          ref={setControlElement}\n        >\n          {children}\n        </div>\n      );\n    }\n\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.triggerType}="button"\n        ${facts.attrs.trigger}\n        ${facts.attrs.triggerAriaHaspopup}="dialog"\n        ${facts.attrs.targetId}={${facts.props.targetId.name}}\n        ${facts.attrs.triggerState}="closed"\n        className={className}\n        ref={setControlElement as React.Ref<HTMLButtonElement>}\n        {...props}\n      >\n        {children}\n      </${part.defaultElement}>\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.Trigger";\n\nexport default ${exportName};\n`;
}

function printReactNativeOverlayBackdrop(facts: AdapterNativeOverlayFacts): string {
  const part = facts.parts.backdrop;
  const exportName = facts.exports.backdrop;

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<HTMLDivElement>;\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    ${renderReactJsxReturn(`<${part.defaultElement} ${facts.attrs.backdrop} ${facts.attrs.backdropState}="closed" ${facts.attrs.backdropHidden} ref={forwardedRef} {...props} />`)}\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.Backdrop";\n\nexport default ${exportName};\n`;
}

function printReactNativeOverlayPopup(facts: AdapterNativeOverlayFacts): string {
  const part = facts.parts.popup;
  const exportName = facts.exports.popup;

  if (facts.props.side) {
    return `import * as React from "react";\n\nexport type ${exportName}Props = React.DialogHTMLAttributes<HTMLDialogElement> & {\n  ${facts.props.side.name}?: ${facts.props.side.type};\n};\n\nconst ${exportName} = React.forwardRef<HTMLDialogElement, ${exportName}Props>(function ${exportName}(\n  { ${facts.props.side.name} = ${facts.sideDefault}, ...props },\n  forwardedRef,\n) {\n  return (\n    <${part.defaultElement}\n      ${facts.attrs.popup}\n      ${facts.attrs.popupState}="closed"\n      ${facts.attrs.popupSide}={${facts.props.side.name}}\n      ref={forwardedRef}\n      {...props}\n    />\n  );\n});\n\n${exportName}.displayName = "${facts.displayName}.Popup";\n\nexport default ${exportName};\n`;
  }

  if (facts.attrs.popupRole && facts.popupRoleValue) {
    return `import * as React from "react";\n\nexport type ${exportName}Props = React.DialogHTMLAttributes<HTMLDialogElement>;\n\nconst ${exportName} = React.forwardRef<HTMLDialogElement, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.popup}\n        ${facts.attrs.popupRole}="${facts.popupRoleValue}"\n        ${facts.attrs.popupState}="closed"\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.Popup";\n\nexport default ${exportName};\n`;
  }

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.DialogHTMLAttributes<HTMLDialogElement>;\n\nconst ${exportName} = React.forwardRef<HTMLDialogElement, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${facts.attrs.popup} ${facts.attrs.popupState}="closed" ref={forwardedRef} {...props} />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.Popup";\n\nexport default ${exportName};\n`;
}

function printReactNativeOverlaySimplePart(
  facts: AdapterNativeOverlayFacts,
  part: { defaultElement: string; discoveryAttribute: string; name: string; namespaceKey: string },
  discoveryAttribute: string | undefined,
): string {
  if (!discoveryAttribute) {
    throw new Error(`${facts.displayName} ${part.name} part is missing overlay metadata.`);
  }

  const exportName = getNativeOverlayExportName(facts, part.name);
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    ${renderReactJsxReturn(`<${part.defaultElement} ${discoveryAttribute} ref={forwardedRef} {...props} />`)}\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactNativeOverlayClose(facts: AdapterNativeOverlayFacts): string {
  const part = facts.parts.close;
  const exportName = facts.exports.close;
  const alertDialogHook =
    facts.displayName === "AlertDialog"
      ? `\nexport function __useAlertDialogControl(\n  options: Omit<NativeOverlayControlOptions, "requestRefresh">,\n) {\n  const requestRefresh = React.useContext(NativeOverlayControlContext);\n  return useNativeOverlayControl({ ...options, requestRefresh });\n}\n`
      : "";
  const helperImport =
    facts.displayName === "AlertDialog"
      ? 'import { useNativeOverlayControl, type NativeOverlayControlOptions } from "../internal/native-overlay-control";'
      : 'import { useNativeOverlayControl } from "../internal/native-overlay-control";';
  const hookSetup =
    facts.displayName === "AlertDialog"
      ? `const { controlKey, setControlElement } = __useAlertDialogControl({\n      ${facts.props.asChild.name},\n      children,\n      forwardedRef,\n    });`
      : `const requestRefresh = React.useContext(NativeOverlayControlContext);\n    const { controlKey, setControlElement } = useNativeOverlayControl({\n      ${facts.props.asChild.name},\n      children,\n      forwardedRef,\n      requestRefresh,\n    });`;

  return `import * as React from "react";\n${helperImport}\nimport { NativeOverlayControlContext } from "./${facts.exports.root}";\n\nexport type ${exportName}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${facts.props.asChild.name}?: ${facts.props.asChild.type};\n};\n${alertDialogHook}\nconst ${exportName} = React.forwardRef<HTMLButtonElement, ${exportName}Props>(\n  function ${exportName}(\n    { ${facts.props.asChild.name} = ${facts.props.asChild.defaultValue}, children, className, ...props },\n    forwardedRef,\n  ) {\n    ${hookSetup}\n\n    if (${facts.props.asChild.name}) {\n      return (\n        <div\n          className={className}\n          data-as-child\n          {...(props as React.HTMLAttributes<HTMLDivElement>)}\n          ${facts.attrs.close}\n          key={controlKey}\n          ref={setControlElement}\n        >\n          {children}\n        </div>\n      );\n    }\n\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.closeType}="button"\n        ${facts.attrs.close}\n        className={className}\n        ref={setControlElement as React.Ref<HTMLButtonElement>}\n        {...props}\n      >\n        {children}\n      </${part.defaultElement}>\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.Close";\n\nexport default ${exportName};\n`;
}

function printReactNativeOverlayIndex(family: AdapterNativeOverlayIndexProjection): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const exportNames = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  const internalControlExport =
    facts.displayName === "AlertDialog"
      ? `export { __useAlertDialogControl } from "./${facts.exports.close}";\n`
      : "";

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exportNames}\n};\n\nexport default ${facts.exports.namespace};\n\n${exportPrinter.printRuntimeTypeReExport({ names: facts.index.typeExports, source: facts.runtime.typeImportSource })}\nexport { NativeOverlayControlContext as ${facts.displayName}ControlContext } from "./${facts.exports.root}";\n${internalControlExport}`;
}

function printReactPresenceFloatingOverlayComponent(
  family: AdapterPresenceFloatingOverlayComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printReactPresenceFloatingOverlayRoot(facts);
  if (family.part === "trigger") return printReactPresenceFloatingOverlayTrigger(facts);
  if (family.part === "positioner") return printReactPresenceFloatingOverlayPositioner(facts);
  if (family.part === "popup") return printReactPresenceFloatingOverlayPopup(facts);
  if (family.part === "backdrop") return printReactPresenceFloatingOverlayBackdrop(facts);
  if (family.part === "close") return printReactPresenceFloatingOverlayClose(facts);
  if (family.part === "portal") {
    return printReactPortalComponent({
      componentName: facts.exports.portal,
      discoveryAttribute: facts.attrs.portal,
      displayName: facts.displayName,
      rootDiscoveryAttribute: facts.attrs.root,
      runtimeImportSource: facts.runtime.importSource,
    });
  }
  if (family.part === "arrow") {
    return printReactPresenceFloatingOverlaySimplePart(
      facts,
      facts.parts.arrow,
      facts.exports.arrow,
      facts.attrs.arrow,
    );
  }
  if (family.part === "title") return printReactPresenceFloatingOverlayTitle(facts);
  if (family.part === "description") return printReactPresenceFloatingOverlayDescription(facts);
  if (family.part === "viewport") {
    return printReactPresenceFloatingOverlaySimplePart(
      facts,
      facts.parts.viewport,
      facts.exports.viewport,
      facts.attrs.viewport,
    );
  }

  throw new Error(
    `${facts.displayName} presence-floating-overlay adapter cannot print ${family.part}.`,
  );
}

function printReactPresenceFloatingOverlayRoot(
  _facts: AdapterPresenceFloatingOverlayFacts,
): string {
  return renderSharedPopoverRoot("react");
}

function printReactPresenceFloatingOverlayTrigger(
  facts: AdapterPresenceFloatingOverlayFacts,
): string {
  return `import * as React from "react";\n${renderReactAsChildImports("multiline")}\n\nexport type ${facts.exports.trigger}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${facts.props.asChild.name}?: ${facts.props.asChild.type};\n};\n\nconst ${facts.exports.trigger} = React.forwardRef<HTMLElement, ${facts.exports.trigger}Props>(function ${facts.exports.trigger}(\n  { ${facts.props.asChild.name} = false, children, className, ...props },\n  forwardedRef,\n) {\n  const protectedTriggerProps = {\n${controlAttributes(popoverPartPolicy(facts, "trigger"))}\n  } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n  const triggerProps = {\n    ...props,\n    ...protectedTriggerProps,\n  } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n\n${renderReactAsChildSetup("  ")}\n\n${renderReactAsChildCloneBranch(
    {
      asChildExpression: facts.props.asChild.name,
      indent: "  ",
      protectedPropsExpression: "protectedTriggerProps",
      propsExpression: "triggerProps",
    },
  )}\n\n  return (\n    <${facts.parts.trigger.defaultElement}\n      ${facts.attrs.triggerType}="button"\n      className={className}\n      ref={forwardedRef as React.Ref<HTMLButtonElement>}\n      {...(triggerProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}\n    >\n      {children}\n    </${facts.parts.trigger.defaultElement}>\n  );\n});\n\n${facts.exports.trigger}.displayName = "${facts.displayName}.Trigger";\n\nexport default ${facts.exports.trigger};\n`;
}

function printReactPresenceFloatingOverlayBackdrop(
  facts: AdapterPresenceFloatingOverlayFacts,
): string {
  const jsx = `<${facts.parts.backdrop.defaultElement} {...props} ${partAttributes("react", popoverPartPolicy(facts, "backdrop"))} ref={forwardedRef} />`;

  return `import * as React from "react";\n\nexport type ${facts.exports.backdrop}Props = React.HTMLAttributes<HTMLDivElement>;\n\nconst ${facts.exports.backdrop} = React.forwardRef<HTMLDivElement, ${facts.exports.backdrop}Props>(\n  function ${facts.exports.backdrop}(props, forwardedRef) {\n    return (\n      ${jsx}\n    );\n  },\n);\n\n${facts.exports.backdrop}.displayName = "${facts.displayName}.Backdrop";\n\nexport default ${facts.exports.backdrop};\n`;
}

function printReactPresenceFloatingOverlayTitle(
  facts: AdapterPresenceFloatingOverlayFacts,
): string {
  return `import * as React from "react";\n\nexport type ${facts.exports.title}Props = React.HTMLAttributes<HTMLHeadingElement>;\n\nconst ${facts.exports.title} = React.forwardRef<HTMLHeadingElement, ${facts.exports.title}Props>(\n  function ${facts.exports.title}(props, forwardedRef) {\n    return <${facts.parts.title.defaultElement} {...props} ${partAttributes("react", popoverPartPolicy(facts, "title"))} ref={forwardedRef} />;\n  },\n);\n\n${facts.exports.title}.displayName = "${facts.displayName}.Title";\n\nexport default ${facts.exports.title};\n`;
}

function printReactPresenceFloatingOverlayDescription(
  facts: AdapterPresenceFloatingOverlayFacts,
): string {
  return `import * as React from "react";\n\nexport type ${facts.exports.description}Props = React.HTMLAttributes<HTMLParagraphElement>;\n\nconst ${facts.exports.description} = React.forwardRef<HTMLParagraphElement, ${facts.exports.description}Props>(\n  function ${facts.exports.description}(props, forwardedRef) {\n    return <${facts.parts.description.defaultElement} {...props} ${partAttributes("react", popoverPartPolicy(facts, "description"))} ref={forwardedRef} />;\n  },\n);\n\n${facts.exports.description}.displayName = "${facts.displayName}.Description";\n\nexport default ${facts.exports.description};\n`;
}

function printReactPresenceFloatingOverlayClose(
  facts: AdapterPresenceFloatingOverlayFacts,
): string {
  return `import * as React from "react";\n\nexport type ${facts.exports.close}Props = React.ButtonHTMLAttributes<HTMLButtonElement>;\n\nconst ${facts.exports.close} = React.forwardRef<HTMLButtonElement, ${facts.exports.close}Props>(\n  function ${facts.exports.close}(props, forwardedRef) {\n    return <${facts.parts.close.defaultElement} {...props} ${partAttributes("react", popoverPartPolicy(facts, "close"))} ref={forwardedRef} />;\n  },\n);\n\n${facts.exports.close}.displayName = "${facts.displayName}.Close";\n\nexport default ${facts.exports.close};\n`;
}

function printReactPresenceFloatingOverlayIndex(
  family: AdapterPresenceFloatingOverlayIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const exportNames = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exportNames}\n};\n\nexport default ${facts.exports.namespace};\n\n${exportPrinter.printRuntimeTypeReExport({ names: facts.index.typeExports, source: facts.runtime.typeImportSource })}\n`;
}

function printReactTimedFloatingOverlayComponent(
  family: AdapterTimedFloatingOverlayComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printReactTimedFloatingOverlayRoot(facts);
  if (family.part === "trigger") return printReactTimedFloatingOverlayTrigger(facts);
  if (family.part === "positioner") return printReactTimedFloatingOverlayPositioner(facts);
  if (family.part === "popup") return printReactTimedFloatingOverlayPopup(facts);
  if (family.part === "portal") {
    return printReactPortalComponent({
      componentName: facts.exports.portal,
      discoveryAttribute: facts.attrs.portal,
      displayName: facts.displayName,
      rootDiscoveryAttribute: facts.attrs.root,
      runtimeImportSource: facts.runtime.importSource,
    });
  }
  if (family.part === "arrow") return printReactTimedFloatingOverlayArrow(facts);
  if (family.part === "backdrop") return printReactTimedFloatingOverlayBackdrop(facts);
  if (family.part === "viewport") return printReactTimedFloatingOverlayViewport(facts);

  throw new Error(
    `${facts.displayName} timed-floating-overlay adapter cannot print ${family.part}.`,
  );
}

function printReactTimedFloatingOverlayRoot(facts: AdapterTimedFloatingOverlayFacts): string {
  return renderTimedRoot("react", facts);
}

function printReactTimedFloatingOverlayTrigger(facts: AdapterTimedFloatingOverlayFacts): string {
  if (facts.trigger.triggerKind === "anchor") {
    return printReactTimedFloatingOverlayAnchorTrigger(facts);
  }

  return `import * as React from "react";\n${renderReactAsChildImports()}\n\nexport type ${facts.exports.trigger}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${facts.props.asChild.name}?: ${facts.props.asChild.type};\n};\n\nconst ${facts.exports.trigger} = React.forwardRef<HTMLElement, ${facts.exports.trigger}Props>(\n  function ${facts.exports.trigger}(\n    { ${facts.props.asChild.name} = false, children, className, ${facts.props.disabled.name} = false, ...props },\n    forwardedRef,\n  ) {\n    const protectedTriggerProps = {\n      "${facts.attrs.trigger}": "",\n      "data-sw-part": "trigger",\n      "${facts.attrs.triggerDisabled}": ${facts.props.disabled.name} ? "" : undefined,\n      "${facts.attrs.triggerAriaDisabled}": ${facts.props.disabled.name} ? "true" : undefined,\n      "${facts.attrs.triggerState}": "${timedTriggerPolicy.state}",\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string | undefined>;\n    const triggerProps = {\n      ...protectedTriggerProps,\n      ...props,\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string | undefined>;\n\n${renderReactAsChildSetup("    ")}\n\n${renderReactAsChildCloneBranch(
    {
      asChildExpression: facts.props.asChild.name,
      indent: "    ",
      protectedPropsExpression: "protectedTriggerProps",
      propsExpression: "triggerProps",
    },
  )}\n\n    return (\n      <${facts.parts.trigger.defaultElement}\n        type="button"\n        className={className}\n        ${facts.attrs.triggerNativeDisabled}={${facts.props.disabled.name}}\n        ref={forwardedRef as React.Ref<HTMLButtonElement>}\n        {...(triggerProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}\n      >\n        {children}\n      </${facts.parts.trigger.defaultElement}>\n    );\n  },\n);\n\n${facts.exports.trigger}.displayName = "${facts.displayName}.Trigger";\n\nexport default ${facts.exports.trigger};\n`;
}

function printReactTimedFloatingOverlayAnchorTrigger(
  facts: AdapterTimedFloatingOverlayFacts,
): string {
  const closeDelayAttribute = requireTimedFloatingString(
    facts.attrs.triggerCloseDelay,
    `${facts.displayName} timed-floating trigger requires closeDelay attribute.`,
  );
  const openDelayAttribute = requireTimedFloatingString(
    facts.attrs.triggerOpenDelay,
    `${facts.displayName} timed-floating trigger requires openDelay attribute.`,
  );

  return `import * as React from "react";\n${renderReactAsChildImports()}\n\nexport type ${facts.exports.trigger}Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "disabled"> & {\n  ${facts.props.asChild.name}?: ${facts.props.asChild.type};\n  ${facts.props.closeDelay.name}?: ${facts.props.closeDelay.type};\n  ${facts.props.disabled.name}?: ${facts.props.disabled.type};\n  ${facts.props.openDelay.name}?: ${facts.props.openDelay.type};\n};\n\nconst ${facts.exports.trigger} = React.forwardRef<HTMLElement, ${facts.exports.trigger}Props>(\n  function ${facts.exports.trigger}(\n    {\n      ${facts.props.asChild.name} = false,\n      children,\n      className,\n      ${facts.props.closeDelay.name},\n      ${facts.props.disabled.name} = ${facts.props.disabled.defaultValue},\n      href,\n      onClick,\n      ${facts.props.openDelay.name},\n      tabIndex,\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const handleClick = React.useCallback<React.MouseEventHandler<HTMLElement>>(\n      (event) => {\n        if (${facts.props.disabled.name}) {\n          event.preventDefault();\n          event.stopPropagation();\n          return;\n        }\n\n        onClick?.(event as React.MouseEvent<HTMLAnchorElement>);\n      },\n      [${facts.props.disabled.name}, onClick],\n    );\n\n    const protectedTriggerProps = {\n      "${facts.attrs.trigger}": "",\n      "data-sw-part": "trigger",\n      "${closeDelayAttribute}": ${facts.props.closeDelay.name},\n      "${facts.attrs.triggerDisabled}": ${facts.props.disabled.name} ? "" : undefined,\n      "${openDelayAttribute}": ${facts.props.openDelay.name},\n      "${facts.attrs.triggerAriaDisabled}": ${facts.props.disabled.name} ? "true" : undefined,\n      "${facts.attrs.triggerState}": "${timedTriggerPolicy.state}",\n      ...(${facts.props.disabled.name} ? { href: undefined, tabIndex: -1 } : {}),\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<string, unknown>;\n    const triggerProps = {\n      ...props,\n      ...protectedTriggerProps,\n      href: ${facts.props.disabled.name} ? undefined : href,\n      tabIndex: ${facts.props.disabled.name} ? -1 : tabIndex,\n      onClick: handleClick,\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<string, unknown>;\n\n${renderReactAsChildSetup("    ")}\n\n${renderReactAsChildCloneBranch(
    {
      asChildExpression: facts.props.asChild.name,
      eventOrder: timedTriggerPolicy.guardedClickOrder,
      indent: "    ",
      protectedPropsExpression: "protectedTriggerProps",
      propsExpression: "triggerProps",
    },
  )}\n\n    return (\n      <${facts.trigger.renderedElement}\n        className={className}\n        href={${facts.props.disabled.name} ? undefined : href}\n        tabIndex={${facts.props.disabled.name} ? -1 : tabIndex}\n        ref={forwardedRef as React.Ref<HTMLAnchorElement>}\n        {...(triggerProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}\n      >\n        {children}\n      </${facts.trigger.renderedElement}>\n    );\n  },\n);\n\n${facts.exports.trigger}.displayName = "${facts.displayName}.Trigger";\n\nexport default ${facts.exports.trigger};\n`;
}

function printReactTimedFloatingOverlayArrow(facts: AdapterTimedFloatingOverlayFacts): string {
  return printReactTimedPassive(facts, "arrow");
}
function printReactTimedFloatingOverlayBackdrop(facts: AdapterTimedFloatingOverlayFacts): string {
  return printReactTimedPassive(facts, "backdrop");
}
function printReactTimedFloatingOverlayViewport(facts: AdapterTimedFloatingOverlayFacts): string {
  return printReactTimedPassive(facts, "viewport");
}

function printReactTimedFloatingOverlayIndex(
  family: AdapterTimedFloatingOverlayIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const exportNames = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exportNames}\n};\n\nexport default ${facts.exports.namespace};\n\n${exportPrinter.printRuntimeTypeReExport({ names: facts.index.typeExports, source: facts.runtime.typeImportSource })}\n`;
}

function printReactSidebarContext(family: AdapterSidebarHelperProjection): string {
  const facts = family.facts;

  return `import * as React from "react";\n\nexport type ${facts.context.typeName} = {\n  expanded: boolean;\n  mobileOpen: boolean;\n  open: boolean;\n  state: "collapsed" | "expanded";\n};\n\nexport const ${facts.context.name} = React.createContext<${facts.context.typeName} | null>(null);\n\nexport function ${facts.context.hook}(): ${facts.context.typeName} | null {\n  return React.useContext(${facts.context.name});\n}\n`;
}

function printReactSidebarComponent(family: AdapterSidebarComponentProjection): string {
  assertSidebarConnection(family.facts);
  const facts = family.facts;

  if (family.part === "provider") return printReactSidebarProvider(facts);
  if (family.part === "sidebar") return printReactSidebarRoot(facts);
  if (family.part === "trigger") return printReactSidebarTrigger(facts);
  if (family.part === "rail") return printReactSidebarRail(facts);
  if (family.part === "menuButton") return printReactSidebarMenuButton(facts);

  throw new Error(`${facts.displayName} sidebar adapter cannot print ${family.part}.`);
}

function printReactSidebarProvider(facts: AdapterSidebarFacts): string {
  return renderSidebarProvider("react", facts);
}

function printReactSidebarRoot(facts: AdapterSidebarFacts): string {
  const props = facts.props;

  return `import * as React from "react";\nimport { ${facts.context.hook} } from "./${facts.context.name}";\n\nexport type ${facts.exports.sidebar}ComponentProps = React.HTMLAttributes<HTMLDivElement> & {\n  ${props.side.name}?: ${props.side.type};\n  ${props.variant.name}?: ${props.variant.type};\n  ${props.collapsible.name}?: ${props.collapsible.type};\n};\n\nconst ${facts.exports.sidebar}Component = React.forwardRef<HTMLDivElement, ${facts.exports.sidebar}ComponentProps>(\n  function ${facts.exports.sidebar}Component({ ${props.side.name} = ${props.side.defaultValue}, ${props.variant.name} = ${props.variant.defaultValue}, ${props.collapsible.name} = ${props.collapsible.defaultValue}, ...props }, forwardedRef) {\n    const sidebarContext = ${facts.context.hook}();\n\n    return (\n      <${facts.parts.sidebar.defaultElement}\n        {...props}\n        ${sidebarAttrs(facts, "sidebar", "react")}\n        ref={forwardedRef}\n      />\n    );\n  },\n);\n\n${facts.exports.sidebar}Component.displayName = "${facts.exports.namespace}.Sidebar";\n\nexport default ${facts.exports.sidebar}Component;\n`;
}

function printReactSidebarTrigger(facts: AdapterSidebarFacts): string {
  const props = facts.props;

  return `import * as React from "react";\n${renderReactAsChildImports()}\nimport { ${facts.context.hook} } from "./${facts.context.name}";\n\nexport type ${facts.exports.trigger}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${props.asChild.name}?: ${props.asChild.type};\n};\n\nconst ${facts.exports.trigger} = React.forwardRef<HTMLElement, ${facts.exports.trigger}Props>(\n  function ${facts.exports.trigger}({ ${props.asChild.name} = ${props.asChild.defaultValue}, children, className, ...props }, forwardedRef) {\n    const sidebarContext = ${facts.context.hook}();\n    const protectedTriggerProps = {\n      ${sidebarAttrs(facts, "trigger", "react", "object")},\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n    const triggerProps = {\n      ...props,\n      ...protectedTriggerProps,\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n\n${renderReactAsChildSetup("    ")}\n\n${renderReactAsChildCloneBranch(
    {
      asChildExpression: props.asChild.name,
      indent: "    ",
      protectedPropsExpression: "protectedTriggerProps",
      propsExpression: "triggerProps",
    },
  )}\n\n    return (\n      <${facts.parts.trigger.defaultElement}\n        ${facts.attrs.triggerType}="button"\n        className={className}\n        ref={forwardedRef as React.Ref<HTMLButtonElement>}\n        {...(triggerProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}\n      >\n        {children}\n      </${facts.parts.trigger.defaultElement}>\n    );\n  },\n);\n\n${facts.exports.trigger}.displayName = "${facts.exports.namespace}.Trigger";\n\nexport default ${facts.exports.trigger};\n`;
}

function printReactSidebarRail(facts: AdapterSidebarFacts): string {
  return `import * as React from "react";\nimport { ${facts.context.hook} } from "./${facts.context.name}";\n\nexport type ${facts.exports.rail}Props = React.ButtonHTMLAttributes<HTMLButtonElement>;\n\nconst ${facts.exports.rail} = React.forwardRef<HTMLButtonElement, ${facts.exports.rail}Props>(\n  function ${facts.exports.rail}(props, forwardedRef) {\n    const sidebarContext = ${facts.context.hook}();\n\n    return (\n      <${facts.parts.rail.defaultElement}\n        {...props}\n        ${sidebarAttrs(facts, "rail", "react")}\n        ref={forwardedRef}\n      />\n    );\n  },\n);\n\n${facts.exports.rail}.displayName = "${facts.exports.namespace}.Rail";\n\nexport default ${facts.exports.rail};\n`;
}

function printReactSidebarMenuButton(facts: AdapterSidebarFacts): string {
  const props = facts.props;

  return `import * as React from "react";\n${renderReactAsChildImports()}\nimport { ${facts.context.hook} } from "./${facts.context.name}";\n\nexport type ${facts.exports.menuButton}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${props.asChild.name}?: ${props.asChild.type};\n};\n\nconst ${facts.exports.menuButton} = React.forwardRef<HTMLElement, ${facts.exports.menuButton}Props>(\n  function ${facts.exports.menuButton}({ ${props.asChild.name} = ${props.asChild.defaultValue}, children, className, ...props }, forwardedRef) {\n    const sidebarContext = ${facts.context.hook}();\n    const protectedMenuButtonProps = {\n      ${sidebarAttrs(facts, "menuButton", "react", "object")},\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n    const menuButtonProps = {\n      ...props,\n      ...protectedMenuButtonProps,\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n\n${renderReactAsChildSetup("    ")}\n\n${renderReactAsChildCloneBranch(
    {
      asChildExpression: props.asChild.name,
      indent: "    ",
      protectedPropsExpression: "protectedMenuButtonProps",
      propsExpression: "menuButtonProps",
    },
  )}\n\n    return (\n      <${facts.parts.menuButton.defaultElement}\n        type="button"\n        className={className}\n        ref={forwardedRef as React.Ref<HTMLButtonElement>}\n        {...(menuButtonProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}\n      >\n        {children}\n      </${facts.parts.menuButton.defaultElement}>\n    );\n  },\n);\n\n${facts.exports.menuButton}.displayName = "${facts.exports.namespace}.MenuButton";\n\nexport default ${facts.exports.menuButton};\n`;
}

function printReactSidebarIndex(family: AdapterSidebarIndexProjection): string {
  const facts = family.facts;
  const imports = [
    `import SidebarComponent from "./${facts.exports.sidebar}";`,
    `import { ${facts.context.contextExports.join(", ")} } from "./${facts.context.name}";`,
    `import ${facts.exports.menuButton} from "./${facts.exports.menuButton}";`,
    `import ${facts.exports.provider} from "./${facts.exports.provider}";`,
    `import ${facts.exports.rail} from "./${facts.exports.rail}";`,
    `import ${facts.exports.trigger} from "./${facts.exports.trigger}";`,
  ].join("\n");
  const objectEntries = facts.index.namespaceMembers
    .map((entry) => `  ${entry.key}: ${entry.name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${objectEntries}\n};\n\nexport type { ${facts.context.contextTypeExports.join(", ")} } from "./${facts.context.name}";\nexport { ${facts.index.valueExports.join(", ")} };\n\nexport default ${facts.exports.namespace};\n\n${exportPrinter.printRuntimeTypeReExport({ names: facts.index.typeExports, source: facts.runtime.typeImportSource })}\n`;
}

function printReactRepeatedDisclosureComponent(
  family: AdapterRepeatedDisclosureComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printReactRepeatedDisclosureRoot(facts);
  if (family.part === "item") return printReactRepeatedDisclosureItem(facts);
  if (family.part === "header") {
    return printReactRepeatedDisclosureSimplePart(facts, facts.parts.header, facts.attrs.header);
  }
  if (family.part === "trigger") return printReactRepeatedDisclosureTrigger(facts);
  if (family.part === "panel") return printReactRepeatedDisclosurePanel(facts);

  throw new Error(`${facts.displayName} repeated-disclosure adapter cannot print ${family.part}.`);
}

function printReactRepeatedDisclosureRoot(_facts: AdapterRepeatedDisclosureFacts): string {
  return renderSharedAccordionRoot("react");
}

function printReactRepeatedDisclosureItem(facts: AdapterRepeatedDisclosureFacts): string {
  const item = facts.exports.item;
  const valueProp = facts.props.itemValue.name;
  const disabledProp = facts.props.disabled.name;

  return `import * as React from "react";\n\nexport const AccordionItemContext = React.createContext(false);\n\nexport type ${item}Props = React.HTMLAttributes<HTMLDivElement> & {\n  ${valueProp}?: ${facts.props.itemValue.type};\n  ${disabledProp}?: ${facts.props.disabled.type};\n};\n\nconst ${item} = React.forwardRef<HTMLDivElement, ${item}Props>(function ${item}(\n  { ${valueProp}, ${disabledProp} = ${facts.props.disabled.defaultValue}, ...props },\n  forwardedRef,\n) {\n  return (\n    <AccordionItemContext.Provider value={${disabledProp}}>\n    <${facts.parts.item.defaultElement}\n      ${facts.attrs.item}\n      ${partAttributes("react", accordionPartPolicy(facts, "item"))}\n      ref={forwardedRef}\n      {...props}\n    />\n    </AccordionItemContext.Provider>\n  );\n});\n\n${item}.displayName = "${facts.displayName}.Item";\n\nexport default ${item};\n`;
}

function printReactRepeatedDisclosureSimplePart(
  facts: AdapterRepeatedDisclosureFacts,
  part: AdapterRepeatedDisclosureFacts["parts"]["header"],
  discoveryAttribute: string,
): string {
  const exportName = facts.exports[part.name as keyof AdapterRepeatedDisclosureFacts["exports"]];
  if (typeof exportName !== "string") {
    throw new Error(
      `${facts.displayName} repeated-disclosure facts are missing ${part.name} export.`,
    );
  }
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${discoveryAttribute} ref={forwardedRef} {...props} />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactRepeatedDisclosureTrigger(facts: AdapterRepeatedDisclosureFacts): string {
  const trigger = facts.exports.trigger;

  return `import * as React from "react";\nimport { AccordionItemContext } from "./AccordionItem";\n\nexport type ${trigger}Props = React.ButtonHTMLAttributes<HTMLButtonElement>;\n\nconst ${trigger} = React.forwardRef<HTMLButtonElement, ${trigger}Props>(\n  function ${trigger}({ disabled = false, ...props }, forwardedRef) {\n    const itemDisabled = React.useContext(AccordionItemContext);\n    return (\n      <${facts.parts.trigger.defaultElement}\n        {...props}\n        ${partAttributes("react", accordionPartPolicy(facts, "trigger"))}\n        disabled={${accordionDisabled("itemDisabled", "disabled", 'props["aria-disabled"]')}}\n        ref={forwardedRef}\n      />\n    );\n  },\n);\n\n${trigger}.displayName = "${facts.displayName}.Trigger";\n\nexport default ${trigger};\n`;
}

function printReactRepeatedDisclosurePanel(facts: AdapterRepeatedDisclosureFacts): string {
  const panel = facts.exports.panel;

  return `import * as React from "react";\n\nexport type ${panel}Props = React.HTMLAttributes<HTMLDivElement>;\n\nconst ${panel} = React.forwardRef<HTMLDivElement, ${panel}Props>(\n  function ${panel}({ style, ...props }, forwardedRef) {\n    return (\n      <${facts.parts.panel.defaultElement}\n        {...props}\n        ${partAttributes("react", accordionPartPolicy(facts, "panel"))}\n        ref={forwardedRef}\n        style={{ ...style, animation: ${JSON.stringify(accordionPartPolicy(facts, "panel").initialAnimation)} }}\n      />\n    );\n  },\n);\n\n${panel}.displayName = "${facts.displayName}.Panel";\n\nexport default ${panel};\n`;
}

function printReactRepeatedDisclosureIndex(
  family: AdapterRepeatedDisclosureIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const exportNames = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exportNames}\n};\n\nexport default ${facts.exports.namespace};\n\n${exportPrinter.printRuntimeTypeReExport({ names: facts.index.typeExports, source: facts.runtime.typeImportSource })}\n`;
}

function printReactControlledValuePresenceComponent(
  family: AdapterControlledValuePresenceComponentProjection,
): string {
  return renderRecipeTabs("react", family.part, family.facts);
}

function printReactControlledValuePresenceHelper(
  family: AdapterControlledValuePresenceHelperProjection,
): string {
  const facts = family.facts;
  const orientationProp = facts.props.orientation.name;
  const valueProp = facts.props.value.name;

  return `import type { ${facts.props.orientation.type}, ${facts.state.type} } from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport type ${facts.context.typeName} = {\n  ${orientationProp}: ${facts.props.orientation.type};\n  ${valueProp}: ${facts.state.type};\n};\n\nconst fallbackContext = {\n  ${orientationProp}: ${facts.props.orientation.defaultValue},\n  ${valueProp}: null,\n} satisfies ${facts.context.typeName};\n\nexport const ${facts.context.componentName} = React.createContext<${facts.context.typeName} | null>(null);\n\nexport function ${facts.context.hookName}(): ${facts.context.typeName} {\n  return React.useContext(${facts.context.componentName}) ?? fallbackContext;\n}\n`;
}

function printReactControlledValuePresenceIndex(
  family: AdapterControlledValuePresenceIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}";`)
    .join("\n");
  const helperExports = printGroupedExports(facts.index.helperExports);
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const exportNames = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\n${helperExports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exportNames}\n};\n\nexport default ${facts.exports.namespace};\n\n${exportPrinter.printRuntimeTypeReExport({ names: facts.index.typeExports, source: facts.runtime.typeImportSource })}\n`;
}

function printReactMediaStatusComponent(family: AdapterMediaStatusComponentProjection): string {
  if (family.part === "root") {
    return printReactMediaStatusRoot(family.facts);
  }

  if (family.part === "image") {
    return printReactMediaStatusImage(family.facts);
  }

  return printReactMediaStatusFallback(family.facts);
}

function printReactMediaStatusRoot(facts: AdapterMediaStatusFacts): string {
  const part = facts.parts.root;
  const exportName = facts.exports.root;
  const elementType = getReactElementTypeForPart(part.defaultElement);
  const propsType = `${exportName}Props`;

  return `import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport const MediaStatusContext = React.createContext<(() => void) | undefined>(undefined);\n\nexport type ${propsType} = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${propsType}>(\n  function ${exportName}(props, forwardedRef) {\n    const rootRef = React.useRef<${elementType}>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const refreshPending = React.useRef(false);\n    const requestRefresh = React.useCallback(() => {\n      ${avatarRefresh(facts, { instance: "instanceRef.current", root: "rootRef.current", pending: "refreshPending.current" })}\n    }, []);\n\n    const composedRef = React.useCallback((node: ${elementType} | null) => {\n      rootRef.current = node;\n      setRef(forwardedRef, node);\n    }, [forwardedRef]);\n\n    React.useEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root);\n      instanceRef.current = instance;\n\n      return () => {\n        instanceRef.current = undefined;\n        instance.destroy();\n      };\n    }, []);\n\n    return (\n      <MediaStatusContext.Provider value={requestRefresh}>\n      <${part.defaultElement}\n        ${part.discoveryAttribute}\n        ${facts.attrs.rootStatus}="${avatarRecipe.initialStatus}"\n        ref={composedRef}\n        {...props}\n      />\n      </MediaStatusContext.Provider>\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n\n${renderSetRefFunction()}`;
}

function printReactMediaStatusImage(facts: AdapterMediaStatusFacts): string {
  const part = facts.parts.image;
  const exportName = facts.exports.image;
  const callbackProp = facts.event.callbackProp;
  const eventDetailsType = facts.event.detailsType;
  const eventValueProperty = facts.event.valueProperty;
  const visibilityProperty = facts.presence.imageConcealment.property;
  const visibilityValue = facts.presence.imageConcealment.value;

  return `import type {\n  ${facts.state.type},\n  ${eventDetailsType},\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { MediaStatusContext } from "./${facts.exports.root}";\n\nexport type ${exportName}Props = React.ImgHTMLAttributes<HTMLImageElement> & {\n  ${facts.props.alt.name}: ${facts.props.alt.type};\n  ${callbackProp}?: (\n    ${eventValueProperty}: ${facts.state.type},\n    details: ${eventDetailsType},\n  ) => void;\n};\n\nconst ${exportName} = React.forwardRef<HTMLImageElement, ${exportName}Props>(\n  function ${exportName}({ ${callbackProp}, style, ...props }, forwardedRef) {\n    const requestRefresh = React.useContext(MediaStatusContext);\n    React.useEffect(() => { requestRefresh?.(); return () => requestRefresh?.(); }, [requestRefresh]);\n    const imageRef = React.useRef<HTMLImageElement>(null);\n    const onLoadingStatusChangeRef = React.useRef(${callbackProp});\n    const hasLoadingStatusChangeCallback = ${callbackProp} !== undefined;\n    onLoadingStatusChangeRef.current = ${callbackProp};\n\n    const composedRef = React.useCallback(\n      (node: HTMLImageElement | null) => {\n        imageRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    React.useEffect(() => {\n      if (!hasLoadingStatusChangeCallback) return;\n\n      const root = imageRef.current?.closest<HTMLElement>("[${facts.parts.root.discoveryAttribute}]");\n      if (!root) return;\n\n      const handleLoadingStatusChange = (event: Event) => {\n        if (event.target !== root) return;\n        const details = (event as CustomEvent<${eventDetailsType}>).detail;\n        onLoadingStatusChangeRef.current?.(details.${eventValueProperty}, details);\n      };\n\n      ${avatarSubscription(
    {
      listen: `root.addEventListener("${facts.event.domEvent}", handleLoadingStatusChange);`,
      read: `root.getAttribute("${facts.attrs.rootStatus}") as ${facts.state.type} | null`,
      notify: `onLoadingStatusChangeRef.current?.(status, { previousStatus: "${avatarRecipe.initialStatus}", status });`,
    },
  )}\n\n      return () => {\n        root.removeEventListener("${facts.event.domEvent}", handleLoadingStatusChange);\n      };\n    }, [hasLoadingStatusChangeCallback]);\n\n    return (\n      <${part.defaultElement}\n        ${part.discoveryAttribute}\n        ${facts.attrs.imageStatus}="${avatarRecipe.initialStatus}"\n        ref={composedRef}\n        style={{ ...style, ${visibilityProperty}: "${visibilityValue}" }}\n        {...props}\n        hidden={false}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n\n${renderSetRefFunction()}`;
}

function printReactMediaStatusFallback(facts: AdapterMediaStatusFacts): string {
  const part = facts.parts.fallback;
  const exportName = facts.exports.fallback;
  const elementType = getReactElementTypeForPart(part.defaultElement);
  const propsType = `${exportName}Props`;
  const delay = facts.props.delay.name;

  return `import * as React from "react";\nimport { MediaStatusContext } from "./${facts.exports.root}";\n\nexport type ${propsType} = React.HTMLAttributes<${elementType}> & {\n  ${delay}?: ${facts.props.delay.type};\n};\n\nconst ${exportName} = React.forwardRef<${elementType}, ${propsType}>(\n  function ${exportName}({ ${delay}, hidden, ...props }, forwardedRef) {\n    const requestRefresh = React.useContext(MediaStatusContext);\n    React.useEffect(() => { requestRefresh?.(); return () => requestRefresh?.(); }, [requestRefresh${avatarRefreshInputs(
    facts,
    "fallback",
  )
    .map((name) => `, ${name}`)
    .join(
      "",
    )}]);\n    const composedRef = React.useCallback(\n      (node: ${elementType} | null) => {\n        if (node) {\n          node.hidden = ${avatarFallbackHidden(delay, "Boolean(hidden)")};\n        }\n\n        setRef(forwardedRef, node);\n      },\n      [${delay}, forwardedRef, hidden],\n    );\n\n    return (\n      <${part.defaultElement}\n        ${part.discoveryAttribute}\n        ${facts.attrs.fallbackDelay}={${delay}}\n        ${facts.attrs.fallbackStatus}="${avatarRecipe.initialStatus}"\n        ref={composedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n\n${renderSetRefFunction()}`;
}

function printReactMediaStatusIndex(family: AdapterMediaStatusIndexProjection): string {
  const facts = family.facts;

  return `import ${facts.exports.fallback} from "./${facts.exports.fallback}";\nimport ${facts.exports.image} from "./${facts.exports.image}";\nimport ${facts.exports.root} from "./${facts.exports.root}";\n\nconst ${facts.exports.namespace} = {\n  Root: ${facts.exports.root},\n  Image: ${facts.exports.image},\n  Fallback: ${facts.exports.fallback},\n};\n\nexport { ${facts.exports.namespace}, ${facts.exports.fallback}, ${facts.exports.image}, ${facts.exports.root} };\n\nexport default ${facts.exports.namespace};\n`;
}

function printReactViewportMeasurementComponent(
  family: AdapterViewportMeasurementComponentProjection,
): string {
  if (family.part === "root") return printReactViewportMeasurementRoot(family.facts);
  if (family.part === "viewport") return printReactViewportMeasurementViewport(family.facts);
  if (family.part === "content") return printReactViewportMeasurementContent(family.facts);
  if (family.part === "scrollbar") return printReactViewportMeasurementScrollbar(family.facts);
  if (family.part === "thumb") return printReactViewportMeasurementThumb(family.facts);

  return printReactViewportMeasurementCorner(family.facts);
}

function printReactViewportMeasurementRoot(facts: AdapterViewportMeasurementFacts): string {
  const part = facts.parts.root;
  const exportName = facts.exports.root;
  const elementType = getReactElementTypeForPart(part.defaultElement);
  const thresholdProp = facts.props.overflowEdgeThreshold;

  return `import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport ${renderViewportMeasurementOverflowEdgeThresholdType(facts, "type")}\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}> & {\n  ${thresholdProp.name}?: ${facts.threshold.typeName};\n};\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}({ ${thresholdProp.name}, ...props }, forwardedRef) {\n    const rootRef = React.useRef<${elementType}>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const thresholdAttributes = ${facts.threshold.helperName}(${thresholdProp.name});\n\n    const composedRef = React.useCallback(\n      (node: ${elementType} | null) => {\n        rootRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    React.useEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root);\n      instanceRef.current = instance;\n\n      return () => {\n        instance.destroy();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, []);\n\n    React.useEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.refresh();\n    }, [\n      thresholdAttributes.shared,\n      thresholdAttributes.xEnd,\n      thresholdAttributes.xStart,\n      thresholdAttributes.yEnd,\n      thresholdAttributes.yStart,\n    ]);\n\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.root}\n        ${facts.attrs.overflowEdgeThreshold}={thresholdAttributes.shared}\n        ${facts.attrs.overflowEdgeThresholdEdges.xEnd}={thresholdAttributes.xEnd}\n        ${facts.attrs.overflowEdgeThresholdEdges.xStart}={thresholdAttributes.xStart}\n        ${facts.attrs.overflowEdgeThresholdEdges.yEnd}={thresholdAttributes.yEnd}\n        ${facts.attrs.overflowEdgeThresholdEdges.yStart}={thresholdAttributes.yStart}\n        ref={composedRef}\n        role="${part.role}"\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n\n${scrollAreaThresholds(facts)}\n\n${renderSetRefFunction()}`;
}

function printReactViewportMeasurementViewport(facts: AdapterViewportMeasurementFacts): string {
  const part = facts.parts.viewport;
  const exportName = facts.exports.viewport;
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}({ style, tabIndex, ...props }, forwardedRef) {\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.viewport}\n        ref={forwardedRef}\n        role="${part.role}"\n        ${facts.attrs.viewportTabIndex}={tabIndex ?? ${scrollAreaRecipe.viewport.initialTabIndex}}\n        ${facts.attrs.viewportStyle}={{ ...style, overflow: "${scrollAreaRecipe.viewport.overflow}" }}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactViewportMeasurementContent(facts: AdapterViewportMeasurementFacts): string {
  const part = facts.parts.content;
  const exportName = facts.exports.content;
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${facts.attrs.content} ref={forwardedRef} role="${part.role}" {...props} />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactViewportMeasurementScrollbar(facts: AdapterViewportMeasurementFacts): string {
  const part = facts.parts.scrollbar;
  const exportName = facts.exports.scrollbar;
  const elementType = getReactElementTypeForPart(part.defaultElement);
  const keepMounted = facts.props.keepMounted;
  const orientation = facts.props.orientation;

  return `import * as React from "react";\n\nexport type ${facts.displayName}Orientation = ${orientation.type};\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}> & {\n  ${keepMounted.name}?: ${keepMounted.type};\n  ${orientation.name}?: ${facts.displayName}Orientation;\n};\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(\n    { ${keepMounted.name} = ${keepMounted.defaultValue}, ${orientation.name} = ${orientation.defaultValue}, ...props },\n    forwardedRef,\n  ) {\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.scrollbar}\n        ${facts.attrs.keepMounted}={${keepMounted.name} ? "" : undefined}\n        ${facts.attrs.orientation}={${orientation.name}}\n        ${facts.attrs.scrollbarAriaHidden}="true"\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactViewportMeasurementThumb(facts: AdapterViewportMeasurementFacts): string {
  const part = facts.parts.thumb;
  const exportName = facts.exports.thumb;
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${facts.attrs.thumb} ref={forwardedRef} {...props} />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactViewportMeasurementCorner(facts: AdapterViewportMeasurementFacts): string {
  const part = facts.parts.corner;
  const exportName = facts.exports.corner;
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${facts.attrs.corner} ${facts.attrs.cornerAriaHidden}="true" ref={forwardedRef} {...props} />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactViewportMeasurementIndex(
  family: AdapterViewportMeasurementIndexProjection,
): string {
  const facts = family.facts;

  return `import ${facts.exports.content} from "./${facts.exports.content}";\nimport ${facts.exports.corner} from "./${facts.exports.corner}";\nimport ${facts.exports.root} from "./${facts.exports.root}";\nimport ${facts.exports.scrollbar} from "./${facts.exports.scrollbar}";\nimport ${facts.exports.thumb} from "./${facts.exports.thumb}";\nimport ${facts.exports.viewport} from "./${facts.exports.viewport}";\n\nconst ${facts.exports.namespace} = {\n  Root: ${facts.exports.root},\n  Viewport: ${facts.exports.viewport},\n  Content: ${facts.exports.content},\n  Scrollbar: ${facts.exports.scrollbar},\n  Thumb: ${facts.exports.thumb},\n  Corner: ${facts.exports.corner},\n};\n\nexport {\n  ${facts.exports.namespace},\n  ${facts.exports.content},\n  ${facts.exports.corner},\n  ${facts.exports.root},\n  ${facts.exports.scrollbar},\n  ${facts.exports.thumb},\n  ${facts.exports.viewport},\n};\n\nexport default ${facts.exports.namespace};\n`;
}

function printReactBooleanFormControlExternalInputRoot(
  facts: AdapterBooleanFormControlFacts,
): string {
  assertBooleanFormControlBehavior(facts, {
    canCancelChange: true,
    formResetSync: true,
    groupStrategy: undefined,
    hasIndeterminate: false,
    inputIdStrategy: "suffixed-when-native",
    inputPlacement: "external",
    readonlyAriaFalseWhenFalse: false,
  });

  const state = facts.props.state.name;
  const defaultState = facts.props.defaultState.name;
  const disabled = facts.props.disabled.name;
  const form = requireFamilyProp(facts.props.form, "form").name;
  const id = requireFamilyProp(facts.props.id, "id").name;
  const inputIdHelperName = requireString(facts.input.idHelperName, "input id helper");
  const inputRef = requireFamilyProp(facts.input.refProp, "inputRef").name;
  const name = requireFamilyProp(facts.props.name, "name").name;
  const nativeButton = facts.props.nativeButton.name;
  const readOnly = requireFamilyProp(facts.props.readOnly, "readOnly").name;
  const required = requireFamilyProp(facts.props.required, "required").name;
  const uncheckedValue = requireFamilyProp(facts.props.uncheckedValue, "uncheckedValue").name;
  const value = requireFamilyProp(facts.props.value, "value").name;
  const setterOptions = formatOptions(facts.setters.state.options);
  const formOptionsSetter = requireSetter(facts.setters.formOptions, "formOptions");

  return `import { ${facts.runtime.factory}, type ${facts.event.detailsType} } from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nexport type ${facts.exports.root}Props = Omit<\n  React.HTMLAttributes<${facts.render.nonNativeElementType}>,\n  "${defaultState}" | "onChange"\n> &\n  Omit<React.ButtonHTMLAttributes<${facts.render.nativeElementType}>, "${defaultState}" | "onChange" | "type"> & {\n    ${state}?: ${facts.props.state.type};\n    ${defaultState}?: ${facts.props.defaultState.type};\n    ${disabled}?: ${facts.props.disabled.type};\n    ${form}?: ${requireFamilyProp(facts.props.form, "form").type};\n    ${id}?: ${requireFamilyProp(facts.props.id, "id").type};\n    ${inputRef}?: React.Ref<${requireFamilyProp(facts.input.refProp, "inputRef").type}>;\n    ${name}?: ${requireFamilyProp(facts.props.name, "name").type};\n    ${nativeButton}?: ${facts.props.nativeButton.type};\n    ${facts.event.callbackProp}?: (${facts.event.valueProperty}: ${facts.event.valueType}, details: ${facts.event.detailsType}) => void;\n    ${readOnly}?: ${requireFamilyProp(facts.props.readOnly, "readOnly").type};\n    ${required}?: ${requireFamilyProp(facts.props.required, "required").type};\n    ${uncheckedValue}?: ${requireFamilyProp(facts.props.uncheckedValue, "uncheckedValue").type};\n    ${value}?: ${requireFamilyProp(facts.props.value, "value").type};\n  };\n\n${renderVisuallyHiddenStyle()}\n\nconst ${facts.exports.root} = React.forwardRef<${facts.render.nonNativeElementType} | ${facts.render.nativeElementType}, ${facts.exports.root}Props>(\n  function ${facts.exports.root}(\n    {\n      ${state},\n      children,\n      ${defaultState} = ${facts.props.defaultState.defaultValue},\n      ${disabled} = ${facts.props.disabled.defaultValue},\n      ${form},\n      ${id},\n      ${inputRef},\n      ${name},\n      ${nativeButton} = ${facts.props.nativeButton.defaultValue},\n      ${facts.event.callbackProp},\n      ${readOnly} = ${requireFamilyProp(facts.props.readOnly, "readOnly").defaultValue},\n      ${required} = ${requireFamilyProp(facts.props.required, "required").defaultValue},\n      ${uncheckedValue},\n      ${value},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const rootRef = React.useRef<${facts.render.nonNativeElementType} | ${facts.render.nativeElementType}>(null);\n    const inputElementRef = React.useRef<${facts.input.elementType}>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const ${state}Ref = React.useRef(${state});\n    const ${facts.event.callbackProp}Ref = React.useRef(${facts.event.callbackProp});\n    const resetSyncTimerRef = React.useRef<number | undefined>(undefined);\n    const ${defaultState}Ref = React.useRef(${defaultState});\n    const [uncontrolled${facts.state.pascalName}, setUncontrolled${facts.state.pascalName}State] = React.useState(${defaultState}Ref.current);\n    const uncontrolled${facts.state.pascalName}Ref = React.useRef(uncontrolled${facts.state.pascalName});\n\n    const setUncontrolled${facts.state.pascalName} = React.useCallback((next${facts.state.pascalName}: ${facts.event.valueType}) => {\n      uncontrolled${facts.state.pascalName}Ref.current = next${facts.state.pascalName};\n      setUncontrolled${facts.state.pascalName}State(next${facts.state.pascalName});\n    }, []);\n\n    useIsomorphicLayoutEffect(() => {\n      ${state}Ref.current = ${state};\n    }, [${state}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.event.callbackProp}Ref.current = ${facts.event.callbackProp};\n    }, [${facts.event.callbackProp}]);\n\n    const composedRef = React.useCallback(\n      (node: ${facts.render.nonNativeElementType} | ${facts.render.nativeElementType} | null) => {\n        rootRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    const composedInputRef = React.useCallback(\n      (node: ${facts.input.elementType} | null) => {\n        inputElementRef.current = node;\n        setRef(${inputRef}, node);\n      },\n      [${inputRef}],\n    );\n\n    useIsomorphicLayoutEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root, {\n        ${defaultState}: ${defaultState}Ref.current,\n        ${disabled},\n        ${form},\n        ${id},\n        ${name},\n        ${readOnly},\n        ${required},\n        ${uncheckedValue},\n        ${value},\n        ...(${state}Ref.current !== undefined ? { ${state}: ${state}Ref.current } : {}),\n      });\n      instanceRef.current = instance;\n      instance.${facts.setters.state.method}(${state}Ref.current ?? uncontrolled${facts.state.pascalName}Ref.current, ${setterOptions});\n      const formElement = inputElementRef.current?.form ?? null;\n      const syncUncontrolledAfterFormReset = (event: Event) => {\n        if (${state}Ref.current !== undefined) return;\n\n        if (resetSyncTimerRef.current !== undefined) {\n          window.clearTimeout(resetSyncTimerRef.current);\n        }\n\n        resetSyncTimerRef.current = window.setTimeout(() => {\n          resetSyncTimerRef.current = undefined;\n          const currentInstance = instanceRef.current;\n          if (event.defaultPrevented || currentInstance !== instance || ${state}Ref.current !== undefined) return;\n\n          setUncontrolled${facts.state.pascalName}(currentInstance.${facts.state.getter}());\n        }, 0);\n      };\n      const unsubscribe = instance.subscribe("${facts.event.name}", (details) => {\n        ${facts.event.callbackProp}Ref.current?.(details.${facts.event.valueProperty}, details);\n        if (instanceRef.current !== instance || details.isCanceled) return;\n\n        if (${state}Ref.current === undefined) {\n          setUncontrolled${facts.state.pascalName}(details.${facts.event.valueProperty});\n        }\n      });\n      formElement?.addEventListener("reset", syncUncontrolledAfterFormReset);\n\n      return () => {\n        formElement?.removeEventListener("reset", syncUncontrolledAfterFormReset);\n        if (resetSyncTimerRef.current !== undefined) {\n          window.clearTimeout(resetSyncTimerRef.current);\n          resetSyncTimerRef.current = undefined;\n        }\n        unsubscribe();\n        uncontrolled${facts.state.pascalName}Ref.current = instance.${facts.state.getter}();\n        instance.destroy();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, [${id}, ${nativeButton}, ${readOnly}]);\n\n${renderReactBooleanMutationSync(facts, state, `uncontrolled${facts.state.pascalName}`, `setUncontrolled${facts.state.pascalName}`)}\n\n    useIsomorphicLayoutEffect(() => {\n      if (${state} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.${facts.setters.state.method}(${state}, ${setterOptions});\n    }, [${state}]);\n\n${renderReactBooleanDisabledSetter(facts, disabled)}\n\n    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.${formOptionsSetter.method}({\n        ${form},\n        ${name},\n        ${required},\n        ${uncheckedValue},\n        ${value},\n      });\n    }, [${form}, ${name}, ${required}, ${uncheckedValue}, ${value}]);\n\n    const rendered${facts.state.pascalName} = ${state} ?? uncontrolled${facts.state.pascalName};\n    const commonProps: React.HTMLAttributes<HTMLElement> &\n      Record<\`data-\${string}\`, string | undefined> = {\n      "${facts.attrs.root}": "",\n      "${facts.attrs.defaultState}": ${defaultState}Ref.current ? "true" : undefined,\n      "${facts.attrs.form}": ${form},\n      "${facts.attrs.id}": ${id},\n      "${facts.attrs.name}": ${name},\n      "${facts.attrs.uncheckedValue}": ${uncheckedValue},\n      "${facts.attrs.value}": ${value},\n      "${facts.attrs.ariaState}": rendered${facts.state.pascalName},\n      "${facts.attrs.ariaReadOnly}": ${readOnly} ? "true" : undefined,\n      "${facts.attrs.ariaRequired}": ${required} ? "true" : undefined,\n      "${facts.attrs.truthyPresence}": rendered${facts.state.pascalName} ? "" : undefined,\n      "${facts.attrs.disabled}": ${disabled} ? "" : undefined,\n      "${facts.attrs.filled}": rendered${facts.state.pascalName} ? "" : undefined,\n      "${facts.attrs.readOnly}": ${readOnly} ? "" : undefined,\n      "${facts.attrs.required}": ${required} ? "" : undefined,\n      "${facts.attrs.falsyPresence}": !rendered${facts.state.pascalName} ? "" : undefined,\n      role: "${facts.render.role}",\n      tabIndex: ${disabled} ? -1 : 0,\n    };\n    const input = (\n      <input\n        ${facts.attrs.input}\n        aria-hidden="true"\n        defaultChecked={${state} ?? ${defaultState}Ref.current}\n        defaultValue={${value}}\n        disabled={${disabled}}\n        form={${form}}\n        id={${inputIdHelperName}(${id}, ${nativeButton})}\n        name={${name}}\n        ref={composedInputRef}\n        required={${required}}\n        style={visuallyHiddenStyle}\n        tabIndex={-1}\n        type="${facts.input.type}"\n      />\n    );\n\n    if (${nativeButton}) {\n      return (\n        <>\n          <${facts.render.nativeElement}\n            {...(props as React.ButtonHTMLAttributes<${facts.render.nativeElementType}>)}\n            {...commonProps}\n            disabled={${disabled}}\n            id={${id}}\n            ref={composedRef as React.Ref<${facts.render.nativeElementType}>}\n            type="button"\n          >\n            {children}\n          </${facts.render.nativeElement}>\n          {input}\n        </>\n      );\n    }\n\n    return (\n      <>\n        <${facts.render.nonNativeElement}\n          {...(props as React.HTMLAttributes<${facts.render.nonNativeElementType}>)}\n          {...commonProps}\n          ref={composedRef as React.Ref<${facts.render.nonNativeElementType}>}\n        >\n          {children}\n        </${facts.render.nonNativeElement}>\n        {input}\n      </>\n    );\n  },\n);\n\n${facts.exports.root}.displayName = "${facts.displayName}.Root";\n\nexport default ${facts.exports.root};\n\n${renderSetRefFunction()}\nfunction ${inputIdHelperName}(id: string | undefined, nativeButton: boolean): string | undefined {\n  if (!id) return undefined;\n  return nativeButton ? \`\${id}-input\` : id;\n}\n`;
}

function printReactBooleanFormControlIndeterminateRoot(
  facts: AdapterBooleanFormControlFacts,
): string {
  assertBooleanFormControlBehavior(facts, {
    canCancelChange: true,
    formResetSync: true,
    groupStrategy: "array-includes",
    hasIndeterminate: true,
    inputIdStrategy: "always-prop",
    inputPlacement: "nested-when-non-native",
    readonlyAriaFalseWhenFalse: true,
  });

  const state = facts.props.state.name;
  const defaultState = facts.props.defaultState.name;
  const disabled = facts.props.disabled.name;
  const form = requireFamilyProp(facts.props.form, "form").name;
  const id = requireFamilyProp(facts.props.id, "id").name;
  const indeterminate = requireFamilyProp(facts.props.indeterminate, "indeterminate").name;
  const name = requireFamilyProp(facts.props.name, "name").name;
  const nativeButton = facts.props.nativeButton.name;
  const readOnly = requireFamilyProp(facts.props.readOnly, "readOnly").name;
  const required = requireFamilyProp(facts.props.required, "required").name;
  const uncheckedValue = requireFamilyProp(facts.props.uncheckedValue, "uncheckedValue").name;
  const value = requireFamilyProp(facts.props.value, "value").name;
  const group = requireGroupFacts(facts);
  const groupVariable = group.variableName;
  const setterOptions = formatOptions(facts.setters.state.options);

  return `import { type ${facts.event.detailsType}, ${facts.runtime.factory} } from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { ${group.hookName} } from "${group.importPath}";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nexport type ${facts.exports.root}Props = Omit<\n  React.HTMLAttributes<${facts.render.nonNativeElementType}>,\n  "${defaultState}" | "onChange"\n> &\n  Omit<React.ButtonHTMLAttributes<${facts.render.nativeElementType}>, "${defaultState}" | "onChange" | "type"> & {\n    ${state}?: ${facts.props.state.type};\n    ${defaultState}?: ${facts.props.defaultState.type};\n    ${disabled}?: ${facts.props.disabled.type};\n    ${form}?: ${requireFamilyProp(facts.props.form, "form").type};\n    ${id}?: ${requireFamilyProp(facts.props.id, "id").type};\n    ${indeterminate}?: ${requireFamilyProp(facts.props.indeterminate, "indeterminate").type};\n    ${name}?: ${requireFamilyProp(facts.props.name, "name").type};\n    ${nativeButton}?: ${facts.props.nativeButton.type};\n    ${facts.event.callbackProp}?: (${facts.event.valueProperty}: ${facts.event.valueType}, details: ${facts.event.detailsType}) => void;\n    ${readOnly}?: ${requireFamilyProp(facts.props.readOnly, "readOnly").type};\n    ${required}?: ${requireFamilyProp(facts.props.required, "required").type};\n    ${uncheckedValue}?: ${requireFamilyProp(facts.props.uncheckedValue, "uncheckedValue").type};\n    ${value}?: ${requireFamilyProp(facts.props.value, "value").type};\n  };\n\n${renderVisuallyHiddenStyle()}\n\nconst ${facts.exports.root} = React.forwardRef<${facts.render.nonNativeElementType} | ${facts.render.nativeElementType}, ${facts.exports.root}Props>(\n  function ${facts.exports.root}(\n    {\n      ${state},\n      children,\n      ${defaultState} = ${facts.props.defaultState.defaultValue},\n      ${disabled} = ${facts.props.disabled.defaultValue},\n      ${form},\n      ${id},\n      ${indeterminate} = ${requireFamilyProp(facts.props.indeterminate, "indeterminate").defaultValue},\n      ${name},\n      ${nativeButton} = ${facts.props.nativeButton.defaultValue},\n      ${facts.event.callbackProp},\n      ${readOnly} = ${requireFamilyProp(facts.props.readOnly, "readOnly").defaultValue},\n      ${required} = ${requireFamilyProp(facts.props.required, "required").defaultValue},\n      ${uncheckedValue},\n      ${value},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const rootRef = React.useRef<${facts.render.nonNativeElementType} | ${facts.render.nativeElementType}>(null);\n    const inputElementRef = React.useRef<${facts.input.elementType}>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const ${state}Ref = React.useRef(${state});\n    const ${indeterminate}Ref = React.useRef(${indeterminate});\n    const ${facts.event.callbackProp}Ref = React.useRef(${facts.event.callbackProp});\n    const resetSyncTimerRef = React.useRef<number | undefined>(undefined);\n    const ${defaultState}Ref = React.useRef(${defaultState});\n    const ${groupVariable} = ${group.hookName}();\n    const groupValue = ${value} ?? ${name};\n    const group${facts.state.pascalName} =\n      ${groupVariable} && groupValue !== undefined ? ${groupVariable}.value.includes(groupValue) : undefined;\n    const groupCheckedRef = React.useRef(group${facts.state.pascalName});\n    useIsomorphicLayoutEffect(() => {\n      groupCheckedRef.current = group${facts.state.pascalName};\n    }, [group${facts.state.pascalName}]);\n    const effectiveDisabled = ${disabled} || ${groupVariable}?.disabled === true;\n    const [uncontrolled${facts.state.pascalName}, setUncontrolled${facts.state.pascalName}State] = React.useState(\n      group${facts.state.pascalName} ?? ${defaultState}Ref.current,\n    );\n    const uncontrolled${facts.state.pascalName}Ref = React.useRef(uncontrolled${facts.state.pascalName});\n    const [renderedIndeterminate, setRenderedIndeterminate] = React.useState(${indeterminate});\n\n    const setUncontrolled${facts.state.pascalName} = React.useCallback((next${facts.state.pascalName}: ${facts.event.valueType}) => {\n      uncontrolled${facts.state.pascalName}Ref.current = next${facts.state.pascalName};\n      setUncontrolled${facts.state.pascalName}State(next${facts.state.pascalName});\n    }, []);\n\n    useIsomorphicLayoutEffect(() => {\n      ${state}Ref.current = ${state};\n    }, [${state}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${indeterminate}Ref.current = ${indeterminate};\n    }, [${indeterminate}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.event.callbackProp}Ref.current = ${facts.event.callbackProp};\n    }, [${facts.event.callbackProp}]);\n\n    const composedRef = React.useCallback(\n      (node: ${facts.render.nonNativeElementType} | ${facts.render.nativeElementType} | null) => {\n        rootRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    useIsomorphicLayoutEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root, {\n        ${defaultState}: ${defaultState}Ref.current,\n        disabled: effectiveDisabled,\n        ${form},\n        ${id},\n        ${indeterminate},\n        ${name},\n        ${readOnly},\n        ${required},\n        ${uncheckedValue},\n        ${value},\n        ...(${state}Ref.current !== undefined\n          ? { ${state}: group${facts.state.pascalName} ?? ${state}Ref.current }\n          : group${facts.state.pascalName} !== undefined\n            ? { ${state}: group${facts.state.pascalName} }\n            : {}),\n      });\n      instanceRef.current = instance;\n      instance.${facts.setters.state.method}(group${facts.state.pascalName} ?? ${state}Ref.current ?? uncontrolled${facts.state.pascalName}Ref.current, ${setterOptions});\n      instance.${facts.setters.indeterminate?.method ?? "setIndeterminate"}(${indeterminate}, { emit: false });\n      const formElement = inputElementRef.current?.form ?? null;\n      const syncUncontrolledAfterFormReset = (event: Event) => {\n        if (${state}Ref.current !== undefined) return;\n\n        if (resetSyncTimerRef.current !== undefined) {\n          window.clearTimeout(resetSyncTimerRef.current);\n        }\n\n        resetSyncTimerRef.current = window.setTimeout(() => {\n          resetSyncTimerRef.current = undefined;\n          const currentInstance = instanceRef.current;\n          if (event.defaultPrevented || currentInstance !== instance || ${state}Ref.current !== undefined || groupCheckedRef.current !== undefined) return;\n\n          setUncontrolled${facts.state.pascalName}(currentInstance.${facts.state.getter}());\n          if (!${indeterminate}Ref.current) {\n            setRenderedIndeterminate(false);\n          }\n        }, 0);\n      };\n      const unsubscribe = instance.subscribe("${facts.event.name}", (details) => {\n        ${facts.event.callbackProp}Ref.current?.(details.${facts.event.valueProperty}, details);\n        if (instanceRef.current !== instance || details.isCanceled) return;\n\n        if (groupCheckedRef.current === undefined && ${state}Ref.current === undefined) {\n          setUncontrolled${facts.state.pascalName}(details.${facts.event.valueProperty});\n        }\n\n        if (!${indeterminate}Ref.current) {\n          setRenderedIndeterminate(false);\n        }\n      });\n      formElement?.addEventListener("reset", syncUncontrolledAfterFormReset);\n\n      return () => {\n        formElement?.removeEventListener("reset", syncUncontrolledAfterFormReset);\n        if (resetSyncTimerRef.current !== undefined) {\n          window.clearTimeout(resetSyncTimerRef.current);\n          resetSyncTimerRef.current = undefined;\n        }\n        unsubscribe();\n        uncontrolled${facts.state.pascalName}Ref.current = instance.${facts.state.getter}();\n        instance.destroy();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, [${form}, ${id}, ${name}, ${nativeButton}, ${readOnly}, ${required}, ${uncheckedValue}, ${value}]);\n\n${renderReactBooleanIndeterminateControlledSetters(facts, state, `group${facts.state.pascalName}`, indeterminate, "effectiveDisabled", setterOptions)}\n\n    const rendered${facts.state.pascalName} = group${facts.state.pascalName} ?? ${state} ?? uncontrolled${facts.state.pascalName};\n    const aria${facts.state.pascalName}: React.AriaAttributes["${facts.attrs.ariaState}"] = renderedIndeterminate\n      ? "mixed"\n      : rendered${facts.state.pascalName};\n    const commonProps: React.HTMLAttributes<HTMLElement> &\n      Record<\`data-\${string}\`, string | undefined> = {\n      "${facts.attrs.root}": "",\n      "${facts.attrs.defaultState}": ${defaultState}Ref.current ? "true" : undefined,\n      "${facts.attrs.form}": ${form},\n      "${facts.attrs.id}": ${id},\n      "${facts.attrs.name}": ${name},\n      "${facts.attrs.uncheckedValue}": ${uncheckedValue},\n      "${facts.attrs.value}": ${value},\n      "${facts.attrs.ariaState}": aria${facts.state.pascalName},\n      "${facts.attrs.ariaReadOnly}": ${readOnly},\n      "${facts.attrs.ariaRequired}": ${required},\n      "${facts.attrs.truthyPresence}": rendered${facts.state.pascalName} ? "" : undefined,\n      "${facts.attrs.disabled}": effectiveDisabled ? "" : undefined,\n      "${facts.attrs.indeterminate}": renderedIndeterminate ? "" : undefined,\n      "${facts.attrs.readOnly}": ${readOnly} ? "" : undefined,\n      "${facts.attrs.required}": ${required} ? "" : undefined,\n      "${facts.attrs.falsyPresence}": !rendered${facts.state.pascalName} ? "" : undefined,\n      role: "${facts.render.role}",\n      tabIndex: effectiveDisabled ? -1 : 0,\n    };\n    const input = (\n      <input\n        ${facts.attrs.input}\n        aria-hidden="true"\n        defaultChecked={group${facts.state.pascalName} ?? ${state} ?? ${defaultState}Ref.current}\n        defaultValue={${value}}\n        disabled={effectiveDisabled}\n        form={${form}}\n        id={${id}}\n        name={${name}}\n        ref={inputElementRef}\n        required={${required}}\n        style={visuallyHiddenStyle}\n        tabIndex={-1}\n        type="${facts.input.type}"\n      />\n    );\n\n    if (${nativeButton}) {\n      return (\n        <>\n          <${facts.render.nativeElement}\n            {...(props as React.ButtonHTMLAttributes<${facts.render.nativeElementType}>)}\n            {...commonProps}\n            disabled={effectiveDisabled}\n            ref={composedRef as React.Ref<${facts.render.nativeElementType}>}\n            type="button"\n          >\n            {children}\n          </${facts.render.nativeElement}>\n          {input}\n        </>\n      );\n    }\n\n    return (\n      <${facts.render.nonNativeElement}\n        {...(props as React.HTMLAttributes<${facts.render.nonNativeElementType}>)}\n        {...commonProps}\n        ref={composedRef as React.Ref<${facts.render.nonNativeElementType}>}\n      >\n        {children}\n        {input}\n      </${facts.render.nonNativeElement}>\n    );\n  },\n);\n\n${facts.exports.root}.displayName = "${facts.displayName}.Root";\n\nexport default ${facts.exports.root};\n\n${renderSetRefFunction()}`;
}

function printReactBooleanFormControlRequiredValueRoot(
  facts: AdapterBooleanFormControlFacts,
): string {
  return renderRadioRoot(radioOperations, facts);
}

function printReactBooleanFormControlStateIndicator(facts: AdapterBooleanFormControlFacts): string {
  const part = requireFamilyPart(facts.parts.stateIndicator, "stateIndicator");
  const exportName = requireString(facts.exports.stateIndicator, "stateIndicator export");
  const keepMounted = facts.props.keepMounted;
  const falsyPresenceAttribute = facts.attrs.stateIndicatorFalsyPresence
    ? ` ${facts.attrs.stateIndicatorFalsyPresence}`
    : "";

  if (!keepMounted) {
    return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${getReactElementTypeForPart(part.defaultElement)}>;\n\nconst ${exportName} = React.forwardRef<${getReactElementTypeForPart(part.defaultElement)}, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${part.discoveryAttribute}${falsyPresenceAttribute} ref={forwardedRef} {...props} />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
  }

  const elementType = getReactElementTypeForPart(part.defaultElement);
  const keepMountedAttribute = facts.attrs.stateIndicatorKeepMounted
    ? `        ${facts.attrs.stateIndicatorKeepMounted}={${keepMounted.name} ? "true" : undefined}\n`
    : "";
  const multilineFalsyPresenceAttribute = facts.attrs.stateIndicatorFalsyPresence
    ? `        ${facts.attrs.stateIndicatorFalsyPresence}\n`
    : "";

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}> & {\n  ${keepMounted.name}?: ${keepMounted.type};\n};\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}({ hidden, ${keepMounted.name} = ${keepMounted.defaultValue}, ...props }, forwardedRef) {\n    const composedRef = React.useCallback(\n      (node: ${elementType} | null) => {\n        if (node) {\n          node.hidden = hidden ?? !${keepMounted.name};\n        }\n\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef, hidden, ${keepMounted.name}],\n    );\n\n    return (\n      <${part.defaultElement}\n        ${part.discoveryAttribute}\n${keepMountedAttribute}${multilineFalsyPresenceAttribute}        ref={composedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n\n${renderSetRefFunction()}`;
}

function printReactBooleanFormControlIndex(
  family: AdapterBooleanFormControlIndexProjection,
): string {
  const facts = family.facts;
  const stateIndicator = facts.parts.stateIndicator;

  if (!stateIndicator || !facts.exports.stateIndicator) {
    return `import ${facts.exports.root} from "./${facts.exports.root}";\n\nconst ${facts.exports.namespace} = {\n  Root: ${facts.exports.root},\n};\n\nexport { ${facts.exports.namespace}, ${facts.exports.root} };\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.event.detailsType} } from "${facts.runtime.typeImportSource}";\n`;
  }

  const importLines =
    stateIndicator.namespaceKey === "Thumb"
      ? [
          `import ${facts.exports.root} from "./${facts.exports.root}";`,
          `import ${facts.exports.stateIndicator} from "./${facts.exports.stateIndicator}";`,
        ]
      : [
          `import ${facts.exports.stateIndicator} from "./${facts.exports.stateIndicator}";`,
          `import ${facts.exports.root} from "./${facts.exports.root}";`,
        ];
  const exportMembers =
    stateIndicator.namespaceKey === "Thumb"
      ? `${facts.exports.namespace}, ${facts.exports.root}, ${facts.exports.stateIndicator}`
      : `${facts.exports.namespace}, ${facts.exports.stateIndicator}, ${facts.exports.root}`;

  return `${importLines.join("\n")}\n\nconst ${facts.exports.namespace} = {\n  Root: ${facts.exports.root},\n  ${stateIndicator.namespaceKey}: ${facts.exports.stateIndicator},\n};\n\nexport { ${exportMembers} };\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.event.detailsType} } from "${facts.runtime.typeImportSource}";\n`;
}

function printReactDisclosurePresenceComponent(
  family: AdapterDisclosurePresenceComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return renderCollapsibleRoot("react");

  if (family.part === "trigger") {
    return `import * as React from "react";\n${renderReactAsChildImports()}\nimport { DisclosureDisabledContext } from "./${facts.exports.root}";\n\nexport type ${facts.exports.trigger}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${facts.props.asChild.name}?: ${facts.props.asChild.type};\n};\n\nconst ${facts.exports.trigger} = React.forwardRef<HTMLElement, ${facts.exports.trigger}Props>(\n  function ${facts.exports.trigger}({ ${facts.props.asChild.name} = ${facts.props.asChild.defaultValue}, children, className, ...props }, forwardedRef) {\n    const rootDisabled = React.useContext(DisclosureDisabledContext);\n${renderReactAsChildSetup("    ")}\n    const disabled = ${disclosureDisabled("rootDisabled", "props.disabled", "asChildElement?.props.disabled")};\n    const protectedTriggerProps = {\n      ${JSON.stringify(facts.attrs.trigger)}: "",\n      disabled,\n      "data-disabled": disabled ? "" : undefined,\n      "${facts.attrs.triggerExpanded}": "${collapsibleParts.trigger.expanded}",\n      "${facts.attrs.triggerState}": "${collapsibleParts.trigger.state}",\n    } satisfies React.ButtonHTMLAttributes<HTMLButtonElement> & Record<\`data-\${string}\`, string | undefined>;\n    const triggerProps = {\n      ...protectedTriggerProps,\n      ...props,\n      disabled,\n    } satisfies React.ButtonHTMLAttributes<HTMLButtonElement> & Record<\`data-\${string}\`, string | undefined>;\n\n${renderReactAsChildCloneBranch(
      {
        asChildExpression: facts.props.asChild.name,
        indent: "    ",
        protectedPropsExpression: "protectedTriggerProps",
        propsExpression: "triggerProps",
      },
    )}\n\n    return (\n      <${facts.parts.trigger.defaultElement}\n        type="button"\n        className={className}\n        ref={forwardedRef as React.Ref<HTMLButtonElement>}\n        {...(triggerProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}\n      >\n        {children}\n      </${facts.parts.trigger.defaultElement}>\n    );\n  },\n);\n\n${facts.exports.trigger}.displayName = "${facts.displayName}.Trigger";\n\nexport default ${facts.exports.trigger};\n`;
  }

  return `import * as React from "react";\n\nexport type ${facts.exports.panel}Props = React.HTMLAttributes<HTMLDivElement> & {\n  ${facts.props.hiddenUntilFound.name}?: ${facts.props.hiddenUntilFound.type};\n};\n\nconst ${facts.exports.panel} = React.forwardRef<HTMLDivElement, ${facts.exports.panel}Props>(\n  function ${facts.exports.panel}({ ${facts.props.hiddenUntilFound.name} = ${facts.props.hiddenUntilFound.defaultValue}, ...props }, forwardedRef) {\n    const composedRef = React.useCallback((node: HTMLDivElement | null) => {\n      if (node) {\n        if (${facts.props.hiddenUntilFound.name}) {\n          node.setAttribute("hidden", "${collapsibleParts.panel.hiddenUntilFound}");\n        } else if (node.getAttribute("hidden") === "${collapsibleParts.panel.hiddenUntilFound}") {\n          node.hidden = true;\n        }\n      }\n\n      setRef(forwardedRef, node);\n    }, [forwardedRef, ${facts.props.hiddenUntilFound.name}]);\n\n    return (\n      <${facts.parts.panel.defaultElement}\n        ${facts.attrs.panel}\n        ${facts.attrs.panelHiddenUntilFound}={${facts.props.hiddenUntilFound.name} ? "" : undefined}\n        ${facts.attrs.panelState}="${collapsibleParts.panel.state}"\n        ${facts.attrs.panelHidden}\n        ref={composedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${facts.exports.panel}.displayName = "${facts.displayName}.Panel";\n\nexport default ${facts.exports.panel};\n\n${renderSetRefFunction()}`;
}

function printReactDisclosurePresenceIndex(
  family: AdapterDisclosurePresenceIndexProjection,
): string {
  const facts = family.facts;

  return `import ${facts.exports.panel} from "./${facts.exports.panel}";\nimport ${facts.exports.root} from "./${facts.exports.root}";\nimport ${facts.exports.trigger} from "./${facts.exports.trigger}";\n\nconst ${facts.exports.namespace} = {\n  Root: ${facts.exports.root},\n  Trigger: ${facts.exports.trigger},\n  Panel: ${facts.exports.panel},\n};\n\nexport { ${facts.exports.namespace}, ${facts.exports.panel}, ${facts.exports.root}, ${facts.exports.trigger} };\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.event.detailsType} } from "${facts.runtime.typeImportSource}";\n`;
}

function printReactGroupedValueControlComponent(
  family: AdapterGroupedValueControlComponentProjection,
): string {
  return printReactGroupedValueControlRoot(family.facts);
}

function printReactGroupedValueControlRoot(facts: AdapterGroupedValueControlFacts): string {
  if (["createRadioGroup", "createCheckboxGroup"].includes(facts.runtime.factory))
    return renderFormGroup(groupOperations, facts);
  if (facts.behavior.multipleValueNormalization) {
    return renderRecipeToggleGroup(toggleOperations("toggle-group"), facts);
  }

  if (isSingleValueGroupedValueControlRoot(facts)) {
    return printReactGroupedValueControlSingleValueRoot(facts);
  }

  return printReactGroupedValueControlArrayRoot(facts);
}

function printReactGroupedValueControlSingleValueRoot(
  facts: AdapterGroupedValueControlFacts,
): string {
  return renderFormGroup(groupOperations, facts);
}

function printReactGroupedValueControlArrayRoot(facts: AdapterGroupedValueControlFacts): string {
  return renderFormGroup(groupOperations, facts);
}

function printReactGroupedValueControlHelper(
  family: AdapterGroupedValueControlHelperProjection,
): string {
  const facts = family.facts;
  const context = getRequiredGroupedValueContext(facts);

  return `import type { ${facts.state.type} } from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport type ${context.typeName} = {\n${context.values.map((value) => `  ${value.name}${value.required === false ? "?" : ""}: ${value.type};`).join("\n")}\n};\n\nconst ${context.componentName} = React.createContext<${context.typeName} | undefined>(undefined);\n${context.componentName}.displayName = "${context.componentName}";\n\nfunction ${context.hookName}(): ${context.typeName} | undefined {\n  return React.useContext(${context.componentName});\n}\n\nexport { ${context.componentName}, ${context.hookName} };\n`;
}

function printReactGroupedValueControlIndex(file: AdapterIndexFile): string {
  const family = getRequiredPlanValue(
    file.family?.kind === "grouped-value-control" ? file.family : undefined,
    "React grouped-value index printer requires grouped-value family facts.",
  );
  const facts = family.facts;
  const rootMember = getRequiredExportMember(file.exports, facts.exports.root);
  const helperImports = printGroupedValueHelperImports(file, rootMember.from);
  const namedExports = file.exports.members
    .map((member) => `  ${member.kind === "type" ? "type " : ""}${member.name},`)
    .join("\n");

  return `${helperImports}import ${facts.exports.root} from "${rootMember.from}";\n\nconst ${facts.exports.namespace} = {\n  Root: ${facts.exports.root},\n};\n\nexport {\n  ${facts.exports.namespace},\n${namedExports}\n};\n\nexport default ${facts.exports.namespace};\n\n${file.typeFacades.map((typeFacade) => typeFacade.body.code).join("\n")}\n`;
}

function printReactSingleBooleanControlComponent(
  family: AdapterSingleBooleanControlComponentProjection,
): string {
  return renderRecipeToggle(toggleOperations("toggle"), family.facts);
}

function printReactSingleBooleanControlIndex(
  family: AdapterSingleBooleanControlIndexProjection,
): string {
  const facts = family.facts;

  return `import ${facts.exports.root} from "./${facts.exports.root}";\n\nconst ${facts.exports.namespace} = {\n  Root: ${facts.exports.root},\n};\n\nexport { ${facts.exports.namespace}, ${facts.exports.root} };\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.event.detailsType} } from "${facts.runtime.typeImportSource}";\n`;
}

function renderSetRefFunction(): string {
  return `function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {\n  if (!ref) return;\n\n  if (typeof ref === "function") {\n    ref(value);\n    return;\n  }\n\n  ref.current = value;\n}\n`;
}

function wrapReactForwardRefFunction(
  contents: string,
  forwardRefDeclaration: string,
  exportName: string,
): string {
  const declarationIndex = contents.indexOf(forwardRefDeclaration);
  const displayNameMarker = `\n\n${exportName}.displayName`;
  const displayNameIndex = contents.indexOf(displayNameMarker);

  if (declarationIndex === -1 || displayNameIndex === -1) {
    throw new Error(`${exportName} forwardRef output cannot be wrapped.`);
  }

  const beforeDeclaration = contents.slice(0, declarationIndex);
  const functionRest = contents.slice(
    declarationIndex + forwardRefDeclaration.length,
    displayNameIndex,
  );

  if (!functionRest.endsWith("});")) {
    throw new Error(`${exportName} forwardRef output has an unexpected terminator.`);
  }

  const functionBody = functionRest.slice(0, -"});".length);
  const indentedFunctionBody = functionBody
    .split("\n")
    .map((line) => (line.length > 0 ? `  ${line}` : line))
    .join("\n");
  const afterFunction = contents.slice(displayNameIndex);

  return `${beforeDeclaration}${forwardRefDeclaration.replace(
    ">(function",
    ">(\n  function",
  )}${indentedFunctionBody}  },\n);${afterFunction}`;
}

function renderReactJsxReturn(jsx: string): string {
  const inlineReturn = `return ${jsx};`;

  if (inlineReturn.length <= 100) {
    return inlineReturn;
  }

  return `return (\n      ${jsx}\n    );`;
}

function renderViewportMeasurementOverflowEdgeThresholdType(
  facts: AdapterViewportMeasurementFacts,
  declarationKeyword: "type",
): string {
  return `${declarationKeyword} ${facts.threshold.typeName} =\n  | number\n  | Partial<{\n      xStart: number;\n      xEnd: number;\n      yStart: number;\n      yEnd: number;\n    }>;`;
}

function formatOptions(
  options: Readonly<Record<string, boolean | number | string>> | undefined,
): string {
  if (!options || Object.keys(options).length === 0) {
    return "{}";
  }

  const entries = Object.entries(options).map(([key, value]) => `${key}: ${JSON.stringify(value)}`);

  return `{ ${entries.join(", ")} }`;
}

function printReactPropsType(component: AdapterComponentModel): string {
  const namedSlots = collectNamedSlots(component);
  const propLines = [
    ...component.props.map(printPropTypeLine),
    ...component.events.map((event) => `${event.handlerProp}?: (event: CustomEvent) => void;`),
    ...namedSlots.map((slotName) => `${slotName}?: React.ReactNode;`),
    "children?: React.ReactNode;",
  ];

  return [
    `export type ${component.name}Props = React.ComponentPropsWithoutRef<"${component.render.kind === "element" ? component.render.defaultElement : "div"}"> & {`,
    ...propLines.map(indent),
    "};",
  ].join("\n");
}

function printReactForwardRef(component: AdapterComponentModel): string {
  const elementName = component.render.kind === "element" ? component.render.defaultElement : "div";
  const defaultedProps = new Map(
    component.defaults.map((defaultValue) => [defaultValue.prop, defaultValue]),
  );
  const namedSlots = collectNamedSlots(component);
  const destructuredProps = [
    ...component.props.map((prop) => {
      const defaultValue = defaultedProps.get(prop.name);

      return defaultValue ? `${prop.name} = ${defaultValue.value.code}` : prop.name;
    }),
    ...component.events.map((event) => event.handlerProp),
    ...namedSlots,
    "children",
    "...props",
  ];

  return [
    `export const ${component.name} = React.forwardRef<React.ElementRef<"${elementName}">, ${component.name}Props>(function ${component.name}(`,
    indent(`{ ${destructuredProps.join(", ")} },`),
    indent("forwardedRef,"),
    ") {",
    indent("const rootRef = React.useRef<HTMLElement | null>(null);"),
    indent(printReactRefCallback()),
    component.lifecycle ? indent(printReactLifecycle(component)) : "",
    indent("return ("),
    indent("<>", 2),
    indent(printReactContextMarkers(component.context), 3),
    indent(printReactRenderNode(component.render, namedSlots), 3),
    indent(printReactPortals(component.portals, namedSlots), 3),
    indent("</>", 2),
    indent(");"),
    "});",
  ]
    .filter(Boolean)
    .join("\n");
}

function printReactRefCallback(): string {
  return [
    "const setRootRef = React.useCallback((node: HTMLElement | null) => {",
    indent("rootRef.current = node;"),
    indent('if (typeof forwardedRef === "function") {'),
    indent("forwardedRef(node as never);", 2),
    indent("} else if (forwardedRef) {"),
    indent("forwardedRef.current = node as never;", 2),
    indent("}"),
    "}, [forwardedRef]);",
  ].join("\n");
}

function printReactLifecycle(component: AdapterComponentModel): string {
  if (!component.lifecycle) return "";

  return [
    "React.useEffect(() => {",
    indent("if (!rootRef.current) return undefined;"),
    indent(`const instance = ${component.lifecycle.factory}(rootRef.current, {});`),
    ...component.events.map((event) => indent(printReactEventBridge(event))),
    indent("return () => {"),
    component.lifecycle.cleanup ? indent(component.lifecycle.cleanup.code, 2) : "",
    indent("void instance;", 2),
    indent("};"),
    "}, []);",
  ].join("\n");
}

function printReactEventBridge(event: AdapterEventBridge): string {
  return `rootRef.current.addEventListener("${event.runtimeEvent}", (event) => ${event.handlerProp}?.(event as CustomEvent));`;
}

function printReactRenderNode(node: AdapterRenderNode, namedSlots: string[]): string {
  if (node.kind === "text") return escapeText(node.value);
  if (node.kind === "expression") return `{${node.expression.code}}`;
  if (node.kind === "slot") return node.name ? `{${node.name} ?? null}` : "{children}";

  return printReactElement(node, namedSlots);
}

function printReactElement(node: AdapterElementRenderNode, namedSlots: string[]): string {
  const attributes = [
    ...node.attrs.map((attribute) => printReactAttribute(attribute)),
    ` data-sw-part="${node.part}"`,
    node.refs.length > 0 ? " ref={setRootRef}" : "",
  ].join("");
  const children = node.children.map((child) => printReactRenderNode(child, namedSlots)).join("\n");

  return [
    `<${node.defaultElement}${attributes}>`,
    indent(children),
    `</${node.defaultElement}>`,
  ].join("\n");
}

function printReactAttribute(attribute: AdapterAttribute): string {
  const name = normalizeReactAttributeName(attribute.name);
  const value = attribute.value;

  if (value === undefined || value === true) return ` ${name}`;
  if (value === false) return ` ${name}={false}`;
  if (typeof value === "object") return ` ${name}={${value.code}}`;
  if (typeof value === "number") return ` ${name}={${String(value)}}`;

  return ` ${name}="${escapeAttribute(value)}"`;
}

function printReactContextMarkers(contexts: AdapterContextProjection[]): string {
  return contexts
    .map(
      (context) =>
        `<span data-sw-context-role="${context.role}" data-sw-context-name="${context.name}" hidden />`,
    )
    .join("\n");
}

function printReactPortals(portals: AdapterPortal[], namedSlots: string[]): string {
  return portals
    .map((portal) => {
      const target =
        typeof portal.target === "string" ? `document.${portal.target}` : portal.target.code;
      const children = portal.children
        .map((child) => printReactRenderNode(child, namedSlots))
        .join("\n");

      return `{typeof document === "undefined" ? null : createPortal(<div data-sw-portal-source="${portal.sourcePart}">${children}</div>, ${target})}`;
    })
    .join("\n");
}

function collectNamedSlots(component: AdapterComponentModel): string[] {
  const namedSlots = new Set<string>();
  const collectFromNode = (node: AdapterRenderNode) => {
    if (node.kind === "slot" && node.name) {
      namedSlots.add(node.name);
      return;
    }

    if (node.kind === "element") {
      for (const child of node.children) collectFromNode(child);
    }
  };

  collectFromNode(component.render);
  for (const portal of component.portals) {
    for (const child of portal.children) collectFromNode(child);
  }

  return [...namedSlots];
}

function printImports(imports: AdapterImport[]): string {
  return imports.map(printImport).join("\n");
}

function printImport(importModel: AdapterImport): string {
  const keyword = importModel.kind === "type" ? "import type" : "import";
  const members = importModel.members
    .map((member) => (member.local ? `${member.imported} as ${member.local}` : member.imported))
    .join(", ");

  return `${keyword} { ${members} } from "${importModel.source}";`;
}

function printPropTypeLine(prop: AdapterProp): string {
  return `${prop.name}${prop.required ? "" : "?"}: ${prop.type};`;
}

function toAttributeVariableName(attributeName: string): string {
  return attributeName
    .split("-")
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`))
    .join("");
}

function requireFamilyProp<T>(prop: T | undefined, label: string): T {
  if (!prop) {
    throw new Error(`Boolean form-control facts are missing ${label}.`);
  }

  return prop;
}

function requireFamilyPart<T>(part: T | undefined, label: string): T {
  if (!part) {
    throw new Error(`Boolean form-control facts are missing ${label}.`);
  }

  return part;
}

function requireString(value: string | undefined, label: string): string {
  if (!value) {
    throw new Error(`Boolean form-control facts are missing ${label}.`);
  }

  return value;
}

function requireTimedFloatingPart(
  facts: AdapterTimedFloatingOverlayFacts,
  partName: "backdrop" | "viewport",
): NonNullable<AdapterTimedFloatingOverlayFacts["parts"]["backdrop" | "viewport"]> {
  const part = facts.parts[partName];
  if (!part) {
    throw new Error(`${facts.displayName} timed-floating facts are missing ${partName} part.`);
  }

  return part;
}

function requireTimedFloatingString(value: string | undefined, label: string): string {
  if (!value) {
    throw new Error(label);
  }

  return value;
}

function isSingleValueGroupedValueControlRoot(facts: AdapterGroupedValueControlFacts): boolean {
  return (
    facts.behavior.contextProvider &&
    !facts.behavior.multipleValueNormalization &&
    !facts.behavior.syncUncontrolledValueFromAttribute &&
    Boolean(
      facts.props.form &&
      facts.props.name &&
      facts.props.orientation &&
      facts.props.readOnly &&
      facts.props.required &&
      facts.setters.formOptions &&
      facts.setters.readOnly,
    )
  );
}

function getRequiredGroupedValueContext(facts: AdapterGroupedValueControlFacts) {
  if (!facts.context) {
    throw new Error(`Grouped-value facts for ${facts.displayName} are missing context.`);
  }

  return facts.context;
}

function getRequiredPlanValue<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }

  return value;
}

function requireSetter<T>(setter: T | undefined, label: string): T {
  if (!setter) {
    throw new Error(`Boolean form-control facts are missing ${label} setter.`);
  }

  return setter;
}

function getReactElementTypeForPart(tagName: string): string {
  const elementTypes: Record<string, string> = {
    button: "HTMLButtonElement",
    dialog: "HTMLDialogElement",
    div: "HTMLDivElement",
    h2: "HTMLHeadingElement",
    h3: "HTMLHeadingElement",
    img: "HTMLImageElement",
    input: "HTMLInputElement",
    label: "HTMLLabelElement",
    p: "HTMLParagraphElement",
    span: "HTMLSpanElement",
  };

  return elementTypes[tagName] ?? "HTMLElement";
}

function getNativeOverlayExportName(facts: AdapterNativeOverlayFacts, partName: string): string {
  const exportName = facts.exports[partName as keyof AdapterNativeOverlayFacts["exports"]];
  if (typeof exportName !== "string") {
    throw new Error(`${facts.displayName} native-overlay facts are missing ${partName} export.`);
  }

  return exportName;
}

function getRangeControlValuesEqualHelperName(facts: AdapterRangeControlFacts): string {
  return `are${facts.displayName}ValuesEqual`;
}

function getRangeControlSerializeValueHelperName(facts: AdapterRangeControlFacts): string {
  return `serialize${facts.displayName}Value`;
}

function renderFormControlCompositionMatchUnion(matchValues: readonly string[]): string {
  return ["boolean", ...matchValues.map((value) => `"${value}"`)]
    .map((value) => `  | ${value}`)
    .join("\n");
}

function printGroupedExports(members: AdapterExportMember[]): string {
  const membersBySource = new Map<string, AdapterExportMember[]>();

  for (const member of members) {
    membersBySource.set(member.from, [...(membersBySource.get(member.from) ?? []), member]);
  }

  return [...membersBySource]
    .map(([source, sourceMembers]) => {
      const names = sourceMembers
        .map((member) => `${member.kind === "type" ? "type " : ""}${member.name}`)
        .join(", ");

      return `export { ${names} } from "${source}";`;
    })
    .join("\n");
}

function printGroupedValueHelperImports(file: AdapterIndexFile, rootFrom: string): string {
  const membersBySource = new Map<string, typeof file.exports.members>();

  for (const member of file.exports.members) {
    if (member.from === rootFrom) continue;
    membersBySource.set(member.from, [...(membersBySource.get(member.from) ?? []), member]);
  }

  return [...membersBySource]
    .map(([source, members]) =>
      [
        "import {",
        ...members.map((member) => `  ${member.kind === "type" ? "type " : ""}${member.name},`),
        `} from "${source}";`,
        "",
      ].join("\n"),
    )
    .join("");
}

function getRequiredExportMember(exportsModel: AdapterNamespaceExport, name: string) {
  return getRequiredPlanValue(
    exportsModel.members.find((member) => member.name === name),
    `Expected ${exportsModel.namespace} index exports to include ${name}.`,
  );
}

function normalizeReactAttributeName(name: string): string {
  if (name === "autocomplete") return "autoComplete";
  if (name === "class") return "className";
  if (name === "for") return "htmlFor";
  if (name === "inputmode") return "inputMode";
  if (name === "maxlength") return "maxLength";
  if (name === "readonly") return "readOnly";
  if (name === "tabindex") return "tabIndex";

  return name;
}

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
}

function escapeStringLiteral(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function indent(value: string, depth = 1): string {
  if (!value) return "";

  const prefix = "  ".repeat(depth);
  return value
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

function identity<T>(value: T): T {
  return value;
}
