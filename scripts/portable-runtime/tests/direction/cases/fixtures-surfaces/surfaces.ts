import assert from "node:assert/strict";
import type { DirectionAssertionContext } from "../../assertion-receipts.js";
import type { DirectionCase, DirectionExpectation, Target } from "../../inventory.js";

export type SurfaceDefinition = {
  row: string;
  exports: string[];
  acceptance: string[];
  assertions: string[];
  samples: Record<Target, string>;
  physicalExceptions?: string[];
};

const baselineAssertions = [
  "native-direction-scopes",
  "ltr-baseline-bounds",
  "public-parts",
  "accessible-labels",
  "mixed-script-text",
  "focus-state",
  "normal-motion-capture",
  "reduced-motion-capture",
];

export const definitions: SurfaceDefinition[] = [
  {
    row: "radio-group",
    exports: ["RadioGroup", "RadioGroupItem"],
    acceptance: [
      "SPEC-AC-01",
      "SPEC-AC-02",
      "SPEC-AC-03",
      "SPEC-AC-05",
      "SPEC-AC-13",
      "SPEC-AC-14",
    ],
    assertions: [
      ...baselineAssertions,
      "radio-spatial-right",
      "radio-disabled-skip",
      "radio-form-value",
      "radio-home-end",
    ],
    samples: {
      astro: `<form><RadioGroup aria-label="Radio choices" defaultValue="beta" name="surface-choice" orientation="horizontal"><RadioGroupItem value="alpha">Alpha</RadioGroupItem><RadioGroupItem value="beta">בחירה Beta 42</RadioGroupItem><RadioGroupItem value="gamma" disabled>Gamma</RadioGroupItem></RadioGroup><button type="reset">Reset choices</button></form>`,
      react: `<form><RadioGroup aria-label="Radio choices" defaultValue="beta" name="surface-choice" orientation="horizontal"><RadioGroupItem value="alpha">Alpha</RadioGroupItem><RadioGroupItem value="beta">בחירה Beta 42</RadioGroupItem><RadioGroupItem value="gamma" disabled>Gamma</RadioGroupItem></RadioGroup><button type="reset">Reset choices</button></form>`,
      vue: `<form><RadioGroup aria-label="Radio choices" default-value="beta" name="surface-choice" orientation="horizontal"><RadioGroupItem value="alpha">Alpha</RadioGroupItem><RadioGroupItem value="beta">בחירה Beta 42</RadioGroupItem><RadioGroupItem value="gamma" disabled>Gamma</RadioGroupItem></RadioGroup><button type="reset">Reset choices</button></form>`,
      svelte: `<form><RadioGroup aria-label="Radio choices" defaultValue="beta" name="surface-choice" orientation="horizontal"><RadioGroupItem value="alpha">Alpha</RadioGroupItem><RadioGroupItem value="beta">בחירה Beta 42</RadioGroupItem><RadioGroupItem value="gamma" disabled>Gamma</RadioGroupItem></RadioGroup><button type="reset">Reset choices</button></form>`,
    },
    physicalExceptions: [
      "Radio values, DOM order, form serialization, and Home/End retain logical collection order.",
      "Up/Down keeps its existing orientation behavior.",
    ],
  },
  {
    row: "scroll-area",
    exports: [
      "ScrollArea",
      "ScrollAreaContent",
      "ScrollAreaCorner",
      "ScrollAreaThumb",
      "ScrollAreaViewport",
      "ScrollBar",
    ],
    acceptance: [
      "SPEC-AC-01",
      "SPEC-AC-02",
      "SPEC-AC-03",
      "SPEC-AC-04",
      "SPEC-AC-09",
      "SPEC-AC-14",
    ],
    assertions: [
      ...baselineAssertions,
      "scroll-native-rtl",
      "scrollbar-geometry",
      "scroll-direction-scopes",
    ],
    samples: {
      astro: `<ScrollArea autoViewport={false} class="h-32 w-72 rounded border"><ScrollAreaViewport aria-label="Project scroll content" tabindex="0"><ScrollAreaContent><div class="min-w-[32rem] min-h-[24rem] space-y-2"><p>مرحبا بالعالم · עברית · Project R42</p><p>North · South · East · West</p><p>One · Two · Three · Four</p></div></ScrollAreaContent></ScrollAreaViewport><ScrollBar orientation="vertical"><ScrollAreaThumb /></ScrollBar><ScrollBar orientation="horizontal"><ScrollAreaThumb /></ScrollBar><ScrollAreaCorner /></ScrollArea>`,
      react: `<ScrollArea autoViewport={false} className="h-32 w-72 rounded border"><ScrollAreaViewport aria-label="Project scroll content" tabIndex={0}><ScrollAreaContent><div className="min-w-[32rem] min-h-[24rem] space-y-2"><p>مرحبا بالعالم · עברית · Project R42</p><p>North · South · East · West</p><p>One · Two · Three · Four</p></div></ScrollAreaContent></ScrollAreaViewport><ScrollBar orientation="vertical"><ScrollAreaThumb /></ScrollBar><ScrollBar orientation="horizontal"><ScrollAreaThumb /></ScrollBar><ScrollAreaCorner /></ScrollArea>`,
      vue: `<ScrollArea :auto-viewport="false" class="h-32 w-72 rounded border"><ScrollAreaViewport aria-label="Project scroll content" tabindex="0"><ScrollAreaContent><div class="min-w-[32rem] min-h-[24rem] space-y-2"><p>مرحبا بالعالم · עברית · Project R42</p><p>North · South · East · West</p><p>One · Two · Three · Four</p></div></ScrollAreaContent></ScrollAreaViewport><template #scrollbar><ScrollBar orientation="vertical"><ScrollAreaThumb /></ScrollBar><ScrollBar orientation="horizontal"><ScrollAreaThumb /></ScrollBar></template><ScrollAreaCorner /></ScrollArea>`,
      svelte: `<ScrollArea autoViewport={false} class="h-32 w-72 rounded border" scrollbar={scrollbars}><ScrollAreaViewport aria-label="Project scroll content" tabindex="0"><ScrollAreaContent><div class="min-w-[32rem] min-h-[24rem] space-y-2"><p>مرحبا بالعالم · עברית · Project R42</p><p>North · South · East · West</p><p>One · Two · Three · Four</p></div></ScrollAreaContent></ScrollAreaViewport><ScrollAreaCorner /></ScrollArea>`,
    },
    physicalExceptions: [
      "Native scrollLeft, client coordinates, and viewport clamping stay physical.",
      "Published overflow-start and overflow-end facts keep their logical meaning.",
    ],
  },
  {
    row: "select",
    exports: [
      "Select",
      "SelectContent",
      "SelectGroup",
      "SelectItem",
      "SelectItemIndicator",
      "SelectItemText",
      "SelectLabel",
      "SelectScrollDownButton",
      "SelectScrollUpButton",
      "SelectSeparator",
      "SelectTrigger",
      "SelectValue",
    ],
    acceptance: [
      "SPEC-AC-01",
      "SPEC-AC-02",
      "SPEC-AC-03",
      "SPEC-AC-09",
      "SPEC-AC-11",
      "SPEC-AC-14",
    ],
    assertions: [
      ...baselineAssertions,
      "select-portal-direction",
      "select-item-alignment",
      "select-keyboard-selection",
      "select-form-reset",
    ],
    samples: {
      astro: `<form><Select aria-label="Choose a project" defaultValue="beta" name="surface-project"><SelectTrigger><SelectValue placeholder="Choose a project" /></SelectTrigger><SelectContent side="right" align="start"><SelectScrollUpButton>▲</SelectScrollUpButton><SelectGroup><SelectLabel>Projects</SelectLabel><SelectItem value="alpha"><SelectItemText>Alpha</SelectItemText><SelectItemIndicator>✓</SelectItemIndicator></SelectItem><SelectItem value="beta" inset><SelectItemText>مشروع Beta 42</SelectItemText><SelectItemIndicator>✓</SelectItemIndicator></SelectItem><SelectItem value="gamma"><SelectItemText>Gamma with a longer label</SelectItemText><SelectItemIndicator>✓</SelectItemIndicator></SelectItem></SelectGroup><SelectSeparator /><SelectScrollDownButton>▼</SelectScrollDownButton></SelectContent></Select><button type="reset">Reset project</button></form>`,
      react: `<form><Select aria-label="Choose a project" defaultValue="beta" name="surface-project"><SelectTrigger><SelectValue placeholder="Choose a project" /></SelectTrigger><SelectContent side="right" align="start"><SelectScrollUpButton>▲</SelectScrollUpButton><SelectGroup><SelectLabel>Projects</SelectLabel><SelectItem value="alpha"><SelectItemText>Alpha</SelectItemText><SelectItemIndicator>✓</SelectItemIndicator></SelectItem><SelectItem value="beta" inset><SelectItemText>مشروع Beta 42</SelectItemText><SelectItemIndicator>✓</SelectItemIndicator></SelectItem><SelectItem value="gamma"><SelectItemText>Gamma with a longer label</SelectItemText><SelectItemIndicator>✓</SelectItemIndicator></SelectItem></SelectGroup><SelectSeparator /><SelectScrollDownButton>▼</SelectScrollDownButton></SelectContent></Select><button type="reset">Reset project</button></form>`,
      vue: `<form><Select aria-label="Choose a project" default-value="beta" name="surface-project"><SelectTrigger><SelectValue placeholder="Choose a project" /></SelectTrigger><SelectContent side="right" align="start"><SelectScrollUpButton>▲</SelectScrollUpButton><SelectGroup><SelectLabel>Projects</SelectLabel><SelectItem value="alpha"><SelectItemText>Alpha</SelectItemText><SelectItemIndicator>✓</SelectItemIndicator></SelectItem><SelectItem value="beta" inset><SelectItemText>مشروع Beta 42</SelectItemText><SelectItemIndicator>✓</SelectItemIndicator></SelectItem><SelectItem value="gamma"><SelectItemText>Gamma with a longer label</SelectItemText><SelectItemIndicator>✓</SelectItemIndicator></SelectItem></SelectGroup><SelectSeparator /><SelectScrollDownButton>▼</SelectScrollDownButton></SelectContent></Select><button type="reset">Reset project</button></form>`,
      svelte: `<form><Select aria-label="Choose a project" defaultValue="beta" name="surface-project"><SelectTrigger><SelectValue placeholder="Choose a project" /></SelectTrigger><SelectContent side="right" align="start"><SelectScrollUpButton>▲</SelectScrollUpButton><SelectGroup><SelectLabel>Projects</SelectLabel><SelectItem value="alpha"><SelectItemText>Alpha</SelectItemText><SelectItemIndicator>✓</SelectItemIndicator></SelectItem><SelectItem value="beta" inset><SelectItemText>مشروع Beta 42</SelectItemText><SelectItemIndicator>✓</SelectItemIndicator></SelectItem><SelectItem value="gamma"><SelectItemText>Gamma with a longer label</SelectItemText><SelectItemIndicator>✓</SelectItemIndicator></SelectItem></SelectGroup><SelectSeparator /><SelectScrollDownButton>▼</SelectScrollDownButton></SelectContent></Select><button type="reset">Reset project</button></form>`,
    },
    physicalExceptions: [
      "Explicit side values and collision-resolved data-side values describe physical placement.",
      "Viewport clamping and vertical item navigation keep their current physical behavior.",
    ],
  },
  {
    row: "separator",
    exports: ["Separator"],
    acceptance: ["SPEC-AC-01", "SPEC-AC-02", "SPEC-AC-03", "SPEC-AC-12", "SPEC-AC-14"],
    assertions: [
      ...baselineAssertions,
      "separator-axis",
      "separator-aria",
      "neutral-noop-preservation",
    ],
    samples: {
      astro: `<div aria-label="Project sections"><span>Overview</span><Separator orientation="horizontal" /><span>Activity</span><div class="flex h-8 items-center gap-3"><span>Alpha</span><Separator orientation="vertical" /><span>مشروع Beta 42</span></div><Separator decorative={false} orientation="horizontal" aria-label="Named divider" /></div>`,
      react: `<div aria-label="Project sections"><span>Overview</span><Separator orientation="horizontal" /><span>Activity</span><div className="flex h-8 items-center gap-3"><span>Alpha</span><Separator orientation="vertical" /><span>مشروع Beta 42</span></div><Separator decorative={false} orientation="horizontal" aria-label="Named divider" /></div>`,
      vue: `<div aria-label="Project sections"><span>Overview</span><Separator orientation="horizontal" /><span>Activity</span><div class="flex h-8 items-center gap-3"><span>Alpha</span><Separator orientation="vertical" /><span>مشروع Beta 42</span></div><Separator :decorative="false" orientation="horizontal" aria-label="Named divider" /></div>`,
      svelte: `<div aria-label="Project sections"><span>Overview</span><Separator orientation="horizontal" /><span>Activity</span><div class="flex h-8 items-center gap-3"><span>Alpha</span><Separator orientation="vertical" /><span>مشروع Beta 42</span></div><Separator decorative={false} orientation="horizontal" aria-label="Named divider" /></div>`,
    },
    physicalExceptions: [
      "Horizontal and vertical orientation values retain their physical meanings.",
    ],
  },
  {
    row: "sheet",
    exports: [
      "Sheet",
      "SheetClose",
      "SheetContent",
      "SheetDescription",
      "SheetFooter",
      "SheetHeader",
      "SheetTitle",
      "SheetTrigger",
    ],
    acceptance: [
      "SPEC-AC-01",
      "SPEC-AC-02",
      "SPEC-AC-03",
      "SPEC-AC-11",
      "SPEC-AC-12",
      "SPEC-AC-14",
    ],
    assertions: [
      ...baselineAssertions,
      "sheet-physical-sides",
      "sheet-portal-direction",
      "sheet-focus-return",
    ],
    samples: {
      astro: `<div class="flex flex-wrap gap-2"><Sheet><SheetTrigger aria-label="Open left sheet">Open left</SheetTrigger><SheetContent side="left"><SheetHeader><SheetTitle>ملف المستخدم · Profile</SheetTitle><SheetDescription>Edit profile details for user 42.</SheetDescription></SheetHeader><SheetFooter><SheetClose>Save</SheetClose></SheetFooter></SheetContent></Sheet><Sheet><SheetTrigger aria-label="Open right sheet">Open right</SheetTrigger><SheetContent side="right"><SheetHeader><SheetTitle>Right sheet</SheetTitle><SheetDescription>Physical right side.</SheetDescription></SheetHeader><SheetFooter><SheetClose>Close</SheetClose></SheetFooter></SheetContent></Sheet><Sheet><SheetTrigger aria-label="Open top sheet">Open top</SheetTrigger><SheetContent side="top"><SheetHeader><SheetTitle>Top sheet</SheetTitle><SheetDescription>Physical top side.</SheetDescription></SheetHeader><SheetFooter><SheetClose>Close</SheetClose></SheetFooter></SheetContent></Sheet><Sheet><SheetTrigger aria-label="Open bottom sheet">Open bottom</SheetTrigger><SheetContent side="bottom"><SheetHeader><SheetTitle>Bottom sheet</SheetTitle><SheetDescription>Physical bottom side.</SheetDescription></SheetHeader><SheetFooter><SheetClose>Close</SheetClose></SheetFooter></SheetContent></Sheet></div>`,
      react: `<div className="flex flex-wrap gap-2"><Sheet><SheetTrigger aria-label="Open left sheet">Open left</SheetTrigger><SheetContent side="left"><SheetHeader><SheetTitle>ملف المستخدم · Profile</SheetTitle><SheetDescription>Edit profile details for user 42.</SheetDescription></SheetHeader><SheetFooter><SheetClose>Save</SheetClose></SheetFooter></SheetContent></Sheet><Sheet><SheetTrigger aria-label="Open right sheet">Open right</SheetTrigger><SheetContent side="right"><SheetHeader><SheetTitle>Right sheet</SheetTitle><SheetDescription>Physical right side.</SheetDescription></SheetHeader><SheetFooter><SheetClose>Close</SheetClose></SheetFooter></SheetContent></Sheet><Sheet><SheetTrigger aria-label="Open top sheet">Open top</SheetTrigger><SheetContent side="top"><SheetHeader><SheetTitle>Top sheet</SheetTitle><SheetDescription>Physical top side.</SheetDescription></SheetHeader><SheetFooter><SheetClose>Close</SheetClose></SheetFooter></SheetContent></Sheet><Sheet><SheetTrigger aria-label="Open bottom sheet">Open bottom</SheetTrigger><SheetContent side="bottom"><SheetHeader><SheetTitle>Bottom sheet</SheetTitle><SheetDescription>Physical bottom side.</SheetDescription></SheetHeader><SheetFooter><SheetClose>Close</SheetClose></SheetFooter></SheetContent></Sheet></div>`,
      vue: `<div class="flex flex-wrap gap-2"><Sheet><SheetTrigger aria-label="Open left sheet">Open left</SheetTrigger><SheetContent side="left"><SheetHeader><SheetTitle>ملف المستخدم · Profile</SheetTitle><SheetDescription>Edit profile details for user 42.</SheetDescription></SheetHeader><SheetFooter><SheetClose>Save</SheetClose></SheetFooter></SheetContent></Sheet><Sheet><SheetTrigger aria-label="Open right sheet">Open right</SheetTrigger><SheetContent side="right"><SheetHeader><SheetTitle>Right sheet</SheetTitle><SheetDescription>Physical right side.</SheetDescription></SheetHeader><SheetFooter><SheetClose>Close</SheetClose></SheetFooter></SheetContent></Sheet><Sheet><SheetTrigger aria-label="Open top sheet">Open top</SheetTrigger><SheetContent side="top"><SheetHeader><SheetTitle>Top sheet</SheetTitle><SheetDescription>Physical top side.</SheetDescription></SheetHeader><SheetFooter><SheetClose>Close</SheetClose></SheetFooter></SheetContent></Sheet><Sheet><SheetTrigger aria-label="Open bottom sheet">Open bottom</SheetTrigger><SheetContent side="bottom"><SheetHeader><SheetTitle>Bottom sheet</SheetTitle><SheetDescription>Physical bottom side.</SheetDescription></SheetHeader><SheetFooter><SheetClose>Close</SheetClose></SheetFooter></SheetContent></Sheet></div>`,
      svelte: `<div class="flex flex-wrap gap-2"><Sheet><SheetTrigger aria-label="Open left sheet">Open left</SheetTrigger><SheetContent side="left"><SheetHeader><SheetTitle>ملف المستخدم · Profile</SheetTitle><SheetDescription>Edit profile details for user 42.</SheetDescription></SheetHeader><SheetFooter><SheetClose>Save</SheetClose></SheetFooter></SheetContent></Sheet><Sheet><SheetTrigger aria-label="Open right sheet">Open right</SheetTrigger><SheetContent side="right"><SheetHeader><SheetTitle>Right sheet</SheetTitle><SheetDescription>Physical right side.</SheetDescription></SheetHeader><SheetFooter><SheetClose>Close</SheetClose></SheetFooter></SheetContent></Sheet><Sheet><SheetTrigger aria-label="Open top sheet">Open top</SheetTrigger><SheetContent side="top"><SheetHeader><SheetTitle>Top sheet</SheetTitle><SheetDescription>Physical top side.</SheetDescription></SheetHeader><SheetFooter><SheetClose>Close</SheetClose></SheetFooter></SheetContent></Sheet><Sheet><SheetTrigger aria-label="Open bottom sheet">Open bottom</SheetTrigger><SheetContent side="bottom"><SheetHeader><SheetTitle>Bottom sheet</SheetTitle><SheetDescription>Physical bottom side.</SheetDescription></SheetHeader><SheetFooter><SheetClose>Close</SheetClose></SheetFooter></SheetContent></Sheet></div>`,
    },
    physicalExceptions: [
      "Sheet side values left, right, top, and bottom remain physical placement choices.",
      "Backdrop geometry and returned portal coordinates remain physical.",
    ],
  },
  {
    row: "sidebar",
    exports: [
      "Sidebar",
      "SidebarContent",
      "SidebarFooter",
      "SidebarGroup",
      "SidebarGroupAction",
      "SidebarGroupContent",
      "SidebarGroupLabel",
      "SidebarHeader",
      "SidebarInput",
      "SidebarInset",
      "SidebarMenu",
      "SidebarMenuAction",
      "SidebarMenuBadge",
      "SidebarMenuButton",
      "SidebarMenuItem",
      "SidebarMenuSkeleton",
      "SidebarMenuSub",
      "SidebarMenuSubButton",
      "SidebarMenuSubItem",
      "SidebarProvider",
      "SidebarRail",
      "SidebarSeparator",
      "SidebarTrigger",
    ],
    acceptance: [
      "SPEC-AC-01",
      "SPEC-AC-02",
      "SPEC-AC-03",
      "SPEC-AC-11",
      "SPEC-AC-12",
      "SPEC-AC-14",
    ],
    assertions: [
      ...baselineAssertions,
      "sidebar-physical-side",
      "sidebar-collapse",
      "sidebar-menu-parts",
      "sidebar-mobile-owner-direction",
    ],
    samples: {
      astro: `<SidebarProvider defaultOpen={true} persistOpen={false}><Sidebar side="right" collapsible="icon"><SidebarHeader><SidebarInput aria-label="Search sidebar" placeholder="Search" /><SidebarGroupAction aria-label="Add group">+</SidebarGroupAction></SidebarHeader><SidebarSeparator /><SidebarContent><SidebarGroup><SidebarGroupLabel>Projects</SidebarGroupLabel><SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton href="#" tooltip="Alpha">Alpha project</SidebarMenuButton><SidebarMenuBadge>3</SidebarMenuBadge><SidebarMenuAction aria-label="Project actions">⋯</SidebarMenuAction></SidebarMenuItem><SidebarMenuItem><SidebarMenuButton href="#">Beta project</SidebarMenuButton></SidebarMenuItem><SidebarMenuSkeleton showIcon={true} /></SidebarMenu><SidebarMenuSub><SidebarMenuSubItem><SidebarMenuSubButton href="#">مشروع Beta 42</SidebarMenuSubButton></SidebarMenuSubItem></SidebarMenuSub></SidebarGroupContent></SidebarGroup></SidebarContent><SidebarFooter>Footer</SidebarFooter><SidebarRail /></Sidebar><SidebarInset><SidebarTrigger aria-label="Toggle sidebar" /><main>Workspace</main></SidebarInset></SidebarProvider>`,
      react: `<SidebarProvider defaultOpen={true} persistOpen={false}><Sidebar side="right" collapsible="icon"><SidebarHeader><SidebarInput aria-label="Search sidebar" placeholder="Search" /><SidebarGroupAction aria-label="Add group">+</SidebarGroupAction></SidebarHeader><SidebarSeparator /><SidebarContent><SidebarGroup><SidebarGroupLabel>Projects</SidebarGroupLabel><SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton href="#" tooltip="Alpha">Alpha project</SidebarMenuButton><SidebarMenuBadge>3</SidebarMenuBadge><SidebarMenuAction aria-label="Project actions">⋯</SidebarMenuAction></SidebarMenuItem><SidebarMenuItem><SidebarMenuButton href="#">Beta project</SidebarMenuButton></SidebarMenuItem><SidebarMenuSkeleton showIcon={true} /></SidebarMenu><SidebarMenuSub><SidebarMenuSubItem><SidebarMenuSubButton href="#">مشروع Beta 42</SidebarMenuSubButton></SidebarMenuSubItem></SidebarMenuSub></SidebarGroupContent></SidebarGroup></SidebarContent><SidebarFooter>Footer</SidebarFooter><SidebarRail /></Sidebar><SidebarInset><SidebarTrigger aria-label="Toggle sidebar" /><main>Workspace</main></SidebarInset></SidebarProvider>`,
      vue: `<SidebarProvider :default-open="true" :persist-open="false"><Sidebar side="right" collapsible="icon"><SidebarHeader><SidebarInput aria-label="Search sidebar" placeholder="Search" /><SidebarGroupAction aria-label="Add group">+</SidebarGroupAction></SidebarHeader><SidebarSeparator /><SidebarContent><SidebarGroup><SidebarGroupLabel>Projects</SidebarGroupLabel><SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton href="#" tooltip="Alpha">Alpha project</SidebarMenuButton><SidebarMenuBadge>3</SidebarMenuBadge><SidebarMenuAction aria-label="Project actions">⋯</SidebarMenuAction></SidebarMenuItem><SidebarMenuItem><SidebarMenuButton href="#">Beta project</SidebarMenuButton></SidebarMenuItem><SidebarMenuSkeleton :show-icon="true" /></SidebarMenu><SidebarMenuSub><SidebarMenuSubItem><SidebarMenuSubButton href="#">مشروع Beta 42</SidebarMenuSubButton></SidebarMenuSubItem></SidebarMenuSub></SidebarGroupContent></SidebarGroup></SidebarContent><SidebarFooter>Footer</SidebarFooter><SidebarRail /></Sidebar><SidebarInset><SidebarTrigger aria-label="Toggle sidebar" /><main>Workspace</main></SidebarInset></SidebarProvider>`,
      svelte: `<SidebarProvider defaultOpen={true} persistOpen={false}><Sidebar side="right" collapsible="icon"><SidebarHeader><SidebarInput aria-label="Search sidebar" placeholder="Search" /><SidebarGroupAction aria-label="Add group">+</SidebarGroupAction></SidebarHeader><SidebarSeparator /><SidebarContent><SidebarGroup><SidebarGroupLabel>Projects</SidebarGroupLabel><SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton href="#" tooltip="Alpha">Alpha project</SidebarMenuButton><SidebarMenuBadge>3</SidebarMenuBadge><SidebarMenuAction aria-label="Project actions">⋯</SidebarMenuAction></SidebarMenuItem><SidebarMenuItem><SidebarMenuButton href="#">Beta project</SidebarMenuButton></SidebarMenuItem><SidebarMenuSkeleton showIcon={true} /></SidebarMenu><SidebarMenuSub><SidebarMenuSubItem><SidebarMenuSubButton href="#">مشروع Beta 42</SidebarMenuSubButton></SidebarMenuSubItem></SidebarMenuSub></SidebarGroupContent></SidebarGroup></SidebarContent><SidebarFooter>Footer</SidebarFooter><SidebarRail /></Sidebar><SidebarInset><SidebarTrigger aria-label="Toggle sidebar" /><main>Workspace</main></SidebarInset></SidebarProvider>`,
    },
    physicalExceptions: [
      "Sidebar side left and right stay physical.",
      "Rail placement and collapse coordinates retain physical meaning.",
      "Tooltip default placement follows the physical Sidebar side; explicit Tooltip sides stay physical.",
    ],
  },
  {
    row: "skeleton",
    exports: ["Skeleton"],
    acceptance: ["SPEC-AC-01", "SPEC-AC-02", "SPEC-AC-03", "SPEC-AC-12", "SPEC-AC-14"],
    assertions: [...baselineAssertions, "skeleton-bounds", "neutral-noop-preservation"],
    samples: {
      astro: `<div aria-label="Loading project card"><Skeleton class="h-5 w-40" /><Skeleton class="mt-2 h-4 w-56" /><Skeleton class="mt-4 h-20 w-full" /></div>`,
      react: `<div aria-label="Loading project card"><Skeleton className="h-5 w-40" /><Skeleton className="mt-2 h-4 w-56" /><Skeleton className="mt-4 h-20 w-full" /></div>`,
      vue: `<div aria-label="Loading project card"><Skeleton class="h-5 w-40" /><Skeleton class="mt-2 h-4 w-56" /><Skeleton class="mt-4 h-20 w-full" /></div>`,
      svelte: `<div aria-label="Loading project card"><Skeleton class="h-5 w-40" /><Skeleton class="mt-2 h-4 w-56" /><Skeleton class="mt-4 h-20 w-full" /></div>`,
    },
    physicalExceptions: ["Placeholder dimensions and pulse motion keep the authored CSS meaning."],
  },
  {
    row: "slider",
    exports: ["Slider"],
    acceptance: [
      "SPEC-AC-01",
      "SPEC-AC-02",
      "SPEC-AC-03",
      "SPEC-AC-04",
      "SPEC-AC-07",
      "SPEC-AC-09",
      "SPEC-AC-14",
    ],
    assertions: [
      ...baselineAssertions,
      "slider-value-range",
      "slider-rtl-key",
      "slider-vertical-value",
    ],
    samples: {
      astro: `<form><label for="surface-slider">Volume</label><Slider id="surface-slider" aria-label="Volume" defaultValue={50} name="surface-volume" /><button type="reset">Reset volume</button><Slider aria-label="Price range" defaultValue={[20, 80]} name="surface-price" /><Slider aria-label="Vertical scale" orientation="vertical" defaultValue={60} /></form>`,
      react: `<form><label htmlFor="surface-slider">Volume</label><Slider id="surface-slider" aria-label="Volume" defaultValue={50} name="surface-volume" /><button type="reset">Reset volume</button><Slider aria-label="Price range" defaultValue={[20, 80]} name="surface-price" /><Slider aria-label="Vertical scale" orientation="vertical" defaultValue={60} /></form>`,
      vue: `<form><label for="surface-slider">Volume</label><Slider id="surface-slider" aria-label="Volume" :default-value="50" name="surface-volume" /><button type="reset">Reset volume</button><Slider aria-label="Price range" :default-value="[20, 80]" name="surface-price" /><Slider aria-label="Vertical scale" orientation="vertical" :default-value="60" /></form>`,
      svelte: `<form><label for="surface-slider">Volume</label><Slider id="surface-slider" aria-label="Volume" defaultValue={50} name="surface-volume" /><button type="reset">Reset volume</button><Slider aria-label="Price range" defaultValue={[20, 80]} name="surface-price" /><Slider aria-label="Vertical scale" orientation="vertical" defaultValue={60} /></form>`,
    },
    physicalExceptions: [
      "Vertical Slider remains bottom-to-top.",
      "Range values stay ascending and keep stable thumb identity.",
      "Public physical geometry variables retain their documented meanings.",
    ],
  },
  {
    row: "spinner",
    exports: ["Spinner"],
    acceptance: ["SPEC-AC-01", "SPEC-AC-02", "SPEC-AC-03", "SPEC-AC-12", "SPEC-AC-14"],
    assertions: [...baselineAssertions, "spinner-label-motion", "neutral-noop-preservation"],
    samples: {
      astro: `<div role="status" aria-label="Loading project"><Spinner /> <span>Loading project R42</span></div>`,
      react: `<div role="status" aria-label="Loading project"><Spinner /> <span>Loading project R42</span></div>`,
      vue: `<div role="status" aria-label="Loading project"><Spinner /> <span>Loading project R42</span></div>`,
      svelte: `<div role="status" aria-label="Loading project"><Spinner /> <span>Loading project R42</span></div>`,
    },
    physicalExceptions: [
      "Spinner rotation and motion direction keep their authored physical meaning.",
    ],
  },
  {
    row: "switch",
    exports: ["Switch"],
    acceptance: ["SPEC-AC-01", "SPEC-AC-02", "SPEC-AC-03", "SPEC-AC-08", "SPEC-AC-14"],
    assertions: [...baselineAssertions, "switch-toggle-form", "switch-track-thumb"],
    samples: {
      astro: `<form><label for="surface-switch">Enable updates</label><Switch id="surface-switch" aria-label="Enable updates" name="surface-updates" defaultChecked /><button type="reset">Reset switch</button></form>`,
      react: `<form><label htmlFor="surface-switch">Enable updates</label><Switch id="surface-switch" aria-label="Enable updates" name="surface-updates" defaultChecked /><button type="reset">Reset switch</button></form>`,
      vue: `<form><label for="surface-switch">Enable updates</label><Switch id="surface-switch" aria-label="Enable updates" name="surface-updates" default-checked /><button type="reset">Reset switch</button></form>`,
      svelte: `<form><label for="surface-switch">Enable updates</label><Switch id="surface-switch" aria-label="Enable updates" name="surface-updates" defaultChecked={true} /><button type="reset">Reset switch</button></form>`,
    },
    physicalExceptions: [
      "Checked state changes, form values, and thumb travel keep the same physical track bounds in both directions.",
    ],
  },
  {
    row: "table",
    exports: [
      "Table",
      "TableBody",
      "TableCaption",
      "TableCell",
      "TableFoot",
      "TableHead",
      "TableHeader",
      "TableRow",
    ],
    acceptance: [
      "SPEC-AC-01",
      "SPEC-AC-02",
      "SPEC-AC-03",
      "SPEC-AC-12",
      "SPEC-AC-13",
      "SPEC-AC-14",
    ],
    assertions: [
      ...baselineAssertions,
      "table-logical-row",
      "table-checkbox-edge",
      "table-mixed-number",
      "neutral-noop-preservation",
    ],
    samples: {
      astro: `<Table aria-label="Project members"><TableCaption>Members in project R42</TableCaption><TableHeader><TableRow><TableHead><span class="sr-only">Select</span></TableHead><TableHead>Name</TableHead><TableHead>Region</TableHead><TableHead>Count</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell><input type="checkbox" aria-label="Select Leila" /></TableCell><TableCell>ليلى Smith</TableCell><TableCell>עברית · West</TableCell><TableCell>42</TableCell></TableRow></TableBody><TableFoot><TableRow><TableCell></TableCell><TableCell>Total</TableCell><TableCell>Members</TableCell><TableCell>1</TableCell></TableRow></TableFoot></Table>`,
      react: `<Table aria-label="Project members"><TableCaption>Members in project R42</TableCaption><TableHeader><TableRow><TableHead><span class="sr-only">Select</span></TableHead><TableHead>Name</TableHead><TableHead>Region</TableHead><TableHead>Count</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell><input type="checkbox" aria-label="Select Leila" /></TableCell><TableCell>ليلى Smith</TableCell><TableCell>עברית · West</TableCell><TableCell>42</TableCell></TableRow></TableBody><TableFoot><TableRow><TableCell></TableCell><TableCell>Total</TableCell><TableCell>Members</TableCell><TableCell>1</TableCell></TableRow></TableFoot></Table>`,
      vue: `<Table aria-label="Project members"><TableCaption>Members in project R42</TableCaption><TableHeader><TableRow><TableHead><span class="sr-only">Select</span></TableHead><TableHead>Name</TableHead><TableHead>Region</TableHead><TableHead>Count</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell><input type="checkbox" aria-label="Select Leila" /></TableCell><TableCell>ليلى Smith</TableCell><TableCell>עברית · West</TableCell><TableCell>42</TableCell></TableRow></TableBody><TableFoot><TableRow><TableCell></TableCell><TableCell>Total</TableCell><TableCell>Members</TableCell><TableCell>1</TableCell></TableRow></TableFoot></Table>`,
      svelte: `<Table aria-label="Project members"><TableCaption>Members in project R42</TableCaption><TableHeader><TableRow><TableHead><span class="sr-only">Select</span></TableHead><TableHead>Name</TableHead><TableHead>Region</TableHead><TableHead>Count</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell><input type="checkbox" aria-label="Select Leila" /></TableCell><TableCell>ليلى Smith</TableCell><TableCell>עברית · West</TableCell><TableCell>42</TableCell></TableRow></TableBody><TableFoot><TableRow><TableCell></TableCell><TableCell>Total</TableCell><TableCell>Members</TableCell><TableCell>1</TableCell></TableRow></TableFoot></Table>`,
    },
    physicalExceptions: [
      "Row and column order remain data order. Number text keeps browser formatting.",
    ],
  },
  {
    row: "tabs",
    exports: ["Tabs", "TabsContent", "TabsList", "TabsTrigger"],
    acceptance: [
      "SPEC-AC-01",
      "SPEC-AC-02",
      "SPEC-AC-03",
      "SPEC-AC-04",
      "SPEC-AC-05",
      "SPEC-AC-14",
    ],
    assertions: [
      ...baselineAssertions,
      "tabs-ltr-key",
      "tabs-rtl-key",
      "tabs-disabled-skip",
      "tabs-panel",
    ],
    samples: {
      astro: `<Tabs aria-label="Project details" defaultValue="overview"><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger><TabsTrigger value="disabled" disabled>Disabled</TabsTrigger></TabsList><TabsContent value="overview">ملخص Project 42</TabsContent><TabsContent value="activity">Latest activity</TabsContent><TabsContent value="settings">Project settings</TabsContent><TabsContent value="disabled">Unavailable</TabsContent></Tabs>`,
      react: `<Tabs aria-label="Project details" defaultValue="overview"><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger><TabsTrigger value="disabled" disabled>Disabled</TabsTrigger></TabsList><TabsContent value="overview">ملخص Project 42</TabsContent><TabsContent value="activity">Latest activity</TabsContent><TabsContent value="settings">Project settings</TabsContent><TabsContent value="disabled">Unavailable</TabsContent></Tabs>`,
      vue: `<Tabs aria-label="Project details" default-value="overview"><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger><TabsTrigger value="disabled" disabled>Disabled</TabsTrigger></TabsList><TabsContent value="overview">ملخص Project 42</TabsContent><TabsContent value="activity">Latest activity</TabsContent><TabsContent value="settings">Project settings</TabsContent><TabsContent value="disabled">Unavailable</TabsContent></Tabs>`,
      svelte: `<Tabs aria-label="Project details" defaultValue="overview"><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger><TabsTrigger value="disabled" disabled>Disabled</TabsTrigger></TabsList><TabsContent value="overview">ملخص Project 42</TabsContent><TabsContent value="activity">Latest activity</TabsContent><TabsContent value="settings">Project settings</TabsContent><TabsContent value="disabled">Unavailable</TabsContent></Tabs>`,
    },
    physicalExceptions: [
      "Tabs indicator CSS variables and movement states retain physical meanings.",
      "Collection values, trigger order, and Home/End logical item order remain stable.",
    ],
  },
  {
    row: "textarea",
    exports: ["Textarea"],
    acceptance: ["SPEC-AC-01", "SPEC-AC-02", "SPEC-AC-03", "SPEC-AC-13", "SPEC-AC-14"],
    assertions: [
      ...baselineAssertions,
      "textarea-editing",
      "textarea-form-reset",
      "neutral-noop-preservation",
    ],
    samples: {
      astro: `<form><label for="surface-textarea">Notes</label><Textarea id="surface-textarea" aria-label="Notes" name="surface-notes" defaultValue="مرحبا · Ticket R42 · עברית" placeholder="Write notes" rows={3} /><button type="reset">Reset notes</button></form>`,
      react: `<form><label htmlFor="surface-textarea">Notes</label><Textarea id="surface-textarea" aria-label="Notes" name="surface-notes" defaultValue="مرحبا · Ticket R42 · עברית" placeholder="Write notes" rows={3} /><button type="reset">Reset notes</button></form>`,
      vue: `<form><label for="surface-textarea">Notes</label><Textarea id="surface-textarea" aria-label="Notes" name="surface-notes" default-value="مرحبا · Ticket R42 · עברית" placeholder="Write notes" rows="3" /><button type="reset">Reset notes</button></form>`,
      svelte: `<form><label for="surface-textarea">Notes</label><Textarea id="surface-textarea" aria-label="Notes" name="surface-notes" defaultValue="مرحبا · Ticket R42 · עברית" placeholder="Write notes" rows={3} /><button type="reset">Reset notes</button></form>`,
    },
    physicalExceptions: [
      "Native caret, selection, resize handles, and form serialization retain browser direction behavior.",
    ],
  },
  {
    row: "theme-toggle",
    exports: ["ThemeToggle"],
    acceptance: ["SPEC-AC-01", "SPEC-AC-02", "SPEC-AC-03", "SPEC-AC-14"],
    assertions: [
      ...baselineAssertions,
      "theme-toggle-keyboard",
      "theme-toggle-disabled",
      "theme-toggle-icons",
    ],
    samples: {
      astro: `<ThemeToggle ariaLabel="Toggle fixture theme" /><ThemeToggle ariaLabel="Disabled fixture theme" disabled />`,
      react: `<ThemeToggle aria-label="Toggle fixture theme" /><ThemeToggle aria-label="Disabled fixture theme" disabled />`,
      vue: `<ThemeToggle aria-label="Toggle fixture theme" /><ThemeToggle aria-label="Disabled fixture theme" disabled />`,
      svelte: `<ThemeToggle aria-label="Toggle fixture theme" /><ThemeToggle aria-label="Disabled fixture theme" disabled />`,
    },
    physicalExceptions: ["Theme state remains independent from text direction."],
  },
  {
    row: "toast",
    exports: [
      "Toaster",
      "ToastAction",
      "ToastClose",
      "ToastContent",
      "ToastDescription",
      "ToastItem",
      "ToastTemplate",
      "ToastTitle",
    ],
    acceptance: [
      "SPEC-AC-01",
      "SPEC-AC-02",
      "SPEC-AC-03",
      "SPEC-AC-11",
      "SPEC-AC-12",
      "SPEC-AC-14",
    ],
    assertions: [
      ...baselineAssertions,
      "toast-viewport-direction",
      "toast-physical-position",
      "toast-action-close",
    ],
    samples: {
      astro: `<div><button type="button" data-toast-fire>Show toast</button><Toaster position="bottom-right" duration={0}><ToastTemplate><ToastItem><ToastContent><ToastTitle>تم الحفظ · Saved</ToastTitle><ToastDescription>Project R42 is ready.</ToastDescription><ToastAction>Undo</ToastAction></ToastContent><ToastClose>Close</ToastClose></ToastItem></ToastTemplate></Toaster></div>`,
      react: `<div><button type="button" data-toast-fire onClick={() => toast({ title: "تم الحفظ · Saved", description: "Project R42 is ready.", action: { label: "Undo", onClick: () => { document.documentElement.dataset.toastActionInvoked = "true"; } }, duration: 0 })}>Show toast</button><Toaster position="bottom-right" duration={0}><ToastTemplate><ToastItem><ToastContent><ToastTitle>تم الحفظ · Saved</ToastTitle><ToastDescription>Project R42 is ready.</ToastDescription><ToastAction>Undo</ToastAction></ToastContent><ToastClose>Close</ToastClose></ToastItem></ToastTemplate></Toaster></div>`,
      vue: `<div><button type="button" data-toast-fire @click="fireToast">Show toast</button><Toaster position="bottom-right" :duration="0"><ToastTemplate><ToastItem><ToastContent><ToastTitle>تم الحفظ · Saved</ToastTitle><ToastDescription>Project R42 is ready.</ToastDescription><ToastAction>Undo</ToastAction></ToastContent><ToastClose>Close</ToastClose></ToastItem></ToastTemplate></Toaster></div>`,
      svelte: `<div><button type="button" data-toast-fire onclick={fireToast}>Show toast</button><Toaster position="bottom-right" duration={0}><ToastTemplate><ToastItem><ToastContent><ToastTitle>تم الحفظ · Saved</ToastTitle><ToastDescription>Project R42 is ready.</ToastDescription><ToastAction>Undo</ToastAction></ToastContent><ToastClose>Close</ToastClose></ToastItem></ToastTemplate></Toaster></div>`,
    },
    physicalExceptions: [
      "All six Toast position values keep their physical meanings.",
      "The current rightward horizontal swipe contract stays physical.",
      "The viewport direction and explicit Toast dir own content direction; caller scope does not.",
    ],
  },
  {
    row: "toggle",
    exports: ["Toggle"],
    acceptance: ["SPEC-AC-01", "SPEC-AC-02", "SPEC-AC-03", "SPEC-AC-14"],
    assertions: [
      ...baselineAssertions,
      "toggle-keyboard",
      "toggle-disabled",
      "toggle-variant-state",
    ],
    samples: {
      astro: `<Toggle aria-label="Pin project" defaultPressed>Pin project</Toggle><Toggle aria-label="Disabled pin" disabled>Unavailable</Toggle>`,
      react: `<Toggle aria-label="Pin project" defaultPressed>Pin project</Toggle><Toggle aria-label="Disabled pin" disabled>Unavailable</Toggle>`,
      vue: `<Toggle aria-label="Pin project" default-pressed>Pin project</Toggle><Toggle aria-label="Disabled pin" disabled>Unavailable</Toggle>`,
      svelte: `<Toggle aria-label="Pin project" defaultPressed={true}>Pin project</Toggle><Toggle aria-label="Disabled pin" disabled>Unavailable</Toggle>`,
    },
    physicalExceptions: ["Pressed state and item order keep their current meaning."],
  },
  {
    row: "toggle-group",
    exports: ["ToggleGroup", "ToggleGroupItem"],
    acceptance: [
      "SPEC-AC-01",
      "SPEC-AC-02",
      "SPEC-AC-03",
      "SPEC-AC-05",
      "SPEC-AC-12",
      "SPEC-AC-14",
    ],
    assertions: [
      ...baselineAssertions,
      "toggle-group-seams",
      "toggle-group-keyboard",
      "toggle-group-selection",
    ],
    samples: {
      astro: `<ToggleGroup aria-label="Text alignment" defaultValue={["center"]}><ToggleGroupItem value="start">Start</ToggleGroupItem><ToggleGroupItem value="center">Center</ToggleGroupItem><ToggleGroupItem value="end" disabled>End</ToggleGroupItem></ToggleGroup>`,
      react: `<ToggleGroup aria-label="Text alignment" defaultValue={["center"]}><ToggleGroupItem value="start">Start</ToggleGroupItem><ToggleGroupItem value="center">Center</ToggleGroupItem><ToggleGroupItem value="end" disabled>End</ToggleGroupItem></ToggleGroup>`,
      vue: `<ToggleGroup aria-label="Text alignment" :default-value="['center']"><ToggleGroupItem value="start">Start</ToggleGroupItem><ToggleGroupItem value="center">Center</ToggleGroupItem><ToggleGroupItem value="end" disabled>End</ToggleGroupItem></ToggleGroup>`,
      svelte: `<ToggleGroup aria-label="Text alignment" defaultValue={["center"]}><ToggleGroupItem value="start">Start</ToggleGroupItem><ToggleGroupItem value="center">Center</ToggleGroupItem><ToggleGroupItem value="end" disabled>End</ToggleGroupItem></ToggleGroup>`,
    },
    physicalExceptions: [
      "Selected values and item order remain in DOM order.",
      "Vertical orientation keeps its current Up/Down behavior.",
    ],
  },
  {
    row: "tooltip",
    exports: ["Tooltip", "TooltipContent", "TooltipTrigger"],
    acceptance: [
      "SPEC-AC-01",
      "SPEC-AC-02",
      "SPEC-AC-03",
      "SPEC-AC-11",
      "SPEC-AC-12",
      "SPEC-AC-14",
    ],
    assertions: [
      ...baselineAssertions,
      "tooltip-trigger",
      "tooltip-portal-direction",
      "tooltip-side",
    ],
    samples: {
      astro: `<Tooltip><TooltipTrigger><button type="button" aria-label="Details for Alpha">Alpha details</button></TooltipTrigger><TooltipContent side="right" align="start">تفاصيل · Project Alpha 42</TooltipContent></Tooltip>`,
      react: `<Tooltip><TooltipTrigger><button type="button" aria-label="Details for Alpha">Alpha details</button></TooltipTrigger><TooltipContent side="right" align="start">تفاصيل · Project Alpha 42</TooltipContent></Tooltip>`,
      vue: `<Tooltip><TooltipTrigger><button type="button" aria-label="Details for Alpha">Alpha details</button></TooltipTrigger><TooltipContent side="right" align="start">تفاصيل · Project Alpha 42</TooltipContent></Tooltip>`,
      svelte: `<Tooltip><TooltipTrigger>{#snippet child({ props, children })}<button {...props} type="button" aria-label="Details for Alpha">{@render children?.()}</button>{/snippet}Alpha details</TooltipTrigger><TooltipContent side="right" align="start">تفاصيل · Project Alpha 42</TooltipContent></Tooltip>`,
    },
    physicalExceptions: [
      "Explicit left and right sides and resolved data-side values stay physical.",
      "Caret anchors and half-translations remain paired with physical placement.",
    ],
  },
  {
    row: "video",
    exports: ["Video"],
    acceptance: ["SPEC-AC-01", "SPEC-AC-02", "SPEC-AC-03", "SPEC-AC-13", "SPEC-AC-14"],
    assertions: [
      ...baselineAssertions,
      "video-native-controls-track",
      "video-aspect-ratio",
      "video-fallback",
      "neutral-noop-preservation",
    ],
    samples: {
      astro: `<Video src="data:video/mp4;base64,AAAA" aria-label="Project walkthrough" controls preload="none" class="aspect-video w-72"><source src="data:video/mp4;base64,AAAA" type="video/mp4" /><track kind="captions" srcLang="ar" label="Arabic captions" src="data:text/vtt,WEBVTT%0A%0A" /><span>Video fallback for Project R42.</span></Video><p data-video-fallback>Video fallback for Project R42.</p>`,
      react: `<Video src="data:video/mp4;base64,AAAA" aria-label="Project walkthrough" controls preload="none" className="aspect-video w-72"><source src="data:video/mp4;base64,AAAA" type="video/mp4" /><track kind="captions" srcLang="ar" label="Arabic captions" src="data:text/vtt,WEBVTT%0A%0A" /><span>Video fallback for Project R42.</span></Video><p data-video-fallback>Video fallback for Project R42.</p>`,
      vue: `<Video src="data:video/mp4;base64,AAAA" aria-label="Project walkthrough" controls preload="none" class="aspect-video w-72"><source src="data:video/mp4;base64,AAAA" type="video/mp4" /><track kind="captions" src-lang="ar" label="Arabic captions" src="data:text/vtt,WEBVTT%0A%0A" /><span>Video fallback for Project R42.</span></Video><p data-video-fallback>Video fallback for Project R42.</p>`,
      svelte: `<Video src="data:video/mp4;base64,AAAA" aria-label="Project walkthrough" controls preload="none" class="aspect-video w-72"><source src="data:video/mp4;base64,AAAA" type="video/mp4" /><track kind="captions" srclang="ar" label="Arabic captions" src="data:text/vtt,WEBVTT%0A%0A" /><span>Video fallback for Project R42.</span></Video><p data-video-fallback>Video fallback for Project R42.</p>`,
    },
    physicalExceptions: [
      "Native media controls, track direction, playback, and timeline remain browser-owned.",
    ],
  },
];

