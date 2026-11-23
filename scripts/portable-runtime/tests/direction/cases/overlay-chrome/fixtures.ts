import { type DirectionCase, TARGETS, type Target } from "../../inventory.js";

export const parts = {
  dialog: "Dialog DialogTrigger DialogContent DialogTitle DialogHeader",
  "alert-dialog":
    "AlertDialog AlertDialogTrigger AlertDialogContent AlertDialogTitle AlertDialogHeader AlertDialogCancel",
  sheet: "Sheet SheetTrigger SheetContent SheetTitle",
  dropdown:
    "Dropdown DropdownTrigger DropdownContent DropdownCheckboxItem DropdownShortcut DropdownSub DropdownSubTrigger DropdownSubContent DropdownItem",
  "context-menu": "ContextMenu ContextMenuTrigger ContextMenuContent ContextMenuItem",
  select: "Select SelectTrigger SelectContent SelectItem",
  combobox:
    "Combobox ComboboxInputGroup ComboboxInput ComboboxTrigger ComboboxContent ComboboxItem",
  tooltip: "Tooltip TooltipTrigger TooltipContent",
  popover: "Popover PopoverTrigger PopoverContent",
  "hover-card": "HoverCard HoverCardTrigger HoverCardContent",
  sidebar:
    "SidebarProvider Sidebar SidebarMenu SidebarMenuItem SidebarTrigger SidebarGroup SidebarGroupAction SidebarMenuAction SidebarMenuButton SidebarMenuBadge SidebarMenuSub SidebarRail SidebarInset",
  toast: "Toaster ToastTemplate ToastItem ToastTitle ToastClose",
};
export type Group = "overlay" | "sidebar" | "toast";
export function source(target: Target, group: Group) {
  const imports =
    Object.entries(parts)
      .filter(([row]) =>
        group === "overlay"
          ? row !== "sidebar" && row !== "toast"
          : row === group || (group === "sidebar" && row === "tooltip"),
      )
      .map(
        ([row, names]) =>
          `import { ${names.split(" ").join(", ")} } from "@direction/styled-${target}/${row}";`,
      )
      .join("\n") + '\nimport "@direction/sheet";';
  const prop = (name: string, value: string) =>
    target === "vue" ? `:${name}="${value}"` : `${name}={${value}}`;
  const sides = ["top", "right", "bottom", "left"];
  const dialog = `<Dialog><DialogTrigger>Dialog</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Dialog heading</DialogTitle></DialogHeader></DialogContent></Dialog>
    <AlertDialog><AlertDialogTrigger>Alert</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Alert heading</AlertDialogTitle></AlertDialogHeader><AlertDialogCancel>Return</AlertDialogCancel></AlertDialogContent></AlertDialog>`;
  const sheets = sides
    .map(
      (side) =>
        `<div data-sheet="${side}"><Sheet><SheetTrigger>Sheet ${side}</SheetTrigger><SheetContent side="${side}"><SheetTitle>${side}</SheetTitle></SheetContent></Sheet></div>`,
    )
    .join("");
  const customIcon =
    target === "react" ? 'icon={<svg data-caller="" className="rotate-45" />}' : "";
  const iconChildren =
    target === "react"
      ? ""
      : target === "astro"
        ? '<svg slot="icon" data-caller="" class="rotate-45" />'
        : target === "vue"
          ? '<template #icon><svg data-caller="" class="rotate-45" /></template>'
          : '{#snippet icon()}<svg data-caller="" class="rotate-45"></svg>{/snippet}';
  const menus = `<Dropdown><DropdownTrigger>Menu</DropdownTrigger><DropdownContent><DropdownCheckboxItem ${prop("defaultChecked", "true")} inset>Selection</DropdownCheckboxItem><DropdownItem>Command<DropdownShortcut>F1</DropdownShortcut></DropdownItem>
    <DropdownSub><DropdownSubTrigger>Branch</DropdownSubTrigger><DropdownSubContent><DropdownItem>Child</DropdownItem></DropdownSubContent></DropdownSub>
    <DropdownSub><DropdownSubTrigger ${customIcon}>Caller${iconChildren}</DropdownSubTrigger><DropdownSubContent side="right"><DropdownItem>Explicit child</DropdownItem></DropdownSubContent></DropdownSub></DropdownContent></Dropdown>`;
  const contexts = sides
    .map(
      (side) =>
        `<div data-context="${side}"><ContextMenu><ContextMenuTrigger>Context ${side}</ContextMenuTrigger><ContextMenuContent side="${side}"><ContextMenuItem>Item</ContextMenuItem></ContextMenuContent></ContextMenu></div>`,
    )
    .join("");
  const choices = `<Select defaultValue="one"><SelectTrigger>Choose</SelectTrigger><SelectContent><SelectItem value="one">One</SelectItem></SelectContent></Select>
    <Combobox defaultValue="one"><ComboboxInputGroup><ComboboxInput aria-label="Find"/><ComboboxTrigger>Open results</ComboboxTrigger></ComboboxInputGroup><ComboboxContent><ComboboxItem value="one">One</ComboboxItem></ComboboxContent></Combobox>`;
  const floating = ["Popover", "HoverCard", "Tooltip"]
    .map(
      (name) =>
        `<${name}><${name}Trigger>${name}</${name}Trigger><${name}Content side="left">Floating ${name}</${name}Content></${name}>`,
    )
    .join("");
  const sidebarMenu = (id: string) =>
    `<SidebarMenu><SidebarMenuItem><SidebarMenuButton tooltip="${id} tip" data-menu="${id}">${id}</SidebarMenuButton><SidebarMenuBadge>4</SidebarMenuBadge></SidebarMenuItem></SidebarMenu><SidebarMenuSub>Child</SidebarMenuSub>`;
  const provider = (side: string, child: string, mode: string, id: string) =>
    `<SidebarProvider ${prop("persistOpen", "false")} ${prop("defaultOpen", "false")}><Sidebar side="${side}" collapsible="${mode}">${sidebarMenu(id)}${child}<SidebarRail /></Sidebar><SidebarInset>Body</SidebarInset></SidebarProvider>`;
  const nested = provider(
    "left",
    provider(
      "right",
      '<Tooltip><TooltipTrigger>Explicit</TooltipTrigger><TooltipContent side="right">Explicit side</TooltipContent></Tooltip>',
      "none",
      "inner-right",
    ),
    "icon",
    "outer-left",
  );
  const panels = ["sidebar", "floating", "inset"]
    .flatMap((variant) =>
      ["left", "right"].map(
        (side) =>
          `<div data-panel-case="${variant}-${side}" class="fixed inset-0" hidden><SidebarProvider ${prop("persistOpen", "false")} ${prop("defaultOpen", "true")}><Sidebar side="${side}" variant="${variant}" collapsible="${variant === "floating" ? "offcanvas" : "icon"}"><SidebarGroup><SidebarGroupAction>Group action</SidebarGroupAction></SidebarGroup><SidebarMenu><SidebarMenuItem><SidebarMenuButton>Menu</SidebarMenuButton><SidebarMenuAction>Action</SidebarMenuAction><SidebarMenuBadge>7</SidebarMenuBadge></SidebarMenuItem></SidebarMenu><SidebarMenuSub>Nested</SidebarMenuSub><SidebarRail/></Sidebar><SidebarInset><SidebarTrigger/></SidebarInset></SidebarProvider></div>`,
      ),
    )
    .join("");
  const nestedGaps = ["ltr", "rtl"]
    .map((dir) => {
      const opposite = dir === "ltr" ? "rtl" : "ltr";
      return `<div data-nested-gap="${dir}" class="fixed inset-0" hidden><SidebarProvider dir="${dir}" ${prop("persistOpen", "false")}><Sidebar side="left" dir="${opposite}">Outer</Sidebar><SidebarInset><SidebarProvider dir="${opposite}" ${prop("persistOpen", "false")}><Sidebar side="right" dir="${dir}">Inner</Sidebar><SidebarInset>Content</SidebarInset></SidebarProvider></SidebarInset></SidebarProvider></div>`;
    })
    .join("");
  const staticPanels = ["left", "right"]
    .map(
      (side) =>
        `<div data-static-panel="${side}" class="fixed inset-0" hidden><SidebarProvider ${prop("persistOpen", "false")}><Sidebar side="${side}" collapsible="none">Panel</Sidebar><SidebarInset>Body</SidebarInset></SidebarProvider></div>`,
    )
    .join("");
  const reversed = provider(
    "right",
    provider("left", "", "none", "inner-left"),
    "icon",
    "outer-right",
  );
  const toast = `<div dir="ltr"><button type="button" data-toast-call="default">Left caller</button></div><div dir="rtl"><button type="button" data-toast-call="success">Right caller</button><button type="button" data-toast-call="error">Item override</button></div>
    <section data-viewport-scope="" dir="rtl"><Toaster ${prop("duration", "0")}><ToastTemplate><ToastItem><ToastTitle/><ToastClose>Close</ToastClose></ToastItem></ToastTemplate><ToastTemplate variant="success" dir="auto"><ToastItem><ToastTitle/><ToastClose>Close</ToastClose></ToastItem></ToastTemplate><ToastTemplate variant="error" dir="rtl"><ToastItem dir="ltr"><ToastTitle/><ToastClose>Close</ToastClose></ToastItem></ToastTemplate></Toaster></section>`;
  const handlers = `import {toast} from "@starwind-ui/runtime/toast"; document.addEventListener("click",event=>{const button=event.target.closest("[data-toast-call]"); if(button)toast({title:button.dataset.toastCall==="success"?"English":"مرحبا",variant:button.dataset.toastCall,duration:0});});`;
  const body =
    `<main dir="rtl"><div><section dir="rtl" data-direction-scope="overlay" class="mx-auto w-96 space-y-2 py-6">${group === "overlay" ? dialog + sheets + menus + contexts + choices + floating : group === "toast" ? toast : `<div data-pair="left">${nested}</div><div data-pair="right" hidden>${reversed}</div>${panels}${nestedGaps}${staticPanels}`}</section></div></main>`.replaceAll(
      "class=",
      target === "react" ? "className=" : "class=",
    );
  const code = group === "toast" ? handlers : "";
  if (target === "astro")
    return `---\n${imports}\n---\n<html><head><meta charset="utf-8"/><link rel="icon" href="data:,"/><title>Overlay chrome</title></head><body>${body}${code ? `<script>${code}</script>` : ""}</body></html>`;
  if (target === "react")
    return `import {createRoot} from "react-dom/client";\n${imports}\n${code}\ncreateRoot(document.getElementById("app")!).render(${body});`;
  if (target === "vue")
    return `<script setup lang="ts">\n${imports}\n${code}\n</script><template>${body}</template>`;
  return `<script lang="ts">\n${imports}\n${code}\n</script>${body}`;
}

