import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "tsup";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join("/tmp", "starwind-react-portal-bundle-test");

beforeAll(async () => {
  await build({
    bundle: true,
    clean: true,
    dts: false,
    entry: {
      button: path.join(packageRoot, "src/button/index.ts"),
      popover: path.join(packageRoot, "src/popover/index.ts"),
    },
    external: ["react", "react-dom", /^@starwind-ui\/runtime/],
    format: ["esm"],
    outDir: outputRoot,
    silent: true,
    sourcemap: false,
    splitting: false,
  });
});

afterAll(async () => {
  await rm(outputRoot, { force: true, recursive: true });
});

describe("React Portal bundle isolation", () => {
  it("keeps createPortal out of a non-portal component subpath", async () => {
    const button = await readFile(path.join(outputRoot, "button.js"), "utf8");

    expect(button).not.toContain('from "react-dom"');
    expect(button).not.toContain("createPortal");
    expect(button).not.toContain("usePortalRuntimeRemount");
  });

  it("includes the helper only in a Portal family subpath and keeps React external", async () => {
    const popover = await readFile(path.join(outputRoot, "popover.js"), "utf8");

    expect(popover).toContain('from "react-dom"');
    expect(popover).toContain("createPortal");
    expect(popover).toContain('from "react"');
    expect(popover).not.toContain("react.production.js");
  });
});
