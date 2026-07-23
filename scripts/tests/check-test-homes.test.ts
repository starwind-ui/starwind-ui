import { describe, expect, it } from "vitest";

import {
  findTestHomeViolations,
  findTestOwnershipViolations,
  findTestSuiteOwners,
  isTestFilePath,
} from "../check-test-homes.mjs";

describe("test file home guardrail", () => {
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
        "scripts/portable-runtime/tests/generate-vue-wrappers/styled-public-contract.test.ts",
      ),
    ).toEqual(["portable-vue"]);
    expect(
      findTestSuiteOwners("scripts/portable-runtime/tests/generate-astro-wrappers.test.ts"),
    ).toEqual(["portable-runtime"]);
    expect(findTestSuiteOwners("packages/runtime/tests/package-exports.test.ts")).toEqual([
      "runtime",
    ]);
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
