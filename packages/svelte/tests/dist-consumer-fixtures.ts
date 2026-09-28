import { consumerFamilies } from "./dist-consumer.js";

const names = Object.fromEntries(
  consumerFamilies.map((family) => [
    family,
    family
      .split("-")
      .map((word) => word[0]!.toUpperCase() + word.slice(1))
      .join(""),
  ]),
);

const rootName = (family: string) =>
  family === "sidebar" ? "SidebarProvider" : `${names[family]}Root`;

export const positiveConsumer = `<script lang="ts">
${consumerFamilies.map((family) => `import ${names[family]}Default, { ${names[family]}, ${rootName(family)} } from "@starwind-ui/svelte/${family}";`).join("\n")}
import * as Root from "@starwind-ui/svelte";
import type { ButtonChildPayload, ButtonChildProps } from "@starwind-ui/svelte/button";
import type { AccordionValue } from "@starwind-ui/svelte/accordion";
import type { SliderValue } from "@starwind-ui/svelte/slider";
import { createCarousel, type CarouselOptions } from "@starwind-ui/svelte/carousel";
import { toast, type ToastOptions, type ToastPromiseOptions } from "@starwind-ui/svelte/toast";
import { createAttachmentKey } from "svelte/attachments";
let checked = $state<boolean | undefined>(undefined);
let selectOpen = $state<boolean | undefined>(undefined);
let selectValue = $state<string | null | undefined>(undefined);
let accordionValue = $state<AccordionValue | undefined>(undefined);
let dialogOpen = $state<boolean | undefined>(undefined);
let sliderValue = $state<SliderValue | undefined>(undefined);
const buttonRef = (element: HTMLButtonElement | null) => { void element?.disabled; };
const childProps: ButtonChildProps = {
  type: "button", "aria-label": "Attached button", onclick: event => { void event.currentTarget.disabled; },
  [createAttachmentKey()]: (element: HTMLButtonElement) => { void element.disabled; return () => {}; },
};
const carouselOptions: CarouselOptions = { opts: { loop: true } };
const toastOptions: ToastOptions = { duration: 1000 };
const promiseOptions: ToastPromiseOptions<string> = { loading: "Loading", success: value => value, error: "Failed" };
void [${consumerFamilies.map((family) => `${names[family]}Default, ${names[family]}, ${rootName(family)}, Root.${rootName(family)}`).join(", ")}, createCarousel, toast, toastOptions, promiseOptions];
</script>
{#snippet child({ props, children }: ButtonChildPayload)}
  <button {...props}>{#if children}{@render children()}{/if}</button>
{/snippet}
<Button.Root {...childProps} ref={buttonRef}>Built button</Button.Root>
<Checkbox.Root nativeButton bind:checked defaultChecked={false} ref={(element: HTMLButtonElement | HTMLSpanElement | null) => {}} aria-label="Built checkbox"><Checkbox.Indicator keepMounted /></Checkbox.Root>
<Select.Root bind:open={selectOpen} bind:value={selectValue} defaultValue={null}>
  <Select.Label>Built label</Select.Label>
  <Select.Trigger ref={buttonRef} {child}><Select.Value placeholder="Built select" /><Select.Icon /></Select.Trigger>
  <Select.Portal><Select.Positioner><Select.Popup><Select.ScrollUpArrow /><Select.List><Select.Group><Select.GroupLabel>Built group</Select.GroupLabel><Select.Item value="closure"><Select.ItemText>Closure</Select.ItemText><Select.ItemIndicator /></Select.Item></Select.Group><Select.Separator /></Select.List><Select.ScrollDownArrow /></Select.Popup></Select.Positioner></Select.Portal>
</Select.Root>
<Collapsible.Root defaultOpen><Collapsible.Trigger>Built collapsible</Collapsible.Trigger><Collapsible.Panel>Built content</Collapsible.Panel></Collapsible.Root>
<ScrollArea.Root overflowEdgeThreshold={{ yEnd: 5 }}><ScrollArea.Viewport><ScrollArea.Content>Built scroll area</ScrollArea.Content></ScrollArea.Viewport><ScrollArea.Scrollbar><ScrollArea.Thumb /></ScrollArea.Scrollbar><ScrollArea.Corner /></ScrollArea.Root>
<Toggle.Root defaultPressed syncGroup="built"/><ToggleGroup.Root multiple defaultValue={["built"]}><Toggle.Root value="built" /></ToggleGroup.Root>
<RadioGroup.Root defaultValue="built"><Radio.Root value="built"><Radio.Indicator keepMounted /></Radio.Root></RadioGroup.Root>
<CheckboxGroup.Root defaultValue={["built"]}><Checkbox.Root value="built">Built group choice</Checkbox.Root></CheckboxGroup.Root>
<Switch.Root nativeButton id="built-switch"><Switch.Thumb /></Switch.Root>
<Field.Root><Field.Label>Built Field</Field.Label><Field.Control /><Field.Description>Details</Field.Description><Field.Item /><Field.Error /><Field.Validity /></Field.Root>
<Form.Root><Form.ErrorSummary>Built summary</Form.ErrorSummary><Fieldset.Root><Fieldset.Legend>Built legend</Fieldset.Legend></Fieldset.Root></Form.Root>
<Input.Root value={["built", "input"]} />
<Tabs.Root defaultValue="a"><Tabs.List><Tabs.Tab value="a">A</Tabs.Tab><Tabs.Indicator/></Tabs.List><Tabs.Panel value="a">A content</Tabs.Panel></Tabs.Root>
<Dropzone.Root><Dropzone.Input name="files" multiple/><Dropzone.UploadIndicator>Upload</Dropzone.UploadIndicator><Dropzone.LoadingIndicator>Wait</Dropzone.LoadingIndicator><Dropzone.FilesList/></Dropzone.Root>
<InputOtp.Root value="12" defaultValue="34"><InputOtp.Group><InputOtp.Slot index={0}/><InputOtp.Slot index={1}/></InputOtp.Group><InputOtp.Separator/></InputOtp.Root>
<Progress.Root value={25}><Progress.Label>Built progress</Progress.Label><Progress.Track><Progress.Indicator /></Progress.Track><Progress.Value /></Progress.Root>
<Avatar.Root><Avatar.Image alt="Built portrait" /><Avatar.Fallback delay={10}>SW</Avatar.Fallback></Avatar.Root>
<Accordion.Root bind:value={accordionValue} defaultValue={null}>
  <Accordion.Item value="first"><Accordion.Header><Accordion.Trigger ref={buttonRef}>Built accordion</Accordion.Trigger></Accordion.Header><Accordion.Panel>Panel</Accordion.Panel></Accordion.Item>
</Accordion.Root>
<AlertDialog.Root open={false}><AlertDialog.Trigger {child}>Confirm</AlertDialog.Trigger><AlertDialog.Portal><AlertDialog.Backdrop /><AlertDialog.Viewport><AlertDialog.Popup><AlertDialog.Title>Confirm</AlertDialog.Title><AlertDialog.Description>Details</AlertDialog.Description><AlertDialog.Close {child}>Cancel</AlertDialog.Close></AlertDialog.Popup></AlertDialog.Viewport></AlertDialog.Portal></AlertDialog.Root>
<Drawer.Root open={false}><Drawer.Trigger {child}>Confirm</Drawer.Trigger><Drawer.Portal><Drawer.Backdrop /><Drawer.Viewport><Drawer.Popup><Drawer.Title>Confirm</Drawer.Title><Drawer.Description>Details</Drawer.Description><Drawer.Close {child}>Cancel</Drawer.Close></Drawer.Popup></Drawer.Viewport></Drawer.Portal></Drawer.Root>
<Popover.Root open={false}><Popover.Trigger {child}>Open</Popover.Trigger><Popover.Portal><Popover.Backdrop/><Popover.Viewport><Popover.Positioner><Popover.Popup><Popover.Title>Title</Popover.Title><Popover.Description>Details</Popover.Description><Popover.Arrow/><Popover.Close>Close</Popover.Close></Popover.Popup></Popover.Positioner></Popover.Viewport></Popover.Portal></Popover.Root>
<PreviewCard.Root open={false}><PreviewCard.Trigger href="#profile">Profile</PreviewCard.Trigger><PreviewCard.Portal><PreviewCard.Backdrop/><PreviewCard.Viewport><PreviewCard.Positioner><PreviewCard.Popup>Profile<PreviewCard.Arrow/></PreviewCard.Popup></PreviewCard.Positioner></PreviewCard.Viewport></PreviewCard.Portal></PreviewCard.Root>
<Combobox.Root defaultValue="astro"><Combobox.Label>Framework</Combobox.Label><Combobox.InputGroup><Combobox.Input/><Combobox.Trigger {child}>Open<Combobox.Icon/></Combobox.Trigger><Combobox.Clear {child}>Clear</Combobox.Clear></Combobox.InputGroup><Combobox.Value/><Combobox.Portal><Combobox.Positioner><Combobox.Popup><Combobox.Empty>Empty</Combobox.Empty><Combobox.List><Combobox.Group><Combobox.GroupLabel>Frameworks</Combobox.GroupLabel><Combobox.Item value="astro"><Combobox.ItemText>Astro</Combobox.ItemText><Combobox.ItemIndicator/></Combobox.Item></Combobox.Group><Combobox.Separator/></Combobox.List></Combobox.Popup></Combobox.Positioner></Combobox.Portal></Combobox.Root>
<NavigationMenu.Root defaultValue={null}><NavigationMenu.List><NavigationMenu.Item value="intro"><NavigationMenu.Trigger {child}>Intro<NavigationMenu.Icon/></NavigationMenu.Trigger><NavigationMenu.Content><NavigationMenu.Link href="#intro">Intro link</NavigationMenu.Link></NavigationMenu.Content></NavigationMenu.Item></NavigationMenu.List><NavigationMenu.Portal><NavigationMenu.Positioner><NavigationMenu.Popup><NavigationMenu.Viewport/><NavigationMenu.Arrow/></NavigationMenu.Popup></NavigationMenu.Positioner></NavigationMenu.Portal></NavigationMenu.Root>
<Menu.Root open={false}><Menu.Trigger {child}>Open</Menu.Trigger><Menu.Portal><Menu.Positioner><Menu.Popup><Menu.Group><Menu.Label>Actions</Menu.Label><Menu.Item>Profile<Menu.Shortcut>⌘P</Menu.Shortcut></Menu.Item><Menu.LinkItem href="#help">Help</Menu.LinkItem></Menu.Group><Menu.Separator/><Menu.CheckboxItem><Menu.CheckboxItemIndicator/>Check</Menu.CheckboxItem><Menu.RadioGroup><Menu.RadioItem value="one"><Menu.RadioItemIndicator/>One</Menu.RadioItem></Menu.RadioGroup><Menu.SubmenuRoot><Menu.SubmenuTrigger>More</Menu.SubmenuTrigger><Menu.Portal><Menu.Popup><Menu.Item>Nested</Menu.Item></Menu.Popup></Menu.Portal></Menu.SubmenuRoot></Menu.Popup></Menu.Positioner></Menu.Portal></Menu.Root>
<ContextMenu.Root open={false}><ContextMenu.Trigger>Open</ContextMenu.Trigger><ContextMenu.Portal><ContextMenu.Positioner><ContextMenu.Popup><ContextMenu.Group><ContextMenu.Label>Actions</ContextMenu.Label><ContextMenu.Item>Profile<ContextMenu.Shortcut>⌘P</ContextMenu.Shortcut></ContextMenu.Item><ContextMenu.LinkItem href="#help">Help</ContextMenu.LinkItem></ContextMenu.Group><ContextMenu.Separator/><ContextMenu.CheckboxItem><ContextMenu.CheckboxItemIndicator/>Check</ContextMenu.CheckboxItem><ContextMenu.RadioGroup><ContextMenu.RadioItem value="one"><ContextMenu.RadioItemIndicator/>One</ContextMenu.RadioItem></ContextMenu.RadioGroup><ContextMenu.SubmenuRoot><ContextMenu.SubmenuTrigger>More</ContextMenu.SubmenuTrigger><ContextMenu.Portal><ContextMenu.Popup><ContextMenu.Item>Nested</ContextMenu.Item></ContextMenu.Popup></ContextMenu.Portal></ContextMenu.SubmenuRoot></ContextMenu.Popup></ContextMenu.Positioner></ContextMenu.Portal></ContextMenu.Root>
<Tooltip.Root open={false}><Tooltip.Trigger {child}>Help</Tooltip.Trigger><Tooltip.Portal><Tooltip.Positioner><Tooltip.Popup>Details<Tooltip.Arrow/></Tooltip.Popup></Tooltip.Positioner></Tooltip.Portal></Tooltip.Root>
<Dialog.Root bind:open={dialogOpen} defaultOpen={false}>
  <Dialog.Trigger ref={buttonRef} {child}>Open dialog</Dialog.Trigger>
  <Dialog.Backdrop />
  <Dialog.Popup ref={(element: HTMLDialogElement | null) => {}}><Dialog.Title>Built dialog</Dialog.Title><Dialog.Description>Built description</Dialog.Description><Dialog.Close ref={buttonRef} {child}>Close dialog</Dialog.Close></Dialog.Popup>
</Dialog.Root>
<Slider.Root bind:value={sliderValue} defaultValue={[20, 80]} ref={(element: HTMLDivElement | null) => {}} aria-label="Built slider">
  <Slider.Label>Built slider</Slider.Label><Slider.Control><Slider.Track><Slider.Indicator /></Slider.Track><Slider.Thumb inputRef={(element: HTMLInputElement | null) => {}} /></Slider.Control>
</Slider.Root>
<Carousel.Root opts={carouselOptions.opts} ref={(element: HTMLDivElement | null) => {}} aria-label="Built carousel"><Carousel.Viewport><Carousel.Container><Carousel.Item>Slide</Carousel.Item></Carousel.Container></Carousel.Viewport><Carousel.Previous>Previous</Carousel.Previous><Carousel.Next>Next</Carousel.Next></Carousel.Root>
<Toast.Viewport aria-label="Built toast"><Toast.Template ref={(element: HTMLTemplateElement | null) => {}}><Toast.Root><Toast.Content><Toast.Title><Toast.TitleText>Toast</Toast.TitleText></Toast.Title><Toast.Description>Details</Toast.Description><Toast.Action>Act</Toast.Action><Toast.Close>Close</Toast.Close></Toast.Content></Toast.Root></Toast.Template></Toast.Viewport>
<ColorPicker.Root value="#123456" format="rgb"><ColorPicker.Label>Color</ColorPicker.Label><ColorPicker.Control><ColorPicker.ValueInput/><ColorPicker.ValueSwatch/><ColorPicker.ValueText/></ColorPicker.Control><ColorPicker.Area><ColorPicker.AreaBackground/><ColorPicker.AreaThumb/><ColorPicker.AreaInput axis="x"/><ColorPicker.AreaInput axis="y"/></ColorPicker.Area><ColorPicker.ChannelSlider><ColorPicker.ChannelSliderTrack/><ColorPicker.ChannelSliderThumb/><ColorPicker.ChannelSliderInput/></ColorPicker.ChannelSlider><ColorPicker.ChannelInput/><ColorPicker.FormatSelect><option value="hex">Hex</option></ColorPicker.FormatSelect><ColorPicker.FormatControl/><ColorPicker.TransparencyGrid/><ColorPicker.SwatchGroup><ColorPicker.Swatch swatchValue="#ff0000"/></ColorPicker.SwatchGroup><ColorPicker.EyeDropperTrigger/><ColorPicker.Clear/><ColorPicker.HiddenInput/></ColorPicker.Root>
<Sidebar.Provider open={false} mobileOpen={false}><Sidebar.Sidebar/><Sidebar.Trigger {child}>Sidebar</Sidebar.Trigger><Sidebar.Rail/><Sidebar.MenuButton href="">Home</Sidebar.MenuButton></Sidebar.Provider>
<Root.CheckboxRoot checked={true} />
<Root.SelectRoot open={false} value={null} />
<Root.AccordionRoot value="first" /><Root.AccordionRoot value={["first"]} /><Root.AccordionRoot value={null} />
<Root.DialogRoot open={false} /><Root.SliderRoot value={30} /><Root.SliderRoot value={[20, 80]} />
`;

