import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { selectRuntimeAdapterContract } from "../contracts/primitive/components/select.js";
import { buildSelectSpecializedAdapterSpec } from "../renderers/specialized-adapter-spec/select-specialized-adapter-spec.js";
import { solidFrameworkAdapterReadiness } from "../renderers/framework-adapters/solid/adapter.js";
import {
  projectSolidPortalPlacementTrace,
  solidPortalPlacementProof,
  solidPortalWrapperException,
} from "../renderers/framework-adapters/solid/future-framework-tracer.js";
import { printSelectFutureFrameworkTracerSpec } from "../renderers/framework-adapters/solid/specialized-future-framework-tracer.js";
import { svelteFrameworkAdapterTarget } from "../renderers/framework-adapters/svelte/index.js";

describe("private Solid portal placement tracer", () => {
  it("uses native Portal with Runtime target and readiness policy", () => {
    const spec = buildSelectSpecializedAdapterSpec(selectRuntimeAdapterContract);
    const files = printSelectFutureFrameworkTracerSpec(spec);
    const portal = files.find((file) => file.path.endsWith("/SelectPortal.tsx"));

    expect(portal?.contents).toContain('import { Portal } from "solid-js/web";');
    expect(portal?.contents).toContain("resolvePortalPlacement");
    expect(portal?.contents).toContain("reportPortalPlacement");
    expect(portal?.contents).toContain('mode: "framework"');
    expect(portal?.contents).toContain("<Portal mount={portalTarget()!}");
    expect(portal?.contents).toContain('data-sw-portal-placement="framework"');
    expect(portal?.contents).toContain("const requestedContainer = local.container;");
    expect(portal?.contents).toContain("const requestedTarget = resolvePortalPlacement");
    expect(portal?.contents).toContain("container: requestedContainer");
    expect(portal?.contents).toContain("nativeContainer.parentElement !== requestedTarget");
    expect(portal?.contents).toContain("const readinessTarget = resolvePortalPlacement");
    expect(portal?.contents).toContain("container: nativeContainer");
    expect(portal?.contents).toMatch(
      /reportPortalPlacement\(element, \{ ready: false, target: readinessTarget \}\)[\s\S]*element\.parentElement === readinessTarget[\s\S]*reportPortalPlacement\(element, \{ ready: true, target: readinessTarget \}\)/,
    );
  });

  it("keeps the requested mount reactive while native readiness catches up", () => {
    const moving = projectSolidPortalPlacementTrace({
      nativeContainer: "internal-container",
      nativeContainerParent: "outer-a",
      previousRequestedTarget: "outer-a",
      requestedTarget: "outer-b",
      wrapperParent: "internal-container",
    });

    expect(moving).toEqual({
      mountTarget: "outer-b",
      outerTargetChanged: true,
      readinessTarget: "internal-container",
      ready: false,
    });
    expect(
      projectSolidPortalPlacementTrace({
        nativeContainer: "internal-container",
        nativeContainerParent: "outer-b",
        previousRequestedTarget: "outer-a",
        requestedTarget: "outer-b",
        wrapperParent: "internal-container",
      }),
    ).toEqual({
      mountTarget: "outer-b",
      outerTargetChanged: true,
      readinessTarget: "internal-container",
      ready: true,
    });
  });

  it("records one private native container without changing the public part", () => {
    expect(solidPortalPlacementProof).toEqual({
      nativePrimitive: "Portal",
      placementOwner: "solid",
      policyOwner: "runtime",
      serverAndFirstHydrationPlacement: "inline",
    });
    expect(solidPortalWrapperException).toEqual({
      element: "div",
      owner: "solid-native-portal",
      publicPart: false,
      reason:
        "Solid Portal creates one internal container for non-head mounts; the Starwind public Portal wrapper remains its child.",
    });
  });

  it("keeps package and support metadata private", () => {
    const unsupported = {
      cliRegistry: false,
      demoIntegration: false,
      packageExports: false,
      publicDocsClaim: false,
      status: "non-shipping-tracer",
    };
    const sveltePackage = readPackageManifest("packages/svelte/package.json");
    const changesets = JSON.parse(readFileSync(".changeset/config.json", "utf8")) as {
      fixed?: string[][];
      ignore?: string[];
    };

    expect(sveltePackage).toMatchObject({
      name: "@starwind-ui/svelte",
      private: true,
      version: "0.0.0",
    });
    expect(solidFrameworkAdapterReadiness.publicSupport).toEqual(unsupported);
    expect(svelteFrameworkAdapterTarget.publicSupport).toEqual(unsupported);
    expect(changesets.ignore).toContain("@starwind-ui/svelte");
    expect(changesets.fixed?.flat()).not.toContain("@starwind-ui/svelte");
    expect(changesets.fixed?.flat()).not.toContain("@starwind-ui/solid");
    expect(existsSync("packages/solid")).toBe(false);
  });

  it("keeps Solid and the Svelte proof out of workspace dependencies", () => {
    const manifests = ["package.json", ...readFilesNamed(["apps", "packages"], "package.json")];

    for (const file of manifests) {
      const manifest = readPackageManifest(file);
      const dependencies = readDependencyNames(manifest);
      expect(dependencies, file).not.toContain("@starwind-ui/solid");
      expect(dependencies, file).not.toContain("@starwind-ui/svelte");
      expect(
        dependencies.filter((name) => name === "solid-js" || name.startsWith("@solidjs/")),
        file,
      ).toEqual([]);
    }
  });

  it("keeps proof output out of registries, demos, diagnostics, and public docs", () => {
    const registryFiles = readTextFiles("packages/cli/registry").concat(
      readTextFiles("packages/cli/src/registry"),
    );
    const demoFiles = ["apps/demo", "apps/react-demo", "apps/vue-demo"].flatMap(readTextFiles);
    const reportFiles = [
      "README.md",
      "docs/product/positioning.md",
      ...readTextFiles("docs/portable-runtime"),
    ].filter(existsSync);
    const forbiddenReferences = [
      "@starwind-ui/solid",
      "@starwind-ui/svelte",
      "__future-fixtures/solid",
      "__future-fixtures/svelte",
    ];

    for (const file of [...registryFiles, ...demoFiles, ...reportFiles]) {
      const source = readFileSync(file, "utf8");
      for (const reference of forbiddenReferences) {
        expect(source, file).not.toContain(reference);
      }
    }
    for (const file of registryFiles) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /"(?:framework|target)"\s*:\s*"(?:solid|svelte)"|"(?:frameworks|targets)"\s*:\s*\[[^\]]*"(?:solid|svelte)"/i,
      );
    }
    for (const file of demoFiles) {
      expect(file.endsWith(".svelte"), file).toBe(false);
      expect(readFileSync(file, "utf8"), file).not.toMatch(/from ["']solid-js(?:\/web)?["']/);
    }
    for (const file of reportFiles) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /Starwind(?: UI)? (?:supports|ships|offers) [^.\n]*(?:Svelte|Solid)/i,
      );
    }
  });

  it("keeps generated proof artifacts quarantined", () => {
    const committedFixtureHomes = [
      "__future-fixtures/solid",
      "__future-fixtures/svelte",
      "scripts/portable-runtime/__future-fixtures/solid",
      "scripts/portable-runtime/__future-fixtures/svelte",
    ];
    const svelteComponents = readTextFiles("packages/svelte/src").filter((file) =>
      file.endsWith(".svelte"),
    );

    for (const home of committedFixtureHomes) expect(existsSync(home), home).toBe(false);
    expect(svelteComponents.length).toBeGreaterThan(0);
    for (const file of svelteComponents) {
      expect(readFileSync(file, "utf8"), file).toContain(
        "Internal non-shipping Svelte proof output.",
      );
    }
    expect(readFileSync("packages/svelte/README.md", "utf8")).toContain(
      "private, non-shipping Svelte adapter verification package",
    );
  });
});

type PackageManifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  name?: string;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  private?: boolean;
  version?: string;
};

function readPackageManifest(file: string): PackageManifest {
  return JSON.parse(readFileSync(file, "utf8")) as PackageManifest;
}

function readDependencyNames(manifest: PackageManifest): string[] {
  return [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ];
}

function readFilesNamed(roots: string[], name: string): string[] {
  return roots.flatMap((root) =>
    readTextFiles(root).filter((file) => path.basename(file) === name),
  );
}

function readTextFiles(root: string): string[] {
  if (!existsSync(root)) return [];

  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name);
    if (entry.name === "node_modules") return [];
    if (entry.isDirectory()) return readTextFiles(entryPath);
    if (!entry.isFile() || /\.(?:gif|jpe?g|png|webp|woff2?)$/i.test(entry.name)) {
      return [];
    }
    return [entryPath];
  });
}
