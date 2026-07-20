import { describe, expect, it } from "vitest";
import {
  projectVueDetailedEvent,
  projectVueModel,
  vueAdapterPublicContract,
  vueFrameworkAdapterReadiness,
} from "../renderers/framework-adapters/vue/index.js";

describe("Vue adapter public contract", () => {
  it("projects default and named models deterministically", () => {
    expect(projectVueModel("value")).toEqual({
      defaultProp: "defaultValue",
      modelName: "value",
      modelProp: "modelValue",
      updateEvent: "update:modelValue",
    });
    expect(projectVueModel("open")).toEqual({
      defaultProp: "defaultOpen",
      modelName: "open",
      modelProp: "open",
      updateEvent: "update:open",
    });
    expect(projectVueModel("inputValue")).toEqual({
      defaultProp: "defaultInputValue",
      modelName: "inputValue",
      modelProp: "inputValue",
      updateEvent: "update:inputValue",
    });
    expect(() => projectVueModel("modelValue")).toThrow(/aliases are target output/);
    expect(() => projectVueModel("defaultOpen")).toThrow(/aliases are target output/);
  });

  it("pins controlled, default, and Runtime synchronization semantics", () => {
    expect(vueAdapterPublicContract.models).toEqual({
      acceptedUncontrolledValue: "latest-accepted-value",
      controlledWhen: "model-prop-is-not-undefined",
      defaultPropChanges: "ignored-after-initial-seed",
      defaultValue: "seed-once-before-mount",
      projections: {
        checked: {
          defaultProp: "defaultChecked",
          modelName: "checked",
          modelProp: "checked",
          updateEvent: "update:checked",
        },
        inputValue: {
          defaultProp: "defaultInputValue",
          modelName: "inputValue",
          modelProp: "inputValue",
          updateEvent: "update:inputValue",
        },
        open: {
          defaultProp: "defaultOpen",
          modelName: "open",
          modelProp: "open",
          updateEvent: "update:open",
        },
        pressed: {
          defaultProp: "defaultPressed",
          modelName: "pressed",
          modelProp: "pressed",
          updateEvent: "update:pressed",
        },
        value: {
          defaultProp: "defaultValue",
          modelName: "value",
          modelProp: "modelValue",
          updateEvent: "update:modelValue",
        },
      },
      propToRuntimeSync: {
        equalValues: "skip-setter",
        emission: "suppress-runtime-emission",
        start: "after-mount",
        target: "contract-setter",
      },
    });
  });

  it("maps detailed events and checks Runtime detail cancellation after synchronous listeners", () => {
    expect(projectVueDetailedEvent("onValueChange")).toEqual({
      emit: "valueChange",
      propAlias: null,
      runtimeHandler: "onValueChange",
    });
    expect(projectVueDetailedEvent("onInputValueChange").emit).toBe("inputValueChange");
    expect(() => projectVueDetailedEvent("valueChange")).toThrow(/onXChange/);
    expect(() => projectVueDetailedEvent("onClick")).toThrow(/onXChange/);
    expect(vueAdapterPublicContract.events).toEqual({
      cancellation: {
        check: "detail.isCanceled",
        timing: "after-synchronous-detailed-listeners",
      },
      detailedArguments: ["value", "detail"],
      order: [
        "emit-detailed-event",
        "inspect-synchronous-cancellation",
        "accept-state",
        "emit-model-update",
      ],
      reactCallbackPropAliases: false,
    });
  });

  it("pins attrs, lazy slots, and strict asChild composition", () => {
    expect(vueAdapterPublicContract.attrs).toEqual({
      automaticFallthrough: "disabled-for-wrapper-or-multiple-roots",
      declaredComponentEventsAsNativeListeners: false,
      destination: "semantic-interactive-element",
      forwarding: "exactly-once",
      includes: ["attrs", "class", "style", "aria", "data", "undeclared-native-listeners"],
    });
    expect(vueAdapterPublicContract.composition.slots).toEqual({
      evaluation: "lazy-slot-functions",
      normalRendering: "typed-template-slots",
      privateVNodeFields: false,
      reuseVNodeInstances: false,
    });
    expect(vueAdapterPublicContract.composition.asChild).toEqual({
      invalidChild: "throw-descriptive-type-error",
      mergeApi: "mergeProps",
      mergeOrder: ["defaulted-props", "consumer-props", "protected-props"],
      refPolicy: "compose-child-adapter-and-public-element-refs",
      renderApi: "cloneVNode",
      requiredChildren: 1,
      supportedVNode: "one-native-element-vnode",
      unsupportedVNodeTypes: ["Comment", "Text", "Fragment", "component"],
    });
  });

  it("pins typed context and the narrow exposed ref surface", () => {
    expect(vueAdapterPublicContract.context).toEqual({
      key: "typed-symbol-InjectionKey",
      optionalInjection: "only-when-contract-marks-optional",
      requiredMissingContext: "throw-descriptive-missing-root-error",
      stringKeys: false,
    });
    expect(vueAdapterPublicContract.refs).toEqual({
      element: "semantic-dom-element",
      exposeTiming: "synchronous-setup",
      exposedMembers: "element-and-contract-required-imperative-methods-only",
      runtimeControllerExposed: false,
    });
  });

  it("pins mounted Runtime ownership and browser-free deterministic SSR", () => {
    expect(vueAdapterPublicContract.lifecycle).toEqual({
      controller: {
        create: "onMounted-after-owned-element-exists",
        destroy: "exact-instance-before-unmount-or-recreation",
        ownership: "one-primitive-component-instance",
        visibility: "private",
      },
      options: {
        mutable: "prefer-runtime-setter",
        recreate: "only-without-setter-from-current-accepted-state",
      },
      setupRegistration: "synchronous",
      watchers: {
        asyncUnowned: false,
        domFlush: "post",
        sources: "explicit-contract-inputs",
      },
    });
    expect(vueAdapterPublicContract.server.ssr).toEqual({
      browserGlobals: false,
      cleanupDependentWork: false,
      domQueries: false,
      layoutReads: false,
      runtimeConstruction: false,
    });
    expect(vueAdapterPublicContract.server.hydration).toEqual({
      firstClientMarkup: "identical-to-server-markup",
      idsAndPresence: "deterministic-contract-or-prop-backed",
    });
  });

  it("pins delayed Teleport behavior and the future package intent", () => {
    expect(vueAdapterPublicContract.server.teleport).toEqual({
      activate: "after-owning-root-mounted",
      containerProp: "container?: string | HTMLElement",
      defaultContainer: "body",
      disabledProp: "disabled?: boolean",
      explicitContainer: "forward-unchanged",
      initialClientRender: "disabled",
      runtimeRefClear: "only-by-setting-instance",
      runtimeRefSet: "on-mount",
      serverRender: "disabled",
    });
    expect(vueAdapterPublicContract.framework).toEqual({
      minimumVersion: "3.5",
      packageIntent: "@starwind-ui/vue",
      vuePeerExternalized: true,
    });
  });

  it("keeps every public-support flag false and agrees with readiness metadata", () => {
    expect(vueAdapterPublicContract.publicSupport).toEqual({
      cliRegistry: false,
      demoIntegration: false,
      packageExports: false,
      publicDocsClaim: false,
      status: "non-shipping-tracer",
    });
    expect(vueAdapterPublicContract.publicSupport).toEqual(
      vueFrameworkAdapterReadiness.publicSupport,
    );
  });
});
