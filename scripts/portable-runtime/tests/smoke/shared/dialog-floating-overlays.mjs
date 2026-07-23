export async function verifyDialogFloatingOverlays({ ids, label, page }) {
  let primaryError;

  try {
    await runDialogFloatingOverlays({ ids, label, page });
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    try {
      await cleanupDialogFloatingOverlays({ ids, page });
    } catch (cleanupError) {
      if (!primaryError) throw cleanupError;
    }
  }
}

async function runDialogFloatingOverlays({ ids, label, page }) {
  const lab = page.locator(`#${ids.lab}`);
  await page.locator(`#${ids.labTrigger}`).click();
  await page.getByRole("dialog", { name: "Overlays inside a dialog" }).waitFor();

  const assertPromoted = async (contentId, expectedRole) => {
    await page.locator(`#${contentId}`).waitFor({ state: "visible" });
    const state = await page.locator(`#${contentId}`).evaluate((content) => {
      const dialog = content.closest("dialog[open]");
      const floatingRoot = dialog?.querySelector(":scope > [data-floating-root]");
      const portal = content.closest("[data-sw-floating-portal]");
      const rect = content.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);

      return {
        dialogOwnsPortal:
          floatingRoot instanceof HTMLElement && portal instanceof HTMLElement
            ? floatingRoot.contains(portal)
            : null,
        expanded: document
          .querySelector(`[aria-controls='${content.id}']`)
          ?.getAttribute("aria-expanded"),
        hitInsideContent: hit instanceof Node ? content.contains(hit) : false,
        portalPromoted: portal?.matches(":popover-open") ?? false,
        role: content.getAttribute("role"),
        state: content.getAttribute("data-state"),
      };
    });

    if (
      state.dialogOwnsPortal !== true ||
      state.expanded !== "true" ||
      state.hitInsideContent !== true ||
      state.portalPromoted !== true ||
      state.role !== expectedRole ||
      state.state !== "open"
    ) {
      throw new Error(
        `Expected ${label} ${contentId} to be promoted and interactive inside its dialog, got ${JSON.stringify(state)}.`,
      );
    }
  };

  await page.locator(`#${ids.popoverTrigger}`).click();
  await assertPromoted(ids.popoverContent, "dialog");
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    (id) => document.querySelector(`#${id}`)?.getAttribute("data-state") === "closed",
    ids.popoverContent,
  );
  if (!(await lab.locator("dialog[open]").count())) {
    throw new Error(`Expected ${label} Escape to dismiss the Popover before its owner dialog.`);
  }

  await page.locator(`#${ids.selectTrigger}`).click();
  await assertPromoted(ids.selectContent, "listbox");
  await page.locator(`#${ids.selectOption}`).click();
  await page.waitForFunction(
    ({ root, value }) => document.querySelector(`#${root}`)?.getAttribute("data-value") === value,
    { root: ids.select, value: "light" },
  );

  await page.locator(`#${ids.comboboxInput}`).fill("ap");
  await assertPromoted(ids.comboboxContent, "listbox");
  await page.locator(`#${ids.comboboxOption}`).click();
  await page.waitForFunction(
    (id) => document.querySelector(`#${id}`)?.value === "Apricot",
    ids.comboboxInput,
  );

  await page.locator(`#${ids.dropdownTrigger}`).click();
  await assertPromoted(ids.dropdownContent, "menu");
  await page.locator(`#${ids.dropdownItem}`).click();
  await page.waitForFunction(
    (id) => document.querySelector(`#${id}`)?.getAttribute("data-state") === "closed",
    ids.dropdownContent,
  );

  await page.locator(`#${ids.popoverTrigger}`).click();
  await assertPromoted(ids.popoverContent, "dialog");
  await page.locator(`#${ids.nestedTrigger}`).click();
  await page.getByRole("dialog", { name: "Nested overlay dialog" }).waitFor();
  await page.locator(`#${ids.nestedPopoverTrigger}`).click();
  await assertPromoted(ids.nestedPopoverContent, "dialog");
  const nestedState = await page
    .locator(`#${ids.nestedPopoverContent}`)
    .evaluate((content, config) => {
      const dialog = content.closest("dialog[open]");
      const parentContent = document.querySelector(`#${config.popoverContent}`);
      const parentDialog = document.querySelector(`#${config.labContent}`);
      const parentFloatingRoot = parentDialog?.querySelector(":scope > [data-floating-root]");
      const parentPortal = parentContent?.closest("[data-sw-floating-portal]");
      const childFloatingRoot = dialog?.querySelector(":scope > [data-floating-root]");
      const childPortal = content.closest("[data-sw-floating-portal]");
      const clip = dialog?.querySelector("[data-runtime-dialog-overlay-clip]");
      const contentRect = content.getBoundingClientRect();
      const clipRect = clip?.getBoundingClientRect();
      if (!clipRect) return null;

      const escapesClip =
        contentRect.left < clipRect.left ||
        contentRect.top < clipRect.top ||
        contentRect.right > clipRect.right ||
        contentRect.bottom > clipRect.bottom;
      const candidates = [
        [contentRect.left + contentRect.width / 2, contentRect.top + 2],
        [contentRect.left + contentRect.width / 2, contentRect.bottom - 2],
        [contentRect.left + 2, contentRect.top + contentRect.height / 2],
        [contentRect.right - 2, contentRect.top + contentRect.height / 2],
      ].filter(
        ([x, y]) =>
          x < clipRect.left || x > clipRect.right || y < clipRect.top || y > clipRect.bottom,
      );
      const hitOutsideClip = candidates.some(([x, y]) => {
        const hit = document.elementFromPoint(x, y);
        return hit instanceof Node && content.contains(hit);
      });
      const dialogRect = dialog?.getBoundingClientRect();
      const topHit = dialogRect
        ? document.elementFromPoint(
            dialogRect.left + dialogRect.width / 2,
            dialogRect.top + dialogRect.height / 2,
          )
        : null;

      return {
        childOwnsPortal:
          childFloatingRoot instanceof HTMLElement && childPortal instanceof HTMLElement
            ? childFloatingRoot.contains(childPortal)
            : null,
        childOwnsTopHit:
          dialog instanceof HTMLDialogElement && topHit instanceof Node
            ? dialog.contains(topHit)
            : null,
        childPromoted: childPortal?.matches(":popover-open") ?? false,
        childState: content.getAttribute("data-state"),
        escapesClip,
        hitOutsideClip,
        parentOwnsPortal:
          parentFloatingRoot instanceof HTMLElement && parentPortal instanceof HTMLElement
            ? parentFloatingRoot.contains(parentPortal)
            : null,
        parentPromoted: parentPortal?.matches(":popover-open") ?? false,
        parentState: parentContent?.getAttribute("data-state"),
        portalsDistinct: parentPortal !== childPortal,
      };
    }, ids);
  if (
    nestedState?.childOwnsPortal !== true ||
    nestedState.childOwnsTopHit !== true ||
    nestedState.childPromoted !== true ||
    nestedState.childState !== "open" ||
    nestedState.escapesClip !== true ||
    nestedState.hitOutsideClip !== true ||
    nestedState.parentOwnsPortal !== true ||
    nestedState.parentPromoted !== true ||
    nestedState.parentState !== "open" ||
    nestedState.portalsDistinct !== true
  ) {
    throw new Error(
      `Expected ${label} parent and nested layers to stay promoted in owner order while the nested Popover escapes clipping, got ${JSON.stringify(nestedState)}.`,
    );
  }
  await page.locator(`#${ids.nestedPopoverAction}`).click();
  await page.locator(`#${ids.nestedPopoverTrigger}`).evaluate((trigger) => {
    if (trigger instanceof HTMLElement) trigger.click();
  });
  await page.locator(`#${ids.nestedPopoverContent}`).waitFor({ state: "hidden" });
  await assertPromoted(ids.popoverContent, "dialog");
  await page.locator(`#${ids.nestedClose}`).click();
  await page.waitForFunction((id) => {
    const dialog = document.querySelector(`#${id}`);
    return dialog instanceof HTMLDialogElement && !dialog.open;
  }, ids.nestedContent);
  await assertPromoted(ids.popoverContent, "dialog");
  await page.locator(`#${ids.popoverAction}`).evaluate((button) => {
    button.addEventListener(
      "click",
      () => {
        button.setAttribute("data-runtime-dialog-action-activated", "true");
      },
      { once: true },
    );
  });
  await page.locator(`#${ids.popoverAction}`).click();
  if (
    (await page
      .locator(`#${ids.popoverAction}`)
      .getAttribute("data-runtime-dialog-action-activated")) !== "true"
  ) {
    throw new Error(
      `Expected ${label} parent Popover to remain interactive after nested dialog cleanup.`,
    );
  }
  await page.locator(`#${ids.popoverAction}`).evaluate((button) => {
    button.removeAttribute("data-runtime-dialog-action-activated");
  });

  await page.locator(`#${ids.labClose}`).click();
  await page.waitForFunction((id) => {
    const dialog = document.querySelector(`#${id}`);
    return dialog instanceof HTMLDialogElement && !dialog.open;
  }, ids.labContent);
  await page.waitForFunction(
    () => !document.querySelector("[data-sw-floating-portal]:popover-open"),
  );

  await page.locator(`#${ids.labTrigger}`).click();
  await page.getByRole("dialog", { name: "Overlays inside a dialog" }).waitFor();
  const reopenedState = await page.evaluate(
    (config) => ({
      expanded: [
        config.popoverTrigger,
        config.selectTrigger,
        config.comboboxInput,
        config.dropdownTrigger,
      ].map((id) => document.querySelector(`#${id}`)?.getAttribute("aria-expanded")),
      promotedFixtureLayers: [
        config.popoverContent,
        config.selectContent,
        config.comboboxContent,
        config.dropdownContent,
        config.nestedPopoverContent,
      ].filter((id) =>
        document
          .querySelector(`#${id}`)
          ?.closest("[data-sw-floating-portal]")
          ?.matches(":popover-open"),
      ),
    }),
    ids,
  );
  if (
    reopenedState.promotedFixtureLayers.length > 0 ||
    reopenedState.expanded.some((value) => value !== "false")
  ) {
    throw new Error(
      `Expected ${label} dialog reopen to reset floating layers, got ${JSON.stringify(reopenedState)}.`,
    );
  }
  await page.locator(`#${ids.labClose}`).click();
  await page.waitForFunction(
    (config) =>
      [config.labContent, config.nestedContent].every((id) => {
        const dialog = document.querySelector(`#${id}`);
        return dialog instanceof HTMLDialogElement && !dialog.open;
      }),
    ids,
  );
}

