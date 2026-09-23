import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { compile } from "svelte/compiler";
import { build } from "vite";
import { expect, it } from "vitest";

it("removes owner diagnostics from every minified production component", async () => {
  const root = path.join(process.cwd(), "packages/svelte/src");
  const files = (await readdir(root, { recursive: true }))
    .filter((file) => file.endsWith(".svelte"))
    .map((file) => path.join(root, file));
  files.push(
    path.join(
      process.cwd(),
      "apps/svelte-demo/src/lib/starwind-runtime/breadcrumb/BreadcrumbLink.svelte",
    ),
  );
  const owners = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (!source.includes("child props did not attach")) continue;
    owners.push(file);
    const compiled = compile(source, { filename: file, generate: "client", dev: false }).js.code;
    const output = await build({
      configFile: false,
      logLevel: "silent",
      plugins: [
        {
          name: "compiled-owner",
          resolveId: (id) => (id === "owner" ? id : undefined),
          load: (id) => (id === "owner" ? compiled : undefined),
        },
      ],
      build: {
        write: false,
        minify: "esbuild",
        target: "es2020",
        rollupOptions: {
          preserveEntrySignatures: "strict",
          input: "owner",
          external: (id) => id !== "owner",
          output: { format: "es" },
        },
      },
    });
    if (Array.isArray(output) || !("output" in output)) throw new Error("Expected Rollup output");
    const code = output.output
      .filter((item) => item.type === "chunk")
      .map((item) => item.code)
      .join("\n");
    expect(code, file).not.toMatch(
      /child props|multiple owners|console\.warn|diagnos|validationRevision|\.some\(/,
    );
    // Anchor owners retain Sets to select the semantic element.
    if (file.includes("AnchorOwner") || file.includes("PreviewCardTrigger")) {
      expect(code, file).toContain("new Set");
    } else {
      expect(code, file).not.toContain("new Set");
    }
  }
  expect(owners).toHaveLength(9);
});
