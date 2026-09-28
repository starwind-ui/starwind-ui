import {
  printSvelteSidebarComponent,
  printSvelteSidebarIndex,
  printSvelteSidebarHelper,
} from "./sidebar.js";
import {
  printSvelteColorPickerComponent,
  printSvelteColorPickerIndex,
  printSvelteColorPickerHelper,
} from "./color-picker.js";
import {
  printSvelteEditableCollectionOverlayComponent,
  printSvelteEditableCollectionOverlayIndex,
} from "./editable-collection-overlay.js";
import {
  printSvelteSharedViewportNavigationComponent,
  printSvelteSharedViewportNavigationIndex,
} from "./shared-viewport-navigation.js";
import {
  printSvelteAnchoredMenuOverlayComponent,
  printSvelteAnchoredMenuOverlayIndex,
} from "./anchored-menu-overlay.js";
import {
  printSvelteCompositeMenuOverlayComponent,
  printSvelteCompositeMenuOverlayIndex,
} from "./composite-menu-overlay.js";
import {
  printSvelteTimedFloatingOverlayComponent,
  printSvelteTimedFloatingOverlayIndex,
} from "./timed-floating-overlay.js";
import {
  printSveltePresenceFloatingOverlayComponent,
  printSveltePresenceFloatingOverlayIndex,
} from "./presence-floating-overlay.js";
import {
  printSvelteControlledValuePresenceComponent,
  printSvelteControlledValuePresenceIndex,
  printSvelteControlledValuePresenceHelper,
} from "./controlled-value-presence.js";
import {
  printSvelteFileDropControlComponent,
  printSvelteFileDropControlIndex,
} from "./file-drop-control.js";
import {
  printSvelteFieldCompositionComponent,
  printSvelteFieldCompositionIndex,
} from "./field-composition.js";
import {
  printSvelteHiddenInputVisualSlotComponent,
  printSvelteHiddenInputVisualSlotIndex,
} from "./hidden-input-visual-slot.js";
import { printSvelteToggleComponent, printSvelteToggleIndex } from "./toggle.js";
import { printSvelteToggleGroupComponent, printSvelteToggleGroupIndex } from "./toggle-group.js";
import { printSvelteRadioComponent, printSvelteRadioIndex } from "./radio.js";
import { printSvelteRadioGroupComponent, printSvelteRadioGroupIndex } from "./radio-group.js";
import {
  printSvelteCheckboxGroupComponent,
  printSvelteCheckboxGroupIndex,
} from "./checkbox-group.js";
import { printSvelteSwitchComponent, printSvelteSwitchIndex } from "./switch.js";
import {
  printSvelteFormFieldCoordinatorComponent,
  printSvelteFormFieldCoordinatorIndex,
} from "./form-field-coordinator.js";
import {
  printSvelteNativeDisabledComponent,
  printSvelteNativeDisabledIndex,
} from "./native-disabled.js";
import {
  printSvelteNativeInputValueComponent,
  printSvelteNativeInputValueIndex,
} from "./native-input-value.js";
import {
  printSvelteDisclosurePresenceComponent,
  printSvelteDisclosurePresenceIndex,
} from "./disclosure-presence.js";
import {
  printSvelteViewportMeasurementComponent,
  printSvelteViewportMeasurementIndex,
} from "./viewport-measurement.js";
import { printSvelteRangeStatusComponent, printSvelteRangeStatusIndex } from "./range-status.js";
import { printSvelteMediaStatusComponent, printSvelteMediaStatusIndex } from "./media-status.js";
import { defineFrameworkAdapter } from "../conformance.js";
import {
  defineFrameworkAdapterReadiness,
  normalizeHtmlAttributeName,
} from "../future-readiness.js";
import type { FrameworkAdapter } from "../types.js";
import {
  printSvelteActionSurfaceComponent,
  printSvelteActionSurfaceIndex,
} from "./action-surface.js";
import {
  printSvelteBooleanFormControlComponent,
  printSvelteBooleanFormControlIndex,
} from "./boolean-form-control.js";
import {
  printSvelteEngineViewportComponent,
  printSvelteEngineViewportIndex,
} from "./engine-viewport.js";
import {
  printSvelteOptionCollectionOverlayComponent,
  printSvelteOptionCollectionOverlayIndex,
} from "./option-collection-overlay.js";
import {
  printSvelteNotificationSystemComponent,
  printSvelteNotificationSystemIndex,
} from "./notification-system.js";
import {
  printSvelteNativeOverlayComponent,
  printSvelteNativeOverlayIndex,
} from "./native-overlay.js";
import {
  printSvelteRepeatedDisclosureComponent,
  printSvelteRepeatedDisclosureHelper,
  printSvelteRepeatedDisclosureIndex,
} from "./repeated-disclosure.js";
import {
  printSvelteGroupContextHelper,
} from "./group-context.js";
import { svelteAdapterPublicContract } from "./public-contract.js";
import { printSvelteRangeControlComponent, printSvelteRangeControlIndex } from "./range-control.js";

