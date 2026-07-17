import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import type { AddressInfo } from "node:net";
import { promisify } from "node:util";
import { cp, readFile, symlink } from "node:fs/promises";

import { colorPickerRuntimeAdapterContract } from "../../contracts/primitive/color-picker.js";
import { assertColorPickerFamilyProjected } from "../../renderers/primitive-output-model/index.js";
import {
  buildColorPickerAdapterOutputModel,
  buildColorPickerSpecializedAdapterSpec,
} from "../../renderers/specialized-adapter-spec/index.js";
import { astroFrameworkAdapterTarget } from "../../renderers/framework-adapters/index.js";
import type { GetTempRoot } from "./shared.js";
import {
  expect,
  generateAstroPrimitiveWrappers,
  generateStarwindAstroWrappers,
  it,
  mkdir,
  path,
  readGeneratedFile,
  readGeneratedTree,
  writeFile,
} from "./shared.js";

const execFileAsync = promisify(execFile);

export function defineAstroColorPickerOutputTests(getTempRoot: GetTempRoot): void {
  it("generates the complete styled Color Picker family with function-child SSR projection", async () => {
    const tempRoot = getTempRoot();
    const outputDir = "generated/styled/astro";
    await generateStarwindAstroWrappers({ outputDir, repoRoot: tempRoot });

    const tree = await readGeneratedTree(path.join(tempRoot, outputDir, "color-picker"));
    const popoverOpen = tree["ColorPicker.astro"].match(/<Popover[\s\S]*?>/)?.[0];
    expect(Object.keys(tree).sort()).toEqual(
      [
        "ColorPicker.astro",
        "ColorPickerArea.astro",
        "ColorPickerAreaThumb.astro",
        "ColorPickerChannelInput.astro",
        "ColorPickerChannelSlider.astro",
        "ColorPickerClear.astro",
        "ColorPickerContent.astro",
        "ColorPickerControl.astro",
        "ColorPickerEyeDropper.astro",
        "ColorPickerFormatSelect.astro",
        "ColorPickerHiddenInput.astro",
        "ColorPickerInput.astro",
        "ColorPickerLabel.astro",
        "ColorPickerNativeFormatSelect.astro",
        "ColorPickerRoot.astro",
        "ColorPickerSliders.astro",
        "ColorPickerSwatch.astro",
        "ColorPickerSwatchGroup.astro",
        "ColorPickerTrigger.astro",
        "ColorPickerValueInput.astro",
        "ColorPickerValueSwatch.astro",
        "index.ts",
        "styles.css",
        "variants.ts",
      ].sort(),
    );
    expect(tree["ColorPicker.astro"]).toContain(
      'async (initial: import("@starwind-ui/astro/color-picker").ColorPickerRenderProjection)',
    );
    expect(tree["ColorPicker.astro"]).toContain('Astro.slots.render("default", [initial])');
    expect(tree["ColorPicker.astro"]).toContain("data-floating-root={true}");
    expect(tree["ColorPicker.astro"]).toContain("<Popover");
    expect(tree["ColorPicker.astro"]).toContain("<ColorPickerRoot");
    expect(tree["ColorPicker.astro"]).not.toContain("ComponentProps<typeof Popover>");
    expect(tree["ColorPicker.astro"]).toContain("defaultOpen={defaultOpen}");
    expect(popoverOpen).not.toContain("{...rest}");
    expect(tree["ColorPicker.astro"]).toMatch(
      /<ColorPickerRoot[\s\S]*?\{\.\.\.rest\}[\s\S]*?data-floating-root/,
    );
    expect(tree["ColorPickerRoot.astro"]).toContain(
      'async (initial: import("@starwind-ui/astro/color-picker").ColorPickerRenderProjection)',
    );
    expect(tree["ColorPickerRoot.astro"]).toContain('Astro.slots.render("default", [initial])');
    expect(tree["ColorPickerRoot.astro"]).toContain("<ColorPickerPrimitive.Root");
    expect(tree["ColorPickerRoot.astro"]).not.toContain("Popover");
    expect(tree["ColorPickerRoot.astro"]).not.toContain("data-floating-root");
    expect(tree["ColorPickerContent.astro"]).toContain("<PopoverContent");
    expect(tree["ColorPickerContent.astro"]).toContain("initial={initial?.area()}");
    expect(tree["ColorPickerContent.astro"]).toContain("initial={initial}");
    expect(tree["ColorPickerContent.astro"]).toContain(
      "initial={initial?.eyeDropperTrigger.initial}",
    );
    expect(tree["ColorPickerContent.astro"]).toContain("initial={initial?.clear.initial}");
    expect(tree["ColorPickerContent.astro"]).toContain('<slot name="swatches" />');
    expect(tree["ColorPickerContent.astro"]).toContain(
      'import ColorPicker from "@tabler/icons/outline/color-picker.svg";',
    );
    expect(tree["ColorPickerContent.astro"]).toContain(
      'const inputSize = size === "lg" ? "md" : "sm";',
    );
    expect(tree["ColorPickerContent.astro"]).toContain(
      'const hasSwatches = Astro.slots.has("swatches");',
    );
    expect(tree["ColorPickerContent.astro"]).toMatch(
      /<ColorPicker\s+class="size-4"\s+aria-hidden="true"/,
    );
    expect(tree["ColorPickerContent.astro"]).not.toContain(">Pick<");
    expect(tree["ColorPickerContent.astro"]).toContain("size={inputSize}");
    expect(tree["ColorPickerContent.astro"]).toContain("hasSwatches || showClear");
    expect(tree["ColorPickerContent.astro"].indexOf('<slot name="swatches" />')).toBeLessThan(
      tree["ColorPickerContent.astro"].indexOf("<ColorPickerClear"),
    );
    expect(tree["ColorPickerInput.astro"]).toContain("initial={initial?.valueInput.initial}");
    expect(tree["ColorPickerInput.astro"]).toContain("initial={initial?.formatSelect.initial}");
    expect(tree["ColorPickerInput.astro"]).toContain("initial={initial?.formatControl.initial}");
    expect(tree["ColorPickerValueInput.astro"]).toContain('Omit<HTMLAttributes<"input">, "size">');
    expect(tree["ColorPickerNativeFormatSelect.astro"]).toContain(
      "initial?.properties.value ?? rest.value",
    );
    expect(tree["ColorPickerNativeFormatSelect.astro"]).toContain(
      'selected={(initial?.properties.value ?? rest.value) === "rgb"}',
    );
    expect(tree["ColorPickerFormatSelect.astro"]).toContain("initial={initial}");
    expect(tree["ColorPickerFormatSelect.astro"]).toContain(
      'data-sw-color-picker-format-options=""',
    );
    expect(tree["styles.css"]).toContain(
      '[data-sw-color-picker][data-floating-root] > [data-slot="select-positioner"]:has(> [data-sw-color-picker-format-options])',
    );
    expect(tree["styles.css"]).toContain("--sw-color-picker-channel-gradient");
    expect(tree["styles.css"]).toContain('data-has-swatches="false"');
    expect(tree["styles.css"]).toContain('[data-slot="color-picker-value-swatch"] {');
    expect(tree["variants.ts"]).toContain('sm: "text-sm"');
    expect(tree["variants.ts"]).toContain('sm: "size-6"');
    expect(tree["variants.ts"]).toContain('sm: "h-2.5');
    expect(tree["variants.ts"]).toContain('lg: "text-lg"');
    expect(tree["index.ts"]).toContain("Root: ColorPicker");
    expect(tree["index.ts"]).toContain("InlineRoot: ColorPickerRoot");
    expect(Object.values(tree).join("\n")).not.toMatch(/(?:class|data-[\w-]+)=["'][^"']*starwind-/);

    const first = tree;
    await generateStarwindAstroWrappers({ outputDir, repoRoot: tempRoot });
    expect(await readGeneratedTree(path.join(tempRoot, outputDir, "color-picker"))).toEqual(first);
  });

  it("server-renders complete styled Color Picker subtrees from the initial projection", async () => {
    const tempRoot = getTempRoot();
    const appRoot = path.join(tempRoot, "astro-styled-color-picker-ssr");
    const pageDir = path.join(appRoot, "src/pages");
    await mkdir(pageDir, { recursive: true });
    await linkAstroFixtureDependencies(appRoot);
    await cp(
      path.resolve("apps/demo/src/components/starwind-runtime"),
      path.join(appRoot, "src/vendor/starwind-runtime"),
      { recursive: true },
    );
    await cp(path.resolve("packages/astro/src"), path.join(appRoot, "src/vendor/starwind-astro"), {
      recursive: true,
    });
    await cp(
      path.resolve("packages/runtime/src"),
      path.join(appRoot, "src/vendor/starwind-runtime-core"),
      {
        recursive: true,
      },
    );
    await writeFile(path.join(appRoot, "astro.config.mjs"), renderAstroFixtureConfig());
    const styledIndex = "../vendor/starwind-runtime/color-picker/index.ts";
    const primitiveIndex = "../vendor/starwind-astro/color-picker/index.ts";
    await writeFile(
      path.join(pageDir, "index.astro"),
      renderStyledFixture(styledIndex, primitiveIndex),
    );

    const require = createRequire(path.resolve("packages/astro/package.json"));
    const astroPackage = require.resolve("astro/package.json");
    const astroBin = path.join(path.dirname(astroPackage), "bin/astro.mjs");
    await execFileAsync(process.execPath, [astroBin, "build", "--root", appRoot], {
      cwd: appRoot,
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
    });

    const html = await readFile(path.join(appRoot, "dist/index.html"), "utf8");
    const inlineRoot = html.match(/<div(?=[^>]*id="inline-picker")[^>]*>/)?.[0];
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("data-floating-root");
    expect(inlineRoot).toContain("data-sw-color-picker");
    expect(inlineRoot).not.toContain("data-floating-root");
    expect(html.match(/data-sw-popover(?:[\s=>])/g)).toHaveLength(1);
    expect(html).toContain('data-format="hsl"');
    expect(html).not.toContain('data-alpha="false"');
    expect(inlineRoot).toContain("data-alpha");
    expect(html).toContain('data-slot="color-picker-area"');
    expect(html).toContain('data-slot="color-picker-channel-slider"');
    expect(html).toContain('data-channel="hue"');
    expect(html).toContain('data-step="7"');
    expect(html).toContain('data-slot="color-picker-value-input"');
    expect(html).toContain('data-slot="color-picker-format-control"');
    expect(html).toContain('data-slot="color-picker-native-format-select"');
    expect(html).toMatch(
      /<option(?=[^>]*value="hsl")(?=[^>]*selected(?:[=\s>]))[^>]*>\s*HSL\s*<\/option>/,
    );
    expect(html).toContain('data-slot="color-picker-value-swatch"');
    expect(html).toContain('data-slot="color-picker-swatch"');
    expect(html).toMatch(/<button(?=[^>]*data-sw-color-picker-swatch)(?=[^>]*data-selected)[^>]*>/);
    expect(html).toMatch(
      /data-slot="popover-content"[\s\S]*data-slot="color-picker-area"[\s\S]*data-slot="color-picker-channel-slider"[\s\S]*data-slot="color-picker-value-input"/,
    );
    expect(html.match(/--sw-color-picker-area-x:/g)).toHaveLength(2);
    expect(html.match(/--sw-color-picker-channel-position:/g)).toHaveLength(2);
    expect(html.match(/--sw-color-picker-area-thumb-color:/g)).toHaveLength(2);
    expect(html.match(/--sw-color-picker-channel-thumb-color:/g)).toHaveLength(2);
    expect(html).toMatch(
      /<input(?=[^>]*data-slot="color-picker-hidden-input")(?=[^>]*name="theme")(?=[^>]*value="hsl\(210, 50%, 40%\)")[^>]*>/,
    );
    const formProxy = html.match(/<input(?=[^>]*data-slot="color-picker-hidden-input")[^>]*>/)?.[0];
    expect(formProxy).toContain('type="text"');
    expect(formProxy).toContain('aria-hidden="true"');
    expect(formProxy).toContain('tabindex="-1"');
    expect(formProxy).toContain("position:absolute");
    expect(formProxy).not.toContain(" hidden");
    expect(html.match(/data-sw-color-picker-initial-owned/g)?.length).toBeGreaterThanOrEqual(7);
    expect(html).toContain("--sw-color-picker-area-x:");
    expect(html).toContain("--sw-color-picker-channel-position:");

    const reactDemoRequire = createRequire(path.resolve("apps/react-demo/package.json"));
    const { chromium } = reactDemoRequire("playwright") as {
      chromium: { launch(options: { headless: boolean }): Promise<any> };
    };
    await withStaticServer(path.join(appRoot, "dist"), async (url) => {
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      const pageErrors: Error[] = [];
      page.on("pageerror", (error: Error) => pageErrors.push(error));
      try {
        await page.goto(url, { waitUntil: "networkidle" });
        const inline = page.locator("#inline-picker");
        expect(await inline.locator("[data-sw-popover]").count()).toBe(0);
        expect(await inline.getAttribute("data-floating-root")).toBeNull();
        const input = inline.locator("[data-sw-color-picker-value-input]");
        await input.fill("rgb(0, 255, 0)");
        await input.press("Enter");
        await expect.poll(() => inline.getAttribute("data-value")).toBe("#00ff00");
        expect(pageErrors).toEqual([]);
      } finally {
        await browser.close();
      }
    });
  }, 60_000);

  it("projects the complete Color Picker family through the Runtime semantic projector", async () => {
    const tempRoot = getTempRoot();
    const outputRoot = path.join(tempRoot, "generated/primitives/astro");

    const projected = astroFrameworkAdapterTarget.primitive.outputModel.projectSpecialized(
      buildColorPickerAdapterOutputModel(
        buildColorPickerSpecializedAdapterSpec(colorPickerRuntimeAdapterContract),
      ),
    );
    expect(() => assertColorPickerFamilyProjected(projected, "astro")).not.toThrow();

    await generateAstroPrimitiveWrappers({
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });

    const tree = await readGeneratedTree(path.join(outputRoot, "color-picker"));
    const componentFiles = Object.keys(tree).filter((file) => file.endsWith(".astro"));
    expect(componentFiles).toHaveLength(23);
    expect(Object.keys(tree).sort()).toEqual(
      [
        ...Object.values(
          buildColorPickerSpecializedAdapterSpec(colorPickerRuntimeAdapterContract).colorPicker
            .exports.parts,
        ).map((name) => `${name}.astro`),
        "ColorPickerRenderProjection.ts",
        "index.ts",
      ].sort(),
    );

    const root = tree["ColorPickerRoot.astro"];
    const projection = tree["ColorPickerRenderProjection.ts"];
    const index = tree["index.ts"];
    expect(root).toContain('Astro.slots.render("default", [initial])');
    expect(root).toContain("createColorPickerInitialState");
    expect(root).toContain("projectColorPickerInitialPart");
    expect(root?.match(/createColorPicker\(root\)/g)).toHaveLength(1);
    expect(root).not.toMatch(/Astro\.locals|AsyncLocalStorage|moduleState|parseColor/);
    expect(projection).toContain("projectColorPickerInitialPart(state, request)");
    expect(projection).toContain("area(options = {})");
    expect(projection).toContain("channelSlider(options)");
    expect(projection).toContain('formatControl: simple("formatControl")');
    expect(projection).not.toMatch(/parseColor|rgb\s*=>|hsl\s*=>|hsb\s*=>/i);
    expect(index).toContain("const ColorPicker = {");
    expect(index).toContain(`export type {
  ColorPickerAreaProjection,
  ColorPickerChannelSliderProjection,
  ColorPickerInitialProps,
  ColorPickerRenderProjection,
} from "./ColorPickerRenderProjection";`);
    expect(index).toContain("createColorPickerInitialState");
    expect(index).toContain("projectColorPickerInitialPart");
    expect(index).toContain("FormatControl: ColorPickerFormatControl");
    expect(index).toContain("ColorPickerFormatControl,");
    expect(tree["ColorPickerFormatControl.astro"]).toContain(
      'assertColorPickerInitialPart("formatControl", suppliedInitial)',
    );
    expect(tree["ColorPickerFormatControl.astro"]).toContain("data-sw-color-picker-format-control");
    expect(tree["ColorPickerAreaThumb.astro"]).toContain("mergeColorPickerInitialStyles");
    expect(tree["ColorPickerChannelSliderThumb.astro"]).toContain("mergeColorPickerInitialStyles");
  });

  it("keeps Color Picker projection output deterministic", async () => {
    const tempRoot = getTempRoot();
    const options = { outputDir: "generated/primitives/astro", repoRoot: tempRoot };
    const outputRoot = path.join(tempRoot, options.outputDir, "color-picker");
    await generateAstroPrimitiveWrappers(options);
    const first = await readGeneratedTree(outputRoot);
    await generateAstroPrimitiveWrappers(options);
    expect(await readGeneratedTree(outputRoot)).toEqual(first);
  });

  it("server-renders isolated sibling and nested Color Pickers before scripts execute", async () => {
    const tempRoot = getTempRoot();
    const appRoot = path.join(tempRoot, "astro-color-picker-ssr");
    const pageDir = path.join(appRoot, "src/pages");
    await mkdir(pageDir, { recursive: true });
    await linkAstroFixtureDependencies(appRoot);
    await cp(path.resolve("packages/astro/src"), path.join(appRoot, "src/vendor/starwind-astro"), {
      recursive: true,
    });
    await cp(
      path.resolve("packages/runtime/src"),
      path.join(appRoot, "src/vendor/starwind-runtime-core"),
      {
        recursive: true,
      },
    );
    await writeFile(path.join(appRoot, "astro.config.mjs"), renderAstroFixtureConfig());
    const primitiveIndex = "../vendor/starwind-astro/color-picker/index.ts";
    await writeFile(path.join(pageDir, "index.astro"), renderFixture(primitiveIndex));

    const require = createRequire(path.resolve("packages/astro/package.json"));
    const astroPackage = require.resolve("astro/package.json");
    const astroBin = path.join(path.dirname(astroPackage), "bin/astro.mjs");
    await execFileAsync(process.execPath, [astroBin, "build", "--root", appRoot], {
      cwd: appRoot,
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
    });

    const html = await readFile(path.join(appRoot, "dist/index.html"), "utf8");
    expect(html.match(/data-sw-color-picker(?:[\s=>])/g)).toHaveLength(3);
    expect(html.match(/data-sw-color-picker-hidden-input/g)).toHaveLength(3);
    expect(html).toContain('name="primary"');
    expect(html).toContain('form="palette-form"');
    expect(html).toContain('name="secondary"');
    expect(html).toContain('name="nested"');
    expect(html).toContain('data-format="hsl"');
    expect(html).not.toMatch(
      /data-(?:allow-empty|alpha|disabled|dragging|focused|invalid|readonly|required|selected|unsupported)="false"/,
    );
    expect(html).toMatch(
      /<select(?=[^>]*data-sw-color-picker-format-select)(?=[^>]*aria-readonly="false")[^>]*>/,
    );
    expect(html).toMatch(
      /<input(?=[^>]*data-sw-color-picker-value-input)(?=[^>]*aria-invalid="false")[^>]*>/,
    );
    expect(html).toMatch(
      /<div(?=[^>]*data-sw-color-picker-format-control)(?=[^>]*data-format="hsl")[^>]*>/,
    );
    const formatControl = html.match(/<div(?=[^>]*data-sw-color-picker-format-control)[^>]*>/)?.[0];
    expect(formatControl).not.toContain("data-disabled");
    expect(formatControl).not.toContain("data-readonly");
    expect(html).toMatch(
      /<div(?=[^>]*data-sw-color-picker-format-control)(?=[^>]*data-format="rgb")(?=[^>]*data-disabled)(?=[^>]*data-readonly)[^>]*>/,
    );
    expect(html).toContain("data-allow-empty");
    expect(html).toContain('data-locale="de-DE"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('aria-roledescription="2D Slider"');
    expect(html).toContain('aria-orientation="vertical"');
    expect(html).toContain("data-sw-color-picker-initial-owned=");
    expect(html).toContain("--sw-color-picker-area-x:");
    expect(html).toContain("--sw-color-picker-channel-position:");
    expect(html).toContain("--sw-color-picker-area-thumb-color:");
    expect(html).toContain("--sw-color-picker-channel-thumb-color:");
    expect(html).toMatch(/<button(?=[^>]*data-sw-color-picker-swatch)(?=[^>]*data-selected)[^>]*>/);
    expect(html).toMatch(/<button(?=[^>]*data-sw-color-picker-eye-dropper)(?=[^>]*hidden)[^>]*>/);
    expect(html).toMatch(
      /<input(?=[^>]*data-sw-color-picker-hidden-input)(?=[^>]*value(?:\s|>))[^>]*>/,
    );
  }, 60_000);
}

async function withStaticServer(root: string, run: (url: string) => Promise<void>): Promise<void> {
  const resolvedRoot = path.resolve(root);
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    const requested = path.resolve(resolvedRoot, pathname === "/" ? "index.html" : `.${pathname}`);
    if (!requested.startsWith(resolvedRoot)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(requested);
      const contentType = requested.endsWith(".js")
        ? "text/javascript"
        : requested.endsWith(".css")
          ? "text/css"
          : "text/html";
      response.writeHead(200, { "content-type": contentType }).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}/`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

function renderStyledFixture(indexPath: string, primitiveIndexPath: string): string {
  const source = indexPath.replaceAll("\\", "/");
  const primitiveSource = primitiveIndexPath.replaceAll("\\", "/");
  return `---
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerChannelSlider,
  ColorPickerContent,
  ColorPickerHiddenInput,
  ColorPickerInput,
  ColorPickerNativeFormatSelect,
  ColorPickerRoot,
  ColorPickerSwatch,
  ColorPickerSwatchGroup,
  ColorPickerValueSwatch,
} from "${source}";
import { parseColor } from "${primitiveSource}";
const objectDefaultValue = parseColor("#33669980")!;
---
<ColorPicker
  defaultValue={objectDefaultValue}
  format="hsl"
  alpha={false}
  name="theme"
  locale="ar-EG"
  dir="rtl"
>
  {(initial) => (
    <Fragment>
      <ColorPickerArea initial={initial.area({ xStep: 5, yStep: 10 })} />
      <ColorPickerChannelSlider initial={initial} channel="hue" step={7} />
      <ColorPickerInput initial={initial} />
      <ColorPickerNativeFormatSelect initial={initial.formatSelect.initial} />
      <ColorPickerValueSwatch initial={initial} />
      <ColorPickerSwatchGroup initial={initial.swatchGroup.initial}>
        <ColorPickerSwatch initial={initial} value="#33669980" />
      </ColorPickerSwatchGroup>
      <ColorPickerHiddenInput initial={initial.hiddenInput.initial} />
      <ColorPickerContent initial={initial} alpha={false} showEyeDropper showClear />
    </Fragment>
  )}
</ColorPicker>
<ColorPickerRoot id="inline-picker" defaultValue={objectDefaultValue} name="inline">
  {(initial) => (
    <Fragment>
      <ColorPickerInput initial={initial} />
      <ColorPickerHiddenInput initial={initial.hiddenInput.initial} />
    </Fragment>
  )}
</ColorPickerRoot>
`;
}

function renderFixture(primitiveIndexPath: string): string {
  return `---
import {
  ColorPickerArea,
  ColorPickerAreaBackground,
  ColorPickerAreaInput,
  ColorPickerAreaThumb,
  ColorPickerChannelInput,
  ColorPickerChannelSlider,
  ColorPickerChannelSliderInput,
  ColorPickerChannelSliderThumb,
  ColorPickerChannelSliderTrack,
  ColorPickerClear,
  ColorPickerControl,
  ColorPickerEyeDropperTrigger,
  ColorPickerFormatSelect,
  ColorPickerFormatControl,
  ColorPickerHiddenInput,
  ColorPickerLabel,
  ColorPickerRoot,
  ColorPickerSwatch,
  ColorPickerSwatchGroup,
  ColorPickerTransparencyGrid,
  ColorPickerValueInput,
  ColorPickerValueSwatch,
  ColorPickerValueText,
} from "${primitiveIndexPath}";
---
<form id="palette-form"></form>
<ColorPickerRoot
  id="primary-picker"
  defaultValue="#33669980"
  format="hsl"
  name="primary"
  form="palette-form"
  locale="de-DE"
  dir="rtl"
>
  {(initial) => {
    const area = initial.area({ xChannel: "saturation", yChannel: "brightness", xStep: 5, yStep: 10 });
    const hue = initial.channelSlider({ channel: "hue", step: 7 });
    return (
      <Fragment>
        <ColorPickerLabel id="primary-label" {...initial.label}>Primary</ColorPickerLabel>
        <ColorPickerControl {...initial.control}>
          <ColorPickerValueInput {...initial.valueInput} />
          <ColorPickerValueSwatch {...initial.valueSwatch} />
          <ColorPickerValueText {...initial.valueText} />
        </ColorPickerControl>
        <ColorPickerArea {...area.root}>
          <ColorPickerAreaBackground {...area.background} />
          <ColorPickerAreaThumb {...area.thumb} />
          <ColorPickerAreaInput {...area.input({ axis: "x", ariaLabelledBy: "primary-label" })} />
          <ColorPickerAreaInput {...area.input({ axis: "y", ariaLabelledBy: "primary-label" })} />
        </ColorPickerArea>
        <ColorPickerChannelSlider {...hue.root} channel="hue">
          <ColorPickerChannelSliderTrack {...hue.track} />
          <ColorPickerChannelSliderThumb {...hue.thumb} />
          <ColorPickerChannelSliderInput {...hue.input()} />
        </ColorPickerChannelSlider>
        <ColorPickerChannelInput {...initial.channelInput({ channel: "red" })} channel="red" />
        <ColorPickerFormatSelect {...initial.formatSelect} />
        <ColorPickerFormatControl {...initial.formatControl} />
        <ColorPickerTransparencyGrid {...initial.transparencyGrid} />
        <ColorPickerSwatchGroup {...initial.swatchGroup}>
          <ColorPickerSwatch {...initial.swatch({ value: "#33669980" })} swatchValue="#33669980" />
        </ColorPickerSwatchGroup>
        <ColorPickerEyeDropperTrigger {...initial.eyeDropperTrigger} />
        <ColorPickerClear {...initial.clear} />
        <ColorPickerHiddenInput {...initial.hiddenInput} />
        <ColorPickerRoot defaultValue="#00ff00" format="rgb" disabled readOnly name="nested">
          {(nested) => (
            <Fragment>
              <ColorPickerFormatControl {...nested.formatControl} />
              <ColorPickerHiddenInput {...nested.hiddenInput} />
            </Fragment>
          )}
        </ColorPickerRoot>
      </Fragment>
    );
  }}
</ColorPickerRoot>
<div dir="rtl">
  <ColorPickerRoot value={null} allowEmpty required alpha={false} name="secondary">
    {(initial) => (
      <Fragment>
        <ColorPickerValueInput {...initial.valueInput} />
        <ColorPickerValueText {...initial.valueText} />
        <ColorPickerHiddenInput {...initial.hiddenInput} />
      </Fragment>
    )}
  </ColorPickerRoot>
</div>
`;
}

function renderAstroFixtureConfig(): string {
  return `import { fileURLToPath } from "node:url";

export default {
  cacheDir: fileURLToPath(new URL("./.astro/", import.meta.url)),
  vite: {
    ssr: {
      noExternal: ["tailwind-variants"],
    },
    resolve: {
      alias: [
        {
          find: /^@starwind-ui\\/astro\\/(.+)$/,
          replacement: fileURLToPath(
            new URL("./src/vendor/starwind-astro/$1/index.ts", import.meta.url),
          ),
        },
        {
          find: "@starwind-ui/astro",
          replacement: fileURLToPath(
            new URL("./src/vendor/starwind-astro/index.ts", import.meta.url),
          ),
        },
        {
          find: /^@starwind-ui\\/runtime\\/(.+)$/,
          replacement: fileURLToPath(
            new URL("./src/vendor/starwind-runtime-core/components/$1/index.ts", import.meta.url),
          ),
        },
        {
          find: "@starwind-ui/runtime",
          replacement: fileURLToPath(
            new URL("./src/vendor/starwind-runtime-core/index.ts", import.meta.url),
          ),
        },
      ],
    },
  },
};
`;
}

async function linkAstroFixtureDependencies(appRoot: string): Promise<void> {
  const nodeModules = path.join(appRoot, "node_modules");
  await mkdir(nodeModules, { recursive: true });
  for (const [source, target] of [
    ["apps/demo/node_modules/astro", "astro"],
    ["apps/demo/node_modules/tailwind-variants", "tailwind-variants"],
    ["apps/demo/node_modules/@tabler", "@tabler"],
    ["packages/runtime/node_modules/@floating-ui", "@floating-ui"],
    ["packages/runtime/node_modules/embla-carousel", "embla-carousel"],
  ] as const) {
    await symlink(path.resolve(source), path.join(nodeModules, target), "junction");
  }
}
