import assert from "node:assert/strict";
import {
  type DirectionCase,
  type DirectionExpectation,
  TARGETS,
  type Target,
} from "../../inventory.js";

// Accordion, Table, Native Select, Input and Input Group follow SalahAdDin's
// logical spacing corrections in https://github.com/starwind-ui/starwind-ui/pull/290
// (dd91598d79bbacf424f2efa739a69c9730950579), reapplied to the current contracts.
const imports = {
  accordion: "Accordion AccordionItem AccordionTrigger AccordionContent",
  breadcrumb: "BreadcrumbSeparator",
  pagination: "PaginationPrevious PaginationNext",
  "input-otp": "InputOtp InputOtpGroup InputOtpSlot",
  "toggle-group": "ToggleGroup ToggleGroupItem",
  "button-group": "ButtonGroup",
  button: "Button",
  "native-select": "NativeSelect",
  field: "Field FieldControl",
  input: "Input",
  "input-group": "InputGroup InputGroupAddon InputGroupInput InputGroupButton",
  avatar: "AvatarGroup Avatar AvatarFallback",
  checkbox: "Checkbox",
  table: "Table TableHeader TableHead TableRow TableBody TableCell",
  prose: "Prose",
};
const checks = [
  "joined-controls",
  "native-controls",
  "reading-marks",
  "logical-space",
  "prose-details",
];
function source(target: Target) {
  const modules =
    Object.entries(imports)
      .map(
        ([slug, names]) =>
          `import { ${names.split(" ").join(", ")} } from "@direction/styled-${target}/${slug}";`,
      )
      .join("\n") + '\nimport "@direction/sheet";';
  const num = (key: string, value: number) =>
    target === "vue" ? `:${key}="${value}"` : `${key}={${value}}`;
  const sizes = ["sm", "md", "lg"]
    .map(
      (size) => `<div data-size-case="${size}">
    <NativeSelect size="${size}"><option>الخيار Select</option></NativeSelect>
    <AvatarGroup><Avatar size="${size}"><AvatarFallback>A</AvatarFallback></Avatar><Avatar size="${size}"><AvatarFallback>B</AvatarFallback></Avatar></AvatarGroup>
    <Checkbox size="${size}" label="عنوان طويل Checkbox label" />
  </div>`,
    )
    .join("");
  const custom = '<svg data-caller="icon" viewBox="0 0 12 12"><path d="M2 2l8 4-8 4z" /></svg>';
  const pageIcon =
    target === "react"
      ? `<PaginationPrevious icon={${custom}} />`
      : target === "astro"
        ? `<PaginationPrevious>${custom.replace("<svg ", '<svg slot="icon" ')}</PaginationPrevious>`
        : target === "svelte"
          ? `<PaginationPrevious>{#snippet icon()}${custom}{/snippet}</PaginationPrevious>`
          : `<PaginationPrevious><template #icon>${custom}</template></PaginationPrevious>`;
  const body = `<main><div data-parent="layout"><section data-layout="controls" data-direction-scope="reading-layout">
    <Accordion><AccordionItem value="details"><AccordionTrigger>عنوان طويل Details</AccordionTrigger><AccordionContent>Details</AccordionContent></AccordionItem></Accordion>
    <ol><BreadcrumbSeparator /><BreadcrumbSeparator>${custom}</BreadcrumbSeparator></ol>
    <nav><PaginationPrevious /><PaginationNext />${pageIcon}</nav>
    <ButtonGroup><Button variant="outline">A</Button><Button variant="outline">B</Button></ButtonGroup>
    <ToggleGroup variant="outline" ${num("spacing", 0)}><ToggleGroupItem value="a"><span data-icon="inline-start">A</span></ToggleGroupItem><ToggleGroupItem value="b"><span data-icon="inline-end">B</span></ToggleGroupItem></ToggleGroup>
    <InputOtp ${num("maxLength", 2)}><InputOtpGroup><InputOtpSlot ${num("index", 0)} /><InputOtpSlot ${num("index", 1)} /></InputOtpGroup></InputOtp>
    <Input type="file" /><Field name="attachment"><FieldControl type="file" /></Field>
    <InputGroup><InputGroupAddon align="inline-start"><InputGroupButton>A</InputGroupButton></InputGroupAddon><InputGroupInput /><InputGroupAddon align="inline-end"><InputGroupButton>B</InputGroupButton></InputGroupAddon></InputGroup>
    <Table><TableHeader><TableRow><TableHead><button role="checkbox" aria-checked="false">A</button></TableHead><TableHead>B</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell><button role="checkbox" aria-checked="false">A</button></TableCell><TableCell>B</TableCell></TableRow></TableBody></Table>
    <Prose><ul><li>قائمة list</li></ul><details><summary>تفاصيل</summary>Contents</details><details open><summary>مفتوح</summary>Open contents</details></Prose>${sizes}
  </section></div><section dir="rtl" data-static-rtl="checkbox"><Checkbox label="خيار ثابت Static RTL" /></section></main>`;
  if (target === "astro")
    return `---\n${modules}\n---\n<html><head><title>Reading layout</title></head><body>${body}</body></html>`;
  if (target === "react")
    return `import {createRoot} from "react-dom/client";\n${modules}\ncreateRoot(document.getElementById("app")!).render(${body});`;
  if (target === "vue")
    return `<script setup lang="ts">\n${modules}\n</script><template>${body}</template>`;
  return `<script lang="ts">\n${modules}\n</script>${body}`;
}
export const cases: DirectionCase[] = [
  {
    id: "reading-layout-controls",
    row: "input",
    acceptance: ["SPEC-AC-01", "SPEC-AC-02", "SPEC-AC-12", "SPEC-AC-13"],
    physicalExceptions: [
      "Vertical disclosure chevrons and caller icons retain orientation. Table rows and OTP values retain DOM order.",
      "Avatar overlap and Checkbox spacing use compiled logical margins. Their size variants need no direction override.",
      "Field grid columns retain DOM order. Prose list spacing already uses padding-inline-start.",
    ],
    fixtures: Object.fromEntries(
      TARGETS.map((target) => [
        target,
        { source: source(target), exports: ["Input"], assertions: checks },
      ]),
    ),
  },
];

