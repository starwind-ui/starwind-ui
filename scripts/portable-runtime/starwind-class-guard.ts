import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const STARWIND_TOKEN_PATTERN = /\bstarwind-[a-z0-9][a-z0-9-]*/g;
const STARWIND_CSS_CLASS_SELECTOR_PATTERN = /\.starwind-[a-z0-9][a-z0-9-]*/g;

const ALLOWED_NON_CLASS_TOKENS = new Set([
  "starwind-sidebar-open",
  "starwind-theme",
  "starwind-ui",
]);
const ALLOWED_CUSTOM_EVENTS = new Set(["starwind-toggle:change"]);

export interface StarwindClassHookFinding {
  context: string;
  file: string;
  token: string;
}

export async function assertNoStarwindClassHooksInStyledContracts(): Promise<void> {
  const contractsRoot = path.join(
    process.cwd(),
    "scripts/portable-runtime/contracts/styled/components",
  );
  await assertNoStarwindClassHooksInTree(contractsRoot);
}

export async function assertNoStarwindClassHooksInTree(root: string): Promise<void> {
  const findings: StarwindClassHookFinding[] = [];
  const tree = await readSourceTree(root);

  for (const [relativePath, source] of Object.entries(tree)) {
    findings.push(...findStarwindClassHooksInSource(relativePath, source));
  }

  assertNoFindings(findings);
}

export function assertNoStarwindClassHooksInSource(file: string, source: string): void {
  assertNoFindings(findStarwindClassHooksInSource(file, source));
}

export function findStarwindClassHooksInSource(
  file: string,
  source: string,
): StarwindClassHookFinding[] {
  if (file.endsWith(".css")) {
    return [...source.matchAll(STARWIND_CSS_CLASS_SELECTOR_PATTERN)].map((match) => ({
      context: getContext(source, match.index ?? 0),
      file,
      token: match[0],
    }));
  }

  return [...source.matchAll(STARWIND_TOKEN_PATTERN)]
    .filter((match) => !isAllowedNonClassToken(source, match.index ?? 0, match[0]))
    .map((match) => ({
      context: getContext(source, match.index ?? 0),
      file,
      token: match[0],
    }));
}

function assertNoFindings(findings: StarwindClassHookFinding[]): void {
  if (findings.length === 0) {
    return;
  }

  const summary = findings
    .slice(0, 10)
    .map(({ context, file, token }) => `- ${file}: ${token} in ${JSON.stringify(context)}`)
    .join("\n");
  const suffix =
    findings.length > 10 ? `\n...and ${findings.length - 10} more Starwind class hook(s).` : "";

  throw new Error(
    `Runtime generated output must use data-sw-* or data-slot instead of starwind-* class hooks:\n${summary}${suffix}`,
  );
}

function isAllowedNonClassToken(source: string, index: number, token: string): boolean {
  if (ALLOWED_NON_CLASS_TOKENS.has(token)) {
    return true;
  }

  const prefix = source.slice(Math.max(0, index - 8), index);
  const eventSuffix = source.slice(index + token.length).match(/^:[a-z0-9-]+/)?.[0] ?? "";

  return (
    ALLOWED_CUSTOM_EVENTS.has(`${token}${eventSuffix}`) ||
    prefix.endsWith("@") ||
    prefix.endsWith("data-") ||
    prefix.endsWith("--") ||
    prefix.endsWith("data-sw-")
  );
}

function getContext(source: string, index: number): string {
  const start = Math.max(0, index - 48);
  const end = Math.min(source.length, index + 72);
  return source.slice(start, end).replace(/\s+/g, " ").trim();
}

async function readSourceTree(dir: string, root: string = dir): Promise<Record<string, string>> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (entry) => {
        const entryPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          return readSourceTree(entryPath, root);
        }

        if (!/\.(astro|css|ts|tsx)$/.test(entry.name)) {
          return {};
        }

        const relativePath = path.relative(root, entryPath).split(path.sep).join("/");
        return { [relativePath]: await readFile(entryPath, "utf8") };
      }),
  );

  return Object.assign({}, ...files);
}
