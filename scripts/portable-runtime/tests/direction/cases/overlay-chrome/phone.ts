import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";
import {
  type DirectionCase,
  type DirectionExpectation,
  TARGETS,
  type Target,
} from "../../inventory.js";
import { settleAnimations, waitHidden } from "../../waits.js";

// Each overlay family opens at phone width in two modes, and its open surface must stay inside
// the viewport. The checks read geometry only.
const imports = {
  popover: "Popover PopoverTrigger PopoverContent",
  dropdown: "Dropdown DropdownTrigger DropdownContent DropdownItem",
  select: "Select SelectTrigger SelectContent SelectItem",
  tooltip: "Tooltip TooltipTrigger TooltipContent",
  "hover-card": "HoverCard HoverCardTrigger HoverCardContent",
  "navigation-menu":
    "NavigationMenu NavigationMenuList NavigationMenuItem NavigationMenuTrigger NavigationMenuContent NavigationMenuLink",
  "context-menu": "ContextMenu ContextMenuTrigger ContextMenuContent ContextMenuItem",
  combobox:
    "Combobox ComboboxInputGroup ComboboxInput ComboboxTrigger ComboboxContent ComboboxItem",
  "color-picker":
    "ColorPicker ColorPickerInput ColorPickerTrigger ColorPickerContent ColorPickerArea ColorPickerChannelSlider",
  toast: "Toaster ToastTemplate ToastItem ToastTitle ToastClose",
  sheet: "Sheet SheetTrigger SheetContent SheetTitle",
};
type Family = keyof typeof imports;
type Open = "click" | "hover" | "context" | "fire";
// Trigger and open surface for each family.
const families: Record<Family, [string, string, Open]> = {
  popover: ["[data-slot=popover-trigger]", "[data-slot=popover-content]", "click"],
  dropdown: ["[data-slot=dropdown-trigger]", "[data-slot=dropdown-content]", "click"],
  select: ["[data-slot=select-trigger]", "[data-slot=select-content]", "click"],
  tooltip: ["[data-slot=tooltip-trigger]", "[data-slot=tooltip-content]", "hover"],
  "hover-card": ["[data-slot=hover-card-trigger]", "[data-slot=hover-card-content]", "hover"],
  "navigation-menu": [
    "[data-slot=navigation-menu-trigger]",
    "[data-slot=navigation-menu-content]",
    "click",
  ],
  "context-menu": [
    "[data-slot=context-menu-trigger]",
    "[data-slot=context-menu-content]",
    "context",
  ],
  combobox: ["[data-slot=combobox-trigger]", "[data-slot=combobox-content]", "click"],
  "color-picker": ["[data-slot=color-picker-trigger]", "[data-slot=color-picker-content]", "click"],
  sheet: ["[data-slot=sheet-trigger]", "[data-slot=sheet-content]", "click"],
  // Last, because it stays open.
  toast: ["[data-phone-toast]", "[data-slot=toast]", "fire"],
};
export const PHONE = { width: 390, height: 844 };
const modes = {
  "phone-rtl-surfaces-in-viewport": "rtl",
  "phone-nested-ltr-surfaces-in-viewport": "ltr",
} as const;
type Check = keyof typeof modes;

