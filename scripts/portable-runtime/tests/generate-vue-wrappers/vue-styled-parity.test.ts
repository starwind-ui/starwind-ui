import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const demoRequire = createRequire(path.join(repoRoot, "apps/vue-demo/package.json"));

const APP_SOURCE = String.raw`
<script setup lang="ts">
import { reactive, ref } from "vue";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "styled/carousel";
import { ColorPicker } from "styled/color-picker";
import {
  Combobox,
  ComboboxClear,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxTrigger,
} from "styled/combobox";
import { Dropdown, DropdownCheckboxItem, DropdownContent, DropdownTrigger } from "styled/dropdown";
import { Field, FieldControl, FieldSeparator, FieldValidity } from "styled/field";
import { InputGroup, InputGroupTextarea } from "styled/input-group";
import { NativeSelect, NativeSelectOption } from "styled/native-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "styled/select";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail } from "styled/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "styled/tabs";
import { Textarea } from "styled/textarea";
import { Toggle } from "styled/toggle";
import { ToggleGroup, ToggleGroupItem } from "styled/toggle-group";

const models = reactive({
  groupText: "group start",
  late: undefined as string | undefined,
  multiple: ["a", "c"] as string[],
  select: "b",
  text: "start",
  resetText: "kept",
  resetGroup: "group kept",
  ime: "",
  groupIme: "",
});
const format = ref<"hsl" | "rgb" | undefined>(undefined);
const selectModels = { models, format };
Object.assign(window, { __models: selectModels });
</script>

<template>
  <Toggle id="toggle">Toggle</Toggle>
  <Toggle id="toggle-disabled" disabled>Disabled</Toggle>

  <ToggleGroup id="toggle-group">
    <ToggleGroupItem id="toggle-group-a" value="a">A</ToggleGroupItem>
    <ToggleGroupItem id="toggle-group-b" value="b">B</ToggleGroupItem>
  </ToggleGroup>

  <Tabs default-value="a">
    <TabsList>
      <TabsTrigger id="tab-a" value="a">A</TabsTrigger>
      <TabsTrigger id="tab-b" value="b">B</TabsTrigger>
    </TabsList>
    <TabsContent value="a">A</TabsContent>
    <TabsContent value="b">B</TabsContent>
  </Tabs>

  <Field id="field" name="field">
    <FieldControl id="field-control" />
    <FieldValidity id="field-validity">Shown</FieldValidity>
  </Field>
  <Field id="field-email" name="email">
    <FieldControl id="field-email-control" type="email" />
  </Field>

  <Dropdown>
    <DropdownTrigger id="dropdown-trigger">Open</DropdownTrigger>
    <DropdownContent>
      <DropdownCheckboxItem id="dropdown-plain" value="plain">Plain</DropdownCheckboxItem>
      <DropdownCheckboxItem id="dropdown-seeded" value="seeded" default-checked>
        Seeded
      </DropdownCheckboxItem>
    </DropdownContent>
  </Dropdown>

  <SidebarProvider id="sidebar-persist" persist-open persistence-key="parity-sidebar">
    <SidebarRail id="sidebar-rail" />
    <SidebarRail id="sidebar-rail-label" aria-label="Seitenleiste" />
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton id="sidebar-tooltip" tooltip="Home">Home</SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarProvider>

  <form id="native-form">
    <Textarea id="textarea" v-model="models.text" name="text" />
    <Textarea id="textarea-late" v-model="models.late" name="late" />
    <Textarea id="textarea-free" name="free" />
    <NativeSelect id="native-select" v-model="models.select" name="single">
      <NativeSelectOption value="a">A</NativeSelectOption>
      <NativeSelectOption value="b">B</NativeSelectOption>
    </NativeSelect>
    <NativeSelect id="native-select-multiple" v-model="models.multiple" multiple name="many">
      <NativeSelectOption value="a">A</NativeSelectOption>
      <NativeSelectOption value="b">B</NativeSelectOption>
      <NativeSelectOption value="c">C</NativeSelectOption>
    </NativeSelect>
    <NativeSelect id="native-select-free" name="free-select">
      <NativeSelectOption value="a">A</NativeSelectOption>
      <NativeSelectOption value="b" selected>B</NativeSelectOption>
    </NativeSelect>
    <InputGroup>
      <InputGroupTextarea id="group-textarea" v-model="models.groupText" name="group" />
    </InputGroup>
  </form>

  <form id="textarea-form">
    <Textarea id="textarea-reset" v-model="models.resetText" name="kept" />
    <Textarea id="textarea-seed" default-value="seed" name="seed" />
    <Textarea id="textarea-ime" v-model="models.ime" name="ime" />
    <InputGroup>
      <InputGroupTextarea id="group-reset" v-model="models.resetGroup" name="group-reset" />
      <InputGroupTextarea id="group-seed" default-value="group seed" name="group-seed" />
      <InputGroupTextarea id="group-ime" v-model="models.groupIme" name="group-ime" />
    </InputGroup>
  </form>

  <form id="color-form">
    <ColorPicker
      id="color-rgb"
      default-value="#2563eb"
      :formats="['rgb', 'hsl']"
      inline
      format-control="native"
      name="rgb"
    />
    <ColorPicker
      id="color-bound"
      v-model:format="format"
      default-value="#2563eb"
      :formats="['rgb', 'hsl']"
      inline
      format-control="native"
      name="bound"
    />
    <ColorPicker id="color-default" default-value="#2563eb" inline format-control="native" name="plain" />
  </form>

  <Select id="select" default-value="a">
    <SelectTrigger id="select-trigger" size="lg"><SelectValue /></SelectTrigger>
    <SelectContent><SelectItem value="a">A</SelectItem></SelectContent>
  </Select>
  <Select>
    <SelectTrigger id="select-trigger-child" as-child size="sm"><button type="button">Pick</button></SelectTrigger>
    <SelectContent><SelectItem value="a">A</SelectItem></SelectContent>
  </Select>

  <FieldSeparator id="separator-empty" />
  <FieldSeparator id="separator-content">Or</FieldSeparator>

  <Carousel>
    <CarouselContent><CarouselItem>One</CarouselItem></CarouselContent>
    <CarouselPrevious id="carousel-previous" />
    <CarouselNext id="carousel-next" />
    <CarouselPrevious id="carousel-previous-label" aria-label="Zurueck" />
    <CarouselNext id="carousel-next-label" aria-label="Weiter" />
  </Carousel>

  <Combobox default-value="a">
    <ComboboxInput id="combobox-input" />
    <ComboboxTrigger as-child><button id="combobox-trigger-child" type="button">Open</button></ComboboxTrigger>
    <ComboboxClear as-child :show-icon="false"><button id="combobox-clear-child" type="button">Clear</button></ComboboxClear>
    <ComboboxClear as-child><button id="combobox-clear-default" type="button">Clear</button></ComboboxClear>
    <ComboboxContent><ComboboxItem value="a">A</ComboboxItem></ComboboxContent>
  </Combobox>
</template>
`;

