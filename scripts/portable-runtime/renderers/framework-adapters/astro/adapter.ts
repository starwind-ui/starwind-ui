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
  AdapterControlledValuePresenceIndexProjection,
  AdapterDisclosurePresenceComponentProjection,
  AdapterDisclosurePresenceFacts,
  AdapterDisclosurePresenceIndexProjection,
  AdapterElementRenderNode,
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
  AdapterGroupedValueControlIndexProjection,
  AdapterHiddenInputVisualSlotComponentProjection,
  AdapterHiddenInputVisualSlotFacts,
  AdapterHiddenInputVisualSlotIndexProjection,
  AdapterImport,
  AdapterIndexFile,
  AdapterMediaStatusComponentProjection,
  AdapterMediaStatusFacts,
  AdapterMediaStatusIndexProjection,
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
  printAstroActionSurfaceComponent,
  printAstroActionSurfaceIndex,
} from "./action-surface.js";
import {
  printAstroAnchoredMenuOverlayComponent,
  printAstroAnchoredMenuOverlayIndex,
} from "./anchored-menu-overlay.js";
import {
  printAstroCompositeMenuOverlayComponent,
  printAstroCompositeMenuOverlayIndex,
} from "./composite-menu-overlay.js";
import {
  printAstroColorPickerComponent,
  printAstroColorPickerIndex,
  type AstroColorPickerComponentProjection,
  type AstroColorPickerIndexProjection,
} from "./color-picker.js";
import {
  printAstroEditableCollectionOverlayComponent,
  printAstroEditableCollectionOverlayIndex,
} from "./editable-collection-overlay.js";
import {
  printAstroEngineViewportComponent,
  printAstroEngineViewportIndex,
} from "./engine-viewport.js";
import { exportPrinter } from "./exports.js";
import {
  printAstroNativeDisabledComponent,
  printAstroNativeDisabledIndex,
} from "./native-disabled.js";
import {
  printAstroNativeInputValueComponent,
  printAstroNativeInputValueIndex,
} from "./native-input-value.js";
import {
  printAstroNotificationSystemComponent,
  printAstroNotificationSystemIndex,
} from "./notification-system.js";
import {
  printAstroOptionCollectionOverlayComponent,
  printAstroOptionCollectionOverlayIndex,
} from "./option-collection-overlay.js";
import { printAstroRangeStatusComponent, printAstroRangeStatusIndex } from "./range-status.js";
import {
  printAstroSharedViewportNavigationComponent,
  printAstroSharedViewportNavigationIndex,
} from "./shared-viewport-navigation.js";
import {
  printAstroScopedRuntimeSetupScript,
  printAstroSimpleSlottedRestPropsComponent,
} from "./shared-fragments.js";