async function cleanupDialogFloatingOverlays({ ids, page }) {
  const floatingLayers = [
    [ids.nestedPopoverTrigger, ids.nestedPopoverContent],
    [ids.popoverTrigger, ids.popoverContent],
    [ids.selectTrigger, ids.selectContent],
    [ids.comboboxInput, ids.comboboxContent],
    [ids.dropdownTrigger, ids.dropdownContent],
  ];
  const waitForCleanState = () =>
    page.waitForFunction((config) => {
      const lab = document.querySelector(`#${config.labContent}`);
      const nested = document.querySelector(`#${config.nestedContent}`);
      const floatingContentIds = [
        config.popoverContent,
        config.selectContent,
        config.comboboxContent,
        config.dropdownContent,
        config.nestedPopoverContent,
      ];
      const hasPromotedFixturePortal = floatingContentIds.some((id) =>
        document
          .querySelector(`#${id}`)
          ?.closest("[data-sw-floating-portal]")
          ?.matches(":popover-open"),
      );
      const hasOpenFloatingState = floatingContentIds.some(
        (id) => document.querySelector(`#${id}`)?.getAttribute("data-state") === "open",
      );
      const hasExpandedControl = [
        config.nestedPopoverTrigger,
        config.popoverTrigger,
        config.selectTrigger,
        config.comboboxInput,
        config.dropdownTrigger,
      ].some((id) => document.querySelector(`#${id}`)?.getAttribute("aria-expanded") === "true");

      return (
        !(lab instanceof HTMLDialogElement && lab.open) &&
        !(nested instanceof HTMLDialogElement && nested.open) &&
        !hasPromotedFixturePortal &&
        !hasOpenFloatingState &&
        !hasExpandedControl
      );
    }, ids);

  try {
    const closeFloatingLayer = async ([triggerId, contentId]) => {
      const expanded =
        (await page.locator(`#${triggerId}`).getAttribute("aria-expanded")) === "true";
      if (!expanded) return;

      await page.locator(`#${triggerId}`).evaluate((trigger) => {
        if (trigger instanceof HTMLElement) trigger.click();
      });
      await page.locator(`#${contentId}`).waitFor({ state: "hidden" });
    };

    await closeFloatingLayer(floatingLayers[0]);

    const nestedDialog = page.locator(`#${ids.nestedContent}`);
    if (
      await nestedDialog.evaluate((dialog) => dialog instanceof HTMLDialogElement && dialog.open)
    ) {
      await page.locator(`#${ids.nestedClose}`).click();
      await nestedDialog.waitFor({ state: "hidden" });
    }

    for (const layer of floatingLayers.slice(1)) {
      await closeFloatingLayer(layer);
    }

    const labDialog = page.locator(`#${ids.labContent}`);
    if (await labDialog.evaluate((dialog) => dialog instanceof HTMLDialogElement && dialog.open)) {
      await page.locator(`#${ids.labClose}`).click();
    }
    await waitForCleanState();
  } catch (cleanupError) {
    try {
      await page.evaluate(() => {
        window.__swDialogFloatingCleanupDocument = true;
      });
      await page.reload({ waitUntil: "load" });
      const recoveredFreshDocument = await page.evaluate(
        () => window.__swDialogFloatingCleanupDocument !== true,
      );
      if (!recoveredFreshDocument) {
        throw new Error("Dialog floating cleanup recovery did not load a fresh document.");
      }
      await waitForCleanState();
    } catch (recoveryError) {
      throw new AggregateError(
        [cleanupError, recoveryError],
        "Dialog floating cleanup and document recovery both failed.",
      );
    }
    throw cleanupError;
  }
}
