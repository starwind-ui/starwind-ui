import assert from "node:assert/strict";
import type { Page } from "playwright";

import type { DirectionAssertionContext } from "../../assertion-receipts.js";
import type { DirectionCase, DirectionExpectation, Target } from "../../inventory.js";
import { waitHidden } from "../../waits.js";

type ControlSpec = {
  row: string;
  exports: string[];
  dependencies?: Record<string, string[]>;
  body: string;
  slotAssertions?: Record<string, string>;
  physicalExceptions?: string[];
  rawEntrypoints?: ("factory" | "initStarwind")[];
};

type BrowserBounds = { x: number; y: number; width: number; height: number };

async function check(
  context: DirectionAssertionContext | undefined,
  name: string,
  run: () => Promise<void>,
): Promise<void> {
  if (context) await context.check(name, run);
  else await run();
}

function observe(
  context: DirectionAssertionContext | undefined,
  name: string,
  value: unknown,
): void {
  context?.observe(name, value);
}

const controls: ControlSpec[] = [
  {
    row: "accordion",
    exports: ["Accordion", "AccordionContent", "AccordionItem", "AccordionTrigger"],
    body: `<Accordion type="single" defaultValue="shipping" collapsible>
      <AccordionItem value="shipping"><AccordionTrigger data-direction-focus>معلومات الشحن الطويلة Shipping details</AccordionTrigger><AccordionContent><p>שלום world 42</p></AccordionContent></AccordionItem>
      <AccordionItem value="disabled" disabled><AccordionTrigger>خيار غير متاح Disabled</AccordionTrigger><AccordionContent>Hidden text</AccordionContent></AccordionItem>
    </Accordion>`,
  },
  {
    row: "alert",
    exports: ["Alert", "AlertDescription", "AlertTitle"],
    body: `<Alert><span aria-hidden="true">●</span><div><AlertTitle>تنبيه مهم Important שלום</AlertTitle><AlertDescription>Mixed value <span dir="ltr">SKU 123</span></AlertDescription></div></Alert>`,
  },
  {
    row: "alert-dialog",
    exports: [
      "AlertDialog",
      "AlertDialogAction",
      "AlertDialogCancel",
      "AlertDialogContent",
      "AlertDialogDescription",
      "AlertDialogFooter",
      "AlertDialogHeader",
      "AlertDialogTitle",
      "AlertDialogTrigger",
    ],
    body: `<AlertDialog>
      <AlertDialogTrigger>Open alert dialog</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>تأكيد الإجراء Confirm action</AlertDialogTitle><AlertDialogDescription>Review the change שלום 42.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>إلغاء Cancel</AlertDialogCancel><AlertDialogAction>متابعة Continue</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>`,
    physicalExceptions: [
      "alert-dialog-content keeps its physical 50% left/top anchor with paired negative half translations",
    ],
  },
  {
    row: "aspect-ratio",
    exports: ["AspectRatio"],
    body: `<AspectRatio data-ratio-probe ratio={1.5}><a href="#ratio" data-direction-focus>صورة وصفية Sample image</a><span dir="ltr">Frame 16:9</span></AspectRatio>`,
    slotAssertions: { "aspect-ratio": "aspect-ratio" },
  },
  {
    row: "avatar",
    exports: ["Avatar", "AvatarFallback", "AvatarGroup", "AvatarGroupCount", "AvatarImage"],
    body: `<div class="flex flex-col gap-4">
      <AvatarGroup data-avatar-case="sm"><Avatar size="sm"><AvatarImage src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect width='32' height='32' fill='%231d4ed8'/%3E%3C/svg%3E" alt="صورة سلمى Salma"/><AvatarFallback>س</AvatarFallback></Avatar><Avatar size="sm"><AvatarImage src="data:image/png;base64,broken" alt="صورة مفقودة Missing"/><AvatarFallback data-avatar-fallback>م</AvatarFallback></Avatar><Avatar size="sm"><AvatarFallback>א</AvatarFallback></Avatar><AvatarGroupCount>+3</AvatarGroupCount></AvatarGroup>
      <AvatarGroup data-avatar-case="md"><Avatar size="md"><AvatarFallback>س</AvatarFallback></Avatar><Avatar size="md"><AvatarFallback>א</AvatarFallback></Avatar><Avatar size="md"><AvatarFallback>42</AvatarFallback></Avatar><AvatarGroupCount>+4</AvatarGroupCount></AvatarGroup>
      <AvatarGroup data-avatar-case="lg"><Avatar size="lg"><AvatarFallback>ل</AvatarFallback></Avatar><Avatar size="lg"><AvatarFallback>A</AvatarFallback></Avatar><Avatar size="lg"><AvatarFallback>42</AvatarFallback></Avatar><AvatarGroupCount>+5</AvatarGroupCount></AvatarGroup>
    </div>`,
  },
  {
    row: "badge",
    exports: ["Badge"],
    body: `<div class="flex flex-wrap items-center gap-3"><Badge>جديد New</Badge><Badge variant="secondary"><span aria-hidden="true">●</span>الحالة Status</Badge><Badge variant="outline"><a href="#badge" data-direction-focus>فتح الرابط Open link</a></Badge><Badge class="max-w-40 whitespace-normal">عنوان طويل Long wrapped label שלום</Badge></div>`,
  },
  {
    row: "breadcrumb",
    exports: [
      "Breadcrumb",
      "BreadcrumbEllipsis",
      "BreadcrumbItem",
      "BreadcrumbLink",
      "BreadcrumbList",
      "BreadcrumbPage",
      "BreadcrumbSeparator",
    ],
    body: `<Breadcrumb><BreadcrumbList>
      <BreadcrumbItem><BreadcrumbLink href="#home" data-direction-focus>الرئيسية Home</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator />
      <BreadcrumbItem><BreadcrumbLink href="#catalog">Catalog</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator>/</BreadcrumbSeparator>
      <BreadcrumbItem><BreadcrumbEllipsis /></BreadcrumbItem><BreadcrumbSeparator />
      <BreadcrumbItem><BreadcrumbPage aria-current="page">المنتج Product</BreadcrumbPage></BreadcrumbItem>
    </BreadcrumbList></Breadcrumb>`,
  },
  {
    row: "button",
    exports: ["Button"],
    body: `<div class="flex flex-wrap items-center gap-3"><Button size="sm" data-direction-focus>حفظ Save <span dir="ltr">42</span></Button><Button size="md" disabled>معطل Disabled</Button><Button size="lg" variant="outline"><span aria-hidden="true">●</span>Icon action</Button><Button as="a" variant="link" href="#button">رابط Composed anchor</Button></div>`,
  },
  {
    row: "button-group",
    exports: ["ButtonGroup", "ButtonGroupSeparator", "ButtonGroupText"],
    dependencies: {
      button: ["Button"],
      dropdown: ["Dropdown", "DropdownContent", "DropdownItem", "DropdownTrigger"],
      select: ["Select", "SelectContent", "SelectItem", "SelectTrigger", "SelectValue"],
    },
    body: `<div class="flex flex-col gap-4"><ButtonGroup data-button-group-case="plain"><Button data-direction-focus>السابق Previous</Button><ButtonGroupSeparator orientation="vertical"/><ButtonGroupText>ملف File 42</ButtonGroupText><Button as="a" variant="outline" href="#group">التالي Next</Button></ButtonGroup><ButtonGroup data-button-group-case="plain-pair"><Button variant="outline">Plain first</Button><Button variant="outline">Plain last</Button></ButtonGroup><ButtonGroup data-button-group-case="composed"><Button as="a" variant="outline" href="#joined-first">بداية First</Button><Button as="a" variant="outline" href="#joined-last">نهاية Last</Button></ButtonGroup><ButtonGroup data-button-group-case="select-wrapper"><Button variant="outline">Select before</Button><Select defaultValue="middle"><SelectTrigger aria-label="Select grouped value"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="middle">Middle</SelectItem></SelectContent></Select></ButtonGroup><ButtonGroup data-button-group-case="dropdown-wrapper"><Button variant="outline">Dropdown before</Button><Dropdown><DropdownTrigger class="h-9 rounded-md border border-input bg-background px-3">More actions</DropdownTrigger><DropdownContent><DropdownItem>Open action</DropdownItem></DropdownContent></Dropdown></ButtonGroup><ButtonGroup data-button-group-case="vertical" orientation="vertical"><Button>Top</Button><ButtonGroupSeparator orientation="horizontal"/><ButtonGroupText>Bottom</ButtonGroupText></ButtonGroup></div>`,
    physicalExceptions: ["vertical button groups keep physical top/bottom edge rules"],
  },
  {
    row: "card",
    dependencies: { button: ["Button"] },
    exports: [
      "Card",
      "CardAction",
      "CardContent",
      "CardDescription",
      "CardFooter",
      "CardHeader",
      "CardTitle",
    ],
    body: `<Card size="sm"><CardHeader><CardTitle>ملف الحساب Account</CardTitle><CardDescription>وصف طويل Mixed description for the card.</CardDescription><CardAction><Button data-direction-focus aria-label="Open account actions">إجراء Action</Button><span dir="ltr">ID 42</span></CardAction></CardHeader><CardContent><p>بيانات المستخدم User details</p></CardContent><CardFooter><a href="#card">إدارة Manage</a></CardFooter></Card>`,
  },
  {
    row: "carousel",
    exports: ["Carousel", "CarouselContent", "CarouselItem", "CarouselNext", "CarouselPrevious"],
    body: `<div class="flex flex-col gap-8"><Carousel orientation="horizontal" data-carousel-case="drag" opts={{ loop: false, align: "start" }}><CarouselContent><CarouselItem><button data-direction-focus>الشريحة الأولى First slide</button></CarouselItem><CarouselItem><button>الشريحة الثانية Middle 42</button></CarouselItem><CarouselItem><button>الشريحة الأخيرة Last slide</button></CarouselItem></CarouselContent><CarouselPrevious aria-label="Previous slide"/><CarouselNext aria-label="Next slide"/></Carousel><Carousel orientation="horizontal" data-carousel-case="loop" opts={{ loop: true, align: "start" }}><CarouselContent><CarouselItem>Loop first</CarouselItem><CarouselItem>Loop middle</CarouselItem><CarouselItem>Loop last</CarouselItem></CarouselContent><CarouselPrevious aria-label="Loop previous"/><CarouselNext aria-label="Loop next"/></Carousel><Carousel orientation="vertical" class="h-48" data-carousel-case="vertical" opts={{ loop: false, align: "start" }}><CarouselContent class="h-32"><CarouselItem>Vertical first</CarouselItem><CarouselItem>Vertical middle</CarouselItem><CarouselItem>Vertical last</CarouselItem></CarouselContent><CarouselPrevious aria-label="Vertical previous"/><CarouselNext aria-label="Vertical next"/></Carousel><Carousel orientation="horizontal" dir="rtl" data-carousel-case="explicit-rtl" opts={{ loop: false, align: "start" }}><CarouselContent><CarouselItem>Explicit RTL first</CarouselItem><CarouselItem>Explicit RTL middle</CarouselItem><CarouselItem>Explicit RTL last</CarouselItem></CarouselContent><CarouselPrevious aria-label="Explicit previous"/><CarouselNext aria-label="Explicit next"/></Carousel></div>`,
    physicalExceptions: [
      "Carousel arrows keep their physical key meaning while control placement and icons follow reading direction",
    ],
  },
  {
    row: "checkbox",
    exports: ["Checkbox"],
    body: `<div class="flex flex-col gap-4"><Checkbox id="checkbox-ar" name="alerts" value="arabic" label="تنبيهات عربية Arabic alerts" defaultChecked data-direction-focus/><Checkbox id="checkbox-mixed" name="alerts" value="mixed" label="Mixed שלום 42" indeterminate/><Checkbox id="checkbox-disabled" disabled label="معطل Disabled"/></div>`,
  },
  {
    row: "checkbox-group",
    exports: ["CheckboxGroup"],
    dependencies: { checkbox: ["Checkbox"] },
    body: `<form data-checkbox-form><CheckboxGroup name="preferences" defaultValue={["email"]} aria-label="خيارات التنبيه Notification preferences"><Checkbox id="group-email" name="preferences" value="email" label="البريد Email" data-direction-focus/><Checkbox id="group-sms" name="preferences" value="sms" label="رسالة نصية SMS שלום"/><Checkbox id="group-disabled" name="preferences" value="disabled" label="معطل Disabled" disabled/></CheckboxGroup><button type="reset">Reset</button></form>`,
  },
  {
    row: "collapsible",
    exports: ["Collapsible", "CollapsibleContent", "CollapsibleTrigger"],
    body: `<Collapsible defaultOpen><CollapsibleTrigger data-direction-focus>تفاصيل الحساب Account details</CollapsibleTrigger><CollapsibleContent><p>معلومات إضافية More information שלום 42</p></CollapsibleContent></Collapsible>`,
  },
  {
    row: "color-picker",
    exports: [
      "ColorPicker",
      "ColorPickerInput",
      "ColorPickerTrigger",
      "ColorPickerContent",
      "ColorPickerArea",
      "ColorPickerChannelSlider",
      "ColorPickerChannelInput",
      "ColorPickerValueSwatch",
      "ColorPickerSwatchGroup",
      "ColorPickerSwatch",
      "ColorPickerEyeDropper",
      "ColorPickerClear",
    ],
    body: `<ColorPicker label="لون Color" defaultValue="#ef4444" defaultOpen>
      <ColorPickerInput aria-label="قيمة اللون Color value"/><ColorPickerValueSwatch/><ColorPickerTrigger aria-label="Open color picker" data-direction-focus/>
      <ColorPickerContent aria-label="محرر الألوان Color editor"><ColorPickerArea aria-label="Color area"/><ColorPickerChannelSlider channel="hue" aria-label="Hue"/><ColorPickerChannelInput channel="hue" aria-label="Hue value"/><ColorPickerChannelSlider channel="alpha" orientation="vertical" aria-label="Alpha vertical"/><ColorPickerChannelInput channel="alpha" aria-label="Alpha value"/><ColorPickerSwatchGroup aria-label="Suggested colors"><ColorPickerSwatch value="#ef4444" aria-label="Red swatch"/><ColorPickerSwatch value="#22c55e" aria-label="Green swatch"/></ColorPickerSwatchGroup><ColorPickerEyeDropper aria-label="Pick color">Pick color</ColorPickerEyeDropper><ColorPickerClear aria-label="Clear color">Clear</ColorPickerClear></ColorPickerContent>
    </ColorPicker><ColorPicker dir="rtl" data-color-picker-case="explicit-rtl" label="لون RTL" defaultValue="#ef4444"><ColorPickerInput aria-label="RTL color value"/><ColorPickerValueSwatch/><ColorPickerTrigger aria-label="Open RTL color picker"/><ColorPickerContent aria-label="RTL color editor"><ColorPickerArea aria-label="RTL color area"/><ColorPickerChannelSlider channel="hue" aria-label="RTL hue"/><ColorPickerChannelInput channel="hue" aria-label="RTL hue value"/></ColorPickerContent></ColorPicker>`,
    physicalExceptions: [
      "Color Picker hue and alpha axes keep their physical meanings; the horizontal area and channel values follow inline direction",
    ],
  },
  {
    row: "combobox",
    exports: [
      "Combobox",
      "ComboboxClear",
      "ComboboxContent",
      "ComboboxEmpty",
      "ComboboxGroup",
      "ComboboxGroupLabel",
      "ComboboxInput",
      "ComboboxInputGroup",
      "ComboboxItem",
      "ComboboxItemIndicator",
      "ComboboxItemText",
      "ComboboxLabel",
      "ComboboxSeparator",
      "ComboboxTrigger",
      "ComboboxValue",
    ],
    body: `<Combobox defaultOpen><ComboboxLabel>الدولة Country</ComboboxLabel><ComboboxInputGroup><ComboboxInput placeholder="ابحث Search" data-direction-focus/><ComboboxTrigger aria-label="Open countries"/><ComboboxClear aria-label="Clear country"/></ComboboxInputGroup><ComboboxValue placeholder="Choose a country"/><ComboboxContent><ComboboxEmpty>No countries found</ComboboxEmpty><ComboboxGroup><ComboboxGroupLabel>Countries</ComboboxGroupLabel><ComboboxItem value="israel"><ComboboxItemIndicator/>ישראל Israel</ComboboxItem><ComboboxItem value="egypt"><ComboboxItemIndicator/><ComboboxItemText>مصر Egypt</ComboboxItemText></ComboboxItem></ComboboxGroup><ComboboxSeparator/></ComboboxContent></Combobox>`,
    physicalExceptions: [
      "Combobox input caret and typing retain native text direction while popup placement follows its owner",
    ],
  },
  {
    row: "context-menu",
    exports: [
      "ContextMenu",
      "ContextMenuCheckboxItem",
      "ContextMenuCheckboxItemIndicator",
      "ContextMenuContent",
      "ContextMenuGroup",
      "ContextMenuItem",
      "ContextMenuLabel",
      "ContextMenuRadioGroup",
      "ContextMenuRadioItem",
      "ContextMenuRadioItemIndicator",
      "ContextMenuSeparator",
      "ContextMenuShortcut",
      "ContextMenuSub",
      "ContextMenuSubContent",
      "ContextMenuSubTrigger",
      "ContextMenuTrigger",
    ],
    body: `<ContextMenu><ContextMenuTrigger><button type="button" data-context-trigger data-direction-focus>Right click באזור הפעולה Action area</button></ContextMenuTrigger><ContextMenuContent><ContextMenuLabel>خيارات Options</ContextMenuLabel><ContextMenuGroup><ContextMenuItem>نسخ Copy<ContextMenuShortcut>⌘C</ContextMenuShortcut></ContextMenuItem><ContextMenuCheckboxItem defaultChecked><ContextMenuCheckboxItemIndicator/>Keep open</ContextMenuCheckboxItem><ContextMenuRadioGroup defaultValue="rtl"><ContextMenuRadioItem value="rtl"><ContextMenuRadioItemIndicator/>RTL</ContextMenuRadioItem><ContextMenuRadioItem value="ltr"><ContextMenuRadioItemIndicator/>LTR</ContextMenuRadioItem></ContextMenuRadioGroup></ContextMenuGroup><ContextMenuSeparator/><ContextMenuSub><ContextMenuSubTrigger>خيارات إضافية More</ContextMenuSubTrigger><ContextMenuSubContent><ContextMenuItem>تفاصيل Details</ContextMenuItem></ContextMenuSubContent></ContextMenuSub></ContextMenuContent></ContextMenu>`,
    physicalExceptions: [
      "Context-menu pointer anchors and collision coordinates remain physical viewport coordinates",
    ],
  },
  {
    row: "dialog",
    exports: [
      "Dialog",
      "DialogClose",
      "DialogContent",
      "DialogDescription",
      "DialogFooter",
      "DialogHeader",
      "DialogTitle",
      "DialogTrigger",
    ],
    body: `<Dialog><DialogTrigger data-direction-focus>Open dialog</DialogTrigger><DialogContent><DialogHeader><DialogTitle>إعدادات الحساب Account settings</DialogTitle><DialogDescription>تحديث بيانات المستخدم Update user details שלום.</DialogDescription></DialogHeader><DialogFooter><DialogClose>إغلاق Close</DialogClose><Button>حفظ Save</Button></DialogFooter></DialogContent></Dialog>`,
    dependencies: { button: ["Button"] },
    physicalExceptions: [
      "Dialog centering and authored physical side options retain their physical coordinate meaning",
    ],
  },
];

