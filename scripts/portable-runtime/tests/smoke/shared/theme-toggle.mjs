export async function verifyThemeToggleCases({ page, ids, label }) {
  await page.waitForFunction(
    ({ demoId, primary }) => {
      const demoRoot = document.getElementById(demoId);
      const root = document.getElementById(primary);

      return (
        demoRoot instanceof HTMLElement &&
        root instanceof HTMLElement &&
        root.getAttribute("data-state") === "off" &&
        root.querySelectorAll("[data-theme-icon][data-ready]").length >= 2
      );
    },
    { demoId: ids.demo, primary: ids.primary },
  );

  const initialState = await page.evaluate(readThemeState, ids);

  await page.locator(`#${ids.primary}`).click();
  await page.waitForFunction(
    ({ primary, secondary, select, switchId }) => {
      const firstToggle = document.getElementById(primary);
      const secondToggle = document.getElementById(secondary);
      const themeSelect = document.getElementById(select);
      const themeSwitch = document.getElementById(switchId);

      return (
        document.documentElement.classList.contains("dark") &&
        localStorage.getItem("colorTheme") === "dark" &&
        firstToggle?.getAttribute("data-state") === "on" &&
        secondToggle?.getAttribute("data-state") === "on" &&
        themeSelect instanceof HTMLSelectElement &&
        themeSelect.value === "dark" &&
        themeSwitch?.getAttribute("aria-checked") === "true"
      );
    },
    { primary: ids.primary, secondary: ids.secondary, select: ids.select, switchId: ids.switch },
  );

  await page.locator(`#${ids.select}`).selectOption("light");
  await page.waitForFunction(
    ({ primary, select }) => {
      const root = document.getElementById(primary);
      const themeSelect = document.getElementById(select);

      return (
        !document.documentElement.classList.contains("dark") &&
        localStorage.getItem("colorTheme") === "light" &&
        root?.getAttribute("data-state") === "off" &&
        themeSelect instanceof HTMLSelectElement &&
        themeSelect.value === "light"
      );
    },
    { primary: ids.primary, select: ids.select },
  );

  await page.locator(`#${ids.switch}`).click();
  await page.waitForFunction(
    ({ switchId }) => {
      const themeSwitch = document.getElementById(switchId);

      return (
        document.documentElement.classList.contains("dark") &&
        localStorage.getItem("colorTheme") === "dark" &&
        themeSwitch?.getAttribute("aria-checked") === "true"
      );
    },
    { switchId: ids.switch },
  );

  await page.locator(`#${ids.systemButton}`).click();
  await page.waitForFunction(
    ({ select, systemButton }) => {
      const themeSelect = document.getElementById(select);
      const system = document.getElementById(systemButton);

      return (
        localStorage.getItem("colorTheme") === "system" &&
        themeSelect instanceof HTMLSelectElement &&
        themeSelect.value === "system" &&
        system?.getAttribute("aria-pressed") === "true"
      );
    },
    { select: ids.select, systemButton: ids.systemButton },
  );

  await page.locator(`#${ids.darkButton}`).click();
  await page.waitForFunction(
    ({ primary, select }) => {
      const root = document.getElementById(primary);
      const themeSelect = document.getElementById(select);

      return (
        document.documentElement.classList.contains("dark") &&
        localStorage.getItem("colorTheme") === "dark" &&
        root?.getAttribute("data-state") === "on" &&
        themeSelect instanceof HTMLSelectElement &&
        themeSelect.value === "dark"
      );
    },
    { primary: ids.primary, select: ids.select },
  );

  if (ids.rerenderButton) {
    await page.locator(`#${ids.rerenderButton}`).click();
    await page.waitForFunction(
      ({ primary, secondary, switchId }) => {
        const firstToggle = document.getElementById(primary);
        const secondToggle = document.getElementById(secondary);
        const themeSwitch = document.getElementById(switchId);

        return (
          firstToggle?.getAttribute("data-state") === "on" &&
          secondToggle?.getAttribute("data-state") === "on" &&
          themeSwitch?.getAttribute("aria-checked") === "true"
        );
      },
      { primary: ids.primary, secondary: ids.secondary, switchId: ids.switch },
    );
  }

  const finalState = await page.evaluate(readThemeState, ids);

  if (
    initialState.documentDark !== false ||
    initialState.storageValue !== "light" ||
    initialState.themeToggleCount !== 3 ||
    initialState.themeControlCount !== 8 ||
    initialState.primary.hasDataSwThemeToggle !== true ||
    initialState.primary.hasDataSwToggle !== true ||
    initialState.primary.dataSlot !== "theme-toggle" ||
    initialState.primary.dataState !== "off" ||
    initialState.primary.ariaPressed !== "false" ||
    initialState.primary.ariaLabel !== "Toggle theme" ||
    initialState.primary.themeOn !== "dark" ||
    initialState.primary.themeOff !== "light" ||
    initialState.primary.syncGroup !== "starwind-theme" ||
    initialState.primary.className?.includes("starwind-theme-toggle") === true ||
    initialState.primary.iconsDecorative !== true ||
    initialState.primary.readyIconCount < 2 ||
    initialState.secondary.dataState !== "off" ||
    initialState.custom.readyIconCount < 2 ||
    initialState.selectValue !== "light" ||
    initialState.switchChecked !== false ||
    finalState.documentDark !== true ||
    finalState.storageValue !== "dark" ||
    finalState.primary.dataState !== "on" ||
    finalState.primary.ariaPressed !== "true" ||
    finalState.secondary.dataState !== "on" ||
    finalState.selectValue !== "dark" ||
    finalState.switchChecked !== true
  ) {
    throw new Error(
      `Expected ${label} ThemeToggle to sync toggles, generic controls, localStorage, document class, and ready icons, got ${JSON.stringify(
        { finalState, initialState },
      )}.`,
    );
  }
}