function directionScopes(sample: string): string {
  const scope = (name: string, dir: string, explicit: boolean) =>
    `<section data-direction-scope="${name}" data-direction-expected="${dir}"${explicit ? ` dir="${dir}"` : ""}>${sample}</section>`;
  return `<main dir="ltr" data-direction-root="ltr">${scope("ordinary-ltr", "ltr", false)}${scope("rtl-in-ltr", "rtl", true)}<section dir="rtl"><section>${scope("deep-rtl", "rtl", true)}</section></section></main><main dir="rtl" data-direction-root="rtl">${scope("ordinary-rtl", "rtl", false)}${scope("ltr-in-rtl", "ltr", true)}<section dir="ltr"><section dir="rtl">${scope("deep-ltr", "ltr", true)}</section></section></main>`;
}

function sample(markup: string): string {
  return `<div data-direction-sample><p data-direction-mixed-text>مرحبا بالعالم · עברית · Project R42</p><button type="button" class="rounded border px-2 py-1" data-direction-focus-target aria-label="Focus anchor">Focus anchor</button>${markup}</div>`;
}

function importsFor(target: Target, definition: SurfaceDefinition): string {
  const lines = [
    `import { ${definition.exports.join(", ")} } from "@direction/styled-${target}/${definition.row}";`,
    `import "@direction/sheet";`,
  ];
  if (definition.row === "toast") lines.push(`import { toast } from "@starwind-ui/runtime/toast";`);
  if (target === "react") lines.push(`import { createRoot } from "react-dom/client";`);
  return lines.join("\n");
}

