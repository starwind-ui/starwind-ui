import * as p from "@clack/prompts";

import { highlighter } from "@/utils/highlighter.js";
import { loadRegistry, parseRegistrySource } from "@/utils/registry.js";

interface DocsOptions {
  json?: boolean;
  registry?: string;
}

const DOCS_BASE_URL = "https://starwind.dev/docs/components";

/**
 * Print documentation URLs for one or more Starwind components.
 *
 * @param components - Component names to look up.
 * @param options - CLI options (e.g. `--json`).
 */
export async function docs(components: string[], options?: DocsOptions) {
  if (!options?.json) {
    p.intro(highlighter.title(" Starwind Docs "));
  }

  try {
    const registrySource = parseRegistrySource(options?.registry) ?? { type: "bundled" as const };
    const registry = await loadRegistry(registrySource);
    const results: { component: string; url: string }[] = [];

    for (const name of components) {
      const exists = registry.components.find((c) => c.name === name);
      if (!exists) {
        p.log.error(`Component ${highlighter.info(name)} not found in the Starwind registry.`);
        process.exit(1);
      }
      results.push({ component: name, url: `${DOCS_BASE_URL}/${name}/` });
    }

    if (options?.json) {
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    const maxNameLength = Math.max(...results.map((r) => r.component.length));

    p.log.message(highlighter.underline("Documentation links"));
    for (const { component, url } of results) {
      p.log.info(`  ${highlighter.info(component.padEnd(maxNameLength + 2))}${url}`);
    }

    p.outro(`Found docs for ${results.length} component${results.length === 1 ? "" : "s"}`);
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : "Failed to fetch documentation");
    p.cancel("Operation cancelled");
    process.exit(1);
  }
}