export const negativeConsumers: Record<
  string,
  {
    source: string;
    diagnostic: RegExp;
  }
> = {
  "SidebarModel.svelte": {
    source: `<script lang="ts">import Sidebar from "@starwind-ui/svelte/sidebar";</script><Sidebar.Provider open="yes"/>`,
    diagnostic: /not assignable to type 'boolean/,
  },
  "SidebarChild.svelte": {
    source: `<script lang="ts">import Sidebar from "@starwind-ui/svelte/sidebar";import type {Snippet} from "svelte";const child:Snippet<[string]>=null!;</script><Sidebar.Provider><Sidebar.MenuButton {child}/></Sidebar.Provider>`,
    diagnostic: /not assignable to type/,
  },
  "SidebarAnchorRef.svelte": {
    source: `<script lang="ts">import Sidebar from "@starwind-ui/svelte/sidebar";const ref=(node:HTMLButtonElement|null)=>{};</script><Sidebar.Provider><Sidebar.MenuButton href="" {ref}/></Sidebar.Provider>`,
    diagnostic: /not assignable to type/,
  },
  "SidebarButtonRef.svelte": {
    source: `<script lang="ts">import Sidebar from "@starwind-ui/svelte/sidebar";const ref=(node:HTMLAnchorElement|null)=>{};</script><Sidebar.Provider><Sidebar.MenuButton {ref}/></Sidebar.Provider>`,
    diagnostic: /not assignable to type/,
  },
  "SidebarDisabledAnchor.svelte": {
    source: `<script lang="ts">import Sidebar from "@starwind-ui/svelte/sidebar";</script><Sidebar.Provider><Sidebar.MenuButton href="/settings" disabled>Settings</Sidebar.MenuButton></Sidebar.Provider>`,
    diagnostic: /does not exist in type/,
  },
  "SidebarTaggedProps.svelte": {
    source: `<script lang="ts">import Sidebar,{type SidebarMenuButtonChildPayload} from "@starwind-ui/svelte/sidebar";</script>{#snippet child(payload:SidebarMenuButtonChildPayload)}{#if payload.kind==="anchor"}<button {...payload.props}></button>{/if}{/snippet}<Sidebar.Provider><Sidebar.MenuButton href="" {child}/></Sidebar.Provider>`,
    diagnostic: /not assignable to type/,
  },
};
function invalid(name: string, imports: string, markup: string, diagnostic: RegExp) {
  negativeConsumers[`${name}.svelte`] = {
    source: `<script lang="ts">${imports}</script>\n${markup}`,
    diagnostic,
  };
}
for (const [part, prop, value] of [
  ["Checkbox", "checked", "null"],
  ["Checkbox", "checked", '"checked"'],
  ["Select", "open", "null"],
  ["Select", "value", "false"],
  ["Accordion", "value", "42"],
  ["Accordion", "value", "[42]"],
  ["Dialog", "open", "null"],
  ["Slider", "value", '"20"'],
  ["Slider", "value", '["20"]'],
] as const) {
  invalid(
    `InvalidModel${Object.keys(negativeConsumers).length}`,
    `import { ${part}Root } from "@starwind-ui/svelte/${part.toLowerCase()}";`,
    `<${part}Root ${prop}={${value}} />`,
    /not assignable/,
  );
}
for (const [prop, value] of [
  ["value", "42"],
  ["format", '\"lab\"'],
] as const)
  invalid(
    `InvalidColorPicker${prop}`,
    'import {ColorPickerRoot} from "@starwind-ui/svelte/color-picker";',
    `<ColorPickerRoot ${prop}={${value}}/>`,
    /not assignable/,
  );
