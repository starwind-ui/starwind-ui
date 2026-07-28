import path from "node:path";

export interface SourceAlias {
  find: string | RegExp;
  replacement: string;
}

export function createSourceBackedRuntimeAliases(repoRoot: string): SourceAlias[] {
  const runtimeSourceRoot = path.join(repoRoot, "packages/runtime/src");

  return [
    {
      find: /^@starwind-ui\/runtime$/,
      replacement: path.join(runtimeSourceRoot, "index.ts"),
    },
    {
      find: /^@starwind-ui\/runtime\/init-starwind$/,
      replacement: path.join(runtimeSourceRoot, "init-starwind.ts"),
    },
    {
      find: /^@starwind-ui\/runtime\/theme$/,
      replacement: path.join(runtimeSourceRoot, "theme/theme.ts"),
    },
    {
      find: /^@starwind-ui\/runtime\/([^/]+)$/,
      replacement: path.join(runtimeSourceRoot, "components/$1/index.ts"),
    },
  ];
}
