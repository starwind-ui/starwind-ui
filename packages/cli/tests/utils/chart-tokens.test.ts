import { chmod, mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import fsExtra from "fs-extra";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tailwindConfig } from "../../src/templates/starwind.css.js";
import {
  CHART_TOKEN_BLOCKS,
  formatChartTokenBlock,
  insertMissingChartTokens,
  syncChartTokens,
} from "../../src/utils/chart-tokens.js";

const chartLinePattern = /^\s*--(?:color-)?chart-[1-5]:[^\n]*\n/gm;

function withoutChartTokens(css: string): string {
  return css.replace(/\n(\n\s*--(?:color-)?chart-1:)/g, "$1").replace(chartLinePattern, "");
}

const legacyTemplate = withoutChartTokens(tailwindConfig);

describe("chart tokens in the CLI template", () => {
  it("maps the Tailwind chart colors to the chart variables in @theme inline", () => {
    const themeInline = tailwindConfig.slice(tailwindConfig.indexOf("@theme inline {"));
    for (let index = 1; index <= 5; index += 1) {
      expect(themeInline).toContain(`  --color-chart-${index}: var(--chart-${index});\n`);
    }
  });

  it("declares the blue ramp in :root and .dark with the same values", () => {
    const ramp = ["300", "500", "600", "700", "800"];
    for (const selector of [":root {", ".dark {"]) {
      const start = tailwindConfig.indexOf(`\n${selector}`);
      const block = tailwindConfig.slice(start, tailwindConfig.indexOf("\n}", start) + 1);
      ramp.forEach((shade, index) => {
        expect(block).toContain(`  --chart-${index + 1}: var(--color-blue-${shade});\n`);
      });
    }
  });

  it("adds only the chart token lines to the previous template", () => {
    expect(tailwindConfig.split("\n").length - legacyTemplate.split("\n").length).toBe(18);
    expect(insertMissingChartTokens(legacyTemplate).content).toBe(tailwindConfig);
  });

  it("needs no chart tokens after init", () => {
    expect(insertMissingChartTokens(tailwindConfig)).toEqual({
      added: [],
      content: tailwindConfig,
    });
  });
});

