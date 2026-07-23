import { expectText } from "../../shared/text.mjs";

export async function verifyReactCoreControlCases({ page, messages }) {
  const inputGroupState = await page.evaluate(() => {
    const groups = Array.from(document.querySelectorAll('[data-slot="input-group"][role="group"]'));
    const comboboxGroups = Array.from(document.querySelectorAll("[data-sw-combobox-input-group]"));
    const controls = Array.from(document.querySelectorAll('[data-slot="input-group-control"]'));
    const textareaControls = controls.filter((control) => control instanceof HTMLTextAreaElement);
    const spinners = Array.from(document.querySelectorAll('[data-slot="spinner"]'));
    const firstControl = controls[0];

    return {
      comboboxGroupCount: comboboxGroups.length,
      controlCount: controls.length,
      firstControlClass: firstControl?.getAttribute("class") ?? null,
      firstControlSlot: firstControl?.getAttribute("data-slot") ?? null,
      groupCount: groups.length,
      spinnerCount: spinners.length,
      spinnerLabels: spinners.map((spinner) => spinner.getAttribute("aria-label")),
      spinnerRoles: spinners.map((spinner) => spinner.getAttribute("role")),
      textareaControlCount: textareaControls.length,
    };
  });
  if (
    inputGroupState.groupCount !== 21 ||
    inputGroupState.comboboxGroupCount !== 7 ||
    inputGroupState.controlCount !== 14 ||
    inputGroupState.textareaControlCount !== 1 ||
    inputGroupState.firstControlSlot !== "input-group-control" ||
    inputGroupState.firstControlClass?.includes("border-0") !== true ||
    inputGroupState.spinnerCount !== 6 ||
    inputGroupState.spinnerRoles.some((role) => role !== "status") ||
    inputGroupState.spinnerLabels.some((label) => label !== "Loading")
  ) {
    throw new Error(
      `Expected React InputGroup composed controls and Spinner status icons, got ${JSON.stringify(
        inputGroupState,
      )}.`,
    );
  }

  await page.waitForFunction(() => {
    const field = document.querySelector("#react-runtime-field-input");
    const control = document.querySelector("#react-runtime-field-input-control");
    return (
      field?.hasAttribute("data-invalid") &&
      control instanceof HTMLInputElement &&
      control.getAttribute("aria-invalid") === "true"
    );
  });
  const initialFieldState = await page.evaluate(() => {
    const field = document.querySelector("#react-runtime-field-input");
    const control = document.querySelector("#react-runtime-field-input-control");
    const label = document.querySelector('[data-sw-field-label][data-slot="field-label"]');
    const description = document.querySelector("#react-runtime-field-input-description");
    const error = document.querySelector("#react-runtime-field-input-error");

    return {
      ariaDescribedBy: control?.getAttribute("aria-describedby")?.split(/\s+/).sort() ?? [],
      ariaInvalid: control?.getAttribute("aria-invalid"),
      controlName: control instanceof HTMLInputElement ? control.name : null,
      dataSlot: field?.getAttribute("data-slot"),
      errorHidden: error instanceof HTMLElement ? error.hidden : null,
      expectedIds: [description?.id, error?.id].filter(Boolean).sort(),
      hasInvalid: field?.hasAttribute("data-invalid"),
      labelFor: label instanceof HTMLLabelElement ? label.htmlFor : null,
      labelHasInvalid: label?.hasAttribute("data-invalid"),
    };
  });
  const fieldInput = page.locator("#react-runtime-field-input-control");
  await fieldInput.fill("Lovelace");
  await fieldInput.blur();
  await page.waitForFunction(() => {
    const field = document.querySelector("#react-runtime-field-input");
    const control = document.querySelector("#react-runtime-field-input-control");
    return (
      field?.hasAttribute("data-valid") &&
      field.hasAttribute("data-dirty") &&
      field.hasAttribute("data-touched") &&
      control instanceof HTMLInputElement &&
      control.name === "react-runtime-field-input" &&
      !control.hasAttribute("aria-invalid")
    );
  });
  await page.locator("#react-runtime-field-checkbox [data-sw-checkbox]").click();
  await page.waitForFunction(() =>
    document.querySelector("#react-runtime-field-checkbox")?.hasAttribute("data-filled"),
  );
  await page.locator('#react-runtime-field-radio [data-sw-radio][data-value="pro"]').click();
  await page.waitForFunction(() =>
    document.querySelector("#react-runtime-field-radio")?.hasAttribute("data-filled"),
  );
  await page.locator("#react-runtime-field-switch-control").click();
  await page.waitForFunction(() =>
    document.querySelector("#react-runtime-field-switch")?.hasAttribute("data-filled"),
  );
  const finalFieldState = await page.evaluate(() => {
    const form = document.querySelector("[data-runtime-field-form]");
    const formData = form instanceof HTMLFormElement ? new FormData(form) : undefined;
    const inputField = document.querySelector("#react-runtime-field-input");
    const checkboxField = document.querySelector("#react-runtime-field-checkbox");
    const radioField = document.querySelector("#react-runtime-field-radio");
    const switchField = document.querySelector("#react-runtime-field-switch");
    const checkboxInput = document.querySelector(
      "#react-runtime-field-checkbox [data-sw-checkbox-input]",
    );
    const radioInput = document.querySelector(
      '#react-runtime-field-radio [data-sw-radio][data-value="pro"] [data-sw-radio-input]',
    );
    const switchInput = document.querySelector(
      "#react-runtime-field-switch [data-sw-switch-input]",
    );

    return {
      checkboxDirty: checkboxField?.hasAttribute("data-dirty"),
      checkboxFilled: checkboxField?.hasAttribute("data-filled"),
      checkboxFormValue: formData?.get("react-runtime-field-checkbox"),
      checkboxInputName: checkboxInput instanceof HTMLInputElement ? checkboxInput.name : null,
      inputDirty: inputField?.hasAttribute("data-dirty"),
      inputErrorHidden:
        document.querySelector("#react-runtime-field-input-error") instanceof HTMLElement
          ? document.querySelector("#react-runtime-field-input-error").hidden
          : null,
      inputFilled: inputField?.hasAttribute("data-filled"),
      inputFormValue: formData?.get("react-runtime-field-input"),
      inputTouched: inputField?.hasAttribute("data-touched"),
      inputValid: inputField?.hasAttribute("data-valid"),
      radioDirty: radioField?.hasAttribute("data-dirty"),
      radioFilled: radioField?.hasAttribute("data-filled"),
      radioFormValue: formData?.get("react-runtime-field-radio"),
      radioInputName: radioInput instanceof HTMLInputElement ? radioInput.name : null,
      switchDirty: switchField?.hasAttribute("data-dirty"),
      switchFilled: switchField?.hasAttribute("data-filled"),
      switchFormValue: formData?.get("react-runtime-field-switch"),
      switchInputName: switchInput instanceof HTMLInputElement ? switchInput.name : null,
    };
  });
  if (
    initialFieldState.ariaInvalid !== "true" ||
    initialFieldState.controlName !== "react-runtime-field-input" ||
    initialFieldState.dataSlot !== "field" ||
    initialFieldState.errorHidden !== false ||
    initialFieldState.hasInvalid !== true ||
    initialFieldState.labelFor !== "react-runtime-field-input-control" ||
    initialFieldState.labelHasInvalid !== true ||
    JSON.stringify(initialFieldState.ariaDescribedBy) !==
      JSON.stringify(initialFieldState.expectedIds) ||
    finalFieldState.inputDirty !== true ||
    finalFieldState.inputErrorHidden !== true ||
    finalFieldState.inputFilled !== true ||
    finalFieldState.inputFormValue !== "Lovelace" ||
    finalFieldState.inputTouched !== true ||
    finalFieldState.inputValid !== true ||
    finalFieldState.checkboxDirty !== true ||
    finalFieldState.checkboxFilled !== true ||
    finalFieldState.checkboxFormValue !== "accepted" ||
    finalFieldState.checkboxInputName !== "react-runtime-field-checkbox" ||
    finalFieldState.radioDirty !== true ||
    finalFieldState.radioFilled !== true ||
    finalFieldState.radioFormValue !== "pro" ||
    finalFieldState.radioInputName !== "react-runtime-field-radio" ||
    finalFieldState.switchDirty !== true ||
    finalFieldState.switchFilled !== true ||
    finalFieldState.switchFormValue !== "enabled" ||
    finalFieldState.switchInputName !== "react-runtime-field-switch"
  ) {
    throw new Error(
      `Expected React Field to wire ARIA, validation, names, and state across controls, got ${JSON.stringify(
        { finalFieldState, initialFieldState },
      )}.`,
    );
  }

  await expectText(page.locator("[data-runtime-input-otp-value]"), "Input OTP value: 12");
  const initialInputOtpState = await page.evaluate(() => {
    const defaultInput = document.querySelector("#react-runtime-input-otp-default");
    const defaultRoot = defaultInput?.closest("[data-sw-input-otp]");
    const controlledInput = document.querySelector("#react-runtime-input-otp-controlled");
    const controlledRoot = controlledInput?.closest("[data-sw-input-otp]");
    const form = document.querySelector("[data-runtime-input-otp-form]");
    const readSlotText = (root) =>
      Array.from(root?.querySelectorAll("[data-sw-input-otp-char]") ?? []).map(
        (slot) => slot.textContent,
      );

    return {
      controlledDataSlot: controlledRoot?.getAttribute("data-slot"),
      controlledFormValue:
        form instanceof HTMLFormElement && controlledInput instanceof HTMLInputElement
          ? new FormData(form).get(controlledInput.name)
          : null,
      controlledSlots: readSlotText(controlledRoot),
      controlledValue: controlledRoot?.getAttribute("data-value"),
      defaultFormValue:
        form instanceof HTMLFormElement && defaultInput instanceof HTMLInputElement
          ? new FormData(form).get(defaultInput.name)
          : null,
      defaultSlots: readSlotText(defaultRoot),
      defaultValue: defaultRoot?.getAttribute("data-value"),
      rootCount: document.querySelectorAll('[data-slot="input-otp"][data-sw-input-otp]').length,
    };
  });
  await page.evaluate(() => {
    const input = document.querySelector("#react-runtime-input-otp-controlled");
    const root = input?.closest("[data-sw-input-otp]");

    if (root instanceof HTMLElement) {
      root.click();
      for (const key of ["A", "3"]) {
        root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
      }
    }
  });
  await expectText(page.locator("[data-runtime-input-otp-value]"), "Input OTP value: 12A3");
  await expectText(page.locator("[data-runtime-input-otp-count]"), "Input OTP changes: 2");
  const updatedInputOtpState = await page.evaluate(() => {
    const input = document.querySelector("#react-runtime-input-otp-controlled");
    const root = input?.closest("[data-sw-input-otp]");
    const form = document.querySelector("[data-runtime-input-otp-form]");

    return {
      activeId: document.activeElement?.id,
      formValue:
        form instanceof HTMLFormElement && input instanceof HTMLInputElement
          ? new FormData(form).get(input.name)
          : null,
      hiddenInputValue: input instanceof HTMLInputElement ? input.value : null,
      slots: Array.from(root?.querySelectorAll("[data-sw-input-otp-char]") ?? []).map(
        (slot) => slot.textContent,
      ),
      value: root?.getAttribute("data-value"),
    };
  });
  if (
    initialInputOtpState.rootCount !== 3 ||
    initialInputOtpState.defaultValue !== "12" ||
    initialInputOtpState.defaultFormValue !== "12" ||
    initialInputOtpState.defaultSlots.join("") !== "12" ||
    initialInputOtpState.controlledDataSlot !== "input-otp" ||
    initialInputOtpState.controlledValue !== "12" ||
    initialInputOtpState.controlledFormValue !== "12" ||
    initialInputOtpState.controlledSlots.join("") !== "12" ||
    updatedInputOtpState.activeId !== "react-runtime-input-otp-controlled" ||
    updatedInputOtpState.value !== "12A3" ||
    updatedInputOtpState.hiddenInputValue !== "12A3" ||
    updatedInputOtpState.formValue !== "12A3" ||
    updatedInputOtpState.slots.join("") !== "12A3"
  ) {
    throw new Error(
      `Expected React Input OTP to sync controlled value, slots, and form data, got ${JSON.stringify(
        { initialInputOtpState, updatedInputOtpState },
      )}.`,
    );
  }

  try {
    await page.waitForFunction(() => {
      const volumeInput = document.querySelector(
        "#react-runtime-slider-volume [data-sw-slider-input]",
      );
      const rangeInputs = Array.from(
        document.querySelectorAll("#react-runtime-slider-range [data-sw-slider-input]"),
      );

      return (
        volumeInput instanceof HTMLInputElement &&
        volumeInput.name === "react-runtime-slider-volume" &&
        rangeInputs[0] instanceof HTMLInputElement &&
        rangeInputs[0].name === "react-runtime-slider-range[0]" &&
        rangeInputs[1] instanceof HTMLInputElement &&
        rangeInputs[1].name === "react-runtime-slider-range[1]"
      );
    });
  } catch (error) {
    const sliderNameDiagnostics = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-sw-slider]")).map((root) => ({
        id: root.id,
        dataName: root.getAttribute("data-name"),
        inputNames: Array.from(root.querySelectorAll("[data-sw-slider-input]")).map((input) =>
          input instanceof HTMLInputElement ? input.name : null,
        ),
      })),
    );

    throw new Error(
      `Timed out waiting for React slider input names to sync.\nsliders: ${JSON.stringify(
        sliderNameDiagnostics,
        null,
        2,
      )}\nmessages: ${JSON.stringify(messages, null, 2)}\n${String(error)}`,
    );
  }
  const initialSliderState = await page.evaluate(() => {
    const readSlider = (id) => {
      const root = document.querySelector(`#${id}[data-sw-slider]`);
      const control = root?.querySelector("[data-sw-slider-control]");
      const track = root?.querySelector("[data-sw-slider-track]");
      const indicator = root?.querySelector("[data-sw-slider-indicator]");
      const thumbs = Array.from(root?.querySelectorAll("[data-sw-slider-thumb]") ?? []);
      const inputs = Array.from(root?.querySelectorAll("[data-sw-slider-input]") ?? []);
      const firstThumb = thumbs[0];

      return {
        className: root?.getAttribute("class"),
        controlOrientation: control?.getAttribute("data-orientation"),
        dataName: root?.getAttribute("data-name"),
        dataSlot: root?.getAttribute("data-slot"),
        indicatorBottom: indicator instanceof HTMLElement ? indicator.style.bottom : null,
        indicatorHeight: indicator instanceof HTMLElement ? indicator.style.height : null,
        indicatorLeft: indicator instanceof HTMLElement ? indicator.style.left : null,
        indicatorOrientation: indicator?.getAttribute("data-orientation"),
        indicatorWidth: indicator instanceof HTMLElement ? indicator.style.width : null,
        inputNames: inputs.map((input) => (input instanceof HTMLInputElement ? input.name : null)),
        inputValues: inputs.map((input) =>
          input instanceof HTMLInputElement ? input.value : null,
        ),
        orientation: root?.getAttribute("data-orientation"),
        role: root?.getAttribute("role"),
        thumbAriaValue:
          firstThumb instanceof HTMLElement ? firstThumb.getAttribute("aria-valuenow") : null,
        thumbCount: thumbs.length,
        thumbOrientation: firstThumb?.getAttribute("data-orientation"),
        trackOrientation: track?.getAttribute("data-orientation"),
        value: root?.getAttribute("data-value"),
      };
    };

    return {
      controlled: readSlider("react-runtime-slider-controlled"),
      range: readSlider("react-runtime-slider-range"),
      rootCount: document.querySelectorAll('[data-slot="slider"][data-sw-slider]').length,
      vertical: readSlider("react-runtime-slider-vertical"),
      volume: readSlider("react-runtime-slider-volume"),
    };
  });
  if (
    initialSliderState.rootCount !== 13 ||
    initialSliderState.volume.role !== "group" ||
    initialSliderState.volume.dataSlot !== "slider" ||
    initialSliderState.volume.className?.includes("starwind-slider") === true ||
    initialSliderState.volume.className?.includes("relative") !== true ||
    initialSliderState.volume.className?.includes("flex") !== true ||
    initialSliderState.volume.className?.includes("w-full") !== true ||
    initialSliderState.volume.orientation !== "horizontal" ||
    initialSliderState.volume.controlOrientation !== "horizontal" ||
    initialSliderState.volume.trackOrientation !== "horizontal" ||
    initialSliderState.volume.indicatorOrientation !== "horizontal" ||
    initialSliderState.volume.thumbOrientation !== "horizontal" ||
    initialSliderState.volume.thumbCount !== 1 ||
    initialSliderState.volume.value !== "25" ||
    initialSliderState.volume.indicatorLeft !== "0%" ||
    initialSliderState.volume.indicatorWidth !== "25%" ||
    initialSliderState.volume.inputNames[0] !== "react-runtime-slider-volume" ||
    initialSliderState.volume.dataName !== "react-runtime-slider-volume" ||
    initialSliderState.volume.inputValues[0] !== "25" ||
    initialSliderState.range.thumbCount !== 2 ||
    initialSliderState.range.value !== "[20,80]" ||
    initialSliderState.range.indicatorLeft !== "20%" ||
    initialSliderState.range.indicatorWidth !== "60%" ||
    initialSliderState.range.inputNames[0] !== "react-runtime-slider-range[0]" ||
    initialSliderState.range.inputNames[1] !== "react-runtime-slider-range[1]" ||
    initialSliderState.range.dataName !== "react-runtime-slider-range" ||
    initialSliderState.controlled.value !== "25" ||
    initialSliderState.vertical.orientation !== "vertical" ||
    initialSliderState.vertical.controlOrientation !== "vertical" ||
    initialSliderState.vertical.trackOrientation !== "vertical" ||
    initialSliderState.vertical.indicatorOrientation !== "vertical" ||
    initialSliderState.vertical.thumbOrientation !== "vertical" ||
    initialSliderState.vertical.indicatorBottom !== "0%" ||
    initialSliderState.vertical.indicatorHeight !== "60%"
  ) {
    throw new Error(
      `Expected React sliders with Starwind orientation styling, range inputs, and initial values, got ${JSON.stringify(
        initialSliderState,
      )}.`,
    );
  }
  await expectText(page.locator("[data-runtime-slider-value]"), "Slider value: 25");
  await expectText(page.locator("[data-runtime-slider-count]"), "Slider changes: 0");
  await page.locator("#react-runtime-slider-controlled [data-sw-slider-thumb]").first().focus();
  await page.keyboard.press("ArrowRight");
  await expectText(page.locator("[data-runtime-slider-value]"), "Slider value: 26");
  await expectText(page.locator("[data-runtime-slider-count]"), "Slider changes: 1");
  const updatedControlledSliderState = await page
    .locator("#react-runtime-slider-controlled")
    .evaluate((root) => {
      const indicator = root.querySelector("[data-sw-slider-indicator]");
      const thumb = root.querySelector("[data-sw-slider-thumb]");
      const input = root.querySelector("[data-sw-slider-input]");

      return {
        indicatorWidth: indicator instanceof HTMLElement ? indicator.style.width : null,
        inputValue: input instanceof HTMLInputElement ? input.value : null,
        thumbAriaValue: thumb?.getAttribute("aria-valuenow"),
        value: root.getAttribute("data-value"),
      };
    });
  if (
    updatedControlledSliderState.value !== "26" ||
    updatedControlledSliderState.thumbAriaValue !== "26" ||
    updatedControlledSliderState.inputValue !== "26" ||
    updatedControlledSliderState.indicatorWidth !== "26%"
  ) {
    throw new Error(
      `Expected controlled React slider keyboard changes to sync DOM state, got ${JSON.stringify(
        updatedControlledSliderState,
      )}.`,
    );
  }

  const initialSwitchState = await page.evaluate(() => {
    const readSwitch = (id) => {
      const root = document.querySelector(`#${id}[data-sw-switch]`);
      const input = document.querySelector(`#${id}-input`);
      const label = document.querySelector(`label[data-slot="switch-label"][for="${id}"]`);
      const thumb = root?.querySelector("[data-sw-switch-thumb]");
      const uncheckedInput =
        input instanceof HTMLInputElement &&
        input.nextElementSibling instanceof HTMLInputElement &&
        input.nextElementSibling.hasAttribute("data-sw-switch-unchecked-input")
          ? input.nextElementSibling
          : null;
      const style = root instanceof HTMLElement ? getComputedStyle(root) : null;

      return {
        ariaChecked: root?.getAttribute("aria-checked"),
        ariaLabel: root?.getAttribute("aria-label"),
        className: root?.getAttribute("class"),
        disabled: root instanceof HTMLButtonElement ? root.disabled : undefined,
        hasChecked: root?.hasAttribute("data-checked"),
        hasDataSw: root?.hasAttribute("data-sw-switch"),
        hasDisabled: root?.hasAttribute("data-disabled"),
        hasReadOnly: root?.hasAttribute("data-readonly"),
        heightVariable: root instanceof HTMLElement ? root.style.getPropertyValue("--height") : "",
        inputChecked: input instanceof HTMLInputElement ? input.checked : undefined,
        inputName: input instanceof HTMLInputElement ? input.name : undefined,
        inputValue: input instanceof HTMLInputElement ? input.value : undefined,
        labelFor: label?.getAttribute("for"),
        labelText: label?.textContent?.trim(),
        opacity: style?.opacity,
        thumbClassName: thumb?.getAttribute("class"),
        thumbSlot: thumb?.getAttribute("data-slot"),
        translationVariable:
          thumb instanceof HTMLElement ? thumb.style.getPropertyValue("--translation") : "",
        uncheckedValue: uncheckedInput instanceof HTMLInputElement ? uncheckedInput.value : null,
      };
    };

    return {
      checked: readSwitch("react-runtime-switch-checked"),
      controlled: readSwitch("react-runtime-switch-controlled"),
      default: readSwitch("react-runtime-switch-default"),
      disabled: readSwitch("react-runtime-switch-disabled"),
      large: readSwitch("react-runtime-switch-large"),
      readOnly: readSwitch("react-runtime-switch-readonly"),
      reset: readSwitch("react-runtime-switch-reset"),
      rootCount: document.querySelectorAll(
        '#react-runtime-switch-demo [data-slot="switch-button"][data-sw-switch]',
      ).length,
    };
  });
  await page.locator('label[data-slot="switch-label"][for="react-runtime-switch-default"]').click();
  await expectText(page.locator("[data-runtime-switch-controlled]"), "Switch value: off");
  await expectText(page.locator("[data-runtime-switch-count]"), "Switch changes: 0");
  await page.locator("#react-runtime-switch-controlled").click();
  await expectText(page.locator("[data-runtime-switch-controlled]"), "Switch value: on");
  await expectText(page.locator("[data-runtime-switch-count]"), "Switch changes: 1");
  await page.evaluate(() => {
    document
      .querySelector("#react-runtime-switch-disabled")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    document
      .querySelector("#react-runtime-switch-readonly")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  await expectText(page.locator("[data-runtime-switch-ref]"), "switch-button");
  await page.locator("#react-runtime-switch-reset").click();
  await page.waitForFunction(() => {
    const root = document.querySelector("#react-runtime-switch-reset");
    const form = document.querySelector("[data-runtime-switch-reset-form]");

    return (
      root?.getAttribute("aria-checked") === "false" &&
      form instanceof HTMLFormElement &&
      new FormData(form).get("react-runtime-switch-reset") === "disabled"
    );
  });
  await page.locator("[data-runtime-switch-reset-form]").evaluate((form) => {
    if (form instanceof HTMLFormElement) {
      form.reset();
    }
  });
  await page.waitForFunction(() => {
    const root = document.querySelector("#react-runtime-switch-reset");
    const form = document.querySelector("[data-runtime-switch-reset-form]");

    return (
      root?.getAttribute("aria-checked") === "true" &&
      form instanceof HTMLFormElement &&
      new FormData(form).get("react-runtime-switch-reset") === "enabled"
    );
  });
  await page.getByRole("button", { name: "Rerender switch reset form" }).click();
  await expectText(
    page.locator('label[data-slot="switch-label"][for="react-runtime-switch-reset"]'),
    "Reset switch 1",
  );
  const updatedSwitchState = await page.evaluate(() => {
    const readSwitch = (id) => {
      const root = document.querySelector(`#${id}[data-sw-switch]`);
      const input = document.querySelector(`#${id}-input`);
      const uncheckedInput =
        input instanceof HTMLInputElement &&
        input.nextElementSibling instanceof HTMLInputElement &&
        input.nextElementSibling.hasAttribute("data-sw-switch-unchecked-input")
          ? input.nextElementSibling
          : null;

      return {
        ariaChecked: root?.getAttribute("aria-checked"),
        hasChecked: root?.hasAttribute("data-checked"),
        inputChecked: input instanceof HTMLInputElement ? input.checked : undefined,
        formValue:
          input instanceof HTMLInputElement && input.form
            ? new FormData(input.form).get(input.name)
            : null,
        uncheckedValue: uncheckedInput instanceof HTMLInputElement ? uncheckedInput.value : null,
      };
    };

    return {
      controlled: readSwitch("react-runtime-switch-controlled"),
      default: readSwitch("react-runtime-switch-default"),
      disabled: readSwitch("react-runtime-switch-disabled"),
      readOnly: readSwitch("react-runtime-switch-readonly"),
      reset: readSwitch("react-runtime-switch-reset"),
    };
  });
  if (
    initialSwitchState.rootCount !== 7 ||
    initialSwitchState.default.hasDataSw !== true ||
    initialSwitchState.default.hasChecked !== false ||
    initialSwitchState.default.inputChecked !== false ||
    initialSwitchState.default.inputName !== "react-runtime-switch-default" ||
    initialSwitchState.default.inputValue !== "enabled" ||
    initialSwitchState.default.uncheckedValue !== "disabled" ||
    initialSwitchState.default.labelFor !== "react-runtime-switch-default" ||
    initialSwitchState.default.labelText !== "Runtime switch" ||
    initialSwitchState.default.ariaLabel !== "Runtime switch" ||
    initialSwitchState.default.className?.includes("runtime-switch-custom") !== true ||
    initialSwitchState.default.className?.includes("border-input") !== true ||
    initialSwitchState.default.className?.includes("group") !== true ||
    initialSwitchState.default.heightVariable.includes("var(--spacing) * 5") !== true ||
    initialSwitchState.default.thumbClassName?.includes("transition-transform") !== true ||
    initialSwitchState.default.thumbSlot !== "switch-toggle" ||
    initialSwitchState.default.translationVariable.includes("var(--spacing) * 5") !== true ||
    initialSwitchState.checked.hasChecked !== true ||
    initialSwitchState.checked.inputChecked !== true ||
    initialSwitchState.checked.uncheckedValue !== null ||
    initialSwitchState.disabled.disabled !== true ||
    initialSwitchState.disabled.hasDisabled !== true ||
    Number(initialSwitchState.disabled.opacity) > 0.8 ||
    initialSwitchState.readOnly.hasReadOnly !== true ||
    initialSwitchState.readOnly.hasChecked !== true ||
    initialSwitchState.large.thumbClassName?.includes("size-6") !== true ||
    initialSwitchState.controlled.hasChecked !== false ||
    initialSwitchState.reset.hasChecked !== true ||
    initialSwitchState.reset.inputChecked !== true ||
    updatedSwitchState.default.hasChecked !== true ||
    updatedSwitchState.default.inputChecked !== true ||
    updatedSwitchState.default.uncheckedValue !== null ||
    updatedSwitchState.controlled.hasChecked !== true ||
    updatedSwitchState.controlled.inputChecked !== true ||
    updatedSwitchState.disabled.hasChecked !== false ||
    updatedSwitchState.disabled.inputChecked !== false ||
    updatedSwitchState.readOnly.hasChecked !== true ||
    updatedSwitchState.readOnly.inputChecked !== true ||
    updatedSwitchState.reset.ariaChecked !== "true" ||
    updatedSwitchState.reset.hasChecked !== true ||
    updatedSwitchState.reset.inputChecked !== true ||
    updatedSwitchState.reset.formValue !== "enabled" ||
    updatedSwitchState.reset.uncheckedValue !== null
  ) {
    throw new Error(
      `Expected React Switch runtime states, controlled updates, and Starwind classes, got ${JSON.stringify(
        { initialSwitchState, updatedSwitchState },
      )}.`,
    );
  }
}
