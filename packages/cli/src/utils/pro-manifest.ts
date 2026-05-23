import { z } from "zod";

/**
 * Pro manifest types and search utilities for Starwind Pro blocks.
 */

const manifestBlockSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  categories: z.array(z.string()),
  keywords: z.array(z.string()),
  plan: z.enum(["free", "pro"]),
  installCommand: z.string(),
  previewUrl: z.string(),
});

const manifestSchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  version: z.string(),
  generatedAt: z.string(),
  baseUrl: z.string(),
  totalBlocks: z.number(),
  categories: z.array(z.string()),
  blocks: z.array(manifestBlockSchema),
});

export type ManifestBlock = z.infer<typeof manifestBlockSchema>;
export type Manifest = z.infer<typeof manifestSchema>;

interface ManifestCache {
  data: Manifest;
  timestamp: number;
  expiresAt: number;
}

const MANIFEST_URL = "https://pro.starwind.dev/r/manifest.json";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let manifestCache: ManifestCache | null = null;

/**
 * Reset the manifest cache. Useful for testing.
 */
export function resetManifestCache(): void {
  manifestCache = null;
}

/**
 * Fetch the Pro manifest with caching.
 *
 * @returns The manifest and whether it came from cache or network.
 */
export async function getProManifest(): Promise<{
  manifest: Manifest;
  source: "cache" | "network";
}> {
  if (manifestCache && Date.now() < manifestCache.expiresAt) {
    return { manifest: manifestCache.data, source: "cache" };
  }

  try {
    const response = await fetch(MANIFEST_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
    }
    const raw = await response.json();
    const manifest = manifestSchema.parse(raw);

    manifestCache = {
      data: manifest,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return { manifest, source: "network" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Error fetching Starwind Pro manifest: ${message}`);
  }
}

export interface SearchProBlocksOptions {
  query?: string;
  category?: string;
  plan?: "free" | "pro";
  limit?: number;
  offset?: number;
}

/**
 * Score a block against a search query.
 */
function scoreBlockMatch(block: ManifestBlock, query: string): number {
  const q = query.toLowerCase();
  let score = 0;

  if (block.name.toLowerCase() === q) score += 100;
  else if (block.name.toLowerCase().includes(q)) score += 50;

  if (block.id.toLowerCase().includes(q)) score += 40;

  if (block.keywords.some((k) => k.toLowerCase() === q)) score += 30;
  if (block.keywords.some((k) => k.toLowerCase().includes(q))) score += 20;

  if (block.description.toLowerCase().includes(q)) score += 10;

  if (block.categories.some((c) => c.toLowerCase().includes(q))) score += 15;

  return score;
}

/**
 * Search Starwind Pro blocks with optional query, category, and plan filters.
 *
 * @param options - Search filters.
 * @returns Filtered and scored blocks.
 */
export async function searchProBlocks(
  options: SearchProBlocksOptions = {},
): Promise<ManifestBlock[]> {
  const { query, category, plan, limit = 50, offset = 0 } = options;
  const { manifest } = await getProManifest();

  let results = [...manifest.blocks];

  if (category) {
    const catLower = category.toLowerCase();
    results = results.filter((b) => b.categories.some((c) => c.toLowerCase() === catLower));
  }

  if (plan) {
    results = results.filter((b) => b.plan === plan);
  }

  if (query) {
    const scored = results
      .map((block) => ({ block, score: scoreBlockMatch(block, query) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);
    results = scored.map(({ block }) => block);
  }

  const effectiveLimit = Math.min(Math.max(1, limit), 50);
  const effectiveOffset = Math.max(0, offset);
  return results.slice(effectiveOffset, effectiveOffset + effectiveLimit);
}

/**
 * Get available categories from the Pro manifest.
 */
export async function getProCategories(): Promise<string[]> {
  const { manifest } = await getProManifest();
  return manifest.categories;
}