const MAIN_SOURCE = `import { createApp } from "vue";
import App from "./App.vue";

const app = createApp(App);
window.__warnings = [];
app.config.warnHandler = (message) => window.__warnings.push(message);
app.config.errorHandler = (error) => window.__warnings.push(String(error));
app.mount("#app");
window.__ready = true;
`;

const SSR_APP_SOURCE = String.raw`
<script setup lang="ts">
import { ref } from "vue";
import { ColorPicker } from "styled/color-picker";
import { NativeSelect, NativeSelectOption } from "styled/native-select";
import { Textarea } from "styled/textarea";

const text = ref("server text");
const select = ref("b");
</script>

<template>
  <Textarea id="ssr-textarea" v-model="text" />
  <Textarea id="ssr-textarea-seed" default-value="server seed" />
  <NativeSelect id="ssr-select" v-model="select">
    <NativeSelectOption value="a">A</NativeSelectOption>
    <NativeSelectOption value="b">B</NativeSelectOption>
  </NativeSelect>
  <ColorPicker
    id="ssr-color"
    default-value="#2563eb"
    :formats="['rgb', 'hsl']"
    inline
    format-control="native"
  />
</template>
`;

const HYDRATE_SOURCE = `import { createSSRApp } from "vue";
import App from "./SsrApp.vue";

const app = createSSRApp(App);
window.__warnings = [];
app.config.warnHandler = (message) => window.__warnings.push(message);
app.mount("#app");
window.__ready = true;
`;

