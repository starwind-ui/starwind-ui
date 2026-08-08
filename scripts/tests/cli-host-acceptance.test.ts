import { execFileSync } from "node:child_process";
import { readFile, rm, stat } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertPackedHostProvenance,
  createCliHostAcceptancePlan,
  getAstroPageFixture,
  getViteAppFixture,
  parseArgs,
  runLoggedCommand,
  runWithTemporaryHostRoot,
  shouldPreserveHostRoot,
} from "../cli-host-acceptance.mjs";

const root = path.resolve("cli-host-root");
const packages = {
  astro: path.join(root, "packs", "starwind-astro.tgz"),
  cli: path.join(root, "packs", "starwind-cli.tgz"),
  react: path.join(root, "packs", "starwind-react.tgz"),
  runtime: path.join(root, "packs", "starwind-runtime.tgz"),
};

describe("focused CLI host acceptance", () => {
  it("plans one packed Astro mixed target and one official Vite React JavaScript host", () => {
    const plan = createCliHostAcceptancePlan({ packages, root });

    expect(plan.projects.map((project) => project.id)).toEqual(["astro-react", "vite-react-js"]);
    expect(plan.projects[0].scaffold.args).toEqual([
      "create",
      "astro@5.2.3",
      "astro-react",
      "--template",
      "minimal",
      "--no-install",
      "--no-git",
      "--yes",
    ]);
    expect(plan.projects[0].init.args).toEqual([
      plan.cliEntrypoint,
      "init",
      "--defaults",
      "--framework",
      "react",
    ]);
    expect(plan.projects[0].add.args).toEqual([
      plan.cliEntrypoint,
      "add",
      "button",
      "--framework",
      "react",
      "--yes",
    ]);
    expect(plan.projects[0].check.args).toEqual(["exec", "astro", "check"]);
    expect(plan.projects[0].build.args).toEqual(["build"]);

    expect(plan.projects[1].scaffold.args).toEqual([
      "create",
      "vite@9.1.1",
      "vite-react-js",
      "--template",
      "react",
      "--no-interactive",
    ]);
    expect(plan.projects[1].check.args).toEqual([
      "exec",
      "tsc",
      "--noEmit",
      "--project",
      "tsconfig.json",
    ]);
    expect(plan.projects[1].build.args).toEqual(["build"]);
  });

  it("imports the generated React Button in Astro and keeps the Vite application JavaScript", () => {
    expect(getAstroPageFixture()).toContain(
      'import { Button } from "../components/starwind-react/button";',
    );
    expect(getAstroPageFixture()).toContain("<Button>Astro mixed React passed</Button>");
    expect(getViteAppFixture()).toContain('from "./components/starwind/button"');
    expect(getViteAppFixture()).not.toContain("interface ");
  });

  it("keeps the project root after any failed phase and supports explicit retention", () => {
    expect(shouldPreserveHostRoot({ failed: true, keepTemp: false })).toBe(true);
    expect(shouldPreserveHostRoot({ failed: false, keepTemp: true })).toBe(true);
    expect(shouldPreserveHostRoot({ failed: false, keepTemp: false })).toBe(false);
    expect(parseArgs(["--keep-temp"])).toEqual({ keepTemp: true });
  });

  it("uses exact packed adapter and Runtime dependencies for both hosts", () => {
    const plan = createCliHostAcceptancePlan({ packages, root });

    expect(plan.projects[0].packedDependencies).toEqual({
      "@starwind-ui/react": packages.react,
      "@starwind-ui/runtime": packages.runtime,
    });
    expect(plan.projects[1].packedDependencies).toEqual({
      "@starwind-ui/react": packages.react,
      "@starwind-ui/runtime": packages.runtime,
    });

    expect(() =>
      assertPackedHostProvenance({
        expected: {
          "@starwind-ui/react": { file: packages.react, version: "0.1.0-beta.7" },
          "@starwind-ui/runtime": { file: packages.runtime, version: "0.1.0-beta.7" },
        },
        installed: {
          "@starwind-ui/react": { name: "@starwind-ui/react", version: "0.1.0-beta.7" },
          "@starwind-ui/runtime": { name: "@starwind-ui/runtime", version: "0.1.0-beta.7" },
        },
        lockfile: createPackedLockfile(packages),
        lockfileDirectory: root,
      }),
    ).not.toThrow();
    expect(() =>
      assertPackedHostProvenance({
        expected: {
          "@starwind-ui/react": { file: packages.react, version: "0.1.0-beta.7" },
        },
        installed: {
          "@starwind-ui/react": { name: "@starwind-ui/react", version: "0.1.0-beta.6" },
        },
        lockfile: createPackedLockfile(packages),
        lockfileDirectory: root,
      }),
    ).toThrow(/version/);
  });

  it("rejects registry provenance when an unrelated lock entry uses the expected basename", () => {
    const expectedReact = path.join(root, "packs", "starwind-react.tgz");

    expect(() =>
      assertPackedHostProvenance({
        expected: {
          "@starwind-ui/react": { file: expectedReact, version: "0.1.0-beta.7" },
        },
        installed: {
          "@starwind-ui/react": { name: "@starwind-ui/react", version: "0.1.0-beta.7" },
        },
        lockfile: `lockfileVersion: '9.0'
importers:
  .:
    dependencies:
      '@starwind-ui/react':
        specifier: 0.1.0-beta.7
        version: 0.1.0-beta.7
packages:
  '@starwind-ui/react@0.1.0-beta.7':
    resolution: {integrity: sha512-registry}
  'unrelated@file:packs/starwind-react.tgz':
    resolution: {tarball: file:packs/starwind-react.tgz}
snapshots:
  '@starwind-ui/react@0.1.0-beta.7': {}
  'unrelated@file:packs/starwind-react.tgz': {}
`,
        lockfileDirectory: root,
      }),
    ).toThrow(/packed resolution/);
  });

  it.skipIf(process.platform !== "win32")(
    "terminates a timed-out command tree, records diagnostics, and retains its root",
    async () => {
      const deadline = 300;
      let grandchildPid: number | undefined;
      let retainedRoot = "";

      try {
        await runWithTemporaryHostRoot({ keepTemp: false }, async (temporaryRoot) => {
          retainedRoot = temporaryRoot;
          const childSource = String.raw`
            const { spawn } = require("node:child_process");
            const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
              stdio: "ignore",
              windowsHide: true,
            });
            console.log("grandchild=" + child.pid);
            console.error("timeout-stderr");
            setInterval(() => {}, 1000);
          `;
          await runLoggedCommand(
            "timeout-phase",
            {
              args: ["-e", childSource],
              command: process.execPath,
              cwd: temporaryRoot,
              timeoutMs: deadline,
            },
            path.join(temporaryRoot, "logs"),
          );
        });
        expect.unreachable("Expected the command deadline to reject.");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const match = message.match(/grandchild=(\d+)/);
        grandchildPid = match ? Number(match[1]) : undefined;

        expect(message).toContain("phase: timeout-phase");
        expect(message).toContain(`command: ${process.execPath}`);
        expect(message).toContain(`cwd: ${retainedRoot}`);
        expect(message).toContain(`deadline: ${deadline}ms`);
        expect(message).toMatch(/elapsed: \d+ms/);
        expect(message).toContain("stdout:\ngrandchild=");
        expect(message).toContain("stderr:\ntimeout-stderr");
        expect(grandchildPid).toBeTypeOf("number");
        await expectProcessExit(grandchildPid);
        await expect(stat(retainedRoot)).resolves.toBeDefined();
        const log = await readFile(path.join(retainedRoot, "logs", "timeout-phase.log"), "utf8");
        expect(log).toContain("grandchild=");
        expect(log).toContain("timeout-stderr");
      } finally {
        if (grandchildPid && isProcessAlive(grandchildPid)) {
          execFileSync("taskkill.exe", ["/PID", String(grandchildPid), "/T", "/F"]);
        }
        if (retainedRoot) await rm(retainedRoot, { force: true, recursive: true });
      }
    },
  );
});

function createPackedLockfile(packedPackages: typeof packages) {
  return `lockfileVersion: '9.0'
importers:
  .:
    dependencies:
      '@starwind-ui/react':
        specifier: file:${packedPackages.react.replaceAll("\\", "/")}
        version: file:packs/starwind-react.tgz(react@19.2.0)
packages:
  '@starwind-ui/react@file:packs/starwind-react.tgz':
    resolution: {tarball: file:packs/starwind-react.tgz}
    version: 0.1.0-beta.7
  '@starwind-ui/runtime@file:packs/starwind-runtime.tgz':
    resolution: {tarball: file:packs/starwind-runtime.tgz}
    version: 0.1.0-beta.7
snapshots:
  '@starwind-ui/react@file:packs/starwind-react.tgz(react@19.2.0)':
    dependencies:
      '@starwind-ui/runtime': file:packs/starwind-runtime.tgz
  '@starwind-ui/runtime@file:packs/starwind-runtime.tgz': {}
`;
}

async function expectProcessExit(pid: number | undefined) {
  expect(pid).toBeTypeOf("number");
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (!isProcessAlive(pid!)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Process ${pid} remained alive after its command deadline.`);
}

function isProcessAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ESRCH") return false;
    throw error;
  }
}
