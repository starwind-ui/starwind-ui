import assert from "node:assert/strict";
import path from "node:path";
import { type DirectionCase, type DirectionExpectation, ROOT } from "../../inventory.js";
import { legacyEvidence } from "../legacy-baseline/index.js";

const two = "<span data-first>A</span><span data-last>عنوان 42</span>";
const caller = '<svg data-custom viewBox="0 0 10 10"><path d="M1 2L8 5L1 8"/></svg>';
// Each row imports the named parts used below from the old Astro component's own barrel.
const samples: Record<string, string> = {
  accordion:
    '<Accordion><AccordionItem value="one"><AccordionTrigger><span data-first>عنوان 42</span></AccordionTrigger><AccordionContent>Details</AccordionContent></AccordionItem></Accordion>',
  alert:
    "<Alert><AlertTitle>" +
    two +
    "</AlertTitle><AlertDescription>Details</AlertDescription></Alert>",
  "aspect-ratio": "<AspectRatio ratio={2}><span>Ratio</span></AspectRatio>",
  avatar:
    '<div class="flex -space-x-2"><Avatar><AvatarFallback>A</AvatarFallback></Avatar><Avatar><AvatarFallback>B</AvatarFallback></Avatar></div>',
  badge: '<Badge href="#badge">' + two + "</Badge>",
  breadcrumb:
    "<Breadcrumb><BreadcrumbList><BreadcrumbItem>Home</BreadcrumbItem><BreadcrumbSeparator/><BreadcrumbItem>Docs</BreadcrumbItem><BreadcrumbSeparator>" +
    caller +
    "</BreadcrumbSeparator></BreadcrumbList></Breadcrumb>",
  button: "<Button>" + two + "</Button>",
  "button-group":
    '<ButtonGroup><Button variant="outline">A</Button><Button variant="outline">B</Button></ButtonGroup>',
  card: "<Card><CardHeader><CardTitle data-first>Title</CardTitle><CardAction data-last>Action</CardAction></CardHeader></Card>",
  checkbox: '<Checkbox label="عنوان 42" checked />',
  collapsible:
    "<Collapsible><CollapsibleTrigger>Details</CollapsibleTrigger><CollapsibleContent>Expanded</CollapsibleContent></Collapsible>",
  dropzone: "<Dropzone />",
  image: '<Image src={photo} alt="Sample image" />',
  input: '<Input type="file" aria-label="Attach file" />',
  "input-group":
    '<InputGroup><InputGroupAddon align="inline-start"><button>A</button></InputGroupAddon><InputGroupInput aria-label="Entry" /><InputGroupAddon align="inline-end"><button>B</button></InputGroupAddon></InputGroup>',
  item: "<Item><ItemMedia data-first>A</ItemMedia><ItemContent data-last>عنوان 42</ItemContent></Item>",
  kbd: "<KbdGroup><Kbd data-first>Ctrl</Kbd><Kbd data-last>S</Kbd></KbdGroup>",
  label: '<Label for="entry-SCOPE">عنوان 42</Label><input id="entry-SCOPE" />',
  "native-select":
    '<NativeSelect aria-label="Choice"><option value="a">First</option><option value="b">Second</option></NativeSelect>',
  pagination:
    '<Pagination><PaginationContent><PaginationItem><PaginationPrevious href="#prev">Prev</PaginationPrevious></PaginationItem><PaginationItem><PaginationNext href="#next">Next</PaginationNext></PaginationItem><PaginationItem><PaginationNext href="#custom">' +
    caller.replace("<svg ", '<svg slot="icon" ') +
    "</PaginationNext></PaginationItem></PaginationContent></Pagination>",
  prose:
    "<Prose><ul><li>قائمة</li></ul><blockquote>Quote</blockquote><details><summary>Closed</summary>Text</details><details open><summary>Open</summary>Text</details></Prose>",
  separator: "<Separator/>",
  skeleton: '<Skeleton class="w-32 h-8"/>',
  spinner: "<Spinner/>",
  table:
    '<Table><TableHeader><TableRow><TableHead data-first><button role="checkbox">A</button></TableHead><TableHead data-last>B</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell><button role="checkbox">A</button></TableCell><TableCell>B</TableCell></TableRow></TableBody></Table>',
  textarea: '<Textarea aria-label="Description"/>',
  "theme-toggle": "<ThemeToggle/>",
  toggle: "<Toggle>Toggle</Toggle>",
  video: '<Video src="data:video/mp4;base64," controls title="Sample video"/>',
};

