export const SVELTE_PRIMITIVE_COMPONENTS = [
  "button",
  "checkbox",
  "select",
  "accordion",
  "dialog",
  "slider",
] as const;

export type SveltePrimitiveComponent = (typeof SVELTE_PRIMITIVE_COMPONENTS)[number];

export type SveltePackageExportTarget = {
  default: `./dist/${string}.js`;
  svelte: `./dist/${string}.js`;
  types: `./dist/${string}.d.ts`;
};

function createPackageExportTarget(component?: string): SveltePackageExportTarget {
  const entry = component ? `${component}/index` : "index";
  return {
    types: `./dist/${entry}.d.ts`,
    svelte: `./dist/${entry}.js`,
    default: `./dist/${entry}.js`,
  };
}

export const sveltePackageExports = Object.fromEntries([
  [".", createPackageExportTarget()],
  ...SVELTE_PRIMITIVE_COMPONENTS.map((component) => [
    `./${component}`,
    createPackageExportTarget(component),
  ]),
]) as Record<string, SveltePackageExportTarget>;