export const svelteFrameworkAdapterReadiness = defineFrameworkAdapterReadiness({
  booleanAttributeStrategy: "svelte-boolean-attribute",
  contextStrategy: "svelte-context",
  eventStrategy: "svelte-callback-prop",
  fileExtension: ".svelte",
  lifecycleStrategy: "svelte-attachment-cleanup",
  normalizeAttributeName: normalizeHtmlAttributeName,
  portalStrategy: "svelte-attachment",
  propStrategy: "svelte-props",
  publicSupport: svelteAdapterPublicContract.publicSupport,
  refStrategy: "svelte-attachment-ref",
  slotStrategy: "svelte-snippet",
  target: "svelte",
} as const);

export const svelteFrameworkAdapter = defineFrameworkAdapter({
  fileExtension: svelteFrameworkAdapterReadiness.fileExtension,
  target: svelteFrameworkAdapterReadiness.target,
  printOutput(model) {
    return model.files
      .filter((file) => !file.target || file.target === this.target)
      .map((file) => {
        if (file.kind === "component") return this.printComponentFile(file);
        if (file.kind === "index") return this.printIndexFile(file);
        if (file.kind === "helper") return this.printHelperFile(file);
        return this.printTypeFacadeFile(file);
      });
  },
  printComponentFile(file) {
    if (file.component.family?.kind === "sidebar") return printSvelteSidebarComponent(file);
    if (file.component.family?.kind === "color-picker")
      return printSvelteColorPickerComponent(file);
    if (file.component.family?.kind === "editable-collection-overlay")
      return printSvelteEditableCollectionOverlayComponent(file);
    if (file.component.family?.kind === "shared-viewport-navigation")
      return printSvelteSharedViewportNavigationComponent(file);
    if (file.component.family?.kind === "anchored-menu-overlay")
      return printSvelteAnchoredMenuOverlayComponent(file);
    if (file.component.family?.kind === "composite-menu-overlay")
      return printSvelteCompositeMenuOverlayComponent(file);
    if (file.component.family?.kind === "timed-floating-overlay")
      return printSvelteTimedFloatingOverlayComponent(file);
    if (file.component.family?.kind === "presence-floating-overlay")
      return printSveltePresenceFloatingOverlayComponent(file);
    if (file.component.family?.kind === "controlled-value-presence")
      return printSvelteControlledValuePresenceComponent(file);
    if (file.component.family?.kind === "file-drop-control")
      return printSvelteFileDropControlComponent(file);
    if (file.component.family?.kind === "hidden-input-visual-slot")
      return printSvelteHiddenInputVisualSlotComponent(file);
    if (file.component.family?.kind === "field-composition")
      return printSvelteFieldCompositionComponent(file);
    if (file.component.family?.kind === "single-boolean-control")
      return printSvelteToggleComponent(file);
    if (
      file.component.family?.kind === "grouped-value-control" &&
      file.component.family.facts.runtime.factory === "createToggleGroup"
    )
      return printSvelteToggleGroupComponent(file);
    if (file.component.family?.kind === "grouped-value-control")
      return file.component.family.facts.runtime.factory === "createRadioGroup"
        ? printSvelteRadioGroupComponent(file)
        : printSvelteCheckboxGroupComponent(file);
    if (file.component.family?.kind === "form-field-coordinator")
      return printSvelteFormFieldCoordinatorComponent(file);
    if (file.component.family?.kind === "native-disabled")
      return printSvelteNativeDisabledComponent(file);
    if (file.component.family?.kind === "native-input-value")
      return printSvelteNativeInputValueComponent(file);
    if (file.component.family?.kind === "disclosure-presence")
      return printSvelteDisclosurePresenceComponent(file);
    if (file.component.family?.kind === "viewport-measurement")
      return printSvelteViewportMeasurementComponent(file);
    if (file.component.family?.kind === "range-status")
      return printSvelteRangeStatusComponent(file);
    if (file.component.family?.kind === "media-status")
      return printSvelteMediaStatusComponent(file);
    if (file.component.family?.kind === "action-surface") {
      return printSvelteActionSurfaceComponent(file);
    }
    if (file.component.family?.kind === "boolean-form-control") {
      return file.component.family.facts.runtime.factory === "createSwitch"
        ? printSvelteSwitchComponent(file)
        : file.component.family.facts.runtime.factory === "createRadio"
          ? printSvelteRadioComponent(file)
          : printSvelteBooleanFormControlComponent(file);
    }
    if (file.component.family?.kind === "option-collection-overlay") {
      return printSvelteOptionCollectionOverlayComponent(file);
    }
    if (file.component.family?.kind === "repeated-disclosure") {
      return printSvelteRepeatedDisclosureComponent(file);
    }
    if (file.component.family?.kind === "native-overlay") {
      return printSvelteNativeOverlayComponent(file);
    }
    if (file.component.family?.kind === "range-control") {
      return printSvelteRangeControlComponent(file);
    }
    if (file.component.family?.kind === "engine-viewport") {
      return printSvelteEngineViewportComponent(file);
    }
    if (file.component.family?.kind === "notification-system") {
      return printSvelteNotificationSystemComponent(file);
    }
    throw unsupportedOutput("component", undefined);
  },
  printIndexFile(file) {
    if (file.family?.kind === "sidebar") return printSvelteSidebarIndex(file);
    if (file.family?.kind === "color-picker") return printSvelteColorPickerIndex(file);
    if (file.family?.kind === "editable-collection-overlay")
      return printSvelteEditableCollectionOverlayIndex(file);
    if (file.family?.kind === "shared-viewport-navigation")
      return printSvelteSharedViewportNavigationIndex(file);
    if (file.family?.kind === "anchored-menu-overlay")
      return printSvelteAnchoredMenuOverlayIndex(file);
    if (file.family?.kind === "composite-menu-overlay")
      return printSvelteCompositeMenuOverlayIndex(file);
    if (file.family?.kind === "timed-floating-overlay")
      return printSvelteTimedFloatingOverlayIndex(file);
    if (file.family?.kind === "presence-floating-overlay")
      return printSveltePresenceFloatingOverlayIndex(file);
    if (file.family?.kind === "controlled-value-presence")
      return printSvelteControlledValuePresenceIndex(file);
    if (file.family?.kind === "file-drop-control") return printSvelteFileDropControlIndex(file);
    if (file.family?.kind === "hidden-input-visual-slot")
      return printSvelteHiddenInputVisualSlotIndex(file);
    if (file.family?.kind === "field-composition") return printSvelteFieldCompositionIndex(file);
    if (file.family?.kind === "single-boolean-control") return printSvelteToggleIndex(file);
    if (
      file.family?.kind === "grouped-value-control" &&
      file.family.facts.runtime.factory === "createToggleGroup"
    )
      return printSvelteToggleGroupIndex(file);
    if (file.family?.kind === "grouped-value-control")
      return file.family.facts.runtime.factory === "createRadioGroup"
        ? printSvelteRadioGroupIndex(file)
        : printSvelteCheckboxGroupIndex(file);
    if (file.family?.kind === "form-field-coordinator")
      return printSvelteFormFieldCoordinatorIndex(file);
    if (file.family?.kind === "native-disabled") return printSvelteNativeDisabledIndex(file);
    if (file.family?.kind === "native-input-value") return printSvelteNativeInputValueIndex(file);
    if (file.family?.kind === "disclosure-presence")
      return printSvelteDisclosurePresenceIndex(file);
    if (file.family?.kind === "viewport-measurement")
      return printSvelteViewportMeasurementIndex(file);
    if (file.family?.kind === "range-status") return printSvelteRangeStatusIndex(file);
    if (file.family?.kind === "media-status") return printSvelteMediaStatusIndex(file);
    if (file.family?.kind === "action-surface") return printSvelteActionSurfaceIndex(file);
    if (file.family?.kind === "boolean-form-control") {
      return file.family.facts.runtime.factory === "createSwitch"
        ? printSvelteSwitchIndex(file)
        : file.family.facts.runtime.factory === "createRadio"
          ? printSvelteRadioIndex(file)
          : printSvelteBooleanFormControlIndex(file);
    }
    if (file.family?.kind === "option-collection-overlay") {
      return printSvelteOptionCollectionOverlayIndex(file);
    }
    if (file.family?.kind === "repeated-disclosure") {
      return printSvelteRepeatedDisclosureIndex(file);
    }
    if (file.family?.kind === "native-overlay") return printSvelteNativeOverlayIndex(file);
    if (file.family?.kind === "range-control") return printSvelteRangeControlIndex(file);
    if (file.family?.kind === "engine-viewport") return printSvelteEngineViewportIndex(file);
    if (file.family?.kind === "notification-system") {
      return printSvelteNotificationSystemIndex(file);
    }
    throw unsupportedOutput("index", undefined);
  },
  printHelperFile(file) {
    if ((file.family as { kind?: string } | undefined)?.kind === "svelte-group-context") {
      return printSvelteGroupContextHelper(file);
    }
    if (
      [
        "SvelteSidebarContext",
        "SvelteSidebarMenuButtonOwner",
        "SvelteSidebarMenuAnchorOwner",
      ].includes(file.name)
    )
      return printSvelteSidebarHelper(file);
    if (file.name === "SvelteColorPickerContext") return printSvelteColorPickerHelper(file);
    if (file.family?.kind === "controlled-value-presence")
      return printSvelteControlledValuePresenceHelper(file);
    if ((file.family as { kind?: string } | undefined)?.kind === "repeated-disclosure") {
      return printSvelteRepeatedDisclosureHelper(file);
    }
    throw unsupportedOutput("helper", file.family?.kind);
  },
  printTypeFacadeFile(file) {
    return {
      contents: file.typeFacades.map((facade) => facade.body.code).join("\n"),
      path: file.path,
    };
  },
  normalizeAttributeName: svelteFrameworkAdapterReadiness.normalizeAttributeName,
  printExports(exportsModel) {
    return exportsModel.members
      .map((member) => `export { ${member.name} } from "${member.from}";`)
      .join("\n");
  },
  projectBooleanAttribute(attribute) {
    return { ...attribute, name: this.normalizeAttributeName(attribute.name) };
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
}) satisfies FrameworkAdapter;

function identity<T>(value: T): T {
  return value;
}

function unsupportedOutput(kind: string, family: string | undefined): TypeError {
  return new TypeError(
    `Svelte proof target cannot print ${kind} output for family "${family ?? "unknown"}" until its cohort ticket implements that projection.`,
  );
}
