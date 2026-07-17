import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";
import { expect, it, representativeRuntimeAdapterContracts } from "./shared.js";

export function defineRuntimeCollectionStaticTests(): void {
  it("describes Button action-surface semantics and disabled option wiring", () => {
    const button = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "button",
    )!;

    expect(button.category).toBe("static-semantic");
    expect(button.runtime).toMatchObject({
      factory: "createButton",
      importSource: "@starwind-ui/runtime/button",
      optionProps: ["disabled", "focusableWhenDisabled"],
      rootPart: "root",
    });
    expect(button.parts).toEqual([
      expect.objectContaining({
        defaultElement: "button",
        discoveryAttribute: "data-sw-button",
        forwardsRef: true,
        name: "root",
        ownsRuntime: true,
      }),
    ]);
    expect(button.props).toEqual([
      { defaultValue: "false", kind: "option", name: "disabled", type: "boolean" },
      {
        defaultValue: "false",
        kind: "option",
        name: "focusableWhenDisabled",
        type: "boolean",
      },
      { kind: "attribute", name: "type", targets: ["root"], type: "button | submit | reset" },
    ]);
    expect(button.refs).toEqual([{ part: "root", public: true }]);
    expect(button.initialMarkup).toContainEqual(
      expect.objectContaining({
        attributes: ["data-sw-button", "type", "data-disabled", "aria-disabled"],
        part: "root",
      }),
    );
  });

  it("describes open state, presence, asChild, and accessibility boundaries for Collapsible", () => {
    const collapsible = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "collapsible",
    )!;

    expect(collapsible.parts.map((part) => part.name)).toEqual(["root", "trigger", "panel"]);
    expect(
      Object.fromEntries(collapsible.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      panel: "data-sw-collapsible-panel",
      root: "data-sw-collapsible",
      trigger: "data-sw-collapsible-trigger",
    });
    expect(collapsible.runtime.optionProps).toEqual(["defaultOpen", "disabled", "open"]);
    expect(collapsible.props).toContainEqual(
      expect.objectContaining({ defaultValue: "false", name: "defaultOpen" }),
    );
    expect(collapsible.props).toContainEqual(
      expect.objectContaining({
        defaultValue: "false",
        name: "asChild",
        targets: ["trigger"],
      }),
    );
    expect(collapsible.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "open",
        defaultProp: "defaultOpen",
        runtimeGetter: "getOpen",
        runtimeSetter: "setOpen",
        valueType: "boolean",
      }),
    );
    expect(collapsible.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onOpenChange",
        detailsType: "CollapsibleOpenChangeDetails",
        domEvent: "starwind:open-change",
        valueProperty: "open",
        valueType: "boolean",
      }),
    );
    expect(collapsible.setters).toEqual([
      {
        method: "setOpen",
        options: { emit: false },
        stateModel: "open",
        suppressesEmit: true,
      },
    ]);
    expect(collapsible.presence).toEqual({
      initialHiddenParts: ["panel"],
      unmountPolicy: "runtime-owned-visibility",
    });
    expect(collapsible.asChild).toContainEqual({
      part: "trigger",
      merges: ["aria", "className", "data", "ref"],
    });
    expect(collapsible.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "trigger",
        attributes: ["data-sw-collapsible-trigger", "aria-expanded", "data-state"],
      }),
    );
    expect(collapsible.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "panel",
        attributes: [
          "data-sw-collapsible-panel",
          "data-hidden-until-found",
          "data-state",
          "hidden",
        ],
      }),
    );
    expect(collapsible.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "root/trigger/panel parts and discovery attributes",
          "open state model",
          "asChild trigger merge requirements",
          "presence panel part and initial hidden state",
        ]),
      }),
    );
  });

  it("describes value array state, DOM child coordination, and controlled bridging for Toggle Group", () => {
    const toggleGroup = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "toggle-group",
    )!;

    expect(toggleGroup.parts.map((part) => part.name)).toEqual(["root"]);
    expect(toggleGroup.parts).toContainEqual(
      expect.objectContaining({
        discoveryAttribute: "data-sw-toggle-group",
        name: "root",
        ownsRuntime: true,
        role: "group",
      }),
    );
    expect(toggleGroup.runtime.optionProps).toEqual([
      "defaultValue",
      "disabled",
      "loopFocus",
      "multiple",
      "orientation",
      "value",
    ]);
    expect(toggleGroup.props).toContainEqual(
      expect.objectContaining({ name: "value", type: "ToggleGroupValue" }),
    );
    expect(toggleGroup.props).toContainEqual(
      expect.objectContaining({ name: "defaultValue", type: "ToggleGroupValue" }),
    );
    expect(toggleGroup.props).toContainEqual(
      expect.objectContaining({ defaultValue: "true", name: "loopFocus" }),
    );
    expect(toggleGroup.props).toContainEqual(
      expect.objectContaining({ defaultValue: '"horizontal"', name: "orientation" }),
    );
    expect(toggleGroup.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "value",
        defaultProp: "defaultValue",
        runtimeGetter: "getValue",
        runtimeSetter: "setValue",
        valueType: "ToggleGroupValue",
      }),
    );
    expect(toggleGroup.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onValueChange",
        detailsType: "ToggleGroupValueChangeDetails",
        domEvent: "starwind:value-change",
        valueProperty: "value",
        valueType: "ToggleGroupValue",
      }),
    );
    expect(toggleGroup.setters).toEqual([
      {
        method: "setValue",
        options: { emit: false },
        stateModel: "value",
        suppressesEmit: true,
      },
      { method: "setDisabled", prop: "disabled" },
      { method: "setLoopFocus", prop: "loopFocus" },
      { method: "setMultiple", prop: "multiple" },
      { method: "setOrientation", prop: "orientation" },
    ]);
    expect(toggleGroup.context).toContainEqual({
      name: "toggle-group",
      direction: "provides",
      values: ["disabled", "loopFocus", "multiple", "orientation", "value"],
    });
    expect(toggleGroup.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "root",
        attributes: [
          "data-sw-toggle-group",
          "role",
          "data-default-value",
          "data-disabled",
          "data-loop-focus",
          "data-multiple",
          "data-orientation",
          "data-value",
        ],
      }),
    );
    expect(toggleGroup.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "root part and discovery attribute",
          "value state model",
          "value-change event/callback/details value",
          "toggle-group DOM context provider facts",
        ]),
      }),
    );
  });

  it("describes radio value state, framework context, form coordination, and controlled bridging for Radio Group", () => {
    const radioGroup = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "radio-group",
    )!;

    expect(radioGroup.parts.map((part) => part.name)).toEqual(["root"]);
    expect(radioGroup.parts).toContainEqual(
      expect.objectContaining({
        discoveryAttribute: "data-sw-radio-group",
        name: "root",
        ownsRuntime: true,
        role: "radiogroup",
      }),
    );
    expect(radioGroup.runtime.optionProps).toEqual([
      "defaultValue",
      "disabled",
      "form",
      "name",
      "orientation",
      "readOnly",
      "required",
      "value",
    ]);
    expect(radioGroup.props).toContainEqual(
      expect.objectContaining({ name: "value", type: "RadioGroupValue" }),
    );
    expect(radioGroup.props).toContainEqual(
      expect.objectContaining({ name: "defaultValue", type: "RadioGroupValue" }),
    );
    expect(radioGroup.props).toContainEqual(
      expect.objectContaining({ defaultValue: '"vertical"', name: "orientation" }),
    );
    expect(radioGroup.props).toContainEqual(
      expect.objectContaining({ defaultValue: "false", name: "readOnly" }),
    );
    expect(radioGroup.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "value",
        defaultProp: "defaultValue",
        runtimeGetter: "getValue",
        runtimeSetter: "setValue",
        valueType: "RadioGroupValue",
      }),
    );
    expect(radioGroup.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onValueChange",
        detailsType: "RadioGroupValueChangeDetails",
        domEvent: "starwind:value-change",
        valueProperty: "value",
        valueType: "string",
      }),
    );
    expect(radioGroup.setters).toEqual([
      {
        method: "setValue",
        options: { emit: false },
        stateModel: "value",
        suppressesEmit: true,
      },
      { method: "setDisabled", prop: "disabled" },
      { method: "setFormOptions", props: ["form", "name", "required"] },
      { method: "setName", prop: "name" },
      { method: "setOrientation", prop: "orientation" },
      { method: "setReadOnly", prop: "readOnly" },
      { method: "setRequired", prop: "required" },
    ]);
    expect(radioGroup.context).toContainEqual({
      name: "radio-group",
      direction: "provides",
      values: ["disabled", "form", "name", "readOnly", "required", "value"],
    });
    expect(radioGroup.form).toEqual({
      fieldIntegration: true,
      props: ["form", "name", "required", "value"],
    });
    expect(radioGroup.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "root",
        attributes: [
          "data-sw-radio-group",
          "role",
          "aria-disabled",
          "aria-orientation",
          "aria-readonly",
          "aria-required",
          "data-default-value",
          "data-disabled",
          "data-form",
          "data-name",
          "data-orientation",
          "data-readonly",
          "data-required",
          "data-value",
        ],
      }),
    );
    expect(radioGroup.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "root part and discovery attribute",
          "value state model",
          "value-change event/callback/details value",
          "radio-group framework context provider facts",
          "form coordination props",
        ]),
      }),
    );
  });

  it("describes checkbox array value state, framework context, and controlled bridging for Checkbox Group", () => {
    const checkboxGroup = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "checkbox-group",
    )!;

    expect(checkboxGroup.parts.map((part) => part.name)).toEqual(["root"]);
    expect(checkboxGroup.parts).toContainEqual(
      expect.objectContaining({
        discoveryAttribute: "data-sw-checkbox-group",
        name: "root",
        ownsRuntime: true,
        role: "group",
      }),
    );
    expect(checkboxGroup.runtime.optionProps).toEqual(["defaultValue", "disabled", "value"]);
    expect(checkboxGroup.props).toContainEqual(
      expect.objectContaining({ name: "value", type: "CheckboxGroupValue" }),
    );
    expect(checkboxGroup.props).toContainEqual(
      expect.objectContaining({ name: "defaultValue", type: "CheckboxGroupValue" }),
    );
    expect(checkboxGroup.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "value",
        defaultProp: "defaultValue",
        runtimeGetter: "getValue",
        runtimeSetter: "setValue",
        valueType: "CheckboxGroupValue",
      }),
    );
    expect(checkboxGroup.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onValueChange",
        detailsType: "CheckboxGroupValueChangeDetails",
        domEvent: "starwind:value-change",
        valueProperty: "value",
        valueType: "CheckboxGroupValue",
      }),
    );
    expect(checkboxGroup.setters).toEqual([
      {
        method: "setValue",
        options: { emit: false },
        stateModel: "value",
        suppressesEmit: true,
      },
      { method: "setDisabled", prop: "disabled" },
    ]);
    expect(checkboxGroup.context).toContainEqual({
      name: "checkbox-group",
      direction: "provides",
      values: ["disabled", "value"],
    });
    expect(checkboxGroup.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "root",
        attributes: [
          "data-sw-checkbox-group",
          "role",
          "data-default-value",
          "data-disabled",
          "data-value",
        ],
      }),
    );
    expect(checkboxGroup.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "root part and discovery attribute",
          "value state model",
          "value-change event/callback/details value",
          "checkbox-group framework context provider facts",
        ]),
      }),
    );
  });

  it("describes linked tabs parts, nullable value state, sync bridging, and presence boundaries for Tabs", () => {
    const tabs = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "tabs",
    )!;

    expect(tabs.parts.map((part) => part.name)).toEqual([
      "root",
      "list",
      "tab",
      "panel",
      "indicator",
    ]);
    expect(
      Object.fromEntries(tabs.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      indicator: "data-sw-tabs-indicator",
      list: "data-sw-tabs-list",
      panel: "data-sw-tabs-panel",
      root: "data-sw-tabs",
      tab: "data-sw-tabs-tab",
    });
    expect(tabs.runtime.optionProps).toEqual(["defaultValue", "orientation", "syncKey", "value"]);
    expect(tabs.props).toContainEqual(
      expect.objectContaining({ name: "value", targets: ["root"], type: "TabsValue" }),
    );
    expect(tabs.props).toContainEqual(
      expect.objectContaining({ defaultValue: '"horizontal"', name: "orientation" }),
    );
    expect(tabs.props).toContainEqual(
      expect.objectContaining({
        defaultValue: "false",
        name: "activateOnFocus",
        targets: ["list"],
      }),
    );
    expect(tabs.props).toContainEqual(
      expect.objectContaining({ defaultValue: "true", name: "loopFocus", targets: ["list"] }),
    );
    expect(tabs.props).toContainEqual(
      expect.objectContaining({ name: "value", targets: ["tab"], type: "string" }),
    );
    expect(tabs.props).toContainEqual(
      expect.objectContaining({ name: "value", targets: ["panel"], type: "string" }),
    );
    expect(tabs.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "value",
        defaultProp: "defaultValue",
        runtimeGetter: "getValue",
        runtimeSetter: "setValue",
        valueType: "TabsValue",
      }),
    );
    expect(tabs.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onValueChange",
        callbackTiming: "before-state-commit",
        cancelable: true,
        detailsType: "TabsValueChangeDetails",
        domEvent: "starwind:value-change",
        valueProperty: "value",
        valueType: "TabsValue",
      }),
    );
    expect(tabs.setters).toEqual([
      {
        method: "setValue",
        options: { emit: false, sync: true },
        stateModel: "value",
        suppressesEmit: true,
      },
    ]);
    expect(tabs.context).toContainEqual({
      name: "tabs",
      direction: "provides",
      values: ["orientation", "value"],
    });
    expect(tabs.presence).toEqual({
      keepMountedProp: "keepMounted",
      initialHiddenParts: [],
      unmountPolicy: "runtime-owned-visibility",
    });
    expect(tabs.refs?.map((ref) => ref.part)).toEqual([
      "root",
      "list",
      "tab",
      "panel",
      "indicator",
    ]);
    expect(tabs.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "root",
        attributes: [
          "data-sw-tabs",
          "data-default-value",
          "data-orientation",
          "data-sync-key",
          "data-value",
        ],
      }),
    );
    expect(tabs.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "indicator",
        attributes: ["data-sw-tabs-indicator"],
      }),
    );
    expect(tabs.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "root/list/tab/panel/indicator parts and discovery attributes",
          "value state model",
          "value-change event/callback/details value",
          "value-change cancelability and before-commit callback timing",
          "value setter name and sync suppression options",
          "tabs framework context provider facts",
        ]),
      }),
    );
  });

  it("describes accordion value state, linked disclosure parts, and animation-aware presence boundaries", () => {
    const accordion = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "accordion",
    )!;

    expect(accordion.parts.map((part) => part.name)).toEqual([
      "root",
      "item",
      "header",
      "trigger",
      "panel",
    ]);
    expect(
      Object.fromEntries(accordion.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      header: "data-sw-accordion-header",
      item: "data-sw-accordion-item",
      panel: "data-sw-accordion-content",
      root: "data-sw-accordion",
      trigger: "data-sw-accordion-trigger",
    });
    expect(accordion.runtime.optionProps).toEqual(["type", "defaultValue", "collapsible", "value"]);
    expect(accordion.props).toContainEqual(
      expect.objectContaining({ name: "value", targets: ["root"], type: "AccordionValue" }),
    );
    expect(accordion.props).toContainEqual(
      expect.objectContaining({ defaultValue: '"single"', name: "type" }),
    );
    expect(accordion.props).toContainEqual(
      expect.objectContaining({ defaultValue: "true", name: "collapsible" }),
    );
    expect(accordion.props).toContainEqual(
      expect.objectContaining({ name: "value", targets: ["item"], type: "string" }),
    );
    expect(accordion.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "value",
        defaultProp: "defaultValue",
        runtimeGetter: "getValue",
        runtimeSetter: "setValue",
        valueType: "AccordionValue",
      }),
    );
    expect(accordion.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onValueChange",
        detailsType: "AccordionValueChangeDetails",
        domEvent: "starwind:value-change",
        valueProperty: "value",
        valueType: "AccordionValue",
      }),
    );
    expect(accordion.setters).toEqual([
      {
        method: "setValue",
        options: { emit: false },
        stateModel: "value",
        suppressesEmit: true,
      },
    ]);
    expect(accordion.presence).toEqual({
      initialHiddenParts: ["panel"],
      unmountPolicy: "runtime-owned-visibility",
    });
    expect(accordion.refs?.map((ref) => ref.part)).toEqual([
      "root",
      "item",
      "header",
      "trigger",
      "panel",
    ]);
    expect(accordion.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "trigger",
        attributes: ["data-sw-accordion-trigger", "type", "aria-expanded", "data-state"],
      }),
    );
    expect(accordion.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "panel",
        attributes: ["data-sw-accordion-content", "data-state", "hidden"],
      }),
    );
    expect(accordion.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "root/item/header/trigger/panel parts and discovery attributes",
          "value state model",
          "value-change event/callback/details value",
          "value setter name and suppression options",
          "presence panel part and initial hidden state",
        ]),
      }),
    );
  });

  it("describes avatar loading status, media parts, and runtime-owned visibility boundaries", () => {
    const avatar = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "avatar",
    )!;

    expect(avatar.parts.map((part) => part.name)).toEqual(["root", "image", "fallback"]);
    expect(
      Object.fromEntries(avatar.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      fallback: "data-sw-avatar-fallback",
      image: "data-sw-avatar-image",
      root: "data-sw-avatar",
    });
    expect(avatar.runtime).toEqual({
      factory: "createAvatar",
      importSource: "@starwind-ui/runtime/avatar",
      rootPart: "root",
      destroys: true,
    });
    expect(avatar.props).toContainEqual(
      expect.objectContaining({ name: "alt", required: true, targets: ["image"] }),
    );
    expect(avatar.props).toContainEqual(
      expect.objectContaining({ name: "image", targets: ["image"], type: "ImageMetadata" }),
    );
    expect(avatar.props).toContainEqual(
      expect.objectContaining({ name: "src", targets: ["image"], type: "string" }),
    );
    expect(avatar.props).toContainEqual(
      expect.objectContaining({ name: "delay", targets: ["fallback"], type: "number" }),
    );
    expect(avatar.stateModels).toContainEqual(
      expect.objectContaining({
        controlledStateSync: "unsupported",
        initialAttribute: "data-image-loading-status",
        name: "imageLoadingStatus",
        runtimeGetter: "getImageLoadingStatus",
        runtimeSetter: "setImageLoadingStatus",
        valueType: "AvatarImageLoadingStatus",
      }),
    );
    expect(avatar.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onLoadingStatusChange",
        detailsType: "AvatarLoadingStatusChangeDetails",
        domEvent: "starwind:loading-status-change",
        valueProperty: "status",
        valueType: "AvatarImageLoadingStatus",
      }),
    );
    expect(avatar.presence).toEqual({
      initialHiddenParts: ["image"],
      initialVisibility: [
        {
          delivery: "markup",
          hidden: true,
          part: "image",
          targets: ["astro"],
        },
        {
          delivery: "ref-initializer",
          hidden: true,
          part: "image",
          targets: ["react"],
        },
        {
          condition: "delay !== undefined",
          delivery: "markup",
          hidden: true,
          part: "fallback",
          targets: ["astro"],
        },
        {
          condition: "delay !== undefined",
          delivery: "ref-initializer",
          hidden: true,
          part: "fallback",
          targets: ["react"],
        },
      ],
      unmountPolicy: "runtime-owned-visibility",
    });
    expect(avatar.refs?.map((ref) => ref.part)).toEqual(["root", "image", "fallback"]);
    expect(avatar.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "root",
        attributes: ["data-sw-avatar", "data-image-loading-status"],
      }),
    );
    expect(avatar.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "image",
        attributes: ["data-sw-avatar-image", "data-image-loading-status"],
      }),
    );
    expect(avatar.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "fallback",
        attributes: ["data-sw-avatar-fallback", "data-delay", "data-image-loading-status"],
      }),
    );
    expect((avatar as RuntimeAdapterContract).escapeHatches).toBeUndefined();
  });

  it("describes progress value state, range markers, and runtime-owned accessibility rendering", () => {
    const progress = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "progress",
    )!;

    expect(progress.parts.map((part) => part.name)).toEqual([
      "root",
      "track",
      "indicator",
      "value",
      "label",
    ]);
    expect(
      Object.fromEntries(progress.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      indicator: "data-sw-progress-indicator",
      label: "data-sw-progress-label",
      root: "data-sw-progress",
      track: "data-sw-progress-track",
      value: "data-sw-progress-value",
    });
    expect(progress.parts).toContainEqual(
      expect.objectContaining({ name: "root", role: "progressbar" }),
    );
    expect(progress.runtime.optionProps).toEqual([
      "format",
      "getAriaValueText",
      "locale",
      "max",
      "min",
      "value",
    ]);
    expect(progress.runtime.optionPropLifecycles).toEqual({
      format: "setter-backed",
      getAriaValueText: "setter-backed",
      locale: "setter-backed",
      max: "setter-backed",
      min: "setter-backed",
      value: "setter-backed",
    });
    expect(progress.props).toContainEqual(
      expect.objectContaining({ defaultValue: "null", name: "value", type: "number | null" }),
    );
    expect(progress.props).toContainEqual(
      expect.objectContaining({ defaultValue: "100", name: "max", type: "number" }),
    );
    expect(progress.props).toContainEqual(
      expect.objectContaining({ defaultValue: "0", name: "min", type: "number" }),
    );
    expect(progress.props).toContainEqual(
      expect.objectContaining({
        name: "getAriaValueText",
        type: "(formattedValue: string | null, value: ProgressValue) => string",
        unsupportedTargets: ["astro"],
      }),
    );
    expect(progress.props).toContainEqual(
      expect.objectContaining({ name: "format", unsupportedTargets: ["astro"] }),
    );
    expect(progress.props).toContainEqual(
      expect.objectContaining({ name: "locale", unsupportedTargets: ["astro"] }),
    );
    expect(progress.stateModels).toContainEqual(
      expect.objectContaining({
        controlledStateSync: "unsupported",
        controlledProp: "value",
        initialAttribute: "data-value",
        runtimeGetter: "getValue",
        runtimeSetter: "setValue",
        valueType: "ProgressValue",
      }),
    );
    expect(progress.setters).toEqual([
      {
        method: "setFormatOptions",
        props: ["format", "getAriaValueText", "locale"],
      },
      {
        method: "setValue",
        props: ["value", "max", "min"],
        suppressesEmit: true,
      },
    ]);
    expect(progress.refs?.map((ref) => ref.part)).toEqual([
      "root",
      "track",
      "indicator",
      "value",
      "label",
    ]);
    expect(progress.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "root",
        attributes: [
          "data-sw-progress",
          "data-value",
          "data-min",
          "data-max",
          "data-indeterminate",
          "role",
        ],
      }),
    );
    expect(progress.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "value",
        attributes: ["data-sw-progress-value", "aria-hidden", "data-preserve-text"],
      }),
    );
    expect(progress.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "label",
        attributes: ["data-sw-progress-label", "role"],
      }),
    );
    expect((progress as RuntimeAdapterContract).escapeHatches).toBeUndefined();
  });

  it("describes scroll area measurement anatomy, scrollbar props, and runtime-owned visibility", () => {
    const scrollArea = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "scroll-area",
    )!;

    expect(scrollArea.parts.map((part) => part.name)).toEqual([
      "root",
      "viewport",
      "content",
      "scrollbar",
      "thumb",
      "corner",
    ]);
    expect(
      Object.fromEntries(scrollArea.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      content: "data-sw-scroll-area-content",
      corner: "data-sw-scroll-area-corner",
      root: "data-sw-scroll-area",
      scrollbar: "data-sw-scroll-area-scrollbar",
      thumb: "data-sw-scroll-area-thumb",
      viewport: "data-sw-scroll-area-viewport",
    });
    expect(scrollArea.parts).toContainEqual(
      expect.objectContaining({ name: "root", role: "presentation" }),
    );
    expect(scrollArea.parts).toContainEqual(
      expect.objectContaining({ name: "viewport", role: "presentation" }),
    );
    expect(scrollArea.parts).toContainEqual(
      expect.objectContaining({ name: "content", role: "presentation" }),
    );
    expect(scrollArea.runtime.optionProps).toEqual(["overflowEdgeThreshold"]);
    expect(scrollArea.runtime.optionPropLifecycles).toEqual({
      overflowEdgeThreshold: "refresh-required",
    });
    expect(scrollArea.props).toContainEqual(
      expect.objectContaining({
        name: "overflowEdgeThreshold",
        targets: ["root"],
        type: expect.stringContaining("Partial<{"),
      }),
    );
    expect(scrollArea.props).toContainEqual(
      expect.objectContaining({
        defaultValue: "false",
        name: "keepMounted",
        targets: ["scrollbar"],
      }),
    );
    expect(scrollArea.props).toContainEqual(
      expect.objectContaining({
        defaultValue: '"vertical"',
        name: "orientation",
        targets: ["scrollbar"],
        type: '"horizontal" | "vertical"',
      }),
    );
    expect(scrollArea.presence).toEqual({
      keepMountedProp: "keepMounted",
      initialHiddenParts: [],
      unmountPolicy: "runtime-owned-visibility",
    });
    expect(scrollArea.refs?.map((ref) => ref.part)).toEqual([
      "root",
      "viewport",
      "content",
      "scrollbar",
      "thumb",
      "corner",
    ]);
    expect(scrollArea.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "viewport",
        attributes: ["data-sw-scroll-area-viewport", "role", "tabindex", "style"],
      }),
    );
    expect(scrollArea.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "scrollbar",
        attributes: [
          "data-sw-scroll-area-scrollbar",
          "data-keep-mounted",
          "data-orientation",
          "aria-hidden",
        ],
      }),
    );
    expect((scrollArea as RuntimeAdapterContract).escapeHatches).toBeUndefined();
  });
}