function readThemeState(ids) {
  const demoRoot = document.getElementById(ids.demo);
  const readToggle = (id) => {
    const root = document.getElementById(id);

    return {
      ariaLabel: root?.getAttribute("aria-label"),
      ariaPressed: root?.getAttribute("aria-pressed"),
      className: root?.getAttribute("class"),
      dataSlot: root?.getAttribute("data-slot"),
      dataState: root?.getAttribute("data-state"),
      hasDataSwThemeToggle: root?.hasAttribute("data-sw-theme-toggle"),
      hasDataSwToggle: root?.hasAttribute("data-sw-toggle"),
      readyIconCount: root?.querySelectorAll("[data-theme-icon][data-ready]").length ?? 0,
      iconsDecorative: Array.from(root?.querySelectorAll("[data-theme-icon]") ?? []).every(
        (icon) => icon.getAttribute("aria-hidden") === "true",
      ),
      syncGroup: root?.getAttribute("data-sync-group"),
      themeOff: root?.getAttribute("data-theme-off"),
      themeOn: root?.getAttribute("data-theme-on"),
    };
  };
  const select = document.getElementById(ids.select);
  const switchRoot = document.getElementById(ids.switch);

  return {
    custom: readToggle(ids.custom),
    documentDark: document.documentElement.classList.contains("dark"),
    primary: readToggle(ids.primary),
    secondary: readToggle(ids.secondary),
    selectValue: select instanceof HTMLSelectElement ? select.value : null,
    storageValue: localStorage.getItem("colorTheme"),
    switchChecked: switchRoot?.getAttribute("aria-checked") === "true",
    systemButtonPressed: document.getElementById(ids.systemButton)?.getAttribute("aria-pressed"),
    themeControlCount: demoRoot?.querySelectorAll("[data-sw-theme-control]").length ?? 0,
    themeToggleCount: demoRoot?.querySelectorAll("[data-sw-theme-toggle]").length ?? 0,
  };
}
