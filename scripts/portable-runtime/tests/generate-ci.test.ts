import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { GENERATE_CI_TASKS, type GenerateCiTask } from "../generate-ci.mjs";

async function readRootScripts(): Promise<Record<string, string>> {
  return JSON.parse(await readFile("package.json", "utf8")).scripts;
}

function phases(script: string): string[] {
  return script.split("&&").map((phase) => phase.trim());
}

function taskCommand({ args }: GenerateCiTask): string {
  return args[0] === "run" ? `pnpm ${args.at(-1)}` : args.slice(1).join(" ");
}

describe("runtime:generate:ci", () => {
  it("runs every generator of the sequential drift scripts once", async () => {
    const scripts = await readRootScripts();
    const sequential = [
      ...phases(scripts["runtime:generate:all"]!),
      "pnpm svelte:styled:generate",
      ...phases(scripts["runtime:registry:generate"]!),
    ];

    expect(scripts["runtime:generate:ci"]).toBe("node scripts/portable-runtime/generate-ci.mjs");
    expect(GENERATE_CI_TASKS.map(taskCommand).sort()).toEqual(sequential.sort());
  });
});
