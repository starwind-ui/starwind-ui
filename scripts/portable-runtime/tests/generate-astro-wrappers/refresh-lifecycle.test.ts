import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";
import { expect, it } from "vitest";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";

it("reconnects generated Astro Input and Dropzone scripts through scoped init and page swaps", async () => {
  const repo = process.cwd();
  const directory = await mkdtemp(path.join(tmpdir(), "starwind-astro-refresh-"));
  const server = await createServer({
    configFile: false,
    root: directory,
    logLevel: "error",
    resolve: {
      alias: {
        "@starwind-ui/runtime/input": path.join(
          repo,
          "packages/runtime/src/components/input/input.ts",
        ),
        "@starwind-ui/runtime/dropzone": path.join(
          repo,
          "packages/runtime/src/components/dropzone/dropzone.ts",
        ),
      },
    },
    server: { host: "127.0.0.1", port: 0, fs: { allow: [repo, directory] } },
  });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const component of ["input", "dropzone"]) {
      await primitiveGeneratorRegistry
        .find((entry) => entry.component === component)!
        .generateTarget({
          target: "astro",
          outputRoot: directory,
          componentHeader: "---\n",
          moduleHeader: "",
        });
      const name = component === "input" ? "InputRoot" : "DropzoneRoot";
      const source = await readFile(path.join(directory, component, `${name}.astro`), "utf8");
      const script = source.match(/<script>\n([\s\S]*?)<\/script>/)![1]!;
      await writeFile(
        path.join(directory, `${component}.ts`),
        script.replaceAll(
          '"../internal/controller-lifecycle"',
          JSON.stringify(
            `/@fs/${path.join(repo, "packages/astro/src/internal/controller-lifecycle.ts")}`,
          ),
        ),
      );
    }
    await writeFile(
      path.join(directory, "index.html"),
      `
      <form id="old"></form><form id="new"></form>
      <input data-sw-input id="text" form="old" value="seed">
      <label data-sw-dropzone id="files"><input data-sw-dropzone-input type="file" name="uploads" form="old"><div data-sw-dropzone-files-list></div></label>
      <script type="module" src="/input.ts"></script><script type="module" src="/dropzone.ts"></script>
    `,
    );
    await server.listen();
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(server.resolvedUrls!.local[0]!);
    try {
      await page.waitForFunction(
        () => document.querySelector("#files")?.getAttribute("role") === "button",
        undefined,
        { timeout: 5_000 },
      );
    } catch (error) {
      throw new Error(errors.length ? errors.join("\n") : String(error));
    }
    const result = await page.evaluate(async () => {
      const init = (root: Element) =>
        document.dispatchEvent(new CustomEvent("starwind:init", { detail: { root } }));
      const input = document.querySelector<HTMLInputElement>("#text")!;
      const root = document.querySelector<HTMLElement>("#files")!;
      const first = document.querySelector<HTMLFormElement>("#old")!;
      const second = document.querySelector<HTMLFormElement>("#new")!;
      const retired = root.querySelector<HTMLInputElement>("input")!;
      let notifications = 0;
      root.addEventListener("starwind:files-change", () => notifications++);
      const transfer = new DataTransfer();
      transfer.items.add(new File(["kept"], "kept.txt"));
      retired.files = transfer.files;
      retired.dispatchEvent(new Event("change", { bubbles: true }));
      input.value = "accepted";
      input.dispatchEvent(new InputEvent("input", { bubbles: true }));
      first.reset();
      input.setAttribute("form", "new");
      const replacement = retired.cloneNode() as HTMLInputElement;
      replacement.setAttribute("form", "new");
      retired.replaceWith(replacement);
      init(input);
      init(replacement);
      init(replacement);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const retained =
        input.value === "accepted" &&
        (new FormData(second).get("uploads") as File).name === "kept.txt";
      retired.dispatchEvent(new Event("change"));
      first.reset();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const retiredInactive =
        notifications === 1 &&
        input.value === "accepted" &&
        replacement.files?.[0]?.name === "kept.txt";
      replacement.remove();
      init(root);
      const absent = root.querySelector("input") === null;
      root.append(replacement);
      init(replacement);
      const returned = replacement.files?.[0]?.name === "kept.txt";
      second.reset();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const reset =
        input.value === "seed" &&
        !input.hasAttribute("data-dirty") &&
        root.dataset.hasFiles === "false";
      document.dispatchEvent(new Event("astro:before-swap"));
      input.value = "retired";
      input.dispatchEvent(new InputEvent("input"));
      const destroyed = !input.hasAttribute("data-dirty");
      document.dispatchEvent(new Event("astro:after-swap"));
      input.value = "new page";
      input.dispatchEvent(new InputEvent("input"));
      const recreated = input.hasAttribute("data-dirty");
      document.dispatchEvent(new Event("astro:before-swap"));
      return { retained, retiredInactive, absent, returned, reset, destroyed, recreated };
    });
    expect(result).toEqual({
      retained: true,
      retiredInactive: true,
      absent: true,
      returned: true,
      reset: true,
      destroyed: true,
      recreated: true,
    });
    expect(errors).toEqual([]);
  } finally {
    await browser.close();
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
}, 60_000);
