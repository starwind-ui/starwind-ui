import * as p from "@clack/prompts";

import { PATHS } from "@/utils/constants.js";
import { highlighter } from "@/utils/highlighter.js";
import {
  getPrimitiveDiscoveryResults,
  getPrimitiveInstallCommand,
  resolvePrimitiveDiscoveryFramework,
  toPrimitiveDiscoveryMetadata,
  type PrimitiveDiscoveryFramework,
} from "@/utils/primitive-discovery.js";
import type { PrimitiveVendoringArtifact } from "@/utils/primitive-component.js";
import { type ManifestBlock, searchProBlocks } from "@/utils/pro-manifest.js";
import { type Component, loadRegistry, parseRegistrySource } from "@/utils/registry.js";
import { hasStarwindProRegistry } from "@/utils/shadcn-config.js";

interface SearchOptions {
  plan?: "free" | "pro";
  category?: string;
  limit?: number;
  offset?: number;
  json?: boolean;
  registry?: string;
  primitives?: boolean;
  framework?: PrimitiveDiscoveryFramework;
}

/**
 * Search Starwind components and Pro blocks.
 *
 * @param query - Optional search query string.
 * @param options - CLI options.
 */
export async function search(query?: string, options?: SearchOptions) {
  if (!options?.json) {
    p.intro(highlighter.title(" Starwind Search "));
  }

  try {
    if (options?.primitives) {
      await searchPrimitives(query, options);
      return;
    }

    // Category / plan filters imply a Pro-only search
    const proOnly = !!(options?.category || options?.plan);
    const registrySource = parseRegistrySource(options?.registry) ?? { type: "bundled" as const };

    let proBlocks: ManifestBlock[] = [];
    let matchedComponents: Component[] = [];

    if (options?.json) {
      proBlocks = await searchProBlocks({
        query,
        category: options?.category,
        plan: options?.plan,
        limit: options?.limit ?? 20,
        offset: options?.offset ?? 0,
      });

      if (!proOnly) {
        const coreComponents = (await loadRegistry(registrySource)).components;
        if (query) {
          const q = query.toLowerCase();
          matchedComponents = coreComponents.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              (c.dependencies ?? []).some((dep) => dep.toLowerCase().includes(q)),
          );
        } else {
          matchedComponents = coreComponents;
        }
      }
    } else {
      const searchTasks: { title: string; task: () => Promise<string> }[] = [
        {
          title: "Searching Starwind Pro blocks",
          task: async () => {
            proBlocks = await searchProBlocks({
              query,
              category: options?.category,
              plan: options?.plan,
              limit: options?.limit ?? 20,
              offset: options?.offset ?? 0,
            });
            return `Found ${proBlocks.length} Pro block${proBlocks.length === 1 ? "" : "s"}`;
          },
        },
      ];

      if (!proOnly) {
        searchTasks.push({
          title: "Searching core components",
          task: async () => {
            const coreComponents = (await loadRegistry(registrySource)).components;
            if (query) {
              const q = query.toLowerCase();
              matchedComponents = coreComponents.filter(
                (c) =>
                  c.name.toLowerCase().includes(q) ||
                  (c.dependencies ?? []).some((dep) => dep.toLowerCase().includes(q)),
              );
            } else {
              matchedComponents = coreComponents;
            }
            return `Found ${matchedComponents.length} core component${matchedComponents.length === 1 ? "" : "s"}`;
          },
        });
      }

      await p.tasks(searchTasks);
    }

    if (options?.json) {
      console.log(
        JSON.stringify(
          {
            query: query || null,
            filters: {
              category: options?.category || null,
              plan: options?.plan || null,
              limit: options?.limit ?? 20,
            },
            proBlocks: {
              total: proBlocks.length,
              results: proBlocks.map((b) => ({
                id: b.id,
                name: b.name,
                description: b.description,
                categories: b.categories,
                plan: b.plan,
                installCommand: b.installCommand + " --yes",
              })),
            },
            coreComponents: {
              total: matchedComponents.length,
              results: matchedComponents.map((c) => ({
                name: c.name,
                version: c.version,
                dependencies: c.dependencies,
                frameworkTargets: Object.keys(c.targets ?? {}),
                docsUrl: `${PATHS.STARWIND_DOCS_BASE_URL}/${c.name}/`,
              })),
            },
            proSetupTip: "Run `starwind setup` to enable Starwind Pro blocks",
          },
          null,
          2,
        ),
      );
      return;
    }

    const hasPro = proBlocks.length > 0;
    const hasCore = matchedComponents.length > 0;

    if (!hasPro && !hasCore) {
      p.log.warn("No results found for your search.");
      p.outro("Try a different query or browse all categories.");
      return;
    }

    if (hasPro) {
      p.log.message(highlighter.underline("Pro Blocks"));

      const maxNameLen = Math.max(...proBlocks.map((b) => b.name.length));

      for (const block of proBlocks) {
        const planBadge =
          block.plan === "pro" ? highlighter.info("[pro] ") : highlighter.success("[free]");
        const paddedName = block.name.padEnd(maxNameLen + 2);
        p.log.info(`  ${highlighter.info(paddedName)}${planBadge} ${block.installCommand}`);
      }

      console.log();
    }

    if (hasCore) {
      p.log.message(highlighter.underline("Core Components"));

      const maxNameLen = Math.max(...matchedComponents.map((c) => c.name.length));

      for (const comp of matchedComponents) {
        const paddedName = comp.name.padEnd(maxNameLen + 2);
        p.log.info(`  ${highlighter.info(paddedName)}starwind add ${comp.name}`);
      }

      console.log();
    }

    // Conditional Pro nudge
    if (proBlocks.length > 0) {
      const proConfigured = await hasStarwindProRegistry();
      const hasPaidBlocks = proBlocks.some((b) => b.plan === "pro");

      if (!proConfigured) {
        p.note(
          `Pro blocks require Starwind Pro setup.\nRun ${highlighter.info("starwind setup")} to configure.`,
          "Pro Tip",
        );
      } else if (hasPaidBlocks) {
        p.note(
          `Unlock premium blocks at ${highlighter.info("https://pro.starwind.dev/")}`,
          "Pro Tip",
        );
      }
    }

    p.outro(
      `Found ${proBlocks.length + matchedComponents.length} result${proBlocks.length + matchedComponents.length === 1 ? "" : "s"} 🔎`,
    );
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : "Failed to search");
    p.cancel("Operation cancelled");
    process.exit(1);
  }
}

