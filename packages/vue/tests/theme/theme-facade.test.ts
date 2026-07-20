import { describe, expect, it, vi } from "vitest";

import { getThemeInitScript, initThemeController } from "@starwind-ui/vue/theme";
import {
  getThemeInitScript as getRuntimeThemeInitScript,
  initThemeController as initRuntimeThemeController,
} from "@starwind-ui/runtime/theme";

import { createThemeInitTags } from "../../../../apps/vue-demo/vite.config.js";
import {
  runVueThemeHostFailureFixture,
  runVueThemeHostFixture,
  type VueThemeHostFailureStage,
} from "../../../../apps/vue-demo/tests/theme-init.fixture.js";

describe("@starwind-ui/vue/theme", () => {
  it("is an SSR-safe exact facade over the approved Runtime helpers", () => {
    expect(getThemeInitScript).toBe(getRuntimeThemeInitScript);
    expect(initThemeController).toBe(initRuntimeThemeController);
    expect(() => getThemeInitScript()).not.toThrow();
  });

  it.each([
    ["light", false],
    ["dark", true],
    ["system", true],
  ] as const)("applies the %s theme before application code", (theme, expectedDark) => {
    const documentElement = { classList: { toggle: vi.fn() } };
    const storage = new Map<string, string>([["colorTheme", theme]]);
    const sandbox = {
      document: {
        addEventListener: vi.fn(),
        documentElement,
      },
      window: {
        localStorage: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => storage.set(key, value),
        },
        matchMedia: vi.fn(() => ({ matches: true })),
      },
    };

    new Function("document", "window", getThemeInitScript())(sandbox.document, sandbox.window);

    expect(documentElement.classList.toggle).toHaveBeenCalledWith("dark", expectedDark);
  });

  it("applies the default when storage is missing or blocked", () => {
    for (const blocked of [false, true]) {
      const toggle = vi.fn();
      const localStorage = blocked
        ? Object.defineProperty({}, "getItem", {
            get() {
              throw new Error("blocked");
            },
          })
        : { getItem: () => null, setItem: vi.fn() };
      const sandbox = {
        document: { addEventListener: vi.fn(), documentElement: { classList: { toggle } } },
        window: { localStorage, matchMedia: vi.fn(() => ({ matches: false })) },
      };

      new Function("document", "window", getThemeInitScript({ defaultTheme: "dark" }))(
        sandbox.document,
        sandbox.window,
      );
      expect(toggle).toHaveBeenCalledWith("dark", true);
    }
  });

  it("escapes inline values and emits a head-prepend script tag", () => {
    const script = getThemeInitScript({ className: "</script>\u2028" });
    expect(script).not.toContain("</script>");
    expect(script).not.toContain("\u2028");
    expect(createThemeInitTags()).toEqual([
      {
        tag: "script",
        attrs: { "data-starwind-theme-init": "" },
        children: getThemeInitScript(),
        injectTo: "head-prepend",
      },
    ]);
  });

  it("initializes before mount, resyncs after mount, and tears down the owned instance once", () => {
    expect(runVueThemeHostFixture()).toEqual([
      "controller:init",
      "app:mount",
      "controller:sync",
      "app:unmount",
      "controller:destroy",
    ]);
  });

  it.each([
    ["mount", ["controller:init", "app:mount", "controller:destroy"]],
    ["sync", ["controller:init", "app:mount", "controller:sync", "controller:destroy"]],
    [
      "unmount",
      ["controller:init", "app:mount", "controller:sync", "app:unmount", "controller:destroy"],
    ],
  ] satisfies Array<[VueThemeHostFailureStage, string[]]>)(
    "destroys exactly once and preserves the %s failure",
    (stage, expectedCalls) => {
      const result = runVueThemeHostFailureFixture(stage);

      expect(result.error).toBe(result.expectedError);
      expect(result.calls).toEqual(expectedCalls);
      expect(result.calls.filter((call) => call === "controller:destroy")).toHaveLength(1);
    },
  );
});