export function source(target: Target) {
  const head =
    Object.entries(imports)
      .map(
        ([row, names]) =>
          `import { ${names.split(" ").join(", ")} } from "@direction/styled-${target}/${row}";`,
      )
      .join("\n") + '\nimport "@direction/sheet";';
  const prop = (name: string, value: string) =>
    target === "vue" ? `:${name}="${value}"` : `${name}={${value}}`;
  const zero = `${prop("openDelay", "0")} ${prop("closeDelay", "0")}`;
  const markup = [
    `<Popover><PopoverTrigger>نافذة Popover</PopoverTrigger><PopoverContent>محتوى النافذة المنبثقة Popover content text</PopoverContent></Popover>`,
    `<Dropdown><DropdownTrigger>قائمة Menu</DropdownTrigger><DropdownContent><DropdownItem>إعدادات الحساب Account settings</DropdownItem><DropdownItem>Project 42</DropdownItem></DropdownContent></Dropdown>`,
    `<Select defaultValue="one"><SelectTrigger>اختيار Choose</SelectTrigger><SelectContent><SelectItem value="one">الخيار الأول First option</SelectItem><SelectItem value="two">Second option</SelectItem></SelectContent></Select>`,
    `<Tooltip ${zero}><TooltipTrigger>تلميح Tooltip</TooltipTrigger><TooltipContent>تلميح الأداة Tooltip text</TooltipContent></Tooltip>`,
    `<HoverCard ${zero}><HoverCardTrigger>بطاقة Hover card</HoverCardTrigger><HoverCardContent>بطاقة المعاينة Preview card content</HoverCardContent></HoverCard>`,
    `<NavigationMenu aria-label="التنقل" ${zero}><NavigationMenuList><NavigationMenuItem value="products"><NavigationMenuTrigger>المنتجات Products</NavigationMenuTrigger><NavigationMenuContent><NavigationMenuLink href="#components">مكونات Starwind</NavigationMenuLink><NavigationMenuLink href="#docs">Docs</NavigationMenuLink></NavigationMenuContent></NavigationMenuItem></NavigationMenuList></NavigationMenu>`,
    `<ContextMenu><ContextMenuTrigger>قائمة السياق Context</ContextMenuTrigger><ContextMenuContent><ContextMenuItem>نسخ Copy</ContextMenuItem><ContextMenuItem>Paste</ContextMenuItem></ContextMenuContent></ContextMenu>`,
    `<Combobox defaultValue="one"><ComboboxInputGroup><ComboboxInput aria-label="بحث Find"/><ComboboxTrigger>Open results</ComboboxTrigger></ComboboxInputGroup><ComboboxContent><ComboboxItem value="one">النتيجة الأولى First result</ComboboxItem></ComboboxContent></Combobox>`,
    `<ColorPicker label="لون Color" defaultValue="#ef4444"><ColorPickerInput aria-label="قيمة اللون Color value"/><ColorPickerTrigger aria-label="Open color picker"/><ColorPickerContent aria-label="محرر الألوان Color editor"><ColorPickerArea aria-label="Color area"/><ColorPickerChannelSlider channel="hue" aria-label="Hue"/></ColorPickerContent></ColorPicker>`,
    `<button type="button" data-phone-toast="">إشعار Notify</button><Toaster ${prop("duration", "0")}><ToastTemplate><ToastItem><ToastTitle/><ToastClose>Close</ToastClose></ToastItem></ToastTemplate></Toaster>`,
    `<Sheet><SheetTrigger>لوحة Sheet</SheetTrigger><SheetContent><SheetTitle>لوحة جانبية Side panel</SheetTitle></SheetContent></Sheet>`,
  ].join("");
  // Triggers sit flush with the inline start edge, which is the left edge in LTR and the right edge
  // in RTL. Each open surface must slide inside the viewport and stay attached to its trigger.
  const body =
    `<main dir="rtl"><section data-phone-owner="" dir="rtl" class="flex flex-col items-start gap-2 py-2 pe-2">${markup}</section></main>`.replaceAll(
      "class=",
      target === "react" ? "className=" : "class=",
    );
  const code = `import {toast} from "@starwind-ui/runtime/toast"; document.addEventListener("click",event=>{if(event.target.closest("[data-phone-toast]"))toast({title:"مرحبا Project 42 إشعار طويل",duration:0});});`;
  if (target === "astro")
    return `---\n${head}\n---\n<html><head><meta charset="utf-8"/><link rel="icon" href="data:,"/><title>Phone overlays</title></head><body>${body}<script>${code}</script></body></html>`;
  if (target === "react")
    return `import {createRoot} from "react-dom/client";\n${head}\n${code}\ncreateRoot(document.getElementById("app")!).render(${body});`;
  if (target === "vue")
    return `<script setup lang="ts">\n${head}\n${code}\n</script><template>${body}</template>`;
  return `<script lang="ts">\n${head}\n${code}\n</script>${body}`;
}