export const astroFrameworkAdapter = defineFrameworkAdapter({
  target: "astro",
  fileExtension: ".astro",
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
      contents: printAstroComponent(file),
      path: `${file.path}${this.fileExtension}`,
    };
  },
  printHelperFile(file) {
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
    if (isAstroColorPickerIndexProjection(file.family)) {
      return {
        contents: printAstroColorPickerIndex(
          file.family as unknown as AstroColorPickerIndexProjection,
        ),
        path: file.path,
      };
    }

    if (file.family?.kind === "action-surface") {
      return {
        contents: printAstroActionSurfaceIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "boolean-form-control") {
      return {
        contents: printAstroBooleanFormControlIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "disclosure-presence") {
      return {
        contents: printAstroDisclosurePresenceIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "controlled-value-presence") {
      return {
        contents: printAstroControlledValuePresenceIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "grouped-value-control") {
      return {
        contents: printAstroGroupedValueControlIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "hidden-input-visual-slot") {
      return {
        contents: printAstroHiddenInputVisualSlotIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "file-drop-control") {
      return {
        contents: printAstroFileDropControlIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "form-field-coordinator") {
      return {
        contents: printAstroFormFieldCoordinatorIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "field-composition") {
      return {
        contents: printAstroFormControlCompositionIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "media-status") {
      return {
        contents: printAstroMediaStatusIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "native-input-value") {
      return {
        contents: printAstroNativeInputValueIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "native-disabled") {
      return {
        contents: printAstroNativeDisabledIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "viewport-measurement") {
      return {
        contents: printAstroViewportMeasurementIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "native-overlay") {
      return {
        contents: printAstroNativeOverlayIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "presence-floating-overlay") {
      return {
        contents: printAstroPresenceFloatingOverlayIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "range-status") {
      return {
        contents: printAstroRangeStatusIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "timed-floating-overlay") {
      return {
        contents: printAstroTimedFloatingOverlayIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "option-collection-overlay") {
      return {
        contents: printAstroOptionCollectionOverlayIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "composite-menu-overlay") {
      return {
        contents: printAstroCompositeMenuOverlayIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "anchored-menu-overlay") {
      return {
        contents: printAstroAnchoredMenuOverlayIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "shared-viewport-navigation") {
      return {
        contents: printAstroSharedViewportNavigationIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "sidebar") {
      return {
        contents: printAstroSidebarIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "editable-collection-overlay") {
      return {
        contents: printAstroEditableCollectionOverlayIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "engine-viewport") {
      return {
        contents: printAstroEngineViewportIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "notification-system") {
      return {
        contents: printAstroNotificationSystemIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "range-control") {
      return {
        contents: printAstroRangeControlIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "repeated-disclosure") {
      return {
        contents: printAstroRepeatedDisclosureIndex(file.family),
        path: file.path,
      };
    }

    if (file.family?.kind === "single-boolean-control") {
      return {
        contents: printAstroSingleBooleanControlIndex(file.family),
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
  normalizeAttributeName: normalizeAstroAttributeName,
  projectBooleanAttribute(attribute) {
    return attribute.value === true ? { ...attribute, value: "" } : attribute;
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

function printAstroComponent(file: AdapterComponentFile): string {
  const component = file.component;

  if (isAstroColorPickerComponentProjection(component.family)) {
    return printAstroColorPickerComponent(
      component.family as unknown as AstroColorPickerComponentProjection,
    );
  }

  if (component.family?.kind === "action-surface") {
    return printAstroActionSurfaceComponent(component.family);
  }

  if (component.family?.kind === "disclosure-presence") {
    return printAstroDisclosurePresenceComponent(component.family);
  }

  if (component.family?.kind === "controlled-value-presence") {
    return printAstroControlledValuePresenceComponent(component.family);
  }

  if (component.family?.kind === "boolean-form-control") {
    return printAstroBooleanFormControlComponent(component.family);
  }

  if (component.family?.kind === "grouped-value-control") {
    return printAstroGroupedValueControlComponent(component.family);
  }

  if (component.family?.kind === "hidden-input-visual-slot") {
    return printAstroHiddenInputVisualSlotComponent(component.family);
  }

  if (component.family?.kind === "file-drop-control") {
    return printAstroFileDropControlComponent(component.family);
  }

  if (component.family?.kind === "form-field-coordinator") {
    return printAstroFormFieldCoordinatorComponent(component.family);
  }

  if (component.family?.kind === "field-composition") {
    return printAstroFormControlCompositionComponent(component.family);
  }

  if (component.family?.kind === "media-status") {
    return printAstroMediaStatusComponent(component.family);
  }

  if (component.family?.kind === "native-input-value") {
    return printAstroNativeInputValueComponent(component.family);
  }

  if (component.family?.kind === "native-disabled") {
    return printAstroNativeDisabledComponent(component.family);
  }

  if (component.family?.kind === "viewport-measurement") {
    return printAstroViewportMeasurementComponent(component.family);
  }

  if (component.family?.kind === "native-overlay") {
    return printAstroNativeOverlayComponent(component.family);
  }

  if (component.family?.kind === "presence-floating-overlay") {
    return printAstroPresenceFloatingOverlayComponent(component.family);
  }

  if (component.family?.kind === "range-status") {
    return printAstroRangeStatusComponent(component.family);
  }

  if (component.family?.kind === "timed-floating-overlay") {
    return printAstroTimedFloatingOverlayComponent(component.family);
  }

  if (component.family?.kind === "option-collection-overlay") {
    return printAstroOptionCollectionOverlayComponent(component.family);
  }

  if (component.family?.kind === "composite-menu-overlay") {
    return printAstroCompositeMenuOverlayComponent(component.family);
  }

  if (component.family?.kind === "anchored-menu-overlay") {
    return printAstroAnchoredMenuOverlayComponent(component.family);
  }

  if (component.family?.kind === "shared-viewport-navigation") {
    return printAstroSharedViewportNavigationComponent(component.family);
  }

  if (component.family?.kind === "sidebar") {
    return printAstroSidebarComponent(component.family);
  }

  if (component.family?.kind === "editable-collection-overlay") {
    return printAstroEditableCollectionOverlayComponent(component.family);
  }

  if (component.family?.kind === "engine-viewport") {
    return printAstroEngineViewportComponent(component.family);
  }

  if (component.family?.kind === "notification-system") {
    return printAstroNotificationSystemComponent(component.family);
  }

  if (component.family?.kind === "range-control") {
    return printAstroRangeControlComponent(component.family);
  }

  if (component.family?.kind === "repeated-disclosure") {
    return printAstroRepeatedDisclosureComponent(component.family);
  }

  if (component.family?.kind === "single-boolean-control") {
    return printAstroSingleBooleanControlComponent(component.family);
  }

  return [
    "---",
    printImports(component.imports),
    printAstroPropsType(component),
    printAstroPropsDestructure(component),
    "---",
    printAstroContextMarkers(component.context),
    printAstroRenderNode(component.render),
    printAstroPortals(component.portals),
    printAstroRuntimeScript(component),
  ]
    .filter(Boolean)
    .join("\n");
}

function isAstroColorPickerComponentProjection(
  family: AdapterComponentModel["family"] | undefined,
): boolean {
  return (family as { kind?: string } | undefined)?.kind === "astro-color-picker";
}

function isAstroColorPickerIndexProjection(
  family: AdapterIndexFile["family"] | undefined,
): boolean {
  return (family as { kind?: string } | undefined)?.kind === "astro-color-picker";
}

function printAstroBooleanFormControlComponent(
  family: AdapterBooleanFormControlComponentProjection,
): string {
  if (family.part === "state-indicator") {
    return printAstroBooleanFormControlStateIndicator(family.facts);
  }

  return printAstroBooleanFormControlRoot(family.facts);
}

function printAstroBooleanFormControlRoot(facts: AdapterBooleanFormControlFacts): string {
  if (facts.behavior.hasIndeterminate) {
    return printAstroBooleanFormControlIndeterminateRoot(facts);
  }

  if (facts.behavior.groupStrategy === "value-equals") {
    return printAstroBooleanFormControlRequiredValueRoot(facts);
  }

  return printAstroBooleanFormControlExternalInputRoot(facts);
}

function printAstroRangeControlComponent(family: AdapterRangeControlComponentProjection): string {
  const facts = family.facts;

  if (family.part === "root") return printAstroRangeControlRoot(facts);
  if (family.part === "thumb") return printAstroRangeControlThumb(facts);

  return printAstroRangeControlSimplePart(facts, family.part);
}

function printAstroRangeControlRoot(facts: AdapterRangeControlFacts): string {
  const props = facts.props;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype ${facts.serializer.valueType} = ${facts.serializer.scalarType} | ${facts.serializer.arrayType};\ntype ${props.orientation.type} = "horizontal" | "vertical";\n\ninterface Props extends Omit<HTMLAttributes<"${facts.parts.root.defaultElement}">, "${props.defaultValue.name}" | "onChange"> {\n  ${props.defaultValue.name}?: ${facts.serializer.valueType};\n  ${props.disabled.name}?: ${props.disabled.type};\n  ${props.form.name}?: ${props.form.type};\n  ${props.largeStep.name}?: ${props.largeStep.type};\n  ${props.max.name}?: ${props.max.type};\n  ${props.min.name}?: ${props.min.type};\n  ${props.minStepsBetweenValues.name}?: ${props.minStepsBetweenValues.type};\n  ${props.name.name}?: ${props.name.type};\n  ${props.orientation.name}?: ${props.orientation.type};\n  ${props.step.name}?: ${props.step.type};\n  ${props.value.name}?: ${facts.serializer.valueType};\n}\n\nconst {\n  ${props.defaultValue.name} = ${props.defaultValue.defaultValue},\n  ${props.disabled.name} = ${props.disabled.defaultValue},\n  ${props.form.name},\n  ${props.largeStep.name} = ${props.largeStep.defaultValue},\n  ${props.max.name} = ${props.max.defaultValue},\n  ${props.min.name} = ${props.min.defaultValue},\n  ${props.minStepsBetweenValues.name} = ${props.minStepsBetweenValues.defaultValue},\n  ${props.name.name},\n  ${props.orientation.name} = ${props.orientation.defaultValue},\n  ${props.step.name} = ${props.step.defaultValue},\n  ${props.value.name},\n  ...rest\n} = Astro.props;\nconst initialValue = ${props.value.name} ?? ${props.defaultValue.name};\nconst valueAttribute = Array.isArray(initialValue) ? JSON.stringify(initialValue) : String(initialValue);\nconst defaultValueAttribute = Array.isArray(${props.defaultValue.name}) ? JSON.stringify(${props.defaultValue.name}) : String(${props.defaultValue.name});\n---\n\n<${facts.parts.root.defaultElement}\n  {...rest}\n  ${facts.attrs.root}\n  ${facts.attrs.defaultValue}={defaultValueAttribute}\n  ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n  ${facts.attrs.form}={${props.form.name}}\n  ${facts.attrs.largeStep}={${props.largeStep.name}}\n  ${facts.attrs.max}={${props.max.name}}\n  ${facts.attrs.min}={${props.min.name}}\n  ${facts.attrs.minStepsBetweenValues}={${props.minStepsBetweenValues.name}}\n  ${facts.attrs.name}={${props.name.name}}\n  ${facts.attrs.orientation}={${props.orientation.name}}\n  ${facts.attrs.step}={${props.step.name}}\n  ${facts.attrs.value}={valueAttribute}\n  role="${facts.rootRole}"\n>\n  <slot />\n</${facts.parts.root.defaultElement}>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${facts.runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.attrs.root}]").forEach((root) => ${facts.runtime.factory}(root));\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printAstroRangeControlSimplePart(
  facts: AdapterRangeControlFacts,
  partName: Exclude<AdapterRangeControlComponentProjection["part"], "root" | "thumb">,
): string {
  const part = facts.parts[partName];
  const attribute = facts.attrs[partName];

  return printAstroSimpleSlottedRestPropsComponent({
    attributes: [attribute],
    defaultElement: part.defaultElement,
  });
}

function printAstroRangeControlThumb(facts: AdapterRangeControlFacts): string {
  const part = facts.parts.thumb;
  const props = facts.props;
  const inputTabIndexAttribute = normalizeAstroAttributeName(facts.attrs.inputTabIndex);

  return `---
import type { HTMLAttributes } from "astro/types";

interface Props extends HTMLAttributes<"${part.defaultElement}"> {
  ${props.index.name}?: ${props.index.type};
}

const { ${props.index.name}, ...rest } = Astro.props;

const visuallyHiddenStyle =
  "position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;";
---

<${part.defaultElement} ${facts.attrs.thumb} ${facts.attrs.index}={${props.index.name}} {...rest}>
  <slot />
  <input
    ${facts.attrs.input}
    ${facts.attrs.inputAriaHidden}="${facts.thumbInput.hiddenRangeInput.ariaHiddenValue}"
    style={visuallyHiddenStyle}
    ${inputTabIndexAttribute}={${facts.thumbInput.hiddenRangeInput.tabIndexValue}}
    ${facts.attrs.inputType}="${facts.thumbInput.hiddenRangeInput.typeValue}"
  />
</${part.defaultElement}>
`;
}

function printAstroRangeControlIndex(family: AdapterRangeControlIndexProjection): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.astro";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const namedExports = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ];

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n  ${namedExports.join(",\n  ")},\n};\n\nexport default ${facts.exports.namespace};\n\n${exportPrinter.printRuntimeTypeReExport({ names: facts.index.typeExports, source: facts.runtime.typeImportSource })}\n`;
}

function printAstroHiddenInputVisualSlotComponent(
  family: AdapterHiddenInputVisualSlotComponentProjection,
): string {
  const facts = normalizeAstroHiddenInputVisualSlotFacts(family.facts);

  if (family.part === "root") return printAstroHiddenInputVisualSlotRoot(facts);
  if (family.part === "slot") return printAstroHiddenInputVisualSlotSlot(facts);
  if (family.part === "separator") return printAstroHiddenInputVisualSlotSeparator(facts);

  return printAstroHiddenInputVisualSlotGroup(facts);
}

function normalizeAstroHiddenInputVisualSlotFacts(
  facts: AdapterHiddenInputVisualSlotFacts,
): AdapterHiddenInputVisualSlotFacts {
  return {
    ...facts,
    attrs: Object.fromEntries(
      Object.entries(facts.attrs).map(([key, value]) => [key, normalizeAstroAttributeName(value)]),
    ) as AdapterHiddenInputVisualSlotFacts["attrs"],
  };
}

function printAstroHiddenInputVisualSlotRoot(facts: AdapterHiddenInputVisualSlotFacts): string {
  const props = facts.props;
  const root = facts.parts.root;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ninterface Props extends Omit<HTMLAttributes<"${root.defaultElement}">, "${props.defaultValue.name}" | "id" | "pattern" | "${props.value.name}"> {\n  ${props.defaultValue.name}?: ${props.defaultValue.type};\n  ${props.disabled.name}?: ${props.disabled.type};\n  ${props.form.name}?: ${props.form.type};\n  ${props.id.name}?: ${props.id.type};\n  ${props.maxLength.name}?: ${props.maxLength.type};\n  ${props.name.name}?: ${props.name.type};\n  ${props.pattern.name}?: ${props.pattern.type};\n  ${props.readOnly.name}?: ${props.readOnly.type};\n  ${props.required.name}?: ${props.required.type};\n  ${props.value.name}?: ${props.value.type};\n}\n\nconst {\n  ${props.defaultValue.name},\n  ${props.disabled.name} = ${props.disabled.defaultValue},\n  ${props.form.name},\n  ${props.id.name},\n  ${props.maxLength.name} = ${props.maxLength.defaultValue},\n  ${props.name.name},\n  ${props.pattern.name},\n  ${props.readOnly.name} = ${props.readOnly.defaultValue},\n  ${props.required.name} = ${props.required.defaultValue},\n  ${props.value.name},\n  ...rest\n} = Astro.props;\n\nconst patternText = normalizePattern(${props.pattern.name});\nconst initialValue = ${props.value.name} ?? ${props.defaultValue.name} ?? "";\nconst inputMode = isNumericPattern(patternText) ? "numeric" : "text";\n\nfunction normalizePattern(pattern: RegExp | string | undefined): string {\n  const source = pattern instanceof RegExp ? pattern.source : pattern;\n  return (source ?? "${escapeStringLiteral(facts.pattern.defaultPattern)}").replace(/^\\^|\\$$/g, "");\n}\n\nfunction isNumericPattern(pattern: string): boolean {\n  return ${JSON.stringify(facts.pattern.numericPatternExamples)}.includes(pattern);\n}\n---\n\n<${root.defaultElement}\n  ${facts.attrs.root}\n  ${facts.attrs.defaultValue}={${props.defaultValue.name}}\n  ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n  ${facts.attrs.form}={${props.form.name}}\n  ${facts.attrs.id}={${props.id.name}}\n  ${facts.attrs.maxLength}={${props.maxLength.name}}\n  ${facts.attrs.name}={${props.name.name}}\n  ${facts.attrs.pattern}={patternText}\n  ${facts.attrs.readOnly}={${props.readOnly.name} ? "" : undefined}\n  ${facts.attrs.required}={${props.required.name} ? "" : undefined}\n  ${facts.attrs.value}={initialValue}\n  ${facts.attrs.ariaDisabled}={${props.disabled.name} ? "true" : "false"}\n  ${facts.attrs.rootTabIndex}={${props.disabled.name} ? -1 : 0}\n  {...rest}\n>\n  <${facts.parts.input.defaultElement}\n    ${facts.attrs.input}\n    ${facts.attrs.inputAutocomplete}="${facts.nativeInput.autocompleteValue}"\n    ${facts.attrs.inputClass}="${facts.nativeInput.hiddenClassValue}"\n    disabled={${props.disabled.name}}\n    form={${props.form.name}}\n    id={${props.id.name}}\n    ${facts.attrs.inputMode}={inputMode}\n    ${facts.attrs.inputMaxLength}={${props.maxLength.name}}\n    name={${props.name.name}}\n    ${facts.attrs.inputReadOnly}={${props.readOnly.name}}\n    required={${props.required.name}}\n    ${facts.attrs.inputTabIndex}="${facts.nativeInput.tabIndexValue}"\n    value={initialValue}\n  />\n  <slot />\n</${root.defaultElement}>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${facts.runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.attrs.root}]").forEach((root) => ${facts.runtime.factory}(root));\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printAstroHiddenInputVisualSlotGroup(facts: AdapterHiddenInputVisualSlotFacts): string {
  const part = facts.parts.group;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.group} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroHiddenInputVisualSlotSlot(facts: AdapterHiddenInputVisualSlotFacts): string {
  const props = facts.props;
  const part = facts.parts.slot;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${props.index.name}?: ${props.index.type};\n};\n\nconst { ${props.index.name}, ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.slot} ${facts.attrs.slotIndex}={${props.index.name}} {...rest}>\n  <${facts.parts.slotChar.defaultElement} ${facts.attrs.slotChar}></${facts.parts.slotChar.defaultElement}>\n  <${facts.parts.slotCaret.defaultElement}\n    ${facts.attrs.slotCaret}\n    ${facts.attrs.slotCaretClass}="${facts.visualSlots.slotCaret.classValue}"\n    ${facts.attrs.slotCaretHidden}\n  >\n    <slot name="${facts.visualSlots.caretRendering.outletName}">\n      <div class="animate-caret-blink bg-foreground h-4 w-px duration-1000"></div>\n    </slot>\n  </${facts.parts.slotCaret.defaultElement}>\n</${part.defaultElement}>\n`;
}

function printAstroHiddenInputVisualSlotSeparator(
  facts: AdapterHiddenInputVisualSlotFacts,
): string {
  const part = facts.parts.separator;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.separator} ${facts.attrs.separatorAriaHidden}="${facts.visualSlots.separator.ariaHiddenValue}" role="${facts.visualSlots.separator.role}" {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroHiddenInputVisualSlotIndex(
  family: AdapterHiddenInputVisualSlotIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.astro";`)
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

function printAstroFileDropControlComponent(
  family: AdapterFileDropControlComponentProjection,
): string {
  const facts = normalizeAstroFileDropControlFacts(family.facts);

  if (family.part === "root") return printAstroFileDropControlRoot(facts);
  if (family.part === "input") return printAstroFileDropControlInput(facts);
  if (family.part === "uploadIndicator") return printAstroFileDropControlUploadIndicator(facts);
  if (family.part === "loadingIndicator") return printAstroFileDropControlLoadingIndicator(facts);

  return printAstroFileDropControlFilesList(facts);
}

function normalizeAstroFileDropControlFacts(
  facts: AdapterFileDropControlFacts,
): AdapterFileDropControlFacts {
  return {
    ...facts,
    attrs: Object.fromEntries(
      Object.entries(facts.attrs).map(([key, value]) => [key, normalizeAstroAttributeName(value)]),
    ) as AdapterFileDropControlFacts["attrs"],
  };
}

function printAstroFileDropControlRoot(facts: AdapterFileDropControlFacts): string {
  const props = facts.props;
  const root = facts.parts.root;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${root.defaultElement}"> & {\n  ${props.disabled.name}?: ${props.disabled.type};\n  ${props.isUploading.name}?: ${props.isUploading.type};\n};\n\nconst { ${props.disabled.name} = ${props.disabled.defaultValue}, ${props.isUploading.name} = ${props.isUploading.defaultValue}, ...rest } = Astro.props;\n---\n\n<${root.defaultElement}\n  ${facts.attrs.root}\n  ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n  ${facts.attrs.dragActive}="false"\n  ${facts.attrs.hasFiles}="false"\n  ${facts.attrs.isUploading}={${props.isUploading.name} ? "true" : "false"}\n  ${facts.attrs.ariaDisabled}={${props.disabled.name} ? "true" : "false"}\n  ${facts.attrs.role}="${root.role}"\n  ${facts.attrs.inputTabIndex}={${props.disabled.name} ? -1 : 0}\n  {...rest}\n>\n  <slot />\n</${root.defaultElement}>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${facts.runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.attrs.root}]").forEach((root) => ${facts.runtime.factory}(root));\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printAstroFileDropControlInput(facts: AdapterFileDropControlFacts): string {
  const props = facts.props;
  const input = facts.parts.input;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = Omit<HTMLAttributes<"${input.defaultElement}">, "children" | "${facts.attrs.inputType}">;\n\nconst { ${props.disabled.name} = ${props.disabled.defaultValue}, class: className, ...rest } = Astro.props;\n---\n\n<${input.defaultElement}\n  {...rest}\n  ${facts.attrs.input}\n  ${facts.attrs.inputType}="${facts.fileInput.typeValue}"\n  ${facts.attrs.inputTabIndex}={${Number(facts.fileInput.tabIndexValue)}}\n  ${facts.attrs.inputClass}:list={["${facts.fileInput.hiddenClassValue}", className]}\n  ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n  ${facts.fileInput.disabledForwardedAttribute}={${props.disabled.name}}\n/>\n`;
}

function printAstroFileDropControlUploadIndicator(facts: AdapterFileDropControlFacts): string {
  const props = facts.props;
  const part = facts.parts.uploadIndicator;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${props.isUploading.name}?: ${props.isUploading.type};\n};\n\nconst { ${props.isUploading.name} = ${props.isUploading.defaultValue}, ...rest } = Astro.props;\n---\n\n<${part.defaultElement}\n  {...rest}\n  ${facts.attrs.uploadIndicator}\n  ${facts.attrs.isUploading}={${props.isUploading.name} ? "true" : "false"}\n  hidden={${props.isUploading.name}}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroFileDropControlLoadingIndicator(facts: AdapterFileDropControlFacts): string {
  const props = facts.props;
  const part = facts.parts.loadingIndicator;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${props.isUploading.name}?: ${props.isUploading.type};\n};\n\nconst { ${props.isUploading.name} = ${props.isUploading.defaultValue}, ...rest } = Astro.props;\n---\n\n<${part.defaultElement}\n  {...rest}\n  ${facts.attrs.loadingIndicator}\n  ${facts.attrs.isUploading}={${props.isUploading.name} ? "true" : "false"}\n  hidden={!${props.isUploading.name}}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroFileDropControlFilesList(facts: AdapterFileDropControlFacts): string {
  const part = facts.parts.filesList;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.filesList} ${facts.fileList.stateAttribute}="${facts.fileList.emptyInitialState}" {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroFileDropControlIndex(family: AdapterFileDropControlIndexProjection): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.astro";`)
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

function printAstroFormFieldCoordinatorComponent(
  family: AdapterFormFieldCoordinatorComponentProjection,
): string {
  if (family.part === "root") {
    return printAstroFormFieldCoordinatorRoot(family.facts);
  }

  return printAstroFormFieldCoordinatorErrorSummary(family.facts);
}

function printAstroFormFieldCoordinatorRoot(facts: AdapterFormFieldCoordinatorFacts): string {
  const part = facts.parts.root;
  const dataErrorVisibility = toAttributeVariableName(facts.attrs.errorVisibility);
  const dataRevalidationTiming = toAttributeVariableName(facts.attrs.revalidationTiming);
  const dataValidationTiming = toAttributeVariableName(facts.attrs.validationTiming);
  const errorVisibility = facts.props.errorVisibility.name;
  const revalidationTiming = facts.props.revalidationTiming.name;
  const validationTiming = facts.props.validationTiming.name;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype ${facts.runtime.validationTimingType} = import("${facts.runtime.importSource}").${facts.runtime.validationTimingType};\n\ninterface Props extends HTMLAttributes<"${part.defaultElement}"> {\n  "${facts.attrs.errorVisibility}"?: ${facts.runtime.validationTimingType};\n  "${facts.attrs.revalidationTiming}"?: ${facts.runtime.validationTimingType};\n  "${facts.attrs.validationTiming}"?: ${facts.runtime.validationTimingType};\n  ${errorVisibility}?: ${facts.props.errorVisibility.type};\n  ${revalidationTiming}?: ${facts.props.revalidationTiming.type};\n  ${validationTiming}?: ${facts.props.validationTiming.type};\n}\n\nconst {\n  "${facts.attrs.errorVisibility}": ${dataErrorVisibility},\n  "${facts.attrs.revalidationTiming}": ${dataRevalidationTiming},\n  "${facts.attrs.validationTiming}": ${dataValidationTiming},\n  ${errorVisibility},\n  ${revalidationTiming},\n  ${validationTiming},\n  ...rest\n} = Astro.props;\n\n---\n\n<${part.defaultElement}\n  ${facts.attrs.root}\n  ${facts.attrs.rootSlot}="${part.slotValue}"\n  ${facts.attrs.errorVisibility}={${dataErrorVisibility} ?? ${errorVisibility}}\n  ${facts.attrs.revalidationTiming}={${dataRevalidationTiming} ?? ${revalidationTiming}}\n  ${facts.attrs.validationTiming}={${dataValidationTiming} ?? ${validationTiming}}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${facts.runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.attrs.root}]").forEach((${facts.runtime.rootVariable}) =>\n      ${facts.runtime.factory}(${facts.runtime.rootVariable}),\n    );\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printAstroFormFieldCoordinatorErrorSummary(
  facts: AdapterFormFieldCoordinatorFacts,
): string {
  const part = facts.parts.errorSummary;
  const ariaAtomic = toAttributeVariableName(facts.attrs.errorSummaryAriaAtomic);
  const ariaLive = toAttributeVariableName(facts.attrs.errorSummaryAriaLive);

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ninterface Props extends HTMLAttributes<"${part.defaultElement}"> {}\n\nconst {\n  ${facts.attrs.errorSummaryHidden} = true,\n  ${facts.attrs.errorSummaryRole} = "status",\n  "${facts.attrs.errorSummaryAriaLive}": ${ariaLive} = "polite",\n  "${facts.attrs.errorSummaryAriaAtomic}": ${ariaAtomic} = "true",\n  ...rest\n} = Astro.props;\n\n---\n\n<${part.defaultElement}\n  ${facts.attrs.errorSummary}\n  ${facts.attrs.errorSummarySlot}="${part.slotValue}"\n  ${facts.attrs.errorSummaryRole}={${facts.attrs.errorSummaryRole}}\n  ${facts.attrs.errorSummaryAriaLive}={${ariaLive}}\n  ${facts.attrs.errorSummaryAriaAtomic}={${ariaAtomic}}\n  ${facts.attrs.errorSummaryHidden}={${facts.attrs.errorSummaryHidden}}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroFormFieldCoordinatorIndex(
  family: AdapterFormFieldCoordinatorIndexProjection,
): string {
  const facts = family.facts;

  return `import ${facts.exports.errorSummary} from "./${facts.exports.errorSummary}.astro";\nimport ${facts.exports.root} from "./${facts.exports.root}.astro";\n\nconst ${facts.exports.namespace} = {\n  ErrorSummary: ${facts.exports.errorSummary},\n  Root: ${facts.exports.root},\n};\n\nexport { ${facts.exports.namespace}, ${facts.exports.errorSummary}, ${facts.exports.root} };\n\nexport default ${facts.exports.namespace};\n\nexport type {\n  ${facts.runtime.typeExports.join(",\n  ")},\n} from "${facts.runtime.typeImportSource}";\nexport {\n  ${facts.runtime.helperExports.join(",\n  ")},\n} from "${facts.runtime.importSource}";\n`;
}

function printAstroFormControlCompositionComponent(
  family: AdapterFormControlCompositionComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printAstroFormControlCompositionRoot(facts);
  if (family.part === "control") return printAstroFormControlCompositionControl(facts);
  if (family.part === "error") return printAstroFormControlCompositionError(facts);
  if (family.part === "validity") return printAstroFormControlCompositionValidity(facts);
  if (family.part === "label") {
    return printAstroFormControlCompositionLabel(facts.parts.label, facts.attrs.label);
  }

  return printAstroFormControlCompositionSimplePart(
    facts.parts[family.part],
    facts.attrs[family.part],
  );
}

function printAstroFormControlCompositionRoot(facts: AdapterFormControlCompositionFacts): string {
  const part = facts.parts.root;
  const dirty = facts.rootState.dirty.prop.name;
  const disabled = facts.rootState.disabled.prop.name;
  const invalid = facts.rootState.invalid.prop.name;
  const name = facts.rootState.name.prop.name;
  const touched = facts.rootState.touched.prop.name;
  const errorVisibility = facts.formTiming.errorVisibility.prop.name;
  const revalidationTiming = facts.formTiming.revalidationTiming.prop.name;
  const validationTiming = facts.formTiming.validationTiming.prop.name;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype ${facts.formTiming.typeImport.name} = import("${facts.formTiming.typeImport.importSource}").${facts.formTiming.typeImport.name};\n\ninterface Props extends Omit<HTMLAttributes<"${part.defaultElement}">, "${name}"> {\n  "${facts.formTiming.errorVisibility.attribute}"?: ${facts.formTiming.errorVisibility.prop.type};\n  "${facts.formTiming.revalidationTiming.attribute}"?: ${facts.formTiming.revalidationTiming.prop.type};\n  "${facts.formTiming.validationTiming.attribute}"?: ${facts.formTiming.validationTiming.prop.type};\n  ${dirty}?: ${facts.rootState.dirty.prop.type};\n  ${disabled}?: ${facts.rootState.disabled.prop.type};\n  ${errorVisibility}?: ${facts.formTiming.errorVisibility.prop.type};\n  ${invalid}?: ${facts.rootState.invalid.prop.type};\n  ${name}?: ${facts.rootState.name.prop.type};\n  ${revalidationTiming}?: ${facts.formTiming.revalidationTiming.prop.type};\n  ${touched}?: ${facts.rootState.touched.prop.type};\n  ${validationTiming}?: ${facts.formTiming.validationTiming.prop.type};\n}\n\nconst {\n  "${facts.formTiming.errorVisibility.attribute}": ${facts.formTiming.errorVisibility.dataPropName},\n  "${facts.formTiming.revalidationTiming.attribute}": ${facts.formTiming.revalidationTiming.dataPropName},\n  "${facts.formTiming.validationTiming.attribute}": ${facts.formTiming.validationTiming.dataPropName},\n  ${dirty} = ${facts.rootState.dirty.prop.defaultValue},\n  ${disabled} = ${facts.rootState.disabled.prop.defaultValue},\n  ${errorVisibility},\n  ${invalid} = ${facts.rootState.invalid.prop.defaultValue},\n  ${name},\n  ${revalidationTiming},\n  ${touched} = ${facts.rootState.touched.prop.defaultValue},\n  ${validationTiming},\n  ...rest\n} = Astro.props;\n\n---\n\n<${part.defaultElement}\n  ${facts.attrs.root}\n  ${facts.attrs.dirty}={${dirty} ? "" : undefined}\n  ${facts.attrs.disabled}={${disabled} ? "" : undefined}\n  ${facts.formTiming.errorVisibility.attribute}={${facts.formTiming.errorVisibility.dataPropName} ?? ${errorVisibility}}\n  ${facts.attrs.invalid}={${invalid} ? "" : undefined}\n  ${facts.attrs.name}={${name}}\n  ${facts.formTiming.revalidationTiming.attribute}={${facts.formTiming.revalidationTiming.dataPropName} ?? ${revalidationTiming}}\n  ${facts.attrs.touched}={${touched} ? "" : undefined}\n  ${facts.formTiming.validationTiming.attribute}={${facts.formTiming.validationTiming.dataPropName} ?? ${validationTiming}}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${facts.runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.attrs.root}]").forEach((field) => ${facts.runtime.factory}(field));\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printAstroFormControlCompositionControl(
  facts: AdapterFormControlCompositionFacts,
): string {
  const part = facts.parts.control;
  const disabled = facts.control.disabledProp.name;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype ${facts.control.valueTypeName} = ${facts.control.valueType};\n\ninterface Props extends Omit<HTMLAttributes<"${part.defaultElement}">, "children" | "defaultValue" | "value"> {\n  defaultValue?: ${facts.control.valueTypeName};\n  value?: ${facts.control.valueTypeName};\n}\n\nconst { defaultValue, ${disabled} = ${facts.control.disabledProp.defaultValue}, value, ...rest } = Astro.props;\n\n---\n\n<${part.defaultElement}\n  ${facts.attrs.control}\n  ${facts.attrs.input}\n  ${facts.control.disabledAttribute}={${disabled} ? "" : undefined}\n  ${facts.control.disabledForwardedAttribute}={${disabled}}\n  value={value ?? defaultValue}\n  {...rest}\n/>\n`;
}

function printAstroFormControlCompositionLabel(
  part: AdapterFormControlCompositionFacts["parts"]["label"],
  discoveryAttribute: string,
): string {
  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { for: htmlFor, ...rest } = Astro.props;\n\n---\n\n<${part.defaultElement} ${discoveryAttribute} for={htmlFor} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroFormControlCompositionSimplePart(
  part: AdapterFormControlCompositionFacts["parts"]["description"],
  discoveryAttribute: string,
): string {
  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n\n---\n\n<${part.defaultElement} ${discoveryAttribute} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroFormControlCompositionError(facts: AdapterFormControlCompositionFacts): string {
  const part = facts.parts.error;
  const match = facts.message.error.matchProp.name;
  const messageSource = facts.message.error.messageSource.prop.name;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype ${facts.message.matchType} =\n${renderFormControlCompositionMatchUnion(facts.message.matchValues)};\n\ntype ${facts.message.error.messageSource.typeName} = ${facts.message.error.messageSource.prop.type};\n\ninterface Props extends HTMLAttributes<"${part.defaultElement}"> {\n  ${match}?: ${facts.message.matchType};\n  ${messageSource}?: ${facts.message.error.messageSource.typeName};\n}\n\nconst {\n  hidden = ${facts.message.error.hiddenDefault},\n  ${match} = ${facts.message.error.matchDefault},\n  ${messageSource},\n  ...rest\n} = Astro.props;\nconst serializedMatch = typeof ${match} === "boolean" ? String(${match}) : ${match};\n\n---\n\n<${part.defaultElement}\n  ${facts.attrs.error}\n  ${facts.message.error.matchAttribute}={serializedMatch}\n  ${facts.message.error.messageSource.attribute}={${messageSource}}\n  hidden={hidden}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroFormControlCompositionValidity(
  facts: AdapterFormControlCompositionFacts,
): string {
  const part = facts.parts.validity;
  const match = facts.message.validity.matchProp.name;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype ${facts.message.matchType} =\n${renderFormControlCompositionMatchUnion(facts.message.matchValues)};\n\ninterface Props extends HTMLAttributes<"${part.defaultElement}"> {\n  ${match}?: ${facts.message.matchType};\n}\n\nconst { hidden = ${facts.message.validity.hiddenDefault}, ${match} = ${facts.message.validity.matchDefault}, ...rest } = Astro.props;\nconst serializedMatch = typeof ${match} === "boolean" ? String(${match}) : ${match};\n\n---\n\n<${part.defaultElement} ${facts.attrs.validity} ${facts.message.validity.matchAttribute}={serializedMatch} hidden={hidden} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroFormControlCompositionIndex(
  family: AdapterFormControlCompositionIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.astro";`)
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

function printAstroNativeOverlayComponent(family: AdapterNativeOverlayComponentProjection): string {
  const facts = family.facts;

  if (family.part === "root") return printAstroNativeOverlayRoot(facts);
  if (family.part === "trigger") return printAstroNativeOverlayTrigger(facts);
  if (family.part === "backdrop") return printAstroNativeOverlayBackdrop(facts);
  if (family.part === "popup") return printAstroNativeOverlayPopup(facts);
  if (family.part === "title") {
    return printAstroNativeOverlaySimplePart(facts.parts.title, facts.attrs.title);
  }
  if (family.part === "description") {
    return printAstroNativeOverlaySimplePart(facts.parts.description, facts.attrs.description);
  }
  if (family.part === "close") return printAstroNativeOverlayClose(facts);
  if (family.part === "portal" && facts.parts.portal) {
    return printAstroNativeOverlaySimplePart(facts.parts.portal, facts.attrs.portal);
  }
  if (family.part === "viewport" && facts.parts.viewport) {
    return printAstroNativeOverlaySimplePart(facts.parts.viewport, facts.attrs.viewport);
  }

  throw new Error(`${facts.displayName} native-overlay adapter cannot print ${family.part}.`);
}

function printAstroNativeOverlayRoot(facts: AdapterNativeOverlayFacts): string {
  const part = facts.parts.root;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${facts.props.defaultOpen.name}?: ${facts.props.defaultOpen.type};\n  ${facts.props.closeOnEscape.name}?: ${facts.props.closeOnEscape.type};\n  ${facts.props.closeOnOutsideInteract.name}?: ${facts.props.closeOnOutsideInteract.type};\n  ${facts.props.modal.name}?: ${facts.props.modal.type};\n};\n\nconst {\n  ${facts.props.defaultOpen.name} = ${facts.props.defaultOpen.defaultValue},\n  ${facts.props.closeOnEscape.name} = ${facts.props.closeOnEscape.defaultValue},\n  ${facts.props.closeOnOutsideInteract.name} = ${facts.props.closeOnOutsideInteract.defaultValue},\n  ${facts.props.modal.name} = ${facts.props.modal.defaultValue},\n  ...rest\n} = Astro.props;\n---\n\n<${part.defaultElement}\n  ${facts.attrs.root}\n  ${facts.attrs.defaultOpen}={${facts.props.defaultOpen.name} ? "true" : undefined}\n  ${facts.attrs.closeOnEscape}={${facts.props.closeOnEscape.name} ? "true" : "false"}\n  ${facts.attrs.closeOnOutsideInteract}={${facts.props.closeOnOutsideInteract.name} ? "true" : "false"}\n  ${facts.attrs.modal}={${facts.props.modal.name} ? "true" : "false"}\n  ${facts.attrs.rootState}={${facts.props.defaultOpen.name} ? "open" : "closed"}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${facts.runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.attrs.root}]").forEach((root) => ${facts.runtime.factory}(root));\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printAstroNativeOverlayTrigger(facts: AdapterNativeOverlayFacts): string {
  const part = facts.parts.trigger;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${facts.props.targetId.name}?: ${facts.props.targetId.type};\n};\n\nconst { ${facts.props.targetId.name}, ...rest } = Astro.props;\n---\n\n<${part.defaultElement}\n  ${facts.attrs.triggerType}="button"\n  ${facts.attrs.trigger}\n  ${facts.attrs.triggerAriaHaspopup}="dialog"\n  ${facts.attrs.targetId}={${facts.props.targetId.name}}\n  ${facts.attrs.triggerState}="closed"\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroNativeOverlayBackdrop(facts: AdapterNativeOverlayFacts): string {
  const part = facts.parts.backdrop;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.backdrop} ${facts.attrs.backdropState}="closed" ${facts.attrs.backdropHidden} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroNativeOverlayPopup(facts: AdapterNativeOverlayFacts): string {
  const part = facts.parts.popup;

  if (facts.props.side) {
    return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${facts.props.side.name}?: ${facts.props.side.type};\n};\n\nconst { ${facts.props.side.name} = ${facts.sideDefault}, ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.popup} ${facts.attrs.popupState}="closed" ${facts.attrs.popupSide}={${facts.props.side.name}} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
  }

  const roleAttribute =
    facts.attrs.popupRole && facts.popupRoleValue
      ? ` ${facts.attrs.popupRole}="${facts.popupRoleValue}"`
      : "";

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.popup}${roleAttribute} ${facts.attrs.popupState}="closed" {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroNativeOverlayClose(facts: AdapterNativeOverlayFacts): string {
  const part = facts.parts.close;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.closeType}="button" ${facts.attrs.close} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroNativeOverlaySimplePart(
  part: { defaultElement: string; discoveryAttribute: string },
  discoveryAttribute: string | undefined,
): string {
  if (!discoveryAttribute) {
    throw new Error(`${part.defaultElement} native-overlay part is missing discovery attribute.`);
  }

  return printAstroSimpleSlottedRestPropsComponent({
    attributes: [discoveryAttribute],
    defaultElement: part.defaultElement,
  });
}

function printAstroNativeOverlayIndex(family: AdapterNativeOverlayIndexProjection): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.astro";`)
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

function printAstroPresenceFloatingOverlayComponent(
  family: AdapterPresenceFloatingOverlayComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printAstroPresenceFloatingOverlayRoot(facts);
  if (family.part === "trigger") return printAstroPresenceFloatingOverlayTrigger(facts);
  if (family.part === "positioner") {
    return printAstroPresenceFloatingOverlayFloatingPart(
      facts.parts.positioner,
      facts.attrs.positioner,
      facts.attrs.positionerState,
      facts,
    );
  }
  if (family.part === "popup") return printAstroPresenceFloatingOverlayPopup(facts);
  if (family.part === "backdrop") return printAstroPresenceFloatingOverlayBackdrop(facts);
  if (family.part === "close") return printAstroPresenceFloatingOverlayClose(facts);
  if (family.part === "portal") {
    return printAstroPresenceFloatingOverlaySimplePart(facts.parts.portal, facts.attrs.portal);
  }
  if (family.part === "arrow") {
    return printAstroPresenceFloatingOverlaySimplePart(facts.parts.arrow, facts.attrs.arrow);
  }
  if (family.part === "title") {
    return printAstroPresenceFloatingOverlaySimplePart(facts.parts.title, facts.attrs.title);
  }
  if (family.part === "description") {
    return printAstroPresenceFloatingOverlaySimplePart(
      facts.parts.description,
      facts.attrs.description,
    );
  }
  if (family.part === "viewport") {
    return printAstroPresenceFloatingOverlaySimplePart(facts.parts.viewport, facts.attrs.viewport);
  }

  throw new Error(
    `${facts.displayName} presence-floating-overlay adapter cannot print ${family.part}.`,
  );
}

function printAstroPresenceFloatingOverlayRoot(facts: AdapterPresenceFloatingOverlayFacts): string {
  const part = facts.parts.root;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${facts.props.defaultOpen.name}?: ${facts.props.defaultOpen.type};\n  ${facts.props.closeOnEscape.name}?: ${facts.props.closeOnEscape.type};\n  ${facts.props.closeOnOutsideInteract.name}?: ${facts.props.closeOnOutsideInteract.type};\n  ${facts.props.modal.name}?: ${facts.props.modal.type};\n  ${facts.props.openOnHover.name}?: ${facts.props.openOnHover.type};\n  ${facts.props.closeDelay.name}?: ${facts.props.closeDelay.type};\n};\n\nconst {\n  ${facts.props.defaultOpen.name} = ${facts.props.defaultOpen.defaultValue},\n  ${facts.props.closeOnEscape.name} = ${facts.props.closeOnEscape.defaultValue},\n  ${facts.props.closeOnOutsideInteract.name} = ${facts.props.closeOnOutsideInteract.defaultValue},\n  ${facts.props.modal.name} = ${facts.props.modal.defaultValue},\n  ${facts.props.openOnHover.name} = ${facts.props.openOnHover.defaultValue},\n  ${facts.props.closeDelay.name} = ${facts.props.closeDelay.defaultValue},\n  ...rest\n} = Astro.props;\n---\n\n<${part.defaultElement}\n  ${facts.attrs.root}\n  ${facts.attrs.rootDefaultOpen}={${facts.props.defaultOpen.name} ? "true" : undefined}\n  ${facts.attrs.rootCloseOnEscape}={${facts.props.closeOnEscape.name} ? "true" : "false"}\n  ${facts.attrs.rootCloseOnOutsideInteract}={${facts.props.closeOnOutsideInteract.name} ? "true" : "false"}\n  ${facts.attrs.rootModal}={${facts.props.modal.name} ? "true" : "false"}\n  ${facts.attrs.rootOpenOnHover}={${facts.props.openOnHover.name} ? "true" : undefined}\n  ${facts.attrs.rootCloseDelay}={${facts.props.closeDelay.name}}\n  ${facts.attrs.rootState}={${facts.props.defaultOpen.name} ? "open" : "closed"}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${facts.runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.attrs.root}]").forEach((root) => ${facts.runtime.factory}(root));\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printAstroPresenceFloatingOverlayTrigger(
  facts: AdapterPresenceFloatingOverlayFacts,
): string {
  const part = facts.parts.trigger;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${facts.props.asChild.name}?: ${facts.props.asChild.type};\n};\n\nconst { ${facts.props.asChild.name} = false, ...rest } = Astro.props;\n---\n\n{\n  ${facts.props.asChild.name} ? (\n    <div\n      ${facts.attrs.trigger}\n      ${facts.attrs.triggerAsChild}\n      ${facts.attrs.triggerAriaHaspopup}="dialog"\n      ${facts.attrs.triggerAriaExpanded}="false"\n      ${facts.attrs.triggerState}="closed"\n      {...rest}\n    >\n      <slot />\n    </div>\n  ) : (\n    <${part.defaultElement}\n      ${facts.attrs.triggerType}="button"\n      ${facts.attrs.trigger}\n      ${facts.attrs.triggerAriaHaspopup}="dialog"\n      ${facts.attrs.triggerAriaExpanded}="false"\n      ${facts.attrs.triggerState}="closed"\n      {...rest}\n    >\n      <slot />\n    </${part.defaultElement}>\n  )\n}\n`;
}

function printAstroPresenceFloatingOverlayFloatingPart(
  part: AdapterPresenceFloatingOverlayFacts["parts"]["positioner"],
  discoveryAttribute: string,
  stateAttribute: string,
  facts: AdapterPresenceFloatingOverlayFacts,
): string {
  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${facts.props.side.name}?: ${facts.props.side.type};\n  ${facts.props.align.name}?: ${facts.props.align.type};\n  ${facts.props.sideOffset.name}?: ${facts.props.sideOffset.type};\n  ${facts.props.avoidCollisions.name}?: ${facts.props.avoidCollisions.type};\n  ${facts.props.collisionStrategy.name}?: ${facts.props.collisionStrategy.type};\n};\n\nconst {\n  ${facts.props.side.name} = ${facts.props.side.defaultValue},\n  ${facts.props.align.name} = ${facts.props.align.defaultValue},\n  ${facts.props.sideOffset.name} = ${facts.props.sideOffset.defaultValue},\n  ${facts.props.avoidCollisions.name} = ${facts.props.avoidCollisions.defaultValue},\n  ${facts.props.collisionStrategy.name} = ${facts.props.collisionStrategy.defaultValue},\n  ...rest\n} = Astro.props;\n---\n\n<${part.defaultElement}\n  ${discoveryAttribute}\n  ${stateAttribute}="closed"\n  ${facts.attrs.floatingSide}={${facts.props.side.name}}\n  ${facts.attrs.floatingAlign}={${facts.props.align.name}}\n  ${facts.attrs.floatingSideOffset}={${facts.props.sideOffset.name}}\n  ${facts.attrs.floatingAvoidCollisions}={${facts.props.avoidCollisions.name} ? "true" : "false"}\n  ${facts.attrs.floatingCollisionStrategy}={${facts.props.collisionStrategy.name}}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroPresenceFloatingOverlayPopup(
  facts: AdapterPresenceFloatingOverlayFacts,
): string {
  const part = facts.parts.popup;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${facts.props.side.name}?: ${facts.props.side.type};\n  ${facts.props.align.name}?: ${facts.props.align.type};\n  ${facts.props.sideOffset.name}?: ${facts.props.sideOffset.type};\n  ${facts.props.avoidCollisions.name}?: ${facts.props.avoidCollisions.type};\n  ${facts.props.collisionStrategy.name}?: ${facts.props.collisionStrategy.type};\n};\n\nconst {\n  ${facts.props.side.name} = ${facts.props.side.defaultValue},\n  ${facts.props.align.name} = ${facts.props.align.defaultValue},\n  ${facts.props.sideOffset.name} = ${facts.props.sideOffset.defaultValue},\n  ${facts.props.avoidCollisions.name} = ${facts.props.avoidCollisions.defaultValue},\n  ${facts.props.collisionStrategy.name} = ${facts.props.collisionStrategy.defaultValue},\n  ...rest\n} = Astro.props;\n---\n\n<${part.defaultElement}\n  ${facts.attrs.popup}\n  ${facts.attrs.popupRole}="${part.role}"\n  ${facts.attrs.popupTabindex}="-1"\n  ${facts.attrs.popupState}="closed"\n  ${facts.attrs.floatingSide}={${facts.props.side.name}}\n  ${facts.attrs.floatingAlign}={${facts.props.align.name}}\n  ${facts.attrs.floatingSideOffset}={${facts.props.sideOffset.name}}\n  ${facts.attrs.floatingAvoidCollisions}={${facts.props.avoidCollisions.name} ? "true" : "false"}\n  ${facts.attrs.floatingCollisionStrategy}={${facts.props.collisionStrategy.name}}\n  ${facts.attrs.popupHidden}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroPresenceFloatingOverlayBackdrop(
  facts: AdapterPresenceFloatingOverlayFacts,
): string {
  const part = facts.parts.backdrop;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.backdrop} ${facts.attrs.backdropState}="closed" ${facts.attrs.backdropHidden} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroPresenceFloatingOverlayClose(
  facts: AdapterPresenceFloatingOverlayFacts,
): string {
  const part = facts.parts.close;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.closeType}="button" ${facts.attrs.close} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroPresenceFloatingOverlaySimplePart(
  part: { defaultElement: string },
  discoveryAttribute: string,
): string {
  return printAstroSimpleSlottedRestPropsComponent({
    attributes: [discoveryAttribute],
    defaultElement: part.defaultElement,
  });
}

function printAstroPresenceFloatingOverlayIndex(
  family: AdapterPresenceFloatingOverlayIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.astro";`)
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

function printAstroTimedFloatingOverlayComponent(
  family: AdapterTimedFloatingOverlayComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printAstroTimedFloatingOverlayRoot(facts);
  if (family.part === "trigger") return printAstroTimedFloatingOverlayTrigger(facts);
  if (family.part === "positioner") return printAstroTimedFloatingOverlayPositioner(facts);
  if (family.part === "popup") return printAstroTimedFloatingOverlayPopup(facts);
  if (family.part === "portal") {
    return printAstroTimedFloatingOverlaySimplePart(facts.parts.portal, facts.attrs.portal);
  }
  if (family.part === "arrow") return printAstroTimedFloatingOverlayArrow(facts);
  if (family.part === "backdrop") return printAstroTimedFloatingOverlayBackdrop(facts);
  if (family.part === "viewport") return printAstroTimedFloatingOverlayViewport(facts);

  throw new Error(
    `${facts.displayName} timed-floating-overlay adapter cannot print ${family.part}.`,
  );
}

function printAstroTimedFloatingOverlayRoot(facts: AdapterTimedFloatingOverlayFacts): string {
  const part = facts.parts.root;
  const disabledPropType = facts.root.disabled
    ? `  ${facts.props.disabled.name}?: ${facts.props.disabled.type};\n`
    : "";
  const disabledDestructure = facts.root.disabled
    ? `  ${facts.props.disabled.name} = ${facts.props.disabled.defaultValue},\n`
    : "";
  const rootDisabledAttribute =
    facts.root.disabled && facts.attrs.rootDisabled
      ? `  ${facts.attrs.rootDisabled}={${facts.props.disabled.name} ? "" : undefined}\n`
      : "";
  const rootStateExpression = facts.root.disabled
    ? `!${facts.props.disabled.name} && ${facts.props.defaultOpen.name} ? "open" : "closed"`
    : `${facts.props.defaultOpen.name} ? "open" : "closed"`;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${facts.props.defaultOpen.name}?: ${facts.props.defaultOpen.type};\n  ${facts.props.closeDelay.name}?: ${facts.props.closeDelay.type};\n  ${facts.props.closeOnEscape.name}?: ${facts.props.closeOnEscape.type};\n  ${facts.props.closeOnOutsideInteract.name}?: ${facts.props.closeOnOutsideInteract.type};\n${disabledPropType}  ${facts.props.disableHoverableContent.name}?: ${facts.props.disableHoverableContent.type};\n  ${facts.props.openDelay.name}?: ${facts.props.openDelay.type};\n};\n\nconst {\n  ${facts.props.defaultOpen.name} = ${facts.props.defaultOpen.defaultValue},\n  ${facts.props.closeDelay.name} = ${facts.props.closeDelay.defaultValue},\n  ${facts.props.closeOnEscape.name} = ${facts.props.closeOnEscape.defaultValue},\n  ${facts.props.closeOnOutsideInteract.name} = ${facts.props.closeOnOutsideInteract.defaultValue},\n${disabledDestructure}  ${facts.props.disableHoverableContent.name} = ${facts.props.disableHoverableContent.defaultValue},\n  ${facts.props.openDelay.name} = ${facts.props.openDelay.defaultValue},\n  ...rest\n} = Astro.props;\n---\n\n<${part.defaultElement}\n  ${facts.attrs.root}\n  ${facts.attrs.rootDefaultOpen}={${facts.props.defaultOpen.name} ? "true" : undefined}\n  ${facts.attrs.rootCloseDelay}={${facts.props.closeDelay.name}}\n  ${facts.attrs.rootCloseOnEscape}={${facts.props.closeOnEscape.name} ? "true" : "false"}\n  ${facts.attrs.rootCloseOnOutsideInteract}={${facts.props.closeOnOutsideInteract.name} ? "true" : "false"}\n  ${facts.attrs.rootContentHoverable}={!${facts.props.disableHoverableContent.name} ? "true" : "false"}\n${rootDisabledAttribute}  ${facts.attrs.rootOpenDelay}={${facts.props.openDelay.name}}\n  ${facts.attrs.rootState}={${rootStateExpression}}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const ${facts.runtime.setupFunction} = () => {\n    document\n      .querySelectorAll<HTMLElement>("[${facts.attrs.root}]")\n      .forEach((root) => ${facts.runtime.factory}(root));\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printAstroTimedFloatingOverlayTrigger(facts: AdapterTimedFloatingOverlayFacts): string {
  const part = facts.parts.trigger;

  if (facts.trigger.triggerKind === "anchor") {
    return printAstroTimedFloatingOverlayAnchorTrigger(facts);
  }

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${facts.props.asChild.name}?: ${facts.props.asChild.type};\n  ${facts.props.disabled.name}?: ${facts.props.disabled.type};\n};\n\nconst { ${facts.props.asChild.name} = false, ${facts.props.disabled.name} = false, ...rest } = Astro.props;\n---\n\n{\n  ${facts.props.asChild.name} ? (\n    <span\n      ${facts.attrs.trigger}\n      ${facts.attrs.triggerAsChild}\n      ${facts.attrs.triggerDisabled}={${facts.props.disabled.name} ? "" : undefined}\n      ${facts.attrs.triggerAriaDisabled}={${facts.props.disabled.name} ? "true" : undefined}\n      ${facts.attrs.triggerState}="closed"\n      {...rest}\n    >\n      <slot />\n    </span>\n  ) : (\n    <${part.defaultElement}\n      type="button"\n      ${facts.attrs.trigger}\n      ${facts.attrs.triggerDisabled}={${facts.props.disabled.name} ? "" : undefined}\n      ${facts.attrs.triggerAriaDisabled}={${facts.props.disabled.name} ? "true" : undefined}\n      ${facts.attrs.triggerState}="closed"\n      ${facts.attrs.triggerNativeDisabled}={${facts.props.disabled.name} ? true : undefined}\n      {...rest}\n    >\n      <slot />\n    </${part.defaultElement}>\n  )\n}\n`;
}

function printAstroTimedFloatingOverlayAnchorTrigger(
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

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.trigger.renderedElement}"> & {\n  ${facts.props.asChild.name}?: ${facts.props.asChild.type};\n  ${facts.props.closeDelay.name}?: ${facts.props.closeDelay.type};\n  ${facts.props.disabled.name}?: ${facts.props.disabled.type};\n  ${facts.props.openDelay.name}?: ${facts.props.openDelay.type};\n};\n\nconst {\n  ${facts.props.asChild.name} = false,\n  ${facts.props.closeDelay.name},\n  ${facts.props.disabled.name} = ${facts.props.disabled.defaultValue},\n  href,\n  ${facts.props.openDelay.name},\n  tabindex,\n  ...rest\n} = Astro.props;\n\nconst asChildTransferAttributes = {\n  href: ${facts.props.disabled.name} ? undefined : href,\n  tabindex: ${facts.props.disabled.name} ? -1 : tabindex,\n} as Record<string, string | number | undefined>;\n---\n\n{\n  ${facts.props.asChild.name} ? (\n    <${facts.trigger.asChildWrapperElement}\n      ${facts.attrs.trigger}\n      ${facts.attrs.triggerAsChild}\n      ${closeDelayAttribute}={${facts.props.closeDelay.name}}\n      ${facts.attrs.triggerDisabled}={${facts.props.disabled.name} ? "" : undefined}\n      ${openDelayAttribute}={${facts.props.openDelay.name}}\n      ${facts.attrs.triggerAriaDisabled}={${facts.props.disabled.name} ? "true" : undefined}\n      {...asChildTransferAttributes}\n      ${facts.attrs.triggerState}="closed"\n      {...rest}\n    >\n      <slot />\n    </${facts.trigger.asChildWrapperElement}>\n  ) : (\n    <${facts.trigger.renderedElement}\n      ${facts.attrs.trigger}\n      ${closeDelayAttribute}={${facts.props.closeDelay.name}}\n      ${facts.attrs.triggerDisabled}={${facts.props.disabled.name} ? "" : undefined}\n      ${openDelayAttribute}={${facts.props.openDelay.name}}\n      ${facts.attrs.triggerAriaDisabled}={${facts.props.disabled.name} ? "true" : undefined}\n      href={${facts.props.disabled.name} ? undefined : href}\n      tabindex={${facts.props.disabled.name} ? -1 : tabindex}\n      ${facts.attrs.triggerState}="closed"\n      {...rest}\n    >\n      <slot />\n    </${facts.trigger.renderedElement}>\n  )\n}\n`;
}

function printAstroTimedFloatingOverlayPositioner(facts: AdapterTimedFloatingOverlayFacts): string {
  return printAstroTimedFloatingOverlayFloatingPart(
    facts.parts.positioner,
    facts.attrs.positioner,
    facts.attrs.positionerState,
    facts,
  );
}

function printAstroTimedFloatingOverlayFloatingPart(
  part: AdapterTimedFloatingOverlayFacts["parts"]["positioner"],
  discoveryAttribute: string,
  stateAttribute: string,
  facts: AdapterTimedFloatingOverlayFacts,
): string {
  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${facts.props.side.name}?: ${facts.props.side.type};\n  ${facts.props.align.name}?: ${facts.props.align.type};\n  ${facts.props.sideOffset.name}?: ${facts.props.sideOffset.type};\n  ${facts.props.avoidCollisions.name}?: ${facts.props.avoidCollisions.type};\n};\n\nconst {\n  ${facts.props.side.name} = ${facts.props.side.defaultValue},\n  ${facts.props.align.name} = ${facts.props.align.defaultValue},\n  ${facts.props.sideOffset.name} = ${facts.props.sideOffset.defaultValue},\n  ${facts.props.avoidCollisions.name} = ${facts.props.avoidCollisions.defaultValue},\n  ...rest\n} = Astro.props;\n---\n\n<${part.defaultElement}\n  ${discoveryAttribute}\n  ${stateAttribute}="closed"\n  ${facts.attrs.side}={${facts.props.side.name}}\n  ${facts.attrs.align}={${facts.props.align.name}}\n  ${facts.attrs.sideOffset}={${facts.props.sideOffset.name}}\n  ${facts.attrs.avoidCollisions}={${facts.props.avoidCollisions.name} ? "true" : "false"}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroTimedFloatingOverlayPopup(facts: AdapterTimedFloatingOverlayFacts): string {
  const part = facts.parts.popup;
  const propsType = facts.popup.omitTabIndexProps
    ? `Omit<HTMLAttributes<"${part.defaultElement}">, "tabindex" | "tabIndex">`
    : `HTMLAttributes<"${part.defaultElement}">`;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = ${propsType} & {\n  ${facts.props.side.name}?: ${facts.props.side.type};\n  ${facts.props.align.name}?: ${facts.props.align.type};\n  ${facts.props.sideOffset.name}?: ${facts.props.sideOffset.type};\n  ${facts.props.avoidCollisions.name}?: ${facts.props.avoidCollisions.type};\n};\n\nconst {\n  ${facts.props.side.name} = ${facts.props.side.defaultValue},\n  ${facts.props.align.name} = ${facts.props.align.defaultValue},\n  ${facts.props.sideOffset.name} = ${facts.props.sideOffset.defaultValue},\n  ${facts.props.avoidCollisions.name} = ${facts.props.avoidCollisions.defaultValue},\n  ...rest\n} = Astro.props;\n---\n\n<${part.defaultElement}\n  ${facts.attrs.popup}\n  role="${facts.popupRole}"\n  ${facts.attrs.popupState}="closed"\n  ${facts.attrs.side}={${facts.props.side.name}}\n  ${facts.attrs.align}={${facts.props.align.name}}\n  ${facts.attrs.sideOffset}={${facts.props.sideOffset.name}}\n  ${facts.attrs.avoidCollisions}={${facts.props.avoidCollisions.name} ? "true" : "false"}\n  ${facts.attrs.popupHidden}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroTimedFloatingOverlayArrow(facts: AdapterTimedFloatingOverlayFacts): string {
  const part = facts.parts.arrow;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.arrow} ${facts.attrs.arrowState}="closed" {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroTimedFloatingOverlaySimplePart(
  part: { defaultElement: string },
  discoveryAttribute: string,
): string {
  return printAstroSimpleSlottedRestPropsComponent({
    attributes: [discoveryAttribute],
    defaultElement: part.defaultElement,
  });
}

function printAstroTimedFloatingOverlayBackdrop(facts: AdapterTimedFloatingOverlayFacts): string {
  const part = requireTimedFloatingPart(facts, "backdrop");
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

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${discoveryAttribute} ${stateAttribute}="closed" ${hiddenAttribute} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroTimedFloatingOverlayViewport(facts: AdapterTimedFloatingOverlayFacts): string {
  const part = requireTimedFloatingPart(facts, "viewport");
  const discoveryAttribute = requireTimedFloatingString(
    facts.attrs.viewport,
    `${facts.displayName} timed-floating viewport attribute.`,
  );
  const stateAttribute = requireTimedFloatingString(
    facts.attrs.viewportState,
    `${facts.displayName} timed-floating viewport state attribute.`,
  );

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${discoveryAttribute} ${stateAttribute}="closed" {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroTimedFloatingOverlayIndex(
  family: AdapterTimedFloatingOverlayIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.astro";`)
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

function printAstroSidebarComponent(family: AdapterSidebarComponentProjection): string {
  const facts = family.facts;

  if (family.part === "provider") return printAstroSidebarProvider(facts);
  if (family.part === "sidebar") return printAstroSidebarRoot(facts);
  if (family.part === "trigger") return printAstroSidebarTrigger(facts);
  if (family.part === "rail") return printAstroSidebarRail(facts);
  if (family.part === "menuButton") return printAstroSidebarMenuButton(facts);

  throw new Error(`${facts.displayName} sidebar adapter cannot print ${family.part}.`);
}

function printAstroSidebarProvider(facts: AdapterSidebarFacts): string {
  const props = facts.props;

  return `---\nimport type { ${facts.types.persistenceStorage} } from "${facts.runtime.importSource}";\nimport type { HTMLAttributes } from "astro/types";\n\ntype AstroSidebarPersistenceStorage = Extract<${facts.types.persistenceStorage}, "cookie" | "localStorage" | false>;\n\ntype Props = HTMLAttributes<"div"> & {\n  ${props.defaultOpen.name}?: ${props.defaultOpen.type};\n  ${props.defaultMobileOpen.name}?: ${props.defaultMobileOpen.type};\n  ${props.keyboardShortcut.name}?: ${props.keyboardShortcut.type};\n  ${props.mobileQuery.name}?: ${props.mobileQuery.type};\n  ${props.persistOpen.name}?: ${props.persistOpen.type};\n  ${props.persistenceKey.name}?: ${props.persistenceKey.type};\n  ${props.persistenceStorage.name}?: AstroSidebarPersistenceStorage;\n  ${props.persistenceMaxAge.name}?: ${props.persistenceMaxAge.type};\n};\n\nconst {\n  ${props.defaultOpen.name} = ${props.defaultOpen.defaultValue},\n  ${props.defaultMobileOpen.name} = ${props.defaultMobileOpen.defaultValue},\n  ${props.keyboardShortcut.name} = ${props.keyboardShortcut.defaultValue},\n  ${props.mobileQuery.name} = ${props.mobileQuery.defaultValue},\n  ${props.persistOpen.name} = ${props.persistOpen.defaultValue},\n  ${props.persistenceKey.name},\n  ${props.persistenceStorage.name},\n  ${props.persistenceMaxAge.name} = ${props.persistenceMaxAge.defaultValue},\n  ...rest\n} = Astro.props;\n---\n\n<${facts.parts.provider.defaultElement}\n  ${facts.attrs.provider}\n  ${facts.attrs.defaultOpen}={${props.defaultOpen.name} ? "true" : undefined}\n  ${facts.attrs.defaultMobileOpen}={${props.defaultMobileOpen.name} ? "true" : undefined}\n  ${facts.attrs.providerState}={${props.defaultOpen.name} ? "expanded" : "collapsed"}\n  ${facts.attrs.mobileOpen}={${props.defaultMobileOpen.name} ? "true" : "false"}\n  ${facts.attrs.keyboardShortcut}={${props.keyboardShortcut.name}}\n  ${facts.attrs.mobileQuery}={${props.mobileQuery.name}}\n  ${facts.attrs.persistOpen}={${props.persistOpen.name} ? "true" : undefined}\n  ${facts.attrs.persistenceKey}={${props.persistenceKey.name}}\n  ${facts.attrs.persistenceStorage}={${props.persistenceStorage.name} === false ? "false" : ${props.persistenceStorage.name}}\n  ${facts.attrs.persistenceMaxAge}={${props.persistenceMaxAge.name}}\n  {...rest}\n>\n  <slot />\n</${facts.parts.provider.defaultElement}>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const ${facts.runtime.setupFunction} = () => {\n    document\n      .querySelectorAll<HTMLElement>("[${facts.attrs.provider}]")\n      .forEach((provider) => ${facts.runtime.factory}(provider));\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printAstroSidebarRoot(facts: AdapterSidebarFacts): string {
  const props = facts.props;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"div"> & {\n  ${props.side.name}?: ${props.side.type};\n  ${props.variant.name}?: ${props.variant.type};\n  ${props.collapsible.name}?: ${props.collapsible.type};\n};\n\nconst { ${props.side.name} = ${props.side.defaultValue}, ${props.variant.name} = ${props.variant.defaultValue}, ${props.collapsible.name} = ${props.collapsible.defaultValue}, ...rest } = Astro.props;\n---\n\n<${facts.parts.sidebar.defaultElement}\n  ${facts.attrs.sidebar}\n  ${facts.attrs.sidebarState}="expanded"\n  ${facts.attrs.sidebarCollapsible}=""\n  ${facts.attrs.sidebarCollapsibleMode}={${props.collapsible.name}}\n  ${facts.attrs.sidebarVariant}={${props.variant.name}}\n  ${facts.attrs.sidebarSide}={${props.side.name}}\n  {...rest}\n>\n  <slot />\n</${facts.parts.sidebar.defaultElement}>\n`;
}

function printAstroSidebarTrigger(facts: AdapterSidebarFacts): string {
  const props = facts.props;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"button"> & {\n  ${props.asChild.name}?: ${props.asChild.type};\n};\n\nconst { ${props.asChild.name} = ${props.asChild.defaultValue}, ...rest } = Astro.props;\n---\n\n{\n  ${props.asChild.name} ? (\n    <div ${facts.attrs.trigger} data-as-child ${facts.attrs.triggerExpanded}="false" ${facts.attrs.triggerState}="expanded" {...rest}>\n      <slot />\n    </div>\n  ) : (\n    <${facts.parts.trigger.defaultElement} ${facts.attrs.triggerType}="button" ${facts.attrs.trigger} ${facts.attrs.triggerExpanded}="false" ${facts.attrs.triggerState}="expanded" {...rest}>\n      <slot />\n    </${facts.parts.trigger.defaultElement}>\n  )\n}\n`;
}

function printAstroSidebarRail(facts: AdapterSidebarFacts): string {
  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"button">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${facts.parts.rail.defaultElement}\n  ${facts.attrs.railType}="button"\n  ${facts.attrs.rail}\n  ${facts.attrs.railExpanded}="false"\n  ${facts.attrs.railState}="expanded"\n  ${facts.attrs.railTabindex}="${facts.rail.tabIndexValue}"\n  {...rest}\n>\n  <slot />\n</${facts.parts.rail.defaultElement}>\n`;
}

function printAstroSidebarMenuButton(facts: AdapterSidebarFacts): string {
  const props = facts.props;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"button"> & {\n  ${props.asChild.name}?: ${props.asChild.type};\n};\n\nconst { ${props.asChild.name} = ${props.asChild.defaultValue}, ...rest } = Astro.props;\n---\n\n{\n  ${props.asChild.name} ? (\n    <div ${facts.attrs.menuButton} data-as-child ${facts.attrs.menuButtonState}="expanded" {...rest}>\n      <slot />\n    </div>\n  ) : (\n    <${facts.parts.menuButton.defaultElement} type="button" ${facts.attrs.menuButton} ${facts.attrs.menuButtonState}="expanded" {...rest}>\n      <slot />\n    </${facts.parts.menuButton.defaultElement}>\n  )\n}\n`;
}

function printAstroSidebarIndex(family: AdapterSidebarIndexProjection): string {
  const facts = family.facts;
  const imports = ["sidebar", "menuButton", "provider", "rail", "trigger"]
    .map((part) => {
      const entry = facts.index.namespaceMembers.find(
        (candidate) => candidate.key.toLowerCase() === part.toLowerCase(),
      );
      const exportName = facts.exports[part as keyof AdapterSidebarFacts["exports"]];
      if (!entry || typeof exportName !== "string") {
        throw new Error(`${facts.displayName} sidebar index requires ${part} namespace entry.`);
      }

      return `import ${entry.name} from "./${exportName}.astro";`;
    })
    .join("\n");
  const objectEntries = facts.index.namespaceMembers
    .map((entry) => `  ${entry.key}: ${entry.name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${objectEntries}\n};\n\nexport { ${facts.index.namedExports.join(", ")} };\n\nexport default ${facts.exports.namespace};\n\n${exportPrinter.printRuntimeTypeReExport({ names: facts.index.typeExports, source: facts.runtime.typeImportSource })}\n`;
}

function printAstroRepeatedDisclosureComponent(
  family: AdapterRepeatedDisclosureComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printAstroRepeatedDisclosureRoot(facts);
  if (family.part === "item") return printAstroRepeatedDisclosureItem(facts);
  if (family.part === "header") {
    return printAstroRepeatedDisclosureSimplePart(facts.parts.header, facts.attrs.header);
  }
  if (family.part === "trigger") return printAstroRepeatedDisclosureTrigger(facts);
  if (family.part === "panel") return printAstroRepeatedDisclosurePanel(facts);

  throw new Error(`${facts.displayName} repeated-disclosure adapter cannot print ${family.part}.`);
}

function printAstroRepeatedDisclosureRoot(facts: AdapterRepeatedDisclosureFacts): string {
  const part = facts.parts.root;
  const typeProp = facts.props.type.name;
  const defaultValueProp = facts.props.defaultValue.name;
  const collapsibleProp = facts.props.collapsible.name;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${typeProp}?: ${facts.props.type.type};\n  ${defaultValueProp}?: ${facts.props.defaultValue.staticMarkupType};\n  ${collapsibleProp}?: ${facts.props.collapsible.type};\n};\n\nconst { ${typeProp} = ${facts.props.type.defaultValue}, ${defaultValueProp}, ${collapsibleProp} = ${facts.props.collapsible.defaultValue}, ...rest } = Astro.props;\n\nconst defaultValueAttribute = Array.isArray(${defaultValueProp})\n  ? JSON.stringify(${defaultValueProp})\n  : ${defaultValueProp};\n---\n\n<${part.defaultElement}\n  ${facts.attrs.root}\n  ${facts.attrs.type}={${typeProp}}\n  ${facts.attrs.defaultValue}={defaultValueAttribute}\n  ${facts.attrs.collapsible}={String(${collapsibleProp})}\n  ${facts.attrs.rootState}="closed"\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${facts.runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.attrs.root}]").forEach((root) => ${facts.runtime.factory}(root));\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printAstroRepeatedDisclosureItem(facts: AdapterRepeatedDisclosureFacts): string {
  const part = facts.parts.item;
  const valueProp = facts.props.itemValue.name;
  const disabledProp = facts.props.disabled.name;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${valueProp}?: ${facts.props.itemValue.type};\n  ${disabledProp}?: ${facts.props.disabled.type};\n};\n\nconst { ${valueProp}, ${disabledProp} = ${facts.props.disabled.defaultValue}, ...rest } = Astro.props;\n---\n\n<${part.defaultElement}\n  ${facts.attrs.item}\n  ${facts.attrs.itemValue}={${valueProp}}\n  ${facts.attrs.disabled}={${disabledProp} ? "" : undefined}\n  ${facts.attrs.itemState}="closed"\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroRepeatedDisclosureSimplePart(
  part: { defaultElement: string },
  discoveryAttribute: string,
): string {
  return printAstroSimpleSlottedRestPropsComponent({
    attributes: [discoveryAttribute],
    defaultElement: part.defaultElement,
  });
}

function printAstroRepeatedDisclosureTrigger(facts: AdapterRepeatedDisclosureFacts): string {
  const part = facts.parts.trigger;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.triggerType}="button" ${facts.attrs.trigger} ${facts.attrs.triggerExpanded}="false" ${facts.attrs.triggerState}="closed" {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroRepeatedDisclosurePanel(facts: AdapterRepeatedDisclosureFacts): string {
  const part = facts.parts.panel;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { style, ...rest } = Astro.props;\nconst panelStyle = ["animation: none", style].filter(Boolean).join("; ");\n---\n\n<${part.defaultElement} ${facts.attrs.panel} ${facts.attrs.panelState}="closed" ${facts.attrs.panelHidden} style={panelStyle} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroRepeatedDisclosureIndex(
  family: AdapterRepeatedDisclosureIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.astro";`)
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

function printAstroControlledValuePresenceComponent(
  family: AdapterControlledValuePresenceComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printAstroControlledValuePresenceRoot(facts);
  if (family.part === "list") return printAstroControlledValuePresenceList(facts);
  if (family.part === "tab") return printAstroControlledValuePresenceTab(facts);
  if (family.part === "panel") return printAstroControlledValuePresencePanel(facts);
  if (family.part === "indicator") return printAstroControlledValuePresenceIndicator(facts);

  throw new Error(
    `${facts.displayName} controlled-value-presence adapter cannot print ${family.part}.`,
  );
}

function printAstroControlledValuePresenceRoot(facts: AdapterControlledValuePresenceFacts): string {
  const part = facts.parts.root;
  const defaultValueProp = facts.props.defaultValue.name;
  const orientationProp = facts.props.orientation.name;
  const syncKeyProp = facts.props.syncKey.name;
  const valueProp = facts.props.value.name;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype ${facts.state.type} = string | null;\ntype ${facts.props.orientation.type} = "horizontal" | "vertical";\n\ninterface Props extends Omit<HTMLAttributes<"${part.defaultElement}">, "${defaultValueProp}" | "onChange"> {\n  ${defaultValueProp}?: ${facts.state.type};\n  ${orientationProp}?: ${facts.props.orientation.type};\n  ${syncKeyProp}?: ${facts.props.syncKey.type};\n  ${valueProp}?: ${facts.state.type};\n}\n\nconst { ${defaultValueProp}, ${orientationProp} = ${facts.props.orientation.defaultValue}, ${syncKeyProp}, ${valueProp}, ...rest } = Astro.props;\nconst valueAttribute = ${valueProp} === undefined ? undefined : ${valueProp} === null ? "null" : ${valueProp};\nconst defaultValueAttribute =\n  ${defaultValueProp} === undefined ? undefined : ${defaultValueProp} === null ? "null" : ${defaultValueProp};\n---\n\n<${part.defaultElement}\n  {...rest}\n  ${facts.attrs.root}\n  ${facts.attrs.defaultValue}={defaultValueAttribute}\n  ${facts.attrs.orientation}={${orientationProp}}\n  ${facts.attrs.syncKey}={${syncKeyProp}}\n  ${facts.attrs.value}={valueAttribute}\n>\n  <slot />\n</${part.defaultElement}>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${facts.runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.attrs.root}]").forEach((root) => ${facts.runtime.factory}(root).refresh());\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printAstroControlledValuePresenceList(facts: AdapterControlledValuePresenceFacts): string {
  const part = facts.parts.list;
  const activateOnFocusProp = facts.props.activateOnFocus.name;
  const loopFocusProp = facts.props.loopFocus.name;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ninterface Props extends HTMLAttributes<"${part.defaultElement}"> {\n  ${activateOnFocusProp}?: ${facts.props.activateOnFocus.type};\n  ${loopFocusProp}?: ${facts.props.loopFocus.type};\n}\n\nconst { ${activateOnFocusProp} = ${facts.props.activateOnFocus.defaultValue}, ${loopFocusProp} = ${facts.props.loopFocus.defaultValue}, ...rest } = Astro.props;\n---\n\n<${part.defaultElement}\n  ${facts.attrs.list}\n  ${facts.attrs.activateOnFocus}={${activateOnFocusProp} ? "" : undefined}\n  ${facts.attrs.loopFocus}={!${loopFocusProp} ? "false" : undefined}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroControlledValuePresenceTab(facts: AdapterControlledValuePresenceFacts): string {
  const part = facts.parts.tab;
  const disabledProp = facts.props.disabled.name;
  const valueProp = facts.props.tabValue.name;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ninterface Props extends Omit<HTMLAttributes<"${part.defaultElement}">, "type" | "${valueProp}"> {\n  ${disabledProp}?: ${facts.props.disabled.type};\n  ${valueProp}: ${facts.props.tabValue.type};\n}\n\nconst { ${disabledProp} = ${facts.props.disabled.defaultValue}, ${valueProp}, ...rest } = Astro.props;\n---\n\n<${part.defaultElement}\n  ${facts.attrs.tab}\n  ${facts.attrs.disabled}={${disabledProp} ? "" : undefined}\n  ${facts.attrs.tabValue}={${valueProp}}\n  disabled={${disabledProp}}\n  type="button"\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroControlledValuePresencePanel(
  facts: AdapterControlledValuePresenceFacts,
): string {
  const part = facts.parts.panel;
  const keepMountedProp = facts.props.keepMounted.name;
  const valueProp = facts.props.panelValue.name;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ninterface Props extends HTMLAttributes<"${part.defaultElement}"> {\n  ${keepMountedProp}?: ${facts.props.keepMounted.type};\n  ${valueProp}: ${facts.props.panelValue.type};\n}\n\nconst { ${keepMountedProp} = ${facts.props.keepMounted.defaultValue}, ${valueProp}, ...rest } = Astro.props;\n---\n\n<${part.defaultElement}\n  ${facts.attrs.panel}\n  ${facts.attrs.keepMounted}={${keepMountedProp} ? "" : undefined}\n  ${facts.attrs.panelValue}={${valueProp}}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroControlledValuePresenceIndicator(
  facts: AdapterControlledValuePresenceFacts,
): string {
  const part = facts.parts.indicator;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.indicator} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroControlledValuePresenceIndex(
  family: AdapterControlledValuePresenceIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.astro";`)
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

function printAstroMediaStatusComponent(family: AdapterMediaStatusComponentProjection): string {
  if (family.part === "root") {
    return printAstroMediaStatusRoot(family.facts);
  }

  if (family.part === "image") {
    return printAstroMediaStatusImage(family.facts);
  }

  return printAstroMediaStatusFallback(family.facts);
}

function printAstroMediaStatusRoot(facts: AdapterMediaStatusFacts): string {
  const part = facts.parts.root;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${part.discoveryAttribute} ${facts.attrs.rootStatus}="idle" {...rest}>\n  <slot />\n</${part.defaultElement}>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const ${facts.runtime.setupFunction} = () => {\n    document\n      .querySelectorAll<HTMLElement>("[${part.discoveryAttribute}]")\n      .forEach((root) => ${facts.runtime.factory}(root));\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printAstroMediaStatusImage(facts: AdapterMediaStatusFacts): string {
  const part = facts.parts.image;
  const alt = facts.props.alt.name;
  const asset = facts.props.asset.name;
  const src = facts.props.src.name;
  const visibilityProperty = facts.presence.imageConcealment.property;
  const visibilityValue = facts.presence.imageConcealment.value;

  return `---\nimport type { HTMLAttributes } from "astro/types";\nimport { Image } from "astro:assets";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${alt}: ${facts.props.alt.type};\n  ${asset}?: ${facts.props.asset.type};\n  ${src}?: ${facts.props.src.type};\n};\n\nconst { ${src}, ${asset}, ${alt}, width, height, style, ...rest } = Astro.props;\nconst initialStyle =\n  typeof style === "string"\n    ? \`\${style};${visibilityProperty}: ${visibilityValue}\`\n    : { ...style, ${visibilityProperty}: "${visibilityValue}" };\n\nif (!${src} && !${asset}) {\n  throw new Error(${JSON.stringify(facts.errors.missingSource)});\n}\n---\n\n{\n  ${src} && (\n    <img\n      ${part.discoveryAttribute}\n      ${facts.attrs.imageStatus}="idle"\n      src={${src}}\n      alt={${alt}}\n      width={64}\n      height={64}\n      style={initialStyle}\n      {...rest}\n    />\n  )\n}\n{\n  ${asset} && (\n    <Image\n      ${part.discoveryAttribute}\n      ${facts.attrs.imageStatus}="idle"\n      src={${asset}}\n      alt={${alt}}\n      width={64}\n      style={initialStyle}\n      {...rest}\n    />\n  )\n}\n`;
}

function printAstroMediaStatusFallback(facts: AdapterMediaStatusFacts): string {
  const part = facts.parts.fallback;
  const delay = facts.props.delay.name;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${delay}?: ${facts.props.delay.type};\n};\n\nconst { ${delay}, ...rest } = Astro.props;\n---\n\n<${part.defaultElement}\n  ${part.discoveryAttribute}\n  ${facts.attrs.fallbackDelay}={${delay}}\n  ${facts.attrs.fallbackStatus}="idle"\n  hidden={${delay} !== undefined}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroMediaStatusIndex(family: AdapterMediaStatusIndexProjection): string {
  const facts = family.facts;

  return `import ${facts.exports.fallback} from "./${facts.exports.fallback}.astro";\nimport ${facts.exports.image} from "./${facts.exports.image}.astro";\nimport ${facts.exports.root} from "./${facts.exports.root}.astro";\n\nconst ${facts.exports.namespace} = {\n  Root: ${facts.exports.root},\n  Image: ${facts.exports.image},\n  Fallback: ${facts.exports.fallback},\n};\n\nexport { ${facts.exports.namespace}, ${facts.exports.fallback}, ${facts.exports.image}, ${facts.exports.root} };\n\nexport default ${facts.exports.namespace};\n`;
}

function printAstroViewportMeasurementComponent(
  family: AdapterViewportMeasurementComponentProjection,
): string {
  if (family.part === "root") return printAstroViewportMeasurementRoot(family.facts);
  if (family.part === "viewport") return printAstroViewportMeasurementViewport(family.facts);
  if (family.part === "content") return printAstroViewportMeasurementContent(family.facts);
  if (family.part === "scrollbar") return printAstroViewportMeasurementScrollbar(family.facts);
  if (family.part === "thumb") return printAstroViewportMeasurementThumb(family.facts);

  return printAstroViewportMeasurementCorner(family.facts);
}

function printAstroViewportMeasurementRoot(facts: AdapterViewportMeasurementFacts): string {
  const part = facts.parts.root;
  const thresholdProp = facts.props.overflowEdgeThreshold;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\n${renderViewportMeasurementOverflowEdgeThresholdType(facts, "type")}\n\ntype ${facts.threshold.attributesTypeName} = {\n  shared?: number;\n  xEnd?: number;\n  xStart?: number;\n  yEnd?: number;\n  yStart?: number;\n};\n\ninterface Props extends HTMLAttributes<"${part.defaultElement}"> {\n  ${thresholdProp.name}?: ${facts.threshold.typeName};\n}\n\nconst { ${thresholdProp.name}, ...rest } = Astro.props;\nconst thresholdAttributes = ${facts.threshold.helperName}(${thresholdProp.name});\n\n${renderViewportMeasurementOverflowEdgeThresholdHelpers(facts)}\n---\n\n<${part.defaultElement}\n  ${facts.attrs.root}\n  ${facts.attrs.overflowEdgeThreshold}={thresholdAttributes.shared}\n  ${facts.attrs.overflowEdgeThresholdEdges.xEnd}={thresholdAttributes.xEnd}\n  ${facts.attrs.overflowEdgeThresholdEdges.xStart}={thresholdAttributes.xStart}\n  ${facts.attrs.overflowEdgeThresholdEdges.yEnd}={thresholdAttributes.yEnd}\n  ${facts.attrs.overflowEdgeThresholdEdges.yStart}={thresholdAttributes.yStart}\n  role="${part.role}"\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n\n${printAstroViewportMeasurementRuntimeScript(facts)}`;
}

function printAstroViewportMeasurementViewport(facts: AdapterViewportMeasurementFacts): string {
  const part = facts.parts.viewport;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { style, ...rest } = Astro.props;\nconst viewportStyle = [style, "overflow: scroll"].filter(Boolean).join("; ");\n---\n\n<${part.defaultElement} ${facts.attrs.viewport} role="${part.role}" ${facts.attrs.viewportTabindex}="-1" {...rest} ${facts.attrs.viewportStyle}={viewportStyle}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroViewportMeasurementContent(facts: AdapterViewportMeasurementFacts): string {
  const part = facts.parts.content;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.content} role="${part.role}" {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroViewportMeasurementScrollbar(facts: AdapterViewportMeasurementFacts): string {
  const part = facts.parts.scrollbar;
  const keepMounted = facts.props.keepMounted;
  const orientation = facts.props.orientation;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype ${facts.displayName}Orientation = ${orientation.type};\n\ninterface Props extends HTMLAttributes<"${part.defaultElement}"> {\n  ${keepMounted.name}?: ${keepMounted.type};\n  ${orientation.name}?: ${facts.displayName}Orientation;\n}\n\nconst { ${keepMounted.name} = ${keepMounted.defaultValue}, ${orientation.name} = ${orientation.defaultValue}, ...rest } = Astro.props;\n---\n\n<${part.defaultElement}\n  ${facts.attrs.scrollbar}\n  ${facts.attrs.keepMounted}={${keepMounted.name} ? "" : undefined}\n  ${facts.attrs.orientation}={${orientation.name}}\n  ${facts.attrs.scrollbarAriaHidden}="true"\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroViewportMeasurementThumb(facts: AdapterViewportMeasurementFacts): string {
  const part = facts.parts.thumb;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.thumb} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroViewportMeasurementCorner(facts: AdapterViewportMeasurementFacts): string {
  const part = facts.parts.corner;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.corner} ${facts.attrs.cornerAriaHidden}="true" {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroViewportMeasurementRuntimeScript(
  facts: AdapterViewportMeasurementFacts,
): string {
  return printAstroScopedRuntimeSetupScript({
    factory: facts.runtime.factory,
    importSource: facts.runtime.importSource,
    selectorAttribute: facts.attrs.root,
    setupFunction: facts.runtime.setupFunction,
  });
}

function printAstroViewportMeasurementIndex(
  family: AdapterViewportMeasurementIndexProjection,
): string {
  const facts = family.facts;

  return `import ${facts.exports.content} from "./${facts.exports.content}.astro";\nimport ${facts.exports.corner} from "./${facts.exports.corner}.astro";\nimport ${facts.exports.root} from "./${facts.exports.root}.astro";\nimport ${facts.exports.scrollbar} from "./${facts.exports.scrollbar}.astro";\nimport ${facts.exports.thumb} from "./${facts.exports.thumb}.astro";\nimport ${facts.exports.viewport} from "./${facts.exports.viewport}.astro";\n\nconst ${facts.exports.namespace} = {\n  Root: ${facts.exports.root},\n  Viewport: ${facts.exports.viewport},\n  Content: ${facts.exports.content},\n  Scrollbar: ${facts.exports.scrollbar},\n  Thumb: ${facts.exports.thumb},\n  Corner: ${facts.exports.corner},\n};\n\nexport {\n  ${facts.exports.namespace},\n  ${facts.exports.content},\n  ${facts.exports.corner},\n  ${facts.exports.root},\n  ${facts.exports.scrollbar},\n  ${facts.exports.thumb},\n  ${facts.exports.viewport},\n};\n\nexport default ${facts.exports.namespace};\n`;
}

function printAstroBooleanFormControlExternalInputRoot(
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
  const name = requireFamilyProp(facts.props.name, "name").name;
  const nativeButton = facts.props.nativeButton.name;
  const readOnly = requireFamilyProp(facts.props.readOnly, "readOnly").name;
  const required = requireFamilyProp(facts.props.required, "required").name;
  const uncheckedValue = requireFamilyProp(facts.props.uncheckedValue, "uncheckedValue").name;
  const value = requireFamilyProp(facts.props.value, "value").name;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ninterface Props extends Omit<HTMLAttributes<"${facts.render.nonNativeElement}">, "${facts.attrs.ariaState}" | "onChange"> {\n  ${state}?: ${facts.props.state.type};\n  ${defaultState}?: ${facts.props.defaultState.type};\n  ${disabled}?: ${facts.props.disabled.type};\n  ${form}?: ${requireFamilyProp(facts.props.form, "form").type};\n  ${id}?: ${requireFamilyProp(facts.props.id, "id").type};\n  ${name}?: ${requireFamilyProp(facts.props.name, "name").type};\n  ${nativeButton}?: ${facts.props.nativeButton.type};\n  ${readOnly}?: ${requireFamilyProp(facts.props.readOnly, "readOnly").type};\n  ${required}?: ${requireFamilyProp(facts.props.required, "required").type};\n  ${uncheckedValue}?: ${requireFamilyProp(facts.props.uncheckedValue, "uncheckedValue").type};\n  ${value}?: ${requireFamilyProp(facts.props.value, "value").type};\n}\n\nconst {\n  ${state},\n  ${defaultState} = ${facts.props.defaultState.defaultValue},\n  ${disabled} = ${facts.props.disabled.defaultValue},\n  ${form},\n  ${id},\n  ${name},\n  ${nativeButton} = ${facts.props.nativeButton.defaultValue},\n  ${readOnly} = ${requireFamilyProp(facts.props.readOnly, "readOnly").defaultValue},\n  ${required} = ${requireFamilyProp(facts.props.required, "required").defaultValue},\n  ${uncheckedValue},\n  ${value},\n  ...rest\n} = Astro.props;\n\nconst Tag = ${nativeButton} ? "${facts.render.nativeElement}" : "${facts.render.nonNativeElement}";\nconst initial${facts.state.pascalName} = ${state} ?? ${defaultState};\nconst inputId =\n  ${id} && ${nativeButton} ? \`\${${id}}-input\` : ${id};\nconst rootId = ${nativeButton} ? ${id} : undefined;\n---\n\n<Tag\n  {...rest}\n  ${facts.attrs.root}\n  ${facts.attrs.defaultState}={initial${facts.state.pascalName} ? "true" : undefined}\n  ${facts.attrs.form}={${form}}\n  ${facts.attrs.id}={${id}}\n  ${facts.attrs.name}={${name}}\n  ${facts.attrs.uncheckedValue}={${uncheckedValue}}\n  ${facts.attrs.value}={${value}}\n  ${facts.attrs.ariaState}={initial${facts.state.pascalName} ? "true" : "false"}\n  ${facts.attrs.ariaReadOnly}={${readOnly} ? "true" : undefined}\n  ${facts.attrs.ariaRequired}={${required} ? "true" : undefined}\n  ${facts.attrs.truthyPresence}={initial${facts.state.pascalName} ? "" : undefined}\n  ${facts.attrs.disabled}={${disabled} ? "" : undefined}\n  ${facts.attrs.filled}={initial${facts.state.pascalName} ? "" : undefined}\n  ${facts.attrs.readOnly}={${readOnly} ? "" : undefined}\n  ${facts.attrs.required}={${required} ? "" : undefined}\n  ${facts.attrs.falsyPresence}={!initial${facts.state.pascalName} ? "" : undefined}\n  disabled={${nativeButton} && ${disabled} ? true : undefined}\n  id={rootId}\n  role="${facts.render.role}"\n  tabindex={${disabled} ? -1 : 0}\n  type={${nativeButton} ? "button" : undefined}\n>\n  <slot />\n</Tag>\n<input ${facts.attrs.input} id={inputId} hidden />\n\n${printAstroBooleanFormControlRuntimeScript(facts)}`;
}

function printAstroBooleanFormControlIndeterminateRoot(
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

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ninterface Props extends Omit<HTMLAttributes<"${facts.render.nonNativeElement}">, "${facts.attrs.ariaState}"> {\n  ${state}?: ${facts.props.state.type};\n  ${defaultState}?: ${facts.props.defaultState.type};\n  ${disabled}?: ${facts.props.disabled.type};\n  ${form}?: ${requireFamilyProp(facts.props.form, "form").type};\n  ${id}?: ${requireFamilyProp(facts.props.id, "id").type};\n  ${indeterminate}?: ${requireFamilyProp(facts.props.indeterminate, "indeterminate").type};\n  ${name}?: ${requireFamilyProp(facts.props.name, "name").type};\n  ${nativeButton}?: ${facts.props.nativeButton.type};\n  ${readOnly}?: ${requireFamilyProp(facts.props.readOnly, "readOnly").type};\n  ${required}?: ${requireFamilyProp(facts.props.required, "required").type};\n  ${uncheckedValue}?: ${requireFamilyProp(facts.props.uncheckedValue, "uncheckedValue").type};\n  ${value}?: ${requireFamilyProp(facts.props.value, "value").type};\n}\n\nconst {\n  ${state},\n  ${defaultState} = ${facts.props.defaultState.defaultValue},\n  ${disabled} = ${facts.props.disabled.defaultValue},\n  ${form},\n  ${id},\n  ${indeterminate} = ${requireFamilyProp(facts.props.indeterminate, "indeterminate").defaultValue},\n  ${name},\n  ${nativeButton} = ${facts.props.nativeButton.defaultValue},\n  ${readOnly} = ${requireFamilyProp(facts.props.readOnly, "readOnly").defaultValue},\n  ${required} = ${requireFamilyProp(facts.props.required, "required").defaultValue},\n  ${uncheckedValue},\n  ${value},\n  ...rest\n} = Astro.props;\n\nconst Tag = ${nativeButton} ? "${facts.render.nativeElement}" : "${facts.render.nonNativeElement}";\nconst initial${facts.state.pascalName} = ${state} ?? ${defaultState};\nconst aria${facts.state.pascalName} = ${indeterminate} ? "mixed" : initial${facts.state.pascalName} ? "true" : "false";\n---\n\n<Tag\n  {...rest}\n  ${facts.attrs.root}\n  ${facts.attrs.defaultState}={initial${facts.state.pascalName} ? "true" : undefined}\n  ${facts.attrs.form}={${form}}\n  ${facts.attrs.id}={${id}}\n  ${facts.attrs.name}={${name}}\n  ${facts.attrs.uncheckedValue}={${uncheckedValue}}\n  ${facts.attrs.value}={${value}}\n  ${facts.attrs.ariaState}={aria${facts.state.pascalName}}\n  ${facts.attrs.ariaReadOnly}={${readOnly} ? "true" : "false"}\n  ${facts.attrs.ariaRequired}={${required} ? "true" : "false"}\n  ${facts.attrs.truthyPresence}={initial${facts.state.pascalName} ? "" : undefined}\n  ${facts.attrs.disabled}={${disabled} ? "" : undefined}\n  ${facts.attrs.indeterminate}={${indeterminate} ? "" : undefined}\n  ${facts.attrs.readOnly}={${readOnly} ? "" : undefined}\n  ${facts.attrs.required}={${required} ? "" : undefined}\n  ${facts.attrs.falsyPresence}={!initial${facts.state.pascalName} ? "" : undefined}\n  disabled={${nativeButton} && ${disabled} ? true : undefined}\n  role="${facts.render.role}"\n  tabindex={${disabled} ? -1 : 0}\n  type={${nativeButton} ? "button" : undefined}\n>\n  <slot />\n  <input ${facts.attrs.input} hidden />\n</Tag>\n\n${printAstroBooleanFormControlRuntimeScript(facts)}`;
}

function printAstroBooleanFormControlRequiredValueRoot(
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

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ninterface Props extends Omit<HTMLAttributes<"${facts.render.nonNativeElement}">, "${facts.attrs.ariaState}"> {\n  ${state}?: ${facts.props.state.type};\n  ${defaultState}?: ${facts.props.defaultState.type};\n  ${disabled}?: ${facts.props.disabled.type};\n  ${form}?: ${requireFamilyProp(facts.props.form, "form").type};\n  ${id}?: ${requireFamilyProp(facts.props.id, "id").type};\n  ${name}?: ${requireFamilyProp(facts.props.name, "name").type};\n  ${nativeButton}?: ${facts.props.nativeButton.type};\n  ${readOnly}?: ${requireFamilyProp(facts.props.readOnly, "readOnly").type};\n  ${required}?: ${requireFamilyProp(facts.props.required, "required").type};\n  ${value}: ${requireFamilyProp(facts.props.value, "value").type};\n}\n\nconst {\n  ${state},\n  ${defaultState} = ${facts.props.defaultState.defaultValue},\n  ${disabled} = ${facts.props.disabled.defaultValue},\n  ${form},\n  ${id},\n  ${name},\n  ${nativeButton} = ${facts.props.nativeButton.defaultValue},\n  ${readOnly} = ${requireFamilyProp(facts.props.readOnly, "readOnly").defaultValue},\n  ${required} = ${requireFamilyProp(facts.props.required, "required").defaultValue},\n  ${value},\n  ...rest\n} = Astro.props;\n\nconst initial${facts.state.pascalName} = ${state} ?? ${defaultState};\n---\n\n{\n  ${nativeButton} ? (\n    <>\n      <${facts.render.nativeElement}\n        {...rest}\n        ${facts.attrs.root}\n        ${facts.attrs.defaultState}={initial${facts.state.pascalName} ? "true" : undefined}\n        ${facts.attrs.form}={${form}}\n        ${facts.attrs.id}={${id}}\n        ${facts.attrs.name}={${name}}\n        ${facts.attrs.value}={${value}}\n        ${facts.attrs.ariaState}={initial${facts.state.pascalName} ? "true" : "false"}\n        ${facts.attrs.truthyPresence}={initial${facts.state.pascalName} ? "" : undefined}\n        ${facts.attrs.disabled}={${disabled} ? "" : undefined}\n        ${facts.attrs.readOnly}={${readOnly} ? "" : undefined}\n        ${facts.attrs.required}={${required} ? "" : undefined}\n        ${facts.attrs.falsyPresence}={!initial${facts.state.pascalName} ? "" : undefined}\n        disabled={${disabled} ? true : undefined}\n        id={${id}}\n        role="${facts.render.role}"\n        tabindex={${disabled} ? -1 : 0}\n        type="button"\n      >\n        <slot />\n      </${facts.render.nativeElement}>\n      <input ${facts.attrs.input} hidden />\n    </>\n  ) : (\n    <${facts.render.nonNativeElement}\n      {...rest}\n      ${facts.attrs.root}\n      ${facts.attrs.defaultState}={initial${facts.state.pascalName} ? "true" : undefined}\n      ${facts.attrs.form}={${form}}\n      ${facts.attrs.id}={${id}}\n      ${facts.attrs.name}={${name}}\n      ${facts.attrs.value}={${value}}\n      ${facts.attrs.ariaState}={initial${facts.state.pascalName} ? "true" : "false"}\n      ${facts.attrs.truthyPresence}={initial${facts.state.pascalName} ? "" : undefined}\n      ${facts.attrs.disabled}={${disabled} ? "" : undefined}\n      ${facts.attrs.readOnly}={${readOnly} ? "" : undefined}\n      ${facts.attrs.required}={${required} ? "" : undefined}\n      ${facts.attrs.falsyPresence}={!initial${facts.state.pascalName} ? "" : undefined}\n      role="${facts.render.role}"\n      tabindex={${disabled} ? -1 : 0}\n    >\n      <slot />\n      <input ${facts.attrs.input} id={${id}} hidden />\n    </${facts.render.nonNativeElement}>\n  )\n}\n\n${printAstroBooleanFormControlRuntimeScript(facts)}`;
}

function printAstroBooleanFormControlStateIndicator(facts: AdapterBooleanFormControlFacts): string {
  const part = requireFamilyPart(facts.parts.stateIndicator, "stateIndicator");
  const keepMounted = facts.props.keepMounted;

  if (!keepMounted) {
    return printAstroSimpleSlottedRestPropsComponent({
      attributes: [part.discoveryAttribute, facts.attrs.stateIndicatorFalsyPresence],
      defaultElement: part.defaultElement,
    });
  }

  const keepMountedAttribute = facts.attrs.stateIndicatorKeepMounted
    ? `  ${facts.attrs.stateIndicatorKeepMounted}={${keepMounted.name} ? "true" : undefined}\n`
    : "";
  const multilineFalsyPresenceAttribute = facts.attrs.stateIndicatorFalsyPresence
    ? `  ${facts.attrs.stateIndicatorFalsyPresence}\n`
    : "";

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}"> & {\n  ${keepMounted.name}?: ${keepMounted.type};\n};\n\nconst { ${keepMounted.name} = ${keepMounted.defaultValue}, ...rest } = Astro.props;\n---\n\n<${part.defaultElement}\n  ${part.discoveryAttribute}\n${keepMountedAttribute}${multilineFalsyPresenceAttribute}  hidden={!${keepMounted.name}}\n  {...rest}\n>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printAstroBooleanFormControlRuntimeScript(facts: AdapterBooleanFormControlFacts): string {
  return printAstroScopedRuntimeSetupScript({
    factory: facts.runtime.factory,
    importSource: facts.runtime.importSource,
    selectorAttribute: facts.attrs.root,
    setupFunction: facts.runtime.setupFunction,
  });
}

function printAstroBooleanFormControlIndex(
  family: AdapterBooleanFormControlIndexProjection,
): string {
  const facts = family.facts;
  const stateIndicator = facts.parts.stateIndicator;

  if (!stateIndicator || !facts.exports.stateIndicator) {
    return `import ${facts.exports.root} from "./${facts.exports.root}.astro";\n\nconst ${facts.exports.namespace} = {\n  Root: ${facts.exports.root},\n};\n\nexport { ${facts.exports.namespace}, ${facts.exports.root} };\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.event.detailsType} } from "${facts.runtime.typeImportSource}";\n`;
  }

  const importLines =
    stateIndicator.namespaceKey === "Thumb"
      ? [
          `import ${facts.exports.root} from "./${facts.exports.root}.astro";`,
          `import ${facts.exports.stateIndicator} from "./${facts.exports.stateIndicator}.astro";`,
        ]
      : [
          `import ${facts.exports.stateIndicator} from "./${facts.exports.stateIndicator}.astro";`,
          `import ${facts.exports.root} from "./${facts.exports.root}.astro";`,
        ];
  const exportMembers =
    stateIndicator.namespaceKey === "Thumb"
      ? `${facts.exports.namespace}, ${facts.exports.root}, ${facts.exports.stateIndicator}`
      : `${facts.exports.namespace}, ${facts.exports.stateIndicator}, ${facts.exports.root}`;

  return `${importLines.join("\n")}\n\nconst ${facts.exports.namespace} = {\n  Root: ${facts.exports.root},\n  ${stateIndicator.namespaceKey}: ${facts.exports.stateIndicator},\n};\n\nexport { ${exportMembers} };\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.event.detailsType} } from "${facts.runtime.typeImportSource}";\n`;
}

function printAstroDisclosurePresenceComponent(
  family: AdapterDisclosurePresenceComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") {
    return printAstroDisclosurePresenceRoot(facts);
  }

  if (family.part === "trigger") {
    return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.trigger.defaultElement}"> & {\n  ${facts.props.asChild.name}?: ${facts.props.asChild.type};\n};\n\nconst { ${facts.props.asChild.name} = ${facts.props.asChild.defaultValue}, ...rest } = Astro.props;\n---\n\n{\n  ${facts.props.asChild.name} ? (\n    <div ${facts.attrs.trigger} data-as-child ${facts.attrs.triggerExpanded}="false" ${facts.attrs.triggerState}="closed" {...rest}>\n      <slot />\n    </div>\n  ) : (\n    <${facts.parts.trigger.defaultElement} type="button" ${facts.attrs.trigger} ${facts.attrs.triggerExpanded}="false" ${facts.attrs.triggerState}="closed" {...rest}>\n      <slot />\n    </${facts.parts.trigger.defaultElement}>\n  )\n}\n`;
  }

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.panel.defaultElement}"> & {\n  ${facts.props.hiddenUntilFound.name}?: ${facts.props.hiddenUntilFound.type};\n};\n\nconst { ${facts.props.hiddenUntilFound.name} = ${facts.props.hiddenUntilFound.defaultValue}, ...rest } = Astro.props;\n---\n\n<${facts.parts.panel.defaultElement}\n  ${facts.attrs.panel}\n  ${facts.attrs.panelHiddenUntilFound}={${facts.props.hiddenUntilFound.name} ? "" : undefined}\n  ${facts.attrs.panelState}="closed"\n  ${facts.attrs.panelHidden}={${facts.props.hiddenUntilFound.name} ? "until-found" : true}\n  {...rest}\n>\n  <slot />\n</${facts.parts.panel.defaultElement}>\n`;
}

function printAstroDisclosurePresenceRoot(facts: AdapterDisclosurePresenceFacts): string {
  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.root.defaultElement}"> & {\n  ${facts.props.defaultOpen.name}?: ${facts.props.defaultOpen.type};\n  ${facts.props.disabled.name}?: ${facts.props.disabled.type};\n};\n\nconst { ${facts.props.defaultOpen.name} = ${facts.props.defaultOpen.defaultValue}, ${facts.props.disabled.name} = ${facts.props.disabled.defaultValue}, ...rest } = Astro.props;\n---\n\n<${facts.parts.root.defaultElement}\n  ${facts.attrs.root}\n  ${facts.attrs.defaultOpen}={${facts.props.defaultOpen.name} ? "true" : undefined}\n  ${facts.attrs.disabled}={${facts.props.disabled.name} ? "" : undefined}\n  ${facts.attrs.rootState}={${facts.props.defaultOpen.name} ? "open" : "closed"}\n  {...rest}\n>\n  <slot />\n</${facts.parts.root.defaultElement}>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${facts.runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.attrs.root}]").forEach((root) => ${facts.runtime.factory}(root));\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printAstroDisclosurePresenceIndex(
  family: AdapterDisclosurePresenceIndexProjection,
): string {
  const facts = family.facts;

  return `import ${facts.exports.panel} from "./${facts.exports.panel}.astro";\nimport ${facts.exports.root} from "./${facts.exports.root}.astro";\nimport ${facts.exports.trigger} from "./${facts.exports.trigger}.astro";\n\nconst ${facts.exports.namespace} = {\n  Root: ${facts.exports.root},\n  Trigger: ${facts.exports.trigger},\n  Panel: ${facts.exports.panel},\n};\n\nexport { ${facts.exports.namespace}, ${facts.exports.panel}, ${facts.exports.root}, ${facts.exports.trigger} };\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.event.detailsType} } from "${facts.runtime.typeImportSource}";\n`;
}

function printAstroGroupedValueControlComponent(
  family: AdapterGroupedValueControlComponentProjection,
): string {
  return printAstroGroupedValueControlRoot(family.facts);
}

function printAstroGroupedValueControlRoot(facts: AdapterGroupedValueControlFacts): string {
  if (isSingleValueGroupedValueControlRoot(facts)) {
    return printAstroGroupedValueControlSingleValueRoot(facts);
  }

  const defaultValue = facts.props.defaultValue.name;
  const disabled = facts.props.disabled.name;
  const valueType = "string[]";
  const propsType = facts.props.loopFocus
    ? `type Props = Omit<HTMLAttributes<"${facts.rootPart.defaultElement}">, "${defaultValue}" | "onChange"> & {\n  ${defaultValue}?: ${valueType};\n  ${disabled}?: ${facts.props.disabled.type};\n  ${requireFamilyProp(facts.props.loopFocus, "loopFocus").name}?: ${requireFamilyProp(facts.props.loopFocus, "loopFocus").type};\n  ${requireFamilyProp(facts.props.multiple, "multiple").name}?: ${requireFamilyProp(facts.props.multiple, "multiple").type};\n  ${requireFamilyProp(facts.props.orientation, "orientation").name}?: ${requireFamilyProp(facts.props.orientation, "orientation").type};\n};`
    : `type Props = HTMLAttributes<"${facts.rootPart.defaultElement}"> & {\n  ${defaultValue}?: ${valueType};\n  ${disabled}?: ${facts.props.disabled.type};\n};`;
  const destructuredProps = [
    defaultValue,
    `${disabled} = ${facts.props.disabled.defaultValue}`,
    facts.props.loopFocus
      ? `${facts.props.loopFocus.name} = ${facts.props.loopFocus.defaultValue}`
      : undefined,
    facts.props.multiple
      ? `${facts.props.multiple.name} = ${facts.props.multiple.defaultValue}`
      : undefined,
    facts.props.orientation
      ? `${facts.props.orientation.name} = ${facts.props.orientation.defaultValue}`
      : undefined,
    "...rest",
  ]
    .filter(Boolean)
    .join(", ");
  const optionalAttributes = [
    facts.props.loopFocus && facts.attrs.loopFocus
      ? `  ${facts.attrs.loopFocus}={!${facts.props.loopFocus.name} ? "false" : undefined}`
      : undefined,
    facts.props.multiple && facts.attrs.multiple
      ? `  ${facts.attrs.multiple}={${facts.props.multiple.name} ? "" : undefined}`
      : undefined,
    facts.props.orientation && facts.attrs.orientation
      ? `  ${facts.attrs.orientation}={${facts.props.orientation.name}}`
      : undefined,
  ].filter(Boolean);
  const valueAttribute = `  ${facts.attrs.value}={valueAttribute}`;
  const disabledAttribute = `  ${facts.attrs.disabled}={${disabled} ? "" : undefined}`;
  const valueAndOptionAttributes =
    optionalAttributes.length > 0
      ? [disabledAttribute, ...optionalAttributes, valueAttribute]
      : [valueAttribute, disabledAttribute];

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\n${propsType}\n\nconst { ${destructuredProps} } = Astro.props;\nconst defaultValueAttribute = ${defaultValue} ? JSON.stringify(${defaultValue}) : undefined;\nconst valueAttribute = JSON.stringify(${defaultValue} ?? []);\n---\n\n<${facts.rootPart.defaultElement}\n  ${facts.attrs.root}\n  ${facts.attrs.defaultValue}={defaultValueAttribute}\n${valueAndOptionAttributes.join("\n")}\n  role="${facts.rootPart.role}"\n  {...rest}\n>\n  <slot />\n</${facts.rootPart.defaultElement}>\n\n${printAstroGroupedValueControlRuntimeScript(facts)}`;
}

function printAstroGroupedValueControlSingleValueRoot(
  facts: AdapterGroupedValueControlFacts,
): string {
  const defaultValue = facts.props.defaultValue.name;
  const disabled = facts.props.disabled.name;
  const form = requireFamilyProp(facts.props.form, "form").name;
  const name = requireFamilyProp(facts.props.name, "name").name;
  const orientation = requireFamilyProp(facts.props.orientation, "orientation").name;
  const readOnly = requireFamilyProp(facts.props.readOnly, "readOnly").name;
  const required = requireFamilyProp(facts.props.required, "required").name;
  const value = facts.props.value.name;
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

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = Omit<HTMLAttributes<"${facts.rootPart.defaultElement}">, "${defaultValue}"> & {\n  ${defaultValue}?: ${facts.event.valueType};\n  ${disabled}?: ${facts.props.disabled.type};\n  ${form}?: ${requireFamilyProp(facts.props.form, "form").type};\n  ${name}?: ${requireFamilyProp(facts.props.name, "name").type};\n  ${orientation}?: ${requireFamilyProp(facts.props.orientation, "orientation").type};\n  ${readOnly}?: ${requireFamilyProp(facts.props.readOnly, "readOnly").type};\n  ${required}?: ${requireFamilyProp(facts.props.required, "required").type};\n  ${value}?: ${facts.event.valueType};\n};\n\nconst {\n  ${defaultValue},\n  ${disabled} = ${facts.props.disabled.defaultValue},\n  ${form},\n  ${name},\n  ${orientation} = ${requireFamilyProp(facts.props.orientation, "orientation").defaultValue},\n  ${readOnly} = ${requireFamilyProp(facts.props.readOnly, "readOnly").defaultValue},\n  ${required} = ${requireFamilyProp(facts.props.required, "required").defaultValue},\n  ${value},\n  ...rest\n} = Astro.props;\n\nconst renderedValue = ${value} ?? ${defaultValue};\n---\n\n<${facts.rootPart.defaultElement}\n  ${facts.attrs.root}\n  ${facts.attrs.defaultValue}={${defaultValue}}\n  ${getRequiredPlanValue(facts.attrs.form, `${facts.displayName} grouped-value facts are missing form attr.`)}={${form}}\n  ${getRequiredPlanValue(facts.attrs.name, `${facts.displayName} grouped-value facts are missing name attr.`)}={${name}}\n  ${getRequiredPlanValue(facts.attrs.orientation, `${facts.displayName} grouped-value facts are missing orientation attr.`)}={${orientation}}\n  ${facts.attrs.value}={renderedValue}\n  ${ariaDisabled}={${disabled} ? "true" : undefined}\n  ${ariaOrientation}={${orientation}}\n  ${ariaReadOnly}={${readOnly} ? "true" : undefined}\n  ${ariaRequired}={${required} ? "true" : undefined}\n  ${facts.attrs.disabled}={${disabled} ? "" : undefined}\n  ${getRequiredPlanValue(facts.attrs.readOnly, `${facts.displayName} grouped-value facts are missing readonly attr.`)}={${readOnly} ? "" : undefined}\n  ${getRequiredPlanValue(facts.attrs.required, `${facts.displayName} grouped-value facts are missing required attr.`)}={${required} ? "" : undefined}\n  role="${facts.rootPart.role}"\n  {...rest}\n>\n  <slot />\n</${facts.rootPart.defaultElement}>\n\n${printAstroGroupedValueControlRuntimeScript(facts)}`;
}

function printAstroGroupedValueControlRuntimeScript(
  facts: AdapterGroupedValueControlFacts,
): string {
  return printAstroScopedRuntimeSetupScript({
    factory: facts.runtime.factory,
    importSource: facts.runtime.importSource,
    selectorAttribute: facts.attrs.root,
    setupFunction: facts.runtime.setupFunction,
  });
}

function printAstroGroupedValueControlIndex(
  family: AdapterGroupedValueControlIndexProjection,
): string {
  const facts = family.facts;

  return `import ${facts.exports.root} from "./${facts.exports.root}.astro";\n\nconst ${facts.exports.namespace} = {\n  Root: ${facts.exports.root},\n};\n\nexport { ${facts.exports.namespace}, ${facts.exports.root} };\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.state.type}, ${facts.event.detailsType} } from "${facts.runtime.typeImportSource}";\n`;
}

function printAstroSingleBooleanControlComponent(
  family: AdapterSingleBooleanControlComponentProjection,
): string {
  return printAstroSingleBooleanControlRootWithOwnershipGuards(family.facts);
}

function printAstroSingleBooleanControlRoot(facts: AdapterSingleBooleanControlFacts): string {
  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ninterface Props\n  extends Omit<\n    HTMLAttributes<"${facts.part.defaultElement}">,\n    "${facts.attrs.ariaState}" | "${facts.props.defaultState.name}" | "${facts.props.disabled.name}" | "onChange" | "type" | "${facts.props.value.name}"\n  > {\n  ${facts.props.defaultState.name}?: ${facts.props.defaultState.type};\n  ${facts.props.disabled.name}?: ${facts.props.disabled.type};\n  ${facts.props.nativeButton.name}?: ${facts.props.nativeButton.type};\n  ${facts.props.state.name}?: ${facts.props.state.type};\n  ${facts.props.syncGroup.name}?: ${facts.props.syncGroup.type};\n  ${facts.props.value.name}?: ${facts.props.value.type};\n}\n\nconst {\n  ${facts.props.defaultState.name} = ${facts.props.defaultState.defaultValue},\n  ${facts.props.disabled.name} = ${facts.props.disabled.defaultValue},\n  ${facts.props.nativeButton.name} = ${facts.props.nativeButton.defaultValue},\n  ${facts.props.state.name},\n  ${facts.props.syncGroup.name},\n  ${facts.props.value.name},\n  ...rest\n} = Astro.props;\n\nconst Tag = ${facts.props.nativeButton.name} ? "${facts.part.defaultElement}" : "${facts.render.nonNativeElement}";\nconst initial${facts.state.pascalName} = ${facts.props.state.name} ?? ${facts.props.defaultState.name};\nconst default${facts.state.pascalName}Attribute = ${facts.props.state.name} === undefined && ${facts.props.defaultState.name} ? "true" : undefined;\n---\n\n<Tag\n  {...rest}\n  ${facts.part.discoveryAttribute}\n  ${facts.attrs.defaultState}={default${facts.state.pascalName}Attribute}\n  ${facts.attrs.native}={!${facts.props.nativeButton.name} ? "false" : undefined}\n  ${facts.attrs.syncGroup}={${facts.props.syncGroup.name}}\n  ${facts.attrs.value}={${facts.props.value.name}}\n  ${facts.attrs.ariaDisabled}={!${facts.props.nativeButton.name} && ${facts.props.disabled.name} ? "true" : undefined}\n  ${facts.attrs.ariaState}={initial${facts.state.pascalName} ? "true" : "false"}\n  ${facts.attrs.disabled}={${facts.props.disabled.name} ? "" : undefined}\n  ${facts.attrs.truthyPresence}={initial${facts.state.pascalName} ? "" : undefined}\n  ${facts.attrs.state}={initial${facts.state.pascalName} ? "on" : "off"}\n  ${facts.attrs.falsyPresence}={!initial${facts.state.pascalName} ? "" : undefined}\n  disabled={${facts.props.nativeButton.name} && ${facts.props.disabled.name} ? true : undefined}\n  role={!${facts.props.nativeButton.name} ? "button" : undefined}\n  tabindex={!${facts.props.nativeButton.name} ? (${facts.props.disabled.name} ? -1 : 0) : undefined}\n  type={${facts.props.nativeButton.name} ? "button" : undefined}\n  value={${facts.props.nativeButton.name} ? ${facts.props.value.name} : undefined}\n>\n  <slot />\n</Tag>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const ${facts.runtime.instancesName} = new Set<ReturnType<typeof ${facts.runtime.factory}>>();\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${facts.runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.part.discoveryAttribute}]").forEach((root) =>\n      ${facts.runtime.instancesName}.add(${facts.runtime.factory}(root)),\n    );\n  };\n\n  const ${facts.runtime.destroyFunction} = () => {\n    ${facts.runtime.instancesName}.forEach((instance) => instance.destroy());\n    ${facts.runtime.instancesName}.clear();\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("astro:before-swap", ${facts.runtime.destroyFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printAstroSingleBooleanControlRootWithOwnershipGuards(
  facts: AdapterSingleBooleanControlFacts,
): string {
  const source = printAstroSingleBooleanControlRoot(facts);
  if (facts.initExclusionAttributes.length === 0) return source;

  const initCall = `${facts.runtime.instancesName}.add(${facts.runtime.factory}(root))`;
  const unguardedLoop = `getInitCandidates(event, "[${facts.part.discoveryAttribute}]").forEach((root) =>\n      ${initCall},\n    );`;
  const exclusionChecks = facts.initExclusionAttributes
    .map((attribute) => `root.hasAttribute(${JSON.stringify(attribute)})`)
    .join(" || ");
  const guardedLoop = `getInitCandidates(event, "[${facts.part.discoveryAttribute}]").forEach((root) => {\n      if (${exclusionChecks}) return;\n\n      ${initCall};\n    });`;

  if (!source.includes(unguardedLoop)) {
    throw new Error(`${facts.displayName} Astro single-boolean control setup loop drifted.`);
  }

  return source.replace(unguardedLoop, guardedLoop);
}

function printAstroSingleBooleanControlIndex(
  family: AdapterSingleBooleanControlIndexProjection,
): string {
  const facts = family.facts;

  return `import ${facts.exports.root} from "./${facts.exports.root}.astro";\n\nconst ${facts.exports.namespace} = {\n  Root: ${facts.exports.root},\n};\n\nexport { ${facts.exports.namespace}, ${facts.exports.root} };\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.event.detailsType} } from "${facts.runtime.typeImportSource}";\n`;
}

function printAstroPropsType(component: AdapterComponentModel): string {
  const propLines = [
    ...component.props.map(printPropTypeLine),
    ...component.events.map((event) => `${event.handlerProp}?: (event: CustomEvent) => void;`),
  ];

  return [`export type ${component.name}Props = {`, ...propLines.map(indent), "};"].join("\n");
}

function printAstroPropsDestructure(component: AdapterComponentModel): string {
  const defaultedProps = new Map(
    component.defaults.map((defaultValue) => [defaultValue.prop, defaultValue]),
  );
  const propNames = [
    ...component.props.map((prop) => prop.name),
    ...component.events.map((event) => event.handlerProp),
  ];
  const destructuredProps = propNames.map((propName) => {
    const defaultValue = defaultedProps.get(propName);

    return defaultValue ? `${propName} = ${defaultValue.value.code}` : propName;
  });

  return `const { ${destructuredProps.join(", ")}, ...attrs } = Astro.props as ${component.name}Props;`;
}

function printAstroRenderNode(node: AdapterRenderNode): string {
  if (node.kind === "text") return escapeText(node.value);
  if (node.kind === "expression") return `{${node.expression.code}}`;
  if (node.kind === "slot") return `<slot${node.name ? ` name="${node.name}"` : ""} />`;

  return printAstroElement(node);
}

function printAstroElement(node: AdapterElementRenderNode): string {
  const attributes = [
    ...node.attrs.map((attribute) => printAstroAttribute(attribute)),
    ` data-sw-part="${node.part}"`,
  ].join("");
  const children = node.children.map(printAstroRenderNode).join("\n");

  return [
    `<${node.defaultElement}${attributes} {...attrs}>`,
    indent(children),
    `</${node.defaultElement}>`,
  ].join("\n");
}

function printAstroAttribute(attribute: AdapterAttribute): string {
  const name = normalizeAstroAttributeName(attribute.name);
  const value = attribute.value;

  if (value === undefined || value === true || value === "") return ` ${name}`;
  if (typeof value === "object") return ` ${name}={${value.code}}`;
  if (typeof value === "boolean") return ` ${name}={${String(value)}}`;
  if (typeof value === "number") return ` ${name}={${String(value)}}`;

  return ` ${name}="${escapeAttribute(value)}"`;
}

function printAstroContextMarkers(contexts: AdapterContextProjection[]): string {
  return contexts
    .map(
      (context) =>
        `<template data-sw-context-role="${context.role}" data-sw-context-name="${context.name}"></template>`,
    )
    .join("\n");
}

function printAstroPortals(portals: AdapterPortal[]): string {
  return portals
    .map((portal) =>
      [
        `<template data-sw-portal-source="${portal.sourcePart}" data-sw-portal-target="${portal.target}">`,
        indent(portal.children.map(printAstroRenderNode).join("\n")),
        "</template>",
      ].join("\n"),
    )
    .join("\n");
}

function printAstroRuntimeScript(component: AdapterComponentModel): string {
  if (!component.lifecycle) return "";

  return [
    "<script>",
    printImports([component.lifecycle.factoryImport]),
    'document.addEventListener("starwind:init", () => {',
    indent(
      `document.querySelectorAll("[data-sw-part='${component.lifecycle.rootRef.replace(/Ref$/, "")}']").forEach((root) => {`,
    ),
    indent(`const instance = ${component.lifecycle.factory}(root, {});`, 2),
    ...component.events.map((event) =>
      indent(
        `root.addEventListener("${event.runtimeEvent}", (event) => root.dispatchEvent(new CustomEvent("${event.handlerProp}", { detail: event })));`,
        2,
      ),
    ),
    component.lifecycle.cleanup ? indent(component.lifecycle.cleanup.code, 2) : "",
    indent("void instance;", 2),
    indent("});"),
    "});",
    "</script>",
  ]
    .filter(Boolean)
    .join("\n");
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

function getRequiredPlanValue<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
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
      facts.props.required,
    )
  );
}

function assertBooleanFormControlBehavior(
  facts: AdapterBooleanFormControlFacts,
  expected: Partial<AdapterBooleanFormControlFacts["behavior"]>,
): void {
  for (const [key, expectedValue] of Object.entries(expected) as [
    keyof AdapterBooleanFormControlFacts["behavior"],
    AdapterBooleanFormControlFacts["behavior"][keyof AdapterBooleanFormControlFacts["behavior"]],
  ][]) {
    if (facts.behavior[key] !== expectedValue) {
      throw new Error(
        `Boolean form-control facts for ${facts.displayName} have unsupported behavior.${key}: expected ${String(
          expectedValue,
        )}, received ${String(facts.behavior[key])}.`,
      );
    }
  }
}

function renderFormControlCompositionMatchUnion(matchValues: readonly string[]): string {
  return ["boolean", ...matchValues.map((value) => `"${value}"`)]
    .map((value) => `  | ${value}`)
    .join("\n");
}

function normalizeAstroAttributeName(name: string): string {
  if (name === "autoComplete") return "autocomplete";
  if (name === "className") return "class";
  if (name === "htmlFor") return "for";
  if (name === "inputMode") return "inputmode";
  if (name === "maxLength") return "maxlength";
  if (name === "readOnly") return "readonly";
  if (name === "tabIndex") return "tabindex";

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
