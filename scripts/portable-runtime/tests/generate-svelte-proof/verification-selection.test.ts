import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  type SvelteSelection,
  selectSvelteVerification,
  svelteCommands,
} from "../../verify-svelte.js";

const home = "scripts/portable-runtime/renderers/framework-adapters/svelte/";
const portalCommand = ["--filter=svelte-demo", "exec", "node", "tests/portal-compositions.mjs"];

function expectPortalCommands(selection: SvelteSelection) {
  const commands = svelteCommands(selection).map((command) => command.args);
  expect(selection.portalCompositions).toBe(true);
  expect(commands.filter((args) => args.includes("tests/portal-compositions.mjs"))).toEqual([
    portalCommand,
  ]);
  for (const filter of ["@starwind-ui/runtime", "@starwind-ui/svelte", "svelte-demo"])
    expect(
      commands.filter((args) => args[0] === `--filter=${filter}` && args[1] === "build"),
    ).toEqual([[`--filter=${filter}`, "build"]]);
}

describe("Svelte verification selection", () => {
  it("selects the focused CLI owner for the private Svelte delivery integration", async () => {
    const result = await selectSvelteVerification([
      "packages/cli/tests/commands/svelte-delivery.integration.test.ts",
    ]);
    expect(result.additional).toContain(
      "pnpm --filter=starwind exec env -u npm_execpath vitest run tests/commands/svelte-delivery.integration.test.ts",
    );
    expect(result.all).toBe(false);
    expect(result.tests).toEqual([]);
  });
  it.each([
    "apps/svelte-demo/src/lib/review/PortalCompositions.svelte",
    "apps/svelte-demo/src/routes/review/portals/+page.svelte",
    "apps/svelte-demo/tests/portal-compositions.mjs",
  ])("runs portal composition checks for %s", async (file) => {
    const result = await selectSvelteVerification([file]);
    expect(svelteCommands(result).map((command) => command.args)).toEqual([
      ["--filter=@starwind-ui/runtime", "build"],
      ["--filter=@starwind-ui/svelte", "build"],
      ["--filter=svelte-demo", "build"],
      portalCommand,
    ]);
    expect(result.primitives).toEqual([]);
    expect(result.styled).toEqual([]);
    expect(result.tests).toEqual([]);
    expect(result.demo).toEqual([]);
    expect(result.layout).toBe(false);
    expect(result.portalCompositions).toBe(true);
    expect(result.additional).toEqual([]);
    expect(result.reasons).toContain(`Portal composition input: ${file}`);
  });
  it("selects portal compositions after Styled dependency expansion", async () => {
    const result = await selectSvelteVerification([
      "scripts/portable-runtime/contracts/styled/components/native-select.ts",
    ]);
    expect(result.primitives).toEqual([]);
    expect(result.styled).toEqual(expect.arrayContaining(["native-select", "color-picker"]));
    expectPortalCommands(result);
    expect(result.reasons.join("\n")).toContain(
      "Portal composition depends on selected Styled input: color-picker",
    );
  });
  it.each([
    ["packages/runtime/src/components/dialog/index.ts", "dialog", "dialog"],
    ["packages/svelte/src/select/SelectRoot.svelte", "select", "select"],
    ["scripts/portable-runtime/contracts/primitive/components/drawer.ts", "drawer", "sheet"],
    ["scripts/portable-runtime/contracts/primitive/components/menu.ts", "menu", "dropdown"],
  ])("retains Primitive owners and selects portals for %s", async (file, primitive, styled) => {
    const result = await selectSvelteVerification([file]);
    expect(result.primitives).toContain(primitive);
    expect(result.styled).toContain(styled);
    expect(result.tests.some((file) => file.endsWith("consumer-types.test.ts"))).toBe(true);
    expect(result.all).toBe(false);
    expectPortalCommands(result);
  });
  it.each([
    "scripts/portable-runtime/contracts/styled/components/sheet.ts",
    "scripts/portable-runtime/contracts/styled/components/dropdown.ts",
    "apps/svelte-demo/src/lib/starwind-runtime/select/SelectContent.svelte",
  ])("selects portals with the affected Styled owners for %s", async (file) => {
    const result = await selectSvelteVerification([file]);
    expect(result.primitives).toEqual([]);
    expect(result.tests.some((file) => file.includes("generate-svelte-styled/"))).toBe(true);
    expect(result.all).toBe(false);
    expectPortalCommands(result);
  });
  it.each([
    "button",
    "color-picker",
    "select",
    "dialog",
    "sheet",
    "drawer",
    "popover",
    "dropdown",
    "menu",
  ])("selects portals for the explicit component %s", async (component) => {
    const result = await selectSvelteVerification([], { components: [component] });
    expect(result.all).toBe(false);
    expectPortalCommands(result);
  });
  it("preserves other checks and builds once for overlapping portal inputs", async () => {
    const result = await selectSvelteVerification(
      [
        "apps/svelte-demo/src/lib/review/PortalCompositions.svelte",
        "apps/svelte-demo/src/routes/review/portals/+page.svelte",
        "apps/svelte-demo/tests/portal-compositions.mjs",
        "apps/svelte-demo/src/lib/review/docs/ComboboxDocsExample.svelte",
        "apps/svelte-demo/src/routes/+layout.svelte",
      ],
      { components: ["color-picker", "select", "color-picker"] },
    );
    expectPortalCommands(result);
    expect(svelteCommands(result).map((command) => command.args)).toEqual([
      ["--filter=@starwind-ui/runtime", "build"],
      ["--filter=@starwind-ui/svelte", "build"],
      ["runtime:generate:svelte:check"],
      ["svelte:styled:check"],
      expect.arrayContaining([
        "exec",
        "vitest",
        "run",
        "scripts/portable-runtime/tests/generate-svelte-proof/color-picker-lifecycle.test.ts",
        "scripts/portable-runtime/tests/generate-svelte-proof/select-lifecycle.test.ts",
        "scripts/portable-runtime/tests/generate-svelte-proof/consumer-types.test.ts",
      ]),
      ["--filter=svelte-demo", "build"],
      ["--filter=svelte-demo", "test", "--components=combobox", "--layout"],
      portalCommand,
    ]);
  });
  it.each([
    "color-picker.ts",
    "color-picker/root.ts",
    "color-picker/parts.ts",
    "color-picker/context.ts",
  ])("selects the Color Picker Primitive owner for %s", async (printer) => {
    const result = await selectSvelteVerification([home + printer]);
    expect(result.primitives).toEqual(["color-picker"]);
    expect(result.styled.every((root) => root === "color-picker")).toBe(true);
    expect(result.tests).toContain(
      "scripts/portable-runtime/tests/generate-svelte-proof/color-picker-lifecycle.test.ts",
    );
    expect(result.tests.some((file) => file.endsWith("consumer-types.test.ts"))).toBe(true);
    expect(result.all).toBe(false);
    expectPortalCommands(result);
  });
  it.each(["sidebar.ts", "sidebar/provider.ts", "sidebar/menu-button.ts"])(
    "selects the Sidebar Primitive owner for %s",
    async (printer) => {
      const result = await selectSvelteVerification([home + printer]);
      expect(result.primitives).toEqual(["sidebar"]);
      expect(result.styled.every((root) => root === "sidebar")).toBe(true);
      expect(result.tests).toContain(
        "scripts/portable-runtime/tests/generate-svelte-proof/sidebar-lifecycle.test.ts",
      );
      expect(result.tests.some((file) => file.endsWith("consumer-types.test.ts"))).toBe(true);
      expect(result.all).toBe(false);
    },
  );
  it("selects the changed family and shared type batch", async () => {
    const result = await selectSvelteVerification(["packages/svelte/src/avatar/AvatarRoot.svelte"]);
    expect(result.primitives).toEqual(["avatar"]);
    expect(result.styled).toEqual(["avatar"]);
    expect(result.tests.some((file) => file.endsWith("avatar-lifecycle.test.ts"))).toBe(true);
    expect(result.tests.some((file) => file.endsWith("consumer-types.test.ts"))).toBe(true);
    expect(result.tests.some((file) => file.endsWith("dialog.test.ts"))).toBe(false);
    expect(result.additional).toEqual([]);
    expect(result.portalCompositions).toBe(false);
    expect(
      svelteCommands(result).some((command) => command.args[0] === "--filter=svelte-demo"),
    ).toBe(false);
  });
  it("expands shared printer helpers to their consumers", async () => {
    const result = await selectSvelteVerification([home + "overlay-portal.ts"]);
    expect(result.primitives).toEqual(expect.arrayContaining(["combobox", "navigation-menu"]));
    expect(result.primitives).not.toContain("avatar");
    expectPortalCommands(result);
  });
  it("keeps a Styled-only change outside Primitive behavior tests", async () => {
    const result = await selectSvelteVerification([
      "scripts/portable-runtime/contracts/styled/components/avatar.ts",
    ]);
    expect(result.primitives).toEqual([]);
    expect(result.styled).toEqual(["avatar"]);
    expect(result.portalCompositions).toBe(false);
  });
  it("expands Styled dependencies through their compositions", async () => {
    const result = await selectSvelteVerification([
      "scripts/portable-runtime/contracts/styled/components/input.ts",
    ]);
    expect(result.styled).toEqual(expect.arrayContaining(["input", "input-group", "combobox"]));
  });
  it("selects a helper's importing tests", async () => {
    const result = await selectSvelteVerification(["packages/svelte/tests/combobox-browser.ts"]);
    expect(result.tests.some((file) => file.endsWith("combobox-lifecycle.test.ts"))).toBe(true);
    expect(result.tests.some((file) => file.endsWith("avatar-lifecycle.test.ts"))).toBe(false);
  });
  it("includes Primitive compositions that import the changed component", async () => {
    const result = await selectSvelteVerification(["packages/svelte/src/input/InputRoot.svelte"]);
    expect(result.primitives).toEqual(expect.arrayContaining(["input", "field"]));
    expect(result.styled).toContain("field");
  });
  it("scopes host harness edits and names the explicit integration check", async () => {
    const result = await selectSvelteVerification([
      "scripts/portable-runtime/check-svelte-hosts.ts",
    ]);
    expect(result.all).toBe(false);
    expect(result.tests).toContain("scripts/portable-runtime/tests/svelte-hosts/runner.test.ts");
    expect(result.additional).toEqual(["pnpm svelte:hosts --host=<affected-host>"]);
  });
  it("uses a broad local fallback for an unclassified target input", async () => {
    const result = await selectSvelteVerification([home + "future-projection.ts"]);
    expect(result.all).toBe(true);
    expect(result.reasons.join("\n")).toContain("without a narrower owner");
  });
  it("runs example checks only for a demo edit", async () => {
    const result = await selectSvelteVerification([
      "apps/svelte-demo/src/lib/review/docs/ComboboxDocsExample.svelte",
    ]);
    expect(result.demo).toEqual(["combobox"]);
    expect(result.tests).toEqual([]);
    expect(svelteCommands(result).at(-1)?.args).toContain("--components=combobox");
  });
  it("keeps documentation and other framework inputs outside the suite", async () => {
    expect(
      svelteCommands(
        await selectSvelteVerification([
          home + "README.md",
          "packages/react/src/button/ButtonRoot.tsx",
        ]),
      ),
    ).toEqual([]);
  });
  it("keeps registry installs, captures, and measurements outside the local suite", async () => {
    const result = await selectSvelteVerification([], { all: true });
    const commands = svelteCommands(result);
    expectPortalCommands(result);
    expect(result.primitives).toHaveLength(37);
    expect(result.styled).toHaveLength(54);
    const argumentsText = commands.map((command) => command.args.join(" ")).join("\n");
    expect(argumentsText).not.toMatch(/svelte:(?:compatibility|hosts|economics)|--visual/);
    expect(commands.filter((command) => command.label === "Build Runtime once")).toHaveLength(1);
    expect(commands.filter((command) => command.label === "Build Svelte once")).toHaveLength(1);
    expect(commands.map((command) => command.args)).toEqual([
      ["--filter=@starwind-ui/runtime", "build"],
      ["--filter=@starwind-ui/svelte", "build"],
      ["runtime:generate:svelte:check"],
      ["svelte:styled:check"],
      ["runtime:generate:typecheck"],
      expect.arrayContaining([
        "exec",
        "vitest",
        "run",
        "--project=portable-svelte",
        "--project=portable-svelte-styled",
      ]),
      ["--filter=@starwind-ui/svelte", "test:run"],
      ["--filter=svelte-demo", "build"],
      ["--filter=svelte-demo", "test"],
      portalCommand,
    ]);
  });
  it("selects all public checks when the private boundary owner is absent", async () => {
    const repo = await mkdtemp(path.join(tmpdir(), "starwind-public-svelte-selection-"));
    try {
      for (const directory of [
        "scripts/portable-runtime/tests/generate-svelte-proof",
        "scripts/portable-runtime/tests/generate-svelte-styled",
      ]) {
        await mkdir(path.join(repo, directory), { recursive: true });
        for (const name of await readdir(directory)) {
          if (name.endsWith(".test.ts")) await writeFile(path.join(repo, directory, name), "");
        }
      }

      const result = await selectSvelteVerification([], { all: true, repo });
      expect(result.all).toBe(true);
      expect(result.tests).not.toContain(
        "scripts/portable-runtime/tests/private/svelte-boundary.test.ts",
      );
      expect(result.tests).toEqual(
        expect.arrayContaining([
          "scripts/portable-runtime/tests/generate-svelte-proof/target.test.ts",
          "scripts/portable-runtime/tests/generate-svelte-styled/generation.test.ts",
        ]),
      );
    } finally {
      await rm(repo, { force: true, recursive: true });
    }
  });
  it("routes package-owned behavior to the package suite", async () => {
    const result = await selectSvelteVerification([], { components: ["theme"] });
    expect(result.package).toBe(true);
    expect(result.tests.every((file) => file.startsWith("scripts/portable-runtime/tests/"))).toBe(
      true,
    );
  });
  it("rejects a misspelled explicit component", async () => {
    await expect(selectSvelteVerification([], { components: ["avatarr"] })).rejects.toThrow(
      "Unknown Svelte component",
    );
  });
});
