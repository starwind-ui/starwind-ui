import * as p from "@clack/prompts";

import {
  type FrameworkTargetPolicy,
  type PrivateVueCliFrameworkTarget,
} from "@/utils/framework-target-policy.js";
import { highlighter } from "@/utils/highlighter.js";
import { loadRegistry, parseRegistrySource, type StarwindRegistryFor } from "@/utils/registry.js";

interface DocsOptions {
  json?: boolean;
  registry?: string;
}

export type PrivateVueDocsDependencies = {
  registry: StarwindRegistryFor<PrivateVueCliFrameworkTarget>;
  targetPolicy: FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>;
};

const DOCS_BASE_URL = "https://starwind.dev/docs/components";

/**
 * Print documentation URLs for one or more Starwind components.
 *
 * @param components - Component names to look up.
 * @param options - CLI options (e.g. `--json`).
 */
export function docs(components: string[], options?: DocsOptions): Promise<void>;
export function docs(
  components: string[],
  options: DocsOptions | undefined,
  dependencies: PrivateVueDocsDependencies,
): Promise<void>;
export async function docs(
  components: string[],
  options?: DocsOptions,
  dependencies?: PrivateVueDocsDependencies,
): Promise<void> {
  if (!options?.json) {
    p.intro(highlighter.title(" Starwind Docs "));
  }

  try {
    const explicitRegistrySource = parseRegistrySource(options?.registry);
    const registrySource = explicitRegistrySource ?? { type: "bundled" as const };
    const registry = dependencies
      ? explicitRegistrySource
        ? await loadRegistry(registrySource, { targetPolicy: dependencies.targetPolicy })
        : dependencies.registry
      : await loadRegistry(registrySource);
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
