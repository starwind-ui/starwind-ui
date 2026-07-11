import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getProCategories,
  getProManifest,
  resetManifestCache,
  searchProBlocks,
} from "../../src/utils/pro-manifest.js";

const mockManifest = {
  $schema: "https://pro.starwind.dev/registry-schema.json",
  name: "starwind-pro",
  version: "1.0.0",
  generatedAt: "2024-01-01",
  baseUrl: "https://pro.starwind.dev",
  totalBlocks: 3,
  categories: ["hero", "footer", "pricing"],
  blocks: [
    {
      id: "hero-1",
      name: "Hero One",
      description: "A hero section",
      categories: ["hero"],
      keywords: ["hero", "landing"],
      plan: "free",
      installCommand: "starwind add @starwind-pro/hero-1",
      previewUrl: "/hero-1",
    },
    {
      id: "hero-pro",
      name: "Hero Pro",
      description: "A premium hero",
      categories: ["hero"],
      keywords: ["hero", "premium"],
      plan: "pro",
      installCommand: "starwind add @starwind-pro/hero-pro",
      previewUrl: "/hero-pro",
    },
    {
      id: "footer-1",
      name: "Footer One",
      description: "A footer block",
      categories: ["footer"],
      keywords: ["footer", "bottom"],
      plan: "free",
      installCommand: "starwind add @starwind-pro/footer-1",
      previewUrl: "/footer-1",
    },
  ],
};

describe("pro-manifest", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetManifestCache();
    fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async () => {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => mockManifest,
      } as Response;
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe("getProManifest", () => {
    it("fetches manifest from network when cache is empty", async () => {
      const { manifest, source } = await getProManifest();
      expect(source).toBe("network");
      expect(manifest.totalBlocks).toBe(3);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("returns cached manifest on second call", async () => {
      await getProManifest();
      const { source } = await getProManifest();
      expect(source).toBe("cache");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("throws on fetch failure", async () => {
      fetchSpy.mockImplementation(async () => {
        return {
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        } as Response;
      });
      await expect(getProManifest()).rejects.toThrow("Failed to fetch manifest");
    });

    it("throws on invalid manifest schema", async () => {
      fetchSpy.mockImplementation(async () => {
        return {
          ok: true,
          json: async () => ({ invalid: true }),
        } as Response;
      });
      await expect(getProManifest()).rejects.toThrow();
    });
  });

  describe("searchProBlocks", () => {
    it("returns all blocks when no filters given", async () => {
      const results = await searchProBlocks();
      expect(results).toHaveLength(3);
    });

    it("filters by category", async () => {
      const results = await searchProBlocks({ category: "hero" });
      expect(results).toHaveLength(2);
      expect(results.every((b) => b.categories.includes("hero"))).toBe(true);
    });

    it("filters by plan", async () => {
      const results = await searchProBlocks({ plan: "pro" });
      expect(results).toHaveLength(1);
      expect(results[0].plan).toBe("pro");
    });

    it("searches by query with scoring", async () => {
      const results = await searchProBlocks({ query: "hero" });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name.toLowerCase()).toContain("hero");
    });

    it("respects limit", async () => {
      const results = await searchProBlocks({ limit: 2 });
      expect(results).toHaveLength(2);
    });

    it("respects offset", async () => {
      const results = await searchProBlocks({ limit: 2, offset: 1 });
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe("hero-pro");
    });

    it("caps limit at 50", async () => {
      const results = await searchProBlocks({ limit: 100 });
      expect(results).toHaveLength(3); // manifest only has 3 blocks
    });

    it("returns empty for non-matching query", async () => {
      const results = await searchProBlocks({ query: "xyz-nonexistent" });
      expect(results).toHaveLength(0);
    });

    it("combines multiple filters", async () => {
      const results = await searchProBlocks({
        query: "hero",
        category: "hero",
        plan: "free",
      });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("hero-1");
    });
  });

  describe("getProCategories", () => {
    it("returns categories from manifest", async () => {
      const categories = await getProCategories();
      expect(categories).toEqual(["hero", "footer", "pricing"]);
    });
  });
});
