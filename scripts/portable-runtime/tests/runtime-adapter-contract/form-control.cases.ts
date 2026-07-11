import { expect, it, representativeRuntimeAdapterContracts } from "./shared.js";

export function defineRuntimeFormControlTests(): void {
  it("describes controlled pressed state and sync-group bridging for Toggle", () => {
    const toggle = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "toggle",
    )!;

    expect(toggle.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "pressed",
        defaultProp: "defaultPressed",
        runtimeSetter: "setPressed",
      }),
    );
    expect(toggle.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onPressedChange",
        domEvent: "starwind:pressed-change",
      }),
    );
    expect(toggle.props).toContainEqual(
      expect.objectContaining({ kind: "option", name: "syncGroup" }),
    );
    expect(toggle.setters).toContainEqual(
      expect.objectContaining({
        method: "setPressed",
        options: { emit: false, sync: true },
        stateModel: "pressed",
      }),
    );
    expect(toggle.setters).toContainEqual(
      expect.objectContaining({
        method: "setDisabled",
        prop: "disabled",
      }),
    );
    expect(toggle.escapeHatches).toContainEqual(
      expect.objectContaining({
        affectedFrameworks: ["astro", "react", "solid", "svelte", "vue"],
        contractOwnedFacts: expect.arrayContaining([
          "public prop names and defaults",
          "pressed state model",
          "pressed-change event/callback/details value",
          "controlled setter and disabled setter names",
        ]),
      }),
    );
  });

  it("describes Field coordination parts, root setters, and template escape hatch", () => {
    const field = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "field",
    )!;

    expect(field.parts.map((part) => part.name)).toEqual([
      "root",
      "label",
      "control",
      "description",
      "item",
      "error",
      "validity",
    ]);
    expect(
      Object.fromEntries(field.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      control: "data-sw-field-control",
      description: "data-sw-field-description",
      error: "data-sw-field-error",
      item: "data-sw-field-item",
      label: "data-sw-field-label",
      root: "data-sw-field",
      validity: "data-sw-field-validity",
    });
    expect(field.runtime.optionProps).toEqual(["dirty", "disabled", "invalid", "name", "touched"]);
    expect(field.setters).toEqual([
      { method: "setDirty", prop: "dirty" },
      { method: "setDisabled", prop: "disabled" },
      { method: "setInvalid", prop: "invalid" },
      { method: "setName", prop: "name" },
      { method: "setTouched", prop: "touched" },
    ]);
    expect(field.stateModels?.map((model) => model.name)).toEqual(["dirty", "touched"]);
    expect(field.props).toContainEqual(
      expect.objectContaining({ kind: "control", name: "invalid" }),
    );
    expect(field.refs?.map((ref) => ref.part)).toEqual([
      "root",
      "label",
      "control",
      "description",
      "item",
      "error",
      "validity",
    ]);
    expect(field.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "control",
        attributes: ["data-sw-field-control", "data-sw-input"],
      }),
    );
    expect(field.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "root",
        attributes: [
          "data-sw-field",
          "data-dirty",
          "data-disabled",
          "data-invalid",
          "data-name",
          "data-touched",
        ],
      }),
    );
    expect(field.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "error",
        attributes: ["data-sw-field-error", "data-match", "data-message-source", "hidden"],
      }),
    );
    expect(field.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "validity",
        attributes: ["data-sw-field-validity", "data-match", "hidden"],
      }),
    );
    expect(field.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "parts and discovery attributes",
          "root option prop names and defaults",
          "invalid override prop and setter",
          "behavior-linked label, description, error, and validity parts",
          "passive item state mirror part",
          "Form-owned validation display state attributes",
          "root setter names",
        ]),
      }),
    );
  });

  it("describes Fieldset semantic grouping and child Field disabled inheritance", () => {
    const fieldset = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "fieldset",
    )!;

    expect(fieldset.parts.map((part) => part.name)).toEqual(["root", "legend"]);
    expect(fieldset.parts[0]).toEqual(
      expect.objectContaining({
        defaultElement: "fieldset",
        discoveryAttribute: "data-sw-fieldset",
        name: "root",
        ownsRuntime: true,
      }),
    );
    expect(fieldset.parts[1]).toEqual(
      expect.objectContaining({
        discoveryAttribute: "data-sw-fieldset-legend",
        name: "legend",
      }),
    );
    expect(fieldset.runtime.optionProps).toEqual(["disabled"]);
    expect(fieldset.setters).toEqual([{ method: "setDisabled", prop: "disabled" }]);
    expect(fieldset.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "native fieldset semantics",
          "legend-to-group association",
          "child Field disabled inheritance",
        ]),
      }),
    );
  });

  it("describes Form root registration and native submission boundary", () => {
    const form = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "form",
    )!;

    expect(form.displayName).toBe("Form");
    expect(form.runtime).toMatchObject({
      factory: "createForm",
      importSource: "@starwind-ui/runtime/form",
      rootPart: "root",
      destroys: true,
    });
    expect(form.parts).toEqual([
      expect.objectContaining({
        defaultElement: "form",
        discoveryAttribute: "data-sw-form",
        forwardsRef: true,
        name: "root",
        ownsRuntime: true,
      }),
      expect.objectContaining({
        defaultElement: "div",
        discoveryAttribute: "data-sw-form-error-summary",
        forwardsRef: true,
        name: "error-summary",
      }),
    ]);
    expect(form.refs).toEqual([
      { part: "root", public: true },
      { part: "error-summary", public: true },
    ]);
    expect(form.props).toEqual([
      {
        name: "data-error-visibility",
        kind: "option",
        targets: ["root"],
        type: "FormValidationTiming",
      },
      {
        name: "data-revalidation-timing",
        kind: "option",
        targets: ["root"],
        type: "FormValidationTiming",
      },
      {
        name: "data-validation-timing",
        kind: "option",
        targets: ["root"],
        type: "FormValidationTiming",
      },
      {
        name: "errorVisibility",
        kind: "option",
        targets: ["root"],
        type: "FormValidationTiming",
      },
      {
        name: "revalidationTiming",
        kind: "option",
        targets: ["root"],
        type: "FormValidationTiming",
      },
      {
        name: "validationTiming",
        kind: "option",
        targets: ["root"],
        type: "FormValidationTiming",
      },
    ]);
    expect(form.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "root",
        attributes: expect.arrayContaining([
          "data-sw-form",
          "data-slot",
          "data-error-visibility",
          "data-revalidation-timing",
          "data-validation-timing",
        ]),
      }),
    );
    expect(form.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "error-summary",
        attributes: [
          "data-sw-form-error-summary",
          "data-slot",
          "role",
          "aria-live",
          "aria-atomic",
          "hidden",
        ],
      }),
    );
    expect((form as { escapeHatches?: unknown }).escapeHatches).toBeUndefined();
  });

  it("describes Input value control, event details, form behavior, and escape hatch", () => {
    const input = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "input",
    )!;

    expect(input.parts).toContainEqual(
      expect.objectContaining({
        defaultElement: "input",
        discoveryAttribute: "data-sw-input",
        name: "root",
        ownsRuntime: true,
      }),
    );
    expect(input.runtime.optionProps).toEqual([
      "defaultValue",
      "disabled",
      "onValueChange",
      "value",
    ]);
    expect(input.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "value",
        defaultProp: "defaultValue",
        runtimeGetter: "getValue",
        runtimeSetter: "setValue",
        valueType: "InputValue",
      }),
    );
    expect(input.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onValueChange",
        detailsType: "InputValueChangeDetails",
        domEvent: "starwind:value-change",
        valueProperty: "value",
        valueType: "string",
      }),
    );
    expect(input.setters).toEqual([
      { method: "setValue", options: { emit: false }, stateModel: "value", suppressesEmit: true },
      { method: "setDisabled", prop: "disabled" },
    ]);
    expect(input.form).toEqual({
      fieldIntegration: true,
      props: ["name", "required", "value"],
    });
    expect(input.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "root",
        attributes: ["data-sw-input", "data-disabled", "disabled", "value"],
      }),
    );
    expect(input.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "value/defaultValue prop names and public value type",
          "value-change event/callback/runtime option/details value",
          "normalized callback value type",
          "value and disabled setter names",
        ]),
      }),
    );
  });

  it("describes Switch boolean state, form inputs, and reset-template escape hatch", () => {
    const switchContract = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "switch",
    )!;

    expect(switchContract.parts.map((part) => part.name)).toEqual([
      "root",
      "thumb",
      "input",
      "uncheckedInput",
    ]);
    expect(
      Object.fromEntries(switchContract.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      input: "data-sw-switch-input",
      root: "data-sw-switch",
      thumb: "data-sw-switch-thumb",
      uncheckedInput: "data-sw-switch-unchecked-input",
    });
    expect(switchContract.runtime.optionProps).toEqual([
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
    expect(switchContract.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "checked",
        defaultProp: "defaultChecked",
        runtimeGetter: "getChecked",
        runtimeSetter: "setChecked",
        valueType: "boolean",
      }),
    );
    expect(switchContract.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onCheckedChange",
        detailsType: "SwitchCheckedChangeDetails",
        domEvent: "starwind:checked-change",
        valueProperty: "checked",
        valueType: "boolean",
      }),
    );
    expect(switchContract.setters).toEqual([
      {
        method: "setChecked",
        options: { emit: false },
        stateModel: "checked",
        suppressesEmit: true,
      },
      { method: "setDisabled", prop: "disabled" },
      { method: "setFormOptions", props: ["form", "name", "required", "uncheckedValue", "value"] },
    ]);
    expect(switchContract.form).toEqual({
      hiddenInput: { part: "input", type: "checkbox" },
      fieldIntegration: true,
      props: ["form", "id", "name", "required", "uncheckedValue", "value"],
    });
    const thumbPart = switchContract.parts.find((part) => part.name === "thumb");
    expect(
      thumbPart && "initialAttributes" in thumbPart ? thumbPart.initialAttributes : undefined,
    ).toBe(undefined);
    expect(switchContract.refs?.map((ref) => ref.part)).toEqual(["root", "thumb", "input"]);
    expect(switchContract.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "input",
        attributes: ["data-sw-switch-input"],
      }),
    );
    expect(switchContract.initialMarkup).not.toContainEqual(
      expect.objectContaining({ part: "uncheckedInput" }),
    );
    expect(switchContract.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "root/thumb/input parts and discovery attributes",
          "checked state model",
          "form props and runtime-created unchecked input part",
        ]),
      }),
    );
  });

  it("describes form, controlled state, presence, context, and escape hatch boundaries for Checkbox", () => {
    const checkbox = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "checkbox",
    )!;

    expect(checkbox.parts.map((part) => part.name)).toEqual([
      "root",
      "indicator",
      "input",
      "uncheckedInput",
    ]);
    expect(
      Object.fromEntries(checkbox.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      indicator: "data-sw-checkbox-indicator",
      input: "data-sw-checkbox-input",
      root: "data-sw-checkbox",
      uncheckedInput: "data-sw-checkbox-unchecked-input",
    });
    expect(checkbox.runtime.optionProps).toEqual([
      "checked",
      "defaultChecked",
      "disabled",
      "form",
      "id",
      "indeterminate",
      "name",
      "readOnly",
      "required",
      "uncheckedValue",
      "value",
    ]);
    expect(checkbox.props).toContainEqual(
      expect.objectContaining({ defaultValue: "false", name: "nativeButton", targets: ["root"] }),
    );
    expect(checkbox.props).toContainEqual(
      expect.objectContaining({
        defaultValue: "false",
        name: "keepMounted",
        targets: ["indicator"],
      }),
    );
    expect(checkbox.form?.hiddenInput).toEqual({ part: "input", type: "checkbox" });
    expect(checkbox.form?.fieldIntegration).toBe(true);
    expect(checkbox.context).toContainEqual({
      name: "checkbox-group",
      direction: "consumes",
      values: ["disabled", "value"],
    });
    expect(checkbox.presence).toEqual({
      keepMountedProp: "keepMounted",
      initialHiddenParts: ["indicator"],
      unmountPolicy: "runtime-owned",
    });
    expect(checkbox.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "checked",
        defaultProp: "defaultChecked",
        runtimeSetter: "setChecked",
        valueType: "boolean",
      }),
    );
    expect(checkbox.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "indeterminate",
        name: "indeterminate",
        runtimeSetter: "setIndeterminate",
        valueType: "boolean",
      }),
    );
    expect(checkbox.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onCheckedChange",
        domEvent: "starwind:checked-change",
        valueProperty: "checked",
        valueType: "boolean",
      }),
    );
    expect(checkbox.setters).toEqual([
      {
        method: "setChecked",
        options: { emit: false },
        stateModel: "checked",
        suppressesEmit: true,
      },
      {
        method: "setIndeterminate",
        options: { emit: false },
        stateModel: "indeterminate",
        suppressesEmit: true,
      },
      { method: "setDisabled", prop: "disabled" },
    ]);
    expect(checkbox.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "input",
        attributes: ["data-sw-checkbox-input"],
      }),
    );
    expect(checkbox.initialMarkup).not.toContainEqual(
      expect.objectContaining({ part: "uncheckedInput" }),
    );
    expect(checkbox.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "root/indicator/input/unchecked-input parts and discovery attributes",
          "checkbox-group context dependency",
          "presence keep-mounted prop",
          "form props and runtime-created unchecked input part",
        ]),
      }),
    );
  });

  it("describes form, controlled state, presence, context, and form-option bridging for Radio", () => {
    const radio = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "radio",
    )!;

    expect(radio.parts.map((part) => part.name)).toEqual(["root", "indicator", "input"]);
    expect(
      Object.fromEntries(radio.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      indicator: "data-sw-radio-indicator",
      input: "data-sw-radio-input",
      root: "data-sw-radio",
    });
    expect(radio.runtime.optionProps).toEqual([
      "checked",
      "defaultChecked",
      "disabled",
      "form",
      "id",
      "name",
      "readOnly",
      "required",
      "value",
    ]);
    expect(radio.props).toContainEqual(
      expect.objectContaining({ name: "value", required: true, type: "string" }),
    );
    expect(radio.props).toContainEqual(
      expect.objectContaining({ defaultValue: "false", name: "nativeButton", targets: ["root"] }),
    );
    expect(radio.props).toContainEqual(
      expect.objectContaining({
        defaultValue: "false",
        name: "keepMounted",
        targets: ["indicator"],
      }),
    );
    expect(radio.form).toEqual({
      hiddenInput: { part: "input", type: "radio" },
      fieldIntegration: true,
      props: ["form", "id", "name", "required", "value"],
    });
    expect(radio.context).toContainEqual({
      name: "radio-group",
      direction: "consumes",
      values: ["disabled", "form", "name", "readOnly", "required", "value"],
    });
    expect(radio.presence).toEqual({
      keepMountedProp: "keepMounted",
      initialHiddenParts: ["indicator"],
      unmountPolicy: "runtime-owned",
    });
    expect(radio.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "checked",
        defaultProp: "defaultChecked",
        runtimeGetter: "getChecked",
        runtimeSetter: "setChecked",
        valueType: "boolean",
      }),
    );
    expect(radio.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onCheckedChange",
        detailsType: "RadioCheckedChangeDetails",
        domEvent: "starwind:checked-change",
        valueProperty: "checked",
        valueType: "boolean",
      }),
    );
    expect(radio.setters).toEqual([
      {
        method: "setChecked",
        options: { emit: false },
        stateModel: "checked",
        suppressesEmit: true,
      },
      { method: "setDisabled", prop: "disabled" },
      { method: "setReadOnly", prop: "readOnly" },
      { method: "setFormOptions", props: ["form", "name", "required", "value"] },
    ]);
    expect(
      radio.parts
        .find((part) => part.name === "root")
        ?.initialAttributes?.map((attribute) => attribute.name),
    ).toEqual([
      "aria-checked",
      "data-checked",
      "data-default-checked",
      "data-disabled",
      "data-form",
      "data-id",
      "data-name",
      "data-readonly",
      "data-required",
      "data-unchecked",
      "data-value",
    ]);
    expect(radio.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "input",
        attributes: ["data-sw-radio-input"],
      }),
    );
    expect(radio.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "root/indicator/input parts and discovery attributes",
          "checked, disabled, readOnly, and form-options setter names",
          "radio-group context dependency",
          "required value prop",
        ]),
      }),
    );
  });

  it("describes value state, range input form integration, and setter bridging for Slider", () => {
    const slider = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "slider",
    )!;

    expect(slider.parts.map((part) => part.name)).toEqual([
      "root",
      "control",
      "track",
      "indicator",
      "label",
      "thumb",
      "input",
    ]);
    expect(
      Object.fromEntries(slider.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      control: "data-sw-slider-control",
      indicator: "data-sw-slider-indicator",
      input: "data-sw-slider-input",
      label: "data-sw-slider-label",
      root: "data-sw-slider",
      thumb: "data-sw-slider-thumb",
      track: "data-sw-slider-track",
    });
    expect(slider.runtime.optionProps).toEqual([
      "defaultValue",
      "disabled",
      "form",
      "largeStep",
      "max",
      "min",
      "minStepsBetweenValues",
      "name",
      "orientation",
      "step",
      "value",
    ]);
    expect(slider.parts).toContainEqual(expect.objectContaining({ name: "root", role: "group" }));
    expect(slider.parts).toContainEqual(
      expect.objectContaining({
        name: "label",
        defaultElement: "span",
        discoveryAttribute: "data-sw-slider-label",
      }),
    );
    expect(slider.parts).toContainEqual(
      expect.objectContaining({
        name: "thumb",
        initialAttributes: [{ name: "data-index", source: "prop" }],
      }),
    );
    expect(slider.props).toContainEqual(
      expect.objectContaining({ name: "value", type: "SliderValue" }),
    );
    expect(slider.props).toContainEqual(
      expect.objectContaining({ defaultValue: "0", name: "defaultValue" }),
    );
    expect(slider.props).toContainEqual(
      expect.objectContaining({ defaultValue: '"horizontal"', name: "orientation" }),
    );
    expect(slider.props).toContainEqual(
      expect.objectContaining({
        defaultValue: "0",
        name: "minStepsBetweenValues",
        type: "number",
      }),
    );
    expect(slider.props).toContainEqual(
      expect.objectContaining({ name: "index", targets: ["thumb"], type: "number" }),
    );
    expect(slider.props).not.toContainEqual(
      expect.objectContaining({ name: "inputName", targets: ["input"], type: "string" }),
    );
    expect(slider.form).toEqual({
      hiddenInput: { part: "input", type: "range" },
      fieldIntegration: true,
      props: ["form", "name", "value"],
    });
    expect(slider.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "value",
        defaultProp: "defaultValue",
        runtimeGetter: "getValue",
        runtimeSetter: "setValue",
        valueType: "SliderValue",
      }),
    );
    expect(slider.frameworkNotes?.astro).toContain(
      "Slider controlledness is fixed when the Runtime is created; do not switch between controlled and uncontrolled after hydration.",
    );
    expect(slider.frameworkNotes?.react).toContain(
      "Slider controlledness is fixed when the Runtime is created; do not switch between controlled and uncontrolled after mount.",
    );
    expect(slider.events).toEqual([
      expect.objectContaining({
        callbackProp: "onValueChange",
        detailsType: "SliderValueChangeDetails",
        domEvent: "starwind:value-change",
        valueProperty: "value",
        valueType: "SliderValue",
      }),
      expect.objectContaining({
        callbackProp: "onValueCommitted",
        detailsType: "SliderValueCommitDetails",
        domEvent: "starwind:value-committed",
        valueProperty: "value",
        valueType: "SliderValue",
      }),
    ]);
    expect(slider.setters).toEqual([
      {
        method: "setValue",
        options: { emit: false },
        stateModel: "value",
        suppressesEmit: true,
      },
      { method: "setDisabled", prop: "disabled" },
      { method: "setName", prop: "name" },
      {
        method: "setOptions",
        props: ["form", "largeStep", "max", "min", "minStepsBetweenValues", "orientation", "step"],
      },
    ]);
    expect(slider.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "input",
        attributes: ["data-sw-slider-input", "type", "aria-hidden", "tabIndex"],
      }),
    );
    expect(slider.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "root/control/track/indicator/thumb/input parts and discovery attributes",
          "label part and discovery attribute",
          "value-change and value-committed events/callback/details values",
          "value, disabled, name, and mutable options setter names",
          "form props, Field integration, and range input part",
        ]),
      }),
    );
  });

  it("describes Input OTP native input, slot anatomy, value event, and form setters", () => {
    const inputOtp = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "input-otp",
    )!;

    expect(inputOtp.parts.map((part) => part.name)).toEqual([
      "root",
      "input",
      "group",
      "slot",
      "slotChar",
      "slotCaret",
      "separator",
    ]);
    expect(
      Object.fromEntries(inputOtp.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      group: "data-sw-input-otp-group",
      input: "data-sw-input-otp-input",
      root: "data-sw-input-otp",
      separator: "data-sw-input-otp-separator",
      slot: "data-sw-input-otp-slot",
      slotCaret: "data-sw-input-otp-caret",
      slotChar: "data-sw-input-otp-char",
    });
    expect(inputOtp.runtime.optionProps).toEqual([
      "defaultValue",
      "disabled",
      "form",
      "id",
      "maxLength",
      "name",
      "onValueChange",
      "pattern",
      "readOnly",
      "required",
      "value",
    ]);
    expect(inputOtp.runtime.optionPropLifecycles).toEqual({
      defaultValue: "constructor-only",
      disabled: "setter-backed",
      form: "setter-backed",
      id: "setter-backed",
      maxLength: "refresh-required",
      name: "setter-backed",
      onValueChange: "constructor-only",
      pattern: "constructor-only",
      readOnly: "constructor-only",
      required: "setter-backed",
      value: "setter-backed",
    });
    expect(inputOtp.props).toContainEqual(
      expect.objectContaining({ name: "value", type: "string" }),
    );
    expect(inputOtp.props).toContainEqual(
      expect.objectContaining({ defaultValue: "6", name: "maxLength" }),
    );
    expect(inputOtp.props).toContainEqual(
      expect.objectContaining({ name: "pattern", type: "RegExp | string" }),
    );
    expect(inputOtp.props).toContainEqual(
      expect.objectContaining({
        name: "caret",
        targets: ["slot"],
        unsupportedTargets: ["astro"],
      }),
    );
    expect(inputOtp.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "value",
        defaultProp: "defaultValue",
        runtimeGetter: "getValue",
        runtimeSetter: "setValue",
        valueType: "string",
      }),
    );
    expect(inputOtp.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onValueChange",
        detailsType: "InputOtpValueChangeDetails",
        domEvent: "starwind:value-change",
        valueProperty: "value",
        valueType: "string",
      }),
    );
    expect(inputOtp.setters).toEqual([
      { method: "setValue", options: { emit: false }, stateModel: "value", suppressesEmit: true },
      { method: "setDisabled", prop: "disabled" },
      { method: "setFormOptions", props: ["form", "id", "name", "required"] },
    ]);
    expect(inputOtp.form).toEqual({
      hiddenInput: { part: "input", type: "text" },
      fieldIntegration: true,
      props: ["form", "id", "name", "required", "value"],
    });
    expect(inputOtp.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "input",
        attributes: expect.arrayContaining([
          "data-sw-input-otp-input",
          "autocomplete",
          "class",
          "inputmode",
          "maxlength",
          "tabindex",
          "value",
        ]),
      }),
    );
    expect(inputOtp.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "slotCaret",
        attributes: ["data-sw-input-otp-caret", "class", "hidden"],
      }),
    );
    expect(inputOtp.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "root/input/group/slot/slotChar/slotCaret/separator parts and discovery attributes",
          "value state model",
          "value-change event/callback/details value",
          "native input form props",
        ]),
      }),
    );
  });
}