// SalahAdDin’s PR #290 identified Dialog header alignment and close placement, Select option
// spacing, and Sheet close placement. Dialog centering and the requested Sheet side stay physical.
export const checks = {
  overlay: [
    "modal-chrome",
    "native-dialog-viewport",
    "native-alert-dialog-viewport",
    "sheet-sides",
    "menu-and-choice-chrome",
    "context-entry-bounds",
    "physical-floating-sides",
  ],
  sidebar: ["owned-sidebar-tooltips", "physical-sidebar-panels"],
  toast: ["viewport-template-and-swipe"],
};
export const rows = { overlay: "dialog", sidebar: "sidebar", toast: "toast" } as const;
export const cases: DirectionCase[] = (Object.keys(rows) as Group[]).map((group) => ({
  id: `chrome-${group}-styled`,
  row: rows[group],
  acceptance: ["SPEC-AC-01", "SPEC-AC-02", "SPEC-AC-12", "SPEC-AC-13"],
  physicalExceptions:
    group === "overlay"
      ? [
          "Popup midpoint anchors, resolved physical slides, transform origins and Sheet sides retain their physical meaning.",
        ]
      : group === "toast"
        ? ["Viewport placements, centers and rightward swipe use physical coordinates."]
        : ["The Sidebar panel, rail and offcanvas motion follow its physical side."],
  fixtures: Object.fromEntries(
    TARGETS.map((t) => [
      t,
      {
        source: source(t, group),
        exports: parts[rows[group]].split(" "),
        assertions: checks[group],
      },
    ]),
  ),
}));