type Locator = { count(): Promise<number> };
type Page = {
  click(selector: string): Promise<void>;
  evaluate<T, A = undefined>(fn: (argument: A) => T | Promise<T>, argument?: A): Promise<T>;
  fill(selector: string, value: string): Promise<void>;
  focus(selector: string): Promise<void>;
  getAttribute(selector: string, name: string): Promise<string | null>;
  goto(url: string): Promise<unknown>;
  hover(selector: string): Promise<void>;
  inputValue(selector: string): Promise<string>;
  keyboard: { press(key: string): Promise<void>; type(text: string): Promise<void> };
  locator(selector: string): Locator;
  on(event: "console", handler: (message: { text(): string; type(): string }) => void): Page;
  on(event: "pageerror", handler: (error: unknown) => void): Page;
  selectOption(selector: string, value: string | string[]): Promise<unknown>;
  setDefaultTimeout(timeout: number): void;
  setViewportSize(size: { height: number; width: number }): Promise<void>;
  waitForFunction(
    fn: () => unknown,
    argument?: unknown,
    options?: { timeout: number },
  ): Promise<unknown>;
  waitForTimeout(ms: number): Promise<void>;
};
type Browser = { close(): Promise<void>; newPage(): Promise<Page> };
type ViteServer = {
  close(): Promise<void>;
  listen(): Promise<unknown>;
  ssrLoadModule(id: string): Promise<Record<string, never>>;
  resolvedUrls: { local: string[] } | null;
};

let browser: Browser | undefined;
let page: Page;
let root: string | undefined;
let server: ViteServer | undefined;
let url = "";
const pageErrors: string[] = [];

beforeAll(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-parity-"));
  await writeFile(
    path.join(root, "index.html"),
    '<!doctype html><div id="app"></div><script type="module" src="/main.ts"></script>\n',
  );
  await writeFile(path.join(root, "main.ts"), MAIN_SOURCE);
  await writeFile(path.join(root, "App.vue"), APP_SOURCE);
  await writeFile(path.join(root, "SsrApp.vue"), SSR_APP_SOURCE);
  await writeFile(path.join(root, "hydrate.ts"), HYDRATE_SOURCE);

  const vite = (await import(pathToFileURL(demoRequire.resolve("vite")).href)) as {
    createServer(options: Record<string, unknown>): Promise<ViteServer>;
  };
  const vuePlugin = (await import(
    pathToFileURL(demoRequire.resolve("@vitejs/plugin-vue")).href
  )) as { default(options?: Record<string, unknown>): unknown };
  server = await vite.createServer({
    cacheDir: path.join(root, ".vite"),
    configFile: false,
    logLevel: "silent",
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [vuePlugin.default()],
    resolve: {
      alias: [
        {
          find: /^styled\/(.+)$/,
          replacement: path.join(
            repoRoot,
            "apps/vue-demo/src/components/starwind-runtime/$1/index.ts",
          ),
        },
        {
          find: /^@starwind-ui\/vue\/(.+)$/,
          replacement: path.join(repoRoot, "packages/vue/src/$1/index.ts"),
        },
        {
          find: /^@starwind-ui\/runtime\/theme$/,
          replacement: path.join(repoRoot, "packages/runtime/src/theme/theme.ts"),
        },
        {
          find: /^@starwind-ui\/runtime\/(.+)$/,
          replacement: path.join(repoRoot, "packages/runtime/src/components/$1/index.ts"),
        },
        {
          find: /^@starwind-ui\/runtime$/,
          replacement: path.join(repoRoot, "packages/runtime/src/index.ts"),
        },
        {
          find: /^tailwind-variants$/,
          replacement: path.join(
            path.dirname(demoRequire.resolve("tailwind-variants/package.json")),
            "dist/index.js",
          ),
        },
        { find: /^vue$/, replacement: demoRequire.resolve("vue/dist/vue.runtime.esm-bundler.js") },
        {
          find: /^vue\/server-renderer$/,
          replacement: path.join(
            path.dirname(demoRequire.resolve("vue/package.json")),
            "server-renderer/index.mjs",
          ),
        },
      ],
    },
    root,
    server: {
      fs: { allow: [repoRoot, root] },
      host: "127.0.0.1",
      port: 0,
      strictPort: false,
      // A watched hydrate.html write would reload the page during the hydration check.
      watch: null,
    },
  });
  await server.listen();
  url = server.resolvedUrls?.local[0] ?? "";
  if (!url) throw new TypeError("Vue Styled parity server did not expose a local URL.");

  const { chromium } = (await import(pathToFileURL(demoRequire.resolve("playwright")).href)) as {
    chromium: { launch(options: { headless: boolean }): Promise<Browser> };
  };
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage();
  page.setDefaultTimeout(3_000);
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  await page.setViewportSize({ height: 2400, width: 1200 });
  await open();
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
  if (root) await rm(root, { force: true, recursive: true });
});

