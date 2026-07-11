import { describe, expect, it } from "vitest";

import {
  buildRawGzipDiagnostics,
  formatRawGzipDiagnosticsMarkdown,
} from "../package-size-raw-gzip-diagnostics.mjs";

describe("package size raw gzip diagnostics", () => {
  it("builds exact raw gzip rows for the active overlap optimization gate", () => {
    const rows = buildRawGzipDiagnostics({
      supportResults: [
        supportAggregate("all-three-overlap", "starwind", 99_302),
        supportComponent("select", "starwind", 19_440),
        supportComponent("combobox", "starwind", 18_885),
        supportComponent("menu", "starwind", 18_113),
        supportComponent("context-menu", "starwind", 19_706),
      ],
    });

    expect(rows).toEqual([
      expect.objectContaining({
        gzipBytes: 99_302,
        label: "All-three overlap - Starwind combined",
        roundedGzip: "97.0 KiB",
      }),
      expect.objectContaining({
        gzipBytes: 19_440,
        label: "Isolated Starwind Select",
        roundedGzip: "19.0 KiB",
      }),
      expect.objectContaining({
        gzipBytes: 18_885,
        label: "Isolated Starwind Combobox",
        roundedGzip: "18.4 KiB",
      }),
      expect.objectContaining({
        gzipBytes: 18_113,
        label: "Isolated Starwind Menu",
        roundedGzip: "17.7 KiB",
      }),
      expect.objectContaining({
        gzipBytes: 19_706,
        label: "Isolated Starwind Context Menu",
        roundedGzip: "19.2 KiB",
      }),
    ]);
  });

  it("formats the tradeoff gate with raw bytes and rounded values", () => {
    const markdown = formatRawGzipDiagnosticsMarkdown([
      {
        gzipBytes: 99_302,
        label: "All-three overlap - Starwind combined",
        note: "Primary continuation gate.",
        roundedGzip: "97.0 KiB",
        scope: "combined support set",
      },
    ]);
    const output = markdown.join("\n");

    expect(markdown).toContain("## Raw Gzip Diagnostics");
    expect(markdown).toContain(
      "| All-three overlap - Starwind combined | combined support set | 99302 B | 97.0 KiB | Primary continuation gate. |",
    );
    expect(output).toContain(
      "A slight isolated Combobox or Menu increase is acceptable only when `All-three overlap - Starwind combined` raw gzip bytes decrease and the isolated component remains clearly below the comparable Zag React and Base UI rows.",
    );
    expect(output).toContain(
      "Any isolated Combobox or Menu increase of 1.0 KiB min+gzip or more is a `ready-for-human` decision",
    );
    expect(output).toContain(
      "Source-owner byte relocation alone does not count as a product size win.",
    );
  });

  it("fails loudly when an expected diagnostic row is missing", () => {
    expect(() =>
      buildRawGzipDiagnostics({
        supportResults: [
          supportAggregate("all-three-overlap", "starwind", 99_302),
          supportComponent("select", "starwind", 19_440),
          supportComponent("combobox", "starwind", 18_885),
          supportComponent("menu", "starwind", 18_113),
        ],
      }),
    ).toThrow("Missing raw gzip diagnostic for Isolated Starwind Context Menu");
  });
});

function supportAggregate(comparisonSet, provider, gzipBytes) {
  return { comparisonSet, gzipBytes, provider };
}

function supportComponent(component, provider, gzipBytes) {
  return { component, gzipBytes, provider };
}
