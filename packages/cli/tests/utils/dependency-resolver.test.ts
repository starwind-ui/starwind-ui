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

    it("treats missing package.json as requiring all requested dependencies", async () => {
      mockReadJsonFile.mockRejectedValue(new Error("missing"));

      const result = await filterUninstalledDependencies(["@starwind-ui/astro@^1.0.0"]);

      expect(result).toEqual(["@starwind-ui/astro@^1.0.0"]);
    });
  });
});
