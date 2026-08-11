import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

type PackageJson = {
  scripts?: Record<string, string>;
};

async function readPackage(path: string): Promise<PackageJson> {
  return JSON.parse(await readFile(path, "utf8")) as PackageJson;
}

describe("local runtime link scripts", () => {
  it("links the runtime CLI and framework adapter packages without core", async () => {
    const pkg = await readPackage("package.json");
    const linkScript = pkg.scripts?.l ?? "";

    expect(linkScript).toContain("runtime:link");
    expect(linkScript).toContain("cli:link");
    expect(linkScript).toContain("astro:link");
    expect(linkScript).toContain("react:link");
    expect(linkScript).toContain("vue:link");
    expect(linkScript.indexOf("runtime:build")).toBeLessThan(linkScript.indexOf("runtime:link"));
    expect(linkScript.indexOf("react:build")).toBeLessThan(linkScript.indexOf("react:link"));
    expect(linkScript.indexOf("vue:build")).toBeLessThan(linkScript.indexOf("vue:link"));
    expect(linkScript.indexOf("cli:build")).toBeLessThan(linkScript.indexOf("cli:link"));
    expect(linkScript).not.toContain("core");
    expect(linkScript).not.toContain("yalc");
  });

  it("unlinks the runtime CLI and framework adapter packages without core", async () => {
    const pkg = await readPackage("package.json");
    const unlinkScript = pkg.scripts?.ul ?? "";

    expect(unlinkScript).toContain("astro:unlink");
    expect(unlinkScript).toContain("react:unlink");
    expect(unlinkScript).toContain("vue:unlink");
    expect(unlinkScript).toContain("runtime:unlink");
    expect(unlinkScript).toContain("cli:unlink");
    expect(unlinkScript).not.toContain("core");
    expect(unlinkScript).not.toContain("yalc");
    expect(unlinkScript).toContain("spawnSync");
    expect(unlinkScript).toContain("process.exitCode");
    expect(unlinkScript).toContain("failed ||=");
    expect(unlinkScript).not.toContain(" && ");
  });

  it("points package leaf scripts at the local Runtime package directories", async () => {
    const pkg = await readPackage("package.json");

    expect(pkg.scripts?.["astro:link"]).toContain("--dir packages/astro");
    expect(pkg.scripts?.["astro:unlink"]).toBe("pnpm unlink:global @starwind-ui/astro");
    expect(pkg.scripts?.["react:link"]).toContain("--dir packages/react");
    expect(pkg.scripts?.["react:unlink"]).toBe("pnpm unlink:global @starwind-ui/react");
    expect(pkg.scripts?.["react:build"]).toBe("pnpm --filter=@starwind-ui/react build");
    expect(pkg.scripts?.["runtime:link"]).toContain("--dir packages/runtime");
    expect(pkg.scripts?.["runtime:unlink"]).toBe("pnpm unlink:global @starwind-ui/runtime");
    expect(pkg.scripts?.["vue:link"]).toContain("--dir packages/vue");
    expect(pkg.scripts?.["vue:unlink"]).toBe("pnpm unlink:global @starwind-ui/vue");
    expect(pkg.scripts?.["vue:build"]).toBe("pnpm --filter=@starwind-ui/vue build");
    expect(pkg.scripts?.["cli:unlink"]).toBe("pnpm unlink:global starwind");
    expect(pkg.scripts?.["unlink:global"]).toContain("list");
    expect(pkg.scripts?.["unlink:global"]).toContain("--global");
    expect(pkg.scripts?.["unlink:global"]).toContain("dependencies[name]");
    expect(pkg.scripts?.["test:vue-cli-local-link"]).toContain("--local-link-only");
  });

  it("does not advertise retired yalc or dead Core helper workflows", async () => {
    const root = await readPackage("package.json");
    const core = await readPackage("packages/core/package.json");
    const retiredCoreScripts = ["core:link", "core:unlink", "core:yalc:link", "core:yalc:unlink"];
    const retiredRootScripts = [
      "cli:yalc:link",
      "cli:yalc:unlink",
      "core:sync",
      ...retiredCoreScripts,
      "yalc:link",
      "yalc:unlink",
    ];

    for (const script of retiredRootScripts) {
      expect(root.scripts).not.toHaveProperty(script);
    }
    for (const script of retiredCoreScripts) {
      expect(core.scripts).not.toHaveProperty(script);
    }
    expect(root.scripts).toHaveProperty("l");
    expect(root.scripts).toHaveProperty("ul");
  });
});
