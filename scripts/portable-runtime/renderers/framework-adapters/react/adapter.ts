import { defineFrameworkAdapter } from "../conformance.js";
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
  printReactCompositeMenuOverlayComponent,
  printReactCompositeMenuOverlayHelper,
  printReactCompositeMenuOverlayIndex,
} from "./composite-menu-overlay.js";
import {
  printReactColorPickerComponent,
  printReactColorPickerIndex,
  type ReactColorPickerComponentProjection,
  type ReactColorPickerIndexProjection,
} from "./color-picker.js";
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
  printReactPresenceFloatingOverlayPositioner,
  printReactPresenceFloatingOverlayPopup,
  printReactPresenceFloatingOverlaySimplePart,
  printReactTimedFloatingOverlayPositioner,
  printReactTimedFloatingOverlayPopup,
  printReactTimedFloatingOverlaySimplePart,
} from "./overlay-presence-fragments.js";
import {
  printReactOptionCollectionOverlayComponent,
  printReactOptionCollectionOverlayHelper,
  printReactOptionCollectionOverlayIndex,
} from "./option-collection-overlay.js";
import { printReactRangeStatusComponent, printReactRangeStatusIndex } from "./range-status.js";
import {
  printReactSharedViewportNavigationComponent,
  printReactSharedViewportNavigationIndex,
} from "./shared-viewport-navigation.js";

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
        if (file.kind === "component") return this.printComponentFile(file);
        if (file.kind === "helper") return this.printHelperFile(file);
        if (file.kind === "index") return this.printIndexFile(file);
        return this.printTypeFacadeFile(file);
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

function printReactComponent(file: AdapterComponentFile): string {
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
  const family = file.component.family;

  if (family?.kind === "repeated-disclosure" && family.part === "root") {
    return normalizeReactRepeatedDisclosureRoot(family.facts, contents);
  }

  if (family?.kind === "controlled-value-presence" && family.part === "root") {
    return normalizeReactControlledValuePresenceRoot(family.facts, contents);
  }

  if (family?.kind === "boolean-form-control" && family.part === "root") {
    return normalizeReactBooleanFormControlRoot(family.facts, contents);
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
    `      if (${valueRef}.current === undefined) {
        setUncontrolledValue(details.${eventValueProperty});
      }
`,
    `      if (${valueRef}.current === undefined) {
        uncontrolledValueRef.current = details.${eventValueProperty};
      }
`,
    "repeated-disclosure root uncontrolled value subscription ref write",
  );

  return next;
}

function normalizeReactControlledValuePresenceRoot(
  facts: AdapterControlledValuePresenceFacts,
  contents: string,
): string {
  const valueProp = facts.props.value.name;
  const rootElement = facts.parts.root.defaultElement;

  let next = replaceRequired(
    contents,
    `    ${valueProp},
    ...props
  },
`,
    `    ${valueProp},
    children,
    ...props
  },
`,
    "controlled-value-presence root children destructuring",
  );

  next = replaceRequired(
    next,
    `  React.useEffect(() => {
    instanceRef.current?.refresh();
  });
`,
    `  React.useEffect(() => {
    instanceRef.current?.refresh();
  }, [children]);
`,
    "controlled-value-presence root structural refresh dependency",
  );

  next = replaceRequired(
    next,
    `        ref={composedRef}
        {...props}
      />
`,
    `        ref={composedRef}
        {...props}
      >
        {children}
      </${rootElement}>
`,
    "controlled-value-presence root children projection",
  );

  return next;
}

