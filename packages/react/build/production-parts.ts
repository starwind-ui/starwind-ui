import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/**
 * Two published-package changes to generated Primitive source. Generated source stays as it is,
 * because the CLI copies it into projects whose TypeScript setup may have no `process` global, and
 * each copied part stays self-contained.
 *
 * 1. A `Component.displayName = "..."` statement goes behind a development check. Bundlers replace
 *    `process.env.NODE_ENV` and remove the statement from a production build.
 * 2. A part that only renders one element with fixed attributes, a ref, and consumer props calls a
 *    shared factory. A part with any other shape stays as written.
 */

/**
 * Select and Combobox find their ItemText child by comparing `displayName`. These two names drive
 * behavior, so they stay in production builds.
 */
export const BEHAVIORAL_DISPLAY_NAMES = new Set(["Combobox.ItemText", "Select.ItemText"]);

const DISPLAY_NAME_STATEMENT = /^(\w+\.displayName = "([^"\n]*)";)$/gm;

const PASSIVE_PART =
  /const (\w+) = React\.forwardRef<[^<>]+,\s*\w+>\(\s*function \w+\(props, forwardedRef\) \{\s*return \(?\s*<([a-z][a-z0-9]*)((?:\s+[\w-]+(?:="[^"&{}]*")?)*)\s+ref=\{forwardedRef\}\s+\{\.\.\.props\}\s*\/>\s*\)?;?\s*\},?\s*\);/;

const JSX_ATTRIBUTE = /([\w-]+)(?:="([^"]*)")?/g;

const REACT_IMPORT = 'import * as React from "react";';

export function guardDisplayNames(source: string): string {
  return source.replace(DISPLAY_NAME_STATEMENT, (statement, _body, name: string) =>
    BEHAVIORAL_DISPLAY_NAMES.has(name)
      ? statement
      : `if (process.env.NODE_ENV !== "production") ${statement}`,
  );
}

export function applyPassivePartFactory(source: string, factoryPath: string): string {
  const match = source.match(PASSIVE_PART);
  if (!match || !source.includes(REACT_IMPORT)) return source;
  const [part, name, tag, attributes] = match;
  const props = [...attributes.matchAll(JSX_ATTRIBUTE)]
    .map(
      ([, key, value]) =>
        `${JSON.stringify(key)}: ${value === undefined ? "true" : JSON.stringify(value)}`,
    )
    .join(", ");
  const call = `const ${name} = /* @__PURE__ */ createPassivePart(${JSON.stringify(tag)}, { ${props} });`;
  // The import goes after the `"use client"` directive, which must stay first in the file.
  return source
    .replace(part, () => call)
    .replace(
      REACT_IMPORT,
      () => `import { createPassivePart } from ${JSON.stringify(factoryPath)};\n${REACT_IMPORT}`,
    );
}

export function toProductionPart(source: string, factoryPath: string): string {
  return guardDisplayNames(applyPassivePartFactory(source, factoryPath)).replace(
    /= React\.(forwardRef|createContext)\b/g,
    "= /* @__PURE__ */ React.$1",
  );
}

type PluginBuild = {
  onLoad(
    options: { filter: RegExp },
    callback: (args: { path: string }) => Promise<{ contents: string; loader: "tsx" }>,
  ): void;
};

export function productionPartsPlugin() {
  const factoryPath = fileURLToPath(new URL("./passive-part.tsx", import.meta.url));
  return {
    name: "starwind-production-parts",
    setup(build: PluginBuild) {
      build.onLoad({ filter: /[\\/]src[\\/].*\.tsx$/ }, async (args) => ({
        contents: toProductionPart(await readFile(args.path, "utf8"), factoryPath),
        loader: "tsx",
      }));
    },
  };
}
