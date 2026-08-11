import { readFile } from "node:fs/promises";

import type { Options } from "tsup";
import { describe, expect, it } from "vitest";

import tsupConfig from "../../tsup.config.js";

type PackageChecker = {
  INSTALLED_CLI_COMMAND: readonly string[];
  MAX_TARBALL_BYTES: number;
  MAX_UNPACKED_BYTES: number;
  validatePackMetadata: (packInfo: {
    tarballBytes: unknown;
    unpackedBytes: unknown;
    files: { path: string }[];
  }) => string[];
};

const packageCheckerUrl = new URL("../../scripts/check-package.mjs", import.meta.url).href;
const { INSTALLED_CLI_COMMAND, MAX_TARBALL_BYTES, MAX_UNPACKED_BYTES, validatePackMetadata } =
  (await import(packageCheckerUrl)) as PackageChecker;

describe("CLI package metadata", () => {
  it("does not ship the legacy core package as a production dependency", async () => {
    const packageJson = JSON.parse(
      await readFile(new URL("../../package.json", import.meta.url), "utf-8"),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };

    expect(packageJson.dependencies).not.toHaveProperty("@starwind-ui/core");
    expect(JSON.stringify(packageJson.scripts ?? {})).not.toContain("@starwind-ui/core");
  });

  it("keeps the Babel parser as a production dependency and exposes the package check", async () => {
    const packageJson = JSON.parse(
      await readFile(new URL("../../package.json", import.meta.url), "utf-8"),
    ) as {
      bin?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };

    expect(packageJson.dependencies?.["@babel/parser"]).toMatch(/^\^7\./);
    expect(packageJson.devDependencies).not.toHaveProperty("@babel/parser");
    expect(packageJson.bin?.starwind).toBe("./dist/index.js");
    expect(packageJson.scripts?.["package:check"]).toBe("node ./scripts/check-package.mjs");
    expect(INSTALLED_CLI_COMMAND).toEqual(["exec", "starwind", "--help"]);
  });

  it("minifies production builds with retained names and keeps watch builds readable", async () => {
    expect(typeof tsupConfig).toBe("function");
    const configure = tsupConfig as (options: Options) => Options | Promise<Options>;

    const production = await configure({ watch: false });
    const watch = await configure({ watch: true });

    expect(production).toMatchObject({
      keepNames: true,
      minify: true,
      sourcemap: false,
    });
    expect(watch).toMatchObject({
      keepNames: true,
      minify: false,
      sourcemap: true,
    });
  });

  it("rejects missing or invalid byte measurements", () => {
    const files = [{ path: "dist/index.js" }, { path: "dist/index.d.ts" }];

    for (const invalidMeasurement of [undefined, "1", Number.NaN, Infinity, -1, 1.5]) {
      expect(
        validatePackMetadata({ tarballBytes: invalidMeasurement, unpackedBytes: 0, files }),
      ).toContain("tarball bytes must be a finite nonnegative integer");
      expect(
        validatePackMetadata({ tarballBytes: 0, unpackedBytes: invalidMeasurement, files }),
      ).toContain("unpacked package bytes must be a finite nonnegative integer");
    }
  });

  it("enforces both package budgets and required artifact files", () => {
    expect(MAX_TARBALL_BYTES).toBe(460_800);
    expect(MAX_UNPACKED_BYTES).toBe(3_145_728);

    const files = [{ path: "dist/index.js" }, { path: "dist/index.d.ts" }];
    expect(
      validatePackMetadata({
        tarballBytes: MAX_TARBALL_BYTES + 1,
        unpackedBytes: MAX_UNPACKED_BYTES,
        files,
      }),
    ).toEqual(["tarball is 460801 bytes; limit is 460800 bytes"]);
    expect(
      validatePackMetadata({
        tarballBytes: MAX_TARBALL_BYTES,
        unpackedBytes: MAX_UNPACKED_BYTES + 1,
        files,
      }),
    ).toEqual(["unpacked package is 3145729 bytes; limit is 3145728 bytes"]);
    expect(
      validatePackMetadata({
        tarballBytes: MAX_TARBALL_BYTES,
        unpackedBytes: MAX_UNPACKED_BYTES,
        files: [{ path: "dist/index.js" }, { path: "dist/index.d.ts" }],
      }),
    ).toEqual([]);

    expect(
      validatePackMetadata({
        tarballBytes: MAX_TARBALL_BYTES + 1,
        unpackedBytes: MAX_UNPACKED_BYTES + 1,
        files: [
          { path: "dist/index.js" },
          { path: "dist/index.d.ts" },
          { path: "dist/index.js.map" },
        ],
      }),
    ).toEqual([
      "tarball is 460801 bytes; limit is 460800 bytes",
      "unpacked package is 3145729 bytes; limit is 3145728 bytes",
      "package contains JavaScript source maps: dist/index.js.map",
    ]);

    expect(validatePackMetadata({ tarballBytes: 1, unpackedBytes: 1, files: [] })).toEqual([
      "package is missing dist/index.js",
      "package is missing dist/index.d.ts",
    ]);
  });
});