export const expectations: DirectionExpectation[] = [
  {
    id: "reading-layout-controls",
    layer: "styled",
    async run(page, target, ctx) {
      await page.locator("summary").first().waitFor();
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.evaluate("window.__name = (target) => target");
      const staticRtl = await page.locator("[data-static-rtl]").evaluate((root) => {
        const box = root.querySelector('[data-slot="checkbox"]')!;
        const label = root.querySelector('[data-slot="checkbox-label"]')!;
        return {
          direction: getComputedStyle(box).direction,
          gap: box.getBoundingClientRect().left - label.getBoundingClientRect().right,
        };
      });
      ctx.observe("checkbox-static-rtl", staticRtl);
      for (const input of await page.locator("input[type=file]").all()) {
        await input.setInputFiles({
          name: "ملف-42.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("layout"),
        });
      }
      const measure = (parent: string, dir: string) =>
        page.locator("[data-layout]").evaluate(
          async (root, [parent, dir]) => {
            root.parentElement!.dir = parent!;
            root.setAttribute("dir", dir!);
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            const el = (selector: string) => root.querySelector<HTMLElement>(selector)!;
            const slot = (id: string) => `[data-slot="${id}"]`;
            const styles = (selector: string, pseudo?: string) =>
              getComputedStyle(el(selector), pseudo);
            const gap = (a: Element, b: Element) => {
              const x = a.getBoundingClientRect(),
                y = b.getBoundingClientRect();
              return dir === "rtl" ? x.left - y.right : y.left - x.right;
            };
            const seams = ["button", "toggle-group-item", "input-otp-slot"].map((id) => {
              const [a, b] = root.querySelectorAll<HTMLElement>(slot(id)),
                x = getComputedStyle(a!),
                y = getComputedStyle(b!);
              return {
                id,
                gap: gap(a!, b!),
                seam:
                  Number.parseFloat(x.borderInlineEndWidth) +
                  Number.parseFloat(y.borderInlineStartWidth),
                corners: [
                  x.borderStartStartRadius,
                  x.borderStartEndRadius,
                  y.borderStartStartRadius,
                  y.borderStartEndRadius,
                ].map(parseFloat),
              };
            });
            const sizes = Array.from(root.querySelectorAll("[data-size-case]"), (group) => {
              const get = (id: string) => group.querySelector<HTMLElement>(slot(id))!;
              const a = get("native-select"),
                b = get("native-select-icon"),
                x = a.getBoundingClientRect(),
                y = b.getBoundingClientRect(),
                av = group.querySelectorAll(slot("avatar"));
              return {
                inset: dir === "rtl" ? y.left - x.left : x.right - y.right,
                end: getComputedStyle(a).paddingInlineEnd,
                start: getComputedStyle(a).paddingInlineStart,
                overlap: gap(av[0]!, av[1]!),
                checkboxGap: gap(get("checkbox"), get("checkbox-label")),
                avatarMargin: getComputedStyle(av[0]!).marginInlineEnd,
                checkboxMargin: getComputedStyle(get("checkbox")).marginInlineEnd,
              };
            });
            const addons = Array.from(root.querySelectorAll(slot("input-group-addon")), (a, i) => {
              const s = getComputedStyle(a);
              return i === 0
                ? [s.paddingInlineStart, s.marginInlineStart]
                : [s.paddingInlineEnd, s.marginInlineEnd];
            });
            const files = Array.from(
              root.querySelectorAll('input[type="file"]'),
              (file) => getComputedStyle(file, "::file-selector-button").marginInlineEnd,
            );
            const rotation = (selector: string) =>
              Array.from(root.querySelectorAll(selector), (icon) => getComputedStyle(icon).rotate);
            // Apply the pseudo-element's scale and transform to its right-pointing source glyph.
            const markers = Array.from(root.querySelectorAll("summary"), (summary) => {
              const style = getComputedStyle(summary, "::before");
              const transform =
                style.transform === "none" ? new DOMMatrix() : new DOMMatrix(style.transform);
              const xScale = style.scale === "none" ? 1 : Number.parseFloat(style.scale);
              return [Math.round(transform.a * xScale) || 0, Math.round(transform.b) || 0];
            });
            return {
              parent,
              dir,
              seams,
              sizes,
              files,
              filenames: Array.from(
                root.querySelectorAll<HTMLInputElement>('input[type="file"]'),
                (input) => input.files?.[0]?.name ?? "",
              ),
              addons,
              controlPadding: [
                styles(slot("input-group-control")).paddingInlineStart,
                styles(slot("input-group-control")).paddingInlineEnd,
              ],
              toggleIconPadding: [
                styles(slot("toggle-group-item")).paddingInlineStart,
                getComputedStyle(root.querySelectorAll(slot("toggle-group-item"))[1]!)
                  .paddingInlineEnd,
              ],
              aligns: [styles(slot("accordion-trigger")).textAlign, styles("th").textAlign],
              tablePadding: [styles("th").paddingInlineEnd, styles("td").paddingInlineEnd],
              defaults: rotation("ol svg:not([data-caller]),nav svg:not([data-caller])"),
              caller: rotation("[data-caller]"),
              vertical: rotation(
                slot("native-select-icon") + "," + slot("accordion-trigger") + " svg",
              ),
              markers,
              listPadding: styles(".sw-prose ul").paddingInlineStart,
            };
          },
          [parent, dir],
        );
      const evidence = [
        await measure("ltr", "ltr"),
        await measure("ltr", "rtl"),
        await measure("rtl", "ltr"),
      ];
      ctx.observe("reading-layout-" + target, evidence);
      await ctx.check("joined-controls", () => {
        for (const r of evidence) {
          for (const seam of r.seams) {
            assert.equal(seam.gap, 0, seam.id);
            assert.equal(seam.seam, 1, seam.id);
            assert(seam.corners[0]! > 0 && seam.corners[3]! > 0, seam.id);
            assert.deepEqual(seam.corners.slice(1, 3), [0, 0]);
          }
          assert.deepEqual(r.toggleIconPadding, ["6px", "6px"]);
        }
      });
      await ctx.check("native-controls", () => {
        for (const r of evidence) {
          assert.deepEqual(r.files, ["16px", "16px"]);
          assert.deepEqual(r.filenames, ["ملف-42.txt", "ملف-42.txt"]);
          assert.deepEqual(r.addons, [
            ["10px", "-4.8px"],
            ["10px", "-4.8px"],
          ]);
          assert.deepEqual(r.controlPadding, ["6px", "6px"]);
          assert.deepEqual(r.tablePadding, ["0px", "0px"]);
          assert.deepEqual(r.aligns, ["start", "start"]);
          assert.deepEqual(
            r.sizes.map((s) => [s.inset, s.end, s.start]),
            [
              [8, "32px", "8px"],
              [12, "36px", "12px"],
              [16, "40px", "16px"],
            ],
          );
        }
      });
      await ctx.check("reading-marks", () => {
        for (const r of evidence) {
          assert.deepEqual(r.defaults, Array(3).fill(r.dir === "rtl" ? "180deg" : "none"));
          assert.deepEqual(r.caller, ["none", "none"]);
          assert.deepEqual(r.vertical, Array(4).fill("none"));
        }
      });
      await ctx.check("logical-space", () => {
        assert.deepEqual(staticRtl, { direction: "rtl", gap: 8 });
        for (const r of evidence) {
          assert.deepEqual(
            r.sizes.map((s) => s.overlap),
            [-8, -10, -12],
          );
          assert.deepEqual(
            r.sizes.map((s) => s.checkboxGap),
            [8, 8, 8],
          );
          assert.deepEqual(
            r.sizes.map((s) => s.avatarMargin),
            ["-8px", "-10px", "-12px"],
          );
          assert.deepEqual(
            r.sizes.map((s) => s.checkboxMargin),
            Array(3).fill("8px"),
          );
        }
      });
      await ctx.check("prose-details", () => {
        for (const r of evidence) {
          assert(Number.parseFloat(r.listPadding) > 0);
          assert.deepEqual(r.markers, [
            [r.dir === "rtl" ? -1 : 1, 0],
            [0, 1],
          ]);
        }
      });
    },
  },
];