invalid(
  "InvalidColorPickerAxis",
  'import Picker from "@starwind-ui/svelte/color-picker";',
  '<Picker.Root><Picker.AreaInput axis="z"/></Picker.Root>',
  /not assignable/,
);
invalid(
  "InvalidColorPickerRef",
  'import Picker from "@starwind-ui/svelte/color-picker";',
  "<Picker.Root><Picker.AreaInput ref={(node:HTMLButtonElement|null)=>{}}/></Picker.Root>",
  /not assignable/,
);
invalid(
  "InvalidOwnChildButtonRoot",
  'import { ButtonRoot, type ButtonChildPayload } from "@starwind-ui/svelte/button";',
  `{#snippet child(_payload: ButtonChildPayload)}<button>Invalid</button>{/snippet}<ButtonRoot {child} />`,
  /child.*does not exist|Property 'child'/,
);
invalid(
  "InvalidNativeProp",
  'import { ButtonRoot } from "@starwind-ui/svelte/button";',
  '<ButtonRoot type="invented-type" />',
  /invented-type/,
);
invalid(
  "InvalidButtonRef",
  'import { ButtonRoot } from "@starwind-ui/svelte/button";',
  "<ButtonRoot ref={(element: HTMLInputElement | null) => {}} />",
  /HTMLInputElement/,
);
invalid(
  "InvalidTemplateRef",
  'import { ToastTemplate } from "@starwind-ui/svelte/toast";',
  "<ToastTemplate ref={(element: HTMLButtonElement | null) => {}} />",
  /HTMLButtonElement/,
);
invalid(
  "InvalidInputRef",
  'import { SliderThumb } from "@starwind-ui/svelte/slider";',
  "<SliderThumb inputRef={(element: HTMLButtonElement | null) => {}} />",
  /HTMLButtonElement/,
);
invalid(
  "InvalidAttachment",
  'import type { ButtonChildProps } from "@starwind-ui/svelte/button"; import { createAttachmentKey } from "svelte/attachments"; const props: ButtonChildProps = { [createAttachmentKey()]: (element: HTMLInputElement) => {} };',
  "<button {...props}>Invalid</button>",
  /HTMLInputElement/,
);
invalid(
  "InvalidRootDefault",
  'import Root from "@starwind-ui/svelte"; void Root;',
  "",
  /no default export/,
);
invalid(
  "InvalidNamedExport",
  'import { MissingPart } from "@starwind-ui/svelte/select"; void MissingPart;',
  "",
  /no exported member.*MissingPart/,
);
invalid(
  "InvalidNamespacePart",
  'import Button from "@starwind-ui/svelte/button";',
  "<Button.MissingPart />",
  /MissingPart/,
);
invalid(
  "InvalidBinding",
  'import { CheckboxRoot } from "@starwind-ui/svelte/checkbox"; let indeterminate = $state(false);',
  "<CheckboxRoot bind:indeterminate />",
  /indeterminate/,
);

