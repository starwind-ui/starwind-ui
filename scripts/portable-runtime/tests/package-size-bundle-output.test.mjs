import { describe, expect, it } from "vitest";

import { summarizeInitialBundleOutput } from "../package-size-bundle-output.mjs";

describe("package size bundle output", () => {
  it("counts entry and static chunks while excluding dynamic-only chunks", () => {
    const summary = summarizeInitialBundleOutput({
      entryFilePath: "/tmp/out/entry.js",
      gzip: (contents) => Buffer.from(contents),
      metafile: {
        outputs: {
          "/tmp/out/entry.js": { inputs: { "entry-input.js": { bytesInOutput: 10 } } },
          "/tmp/out/static.js": { inputs: { "static-input.js": { bytesInOutput: 20 } } },
          "/tmp/out/dynamic.js": { inputs: { "dynamic-input.js": { bytesInOutput: 30 } } },
        },
      },
      outputFiles: [
        outputFile(
          "/tmp/out/entry.js",
          'import{value as staticValue}from"./static.js";import("./dynamic.js");',
        ),
        outputFile("/tmp/out/static.js", "export const value = 1;"),
        outputFile("/tmp/out/dynamic.js", "export const value = 2;"),
      ],
    });

    expect(summary.initialOutputPaths).toEqual(["/tmp/out/entry.js", "/tmp/out/static.js"]);
    expect(summary.minifiedBytes).toBe(
      Buffer.byteLength('import{value as staticValue}from"./static.js";import("./dynamic.js");') +
        Buffer.byteLength("export const value = 1;"),
    );
    expect(summary.gzipBytes).toBe(summary.minifiedBytes);
    expect(Object.keys(summary.metafile.outputs)).toEqual([
      "/tmp/out/entry.js",
      "/tmp/out/static.js",
    ]);
  });

  it("resolves Windows-drive static chunk paths", () => {
    const summary = summarizeInitialBundleOutput({
      entryFilePath: "C:/tmp/out/entry.js",
      gzip: (contents) => Buffer.from(contents),
      outputFiles: [
        outputFile("C:/tmp/out/entry.js", 'import{value}from"./chunks/static.js";'),
        outputFile("C:/tmp/out/chunks/static.js", "export const value = 1;"),
        outputFile("C:/tmp/out/chunks/dynamic.js", "export const value = 2;"),
      ],
    });

    expect(summary.initialOutputPaths).toEqual([
      "C:/tmp/out/entry.js",
      "C:/tmp/out/chunks/static.js",
    ]);
  });

  it("walks nested static chunks recursively", () => {
    const summary = summarizeInitialBundleOutput({
      entryFilePath: "/tmp/out/entry.js",
      gzip: (contents) => Buffer.from(contents),
      outputFiles: [
        outputFile("/tmp/out/entry.js", 'import{a}from"./chunks/a.js";import("./dynamic.js");'),
        outputFile("/tmp/out/chunks/a.js", 'import{b}from"./b.js";export const a=b;'),
        outputFile("/tmp/out/chunks/b.js", "export const b = 1;"),
        outputFile("/tmp/out/dynamic.js", "export const dynamic = 1;"),
      ],
    });

    expect(summary.initialOutputPaths).toEqual([
      "/tmp/out/entry.js",
      "/tmp/out/chunks/a.js",
      "/tmp/out/chunks/b.js",
    ]);
  });

  it("uses zlib level 9 for the collected initial output graph", () => {
    const gzipCalls = [];

    summarizeInitialBundleOutput({
      entryFilePath: "/tmp/out/entry.js",
      gzip: (contents, options) => {
        gzipCalls.push(options);
        return Buffer.from(contents);
      },
      outputFiles: [
        outputFile("/tmp/out/entry.js", 'import{value}from"./static.js";'),
        outputFile("/tmp/out/static.js", "export const value = 1;"),
      ],
    });

    expect(gzipCalls).toEqual([{ level: 9 }]);
  });
});

function outputFile(path, text) {
  return {
    contents: Buffer.from(text),
    path,
    text,
  };
}
