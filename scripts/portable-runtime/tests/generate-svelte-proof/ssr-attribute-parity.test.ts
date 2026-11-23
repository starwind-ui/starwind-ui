import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { type Browser, chromium } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];
const servers: ViteDevServer[] = [];
const browsers: Browser[] = [];

afterEach(async () => {
  await Promise.all(browsers.splice(0).map((browser) => browser.close()));
  await Promise.all(servers.splice(0).map((server) => server.close()));
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

type Attributes = Record<string, string | null>;

const READ = ["aria-disabled", "data-default-value", "data-state"] as const;

function serverAttributes(markup: string, testId: string): Attributes {
  const tag = markup.match(new RegExp(`<[a-z]+\\s[^>]*data-testid="${testId}"[^>]*>`))?.[0];
  if (!tag) throw new Error(`Server markup has no ${testId}.`);
  const attributes = new Map(
    [...tag.matchAll(/\s([^\s=>]+)(?:="([^"]*)")?/g)].map((match) => [match[1], match[2] ?? ""]),
  );
  return Object.fromEntries(READ.map((name) => [name, attributes.get(name) ?? null]));
}

describe("generated Svelte server attributes", () => {
  it("print the Runtime state hooks that hydration keeps", async () => {
    const root = await mkdtemp(path.join(process.cwd(), ".svelte-ssr-attributes-"));
    temporaryRoots.push(root);
    await writeFile(path.join(root, "App.svelte"), APP_SOURCE, "utf8");
    await writeFile(path.join(root, "main.ts"), MAIN_SOURCE, "utf8");

    const ssrServer = await createProofServer(root, true);
    servers.push(ssrServer);
    const appModule = await ssrServer.ssrLoadModule("/App.svelte");
    const { render } = await ssrServer.ssrLoadModule("svelte/server");
    const markup: string = render(appModule.default).body;

    const server = {
      openRoot: serverAttributes(markup, "nm-root"),
      openIcon: serverAttributes(markup, "nm-icon"),
      closedRoot: serverAttributes(markup, "nc-root"),
      closedIcon: serverAttributes(markup, "nc-icon"),
      selectTrigger: serverAttributes(markup, "s-trigger"),
      comboboxTrigger: serverAttributes(markup, "c-trigger"),
    };
    expect(server).toEqual({
      openRoot: { "aria-disabled": null, "data-default-value": "a", "data-state": "open" },
      openIcon: { "aria-disabled": null, "data-default-value": null, "data-state": "open" },
      closedRoot: { "aria-disabled": null, "data-default-value": null, "data-state": "closed" },
      closedIcon: { "aria-disabled": null, "data-default-value": null, "data-state": "closed" },
      selectTrigger: { "aria-disabled": null, "data-default-value": null, "data-state": "closed" },
      comboboxTrigger: {
        "aria-disabled": null,
        "data-default-value": null,
        "data-state": "closed",
      },
    });

    await writeFile(
      path.join(root, "index.html"),
      `<link rel="icon" href="data:,"><div id="app">${markup}</div><script type="module" src="/main.ts"></script>`,
      "utf8",
    );
    const browserServer = await createProofServer(root, false);
    servers.push(browserServer);
    await browserServer.listen();
    const url = browserServer.resolvedUrls?.local[0];
    if (!url) throw new Error("Svelte SSR attribute proof server did not expose a local URL.");
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    browsers.push(browser);
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === "true");
    // The Runtime connects in a microtask after hydration.
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="s-trigger"]')?.getAttribute("aria-disabled") !== null,
    );

    const read = (testId: string) =>
      page.evaluate(
        ({ id, names }) => {
          const element = document.querySelector(`[data-testid="${id}"]`);
          return Object.fromEntries(
            names.map((name) => [name, element?.getAttribute(name) ?? null]),
          );
        },
        { id: testId, names: [...READ] },
      );

    // Server state equals hydrated state, so the Styled chevron does not flip at hydration.
    expect(await read("nm-root")).toEqual(server.openRoot);
    expect(await read("nm-icon")).toEqual(server.openIcon);
    expect(await read("nc-root")).toEqual(server.closedRoot);
    expect(await read("nc-icon")).toEqual(server.closedIcon);
    // The Runtime writes aria-disabled="false" at init, as it does for Astro, React and Vue.
    expect(await read("s-trigger")).toEqual({ ...server.selectTrigger, "aria-disabled": "false" });
    expect(await read("c-trigger")).toEqual({
      ...server.comboboxTrigger,
      "aria-disabled": "false",
    });

    // A closed menu must stay closed when a new item reconnects the Runtime.
    const reconnect = await page.evaluate(async () => {
      const trigger = document.querySelector<HTMLElement>('[data-testid="nm-trigger"]')!;
      trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
      await new Promise((resolve) => setTimeout(resolve, 100));
      const afterClose = trigger.getAttribute("aria-expanded");
      const seen: (string | null)[] = [];
      const observer = new MutationObserver(() => seen.push(trigger.getAttribute("aria-expanded")));
      observer.observe(trigger, { attributeFilter: ["aria-expanded"] });
      document.querySelector<HTMLElement>('[data-testid="add-item"]')!.click();
      await new Promise((resolve) => setTimeout(resolve, 100));
      observer.disconnect();
      return {
        afterClose,
        added: document.querySelector('[data-testid="nm-trigger-b"]') !== null,
        final: trigger.getAttribute("aria-expanded"),
        // The new Runtime writes the trigger again, so a reconnect happened.
        reconnected: seen.length > 0,
        reopened: seen.includes("true"),
      };
    });
    expect(reconnect).toEqual({
      afterClose: "false",
      added: true,
      final: "false",
      reconnected: true,
      reopened: false,
    });

    // Svelte leaves the Runtime-written aria-disabled in place through an open and close cycle.
    const cycle = await page.evaluate(async () => {
      const pause = () => new Promise((resolve) => setTimeout(resolve, 50));
      const select = document.querySelector<HTMLElement>('[data-testid="s-trigger"]')!;
      const combobox = document.querySelector<HTMLElement>('[data-testid="c-trigger"]')!;
      select.click();
      await pause();
      const selectOpen = [select.getAttribute("data-state"), select.getAttribute("aria-disabled")];
      select.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
      document
        .querySelector('[data-testid="s-popup"]')
        ?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
      await pause();
      combobox.click();
      await pause();
      const comboboxOpen = [
        combobox.getAttribute("data-state"),
        combobox.getAttribute("aria-disabled"),
      ];
      combobox.click();
      await pause();
      return {
        selectOpen,
        selectClosed: [select.getAttribute("data-state"), select.getAttribute("aria-disabled")],
        comboboxOpen,
        comboboxClosed: [
          combobox.getAttribute("data-state"),
          combobox.getAttribute("aria-disabled"),
        ],
      };
    });
    expect(cycle).toEqual({
      selectOpen: ["open", "false"],
      selectClosed: ["closed", "false"],
      comboboxOpen: ["open", "false"],
      comboboxClosed: ["closed", "false"],
    });
    expect(errors).toEqual([]);
  }, 120_000);
});