async function open(): Promise<void> {
  await page.goto(url);
  await page.waitForFunction(
    () => (window as unknown as { __ready?: boolean }).__ready === true,
    undefined,
    { timeout: 60_000 },
  );
  await page.waitForTimeout(150);
}

const tagName = (selector: string) =>
  page.evaluate((target) => document.querySelector(target)?.tagName ?? null, selector);
const activeId = () => page.evaluate(() => document.activeElement?.id ?? "");
const modelsRead = () =>
  page.evaluate(() => {
    const { format, models } = (
      window as unknown as {
        __models: { format: { value: unknown }; models: Record<string, unknown> };
      }
    ).__models;
    return { ...JSON.parse(JSON.stringify(models)), format: format.value };
  });
const formData = (selector: string) =>
  page.evaluate((target) => {
    const data = new FormData(document.querySelector<HTMLFormElement>(target)!);
    return [...data.entries()].filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    );
  }, selector);
const setModel = (name: string, value: unknown) =>
  page.evaluate(
    async ([key, next]) => {
      (window as unknown as { __models: { models: Record<string, unknown> } }).__models.models[
        key as string
      ] = next;
      await new Promise((resolve) => setTimeout(resolve, 30));
    },
    [name, value] as const,
  );

describe("Vue Styled parity with React", () => {
  it("mounts every fixture with no Vue warning or page error", async () => {
    expect(pageErrors).toEqual([]);
    expect(
      await page.evaluate(() => (window as unknown as { __warnings: string[] }).__warnings),
    ).toEqual([]);
  });

  describe("absent Boolean props stay undefined", () => {
    it("keeps the native Toggle and Toggle Group Item button", async () => {
      expect(await tagName("#toggle")).toBe("BUTTON");
      expect(await tagName("#toggle-disabled")).toBe("BUTTON");
      expect(
        await page.evaluate(
          () => document.querySelector<HTMLButtonElement>("#toggle-disabled")?.disabled,
        ),
      ).toBe(true);
      expect(await tagName("#toggle-group-a")).toBe("BUTTON");
    });

    it("loops focus in Toggle Group and Tabs by the Primitive default", async () => {
      await page.focus("#toggle-group-b");
      await page.keyboard.press("ArrowRight");
      expect(await activeId()).toBe("toggle-group-a");

      await page.click("#tab-b");
      await page.keyboard.press("ArrowRight");
      expect(await activeId()).toBe("tab-a");
    });

    it("lets Field state and validity stay Runtime-owned", async () => {
      expect(await page.getAttribute("#field-validity", "data-match")).not.toBe("false");
      await page.click("#field-control");
      await page.keyboard.type("x");
      await page.keyboard.press("Tab");
      await page.waitForTimeout(30);
      expect(await page.getAttribute("#field", "data-dirty")).not.toBeNull();
      expect(await page.getAttribute("#field", "data-touched")).not.toBeNull();

      await page.click("#field-email-control");
      await page.keyboard.type("not an email");
      await page.keyboard.press("Tab");
      await page.waitForTimeout(30);
      expect(await page.getAttribute("#field-email", "data-invalid")).not.toBeNull();
      expect(await page.getAttribute("#field-email-control", "data-error-visible")).not.toBeNull();
    });

    it("keeps uncontrolled Dropdown checkbox items working", async () => {
      await page.click("#dropdown-trigger");
      await page.waitForTimeout(80);
      expect(await page.getAttribute("#dropdown-plain", "aria-checked")).toBe("false");
      expect(await page.getAttribute("#dropdown-seeded", "aria-checked")).toBe("true");
      await page.click("#dropdown-plain");
      await page.waitForTimeout(80);
      if ((await page.getAttribute("#dropdown-plain", "aria-checked")) !== "true") {
        await page.click("#dropdown-trigger");
        await page.waitForTimeout(80);
      }
      expect(await page.getAttribute("#dropdown-plain", "aria-checked")).toBe("true");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(80);
    });

    it("writes Sidebar persistence to the default storage", async () => {
      await page.evaluate(() => localStorage.removeItem("parity-sidebar"));
      await page.click("#sidebar-rail");
      await page.waitForTimeout(40);
      expect(await page.evaluate(() => localStorage.getItem("parity-sidebar"))).toBe("false");
    });
  });

  describe("v-model on native controls", () => {
    it("writes the Textarea model in both directions", async () => {
      expect(await page.inputValue("#textarea")).toBe("start");
      await setModel("text", "from parent");
      expect(await page.inputValue("#textarea")).toBe("from parent");

      await page.fill("#textarea", "typed");
      expect((await modelsRead()).text).toBe("typed");
    });

    it("keeps the caret in place during a middle edit", async () => {
      await setModel("text", "hello");
      await page.evaluate(() => {
        const textarea = document.querySelector<HTMLTextAreaElement>("#textarea")!;
        textarea.focus();
        textarea.setSelectionRange(2, 2);
      });
      await page.keyboard.type("XY");
      expect(await page.inputValue("#textarea")).toBe("heXYllo");
      expect((await modelsRead()).text).toBe("heXYllo");
    });

    it("applies a Textarea model that starts undefined", async () => {
      expect(await page.inputValue("#textarea-late")).toBe("");
      await page.fill("#textarea-late", "typed first");
      expect((await modelsRead()).late).toBe("typed first");
      await setModel("late", "loaded later");
      expect(await page.inputValue("#textarea-late")).toBe("loaded later");
      await setModel("late", undefined);
    });

    it("keeps a Textarea with no model under the browser across parent updates", async () => {
      await page.fill("#textarea-free", "free text");
      await setModel("text", "parent update");
      expect(await page.inputValue("#textarea-free")).toBe("free text");
    });

    it("forwards the model through Input Group Textarea", async () => {
      expect(await page.inputValue("#group-textarea")).toBe("group start");
      await setModel("groupText", "group parent");
      expect(await page.inputValue("#group-textarea")).toBe("group parent");
      await page.fill("#group-textarea", "group typed");
      expect((await modelsRead()).groupText).toBe("group typed");
    });

    for (const [id, key] of [
      ["textarea-reset", "resetText"],
      ["group-reset", "resetGroup"],
    ] as const) {
      it(`keeps the model and the field after a form reset on #${id}`, async () => {
        const before = (await modelsRead())[key];
        await page.evaluate(() => {
          document.querySelector<HTMLFormElement>("#textarea-form")!.reset();
        });
        await page.waitForTimeout(40);
        expect(await page.inputValue(`#${id}`)).toBe(before);
        expect((await modelsRead())[key]).toBe(before);
        await page.fill(`#${id}`, "edited");
        await page.evaluate(() => {
          document.querySelector<HTMLFormElement>("#textarea-form")!.reset();
        });
        await page.waitForTimeout(40);
        expect(await page.inputValue(`#${id}`)).toBe("edited");
        expect((await modelsRead())[key]).toBe("edited");
      });
    }

    for (const [id, seed] of [
      ["textarea-seed", "seed"],
      ["group-seed", "group seed"],
    ] as const) {
      it(`renders default-value and resets to it on #${id}`, async () => {
        expect(await page.inputValue(`#${id}`)).toBe(seed);
        await page.fill(`#${id}`, "typed");
        await page.evaluate(() => {
          document.querySelector<HTMLFormElement>("#textarea-form")!.reset();
        });
        await page.waitForTimeout(40);
        expect(await page.inputValue(`#${id}`)).toBe(seed);
      });
    }

    for (const [id, key] of [
      ["textarea-ime", "ime"],
      ["group-ime", "groupIme"],
    ] as const) {
      it(`waits for composition to end on #${id}`, async () => {
        const composed = (target: string, text: string, step: "start" | "update" | "end") =>
          page.evaluate(
            ([selector, value, phase]) => {
              const textarea = document.querySelector<HTMLTextAreaElement>(selector!)!;
              if (phase === "start") {
                textarea.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
              }
              if (phase === "end") {
                textarea.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
                return;
              }
              textarea.value = value!;
              textarea.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true }));
            },
            [target, text, step],
          );
        await composed(`#${id}`, "k", "start");
        await composed(`#${id}`, "か", "update");
        await page.waitForTimeout(20);
        expect((await modelsRead())[key]).toBe("");
        expect(await page.inputValue(`#${id}`)).toBe("か");
        await composed(`#${id}`, "か", "end");
        await page.waitForTimeout(20);
        expect((await modelsRead())[key]).toBe("か");
      });
    }

    it("writes the Native Select model in both directions", async () => {
      expect(await page.inputValue("#native-select")).toBe("b");
      await page.selectOption("#native-select", "a");
      expect((await modelsRead()).select).toBe("a");
      await setModel("select", "b");
      expect(await page.inputValue("#native-select")).toBe("b");
    });

    it("supports an array model on a multiple Native Select", async () => {
      const selected = () =>
        page.evaluate(() =>
          Array.from(
            document.querySelector<HTMLSelectElement>("#native-select-multiple")!.selectedOptions,
            (option) => option.value,
          ),
        );
      expect(await selected()).toEqual(["a", "c"]);
      await setModel("multiple", ["b"]);
      expect(await selected()).toEqual(["b"]);
      await page.selectOption("#native-select-multiple", ["a", "b"]);
      expect((await modelsRead()).multiple).toEqual(["a", "b"]);
    });

    it("leaves a Native Select with no model under the browser", async () => {
      expect(await page.inputValue("#native-select-free")).toBe("b");
    });
  });

  describe("Color Picker formats", () => {
    const options = (id: string) =>
      page.evaluate(
        (target) =>
          Array.from(
            document.querySelector(target)!.querySelectorAll<HTMLOptionElement>("select option"),
            (option) => option.value,
          ),
        id,
      );
    const select = (id: string) => `${id} select[data-slot="color-picker-native-format-select"]`;

    it("starts on the first listed format with no added option", async () => {
      expect(await options("#color-rgb")).toEqual(["rgb", "hsl"]);
      expect(await page.inputValue(select("#color-rgb"))).toBe("rgb");
      expect(await page.getAttribute("#color-rgb", "data-format")).toBe("rgb");
      expect(Object.fromEntries(await formData("#color-form")).rgb).toBe("rgb(37, 99, 235)");
    });

    it("keeps the default format list on HEX", async () => {
      expect(await page.inputValue(select("#color-default"))).toBe("hex");
      expect(Object.fromEntries(await formData("#color-form")).plain).toBe("#2563eb");
    });

    it("lets the user change the format with no format prop", async () => {
      await page.selectOption(select("#color-rgb"), "hsl");
      await page.waitForTimeout(40);
      expect(await page.inputValue(select("#color-rgb"))).toBe("hsl");
      expect(await page.getAttribute("#color-rgb", "data-format")).toBe("hsl");
    });

    it("publishes to v-model:format and follows a later parent write", async () => {
      await page.selectOption(select("#color-bound"), "hsl");
      await page.waitForTimeout(40);
      expect((await modelsRead()).format).toBe("hsl");
      await page.evaluate(async () => {
        (window as unknown as { __models: { format: { value: unknown } } }).__models.format.value =
          "rgb";
        await new Promise((resolve) => setTimeout(resolve, 40));
      });
      expect(await page.inputValue(select("#color-bound"))).toBe("rgb");

      await page.evaluate(async () => {
        (window as unknown as { __models: { format: { value: unknown } } }).__models.format.value =
          undefined;
        await new Promise((resolve) => setTimeout(resolve, 40));
      });
      expect(await page.inputValue(select("#color-bound"))).toBe("rgb");
    });
  });

  describe("small data attribute and label gaps", () => {
    it("renders Select Trigger data-size in both branches", async () => {
      expect(await page.getAttribute("#select-trigger", "data-size")).toBe("lg");
      expect(await page.getAttribute("#select-trigger-child", "data-size")).toBe("sm");
    });

    it("renders Field Separator data-content", async () => {
      expect(await page.getAttribute("#separator-empty", "data-content")).toBe("false");
      expect(await page.getAttribute("#separator-content", "data-content")).toBe("true");
    });

    it("ends Sidebar Menu Button with its own data-slot under a tooltip", async () => {
      expect(await page.getAttribute("#sidebar-tooltip", "data-slot")).toBe("sidebar-menu-button");
      expect(await page.getAttribute("#sidebar-tooltip", "data-sw-tooltip-trigger")).toBe("");
    });

    it("keeps default labels and lets a consumer label win", async () => {
      expect(await page.getAttribute("#carousel-next", "aria-label")).toBe("Next slide");
      expect(await page.getAttribute("#carousel-previous", "aria-label")).toBe("Previous slide");
      expect(await page.getAttribute("#sidebar-rail", "aria-label")).toBe("Toggle Sidebar");
      expect(await page.getAttribute("#carousel-next-label", "aria-label")).toBe("Weiter");
      expect(await page.getAttribute("#carousel-previous-label", "aria-label")).toBe("Zurueck");
      expect(await page.getAttribute("#sidebar-rail-label", "aria-label")).toBe("Seitenleiste");
    });
  });

  describe("server render and hydration", () => {
    it("renders models and the listed format on the server, then hydrates with no mismatch", async () => {
      const { createSSRApp } = (await server!.ssrLoadModule("vue")) as unknown as {
        createSSRApp(component: unknown): unknown;
      };
      const { renderToString } = (await server!.ssrLoadModule(
        "vue/server-renderer",
      )) as unknown as { renderToString(app: unknown): Promise<string> };
      const { default: SsrApp } = await server!.ssrLoadModule("/SsrApp.vue");
      const html = await renderToString(createSSRApp(SsrApp));

      expect(html).toMatch(/<textarea[^>]*id="ssr-textarea"[^>]*>server text<\/textarea>/);
      expect(html).toMatch(/<textarea[^>]*id="ssr-textarea-seed"[^>]*>server seed<\/textarea>/);
      expect(html).toMatch(
        /id="ssr-color"[^>]*data-format="rgb"|data-format="rgb"[^>]*id="ssr-color"/,
      );

      await writeFile(
        path.join(root!, "hydrate.html"),
        `<!doctype html><div id="app">${html}</div><script type="module" src="/hydrate.ts"></script>\n`,
      );
      const hydrationErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") hydrationErrors.push(message.text());
      });
      await page.goto(`${url}hydrate.html`);
      await page.waitForFunction(
        () => (window as unknown as { __ready?: boolean }).__ready === true,
        undefined,
        { timeout: 30_000 },
      );
      await page.waitForTimeout(100);

      expect(hydrationErrors).toEqual([]);
      expect(
        await page.evaluate(() => (window as unknown as { __warnings: string[] }).__warnings),
      ).toEqual([]);
      expect(await page.inputValue("#ssr-textarea")).toBe("server text");
      expect(await page.inputValue("#ssr-select")).toBe("b");
      expect(await page.getAttribute("#ssr-color", "data-format")).toBe("rgb");
      await open();
    });
  });

  describe("Combobox as-child", () => {
    it("clones the Trigger child as React does", async () => {
      expect(await page.getAttribute("#combobox-trigger-child", "data-slot")).toBe(
        "combobox-trigger",
      );
      expect(await page.getAttribute("#combobox-trigger-child", "data-sw-combobox-trigger")).toBe(
        "",
      );
    });

    it("clones the Clear child when the icon is off", async () => {
      expect(await page.getAttribute("#combobox-clear-child", "data-slot")).toBe("combobox-clear");
      expect(await page.getAttribute("#combobox-clear-child", "aria-label")).toBe(
        "Clear selection",
      );
    });

    it("clones the Clear child with the default icon setting and adds no second button", async () => {
      expect(await tagName("#combobox-clear-default")).toBe("BUTTON");
      expect(await page.getAttribute("#combobox-clear-default", "data-slot")).toBe(
        "combobox-clear",
      );
      expect(
        await page.evaluate(() => ({
          nested: Boolean(document.querySelector("button button")),
          icon: Boolean(document.querySelector("#combobox-clear-default svg")),
        })),
      ).toEqual({ nested: false, icon: false });
    });
  });
});
