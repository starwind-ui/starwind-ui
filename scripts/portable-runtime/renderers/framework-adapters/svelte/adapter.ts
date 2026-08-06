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
import { svelteAdapterPublicContract } from "./public-contract.js";
import { printSvelteRangeControlComponent, printSvelteRangeControlIndex } from "./range-control.js";

export const svelteFrameworkAdapterReadiness = defineFrameworkAdapterReadiness({
  booleanAttributeStrategy: "svelte-boolean-attribute",
  contextStrategy: "svelte-context",
  eventStrategy: "svelte-callback-prop",
  fileExtension: ".svelte",
  lifecycleStrategy: "svelte-attachment-cleanup",
  normalizeAttributeName: normalizeHtmlAttributeName,
  portalStrategy: "runtime-owned",
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
    if (file.component.family?.kind === "action-surface") {
      return printSvelteActionSurfaceComponent(file);
    }
    if (file.component.family?.kind === "boolean-form-control") {
      return printSvelteBooleanFormControlComponent(file);
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
    throw unsupportedOutput("component", file.component.family?.kind);
  },
  printIndexFile(file) {
    if (file.family?.kind === "action-surface") return printSvelteActionSurfaceIndex(file);
    if (file.family?.kind === "boolean-form-control") {
      return printSvelteBooleanFormControlIndex(file);
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
    throw unsupportedOutput("index", file.family?.kind);
  },
  printHelperFile(file) {
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