function pageSource(target: Target, definition: SurfaceDefinition): string {
  const markup = directionScopes(sample(definition.samples[target]));
  const imports = importsFor(target, definition);
  if (target === "astro") {
    const toastScript =
      definition.row === "toast"
        ? `<script>import { toast } from "@starwind-ui/runtime/toast"; document.querySelectorAll("[data-toast-fire]").forEach((button) => button.addEventListener("click", () => toast({ title: "تم الحفظ · Saved", description: "Project R42 is ready.", action: { label: "Undo", onClick: () => { document.documentElement.dataset.toastActionInvoked = "true"; } }, duration: 0 })));</script>`
        : "";
    return `---\n${imports}\n---\n<html lang="en" dir="ltr"><head><meta charset="utf-8" /><title>Direction surface ${definition.row}</title></head><body>${markup}${toastScript}</body></html>`;
  }
  if (target === "react")
    return `${imports}\nfunction App() { return <>${markup}</>; }\ncreateRoot(document.getElementById("app")!).render(<App />);`;
  if (target === "vue") {
    const setup =
      definition.row === "toast"
        ? `\nconst fireToast = () => toast({ title: "تم الحفظ · Saved", description: "Project R42 is ready.", action: { label: "Undo", onClick: () => { document.documentElement.dataset.toastActionInvoked = "true"; } }, duration: 0 });`
        : "";
    return `<script setup lang="ts">\n${imports}\n${setup}\n</script>\n<template>${markup}</template>`;
  }
  const svelteSetup =
    definition.row === "toast"
      ? `\nconst fireToast = () => toast({ title: "تم الحفظ · Saved", description: "Project R42 is ready.", action: { label: "Undo", onClick: () => { document.documentElement.dataset.toastActionInvoked = "true"; } }, duration: 0 });`
      : "";
  const svelteSnippets =
    definition.row === "scroll-area"
      ? `\n{#snippet scrollbars()}<ScrollBar orientation="vertical"><ScrollAreaThumb /></ScrollBar><ScrollBar orientation="horizontal"><ScrollAreaThumb /></ScrollBar>{/snippet}`
      : "";
  return `<script lang="ts">\n${imports}\n${svelteSetup}\n</script>\n${svelteSnippets}\n${markup}`;
}

