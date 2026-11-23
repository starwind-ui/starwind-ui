// Renders the Astro and Svelte parity fixtures on the server, in Node, for every case. React and
// Vue render their server markup in the browser suite. It also reads the Astro Primitive and
// Styled export names, because the Astro indexes cannot load in the browser.
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { createServer } from "vite";

import {
  ASTRO_ONLY_CASES,
  EXTRA_CASES,
  FRAMEWORK_ONLY_CASES,
  PARITY_MODES,
  SNAP_CASES,
} from "../fixtures/cases.js";

const root = fileURLToPath(new URL("../../../../../", import.meta.url));
const fixtures = path.join(root, "scripts/portable-runtime/tests/chart-parity/fixtures");

/** Server HTML, or the error message when the render throws. */
export type ServerResult = { html: string } | { error: string };

export interface ServerFixtures {
  astro: Record<string, ServerResult>;
  svelte: Record<string, ServerResult>;
  astroExports: string[];
  astroStyledExports: string[];
}

async function renderFixtures(): Promise<ServerFixtures> {
  const astroRequire = createRequire(
    realpathSync(path.join(root, "apps/demo/node_modules/astro/package.json")),
  );
  const { transform } = astroRequire("@astrojs/compiler-rs") as {
    transform(source: string, options: Record<string, unknown>): { code: string };
  };
  const server = await createServer({
    root,
    configFile: false,
    logLevel: "error",
    appType: "custom",
    server: { middlewareMode: true, hmr: false, watch: null, ws: false },
    optimizeDeps: { noDiscovery: true, entries: [] },
    ssr: { noExternal: true },
    // The Svelte demo tsconfig extends a generated SvelteKit file, so give esbuild its own config.
    esbuild: {
      loader: "ts",
      include: /\.(tsx?|astro)$/,
      tsconfigRaw: JSON.stringify({ compilerOptions: { target: "ES2022" } }),
    },
    plugins: [
      svelte({ configFile: false, hot: false }),
      {
        name: "chart-parity-astro",
        enforce: "pre",
        transform(source, id) {
          const file = id.split("?")[0]!;
          if (!file.endsWith(".astro")) return;
          const result = transform(source, {
            filename: file,
            internalURL: "astro/compiler-runtime",
            sourcemap: "external",
          });
          return { code: result.code, map: null };
        },
      },
    ],
    resolve: {
      alias: [
        {
          find: /^astro\/compiler-runtime$/,
          replacement: path.join(
            root,
            "scripts/portable-runtime/tests/conformance/emission/astro-compiler-runtime.ts",
          ),
        },
        {
          find: /^@starwind-ui\/runtime\/(.+)$/,
          replacement: path.join(root, "packages/runtime/src/components/$1/index.ts"),
        },
        ...["astro", "svelte"].map((target) => ({
          find: new RegExp(`^@starwind-ui/${target}/([^/]+)$`),
          replacement: path.join(root, `packages/${target}/src/$1/index.ts`),
        })),
        {
          find: "tailwind-variants",
          replacement: path.join(root, "apps/demo/node_modules/tailwind-variants/dist/index.js"),
        },
      ],
    },
  });
  try {
    const { experimental_AstroContainer: Container } = (await import(
      /* @vite-ignore */ path.join(root, "apps/demo/node_modules/astro/dist/container/index.js")
    )) as {
      experimental_AstroContainer: {
        create(): Promise<{
          renderToString(component: unknown, options: { props: object }): Promise<string>;
        }>;
      };
    };
    const container = await Container.create();
    const astro = (await server.ssrLoadModule(path.join(fixtures, "ParityAstro.astro"))) as {
      default: unknown;
    };
    const parity = (await server.ssrLoadModule(path.join(fixtures, "ParitySvelte.svelte"))) as {
      default: unknown;
    };
    // The Vite SSR copy of Svelte, so the renderer and the components share one context.
    const { render } = (await server.ssrLoadModule("svelte/server")) as {
      render(component: unknown, options: { props: object }): { body: string };
    };
    const result: ServerFixtures = {
      astro: {},
      svelte: {},
      astroExports: [],
      astroStyledExports: [],
    };
    for (const mode of ASTRO_ONLY_CASES) {
      result.astro[mode] = {
        html: await container.renderToString(astro.default, { props: { mode } }),
      };
    }
    for (const mode of FRAMEWORK_ONLY_CASES) {
      result.svelte[mode] = { html: render(parity.default, { props: { mode } }).body };
    }
    for (const mode of [...PARITY_MODES, ...EXTRA_CASES, ...SNAP_CASES]) {
      try {
        result.astro[mode] = {
          html: await container.renderToString(astro.default, { props: { mode } }),
        };
      } catch (error) {
        result.astro[mode] = { error: error instanceof Error ? error.message : String(error) };
      }
      try {
        result.svelte[mode] = { html: render(parity.default, { props: { mode } }).body };
      } catch (error) {
        result.svelte[mode] = { error: error instanceof Error ? error.message : String(error) };
      }
    }
    const astroIndex = await server.ssrLoadModule(
      path.join(root, "packages/astro/src/chart/index.ts"),
    );
    result.astroExports = Object.keys(astroIndex).sort();
    const astroStyledIndex = await server.ssrLoadModule(
      path.join(root, "apps/demo/src/components/starwind-runtime/chart/index.ts"),
    );
    result.astroStyledExports = Object.keys(astroStyledIndex).sort();
    return result;
  } finally {
    await server.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.stdout.write(JSON.stringify(await renderFixtures()));
}
