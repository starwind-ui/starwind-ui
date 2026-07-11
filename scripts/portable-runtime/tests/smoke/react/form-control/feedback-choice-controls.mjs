import { expectText } from "../../shared/text.mjs";

export async function verifyReactFeedbackChoiceControlCases({ page }) {
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
    const viewport = document.querySelector("#react-runtime-toast-viewport");
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

    click("#react-runtime-toast-default");
    await waitUntil(() =>
      readToasts().some((toast) => toast.text?.includes("React runtime toast")),
    );
    const afterDefault = readToasts();

    click("#react-runtime-toast-success");
    await waitUntil(() => readToasts().some((toast) => toast.text?.includes("Sync complete")));
    const afterSuccess = readToasts();

    click("#react-runtime-toast-action");
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

    click("#react-runtime-toast-update");
    await wait(250);
    const afterUpdateLoading = readToasts();
    await waitUntil(() => readToasts().some((toast) => toast.text?.includes("Updated toast")));
    const afterUpdate = readToasts();

    click("#react-runtime-toast-update-sequence");
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

    click("#react-runtime-toast-promise");
    await wait(250);
    const afterPromiseLoading = readToasts();
    await waitUntil(() => readToasts().some((toast) => toast.text?.includes("Loaded React")));
    const afterPromise = readToasts();

    click("#react-runtime-toast-dismiss");
    await waitUntil(() => readToasts().filter((toast) => toast.state === "open").length === 0);

    return {
      actionCount: document.querySelector("[data-runtime-toast-action-count]")?.textContent?.trim(),
      ariaLive: viewport?.getAttribute("aria-live"),
      defaultRendered: afterDefault.some((toast) => toast.text?.includes("React runtime toast")),
      dismissedOpenCount: readToasts().filter((toast) => toast.state === "open").length,
      hasDataSwToastViewport: viewport?.hasAttribute("data-sw-toast-viewport") ?? null,
      position: viewport?.getAttribute("data-position"),
      promiseRendered: afterPromise.some((toast) => toast.text?.includes("Loaded React")),
      promiseVisible: afterPromise.some(
        (toast) => toast.text?.includes("Loaded React") && toast.visible,
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
      `Expected React Toast viewport, templates, action, update, promise, and dismiss behavior, got ${JSON.stringify(
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
      defaultAlert: readAlert("#react-runtime-alert-default"),
      overrideAlert: readAlert("#react-runtime-alert-error-override"),
      warningAlert: readAlert("#react-runtime-alert-warning"),
    };
  });
  await expectText(page.locator("[data-runtime-alert-ref]"), "alert");
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
      `Expected React Alert roles, variants, and anatomy to match Starwind, got ${JSON.stringify(
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
      '[data-sw-checkbox][data-id="react-runtime-checkbox-default"]',
    );
    const indeterminateRoot = document.querySelector(
      '[data-sw-checkbox][data-id="react-runtime-checkbox-indeterminate"]',
    );
    const disabledRoot = document.querySelector(
      '[data-sw-checkbox][data-id="react-runtime-checkbox-disabled"]',
    );

    const initial = {
      checked: readCheckbox("react-runtime-checkbox-checked"),
      default: readCheckbox("react-runtime-checkbox-default"),
      disabled: readCheckbox("react-runtime-checkbox-disabled"),
      indeterminate: readCheckbox("react-runtime-checkbox-indeterminate"),
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
        default: readCheckbox("react-runtime-checkbox-default"),
        disabled: readCheckbox("react-runtime-checkbox-disabled"),
        indeterminate: readCheckbox("react-runtime-checkbox-indeterminate"),
      },
      initial,
    };
  });

  await page.locator('[data-sw-checkbox][data-id="react-runtime-checkbox-controlled"]').click();
  await expectText(page.locator("[data-runtime-checkbox-count]"), "Checkbox changes: 1");

  const controlledCheckboxState = await page.evaluate(() => {
    const root = document.querySelector(
      '[data-sw-checkbox][data-id="react-runtime-checkbox-controlled"]',
    );
    const input = root?.querySelector("[data-sw-checkbox-input]");

    return {
      ariaChecked: root?.getAttribute("aria-checked"),
      hasChecked: root?.hasAttribute("data-checked"),
      inputChecked: input instanceof HTMLInputElement ? input.checked : undefined,
    };
  });

  const initialCheckboxGroupState = await page.evaluate(() => {
    const readCheckbox = (id) => {
      const root = document.querySelector(`[data-sw-checkbox][data-id="${id}"]`);
      const input = root?.querySelector("[data-sw-checkbox-input]");

      return {
        ariaChecked: root?.getAttribute("aria-checked"),
        hasChecked: root?.hasAttribute("data-checked"),
        inputChecked: input instanceof HTMLInputElement ? input.checked : undefined,
      };
    };
    const defaultGroup = document.querySelector("[data-runtime-checkbox-group-default]");
    const controlledGroup = document.querySelector("[data-runtime-checkbox-group-controlled]");

    return {
      controlledGroupValue: controlledGroup?.getAttribute("data-value"),
      defaultGroupAriaLabelledby: defaultGroup?.getAttribute("aria-labelledby"),
      defaultGroupClassName: defaultGroup?.getAttribute("class"),
      defaultGroupRole: defaultGroup?.getAttribute("role"),
      defaultGroupValue: defaultGroup?.getAttribute("data-value"),
      email: readCheckbox("react-runtime-checkbox-group-email"),
      product: readCheckbox("react-runtime-checkbox-group-product"),
      security: readCheckbox("react-runtime-checkbox-group-security"),
      sms: readCheckbox("react-runtime-checkbox-group-sms"),
    };
  });

  await page.locator('[data-sw-checkbox][data-id="react-runtime-checkbox-group-sms"]').click();
  await page.locator('[data-sw-checkbox][data-id="react-runtime-checkbox-group-product"]').click();
  await expectText(
    page.locator("[data-runtime-checkbox-group-value]"),
    "Checkbox group value: security, product",
  );
  await expectText(
    page.locator("[data-runtime-checkbox-group-count]"),
    "Checkbox group changes: 1",
  );

  const updatedCheckboxGroupState = await page.evaluate(() => {
    const readCheckbox = (id) => {
      const root = document.querySelector(`[data-sw-checkbox][data-id="${id}"]`);
      const input = root?.querySelector("[data-sw-checkbox-input]");

      return {
        ariaChecked: root?.getAttribute("aria-checked"),
        hasChecked: root?.hasAttribute("data-checked"),
        inputChecked: input instanceof HTMLInputElement ? input.checked : undefined,
      };
    };
    const defaultGroup = document.querySelector("[data-runtime-checkbox-group-default]");
    const controlledGroup = document.querySelector("[data-runtime-checkbox-group-controlled]");

    return {
      controlledGroupValue: controlledGroup?.getAttribute("data-value"),
      defaultGroupValue: defaultGroup?.getAttribute("data-value"),
      product: readCheckbox("react-runtime-checkbox-group-product"),
      sms: readCheckbox("react-runtime-checkbox-group-sms"),
    };
  });

  const initialRadioGroupState = await page.evaluate(() => {
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
    const controlledGroup = document.querySelector("[data-runtime-radio-group-controlled]");

    return {
      controlledGroupValue: controlledGroup?.getAttribute("data-value"),
      defaultGroupAriaLabelledby: defaultGroup?.getAttribute("aria-labelledby"),
      defaultGroupClassName: defaultGroup?.getAttribute("class"),
      defaultGroupRole: defaultGroup?.getAttribute("role"),
      defaultGroupValue: defaultGroup?.getAttribute("data-value"),
      express: readRadio("react-runtime-radio-group-express"),
      expressControlled: readRadio("react-runtime-radio-group-express-controlled"),
      overnight: readRadio("react-runtime-radio-group-overnight"),
      rootCount: document.querySelectorAll("[data-sw-radio]").length,
      standard: readRadio("react-runtime-radio-group-standard"),
    };
  });

  await page
    .locator('[data-sw-radio][data-id="react-runtime-radio-group-express-controlled"]')
    .click();
  await expectText(page.locator("[data-runtime-radio-group-count]"), "Radio group changes: 0");
  await page.locator('[data-sw-radio][data-id="react-runtime-radio-group-express"]').click();
  await page.locator('[data-sw-radio][data-id="react-runtime-radio-group-overnight"]').click();
  await expectText(
    page.locator("[data-runtime-radio-group-value]"),
    "Radio group value: overnight",
  );
  await expectText(page.locator("[data-runtime-radio-group-count]"), "Radio group changes: 1");

  const updatedRadioGroupState = await page.evaluate(() => {
    const readRadio = (id) => {
      const root = document.querySelector(`[data-sw-radio][data-id="${id}"]`);
      const input = root?.querySelector("[data-sw-radio-input]");

      return {
        ariaChecked: root?.getAttribute("aria-checked"),
        hasChecked: root?.hasAttribute("data-checked"),
        inputChecked: input instanceof HTMLInputElement ? input.checked : undefined,
      };
    };
    const defaultGroup = document.querySelector("[data-runtime-radio-group-default]");
    const controlledGroup = document.querySelector("[data-runtime-radio-group-controlled]");

    return {
      controlledGroupValue: controlledGroup?.getAttribute("data-value"),
      defaultGroupValue: defaultGroup?.getAttribute("data-value"),
      express: readRadio("react-runtime-radio-group-express"),
      overnight: readRadio("react-runtime-radio-group-overnight"),
      standard: readRadio("react-runtime-radio-group-standard"),
    };
  });

  if (
    checkboxState.initial.rootCount !== 10 ||
    checkboxState.initial.default.hasDataSw !== true ||
    checkboxState.initial.default.hasChecked !== false ||
    checkboxState.initial.default.inputChecked !== false ||
    checkboxState.initial.default.inputId !== "react-runtime-checkbox-default" ||
    checkboxState.initial.default.inputName !== "react-runtime-checkbox-default" ||
    checkboxState.initial.default.inputValue !== "accepted" ||
    checkboxState.initial.default.ariaLabel !== "Accept runtime terms" ||
    checkboxState.initial.default.labelFor !== "react-runtime-checkbox-default" ||
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
    checkboxState.afterToggle.disabled.inputChecked !== false ||
    controlledCheckboxState.ariaChecked !== "true" ||
    controlledCheckboxState.hasChecked !== true ||
    controlledCheckboxState.inputChecked !== true
  ) {
    throw new Error(
      `Expected React Checkbox runtime states, controlled updates, and Starwind classes, got ${JSON.stringify(
        { checkboxState, controlledCheckboxState },
      )}.`,
    );
  }

  if (
    initialCheckboxGroupState.defaultGroupRole !== "group" ||
    initialCheckboxGroupState.defaultGroupAriaLabelledby !==
      "react-runtime-checkbox-group-heading" ||
    initialCheckboxGroupState.defaultGroupClassName?.includes("starwind-checkbox-group") === true ||
    initialCheckboxGroupState.defaultGroupClassName?.includes("grid") !== true ||
    initialCheckboxGroupState.defaultGroupClassName?.includes("runtime-checkbox-group-custom") !==
      true ||
    initialCheckboxGroupState.defaultGroupValue !== '["email"]' ||
    initialCheckboxGroupState.email.hasChecked !== true ||
    initialCheckboxGroupState.email.inputChecked !== true ||
    initialCheckboxGroupState.sms.hasChecked !== false ||
    initialCheckboxGroupState.controlledGroupValue !== '["security"]' ||
    initialCheckboxGroupState.security.hasChecked !== true ||
    initialCheckboxGroupState.product.hasChecked !== false ||
    updatedCheckboxGroupState.defaultGroupValue !== '["email","sms"]' ||
    updatedCheckboxGroupState.sms.ariaChecked !== "true" ||
    updatedCheckboxGroupState.sms.inputChecked !== true ||
    updatedCheckboxGroupState.controlledGroupValue !== '["security","product"]' ||
    updatedCheckboxGroupState.product.ariaChecked !== "true" ||
    updatedCheckboxGroupState.product.inputChecked !== true
  ) {
    throw new Error(
      `Expected React CheckboxGroup values and controlled updates, got ${JSON.stringify({
        initialCheckboxGroupState,
        updatedCheckboxGroupState,
      })}.`,
    );
  }

  if (
    initialRadioGroupState.rootCount !== 6 ||
    initialRadioGroupState.defaultGroupRole !== "radiogroup" ||
    initialRadioGroupState.defaultGroupAriaLabelledby !== "react-runtime-radio-group-heading" ||
    initialRadioGroupState.defaultGroupClassName?.includes("starwind-radio-group") === true ||
    initialRadioGroupState.defaultGroupClassName?.includes("grid") !== true ||
    initialRadioGroupState.defaultGroupClassName?.includes("runtime-radio-group-custom") !== true ||
    initialRadioGroupState.defaultGroupValue !== "standard" ||
    initialRadioGroupState.standard.hasChecked !== true ||
    initialRadioGroupState.standard.inputChecked !== true ||
    initialRadioGroupState.standard.inputName !== "react-runtime-delivery" ||
    initialRadioGroupState.standard.inputValue !== "standard" ||
    initialRadioGroupState.standard.ariaLabel !== "Standard delivery" ||
    initialRadioGroupState.standard.rootSlot !== "radio-group-item" ||
    initialRadioGroupState.standard.rootClassName?.includes("starwind-radio-item") === true ||
    initialRadioGroupState.standard.controlSlot !== "radio-group-item-control" ||
    initialRadioGroupState.standard.controlClassName?.includes("starwind-radio-control") === true ||
    initialRadioGroupState.standard.indicatorSlot !== "radio-group-item-indicator" ||
    initialRadioGroupState.standard.indicatorClassName?.includes("starwind-radio-indicator") ===
      true ||
    initialRadioGroupState.standard.indicatorHidden !== false ||
    initialRadioGroupState.standard.indicatorWidth !== 12 ||
    initialRadioGroupState.standard.indicatorHeight !== 12 ||
    initialRadioGroupState.standard.iconWidth !== 12 ||
    initialRadioGroupState.standard.iconHeight !== 12 ||
    (initialRadioGroupState.standard.indicatorCenterDeltaX ?? 999) > 1 ||
    (initialRadioGroupState.standard.indicatorCenterDeltaY ?? 999) > 1 ||
    (initialRadioGroupState.standard.iconCenterDeltaX ?? 999) > 1 ||
    (initialRadioGroupState.standard.iconCenterDeltaY ?? 999) > 1 ||
    initialRadioGroupState.express.hasChecked !== false ||
    initialRadioGroupState.express.ariaLabel !== "Express delivery" ||
    initialRadioGroupState.controlledGroupValue !== "express" ||
    initialRadioGroupState.expressControlled.hasChecked !== true ||
    initialRadioGroupState.overnight.hasChecked !== false ||
    updatedRadioGroupState.defaultGroupValue !== "express" ||
    updatedRadioGroupState.standard.ariaChecked !== "false" ||
    updatedRadioGroupState.express.ariaChecked !== "true" ||
    updatedRadioGroupState.express.inputChecked !== true ||
    updatedRadioGroupState.controlledGroupValue !== "overnight" ||
    updatedRadioGroupState.overnight.ariaChecked !== "true" ||
    updatedRadioGroupState.overnight.inputChecked !== true
  ) {
    throw new Error(
      `Expected React RadioGroup values and controlled updates, got ${JSON.stringify({
        initialRadioGroupState,
        updatedRadioGroupState,
      })}.`,
    );
  }
}
