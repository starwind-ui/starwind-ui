export async function verifyTooltipPlacements(page, prefix) {
  const sideExamples = ["top", "right", "bottom", "left"];
  const alignExamples = ["start", "center", "end"];
  const tolerance = 4;

  for (const side of sideExamples) {
    const state = await readOpenTooltipGeometry(page, `${prefix}-tooltip-side-${side}`);
    assertTooltipBaseState(state);
    assertTooltipArrowState(state, tolerance);

    if (
      state.dataSide !== side ||
      state.dataAlign !== "center" ||
      !isTooltipOnRequestedSide(state, side, tolerance)
    ) {
      throw new Error(
        `Expected ${prefix} Tooltip ${side} placement to render on the requested side, got ${JSON.stringify(
          state,
        )}.`,
      );
    }
  }

  for (const align of alignExamples) {
    const state = await readOpenTooltipGeometry(page, `${prefix}-tooltip-align-${align}`);
    assertTooltipBaseState(state);
    assertTooltipArrowState(state, tolerance);

    if (
      state.dataSide !== "bottom" ||
      state.dataAlign !== align ||
      !isTooltipOnRequestedSide(state, "bottom", tolerance) ||
      !isTooltipAligned(state, align, tolerance)
    ) {
      throw new Error(
        `Expected ${prefix} Tooltip ${align} alignment to match the trigger, got ${JSON.stringify(
          state,
        )}.`,
      );
    }
  }

  const offsetState = await readOpenTooltipGeometry(page, `${prefix}-tooltip-offset`);
  assertTooltipBaseState(offsetState);
  assertTooltipArrowState(offsetState, tolerance);

  if (
    offsetState.dataSide !== "right" ||
    offsetState.dataAlign !== "center" ||
    offsetState.contentRect.left - offsetState.triggerRect.right < 12
  ) {
    throw new Error(
      `Expected ${prefix} Tooltip offset placement to preserve the configured side offset, got ${JSON.stringify(
        offsetState,
      )}.`,
    );
  }
}

async function readOpenTooltipGeometry(page, rootId) {
  const triggerSelector = `#${rootId}-trigger`;
  const contentSelector = `#${rootId}-content`;

  await page.locator(triggerSelector).hover();
  await page.locator(contentSelector).waitFor({ state: "visible" });
  await page.waitForFunction(
    ({ contentSelector }) => {
      const content = document.querySelector(contentSelector);
      const positioner = content?.parentElement;

      return (
        content instanceof HTMLElement &&
        positioner instanceof HTMLElement &&
        !content.hidden &&
        positioner.style.left !== "" &&
        positioner.style.top !== ""
      );
    },
    { contentSelector },
  );

  const state = await page.evaluate(
    ({ rootId }) => {
      const trigger = document.querySelector(`#${rootId}-trigger`);
      const content = document.querySelector(`#${rootId}-content`);
      const positioner = content?.parentElement;
      const arrow = content?.querySelector('[data-slot="tooltip-arrow"]');
      const arrowIcon = arrow?.querySelector("svg");

      if (
        !(trigger instanceof HTMLElement) ||
        !(content instanceof HTMLElement) ||
        !(positioner instanceof HTMLElement)
      ) {
        throw new Error(`Missing tooltip geometry target for ${rootId}.`);
      }

      const readRect = (rect) => ({
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        width: rect.width,
      });
      const contentStyle = getComputedStyle(content);
      const positionerStyle = getComputedStyle(positioner);

      return {
        className: content.getAttribute("class"),
        dataSlot: content.getAttribute("data-slot"),
        dataAlign: content.getAttribute("data-align"),
        dataSide: content.getAttribute("data-side"),
        arrowClassName: arrow instanceof HTMLElement ? arrow.getAttribute("class") : null,
        arrowDataAlign: arrow instanceof HTMLElement ? arrow.getAttribute("data-align") : null,
        arrowDataSide: arrow instanceof HTMLElement ? arrow.getAttribute("data-side") : null,
        arrowIconRect:
          arrowIcon instanceof SVGElement ? readRect(arrowIcon.getBoundingClientRect()) : null,
        arrowRect: arrow instanceof HTMLElement ? readRect(arrow.getBoundingClientRect()) : null,
        hasFixedClass: content.classList.contains("fixed"),
        hidden: content.hidden,
        parentClassName: positioner.getAttribute("class"),
        parentDataSlot: positioner.getAttribute("data-slot"),
        popupPosition: contentStyle.position,
        positionerPosition: positionerStyle.position,
        role: content.getAttribute("role"),
        rootContains: document.querySelector(`#${rootId}`)?.contains(content) ?? null,
        styleLeft: positioner.style.left,
        styleTop: positioner.style.top,
        triggerRect: readRect(trigger.getBoundingClientRect()),
        contentRect: readRect(content.getBoundingClientRect()),
        positionerRect: readRect(positioner.getBoundingClientRect()),
      };
    },
    { rootId },
  );

  await page.mouse.move(20, 20);
  await page.waitForFunction((selector) => {
    const content = document.querySelector(selector);

    return content instanceof HTMLElement && content.hidden;
  }, contentSelector);

  return state;
}

