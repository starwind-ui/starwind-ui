import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createThemeController,
  getThemeInitScript,
  initThemeController,
} from "../../src/theme/theme";

describe("createThemeController", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.documentElement.className = "";
    localStorage.clear();

    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        addEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: false,
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
      })),
    );
  });

  it("applies the stored theme and syncs theme toggle controls", () => {
    localStorage.setItem("colorTheme", "dark");
    document.body.innerHTML = `
      <button data-sw-theme-toggle data-sw-toggle aria-pressed="false" data-state="off">
        <span data-theme-icon></span>
      </button>
    `;
    const toggle = document.querySelector<HTMLButtonElement>("[data-sw-theme-toggle]")!;
    const icon = document.querySelector<HTMLElement>("[data-theme-icon]")!;

    const controller = createThemeController();

    expect(controller.getTheme()).toBe("dark");
    expect(controller.getResolvedTheme()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(toggle.getAttribute("data-state")).toBe("on");
    expect(toggle.hasAttribute("data-pressed")).toBe(true);
    expect(icon.hasAttribute("data-ready")).toBe(true);

    controller.destroy();
  });

  it("updates the persisted theme from a theme toggle control", () => {
    localStorage.setItem("colorTheme", "light");
    document.body.innerHTML = `
      <button
        data-sw-theme-toggle
        data-sw-toggle
        data-sync-group="starwind-theme"
        aria-pressed="false"
        data-state="off"
      >
        Theme
      </button>
    `;
    const toggle = document.querySelector<HTMLButtonElement>("[data-sw-theme-toggle]")!;
    const onThemeChange = vi.fn();
    const onToggleChange = vi.fn();
    document.addEventListener("starwind:theme-change", onThemeChange);
    toggle.addEventListener("starwind-toggle:change", onToggleChange);

    const controller = createThemeController();

    toggle.click();

    expect(controller.getTheme()).toBe("dark");
    expect(controller.getResolvedTheme()).toBe("dark");
    expect(localStorage.getItem("colorTheme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(onThemeChange).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          previousTheme: "light",
          reason: "control-change",
          resolvedTheme: "dark",
          theme: "dark",
        }),
      }),
    );
    expect(onToggleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          pressed: true,
          syncGroup: "starwind-theme",
          toggleId: expect.stringMatching(/^starwind-toggle-\d+$/),
        }),
      }),
    );

    controller.destroy();
    toggle.removeEventListener("starwind-toggle:change", onToggleChange);
    document.removeEventListener("starwind:theme-change", onThemeChange);
  });

  it("supports keyboard activation for non-button theme toggle controls", () => {
    localStorage.setItem("colorTheme", "light");
    document.body.innerHTML = `
      <span data-sw-theme-toggle data-theme-on="dark" data-theme-off="light">
        Theme
      </span>
    `;
    const toggle = document.querySelector<HTMLElement>("[data-sw-theme-toggle]")!;

    const controller = createThemeController();

    expect(toggle.getAttribute("role")).toBe("button");
    expect(toggle.tabIndex).toBe(0);

    toggle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(controller.getTheme()).toBe("dark");
    expect(localStorage.getItem("colorTheme")).toBe("dark");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");

    toggle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));

    expect(controller.getTheme()).toBe("dark");

    toggle.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: " " }));

    expect(controller.getTheme()).toBe("light");
    expect(localStorage.getItem("colorTheme")).toBe("light");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    controller.destroy();
  });

  it("ignores disabled theme toggle controls", () => {
    localStorage.setItem("colorTheme", "light");
    document.body.innerHTML = `
      <button data-sw-theme-toggle disabled aria-pressed="false" data-state="off">
        Theme
      </button>
    `;
    const toggle = document.querySelector<HTMLButtonElement>("[data-sw-theme-toggle]")!;

    const controller = createThemeController();

    toggle.click();

    expect(controller.getTheme()).toBe("light");
    expect(localStorage.getItem("colorTheme")).toBe("light");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    controller.destroy();
  });

  it("does not treat the legacy starwind-theme-toggle class as a theme toggle", () => {
    localStorage.setItem("colorTheme", "light");
    document.body.innerHTML = `
      <button data-sw-theme-control data-sw-toggle class="starwind-theme-toggle">
        Theme
      </button>
    `;
    const legacyToggle = document.querySelector<HTMLButtonElement>("[data-sw-theme-control]")!;

    const controller = createThemeController();

    legacyToggle.dispatchEvent(
      new CustomEvent("starwind-toggle:change", {
        bubbles: true,
        detail: { pressed: true },
      }),
    );

    expect(controller.getTheme()).toBe("light");
    expect(localStorage.getItem("colorTheme")).toBe("light");

    controller.destroy();
  });

  it("supports generic select and switch style theme controls", () => {
    document.body.innerHTML = `
      <select data-sw-theme-control>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
      <button data-sw-theme-control data-sw-switch data-theme-on="dark" data-theme-off="light">
        Switch theme
      </button>
    `;
    const select = document.querySelector<HTMLSelectElement>("select")!;
    const switchRoot = document.querySelector<HTMLButtonElement>("[data-sw-switch]")!;

    const controller = createThemeController();
    select.value = "system";
    select.dispatchEvent(new Event("change", { bubbles: true }));

    expect(controller.getTheme()).toBe("system");
    expect(localStorage.getItem("colorTheme")).toBe("system");
    expect(select.value).toBe("system");

    switchRoot.dispatchEvent(
      new CustomEvent("starwind:checked-change", {
        bubbles: true,
        detail: { checked: true },
      }),
    );

    expect(controller.getTheme()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(select.value).toBe("dark");

    controller.destroy();
  });

  it("syncs direct theme value controls against the selected theme", () => {
    document.body.innerHTML = `
      <button id="light" data-sw-theme-control data-theme-value="light">Light</button>
      <button id="system" data-sw-theme-control data-theme-value="system">System</button>
      <button id="dark" data-sw-theme-control data-theme-value="dark">Dark</button>
    `;
    const light = document.querySelector<HTMLButtonElement>("#light")!;
    const system = document.querySelector<HTMLButtonElement>("#system")!;
    const dark = document.querySelector<HTMLButtonElement>("#dark")!;

    const controller = createThemeController({ defaultTheme: "system" });

    expect(system.getAttribute("aria-pressed")).toBe("true");
    expect(light.getAttribute("aria-pressed")).toBe("false");
    expect(dark.getAttribute("aria-pressed")).toBe("false");

    dark.click();

    expect(controller.getTheme()).toBe("dark");
    expect(dark.getAttribute("aria-pressed")).toBe("true");
    expect(system.getAttribute("aria-pressed")).toBe("false");

    light.click();

    expect(controller.getTheme()).toBe("light");
    expect(light.getAttribute("aria-pressed")).toBe("true");
    expect(dark.getAttribute("aria-pressed")).toBe("false");

    controller.destroy();
  });

  it("resolves system theme and reacts to system preference changes", () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const mediaQuery = {
      addEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      }),
      dispatchEvent: vi.fn(),
      matches: false,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mediaQuery),
    );
    localStorage.setItem("colorTheme", "system");

    const controller = createThemeController();

    expect(controller.getTheme()).toBe("system");
    expect(controller.getResolvedTheme()).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    mediaQuery.matches = true;
    listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));

    expect(controller.getTheme()).toBe("system");
    expect(controller.getResolvedTheme()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("colorTheme")).toBe("system");

    controller.destroy();
  });

  it("reuses the shared theme controller and refreshes later controls", () => {
    localStorage.setItem("colorTheme", "dark");
    document.body.innerHTML = `<button id="first" data-sw-theme-toggle data-sw-toggle>Theme</button>`;

    const firstController = initThemeController();
    document.body.insertAdjacentHTML(
      "beforeend",
      `<button id="second" data-sw-theme-toggle data-sw-toggle aria-pressed="false">Theme</button>`,
    );
    const secondController = initThemeController();
    const secondToggle = document.querySelector<HTMLButtonElement>("#second")!;

    expect(secondController).toBe(firstController);
    expect(secondToggle.getAttribute("aria-pressed")).toBe("true");

    firstController.destroy();
  });

  it("syncs controls across separately initialized roots in the same document", () => {
    localStorage.setItem("colorTheme", "light");
    document.body.innerHTML = `
      <div id="first-root">
        <button id="dark-button" data-sw-theme-control data-theme-value="dark">Dark</button>
      </div>
      <div id="second-root">
        <select id="theme-select" data-sw-theme-control>
          <option value="light">Light</option>
          <option value="system">System</option>
          <option value="dark">Dark</option>
        </select>
      </div>
    `;
    const firstRoot = document.querySelector<HTMLElement>("#first-root")!;
    const secondRoot = document.querySelector<HTMLElement>("#second-root")!;
    const button = document.querySelector<HTMLButtonElement>("#dark-button")!;
    const select = document.querySelector<HTMLSelectElement>("#theme-select")!;

    const firstController = initThemeController(firstRoot);
    const secondController = initThemeController(secondRoot);

    button.click();

    expect(firstController.getTheme()).toBe("dark");
    expect(secondController.getTheme()).toBe("dark");
    expect(select.value).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    firstController.destroy();
    secondController.destroy();
  });

  it("creates a pre-paint script that applies the stored dark theme", () => {
    localStorage.setItem("colorTheme", "dark");

    new Function(getThemeInitScript())();

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("colorTheme")).toBe("dark");
  });

  it("creates a pre-paint script that resolves and persists the default system theme", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        addEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: true,
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
      })),
    );

    new Function(getThemeInitScript())();

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("colorTheme")).toBe("system");
  });

  it("creates a pre-paint script that re-applies the theme after Astro swaps", () => {
    localStorage.setItem("colorTheme", "dark");

    new Function(getThemeInitScript())();
    document.documentElement.classList.remove("dark");
    document.dispatchEvent(new Event("astro:after-swap"));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("escapes values that could terminate an inline script element", () => {
    const script = getThemeInitScript({
      className: '</script><script data-injected="true">',
      storageKey: "theme<&\u2028\u2029",
    });

    expect(script).not.toContain("</script>");
    expect(script).not.toContain("<script");
    expect(script).not.toContain("\u2028");
    expect(script).not.toContain("\u2029");
    expect(script).toContain("\\u003c/script\\u003e");
    expect(script).toContain("\\u0026");
    expect(script).toContain("\\u2028");
    expect(script).toContain("\\u2029");
  });
});
