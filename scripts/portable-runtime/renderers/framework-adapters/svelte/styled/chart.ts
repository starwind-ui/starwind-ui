import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { supportsSvelteScope } from "./scope.js";
import type {
  SvelteStyledComponentProjection,
  SvelteStyledImport,
  SvelteStyledRenderOptions,
} from "./types.js";

/** Named snippets that each chart part reads. */
const chartSnippets: Record<string, { name: string; type: string }[]> = {
  ChartContainer: [{ name: "children", type: "" }],
  ChartTooltip: [{ name: "content", type: 'import("svelte").Snippet' }],
  ChartTooltipContent: [],
  ChartLegend: [{ name: "content", type: 'import("svelte").Snippet' }],
  ChartLegendContent: [],
};

/**
 * Chart parts forward their props to the chart Primitive. The Primitive owns tooltip
 * registration, tooltip rows and legend items, so this owner adds only Svelte types, imports and
 * the default tooltip snippet.
 */
export function specializeSvelteStyledChart(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  _options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup" | "templatePrelude"
> {
  const fail = (detail: string): never => {
    throw new TypeError(
      `Svelte Styled ${group.component}/${component.exportName}.svelte: ${detail}.`,
    );
  };
  const snippets = chartSnippets[component.exportName];
  if (!snippets) return fail("missing chart part owner");
  for (const entry of component.imports.filter((entry) => supportsSvelteScope(entry.targetScopes)))
    fail(`unsupported import "${entry.source}"`);
  component.imports = [];

  const types = (component.props?.extends ?? [])
    .filter((entry) => supportsSvelteScope(entry.targetScopes))
    .map((entry) => {
      if (entry.kind === "raw") return entry.code;
      if (entry.kind === "component-props" && entry.component === group.component)
        return `import("./${entry.exportName}.svelte").${entry.exportName}Props`;
      return fail(`unsupported prop inheritance "${entry.kind}"`);
    });
  const fields = [
    ...(component.props?.fields ?? [])
      .filter((field) => supportsSvelteScope(field.targetScopes))
      .map((field) => `  ${field.name}${field.optional ? "?" : ""}: ${field.type};`),
    ...snippets
      .filter((snippet) => snippet.type)
      .map((snippet) => `  ${snippet.name}?: ${snippet.type};`),
  ];
  if (fields.length) types.push(`{\n${fields.join("\n")}\n}`);
  // Type parameters need one props declaration with every type written inline.
  const publicTypes = `export type ${component.exportName}Props = ${types.length ? types.join(" & ") : "Record<never, never>"};`;

  const container = component.exportName === "ChartContainer";
  const imports: SvelteStyledImport[] = [
    ...(container
      ? [
          { source: "@tanstack/charts", names: ["ChartValue"], typeOnly: true },
          { source: "./ChartTooltipContent.svelte", names: ["default as ChartTooltipContent"] },
        ]
      : []),
    { source: "tailwind-variants", names: ["cx"] },
    {
      source: "./variants.js",
      names: [
        ...group.variants.map((variant) => variant.name),
        ...(group.variantAliases ?? []).map((alias) => alias.name),
      ],
    },
  ];
  return {
    imports,
    publicTypes,
    destructure: [
      ...(component.destructure?.props ?? []).filter((prop) =>
        supportsSvelteScope(prop.targetScopes),
      ),
      ...snippets.map((snippet) => ({ name: snippet.name })),
    ],
    ...(component.destructure?.rest ? { rest: component.destructure.rest } : {}),
    setup: [],
    // The container's default tooltip body.
    ...(container
      ? { templatePrelude: "{#snippet defaultTooltip()}<ChartTooltipContent />{/snippet}" }
      : {}),
  };
}