function assertTooltipBaseState(state) {
  if (
    state.hidden !== false ||
    state.role !== "tooltip" ||
    state.parentDataSlot !== "tooltip-positioner" ||
    state.positionerPosition !== "fixed" ||
    state.popupPosition === "fixed" ||
    state.hasFixedClass !== false ||
    state.styleLeft === "" ||
    state.styleTop === "" ||
    state.rootContains !== false ||
    state.parentClassName?.includes("isolate") !== true ||
    state.parentClassName?.includes("z-50") !== true ||
    state.dataSlot !== "tooltip-content"
  ) {
    throw new Error(
      `Expected tooltip to render inside a positioned wrapper, got ${JSON.stringify(state)}.`,
    );
  }
}

function assertTooltipArrowState(state, tolerance) {
  if (
    !state.arrowRect ||
    !state.arrowIconRect ||
    state.arrowDataSide !== state.dataSide ||
    state.arrowDataAlign !== state.dataAlign
  ) {
    throw new Error(
      `Expected tooltip arrow to mirror popup placement, got ${JSON.stringify(state)}.`,
    );
  }

  const arrowCenterX = state.arrowRect.left + state.arrowRect.width / 2;
  const arrowCenterY = state.arrowRect.top + state.arrowRect.height / 2;
  const iconCenterX = state.arrowIconRect.left + state.arrowIconRect.width / 2;
  const iconCenterY = state.arrowIconRect.top + state.arrowIconRect.height / 2;
  const contentCenterX = state.contentRect.left + state.contentRect.width / 2;
  const contentCenterY = state.contentRect.top + state.contentRect.height / 2;

  if (
    Math.abs(arrowCenterX - iconCenterX) > 1 ||
    Math.abs(arrowCenterY - iconCenterY) > 1 ||
    state.arrowIconRect.width > state.arrowRect.width + 1 ||
    state.arrowIconRect.height > state.arrowRect.height + 1
  ) {
    throw new Error(
      `Expected tooltip arrow icon to stay centered in its arrow box, got ${JSON.stringify(state)}.`,
    );
  }

  const centered =
    state.dataSide === "top" || state.dataSide === "bottom"
      ? Math.abs(arrowCenterX - contentCenterX) <= tolerance
      : Math.abs(arrowCenterY - contentCenterY) <= tolerance;

  const edgeAligned =
    state.dataSide === "top"
      ? Math.abs(arrowCenterY - state.contentRect.bottom) <= tolerance
      : state.dataSide === "bottom"
        ? Math.abs(arrowCenterY - state.contentRect.top) <= tolerance
        : state.dataSide === "left"
          ? Math.abs(arrowCenterX - state.contentRect.right) <= tolerance
          : Math.abs(arrowCenterX - state.contentRect.left) <= tolerance;

  if (!centered || !edgeAligned) {
    throw new Error(
      `Expected tooltip arrow to be centered on the popup edge, got ${JSON.stringify(state)}.`,
    );
  }
}

export async function verifyTooltipPropExamples(page, prefix, options = {}) {
  let state = await readTooltipPropExamples(page, prefix, options.react === true);
  const initialState = state;
  let disabledToggleAfterEnable = null;

  if (options.react === true) {
    const controlledContent = page.locator(`#${prefix}-tooltip-controlled-content`);

    await page.locator(`#${prefix}-tooltip-controlled-trigger`).click();
    await controlledContent.waitFor({ state: "visible" });
    state = await readTooltipPropExamples(page, prefix, true);
    await page.locator(`#${prefix}-tooltip-disabled-toggle-enable`).click();
    await page.locator(`#${prefix}-tooltip-disabled-toggle-content`).waitFor({ state: "visible" });
    disabledToggleAfterEnable = (await readTooltipPropExamples(page, prefix, true)).disabledToggle;
    await page.mouse.move(20, 20);
    await controlledContent.waitFor({ state: "hidden" });
  }

  if (
    state.defaultOpen.rootOpenDelay !== "200" ||
    state.defaultOpen.rootCloseDelay !== "200" ||
    state.defaultOpen.contentInlineAnimationDuration !== "" ||
    state.defaultOpen.contentClass?.includes("duration-150") !== true ||
    state.animated.rootOpenDelay !== "250" ||
    state.animated.rootCloseDelay !== "300" ||
    state.animated.contentInlineAnimationDuration !== "" ||
    state.animated.contentClass?.includes("duration-[180ms]") !== true ||
    state.animated.triggerHasTooltipAttribute !== true ||
    state.dismissal.rootCloseOnEscape !== "false" ||
    state.dismissal.rootCloseOnOutsideInteract !== "false" ||
    state.rootDelay.rootOpenDelay !== "400" ||
    state.rootDelay.rootCloseDelay !== "250" ||
    state.rootDelay.triggerOpenDelay !== null ||
    state.rootDelay.triggerCloseDelay !== null ||
    state.noHoverable.rootContentHoverable !== "false" ||
    state.disabled.rootDisabled !== true ||
    state.disabled.rootState !== "closed" ||
    state.disabled.triggerDisabled !== true ||
    state.disabled.contentHidden !== true ||
    (options.react === true &&
      (state.controlled?.contentHidden !== false ||
        state.controlled?.rootOpenDelay !== "150" ||
        state.controlled?.rootCloseDelay !== "200" ||
        initialState.disabledToggle?.rootDisabled !== true ||
        initialState.disabledToggle?.rootState !== "closed" ||
        initialState.disabledToggle?.contentHidden !== true ||
        disabledToggleAfterEnable?.rootDisabled !== false ||
        disabledToggleAfterEnable?.rootState !== "open" ||
        disabledToggleAfterEnable?.contentHidden !== false))
  ) {
    throw new Error(
      `Expected ${prefix} Tooltip prop demos to expose timing and state props, got ${JSON.stringify(state)}.`,
    );
  }
}