async function createProofServer(root: string, middlewareMode: boolean): Promise<ViteDevServer> {
  const repository = process.cwd();
  return createServer({
    appType: middlewareMode ? "custom" : "spa",
    cacheDir: path.join(root, middlewareMode ? ".vite-ssr" : ".vite-browser"),
    configFile: false,
    logLevel: "silent",
    plugins: [svelte({ configFile: false })],
    resolve: {
      alias: [
        {
          find: /^@starwind-ui\/runtime\/(.+)$/,
          replacement: path.join(repository, "packages/runtime/src/components/$1/index.ts"),
        },
        {
          find: /^@starwind-ui\/svelte\/(.+)$/,
          replacement: path.join(repository, "packages/svelte/src/$1/index.ts"),
        },
      ],
    },
    root,
    server: middlewareMode
      ? { middlewareMode: true, watch: null, hmr: false, ws: false, fs: { allow: [repository] } }
      : {
          host: "127.0.0.1",
          port: 0,
          strictPort: false,
          watch: null,
          hmr: false,
          fs: { allow: [repository] },
        },
  });
}

const APP_SOURCE = String.raw`<script lang="ts">
  import { Combobox } from "@starwind-ui/svelte/combobox";
  import { NavigationMenu } from "@starwind-ui/svelte/navigation-menu";
  import { Select } from "@starwind-ui/svelte/select";
  let extra = $state(false);
</script>

<button type="button" data-testid="add-item" onclick={() => (extra = true)}>Add</button>

<NavigationMenu.Root defaultValue="a" data-testid="nm-root">
  <NavigationMenu.List>
    <NavigationMenu.Item value="a">
      <NavigationMenu.Trigger data-testid="nm-trigger">A <NavigationMenu.Icon data-testid="nm-icon" /></NavigationMenu.Trigger>
      <NavigationMenu.Content>Body A</NavigationMenu.Content>
    </NavigationMenu.Item>
    {#if extra}
      <NavigationMenu.Item value="b">
        <NavigationMenu.Trigger data-testid="nm-trigger-b">B</NavigationMenu.Trigger>
        <NavigationMenu.Content>Body B</NavigationMenu.Content>
      </NavigationMenu.Item>
    {/if}
  </NavigationMenu.List>
  <NavigationMenu.Portal>
    <NavigationMenu.Positioner>
      <NavigationMenu.Popup><NavigationMenu.Viewport /></NavigationMenu.Popup>
    </NavigationMenu.Positioner>
  </NavigationMenu.Portal>
</NavigationMenu.Root>

<NavigationMenu.Root data-testid="nc-root">
  <NavigationMenu.List>
    <NavigationMenu.Item value="c">
      <NavigationMenu.Trigger>C <NavigationMenu.Icon data-testid="nc-icon" /></NavigationMenu.Trigger>
      <NavigationMenu.Content>Body C</NavigationMenu.Content>
    </NavigationMenu.Item>
  </NavigationMenu.List>
  <NavigationMenu.Portal>
    <NavigationMenu.Positioner>
      <NavigationMenu.Popup><NavigationMenu.Viewport /></NavigationMenu.Popup>
    </NavigationMenu.Positioner>
  </NavigationMenu.Portal>
</NavigationMenu.Root>

<Select.Root name="s">
  <Select.Trigger data-testid="s-trigger"><Select.Value placeholder="Pick" /></Select.Trigger>
  <Select.Positioner>
    <Select.Popup data-testid="s-popup">
      <Select.List>
        <Select.Item value="a"><Select.ItemText>Apple</Select.ItemText></Select.Item>
      </Select.List>
    </Select.Popup>
  </Select.Positioner>
</Select.Root>

<Combobox.Root name="c">
  <Combobox.InputGroup>
    <Combobox.Input />
    <Combobox.Trigger data-testid="c-trigger">Open</Combobox.Trigger>
  </Combobox.InputGroup>
  <Combobox.Positioner>
    <Combobox.Popup>
      <Combobox.List>
        <Combobox.Item value="a"><Combobox.ItemText>Apple</Combobox.ItemText></Combobox.Item>
      </Combobox.List>
    </Combobox.Popup>
  </Combobox.Positioner>
</Combobox.Root>
`;

const MAIN_SOURCE = String.raw`import { hydrate } from "svelte";
import App from "./App.svelte";

hydrate(App, { target: document.querySelector("#app")! });
document.documentElement.dataset.hydrated = "true";
`;