export const cases: DirectionCase[] = definitions.map((definition) => ({
  id: `surface-${definition.row}`,
  row: definition.row,
  acceptance: definition.acceptance,
  physicalExceptions: definition.physicalExceptions,
  fixtures: Object.fromEntries(
    (Object.keys(definition.samples) as Target[]).map((target) => [
      target,
      {
        source: pageSource(target, definition),
        exports: definition.exports,
        assertions: definition.assertions,
      },
    ]),
  ),
}));

export async function verifyCommon(
  page: Parameters<DirectionExpectation["run"]>[0],
  definition: SurfaceDefinition,
  ctx: DirectionAssertionContext,
): Promise<void> {
  const expected = new Map([
    ["ordinary-ltr", "ltr"],
    ["ordinary-rtl", "rtl"],
    ["rtl-in-ltr", "rtl"],
    ["ltr-in-rtl", "ltr"],
    ["deep-rtl", "rtl"],
    ["deep-ltr", "ltr"],
  ]);
  const ordinaryLtr = page.locator('[data-direction-scope="ordinary-ltr"] [data-direction-sample]');
  await ctx.check("native-direction-scopes", async () => {
    assert.equal(await page.locator("[data-direction-scope]").count(), expected.size);
    const observations = [];
    for (const [name, direction] of expected) {
      const scope = page.locator(`[data-direction-scope="${name}"]`);
      await scope.waitFor({ state: "attached" });
      const actual = await scope.evaluate((element) => getComputedStyle(element).direction);
      observations.push({ name, expected: direction, actual });
      assert.equal(actual, direction, `${definition.row}/${name} direction`);
      assert.equal(await scope.getAttribute("data-direction-expected"), direction);
    }
    const transitions = [];
    for (const [rootDirection, nextDirections] of [
      ["ltr", ["rtl", "ltr"]],
      ["rtl", ["ltr", "rtl"]],
    ] as const) {
      const root = page.locator(`[data-direction-root="${rootDirection}"]`);
      const inheritedScope = page.locator(`[data-direction-scope="ordinary-${rootDirection}"]`);
      try {
        for (const direction of nextDirections) {
          await root.evaluate(
            (element, nextDirection) => element.setAttribute("dir", nextDirection),
            direction,
          );
          const actual = await inheritedScope.evaluate(
            (element) => getComputedStyle(element).direction,
          );
          const sample = inheritedScope.locator("[data-direction-sample]");
          const box = await sample.boundingBox();
          const publicPartCount = await sample.locator("[data-slot]").count();
          transitions.push({
            rootDirection,
            direction,
            actual,
            bounds: box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null,
            publicPartCount,
          });
          assert.equal(actual, direction);
          assert(box && box.width > 0 && box.height > 0);
          assert(publicPartCount > 0);
        }
      } finally {
        await root.evaluate(
          (element, direction) => element.setAttribute("dir", direction),
          rootDirection,
        );
      }
    }
    ctx.observe("scopeDirections", { initial: observations, rootTransitions: transitions });
  });
  await ctx.check("ltr-baseline-bounds", async () => {
    const bounds = [];
    for (const name of expected.keys()) {
      const box = await page
        .locator(`[data-direction-scope="${name}"] [data-direction-sample]`)
        .boundingBox();
      bounds.push({
        name,
        bounds: box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null,
      });
      assert(
        box && box.width > 0 && box.height > 0,
        `${definition.row}/${name} layout baseline bounds`,
      );
    }
    ctx.observe(
      "ltrBaselineBounds",
      bounds.find((entry) => entry.name === "ordinary-ltr")?.bounds ?? null,
    );
    ctx.observe("scopeLayoutBounds", bounds);
  });
  await ctx.check("public-parts", async () => {
    const allParts = [];
    for (const name of expected.keys()) {
      const scope = page.locator(`[data-direction-scope="${name}"] [data-direction-sample]`);
      const slots = await scope.locator("[data-slot]").evaluateAll((elements) =>
        elements.map((element) => ({
          slot: element.getAttribute("data-slot"),
          state: element.getAttribute("data-state"),
          side: element.getAttribute("data-side"),
          orientation: element.getAttribute("data-orientation"),
          className: element.getAttribute("class"),
        })),
      );
      allParts.push({ scope: name, slots });
      assert(slots.length > 0, `${definition.row}/${name} has rendered public parts`);
    }
    ctx.observe("publicPartsAndVariants", allParts);
  });
  await ctx.check("accessible-labels", async () => {
    const allLabels = [];
    for (const name of expected.keys()) {
      const labels = await page
        .locator(`[data-direction-scope="${name}"] [data-direction-sample] [aria-label]`)
        .evaluateAll((elements) =>
          elements.map((element) => ({
            role: element.getAttribute("role"),
            tagName: element.tagName.toLowerCase(),
            label: element.getAttribute("aria-label"),
          })),
        );
      allLabels.push({ scope: name, labels });
      assert(labels.length > 0, `${definition.row}/${name} accessible label`);
    }
    ctx.observe("accessibleLabels", allLabels);
  });
  await ctx.check("mixed-script-text", async () => {
    const mixedText = (await page.locator("[data-direction-mixed-text]").allTextContents()).join(
      " ",
    );
    ctx.observe("mixedScriptText", mixedText);
    assert(
      mixedText.includes("مرحبا") && mixedText.includes("עברית") && mixedText.includes("R42"),
      `${definition.row} mixed-script content`,
    );
  });
  await ctx.check("focus-state", async () => {
    const states = [];
    for (const name of expected.keys()) {
      const target = page.locator(`[data-direction-scope="${name}"] [data-direction-focus-target]`);
      await target.focus();
      const state = await target.evaluate((element) => ({
        focused: element === document.activeElement,
        focusVisible: element.matches(":focus-visible"),
        label: element.getAttribute("aria-label"),
      }));
      states.push({ scope: name, ...state });
      assert(state.focused, `${definition.row}/${name} focus baseline`);
    }
    ctx.observe("ltrFocusBaseline", states.find((state) => state.scope === "ordinary-ltr") ?? null);
    ctx.observe("scopeFocusStates", states);
  });
  await ctx.check("normal-motion-capture", async () => {
    const reducedMotion = await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    const bounds = [];
    for (const name of expected.keys()) {
      const box = await page
        .locator(`[data-direction-scope="${name}"] [data-direction-sample]`)
        .boundingBox();
      bounds.push({
        scope: name,
        bounds: box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null,
      });
    }
    const ordinaryBounds = bounds.find((entry) => entry.scope === "ordinary-ltr")?.bounds ?? null;
    ctx.observe("normalMotionBaseline", { reducedMotion, bounds: ordinaryBounds });
    ctx.observe("normalMotionScopeBounds", bounds);
    assert.equal(reducedMotion, false);
    assert(
      bounds.every((entry) => entry.bounds && entry.bounds.width > 0 && entry.bounds.height > 0),
    );
  });
  await ctx.check("reduced-motion-capture", async () => {
    const before = [];
    for (const name of expected.keys()) {
      const box = await page
        .locator(`[data-direction-scope="${name}"] [data-direction-sample]`)
        .boundingBox();
      before.push({
        scope: name,
        bounds: box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null,
      });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    try {
      const reducedMotion = await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
      const reduced: Array<{
        scope: string;
        bounds: { x: number; y: number; width: number; height: number } | null;
      }> = [];
      for (const name of expected.keys()) {
        const box = await page
          .locator(`[data-direction-scope="${name}"] [data-direction-sample]`)
          .boundingBox();
        reduced.push({
          scope: name,
          bounds: box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null,
        });
      }
      const reducedOrdinary =
        reduced.find((entry) => entry.scope === "ordinary-ltr")?.bounds ?? null;
      ctx.observe("reducedMotionBaseline", { reducedMotion, bounds: reducedOrdinary });
      ctx.observe("reducedMotionScopeBounds", { before, reduced });
      assert.equal(reducedMotion, true);
      assert(
        before.every((entry, index) => {
          const beforeBounds = entry.bounds;
          const reducedBounds = reduced[index]?.bounds;
          return (
            beforeBounds &&
            reducedBounds &&
            Math.abs(reducedBounds.width - beforeBounds.width) <= 1 &&
            Math.abs(reducedBounds.height - beforeBounds.height) <= 1
          );
        }),
        `${definition.row} reduced-motion bounds`,
      );
    } finally {
      await page.emulateMedia({ reducedMotion: "no-preference" });
    }
  });
  if (definition.assertions.includes("neutral-noop-preservation"))
    await ctx.check("neutral-noop-preservation", async () => {
      const scope = page.locator('[data-direction-scope="ordinary-ltr"]');
      const before = await ordinaryLtr.innerHTML();
      await scope.evaluate((element) => element.setAttribute("dir", "rtl"));
      const direction = await scope.evaluate((element) => getComputedStyle(element).direction);
      const after = await ordinaryLtr.innerHTML();
      ctx.observe("neutralNoopPreservation", { direction, markupUnchanged: before === after });
      await scope.evaluate((element) => element.removeAttribute("dir"));
      assert.equal(direction, "rtl");
      assert.equal(
        after,
        before,
        `${definition.row} keeps native/passive markup unchanged on direction change`,
      );
    });
}