function normalizeReactBooleanFormControlRoot(
  facts: AdapterBooleanFormControlFacts,
  contents: string,
): string {
  const group = facts.group;
  if (!group || !facts.behavior.hasIndeterminate) return contents;

  return replaceRequired(
    contents,
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
  if (family.part === "state-indicator") {
    return printReactBooleanFormControlStateIndicator(family.facts);
  }

  return printReactBooleanFormControlRoot(family.facts);
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
  const props = facts.props;
  const root = facts.exports.root;
  const valuesEqualHelper = getRangeControlValuesEqualHelperName(facts);
  const serializeValueHelper = getRangeControlSerializeValueHelperName(facts);
  const setterOptions = formatOptions(facts.setter.options);

  return `import {\n  ${facts.runtime.factory},\n  type ${props.orientation.type},\n  type ${facts.serializer.valueType},\n  type ${facts.events.valueChange.detailsType},\n  type ${facts.events.valueCommitted.detailsType},\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nexport type ${root}Props = Omit<\n  React.HTMLAttributes<HTMLDivElement>,\n  "${props.defaultValue.name}" | "onChange"\n> & {\n  ${props.defaultValue.name}?: ${facts.serializer.valueType};\n  ${props.disabled.name}?: ${props.disabled.type};\n  ${props.form.name}?: ${props.form.type};\n  ${props.largeStep.name}?: ${props.largeStep.type};\n  ${props.max.name}?: ${props.max.type};\n  ${props.min.name}?: ${props.min.type};\n  ${props.minStepsBetweenValues.name}?: ${props.minStepsBetweenValues.type};\n  ${props.name.name}?: ${props.name.type};\n  ${facts.events.valueChange.callbackProp}?: (${facts.events.valueChange.valueProperty}: ${facts.events.valueChange.valueType}, details: ${facts.events.valueChange.detailsType}) => void;\n  ${facts.events.valueCommitted.callbackProp}?: (${facts.events.valueCommitted.valueProperty}: ${facts.events.valueCommitted.valueType}, details: ${facts.events.valueCommitted.detailsType}) => void;\n  ${props.orientation.name}?: ${props.orientation.type};\n  ${props.step.name}?: ${props.step.type};\n  /**\n   * Controlled value. ${facts.displayName} controlledness is fixed when the Runtime is created; do not switch between controlled and uncontrolled after mount.\n   */\n  ${props.value.name}?: ${facts.serializer.valueType};\n};\n\nconst ${root} = React.forwardRef<HTMLDivElement, ${root}Props>(function ${root}(\n  {\n    ${props.defaultValue.name} = ${props.defaultValue.defaultValue},\n    ${props.disabled.name} = ${props.disabled.defaultValue},\n    ${props.form.name},\n    ${props.largeStep.name} = ${props.largeStep.defaultValue},\n    ${props.max.name} = ${props.max.defaultValue},\n    ${props.min.name} = ${props.min.defaultValue},\n    ${props.minStepsBetweenValues.name} = ${props.minStepsBetweenValues.defaultValue},\n    ${props.name.name},\n    ${facts.events.valueChange.callbackProp},\n    ${facts.events.valueCommitted.callbackProp},\n    ${props.orientation.name} = ${props.orientation.defaultValue},\n    ${props.step.name} = ${props.step.defaultValue},\n    ${props.value.name},\n    ...props\n  },\n  forwardedRef,\n) {\n  const rootRef = React.useRef<HTMLDivElement>(null);\n  const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n  const ${props.defaultValue.name}Ref = React.useRef(${props.defaultValue.name});\n  const ${props.disabled.name}Ref = React.useRef(${props.disabled.name});\n  const ${props.form.name}Ref = React.useRef(${props.form.name});\n  const ${props.largeStep.name}Ref = React.useRef(${props.largeStep.name});\n  const ${props.max.name}Ref = React.useRef(${props.max.name});\n  const ${props.min.name}Ref = React.useRef(${props.min.name});\n  const ${props.minStepsBetweenValues.name}Ref = React.useRef(${props.minStepsBetweenValues.name});\n  const ${props.name.name}Ref = React.useRef(${props.name.name});\n  const ${facts.events.valueChange.callbackProp}Ref = React.useRef(${facts.events.valueChange.callbackProp});\n  const ${facts.events.valueCommitted.callbackProp}Ref = React.useRef(${facts.events.valueCommitted.callbackProp});\n  const ${props.orientation.name}Ref = React.useRef(${props.orientation.name});\n  const ${props.step.name}Ref = React.useRef(${props.step.name});\n  const ${props.value.name}Ref = React.useRef(${props.value.name});\n  const [uncontrolledValue, setUncontrolledValue] = React.useState<${facts.serializer.valueType}>(\n    () => ${props.defaultValue.name}Ref.current,\n  );\n  const uncontrolledValueRef = React.useRef(uncontrolledValue);\n\n  useIsomorphicLayoutEffect(() => {\n    ${props.disabled.name}Ref.current = ${props.disabled.name};\n  }, [${props.disabled.name}]);\n\n  useIsomorphicLayoutEffect(() => {\n    ${facts.events.valueChange.callbackProp}Ref.current = ${facts.events.valueChange.callbackProp};\n  }, [${facts.events.valueChange.callbackProp}]);\n\n  useIsomorphicLayoutEffect(() => {\n    ${facts.events.valueCommitted.callbackProp}Ref.current = ${facts.events.valueCommitted.callbackProp};\n  }, [${facts.events.valueCommitted.callbackProp}]);\n\n  useIsomorphicLayoutEffect(() => {\n    ${props.value.name}Ref.current = ${props.value.name};\n  }, [${props.value.name}]);\n\n  const composedRef = React.useCallback(\n    (node: HTMLDivElement | null) => {\n      rootRef.current = node;\n      setRef(forwardedRef, node);\n    },\n    [forwardedRef],\n  );\n\n  useIsomorphicLayoutEffect(() => {\n    const root = rootRef.current;\n    if (!root) return;\n\n    const instance = ${facts.runtime.factory}(root, {\n      ${props.defaultValue.name}: ${props.defaultValue.name}Ref.current,\n      ${props.disabled.name}: ${props.disabled.name}Ref.current,\n      ${props.form.name}: ${props.form.name}Ref.current,\n      ${props.largeStep.name}: ${props.largeStep.name}Ref.current,\n      ${props.max.name}: ${props.max.name}Ref.current,\n      ${props.min.name}: ${props.min.name}Ref.current,\n      ${props.minStepsBetweenValues.name}: ${props.minStepsBetweenValues.name}Ref.current,\n      ${props.name.name}: ${props.name.name}Ref.current,\n      ${props.orientation.name}: ${props.orientation.name}Ref.current,\n      ${props.step.name}: ${props.step.name}Ref.current,\n      ...(${props.value.name}Ref.current !== undefined ? { ${props.value.name}: ${props.value.name}Ref.current } : {}),\n    });\n    instanceRef.current = instance;\n    const unsubscribeChange = instance.subscribe("${facts.events.valueChange.name}", (details) => {\n      ${facts.events.valueChange.callbackProp}Ref.current?.(details.${facts.events.valueChange.valueProperty}, details);\n      if (details.isCanceled) return;\n\n      if (${props.value.name}Ref.current === undefined) {\n        uncontrolledValueRef.current = details.${facts.events.valueChange.valueProperty};\n        setUncontrolledValue(details.${facts.events.valueChange.valueProperty});\n      }\n    });\n    const unsubscribeCommitted = instance.subscribe("${facts.events.valueCommitted.name}", (details) => {\n      ${facts.events.valueCommitted.callbackProp}Ref.current?.(details.${facts.events.valueCommitted.valueProperty}, details);\n    });\n\n    return () => {\n      unsubscribeChange();\n      unsubscribeCommitted();\n      instance.destroy();\n      if (instanceRef.current === instance) {\n        instanceRef.current = undefined;\n      }\n    };\n  }, []);\n\n  useIsomorphicLayoutEffect(() => {\n    const instance = instanceRef.current;\n    if (!instance) return;\n\n    instance.${facts.setters.disabled}(${props.disabled.name});\n  }, [${props.disabled.name}]);\n\n  useIsomorphicLayoutEffect(() => {\n    ${props.name.name}Ref.current = ${props.name.name};\n    const instance = instanceRef.current;\n    if (!instance) return;\n\n    instance.${facts.setters.name}(${props.name.name});\n  }, [${props.name.name}]);\n\n  useIsomorphicLayoutEffect(() => {\n    const instance = instanceRef.current;\n    if (!instance) return;\n\n    instance.${facts.setters.options}({\n      ${props.form.name},\n      ${props.largeStep.name},\n      ${props.max.name},\n      ${props.min.name},\n      ${props.minStepsBetweenValues.name},\n      ${props.orientation.name},\n      ${props.step.name},\n    });\n\n    if (${props.value.name}Ref.current === undefined) {\n      const nextUncontrolledValue = instance.${facts.state.getter}();\n      if (!${valuesEqualHelper}(uncontrolledValueRef.current, nextUncontrolledValue)) {\n        uncontrolledValueRef.current = nextUncontrolledValue;\n        setUncontrolledValue(nextUncontrolledValue);\n      }\n    }\n  }, [${props.form.name}, ${props.largeStep.name}, ${props.max.name}, ${props.min.name}, ${props.minStepsBetweenValues.name}, ${props.orientation.name}, ${props.step.name}]);\n\n  useIsomorphicLayoutEffect(() => {\n    if (${props.value.name} === undefined) return;\n    const instance = instanceRef.current;\n    if (!instance) return;\n    instance.refresh();\n    if (${valuesEqualHelper}(instance.${facts.state.getter}(), ${props.value.name})) return;\n\n    instance.${facts.setter.method}(${props.value.name}, ${setterOptions});\n  }, [${props.value.name}]);\n\n  const renderedValue = ${props.value.name} ?? uncontrolledValue;\n  const valueAttribute = ${serializeValueHelper}(renderedValue);\n  const defaultValueAttribute = ${serializeValueHelper}(${props.defaultValue.name}Ref.current);\n\n  return (\n    <div\n      {...props}\n      ${facts.attrs.root}\n      ${facts.attrs.defaultValue}={defaultValueAttribute}\n      ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n      ${facts.attrs.form}={${props.form.name}}\n      ${facts.attrs.largeStep}={${props.largeStep.name}}\n      ${facts.attrs.max}={${props.max.name}}\n      ${facts.attrs.min}={${props.min.name}}\n      ${facts.attrs.minStepsBetweenValues}={${props.minStepsBetweenValues.name}}\n      ${facts.attrs.name}={${props.name.name}}\n      ${facts.attrs.orientation}={${props.orientation.name}}\n      ${facts.attrs.step}={${props.step.name}}\n      ${facts.attrs.value}={valueAttribute}\n      ref={composedRef}\n      role="${facts.rootRole}"\n    />\n  );\n});\n\n${root}.displayName = "${facts.displayName}.${facts.parts.root.namespaceKey}";\n\nexport default ${root};\n\nfunction ${valuesEqualHelper}(left: ${facts.serializer.valueType}, right: ${facts.serializer.valueType}): boolean {\n  const leftValues = Array.isArray(left) ? left : [left];\n  const rightValues = Array.isArray(right) ? right : [right];\n\n  return leftValues.length === rightValues.length && leftValues.every((item, index) => item === rightValues[index]);\n}\n\nfunction ${serializeValueHelper}(value: ${facts.serializer.valueType}): string {\n  return Array.isArray(value) ? JSON.stringify(value) : String(value);\n}\n\n${renderSetRefFunction()}`;
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
  const props = facts.props;
  const root = facts.exports.root;
  const rootPart = facts.parts.root;
  const rootElementType = getReactElementTypeForPart(rootPart.defaultElement);
  const setterOptions = formatOptions(facts.setter.options);

  return `import { ${facts.runtime.factory}, type ${facts.event.detailsType} } from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nexport type ${root}Props = Omit<\n  React.HTMLAttributes<${rootElementType}>,\n  "${props.defaultValue.name}" | "id" | "onChange" | "pattern" | "${props.value.name}"\n> & {\n  ${props.defaultValue.name}?: ${props.defaultValue.type};\n  ${props.disabled.name}?: ${props.disabled.type};\n  ${props.form.name}?: ${props.form.type};\n  ${props.id.name}?: ${props.id.type};\n  ${props.maxLength.name}?: ${props.maxLength.type};\n  ${props.name.name}?: ${props.name.type};\n  ${facts.event.callbackProp}?: (${facts.event.valueProperty}: ${facts.event.valueType}, details: ${facts.event.detailsType}) => void;\n  ${props.pattern.name}?: ${props.pattern.type};\n  ${props.readOnly.name}?: ${props.readOnly.type};\n  ${props.required.name}?: ${props.required.type};\n  ${props.value.name}?: ${props.value.type};\n};\n\nconst ${root} = React.forwardRef<${rootElementType}, ${root}Props>(function ${root}(\n  {\n    children,\n    ${props.defaultValue.name},\n    ${props.disabled.name} = ${props.disabled.defaultValue},\n    ${props.form.name},\n    ${props.id.name},\n    ${props.maxLength.name} = ${props.maxLength.defaultValue},\n    ${props.name.name},\n    ${facts.event.callbackProp},\n    ${props.pattern.name},\n    ${props.readOnly.name} = ${props.readOnly.defaultValue},\n    ${props.required.name} = ${props.required.defaultValue},\n    ${props.value.name},\n    ...props\n  },\n  forwardedRef,\n) {\n  const rootRef = React.useRef<${rootElementType}>(null);\n  const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n  const ${facts.event.callbackProp}Ref = React.useRef(${facts.event.callbackProp});\n  const ${props.value.name}Ref = React.useRef(${props.value.name});\n  const ${props.defaultValue.name}Ref = React.useRef(${props.defaultValue.name});\n  const [uncontrolledValue, setUncontrolledValueState] = React.useState(${props.defaultValue.name}Ref.current ?? "");\n  const uncontrolledValueRef = React.useRef(uncontrolledValue);\n  const patternText = normalizePattern(${props.pattern.name});\n  const renderedValue = ${props.value.name} ?? uncontrolledValue;\n\n  const setUncontrolledValue = React.useCallback((nextValue: string) => {\n    uncontrolledValueRef.current = nextValue;\n    setUncontrolledValueState(nextValue);\n  }, []);\n\n  useIsomorphicLayoutEffect(() => {\n    ${facts.event.callbackProp}Ref.current = ${facts.event.callbackProp};\n  }, [${facts.event.callbackProp}]);\n\n  useIsomorphicLayoutEffect(() => {\n    ${props.value.name}Ref.current = ${props.value.name};\n  }, [${props.value.name}]);\n\n  const composedRef = React.useCallback(\n    (node: ${rootElementType} | null) => {\n      rootRef.current = node;\n      setRef(forwardedRef, node);\n    },\n    [forwardedRef],\n  );\n\n  useIsomorphicLayoutEffect(() => {\n    const root = rootRef.current;\n    if (!root) return;\n\n    const instance = ${facts.runtime.factory}(root, {\n      ${props.defaultValue.name}: uncontrolledValueRef.current,\n      ${props.disabled.name},\n      ${props.maxLength.name},\n      ${facts.event.callbackProp}: (nextValue, details) => {\n        ${facts.event.callbackProp}Ref.current?.(nextValue, details);\n        if (details.isCanceled) return;\n\n        if (${props.value.name}Ref.current === undefined) {\n          setUncontrolledValue(nextValue);\n        }\n      },\n      ${props.pattern.name}: patternText,\n      ${props.readOnly.name},\n      ...(${props.value.name}Ref.current !== undefined ? { ${props.value.name}: ${props.value.name}Ref.current } : {}),\n    });\n    instanceRef.current = instance;\n\n    return () => {\n      instance.destroy();\n      if (instanceRef.current === instance) {\n        instanceRef.current = undefined;\n      }\n    };\n  }, [${props.maxLength.name}, patternText, ${props.readOnly.name}]);\n\n  useIsomorphicLayoutEffect(() => {\n    if (${props.value.name} === undefined) return;\n    const instance = instanceRef.current;\n    if (!instance) return;\n    if (instance.${facts.state.getter}() === ${props.value.name}) return;\n\n    instance.${facts.setter.method}(${props.value.name}, ${setterOptions});\n  }, [${props.value.name}]);\n\n  useIsomorphicLayoutEffect(() => {\n    const instance = instanceRef.current;\n    if (!instance) return;\n\n    instance.${facts.setters.disabled}(${props.disabled.name});\n  }, [${props.disabled.name}]);\n\n  useIsomorphicLayoutEffect(() => {\n    const instance = instanceRef.current;\n    if (!instance) return;\n\n    instance.${facts.setters.formOptions}({ ${props.form.name}, ${props.id.name}, ${props.name.name}, ${props.required.name} });\n  }, [${props.form.name}, ${props.id.name}, ${props.name.name}, ${props.required.name}]);\n\n  return (\n    <${rootPart.defaultElement}\n      ${facts.attrs.root}\n      ${facts.attrs.defaultValue}={${props.defaultValue.name}Ref.current}\n      ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n      ${facts.attrs.form}={${props.form.name}}\n      ${facts.attrs.id}={${props.id.name}}\n      ${facts.attrs.maxLength}={${props.maxLength.name}}\n      ${facts.attrs.name}={${props.name.name}}\n      ${facts.attrs.pattern}={patternText}\n      ${facts.attrs.readOnly}={${props.readOnly.name} ? "" : undefined}\n      ${facts.attrs.required}={${props.required.name} ? "" : undefined}\n      ${facts.attrs.value}={renderedValue}\n      ${facts.attrs.ariaDisabled}={${props.disabled.name}}\n      ref={composedRef}\n      ${facts.attrs.rootTabIndex}={${props.disabled.name} ? -1 : 0}\n      {...props}\n    >\n      <${facts.parts.input.defaultElement}\n        ${facts.attrs.input}\n        ${facts.attrs.inputAutocomplete}="${facts.nativeInput.autocompleteValue}"\n        ${facts.attrs.inputClass}="${facts.nativeInput.hiddenClassValue}"\n        defaultValue={renderedValue}\n        disabled={${props.disabled.name}}\n        form={${props.form.name}}\n        id={${props.id.name}}\n        ${facts.attrs.inputMode}={isNumericPattern(patternText) ? "numeric" : "text"}\n        ${facts.attrs.inputMaxLength}={${props.maxLength.name}}\n        name={${props.name.name}}\n        ${facts.attrs.inputReadOnly}={${props.readOnly.name}}\n        required={${props.required.name}}\n        ${facts.attrs.inputTabIndex}={${facts.nativeInput.tabIndexValue}}\n      />\n      {children}\n    </${rootPart.defaultElement}>\n  );\n});\n\n${root}.displayName = "${facts.displayName}.${facts.parts.root.namespaceKey}";\n\nexport default ${root};\n\nfunction normalizePattern(pattern: RegExp | string | undefined): string {\n  const source = pattern instanceof RegExp ? pattern.source : pattern;\n  return (source ?? "${escapeStringLiteral(facts.pattern.defaultPattern)}").replace(/^\\^|\\$$/g, "");\n}\n\nfunction isNumericPattern(pattern: string): boolean {\n  return ${JSON.stringify(facts.pattern.numericPatternExamples)}.includes(pattern);\n}\n\n${renderSetRefFunction()}`;
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

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}> & {\n  ${props.caret.name}?: ${props.caret.type};\n  ${props.index.name}?: ${props.index.type};\n};\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(function ${exportName}(\n  { ${props.caret.name}, ${props.index.name}, ...props },\n  forwardedRef,\n) {\n  return (\n    <${part.defaultElement} ${facts.attrs.slot} ${facts.attrs.slotIndex}={${props.index.name}} ref={forwardedRef} {...props}>\n      <${facts.parts.slotChar.defaultElement} ${facts.attrs.slotChar} />\n      <${facts.parts.slotCaret.defaultElement}\n        ${facts.attrs.slotCaret}\n        ${facts.attrs.slotCaretClass}="${facts.visualSlots.slotCaret.classValue}"\n        ${facts.attrs.slotCaretHidden}\n      >\n        {${props.caret.name} ?? <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />}\n      </${facts.parts.slotCaret.defaultElement}>\n    </${part.defaultElement}>\n  );\n});\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
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
  const props = facts.props;
  const root = facts.exports.root;
  const rootPart = facts.parts.root;
  const rootElementType = getReactElementTypeForPart(rootPart.defaultElement);
  const rootAttributesType =
    rootPart.defaultElement === "label"
      ? `React.LabelHTMLAttributes<${rootElementType}>`
      : `React.HTMLAttributes<${rootElementType}>`;

  return `import { ${facts.runtime.factory}, type ${facts.event.detailsType} } from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nexport type ${root}Props = Omit<${rootAttributesType}, "onChange"> & {\n  ${props.disabled.name}?: ${props.disabled.type};\n  ${props.isUploading.name}?: ${props.isUploading.type};\n  ${facts.event.callbackProp}?: (${facts.event.valueProperty}: ${facts.event.valueType}, details: ${facts.event.detailsType}) => void;\n};\n\nconst ${root} = React.forwardRef<${rootElementType}, ${root}Props>(function ${root}(\n  { ${props.disabled.name} = ${props.disabled.defaultValue}, ${props.isUploading.name} = ${props.isUploading.defaultValue}, ${facts.event.callbackProp}, ...props },\n  forwardedRef,\n) {\n  const rootRef = React.useRef<${rootElementType}>(null);\n  const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n  const ${facts.event.callbackProp}Ref = React.useRef(${facts.event.callbackProp});\n  const ${props.disabled.name}Ref = React.useRef(${props.disabled.name});\n  const ${props.isUploading.name}Ref = React.useRef(${props.isUploading.name});\n\n  useIsomorphicLayoutEffect(() => {\n    ${facts.event.callbackProp}Ref.current = ${facts.event.callbackProp};\n  }, [${facts.event.callbackProp}]);\n\n  useIsomorphicLayoutEffect(() => {\n    ${props.disabled.name}Ref.current = ${props.disabled.name};\n  }, [${props.disabled.name}]);\n\n  useIsomorphicLayoutEffect(() => {\n    ${props.isUploading.name}Ref.current = ${props.isUploading.name};\n  }, [${props.isUploading.name}]);\n\n  const composedRef = React.useCallback(\n    (node: ${rootElementType} | null) => {\n      rootRef.current = node;\n      setRef(forwardedRef, node);\n    },\n    [forwardedRef],\n  );\n\n  useIsomorphicLayoutEffect(() => {\n    const root = rootRef.current;\n    if (!root) return;\n\n    const instance = ${facts.runtime.factory}(root, {\n      ${props.disabled.name}: ${props.disabled.name}Ref.current,\n      ${props.isUploading.name}: ${props.isUploading.name}Ref.current,\n      ${facts.event.callbackProp}: (${facts.event.valueProperty}, details) => {\n        ${facts.event.callbackProp}Ref.current?.(${facts.event.valueProperty}, details);\n      },\n    });\n    instanceRef.current = instance;\n\n    return () => {\n      instance.destroy();\n      if (instanceRef.current === instance) {\n        instanceRef.current = undefined;\n      }\n    };\n  }, []);\n\n  useIsomorphicLayoutEffect(() => {\n    instanceRef.current?.${facts.setters.disabled}(${props.disabled.name});\n  }, [${props.disabled.name}]);\n\n  useIsomorphicLayoutEffect(() => {\n    instanceRef.current?.${facts.setters.uploading}(${props.isUploading.name});\n  }, [${props.isUploading.name}]);\n\n  return (\n    <${rootPart.defaultElement}\n      ${facts.attrs.root}\n      ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n      ${facts.attrs.dragActive}="false"\n      ${facts.attrs.hasFiles}="false"\n      ${facts.attrs.isUploading}={${props.isUploading.name} ? "true" : "false"}\n      ${facts.attrs.ariaDisabled}={${props.disabled.name} ? "true" : "false"}\n      ${facts.attrs.role}="${rootPart.role}"\n      tabIndex={${props.disabled.name} ? -1 : 0}\n      ref={composedRef}\n      {...props}\n    />\n  );\n});\n\n${root}.displayName = "${facts.displayName}.${rootPart.namespaceKey}";\n\nexport default ${root};\n\n${renderSetRefFunction()}`;
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

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}> & {\n  ${props.isUploading.name}?: ${props.isUploading.type};\n};\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(\n    { ${props.isUploading.name} = ${props.isUploading.defaultValue}, hidden = ${props.isUploading.name}, ...props },\n    forwardedRef,\n  ) {\n    return (\n      <${part.defaultElement}\n        {...props}\n        ${facts.attrs.uploadIndicator}\n        ${facts.attrs.isUploading}={${props.isUploading.name} ? "true" : "false"}\n        hidden={hidden}\n        ref={forwardedRef}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactFileDropControlLoadingIndicator(facts: AdapterFileDropControlFacts): string {
  const props = facts.props;
  const part = facts.parts.loadingIndicator;
  const exportName = facts.exports.loadingIndicator;
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}> & {\n  ${props.isUploading.name}?: ${props.isUploading.type};\n};\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(\n    { ${props.isUploading.name} = ${props.isUploading.defaultValue}, hidden = !${props.isUploading.name}, ...props },\n    forwardedRef,\n  ) {\n    return (\n      <${part.defaultElement}\n        {...props}\n        ${facts.attrs.loadingIndicator}\n        ${facts.attrs.isUploading}={${props.isUploading.name} ? "true" : "false"}\n        hidden={hidden}\n        ref={forwardedRef}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
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

  return `import { ${facts.runtime.factory}, type ${facts.runtime.validationTimingType} } from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nexport type ${exportName}Props = React.ComponentPropsWithoutRef<"${part.defaultElement}"> & {\n  "${facts.attrs.errorVisibility}"?: ${facts.runtime.validationTimingType};\n  "${facts.attrs.revalidationTiming}"?: ${facts.runtime.validationTimingType};\n  "${facts.attrs.validationTiming}"?: ${facts.runtime.validationTimingType};\n  ${errorVisibility}?: ${facts.props.errorVisibility.type};\n  ${revalidationTiming}?: ${facts.props.revalidationTiming.type};\n  ${validationTiming}?: ${facts.props.validationTiming.type};\n};\n\nconst ${exportName} = React.forwardRef<HTMLFormElement, ${exportName}Props>(\n  function ${exportName}(\n    {\n      children,\n      "${facts.attrs.errorVisibility}": ${dataErrorVisibility},\n      "${facts.attrs.revalidationTiming}": ${dataRevalidationTiming},\n      "${facts.attrs.validationTiming}": ${dataValidationTiming},\n      ${errorVisibility},\n      ${revalidationTiming},\n      ${validationTiming},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const rootRef = React.useRef<HTMLFormElement>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(\n      undefined,\n    );\n\n    const composedRef = React.useCallback(\n      (node: HTMLFormElement | null) => {\n        rootRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    useIsomorphicLayoutEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root);\n      instanceRef.current = instance;\n\n      return () => {\n        instance.destroy();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, []);\n\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.root}\n        ${facts.attrs.rootSlot}="${part.slotValue}"\n        ${facts.attrs.errorVisibility}={${dataErrorVisibility} ?? ${errorVisibility}}\n        ${facts.attrs.revalidationTiming}={${dataRevalidationTiming} ?? ${revalidationTiming}}\n        ${facts.attrs.validationTiming}={${dataValidationTiming} ?? ${validationTiming}}\n        ref={composedRef}\n        {...props}\n      >\n        {children}\n      </${part.defaultElement}>\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n\n${renderSetRefFunction()}`;
}

function printReactFormFieldCoordinatorErrorSummary(
  facts: AdapterFormFieldCoordinatorFacts,
): string {
  const part = facts.parts.errorSummary;
  const exportName = facts.exports.errorSummary;
  const ariaAtomic = toAttributeVariableName(facts.attrs.errorSummaryAriaAtomic);
  const ariaLive = toAttributeVariableName(facts.attrs.errorSummaryAriaLive);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.ComponentPropsWithoutRef<"${part.defaultElement}">;\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(\n  function ${exportName}(\n    {\n      children,\n      ${facts.attrs.errorSummaryHidden} = true,\n      ${facts.attrs.errorSummaryRole} = "status",\n      "${facts.attrs.errorSummaryAriaLive}": ${ariaLive} = "polite",\n      "${facts.attrs.errorSummaryAriaAtomic}": ${ariaAtomic} = "true",\n      ...props\n    },\n    ref,\n  ) {\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.errorSummary}\n        ${facts.attrs.errorSummarySlot}="${part.slotValue}"\n        ${facts.attrs.errorSummaryRole}={${facts.attrs.errorSummaryRole}}\n        ${facts.attrs.errorSummaryAriaLive}={${ariaLive}}\n        ${facts.attrs.errorSummaryAriaAtomic}={${ariaAtomic}}\n        ${facts.attrs.errorSummaryHidden}={${facts.attrs.errorSummaryHidden}}\n        ref={ref}\n        {...props}\n      >\n        {children}\n      </${part.defaultElement}>\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
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

  return `import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\nimport type { ${facts.formTiming.typeImport.name} } from "${facts.formTiming.typeImport.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nexport type ${root}Props = Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> & {\n  "${facts.formTiming.errorVisibility.attribute}"?: ${facts.formTiming.errorVisibility.prop.type};\n  "${facts.formTiming.revalidationTiming.attribute}"?: ${facts.formTiming.revalidationTiming.prop.type};\n  "${facts.formTiming.validationTiming.attribute}"?: ${facts.formTiming.validationTiming.prop.type};\n  ${dirty}?: ${facts.rootState.dirty.prop.type};\n  ${disabled}?: ${facts.rootState.disabled.prop.type};\n  ${errorVisibility}?: ${facts.formTiming.errorVisibility.prop.type};\n  ${invalid}?: ${facts.rootState.invalid.prop.type};\n  ${name}?: ${facts.rootState.name.prop.type};\n  ${revalidationTiming}?: ${facts.formTiming.revalidationTiming.prop.type};\n  ${touched}?: ${facts.rootState.touched.prop.type};\n  ${validationTiming}?: ${facts.formTiming.validationTiming.prop.type};\n};\n\nconst ${root} = React.forwardRef<HTMLDivElement, ${root}Props>(function ${root}(\n  {\n    children,\n    "${facts.formTiming.errorVisibility.attribute}": ${facts.formTiming.errorVisibility.dataPropName},\n    "${facts.formTiming.revalidationTiming.attribute}": ${facts.formTiming.revalidationTiming.dataPropName},\n    "${facts.formTiming.validationTiming.attribute}": ${facts.formTiming.validationTiming.dataPropName},\n    ${dirty},\n    ${disabled} = ${facts.rootState.disabled.prop.defaultValue},\n    ${errorVisibility},\n    ${invalid},\n    ${name},\n    ${revalidationTiming},\n    ${touched},\n    ${validationTiming},\n    ...props\n  },\n  forwardedRef,\n) {\n  const rootRef = React.useRef<HTMLDivElement>(null);\n  const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n\n  const composedRef = React.useCallback(\n    (node: HTMLDivElement | null) => {\n      rootRef.current = node;\n      setRef(forwardedRef, node);\n    },\n    [forwardedRef],\n  );\n\n  useIsomorphicLayoutEffect(() => {\n    const root = rootRef.current;\n    if (!root) return;\n\n    const instance = ${facts.runtime.factory}(root, {\n      ${dirty},\n      ${disabled},\n      ${invalid},\n      ${name},\n      ${touched},\n    });\n    instanceRef.current = instance;\n\n    return () => {\n      instance.destroy();\n      if (instanceRef.current === instance) {\n        instanceRef.current = undefined;\n      }\n    };\n  }, []);\n\n  useIsomorphicLayoutEffect(() => {\n    instanceRef.current?.${facts.rootState.dirty.setter}(${dirty});\n  }, [${dirty}]);\n\n  useIsomorphicLayoutEffect(() => {\n    instanceRef.current?.${facts.rootState.disabled.setter}(${disabled});\n  }, [${disabled}]);\n\n  useIsomorphicLayoutEffect(() => {\n    instanceRef.current?.${facts.rootState.invalid.setter}(${invalid});\n  }, [${invalid}]);\n\n  useIsomorphicLayoutEffect(() => {\n    instanceRef.current?.${facts.rootState.name.setter}(${name});\n  }, [${name}]);\n\n  useIsomorphicLayoutEffect(() => {\n    instanceRef.current?.${facts.rootState.touched.setter}(${touched});\n  }, [${touched}]);\n\n  return (\n    <div\n      ${facts.attrs.root}\n      ${facts.attrs.dirty}={${dirty} ? "" : undefined}\n      ${facts.attrs.disabled}={${disabled} ? "" : undefined}\n      ${facts.formTiming.errorVisibility.attribute}={${facts.formTiming.errorVisibility.dataPropName} ?? ${errorVisibility}}\n      ${facts.attrs.invalid}={${invalid} ? "" : undefined}\n      ${facts.attrs.name}={${name}}\n      ${facts.formTiming.revalidationTiming.attribute}={${facts.formTiming.revalidationTiming.dataPropName} ?? ${revalidationTiming}}\n      ${facts.attrs.touched}={${touched} ? "" : undefined}\n      ${facts.formTiming.validationTiming.attribute}={${facts.formTiming.validationTiming.dataPropName} ?? ${validationTiming}}\n      ref={composedRef}\n      {...props}\n    >\n      {children}\n    </div>\n  );\n});\n\n${root}.displayName = "${facts.displayName}.${facts.parts.root.namespaceKey}";\n\nexport default ${root};\n\n${renderSetRefFunction()}`;
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

  return `import * as React from "react";\n\nexport type ${facts.message.matchType} =\n${renderFormControlCompositionMatchUnion(facts.message.matchValues)};\n\nexport type ${facts.message.error.messageSource.typeName} = ${facts.message.error.messageSource.prop.type};\n\nexport type ${error}Props = React.ComponentPropsWithoutRef<"div"> & {\n  ${match}?: ${facts.message.matchType};\n  ${messageSource}?: ${facts.message.error.messageSource.typeName};\n};\n\nconst ${error} = React.forwardRef<HTMLDivElement, ${error}Props>(function ${error}(\n  {\n    children,\n    hidden = ${facts.message.error.hiddenDefault},\n    ${match} = ${facts.message.error.matchDefault},\n    ${messageSource},\n    ...props\n  },\n  ref,\n) {\n  const serializedMatch = typeof ${match} === "boolean" ? String(${match}) : ${match};\n\n  return (\n    <div\n      ${facts.attrs.error}\n      ${facts.message.error.matchAttribute}={serializedMatch}\n      ${facts.message.error.messageSource.attribute}={${messageSource}}\n      hidden={hidden}\n      ref={ref}\n      {...props}\n    >\n      {children}\n    </div>\n  );\n});\n\n${error}.displayName = "${facts.displayName}.${facts.parts.error.namespaceKey}";\n\nexport default ${error};\n`;
}

function printReactFormControlCompositionValidity(
  facts: AdapterFormControlCompositionFacts,
): string {
  const validity = facts.exports.validity;
  const match = facts.message.validity.matchProp.name;

  return `import * as React from "react";\n\nexport type ${facts.message.matchType} =\n${renderFormControlCompositionMatchUnion(facts.message.matchValues)};\n\nexport type ${validity}Props = React.ComponentPropsWithoutRef<"div"> & {\n  ${match}?: ${facts.message.matchType};\n};\n\nconst ${validity} = React.forwardRef<HTMLDivElement, ${validity}Props>(function ${validity}(\n  { children, hidden = ${facts.message.validity.hiddenDefault}, ${match} = ${facts.message.validity.matchDefault}, ...props },\n  ref,\n) {\n  const serializedMatch = typeof ${match} === "boolean" ? String(${match}) : ${match};\n\n  return (\n    <div ${facts.attrs.validity} ${facts.message.validity.matchAttribute}={serializedMatch} hidden={hidden} ref={ref} {...props}>\n      {children}\n    </div>\n  );\n});\n\n${validity}.displayName = "${facts.displayName}.${facts.parts.validity.namespaceKey}";\n\nexport default ${validity};\n`;
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
    return printReactNativeOverlaySimplePart(facts, facts.parts.portal, facts.attrs.portal);
  }
  if (family.part === "viewport" && facts.parts.viewport) {
    return printReactNativeOverlaySimplePart(facts, facts.parts.viewport, facts.attrs.viewport);
  }

  throw new Error(`${facts.displayName} native-overlay adapter cannot print ${family.part}.`);
}

function printReactNativeOverlayRoot(facts: AdapterNativeOverlayFacts): string {
  const part = facts.parts.root;
  const rootExportName = facts.exports.root;
  const openEvent = facts.events.openChange;
  const closeCompleteEvent = facts.events.closeComplete;
  const forwardRefDeclaration = `const ${rootExportName} = React.forwardRef<HTMLDivElement, ${rootExportName}Props>(function ${rootExportName}(`;
  const shouldWrapForwardRef = forwardRefDeclaration.length > 100;
  const runtimeImports = shouldWrapForwardRef
    ? [
        `  type ${closeCompleteEvent.detailsType},`,
        `  type ${openEvent.detailsType},`,
        `  ${facts.runtime.factory},`,
      ]
    : [
        `  ${facts.runtime.factory},`,
        `  type ${closeCompleteEvent.detailsType},`,
        `  type ${openEvent.detailsType},`,
      ];
  const contents = `import {\n${runtimeImports.join("\n")}\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport type ${rootExportName}Props = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> & {\n  ${facts.props.defaultOpen.name}?: ${facts.props.defaultOpen.type};\n  ${facts.props.open.name}?: ${facts.props.open.type};\n  ${facts.props.closeOnEscape.name}?: ${facts.props.closeOnEscape.type};\n  ${facts.props.closeOnOutsideInteract.name}?: ${facts.props.closeOnOutsideInteract.type};\n  ${facts.props.modal.name}?: ${facts.props.modal.type};\n  ${closeCompleteEvent.callbackProp}?: (details: ${closeCompleteEvent.detailsType}) => void;\n  ${openEvent.callbackProp}?: (${openEvent.valueProperty}: boolean, details: ${openEvent.detailsType}) => void;\n};\n\n${forwardRefDeclaration}\n  {\n    ${facts.props.defaultOpen.name} = ${facts.props.defaultOpen.defaultValue},\n    ${facts.props.open.name},\n    ${facts.props.closeOnEscape.name} = ${facts.props.closeOnEscape.defaultValue},\n    ${facts.props.closeOnOutsideInteract.name} = ${facts.props.closeOnOutsideInteract.defaultValue},\n    ${facts.props.modal.name} = ${facts.props.modal.defaultValue},\n    ${closeCompleteEvent.callbackProp},\n    ${openEvent.callbackProp},\n    ...props\n  },\n  forwardedRef,\n) {\n  const rootRef = React.useRef<HTMLDivElement>(null);\n  const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n  const onCloseCompleteRef = React.useRef(${closeCompleteEvent.callbackProp});\n  const onOpenChangeRef = React.useRef(${openEvent.callbackProp});\n  const openRef = React.useRef(${facts.props.open.name});\n  const ${facts.props.defaultOpen.name}Ref = React.useRef(${facts.props.defaultOpen.name});\n  const [uncontrolledOpen, setUncontrolledOpenState] = React.useState(${facts.props.defaultOpen.name}Ref.current);\n  const uncontrolledOpenRef = React.useRef(uncontrolledOpen);\n\n  const setUncontrolledOpen = React.useCallback((nextOpen: boolean) => {\n    uncontrolledOpenRef.current = nextOpen;\n    setUncontrolledOpenState(nextOpen);\n  }, []);\n\n  React.useEffect(() => {\n    onCloseCompleteRef.current = ${closeCompleteEvent.callbackProp};\n  }, [${closeCompleteEvent.callbackProp}]);\n\n  React.useEffect(() => {\n    onOpenChangeRef.current = ${openEvent.callbackProp};\n  }, [${openEvent.callbackProp}]);\n\n  React.useEffect(() => {\n    openRef.current = ${facts.props.open.name};\n  }, [${facts.props.open.name}]);\n\n  const composedRef = React.useCallback(\n    (node: HTMLDivElement | null) => {\n      rootRef.current = node;\n      setRef(forwardedRef, node);\n    },\n    [forwardedRef],\n  );\n\n  React.useEffect(() => {\n    const root = rootRef.current;\n    if (!root) return;\n\n    const instance = ${facts.runtime.factory}(root, {\n      ${facts.props.defaultOpen.name}: uncontrolledOpenRef.current,\n      ${facts.props.closeOnEscape.name},\n      ${facts.props.closeOnOutsideInteract.name},\n      ${facts.props.modal.name},\n      ${closeCompleteEvent.callbackProp}: (details) => {\n        onCloseCompleteRef.current?.(details);\n      },\n      ${openEvent.callbackProp}: (nextOpen, details) => {\n        onOpenChangeRef.current?.(nextOpen, details);\n        if (details.isCanceled) return;\n\n        if (openRef.current === undefined) {\n          setUncontrolledOpen(nextOpen);\n        }\n      },\n      ...(openRef.current !== undefined ? { ${facts.props.open.name}: openRef.current } : {}),\n    });\n    instanceRef.current = instance;\n\n    return () => {\n      instance.destroy();\n      if (instanceRef.current === instance) {\n        instanceRef.current = undefined;\n      }\n    };\n  }, [${facts.props.closeOnEscape.name}, ${facts.props.closeOnOutsideInteract.name}, ${facts.props.modal.name}]);\n\n  React.useEffect(() => {\n    if (${facts.props.open.name} === undefined) return;\n    const instance = instanceRef.current;\n    if (!instance) return;\n    if (instance.${facts.state.getter}() === ${facts.props.open.name}) return;\n\n    instance.${facts.setter.method}(${facts.props.open.name}, ${formatOptions(facts.setter.options)});\n  }, [${facts.props.open.name}]);\n\n  const renderedOpen = ${facts.props.open.name} ?? uncontrolledOpen;\n\n  return (\n    <${part.defaultElement}\n      ${facts.attrs.root}\n      ${facts.attrs.defaultOpen}={${facts.props.defaultOpen.name}Ref.current ? "true" : undefined}\n      ${facts.attrs.closeOnEscape}={${facts.props.closeOnEscape.name} ? "true" : "false"}\n      ${facts.attrs.closeOnOutsideInteract}={${facts.props.closeOnOutsideInteract.name} ? "true" : "false"}\n      ${facts.attrs.modal}={${facts.props.modal.name} ? "true" : "false"}\n      ${facts.attrs.rootState}={renderedOpen ? "open" : "closed"}\n      ref={composedRef}\n      {...props}\n    />\n  );\n});\n\n${rootExportName}.displayName = "${facts.displayName}.Root";\n\nexport default ${rootExportName};\n\n${renderSetRefFunction()}`;

  return shouldWrapForwardRef
    ? wrapReactForwardRefFunction(contents, forwardRefDeclaration, rootExportName)
    : contents;
}

function printReactNativeOverlayTrigger(facts: AdapterNativeOverlayFacts): string {
  const part = facts.parts.trigger;
  const exportName = facts.exports.trigger;

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${facts.props.targetId.name}?: ${facts.props.targetId.type};\n};\n\nconst ${exportName} = React.forwardRef<HTMLButtonElement, ${exportName}Props>(\n  function ${exportName}({ ${facts.props.targetId.name}, ...props }, forwardedRef) {\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.triggerType}="button"\n        ${facts.attrs.trigger}\n        ${facts.attrs.triggerAriaHaspopup}="dialog"\n        ${facts.attrs.targetId}={${facts.props.targetId.name}}\n        ${facts.attrs.triggerState}="closed"\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.Trigger";\n\nexport default ${exportName};\n`;
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

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.ButtonHTMLAttributes<HTMLButtonElement>;\n\nconst ${exportName} = React.forwardRef<HTMLButtonElement, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${facts.attrs.closeType}="button" ${facts.attrs.close} ref={forwardedRef} {...props} />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.Close";\n\nexport default ${exportName};\n`;
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

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exportNames}\n};\n\nexport default ${facts.exports.namespace};\n\n${exportPrinter.printRuntimeTypeReExport({ names: facts.index.typeExports, source: facts.runtime.typeImportSource })}\n`;
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
    return printReactPresenceFloatingOverlaySimplePart(
      facts,
      facts.parts.portal,
      facts.exports.portal,
      facts.attrs.portal,
    );
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

function printReactPresenceFloatingOverlayRoot(facts: AdapterPresenceFloatingOverlayFacts): string {
  return `import {\n  ${facts.runtime.factory},\n  type ${facts.events.closeComplete.detailsType},\n  type ${facts.events.openChange.detailsType},\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport type ${facts.exports.root}Props = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> & {\n  ${facts.props.defaultOpen.name}?: ${facts.props.defaultOpen.type};\n  ${facts.props.open.name}?: ${facts.props.open.type};\n  ${facts.props.closeOnEscape.name}?: ${facts.props.closeOnEscape.type};\n  ${facts.props.closeOnOutsideInteract.name}?: ${facts.props.closeOnOutsideInteract.type};\n  ${facts.props.modal.name}?: ${facts.props.modal.type};\n  ${facts.props.openOnHover.name}?: ${facts.props.openOnHover.type};\n  ${facts.props.closeDelay.name}?: ${facts.props.closeDelay.type};\n  ${facts.events.closeComplete.callbackProp}?: (details: ${facts.events.closeComplete.detailsType}) => void;\n  ${facts.events.openChange.callbackProp}?: (${facts.events.openChange.valueProperty}: boolean, details: ${facts.events.openChange.detailsType}) => void;\n};\n\nconst ${facts.exports.root} = React.forwardRef<HTMLDivElement, ${facts.exports.root}Props>(function ${facts.exports.root}(\n  {\n    ${facts.props.defaultOpen.name} = ${facts.props.defaultOpen.defaultValue},\n    ${facts.props.open.name},\n    ${facts.props.closeOnEscape.name} = ${facts.props.closeOnEscape.defaultValue},\n    ${facts.props.closeOnOutsideInteract.name} = ${facts.props.closeOnOutsideInteract.defaultValue},\n    ${facts.props.modal.name} = ${facts.props.modal.defaultValue},\n    ${facts.props.openOnHover.name} = ${facts.props.openOnHover.defaultValue},\n    ${facts.props.closeDelay.name} = ${facts.props.closeDelay.defaultValue},\n    ${facts.events.closeComplete.callbackProp},\n    ${facts.events.openChange.callbackProp},\n    ...props\n  },\n  forwardedRef,\n) {\n  const rootRef = React.useRef<HTMLDivElement>(null);\n  const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n  const onCloseCompleteRef = React.useRef(${facts.events.closeComplete.callbackProp});\n  const onOpenChangeRef = React.useRef(${facts.events.openChange.callbackProp});\n  const openRef = React.useRef(${facts.props.open.name});\n  const ${facts.props.defaultOpen.name}Ref = React.useRef(${facts.props.defaultOpen.name});\n  const [uncontrolledOpen, setUncontrolledOpenState] = React.useState(${facts.props.defaultOpen.name}Ref.current);\n  const uncontrolledOpenRef = React.useRef(uncontrolledOpen);\n\n  const setUncontrolledOpen = React.useCallback((nextOpen: boolean) => {\n    uncontrolledOpenRef.current = nextOpen;\n    setUncontrolledOpenState(nextOpen);\n  }, []);\n\n  React.useEffect(() => {\n    onCloseCompleteRef.current = ${facts.events.closeComplete.callbackProp};\n  }, [${facts.events.closeComplete.callbackProp}]);\n\n  React.useEffect(() => {\n    onOpenChangeRef.current = ${facts.events.openChange.callbackProp};\n  }, [${facts.events.openChange.callbackProp}]);\n\n  React.useEffect(() => {\n    openRef.current = ${facts.props.open.name};\n  }, [${facts.props.open.name}]);\n\n  const composedRef = React.useCallback(\n    (node: HTMLDivElement | null) => {\n      rootRef.current = node;\n      setRef(forwardedRef, node);\n    },\n    [forwardedRef],\n  );\n\n  React.useEffect(() => {\n    const root = rootRef.current;\n    if (!root) return;\n\n    const instance = ${facts.runtime.factory}(root, {\n      ${facts.props.defaultOpen.name}: uncontrolledOpenRef.current,\n      ${facts.props.closeOnEscape.name},\n      ${facts.props.closeOnOutsideInteract.name},\n      ${facts.props.modal.name},\n      ${facts.props.openOnHover.name},\n      ${facts.events.closeComplete.callbackProp}: (details) => {\n        onCloseCompleteRef.current?.(details);\n      },\n      ${facts.events.openChange.callbackProp}: (nextOpen, details) => {\n        onOpenChangeRef.current?.(nextOpen, details);\n        if (details.isCanceled) return;\n\n        if (openRef.current === undefined) {\n          setUncontrolledOpen(nextOpen);\n        }\n      },\n      ...(openRef.current !== undefined ? { ${facts.props.open.name}: openRef.current } : {}),\n    });\n    instanceRef.current = instance;\n\n    return () => {\n      instance.destroy();\n      if (instanceRef.current === instance) {\n        instanceRef.current = undefined;\n      }\n    };\n  }, [${facts.props.closeOnEscape.name}, ${facts.props.closeOnOutsideInteract.name}, ${facts.props.modal.name}, ${facts.props.openOnHover.name}]);\n\n  React.useEffect(() => {\n    if (${facts.props.open.name} === undefined) return;\n    const instance = instanceRef.current;\n    if (!instance) return;\n    if (instance.${facts.state.getter}() === ${facts.props.open.name}) return;\n\n    instance.${facts.setter.method}(${facts.props.open.name}, ${formatOptions(facts.setter.options)});\n  }, [${facts.props.open.name}]);\n\n  const renderedOpen = ${facts.props.open.name} ?? uncontrolledOpen;\n\n  return (\n    <${facts.parts.root.defaultElement}\n      ${facts.attrs.root}\n      ${facts.attrs.rootDefaultOpen}={${facts.props.defaultOpen.name}Ref.current ? "true" : undefined}\n      ${facts.attrs.rootCloseOnEscape}={${facts.props.closeOnEscape.name} ? "true" : "false"}\n      ${facts.attrs.rootCloseOnOutsideInteract}={${facts.props.closeOnOutsideInteract.name} ? "true" : "false"}\n      ${facts.attrs.rootModal}={${facts.props.modal.name} ? "true" : "false"}\n      ${facts.attrs.rootOpenOnHover}={${facts.props.openOnHover.name} ? "true" : undefined}\n      ${facts.attrs.rootCloseDelay}={${facts.props.closeDelay.name}}\n      ${facts.attrs.rootState}={renderedOpen ? "open" : "closed"}\n      ref={composedRef}\n      {...props}\n    />\n  );\n});\n\n${facts.exports.root}.displayName = "${facts.displayName}.Root";\n\nexport default ${facts.exports.root};\n\n${renderSetRefFunction()}`;
}

function printReactPresenceFloatingOverlayTrigger(
  facts: AdapterPresenceFloatingOverlayFacts,
): string {
  return `import * as React from "react";\n${renderReactAsChildImports("multiline")}\n\nexport type ${facts.exports.trigger}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${facts.props.asChild.name}?: ${facts.props.asChild.type};\n};\n\nconst ${facts.exports.trigger} = React.forwardRef<HTMLElement, ${facts.exports.trigger}Props>(function ${facts.exports.trigger}(\n  { ${facts.props.asChild.name} = false, children, className, ...props },\n  forwardedRef,\n) {\n  const protectedTriggerProps = {\n    ${JSON.stringify(facts.attrs.trigger)}: "",\n    ${JSON.stringify(facts.attrs.triggerAriaHaspopup)}: "dialog",\n    ${JSON.stringify(facts.attrs.triggerAriaExpanded)}: "false",\n    "${facts.attrs.triggerState}": "closed",\n  } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n  const triggerProps = {\n    ...protectedTriggerProps,\n    ...props,\n  } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n\n${renderReactAsChildSetup("  ")}\n\n${renderReactAsChildCloneBranch(
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
  const jsx = `<${facts.parts.backdrop.defaultElement} ${facts.attrs.backdrop} ${facts.attrs.backdropState}="closed" ${facts.attrs.backdropHidden} ref={forwardedRef} {...props} />`;

  return `import * as React from "react";\n\nexport type ${facts.exports.backdrop}Props = React.HTMLAttributes<HTMLDivElement>;\n\nconst ${facts.exports.backdrop} = React.forwardRef<HTMLDivElement, ${facts.exports.backdrop}Props>(\n  function ${facts.exports.backdrop}(props, forwardedRef) {\n    return (\n      ${jsx}\n    );\n  },\n);\n\n${facts.exports.backdrop}.displayName = "${facts.displayName}.Backdrop";\n\nexport default ${facts.exports.backdrop};\n`;
}

function printReactPresenceFloatingOverlayTitle(
  facts: AdapterPresenceFloatingOverlayFacts,
): string {
  return `import * as React from "react";\n\nexport type ${facts.exports.title}Props = React.HTMLAttributes<HTMLHeadingElement>;\n\nconst ${facts.exports.title} = React.forwardRef<HTMLHeadingElement, ${facts.exports.title}Props>(\n  function ${facts.exports.title}(props, forwardedRef) {\n    return <${facts.parts.title.defaultElement} ${facts.attrs.title} ref={forwardedRef} {...props} />;\n  },\n);\n\n${facts.exports.title}.displayName = "${facts.displayName}.Title";\n\nexport default ${facts.exports.title};\n`;
}

function printReactPresenceFloatingOverlayDescription(
  facts: AdapterPresenceFloatingOverlayFacts,
): string {
  return `import * as React from "react";\n\nexport type ${facts.exports.description}Props = React.HTMLAttributes<HTMLParagraphElement>;\n\nconst ${facts.exports.description} = React.forwardRef<HTMLParagraphElement, ${facts.exports.description}Props>(\n  function ${facts.exports.description}(props, forwardedRef) {\n    return <${facts.parts.description.defaultElement} ${facts.attrs.description} ref={forwardedRef} {...props} />;\n  },\n);\n\n${facts.exports.description}.displayName = "${facts.displayName}.Description";\n\nexport default ${facts.exports.description};\n`;
}

function printReactPresenceFloatingOverlayClose(
  facts: AdapterPresenceFloatingOverlayFacts,
): string {
  return `import * as React from "react";\n\nexport type ${facts.exports.close}Props = React.ButtonHTMLAttributes<HTMLButtonElement>;\n\nconst ${facts.exports.close} = React.forwardRef<HTMLButtonElement, ${facts.exports.close}Props>(\n  function ${facts.exports.close}(props, forwardedRef) {\n    return <${facts.parts.close.defaultElement} ${facts.attrs.closeType}="button" ${facts.attrs.close} ref={forwardedRef} {...props} />;\n  },\n);\n\n${facts.exports.close}.displayName = "${facts.displayName}.Close";\n\nexport default ${facts.exports.close};\n`;
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
    return printReactTimedFloatingOverlaySimplePart(
      facts,
      facts.parts.portal,
      facts.exports.portal,
      facts.attrs.portal,
    );
  }
  if (family.part === "arrow") return printReactTimedFloatingOverlayArrow(facts);
  if (family.part === "backdrop") return printReactTimedFloatingOverlayBackdrop(facts);
  if (family.part === "viewport") return printReactTimedFloatingOverlayViewport(facts);

  throw new Error(
    `${facts.displayName} timed-floating-overlay adapter cannot print ${family.part}.`,
  );
}

function printReactTimedFloatingOverlayRoot(facts: AdapterTimedFloatingOverlayFacts): string {
  const setterOptions = formatOptions(facts.setters.open.options);
  const disabledPropType = facts.root.disabled
    ? `  ${facts.props.disabled.name}?: ${facts.props.disabled.type};\n`
    : "";
  const disabledDestructure = facts.root.disabled
    ? `      ${facts.props.disabled.name} = ${facts.props.disabled.defaultValue},\n`
    : "";
  const disabledOption = facts.root.disabled ? `        ${facts.props.disabled.name},\n` : "";
  const disabledDependency = "";
  const disabledSyncEffect = facts.root.disabled
    ? `\n    React.useEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.${facts.setters.disabled.method}(${facts.props.disabled.name});\n      if (${facts.props.disabled.name} && ${facts.props.open.name}Ref.current === undefined) {\n        setUncontrolledOpen(false);\n      }\n    }, [${facts.props.disabled.name}, setUncontrolledOpen]);\n`
    : "";
  const openEffectDependencies = facts.root.disabled
    ? `${facts.props.disabled.name}, ${facts.props.open.name}`
    : facts.props.open.name;
  const renderedOpenExpression = facts.root.disabled
    ? `!${facts.props.disabled.name} && (${facts.props.open.name} ?? uncontrolledOpen)`
    : `${facts.props.open.name} ?? uncontrolledOpen`;
  const rootDisabledAttribute =
    facts.root.disabled && facts.attrs.rootDisabled
      ? `        ${facts.attrs.rootDisabled}={${facts.props.disabled.name} ? "" : undefined}\n`
      : "";

  return `import { ${facts.runtime.factory}, type ${facts.event.detailsType} } from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport type ${facts.exports.root}Props = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> & {\n  ${facts.props.defaultOpen.name}?: ${facts.props.defaultOpen.type};\n  ${facts.props.open.name}?: ${facts.props.open.type};\n  ${facts.props.closeDelay.name}?: ${facts.props.closeDelay.type};\n  ${facts.props.closeOnEscape.name}?: ${facts.props.closeOnEscape.type};\n  ${facts.props.closeOnOutsideInteract.name}?: ${facts.props.closeOnOutsideInteract.type};\n${disabledPropType}  ${facts.props.disableHoverableContent.name}?: ${facts.props.disableHoverableContent.type};\n  ${facts.props.openDelay.name}?: ${facts.props.openDelay.type};\n  ${facts.event.callbackProp}?: (${facts.event.valueProperty}: ${facts.event.valueType}, details: ${facts.event.detailsType}) => void;\n};\n\nconst ${facts.exports.root} = React.forwardRef<HTMLDivElement, ${facts.exports.root}Props>(\n  function ${facts.exports.root}(\n    {\n      ${facts.props.defaultOpen.name} = ${facts.props.defaultOpen.defaultValue},\n      ${facts.props.open.name},\n      ${facts.props.closeDelay.name} = ${facts.props.closeDelay.defaultValue},\n      ${facts.props.closeOnEscape.name} = ${facts.props.closeOnEscape.defaultValue},\n      ${facts.props.closeOnOutsideInteract.name} = ${facts.props.closeOnOutsideInteract.defaultValue},\n${disabledDestructure}      ${facts.props.disableHoverableContent.name} = ${facts.props.disableHoverableContent.defaultValue},\n      ${facts.props.openDelay.name} = ${facts.props.openDelay.defaultValue},\n      ${facts.event.callbackProp},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const rootRef = React.useRef<HTMLDivElement>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const ${facts.event.callbackProp}Ref = React.useRef(${facts.event.callbackProp});\n    const ${facts.props.open.name}Ref = React.useRef(${facts.props.open.name});\n    const ${facts.props.defaultOpen.name}Ref = React.useRef(${facts.props.defaultOpen.name});\n    const [uncontrolledOpen, setUncontrolledOpenState] = React.useState(${facts.props.defaultOpen.name}Ref.current);\n    const uncontrolledOpenRef = React.useRef(uncontrolledOpen);\n\n    const setUncontrolledOpen = React.useCallback((nextOpen: ${facts.state.valueType}) => {\n      uncontrolledOpenRef.current = nextOpen;\n      setUncontrolledOpenState(nextOpen);\n    }, []);\n\n    React.useEffect(() => {\n      ${facts.event.callbackProp}Ref.current = ${facts.event.callbackProp};\n    }, [${facts.event.callbackProp}]);\n\n    React.useEffect(() => {\n      ${facts.props.open.name}Ref.current = ${facts.props.open.name};\n    }, [${facts.props.open.name}]);\n\n    const composedRef = React.useCallback(\n      (node: HTMLDivElement | null) => {\n        rootRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    React.useEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root, {\n        ${facts.props.defaultOpen.name}: uncontrolledOpenRef.current,\n        ${facts.props.closeDelay.name},\n        ${facts.props.closeOnEscape.name},\n        ${facts.props.closeOnOutsideInteract.name},\n${disabledOption}        ${facts.props.disableHoverableContent.name},\n        ${facts.props.openDelay.name},\n        ${facts.event.callbackProp}: (nextOpen, details) => {\n          ${facts.event.callbackProp}Ref.current?.(nextOpen, details);\n          if (details.isCanceled) return;\n\n          if (${facts.props.open.name}Ref.current === undefined) {\n            setUncontrolledOpen(nextOpen);\n          }\n        },\n        ...(${facts.props.open.name}Ref.current !== undefined ? { ${facts.props.open.name}: ${facts.props.open.name}Ref.current } : {}),\n      });\n      instanceRef.current = instance;\n\n      return () => {\n        instance.destroy();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, [\n      ${facts.props.closeDelay.name},\n      ${facts.props.closeOnEscape.name},\n      ${facts.props.closeOnOutsideInteract.name},\n${disabledDependency}      ${facts.props.disableHoverableContent.name},\n      ${facts.props.openDelay.name},\n    ]);\n${disabledSyncEffect}\n    React.useEffect(() => {\n      if (${facts.props.open.name} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n      if (instance.${facts.state.getter}() === ${facts.props.open.name}) return;\n\n      instance.${facts.setters.open.method}(${facts.props.open.name}, ${setterOptions});\n    }, [${openEffectDependencies}]);\n\n    const renderedOpen = ${renderedOpenExpression};\n\n    return (\n      <${facts.parts.root.defaultElement}\n        ${facts.attrs.root}\n        ${facts.attrs.rootDefaultOpen}={${facts.props.defaultOpen.name}Ref.current ? "true" : undefined}\n        ${facts.attrs.rootCloseDelay}={${facts.props.closeDelay.name}}\n        ${facts.attrs.rootCloseOnEscape}={${facts.props.closeOnEscape.name} ? "true" : "false"}\n        ${facts.attrs.rootCloseOnOutsideInteract}={${facts.props.closeOnOutsideInteract.name} ? "true" : "false"}\n        ${facts.attrs.rootContentHoverable}={!${facts.props.disableHoverableContent.name} ? "true" : "false"}\n${rootDisabledAttribute}        ${facts.attrs.rootOpenDelay}={${facts.props.openDelay.name}}\n        ${facts.attrs.rootState}={renderedOpen ? "open" : "closed"}\n        ref={composedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${facts.exports.root}.displayName = "${facts.displayName}.Root";\n\nexport default ${facts.exports.root};\n\n${renderSetRefFunction()}`;
}

function printReactTimedFloatingOverlayTrigger(facts: AdapterTimedFloatingOverlayFacts): string {
  if (facts.trigger.triggerKind === "anchor") {
    return printReactTimedFloatingOverlayAnchorTrigger(facts);
  }

  return `import * as React from "react";\n${renderReactAsChildImports()}\n\nexport type ${facts.exports.trigger}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${facts.props.asChild.name}?: ${facts.props.asChild.type};\n};\n\nconst ${facts.exports.trigger} = React.forwardRef<HTMLElement, ${facts.exports.trigger}Props>(\n  function ${facts.exports.trigger}(\n    { ${facts.props.asChild.name} = false, children, className, ${facts.props.disabled.name} = false, ...props },\n    forwardedRef,\n  ) {\n    const protectedTriggerProps = {\n      "${facts.attrs.trigger}": "",\n      "${facts.attrs.triggerDisabled}": ${facts.props.disabled.name} ? "" : undefined,\n      "${facts.attrs.triggerAriaDisabled}": ${facts.props.disabled.name} ? "true" : undefined,\n      "${facts.attrs.triggerState}": "closed",\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string | undefined>;\n    const triggerProps = {\n      ...protectedTriggerProps,\n      ...props,\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string | undefined>;\n\n${renderReactAsChildSetup("    ")}\n\n${renderReactAsChildCloneBranch(
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

  return `import * as React from "react";\n${renderReactAsChildImports()}\n\nexport type ${facts.exports.trigger}Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "disabled"> & {\n  ${facts.props.asChild.name}?: ${facts.props.asChild.type};\n  ${facts.props.closeDelay.name}?: ${facts.props.closeDelay.type};\n  ${facts.props.disabled.name}?: ${facts.props.disabled.type};\n  ${facts.props.openDelay.name}?: ${facts.props.openDelay.type};\n};\n\nconst ${facts.exports.trigger} = React.forwardRef<HTMLElement, ${facts.exports.trigger}Props>(\n  function ${facts.exports.trigger}(\n    {\n      ${facts.props.asChild.name} = false,\n      children,\n      className,\n      ${facts.props.closeDelay.name},\n      ${facts.props.disabled.name} = ${facts.props.disabled.defaultValue},\n      href,\n      onClick,\n      ${facts.props.openDelay.name},\n      tabIndex,\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const handleClick = React.useCallback<React.MouseEventHandler<HTMLElement>>(\n      (event) => {\n        if (${facts.props.disabled.name}) {\n          event.preventDefault();\n          event.stopPropagation();\n          return;\n        }\n\n        onClick?.(event as React.MouseEvent<HTMLAnchorElement>);\n      },\n      [${facts.props.disabled.name}, onClick],\n    );\n\n    const protectedTriggerProps = {\n      "${facts.attrs.trigger}": "",\n      "${closeDelayAttribute}": ${facts.props.closeDelay.name},\n      "${facts.attrs.triggerDisabled}": ${facts.props.disabled.name} ? "" : undefined,\n      "${openDelayAttribute}": ${facts.props.openDelay.name},\n      "${facts.attrs.triggerAriaDisabled}": ${facts.props.disabled.name} ? "true" : undefined,\n      "${facts.attrs.triggerState}": "closed",\n      ...(${facts.props.disabled.name} ? { href: undefined, tabIndex: -1 } : {}),\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<string, unknown>;\n    const triggerProps = {\n      ...props,\n      ...protectedTriggerProps,\n      href: ${facts.props.disabled.name} ? undefined : href,\n      tabIndex: ${facts.props.disabled.name} ? -1 : tabIndex,\n      onClick: handleClick,\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<string, unknown>;\n\n${renderReactAsChildSetup("    ")}\n\n${renderReactAsChildCloneBranch(
    {
      asChildExpression: facts.props.asChild.name,
      eventOrder: "parent-first",
      indent: "    ",
      protectedPropsExpression: "protectedTriggerProps",
      propsExpression: "triggerProps",
    },
  )}\n\n    return (\n      <${facts.trigger.renderedElement}\n        className={className}\n        href={${facts.props.disabled.name} ? undefined : href}\n        tabIndex={${facts.props.disabled.name} ? -1 : tabIndex}\n        ref={forwardedRef as React.Ref<HTMLAnchorElement>}\n        {...(triggerProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}\n      >\n        {children}\n      </${facts.trigger.renderedElement}>\n    );\n  },\n);\n\n${facts.exports.trigger}.displayName = "${facts.displayName}.Trigger";\n\nexport default ${facts.exports.trigger};\n`;
}

function printReactTimedFloatingOverlayArrow(facts: AdapterTimedFloatingOverlayFacts): string {
  return `import * as React from "react";\n\nexport type ${facts.exports.arrow}Props = React.HTMLAttributes<HTMLDivElement>;\n\nconst ${facts.exports.arrow} = React.forwardRef<HTMLDivElement, ${facts.exports.arrow}Props>(\n  function ${facts.exports.arrow}(props, forwardedRef) {\n    return <${facts.parts.arrow.defaultElement} ${facts.attrs.arrow} ${facts.attrs.arrowState}="closed" ref={forwardedRef} {...props} />;\n  },\n);\n\n${facts.exports.arrow}.displayName = "${facts.displayName}.Arrow";\n\nexport default ${facts.exports.arrow};\n`;
}

function printReactTimedFloatingOverlayBackdrop(facts: AdapterTimedFloatingOverlayFacts): string {
  const part = requireTimedFloatingPart(facts, "backdrop");
  const exportName = requireTimedFloatingString(
    facts.exports.backdrop,
    `${facts.displayName} timed-floating backdrop export.`,
  );
  const discoveryAttribute = requireTimedFloatingString(
    facts.attrs.backdrop,
    `${facts.displayName} timed-floating backdrop attribute.`,
  );
  const stateAttribute = requireTimedFloatingString(
    facts.attrs.backdropState,
    `${facts.displayName} timed-floating backdrop state attribute.`,
  );
  const hiddenAttribute = requireTimedFloatingString(
    facts.attrs.backdropHidden,
    `${facts.displayName} timed-floating backdrop hidden attribute.`,
  );

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<HTMLDivElement>;\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return (\n      <${part.defaultElement} ${discoveryAttribute} ${stateAttribute}="closed" ${hiddenAttribute} ref={forwardedRef} {...props} />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactTimedFloatingOverlayViewport(facts: AdapterTimedFloatingOverlayFacts): string {
  const part = requireTimedFloatingPart(facts, "viewport");
  const exportName = requireTimedFloatingString(
    facts.exports.viewport,
    `${facts.displayName} timed-floating viewport export.`,
  );
  const discoveryAttribute = requireTimedFloatingString(
    facts.attrs.viewport,
    `${facts.displayName} timed-floating viewport attribute.`,
  );
  const stateAttribute = requireTimedFloatingString(
    facts.attrs.viewportState,
    `${facts.displayName} timed-floating viewport state attribute.`,
  );

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<HTMLDivElement>;\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${discoveryAttribute} ${stateAttribute}="closed" ref={forwardedRef} {...props} />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
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
  const facts = family.facts;

  if (family.part === "provider") return printReactSidebarProvider(facts);
  if (family.part === "sidebar") return printReactSidebarRoot(facts);
  if (family.part === "trigger") return printReactSidebarTrigger(facts);
  if (family.part === "rail") return printReactSidebarRail(facts);
  if (family.part === "menuButton") return printReactSidebarMenuButton(facts);

  throw new Error(`${facts.displayName} sidebar adapter cannot print ${family.part}.`);
}

function printReactSidebarProvider(facts: AdapterSidebarFacts): string {
  const props = facts.props;

  return `import {\n  ${facts.runtime.factory},\n  type ${facts.types.mobileOpenDetails},\n  type ${facts.types.openDetails},\n  type ${facts.types.persistenceStorage},\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\nimport type { ${facts.context.typeName} } from "./${facts.context.name}";\nimport { ${facts.context.name} } from "./${facts.context.name}";\n\nexport type ${facts.exports.provider}Props = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> & {\n  ${props.defaultOpen.name}?: ${props.defaultOpen.type};\n  ${props.open.name}?: ${props.open.type};\n  ${facts.events.open.callbackProp}?: (${facts.events.open.valueProperty}: ${facts.events.open.valueType}, details: ${facts.types.openDetails}) => void;\n  ${props.defaultMobileOpen.name}?: ${props.defaultMobileOpen.type};\n  ${props.mobileOpen.name}?: ${props.mobileOpen.type};\n  ${facts.events.mobileOpen.callbackProp}?: (${facts.events.mobileOpen.valueProperty}: ${facts.events.mobileOpen.valueType}, details: ${facts.types.mobileOpenDetails}) => void;\n  ${props.keyboardShortcut.name}?: ${props.keyboardShortcut.type};\n  ${props.mobileQuery.name}?: ${props.mobileQuery.type};\n  ${props.persistOpen.name}?: ${props.persistOpen.type};\n  ${props.persistenceKey.name}?: ${props.persistenceKey.type};\n  ${props.persistenceStorage.name}?: ${facts.types.persistenceStorage};\n  ${props.persistenceMaxAge.name}?: ${props.persistenceMaxAge.type};\n};\n\nconst ${facts.exports.provider} = React.forwardRef<HTMLDivElement, ${facts.exports.provider}Props>(\n  function ${facts.exports.provider}(\n    {\n      ${props.defaultOpen.name} = ${props.defaultOpen.defaultValue},\n      ${props.open.name},\n      ${facts.events.open.callbackProp},\n      ${props.defaultMobileOpen.name} = ${props.defaultMobileOpen.defaultValue},\n      ${props.mobileOpen.name},\n      ${facts.events.mobileOpen.callbackProp},\n      ${props.keyboardShortcut.name} = ${props.keyboardShortcut.defaultValue},\n      ${props.mobileQuery.name} = ${props.mobileQuery.defaultValue},\n      ${props.persistOpen.name} = ${props.persistOpen.defaultValue},\n      ${props.persistenceKey.name},\n      ${props.persistenceStorage.name},\n      ${props.persistenceMaxAge.name} = ${props.persistenceMaxAge.defaultValue},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const providerRef = React.useRef<HTMLDivElement>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const ${props.open.name}Ref = React.useRef(${props.open.name});\n    const ${props.mobileOpen.name}Ref = React.useRef(${props.mobileOpen.name});\n    const ${facts.events.open.callbackProp}Ref = React.useRef(${facts.events.open.callbackProp});\n    const ${facts.events.mobileOpen.callbackProp}Ref = React.useRef(${facts.events.mobileOpen.callbackProp});\n    const ${props.defaultOpen.name}Ref = React.useRef(${props.defaultOpen.name});\n    const ${props.defaultMobileOpen.name}Ref = React.useRef(${props.defaultMobileOpen.name});\n    const [uncontrolledOpen, setUncontrolledOpenState] = React.useState(${props.defaultOpen.name}Ref.current);\n    const [uncontrolledMobileOpen, setUncontrolledMobileOpenState] = React.useState(${props.defaultMobileOpen.name}Ref.current);\n    const uncontrolledOpenRef = React.useRef(uncontrolledOpen);\n    const uncontrolledMobileOpenRef = React.useRef(uncontrolledMobileOpen);\n    const [isMobile, setIsMobile] = React.useState(false);\n\n    const setUncontrolledOpen = React.useCallback((nextOpen: boolean) => {\n      uncontrolledOpenRef.current = nextOpen;\n      setUncontrolledOpenState(nextOpen);\n    }, []);\n\n    const setUncontrolledMobileOpen = React.useCallback((nextOpen: boolean) => {\n      uncontrolledMobileOpenRef.current = nextOpen;\n      setUncontrolledMobileOpenState(nextOpen);\n    }, []);\n\n    useIsomorphicLayoutEffect(() => {\n      ${props.open.name}Ref.current = ${props.open.name};\n    }, [${props.open.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${props.mobileOpen.name}Ref.current = ${props.mobileOpen.name};\n    }, [${props.mobileOpen.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.events.open.callbackProp}Ref.current = ${facts.events.open.callbackProp};\n    }, [${facts.events.open.callbackProp}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.events.mobileOpen.callbackProp}Ref.current = ${facts.events.mobileOpen.callbackProp};\n    }, [${facts.events.mobileOpen.callbackProp}]);\n\n    useIsomorphicLayoutEffect(() => {\n      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;\n\n      const mediaQueryList = window.matchMedia(${props.mobileQuery.name});\n      const syncIsMobile = () => setIsMobile(mediaQueryList.matches);\n      syncIsMobile();\n      mediaQueryList.addEventListener?.("change", syncIsMobile);\n      mediaQueryList.addListener?.(syncIsMobile);\n\n      return () => {\n        mediaQueryList.removeEventListener?.("change", syncIsMobile);\n        mediaQueryList.removeListener?.(syncIsMobile);\n      };\n    }, [${props.mobileQuery.name}]);\n\n    const composedRef = React.useCallback((node: HTMLDivElement | null) => {\n      providerRef.current = node;\n      setRef(forwardedRef, node);\n    }, [forwardedRef]);\n\n    useIsomorphicLayoutEffect(() => {\n      const provider = providerRef.current;\n      if (!provider) return;\n\n      const instance = ${facts.runtime.factory}(provider, {\n        ${props.defaultOpen.name}: uncontrolledOpenRef.current,\n        ${props.defaultMobileOpen.name}: uncontrolledMobileOpenRef.current,\n        ${props.keyboardShortcut.name},\n        ${props.mobileQuery.name},\n        ${props.persistOpen.name},\n        ${props.persistenceKey.name},\n        ${props.persistenceStorage.name},\n        ${props.persistenceMaxAge.name},\n        ${facts.events.open.callbackProp}: (nextOpen, details) => {\n          ${facts.events.open.callbackProp}Ref.current?.(nextOpen, details);\n          if (${props.open.name}Ref.current === undefined) {\n            setUncontrolledOpen(nextOpen);\n          }\n        },\n        ${facts.events.mobileOpen.callbackProp}: (nextOpen, details) => {\n          ${facts.events.mobileOpen.callbackProp}Ref.current?.(nextOpen, details);\n          if (${props.mobileOpen.name}Ref.current === undefined) {\n            setUncontrolledMobileOpen(nextOpen);\n          }\n        },\n        ...(${props.open.name}Ref.current !== undefined ? { ${props.open.name}: ${props.open.name}Ref.current } : {}),\n        ...(${props.mobileOpen.name}Ref.current !== undefined ? { ${props.mobileOpen.name}: ${props.mobileOpen.name}Ref.current } : {}),\n      });\n      instanceRef.current = instance;\n\n      return () => {\n        instance.destroy();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, [\n      ${props.keyboardShortcut.name},\n      ${props.mobileQuery.name},\n      ${props.persistOpen.name},\n      ${props.persistenceKey.name},\n      ${props.persistenceStorage.name},\n      ${props.persistenceMaxAge.name},\n    ]);\n\n    useIsomorphicLayoutEffect(() => {\n      if (${props.open.name} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n      if (instance.${facts.state.open.getter}() === ${props.open.name}) return;\n\n      instance.${facts.state.open.setter}(${props.open.name}, ${formatOptions(facts.state.open.setterOptions)});\n    }, [${props.open.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      if (${props.mobileOpen.name} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n      if (instance.${facts.state.mobileOpen.getter}() === ${props.mobileOpen.name}) return;\n\n      instance.${facts.state.mobileOpen.setter}(${props.mobileOpen.name}, ${formatOptions(facts.state.mobileOpen.setterOptions)});\n    }, [${props.mobileOpen.name}]);\n\n    const renderedOpen = ${props.open.name} ?? uncontrolledOpen;\n    const renderedMobileOpen = ${props.mobileOpen.name} ?? uncontrolledMobileOpen;\n    const contextValue = React.useMemo<${facts.context.typeName}>(\n      () => ({\n        expanded: isMobile ? renderedMobileOpen : renderedOpen,\n        mobileOpen: renderedMobileOpen,\n        open: renderedOpen,\n        state: renderedOpen ? "expanded" : "collapsed",\n      }),\n      [isMobile, renderedMobileOpen, renderedOpen],\n    );\n    const providerAttributes = {\n      "${facts.attrs.provider}": "",\n      "${facts.attrs.defaultOpen}": ${props.defaultOpen.name}Ref.current ? "true" : undefined,\n      "${facts.attrs.defaultMobileOpen}": ${props.defaultMobileOpen.name}Ref.current ? "true" : undefined,\n      "${facts.attrs.providerState}": renderedOpen ? "expanded" : "collapsed",\n      "${facts.attrs.mobileOpen}": renderedMobileOpen ? "true" : "false",\n      "${facts.attrs.keyboardShortcut}": ${props.keyboardShortcut.name},\n      "${facts.attrs.mobileQuery}": ${props.mobileQuery.name},\n      "${facts.attrs.persistOpen}": ${props.persistOpen.name} ? "true" : undefined,\n      "${facts.attrs.persistenceKey}": ${props.persistenceKey.name},\n      "${facts.attrs.persistenceStorage}": typeof ${props.persistenceStorage.name} === "string" ? ${props.persistenceStorage.name} : ${props.persistenceStorage.name} === false ? "false" : undefined,\n      "${facts.attrs.persistenceMaxAge}": ${props.persistenceMaxAge.name},\n    } satisfies React.HTMLAttributes<HTMLDivElement> & Record<\`data-\${string}\`, string | number | undefined>;\n\n    return (\n      <${facts.context.name}.Provider value={contextValue}>\n        <${facts.parts.provider.defaultElement}\n          {...providerAttributes}\n          ref={composedRef}\n          {...props}\n        />\n      </${facts.context.name}.Provider>\n    );\n  },\n);\n\n${facts.exports.provider}.displayName = "${facts.exports.namespace}.Provider";\n\nexport default ${facts.exports.provider};\n\n${renderSetRefFunction()}`;
}

function printReactSidebarRoot(facts: AdapterSidebarFacts): string {
  const props = facts.props;

  return `import * as React from "react";\nimport { ${facts.context.hook} } from "./${facts.context.name}";\n\nexport type ${facts.exports.sidebar}ComponentProps = React.HTMLAttributes<HTMLDivElement> & {\n  ${props.side.name}?: ${props.side.type};\n  ${props.variant.name}?: ${props.variant.type};\n  ${props.collapsible.name}?: ${props.collapsible.type};\n};\n\nconst ${facts.exports.sidebar}Component = React.forwardRef<HTMLDivElement, ${facts.exports.sidebar}ComponentProps>(\n  function ${facts.exports.sidebar}Component({ ${props.side.name} = ${props.side.defaultValue}, ${props.variant.name} = ${props.variant.defaultValue}, ${props.collapsible.name} = ${props.collapsible.defaultValue}, ...props }, forwardedRef) {\n    const sidebarContext = ${facts.context.hook}();\n    const sidebarState = sidebarContext?.state ?? "expanded";\n\n    return (\n      <${facts.parts.sidebar.defaultElement}\n        ${facts.attrs.sidebar}\n        ${facts.attrs.sidebarState}={sidebarState}\n        ${facts.attrs.sidebarCollapsible}={sidebarState === "collapsed" ? ${props.collapsible.name} : ""}\n        ${facts.attrs.sidebarCollapsibleMode}={${props.collapsible.name}}\n        ${facts.attrs.sidebarVariant}={${props.variant.name}}\n        ${facts.attrs.sidebarSide}={${props.side.name}}\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${facts.exports.sidebar}Component.displayName = "${facts.exports.namespace}.Sidebar";\n\nexport default ${facts.exports.sidebar}Component;\n`;
}

function printReactSidebarTrigger(facts: AdapterSidebarFacts): string {
  const props = facts.props;

  return `import * as React from "react";\n${renderReactAsChildImports()}\nimport { ${facts.context.hook} } from "./${facts.context.name}";\n\nexport type ${facts.exports.trigger}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${props.asChild.name}?: ${props.asChild.type};\n};\n\nconst ${facts.exports.trigger} = React.forwardRef<HTMLElement, ${facts.exports.trigger}Props>(\n  function ${facts.exports.trigger}({ ${props.asChild.name} = ${props.asChild.defaultValue}, children, className, ...props }, forwardedRef) {\n    const sidebarContext = ${facts.context.hook}();\n    const protectedTriggerProps = {\n      ${JSON.stringify(facts.attrs.trigger)}: "",\n      "${facts.attrs.triggerExpanded}": sidebarContext?.expanded ?? false,\n      "${facts.attrs.triggerState}": sidebarContext?.state ?? "expanded",\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n    const triggerProps = {\n      ...protectedTriggerProps,\n      ...props,\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n\n${renderReactAsChildSetup("    ")}\n\n${renderReactAsChildCloneBranch(
    {
      asChildExpression: props.asChild.name,
      indent: "    ",
      protectedPropsExpression: "protectedTriggerProps",
      propsExpression: "triggerProps",
    },
  )}\n\n    return (\n      <${facts.parts.trigger.defaultElement}\n        ${facts.attrs.triggerType}="button"\n        className={className}\n        ref={forwardedRef as React.Ref<HTMLButtonElement>}\n        {...(triggerProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}\n      >\n        {children}\n      </${facts.parts.trigger.defaultElement}>\n    );\n  },\n);\n\n${facts.exports.trigger}.displayName = "${facts.exports.namespace}.Trigger";\n\nexport default ${facts.exports.trigger};\n`;
}

function printReactSidebarRail(facts: AdapterSidebarFacts): string {
  return `import * as React from "react";\nimport { ${facts.context.hook} } from "./${facts.context.name}";\n\nexport type ${facts.exports.rail}Props = React.ButtonHTMLAttributes<HTMLButtonElement>;\n\nconst ${facts.exports.rail} = React.forwardRef<HTMLButtonElement, ${facts.exports.rail}Props>(\n  function ${facts.exports.rail}(props, forwardedRef) {\n    const sidebarContext = ${facts.context.hook}();\n\n    return (\n      <${facts.parts.rail.defaultElement}\n        ${facts.attrs.railType}="button"\n        ${facts.attrs.rail}\n        ${facts.attrs.railExpanded}={sidebarContext?.expanded ?? false}\n        ${facts.attrs.railState}={sidebarContext?.state ?? "expanded"}\n        tabIndex={${facts.rail.tabIndexValue}}\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${facts.exports.rail}.displayName = "${facts.exports.namespace}.Rail";\n\nexport default ${facts.exports.rail};\n`;
}

function printReactSidebarMenuButton(facts: AdapterSidebarFacts): string {
  const props = facts.props;

  return `import * as React from "react";\n${renderReactAsChildImports()}\nimport { ${facts.context.hook} } from "./${facts.context.name}";\n\nexport type ${facts.exports.menuButton}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${props.asChild.name}?: ${props.asChild.type};\n};\n\nconst ${facts.exports.menuButton} = React.forwardRef<HTMLElement, ${facts.exports.menuButton}Props>(\n  function ${facts.exports.menuButton}({ ${props.asChild.name} = ${props.asChild.defaultValue}, children, className, ...props }, forwardedRef) {\n    const sidebarContext = ${facts.context.hook}();\n    const protectedMenuButtonProps = {\n      ${JSON.stringify(facts.attrs.menuButton)}: "",\n      "${facts.attrs.menuButtonState}": sidebarContext?.state ?? "expanded",\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n    const menuButtonProps = {\n      ...protectedMenuButtonProps,\n      ...props,\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n\n${renderReactAsChildSetup("    ")}\n\n${renderReactAsChildCloneBranch(
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

function printReactRepeatedDisclosureRoot(facts: AdapterRepeatedDisclosureFacts): string {
  const root = facts.exports.root;
  const typeProp = facts.props.type.name;
  const defaultValueProp = facts.props.defaultValue.name;
  const valueProp = facts.props.value.name;
  const collapsibleProp = facts.props.collapsible.name;
  const event = facts.events.valueChange;

  return `import { type ${facts.state.type}, type ${event.detailsType}, ${facts.runtime.factory} } from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport type ${root}Props = Omit<React.HTMLAttributes<HTMLDivElement>, "${defaultValueProp}" | "onChange"> & {\n  ${typeProp}?: ${facts.props.type.type};\n  ${defaultValueProp}?: ${facts.state.type};\n  ${valueProp}?: ${facts.state.type};\n  ${collapsibleProp}?: ${facts.props.collapsible.type};\n  ${event.callbackProp}?: (details: ${event.detailsType}) => void;\n};\n\nconst ${root} = React.forwardRef<HTMLDivElement, ${root}Props>(function ${root}(\n  {\n    ${typeProp} = ${facts.props.type.defaultValue},\n    ${defaultValueProp},\n    ${valueProp},\n    ${collapsibleProp} = ${facts.props.collapsible.defaultValue},\n    ${event.callbackProp},\n    ...props\n  },\n  forwardedRef,\n) {\n  const rootRef = React.useRef<HTMLDivElement>(null);\n  const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n  const ${event.callbackProp}Ref = React.useRef(${event.callbackProp});\n  const ${valueProp}Ref = React.useRef(${valueProp});\n  const ${defaultValueProp}Ref = React.useRef(${defaultValueProp});\n  const [uncontrolledValue, setUncontrolledValueState] = React.useState<${facts.state.type} | undefined>(\n    () => ${defaultValueProp}Ref.current,\n  );\n  const uncontrolledValueRef = React.useRef(uncontrolledValue);\n\n  const setUncontrolledValue = React.useCallback((nextValue: ${facts.state.type}) => {\n    uncontrolledValueRef.current = nextValue;\n    setUncontrolledValueState(nextValue);\n  }, []);\n\n  React.useEffect(() => {\n    ${event.callbackProp}Ref.current = ${event.callbackProp};\n  }, [${event.callbackProp}]);\n\n  React.useEffect(() => {\n    ${valueProp}Ref.current = ${valueProp};\n  }, [${valueProp}]);\n\n  const composedRef = React.useCallback((node: HTMLDivElement | null) => {\n    rootRef.current = node;\n    setRef(forwardedRef, node);\n  }, [forwardedRef]);\n\n  React.useEffect(() => {\n    const root = rootRef.current;\n    if (!root) return;\n\n    const instance = ${facts.runtime.factory}(root, {\n      ${typeProp},\n      ${defaultValueProp}: uncontrolledValueRef.current,\n      ${collapsibleProp},\n      ...(${valueProp}Ref.current !== undefined ? { ${valueProp}: ${valueProp}Ref.current } : {}),\n    });\n    instanceRef.current = instance;\n    const unsubscribe = instance.subscribe("${event.name}", (details) => {\n      ${event.callbackProp}Ref.current?.(details);\n      if (${valueProp}Ref.current === undefined) {\n        setUncontrolledValue(details.${event.valueProperty});\n      }\n    });\n\n    return () => {\n      unsubscribe();\n      instance.destroy();\n      if (instanceRef.current === instance) {\n        instanceRef.current = undefined;\n      }\n    };\n  }, [${typeProp}, ${collapsibleProp}]);\n\n  React.useEffect(() => {\n    if (${valueProp} === undefined) return;\n    const instance = instanceRef.current;\n    if (!instance) return;\n    if (${facts.valueEqualityHelper}(instance.${facts.state.getter}(), ${valueProp})) return;\n\n    instance.${facts.setter.method}(${valueProp}, ${formatOptions(facts.setter.options)});\n  }, [${valueProp}]);\n\n  const defaultValueAttribute = Array.isArray(${defaultValueProp}Ref.current)\n    ? JSON.stringify(${defaultValueProp}Ref.current)\n    : ${defaultValueProp}Ref.current;\n\n  return (\n    <${facts.parts.root.defaultElement}\n      ${facts.attrs.root}\n      ${facts.attrs.type}={${typeProp}}\n      ${facts.attrs.defaultValue}={defaultValueAttribute}\n      ${facts.attrs.collapsible}={String(${collapsibleProp})}\n      ${facts.attrs.rootState}="closed"\n      ref={composedRef}\n      {...props}\n    />\n  );\n});\n\n${root}.displayName = "${facts.displayName}.Root";\n\nexport default ${root};\n\nfunction ${facts.valueEqualityHelper}(left: ${facts.state.type}, right: ${facts.state.type}): boolean {\n  if (Array.isArray(left) || Array.isArray(right)) {\n    return JSON.stringify(left) === JSON.stringify(right);\n  }\n\n  return left === right;\n}\n\n${renderSetRefFunction()}`;
}

function printReactRepeatedDisclosureItem(facts: AdapterRepeatedDisclosureFacts): string {
  const item = facts.exports.item;
  const valueProp = facts.props.itemValue.name;
  const disabledProp = facts.props.disabled.name;

  return `import * as React from "react";\n\nexport type ${item}Props = React.HTMLAttributes<HTMLDivElement> & {\n  ${valueProp}?: ${facts.props.itemValue.type};\n  ${disabledProp}?: ${facts.props.disabled.type};\n};\n\nconst ${item} = React.forwardRef<HTMLDivElement, ${item}Props>(function ${item}(\n  { ${valueProp}, ${disabledProp} = ${facts.props.disabled.defaultValue}, ...props },\n  forwardedRef,\n) {\n  return (\n    <${facts.parts.item.defaultElement}\n      ${facts.attrs.item}\n      ${facts.attrs.itemValue}={${valueProp}}\n      ${facts.attrs.disabled}={${disabledProp} ? "" : undefined}\n      ${facts.attrs.itemState}="closed"\n      ref={forwardedRef}\n      {...props}\n    />\n  );\n});\n\n${item}.displayName = "${facts.displayName}.Item";\n\nexport default ${item};\n`;
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

  return `import * as React from "react";\n\nexport type ${trigger}Props = React.ButtonHTMLAttributes<HTMLButtonElement>;\n\nconst ${trigger} = React.forwardRef<HTMLButtonElement, ${trigger}Props>(\n  function ${trigger}(props, forwardedRef) {\n    return (\n      <${facts.parts.trigger.defaultElement}\n        ${facts.attrs.triggerType}="button"\n        ${facts.attrs.trigger}\n        ${facts.attrs.triggerExpanded}="false"\n        ${facts.attrs.triggerState}="closed"\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${trigger}.displayName = "${facts.displayName}.Trigger";\n\nexport default ${trigger};\n`;
}

function printReactRepeatedDisclosurePanel(facts: AdapterRepeatedDisclosureFacts): string {
  const panel = facts.exports.panel;

  return `import * as React from "react";\n\nexport type ${panel}Props = React.HTMLAttributes<HTMLDivElement>;\n\nconst ${panel} = React.forwardRef<HTMLDivElement, ${panel}Props>(\n  function ${panel}({ style, ...props }, forwardedRef) {\n    return (\n      <${facts.parts.panel.defaultElement}\n        ${facts.attrs.panel}\n        ${facts.attrs.panelState}="closed"\n        ${facts.attrs.panelHidden}\n        ref={forwardedRef}\n        style={{ animation: "none", ...style }}\n        {...props}\n      />\n    );\n  },\n);\n\n${panel}.displayName = "${facts.displayName}.Panel";\n\nexport default ${panel};\n`;
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
  const facts = family.facts;

  if (family.part === "root") return printReactControlledValuePresenceRoot(facts);
  if (family.part === "list") return printReactControlledValuePresenceList(facts);
  if (family.part === "tab") return printReactControlledValuePresenceTab(facts);
  if (family.part === "panel") return printReactControlledValuePresencePanel(facts);
  if (family.part === "indicator") return printReactControlledValuePresenceIndicator(facts);

  throw new Error(
    `${facts.displayName} controlled-value-presence adapter cannot print ${family.part}.`,
  );
}

function printReactControlledValuePresenceHelper(
  family: AdapterControlledValuePresenceHelperProjection,
): string {
  const facts = family.facts;
  const orientationProp = facts.props.orientation.name;
  const valueProp = facts.props.value.name;

  return `import type { ${facts.props.orientation.type}, ${facts.state.type} } from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport type ${facts.context.typeName} = {\n  ${orientationProp}: ${facts.props.orientation.type};\n  ${valueProp}: ${facts.state.type};\n};\n\nconst fallbackContext = {\n  ${orientationProp}: ${facts.props.orientation.defaultValue},\n  ${valueProp}: null,\n} satisfies ${facts.context.typeName};\n\nexport const ${facts.context.componentName} = React.createContext<${facts.context.typeName} | null>(null);\n\nexport function ${facts.context.hookName}(): ${facts.context.typeName} {\n  return React.useContext(${facts.context.componentName}) ?? fallbackContext;\n}\n`;
}

function printReactControlledValuePresenceRoot(facts: AdapterControlledValuePresenceFacts): string {
  const root = facts.exports.root;
  const event = facts.events.valueChange;
  const defaultValueProp = facts.props.defaultValue.name;
  const orientationProp = facts.props.orientation.name;
  const syncKeyProp = facts.props.syncKey.name;
  const valueProp = facts.props.value.name;
  const setterOptions = formatOptions(facts.setter.options);

  return `import {\n  ${facts.runtime.factory},\n  type ${facts.props.orientation.type},\n  type ${facts.state.type},\n  type ${event.detailsType},\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nimport { ${facts.context.componentName} } from "./${facts.context.componentName}";\n\nexport type ${root}Props = Omit<\n  React.HTMLAttributes<HTMLDivElement>,\n  "${defaultValueProp}" | "onChange"\n> & {\n  ${defaultValueProp}?: ${facts.state.type};\n  ${event.callbackProp}?: (${event.valueProperty}: ${event.valueType}, details: ${event.detailsType}) => void;\n  ${orientationProp}?: ${facts.props.orientation.type};\n  ${syncKeyProp}?: ${facts.props.syncKey.type};\n  ${valueProp}?: ${facts.state.type};\n};\n\nconst ${root} = React.forwardRef<HTMLDivElement, ${root}Props>(function ${root}(\n  {\n    ${defaultValueProp},\n    ${event.callbackProp},\n    ${orientationProp} = ${facts.props.orientation.defaultValue},\n    ${syncKeyProp},\n    ${valueProp},\n    ...props\n  },\n  forwardedRef,\n) {\n  const rootRef = React.useRef<HTMLDivElement>(null);\n  const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n  const ${defaultValueProp}Ref = React.useRef(${defaultValueProp});\n  const ${event.callbackProp}Ref = React.useRef(${event.callbackProp});\n  const ${orientationProp}Ref = React.useRef(${orientationProp});\n  const ${syncKeyProp}Ref = React.useRef(${syncKeyProp});\n  const ${valueProp}Ref = React.useRef(${valueProp});\n  const [uncontrolledValue, setUncontrolledValue] = React.useState<${facts.state.type}>(\n    () => ${defaultValueProp}Ref.current ?? null,\n  );\n\n  React.useEffect(() => {\n    ${event.callbackProp}Ref.current = ${event.callbackProp};\n  }, [${event.callbackProp}]);\n\n  React.useEffect(() => {\n    ${valueProp}Ref.current = ${valueProp};\n  }, [${valueProp}]);\n\n  React.useEffect(() => {\n    ${orientationProp}Ref.current = ${orientationProp};\n    const instance = instanceRef.current;\n    if (!instance) return;\n\n    instance.refresh();\n  }, [${orientationProp}]);\n\n  const composedRef = React.useCallback(\n    (node: HTMLDivElement | null) => {\n      rootRef.current = node;\n      setRef(forwardedRef, node);\n    },\n    [forwardedRef],\n  );\n\n  React.useEffect(() => {\n    const root = rootRef.current;\n    if (!root) return;\n\n    const instance = ${facts.runtime.factory}(root, {\n      ${defaultValueProp}: ${defaultValueProp}Ref.current,\n      ${event.callbackProp}: (_nextValue, details) => {\n        ${event.callbackProp}Ref.current?.(details.${event.valueProperty}, details);\n      },\n      ${orientationProp}: ${orientationProp}Ref.current,\n      ${syncKeyProp}: ${syncKeyProp}Ref.current,\n      ...(${valueProp}Ref.current !== undefined ? { ${valueProp}: ${valueProp}Ref.current } : {}),\n    });\n    instanceRef.current = instance;\n    if (${valueProp}Ref.current === undefined) {\n      setUncontrolledValue(instance.${facts.state.getter}());\n    }\n\n    const unsubscribe = instance.subscribe("${event.name}", (details) => {\n      if (details.isCanceled) return;\n\n      if (${valueProp}Ref.current === undefined) {\n        setUncontrolledValue(details.${event.valueProperty});\n      }\n    });\n\n    return () => {\n      unsubscribe();\n      instance.destroy();\n      if (instanceRef.current === instance) {\n        instanceRef.current = undefined;\n      }\n    };\n  }, []);\n\n  React.useEffect(() => {\n    if (${valueProp} === undefined) return;\n    const instance = instanceRef.current;\n    if (!instance) return;\n    instance.refresh();\n    if (instance.${facts.state.getter}() === ${valueProp}) return;\n\n    instance.${facts.setter.method}(${valueProp}, ${setterOptions});\n  }, [${valueProp}]);\n\n  React.useEffect(() => {\n    instanceRef.current?.refresh();\n  });\n\n  const renderedValue = ${valueProp} !== undefined ? ${valueProp} : uncontrolledValue;\n  const contextValue = React.useMemo(\n    () => ({ ${orientationProp}, ${valueProp}: renderedValue }),\n    [${orientationProp}, renderedValue],\n  );\n\n  return (\n    <${facts.context.componentName}.Provider value={contextValue}>\n      <${facts.parts.root.defaultElement}\n        ${facts.attrs.root}\n        ${facts.attrs.defaultValue}={${facts.serializer.functionName}(${defaultValueProp}Ref.current)}\n        ${facts.attrs.orientation}={${orientationProp}}\n        ${facts.attrs.syncKey}={${syncKeyProp}}\n        ${facts.attrs.value}={${facts.serializer.functionName}(renderedValue)}\n        ref={composedRef}\n        {...props}\n      />\n    </${facts.context.componentName}.Provider>\n  );\n});\n\n${root}.displayName = "${facts.displayName}.${facts.parts.root.namespaceKey}";\n\nexport default ${root};\n\nfunction ${facts.serializer.functionName}(value: ${facts.state.type} | undefined): string | undefined {\n  if (value === undefined) return undefined;\n  return value === null ? "null" : value;\n}\n\n${renderSetRefFunction()}`;
}

function printReactControlledValuePresenceList(facts: AdapterControlledValuePresenceFacts): string {
  const list = facts.exports.list;
  const part = facts.parts.list;
  const elementType = getReactElementTypeForPart(part.defaultElement);
  const activateOnFocusProp = facts.props.activateOnFocus.name;
  const loopFocusProp = facts.props.loopFocus.name;
  const orientationProp = facts.props.orientation.name;

  return `import * as React from "react";\n\nimport { ${facts.context.hookName} } from "./${facts.context.componentName}";\n\nexport type ${list}Props = React.HTMLAttributes<${elementType}> & {\n  ${activateOnFocusProp}?: ${facts.props.activateOnFocus.type};\n  ${loopFocusProp}?: ${facts.props.loopFocus.type};\n};\n\nconst ${list} = React.forwardRef<${elementType}, ${list}Props>(function ${list}(\n  { ${activateOnFocusProp} = ${facts.props.activateOnFocus.defaultValue}, ${loopFocusProp} = ${facts.props.loopFocus.defaultValue}, ...props },\n  forwardedRef,\n) {\n  const { ${orientationProp} } = ${facts.context.hookName}();\n\n  return (\n    <${part.defaultElement}\n      ${facts.attrs.list}\n      ${facts.attrs.activateOnFocus}={${activateOnFocusProp} ? "" : undefined}\n      ${facts.attrs.loopFocus}={!${loopFocusProp} ? "false" : undefined}\n      ${facts.attrs.listOrientation}={${orientationProp}}\n      ${facts.attrs.ariaOrientation}={${orientationProp} === "vertical" ? "vertical" : undefined}\n      ref={forwardedRef}\n      role="${part.role}"\n      {...props}\n    />\n  );\n});\n\n${list}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${list};\n`;
}

function printReactControlledValuePresenceTab(facts: AdapterControlledValuePresenceFacts): string {
  const tab = facts.exports.tab;
  const part = facts.parts.tab;
  const elementType = getReactElementTypeForPart(part.defaultElement);
  const disabledProp = facts.props.disabled.name;
  const orientationProp = facts.props.orientation.name;
  const valueProp = facts.props.tabValue.name;

  return `import * as React from "react";\n\nimport { ${facts.context.hookName} } from "./${facts.context.componentName}";\n\nexport type ${tab}Props = Omit<React.ButtonHTMLAttributes<${elementType}>, "type" | "${valueProp}"> & {\n  ${disabledProp}?: ${facts.props.disabled.type};\n  ${valueProp}: ${facts.props.tabValue.type};\n};\n\nconst ${tab} = React.forwardRef<${elementType}, ${tab}Props>(function ${tab}(\n  { ${disabledProp} = ${facts.props.disabled.defaultValue}, ${valueProp}, ...props },\n  forwardedRef,\n) {\n  const { ${orientationProp}, ${facts.props.value.name}: selectedValue } = ${facts.context.hookName}();\n  const active = ${valueProp} === selectedValue;\n  const state = active ? "active" : "inactive";\n\n  return (\n    <${part.defaultElement}\n      ${facts.attrs.tab}\n      ${facts.attrs.disabled}={${disabledProp} ? "" : undefined}\n      ${facts.attrs.tabOrientation}={${orientationProp}}\n      ${facts.attrs.tabValue}={${valueProp}}\n      ${facts.attrs.tabAriaSelected}={active}\n      ${facts.attrs.tabActive}={active ? "" : undefined}\n      ${facts.attrs.tabState}={state}\n      disabled={${disabledProp}}\n      ref={forwardedRef}\n      role="${part.role}"\n      tabIndex={active && !${disabledProp} ? 0 : -1}\n      type="button"\n      {...props}\n    />\n  );\n});\n\n${tab}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${tab};\n`;
}

function printReactControlledValuePresencePanel(
  facts: AdapterControlledValuePresenceFacts,
): string {
  const panel = facts.exports.panel;
  const part = facts.parts.panel;
  const elementType = getReactElementTypeForPart(part.defaultElement);
  const keepMountedProp = facts.props.keepMounted.name;
  const orientationProp = facts.props.orientation.name;
  const valueProp = facts.props.panelValue.name;

  return `import * as React from "react";\n\nimport { ${facts.context.hookName} } from "./${facts.context.componentName}";\n\nexport type ${panel}Props = React.HTMLAttributes<${elementType}> & {\n  ${keepMountedProp}?: ${facts.props.keepMounted.type};\n  ${valueProp}: ${facts.props.panelValue.type};\n};\n\nconst ${panel} = React.forwardRef<${elementType}, ${panel}Props>(function ${panel}(\n  { ${keepMountedProp} = ${facts.props.keepMounted.defaultValue}, ${valueProp}, ...props },\n  forwardedRef,\n) {\n  const { ${orientationProp}, ${facts.props.value.name}: selectedValue } = ${facts.context.hookName}();\n  const active = ${valueProp} === selectedValue;\n  const state = active ? "active" : "inactive";\n\n  return (\n    <${part.defaultElement}\n      ${facts.attrs.panel}\n      ${facts.attrs.keepMounted}={${keepMountedProp} ? "" : undefined}\n      ${facts.attrs.panelOrientation}={${orientationProp}}\n      ${facts.attrs.panelValue}={${valueProp}}\n      ${facts.attrs.panelActive}={active ? "" : undefined}\n      ${facts.attrs.panelState}={state}\n      ${facts.attrs.panelHidden}={!active}\n      ref={forwardedRef}\n      role="${part.role}"\n      tabIndex={active ? 0 : -1}\n      {...props}\n    />\n  );\n});\n\n${panel}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${panel};\n`;
}

function printReactControlledValuePresenceIndicator(
  facts: AdapterControlledValuePresenceFacts,
): string {
  const indicator = facts.exports.indicator;
  const part = facts.parts.indicator;
  const elementType = getReactElementTypeForPart(part.defaultElement);
  const orientationProp = facts.props.orientation.name;

  return `import * as React from "react";\n\nimport { ${facts.context.hookName} } from "./${facts.context.componentName}";\n\nexport type ${indicator}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${indicator} = React.forwardRef<${elementType}, ${indicator}Props>(\n  function ${indicator}(props, forwardedRef) {\n    const { ${orientationProp} } = ${facts.context.hookName}();\n\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.indicator}\n        ${facts.attrs.indicatorOrientation}={${orientationProp}}\n        ref={forwardedRef}\n        role="${part.role}"\n        {...props}\n      />\n    );\n  },\n);\n\n${indicator}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${indicator};\n`;
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

  return `import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport type ${propsType} = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${propsType}>(\n  function ${exportName}(props, forwardedRef) {\n    const rootRef = React.useRef<${elementType}>(null);\n\n    const composedRef = React.useCallback((node: ${elementType} | null) => {\n      rootRef.current = node;\n      setRef(forwardedRef, node);\n    }, [forwardedRef]);\n\n    React.useEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root);\n\n      return () => {\n        instance.destroy();\n      };\n    }, []);\n\n    return (\n      <${part.defaultElement}\n        ${part.discoveryAttribute}\n        ${facts.attrs.rootStatus}="idle"\n        ref={composedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n\n${renderSetRefFunction()}`;
}

function printReactMediaStatusImage(facts: AdapterMediaStatusFacts): string {
  const part = facts.parts.image;
  const exportName = facts.exports.image;
  const callbackProp = facts.event.callbackProp;
  const eventDetailsType = facts.event.detailsType;
  const eventValueProperty = facts.event.valueProperty;

  return `import type {\n  ${facts.state.type},\n  ${eventDetailsType},\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport type ${exportName}Props = React.ImgHTMLAttributes<HTMLImageElement> & {\n  ${facts.props.alt.name}: ${facts.props.alt.type};\n  ${callbackProp}?: (\n    ${eventValueProperty}: ${facts.state.type},\n    details: ${eventDetailsType},\n  ) => void;\n};\n\nconst ${exportName} = React.forwardRef<HTMLImageElement, ${exportName}Props>(\n  function ${exportName}({ hidden, ${callbackProp}, ...props }, forwardedRef) {\n    const imageRef = React.useRef<HTMLImageElement>(null);\n    const onLoadingStatusChangeRef = React.useRef(${callbackProp});\n    const hasLoadingStatusChangeCallback = ${callbackProp} !== undefined;\n    onLoadingStatusChangeRef.current = ${callbackProp};\n\n    const composedRef = React.useCallback(\n      (node: HTMLImageElement | null) => {\n        imageRef.current = node;\n\n        if (node) {\n          node.hidden = hidden ?? true;\n        }\n\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef, hidden],\n    );\n\n    React.useEffect(() => {\n      if (!hasLoadingStatusChangeCallback) return;\n\n      const root = imageRef.current?.closest<HTMLElement>("[${facts.parts.root.discoveryAttribute}]");\n      if (!root) return;\n\n      const handleLoadingStatusChange = (event: Event) => {\n        const details = (event as CustomEvent<${eventDetailsType}>).detail;\n        onLoadingStatusChangeRef.current?.(details.${eventValueProperty}, details);\n      };\n\n      const notifyCurrentLoadingStatus = () => {\n        const status = root.getAttribute("${facts.attrs.rootStatus}") as ${facts.state.type} | null;\n        if (!status || status === "idle") return;\n\n        onLoadingStatusChangeRef.current?.(status, { previousStatus: "idle", status });\n      };\n\n      root.addEventListener("${facts.event.domEvent}", handleLoadingStatusChange);\n      notifyCurrentLoadingStatus();\n\n      return () => {\n        root.removeEventListener("${facts.event.domEvent}", handleLoadingStatusChange);\n      };\n    }, [hasLoadingStatusChangeCallback]);\n\n    return (\n      <${part.defaultElement}\n        ${part.discoveryAttribute}\n        ${facts.attrs.imageStatus}="idle"\n        ref={composedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n\n${renderSetRefFunction()}`;
}

function printReactMediaStatusFallback(facts: AdapterMediaStatusFacts): string {
  const part = facts.parts.fallback;
  const exportName = facts.exports.fallback;
  const elementType = getReactElementTypeForPart(part.defaultElement);
  const propsType = `${exportName}Props`;
  const delay = facts.props.delay.name;

  return `import * as React from "react";\n\nexport type ${propsType} = React.HTMLAttributes<${elementType}> & {\n  ${delay}?: ${facts.props.delay.type};\n};\n\nconst ${exportName} = React.forwardRef<${elementType}, ${propsType}>(\n  function ${exportName}({ ${delay}, hidden, ...props }, forwardedRef) {\n    const composedRef = React.useCallback(\n      (node: ${elementType} | null) => {\n        if (node) {\n          node.hidden = hidden ?? ${delay} !== undefined;\n        }\n\n        setRef(forwardedRef, node);\n      },\n      [${delay}, forwardedRef, hidden],\n    );\n\n    return (\n      <${part.defaultElement}\n        ${part.discoveryAttribute}\n        ${facts.attrs.fallbackDelay}={${delay}}\n        ${facts.attrs.fallbackStatus}="idle"\n        ref={composedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n\n${renderSetRefFunction()}`;
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

  return `import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport ${renderViewportMeasurementOverflowEdgeThresholdType(facts, "type")}\n\ntype ${facts.threshold.attributesTypeName} = {\n  shared?: number;\n  xEnd?: number;\n  xStart?: number;\n  yEnd?: number;\n  yStart?: number;\n};\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}> & {\n  ${thresholdProp.name}?: ${facts.threshold.typeName};\n};\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}({ ${thresholdProp.name}, ...props }, forwardedRef) {\n    const rootRef = React.useRef<${elementType}>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const thresholdAttributes = ${facts.threshold.helperName}(${thresholdProp.name});\n\n    const composedRef = React.useCallback(\n      (node: ${elementType} | null) => {\n        rootRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    React.useEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root);\n      instanceRef.current = instance;\n\n      return () => {\n        instance.destroy();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, []);\n\n    React.useEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.refresh();\n    }, [\n      thresholdAttributes.shared,\n      thresholdAttributes.xEnd,\n      thresholdAttributes.xStart,\n      thresholdAttributes.yEnd,\n      thresholdAttributes.yStart,\n    ]);\n\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.root}\n        ${facts.attrs.overflowEdgeThreshold}={thresholdAttributes.shared}\n        ${facts.attrs.overflowEdgeThresholdEdges.xEnd}={thresholdAttributes.xEnd}\n        ${facts.attrs.overflowEdgeThresholdEdges.xStart}={thresholdAttributes.xStart}\n        ${facts.attrs.overflowEdgeThresholdEdges.yEnd}={thresholdAttributes.yEnd}\n        ${facts.attrs.overflowEdgeThresholdEdges.yStart}={thresholdAttributes.yStart}\n        ref={composedRef}\n        role="${part.role}"\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n\n${renderViewportMeasurementOverflowEdgeThresholdHelpers(facts)}\n\n${renderSetRefFunction()}`;
}

function printReactViewportMeasurementViewport(facts: AdapterViewportMeasurementFacts): string {
  const part = facts.parts.viewport;
  const exportName = facts.exports.viewport;
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}({ style, tabIndex, ...props }, forwardedRef) {\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.viewport}\n        ref={forwardedRef}\n        role="${part.role}"\n        ${facts.attrs.viewportTabIndex}={tabIndex ?? -1}\n        ${facts.attrs.viewportStyle}={{ ...style, overflow: "scroll" }}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
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

  return `import { ${facts.runtime.factory}, type ${facts.event.detailsType} } from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nexport type ${facts.exports.root}Props = Omit<\n  React.HTMLAttributes<${facts.render.nonNativeElementType}>,\n  "${defaultState}" | "onChange"\n> &\n  Omit<React.ButtonHTMLAttributes<${facts.render.nativeElementType}>, "${defaultState}" | "onChange" | "type"> & {\n    ${state}?: ${facts.props.state.type};\n    ${defaultState}?: ${facts.props.defaultState.type};\n    ${disabled}?: ${facts.props.disabled.type};\n    ${form}?: ${requireFamilyProp(facts.props.form, "form").type};\n    ${id}?: ${requireFamilyProp(facts.props.id, "id").type};\n    ${inputRef}?: React.Ref<${requireFamilyProp(facts.input.refProp, "inputRef").type}>;\n    ${name}?: ${requireFamilyProp(facts.props.name, "name").type};\n    ${nativeButton}?: ${facts.props.nativeButton.type};\n    ${facts.event.callbackProp}?: (${facts.event.valueProperty}: ${facts.event.valueType}, details: ${facts.event.detailsType}) => void;\n    ${readOnly}?: ${requireFamilyProp(facts.props.readOnly, "readOnly").type};\n    ${required}?: ${requireFamilyProp(facts.props.required, "required").type};\n    ${uncheckedValue}?: ${requireFamilyProp(facts.props.uncheckedValue, "uncheckedValue").type};\n    ${value}?: ${requireFamilyProp(facts.props.value, "value").type};\n  };\n\n${renderVisuallyHiddenStyle()}\n\nconst ${facts.exports.root} = React.forwardRef<${facts.render.nonNativeElementType} | ${facts.render.nativeElementType}, ${facts.exports.root}Props>(\n  function ${facts.exports.root}(\n    {\n      ${state},\n      children,\n      ${defaultState} = ${facts.props.defaultState.defaultValue},\n      ${disabled} = ${facts.props.disabled.defaultValue},\n      ${form},\n      ${id},\n      ${inputRef},\n      ${name},\n      ${nativeButton} = ${facts.props.nativeButton.defaultValue},\n      ${facts.event.callbackProp},\n      ${readOnly} = ${requireFamilyProp(facts.props.readOnly, "readOnly").defaultValue},\n      ${required} = ${requireFamilyProp(facts.props.required, "required").defaultValue},\n      ${uncheckedValue},\n      ${value},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const rootRef = React.useRef<${facts.render.nonNativeElementType} | ${facts.render.nativeElementType}>(null);\n    const inputElementRef = React.useRef<${facts.input.elementType}>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const ${state}Ref = React.useRef(${state});\n    const ${facts.event.callbackProp}Ref = React.useRef(${facts.event.callbackProp});\n    const resetSyncTimerRef = React.useRef<number | undefined>(undefined);\n    const ${defaultState}Ref = React.useRef(${defaultState});\n    const [uncontrolled${facts.state.pascalName}, setUncontrolled${facts.state.pascalName}State] = React.useState(${defaultState}Ref.current);\n    const uncontrolled${facts.state.pascalName}Ref = React.useRef(uncontrolled${facts.state.pascalName});\n\n    const setUncontrolled${facts.state.pascalName} = React.useCallback((next${facts.state.pascalName}: ${facts.event.valueType}) => {\n      uncontrolled${facts.state.pascalName}Ref.current = next${facts.state.pascalName};\n      setUncontrolled${facts.state.pascalName}State(next${facts.state.pascalName});\n    }, []);\n\n    useIsomorphicLayoutEffect(() => {\n      ${state}Ref.current = ${state};\n    }, [${state}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.event.callbackProp}Ref.current = ${facts.event.callbackProp};\n    }, [${facts.event.callbackProp}]);\n\n    const composedRef = React.useCallback(\n      (node: ${facts.render.nonNativeElementType} | ${facts.render.nativeElementType} | null) => {\n        rootRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    const composedInputRef = React.useCallback(\n      (node: ${facts.input.elementType} | null) => {\n        inputElementRef.current = node;\n        setRef(${inputRef}, node);\n      },\n      [${inputRef}],\n    );\n\n    useIsomorphicLayoutEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root, {\n        ${defaultState}: uncontrolled${facts.state.pascalName}Ref.current,\n        ${disabled},\n        ${form},\n        ${id},\n        ${name},\n        ${readOnly},\n        ${required},\n        ${uncheckedValue},\n        ${value},\n        ...(${state}Ref.current !== undefined ? { ${state}: ${state}Ref.current } : {}),\n      });\n      instanceRef.current = instance;\n      const formElement = inputElementRef.current?.form ?? null;\n      const syncUncontrolledAfterFormReset = () => {\n        if (${state}Ref.current !== undefined) return;\n\n        if (resetSyncTimerRef.current !== undefined) {\n          window.clearTimeout(resetSyncTimerRef.current);\n        }\n\n        resetSyncTimerRef.current = window.setTimeout(() => {\n          resetSyncTimerRef.current = undefined;\n          const currentInstance = instanceRef.current;\n          if (!currentInstance) return;\n\n          setUncontrolled${facts.state.pascalName}(currentInstance.${facts.state.getter}());\n        }, 0);\n      };\n      const unsubscribe = instance.subscribe("${facts.event.name}", (details) => {\n        ${facts.event.callbackProp}Ref.current?.(details.${facts.event.valueProperty}, details);\n        if (details.isCanceled) return;\n\n        if (${state}Ref.current === undefined) {\n          setUncontrolled${facts.state.pascalName}(details.${facts.event.valueProperty});\n        }\n      });\n      formElement?.addEventListener("reset", syncUncontrolledAfterFormReset);\n\n      return () => {\n        formElement?.removeEventListener("reset", syncUncontrolledAfterFormReset);\n        if (resetSyncTimerRef.current !== undefined) {\n          window.clearTimeout(resetSyncTimerRef.current);\n          resetSyncTimerRef.current = undefined;\n        }\n        unsubscribe();\n        instance.destroy();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, [${id}, ${nativeButton}, ${readOnly}]);\n\n${renderReactBooleanMutationSync(facts, state, `uncontrolled${facts.state.pascalName}`, `setUncontrolled${facts.state.pascalName}`)}\n\n    useIsomorphicLayoutEffect(() => {\n      if (${state} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n      if (instance.${facts.state.getter}() === ${state}) return;\n\n      instance.${facts.setters.state.method}(${state}, ${setterOptions});\n    }, [${state}]);\n\n${renderReactBooleanDisabledSetter(facts, disabled)}\n\n    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.${formOptionsSetter.method}({\n        ${form},\n        ${name},\n        ${required},\n        ${uncheckedValue},\n        ${value},\n      });\n    }, [${form}, ${name}, ${required}, ${uncheckedValue}, ${value}]);\n\n    const rendered${facts.state.pascalName} = ${state} ?? uncontrolled${facts.state.pascalName};\n    const commonProps: React.HTMLAttributes<HTMLElement> &\n      Record<\`data-\${string}\`, string | undefined> = {\n      "${facts.attrs.root}": "",\n      "${facts.attrs.defaultState}": ${defaultState}Ref.current ? "true" : undefined,\n      "${facts.attrs.form}": ${form},\n      "${facts.attrs.id}": ${id},\n      "${facts.attrs.name}": ${name},\n      "${facts.attrs.uncheckedValue}": ${uncheckedValue},\n      "${facts.attrs.value}": ${value},\n      "${facts.attrs.ariaState}": rendered${facts.state.pascalName},\n      "${facts.attrs.ariaReadOnly}": ${readOnly} ? "true" : undefined,\n      "${facts.attrs.ariaRequired}": ${required} ? "true" : undefined,\n      "${facts.attrs.truthyPresence}": rendered${facts.state.pascalName} ? "" : undefined,\n      "${facts.attrs.disabled}": ${disabled} ? "" : undefined,\n      "${facts.attrs.filled}": rendered${facts.state.pascalName} ? "" : undefined,\n      "${facts.attrs.readOnly}": ${readOnly} ? "" : undefined,\n      "${facts.attrs.required}": ${required} ? "" : undefined,\n      "${facts.attrs.falsyPresence}": !rendered${facts.state.pascalName} ? "" : undefined,\n      role: "${facts.render.role}",\n      tabIndex: ${disabled} ? -1 : 0,\n    };\n    const input = (\n      <input\n        ${facts.attrs.input}\n        aria-hidden="true"\n        defaultChecked={${defaultState}Ref.current}\n        defaultValue={${value}}\n        disabled={${disabled}}\n        form={${form}}\n        id={${inputIdHelperName}(${id}, ${nativeButton})}\n        name={${name}}\n        ref={composedInputRef}\n        required={${required}}\n        style={visuallyHiddenStyle}\n        tabIndex={-1}\n        type="${facts.input.type}"\n      />\n    );\n\n    if (${nativeButton}) {\n      return (\n        <>\n          <${facts.render.nativeElement}\n            {...(props as React.ButtonHTMLAttributes<${facts.render.nativeElementType}>)}\n            {...commonProps}\n            disabled={${disabled}}\n            id={${id}}\n            ref={composedRef as React.Ref<${facts.render.nativeElementType}>}\n            type="button"\n          >\n            {children}\n          </${facts.render.nativeElement}>\n          {input}\n        </>\n      );\n    }\n\n    return (\n      <>\n        <${facts.render.nonNativeElement}\n          {...(props as React.HTMLAttributes<${facts.render.nonNativeElementType}>)}\n          {...commonProps}\n          ref={composedRef as React.Ref<${facts.render.nonNativeElementType}>}\n        >\n          {children}\n        </${facts.render.nonNativeElement}>\n        {input}\n      </>\n    );\n  },\n);\n\n${facts.exports.root}.displayName = "${facts.displayName}.Root";\n\nexport default ${facts.exports.root};\n\n${renderSetRefFunction()}\nfunction ${inputIdHelperName}(id: string | undefined, nativeButton: boolean): string | undefined {\n  if (!id) return undefined;\n  return nativeButton ? \`\${id}-input\` : id;\n}\n`;
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

  return `import { type ${facts.event.detailsType}, ${facts.runtime.factory} } from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { ${group.hookName} } from "${group.importPath}";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nexport type ${facts.exports.root}Props = Omit<\n  React.HTMLAttributes<${facts.render.nonNativeElementType}>,\n  "${defaultState}" | "onChange"\n> &\n  Omit<React.ButtonHTMLAttributes<${facts.render.nativeElementType}>, "${defaultState}" | "onChange" | "type"> & {\n    ${state}?: ${facts.props.state.type};\n    ${defaultState}?: ${facts.props.defaultState.type};\n    ${disabled}?: ${facts.props.disabled.type};\n    ${form}?: ${requireFamilyProp(facts.props.form, "form").type};\n    ${id}?: ${requireFamilyProp(facts.props.id, "id").type};\n    ${indeterminate}?: ${requireFamilyProp(facts.props.indeterminate, "indeterminate").type};\n    ${name}?: ${requireFamilyProp(facts.props.name, "name").type};\n    ${nativeButton}?: ${facts.props.nativeButton.type};\n    ${facts.event.callbackProp}?: (${facts.event.valueProperty}: ${facts.event.valueType}, details: ${facts.event.detailsType}) => void;\n    ${readOnly}?: ${requireFamilyProp(facts.props.readOnly, "readOnly").type};\n    ${required}?: ${requireFamilyProp(facts.props.required, "required").type};\n    ${uncheckedValue}?: ${requireFamilyProp(facts.props.uncheckedValue, "uncheckedValue").type};\n    ${value}?: ${requireFamilyProp(facts.props.value, "value").type};\n  };\n\n${renderVisuallyHiddenStyle()}\n\nconst ${facts.exports.root} = React.forwardRef<${facts.render.nonNativeElementType} | ${facts.render.nativeElementType}, ${facts.exports.root}Props>(\n  function ${facts.exports.root}(\n    {\n      ${state},\n      children,\n      ${defaultState} = ${facts.props.defaultState.defaultValue},\n      ${disabled} = ${facts.props.disabled.defaultValue},\n      ${form},\n      ${id},\n      ${indeterminate} = ${requireFamilyProp(facts.props.indeterminate, "indeterminate").defaultValue},\n      ${name},\n      ${nativeButton} = ${facts.props.nativeButton.defaultValue},\n      ${facts.event.callbackProp},\n      ${readOnly} = ${requireFamilyProp(facts.props.readOnly, "readOnly").defaultValue},\n      ${required} = ${requireFamilyProp(facts.props.required, "required").defaultValue},\n      ${uncheckedValue},\n      ${value},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const rootRef = React.useRef<${facts.render.nonNativeElementType} | ${facts.render.nativeElementType}>(null);\n    const inputElementRef = React.useRef<${facts.input.elementType}>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const ${state}Ref = React.useRef(${state});\n    const ${indeterminate}Ref = React.useRef(${indeterminate});\n    const ${facts.event.callbackProp}Ref = React.useRef(${facts.event.callbackProp});\n    const resetSyncTimerRef = React.useRef<number | undefined>(undefined);\n    const ${defaultState}Ref = React.useRef(${defaultState});\n    const ${groupVariable} = ${group.hookName}();\n    const groupValue = ${value} ?? ${name};\n    const group${facts.state.pascalName} =\n      ${groupVariable} && groupValue !== undefined ? ${groupVariable}.value.includes(groupValue) : undefined;\n    const effectiveDisabled = ${disabled} || ${groupVariable}?.disabled === true;\n    const [uncontrolled${facts.state.pascalName}, setUncontrolled${facts.state.pascalName}State] = React.useState(\n      group${facts.state.pascalName} ?? ${defaultState}Ref.current,\n    );\n    const uncontrolled${facts.state.pascalName}Ref = React.useRef(uncontrolled${facts.state.pascalName});\n    const [renderedIndeterminate, setRenderedIndeterminate] = React.useState(${indeterminate});\n\n    const setUncontrolled${facts.state.pascalName} = React.useCallback((next${facts.state.pascalName}: ${facts.event.valueType}) => {\n      uncontrolled${facts.state.pascalName}Ref.current = next${facts.state.pascalName};\n      setUncontrolled${facts.state.pascalName}State(next${facts.state.pascalName});\n    }, []);\n\n    useIsomorphicLayoutEffect(() => {\n      ${state}Ref.current = ${state};\n    }, [${state}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${indeterminate}Ref.current = ${indeterminate};\n    }, [${indeterminate}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.event.callbackProp}Ref.current = ${facts.event.callbackProp};\n    }, [${facts.event.callbackProp}]);\n\n    const composedRef = React.useCallback(\n      (node: ${facts.render.nonNativeElementType} | ${facts.render.nativeElementType} | null) => {\n        rootRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    useIsomorphicLayoutEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root, {\n        ${defaultState}: uncontrolled${facts.state.pascalName}Ref.current,\n        disabled: effectiveDisabled,\n        ${form},\n        ${id},\n        ${indeterminate},\n        ${name},\n        ${readOnly},\n        ${required},\n        ${uncheckedValue},\n        ${value},\n        ...(${state}Ref.current !== undefined\n          ? { ${state}: ${state}Ref.current }\n          : group${facts.state.pascalName} !== undefined\n            ? { ${state}: group${facts.state.pascalName} }\n            : {}),\n      });\n      instanceRef.current = instance;\n      const formElement = inputElementRef.current?.form ?? null;\n      const syncUncontrolledAfterFormReset = () => {\n        if (${state}Ref.current !== undefined) return;\n\n        if (resetSyncTimerRef.current !== undefined) {\n          window.clearTimeout(resetSyncTimerRef.current);\n        }\n\n        resetSyncTimerRef.current = window.setTimeout(() => {\n          resetSyncTimerRef.current = undefined;\n          const currentInstance = instanceRef.current;\n          if (!currentInstance) return;\n\n          setUncontrolled${facts.state.pascalName}(currentInstance.${facts.state.getter}());\n          if (!${indeterminate}Ref.current) {\n            setRenderedIndeterminate(false);\n          }\n        }, 0);\n      };\n      const unsubscribe = instance.subscribe("${facts.event.name}", (details) => {\n        ${facts.event.callbackProp}Ref.current?.(details.${facts.event.valueProperty}, details);\n        if (details.isCanceled) return;\n\n        if (${state}Ref.current === undefined) {\n          setUncontrolled${facts.state.pascalName}(details.${facts.event.valueProperty});\n        }\n\n        if (!${indeterminate}Ref.current) {\n          setRenderedIndeterminate(false);\n        }\n      });\n      formElement?.addEventListener("reset", syncUncontrolledAfterFormReset);\n\n      return () => {\n        formElement?.removeEventListener("reset", syncUncontrolledAfterFormReset);\n        if (resetSyncTimerRef.current !== undefined) {\n          window.clearTimeout(resetSyncTimerRef.current);\n          resetSyncTimerRef.current = undefined;\n        }\n        unsubscribe();\n        instance.destroy();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, [${form}, ${id}, ${name}, ${nativeButton}, ${readOnly}, ${required}, ${uncheckedValue}, ${value}]);\n\n${renderReactBooleanIndeterminateControlledSetters(facts, state, `group${facts.state.pascalName}`, indeterminate, "effectiveDisabled", setterOptions)}\n\n    const rendered${facts.state.pascalName} = ${state} ?? group${facts.state.pascalName} ?? uncontrolled${facts.state.pascalName};\n    const aria${facts.state.pascalName}: React.AriaAttributes["${facts.attrs.ariaState}"] = renderedIndeterminate\n      ? "mixed"\n      : rendered${facts.state.pascalName};\n    const commonProps: React.HTMLAttributes<HTMLElement> &\n      Record<\`data-\${string}\`, string | undefined> = {\n      "${facts.attrs.root}": "",\n      "${facts.attrs.defaultState}": ${defaultState}Ref.current ? "true" : undefined,\n      "${facts.attrs.form}": ${form},\n      "${facts.attrs.id}": ${id},\n      "${facts.attrs.name}": ${name},\n      "${facts.attrs.uncheckedValue}": ${uncheckedValue},\n      "${facts.attrs.value}": ${value},\n      "${facts.attrs.ariaState}": aria${facts.state.pascalName},\n      "${facts.attrs.ariaReadOnly}": ${readOnly},\n      "${facts.attrs.ariaRequired}": ${required},\n      "${facts.attrs.truthyPresence}": rendered${facts.state.pascalName} ? "" : undefined,\n      "${facts.attrs.disabled}": effectiveDisabled ? "" : undefined,\n      "${facts.attrs.indeterminate}": renderedIndeterminate ? "" : undefined,\n      "${facts.attrs.readOnly}": ${readOnly} ? "" : undefined,\n      "${facts.attrs.required}": ${required} ? "" : undefined,\n      "${facts.attrs.falsyPresence}": !rendered${facts.state.pascalName} ? "" : undefined,\n      role: "${facts.render.role}",\n      tabIndex: effectiveDisabled ? -1 : 0,\n    };\n    const input = (\n      <input\n        ${facts.attrs.input}\n        aria-hidden="true"\n        defaultChecked={${defaultState}Ref.current}\n        defaultValue={${value}}\n        disabled={effectiveDisabled}\n        form={${form}}\n        id={${id}}\n        name={${name}}\n        ref={inputElementRef}\n        required={${required}}\n        style={visuallyHiddenStyle}\n        tabIndex={-1}\n        type="${facts.input.type}"\n      />\n    );\n\n    if (${nativeButton}) {\n      return (\n        <>\n          <${facts.render.nativeElement}\n            {...(props as React.ButtonHTMLAttributes<${facts.render.nativeElementType}>)}\n            {...commonProps}\n            disabled={effectiveDisabled}\n            ref={composedRef as React.Ref<${facts.render.nativeElementType}>}\n            type="button"\n          >\n            {children}\n          </${facts.render.nativeElement}>\n          {input}\n        </>\n      );\n    }\n\n    return (\n      <${facts.render.nonNativeElement}\n        {...(props as React.HTMLAttributes<${facts.render.nonNativeElementType}>)}\n        {...commonProps}\n        ref={composedRef as React.Ref<${facts.render.nonNativeElementType}>}\n      >\n        {children}\n        {input}\n      </${facts.render.nonNativeElement}>\n    );\n  },\n);\n\n${facts.exports.root}.displayName = "${facts.displayName}.Root";\n\nexport default ${facts.exports.root};\n\n${renderSetRefFunction()}`;
}

function printReactBooleanFormControlRequiredValueRoot(
  facts: AdapterBooleanFormControlFacts,
): string {
  assertBooleanFormControlBehavior(facts, {
    canCancelChange: false,
    formResetSync: false,
    groupStrategy: "value-equals",
    hasIndeterminate: false,
    inputIdStrategy: "omit-when-native",
    inputPlacement: "nested-when-non-native",
    readonlyAriaFalseWhenFalse: false,
  });

  const state = facts.props.state.name;
  const defaultState = facts.props.defaultState.name;
  const disabled = facts.props.disabled.name;
  const form = requireFamilyProp(facts.props.form, "form").name;
  const id = requireFamilyProp(facts.props.id, "id").name;
  const name = requireFamilyProp(facts.props.name, "name").name;
  const nativeButton = facts.props.nativeButton.name;
  const readOnly = requireFamilyProp(facts.props.readOnly, "readOnly").name;
  const required = requireFamilyProp(facts.props.required, "required").name;
  const value = requireFamilyProp(facts.props.value, "value").name;
  const group = requireGroupFacts(facts);
  const groupVariable = group.variableName;
  const setterOptions = formatOptions(facts.setters.state.options);
  const readOnlySetter = requireSetter(facts.setters.readOnly, "readOnly");
  const formOptionsSetter = requireSetter(facts.setters.formOptions, "formOptions");

  return `import { ${facts.runtime.factory}, type ${facts.event.detailsType} } from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nimport { ${group.hookName} } from "${group.importPath}";\n\nexport type ${facts.exports.root}Props = Omit<\n  React.HTMLAttributes<${facts.render.nonNativeElementType}>,\n  "${defaultState}" | "onChange"\n> &\n  Omit<React.ButtonHTMLAttributes<${facts.render.nativeElementType}>, "${defaultState}" | "onChange" | "type"> & {\n    ${state}?: ${facts.props.state.type};\n    ${defaultState}?: ${facts.props.defaultState.type};\n    ${disabled}?: ${facts.props.disabled.type};\n    ${form}?: ${requireFamilyProp(facts.props.form, "form").type};\n    ${id}?: ${requireFamilyProp(facts.props.id, "id").type};\n    ${name}?: ${requireFamilyProp(facts.props.name, "name").type};\n    ${nativeButton}?: ${facts.props.nativeButton.type};\n    ${facts.event.callbackProp}?: (${facts.event.valueProperty}: ${facts.event.valueType}, details: ${facts.event.detailsType}) => void;\n    ${readOnly}?: ${requireFamilyProp(facts.props.readOnly, "readOnly").type};\n    ${required}?: ${requireFamilyProp(facts.props.required, "required").type};\n    ${value}: ${requireFamilyProp(facts.props.value, "value").type};\n  };\n\n${renderVisuallyHiddenStyle()}\n\nconst ${facts.exports.root} = React.forwardRef<${facts.render.nonNativeElementType} | ${facts.render.nativeElementType}, ${facts.exports.root}Props>(\n  function ${facts.exports.root}(\n    {\n      ${state},\n      children,\n      ${defaultState} = ${facts.props.defaultState.defaultValue},\n      ${disabled} = ${facts.props.disabled.defaultValue},\n      ${form},\n      ${id},\n      ${name},\n      ${nativeButton} = ${facts.props.nativeButton.defaultValue},\n      ${facts.event.callbackProp},\n      ${readOnly} = ${requireFamilyProp(facts.props.readOnly, "readOnly").defaultValue},\n      ${required} = ${requireFamilyProp(facts.props.required, "required").defaultValue},\n      ${value},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const rootRef = React.useRef<${facts.render.nonNativeElementType} | ${facts.render.nativeElementType}>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const ${state}Ref = React.useRef(${state});\n    const ${facts.event.callbackProp}Ref = React.useRef(${facts.event.callbackProp});\n    const ${defaultState}Ref = React.useRef(${defaultState});\n    const ${groupVariable} = ${group.hookName}();\n    const group${facts.state.pascalName} = ${groupVariable} && ${value} !== undefined ? ${groupVariable}.value === ${value} : undefined;\n    const effectiveDisabled = ${disabled} || ${groupVariable}?.disabled === true;\n    const effectiveForm = ${form} ?? ${groupVariable}?.form;\n    const effectiveName = ${name} ?? ${groupVariable}?.name;\n    const effectiveReadOnly = ${readOnly} || ${groupVariable}?.readOnly === true;\n    const effectiveRequired = ${required} || ${groupVariable}?.required === true;\n    const [uncontrolled${facts.state.pascalName}, setUncontrolled${facts.state.pascalName}State] = React.useState(\n      group${facts.state.pascalName} ?? ${defaultState}Ref.current,\n    );\n    const uncontrolled${facts.state.pascalName}Ref = React.useRef(uncontrolled${facts.state.pascalName});\n\n    const setUncontrolled${facts.state.pascalName} = React.useCallback((next${facts.state.pascalName}: ${facts.event.valueType}) => {\n      uncontrolled${facts.state.pascalName}Ref.current = next${facts.state.pascalName};\n      setUncontrolled${facts.state.pascalName}State(next${facts.state.pascalName});\n    }, []);\n\n    useIsomorphicLayoutEffect(() => {\n      ${state}Ref.current = ${state};\n    }, [${state}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.event.callbackProp}Ref.current = ${facts.event.callbackProp};\n    }, [${facts.event.callbackProp}]);\n\n    const composedRef = React.useCallback(\n      (node: ${facts.render.nonNativeElementType} | ${facts.render.nativeElementType} | null) => {\n        rootRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    useIsomorphicLayoutEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root, {\n        ${defaultState}: uncontrolled${facts.state.pascalName}Ref.current,\n        disabled: effectiveDisabled,\n        form: effectiveForm,\n        ${id},\n        name: effectiveName,\n        readOnly: effectiveReadOnly,\n        required: effectiveRequired,\n        ${value},\n        ...(${state}Ref.current !== undefined\n          ? { ${state}: ${state}Ref.current }\n          : group${facts.state.pascalName} !== undefined\n            ? { ${state}: group${facts.state.pascalName} }\n            : {}),\n      });\n      instanceRef.current = instance;\n      const unsubscribe = instance.subscribe("${facts.event.name}", (details) => {\n        if (${state}Ref.current === undefined) {\n          setUncontrolled${facts.state.pascalName}(details.${facts.event.valueProperty});\n        }\n\n        ${facts.event.callbackProp}Ref.current?.(details.${facts.event.valueProperty}, details);\n      });\n\n      return () => {\n        unsubscribe();\n        instance.destroy();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, [effectiveForm, effectiveName, ${id}, ${nativeButton}, ${value}]);\n\n${renderReactBooleanControlledSetters(facts, state, `group${facts.state.pascalName}`, "effectiveDisabled", setterOptions)}\n\n    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.${readOnlySetter.method}(effectiveReadOnly);\n    }, [effectiveReadOnly]);\n\n    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.${formOptionsSetter.method}({\n        form: effectiveForm,\n        name: effectiveName,\n        required: effectiveRequired,\n        ${value},\n      });\n    }, [effectiveForm, effectiveName, effectiveRequired, ${value}]);\n\n    const rendered${facts.state.pascalName} = ${state} ?? group${facts.state.pascalName} ?? uncontrolled${facts.state.pascalName};\n    const commonProps: React.HTMLAttributes<HTMLElement> &\n      Record<\`data-\${string}\`, string | undefined> = {\n      "${facts.attrs.root}": "",\n      "${facts.attrs.defaultState}": ${defaultState}Ref.current ? "true" : undefined,\n      "${facts.attrs.form}": effectiveForm,\n      "${facts.attrs.id}": ${id},\n      "${facts.attrs.name}": effectiveName,\n      "${facts.attrs.value}": ${value},\n      "${facts.attrs.ariaState}": rendered${facts.state.pascalName},\n      "${facts.attrs.truthyPresence}": rendered${facts.state.pascalName} ? "" : undefined,\n      "${facts.attrs.disabled}": effectiveDisabled ? "" : undefined,\n      "${facts.attrs.readOnly}": effectiveReadOnly ? "" : undefined,\n      "${facts.attrs.required}": effectiveRequired ? "" : undefined,\n      "${facts.attrs.falsyPresence}": !rendered${facts.state.pascalName} ? "" : undefined,\n      role: "${facts.render.role}",\n      tabIndex: effectiveDisabled ? -1 : 0,\n    };\n    const input = (\n      <input\n        ${facts.attrs.input}\n        aria-hidden="true"\n        defaultChecked={rendered${facts.state.pascalName}}\n        defaultValue={${value}}\n        disabled={effectiveDisabled}\n        form={effectiveForm}\n        id={${nativeButton} ? undefined : ${id}}\n        name={effectiveName}\n        required={effectiveRequired}\n        style={visuallyHiddenStyle}\n        tabIndex={-1}\n        type="${facts.input.type}"\n      />\n    );\n\n    if (${nativeButton}) {\n      return (\n        <>\n          <${facts.render.nativeElement}\n            {...(props as React.ButtonHTMLAttributes<${facts.render.nativeElementType}>)}\n            {...commonProps}\n            disabled={effectiveDisabled}\n            id={${id}}\n            ref={composedRef as React.Ref<${facts.render.nativeElementType}>}\n            type="button"\n          >\n            {children}\n          </${facts.render.nativeElement}>\n          {input}\n        </>\n      );\n    }\n\n    return (\n      <${facts.render.nonNativeElement}\n        {...(props as React.HTMLAttributes<${facts.render.nonNativeElementType}>)}\n        {...commonProps}\n        ref={composedRef as React.Ref<${facts.render.nonNativeElementType}>}\n      >\n        {children}\n        {input}\n      </${facts.render.nonNativeElement}>\n    );\n  },\n);\n\n${facts.exports.root}.displayName = "${facts.displayName}.Root";\n\nexport default ${facts.exports.root};\n\n${renderSetRefFunction()}`;
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

  if (family.part === "root") {
    const setterOptions = formatOptions(facts.setter.options);

    return `import { type ${facts.event.detailsType}, ${facts.runtime.factory} } from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport type ${facts.exports.root}Props = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> & {\n  ${facts.props.defaultOpen.name}?: ${facts.props.defaultOpen.type};\n  ${facts.props.disabled.name}?: ${facts.props.disabled.type};\n  ${facts.props.open.name}?: ${facts.props.open.type};\n  ${facts.event.callbackProp}?: (${facts.event.valueProperty}: ${facts.event.valueType}, details: ${facts.event.detailsType}) => void;\n};\n\nconst ${facts.exports.root} = React.forwardRef<HTMLDivElement, ${facts.exports.root}Props>(\n  function ${facts.exports.root}(\n    { ${facts.props.defaultOpen.name} = ${facts.props.defaultOpen.defaultValue}, ${facts.props.disabled.name} = ${facts.props.disabled.defaultValue}, ${facts.props.open.name}, ${facts.event.callbackProp}, ...props },\n    forwardedRef,\n  ) {\n    const rootRef = React.useRef<HTMLDivElement>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const ${facts.event.callbackProp}Ref = React.useRef(${facts.event.callbackProp});\n    const ${facts.props.open.name}Ref = React.useRef(${facts.props.open.name});\n    const ${facts.props.defaultOpen.name}Ref = React.useRef(${facts.props.defaultOpen.name});\n    const [uncontrolledOpen, setUncontrolledOpenState] = React.useState(${facts.props.defaultOpen.name}Ref.current);\n    const uncontrolledOpenRef = React.useRef(uncontrolledOpen);\n\n    const setUncontrolledOpen = React.useCallback((nextOpen: ${facts.event.valueType}) => {\n      uncontrolledOpenRef.current = nextOpen;\n      setUncontrolledOpenState(nextOpen);\n    }, []);\n\n    React.useEffect(() => {\n      ${facts.event.callbackProp}Ref.current = ${facts.event.callbackProp};\n    }, [${facts.event.callbackProp}]);\n\n    React.useEffect(() => {\n      ${facts.props.open.name}Ref.current = ${facts.props.open.name};\n    }, [${facts.props.open.name}]);\n\n    const composedRef = React.useCallback((node: HTMLDivElement | null) => {\n      rootRef.current = node;\n      setRef(forwardedRef, node);\n    }, [forwardedRef]);\n\n    React.useEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root, {\n        ${facts.props.defaultOpen.name}: uncontrolledOpenRef.current,\n        ${facts.props.disabled.name},\n        ...(${facts.props.open.name}Ref.current !== undefined ? { ${facts.props.open.name}: ${facts.props.open.name}Ref.current } : {}),\n      });\n      instanceRef.current = instance;\n      const unsubscribe = instance.subscribe("${facts.event.name}", (details) => {\n        ${facts.event.callbackProp}Ref.current?.(details.${facts.event.valueProperty}, details);\n        if (details.isCanceled) return;\n\n        if (${facts.props.open.name}Ref.current === undefined) {\n          setUncontrolledOpen(details.${facts.event.valueProperty});\n        }\n      });\n\n      return () => {\n        unsubscribe();\n        instance.destroy();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, [${facts.props.disabled.name}]);\n\n    React.useEffect(() => {\n      if (${facts.props.open.name} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n      if (instance.${facts.openGetter}() === ${facts.props.open.name}) return;\n\n      instance.${facts.setter.method}(${facts.props.open.name}, ${setterOptions});\n    }, [${facts.props.open.name}]);\n\n    const renderedOpen = ${facts.props.open.name} ?? uncontrolledOpen;\n\n    return (\n      <${facts.parts.root.defaultElement}\n        ${facts.attrs.root}\n        ${facts.attrs.defaultOpen}={${facts.props.defaultOpen.name}Ref.current ? "true" : undefined}\n        ${facts.attrs.disabled}={${facts.props.disabled.name} ? "" : undefined}\n        ${facts.attrs.rootState}={renderedOpen ? "open" : "closed"}\n        ref={composedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${facts.exports.root}.displayName = "${facts.displayName}.Root";\n\nexport default ${facts.exports.root};\n\n${renderSetRefFunction()}`;
  }

  if (family.part === "trigger") {
    return `import * as React from "react";\n${renderReactAsChildImports()}\n\nexport type ${facts.exports.trigger}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${facts.props.asChild.name}?: ${facts.props.asChild.type};\n};\n\nconst ${facts.exports.trigger} = React.forwardRef<HTMLElement, ${facts.exports.trigger}Props>(\n  function ${facts.exports.trigger}({ ${facts.props.asChild.name} = ${facts.props.asChild.defaultValue}, children, className, ...props }, forwardedRef) {\n    const protectedTriggerProps = {\n      ${JSON.stringify(facts.attrs.trigger)}: "",\n      "${facts.attrs.triggerExpanded}": "false",\n      "${facts.attrs.triggerState}": "closed",\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n    const triggerProps = {\n      ...protectedTriggerProps,\n      ...props,\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n\n${renderReactAsChildSetup("    ")}\n\n${renderReactAsChildCloneBranch(
      {
        asChildExpression: facts.props.asChild.name,
        indent: "    ",
        protectedPropsExpression: "protectedTriggerProps",
        propsExpression: "triggerProps",
      },
    )}\n\n    return (\n      <${facts.parts.trigger.defaultElement}\n        type="button"\n        className={className}\n        ref={forwardedRef as React.Ref<HTMLButtonElement>}\n        {...(triggerProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}\n      >\n        {children}\n      </${facts.parts.trigger.defaultElement}>\n    );\n  },\n);\n\n${facts.exports.trigger}.displayName = "${facts.displayName}.Trigger";\n\nexport default ${facts.exports.trigger};\n`;
  }

  return `import * as React from "react";\n\nexport type ${facts.exports.panel}Props = React.HTMLAttributes<HTMLDivElement> & {\n  ${facts.props.hiddenUntilFound.name}?: ${facts.props.hiddenUntilFound.type};\n};\n\nconst ${facts.exports.panel} = React.forwardRef<HTMLDivElement, ${facts.exports.panel}Props>(\n  function ${facts.exports.panel}({ ${facts.props.hiddenUntilFound.name} = ${facts.props.hiddenUntilFound.defaultValue}, ...props }, forwardedRef) {\n    const composedRef = React.useCallback((node: HTMLDivElement | null) => {\n      if (node) {\n        if (${facts.props.hiddenUntilFound.name}) {\n          node.setAttribute("hidden", "until-found");\n        } else if (node.getAttribute("hidden") === "until-found") {\n          node.hidden = true;\n        }\n      }\n\n      setRef(forwardedRef, node);\n    }, [forwardedRef, ${facts.props.hiddenUntilFound.name}]);\n\n    return (\n      <${facts.parts.panel.defaultElement}\n        ${facts.attrs.panel}\n        ${facts.attrs.panelHiddenUntilFound}={${facts.props.hiddenUntilFound.name} ? "" : undefined}\n        ${facts.attrs.panelState}="closed"\n        ${facts.attrs.panelHidden}\n        ref={composedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${facts.exports.panel}.displayName = "${facts.displayName}.Panel";\n\nexport default ${facts.exports.panel};\n\n${renderSetRefFunction()}`;
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
  if (facts.behavior.multipleValueNormalization) {
    return printReactGroupedValueControlNormalizedRoot(facts);
  }

  if (isSingleValueGroupedValueControlRoot(facts)) {
    return printReactGroupedValueControlSingleValueRoot(facts);
  }

  return printReactGroupedValueControlArrayRoot(facts);
}

function printReactGroupedValueControlSingleValueRoot(
  facts: AdapterGroupedValueControlFacts,
): string {
  const context = getRequiredGroupedValueContext(facts);
  const form = requireFamilyProp(facts.props.form, "form").name;
  const name = requireFamilyProp(facts.props.name, "name").name;
  const orientation = requireFamilyProp(facts.props.orientation, "orientation").name;
  const readOnly = requireFamilyProp(facts.props.readOnly, "readOnly").name;
  const required = requireFamilyProp(facts.props.required, "required").name;
  const formOptionsSetter = requireSetter(facts.setters.formOptions, "formOptions");
  const orientationSetter = requireSetter(facts.setters.orientation, "orientation");
  const readOnlySetter = requireSetter(facts.setters.readOnly, "readOnly");
  const valueSetterOptions = formatOptions(facts.setters.value.options);
  const ariaDisabled = getRequiredPlanValue(
    facts.attrs.ariaDisabled,
    `${facts.displayName} grouped-value facts are missing aria-disabled attr.`,
  );
  const ariaOrientation = getRequiredPlanValue(
    facts.attrs.ariaOrientation,
    `${facts.displayName} grouped-value facts are missing aria-orientation attr.`,
  );
  const ariaReadOnly = getRequiredPlanValue(
    facts.attrs.ariaReadOnly,
    `${facts.displayName} grouped-value facts are missing aria-readonly attr.`,
  );
  const ariaRequired = getRequiredPlanValue(
    facts.attrs.ariaRequired,
    `${facts.displayName} grouped-value facts are missing aria-required attr.`,
  );

  return `import {\n  ${facts.runtime.factory},\n  type ${facts.state.type},\n  type ${facts.event.detailsType},\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nimport { ${context.componentName} } from "./${context.componentName}";\n\nexport type ${facts.exports.root}Props = Omit<\n  React.HTMLAttributes<HTMLDivElement>,\n  "${facts.props.defaultValue.name}" | "onChange"\n> & {\n  ${facts.props.defaultValue.name}?: ${facts.state.type};\n  ${facts.props.disabled.name}?: ${facts.props.disabled.type};\n  ${form}?: ${requireFamilyProp(facts.props.form, "form").type};\n  ${name}?: ${requireFamilyProp(facts.props.name, "name").type};\n  ${facts.event.callbackProp}?: (${facts.event.valueProperty}: ${facts.event.valueType}, details: ${facts.event.detailsType}) => void;\n  ${orientation}?: ${requireFamilyProp(facts.props.orientation, "orientation").type};\n  ${readOnly}?: ${requireFamilyProp(facts.props.readOnly, "readOnly").type};\n  ${required}?: ${requireFamilyProp(facts.props.required, "required").type};\n  ${facts.props.value.name}?: ${facts.state.type};\n};\n\nconst ${facts.exports.root} = React.forwardRef<HTMLDivElement, ${facts.exports.root}Props>(\n  function ${facts.exports.root}(\n    {\n      ${facts.props.defaultValue.name},\n      ${facts.props.disabled.name} = ${facts.props.disabled.defaultValue},\n      ${form},\n      ${name},\n      ${facts.event.callbackProp},\n      ${orientation} = ${requireFamilyProp(facts.props.orientation, "orientation").defaultValue},\n      ${readOnly} = ${requireFamilyProp(facts.props.readOnly, "readOnly").defaultValue},\n      ${required} = ${requireFamilyProp(facts.props.required, "required").defaultValue},\n      ${facts.props.value.name},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const rootRef = React.useRef<HTMLDivElement>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const ${facts.props.defaultValue.name}Ref = React.useRef(${facts.props.defaultValue.name});\n    const ${facts.props.disabled.name}Ref = React.useRef(${facts.props.disabled.name});\n    const ${form}Ref = React.useRef(${form});\n    const ${name}Ref = React.useRef(${name});\n    const ${orientation}Ref = React.useRef(${orientation});\n    const ${readOnly}Ref = React.useRef(${readOnly});\n    const ${required}Ref = React.useRef(${required});\n    const ${facts.props.value.name}Ref = React.useRef(${facts.props.value.name});\n    const ${facts.event.callbackProp}Ref = React.useRef(${facts.event.callbackProp});\n    const [uncontrolledValue, setUncontrolledValueState] = React.useState<${facts.state.type}>(\n      () => ${facts.props.defaultValue.name}Ref.current,\n    );\n    const uncontrolledValueRef = React.useRef(uncontrolledValue);\n\n    const setUncontrolledValue = React.useCallback((nextValue: ${facts.state.type}) => {\n      uncontrolledValueRef.current = nextValue;\n      setUncontrolledValueState(nextValue);\n    }, []);\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.props.disabled.name}Ref.current = ${facts.props.disabled.name};\n    }, [${facts.props.disabled.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${form}Ref.current = ${form};\n    }, [${form}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${name}Ref.current = ${name};\n    }, [${name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${orientation}Ref.current = ${orientation};\n    }, [${orientation}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${readOnly}Ref.current = ${readOnly};\n    }, [${readOnly}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${required}Ref.current = ${required};\n    }, [${required}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.props.value.name}Ref.current = ${facts.props.value.name};\n    }, [${facts.props.value.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.event.callbackProp}Ref.current = ${facts.event.callbackProp};\n    }, [${facts.event.callbackProp}]);\n\n    const composedRef = React.useCallback(\n      (node: HTMLDivElement | null) => {\n        rootRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    useIsomorphicLayoutEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root, {\n        ${facts.props.defaultValue.name}: uncontrolledValueRef.current,\n        ${facts.props.disabled.name}: ${facts.props.disabled.name}Ref.current,\n        ${form}: ${form}Ref.current,\n        ${name}: ${name}Ref.current,\n        ${orientation}: ${orientation}Ref.current,\n        ${readOnly}: ${readOnly}Ref.current,\n        ${required}: ${required}Ref.current,\n        ...(${facts.props.value.name}Ref.current !== undefined ? { ${facts.props.value.name}: ${facts.props.value.name}Ref.current } : {}),\n      });\n      instanceRef.current = instance;\n      const unsubscribe = instance.subscribe("${facts.event.name}", (details) => {\n        if (${facts.props.value.name}Ref.current === undefined) {\n          setUncontrolledValue(details.${facts.event.valueProperty});\n        }\n\n        ${facts.event.callbackProp}Ref.current?.(details.${facts.event.valueProperty}, details);\n      });\n\n      return () => {\n        unsubscribe();\n        instance.destroy();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, []);\n\n    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.${facts.setters.disabled.method}(${facts.props.disabled.name});\n    }, [${facts.props.disabled.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.${formOptionsSetter.method}({\n        ${form},\n        ${name},\n        ${required},\n      });\n    }, [${form}, ${name}, ${required}]);\n\n    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.${orientationSetter.method}(${orientation});\n    }, [${orientation}]);\n\n    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.${readOnlySetter.method}(${readOnly});\n    }, [${readOnly}]);\n\n    useIsomorphicLayoutEffect(() => {\n      if (${facts.props.value.name} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n      if (instance.${facts.state.getter}() === ${facts.props.value.name}) return;\n\n      instance.${facts.setters.value.method}(${facts.props.value.name}, ${valueSetterOptions});\n    }, [${facts.props.value.name}]);\n\n    const renderedValue = ${facts.props.value.name} ?? uncontrolledValue;\n    const contextValue = React.useMemo(\n      () => ({\n        ${facts.props.disabled.name},\n        ${form},\n        ${name},\n        ${readOnly},\n        ${required},\n        ${facts.props.value.name}: renderedValue,\n      }),\n      [${facts.props.disabled.name}, ${form}, ${name}, ${readOnly}, renderedValue, ${required}],\n    );\n\n    return (\n      <${context.componentName}.Provider value={contextValue}>\n        <${facts.rootPart.defaultElement}\n          ${facts.attrs.root}\n          ${facts.attrs.defaultValue}={${facts.props.defaultValue.name}Ref.current}\n          ${getRequiredPlanValue(facts.attrs.form, `${facts.displayName} grouped-value facts are missing form attr.`)}={${form}}\n          ${getRequiredPlanValue(facts.attrs.name, `${facts.displayName} grouped-value facts are missing name attr.`)}={${name}}\n          ${getRequiredPlanValue(facts.attrs.orientation, `${facts.displayName} grouped-value facts are missing orientation attr.`)}={${orientation}}\n          ${facts.attrs.value}={renderedValue}\n          ${ariaDisabled}={${facts.props.disabled.name} ? "true" : undefined}\n          ${ariaOrientation}={${orientation}}\n          ${ariaReadOnly}={${readOnly} ? "true" : undefined}\n          ${ariaRequired}={${required} ? "true" : undefined}\n          ${facts.attrs.disabled}={${facts.props.disabled.name} ? "" : undefined}\n          ${getRequiredPlanValue(facts.attrs.readOnly, `${facts.displayName} grouped-value facts are missing readonly attr.`)}={${readOnly} ? "" : undefined}\n          ${getRequiredPlanValue(facts.attrs.required, `${facts.displayName} grouped-value facts are missing required attr.`)}={${required} ? "" : undefined}\n          ref={composedRef}\n          role="${facts.rootPart.role}"\n          {...props}\n        />\n      </${context.componentName}.Provider>\n    );\n  },\n);\n\n${facts.exports.root}.displayName = "${facts.displayName}.Root";\n\nexport default ${facts.exports.root};\n\n${renderSetRefFunction()}`;
}

function printReactGroupedValueControlArrayRoot(facts: AdapterGroupedValueControlFacts): string {
  const context = getRequiredGroupedValueContext(facts);
  const parseValueAttributeFunction = getRequiredPlanValue(
    facts.behavior.parseValueAttributeFunction,
    `${facts.displayName} grouped-value facts are missing parseValueAttributeFunction.`,
  );
  const disabledSetter = facts.setters.disabled;
  const valueSetterOptions = formatOptions(facts.setters.value.options);

  return `import {\n  type ${facts.state.type},\n  type ${facts.event.detailsType},\n  ${facts.runtime.factory},\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nimport { ${context.componentName} } from "./${context.componentName}";\n\nexport type ${facts.exports.root}Props = Omit<\n  React.HTMLAttributes<HTMLDivElement>,\n  "${facts.props.defaultValue.name}" | "onChange"\n> & {\n  ${facts.props.defaultValue.name}?: ${facts.state.type};\n  ${facts.props.disabled.name}?: ${facts.props.disabled.type};\n  ${facts.event.callbackProp}?: (\n    ${facts.event.valueProperty}: ${facts.event.valueType},\n    details: ${facts.event.detailsType},\n  ) => void;\n  ${facts.props.value.name}?: ${facts.state.type};\n};\n\nconst ${facts.exports.root} = React.forwardRef<HTMLDivElement, ${facts.exports.root}Props>(\n  function ${facts.exports.root}(\n    { ${facts.props.defaultValue.name}, ${facts.props.disabled.name} = ${facts.props.disabled.defaultValue}, ${facts.event.callbackProp}, ${facts.props.value.name}, ...props },\n    forwardedRef,\n  ) {\n    const rootRef = React.useRef<HTMLDivElement>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const ${facts.props.defaultValue.name}Ref = React.useRef(${facts.props.defaultValue.name});\n    const ${facts.props.disabled.name}Ref = React.useRef(${facts.props.disabled.name});\n    const ${facts.props.value.name}Ref = React.useRef(${facts.props.value.name});\n    const ${facts.event.callbackProp}Ref = React.useRef(${facts.event.callbackProp});\n    const [uncontrolledValue, setUncontrolledValueState] = React.useState<${facts.state.type}>(\n      () => ${facts.props.defaultValue.name}Ref.current ?? [],\n    );\n    const uncontrolledValueRef = React.useRef(uncontrolledValue);\n\n    const setUncontrolledValue = React.useCallback((nextValue: ${facts.state.type}) => {\n      if (areValuesEqual(uncontrolledValueRef.current, nextValue)) return;\n\n      uncontrolledValueRef.current = nextValue;\n      setUncontrolledValueState(nextValue);\n    }, []);\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.props.disabled.name}Ref.current = ${facts.props.disabled.name};\n    }, [${facts.props.disabled.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.props.value.name}Ref.current = ${facts.props.value.name};\n    }, [${facts.props.value.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.event.callbackProp}Ref.current = ${facts.event.callbackProp};\n    }, [${facts.event.callbackProp}]);\n\n    const composedRef = React.useCallback(\n      (node: HTMLDivElement | null) => {\n        rootRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    useIsomorphicLayoutEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root, {\n        ${facts.props.defaultValue.name}: ${facts.props.defaultValue.name}Ref.current,\n        ${facts.props.disabled.name}: ${facts.props.disabled.name}Ref.current,\n        ...(${facts.props.value.name}Ref.current !== undefined ? { ${facts.props.value.name}: ${facts.props.value.name}Ref.current } : {}),\n      });\n      instanceRef.current = instance;\n      const unsubscribe = instance.subscribe("${facts.event.name}", (details) => {\n        ${facts.event.callbackProp}Ref.current?.(details.${facts.event.valueProperty}, details);\n        if (details.isCanceled) return;\n\n        if (${facts.props.value.name}Ref.current === undefined) {\n          setUncontrolledValue(details.${facts.event.valueProperty});\n        }\n      });\n\n      return () => {\n        unsubscribe();\n        instance.destroy();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, []);\n\n    useIsomorphicLayoutEffect(() => {\n      const root = rootRef.current;\n      if (!root || typeof MutationObserver === "undefined") return;\n\n      const syncUncontrolledValue = () => {\n        if (${facts.props.value.name}Ref.current !== undefined) return;\n\n        setUncontrolledValue(${parseValueAttributeFunction}(root.getAttribute("${facts.attrs.value}")));\n      };\n      const observer = new MutationObserver(syncUncontrolledValue);\n      observer.observe(root, { attributes: true, attributeFilter: ["${facts.attrs.value}"] });\n      syncUncontrolledValue();\n\n      return () => {\n        observer.disconnect();\n      };\n    }, [setUncontrolledValue]);\n\n    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.${disabledSetter.method}(${facts.props.disabled.name});\n    }, [${facts.props.disabled.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      if (${facts.props.value.name} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n      if (areValuesEqual(instance.${facts.state.getter}(), ${facts.props.value.name})) return;\n\n      instance.${facts.setters.value.method}(${facts.props.value.name}, ${valueSetterOptions});\n    }, [${facts.props.value.name}]);\n\n    const renderedValue = ${facts.props.value.name} ?? uncontrolledValue;\n    const contextValue = React.useMemo(\n      () => ({ ${context.values.map((value) => value.name).join(", ")}: renderedValue }),\n      [${facts.props.disabled.name}, renderedValue],\n    );\n\n    return (\n      <${context.componentName}.Provider value={contextValue}>\n        <${facts.rootPart.defaultElement}\n          ${facts.attrs.root}\n          ${facts.attrs.defaultValue}={\n            ${facts.props.defaultValue.name}Ref.current ? JSON.stringify(${facts.props.defaultValue.name}Ref.current) : undefined\n          }\n          ${facts.attrs.value}={JSON.stringify(renderedValue)}\n          ${facts.attrs.disabled}={${facts.props.disabled.name} ? "" : undefined}\n          ref={composedRef}\n          role="${facts.rootPart.role}"\n          {...props}\n        />\n      </${context.componentName}.Provider>\n    );\n  },\n);\n\n${facts.exports.root}.displayName = "${facts.displayName}.Root";\n\nexport default ${facts.exports.root};\n\nfunction areValuesEqual(left: ${facts.state.type}, right: ${facts.state.type}): boolean {\n  return left.length === right.length && left.every((value, index) => value === right[index]);\n}\n\nfunction ${parseValueAttributeFunction}(value: string | null): ${facts.state.type} {\n  if (!value) return [];\n\n  try {\n    const parsed = JSON.parse(value) as unknown;\n    if (!Array.isArray(parsed)) return [];\n\n    return parsed.filter((item): item is string => typeof item === "string");\n  } catch {\n    return [];\n  }\n}\n\n${renderSetRefFunction()}`;
}

function printReactGroupedValueControlNormalizedRoot(
  facts: AdapterGroupedValueControlFacts,
): string {
  const loopFocus = requireFamilyProp(facts.props.loopFocus, "loopFocus");
  const multiple = requireFamilyProp(facts.props.multiple, "multiple");
  const orientation = requireFamilyProp(facts.props.orientation, "orientation");
  const loopFocusSetter = requireSetter(facts.setters.loopFocus, "loopFocus");
  const multipleSetter = requireSetter(facts.setters.multiple, "multiple");
  const orientationSetter = requireSetter(facts.setters.orientation, "orientation");
  const valueSetterOptions = formatOptions(facts.setters.value.options);

  return `import {\n  ${facts.runtime.factory},\n  type ${facts.state.type},\n  type ${facts.event.detailsType},\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nexport type ${facts.exports.root}Props = Omit<\n  React.HTMLAttributes<HTMLDivElement>,\n  "${facts.props.defaultValue.name}" | "onChange"\n> & {\n  ${facts.props.defaultValue.name}?: ${facts.state.type};\n  ${facts.props.disabled.name}?: ${facts.props.disabled.type};\n  ${loopFocus.name}?: ${loopFocus.type};\n  ${multiple.name}?: ${multiple.type};\n  ${facts.event.callbackProp}?: (${facts.event.valueProperty}: ${facts.event.valueType}, details: ${facts.event.detailsType}) => void;\n  ${orientation.name}?: ${orientation.type};\n  ${facts.props.value.name}?: ${facts.state.type};\n};\n\nconst ${facts.exports.root} = React.forwardRef<HTMLDivElement, ${facts.exports.root}Props>(\n  function ${facts.exports.root}(\n    {\n      ${facts.props.defaultValue.name},\n      ${facts.props.disabled.name} = ${facts.props.disabled.defaultValue},\n      ${loopFocus.name} = ${loopFocus.defaultValue},\n      ${multiple.name} = ${multiple.defaultValue},\n      ${facts.event.callbackProp},\n      ${orientation.name} = ${orientation.defaultValue},\n      ${facts.props.value.name},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const rootRef = React.useRef<HTMLDivElement>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const ${facts.props.defaultValue.name}Ref = React.useRef(${facts.props.defaultValue.name});\n    const ${facts.props.disabled.name}Ref = React.useRef(${facts.props.disabled.name});\n    const ${loopFocus.name}Ref = React.useRef(${loopFocus.name});\n    const ${multiple.name}Ref = React.useRef(${multiple.name});\n    const ${facts.event.callbackProp}Ref = React.useRef(${facts.event.callbackProp});\n    const ${orientation.name}Ref = React.useRef(${orientation.name});\n    const ${facts.props.value.name}Ref = React.useRef(${facts.props.value.name});\n    const [uncontrolledValue, setUncontrolledValue] = React.useState<${facts.state.type}>(() =>\n      normalizeRenderedValue(${facts.props.defaultValue.name}Ref.current ?? [], ${multiple.name}Ref.current),\n    );\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.props.disabled.name}Ref.current = ${facts.props.disabled.name};\n    }, [${facts.props.disabled.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${loopFocus.name}Ref.current = ${loopFocus.name};\n    }, [${loopFocus.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${multiple.name}Ref.current = ${multiple.name};\n    }, [${multiple.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.event.callbackProp}Ref.current = ${facts.event.callbackProp};\n    }, [${facts.event.callbackProp}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${orientation.name}Ref.current = ${orientation.name};\n    }, [${orientation.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.props.value.name}Ref.current = ${facts.props.value.name};\n    }, [${facts.props.value.name}]);\n\n    const composedRef = React.useCallback(\n      (node: HTMLDivElement | null) => {\n        rootRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    useIsomorphicLayoutEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root, {\n        ${facts.props.defaultValue.name}: ${facts.props.defaultValue.name}Ref.current,\n        ${facts.props.disabled.name}: ${facts.props.disabled.name}Ref.current,\n        ${loopFocus.name}: ${loopFocus.name}Ref.current,\n        ${multiple.name}: ${multiple.name}Ref.current,\n        ${orientation.name}: ${orientation.name}Ref.current,\n        ...(${facts.props.value.name}Ref.current !== undefined ? { ${facts.props.value.name}: ${facts.props.value.name}Ref.current } : {}),\n      });\n      instanceRef.current = instance;\n      const unsubscribe = instance.subscribe("${facts.event.name}", (details) => {\n        ${facts.event.callbackProp}Ref.current?.(details.${facts.event.valueProperty}, details);\n        if (details.isCanceled) return;\n\n        if (${facts.props.value.name}Ref.current === undefined) {\n          setUncontrolledValue(details.${facts.event.valueProperty});\n        }\n      });\n\n      return () => {\n        unsubscribe();\n        instance.destroy();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, []);\n\n    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.${facts.setters.disabled.method}(${facts.props.disabled.name});\n    }, [${facts.props.disabled.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.${loopFocusSetter.method}(${loopFocus.name});\n    }, [${loopFocus.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.${multipleSetter.method}(${multiple.name});\n      if (${facts.props.value.name}Ref.current === undefined) {\n        setUncontrolledValue(instance.${facts.state.getter}());\n      }\n    }, [${multiple.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.${orientationSetter.method}(${orientation.name});\n    }, [${orientation.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      if (${facts.props.value.name} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n      if (areValuesEqual(instance.${facts.state.getter}(), ${facts.props.value.name})) return;\n\n      instance.${facts.setters.value.method}(${facts.props.value.name}, ${valueSetterOptions});\n    }, [${multiple.name}, ${facts.props.value.name}]);\n\n    const renderedValue = normalizeRenderedValue(${facts.props.value.name} ?? uncontrolledValue, ${multiple.name});\n\n    return (\n      <${facts.rootPart.defaultElement}\n        ${facts.attrs.root}\n        ${facts.attrs.defaultValue}={\n          ${facts.props.defaultValue.name}Ref.current\n            ? JSON.stringify(normalizeRenderedValue(${facts.props.defaultValue.name}Ref.current, ${multiple.name}Ref.current))\n            : undefined\n        }\n        ${facts.attrs.disabled}={${facts.props.disabled.name} ? "" : undefined}\n        ${getRequiredPlanValue(facts.attrs.loopFocus, `${facts.displayName} grouped-value facts are missing loopFocus attr.`)}={!${loopFocus.name} ? "false" : undefined}\n        ${getRequiredPlanValue(facts.attrs.multiple, `${facts.displayName} grouped-value facts are missing multiple attr.`)}={${multiple.name} ? "" : undefined}\n        ${getRequiredPlanValue(facts.attrs.orientation, `${facts.displayName} grouped-value facts are missing orientation attr.`)}={${orientation.name}}\n        ${facts.attrs.value}={JSON.stringify(renderedValue)}\n        ref={composedRef}\n        role="${facts.rootPart.role}"\n        {...props}\n      />\n    );\n  },\n);\n\n${facts.exports.root}.displayName = "${facts.displayName}.Root";\n\nexport default ${facts.exports.root};\n\nfunction areValuesEqual(left: ${facts.state.type}, right: ${facts.state.type}): boolean {\n  return left.length === right.length && left.every((value, index) => value === right[index]);\n}\n\nfunction normalizeRenderedValue(value: ${facts.state.type}, ${multiple.name}: boolean): ${facts.state.type} {\n  const values = Array.from(new Set(value.filter((item) => item.length > 0)));\n  return ${multiple.name} ? values : values.slice(0, 1);\n}\n\n${renderSetRefFunction()}`;
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
  return printReactSingleBooleanControlRoot(family.facts);
}

function printReactSingleBooleanControlRoot(facts: AdapterSingleBooleanControlFacts): string {
  const setterOptions = formatOptions(facts.setters.state.options);

  return `import { ${facts.runtime.factory}, type ${facts.event.detailsType} } from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nexport type ${facts.exports.root}Props = Omit<\n  React.ButtonHTMLAttributes<HTMLButtonElement>,\n  "${facts.attrs.ariaState}" | "${facts.props.defaultState.name}" | "onChange" | "type" | "${facts.props.value.name}"\n> &\n  Omit<React.HTMLAttributes<${facts.render.nonNativeElementType}>, "${facts.attrs.ariaState}" | "${facts.props.defaultState.name}" | "onChange"> & {\n    ${facts.props.defaultState.name}?: ${facts.props.defaultState.type};\n    ${facts.props.disabled.name}?: ${facts.props.disabled.type};\n    ${facts.props.nativeButton.name}?: ${facts.props.nativeButton.type};\n    ${facts.event.callbackProp}?: (${facts.event.valueProperty}: ${facts.event.valueType}, details: ${facts.event.detailsType}) => void;\n    ${facts.props.state.name}?: ${facts.props.state.type};\n    ${facts.props.syncGroup.name}?: ${facts.props.syncGroup.type};\n    ${facts.props.value.name}?: ${facts.props.value.type};\n  };\n\nconst ${facts.exports.root} = React.forwardRef<HTMLButtonElement | ${facts.render.nonNativeElementType}, ${facts.exports.root}Props>(\n  function ${facts.exports.root}(\n    {\n      children,\n      ${facts.props.defaultState.name} = ${facts.props.defaultState.defaultValue},\n      ${facts.props.disabled.name} = ${facts.props.disabled.defaultValue},\n      ${facts.props.nativeButton.name} = ${facts.props.nativeButton.defaultValue},\n      ${facts.event.callbackProp},\n      ${facts.props.state.name},\n      ${facts.props.syncGroup.name},\n      ${facts.props.value.name},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const rootRef = React.useRef<HTMLButtonElement | ${facts.render.nonNativeElementType}>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const ${facts.event.callbackProp}Ref = React.useRef(${facts.event.callbackProp});\n    const ${facts.props.state.name}Ref = React.useRef(${facts.props.state.name});\n    const ${facts.props.defaultState.name}Ref = React.useRef(${facts.props.defaultState.name});\n    const [uncontrolled${facts.state.pascalName}, setUncontrolled${facts.state.pascalName}State] = React.useState(${facts.props.defaultState.name}Ref.current);\n    const uncontrolled${facts.state.pascalName}Ref = React.useRef(uncontrolled${facts.state.pascalName});\n\n    const setUncontrolled${facts.state.pascalName} = React.useCallback((next${facts.state.pascalName}: ${facts.event.valueType}) => {\n      uncontrolled${facts.state.pascalName}Ref.current = next${facts.state.pascalName};\n      setUncontrolled${facts.state.pascalName}State(next${facts.state.pascalName});\n    }, []);\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.event.callbackProp}Ref.current = ${facts.event.callbackProp};\n    }, [${facts.event.callbackProp}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${facts.props.state.name}Ref.current = ${facts.props.state.name};\n    }, [${facts.props.state.name}]);\n\n    const composedRef = React.useCallback((node: HTMLButtonElement | ${facts.render.nonNativeElementType} | null) => {\n      rootRef.current = node;\n      setRef(forwardedRef, node);\n    }, [forwardedRef]);\n\n    useIsomorphicLayoutEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root, {\n        ${facts.props.defaultState.name}: uncontrolled${facts.state.pascalName}Ref.current,\n        ${facts.props.disabled.name},\n        ${facts.props.nativeButton.name},\n        ${facts.props.syncGroup.name},\n        ${facts.props.value.name},\n        ...(${facts.props.state.name}Ref.current !== undefined ? { ${facts.props.state.name}: ${facts.props.state.name}Ref.current } : {}),\n      });\n      instanceRef.current = instance;\n      const unsubscribe = instance.subscribe("${facts.event.name}", (details) => {\n        ${facts.event.callbackProp}Ref.current?.(details.${facts.event.valueProperty}, details);\n        queueMicrotask(() => {\n          if (details.isCanceled) return;\n\n          if (${facts.props.state.name}Ref.current === undefined) {\n            setUncontrolled${facts.state.pascalName}(details.${facts.event.valueProperty});\n          }\n        });\n      });\n\n      return () => {\n        unsubscribe();\n        instance.destroy();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, [${facts.props.nativeButton.name}, ${facts.props.syncGroup.name}, ${facts.props.value.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      const root = rootRef.current;\n      if (!root || typeof MutationObserver === "undefined") return;\n\n      const syncUncontrolled${facts.state.pascalName} = () => {\n        if (${facts.props.state.name}Ref.current !== undefined) return;\n\n        const next${facts.state.pascalName} = root.getAttribute("${facts.attrs.ariaState}") === "true";\n        if (uncontrolled${facts.state.pascalName}Ref.current !== next${facts.state.pascalName}) {\n          setUncontrolled${facts.state.pascalName}(next${facts.state.pascalName});\n        }\n      };\n      const observer = new MutationObserver(syncUncontrolled${facts.state.pascalName});\n      observer.observe(root, { attributes: true, attributeFilter: ["${facts.attrs.ariaState}"] });\n      syncUncontrolled${facts.state.pascalName}();\n\n      return () => {\n        observer.disconnect();\n      };\n    }, []);\n\n    useIsomorphicLayoutEffect(() => {\n      if (${facts.props.state.name} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n      if (instance.${facts.state.getter}() === ${facts.props.state.name}) return;\n\n      instance.${facts.setters.state.method}(${facts.props.state.name}, ${setterOptions});\n    }, [${facts.props.state.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.${facts.setters.disabled.method}(${facts.props.disabled.name});\n    }, [${facts.props.disabled.name}]);\n\n    const rendered${facts.state.pascalName} = ${facts.props.state.name} ?? uncontrolled${facts.state.pascalName};\n    const commonProps: React.HTMLAttributes<HTMLElement> &\n      Record<\`data-\${string}\`, string | undefined> = {\n      "${facts.part.discoveryAttribute}": "",\n      "${facts.attrs.defaultState}": ${facts.props.state.name} === undefined && ${facts.props.defaultState.name}Ref.current ? "true" : undefined,\n      "${facts.attrs.native}": !${facts.props.nativeButton.name} ? "false" : undefined,\n      "${facts.attrs.syncGroup}": ${facts.props.syncGroup.name},\n      "${facts.attrs.value}": ${facts.props.value.name},\n      "${facts.attrs.ariaDisabled}": !${facts.props.nativeButton.name} && ${facts.props.disabled.name} ? "true" : undefined,\n      "${facts.attrs.ariaState}": rendered${facts.state.pascalName},\n      "${facts.attrs.disabled}": ${facts.props.disabled.name} ? "" : undefined,\n      "${facts.attrs.truthyPresence}": rendered${facts.state.pascalName} ? "" : undefined,\n      "${facts.attrs.state}": rendered${facts.state.pascalName} ? "on" : "off",\n      "${facts.attrs.falsyPresence}": !rendered${facts.state.pascalName} ? "" : undefined,\n      role: !${facts.props.nativeButton.name} ? "button" : undefined,\n      tabIndex: !${facts.props.nativeButton.name} ? (${facts.props.disabled.name} ? -1 : 0) : undefined,\n    };\n\n    if (${facts.props.nativeButton.name}) {\n      return (\n        <${facts.part.defaultElement}\n          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}\n          {...commonProps}\n          disabled={${facts.props.disabled.name}}\n          ref={composedRef as React.Ref<HTMLButtonElement>}\n          type="button"\n          value={${facts.props.value.name}}\n        >\n          {children}\n        </${facts.part.defaultElement}>\n      );\n    }\n\n    return (\n      <${facts.render.nonNativeElement}\n        {...(props as React.HTMLAttributes<${facts.render.nonNativeElementType}>)}\n        {...commonProps}\n        ref={composedRef as React.Ref<${facts.render.nonNativeElementType}>}\n      >\n        {children}\n      </${facts.render.nonNativeElement}>\n    );\n  },\n);\n\n${facts.exports.root}.displayName = "${facts.displayName}.Root";\n\nexport default ${facts.exports.root};\n\n${renderSetRefFunction()}`;
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

function renderViewportMeasurementOverflowEdgeThresholdHelpers(
  facts: AdapterViewportMeasurementFacts,
): string {
  return `function ${facts.threshold.helperName}(\n  threshold: ${facts.threshold.typeName} | undefined,\n): ${facts.threshold.attributesTypeName} {\n  if (typeof threshold === "number") {\n    const shared = ${facts.threshold.normalizeHelperName}(threshold);\n    return shared === undefined ? {} : { shared };\n  }\n\n  if (!threshold) return {};\n\n  return {\n    xEnd: "xEnd" in threshold ? ${facts.threshold.normalizeHelperName}(threshold.xEnd) : undefined,\n    xStart:\n      "xStart" in threshold ? ${facts.threshold.normalizeHelperName}(threshold.xStart) : undefined,\n    yEnd: "yEnd" in threshold ? ${facts.threshold.normalizeHelperName}(threshold.yEnd) : undefined,\n    yStart:\n      "yStart" in threshold ? ${facts.threshold.normalizeHelperName}(threshold.yStart) : undefined,\n  };\n}\n\nfunction ${facts.threshold.normalizeHelperName}(value: number | undefined): number | undefined {\n  if (value === undefined || !Number.isFinite(value)) return undefined;\n\n  return Math.max(value, 0);\n}`;
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
