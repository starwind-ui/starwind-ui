import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { chromium } from "playwright";
import ts from "typescript";
import { createServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { compileVueSfc } from "../../../../packages/vue/tsup.config.js";
import { cases } from "./cases.mjs";

const root = process.cwd();
const home = path.join(root, "scripts/portable-runtime/tests/aspect-ratio");
const demoRequire = createRequire(
  realpathSync(path.join(root, "apps/demo/node_modules/astro/package.json")),
);
const { transform: compileAstro } = demoRequire("@astrojs/compiler-rs");
const tailwindRequire = createRequire(
  path.join(root, "apps/demo/node_modules/@tailwindcss/vite/package.json"),
);
const { compile } = tailwindRequire("@tailwindcss/node");
let server;
let browser;
let renderFixtures;
let renderReactHydration;
let renderAstroVoid;
let css;

beforeAll(async () => {
  server = await createServer({
    configFile: false,
    root: path.join(root, "apps/react-demo"),
    server: { port: 0, host: "127.0.0.1", hmr: false },
    appType: "custom",
    // Fixture transforms must work before SvelteKit generates the demo tsconfig.
    esbuild: { jsx: "automatic", tsconfigRaw: "{}" },
    plugins: [
      svelte({ configFile: false, hot: false, compilerOptions: { dev: false } }),
      {
        name: "aspect-ratio-fixtures",
        enforce: "pre",
        transform(source, id) {
          const file = id.split("?")[0];
          if (file.endsWith(".vue")) source = compileVueSfc(source, file);
          else if (file.endsWith(".astro"))
            source = compileAstro(source, {
              filename: file,
              internalURL: "astro/compiler-runtime",
            }).code;
          else if (!file.endsWith(".tsx")) return;
          const output = ts.transpileModule(source, {
            compilerOptions: {
              module: ts.ModuleKind.ESNext,
              target: ts.ScriptTarget.ES2022,
              jsx: ts.JsxEmit.ReactJSX,
            },
            fileName: file.endsWith(".tsx") ? file : file + ".ts",
          }).outputText;
          return output;
        },
      },
    ],
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: [
        {
          find: "astro/compiler-runtime",
          replacement: path.join(
            root,
            "scripts/portable-runtime/tests/conformance/emission/astro-compiler-runtime.ts",
          ),
        },
        {
          find: "tailwind-variants",
          replacement: path.join(
            root,
            "apps/react-demo/node_modules/tailwind-variants/dist/index.js",
          ),
        },
      ],
    },
    ssr: {
      noExternal: ["svelte"],
      external: ["react", "react-dom", "react-dom/server", "react/jsx-runtime"],
    },
  });
  ({ renderFixtures, renderReactHydration, renderAstroVoid } = await server.ssrLoadModule(
    path.join(home, "render.mjs"),
  ));
  await server.listen();
  const compiler = await compile('@import "tailwindcss";', {
    base: path.join(root, "apps/demo"),
    onDependency() {},
  });
  css = compiler.build([
    "flex",
    "flex-col",
    "items-center",
    "grid",
    "justify-items-center",
    "relative",
    "block",
    "aspect-(--ratio)",
    "aspect-square",
    "overflow-hidden",
    "h-full",
    "w-full",
    "object-cover",
    "absolute",
    "inset-0",
    "border-4",
    "p-4",
  ]);
  browser = await chromium.launch({ channel: "chrome", headless: true });
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

describe("AspectRatio rendered geometry with Tailwind", () => {
  for (const target of ["astro", "react", "vue", "svelte"]) {
    it(`${target} puts ratio, dimensions and caller styles on the public element`, async () => {
      const page = await browser.newPage();
      try {
        await page.setContent(`<style>${css}</style>${await renderFixtures(target)}`);
        const result = await page.evaluate(() =>
          Object.fromEntries(
            [...document.querySelectorAll('[data-slot="aspect-ratio"]')].map((element) => {
              const box = element.getBoundingClientRect();
              const computed = getComputedStyle(element);
              const media = element.querySelector("img");
              const overlay = element.querySelector(".absolute");
              return [
                element.id,
                {
                  width: box.width,
                  height: box.height,
                  tag: element.tagName,
                  parent: element.parentElement.tagName,
                  parentWidth: element.parentElement.getBoundingClientRect().width,
                  parentDisplay: getComputedStyle(element.parentElement).display,
                  inlineWidth: element.style.width,
                  owner: element.getAttribute("data-owner"),
                  label: element.getAttribute("aria-label"),
                  position: computed.position,
                  overflow: computed.overflow,
                  color: computed.color,
                  padding: computed.paddingTop,
                  border: computed.borderTopWidth,
                  media: media && {
                    width: media.getBoundingClientRect().width,
                    height: media.getBoundingClientRect().height,
                    fit: getComputedStyle(media).objectFit,
                  },
                  overlay: overlay && {
                    x: overlay.getBoundingClientRect().x - box.x,
                    y: overlay.getBoundingClientRect().y - box.y,
                    width: overlay.getBoundingClientRect().width,
                    height: overlay.getBoundingClientRect().height,
                  },
                },
              ];
            }),
          ),
        );
        expect(Object.keys(result)).toHaveLength(cases.length);
        for (const entry of cases) {
          const actual = result[entry.id];
          expect(actual.width, `${entry.id} width`).toBeCloseTo(entry.width ?? 320, 1);
          expect(actual.height, `${entry.id} height`).toBeCloseTo(entry.height, 1);
          expect(actual.position).toBe("relative");
          expect(actual.parent).toBe(entry.hostClass ? "DIV" : "BODY");
          if (entry.hostClass) {
            expect(actual.inlineWidth).toBe("");
            expect(actual.parentWidth).toBe(320);
            expect(actual.parentDisplay).toBe(entry.hostClass.startsWith("flex") ? "flex" : "grid");
            expect(actual.overlay).toEqual({
              x: 0,
              y: 0,
              width: entry.width,
              height: entry.height,
            });
          }
          expect(actual.owner).toBe("caller");
          expect(actual.label).toBe(entry.id);
          expect(actual.tag).toBe(entry.as?.toUpperCase() ?? "DIV");
        }
        expect(result.media.media).toEqual({ width: 320, height: 180, fit: "cover" });
        expect(result["portrait-media"].media).toEqual({ width: 320, height: 180, fit: "cover" });
        expect(result.overlay.overlay).toEqual({ x: 0, y: 0, width: 320, height: 180 });
        expect(result.growth.overflow).toBe("visible");
        expect(result.clipped.overflow).toBe("hidden");
        expect(result["clipped-flow"].overflow).toBe("hidden");
        expect(result["relative-growth"].overflow).toBe("visible");
        expect(result["object-style"].color).toBe("rgb(1, 2, 3)");
        expect(result.border.padding).toBe("16px");
        expect(result.border.border).toBe("4px");
        expect(result.variable.color).toBe("rgb(1, 2, 3)");
        expect(result.inline.color).toBe("rgb(1, 2, 3)");
      } finally {
        await page.close();
      }
    });
  }
});

it("React hydrates the public root and keeps refs and events through ratio and tag updates", async () => {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    const url = server.resolvedUrls.local[0];
    await page.route(`${url}fixture`, (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<style>${css}</style><main id="hydrate">${renderReactHydration()}</main><script type="module" src="/@fs/${home}/react-hydration.mjs"></script>`,
      }),
    );
    await page.goto(`${url}fixture`);
    await page.waitForFunction(() => window.aspectRatioFixture?.state.hydrated);
    expect(await page.evaluate(() => window.aspectRatioFixture.state)).toMatchObject({
      hydrated: true,
      refOwnsRoot: true,
      errors: [],
      refs: ["BUTTON"],
    });
    expect(
      await page
        .locator("#interactive")
        .evaluate((element) => element.getBoundingClientRect().height),
    ).toBeCloseTo(180, 1);
    await page.locator("#interactive").click();
    expect(await page.evaluate(() => window.aspectRatioFixture.state.clicks)).toBe(1);
    await page.evaluate(() => window.aspectRatioFixture.update({ ratio: 1 }));
    expect(
      await page
        .locator("#interactive")
        .evaluate((element) => element.getBoundingClientRect().height),
    ).toBeCloseTo(320, 1);
    expect(await page.evaluate(() => window.aspectRatioFixture.state.hydrated)).toBe(true);
    await page.evaluate(() => window.aspectRatioFixture.update({ ratio: 3 / 4, as: "section" }));
    const current = await page.locator("#interactive").evaluate((element) => ({
      tag: element.tagName,
      height: element.getBoundingClientRect().height,
      color: getComputedStyle(element).color,
      label: element.getAttribute("aria-label"),
      owner: element.getAttribute("data-owner"),
      parent: element.parentElement.id,
    }));
    expect(current).toMatchObject({
      tag: "SECTION",
      color: "rgb(1, 2, 3)",
      label: "Media",
      owner: "caller",
      parent: "hydrate",
    });
    expect(current.height).toBeCloseTo(320 / (3 / 4), 1);
    await page.locator("#interactive").click();
    expect(await page.evaluate(() => window.aspectRatioFixture.state)).toMatchObject({
      refOwnsRoot: true,
      refs: ["BUTTON", null, "SECTION"],
      clicks: 2,
      errors: [],
    });
    await page.evaluate(() =>
      window.aspectRatioFixture.update({
        ratio: 16 / 9,
        as: "img",
        alt: "Fixture",
        src: "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%274%27 height=%273%27/%3E",
      }),
    );
    expect(
      await page.locator("#interactive").evaluate((element) => ({
        tag: element.tagName,
        height: element.getBoundingClientRect().height,
        slot: element.dataset.slot,
        children: element.children.length,
      })),
    ).toEqual({ tag: "IMG", height: 180, slot: "aspect-ratio", children: 0 });
    expect(await page.evaluate(() => window.aspectRatioFixture.state.refOwnsRoot)).toBe(true);
    await page.evaluate(() => window.aspectRatioFixture.unmount());
    expect(await page.evaluate(() => window.aspectRatioFixture.state.refs)).toEqual([
      "BUTTON",
      null,
      "SECTION",
      null,
      "IMG",
      null,
    ]);
    expect(await page.locator("#hydrate").innerHTML()).toBe("");
    expect(errors).toEqual([]);
  } finally {
    await page.close();
  }
});

it("Astro renders a native void root with caller attributes and style", async () => {
  const html = await renderAstroVoid();
  const page = await browser.newPage();
  try {
    await page.setContent(`<style>${css}</style>${html}`);
    expect(await page.locator("body > img").count()).toBe(1);
    expect(
      await page.locator("body > img").evaluate((element) => ({
        slot: element.dataset.slot,
        owner: element.dataset.owner,
        label: element.getAttribute("aria-label"),
        color: getComputedStyle(element).color,
        height: element.getBoundingClientRect().height,
      })),
    ).toEqual({
      slot: "aspect-ratio",
      owner: "caller",
      label: "Void media",
      color: "rgb(1, 2, 3)",
      height: 240,
    });
    expect(await page.locator("body").evaluate((element) => element.children.length)).toBe(1);
  } finally {
    await page.close();
  }
});
