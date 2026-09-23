import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  findTestHomeViolations,
  findTestOwnershipViolations,
  findTestSuiteOwners,
  isTestFilePath,
  listRepositoryFiles,
} from "../check-test-homes.mjs";

describe("test file home guardrail", () => {
  it("checks the complete inventory when Git output exceeds its default buffer", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "test-homes-large-list-"));
    try {
      execFileSync("git", ["init", "--quiet"], { cwd: root });
      await mkdir(path.join(root, "scripts/tests"), { recursive: true });
      const expected: string[] = [];
      for (let batch = 0; batch < 40; batch += 1) {
        const writes = [];
        for (let index = 0; index < 200; index += 1) {
          const id = String(batch * 200 + index).padStart(5, "0");
          const file = `scripts/tests/${id}-${"inventory-".repeat(13)}.test.ts`;
          expected.push(file);
          writes.push(writeFile(path.join(root, file), ""));
        }
        await Promise.all(writes);
      }
      const violation = "zz-colocated.test.ts";
      expected.push(violation);
      await writeFile(path.join(root, violation), "");

      expect(Buffer.byteLength(`${expected.join("\0")}\0`)).toBeGreaterThan(1024 * 1024);
      const files = listRepositoryFiles(root);
      expect(files.sort()).toEqual(expected.sort());
      expect(findTestHomeViolations(files)).toEqual([violation]);
      expect(findTestOwnershipViolations(files)).toEqual([violation]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("allows approved tests homes", () => {
    expect(
      findTestHomeViolations([
        "scripts/tests/local-link-scripts.test.ts",
        "scripts/portable-runtime/tests/generate-cli-registry.test.ts",
        "scripts/portable-runtime/tests/generate-astro-wrappers/primitive-output.cases.ts",
        "scripts/portable-runtime/tests/smoke/verify-astro-demo.mjs",
        "scripts/portable-runtime/tests/smoke/astro/carousel-cases.mjs",
        "packages/cli/tests/commands/init.test.ts",
        "packages/react/tests/color-picker.browser.test.tsx",
        "packages/runtime/tests/components/button/button.browser.test.ts",
        "packages/svelte/tests/package-build.ssr.test.ts",
      ]),
    ).toEqual([]);
  });

  it("rejects colocated source tests", () => {
    expect(
      findTestHomeViolations([
        "packages/runtime/src/components/button/button.browser.test.ts",
        "packages/runtime/src/dist/foo.test.ts",
        "packages/cli/src/commands/init.test.ts",
        "packages/cli/tests-extra/foo.test.ts",
        "scripts/portable-runtime/generate-cli-registry.test.ts",
        "scripts/portable-runtime/generate-astro-wrappers/primitive-output.cases.ts",
        "scripts/portable-runtime/verify-astro-demo.mjs",
        "scripts/portable-runtime/smoke/astro/carousel-cases.mjs",
        "scripts/tests-old/foo.test.ts",
        "apps/demo/src/components/example.spec.ts",
      ]),
    ).toEqual([
      "apps/demo/src/components/example.spec.ts",
      "packages/cli/src/commands/init.test.ts",
      "packages/cli/tests-extra/foo.test.ts",
      "packages/runtime/src/components/button/button.browser.test.ts",
      "packages/runtime/src/dist/foo.test.ts",
      "scripts/portable-runtime/generate-astro-wrappers/primitive-output.cases.ts",
      "scripts/portable-runtime/generate-cli-registry.test.ts",
      "scripts/portable-runtime/smoke/astro/carousel-cases.mjs",
      "scripts/portable-runtime/verify-astro-demo.mjs",
      "scripts/tests-old/foo.test.ts",
    ]);
  });

  it("ignores generated, dependency, and scratch paths", () => {
    expect(
      findTestHomeViolations([
        ".scratch/old-plan/example.test.ts",
        "node_modules/example/example.test.ts",
        "packages/runtime/dist/components/button.test.js",
        "coverage/runtime/report.spec.js",
        ".agents/skills/example/example.test.ts",
      ]),
    ).toEqual([]);
  });

  it("matches test and spec filenames without matching ordinary source files", () => {
    expect(isTestFilePath("packages/runtime/tests/package-exports.test.ts")).toBe(true);
    expect(isTestFilePath("packages/runtime/tests/button.browser.spec.ts")).toBe(true);
    expect(
      isTestFilePath("scripts/portable-runtime/tests/generate-astro-wrappers/shared.cases.ts"),
    ).toBe(true);
    expect(
      isTestFilePath("scripts/portable-runtime/tests/runtime-adapter-contract/shared.ts"),
    ).toBe(false);
    expect(isTestFilePath("scripts/portable-runtime/tests/smoke/verify-astro-demo.mjs")).toBe(true);
    expect(isTestFilePath("scripts/portable-runtime/tests/smoke/astro/carousel-cases.mjs")).toBe(
      true,
    );
    expect(isTestFilePath("packages/runtime/src/components/button.ts")).toBe(false);
  });

  it("normalizes Windows separators and leading dot-slash paths", () => {
    expect(
      findTestHomeViolations([
        ".\\scripts\\tests\\check-test-homes.test.ts",
        "./packages/runtime/src/components/button/button.test.ts",
      ]),
    ).toEqual(["packages/runtime/src/components/button/button.test.ts"]);
  });

  it("assigns every approved test home to one explicit suite", () => {
    expect(findTestSuiteOwners("scripts/tests/check-test-homes.test.ts")).toEqual(["repo-scripts"]);
    expect(
      findTestSuiteOwners(
        "scripts/portable-runtime/tests/generate-svelte-proof/generation.test.ts",
      ),
    ).toEqual(["portable-svelte"]);
    expect(
      findTestSuiteOwners(
        "scripts/portable-runtime/tests/generate-vue-wrappers/styled-public-contract.test.ts",
      ),
    ).toEqual(["portable-vue"]);
    expect(
      findTestSuiteOwners("scripts/portable-runtime/tests/generate-astro-wrappers.test.ts"),
    ).toEqual(["portable-runtime"]);
    expect(findTestSuiteOwners("packages/runtime/tests/package-exports.test.ts")).toEqual([
      "runtime",
    ]);
    expect(findTestSuiteOwners("packages/svelte/tests/package-build.ssr.test.ts")).toEqual([
      "svelte",
    ]);
  });

  it("assigns the private Svelte demo and Styled tests to their dedicated suites", () => {
    const files = [
      "apps/svelte-demo/tests/review.test.mjs",
      "scripts/portable-runtime/tests/generate-svelte-styled/button.test.ts",
    ];
    expect(findTestHomeViolations(files)).toEqual([]);
    expect(findTestOwnershipViolations(files)).toEqual([]);
    expect(files.map(findTestSuiteOwners)).toEqual([["svelte-demo"], ["portable-svelte-styled"]]);
    expect(
      findTestSuiteOwners(
        "scripts/portable-runtime/tests/generate-svelte-styled-extra/example.test.ts",
      ),
    ).toEqual(["portable-runtime"]);
  });

  it("rejects neighboring demo test homes and colocated Svelte source tests", () => {
    const files = [
      "apps/svelte-demo-next/tests/review.test.mjs",
      "apps/svelte-demo/src/lib/review/example.test.ts",
      "apps/svelte-demo/tests-extra/review.test.mjs",
      "apps/svelte-demo/tests.test.mjs",
      "scripts/portable-runtime/renderers/framework-adapters/svelte/example.test.ts",
    ];
    expect(findTestHomeViolations(files)).toEqual(files);
    expect(findTestOwnershipViolations(files)).toEqual(files);
    for (const file of files) expect(findTestSuiteOwners(file)).toEqual([]);
  });

  it("rejects tests without exactly one suite owner", () => {
    expect(
      findTestOwnershipViolations([
        "scripts/tests/check-test-homes.test.ts",
        "scripts/portable-runtime/tests/runtime-adapter-contract.test.ts",
        "packages/react/tests/color-picker.browser.test.tsx",
        "apps/demo/tests/example.test.ts",
      ]),
    ).toEqual(["apps/demo/tests/example.test.ts"]);
  });
});