function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function scopeProbe(spec: ControlSpec): string {
  switch (spec.row) {
    case "accordion":
      return `<Accordion data-direction-probe type="single" defaultValue="scope"><AccordionItem value="scope"><AccordionTrigger>Scope accordion</AccordionTrigger><AccordionContent>Scope content</AccordionContent></AccordionItem></Accordion>`;
    case "alert":
      return `<Alert data-direction-probe><AlertTitle>تنبيه Scope alert</AlertTitle><AlertDescription>Mixed שלום 42</AlertDescription></Alert>`;
    case "alert-dialog":
      return `<AlertDialog data-direction-probe><AlertDialogTrigger>Scope alert dialog</AlertDialogTrigger><AlertDialogContent><AlertDialogTitle>Scope title</AlertDialogTitle><AlertDialogDescription>Scope description</AlertDialogDescription><AlertDialogCancel>Cancel</AlertDialogCancel></AlertDialogContent></AlertDialog>`;
    case "aspect-ratio":
      return `<AspectRatio data-direction-probe ratio={1.5}>Scope 16:9</AspectRatio>`;
    case "avatar":
      return `<AvatarGroup data-direction-probe><Avatar size="sm"><AvatarFallback>س</AvatarFallback></Avatar><Avatar size="sm"><AvatarFallback>א</AvatarFallback></Avatar></AvatarGroup>`;
    case "badge":
      return `<Badge data-direction-probe>Scope חדש</Badge>`;
    case "breadcrumb":
      return `<Breadcrumb data-direction-probe><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="#scope">الرئيسية Scope</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator/><BreadcrumbItem><BreadcrumbPage aria-current="page">المنتج</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>`;
    case "button":
      return `<Button data-direction-probe>Scope action</Button>`;
    case "button-group":
      return `<ButtonGroup data-direction-probe><Button>Scope first</Button><Button>Scope last</Button></ButtonGroup>`;
    case "card":
      return `<Card data-direction-probe><CardHeader><CardTitle>Scope card</CardTitle><CardDescription>الوصف Mixed 42</CardDescription></CardHeader></Card>`;
    case "carousel":
      return `<Carousel data-direction-probe orientation="horizontal"><CarouselContent><CarouselItem><button>Scope one</button></CarouselItem><CarouselItem><button>Scope two</button></CarouselItem></CarouselContent><CarouselPrevious aria-label="Scope previous"/><CarouselNext aria-label="Scope next"/></Carousel>`;
    case "checkbox":
      return `<Checkbox data-direction-probe label="Scope option"/>`;
    case "checkbox-group":
      return `<CheckboxGroup data-direction-probe aria-label="Scope choices"><Checkbox value="scope" label="Scope choice"/></CheckboxGroup>`;
    case "collapsible":
      return `<Collapsible data-direction-probe defaultOpen><CollapsibleTrigger>Scope details</CollapsibleTrigger><CollapsibleContent>Scope content</CollapsibleContent></Collapsible>`;
    case "color-picker":
      return `<ColorPicker data-direction-probe label="Scope color" defaultValue="#ef4444"/>`;
    case "combobox":
      return `<Combobox data-direction-probe><ComboboxLabel>Scope country</ComboboxLabel><ComboboxInputGroup><ComboboxInput placeholder="Scope search"/></ComboboxInputGroup><ComboboxContent/></Combobox>`;
    case "context-menu":
      return `<ContextMenu data-direction-probe><ContextMenuTrigger><button type="button">Scope actions</button></ContextMenuTrigger><ContextMenuContent><ContextMenuItem>Scope item</ContextMenuItem></ContextMenuContent></ContextMenu>`;
    case "dialog":
      return `<Dialog data-direction-probe><DialogTrigger>Scope dialog</DialogTrigger><DialogContent><DialogTitle>Scope title</DialogTitle><DialogClose>Close</DialogClose></DialogContent></Dialog>`;
    default:
      throw new Error(`Missing direction scope probe for ${spec.row}`);
  }
}

