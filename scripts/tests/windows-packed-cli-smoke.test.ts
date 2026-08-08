import { execFileSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertCleanLifecycle,
  createPackedLifecycleArgs,
  createWindowsPackedCliPlan,
  runCommand,
} from "../windows-packed-cli-smoke.mjs";

describe("Windows packed CLI smoke", () => {
  it("uses a stable localhost package URL and generated project shims", () => {
    const root = path.resolve("windows-packed-cli");
    const packageUrl = "http://127.0.0.1:4321/starwind-cli.tgz";
    const plan = createWindowsPackedCliPlan(root, packageUrl);

    expect(plan.packageUrl).toBe(packageUrl);
    expect(plan.tarball).toBe(path.join(root, "artifacts", "starwind-cli.tgz"));
    expect(plan.projects.standalone.shim).toBe(
      path.join(root, "standalone", "node_modules", ".bin", "starwind.CMD"),
    );
  });

  it("launches lifecycle commands from an isolated pnpm dlx package", () => {
    const packageUrl = "http://127.0.0.1:4321/starwind-cli.tgz";

    expect(createPackedLifecycleArgs(packageUrl, ["init", "--defaults", "--astro"])).toEqual([
      "dlx",
      packageUrl,
      "init",
      "--defaults",
      "--astro",
    ]);
  });

  it.skipIf(process.platform !== "win32")(
    "terminates the full command process tree at its deadline without leaking a child",
    async () => {
      const deadline = 300;
      const childSource = String.raw`
        const { spawn } = require("node:child_process");
        const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
          stdio: "ignore",
          windowsHide: true,
        });
        console.log("grandchild=" + child.pid);
        setInterval(() => {}, 1000);
      `;
      let grandchildPid;

      try {
        await runCommand({
          args: ["-e", childSource],
          command: process.execPath,
          cwd: process.cwd(),
          timeoutMs: deadline,
        });
        expect.unreachable("Expected the command deadline to reject.");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const match = message.match(/grandchild=(\d+)/);
        grandchildPid = match ? Number(match[1]) : undefined;

        expect(message).toContain(`deadline: ${deadline}ms`);
        expect(message).toContain(`cwd: ${process.cwd()}`);
        expect(message).toContain(`command: ${process.execPath}`);
        expect(message).toMatch(/elapsed: \d+ms/);
        expect(message).toContain("stdout:\n");
        expect(message).toContain("stderr:\n");
        expect(grandchildPid).toBeTypeOf("number");
        await expectProcessExit(grandchildPid);
      } finally {
        if (grandchildPid && isProcessAlive(grandchildPid)) {
          execFileSync("taskkill.exe", ["/PID", String(grandchildPid), "/T", "/F"]);
        }
      }
    },
  );

  it("rejects repeated lifecycles and Windows command fragments", () => {
    expect(() =>
      assertCleanLifecycle({
        code: 0,
        stdout: "Welcome to the Starwind CLI\nEnjoy using Starwind UI",
        stderr: "",
      }),
    ).not.toThrow();
    expect(() =>
      assertCleanLifecycle({
        code: 0,
        stdout:
          "Welcome to the Starwind CLI\nEnjoy using Starwind UI\nWelcome to the Starwind CLI\nEnjoy using Starwind UI",
        stderr: "",
      }),
    ).toThrow();
    expect(() =>
      assertCleanLifecycle({
        code: 0,
        stdout: "Welcome to the Starwind CLI\nEnjoy using Starwind UI",
        stderr: "'.JS' is not recognized as an internal or external command",
      }),
    ).toThrow();
  });
});

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
