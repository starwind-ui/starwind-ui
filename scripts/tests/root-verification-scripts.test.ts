import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

type PackageJson = {
  scripts?: Record<string, string>;
};

async function readRootPackage(): Promise<PackageJson> {
  return JSON.parse(await readFile("package.json", "utf8")) as PackageJson;
}

describe("root verification scripts", () => {
  it("runs the real lint, typecheck, and format commands in order", async () => {
    const pkg = await readRootPackage();

    expect(pkg.scripts?.check).toBe("pnpm lint:check && pnpm typecheck && pnpm format:check");
  });

  it("aggregates root and Runtime tests and coverage", async () => {
    const pkg = await readRootPackage();

    expect(pkg.scripts?.["test:all"]).toBe("pnpm test:run && pnpm runtime:test");
    expect(pkg.scripts?.["runtime:test:coverage"]).toBe(
      "pnpm --filter=@starwind-ui/runtime exec vitest run --coverage",
    );
    expect(pkg.scripts?.["test:coverage:all"]).toBe(
      "pnpm test:coverage && pnpm runtime:test:coverage",
    );
  });

  it("runs every canonical verification phase in order", async () => {
    const pkg = await readRootPackage();

    expect(pkg.scripts?.verify).toBe(
      [
        "pnpm check",
        "pnpm test:all",
        "pnpm test:homes",
        "pnpm runtime:generate:test",
        "pnpm runtime:generate:typecheck",
        "pnpm runtime:docs:metadata:check",
        "pnpm build",
        "pnpm audit --prod --audit-level high",
      ].join(" && "),
    );
  });

  it("gates release automation on the read-only reusable verification workflow", async () => {
    const [verifyWorkflow, releaseWorkflow] = await Promise.all([
      readFile(".github/workflows/verify.yml", "utf8"),
      readFile(".github/workflows/release.yml", "utf8"),
    ]);

    expect(verifyWorkflow).toContain("pull_request:");
    expect(verifyWorkflow).toContain("workflow_call:");
    expect(verifyWorkflow).toContain("contents: read");
    expect(verifyWorkflow).not.toMatch(/permissions:[\s\S]*?\bwrite\b/);
    expect(verifyWorkflow).toContain("pnpm install --frozen-lockfile");
    expect(verifyWorkflow).toContain("pnpm verify");
    expect(verifyWorkflow).toContain("pnpm runtime:generate:all");
    expect(verifyWorkflow).toContain("pnpm runtime:registry:generate");
    expect(verifyWorkflow).toContain("git diff --exit-code");

    expect(releaseWorkflow).toContain("uses: ./.github/workflows/verify.yml");
    expect(releaseWorkflow).toMatch(/release:\s+name: Release\s+needs: verify/);
  });
});