describe("insertMissingChartTokens", () => {
  it("adds every token to existing blocks and keeps the rest of the file", () => {
    const result = insertMissingChartTokens(legacyTemplate);

    expect(result.added).toEqual([
      {
        block: "@theme inline",
        tokens: [
          "--color-chart-1",
          "--color-chart-2",
          "--color-chart-3",
          "--color-chart-4",
          "--color-chart-5",
        ],
      },
      { block: ":root", tokens: ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"] },
      { block: ".dark", tokens: ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"] },
    ]);
    expect(withoutChartTokens(result.content)).toBe(legacyTemplate);
  });

  it("keeps existing tokens and adds only the missing ones", () => {
    const css = `@theme inline {
  --color-chart-2: var(--chart-2);
}

:root {
  --chart-1: oklch(0.6 0.2 30);
  --chart-3: red;
}

.dark {
  --chart-1: var(--color-blue-300);
  --chart-2: var(--color-blue-500);
  --chart-3: var(--color-blue-600);
  --chart-4: var(--color-blue-700);
  --chart-5: var(--color-blue-800);
}
`;
    const result = insertMissingChartTokens(css);

    expect(result.added).toEqual([
      {
        block: "@theme inline",
        tokens: ["--color-chart-1", "--color-chart-3", "--color-chart-4", "--color-chart-5"],
      },
      { block: ":root", tokens: ["--chart-2", "--chart-4", "--chart-5"] },
    ]);
    expect(result.content).toBe(`@theme inline {
  --color-chart-2: var(--chart-2);

  --color-chart-1: var(--chart-1);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
}

:root {
  --chart-1: oklch(0.6 0.2 30);
  --chart-3: red;

  --chart-2: var(--color-blue-500);
  --chart-4: var(--color-blue-700);
  --chart-5: var(--color-blue-800);
}

.dark {
  --chart-1: var(--color-blue-300);
  --chart-2: var(--color-blue-500);
  --chart-3: var(--color-blue-600);
  --chart-4: var(--color-blue-700);
  --chart-5: var(--color-blue-800);
}
`);
  });

  it("changes nothing on a second run", () => {
    const inputs = [
      legacyTemplate,
      "",
      "@import 'tailwindcss';",
      "@theme inline { --color-background: var(--background); }\n",
    ];
    for (const input of inputs) {
      const first = insertMissingChartTokens(input);
      expect(first.added.length).toBeGreaterThan(0);
      expect(insertMissingChartTokens(first.content)).toEqual({
        added: [],
        content: first.content,
      });
    }
  });

  it("creates missing blocks at the end of the file", () => {
    const css = '@import "tailwindcss";\n';
    const result = insertMissingChartTokens(css);

    expect(result.content.startsWith(css)).toBe(true);
    expect(result.content).toBe(`@import "tailwindcss";

${formatChartTokenBlock()}`);
  });

  it("creates the blocks in an empty file", () => {
    expect(insertMissingChartTokens("").content).toBe(formatChartTokenBlock());
  });

  it("appends after a file that has no final newline", () => {
    const css = "@import 'tailwindcss';";
    expect(insertMissingChartTokens(css).content).toBe(`${css}\n\n${formatChartTokenBlock()}`);
  });

  it("adds tokens to a one-line block", () => {
    const css = "@theme inline { --color-background: var(--background); }\n";
    const result = insertMissingChartTokens(css);

    expect(
      result.content.startsWith("@theme inline { --color-background: var(--background);"),
    ).toBe(true);
    expect(result.content).toContain("  --color-chart-5: var(--chart-5); }\n");
  });

  it("does not join a last declaration that has no semicolon", () => {
    const css = ":root {\n  --background: white\n}\n";
    const result = insertMissingChartTokens(css);

    expect(result.content).toContain(
      ":root {\n  --chart-1: var(--color-blue-300);\n  --chart-2: var(--color-blue-500);\n  --chart-3: var(--color-blue-600);\n  --chart-4: var(--color-blue-700);\n  --chart-5: var(--color-blue-800);\n  --background: white\n}\n",
    );
  });

  it("fills an empty block", () => {
    const result = insertMissingChartTokens(".dark {}\n");
    expect(result.content).toContain(
      ".dark {\n  --chart-1: var(--color-blue-300);\n  --chart-2: var(--color-blue-500);\n  --chart-3: var(--color-blue-600);\n  --chart-4: var(--color-blue-700);\n  --chart-5: var(--color-blue-800);\n}\n",
    );
  });

  it("treats commented-out tokens as missing and ignores braces in comments and strings", () => {
    const css = `/* :root { --chart-1: red; } */
:root {
  /* --chart-1: red; */
  --font: "a { b";
  --chart-2: var(--color-blue-500);
}
`;
    const result = insertMissingChartTokens(css);
    expect(result.added).toContainEqual({
      block: ":root",
      tokens: ["--chart-1", "--chart-3", "--chart-4", "--chart-5"],
    });
    expect(
      result.content.startsWith(`/* :root { --chart-1: red; } */
:root {
  /* --chart-1: red; */
  --font: "a { b";
  --chart-2: var(--color-blue-500);

  --chart-1: var(--color-blue-300);
`),
    ).toBe(true);
  });

  it("counts tokens in any @theme block as present and edits layered blocks", () => {
    const css = `@theme {
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
}

@layer base {
  :root {
    --background: white;
  }

  .dark {
    --background: black;
  }
}
`;
    const result = insertMissingChartTokens(css);

    expect(result.added).toEqual([
      { block: ":root", tokens: ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"] },
      { block: ".dark", tokens: ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"] },
    ]);
    expect(result.content).toContain(
      "  :root {\n    --background: white;\n\n    --chart-1: var(--color-blue-300);\n",
    );
    expect(result.content).toContain(
      "  .dark {\n    --background: black;\n\n    --chart-1: var(--color-blue-300);\n",
    );
    expect(result.content).not.toContain("@theme inline");
  });

  it("does not add a dark token that :root already declares, so user colors stay in dark mode", () => {
    const css = `@layer base {
  :root {
    --chart-1: oklch(0.6 0.2 30);
    --chart-2: oklch(0.6 0.2 90);
  }
}

.dark {
  --background: black;
}
`;
    const result = insertMissingChartTokens(css);

    expect(result.added).toContainEqual({
      block: ":root",
      tokens: ["--chart-3", "--chart-4", "--chart-5"],
    });
    expect(result.added).toContainEqual({
      block: ".dark",
      tokens: ["--chart-3", "--chart-4", "--chart-5"],
    });
    const dark = result.content.slice(result.content.indexOf("\n.dark {"));
    expect(dark).not.toMatch(/--chart-[12]:/);
    expect(insertMissingChartTokens(result.content).added).toEqual([]);
  });

  it("counts tokens inside media queries as present but does not edit those blocks", () => {
    const css = `@media (prefers-color-scheme: dark) {
  :root {
    --chart-1: red;
  }
}
`;
    const result = insertMissingChartTokens(css);

    expect(result.content.startsWith(css)).toBe(true);
    expect(result.added).toContainEqual({
      block: ":root",
      tokens: ["--chart-2", "--chart-3", "--chart-4", "--chart-5"],
    });
  });

  it("counts tokens in a selector list as present", () => {
    const css = `.dark, [data-theme="dark"] {
  --chart-1: red;
  --chart-2: red;
  --chart-3: red;
  --chart-4: red;
  --chart-5: red;
}
`;
    const result = insertMissingChartTokens(css);

    expect(result.added.map(({ block }) => block)).toEqual(["@theme inline", ":root"]);
    expect(result.content).not.toContain("\n.dark {");
  });

  it("does not treat --chart-10 or var(--chart-1) as a declaration of --chart-1", () => {
    const css = ":root {\n  --chart-10: red;\n  --ring: var(--chart-1);\n}\n";
    expect(insertMissingChartTokens(css).added).toContainEqual({
      block: ":root",
      tokens: ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"],
    });
  });

  it("keeps CRLF line endings", () => {
    const css = ":root {\r\n  --background: white;\r\n}\r\n";
    const result = insertMissingChartTokens(css);

    expect(result.content.startsWith(":root {\r\n  --background: white;\r\n\r\n  --chart-1")).toBe(
      true,
    );
    expect(result.content.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it.each([
    [":root {\n  --background: white;\n", "unclosed"],
    [":root {\n  --background: white;\n}\n}\n", "unexpected"],
    ["/* open comment\n:root {}\n", "comment"],
    [':root {\n  --font: "open;\n}\n', "string"],
  ])("throws when the CSS cannot be parsed: %j", (css, message) => {
    expect(() => insertMissingChartTokens(css)).toThrow(new RegExp(message, "i"));
  });
});

describe("formatChartTokenBlock", () => {
  it("prints every chart token by default", () => {
    const block = formatChartTokenBlock();
    for (const { selector } of CHART_TOKEN_BLOCKS) expect(block).toContain(`${selector} {`);
    expect(block.match(/--(?:color-)?chart-\d:/g)).toHaveLength(15);
  });

  it("prints only the given tokens", () => {
    expect(formatChartTokenBlock([{ block: ":root", tokens: ["--chart-2"] }])).toBe(
      ":root {\n  --chart-2: var(--color-blue-500);\n}\n",
    );
  });
});

describe("syncChartTokens", () => {
  let tempDir = "";
  let previousCwd = "";

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "starwind-chart-tokens-test-"));
    previousCwd = process.cwd();
    process.chdir(tempDir);
    await mkdir("src/styles", { recursive: true });
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    await chmod(join(tempDir, "src/styles"), 0o755).catch(() => undefined);
    await rm(tempDir, { recursive: true, force: true });
  });

  it("writes missing tokens and reports them", async () => {
    await writeFile("src/styles/starwind.css", legacyTemplate);

    const result = await syncChartTokens("src/styles/starwind.css");

    expect(result.status).toBe("added");
    expect(result.status === "added" && result.added).toHaveLength(3);
    expect(await readFile("src/styles/starwind.css", "utf8")).toBe(tailwindConfig);
  });

  it("does not write when every token is present", async () => {
    await writeFile("src/styles/starwind.css", tailwindConfig);
    await chmod("src/styles/starwind.css", 0o444);

    await expect(syncChartTokens("src/styles/starwind.css")).resolves.toEqual({
      status: "unchanged",
      cssPath: "src/styles/starwind.css",
    });
    await chmod("src/styles/starwind.css", 0o644);
  });

  it("returns the full block when the file is missing and does not create it", async () => {
    const result = await syncChartTokens("src/styles/missing.css");

    expect(result).toMatchObject({
      status: "failed",
      cssPath: "src/styles/missing.css",
      block: formatChartTokenBlock(),
    });
    await expect(readFile("src/styles/missing.css", "utf8")).rejects.toThrow();
  });

  it("returns the full block and keeps the file when it cannot be parsed", async () => {
    const css = ":root {\n  --background: white;\n";
    await writeFile("src/styles/starwind.css", css);

    const result = await syncChartTokens("src/styles/starwind.css");

    expect(result).toMatchObject({ status: "failed", block: formatChartTokenBlock() });
    expect(await readFile("src/styles/starwind.css", "utf8")).toBe(css);
  });

  it("returns the missing tokens when the file cannot be written", async () => {
    const css = ":root {\n  --chart-1: red;\n}\n@theme inline {}\n.dark { --chart-1: red; }\n";
    await writeFile("src/styles/starwind.css", css);
    await chmod("src/styles/starwind.css", 0o444);

    const result = await syncChartTokens("src/styles/starwind.css");
    await chmod("src/styles/starwind.css", 0o644);

    expect(result.status).toBe("failed");
    expect(result.status === "failed" && result.block).not.toMatch(/\s--chart-1:/);
    expect(result.status === "failed" && result.block).toContain("--chart-2:");
    expect(await readFile("src/styles/starwind.css", "utf8")).toBe(css);
  });

  it("keeps the original stylesheet intact when writing the new content fails part way", async () => {
    await writeFile("src/styles/starwind.css", legacyTemplate);
    const realWriteFile = fsExtra.writeFile.bind(fsExtra);
    const writeSpy = vi
      .spyOn(fsExtra, "writeFile")
      .mockImplementation(async (file: unknown, data: unknown, options?: unknown) => {
        // Simulate a full disk: part of the content lands, then the write fails.
        await realWriteFile(file as string, String(data).slice(0, 20), options as "utf8");
        throw Object.assign(new Error("ENOSPC: no space left on device"), { code: "ENOSPC" });
      });

    try {
      const result = await syncChartTokens("src/styles/starwind.css");

      expect(result).toMatchObject({ status: "failed", error: expect.stringContaining("ENOSPC") });
    } finally {
      writeSpy.mockRestore();
    }
    expect(await readFile("src/styles/starwind.css", "utf8")).toBe(legacyTemplate);
    expect(await readdir("src/styles")).toEqual(["starwind.css"]);
  });

  it("keeps the original stylesheet intact and removes the temp file when the replace fails", async () => {
    await writeFile("src/styles/starwind.css", legacyTemplate);
    const renameSpy = vi
      .spyOn(fsExtra, "rename")
      .mockRejectedValue(Object.assign(new Error("EXDEV: rename failed"), { code: "EXDEV" }));

    try {
      const result = await syncChartTokens("src/styles/starwind.css");

      expect(result.status).toBe("failed");
    } finally {
      renameSpy.mockRestore();
    }
    expect(await readFile("src/styles/starwind.css", "utf8")).toBe(legacyTemplate);
    expect(await readdir("src/styles")).toEqual(["starwind.css"]);
  });

  it("keeps the file mode and leaves no temp file after a successful write", async () => {
    await writeFile("src/styles/starwind.css", legacyTemplate);
    await chmod("src/styles/starwind.css", 0o640);

    await syncChartTokens("src/styles/starwind.css");

    expect((await fsExtra.stat("src/styles/starwind.css")).mode & 0o777).toBe(0o640);
    expect(await readdir("src/styles")).toEqual(["starwind.css"]);
  });

  it("refuses a CSS path that is a symbolic link", async () => {
    await writeFile("src/styles/real.css", legacyTemplate);
    await symlink(join(tempDir, "src/styles/real.css"), "src/styles/starwind.css");

    const result = await syncChartTokens("src/styles/starwind.css");

    expect(result.status).toBe("failed");
    expect(await readFile("src/styles/real.css", "utf8")).toBe(legacyTemplate);
  });
});