async function open(page: Page, family: Family) {
  const [triggerSelector, surfaceSelector, how] = families[family];
  const trigger = page.locator(`[data-phone-owner] ${triggerSelector}`).first();
  await trigger.scrollIntoViewIfNeeded();
  if (how === "hover") await trigger.hover();
  else if (how === "context") await trigger.click({ button: "right" });
  else await trigger.click();
  const surface = page.locator(surfaceSelector).filter({ visible: true }).first();
  await surface.waitFor({ state: "visible" });
  await settleAnimations(surface);
  // The positioner runs async. Wait until the box holds for two frames before measuring it.
  await surface.evaluate(async (n) => {
    let last = "";
    for (let frame = 0; frame < 60; frame++) {
      const r = n.getBoundingClientRect();
      const next = [r.x, r.y, r.width, r.height].join();
      if (next === last) return;
      last = next;
      await new Promise(requestAnimationFrame);
    }
    throw new Error("open surface did not stop moving");
  });
  return { trigger, surface };
}

async function close(page: Page, family: Family, surface: Locator) {
  // The toast stays open. Its removal waits on a timer, and each mode reloads the page.
  if (family === "toast") return;
  if (families[family][2] === "hover") await page.mouse.move(1, 1);
  await page.keyboard.press("Escape");
  await waitHidden(surface);
}

/** Measures one family's open surface against the viewport. */
export async function measureFamily(page: Page, family: Family, dir: "rtl" | "ltr") {
  const { trigger, surface } = await open(page, family);
  const box = await surface.evaluate((n) => {
    const r = n.getBoundingClientRect();
    return {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      surfaceDir: getComputedStyle(n).direction,
      viewportWidth: document.documentElement.clientWidth,
      viewportHeight: window.innerHeight,
    };
  });
  const triggerDir = await trigger.evaluate((n) => getComputedStyle(n).direction);
  const sample = { family, dir, triggerDir, ...box };
  const label = `${family} ${dir} at ${PHONE.width}px: ${JSON.stringify(sample)}`;
  assert.equal(triggerDir, dir, `trigger direction for ${label}`);
  assert(box.width > 0 && box.height > 0, `empty surface for ${label}`);
  assert(
    box.x >= -1 && box.x + box.width <= box.viewportWidth + 1,
    `clipped horizontal surface for ${label}`,
  );
  assert(
    box.y >= -1 && box.y + box.height <= box.viewportHeight + 1,
    `clipped vertical surface for ${label}`,
  );
  if (family === "tooltip") {
    // The arrow stays off the rounded corners and points into the trigger.
    const arrow = await surface.evaluate((n) => {
      const a = n.querySelector("[data-slot=tooltip-arrow]")!.getBoundingClientRect();
      const s = n.getBoundingClientRect();
      return { start: a.left - s.left, end: s.right - a.right, center: a.left + a.width / 2 };
    });
    const anchor = await trigger.evaluate((n) => n.getBoundingClientRect().toJSON());
    assert(arrow.start >= 5.5 && arrow.end >= 5.5, `arrow outside ${label}`);
    assert(arrow.center >= anchor.left && arrow.center <= anchor.right, `arrow misses ${label}`);
  }
  await close(page, family, surface);
  return sample;
}

async function phone(page: Page, dir: "rtl" | "ltr") {
  const original = page.viewportSize()!;
  await page.setViewportSize(PHONE);
  try {
    await page.reload();
    // The check reads settled geometry only, so motion adds time and no proof.
    await page.addStyleTag({
      content: "*,*::before,*::after{transition:none!important;animation:none!important}",
    });
    await page.locator("[data-phone-owner]").evaluate((owner, dir) => {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ar";
      owner.parentElement!.setAttribute("dir", "rtl");
      owner.setAttribute("dir", dir);
      document.dispatchEvent(new Event("starwind:direction-change"));
    }, dir);
    const samples = [];
    for (const family of Object.keys(families) as Family[])
      samples.push(await measureFamily(page, family, dir));
    return samples;
  } finally {
    await page.setViewportSize(original);
  }
}

const id = "chrome-phone-styled";
export const cases: DirectionCase[] = [
  {
    id,
    row: "popover",
    acceptance: ["SPEC-AC-01", "SPEC-AC-12"],
    fixtures: Object.fromEntries(
      TARGETS.map((target) => [
        target,
        {
          source: source(target),
          exports: imports.popover.split(" "),
          assertions: Object.keys(modes),
        },
      ]),
    ),
  },
];
export const expectations: DirectionExpectation[] = [
  {
    id,
    layer: "styled",
    async run(page, _target, ctx) {
      for (const check of Object.keys(modes) as Check[])
        await ctx.check(check, async () => {
          ctx.observe(check, await phone(page, modes[check]));
        });
    },
  },
];