function sourceFor(target: Target, spec: ControlSpec): string {
  const componentPath = `@direction/styled-${target}/${spec.row}`;
  const imports = [
    `import { ${spec.exports.join(", ")} } from "${componentPath}";`,
    ...Object.entries(spec.dependencies ?? {}).map(
      ([component, names]) =>
        `import { ${names.join(", ")} } from "@direction/styled-${target}/${component}";`,
    ),
  ].join("\n");
  const adaptMarkup = (markup: string) =>
    markup
      .replaceAll("class=", target === "react" ? "className=" : "class=")
      .replaceAll("ratio={1.5}", target === "vue" ? ':ratio="1.5"' : "ratio={1.5}")
      .replaceAll(
        'opts={{ loop: false, align: "start" }}',
        target === "vue"
          ? ":opts=\"{ loop: false, align: 'start' }\""
          : 'opts={{ loop: false, align: "start" }}',
      )
      .replaceAll(
        'opts={{ loop: true, align: "start" }}',
        target === "vue"
          ? ":opts=\"{ loop: true, align: 'start' }\""
          : 'opts={{ loop: true, align: "start" }}',
      )
      .replaceAll(
        'defaultValue={["email"]}',
        target === "vue" ? ":defaultValue=\"['email']\"" : 'defaultValue={["email"]}',
      );
  const carouselApiProp =
    spec.row === "carousel"
      ? target === "vue"
        ? ':setApi="setDirectionCarouselApi"'
        : target === "astro"
          ? ""
          : "setApi={setDirectionCarouselApi}"
      : "";
  const carouselRtlApiProp =
    spec.row === "carousel"
      ? target === "vue"
        ? ':setApi="setDirectionCarouselRtlApi"'
        : target === "astro"
          ? ""
          : "setApi={setDirectionCarouselRtlApi}"
      : "";
  const body = adaptMarkup(
    spec.row === "carousel"
      ? spec.body
          .replace('data-carousel-case="drag"', `data-carousel-case="drag" ${carouselApiProp}`)
          .replace(
            'data-carousel-case="explicit-rtl"',
            `data-carousel-case="explicit-rtl" ${carouselRtlApiProp}`,
          )
      : spec.body,
  );
  const nestedProbe = adaptMarkup(scopeProbe(spec));
  const island = (direction: "ltr" | "rtl", content: string, index: number) => {
    const nestedContent =
      spec.row === "avatar" && index === 1
        ? nestedProbe.replace("data-direction-probe", 'dir="ltr" data-direction-probe')
        : content;
    return `<div data-direction-island="${direction}" dir="${direction}"><span data-direction-island-text>${direction} nested text / مرحبا 42</span><div data-direction-probe-host>${nestedContent}</div>`;
  };
  const scopes = `${island("ltr", nestedProbe, 0)}${island("rtl", nestedProbe, 1)}${island("ltr", nestedProbe, 2)}${island("rtl", nestedProbe, 3)}</div></div></div></div>`;
  const content = `<main><div data-direction-parent dir="ltr"><div data-direction-scope dir="ltr"><section data-direction-primary>${body}</section><div data-direction-text dir="auto" data-direction-marker>مرحبا Product 42 שלום</div>${scopes}<label for="direction-label-probe">قيمة مختلطة Mixed value</label><input id="direction-label-probe" data-direction-label-probe value="Invoice 42 / مرحبا"/><button type="button" data-direction-focus aria-label="Direction probe">Direction probe</button></div></div></main>`;

  if (target === "astro")
    return `---\n${imports}\nimport "@direction/sheet";\n---\n<html lang="ar" dir="ltr"><head><meta charset="utf-8"/><title>Direction ${spec.row}</title></head><body>${content}${spec.row === "carousel" ? `<script>import { createCarousel } from "@starwind-ui/runtime/carousel"; const root = document.querySelector('[data-carousel-case="drag"]'); const rtlRoot = document.querySelector('[data-carousel-case="explicit-rtl"]'); const host = window as Window & { __directionCarouselApi?: unknown; __directionCarouselRtlApi?: unknown }; if (root) host.__directionCarouselApi = createCarousel(root as HTMLElement).api; if (rtlRoot) host.__directionCarouselRtlApi = createCarousel(rtlRoot as HTMLElement).api;</script>` : ""}</body></html>`;
  const carouselApiRecorder =
    spec.row === "carousel"
      ? `const setDirectionCarouselApi = (api: import("embla-carousel").EmblaCarouselType) => { (window as Window & { __directionCarouselApi?: import("embla-carousel").EmblaCarouselType }).__directionCarouselApi = api; }; const setDirectionCarouselRtlApi = (api: import("embla-carousel").EmblaCarouselType) => { (window as Window & { __directionCarouselRtlApi?: import("embla-carousel").EmblaCarouselType }).__directionCarouselRtlApi = api; };\n`
      : "";
  if (target === "react")
    return `import { createRoot } from "react-dom/client";\n${imports}\nimport "@direction/sheet";\n${carouselApiRecorder}function App() { return ${content}; }\ncreateRoot(document.getElementById("app")!).render(<App />);`;
  if (target === "vue")
    return `<script setup lang="ts">\n${imports}\nimport "@direction/sheet";\n${carouselApiRecorder}</script>\n<template>${content}</template>`;
  return `<script lang="ts">\n${imports}\nimport "@direction/sheet";\n${carouselApiRecorder}</script>\n${content}`;
}

function assertionsFor(spec: ControlSpec): string[] {
  const behaviorAssertion: Record<string, string> = {
    avatar: "avatar-overlap-rings-fallback-and-sizes",
    "button-group": "button-group-joined-corners-and-seams",
    carousel: "carousel-drag-keys-loop-reinit-and-vertical",
    "checkbox-group": "checkbox-group-dom-order-values-and-reset",
    "color-picker": "color-picker-area-channel-pointer-key-and-values",
    "context-menu": "context-menu-checkbox-radio-and-submenu",
  };
  const assertions = [
    "public-parts-render-in-valid-composition",
    "ltr-baseline-accessibility-focus-and-content",
    "ltr-bounds-variants-and-motion-captures-before-direction-change",
    behaviorAssertion[spec.row] ?? `row-specific-${spec.row}-semantics`,
    "explicit-inherited-and-nested-alternating-directions",
  ];
  if (spec.row === "context-menu")
    assertions.splice(
      4,
      0,
      "context-menu-portal-inherits-owner-direction",
      "context-menu-physical-edge-collision-bounds",
    );
  if (spec.row === "color-picker")
    assertions.splice(
      4,
      0,
      "color-picker-rtl-pointer-thumb-mapping",
      "color-picker-rtl-keyboard-thumb-mapping",
    );
  if (ownerBoundPopupRows.has(spec.row)) assertions.push("owner-bound-popup-direction");
  return assertions;
}

const ownerBoundPopupRows = new Set(["alert-dialog", "combobox", "dialog"]);

// Set dir on the component owner and open its popup. The portalled popup must paint with the
// owner direction.
async function assertOwnerBoundPopupDirection(
  page: Page,
  row: string,
  context: DirectionAssertionContext | undefined,
): Promise<void> {
  const owner = page.locator(`[data-direction-primary] [data-slot="${row}"]`).first();
  await owner.evaluate((element) => {
    element.setAttribute("dir", "rtl");
    element.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
  });
  const controlledId =
    row === "combobox"
      ? await owner.locator("[aria-controls]").first().getAttribute("aria-controls")
      : null;
  if (row === "combobox") assert(controlledId, "Combobox owner lacks a popup association");
  const popup =
    row === "combobox"
      ? page.locator(`[id="${controlledId}"][data-slot="combobox-content"]:visible`)
      : page.locator(`[data-slot="${row}-content"]:visible`).last();
  if (row !== "combobox") await owner.locator(`[data-slot="${row}-trigger"]`).click();
  await popup.waitFor({ state: "visible" });
  const ownerDirection = await owner.evaluate((element) => getComputedStyle(element).direction);
  const measured = await popup.evaluate((element) => ({
    direction: getComputedStyle(element).direction,
    state: element.getAttribute("data-state"),
    visible: element.getBoundingClientRect().width > 0,
  }));
  observe(context, `${row}PopupDirection`, { ownerDirection, ...measured });
  assert.equal(ownerDirection, "rtl", `${row} owner direction changed`);
  assert.equal(measured.direction, "rtl", `${row} portal lost its owner direction`);
  assert.equal(measured.state, "open", `${row} popup is not open`);
  assert.equal(measured.visible, true, `${row} popup did not paint`);
  if (row !== "combobox") await page.keyboard.press("Escape");
}

