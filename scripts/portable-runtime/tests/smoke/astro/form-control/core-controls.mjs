export async function verifyAstroCoreControlCases({ page }) {
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
    inputGroupState.groupCount !== 20 ||
    inputGroupState.comboboxGroupCount !== 6 ||
    inputGroupState.controlCount !== 14 ||
    inputGroupState.textareaControlCount !== 1 ||
    inputGroupState.firstControlSlot !== "input-group-control" ||
    inputGroupState.firstControlClass?.includes("border-0") !== true ||
    inputGroupState.spinnerCount !== 6 ||
    inputGroupState.spinnerRoles.some((role) => role !== "status") ||
    inputGroupState.spinnerLabels.some((label) => label !== "Loading")
  ) {
    throw new Error(
      `Expected Astro InputGroup composed controls and Spinner status icons, got ${JSON.stringify(
        inputGroupState,
      )}.`,
    );
  }

  await page.waitForFunction(() => {
    const field = document.querySelector("#runtime-field-input");
    const control = document.querySelector("#runtime-field-input-control");
    return (
      field?.hasAttribute("data-invalid") &&
      control instanceof HTMLInputElement &&
      control.getAttribute("aria-invalid") === "true"
    );
  });
  const initialFieldState = await page.evaluate(() => {
    const field = document.querySelector("#runtime-field-input");
    const control = document.querySelector("#runtime-field-input-control");
    const label = document.querySelector('[data-sw-field-label][data-slot="field-label"]');
    const description = document.querySelector("#runtime-field-input-description");
    const error = document.querySelector("#runtime-field-input-error");

    return {
      ariaDescribedBy: control?.getAttribute("aria-describedby")?.split(/\s+/).sort() ?? [],
      ariaInvalid: control?.getAttribute("aria-invalid"),
      controlName: control instanceof HTMLInputElement ? control.name : null,
      dataSlot: field?.getAttribute("data-slot"),
      errorHidden: error instanceof HTMLElement ? error.hidden : null,
      hasInvalid: field?.hasAttribute("data-invalid"),
      labelFor: label instanceof HTMLLabelElement ? label.htmlFor : null,
      labelHasInvalid: label?.hasAttribute("data-invalid"),
      expectedIds: [description?.id, error?.id].filter(Boolean).sort(),
    };
  });
  const fieldInput = page.locator("#runtime-field-input-control");
  await fieldInput.fill("Lovelace");
  await fieldInput.blur();
  await page.waitForFunction(() => {
    const field = document.querySelector("#runtime-field-input");
    const control = document.querySelector("#runtime-field-input-control");
    return (
      field?.hasAttribute("data-valid") &&
      field.hasAttribute("data-dirty") &&
      field.hasAttribute("data-touched") &&
      control instanceof HTMLInputElement &&
      control.name === "runtime-field-input" &&
      !control.hasAttribute("aria-invalid")
    );
  });
  await page.locator("#runtime-field-checkbox [data-sw-checkbox]").click();
  await page.waitForFunction(() =>
    document.querySelector("#runtime-field-checkbox")?.hasAttribute("data-filled"),
  );
  await page.locator('#runtime-field-radio [data-sw-radio][data-value="pro"]').click();
  await page.waitForFunction(() =>
    document.querySelector("#runtime-field-radio")?.hasAttribute("data-filled"),
  );
  await page.locator("#runtime-field-switch-control").click();
  await page.waitForFunction(() =>
    document.querySelector("#runtime-field-switch")?.hasAttribute("data-filled"),
  );
  const finalFieldState = await page.evaluate(() => {
    const form = document.querySelector("[data-runtime-field-form]");
    const formData = form instanceof HTMLFormElement ? new FormData(form) : undefined;
    const inputField = document.querySelector("#runtime-field-input");
    const checkboxField = document.querySelector("#runtime-field-checkbox");
    const radioField = document.querySelector("#runtime-field-radio");
    const switchField = document.querySelector("#runtime-field-switch");
    const checkboxInput = document.querySelector(
      "#runtime-field-checkbox [data-sw-checkbox-input]",
    );
    const radioInput = document.querySelector(
      '#runtime-field-radio [data-sw-radio][data-value="pro"] [data-sw-radio-input]',
    );
    const switchInput = document.querySelector("#runtime-field-switch [data-sw-switch-input]");

    return {
      checkboxDirty: checkboxField?.hasAttribute("data-dirty"),
      checkboxFilled: checkboxField?.hasAttribute("data-filled"),
      checkboxFormValue: formData?.get("runtime-field-checkbox"),
      checkboxInputName: checkboxInput instanceof HTMLInputElement ? checkboxInput.name : null,
      inputDirty: inputField?.hasAttribute("data-dirty"),
      inputErrorHidden:
        document.querySelector("#runtime-field-input-error") instanceof HTMLElement
          ? document.querySelector("#runtime-field-input-error").hidden
          : null,
      inputFilled: inputField?.hasAttribute("data-filled"),
      inputFormValue: formData?.get("runtime-field-input"),
      inputTouched: inputField?.hasAttribute("data-touched"),
      inputValid: inputField?.hasAttribute("data-valid"),
      radioDirty: radioField?.hasAttribute("data-dirty"),
      radioFilled: radioField?.hasAttribute("data-filled"),
      radioFormValue: formData?.get("runtime-field-radio"),
      radioInputName: radioInput instanceof HTMLInputElement ? radioInput.name : null,
      switchDirty: switchField?.hasAttribute("data-dirty"),
      switchFilled: switchField?.hasAttribute("data-filled"),
      switchFormValue: formData?.get("runtime-field-switch"),
      switchInputName: switchInput instanceof HTMLInputElement ? switchInput.name : null,
    };
  });
  if (
    initialFieldState.ariaInvalid !== "true" ||
    initialFieldState.controlName !== "runtime-field-input" ||
    initialFieldState.dataSlot !== "field" ||
    initialFieldState.errorHidden !== false ||
    initialFieldState.hasInvalid !== true ||
    initialFieldState.labelFor !== "runtime-field-input-control" ||
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
    finalFieldState.checkboxInputName !== "runtime-field-checkbox" ||
    finalFieldState.radioDirty !== true ||
    finalFieldState.radioFilled !== true ||
    finalFieldState.radioFormValue !== "pro" ||
    finalFieldState.radioInputName !== "runtime-field-radio" ||
    finalFieldState.switchDirty !== true ||
    finalFieldState.switchFilled !== true ||
    finalFieldState.switchFormValue !== "enabled" ||
    finalFieldState.switchInputName !== "runtime-field-switch"
  ) {
    throw new Error(
      `Expected Astro Field to wire ARIA, validation, names, and state across controls, got ${JSON.stringify(
        { finalFieldState, initialFieldState },
      )}.`,
    );
  }

  const inputOtpState = await page.evaluate(() => {
    const defaultInput = document.querySelector("#runtime-input-otp-default");
    const defaultRoot = defaultInput?.closest("[data-sw-input-otp]");
    const recoveryInput = document.querySelector("#runtime-input-otp-recovery");
    const recoveryRoot = recoveryInput?.closest("[data-sw-input-otp]");
    const form = document.querySelector("[data-runtime-input-otp-form]");
    const defaultLabel = document.querySelector(
      'label[data-slot="label"][for="runtime-input-otp-default"]',
    );

    if (defaultLabel instanceof HTMLLabelElement) {
      defaultLabel.click();
    }

    defaultRoot?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "3" }),
    );

    if (recoveryRoot instanceof HTMLElement) {
      recoveryRoot.click();
      for (const key of ["a", "!", "2"]) {
        recoveryRoot.dispatchEvent(
          new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }),
        );
      }
    }

    const readSlotText = (root) =>
      Array.from(root?.querySelectorAll("[data-sw-input-otp-char]") ?? []).map(
        (slot) => slot.textContent,
      );

    return {
      activeId: document.activeElement?.id,
      defaultDataSlot: defaultRoot?.getAttribute("data-slot"),
      defaultFormValue:
        form instanceof HTMLFormElement && defaultInput instanceof HTMLInputElement
          ? new FormData(form).get(defaultInput.name)
          : null,
      defaultHiddenInputValue: defaultInput instanceof HTMLInputElement ? defaultInput.value : null,
      defaultSlots: readSlotText(defaultRoot),
      defaultValue: defaultRoot?.getAttribute("data-value"),
      recoveryFormValue:
        form instanceof HTMLFormElement && recoveryInput instanceof HTMLInputElement
          ? new FormData(form).get(recoveryInput.name)
          : null,
      recoveryInputMode: recoveryInput instanceof HTMLInputElement ? recoveryInput.inputMode : null,
      recoverySlots: readSlotText(recoveryRoot),
      recoveryValue: recoveryRoot?.getAttribute("data-value"),
      rootCount: document.querySelectorAll('[data-slot="input-otp"][data-sw-input-otp]').length,
      separatorCount: document.querySelectorAll('[data-slot="input-otp-separator"]').length,
      slotCount: document.querySelectorAll('[data-slot="input-otp-slot"]').length,
    };
  });
  if (
    inputOtpState.rootCount !== 3 ||
    inputOtpState.defaultDataSlot !== "input-otp" ||
    inputOtpState.activeId !== "runtime-input-otp-recovery" ||
    inputOtpState.defaultValue !== "123" ||
    inputOtpState.defaultHiddenInputValue !== "123" ||
    inputOtpState.defaultFormValue !== "123" ||
    inputOtpState.defaultSlots.join("") !== "123" ||
    inputOtpState.recoveryValue !== "a2" ||
    inputOtpState.recoveryFormValue !== "a2" ||
    inputOtpState.recoveryInputMode !== "text" ||
    inputOtpState.recoverySlots.join("") !== "a2" ||
    inputOtpState.separatorCount < 1 ||
    inputOtpState.slotCount < 18
  ) {
    throw new Error(
      `Expected Astro Input OTP to sync slots, form values, labels, and alphanumeric filtering, got ${JSON.stringify(
        inputOtpState,
      )}.`,
    );
  }

  const sliderState = await page.evaluate(async () => {
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

    const form = document.querySelector("[data-runtime-slider-form]");
    const initialFormData = form instanceof HTMLFormElement ? new FormData(form) : null;
    const volumeThumb = document.querySelector("#runtime-slider-volume [data-sw-slider-thumb]");
    const initial = {
      price: readSlider("runtime-slider-price"),
      rootCount: document.querySelectorAll('[data-slot="slider"][data-sw-slider]').length,
      step: readSlider("runtime-slider-step"),
      vertical: readSlider("runtime-slider-vertical"),
      volume: readSlider("runtime-slider-volume"),
      volumeFormValue: initialFormData?.get("volume"),
      priceStartFormValue: initialFormData?.get("price[0]"),
      priceEndFormValue: initialFormData?.get("price[1]"),
    };

    if (volumeThumb instanceof HTMLElement) {
      volumeThumb.focus();
      volumeThumb.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }),
      );
    }

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const updatedFormData = form instanceof HTMLFormElement ? new FormData(form) : null;

    return {
      afterKeyboard: readSlider("runtime-slider-volume"),
      initial,
      updatedVolumeFormValue: updatedFormData?.get("volume"),
    };
  });
  if (
    sliderState.initial.rootCount !== 13 ||
    sliderState.initial.volume.role !== "group" ||
    sliderState.initial.volume.dataSlot !== "slider" ||
    sliderState.initial.volume.className?.includes("starwind-slider") === true ||
    sliderState.initial.volume.className?.includes("relative") !== true ||
    sliderState.initial.volume.className?.includes("flex") !== true ||
    sliderState.initial.volume.className?.includes("w-full") !== true ||
    sliderState.initial.volume.orientation !== "horizontal" ||
    sliderState.initial.volume.controlOrientation !== "horizontal" ||
    sliderState.initial.volume.trackOrientation !== "horizontal" ||
    sliderState.initial.volume.indicatorOrientation !== "horizontal" ||
    sliderState.initial.volume.thumbOrientation !== "horizontal" ||
    sliderState.initial.volume.thumbCount !== 1 ||
    sliderState.initial.volume.value !== "25" ||
    sliderState.initial.volume.indicatorLeft !== "0%" ||
    sliderState.initial.volume.indicatorWidth !== "25%" ||
    sliderState.initial.volume.inputNames[0] !== "volume" ||
    sliderState.initial.volume.inputValues[0] !== "25" ||
    sliderState.initial.volumeFormValue !== "25" ||
    sliderState.initial.price.thumbCount !== 2 ||
    sliderState.initial.price.value !== "[20,80]" ||
    sliderState.initial.price.indicatorLeft !== "20%" ||
    sliderState.initial.price.indicatorWidth !== "60%" ||
    sliderState.initial.price.inputNames[0] !== "price[0]" ||
    sliderState.initial.price.inputNames[1] !== "price[1]" ||
    sliderState.initial.priceStartFormValue !== "20" ||
    sliderState.initial.priceEndFormValue !== "80" ||
    sliderState.initial.step.inputValues[0] !== "50" ||
    sliderState.initial.vertical.orientation !== "vertical" ||
    sliderState.initial.vertical.controlOrientation !== "vertical" ||
    sliderState.initial.vertical.trackOrientation !== "vertical" ||
    sliderState.initial.vertical.indicatorOrientation !== "vertical" ||
    sliderState.initial.vertical.thumbOrientation !== "vertical" ||
    sliderState.initial.vertical.indicatorBottom !== "0%" ||
    sliderState.initial.vertical.indicatorHeight !== "60%" ||
    sliderState.afterKeyboard.value !== "26" ||
    sliderState.afterKeyboard.thumbAriaValue !== "26" ||
    sliderState.afterKeyboard.inputValues[0] !== "26" ||
    sliderState.afterKeyboard.indicatorWidth !== "26%" ||
    sliderState.updatedVolumeFormValue !== "26"
  ) {
    throw new Error(
      `Expected Astro sliders with Starwind orientation styling, range inputs, form values, and keyboard updates, got ${JSON.stringify(
        sliderState,
      )}.`,
    );
  }

  const switchState = await page.evaluate(async () => {
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

    const disabledRoot = document.querySelector("#runtime-switch-disabled");
    const readOnlyRoot = document.querySelector("#runtime-switch-readonly");

    const initial = {
      checked: readSwitch("runtime-switch-checked"),
      default: readSwitch("runtime-switch-default"),
      disabled: readSwitch("runtime-switch-disabled"),
      large: readSwitch("runtime-switch-large"),
      readOnly: readSwitch("runtime-switch-readonly"),
      rootCount: document.querySelectorAll(
        '#runtime-switch-demo [data-slot="switch-button"][data-sw-switch]',
      ).length,
      small: readSwitch("runtime-switch-small"),
    };

    const defaultLabel = document.querySelector(
      'label[data-slot="switch-label"][for="runtime-switch-default"]',
    );
    if (defaultLabel instanceof HTMLElement) {
      defaultLabel.click();
    }
    disabledRoot?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    readOnlyRoot?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    return {
      afterToggle: {
        default: readSwitch("runtime-switch-default"),
        disabled: readSwitch("runtime-switch-disabled"),
        readOnly: readSwitch("runtime-switch-readonly"),
      },
      initial,
    };
  });
  if (
    switchState.initial.rootCount !== 6 ||
    switchState.initial.default.hasDataSw !== true ||
    switchState.initial.default.hasChecked !== false ||
    switchState.initial.default.inputChecked !== false ||
    switchState.initial.default.inputName !== "runtime-switch-default" ||
    switchState.initial.default.inputValue !== "enabled" ||
    switchState.initial.default.uncheckedValue !== "disabled" ||
    switchState.initial.default.labelFor !== "runtime-switch-default" ||
    switchState.initial.default.labelText !== "Runtime switch" ||
    switchState.initial.default.ariaLabel !== "Runtime switch" ||
    switchState.initial.default.className?.includes("runtime-switch-custom") !== true ||
    switchState.initial.default.className?.includes("border-input") !== true ||
    switchState.initial.default.className?.includes("group") !== true ||
    switchState.initial.default.heightVariable.includes("var(--spacing) * 5") !== true ||
    switchState.initial.default.thumbClassName?.includes("transition-transform") !== true ||
    switchState.initial.default.thumbSlot !== "switch-toggle" ||
    switchState.initial.default.translationVariable.includes("var(--spacing) * 5") !== true ||
    switchState.initial.checked.hasChecked !== true ||
    switchState.initial.checked.inputChecked !== true ||
    switchState.initial.checked.uncheckedValue !== null ||
    switchState.initial.disabled.disabled !== true ||
    switchState.initial.disabled.hasDisabled !== true ||
    Number(switchState.initial.disabled.opacity) > 0.8 ||
    switchState.initial.readOnly.hasReadOnly !== true ||
    switchState.initial.readOnly.hasChecked !== true ||
    switchState.initial.small.thumbClassName?.includes("size-4") !== true ||
    switchState.initial.large.thumbClassName?.includes("size-6") !== true ||
    switchState.afterToggle.default.hasChecked !== true ||
    switchState.afterToggle.default.inputChecked !== true ||
    switchState.afterToggle.default.uncheckedValue !== null ||
    switchState.afterToggle.disabled.hasChecked !== false ||
    switchState.afterToggle.disabled.inputChecked !== false ||
    switchState.afterToggle.readOnly.hasChecked !== true ||
    switchState.afterToggle.readOnly.inputChecked !== true
  ) {
    throw new Error(
      `Expected Astro Switch runtime states and Starwind classes, got ${JSON.stringify(
        switchState,
      )}.`,
    );
  }
}