const scopes = ["ltr-ltr", "rtl-rtl", "ltr-rtl", "rtl-ltr"];
const corrections = new Set([
  "accordion",
  "breadcrumb",
  "button-group",
  "checkbox",
  "input",
  "input-group",
  "native-select",
  "pagination",
  "prose",
  "table",
]);
const exceptions: Record<string, string> = {
  accordion: "The disclosure glyph points down in both directions.",
  avatar:
    "The old Astro barrel exposes individual avatars. The consumer owns the overlapping group margin.",
  breadcrumb: "Only the default separator turns. The consumer's SVG keeps its orientation.",
  checkbox:
    "The check stays over the native input. The label gap follows the compiled inline margin.",
  "native-select": "Vertical centering keeps the physical top and Y translation pair.",
  pagination:
    "Only built-in previous and next glyphs turn. DOM link order and custom art stay fixed.",
  prose: "An open details marker points down. A closed marker points toward inline end.",
  spinner: "The loader rotates in the same physical direction.",
  video: "Native media controls and the intrinsic aspect ratio keep browser semantics.",
};
const rows = legacyEvidence.filter((item) => item.owner === "legacy-static-layout");
assert.deepEqual(Object.keys(samples).sort(), rows.map((item) => item.id).sort());
export const cases: DirectionCase[] = rows.map(({ id }) => {
  const markup = samples[id]!;
  const names = [...new Set(Array.from(markup.matchAll(/<([A-Z]\w*)/g), (m) => m[1]!))];
  const photo = path.join(ROOT, "apps/demo/src/assets/images/pricing-9.jpg");
  const ownNames = names.filter((name) => id !== "button-group" || name !== "Button");
  const source = `---
${id === "button-group" ? 'import { Button } from "@/components/starwind/button";' : ""}
import { ${ownNames.join(", ")} } from "@direction/legacy-astro/${id}";
import "@direction/sheet";
${id === "image" ? "import photo from " + JSON.stringify(photo) + ";" : ""}
---
<html><body>${scopes
    .map((scope) => {
      const [outer, inner] = scope.split("-");
      return `<div dir="${outer}"><section dir="${inner}" data-scope="${scope}" style="width:320px">${markup.replaceAll("SCOPE", scope)}</section></div>`;
    })
    .join("\n")}</body></html>`;
  return {
    id: `legacy-layout-${id}`,
    row: `legacy:${id}`,
    acceptance: ["SPEC-AC-01", "SPEC-AC-12", "SPEC-AC-13"],
    physicalExceptions: exceptions[id] ? [exceptions[id]!] : [],
    fixtures: { astro: { source, exports: ownNames, assertions: scopes } },
  };
});