async function assertRowSemantics(
  page: Page,
  spec: ControlSpec,
  primary: ReturnType<Page["locator"]>,
  context?: DirectionAssertionContext,
): Promise<void> {
  const root = primary.locator(`[data-slot="${spec.row}"]`).first();
  const within = (selector: string) => primary.locator(selector);
  if (spec.row === "accordion") {
    assert.equal(
      await root.locator('[data-slot="accordion-trigger"]').first().getAttribute("aria-expanded"),
      "true",
    );
    assert.equal(await root.locator('[data-slot="accordion-trigger"]').nth(1).isDisabled(), true);
  } else if (spec.row === "alert") {
    assert.equal(await root.getAttribute("role"), "status");
    assert((await root.locator('[data-slot="alert-title"]').textContent())?.includes("تنبيه"));
  } else if (spec.row === "alert-dialog") {
    const trigger = primary.getByRole("button", { name: "Open alert dialog" });
    assert.equal(await trigger.count(), 1);
    await trigger.focus();
    await page.keyboard.press("Enter");
    const popup = page.getByRole("alertdialog");
    await popup.waitFor({ state: "visible" });
    const popupBounds = await popup.boundingBox();
    observe(context, "ltr-open-popup-bounds", popupBounds);
    assert(popupBounds && popupBounds.width > 0 && popupBounds.height > 0);
    assert(Math.abs(popupBounds.x + popupBounds.width / 2 - 640) < 2);
    assert(Math.abs(popupBounds.y + popupBounds.height / 2 - 450) < 2);
    const footerText =
      (await popup.locator('[data-slot="alert-dialog-footer"]').textContent()) ?? "";
    assert(
      footerText.includes("إلغاء") &&
        footerText.includes("متابعة") &&
        footerText.indexOf("إلغاء") < footerText.indexOf("متابعة"),
    );
    assert.equal(
      await popup.locator('[data-slot="alert-dialog-title"]').textContent(),
      "تأكيد الإجراء Confirm action",
    );
    assert.equal(await popup.evaluate((element) => element.contains(document.activeElement)), true);
    await page.keyboard.press("Escape");
    await waitHidden(popup);
    assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
  } else if (spec.row === "aspect-ratio") {
    const bounds = await root.locator("xpath=..").boundingBox();
    assert(bounds && Math.abs(bounds.width / bounds.height - 1.5) < 0.03);
  } else if (spec.row === "avatar") {
    const sizes = ["sm", "md", "lg"] as const;
    const measurements = [];
    for (const size of sizes) {
      const group = primary.locator(`[data-avatar-case="${size}"]`);
      const avatars = group.locator('[data-slot="avatar"]');
      const boxes = await avatars.evaluateAll((elements) =>
        elements.map((element) => {
          const bounds = element.getBoundingClientRect();
          return { x: bounds.x, width: bounds.width, size: element.getAttribute("data-size") };
        }),
      );
      const appearance = await avatars.evaluateAll((elements) =>
        elements.map((element) => ({
          className: (element as HTMLElement).className,
          ring: getComputedStyle(element).boxShadow,
        })),
      );
      measurements.push({ size, boxes, appearance });
      assert.equal(boxes.length, 3);
      assert(boxes.every((box) => box.width > 0));
      assert(
        boxes.every(
          (box, index) => index === 0 || box.x < boxes[index - 1]!.x + boxes[index - 1]!.width,
        ),
      );
      assert(boxes.every((box) => box.size === size));
      assert(appearance.every((style) => style.ring !== "none"));
    }
    observe(context, "avatar-size-overlap-ring-measurements", measurements);
    const groupWidths = measurements.map(({ boxes }) => boxes[0]!.width);
    assert(groupWidths[0]! < groupWidths[1]! && groupWidths[1]! < groupWidths[2]!);
    assert.equal(
      await within('[data-avatar-case="sm"] [data-slot="avatar-image"]')
        .first()
        .getAttribute("alt"),
      "صورة سلمى Salma",
    );
    const brokenImageFallback = primary.locator('[data-avatar-case="sm"] [data-avatar-fallback]');
    await brokenImageFallback.waitFor({ state: "visible", timeout: 2000 });
    assert.equal(await brokenImageFallback.count(), 1);
    assert(
      (await within('[data-slot="avatar-group-count"]').first().textContent())?.includes("+3"),
    );
  } else if (spec.row === "badge") {
    assert.equal(await within('[data-slot="badge"]').count(), 4);
    assert.equal(await within('[data-slot="badge"] a[href="#badge"]').count(), 1);
  } else if (spec.row === "breadcrumb") {
    assert.equal(await within('[aria-current="page"]').count(), 1);
    assert.equal(await within('[data-slot="breadcrumb-separator"]').count(), 3);
  } else if (spec.row === "button") {
    assert.equal(await within('[data-slot="button"]:disabled').count(), 1);
    assert.equal(await within('[data-slot="button"][href="#button"]').count(), 1);
    assert.equal(await within('[data-slot="button"]').count(), 4);
  } else if (spec.row === "button-group") {
    assert.equal(await within('[data-slot="button-group-separator"]').count(), 2);
    assert.equal(await within('[data-slot="button-group-text"]').count(), 2);
    assert.equal(await within('[data-slot="button"][href="#group"]').count(), 1);
    const joinedMeasurements = [];
    const joinedViolations: Array<Record<string, unknown>> = [];
    for (const name of ["plain-pair", "composed", "select-wrapper", "dropdown-wrapper"] as const) {
      const joined = primary.locator(`[data-button-group-case="${name}"]`);
      const buttons = joined.locator("button, a");
      const corners = await buttons.evaluateAll((elements) =>
        elements.map((element) => {
          const style = getComputedStyle(element);
          const bounds = element.getBoundingClientRect();
          return {
            x: bounds.x,
            width: bounds.width,
            topLeft: style.borderTopLeftRadius,
            topRight: style.borderTopRightRadius,
            bottomLeft: style.borderBottomLeftRadius,
            bottomRight: style.borderBottomRightRadius,
            borderLeft: style.borderLeftWidth,
            borderRight: style.borderRightWidth,
            tagName: element.tagName.toLowerCase(),
            slot: element.getAttribute("data-slot"),
            menuTrigger: element.hasAttribute("data-sw-menu-trigger"),
          };
        }),
      );
      const ltrSeamWidth: number | null =
        corners.length >= 2
          ? Number.parseFloat(corners[0]!.borderRight) + Number.parseFloat(corners[1]!.borderLeft)
          : null;
      await joined.evaluate((element) => element.setAttribute("dir", "rtl"));
      const rtlCorners = await buttons.evaluateAll((elements) =>
        elements.map((element) => {
          const style = getComputedStyle(element);
          return {
            topLeft: style.borderTopLeftRadius,
            topRight: style.borderTopRightRadius,
            bottomLeft: style.borderBottomLeftRadius,
            bottomRight: style.borderBottomRightRadius,
            borderLeft: style.borderLeftWidth,
            borderRight: style.borderRightWidth,
          };
        }),
      );
      const rtlSeamWidth: number | null =
        rtlCorners.length >= 2
          ? Number.parseFloat(rtlCorners[0]!.borderLeft) +
            Number.parseFloat(rtlCorners[1]!.borderRight)
          : null;
      joinedMeasurements.push({ name, ltr: corners, ltrSeamWidth, rtl: rtlCorners, rtlSeamWidth });
      const radius = (corner: string | undefined) => Number.parseFloat(corner ?? "0");
      const recordRadius = (direction: "ltr" | "rtl", index: number, corner: string) => {
        const values = direction === "ltr" ? corners : rtlCorners;
        const value = radius(values[index]?.[corner as keyof (typeof values)[number]] as string);
        if (value <= 0) joinedViolations.push({ name, direction, index, corner, value });
      };
      for (const corner of ["topLeft", "bottomLeft"]) recordRadius("ltr", 0, corner);
      for (const corner of ["topRight", "bottomRight"]) recordRadius("ltr", 1, corner);
      for (const corner of ["topRight", "bottomRight"]) recordRadius("rtl", 0, corner);
      for (const corner of ["topLeft", "bottomLeft"]) recordRadius("rtl", 1, corner);
      if (ltrSeamWidth !== 1) joinedViolations.push({ name, direction: "ltr", seam: ltrSeamWidth });
      if (rtlSeamWidth !== 1) joinedViolations.push({ name, direction: "rtl", seam: rtlSeamWidth });
    }
    observe(context, "button-group-joined-corners-and-seams", {
      joinedMeasurements,
      joinedViolations,
    });
    assert(
      joinedMeasurements.every(
        ({ ltr }) => ltr.length === 2 && ltr.every((item) => item.width > 0),
      ),
    );
    assert.deepEqual(
      joinedViolations,
      [],
      "joined wrappers should preserve both logical outer corners and a single seam",
    );
  } else if (spec.row === "card") {
    const action = page.locator('[data-slot="card-action"]').first();
    // Tailwind sets `justify-self: flex-end`. Chrome 158 and later report that value as
    // `flow-end`.
    assert(
      ["end", "flex-end", "flow-end"].includes(
        await action.evaluate((element) => getComputedStyle(element).justifySelf),
      ),
    );
  } else if (spec.row === "carousel") {
    const dragCarousel = primary.locator('[data-carousel-case="drag"]');
    assert.equal(await dragCarousel.locator('[data-slot="carousel-item"]').count(), 3);
    assert.equal(await primary.locator('[data-slot="carousel-previous"]').count(), 4);
    assert.equal(await primary.locator('[data-slot="carousel-next"]').count(), 4);
    const previous = dragCarousel.getByRole("button", { name: "Previous slide" });
    const next = dragCarousel.getByRole("button", { name: "Next slide" });
    assert.equal(await previous.isDisabled(), true, "first slide disables Previous");
    const viewport = dragCarousel.locator('[data-slot="carousel-content"]');
    const beforeDrag = await dragCarousel
      .locator('[data-slot="carousel-item"]')
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().x));
    const viewportBounds = await viewport.boundingBox();
    assert(viewportBounds);
    await page.mouse.move(
      viewportBounds.x + viewportBounds.width * 0.82,
      viewportBounds.y + viewportBounds.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      viewportBounds.x + viewportBounds.width * 0.18,
      viewportBounds.y + viewportBounds.height / 2,
      { steps: 8 },
    );
    await page.mouse.up();
    await page.waitForTimeout(150);
    const afterDrag = await dragCarousel
      .locator('[data-slot="carousel-item"]')
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().x));
    observe(context, "carousel-drag-item-x-before-after", { beforeDrag, afterDrag });
    assert.notDeepEqual(afterDrag, beforeDrag, "drag should move carousel slides");
    assert(afterDrag[0]! < beforeDrag[0]!, "dragging toward the left should move the track left");
    await page.waitForFunction(() =>
      Boolean((window as Window & { __directionCarouselApi?: unknown }).__directionCarouselApi),
    );
    await page.evaluate(() => {
      const api = (
        window as Window & {
          __directionCarouselApi?: { scrollTo(index: number, jump?: boolean): void };
        }
      ).__directionCarouselApi;
      api?.scrollTo(0, true);
    });
    await next.focus();
    await page.keyboard.press("ArrowRight");
    const afterRight = await page.evaluate(() =>
      (
        window as Window & {
          __directionCarouselApi?: { selectedScrollSnap(): number };
        }
      ).__directionCarouselApi?.selectedScrollSnap(),
    );
    await page.keyboard.press("ArrowLeft");
    const afterLeft = await page.evaluate(() =>
      (
        window as Window & {
          __directionCarouselApi?: { selectedScrollSnap(): number };
        }
      ).__directionCarouselApi?.selectedScrollSnap(),
    );
    observe(context, "carousel-spatial-arrow-right-left-snap", { afterRight, afterLeft });
    assert.equal(afterRight, 1, "ArrowRight should advance one horizontal slide");
    assert.equal(afterLeft, 0, "ArrowLeft should return to the previous horizontal slide");
    await next.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    assert.equal(await next.isDisabled(), true, "the last slide disables Next");
    assert.equal(await previous.isDisabled(), false, "the last slide keeps Previous enabled");
    await page.evaluate(() => {
      const api = (
        window as Window & {
          __directionCarouselApi?: { scrollTo(index: number, jump?: boolean): void };
        }
      ).__directionCarouselApi;
      api?.scrollTo(0, true);
    });
    assert.equal(await previous.isVisible(), true);
    for (const name of ["loop", "vertical", "explicit-rtl"]) {
      const carousel = primary.locator(`[data-carousel-case="${name}"]`);
      assert.equal(await carousel.getAttribute("data-axis"), name === "vertical" ? "y" : "x");
      assert.equal(await carousel.locator('[data-slot="carousel-item"]').count(), 3);
    }
    const loop = primary.locator('[data-carousel-case="loop"]');
    const loopNext = loop.getByRole("button", { name: "Loop next" });
    for (let index = 0; index < 3; index++) await loopNext.click();
    assert.equal(
      await loopNext.isDisabled(),
      false,
      "loop carousel next control should remain enabled",
    );
    await page.waitForFunction(() =>
      Boolean((window as Window & { __directionCarouselApi?: unknown }).__directionCarouselApi),
    );
    await page.evaluate(() => {
      const api = (
        window as Window & {
          __directionCarouselApi?: {
            scrollTo(index: number, jump?: boolean): void;
            reInit(options?: { align?: string; loop?: boolean }): void;
            canScrollPrev(): boolean;
          };
        }
      ).__directionCarouselApi;
      api?.scrollTo(0, true);
    });
    const beforeReInit = await page.evaluate(() =>
      (
        window as Window & { __directionCarouselApi?: { canScrollPrev(): boolean } }
      ).__directionCarouselApi?.canScrollPrev(),
    );
    await page.evaluate(() => {
      const api = (
        window as Window & {
          __directionCarouselApi?: { reInit(options?: { align?: string; loop?: boolean }): void };
        }
      ).__directionCarouselApi;
      api?.reInit({ align: "start", loop: true });
    });
    const afterReInit = await page.evaluate(() =>
      (
        window as Window & { __directionCarouselApi?: { canScrollPrev(): boolean } }
      ).__directionCarouselApi?.canScrollPrev(),
    );
    observe(context, "carousel-reinit-prev-capability", { beforeReInit, afterReInit });
    assert.equal(beforeReInit, false);
    assert.equal(afterReInit, true, "reInit should apply loop options to the live API");
    const vertical = primary.locator('[data-carousel-case="vertical"]');
    assert.equal(
      await vertical.evaluate((element) => getComputedStyle(element).direction),
      "ltr",
      "vertical orientation should retain the existing horizontal page direction",
    );
    const verticalPreviousBounds = await vertical
      .getByRole("button", { name: "Vertical previous" })
      .boundingBox();
    const verticalNextBounds = await vertical
      .getByRole("button", { name: "Vertical next" })
      .boundingBox();
    observe(context, "carousel-vertical-control-bounds", {
      previous: verticalPreviousBounds,
      next: verticalNextBounds,
    });
    assert(
      verticalPreviousBounds &&
        verticalNextBounds &&
        verticalPreviousBounds.y < verticalNextBounds.y,
      "vertical controls should keep their physical top and bottom positions",
    );
    const verticalBefore = await vertical
      .locator('[data-slot="carousel-item"]')
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().y));
    const verticalNext = vertical.getByRole("button", { name: "Vertical next" });
    assert.equal(await verticalNext.isDisabled(), false);
    await verticalNext.focus();
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(120);
    const verticalXs = await vertical
      .locator('[data-slot="carousel-item"]')
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().y));
    observe(context, "carousel-vertical-next-item-y", {
      before: verticalBefore,
      after: verticalXs,
    });
    assert.notDeepEqual(verticalXs, verticalBefore, "the vertical next control should move slides");
    const explicitRtl = primary.locator('[data-carousel-case="explicit-rtl"]');
    assert.equal(
      await explicitRtl.evaluate((element) => getComputedStyle(element).direction),
      "rtl",
    );
    await page.waitForFunction(() =>
      Boolean(
        (window as Window & { __directionCarouselRtlApi?: unknown }).__directionCarouselRtlApi,
      ),
    );
    const readExplicitSnap = () =>
      page.evaluate(() =>
        (
          window as Window & {
            __directionCarouselRtlApi?: { selectedScrollSnap(): number };
          }
        ).__directionCarouselRtlApi?.selectedScrollSnap(),
      );
    const scrollExplicitTo = (index: number) =>
      page.evaluate(
        (value) =>
          (
            window as Window & {
              __directionCarouselRtlApi?: { scrollTo(index: number, jump?: boolean): void };
            }
          ).__directionCarouselRtlApi?.scrollTo(value, true),
        index,
      );
    const explicitPositions = () =>
      explicitRtl
        .locator('[data-slot="carousel-item"]')
        .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().x));
    const explicitViewport = await explicitRtl
      .locator('[data-slot="carousel-content"]')
      .boundingBox();
    const explicitSlideWidth = (
      await explicitRtl.locator('[data-slot="carousel-item"]').first().boundingBox()
    )?.width;
    assert(explicitViewport && explicitSlideWidth);
    const selectedVisible = (x: number) => {
      const left = Math.max(x, explicitViewport.x);
      const right = Math.min(x + explicitSlideWidth, explicitViewport.x + explicitViewport.width);
      return right - left >= explicitViewport.width * 0.75;
    };
    const waitForTrackSettle = async () => {
      await page.waitForTimeout(200);
      let previous = await explicitPositions();
      let stableSamples = 0;
      for (let attempt = 0; attempt < 30; attempt++) {
        await page.waitForTimeout(50);
        const current = await explicitPositions();
        const stable = current.every((x, index) => Math.abs(x - previous[index]!) < 0.1);
        stableSamples = stable ? stableSamples + 1 : 0;
        if (stableSamples >= 3) return true;
        previous = current;
      }
      return false;
    };
    await scrollExplicitTo(1);
    await page.waitForTimeout(50);
    const beforeRightSnap = await readExplicitSnap();
    const beforeRightX = await explicitPositions();
    await explicitRtl.getByRole("button", { name: "Explicit next" }).focus();
    await page.keyboard.press("ArrowRight");
    const rightSettled = await waitForTrackSettle();
    const afterRightSnap = await readExplicitSnap();
    const afterRightX = await explicitPositions();
    await scrollExplicitTo(1);
    await page.waitForTimeout(50);
    const beforeLeftSnap = await readExplicitSnap();
    const beforeLeftX = await explicitPositions();
    await explicitRtl.getByRole("button", { name: "Explicit previous" }).focus();
    await page.keyboard.press("ArrowLeft");
    const leftSettled = await waitForTrackSettle();
    const afterLeftSnap = await readExplicitSnap();
    const afterLeftX = await explicitPositions();
    const explicitRtlViolations: Array<Record<string, unknown>> = [];
    if (beforeRightSnap !== 1)
      explicitRtlViolations.push({
        key: "ArrowRight",
        issue: "started at wrong interior snap",
        beforeRightSnap,
      });
    if (afterRightSnap !== 0)
      explicitRtlViolations.push({
        key: "ArrowRight",
        issue: "wrong physical-right snap",
        afterRightSnap,
      });
    if (!(beforeRightX[0]! > beforeRightX[1]! && beforeRightX[1]! > beforeRightX[2]!))
      explicitRtlViolations.push({
        key: "ArrowRight",
        issue: "slide order does not flow from physical right to left",
        beforeRightX,
      });
    if (!selectedVisible(beforeRightX[1]!))
      explicitRtlViolations.push({
        key: "ArrowRight",
        issue: "interior slide was not visible before the key",
        before: beforeRightX[1],
      });
    if (!selectedVisible(afterRightX[0]!))
      explicitRtlViolations.push({
        key: "ArrowRight",
        issue: "physical-right slide did not enter the viewport",
        after: afterRightX[0],
      });
    if (afterRightX[0]! >= beforeRightX[0]!)
      explicitRtlViolations.push({
        key: "ArrowRight",
        issue: "track did not move left to reveal the physical-right slide",
        before: beforeRightX[0],
        after: afterRightX[0],
      });
    if (!rightSettled)
      explicitRtlViolations.push({ key: "ArrowRight", issue: "carousel did not settle" });
    if (beforeLeftSnap !== 1)
      explicitRtlViolations.push({
        key: "ArrowLeft",
        issue: "started at wrong interior snap",
        beforeLeftSnap,
      });
    if (afterLeftSnap !== 2)
      explicitRtlViolations.push({
        key: "ArrowLeft",
        issue: "wrong physical-left snap",
        afterLeftSnap,
      });
    if (!(beforeLeftX[0]! > beforeLeftX[1]! && beforeLeftX[1]! > beforeLeftX[2]!))
      explicitRtlViolations.push({
        key: "ArrowLeft",
        issue: "slide order does not flow from physical right to left",
        beforeLeftX,
      });
    if (!selectedVisible(beforeLeftX[1]!))
      explicitRtlViolations.push({
        key: "ArrowLeft",
        issue: "interior slide was not visible before the key",
        before: beforeLeftX[1],
      });
    if (!selectedVisible(afterLeftX[2]!))
      explicitRtlViolations.push({
        key: "ArrowLeft",
        issue: "physical-left slide did not enter the viewport",
        after: afterLeftX[2],
      });
    if (afterLeftX[0]! <= beforeLeftX[0]!)
      explicitRtlViolations.push({
        key: "ArrowLeft",
        issue: "track did not move right to reveal the physical-left slide",
        before: beforeLeftX[0],
        after: afterLeftX[0],
      });
    if (!leftSettled)
      explicitRtlViolations.push({ key: "ArrowLeft", issue: "carousel did not settle" });
    observe(context, "carousel-explicit-rtl-spatial-key-snap-and-x", {
      rightSettled,
      leftSettled,
      beforeRightSnap,
      afterRightSnap,
      beforeRightX,
      afterRightX,
      beforeLeftSnap,
      afterLeftSnap,
      beforeLeftX,
      afterLeftX,
      viewport: explicitViewport,
      slideWidth: explicitSlideWidth,
      selectedVisibility: {
        beforeRight: selectedVisible(beforeRightX[1]!),
        afterRight: selectedVisible(afterRightX[0]!),
        beforeLeft: selectedVisible(beforeLeftX[1]!),
        afterLeft: selectedVisible(afterLeftX[2]!),
      },
      violations: explicitRtlViolations,
    });
    assert.deepEqual(
      explicitRtlViolations,
      [],
      "explicit RTL physical arrow keys should reveal the adjacent slide in the viewport",
    );
  } else if (spec.row === "checkbox") {
    assert.equal(await primary.getByRole("checkbox").count(), 3);
    assert.equal(await primary.getByRole("checkbox").first().getAttribute("aria-checked"), "true");
    assert.equal(await primary.getByRole("checkbox").nth(2).isDisabled(), true);
  } else if (spec.row === "checkbox-group") {
    const group = primary.locator('[data-slot="checkbox-group"]');
    const form = primary.locator("[data-checkbox-form]");
    assert.equal(await group.count(), 1);
    assert.equal(await group.locator('[data-slot="checkbox-label"]').count(), 3);
    assert.equal(await group.getByRole("checkbox").count(), 3);
    const formValues = async () =>
      form.evaluate((element) => Array.from(new FormData(element as HTMLFormElement).entries()));
    const initialFormValues = await formValues();
    assert.deepEqual(initialFormValues, [["preferences", "email"]]);
    await group.getByRole("checkbox", { name: /رسالة نصية/ }).click();
    const selectedFormValues = await formValues();
    observe(context, "checkbox-group-form-dom-order-values", {
      initialFormValues,
      selectedFormValues,
    });
    assert.deepEqual(selectedFormValues, [
      ["preferences", "email"],
      ["preferences", "sms"],
    ]);
    await form.getByRole("button", { name: "Reset" }).click();
    await page.waitForTimeout(50);
    const resetValues = await formValues();
    observe(context, "checkbox-group-reset-values", resetValues);
    assert.deepEqual(resetValues, [["preferences", "email"]]);
  } else if (spec.row === "collapsible") {
    assert.equal(
      await within('[data-slot="collapsible-trigger"]').getAttribute("aria-expanded"),
      "true",
    );
    assert(
      (await within('[data-slot="collapsible-content"]').textContent())?.includes(
        "More information",
      ),
    );
  } else if (spec.row === "color-picker") {
    const pickerRoot = primary.locator('[data-slot="color-picker"]').first();
    assert.equal(await pickerRoot.locator('[data-slot="color-picker-area"]').count(), 1);
    assert.equal(await pickerRoot.locator('[data-slot="color-picker-channel-slider"]').count(), 2);
    assert.equal(await pickerRoot.locator('[data-slot="color-picker-swatch"]').count(), 2);
    assert.equal(await pickerRoot.locator('[data-slot="color-picker-clear"]').count(), 1);
    const displayedColor = async (picker: ReturnType<Page["locator"]>) =>
      picker
        .locator('[data-slot="color-picker-value-swatch-color"]')
        .first()
        .evaluate((element) => getComputedStyle(element).backgroundColor);
    const valueInput = pickerRoot.locator('[data-slot="color-picker-value-input"]').first();
    const area = pickerRoot.locator('[data-slot="color-picker-area"]');
    const areaBounds = await area.boundingBox();
    assert(areaBounds);
    const areaMeasurements = [];
    for (const ratio of [0.1, 0.5, 0.9]) {
      await page.mouse.click(
        areaBounds.x + areaBounds.width * ratio,
        areaBounds.y + areaBounds.height * 0.5,
      );
      const value = await primary
        .locator('[data-slot="color-picker-value-input"]')
        .first()
        .inputValue();
      const thumb = await area.locator('[data-slot="color-picker-area-thumb"]').boundingBox();
      areaMeasurements.push({
        ratio,
        value,
        thumb,
        displayedColor: await displayedColor(pickerRoot),
      });
    }
    observe(context, "color-picker-area-pointer-values-and-thumb", areaMeasurements);
    assert(areaMeasurements.every((entry) => /^#[0-9a-f]{6}$/i.test(entry.value)));
    assert.equal(new Set(areaMeasurements.map((entry) => entry.value)).size, 3);
    assert.equal(new Set(areaMeasurements.map((entry) => entry.displayedColor)).size, 3);
    assert(areaMeasurements[0]!.thumb!.x < areaMeasurements[1]!.thumb!.x);
    assert(areaMeasurements[1]!.thumb!.x < areaMeasurements[2]!.thumb!.x);
    const areaDragStartValue = areaMeasurements[0]!.value;
    await page.mouse.move(
      areaBounds.x + areaBounds.width * 0.1,
      areaBounds.y + areaBounds.height * 0.5,
    );
    await page.mouse.down();
    await page.mouse.move(
      areaBounds.x + areaBounds.width * 0.9,
      areaBounds.y + areaBounds.height * 0.5,
      { steps: 8 },
    );
    await page.mouse.up();
    const areaDragValue = await valueInput.inputValue();
    const areaDragThumb = await area.locator('[data-slot="color-picker-area-thumb"]').boundingBox();
    observe(context, "color-picker-area-drag-value-and-thumb", {
      beforeValue: areaDragStartValue,
      afterValue: areaDragValue,
      thumb: areaDragThumb,
      displayedColor: await displayedColor(pickerRoot),
    });
    assert.notEqual(areaDragValue, areaDragStartValue);
    const channel = pickerRoot.locator('[data-slot="color-picker-channel-slider"]').first();
    const channelBounds = await channel.boundingBox();
    assert(channelBounds);
    const channelInput = pickerRoot.locator('[data-slot="color-picker-channel-input"]').first();
    const initialChannelValue = await channelInput.inputValue();
    const channelMeasurements = [];
    for (const ratio of [0.1, 0.5, 0.9]) {
      await page.mouse.click(
        channelBounds.x + channelBounds.width * ratio,
        channelBounds.y + channelBounds.height / 2,
      );
      channelMeasurements.push({
        ratio,
        channelValue: await channelInput.inputValue(),
        value: await valueInput.inputValue(),
        thumb: await channel
          .locator('[data-slot="color-picker-channel-slider-thumb"]')
          .boundingBox(),
        displayedColor: await displayedColor(pickerRoot),
      });
    }
    observe(context, "color-picker-hue-channel-pointer-values-and-thumb", channelMeasurements);
    assert.equal(new Set(channelMeasurements.map((entry) => entry.channelValue)).size, 3);
    assert(channelMeasurements[0]!.thumb!.x < channelMeasurements[1]!.thumb!.x);
    assert(channelMeasurements[1]!.thumb!.x < channelMeasurements[2]!.thumb!.x);
    const channelDragStart = channelMeasurements[0]!.channelValue;
    await page.mouse.move(
      channelBounds.x + channelBounds.width * 0.1,
      channelBounds.y + channelBounds.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      channelBounds.x + channelBounds.width * 0.9,
      channelBounds.y + channelBounds.height / 2,
      { steps: 8 },
    );
    await page.mouse.up();
    const channelDragValue = await channelInput.inputValue();
    const channelThumbBeforeKey = await channel
      .locator('[data-slot="color-picker-channel-slider-thumb"]')
      .boundingBox();
    observe(context, "color-picker-hue-channel-drag-value-and-thumb", {
      before: channelDragStart,
      after: channelDragValue,
      value: await valueInput.inputValue(),
      thumb: channelThumbBeforeKey,
      displayedColor: await displayedColor(pickerRoot),
    });
    assert.notEqual(channelDragValue, channelDragStart);
    const channelKeyInput = channel.locator('[data-slot="color-picker-channel-slider-input"]');
    await channelKeyInput.focus();
    const beforeKeyValue = await channelInput.inputValue();
    await page.keyboard.press("ArrowRight");
    const afterArrowRight = await channelInput.inputValue();
    const rightThumb = await channel
      .locator('[data-slot="color-picker-channel-slider-thumb"]')
      .boundingBox();
    await page.keyboard.press("ArrowLeft");
    const afterArrowLeft = await channelInput.inputValue();
    const leftThumb = await channel
      .locator('[data-slot="color-picker-channel-slider-thumb"]')
      .boundingBox();
    const valueAfterKey = await valueInput.inputValue();
    const vertical = pickerRoot.locator(
      '[data-slot="color-picker-channel-slider"][data-orientation="vertical"]',
    );
    const verticalBounds = await vertical.boundingBox();
    observe(context, "color-picker-channel-pointer-key-value-and-vertical-bounds", {
      initialChannelValue,
      beforeKeyValue,
      afterArrowRight,
      afterArrowLeft,
      channelThumbBeforeKey,
      rightThumb,
      leftThumb,
      valueAfterKey,
      verticalBounds,
      orientation: await vertical.getAttribute("data-orientation"),
    });
    assert.notEqual(channelMeasurements[0]!.channelValue, initialChannelValue);
    assert.notEqual(afterArrowRight, beforeKeyValue);
    assert.equal(afterArrowLeft, beforeKeyValue);
    assert.notEqual(valueAfterKey, "#ef4444");
    assert(verticalBounds && verticalBounds.height > verticalBounds.width);
    const rtlPicker = primary.locator('[data-color-picker-case="explicit-rtl"]');
    const rtlDirection = await rtlPicker.evaluate((element) => getComputedStyle(element).direction);
    assert.equal(rtlDirection, "rtl");
    const rtlArea = rtlPicker.locator('[data-slot="color-picker-area"]');
    await rtlPicker.getByRole("button", { name: "Open RTL color picker" }).click();
    await rtlArea.waitFor({ state: "visible" });
    const popup = rtlPicker.locator('[data-slot="color-picker-content"]');
    await popup.evaluate(async (content) => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const animations = content.getAnimations({ subtree: true });
      await Promise.allSettled(animations.map((animation) => animation.finished));
    });
    const rtlAreaBounds = await rtlArea.boundingBox();
    assert(rtlAreaBounds);
    const rtlAreaMeasurements: Array<{
      ratio: number;
      value: string;
      thumb: BrowserBounds | null;
      thumbPosition: string;
      displayedColor: string;
    }> = [];
    for (const ratio of [0.1, 0.9]) {
      await page.mouse.click(
        rtlAreaBounds.x + rtlAreaBounds.width * ratio,
        rtlAreaBounds.y + rtlAreaBounds.height * 0.5,
      );
      rtlAreaMeasurements.push({
        ratio,
        value: await rtlPicker
          .locator('[data-slot="color-picker-value-input"]')
          .first()
          .inputValue(),
        thumb: await rtlArea.locator('[data-slot="color-picker-area-thumb"]').boundingBox(),
        thumbPosition: await rtlArea
          .locator('[data-slot="color-picker-area-thumb"]')
          .evaluate((element) =>
            (element as HTMLElement).style.getPropertyValue("--sw-color-picker-area-x"),
          ),
        displayedColor: await displayedColor(rtlPicker),
      });
    }
    observe(context, "color-picker-explicit-rtl-area-pointer-value-and-thumb", {
      direction: rtlDirection,
      measurements: rtlAreaMeasurements,
    });
    const rtlChannel = rtlPicker.locator('[data-slot="color-picker-channel-slider"]');
    const rtlChannelInput = rtlPicker.locator('[data-slot="color-picker-channel-input"]');
    const rtlChannelThumb = rtlChannel.locator('[data-slot="color-picker-channel-slider-thumb"]');
    const rtlChannelSliderInput = rtlChannel.locator(
      '[data-slot="color-picker-channel-slider-input"]',
    );
    const rtlChannelBounds = await rtlChannel.boundingBox();
    assert(rtlChannelBounds);
    const rtlChannelMeasurements: Array<{
      ratio: number;
      channelValue: string;
      value: string;
      thumb: BrowserBounds | null;
      thumbPosition: string;
    }> = [];
    for (const ratio of [0.1, 0.9]) {
      await page.mouse.click(
        rtlChannelBounds.x + rtlChannelBounds.width * ratio,
        rtlChannelBounds.y + rtlChannelBounds.height / 2,
      );
      rtlChannelMeasurements.push({
        ratio,
        channelValue: await rtlChannelInput.inputValue(),
        value: await rtlPicker
          .locator('[data-slot="color-picker-value-input"]')
          .first()
          .inputValue(),
        thumb: await rtlChannelThumb.boundingBox(),
        thumbPosition: await rtlChannel.evaluate((element) =>
          (element as HTMLElement).style.getPropertyValue("--sw-color-picker-channel-position"),
        ),
      });
    }
    observe(
      context,
      "color-picker-explicit-rtl-channel-pointer-value-and-thumb",
      rtlChannelMeasurements,
    );
    await check(context, "color-picker-rtl-pointer-thumb-mapping", async () => {
      assert.notEqual(rtlAreaMeasurements[0]!.value, rtlAreaMeasurements[1]!.value);
      for (const [samples, bounds] of [
        [rtlAreaMeasurements, rtlAreaBounds],
        [rtlChannelMeasurements, rtlChannelBounds],
      ] as const) {
        const [low, high] = samples;
        assert(low && high);
        assert(Number.parseFloat(low.thumbPosition) > Number.parseFloat(high.thumbPosition));
        for (const { ratio, thumb } of samples) {
          assert(thumb);
          const pointer = bounds.x + bounds.width * ratio;
          assert(
            Math.abs(thumb.x + thumb.width / 2 - pointer) <= 1,
            "Thumb follows the physical pointer in RTL",
          );
        }
      }
      assert.notEqual(
        rtlChannelMeasurements[0]!.channelValue,
        rtlChannelMeasurements[1]!.channelValue,
      );
    });
    await page.mouse.click(
      rtlChannelBounds.x + rtlChannelBounds.width * 0.5,
      rtlChannelBounds.y + rtlChannelBounds.height / 2,
    );
    const rtlBeforeKey = Number(await rtlChannelInput.inputValue());
    const rtlThumbBeforeKey = await rtlChannelThumb.boundingBox();
    const rtlPositionBeforeKey = await rtlChannel.evaluate((element) =>
      (element as HTMLElement).style.getPropertyValue("--sw-color-picker-channel-position"),
    );
    await rtlChannelSliderInput.focus();
    await page.keyboard.press("ArrowRight");
    const rtlAfterRight = Number(await rtlChannelInput.inputValue());
    const rtlThumbAfterRight = await rtlChannelThumb.boundingBox();
    const rtlPositionAfterKey = await rtlChannel.evaluate((element) =>
      (element as HTMLElement).style.getPropertyValue("--sw-color-picker-channel-position"),
    );
    observe(context, "color-picker-explicit-rtl-channel-arrow-right", {
      beforeValue: rtlBeforeKey,
      afterValue: rtlAfterRight,
      beforeThumb: rtlThumbBeforeKey,
      afterThumb: rtlThumbAfterRight,
      beforePosition: rtlPositionBeforeKey,
      afterPosition: rtlPositionAfterKey,
    });
    await check(context, "color-picker-rtl-keyboard-thumb-mapping", async () => {
      assert(rtlAfterRight < rtlBeforeKey, "ArrowRight decreases hue in RTL");
      assert(
        Number.parseFloat(rtlPositionAfterKey) < Number.parseFloat(rtlPositionBeforeKey),
        "the numeric channel ratio decreases for ArrowRight in RTL",
      );
      assert(rtlThumbBeforeKey && rtlThumbAfterRight);
      assert(
        rtlThumbAfterRight.x + rtlThumbAfterRight.width / 2 >
          rtlThumbBeforeKey.x + rtlThumbBeforeKey.width / 2,
        "the channel thumb's inline position should move right for ArrowRight in RTL",
      );
    });
  } else if (spec.row === "combobox") {
    assert.equal(await primary.getByRole("combobox").count(), 1);
    assert.equal(await page.locator('[data-slot="combobox-item"]').count(), 2);
    assert.equal(
      await page.locator('[data-slot="combobox-group-label"]').last().textContent(),
      "Countries",
    );
  } else if (spec.row === "context-menu") {
    assert.equal(await page.locator('[data-slot="context-menu-sub-trigger"]').count(), 1);
    assert.equal(await page.locator('[data-slot="context-menu-sub-content"]').count(), 1);
    assert.equal(await page.locator('[data-slot="context-menu-shortcut"]').count(), 1);
    const trigger = primary.locator("[data-context-trigger]");
    const triggerWrapper = trigger.locator("xpath=..");
    const menu = page
      .locator('[data-slot="context-menu-content"]')
      .filter({ hasText: "نسخ Copy" })
      .first();
    const edgeResults = [];
    const directionViolations: Array<Record<string, unknown>> = [];
    const edgeViolations: Array<Record<string, unknown>> = [];
    const placementViolations: Array<Record<string, unknown>> = [];
    for (const direction of ["ltr", "rtl"] as const) {
      await primary.locator('[data-slot="context-menu"]').evaluate((element, value) => {
        element.setAttribute("dir", value);
      }, direction);
      for (const [name, x, y] of [
        ["top-left", 2, 2],
        ["top-right", 1270, 2],
        ["bottom-left", 2, 890],
        ["bottom-right", 1270, 890],
      ] as const) {
        await triggerWrapper.evaluate(
          (element, point) => {
            const target = element as HTMLElement;
            target.style.position = "fixed";
            target.style.left = `${point.x}px`;
            target.style.top = `${point.y}px`;
            target.style.width = "180px";
            target.style.height = "36px";
            target.style.zIndex = "200";
          },
          { x, y },
        );
        await triggerWrapper.evaluate(
          (element, point) => {
            element.dispatchEvent(
              new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                clientX: point.x,
                clientY: point.y,
                button: 2,
              }),
            );
          },
          { x: x + 8, y: y + 8 },
        );
        const invocationPoint = { x: x + 8, y: y + 8 };
        await menu.waitFor({ state: "visible" });
        const bounds = await menu.boundingBox();
        const popupDirection = await menu.evaluate(
          (element) => getComputedStyle(element).direction,
        );
        const rect = await menu.evaluate((element) => {
          const value = element.getBoundingClientRect();
          return { x: value.x, y: value.y, width: value.width, height: value.height };
        });
        const actualSide = await menu.getAttribute("data-side");
        const actualAlign = await menu.getAttribute("data-align");
        edgeResults.push({
          direction,
          name,
          invocationPoint,
          bounds,
          rect,
          popupDirection,
          actualSide,
          actualAlign,
        });
        observe(context, `context-menu-edge-${direction}-${name}`, {
          invocationPoint,
          bounds,
          rect,
          popupDirection,
          actualSide,
          actualAlign,
        });
        if (!bounds) {
          edgeViolations.push({ direction, name, issue: "popup has no browser bounds", rect });
          await page.keyboard.press("Escape");
          continue;
        }
        const availableSides = (["top", "bottom"] as const).filter((side) =>
          side === "top"
            ? invocationPoint.y - 8 >= bounds.height
            : 900 - invocationPoint.y - 8 >= bounds.height,
        );
        const availableAlignments = (["start", "end"] as const).filter((align) =>
          (align === "start") === (popupDirection === "ltr")
            ? invocationPoint.x >= 0 && invocationPoint.x + bounds.width <= 1280
            : invocationPoint.x - bounds.width >= 0 && invocationPoint.x <= 1280,
        );
        const placementCenter = {
          x: bounds.x + bounds.width / 2,
          y: bounds.y + bounds.height / 2,
        };
        const placementIssues: string[] = [];
        if (
          !actualSide ||
          (availableSides.length > 0 && !availableSides.includes(actualSide as "top" | "bottom"))
        ) {
          placementIssues.push(
            "returned side is not one of the placements that fits the available viewport space",
          );
        }
        if (
          !actualAlign ||
          (availableAlignments.length > 0 &&
            !availableAlignments.includes(actualAlign as "start" | "end"))
        ) {
          placementIssues.push(
            "returned alignment is not one of the placements that fits the physical viewport edge",
          );
        }
        if (
          (actualSide === "bottom" && placementCenter.y < invocationPoint.y) ||
          (actualSide === "top" && placementCenter.y > invocationPoint.y)
        ) {
          placementIssues.push("popup center is on the opposite physical side from data-side");
        }
        if (
          ((actualAlign === "start") === (popupDirection === "ltr") &&
            placementCenter.x < invocationPoint.x) ||
          ((actualAlign === "end") === (popupDirection === "ltr") &&
            placementCenter.x > invocationPoint.x)
        ) {
          placementIssues.push(
            "popup center is on the opposite physical alignment from data-align",
          );
        }
        if (placementIssues.length > 0) {
          placementViolations.push({
            direction,
            name,
            invocationPoint,
            actualSide,
            actualAlign,
            availableSides,
            availableAlignments,
            placementCenter,
            issues: placementIssues,
          });
        }
        if (popupDirection !== direction)
          directionViolations.push({
            direction,
            name,
            issue: "popup direction mismatch",
            popupDirection,
          });
        if (
          bounds.x < 0 ||
          bounds.y < 0 ||
          bounds.x + bounds.width > 1280 ||
          bounds.y + bounds.height > 900
        ) {
          edgeViolations.push({ direction, name, issue: "popup crosses viewport edge", bounds });
        }
        if (direction === "ltr" && name === "top-left") {
          const checkbox = menu.getByRole("menuitemcheckbox");
          const radio = menu.getByRole("menuitemradio", { name: "RTL" });
          const otherRadio = menu.getByRole("menuitemradio", { name: "LTR" });
          assert.equal(await checkbox.getAttribute("aria-checked"), "true");
          await checkbox.click();
          assert.equal(await checkbox.getAttribute("aria-checked"), "false");
          assert.equal(await menu.getByRole("menuitemradio").count(), 2);
          assert.equal(await radio.getAttribute("aria-checked"), "true");
          assert.equal(await otherRadio.getAttribute("aria-checked"), "false");
          await otherRadio.click();
          assert.equal(await otherRadio.getAttribute("aria-checked"), "true");
          assert.equal(await radio.getAttribute("aria-checked"), "false");
          const subTrigger = menu.getByRole("menuitem", { name: /More/ });
          await subTrigger.hover();
          const subContent = page.locator('[data-slot="context-menu-sub-content"]');
          await subContent.waitFor({ state: "visible" });
          assert.equal(await subContent.getByRole("menuitem", { name: /Details/ }).count(), 1);
          // Move the pointer off the menu. A later edge opens the menu at this same point, and a
          // pointer left over the submenu trigger would open the submenu on its hover delay.
          await page.mouse.move(640, 450);
          // The first Escape closes only the open submenu. The root menu stays open.
          await page.keyboard.press("Escape");
          await waitHidden(subContent);
          assert.equal(await menu.isVisible(), true);
        }
        await page.keyboard.press("Escape");
        await waitHidden(menu);
      }
    }
    observe(context, "context-menu-viewport-edge-branches", edgeResults);
    observe(context, "context-menu-direction-violations", directionViolations);
    observe(context, "context-menu-physical-edge-violations", edgeViolations);
    observe(context, "context-menu-placement-relation-violations", placementViolations);
    await check(context, "context-menu-portal-inherits-owner-direction", async () => {
      assert.deepEqual(
        directionViolations,
        [],
        "portal content should inherit its owner's direction",
      );
    });
    await check(context, "context-menu-physical-edge-collision-bounds", async () => {
      assert.deepEqual(
        { placementViolations, edgeViolations },
        { placementViolations: [], edgeViolations: [] },
        "returned side and alignment should match their physical placement and fit the viewport",
      );
    });
  } else if (spec.row === "dialog") {
    const trigger = within('[data-slot="dialog-trigger"]');
    assert.equal(await trigger.count(), 1);
    assert.equal(await within('[data-slot="dialog-close"]').count(), 2);
    await trigger.focus();
    await page.keyboard.press("Enter");
    const popup = page.getByRole("dialog");
    await popup.waitFor({ state: "visible" });
    const popupHandle = await popup.elementHandle();
    assert(popupHandle, "Dialog popup remains mounted");
    await popup.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    await page.waitForFunction(
      (element) =>
        element
          .getAnimations({ subtree: true })
          .every((animation) => animation.playState !== "running"),
      popupHandle,
      { timeout: 3000 },
    );
    const popupBounds = await popup.boundingBox();
    observe(context, "ltr-open-popup-bounds", popupBounds);
    assert(popupBounds && popupBounds.width > 0 && popupBounds.height > 0);
    assert(Math.abs(popupBounds.x + popupBounds.width / 2 - 640) < 2);
    assert(Math.abs(popupBounds.y + popupBounds.height / 2 - 450) < 2);
    assert(
      (await popup.locator('[data-slot="dialog-title"]').textContent())?.includes(
        "Account settings",
      ),
    );
    assert.equal(await popup.locator("[data-slot=dialog-footer]").count(), 1);
    const footerText = (await popup.locator('[data-slot="dialog-footer"]').textContent()) ?? "";
    assert(footerText.indexOf("إغلاق") < footerText.indexOf("حفظ"));
    assert.equal(await popup.evaluate((element) => element.contains(document.activeElement)), true);
    await page.keyboard.press("Escape");
    await waitHidden(popup);
    assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
  }
}

