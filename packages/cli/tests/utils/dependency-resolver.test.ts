import { beforeEach, describe, expect, it, vi } from "vitest";
import { filterUninstalledDependencies } from "../../src/utils/dependency-resolver.js";
import * as fs from "../../src/utils/fs.js";

vi.mock("../../src/utils/fs.js");

const mockReadJsonFile = vi.mocked(fs.readJsonFile);

describe("dependency resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("filterUninstalledDependencies", () => {
    it("returns dependencies missing from package.json", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          react: "^18.2.0",
        },
      });

      const result = await filterUninstalledDependencies(["react@^18.0.0", "zod@^3.0.0"]);

      expect(result).toEqual(["zod@^3.0.0"]);
    });

    it("handles scoped packages by splitting on the last @", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          "@starwind-ui/react": "^1.2.0",
        },
      });

      const result = await filterUninstalledDependencies([
        "@starwind-ui/react@^1.0.0",
        "@tabler/icons-react@^3.0.0",
      ]);

      expect(result).toEqual(["@tabler/icons-react@^3.0.0"]);
    });

    it("requires install when the installed version does not satisfy the range", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          "@starwind-ui/react": "^1.0.0",
        },
      });

      const result = await filterUninstalledDependencies(["@starwind-ui/react@^2.0.0"]);

      expect(result).toEqual(["@starwind-ui/react@^2.0.0"]);
    });

    it("replaces a range when the requirement is an exact version", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          "@starwind-ui/runtime": "^1.4.0",
          "@starwind-ui/vue": "0.3.0",
        },
        devDependencies: {
          "@starwind-ui/svelte": "~0.2.0",
        },
      });

      const result = await filterUninstalledDependencies([
        "@starwind-ui/runtime@1.4.0",
        "@starwind-ui/vue@0.3.0",
        "@starwind-ui/svelte@0.2.0",
      ]);

      expect(result).toEqual(["@starwind-ui/runtime@1.4.0", "@starwind-ui/svelte@0.2.0"]);
    });

    it("keeps an exact entry that satisfies a range requirement", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: { "@starwind-ui/runtime": "1.4.0" },
      });

      const result = await filterUninstalledDependencies(["@starwind-ui/runtime@^1.4.0"]);

      expect(result).toEqual([]);
    });

    it("treats local and workspace dependency specs as installed", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          "@starwind-ui/astro": "link:../../packages/astro",
          "@starwind-ui/runtime": "workspace:*",
          "local-package": "file:../local-package",
        },
      });

      const result = await filterUninstalledDependencies([
        "@starwind-ui/astro@^0.1.0-beta.1",
        "@starwind-ui/runtime@^0.1.0-beta.1",
        "local-package@^1.0.0",
        "zod@^3.0.0",
      ]);

      expect(result).toEqual(["zod@^3.0.0"]);
    });

    it("resolves Vue adapter and peer requirements from normal and local package specs", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          "@starwind-ui/vue": "workspace:*",
          vue: "^3.5.13",
          "tailwind-variants": "^1.0.0",
        },
      });

      const result = await filterUninstalledDependencies([
        "@starwind-ui/vue@*",
        "vue@>=3.5",
        "tailwind-variants@^1.0.0",
        "lucide-vue-next@^0.468.0",
      ]);

      expect(result).toEqual(["lucide-vue-next@^0.468.0"]);
    });

    it("treats missing package.json as requiring all requested dependencies", async () => {
      mockReadJsonFile.mockRejectedValue(new Error("missing"));

      const result = await filterUninstalledDependencies(["@starwind-ui/astro@^1.0.0"]);

      expect(result).toEqual(["@starwind-ui/astro@^1.0.0"]);
    });
  });
});
