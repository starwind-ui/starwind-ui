import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { format, resolveConfig } from "prettier";
import { expect, it } from "vitest";

import { buttonRuntimeAdapterContract } from "../../contracts/primitive/representatives.js";
import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import {
  generateAstroPrimitiveWrappers,
  generateAstroWrappers,
  generateStarwindAstroWrappers,
} from "../../generate-astro-wrappers.js";

export type GetTempRoot = () => string;

export {
  buttonRuntimeAdapterContract,
  expect,
  generateAstroPrimitiveWrappers,
  generateAstroWrappers,
  generateStarwindAstroWrappers,
  it,
  mkdir,
  path,
  readdir,
  readFile,
  starwindStyledContracts,
  writeFile,
};

export async function readGeneratedFile(outputRoot: string, relativePath: string): Promise<string> {
  return readFile(path.join(outputRoot, relativePath), "utf8");
}

export async function readGeneratedTree(
  dir: string,
  root: string = dir,
): Promise<Record<string, string>> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (entry) => {
        const entryPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          return readGeneratedTree(entryPath, root);
        }

        const relativePath = path.relative(root, entryPath).split(path.sep).join("/");
        return { [relativePath]: await readFile(entryPath, "utf8") };
      }),
  );

  return Object.assign({}, ...files);
}

export async function readFormattedGeneratedTree(
  dir: string,
  root: string = dir,
): Promise<Record<string, string>> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (entry) => {
        const entryPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          return readFormattedGeneratedTree(entryPath, root);
        }

        const relativePath = path.relative(root, entryPath).split(path.sep).join("/");
        const contents = await readFile(entryPath, "utf8");
        const config =
          (await resolveConfig(entryPath)) ??
          (await resolveConfig(path.join(process.cwd(), "packages/astro/src", relativePath)));
        return { [relativePath]: await format(contents, { ...(config ?? {}), filepath: entryPath }) };
      }),
  );

  return Object.assign({}, ...files);
}

export function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function removedAttr(prefix: string, suffix: string): string {
  return `${prefix}-${suffix}`;
}

export function expectAttributeCount(
  source: string,
  attribute: string,
  expectedCount: number,
): void {
  expect(source.match(new RegExp(attribute, "g")) ?? []).toHaveLength(expectedCount);
}
