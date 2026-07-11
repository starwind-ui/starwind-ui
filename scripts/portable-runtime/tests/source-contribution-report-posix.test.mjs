import { describe, expect, it, vi } from "vitest";

vi.mock("node:path", async (importOriginal) => {
  const nativePath = await importOriginal();

  return {
    ...nativePath,
    default: nativePath.posix,
  };
});

const { buildSourceContributionAnalyses } = await import("../source-contribution-report.mjs");

describe("source contribution report on POSIX hosts", () => {
  it("normalizes Windows-style absolute and relative metafile paths", () => {
    const repoRoot = "C:/repo/starwind-ui";
    const tmpRoot = "C:/tmp/starwind-package-size-comparison";
    const [analysis] = buildSourceContributionAnalyses({
      readFile: () => "// src/components/menu/menu.ts\nexport {};",
      repoRoot,
      results: [
        {
          label: "All-three overlap - Starwind",
          metafile: {
            outputs: {
              "out.js": {
                inputs: {
                  "..\\..\\repo\\starwind-ui\\packages\\runtime\\dist\\chunk-menu.js": {
                    bytesInOutput: 400,
                  },
                  "C:\\repo\\starwind-ui\\packages\\react\\dist\\chunk-adapter.js": {
                    bytesInOutput: 100,
                  },
                },
              },
            },
          },
          sourceContribution: { label: "All-three overlap - Starwind" },
        },
      ],
      tmpRoot,
    });

    expect(analysis.topStarwindContributors).toEqual([
      {
        bytes: 400,
        category: "Runtime",
        input: "packages/runtime/dist/chunk-menu.js",
        sourceOwner: "src/components/menu/menu.ts",
      },
      {
        bytes: 100,
        category: "React adapter",
        input: "packages/react/dist/chunk-adapter.js",
        sourceOwner: "src/components/menu/menu.ts",
      },
    ]);
  });
});