async function searchPrimitives(query: string | undefined, options: SearchOptions): Promise<void> {
  const framework = await resolvePrimitiveDiscoveryFramework(options.framework);
  let matchedPrimitives: PrimitiveVendoringArtifact[] = [];

  if (!framework) {
    if (options.json) {
      console.log(
        JSON.stringify(
          {
            query: query || null,
            filters: {
              framework: null,
            },
            primitives: {
              total: 0,
              results: [],
            },
            warning: "Primitive source discovery supports Astro and React Runtime projects only.",
          },
          null,
          2,
        ),
      );
      return;
    }

    p.log.warn("Primitive source discovery supports Astro and React Runtime projects only.");
    p.outro("Run `starwind migrate` before adding primitive source.");
    return;
  }

  if (options.json) {
    matchedPrimitives = getPrimitiveDiscoveryResults({ framework, query });
  } else {
    await p.tasks([
      {
        title: "Searching primitive source",
        task: async () => {
          matchedPrimitives = getPrimitiveDiscoveryResults({ framework, query });
          return `Found ${matchedPrimitives.length} ${framework} primitive${matchedPrimitives.length === 1 ? "" : "s"}`;
        },
      },
    ]);
  }

  if (options.json) {
    const includeFrameworkFlag = options.framework !== undefined;
    console.log(
      JSON.stringify(
        {
          query: query || null,
          filters: {
            framework,
          },
          primitives: {
            total: matchedPrimitives.length,
            results: matchedPrimitives.map((primitive) =>
              toPrimitiveDiscoveryMetadata(primitive, {
                includeFrameworkFlag,
              }),
            ),
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  if (matchedPrimitives.length === 0) {
    p.log.warn("No primitives found for your search.");
    p.outro("Try a different query or framework.");
    return;
  }

  p.log.message(highlighter.underline(`${formatFrameworkLabel(framework)} Primitives`));

  const maxNameLen = Math.max(...matchedPrimitives.map((primitive) => primitive.component.length));
  const includeFrameworkFlag = options.framework !== undefined;

  for (const primitive of matchedPrimitives) {
    const paddedName = primitive.component.padEnd(maxNameLen + 2);
    const frameworkBadge =
      framework === "all" ? `${highlighter.info(`[${primitive.framework}] `)}` : "";
    p.log.info(
      `  ${frameworkBadge}${highlighter.info(paddedName)}${getPrimitiveInstallCommand(
        primitive.component,
        includeFrameworkFlag ? primitive.framework : undefined,
      )}`,
    );
  }

  console.log();
  p.outro(
    `Found ${matchedPrimitives.length} primitive${matchedPrimitives.length === 1 ? "" : "s"}`,
  );
}

function formatFrameworkLabel(framework: PrimitiveDiscoveryFramework): string {
  if (framework === "all") return "All";
  return framework === "react" ? "React" : "Astro";
}