// Binding and native-branch witnesses for the shared generated type shapes.
invalid(
  "InvalidNativeBranch",
  'import Checkbox from "@starwind-ui/svelte/checkbox";',
  '<Checkbox.Root popovertarget="wrong-native-branch"/>',
  /popovertarget/,
);
invalid(
  "InvalidDualBinding",
  'import Select from "@starwind-ui/svelte/select"; let disabled=$state(false);',
  "<Select.Root bind:disabled/>",
  /disabled/,
);
invalid(
  "InvalidConstructorBinding",
  'import Dialog from "@starwind-ui/svelte/dialog"; let modal=$state(true);',
  "<Dialog.Root bind:modal/>",
  /modal/,
);

export const ssrConsumer = `
import assert from "node:assert/strict";
import { readFile, realpath, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { render } from "svelte/server";
import { compile } from "svelte/compiler";
import ts from "typescript";
import Consumer from "./Positive.svelte";
const require = createRequire(import.meta.url);
assert.equal(typeof globalThis.window, "undefined");
assert.equal(typeof globalThis.document, "undefined");
const root = process.cwd();
const client = compile(await readFile("Positive.svelte", "utf8"), { filename: path.join(root, "Positive.svelte"), generate: "client" });
assert.deepEqual(client.warnings, []);
assert.ok(client.js.code.length > 0);
const provenance = { tools: {}, modules: {} };
for (const specifier of ["svelte/compiler", "svelte-check/bin/svelte-check", "typescript"]) {
  const resolved = await realpath(require.resolve(specifier));
  assert.ok(resolved.startsWith(root + path.sep), resolved);
  provenance.tools[specifier] = resolved;
}
const rootPackage = await import("@starwind-ui/svelte");
assert.equal("default" in rootPackage, false);
const renderedExports = {};
for (const family of ${JSON.stringify(consumerFamilies)}) {
  const name = family.split("-").map(word => word[0].toUpperCase() + word.slice(1)).join("");
  const specifier = "@starwind-ui/svelte/" + family;
  const module = await import(specifier);
  assert.equal(module.default, module[name]);
  if (family === "context-menu") {
    const { default: menu } = await import("@starwind-ui/svelte/menu");
    const aliases = Object.keys(menu).filter(part => !["Root", "Trigger"].includes(part));
    assert.equal(aliases.length, 16);
    for (const part of aliases) assert.equal(module.default[part], menu[part], "Context Menu alias " + part);
  }
  const rootPart = family === "sidebar" ? "Provider" : "Root";
  const rootExport = name + rootPart;
  assert.equal(typeof module[name][rootPart], "function", name + "." + rootPart);
  assert.equal(module[name][rootPart], module[rootExport]);
  assert.equal(rootPackage[rootExport], module[rootExport]);
  if (family === "sidebar") {
    assert.equal("Root" in module.Sidebar, false);
    assert.equal("SidebarRoot" in module, false);
    assert.equal("SidebarRoot" in rootPackage, false);
  }
  renderedExports[family] = [];
  for (const [part, component] of Object.entries(module[name])) {
    const exportName = family === "sidebar" && part === "Sidebar" ? "SidebarComponent" : name + part;
    assert.equal(module[exportName], component);
    assert.equal(rootPackage[exportName], component);
    assert.ok((await readFile("Positive.svelte", "utf8")).includes("<" + name + "." + part), name + part + " has no rendered consumer tag");
    renderedExports[family].push(exportName);
  }
  renderedExports[family].sort();
}
for (const specifier of ["@starwind-ui/svelte", ${consumerFamilies.map((family) => JSON.stringify(`@starwind-ui/svelte/${family}`)).join(",")}, ${consumerFamilies.map((family) => JSON.stringify(`@starwind-ui/runtime/${family}`)).join(",")}]) {
  const modulePath = await realpath(fileURLToPath(import.meta.resolve(specifier)));
  const typePath = ts.resolveModuleName(specifier, path.join(root, "Positive.svelte"), { moduleResolution: ts.ModuleResolutionKind.Bundler, target: ts.ScriptTarget.ES2022 }, ts.sys).resolvedModule?.resolvedFileName;
  assert.ok(modulePath.startsWith(path.join(root, "node_modules/@starwind-ui")) && modulePath.includes("/dist/"), modulePath);
  assert.ok(typePath?.startsWith(path.join(root, "node_modules/@starwind-ui")) && typePath.includes("/dist/"), typePath);
  provenance.modules[specifier] = { modulePath, typePath };
}
const first = render(Consumer).body;
assert.equal(render(Consumer).body, first);
for (const family of ${JSON.stringify(consumerFamilies)}) assert.ok(first.includes("data-sw-" + (family === "navigation-menu" ? "nav-menu" : family)), family);
await writeFile("resolved-modules.json", JSON.stringify(provenance, null, 2));
const theme = await import("@starwind-ui/svelte/theme");
assert.equal(rootPackage.getThemeInitScript, theme.getThemeInitScript);
assert.equal(rootPackage.initThemeController, theme.initThemeController);
assert.match(theme.getThemeInitScript({ storageKey: "closure-theme" }), /closure-theme/);
console.log(JSON.stringify({ provenance, body: first, renderedExports, facades: ["theme"] }));
`;

