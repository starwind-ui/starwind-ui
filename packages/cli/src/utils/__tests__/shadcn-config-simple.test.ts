import { describe, expect, it } from "vitest";

import {
  addStarwindProRegistry,
  createDefaultShadcnConfig,
  type ShadcnConfig,
} from "../shadcn-config.js";

describe("shadcn-config core functionality", () => {
  describe("createDefaultShadcnConfig", () => {
    it("should create config with Starwind Pro registry", () => {
      const config = createDefaultShadcnConfig("src/styles/starwind.css", "neutral");

      expect(config).toMatchObject({
        $schema: "https://ui.shadcn.com/schema.json",
        registries: {
          "@starwind-pro": {
            url: "http://localhost:4321/r/{name}",
            headers: {
              Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
            },
          },
        },
        aliases: {
          components: "@/components",
          utils: "@/lib/utils",
        },
        tailwind: {
          config: "",
          css: "src/styles/starwind.css",
          baseColor: "neutral",
          cssVariables: true,
        },
        style: "default",
        rsc: true,
      });
    });

    it("should use default base color", () => {
      const config = createDefaultShadcnConfig("src/styles/starwind.css");
      expect(config.tailwind?.baseColor).toBe("neutral");
    });
  });

  describe("addStarwindProRegistry", () => {
    it("should add Starwind Pro registry to existing config", () => {
      const existingConfig: ShadcnConfig = {
        $schema: "https://ui.shadcn.com/schema.json",
        aliases: { components: "@/components" },
      };

      const result = addStarwindProRegistry(existingConfig);

      expect(result.registries).toEqual({
        "@starwind-pro": {
          url: "http://localhost:4321/r/{name}",
          headers: {
            Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
          },
        },
      });
      expect(result.aliases).toEqual({ components: "@/components" });
    });

    it("should preserve existing registries", () => {
      const existingConfig: ShadcnConfig = {
        registries: {
          "@other-registry": {
            url: "https://example.com/registry",
          },
        },
      };

      const result = addStarwindProRegistry(existingConfig);

      expect(result.registries).toEqual({
        "@other-registry": {
          url: "https://example.com/registry",
        },
        "@starwind-pro": {
          url: "http://localhost:4321/r/{name}",
          headers: {
            Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
          },
        },
      });
    });

    it("should not mutate original config", () => {
      const existingConfig: ShadcnConfig = {
        aliases: { components: "@/components" },
      };

      const originalConfig = { ...existingConfig };
      const result = addStarwindProRegistry(existingConfig);

      expect(existingConfig).toEqual(originalConfig);
      expect(result).not.toBe(existingConfig);
    });
  });
});