export const cases: DirectionCase[] = controls.map((spec) => ({
  id: `fixtures-controls-${spec.row}`,
  row: spec.row,
  acceptance: ["SPEC-AC-01", "SPEC-AC-02", "SPEC-AC-03", "SPEC-AC-04", "SPEC-AC-14"],
  physicalExceptions: spec.physicalExceptions,
  rawEntrypoints: spec.rawEntrypoints,
  fixtures: Object.fromEntries(
    (["astro", "react", "vue", "svelte"] as const).map((target) => [
      target,
      {
        source: sourceFor(target, spec),
        exports: spec.exports,
        assertions: assertionsFor(spec),
      },
    ]),
  ),
}));

export const expectations: DirectionExpectation[] = controls.map((spec) => ({
  id: `fixtures-controls-${spec.row}`,
  layer: "styled",
  async run(page, target, context?: DirectionAssertionContext) {
    const root = page.locator(`[data-slot="${spec.row}"]`).first();
    const primary = page.locator("[data-direction-primary]");
    const primaryRoot = primary.locator(`[data-slot="${spec.row}"]`).first();
    await root.waitFor({ state: "attached" });
    const partSlots = spec.exports.map((name) => spec.slotAssertions?.[name] ?? kebab(name));
    const scope = page.locator("[data-direction-scope]");
    const componentFocus = primary.locator("[data-direction-focus]").first();
    const focusTarget =
      (await componentFocus.count()) > 0
        ? componentFocus
        : page.locator("[data-direction-focus]").last();
    const textMarker = page.locator("[data-direction-marker]");
    await focusTarget.waitFor({ state: "visible" });
    const ltrBounds = await primaryRoot.boundingBox();
    const variants = await primaryRoot.evaluate((element) =>
      [element, ...element.querySelectorAll<HTMLElement>("[data-slot]")].map((part) => ({
        slot: part.getAttribute("data-slot"),
        className: part.getAttribute("class") ?? "",
        size: part.getAttribute("data-size"),
        variant: part.getAttribute("data-variant"),
        orientation: part.getAttribute("data-orientation"),
      })),
    );

    await check(context, "public-parts-render-in-valid-composition", async () => {
      const missingSlots: string[] = [];
      for (const slot of partSlots) {
        if ((await page.locator(`[data-slot="${slot}"]`).count()) === 0) missingSlots.push(slot);
      }
      assert.deepEqual(missingSlots, [], `${spec.row} public parts did not render`);
    });

    await check(context, "ltr-baseline-accessibility-focus-and-content", async () => {
      assert.equal(await scope.evaluate((element) => getComputedStyle(element).direction), "ltr");
      assert.equal(
        await primaryRoot.evaluate((element) => getComputedStyle(element).direction),
        "ltr",
      );
      assert.equal(
        await page
          .locator("#direction-label-probe")
          .evaluate((element) => (element as HTMLInputElement).labels?.length),
        1,
        `${spec.row} label association was lost`,
      );
      assert.match((await textMarker.textContent()) ?? "", /مرحبا.*Product 42.*שלום/);
      assert.equal(await page.getByRole("button", { name: "Direction probe" }).count(), 1);
      await focusTarget.focus();
      assert.equal(
        await focusTarget.evaluate((element) => element === document.activeElement),
        true,
      );
    });

    const behaviorAssertion = assertionsFor(spec).find(
      (assertion) =>
        assertion.startsWith("avatar-") ||
        assertion.startsWith("button-group-") ||
        assertion.startsWith("carousel-") ||
        assertion.startsWith("checkbox-group-") ||
        assertion.startsWith("color-picker-") ||
        assertion.startsWith("context-menu-"),
    );
    await check(context, behaviorAssertion ?? `row-specific-${spec.row}-semantics`, async () => {
      await assertRowSemantics(page, spec, primary, context);
    });
    await focusTarget.focus();
    assert.equal(await focusTarget.evaluate((element) => element === document.activeElement), true);
    const contentBeforeDirection = await primaryRoot.textContent();

    const normalMotion = await page.screenshot({ animations: "disabled" });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const reducedMotion = await page.screenshot({ animations: "disabled" });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    observe(context, "ltr-baseline-observations", {
      bounds: ltrBounds,
      labelCount: 1,
      variants,
      normalMotionBytes: normalMotion.byteLength,
      normalMotionBase64: normalMotion.toString("base64"),
      reducedMotionBytes: reducedMotion.byteLength,
      reducedMotionBase64: reducedMotion.toString("base64"),
    });
    await check(
      context,
      "ltr-bounds-variants-and-motion-captures-before-direction-change",
      async () => {
        assert(
          ltrBounds && ltrBounds.width > 0 && ltrBounds.height > 0,
          `${spec.row} LTR bounds missing`,
        );
        assert(variants.length > 0, `${spec.row} variant and state snapshot is empty`);
        assert(
          normalMotion.byteLength > 0 && reducedMotion.byteLength > 0,
          "Motion captures are empty",
        );
      },
    );

    let explicitRtlBounds: Awaited<ReturnType<typeof root.boundingBox>> = null;
    let inheritedRtlBounds: Awaited<ReturnType<typeof root.boundingBox>> = null;
    let islandDirections: string[] = [];
    await check(context, "explicit-inherited-and-nested-alternating-directions", async () => {
      await primaryRoot.evaluate((element) => element.setAttribute("dir", "rtl"));
      const explicitDirection = await primaryRoot.evaluate(
        (element) => getComputedStyle(element).direction,
      );
      explicitRtlBounds = await primaryRoot.boundingBox();
      if (spec.row === "aspect-ratio") {
        const ratioBounds = await primaryRoot.locator("xpath=..").boundingBox();
        assert(ratioBounds && Math.abs(ratioBounds.width / ratioBounds.height - 1.5) < 0.03);
      }
      observe(context, "explicit-root-direction", {
        direction: explicitDirection,
        bounds: explicitRtlBounds,
      });
      assert.equal(explicitDirection, "rtl");
      assert.equal(
        await focusTarget.evaluate((element) => element === document.activeElement),
        true,
      );
      const nestedComponents = page.locator("[data-direction-probe-host] [data-direction-probe]");
      const nestedMeasurements = await nestedComponents.evaluateAll((elements) =>
        elements.map((element) => ({
          direction: getComputedStyle(element).direction,
          textDirection: getComputedStyle(
            element.querySelector<HTMLElement>("[data-slot]") ?? element,
          ).direction,
          bounds: (() => {
            const rect = element.getBoundingClientRect();
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          })(),
        })),
      );
      observe(context, "nested-component-instance-directions-and-bounds", nestedMeasurements);
      assert.deepEqual(
        nestedMeasurements.map((measurement) => measurement.direction),
        spec.row === "avatar" ? ["ltr", "ltr", "ltr", "rtl"] : ["ltr", "rtl", "ltr", "rtl"],
      );
      assert.deepEqual(
        nestedMeasurements.map((measurement) => measurement.textDirection),
        nestedMeasurements.map((measurement) => measurement.direction),
      );
      assert(
        nestedMeasurements.every(
          (measurement) => measurement.bounds.width > 0 && measurement.bounds.height > 0,
        ),
      );
      if (spec.row === "dialog" || spec.row === "alert-dialog") {
        const isAlert = spec.row === "alert-dialog";
        const trigger = isAlert
          ? page.getByRole("button", { name: "Open alert dialog" })
          : primary.locator('[data-slot="dialog-trigger"]');
        await trigger.focus();
        await page.keyboard.press("Enter");
        const popup = page.getByRole(isAlert ? "alertdialog" : "dialog");
        await popup.waitFor({ state: "visible" });
        const popupDirection = await popup.evaluate(
          (element) => getComputedStyle(element).direction,
        );
        const popupBounds = await popup.boundingBox();
        observe(context, "open-portal-in-explicit-rtl", {
          direction: popupDirection,
          bounds: popupBounds,
        });
        assert.equal(popupDirection, "rtl", `${spec.row} popup did not inherit explicit RTL`);
        assert(popupBounds && popupBounds.width > 0 && popupBounds.height > 0);
        await page.keyboard.press("Escape");
        await waitHidden(popup);
        assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
      }
      await primaryRoot.evaluate((element) => {
        element.removeAttribute("dir");
        element.ownerDocument.dispatchEvent(new Event("starwind:direction-change"));
      });
      await scope.evaluate((element) => {
        element.setAttribute("dir", "rtl");
        element.ownerDocument.dispatchEvent(new Event("starwind:direction-change"));
      });
      const inheritedDirection = await primaryRoot.evaluate(
        (element) => getComputedStyle(element).direction,
      );
      inheritedRtlBounds = await primaryRoot.boundingBox();
      if (spec.row === "aspect-ratio") {
        const ratioBounds = await primaryRoot.locator("xpath=..").boundingBox();
        assert(ratioBounds && Math.abs(ratioBounds.width / ratioBounds.height - 1.5) < 0.03);
      }
      islandDirections = await page
        .locator("[data-direction-island]")
        .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).direction));
      observe(context, "inherited-and-alternating-direction-observations", {
        direction: inheritedDirection,
        bounds: inheritedRtlBounds,
        nested: islandDirections,
      });
      assert.equal(inheritedDirection, "rtl");
      assert.deepEqual(islandDirections, ["ltr", "rtl", "ltr", "rtl"]);
      if (spec.row === "dialog" || spec.row === "alert-dialog") {
        const isAlert = spec.row === "alert-dialog";
        const trigger = isAlert
          ? page.getByRole("button", { name: "Open alert dialog" })
          : primary.locator('[data-slot="dialog-trigger"]');
        await trigger.focus();
        await page.keyboard.press("Enter");
        const popup = page.getByRole(isAlert ? "alertdialog" : "dialog");
        await popup.waitFor({ state: "visible" });
        const popupDirection = await popup.evaluate(
          (element) => getComputedStyle(element).direction,
        );
        observe(context, "open-portal-in-inherited-rtl", { direction: popupDirection });
        assert.equal(popupDirection, "rtl", `${spec.row} popup did not inherit scoped RTL`);
        await page.keyboard.press("Escape");
        await waitHidden(popup);
        assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
      }

      const parent = page.locator("[data-direction-parent]");
      await parent.evaluate((element) => {
        element.setAttribute("dir", "rtl");
        element.ownerDocument.dispatchEvent(new Event("starwind:direction-change"));
      });
      await scope.evaluate((element) => {
        element.removeAttribute("dir");
        element.ownerDocument.dispatchEvent(new Event("starwind:direction-change"));
      });
      assert.equal(
        await primaryRoot.evaluate((element) => getComputedStyle(element).direction),
        "rtl",
      );
      await parent.evaluate((element) => {
        element.removeAttribute("dir");
        element.ownerDocument.dispatchEvent(new Event("starwind:direction-change"));
      });
      await page.locator("body").evaluate((element) => {
        element.setAttribute("dir", "rtl");
        element.ownerDocument.dispatchEvent(new Event("starwind:direction-change"));
      });
      assert.equal(
        await primaryRoot.evaluate((element) => getComputedStyle(element).direction),
        "rtl",
      );
      await page.locator("body").evaluate((element) => {
        element.setAttribute("dir", "ltr");
        element.ownerDocument.dispatchEvent(new Event("starwind:direction-change"));
      });
      assert.equal(
        await primaryRoot.evaluate((element) => getComputedStyle(element).direction),
        "ltr",
      );
      assert.equal(
        await primaryRoot.textContent(),
        contentBeforeDirection,
        `${spec.row} direction changes altered component content`,
      );
    });

    console.log(
      JSON.stringify({
        fixture: spec.row,
        target,
        ltrBounds,
        explicitRtlBounds,
        inheritedRtlBounds,
        normalMotionBytes: normalMotion.byteLength,
        reducedMotionBytes: reducedMotion.byteLength,
        explicitRoot: "rtl",
        inheritedScope: "rtl",
        nestedScopes: islandDirections,
        physicalExceptions: spec.physicalExceptions ?? [],
      }),
    );
    if (ownerBoundPopupRows.has(spec.row))
      await check(context, "owner-bound-popup-direction", () =>
        assertOwnerBoundPopupDirection(page, spec.row, context),
      );
  },
}));