export const typescriptConsumer = `
import {
  AccordionRoot as RootAccordion,
  ButtonRoot as RootButton,
  CarouselRoot as RootCarousel,
  CheckboxRoot as RootCheckbox,
  DialogRoot as RootDialog,
  SelectRoot as RootSelect,
  SliderRoot as RootSlider,
  ToastRoot as RootToast,
  type AccordionValue as RootAccordionValue,
  type DialogOpenChangeDetails as RootDialogOpenChangeDetails,
  type SliderValue as RootSliderValue,
} from "@starwind-ui/svelte";
import {
  AccordionRoot,
  type AccordionValue,
  type AccordionValueChangeDetails,
} from "@starwind-ui/svelte/accordion";
import { ButtonRoot } from "@starwind-ui/svelte/button";
import {
  CarouselRoot,
  type CarouselInstance,
  type CarouselOptions,
  createCarousel,
} from "@starwind-ui/svelte/carousel";
import {
  CheckboxRoot,
  type CheckboxCheckedChangeDetails,
} from "@starwind-ui/svelte/checkbox";
import {
  DialogRoot,
  type DialogCloseCompleteDetails,
  type DialogOpenChangeDetails,
} from "@starwind-ui/svelte/dialog";
import {
  SelectRoot,
  type SelectOpenChangeDetails,
  type SelectValueChangeDetails,
} from "@starwind-ui/svelte/select";
import {
  SliderRoot,
  type SliderValue,
  type SliderValueChangeDetails,
  type SliderValueCommitDetails,
} from "@starwind-ui/svelte/slider";
import {
  ToastRoot,
  ToastViewport,
  toast,
  type ToastOptions,
  type ToastPromiseOptions,
} from "@starwind-ui/svelte/toast";
import type { ComponentProps } from "svelte";

const roots = [
  RootAccordion,
  RootButton,
  RootCarousel,
  RootCheckbox,
  RootDialog,
  RootSelect,
  RootSlider,
  RootToast,
  AccordionRoot,
  ButtonRoot,
  CarouselRoot,
  CheckboxRoot,
  DialogRoot,
  SelectRoot,
  SliderRoot,
  ToastRoot,
  ToastViewport,
] as const;
void roots;

type ComponentContracts = [
  ComponentProps<typeof AccordionRoot>,
  ComponentProps<typeof ButtonRoot>,
  ComponentProps<typeof CarouselRoot>,
  ComponentProps<typeof CheckboxRoot>,
  ComponentProps<typeof DialogRoot>,
  ComponentProps<typeof SelectRoot>,
  ComponentProps<typeof SliderRoot>,
  ComponentProps<typeof ToastViewport>,
];
type ValueContracts = AccordionValue | RootAccordionValue | SliderValue | RootSliderValue;
type CarouselContracts = CarouselInstance | CarouselOptions;
type ToastContracts = ToastOptions | ToastPromiseOptions<string>;
type ChangeContracts =
  | AccordionValueChangeDetails
  | CheckboxCheckedChangeDetails
  | DialogCloseCompleteDetails
  | DialogOpenChangeDetails
  | RootDialogOpenChangeDetails
  | SelectOpenChangeDetails
  | SelectValueChangeDetails
  | SliderValueChangeDetails
  | SliderValueCommitDetails;

declare const componentContracts: ComponentContracts;
declare const valueContract: ValueContracts;
declare const carouselContract: CarouselContracts;
declare const toastContract: ToastContracts;
declare const changeContract: ChangeContracts;
void [componentContracts, valueContract, changeContract, carouselContract, toastContract, createCarousel, toast];

const validButtonProps: ComponentProps<typeof ButtonRoot> = { disabled: true };
const validAccordionValue: AccordionValue = ["first", "second"];
const validSliderValue: SliderValue = [20, 80];
// @ts-expect-error Processed Button declarations must retain the native boolean prop type.
const invalidButtonProps: ComponentProps<typeof ButtonRoot> = { disabled: "yes" };
// @ts-expect-error Processed Accordion value declarations must reject non-string values.
const invalidAccordionValue: AccordionValue = 42;
// @ts-expect-error Processed Slider value declarations must reject non-number values.
const invalidSliderValue: SliderValue = ["20", "80"];
void [
  validButtonProps,
  validAccordionValue,
  validSliderValue,
  invalidButtonProps,
  invalidAccordionValue,
  invalidSliderValue,
];
`;
