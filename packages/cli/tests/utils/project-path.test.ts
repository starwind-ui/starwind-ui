import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  assertSafePathSegment,
  resolveProjectMutationPath,
  resolveProjectPathLexically,
} from "../../src/utils/project-path.js";

async function createDirectoryLink(target: string, linkPath: string): Promise<Error | undefined> {
  try {
    await symlink(target, linkPath, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    if (
      process.platform === "win32" &&
      error instanceof Error &&
      "code" in error &&
      error.code === "EPERM"
    ) {
      return error;
    }

    throw error;
  }
}

describe.sequential("project mutation paths", () => {
  let projectDir = "";
  let externalDir = "";

  beforeEach(async () => {
    projectDir = await mkdtemp(join(tmpdir(), "starwind-project-path-test-"));
    externalDir = await mkdtemp(join(tmpdir(), "starwind-project-path-external-test-"));
  });

  afterEach(async () => {
    await rm(projectDir, { recursive: true, force: true });
    await rm(externalDir, { recursive: true, force: true });
  });

  it.each(["/tmp/outside", "C:\\outside", "C:outside", "\\\\server\\share\\outside"])(
    "rejects absolute mutation path %s",
    (unsafePath) => {
      expect(() => resolveProjectPathLexically(unsafePath, projectDir)).toThrow(/relative/i);
    },
  );

  it("rejects NUL bytes and paths that escape the project", () => {
    expect(() => resolveProjectPathLexically("src/\0outside", projectDir)).toThrow(/NUL/i);
    expect(() => resolveProjectPathLexically("../outside", projectDir)).toThrow(/inside/i);
    expect(() => resolveProjectPathLexically("src/../../outside", projectDir)).toThrow(/inside/i);
  });

  it("rejects the project root", () => {
    expect(() => resolveProjectPathLexically(".", projectDir)).toThrow(/root/i);
    expect(() => resolveProjectPathLexically("src/..", projectDir)).toThrow(/root/i);
  });

  it("accepts nested project-relative paths", async () => {
    const destination = resolveProjectPathLexically("src/components/starwind/button", projectDir);

    expect(destination).toBe(join(projectDir, "src", "components", "starwind", "button"));
    await expect(
      resolveProjectMutationPath("src/components/starwind/button", { projectRoot: projectDir }),
    ).resolves.toBe(destination);
  });

  it("accepts a non-dot segment whose name starts with two dots", () => {
    expect(resolveProjectPathLexically("..button", projectDir)).toBe(join(projectDir, "..button"));
    expect(assertSafePathSegment("..button", "component name")).toBe("..button");
  });

  it.each(["", ".", "..", "button/menu", "button\\menu", "/button", "C:\\button"])(
    "rejects unsafe single-segment name %s",
    (name) => {
      expect(() => assertSafePathSegment(name, "component name")).toThrow(/component name/i);
    },
  );

  it("accepts a non-dot single-segment name", () => {
    expect(assertSafePathSegment("input-group", "component name")).toBe("input-group");
  });

  it("resolves the real project root and accepts existing internal directories", async () => {
    const internalDir = join(projectDir, "src", "components");
    await mkdir(internalDir, { recursive: true });

    await expect(
      resolveProjectMutationPath("src/components", { projectRoot: projectDir }),
    ).resolves.toBe(await realpath(internalDir));
    await expect(
      resolveProjectMutationPath("src/components/button/index.ts", { projectRoot: projectDir }),
    ).resolves.toBe(join(await realpath(projectDir), "src", "components", "button", "index.ts"));
  });

  it("rejects a nearest existing ancestor that resolves outside the project", async ({ skip }) => {
    const linkedDir = join(projectDir, "linked");
    const linkError = await createDirectoryLink(externalDir, linkedDir);
    if (linkError) skip(`Windows junction creation failed with EPERM: ${linkError.message}`);

    await expect(
      resolveProjectMutationPath("linked/component/index.ts", { projectRoot: projectDir }),
    ).rejects.toThrow(/outside/i);
  });

  it("rejects an existing final destination link", async ({ skip }) => {
    const externalFile = join(externalDir, "outside.txt");
    const linkedFile = join(projectDir, "linked.txt");
    await writeFile(externalFile, "outside", "utf-8");

    try {
      await symlink(externalFile, linkedFile, "file");
    } catch (error) {
      if (
        process.platform === "win32" &&
        error instanceof Error &&
        "code" in error &&
        error.code === "EPERM"
      ) {
        skip(`Windows file symlink creation failed with EPERM: ${error.message}`);
      }

      throw error;
    }

    await expect(
      resolveProjectMutationPath("linked.txt", { projectRoot: projectDir }),
    ).rejects.toThrow(/symbolic link|junction/i);
  });

  it("rejects the project root for recursive removal", async () => {
    await expect(
      resolveProjectMutationPath(".", { projectRoot: projectDir, recursive: true }),
    ).rejects.toThrow(/root/i);
  });
});