async function readTooltipPropExamples(page, prefix, includeControlled) {
  return page.evaluate(
    ({ prefix, includeControlled }) => {
      const readExample = (name) => {
        const root = document.querySelector(`#${prefix}-tooltip-${name}`);
        const trigger = document.querySelector(`#${prefix}-tooltip-${name}-trigger`);
        const triggerHost =
          trigger instanceof Element ? trigger.closest("[data-sw-tooltip-trigger]") : null;
        const triggerNode = triggerHost ?? trigger;
        const content = document.querySelector(`#${prefix}-tooltip-${name}-content`);

        return {
          contentClass: content instanceof HTMLElement ? content.getAttribute("class") : null,
          contentHidden: content instanceof HTMLElement ? content.hidden : null,
          contentInlineAnimationDuration:
            content instanceof HTMLElement ? content.style.animationDuration : null,
          rootCloseDelay: root?.getAttribute("data-close-delay") ?? null,
          rootCloseOnEscape: root?.getAttribute("data-close-on-escape") ?? null,
          rootCloseOnOutsideInteract: root?.getAttribute("data-close-on-outside-interact") ?? null,
          rootContentHoverable: root?.getAttribute("data-content-hoverable") ?? null,
          rootDisabled: root instanceof HTMLElement ? root.hasAttribute("data-disabled") : null,
          rootOpenDelay: root?.getAttribute("data-open-delay") ?? null,
          rootState: root?.getAttribute("data-state") ?? null,
          triggerCloseDelay: triggerNode?.getAttribute("data-close-delay") ?? null,
          triggerDisabled: trigger instanceof HTMLButtonElement ? trigger.disabled : null,
          triggerHasTooltipAttribute:
            triggerNode instanceof HTMLElement
              ? triggerNode.hasAttribute("data-sw-tooltip-trigger")
              : null,
          triggerOpenDelay: triggerNode?.getAttribute("data-open-delay") ?? null,
        };
      };

      return {
        animated: readExample("animated"),
        controlled: includeControlled ? readExample("controlled") : null,
        defaultOpen: readExample("default-open"),
        disabled: readExample("disabled"),
        disabledToggle: includeControlled ? readExample("disabled-toggle") : null,
        dismissal: readExample("dismissal"),
        noHoverable: readExample("no-hoverable"),
        rootDelay: readExample("root-delay"),
      };
    },
    { prefix, includeControlled },
  );
}

function isTooltipOnRequestedSide(state, side, tolerance) {
  const { contentRect, triggerRect } = state;

  if (side === "top") return contentRect.bottom <= triggerRect.top + tolerance;
  if (side === "right") return contentRect.left >= triggerRect.right - tolerance;
  if (side === "bottom") return contentRect.top >= triggerRect.bottom - tolerance;
  if (side === "left") return contentRect.right <= triggerRect.left + tolerance;

  return false;
}

function isTooltipAligned(state, align, tolerance) {
  const { contentRect, triggerRect } = state;

  if (align === "start") return Math.abs(contentRect.left - triggerRect.left) <= tolerance;
  if (align === "end") return Math.abs(contentRect.right - triggerRect.right) <= tolerance;

  const contentCenter = contentRect.left + contentRect.width / 2;
  const triggerCenter = triggerRect.left + triggerRect.width / 2;

  return Math.abs(contentCenter - triggerCenter) <= tolerance;
}