const runtimeFamilies = [
  "accordion",
  "alert-dialog",
  "avatar",
  "button",
  "carousel",
  "checkbox",
  "checkbox-group",
  "collapsible",
  "color-picker",
  "combobox",
  "context-menu",
  "dialog",
] as const;

function rawStructure(family: (typeof runtimeFamilies)[number]): string {
  const root = `data-sw-${family}`;
  if (family === "accordion")
    return `<div ${root}><div data-sw-accordion-item><button type="button" data-sw-accordion-trigger aria-expanded="false">Raw accordion</button><div data-sw-accordion-content hidden>Raw content</div></div></div>`;
  if (family === "alert-dialog")
    return `<div ${root}><button type="button" data-sw-alert-dialog-trigger>Open raw alert dialog</button><div data-sw-alert-dialog-popup role="alertdialog" hidden><h2 data-sw-alert-dialog-title>Raw title</h2><p data-sw-alert-dialog-description>Raw description</p><button type="button" data-sw-alert-dialog-close>Cancel</button></div></div>`;
  if (family === "avatar")
    return `<div ${root}><img data-sw-avatar-image alt="صورة Raw image" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="/><span data-sw-avatar-fallback hidden>ر</span></div>`;
  if (family === "button")
    return `<button type="button" ${root} data-focusable-when-disabled disabled>Raw disabled button</button>`;
  if (family === "carousel")
    return `<div ${root}><div data-sw-carousel-viewport><div data-sw-carousel-container><div data-sw-carousel-slide>Raw slide one</div><div data-sw-carousel-slide>Raw slide two</div></div></div><button type="button" data-sw-carousel-previous>Previous</button><button type="button" data-sw-carousel-next>Next</button></div>`;
  if (family === "checkbox")
    return `<button type="button" role="checkbox" aria-checked="false" ${root}><span data-sw-checkbox-indicator></span><input type="checkbox" data-sw-checkbox-input hidden/><input type="hidden" data-sw-checkbox-unchecked-input value="off"/></button>`;
  if (family === "checkbox-group")
    return `<div ${root}><button type="button" role="checkbox" aria-checked="false" data-sw-checkbox><span data-sw-checkbox-indicator></span><input type="checkbox" data-sw-checkbox-input hidden value="email"/></button><button type="button" role="checkbox" aria-checked="false" data-sw-checkbox><span data-sw-checkbox-indicator></span><input type="checkbox" data-sw-checkbox-input hidden value="sms"/></button></div>`;
  if (family === "collapsible")
    return `<div ${root}><button type="button" data-sw-collapsible-trigger aria-expanded="false">Raw collapsible</button><div data-sw-collapsible-content hidden><div data-sw-collapsible-panel>Raw panel</div></div></div>`;
  if (family === "color-picker")
    return `<div ${root} data-value="#ef4444"><button type="button" data-sw-color-picker-trigger>Raw picker</button><div data-sw-color-picker-area><span data-sw-color-picker-area-thumb></span></div><input data-sw-color-picker-value-input value="#ef4444"/><input type="hidden" data-sw-color-picker-hidden-input value="#ef4444"/></div>`;
  if (family === "combobox")
    return `<div ${root}><label data-sw-combobox-label for="raw-combobox-input">Raw country</label><input id="raw-combobox-input" role="combobox" data-sw-combobox-input aria-expanded="false"/><div data-sw-combobox-popup hidden><div data-sw-combobox-list><div data-sw-combobox-item role="option">مصر Egypt</div></div></div><button type="button" data-sw-combobox-trigger>Open</button><button type="button" data-sw-combobox-clear>Clear</button></div>`;
  if (family === "context-menu")
    return `<div ${root}><button type="button" data-sw-context-menu-trigger>Raw context trigger</button><div data-sw-menu-popup role="menu" hidden><div role="menuitem">Raw menu item</div></div></div>`;
  return `<div ${root}><button type="button" data-sw-dialog-trigger>Open raw dialog</button><div data-sw-dialog-overlay hidden></div><div data-sw-dialog-content role="dialog" hidden><h2 data-sw-dialog-title>Raw dialog title</h2><p data-sw-dialog-description>Raw dialog description</p><button type="button" data-sw-dialog-close>Close raw dialog</button></div></div>`;
}

