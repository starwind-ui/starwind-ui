export const codeFence = (code: string, language: string) =>
  "```" + language + "\n" + code.trimEnd() + "\n```";

export const inlineCode = (value: string) =>
  value.includes("`") ? "`` " + value + " ``" : "`" + value + "`";

const escapeCell = (value: string) => value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");

export const table = (headers: readonly string[], rows: readonly (readonly string[])[]) => {
  if (rows.length === 0) return undefined;
  return [
    `| ${headers.map(escapeCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((cell) => escapeCell(cell || "-")).join(" | ")} |`),
  ].join("\n");
};

export const section = (heading: string, ...blocks: readonly (string | undefined)[]) => {
  const body = blocks.filter((block): block is string => Boolean(block && block.trim()));
  return body.length === 0 ? undefined : [heading, ...body].join("\n\n");
};

export const bulletList = (items: readonly string[]) =>
  items.length === 0 ? undefined : items.map((item) => `- ${item}`).join("\n");

export const joinBlocks = (blocks: readonly (string | undefined)[]) =>
  blocks.filter((block): block is string => Boolean(block && block.trim())).join("\n\n") + "\n";

export const pascalCase = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment[0]!.toUpperCase() + segment.slice(1))
    .join("");

export const kebabCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/:/g, "-")
    .toLowerCase();

/** Shared page header. Every page names the package and its exact version. */
export const pageHeader = ({
  title,
  introduction,
  packageName,
  version,
  status,
}: {
  readonly title: string;
  readonly introduction?: string;
  readonly packageName: string;
  readonly version: string;
  readonly status: string;
}) =>
  [
    `# ${title}`,
    introduction,
    [`- Package: ${inlineCode(packageName)}`, `- Version: ${version}`, `- Status: ${status}`].join(
      "\n",
    ),
  ]
    .filter(Boolean)
    .join("\n\n");
