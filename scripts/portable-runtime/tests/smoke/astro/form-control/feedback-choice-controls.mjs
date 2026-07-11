export async function verifyAstroFeedbackChoiceControlCases({ page }) {
  const toastState = await page.evaluate(async () => {
    const wait = (delay) => new Promise((resolve) => window.setTimeout(resolve, delay));
    const waitUntil = async (predicate, timeout = 1500) => {
      const start = performance.now();
      while (performance.now() - start < timeout) {
        if (predicate()) return true;
        await wait(25);
      }
      return predicate();
    };
    const click = (selector) => {
      const element = document.querySelector(selector);
      if (element instanceof HTMLElement) {
        element.click();
      }
    };
    const viewport = document.querySelector("#runtime-toast-viewport");
    const readToasts = () =>
      Array.from(viewport?.querySelectorAll("[data-sw-toast-root]") ?? [])
        .filter((toast) => toast.parentElement === viewport)
        .map((toast) => {
          const style = getComputedStyle(toast);
          const rect = toast.getBoundingClientRect();
          const opacity = Number(style.opacity);

          return {
            state: toast.getAttribute("data-state"),
            starting: toast.hasAttribute("data-starting-style"),
            text: toast.textContent?.replace(/\s+/g, " ").trim(),
            variant: toast.getAttribute("data-variant"),
            visible:
              toast.getAttribute("data-state") === "open" &&
              !toast.hasAttribute("data-starting-style") &&
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              opacity > 0.5 &&
              rect.width > 0 &&
              rect.height > 0,
          };
        });

    click("#runtime-toast-default");
    await waitUntil(() => readToasts().some((toast) => toast.text?.includes("Runtime toast")));
    const afterDefault = readToasts();

    click("#runtime-toast-success");
    await waitUntil(() => readToasts().some((toast) => toast.text?.includes("Sync complete")));
    const afterSuccess = readToasts();

    click("#runtime-toast-action");
    await waitUntil(() =>
      Array.from(viewport?.querySelectorAll("[data-sw-toast-action]") ?? []).some(
        (button) => !button.hidden && button.textContent?.trim() === "Undo",
      ),
    );
    const actionButton = Array.from(
      viewport?.querySelectorAll("[data-sw-toast-action]") ?? [],
    ).find((button) => !button.hidden && button.textContent?.trim() === "Undo");
    if (actionButton instanceof HTMLElement) {
      actionButton.click();
    }
    await waitUntil(
      () =>
        document.querySelector("[data-runtime-toast-action-count]")?.textContent?.trim() ===
        "Toast actions: 1",
    );

    click("#runtime-toast-update");
    await wait(250);
    const afterUpdateLoading = readToasts();
    await waitUntil(() => readToasts().some((toast) => toast.text?.includes("Updated toast")));
    const afterUpdate = readToasts();

    click("#runtime-toast-update-sequence");
    await waitUntil(() =>
      readToasts().some(
        (toast) =>
          toast.text?.includes("Processing...") &&
          toast.text?.includes("Step 1 of 3") &&
          toast.visible,
      ),
    );
    const afterSequenceStepOne = readToasts();
    await waitUntil(() =>
      readToasts().some(
        (toast) =>
          toast.text?.includes("Still working...") &&
          toast.text?.includes("Step 2 of 3") &&
          toast.visible,
      ),
    );
    const afterSequenceStepTwo = readToasts();
    await waitUntil(() =>
      readToasts().some(
        (toast) =>
          toast.text?.includes("Complete!") &&
          toast.text?.includes("All steps finished") &&
          toast.visible,
      ),
    );
    const afterSequenceComplete = readToasts();

    click("#runtime-toast-promise");
    await wait(250);
    const afterPromiseLoading = readToasts();
    await waitUntil(() => readToasts().some((toast) => toast.text?.includes("Loaded Astro")));
    const afterPromise = readToasts();

    click("#runtime-toast-dismiss");
    await waitUntil(() => readToasts().filter((toast) => toast.state === "open").length === 0);

    return {
      actionCount: document.querySelector("[data-runtime-toast-action-count]")?.textContent?.trim(),
      ariaLive: viewport?.getAttribute("aria-live"),
      defaultRendered: afterDefault.some((toast) => toast.text?.includes("Runtime toast")),
      dismissedOpenCount: readToasts().filter((toast) => toast.state === "open").length,
      hasDataSwToastViewport: viewport?.hasAttribute("data-sw-toast-viewport") ?? null,
      position: viewport?.getAttribute("data-position"),
      promiseRendered: afterPromise.some((toast) => toast.text?.includes("Loaded Astro")),
      promiseVisible: afterPromise.some(
        (toast) => toast.text?.includes("Loaded Astro") && toast.visible,
      ),
      role: viewport?.getAttribute("role"),
      successRendered: afterSuccess.some((toast) => toast.text?.includes("Sync complete")),
      templateCount: viewport?.querySelectorAll("template[data-sw-toast-template]").length ?? 0,
      sequenceCompleteVariant: afterSequenceComplete.find((toast) =>
        toast.text?.includes("Complete!"),
      )?.variant,
      sequenceCompleteVisible: afterSequenceComplete.some(
        (toast) =>
          toast.text?.includes("Complete!") &&
          toast.text?.includes("All steps finished") &&
          toast.visible,
      ),
      sequenceStepOneVisible: afterSequenceStepOne.some(
        (toast) =>
          toast.text?.includes("Processing...") &&
          toast.text?.includes("Step 1 of 3") &&
          toast.visible,
      ),
      sequenceStepTwoVisible: afterSequenceStepTwo.some(
        (toast) =>
          toast.text?.includes("Still working...") &&
          toast.text?.includes("Step 2 of 3") &&
          toast.visible,
      ),
      updateLoadingStillVisible: afterUpdateLoading.some(
        (toast) =>
          toast.text?.includes("Working on it") && toast.variant === "loading" && toast.visible,
      ),
      updateRendered: afterUpdate.some((toast) => toast.text?.includes("Updated toast")),
      updatedVariant: afterUpdate.find((toast) => toast.text?.includes("Updated toast"))?.variant,
      updateVisible: afterUpdate.some(
        (toast) => toast.text?.includes("Updated toast") && toast.visible,
      ),
      promiseLoadingStillVisible: afterPromiseLoading.some(
        (toast) =>
          toast.text?.includes("Promise loading") && toast.variant === "loading" && toast.visible,
      ),
    };
  });
  if (
    toastState.hasDataSwToastViewport !== true ||
    toastState.role !== "region" ||
    toastState.ariaLive !== "polite" ||
    toastState.position !== "bottom-right" ||
    toastState.templateCount < 6 ||
    toastState.defaultRendered !== true ||
    toastState.successRendered !== true ||
    toastState.actionCount !== "Toast actions: 1" ||
    toastState.sequenceStepOneVisible !== true ||
    toastState.sequenceStepTwoVisible !== true ||
    toastState.sequenceCompleteVisible !== true ||
    toastState.sequenceCompleteVariant !== "success" ||
    toastState.updateLoadingStillVisible !== true ||
    toastState.updateRendered !== true ||
    toastState.updateVisible !== true ||
    toastState.updatedVariant !== "success" ||
    toastState.promiseLoadingStillVisible !== true ||
    toastState.promiseRendered !== true ||
    toastState.promiseVisible !== true ||
    toastState.dismissedOpenCount !== 0
  ) {
    throw new Error(
      `Expected Astro Toast viewport, templates, action, update, promise, and dismiss behavior, got ${JSON.stringify(
        toastState,
      )}.`,
    );
  }

  const alertState = await page.evaluate(() => {
    const readAlert = (selector) => {
      const root = document.querySelector(selector);
      const title = root?.querySelector('[data-slot="alert-title"]');
      const description = root?.querySelector('[data-slot="alert-description"]');

      return {
        className: root?.getAttribute("class"),
        descriptionClassName: description?.getAttribute("class"),
        descriptionText: description?.textContent?.trim(),
        hasDataSwAlert: root?.hasAttribute("data-sw-alert"),
        hasTitleIcon: Boolean(title?.querySelector("svg")),
        role: root?.getAttribute("role"),
        titleClassName: title?.getAttribute("class"),
        titleText: title?.textContent?.replace(/\s+/g, " ").trim(),
      };
    };

    return {
      count: document.querySelectorAll('[data-slot="alert"][data-sw-alert]').length,
      defaultAlert: readAlert("#runtime-alert-default"),
      overrideAlert: readAlert("#runtime-alert-error-override"),
      warningAlert: readAlert("#runtime-alert-warning"),
    };
  });
  if (
    alertState.count !== 3 ||
    alertState.defaultAlert.hasDataSwAlert !== true ||
    alertState.defaultAlert.role !== "status" ||
    alertState.defaultAlert.className?.includes("runtime-alert-custom") !== true ||
    alertState.defaultAlert.className?.includes("text-foreground") !== true ||
    alertState.defaultAlert.className?.includes("rounded-lg") !== true ||
    alertState.defaultAlert.titleText !== "Heads up!" ||
    alertState.defaultAlert.titleClassName?.includes("font-heading") !== true ||
    alertState.defaultAlert.descriptionText !==
      "Generated alert anatomy with the default status role." ||
    alertState.defaultAlert.descriptionClassName?.includes("leading-relaxed") !== true ||
    alertState.warningAlert.role !== "alert" ||
    alertState.warningAlert.className?.includes("border-warning") !== true ||
    alertState.warningAlert.className?.includes("bg-warning/7") !== true ||
    alertState.warningAlert.hasTitleIcon !== true ||
    alertState.warningAlert.titleText !== "Check this first" ||
    alertState.overrideAlert.role !== "status" ||
    alertState.overrideAlert.className?.includes("border-error") !== true ||
    alertState.overrideAlert.className?.includes("bg-error/7") !== true ||
    alertState.overrideAlert.hasTitleIcon !== true ||
    alertState.overrideAlert.titleText !== "Non-interruptive error"
  ) {
    throw new Error(
      `Expected Astro Alert roles, variants, and anatomy to match Starwind, got ${JSON.stringify(
        alertState,
      )}.`,
    );
  }

  const checkboxState = await page.evaluate(async () => {
    const readCheckbox = (id) => {
      const root = document.querySelector(`[data-sw-checkbox][data-id="${id}"]`);
      const input = root?.querySelector("[data-sw-checkbox-input]");
      const indicator = root?.querySelector('[data-slot="checkbox-indicator"]');
      const icon = indicator?.querySelector("[data-sw-checkbox-check-icon]");
      const label = root?.parentElement?.querySelector('[data-slot="checkbox-label"]');
      const rootRect = root instanceof HTMLElement ? root.getBoundingClientRect() : undefined;
      const indicatorRect =
        indicator instanceof HTMLElement ? indicator.getBoundingClientRect() : undefined;
      const iconRect = icon instanceof SVGElement ? icon.getBoundingClientRect() : undefined;
      const indicatorStyle =
        indicator instanceof HTMLElement ? getComputedStyle(indicator) : undefined;
      const iconStyle = icon instanceof SVGElement ? getComputedStyle(icon) : undefined;
      const rootCenter = rootRect
        ? {
            x: rootRect.left + rootRect.width / 2,
            y: rootRect.top + rootRect.height / 2,
          }
        : undefined;
      const indicatorCenter = indicatorRect
        ? {
            x: indicatorRect.left + indicatorRect.width / 2,
            y: indicatorRect.top + indicatorRect.height / 2,
          }
        : undefined;
      const iconCenter = iconRect
        ? {
            x: iconRect.left + iconRect.width / 2,
            y: iconRect.top + iconRect.height / 2,
          }
        : undefined;

      return {
        ariaChecked: root?.getAttribute("aria-checked"),
        ariaLabel: root?.getAttribute("aria-label"),
        className: root?.getAttribute("class"),
        hasChecked: root?.hasAttribute("data-checked"),
        hasDataSw: root?.hasAttribute("data-sw-checkbox"),
        hasDisabled: root?.hasAttribute("data-disabled"),
        hasIndeterminate: root?.hasAttribute("data-indeterminate"),
        iconAnimationName: iconStyle?.animationName,
        iconCenterDeltaX:
          rootCenter && iconCenter ? Math.abs(rootCenter.x - iconCenter.x) : undefined,
        iconCenterDeltaY:
          rootCenter && iconCenter ? Math.abs(rootCenter.y - iconCenter.y) : undefined,
        iconClassName: icon?.getAttribute("class"),
        iconHasDataSw: icon?.hasAttribute("data-sw-checkbox-check-icon"),
        iconOpacity: iconStyle?.opacity,
        iconStrokeDasharray: iconStyle?.strokeDasharray,
        indicatorClassName: indicator?.getAttribute("class"),
        indicatorCenterDeltaX:
          rootCenter && indicatorCenter ? Math.abs(rootCenter.x - indicatorCenter.x) : undefined,
        indicatorCenterDeltaY:
          rootCenter && indicatorCenter ? Math.abs(rootCenter.y - indicatorCenter.y) : undefined,
        indicatorHidden: indicator instanceof HTMLElement ? indicator.hidden : undefined,
        indicatorOpacity: indicatorStyle?.opacity,
        inputChecked: input instanceof HTMLInputElement ? input.checked : undefined,
        inputId: input instanceof HTMLInputElement ? input.id : undefined,
        inputName: input instanceof HTMLInputElement ? input.name : undefined,
        inputValue: input instanceof HTMLInputElement ? input.value : undefined,
        labelFor: label?.getAttribute("for"),
        labelText: label?.textContent?.trim(),
      };
    };

    const defaultRoot = document.querySelector(
      '[data-sw-checkbox][data-id="runtime-checkbox-default"]',
    );
    const indeterminateRoot = document.querySelector(
      '[data-sw-checkbox][data-id="runtime-checkbox-indeterminate"]',
    );
    const disabledRoot = document.querySelector(
      '[data-sw-checkbox][data-id="runtime-checkbox-disabled"]',
    );

    const initial = {
      checked: readCheckbox("runtime-checkbox-checked"),
      default: readCheckbox("runtime-checkbox-default"),
      disabled: readCheckbox("runtime-checkbox-disabled"),
      indeterminate: readCheckbox("runtime-checkbox-indeterminate"),
      rootCount: document.querySelectorAll('[data-slot="checkbox"][data-sw-checkbox]').length,
    };

    defaultRoot?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    indeterminateRoot?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    disabledRoot?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
    await new Promise((resolve) => setTimeout(resolve, 220));

    return {
      afterToggle: {
        default: readCheckbox("runtime-checkbox-default"),
        disabled: readCheckbox("runtime-checkbox-disabled"),
        indeterminate: readCheckbox("runtime-checkbox-indeterminate"),
      },
      initial,
    };
  });

  const checkboxGroupState = await page.evaluate(() => {
    const readCheckbox = (id) => {
      const root = document.querySelector(`[data-sw-checkbox][data-id="${id}"]`);
      const input = root?.querySelector("[data-sw-checkbox-input]");

      return {
        ariaChecked: root?.getAttribute("aria-checked"),
        ariaDisabled: root?.getAttribute("aria-disabled"),
        hasChecked: root?.hasAttribute("data-checked"),
        hasDisabled: root?.hasAttribute("data-disabled"),
        inputChecked: input instanceof HTMLInputElement ? input.checked : undefined,
      };
    };
    const defaultGroup = document.querySelector("[data-runtime-checkbox-group-default]");
    const disabledGroup = document.querySelector("[data-runtime-checkbox-group-disabled]");
    const smsRoot = document.querySelector(
      '[data-sw-checkbox][data-id="runtime-checkbox-group-sms"]',
    );
    const disabledSecurityRoot = document.querySelector(
      '[data-sw-checkbox][data-id="runtime-checkbox-group-disabled-security"]',
    );

    const initial = {
      defaultGroupAriaLabelledby: defaultGroup?.getAttribute("aria-labelledby"),
      defaultGroupClassName: defaultGroup?.getAttribute("class"),
      defaultGroupRole: defaultGroup?.getAttribute("role"),
      defaultGroupValue: defaultGroup?.getAttribute("data-value"),
      disabledGroupHasDisabled: disabledGroup?.hasAttribute("data-disabled"),
      disabledGroupValue: disabledGroup?.getAttribute("data-value"),
      disabledSecurity: readCheckbox("runtime-checkbox-group-disabled-security"),
      email: readCheckbox("runtime-checkbox-group-email"),
      sms: readCheckbox("runtime-checkbox-group-sms"),
    };

    smsRoot?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    disabledSecurityRoot?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    return {
      afterToggle: {
        defaultGroupValue: defaultGroup?.getAttribute("data-value"),
        disabledGroupValue: disabledGroup?.getAttribute("data-value"),
        disabledSecurity: readCheckbox("runtime-checkbox-group-disabled-security"),
        sms: readCheckbox("runtime-checkbox-group-sms"),
      },
      initial,
    };
  });

  const radioGroupState = await page.evaluate(() => {
    const readRadio = (id) => {
      const root = document.querySelector(`[data-sw-radio][data-id="${id}"]`);
      const input = root?.querySelector("[data-sw-radio-input]");
      const control = root?.querySelector('[data-slot="radio-group-item-control"]');
      const indicator = root?.querySelector("[data-sw-radio-indicator]");
      const icon = indicator?.querySelector("svg");
      const readRect = (element) => {
        if (!(element instanceof Element)) return null;
        const rect = element.getBoundingClientRect();

        return {
          centerX: rect.x + rect.width / 2,
          centerY: rect.y + rect.height / 2,
          height: rect.height,
          width: rect.width,
        };
      };
      const controlRect = readRect(control);
      const indicatorRect = readRect(indicator);
      const iconRect = readRect(icon);

      return {
        ariaChecked: root?.getAttribute("aria-checked"),
        ariaDisabled: root?.getAttribute("aria-disabled"),
        ariaLabel: root?.getAttribute("aria-label"),
        controlClassName: control?.getAttribute("class"),
        controlSlot: control?.getAttribute("data-slot"),
        iconCenterDeltaX:
          controlRect && iconRect ? Math.abs(controlRect.centerX - iconRect.centerX) : null,
        iconCenterDeltaY:
          controlRect && iconRect ? Math.abs(controlRect.centerY - iconRect.centerY) : null,
        iconHeight: iconRect?.height ?? null,
        iconWidth: iconRect?.width ?? null,
        indicatorCenterDeltaX:
          controlRect && indicatorRect
            ? Math.abs(controlRect.centerX - indicatorRect.centerX)
            : null,
        indicatorCenterDeltaY:
          controlRect && indicatorRect
            ? Math.abs(controlRect.centerY - indicatorRect.centerY)
            : null,
        hasChecked: root?.hasAttribute("data-checked"),
        hasDisabled: root?.hasAttribute("data-disabled"),
        indicatorClassName: indicator?.getAttribute("class"),
        indicatorSlot: indicator?.getAttribute("data-slot"),
        indicatorHeight: indicatorRect?.height ?? null,
        indicatorHidden: indicator instanceof HTMLElement ? indicator.hidden : undefined,
        indicatorWidth: indicatorRect?.width ?? null,
        inputChecked: input instanceof HTMLInputElement ? input.checked : undefined,
        inputName: input instanceof HTMLInputElement ? input.name : undefined,
        inputValue: input instanceof HTMLInputElement ? input.value : undefined,
        rootClassName: root?.getAttribute("class"),
        rootSlot: root?.getAttribute("data-slot"),
      };
    };
    const defaultGroup = document.querySelector("[data-runtime-radio-group-default]");
    const disabledGroup = document.querySelector("[data-runtime-radio-group-disabled]");
    const expressRoot = document.querySelector(
      '[data-sw-radio][data-id="runtime-radio-group-express"]',
    );
    const disabledProductionRoot = document.querySelector(
      '[data-sw-radio][data-id="runtime-radio-group-disabled-production"]',
    );

    const initial = {
      defaultGroupAriaLabelledby: defaultGroup?.getAttribute("aria-labelledby"),
      defaultGroupClassName: defaultGroup?.getAttribute("class"),
      defaultGroupRole: defaultGroup?.getAttribute("role"),
      defaultGroupValue: defaultGroup?.getAttribute("data-value"),
      disabledGroupHasDisabled: disabledGroup?.hasAttribute("data-disabled"),
      disabledGroupValue: disabledGroup?.getAttribute("data-value"),
      disabledProduction: readRadio("runtime-radio-group-disabled-production"),
      express: readRadio("runtime-radio-group-express"),
      rootCount: document.querySelectorAll("[data-sw-radio]").length,
      standard: readRadio("runtime-radio-group-standard"),
    };

    expressRoot?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    disabledProductionRoot?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    return {
      afterToggle: {
        defaultGroupValue: defaultGroup?.getAttribute("data-value"),
        disabledGroupValue: disabledGroup?.getAttribute("data-value"),
        disabledProduction: readRadio("runtime-radio-group-disabled-production"),
        express: readRadio("runtime-radio-group-express"),
        standard: readRadio("runtime-radio-group-standard"),
      },
      initial,
    };
  });

  const hiddenFormControlInputState = await page.evaluate(() => {
    const readInputs = (selector) =>
      Array.from(document.querySelectorAll(selector)).map((input) => {
        const style = input instanceof HTMLElement ? getComputedStyle(input) : null;

        return {
          ariaHidden: input.getAttribute("aria-hidden"),
          display: style?.display ?? null,
          height: style?.height ?? null,
          hidden: input instanceof HTMLElement ? input.hidden : null,
          id: input.id,
          name: input instanceof HTMLInputElement ? input.name : null,
          overflow: style?.overflow ?? null,
          position: style?.position ?? null,
          tabIndex: input instanceof HTMLElement ? input.tabIndex : null,
          whiteSpace: style?.whiteSpace ?? null,
          width: style?.width ?? null,
        };
      });

    return {
      checkbox: readInputs("[data-sw-checkbox-input]"),
      radio: readInputs("[data-sw-radio-input]"),
      switch: readInputs("[data-sw-switch-input]"),
    };
  });
  const hiddenFormControlInputsAreHidden = [
    ...hiddenFormControlInputState.checkbox,
    ...hiddenFormControlInputState.radio,
  ].every((input) => input.hidden === true && input.display === "none");
  const switchInputsAreVisuallyHidden = hiddenFormControlInputState.switch.every(
    (input) =>
      input.hidden === false &&
      input.ariaHidden === "true" &&
      input.position === "absolute" &&
      input.width === "1px" &&
      input.height === "1px" &&
      input.overflow === "hidden" &&
      input.whiteSpace === "nowrap" &&
      input.tabIndex === -1,
  );
  if (!hiddenFormControlInputsAreHidden || !switchInputsAreVisuallyHidden) {
    throw new Error(
      `Expected Astro Checkbox and RadioGroup native inputs to stay hidden and Switch native inputs to stay visually hidden, got ${JSON.stringify(
        hiddenFormControlInputState,
      )}.`,
    );
  }

  if (
    checkboxState.initial.rootCount !== 11 ||
    checkboxState.initial.default.hasDataSw !== true ||
    checkboxState.initial.default.hasChecked !== false ||
    checkboxState.initial.default.inputChecked !== false ||
    checkboxState.initial.default.inputId !== "runtime-checkbox-default" ||
    checkboxState.initial.default.inputName !== "runtime-checkbox-default" ||
    checkboxState.initial.default.inputValue !== "accepted" ||
    checkboxState.initial.default.ariaLabel !== "Accept runtime terms" ||
    checkboxState.initial.default.labelFor !== "runtime-checkbox-default" ||
    checkboxState.initial.default.labelText !== "Accept runtime terms" ||
    checkboxState.initial.default.className?.includes("runtime-checkbox-custom") !== true ||
    checkboxState.initial.default.className?.includes("border-input") !== true ||
    checkboxState.initial.default.className?.includes("relative") !== true ||
    checkboxState.initial.default.className?.includes("items-center") !== true ||
    checkboxState.initial.default.className?.includes("data-checked:bg-primary") !== true ||
    checkboxState.initial.default.indicatorHidden !== false ||
    checkboxState.initial.default.indicatorOpacity !== "0" ||
    checkboxState.initial.default.indicatorClassName?.includes("grid") !== true ||
    checkboxState.initial.default.indicatorClassName?.includes("place-content-center") !== true ||
    checkboxState.initial.default.indicatorClassName?.includes("p-0.5") !== true ||
    checkboxState.initial.default.indicatorClassName?.includes("starwind-check-icon") === true ||
    checkboxState.initial.default.iconClassName?.includes("starwind-check-icon") === true ||
    checkboxState.initial.default.iconHasDataSw !== true ||
    checkboxState.initial.default.iconOpacity !== "0" ||
    !["65", "65px"].includes(checkboxState.initial.default.iconStrokeDasharray ?? "") ||
    (checkboxState.initial.default.indicatorCenterDeltaX ?? 999) > 1 ||
    (checkboxState.initial.default.indicatorCenterDeltaY ?? 999) > 1 ||
    (checkboxState.initial.default.iconCenterDeltaX ?? 999) > 1 ||
    (checkboxState.initial.default.iconCenterDeltaY ?? 999) > 1 ||
    checkboxState.initial.checked.hasChecked !== true ||
    checkboxState.initial.checked.inputChecked !== true ||
    checkboxState.initial.checked.indicatorOpacity !== "1" ||
    checkboxState.initial.checked.iconAnimationName !== "draw-check" ||
    checkboxState.initial.indeterminate.ariaChecked !== "mixed" ||
    checkboxState.initial.indeterminate.hasIndeterminate !== true ||
    checkboxState.initial.disabled.hasDisabled !== true ||
    checkboxState.afterToggle.default.hasChecked !== true ||
    checkboxState.afterToggle.default.inputChecked !== true ||
    checkboxState.afterToggle.default.indicatorOpacity !== "1" ||
    checkboxState.afterToggle.default.iconAnimationName !== "draw-check" ||
    checkboxState.afterToggle.indeterminate.ariaChecked !== "true" ||
    checkboxState.afterToggle.indeterminate.hasIndeterminate !== false ||
    checkboxState.afterToggle.disabled.hasChecked !== false ||
    checkboxState.afterToggle.disabled.inputChecked !== false
  ) {
    throw new Error(
      `Expected Astro Checkbox runtime states and Starwind classes, got ${JSON.stringify(
        checkboxState,
      )}.`,
    );
  }

  if (
    checkboxGroupState.initial.defaultGroupRole !== "group" ||
    checkboxGroupState.initial.defaultGroupAriaLabelledby !== "runtime-checkbox-group-heading" ||
    checkboxGroupState.initial.defaultGroupClassName?.includes("starwind-checkbox-group") ===
      true ||
    checkboxGroupState.initial.defaultGroupClassName?.includes("grid") !== true ||
    checkboxGroupState.initial.defaultGroupClassName?.includes("runtime-checkbox-group-custom") !==
      true ||
    checkboxGroupState.initial.defaultGroupValue !== '["email"]' ||
    checkboxGroupState.initial.email.hasChecked !== true ||
    checkboxGroupState.initial.email.inputChecked !== true ||
    checkboxGroupState.initial.sms.hasChecked !== false ||
    checkboxGroupState.initial.disabledGroupHasDisabled !== true ||
    checkboxGroupState.initial.disabledGroupValue !== "[]" ||
    checkboxGroupState.initial.disabledSecurity.ariaDisabled !== "true" ||
    checkboxGroupState.initial.disabledSecurity.hasDisabled !== true ||
    checkboxGroupState.afterToggle.defaultGroupValue !== '["email","sms"]' ||
    checkboxGroupState.afterToggle.sms.ariaChecked !== "true" ||
    checkboxGroupState.afterToggle.sms.inputChecked !== true ||
    checkboxGroupState.afterToggle.disabledGroupValue !== "[]" ||
    checkboxGroupState.afterToggle.disabledSecurity.hasChecked !== false ||
    checkboxGroupState.afterToggle.disabledSecurity.inputChecked !== false
  ) {
    throw new Error(
      `Expected Astro CheckboxGroup default and disabled behavior, got ${JSON.stringify(
        checkboxGroupState,
      )}.`,
    );
  }

  if (
    radioGroupState.initial.rootCount !== 6 ||
    radioGroupState.initial.defaultGroupRole !== "radiogroup" ||
    radioGroupState.initial.defaultGroupAriaLabelledby !== "runtime-radio-group-heading" ||
    radioGroupState.initial.defaultGroupClassName?.includes("starwind-radio-group") === true ||
    radioGroupState.initial.defaultGroupClassName?.includes("grid") !== true ||
    radioGroupState.initial.defaultGroupClassName?.includes("runtime-radio-group-custom") !==
      true ||
    radioGroupState.initial.defaultGroupValue !== "standard" ||
    radioGroupState.initial.standard.hasChecked !== true ||
    radioGroupState.initial.standard.inputChecked !== true ||
    radioGroupState.initial.standard.inputName !== "runtime-delivery" ||
    radioGroupState.initial.standard.inputValue !== "standard" ||
    radioGroupState.initial.standard.ariaLabel !== "Standard delivery" ||
    radioGroupState.initial.standard.rootSlot !== "radio-group-item" ||
    radioGroupState.initial.standard.rootClassName?.includes("starwind-radio-item") === true ||
    radioGroupState.initial.standard.controlSlot !== "radio-group-item-control" ||
    radioGroupState.initial.standard.controlClassName?.includes("starwind-radio-control") ===
      true ||
    radioGroupState.initial.standard.indicatorSlot !== "radio-group-item-indicator" ||
    radioGroupState.initial.standard.indicatorClassName?.includes("starwind-radio-indicator") ===
      true ||
    radioGroupState.initial.standard.indicatorHidden !== false ||
    radioGroupState.initial.standard.indicatorWidth !== 12 ||
    radioGroupState.initial.standard.indicatorHeight !== 12 ||
    radioGroupState.initial.standard.iconWidth !== 12 ||
    radioGroupState.initial.standard.iconHeight !== 12 ||
    (radioGroupState.initial.standard.indicatorCenterDeltaX ?? 999) > 1 ||
    (radioGroupState.initial.standard.indicatorCenterDeltaY ?? 999) > 1 ||
    (radioGroupState.initial.standard.iconCenterDeltaX ?? 999) > 1 ||
    (radioGroupState.initial.standard.iconCenterDeltaY ?? 999) > 1 ||
    radioGroupState.initial.express.hasChecked !== false ||
    radioGroupState.initial.express.ariaLabel !== "Express delivery" ||
    radioGroupState.initial.disabledGroupHasDisabled !== true ||
    radioGroupState.initial.disabledGroupValue !== "sandbox" ||
    radioGroupState.initial.disabledProduction.ariaDisabled !== "true" ||
    radioGroupState.initial.disabledProduction.hasDisabled !== true ||
    radioGroupState.afterToggle.defaultGroupValue !== "express" ||
    radioGroupState.afterToggle.standard.ariaChecked !== "false" ||
    radioGroupState.afterToggle.express.ariaChecked !== "true" ||
    radioGroupState.afterToggle.express.inputChecked !== true ||
    radioGroupState.afterToggle.disabledGroupValue !== "sandbox" ||
    radioGroupState.afterToggle.disabledProduction.hasChecked !== false ||
    radioGroupState.afterToggle.disabledProduction.inputChecked !== false
  ) {
    throw new Error(
      `Expected Astro RadioGroup default and disabled behavior, got ${JSON.stringify(
        radioGroupState,
      )}.`,
    );
  }
}