function rawSource(family: (typeof runtimeFamilies)[number]): string {
  const factory = `create${family
    .split("-")
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join("")}`;
  return `---
---
<html lang="ar" dir="ltr"><head><meta charset="utf-8"/><title>Raw direction ${family}</title></head><body>
  <div data-raw-direction-scope dir="ltr">
    <section data-raw-factory-root>${rawStructure(family)}</section>
    <section data-raw-auto-root>${rawStructure(family)}</section>
    <span data-raw-label>مرحبا Product 42 שלום</span>
  </div>
  <script>
    import { ${factory} } from "@starwind-ui/runtime/${family}";
    import { initStarwind } from "@starwind-ui/runtime/init-starwind";
    const factoryRoot = document.querySelector("[data-raw-factory-root] > [data-sw-${family}]");
    const autoRoot = document.querySelector("[data-raw-auto-root]");
    if (!factoryRoot || !autoRoot) throw new Error("Raw ${family} roots are missing");
    let factory = false;
    let automatic = false;
    let factoryError;
    let automaticError;
    try {
      factory = Boolean(${factory}(factoryRoot));
    } catch (error) {
      factoryError = String(error);
    }
    try {
      automatic = Boolean(initStarwind(autoRoot));
    } catch (error) {
      automaticError = String(error);
    }
    window.__directionRaw = {
      family: "${family}",
      factory,
      automatic,
      factoryError,
      automaticError,
    };
  </script>
</body></html>`;
}

