import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { format, resolveConfig } from "prettier";
import { compile } from "svelte/compiler";

import type {
  FrameworkAdapterTargetStyledProjectArgs,
  FrameworkAdapterTargetStyledWriteArgs,
} from "../../types.js";
import { getRelativeImportPath } from "../../../shared.js";
import {
  projectStyledOutputModel,
  type StyledOutputModel,
} from "../../../styled-output-model/index.js";
import { getImplementedSvelteStyledRoots } from "../inventory.js";
import { projectSvelteStyledGroup } from "./projection.js";
import { renderSvelteStyledFiles } from "./render.js";
import { selectSvelteStyledContracts, supportsSvelteScope } from "./scope.js";
import type { SvelteStyledFile } from "./types.js";

function resolveSvelteStyledRoots(
  args: FrameworkAdapterTargetStyledProjectArgs,
): readonly string[] {
  if (args.roots) return args.roots;
  const implemented = new Set(getImplementedSvelteStyledRoots());
  return args.contracts
    .filter(
      (contract) => implemented.has(contract.component) && supportsSvelteScope(contract.frameworks),
    )
    .map((contract) => contract.component);
}

export function projectSvelteStyledOutput(
  args: FrameworkAdapterTargetStyledProjectArgs,
): StyledOutputModel {
  const model = projectStyledOutputModel(
    selectSvelteStyledContracts(args.contracts, resolveSvelteStyledRoots(args)),
  );
  prepareFiles(model, args);
  return model;
}

function prepareFiles(
  model: StyledOutputModel,
  args: FrameworkAdapterTargetStyledProjectArgs,
): SvelteStyledFile[] {
  const files = model.componentGroups.flatMap((group) =>
    renderSvelteStyledFiles(
      projectSvelteStyledGroup(group, {
        primitiveImportBase:
          args.primitiveImportBase ??
          getRelativeImportPath(
            path.join(args.outputRoot, group.component),
            args.primitiveOutputRoot,
          ),
      }),
    ),
  );
  for (const group of model.componentGroups) {
    for (const alias of group.variantAliases ?? []) {
      const dependency = alias.source.split("/")[1];
      const source = model.componentGroups.find((entry) => entry.component === dependency);
      if (
        !source ||
        ![...source.variants, ...(source.variantAliases ?? [])].some(
          (recipe) => recipe.name === alias.importName,
        )
      ) {
        throw new TypeError(
          `Svelte Styled ${group.component}: missing variant alias recipe "${alias.source}/${alias.importName}".`,
        );
      }
    }
  }
  const paths = new Set<string>();
  for (const file of files) {
    if (
      paths.has(file.relativePath) ||
      file.relativePath.split("/").some((part) => part === ".." || part === ".") ||
      path.isAbsolute(file.relativePath)
    ) {
      throw new TypeError(`Svelte Styled output: unsafe or duplicate path "${file.relativePath}".`);
    }
    paths.add(file.relativePath);
    if (file.relativePath.endsWith(".svelte")) {
      for (const generate of ["client", "server"] as const) {
        try {
          const result = compile(file.content, { filename: file.relativePath, generate });
          if (result.warnings.length)
            throw new Error(result.warnings.map((warning) => warning.message).join("\n"));
        } catch (error) {
          throw new TypeError(`Svelte Styled ${file.relativePath}: ${String(error)}`);
        }
      }
    }
  }
  return files;
}

/** Validate and format the entire selection before replacing any generated group. */
export async function writeSvelteStyledOutput(
  args: FrameworkAdapterTargetStyledWriteArgs,
): Promise<void> {
  const model = projectStyledOutputModel(
    selectSvelteStyledContracts(args.contracts, resolveSvelteStyledRoots(args)),
  );
  const files = prepareFiles(model, args);
  const prettier = (await resolveConfig(path.join(process.cwd(), "prettier.config.mjs"))) ?? {};
  const formatted = await Promise.all(
    files.map(async (file) => {
      // Parse contract CSS before replacement while preserving its serialized content.
      if (file.relativePath.endsWith(".css"))
        await format(file.content, { ...prettier, parser: "css" });
      return {
        ...file,
        content: file.relativePath.endsWith(".ts")
          ? await format(file.content, { ...prettier, parser: "typescript" })
          : file.content,
      };
    }),
  );
  for (const group of model.componentGroups)
    await rm(path.join(args.outputRoot, group.component), { force: true, recursive: true });
  for (const file of formatted) {
    const destination = path.join(args.outputRoot, file.relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, file.content, "utf8");
  }
}