export const expectations: DirectionExpectation[] = rows.map((item) => ({
  id: `legacy-layout-${item.id}`,
  layer: "legacy",
  async run(page, _target, ctx) {
    const id = item.id;
    ctx.observe("source", {
      revision: item.sourceRevision,
      digest: item.sourceDigest,
      paths: item.sourcePaths,
      decision: corrections.has(id) ? "corrected" : "verified unchanged",
      exception: exceptions[id] ?? null,
    });
    await page.evaluate("window.__name = (fn) => fn");
    for (const scope of scopes) {
      const host = page.locator(`[data-scope="${scope}"]`);
      if (id === "input" || id === "dropzone")
        await host.locator("input").setInputFiles({
          name: "ملف-42.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("sample"),
        });
      if (id === "native-select") await host.locator("select").selectOption("b");
      if (id === "textarea") await host.locator("textarea").fill("عنوان 42");
      if (id === "label") await host.locator("label").click();
      // Astro renders a lazy image. Lazy images do not hold the load event, so bring each one
      // into view and wait until it decodes before reading its natural size.
      if (id === "image") {
        const image = host.locator("img");
        await image.scrollIntoViewIfNeeded();
        await image.evaluate((element: HTMLImageElement) => element.decode());
      }
      if (id === "collapsible" || id === "toggle") await host.locator("button").click();
      const { initial: result, flipped } = await host.evaluate(async (section, id) => {
        const measure = () => {
          const q = (selector: string) => section.querySelector<HTMLElement>(selector)!;
          const rect = (selector: string) => q(selector).getBoundingClientRect();
          const css = (selector: string, pseudo?: string) => getComputedStyle(q(selector), pseudo);
          const rtl = section.getAttribute("dir") === "rtl";
          const gap = (a: string, b: string) =>
            rtl ? rect(a).left - rect(b).right : rect(b).left - rect(a).right;
          const readings: {
            fact: string;
            actual: string | number | boolean;
            expected: string | number | boolean;
          }[] = [];
          const check = (
            fact: string,
            actual: string | number | boolean,
            expected: string | number | boolean,
          ) => readings.push({ fact, actual, expected });
          const slot = (name: string) => `[data-slot="${name}"]`;
          const hook = q("[data-slot]");
          const bounds = hook.getBoundingClientRect();
          check("component has a visible box", bounds.width > 0 && bounds.height > 0, true);
          check(
            "component inherits local direction",
            getComputedStyle(hook).direction,
            rtl ? "rtl" : "ltr",
          );
          if (q("[data-last]"))
            check(
              "first part precedes last along the inline axis",
              gap("[data-first]", "[data-last]") >= -0.1,
              true,
            );
          switch (id) {
            case "accordion":
              check("trigger alignment", css("button").textAlign, "start");
              check("vertical icon follows text", gap("[data-first]", "svg") >= 0, true);
              break;
            case "aspect-ratio":
              check("physical ratio", bounds.width / bounds.height, 2);
              check("child fills wrapper", rect(slot("aspect-ratio")).width, bounds.width);
              break;
            case "avatar":
              check("consumer overlap", gap("figure:first-child", "figure:last-child"), -8);
              check("compiled group margin", css("figure").marginInlineEnd, "-8px");
              break;
            case "badge":
              check("badge link", q("a").getAttribute("href")!, "#badge");
              break;
            case "breadcrumb":
            case "pagination":
              for (const icon of section.querySelectorAll("svg"))
                check(
                  "glyph rotation",
                  getComputedStyle(icon).rotate,
                  rtl && !icon.hasAttribute("data-custom") ? "180deg" : "none",
                );
              if (id === "pagination")
                check(
                  "link order",
                  Array.from(section.querySelectorAll("a"), (link) => link.hash).join(","),
                  "#prev,#next,#custom",
                );
              break;
            case "button-group": {
              const first = slot("button") + ":first-child",
                last = slot("button") + ":last-child";
              check("seam", gap(first, last), 0);
              check(
                "outer corners",
                css(first).borderStartStartRadius === "8px" &&
                  css(last).borderStartEndRadius === "8px",
                true,
              );
              check(
                "inner corners",
                Number.parseFloat(css(first).borderStartEndRadius) +
                  Number.parseFloat(css(last).borderStartStartRadius),
                0,
              );
              check(
                "seam border",
                Number.parseFloat(css(first).borderInlineEndWidth) +
                  Number.parseFloat(css(last).borderInlineStartWidth),
                1,
              );
              break;
            }
            case "checkbox":
              check("label gap", gap("input", "label"), 8);
              check("inline margin", css("input").marginInlineEnd, "8px");
              check("check overlay", rect("svg").left, rect("input").left);
              check("native checked", (q("input") as HTMLInputElement).checked, true);
              break;
            case "collapsible":
              check("expanded", q("button").getAttribute("aria-expanded")!, "true");
              break;
            case "dropzone":
            case "input":
              check("native file", (q("input") as HTMLInputElement).files![0]!.name, "ملف-42.txt");
              if (id === "input")
                check(
                  "file button spacing",
                  css("input", "::file-selector-button").marginInlineEnd,
                  "16px",
                );
              else check("selected files state", q("label").dataset.hasFiles!, "true");
              break;
            case "image": {
              const img = q("img") as HTMLImageElement;
              check("decoded image", img.naturalWidth > 0, true);
              check(
                "intrinsic ratio",
                Math.abs(bounds.width / bounds.height - img.naturalWidth / img.naturalHeight) <
                  0.01,
                true,
              );
              break;
            }
            case "input-group": {
              const start = "[data-align=inline-start]",
                end = "[data-align=inline-end]";
              check("input start padding", css("input").paddingInlineStart, "6px");
              check("input end padding", css("input").paddingInlineEnd, "6px");
              check("start addon", css(start).paddingInlineStart, "10px");
              check("end addon", css(end).paddingInlineEnd, "10px");
              check("start button margin", css(start).marginInlineStart, "-4.8px");
              check("end button margin", css(end).marginInlineEnd, "-4.8px");
              check("addon order", gap(start, "input") >= -0.1 && gap("input", end) >= -0.1, true);
              break;
            }
            case "label":
              check("native association", document.activeElement === q("input"), true);
              break;
            case "native-select": {
              const control = rect("select"),
                icon = rect("svg");
              check("icon inset", rtl ? icon.left - control.left : control.right - icon.right, 12);
              check("icon center", icon.top + icon.height / 2, control.top + control.height / 2);
              check("end text reserve", css("select").paddingInlineEnd, "36px");
              check("selected value", (q("select") as HTMLSelectElement).value, "b");
              break;
            }
            case "prose":
              check("list indent", Number.parseFloat(css("ul").paddingInlineStart) > 0, true);
              check("quote stripe", css("blockquote").borderInlineStartWidth, "4px");
              for (const summary of section.querySelectorAll("summary")) {
                const style = getComputedStyle(summary, "::before");
                const matrix =
                  style.transform === "none" ? new DOMMatrix() : new DOMMatrix(style.transform);
                const scale = style.scale === "none" ? 1 : Number.parseFloat(style.scale);
                const open = summary.parentElement!.hasAttribute("open");
                check(
                  "summary horizontal direction",
                  Math.round(matrix.a * scale) || 0,
                  open ? 0 : rtl ? -1 : 1,
                );
                check("summary vertical direction", Math.round(matrix.b) || 0, open ? 1 : 0);
              }
              break;
            case "separator":
              check("horizontal thickness", bounds.height, 1);
              break;
            case "skeleton":
              check("placeholder dimensions", bounds.width / bounds.height, 4);
              break;
            case "spinner":
              check(
                "square status glyph",
                Math.abs(bounds.width - bounds.height) < 0.01 &&
                  hook.getAttribute("role") === "status",
                true,
              );
              break;
            case "table":
              check("header alignment", css("th").textAlign, "start");
              check("checkbox header end padding", css("th").paddingInlineEnd, "0px");
              check("checkbox cell end padding", css("td").paddingInlineEnd, "0px");
              break;
            case "textarea":
              check(
                "editable mixed text",
                (q("textarea") as HTMLTextAreaElement).value,
                "عنوان 42",
              );
              break;
            case "theme-toggle": {
              const wrapper = rect("[data-theme-icon-wrapper]");
              check(
                "icon stays physically centered",
                Math.abs(wrapper.left + wrapper.width / 2 - bounds.left - bounds.width / 2) < 1,
                true,
              );
              break;
            }
            case "toggle":
              check("pressed state", q("button").getAttribute("aria-pressed")!, "true");
              break;
            case "video":
              check("native controls", (q("video") as HTMLVideoElement).controls, true);
              check("media ratio", bounds.width / bounds.height, 16 / 9);
              break;
          }
          return {
            bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
            hook: hook.getAttribute("data-slot"),
            readings,
          };
        };
        const initial = measure();
        if (id !== "checkbox" && id !== "button-group") return { initial, flipped: null };
        const direction = section.getAttribute("dir") === "rtl" ? "ltr" : "rtl";
        section.setAttribute("dir", direction);
        const firstFrame = await new Promise<ReturnType<typeof measure>>((resolve) => {
          requestAnimationFrame(() => resolve(measure()));
        });
        await Promise.all(
          section.getAnimations({ subtree: true }).map((animation) => animation.finished),
        );
        return { initial, flipped: { direction, firstFrame, settled: measure() } };
      }, id);
      if (id === "pagination") {
        for (const [hash, direction] of [
          ["prev", -1],
          ["next", 1],
          ["custom", 0],
        ] as const) {
          const link = host.locator(`a[href="#${hash}"]`);
          await link.hover();
          const travel = await link.locator("svg").evaluate(async (icon) => {
            // Force style resolution before waiting for the authored hover transition.
            void getComputedStyle(icon).translate;
            await Promise.all(icon.getAnimations().map((animation) => animation.finished));
            const value = getComputedStyle(icon).translate;
            return value === "none" ? 0 : Number.parseFloat(value);
          });
          result.readings.push({
            fact: hash + " hover travel",
            actual: travel,
            expected: direction * (scope.endsWith("-rtl") ? -4 : 4) || 0,
          });
        }
      }
      ctx.observe(scope, result);
      if (flipped) ctx.observe(scope + "-direction-flip", flipped);
      await ctx.check(scope, () => {
        const samples = flipped ? [result, flipped.firstFrame, flipped.settled] : [result];
        for (const sample of samples)
          for (const { fact, actual, expected } of sample.readings)
            assert.equal(actual, expected, `${id}/${scope}: ${fact}`);
      });
    }
  },
}));