export const rawCases: DirectionCase[] = runtimeFamilies.map((family) => ({
  id: `fixtures-controls-raw-${family}`,
  row: `runtime:${family}`,
  acceptance: ["SPEC-AC-01", "SPEC-AC-02", "SPEC-AC-03", "SPEC-AC-04", "SPEC-AC-14"],
  rawEntrypoints: ["factory", "initStarwind"],
  fixtures: {
    astro: {
      source: rawSource(family),
      exports: [],
      assertions: [
        "raw-public-factory-instantiates",
        "automatic-init-observes-data-sw-root",
        "raw-factory-and-automatic-init-follow-inherited-direction",
        "direction-flip-preserves-authored-content",
      ],
    },
  },
}));

export const rawExpectations: DirectionExpectation[] = runtimeFamilies.map((family) => ({
  id: `fixtures-controls-raw-${family}`,
  layer: "raw-html",
  async run(page, target, context?: DirectionAssertionContext) {
    assert.equal(target, "astro", "Raw HTML coverage is target neutral");
    await page.waitForFunction(
      () => Boolean((window as Window & { __directionRaw?: object }).__directionRaw),
      undefined,
      { timeout: 5000 },
    );
    const scope = page.locator("[data-raw-direction-scope]");
    const factoryRoot = page.locator(`[data-raw-factory-root] > [data-sw-${family}]`).first();
    const autoScope = page.locator("[data-raw-auto-root]");
    const autoRoot = autoScope.locator(`[data-sw-${family}]`).first();
    const captureRawState = () =>
      page.evaluate((name) => {
        const factory = document.querySelector<HTMLElement>(
          `[data-raw-factory-root] > [data-sw-${name}]`,
        );
        const automatic = document.querySelector<HTMLElement>(
          `[data-raw-auto-root] > [data-sw-${name}]`,
        );
        return {
          label: document.querySelector("[data-raw-label]")?.textContent,
          factory: factory
            ? {
                text: factory.textContent,
                elements: [factory, ...factory.querySelectorAll("*")].map((element) => {
                  const field = element as HTMLInputElement;
                  return {
                    tagName: element.tagName,
                    text: element.textContent,
                    attributes: Array.from(element.attributes)
                      .filter((attribute) => attribute.name !== "dir")
                      .map((attribute) => [attribute.name, attribute.value]),
                    value: "value" in element ? field.value : null,
                    checked: "checked" in element ? field.checked : null,
                    indeterminate: "indeterminate" in element ? field.indeterminate : null,
                    disabled: "disabled" in element ? field.disabled : null,
                    hidden: "hidden" in element ? (element as HTMLElement).hidden : null,
                  };
                }),
              }
            : null,
          automatic: automatic
            ? {
                text: automatic.textContent,
                elements: [automatic, ...automatic.querySelectorAll("*")].map((element) => {
                  const field = element as HTMLInputElement;
                  return {
                    tagName: element.tagName,
                    text: element.textContent,
                    attributes: Array.from(element.attributes)
                      .filter((attribute) => attribute.name !== "dir")
                      .map((attribute) => [attribute.name, attribute.value]),
                    value: "value" in element ? field.value : null,
                    checked: "checked" in element ? field.checked : null,
                    indeterminate: "indeterminate" in element ? field.indeterminate : null,
                    disabled: "disabled" in element ? field.disabled : null,
                    hidden: "hidden" in element ? (element as HTMLElement).hidden : null,
                  };
                }),
              }
            : null,
        };
      }, family);
    const before = await captureRawState();
    const result = await page.evaluate(
      () =>
        (
          window as Window & {
            __directionRaw?: {
              family: string;
              factory: boolean;
              automatic: boolean;
              factoryError?: string;
              automaticError?: string;
            };
          }
        ).__directionRaw,
    );

    const initialDirections = await Promise.all([
      factoryRoot.evaluate((element) => getComputedStyle(element).direction),
      autoRoot.evaluate((element) => getComputedStyle(element).direction),
    ]);
    observe(context, "raw-initial-observations", {
      directions: initialDirections,
      factory: result?.factory,
      automatic: result?.automatic,
    });
    await check(context, "raw-public-factory-instantiates", async () => {
      assert.equal(result?.family, family);
      assert.equal(result?.factory, true, result?.factoryError);
      assert.equal(initialDirections[0], "ltr");
    });
    await check(context, "automatic-init-observes-data-sw-root", async () => {
      assert.equal(result?.automatic, true, result?.automaticError);
      assert.equal(initialDirections[1], "ltr");
    });
    await scope.evaluate((element) => {
      element.setAttribute("dir", "rtl");
      element.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
    });
    const changedDirections = await Promise.all([
      factoryRoot.evaluate((element) => getComputedStyle(element).direction),
      autoRoot.evaluate((element) => getComputedStyle(element).direction),
    ]);
    observe(context, "raw-inherited-direction-after-scope-flip", {
      expected: ["rtl", "rtl"],
      observed: changedDirections,
    });
    await check(context, "raw-factory-and-automatic-init-follow-inherited-direction", async () => {
      assert.deepEqual(
        changedDirections,
        ["rtl", "rtl"],
        `${family} Raw factory and automatic-init roots should follow inherited dir=rtl`,
      );
    });
    await check(context, "direction-flip-preserves-authored-content", async () => {
      assert.deepEqual(
        await captureRawState(),
        before,
        `${family} Raw HTML direction change modified authored content or neutral component state`,
      );
    });
    console.log(
      JSON.stringify({
        rawFactory: family,
        target,
        factory: true,
        automatic: true,
        ltrDirections: initialDirections,
        rtlDirections: changedDirections,
      }),
    );
  },
}));

cases.push(...rawCases);
expectations.push(...rawExpectations);
