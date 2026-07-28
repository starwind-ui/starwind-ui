import { spawnSync } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

import {
  vueGeneratedSourceFiles,
  vuePackageSubpaths,
  vueRuntimePrimitiveComponents,
} from "../../../../scripts/portable-runtime/renderers/framework-adapters/vue/inventory.js";

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));

const EXPECTED_ACCORDION_EXPORTS = [
  "Accordion",
  "AccordionHeader",
  "AccordionItem",
  "AccordionPanel",
  "AccordionRoot",
  "AccordionTrigger",
  "default",
].sort();
const EXPECTED_SELECT_EXPORTS = [
  "Select",
  "SelectContext",
  "SelectGroup",
  "SelectGroupLabel",
  "SelectIcon",
  "SelectItem",
  "SelectItemContext",
  "SelectItemIndicator",
  "SelectItemText",
  "SelectLabel",
  "SelectList",
  "SelectPopup",
  "SelectPortal",
  "SelectPositioner",
  "SelectRoot",
  "SelectScrollDownArrow",
  "SelectScrollUpArrow",
  "SelectSeparator",
  "SelectTrigger",
  "SelectValue",
  "default",
  "useSelectContext",
  "useSelectItemContext",
].sort();
const EXPECTED_SLIDER_EXPORTS = [
  "Slider",
  "SliderControl",
  "SliderIndicator",
  "SliderLabel",
  "SliderRoot",
  "SliderThumb",
  "SliderTrack",
  "default",
].sort();
const EXPECTED_AVATAR_EXPORTS = [
  "Avatar",
  "AvatarFallback",
  "AvatarImage",
  "AvatarRoot",
  "default",
].sort();
const EXPECTED_BUTTON_EXPORTS = ["Button", "ButtonRoot", "default"].sort();
const EXPECTED_CHECKBOX_EXPORTS = [
  "Checkbox",
  "CheckboxIndicator",
  "CheckboxRoot",
  "default",
].sort();
const EXPECTED_CHECKBOX_GROUP_EXPORTS = [
  "CheckboxGroup",
  "CheckboxGroupContext",
  "CheckboxGroupRoot",
  "default",
  "useCheckboxGroupContext",
].sort();
const EXPECTED_COLLAPSIBLE_EXPORTS = [
  "Collapsible",
  "CollapsiblePanel",
  "CollapsibleRoot",
  "CollapsibleTrigger",
  "default",
].sort();
const EXPECTED_DIALOG_EXPORTS = [
  "Dialog",
  "DialogBackdrop",
  "DialogClose",
  "DialogDescription",
  "DialogPopup",
  "DialogRoot",
  "DialogTitle",
  "DialogTrigger",
  "default",
].sort();
const EXPECTED_DRAWER_EXPORTS = [
  "Drawer",
  "DrawerBackdrop",
  "DrawerClose",
  "DrawerDescription",
  "DrawerPopup",
  "DrawerPortal",
  "DrawerRoot",
  "DrawerTitle",
  "DrawerTrigger",
  "DrawerViewport",
  "default",
].sort();
const EXPECTED_DROPZONE_EXPORTS = [
  "Dropzone",
  "DropzoneFilesList",
  "DropzoneInput",
  "DropzoneLoadingIndicator",
  "DropzoneRoot",
  "DropzoneUploadIndicator",
  "default",
].sort();
const EXPECTED_ALERT_DIALOG_EXPORTS = [
  "AlertDialog",
  "AlertDialogBackdrop",
  "AlertDialogClose",
  "AlertDialogDescription",
  "AlertDialogPopup",
  "AlertDialogPortal",
  "AlertDialogRoot",
  "AlertDialogTitle",
  "AlertDialogTrigger",
  "AlertDialogViewport",
  "default",
].sort();
const EXPECTED_INPUT_EXPORTS = ["Input", "InputRoot", "default"].sort();
const EXPECTED_INPUT_OTP_EXPORTS = [
  "InputOtp",
  "InputOtpGroup",
  "InputOtpRoot",
  "InputOtpSeparator",
  "InputOtpSlot",
  "default",
].sort();
const EXPECTED_FIELD_EXPORTS = [
  "Field",
  "FieldControl",
  "FieldDescription",
  "FieldError",
  "FieldItem",
  "FieldLabel",
  "FieldRoot",
  "FieldValidity",
  "default",
].sort();
const EXPECTED_FIELDSET_EXPORTS = ["Fieldset", "FieldsetLegend", "FieldsetRoot", "default"].sort();
const EXPECTED_FORM_EXPORTS = [
  "Form",
  "FormErrorSummary",
  "FormRoot",
  "createForm",
  "createFormSchemaValidator",
  "default",
  "validateFormSchema",
].sort();
const EXPECTED_PROGRESS_EXPORTS = [
  "Progress",
  "ProgressIndicator",
  "ProgressLabel",
  "ProgressRoot",
  "ProgressTrack",
  "ProgressValue",
  "default",
].sort();
const EXPECTED_POPOVER_EXPORTS = [
  "Popover",
  "PopoverArrow",
  "PopoverBackdrop",
  "PopoverClose",
  "PopoverDescription",
  "PopoverPopup",
  "PopoverPortal",
  "PopoverPositioner",
  "PopoverRoot",
  "PopoverTitle",
  "PopoverTrigger",
  "PopoverViewport",
  "default",
].sort();
const EXPECTED_RADIO_EXPORTS = ["Radio", "RadioIndicator", "RadioRoot", "default"].sort();
const EXPECTED_RADIO_GROUP_EXPORTS = [
  "RadioGroup",
  "RadioGroupContext",
  "RadioGroupRoot",
  "default",
  "useRadioGroupContext",
].sort();
const EXPECTED_SCROLL_AREA_EXPORTS = [
  "ScrollArea",
  "ScrollAreaContent",
  "ScrollAreaCorner",
  "ScrollAreaRoot",
  "ScrollAreaScrollbar",
  "ScrollAreaThumb",
  "ScrollAreaViewport",
  "default",
].sort();
const EXPECTED_SWITCH_EXPORTS = ["Switch", "SwitchRoot", "SwitchThumb", "default"].sort();
const EXPECTED_TABS_EXPORTS = [
  "Tabs",
  "TabsContext",
  "TabsIndicator",
  "TabsList",
  "TabsPanel",
  "TabsRoot",
  "TabsTab",
  "default",
  "useTabsContext",
].sort();
const EXPECTED_TOGGLE_EXPORTS = ["Toggle", "ToggleRoot", "default"].sort();
const EXPECTED_TOGGLE_GROUP_EXPORTS = [
  "ToggleGroup",
  "ToggleGroupContext",
  "ToggleGroupRoot",
  "default",
  "useToggleGroupContext",
].sort();
const EXPECTED_ENTRY_JAVA_SCRIPT = vuePackageSubpaths
  .map(({ exportTarget }) => exportTarget.import.replace("./dist/", ""))
  .sort();
const EXPECTED_SHARED_JAVA_SCRIPT_CHUNKS = vuePackageSubpaths.length + 3;

describe("release-like @starwind-ui/vue package", () => {
  it("imports the exact built root and component subpath values", async () => {
    const modules = await importVuePackageSubpaths();
    const root = modules["."]!;
    const accordion = modules["./accordion"]!;
    const alertDialog = modules["./alert-dialog"]!;
    const avatar = modules["./avatar"]!;
    const button = modules["./button"]!;
    const checkbox = modules["./checkbox"]!;
    const checkboxGroup = modules["./checkbox-group"]!;
    const collapsible = modules["./collapsible"]!;
    const dialog = modules["./dialog"]!;
    const drawer = modules["./drawer"]!;
    const dropzone = modules["./dropzone"]!;
    const field = modules["./field"]!;
    const fieldset = modules["./fieldset"]!;
    const form = modules["./form"]!;
    const input = modules["./input"]!;
    const inputOtp = modules["./input-otp"]!;
    const popover = modules["./popover"]!;
    const progress = modules["./progress"]!;
    const radio = modules["./radio"]!;
    const radioGroup = modules["./radio-group"]!;
    const scrollArea = modules["./scroll-area"]!;
    const select = modules["./select"]!;
    const slider = modules["./slider"]!;
    const switchPackage = modules["./switch"]!;
    const tabs = modules["./tabs"]!;
    const theme = modules["./theme"]!;
    const toggle = modules["./toggle"]!;
    const toggleGroup = modules["./toggle-group"]!;

    expect(Object.keys(accordion).sort()).toEqual(EXPECTED_ACCORDION_EXPORTS);
    expect(Object.keys(alertDialog).sort()).toEqual(EXPECTED_ALERT_DIALOG_EXPORTS);
    expect(Object.keys(avatar).sort()).toEqual(EXPECTED_AVATAR_EXPORTS);
    expect(Object.keys(button).sort()).toEqual(EXPECTED_BUTTON_EXPORTS);
    expect(Object.keys(checkbox).sort()).toEqual(EXPECTED_CHECKBOX_EXPORTS);
    expect(Object.keys(checkboxGroup).sort()).toEqual(EXPECTED_CHECKBOX_GROUP_EXPORTS);
    expect(Object.keys(collapsible).sort()).toEqual(EXPECTED_COLLAPSIBLE_EXPORTS);
    expect(Object.keys(dialog).sort()).toEqual(EXPECTED_DIALOG_EXPORTS);
    expect(Object.keys(drawer).sort()).toEqual(EXPECTED_DRAWER_EXPORTS);
    expect(Object.keys(dropzone).sort()).toEqual(EXPECTED_DROPZONE_EXPORTS);
    expect(Object.keys(field).sort()).toEqual(EXPECTED_FIELD_EXPORTS);
    expect(Object.keys(fieldset).sort()).toEqual(EXPECTED_FIELDSET_EXPORTS);
    expect(Object.keys(form).sort()).toEqual(EXPECTED_FORM_EXPORTS);
    expect(Object.keys(input).sort()).toEqual(EXPECTED_INPUT_EXPORTS);
    expect(Object.keys(inputOtp).sort()).toEqual(EXPECTED_INPUT_OTP_EXPORTS);
    expect(Object.keys(popover).sort()).toEqual(EXPECTED_POPOVER_EXPORTS);
    expect(Object.keys(progress).sort()).toEqual(EXPECTED_PROGRESS_EXPORTS);
    expect(Object.keys(radio).sort()).toEqual(EXPECTED_RADIO_EXPORTS);
    expect(Object.keys(radioGroup).sort()).toEqual(EXPECTED_RADIO_GROUP_EXPORTS);
    expect(Object.keys(scrollArea).sort()).toEqual(EXPECTED_SCROLL_AREA_EXPORTS);
    expect(Object.keys(select).sort()).toEqual(EXPECTED_SELECT_EXPORTS);
    expect(Object.keys(slider).sort()).toEqual(EXPECTED_SLIDER_EXPORTS);
    expect(Object.keys(switchPackage).sort()).toEqual(EXPECTED_SWITCH_EXPORTS);
    expect(Object.keys(tabs).sort()).toEqual(EXPECTED_TABS_EXPORTS);
    expect(Object.keys(toggle).sort()).toEqual(EXPECTED_TOGGLE_EXPORTS);
    expect(Object.keys(toggleGroup).sort()).toEqual(EXPECTED_TOGGLE_GROUP_EXPORTS);
    expect(Object.keys(theme).sort()).toEqual(["getThemeInitScript", "initThemeController"]);
    expect(accordion.default).toBe(accordion.Accordion);
    expect(accordion.Accordion).toEqual({
      Header: accordion.AccordionHeader,
      Item: accordion.AccordionItem,
      Panel: accordion.AccordionPanel,
      Root: accordion.AccordionRoot,
      Trigger: accordion.AccordionTrigger,
    });
    expect(avatar.default).toBe(avatar.Avatar);
    expect(avatar.Avatar).toEqual({
      Fallback: avatar.AvatarFallback,
      Image: avatar.AvatarImage,
      Root: avatar.AvatarRoot,
    });
    expect(button.default).toBe(button.Button);
    expect(button.Button).toEqual({ Root: button.ButtonRoot });
    expect(checkbox.default).toBe(checkbox.Checkbox);
    expect(checkbox.Checkbox).toEqual({
      Indicator: checkbox.CheckboxIndicator,
      Root: checkbox.CheckboxRoot,
    });
    expect(checkboxGroup.default).toBe(checkboxGroup.CheckboxGroup);
    expect(checkboxGroup.CheckboxGroup).toEqual({ Root: checkboxGroup.CheckboxGroupRoot });
    expect(collapsible.default).toBe(collapsible.Collapsible);
    expect(collapsible.Collapsible).toEqual({
      Panel: collapsible.CollapsiblePanel,
      Root: collapsible.CollapsibleRoot,
      Trigger: collapsible.CollapsibleTrigger,
    });
    expect(dialog.default).toBe(dialog.Dialog);
    expect(dialog.Dialog).toEqual({
      Backdrop: dialog.DialogBackdrop,
      Close: dialog.DialogClose,
      Description: dialog.DialogDescription,
      Popup: dialog.DialogPopup,
      Root: dialog.DialogRoot,
      Title: dialog.DialogTitle,
      Trigger: dialog.DialogTrigger,
    });
    expect(drawer.default).toBe(drawer.Drawer);
    expect(drawer.Drawer).toEqual({
      Backdrop: drawer.DrawerBackdrop,
      Close: drawer.DrawerClose,
      Description: drawer.DrawerDescription,
      Popup: drawer.DrawerPopup,
      Portal: drawer.DrawerPortal,
      Root: drawer.DrawerRoot,
      Title: drawer.DrawerTitle,
      Trigger: drawer.DrawerTrigger,
      Viewport: drawer.DrawerViewport,
    });
    expect(dropzone.default).toBe(dropzone.Dropzone);
    expect(dropzone.Dropzone).toEqual({
      FilesList: dropzone.DropzoneFilesList,
      Input: dropzone.DropzoneInput,
      LoadingIndicator: dropzone.DropzoneLoadingIndicator,
      Root: dropzone.DropzoneRoot,
      UploadIndicator: dropzone.DropzoneUploadIndicator,
    });
    expect(alertDialog.default).toBe(alertDialog.AlertDialog);
    expect(alertDialog.AlertDialog).toEqual({
      Backdrop: alertDialog.AlertDialogBackdrop,
      Close: alertDialog.AlertDialogClose,
      Description: alertDialog.AlertDialogDescription,
      Popup: alertDialog.AlertDialogPopup,
      Portal: alertDialog.AlertDialogPortal,
      Root: alertDialog.AlertDialogRoot,
      Title: alertDialog.AlertDialogTitle,
      Trigger: alertDialog.AlertDialogTrigger,
      Viewport: alertDialog.AlertDialogViewport,
    });
    expect(input.default).toBe(input.Input);
    expect(input.Input).toEqual({ Root: input.InputRoot });
    expect(field.default).toBe(field.Field);
    expect(field.Field).toEqual({
      Control: field.FieldControl,
      Description: field.FieldDescription,
      Error: field.FieldError,
      Item: field.FieldItem,
      Label: field.FieldLabel,
      Root: field.FieldRoot,
      Validity: field.FieldValidity,
    });
    expect(fieldset.default).toBe(fieldset.Fieldset);
    expect(fieldset.Fieldset).toEqual({
      Legend: fieldset.FieldsetLegend,
      Root: fieldset.FieldsetRoot,
    });
    expect(form.default).toBe(form.Form);
    expect(form.Form).toEqual({
      ErrorSummary: form.FormErrorSummary,
      Root: form.FormRoot,
    });
    expect(progress.default).toBe(progress.Progress);
    expect(progress.Progress).toEqual({
      Indicator: progress.ProgressIndicator,
      Label: progress.ProgressLabel,
      Root: progress.ProgressRoot,
      Track: progress.ProgressTrack,
      Value: progress.ProgressValue,
    });
    expect(popover.default).toBe(popover.Popover);
    expect(popover.Popover).toEqual({
      Arrow: popover.PopoverArrow,
      Backdrop: popover.PopoverBackdrop,
      Close: popover.PopoverClose,
      Description: popover.PopoverDescription,
      Popup: popover.PopoverPopup,
      Portal: popover.PopoverPortal,
      Positioner: popover.PopoverPositioner,
      Root: popover.PopoverRoot,
      Title: popover.PopoverTitle,
      Trigger: popover.PopoverTrigger,
      Viewport: popover.PopoverViewport,
    });
    expect(radio.default).toBe(radio.Radio);
    expect(radio.Radio).toEqual({
      Indicator: radio.RadioIndicator,
      Root: radio.RadioRoot,
    });
    expect(radioGroup.default).toBe(radioGroup.RadioGroup);
    expect(radioGroup.RadioGroup).toEqual({ Root: radioGroup.RadioGroupRoot });
    expect(scrollArea.default).toBe(scrollArea.ScrollArea);
    expect(scrollArea.ScrollArea).toEqual({
      Content: scrollArea.ScrollAreaContent,
      Corner: scrollArea.ScrollAreaCorner,
      Root: scrollArea.ScrollAreaRoot,
      Scrollbar: scrollArea.ScrollAreaScrollbar,
      Thumb: scrollArea.ScrollAreaThumb,
      Viewport: scrollArea.ScrollAreaViewport,
    });
    expect(select.default).toBe(select.Select);
    expect(select.Select).toEqual({
      Group: select.SelectGroup,
      GroupLabel: select.SelectGroupLabel,
      Icon: select.SelectIcon,
      Item: select.SelectItem,
      ItemIndicator: select.SelectItemIndicator,
      ItemText: select.SelectItemText,
      Label: select.SelectLabel,
      List: select.SelectList,
      Popup: select.SelectPopup,
      Portal: select.SelectPortal,
      Positioner: select.SelectPositioner,
      Root: select.SelectRoot,
      ScrollDownArrow: select.SelectScrollDownArrow,
      ScrollUpArrow: select.SelectScrollUpArrow,
      Separator: select.SelectSeparator,
      Trigger: select.SelectTrigger,
      Value: select.SelectValue,
    });
    expect(switchPackage.default).toBe(switchPackage.Switch);
    expect(switchPackage.Switch).toEqual({
      Root: switchPackage.SwitchRoot,
      Thumb: switchPackage.SwitchThumb,
    });
    expect(tabs.default).toBe(tabs.Tabs);
    expect(tabs.Tabs).toEqual({
      Indicator: tabs.TabsIndicator,
      List: tabs.TabsList,
      Panel: tabs.TabsPanel,
      Root: tabs.TabsRoot,
      Tab: tabs.TabsTab,
    });
    expect(toggle.default).toBe(toggle.Toggle);
    expect(toggle.Toggle).toEqual({ Root: toggle.ToggleRoot });
    expect(toggleGroup.default).toBe(toggleGroup.ToggleGroup);
    expect(toggleGroup.ToggleGroup).toEqual({ Root: toggleGroup.ToggleGroupRoot });
    expect(Object.keys(root).sort()).toEqual(
      [
        ...new Set([
          "AvatarFallback",
          ...EXPECTED_ACCORDION_EXPORTS,
          ...EXPECTED_ALERT_DIALOG_EXPORTS,
          "AvatarImage",
          "AvatarRoot",
          "Avatar",
          "Button",
          "ButtonRoot",
          "Checkbox",
          "CheckboxIndicator",
          "CheckboxRoot",
          ...EXPECTED_CHECKBOX_GROUP_EXPORTS,
          ...EXPECTED_COLLAPSIBLE_EXPORTS,
          ...EXPECTED_DIALOG_EXPORTS,
          ...EXPECTED_DRAWER_EXPORTS,
          ...EXPECTED_DROPZONE_EXPORTS,
          ...EXPECTED_FIELD_EXPORTS,
          ...EXPECTED_FIELDSET_EXPORTS,
          ...EXPECTED_FORM_EXPORTS,
          "Input",
          "InputRoot",
          ...EXPECTED_INPUT_OTP_EXPORTS,
          ...EXPECTED_POPOVER_EXPORTS,
          ...EXPECTED_PROGRESS_EXPORTS,
          ...EXPECTED_RADIO_EXPORTS,
          ...EXPECTED_RADIO_GROUP_EXPORTS,
          ...EXPECTED_SCROLL_AREA_EXPORTS,
          ...EXPECTED_SELECT_EXPORTS,
          ...EXPECTED_SLIDER_EXPORTS,
          ...EXPECTED_SWITCH_EXPORTS,
          ...EXPECTED_TABS_EXPORTS,
          ...EXPECTED_TOGGLE_EXPORTS,
          ...EXPECTED_TOGGLE_GROUP_EXPORTS,
          "getThemeInitScript",
          "initThemeController",
        ]),
      ]
        .filter((name) => name !== "default")
        .sort(),
    );
  });

  it("ships declarations for every export-map entry and typechecks a public consumer", async () => {
    const packageJson = JSON.parse(
      await readFile(path.join(repoRoot, "packages/vue/package.json"), "utf8"),
    );
    for (const contract of Object.values(packageJson.exports) as Array<{ types: string }>) {
      const declaration = path.join(repoRoot, "packages/vue", contract.types.replace(/^\.\//, ""));
      expect((await stat(declaration)).isFile(), declaration).toBe(true);
      expect(await readFile(declaration, "utf8"), declaration).not.toHaveLength(0);
    }

    const tsc = path.join(repoRoot, "node_modules/typescript/bin/tsc");
    const result = spawnSync(
      process.execPath,
      [tsc, "-p", path.join(repoRoot, "packages/vue/tests/release/tsconfig.json")],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );
    const diagnostics = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    expect(result.error, diagnostics).toBeUndefined();
    expect(result.status, diagnostics).toBe(0);
  }, 15_000);

  it("contains the exact normalized built inventory with no stale or unreachable output", async () => {
    const distRoot = path.join(repoRoot, "packages/vue/dist");
    const files = await readFileTree(distRoot);
    const declarationBases = vueGeneratedSourceFiles.map((file) => file.replace(/\.ts$/, ""));
    const expectedInventory = [
      ...EXPECTED_ENTRY_JAVA_SCRIPT,
      ...declarationBases.flatMap((base) => [`${base}.d.ts`, `${base}.d.ts.map`]),
      ...Array.from({ length: EXPECTED_SHARED_JAVA_SCRIPT_CHUNKS }, () => "chunk-<hash>.js"),
    ].sort();
    const normalizedInventory = files
      .map((file) => file.replace(/^chunk-[A-Z0-9]+\.js$/, "chunk-<hash>.js"))
      .sort();

    expect(normalizedInventory).toEqual(expectedInventory);
    expect(files.filter((file) => /^chunk-[A-Z0-9]+\.js$/.test(file))).toHaveLength(
      EXPECTED_SHARED_JAVA_SCRIPT_CHUNKS,
    );

    for (const sourceFile of vueGeneratedSourceFiles) {
      const base = sourceFile.replace(/\.ts$/, "");
      const declarationPath = `${base}.d.ts`;
      const declaration = await readFile(path.join(distRoot, declarationPath), "utf8");
      expect(declaration, declarationPath).not.toHaveLength(0);
      expect(declaration, declarationPath).toContain(
        `//# sourceMappingURL=${path.posix.basename(declarationPath)}.map`,
      );

      const mapPath = `${declarationPath}.map`;
      const declarationMap = JSON.parse(await readFile(path.join(distRoot, mapPath), "utf8")) as {
        file: string;
        sources: string[];
        version: number;
      };
      expect(declarationMap.version, mapPath).toBe(3);
      expect(declarationMap.file, mapPath).toBe(path.posix.basename(declarationPath));
      expect(declarationMap.sources, mapPath).toHaveLength(1);
      expect(declarationMap.sources[0]?.replaceAll("\\", "/"), mapPath).toMatch(
        new RegExp(`/src/${escapeRegExp(sourceFile)}$`),
      );
    }

    const javaScriptFiles = files.filter((file) => file.endsWith(".js"));
    const reachable = await findReachableJavaScript(distRoot, EXPECTED_ENTRY_JAVA_SCRIPT);
    expect([...reachable].sort()).toEqual(javaScriptFiles.sort());
  });

  it("server-renders every built Primitive export in valid public trees", async () => {
    const modules = await importVuePackageSubpaths();
    expect(
      vueRuntimePrimitiveComponents.map((component) => modules[`./${component}`]),
    ).not.toContain(undefined);
    const accordion = modules["./accordion"]!;
    const avatar = modules["./avatar"]!;
    const button = modules["./button"]!;
    const checkbox = modules["./checkbox"]!;
    const checkboxGroup = modules["./checkbox-group"]!;
    const field = modules["./field"]!;
    const fieldset = modules["./fieldset"]!;
    const form = modules["./form"]!;
    const input = modules["./input"]!;
    const inputOtp = modules["./input-otp"]!;
    const dropzone = modules["./dropzone"]!;
    const popover = modules["./popover"]!;
    const progress = modules["./progress"]!;
    const radio = modules["./radio"]!;
    const radioGroup = modules["./radio-group"]!;
    const scrollArea = modules["./scroll-area"]!;
    const select = modules["./select"]!;
    const slider = modules["./slider"]!;
    const tabs = modules["./tabs"]!;
    const toggle = modules["./toggle"]!;
    const toggleGroup = modules["./toggle-group"]!;
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h("main", null, [
              h(accordion.AccordionRoot, { defaultValue: "release" }, () =>
                h(accordion.AccordionItem, { value: "release" }, () => [
                  h(accordion.AccordionHeader, null, () =>
                    h(accordion.AccordionTrigger, null, () => "Release"),
                  ),
                  h(accordion.AccordionPanel, null, () => "Release content"),
                ]),
              ),
              h(avatar.AvatarRoot, null, {
                default: () => [
                  h(avatar.AvatarImage, { alt: "Profile", src: "/avatar.png" }),
                  h(avatar.AvatarFallback, null, { default: () => "AB" }),
                ],
              }),
              h(button.ButtonRoot, null, { default: () => "Save" }),
              h(slider.SliderRoot, { defaultValue: [20, 80], name: "price" }, () => [
                h(slider.SliderLabel, null, () => "Price"),
                h(slider.SliderControl, null, () => [
                  h(slider.SliderTrack, null, () => h(slider.SliderIndicator)),
                  h(slider.SliderThumb, { index: 0 }),
                  h(slider.SliderThumb, { index: 1 }),
                ]),
              ]),
              h(
                checkbox.CheckboxRoot,
                { defaultChecked: true },
                {
                  default: () => h(checkbox.CheckboxIndicator, { keepMounted: true }),
                },
              ),
              h(
                checkboxGroup.CheckboxGroupRoot,
                { defaultValue: ["release-group"] },
                {
                  default: () => h(checkbox.CheckboxRoot, { value: "release-group" }),
                },
              ),
              h(input.InputRoot, { defaultValue: "release input", name: "query" }),
              h(field.FieldRoot, { name: "release-profile" }, () => [
                h(field.FieldLabel, null, () => "Profile"),
                h(field.FieldControl, { defaultValue: "Ada", required: true }),
                h(field.FieldDescription, null, () => "Public name"),
                h(field.FieldItem, null, () => "Input row"),
                h(field.FieldError, { match: "valueMissing" }, () => "Required"),
                h(field.FieldValidity, { match: "valid" }, () => "Ready"),
              ]),
              h(dropzone.DropzoneRoot, null, () => [
                h(dropzone.DropzoneUploadIndicator),
                h(dropzone.DropzoneLoadingIndicator),
                h(dropzone.DropzoneFilesList),
                h(dropzone.DropzoneInput, { name: "files" }),
              ]),
              h(inputOtp.InputOtpRoot, { defaultValue: "123456", name: "otp" }, () =>
                h(inputOtp.InputOtpGroup, null, () => [
                  ...Array.from({ length: 3 }, (_, index) =>
                    h(inputOtp.InputOtpSlot, { index, key: index }),
                  ),
                  h(inputOtp.InputOtpSeparator),
                  ...Array.from({ length: 3 }, (_, offset) =>
                    h(inputOtp.InputOtpSlot, { index: offset + 3, key: offset + 3 }),
                  ),
                ]),
              ),
              h(fieldset.FieldsetRoot, null, {
                default: () => [
                  h(fieldset.FieldsetLegend, null, { default: () => "Details" }),
                  h(input.InputRoot, { name: "grouped" }),
                ],
              }),
              h(form.FormRoot, null, {
                default: () => h(form.FormErrorSummary),
              }),
              renderBuiltPopover(popover),
              h(
                progress.ProgressRoot,
                { value: 50 },
                {
                  default: () => [
                    h(progress.ProgressLabel, null, { default: () => "Progress" }),
                    h(progress.ProgressTrack, null, {
                      default: () => h(progress.ProgressIndicator),
                    }),
                    h(progress.ProgressValue),
                  ],
                },
              ),
              h(
                radioGroup.RadioGroupRoot,
                { defaultValue: "alpha" },
                {
                  default: () => [
                    h(
                      radio.RadioRoot,
                      { value: "alpha" },
                      { default: () => h(radio.RadioIndicator) },
                    ),
                    h(radio.RadioRoot, { value: "beta" }),
                  ],
                },
              ),
              h(scrollArea.ScrollAreaRoot, null, {
                default: () => [
                  h(scrollArea.ScrollAreaViewport, null, {
                    default: () => h(scrollArea.ScrollAreaContent),
                  }),
                  h(
                    scrollArea.ScrollAreaScrollbar,
                    { keepMounted: true },
                    {
                      default: () => h(scrollArea.ScrollAreaThumb),
                    },
                  ),
                  h(scrollArea.ScrollAreaCorner),
                ],
              }),
              renderBuiltSelect(select),
              h(tabs.TabsRoot, { defaultValue: "release" }, () => [
                h(tabs.TabsList, null, () => [
                  h(tabs.TabsTab, { value: "release" }, () => "Release"),
                  h(tabs.TabsIndicator),
                ]),
                h(tabs.TabsPanel, { value: "release" }, () => "Release content"),
              ]),
              h(
                toggleGroup.ToggleGroupRoot,
                { defaultValue: ["release-toggle"] },
                {
                  default: () => [
                    h(toggle.ToggleRoot, { value: "release-toggle" }),
                    h(toggle.ToggleRoot, { value: "other-toggle" }),
                  ],
                },
              ),
            ]),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    for (const marker of [
      "avatar",
      "accordion",
      "accordion-item",
      "accordion-header",
      "accordion-trigger",
      "accordion-content",
      "avatar-image",
      "avatar-fallback",
      "button",
      "field",
      "field-label",
      "field-control",
      "field-description",
      "field-item",
      "field-error",
      "field-validity",
      "dropzone",
      "dropzone-input",
      "dropzone-files-list",
      "dropzone-upload-indicator",
      "dropzone-loading-indicator",
      "input-otp",
      "input-otp-input",
      "input-otp-group",
      "input-otp-separator",
      "input-otp-slot",
      "checkbox",
      "checkbox-indicator",
      "input",
      "popover",
      "popover-trigger",
      "popover-portal",
      "popover-viewport",
      "popover-backdrop",
      "popover-positioner",
      "popover-popup",
      "popover-arrow",
      "popover-title",
      "popover-description",
      "popover-close",
      "progress",
      "progress-label",
      "progress-track",
      "progress-indicator",
      "progress-value",
      "radio",
      "radio-group",
      "radio-indicator",
      "scroll-area",
      "scroll-area-viewport",
      "scroll-area-content",
      "scroll-area-scrollbar",
      "scroll-area-thumb",
      "scroll-area-corner",
      "select",
      "tabs",
      "tabs-list",
      "tabs-tab",
      "tabs-indicator",
      "tabs-panel",
      "select-label",
      "select-trigger",
      "select-value",
      "select-icon",
      "select-portal",
      "select-positioner",
      "select-popup",
      "select-list",
      "select-group",
      "select-group-label",
      "select-item",
      "select-item-text",
      "select-item-indicator",
      "select-separator",
      "select-scroll-up-arrow",
      "select-scroll-down-arrow",
      "slider",
      "slider-label",
      "slider-control",
      "slider-track",
      "slider-indicator",
      "slider-thumb",
      "toggle",
      "toggle-group",
    ]) {
      expect(first, marker).toContain(`data-sw-${marker}`);
    }
    expectComponentMarkerCoverage(first, EXPECTED_ACCORDION_EXPORTS, ["Accordion", "default"], {
      AccordionHeader: "accordion-header",
      AccordionItem: "accordion-item",
      AccordionPanel: "accordion-content",
      AccordionRoot: "accordion",
      AccordionTrigger: "accordion-trigger",
    });
    expectComponentMarkerCoverage(
      first,
      EXPECTED_TABS_EXPORTS,
      ["Tabs", "TabsContext", "default", "useTabsContext"],
      {
        TabsIndicator: "tabs-indicator",
        TabsList: "tabs-list",
        TabsPanel: "tabs-panel",
        TabsRoot: "tabs",
        TabsTab: "tabs-tab",
      },
    );
    expectComponentMarkerCoverage(first, EXPECTED_FIELD_EXPORTS, ["Field", "default"], {
      FieldControl: "field-control",
      FieldDescription: "field-description",
      FieldError: "field-error",
      FieldItem: "field-item",
      FieldLabel: "field-label",
      FieldRoot: "field",
      FieldValidity: "field-validity",
    });
    expectComponentMarkerCoverage(first, EXPECTED_SLIDER_EXPORTS, ["Slider", "default"], {
      SliderControl: "slider-control",
      SliderIndicator: "slider-indicator",
      SliderLabel: "slider-label",
      SliderRoot: "slider",
      SliderThumb: "slider-thumb",
      SliderTrack: "slider-track",
    });
    expectComponentMarkerCoverage(first, EXPECTED_INPUT_OTP_EXPORTS, ["InputOtp", "default"], {
      InputOtpGroup: "input-otp-group",
      InputOtpRoot: "input-otp",
      InputOtpSeparator: "input-otp-separator",
      InputOtpSlot: "input-otp-slot",
    });
    expectComponentMarkerCoverage(first, EXPECTED_DROPZONE_EXPORTS, ["Dropzone", "default"], {
      DropzoneFilesList: "dropzone-files-list",
      DropzoneInput: "dropzone-input",
      DropzoneLoadingIndicator: "dropzone-loading-indicator",
      DropzoneRoot: "dropzone",
      DropzoneUploadIndicator: "dropzone-upload-indicator",
    });
  });

  it("keeps Runtime declared and Vue external across built ESM chunks", async () => {
    const packageJson = JSON.parse(
      await readFile(path.join(repoRoot, "packages/vue/package.json"), "utf8"),
    );
    expect(packageJson.dependencies).toEqual({ "@starwind-ui/runtime": "workspace:*" });
    expect(packageJson.peerDependencies).toEqual({ vue: ">=3.5" });

    const javaScript = await readJavaScriptTree(path.join(repoRoot, "packages/vue/dist"));
    expect(javaScript).toMatch(/from\s*["']vue["']/);
    expect(javaScript).toContain("@starwind-ui/runtime");
    expect(javaScript).not.toContain("vue.runtime.esm");
    expect(javaScript).not.toContain("@vue/runtime-core");
    expect(javaScript).not.toContain("class ReactiveEffect");
  });
});

function expectComponentMarkerCoverage(
  html: string,
  exactExports: string[],
  nonComponentExports: string[],
  componentMarkers: Record<string, string>,
) {
  expect(Object.keys(componentMarkers).sort()).toEqual(
    exactExports.filter((exportName) => !nonComponentExports.includes(exportName)).sort(),
  );
  for (const [exportName, marker] of Object.entries(componentMarkers)) {
    expect(html, exportName).toContain(`data-sw-${marker}`);
  }
}

async function readJavaScriptTree(directory: string): Promise<string> {
  const entries = await readdir(directory, { withFileTypes: true });
  const sources = await Promise.all(
    entries.map(async (entry) => {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) return readJavaScriptTree(candidate);
      return entry.isFile() && entry.name.endsWith(".js") ? readFile(candidate, "utf8") : "";
    }),
  );
  return sources.join("\n");
}

type VuePackageModule = typeof import("@starwind-ui/vue") &
  typeof import("@starwind-ui/vue/accordion") &
  typeof import("@starwind-ui/vue/avatar") &
  typeof import("@starwind-ui/vue/button") &
  typeof import("@starwind-ui/vue/checkbox") &
  typeof import("@starwind-ui/vue/checkbox-group") &
  typeof import("@starwind-ui/vue/input") &
  typeof import("@starwind-ui/vue/progress") &
  typeof import("@starwind-ui/vue/scroll-area") &
  typeof import("@starwind-ui/vue/select") &
  typeof import("@starwind-ui/vue/theme") &
  typeof import("@starwind-ui/vue/toggle") &
  typeof import("@starwind-ui/vue/toggle-group");

async function importVuePackageSubpaths(): Promise<Record<string, VuePackageModule>> {
  return Object.fromEntries(
    await Promise.all(
      vuePackageSubpaths.map(async ({ subpath }) => {
        const specifier =
          subpath === "." ? "@starwind-ui/vue" : `@starwind-ui/vue/${subpath.slice(2)}`;
        return [subpath, (await import(specifier)) as VuePackageModule] as const;
      }),
    ),
  );
}

async function readFileTree(directory: string, root: string = directory): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) return readFileTree(candidate, root);
      return entry.isFile() ? [path.relative(root, candidate).replaceAll("\\", "/")] : [];
    }),
  );
  return files.flat().sort();
}

async function findReachableJavaScript(
  distRoot: string,
  entryFiles: readonly string[],
): Promise<Set<string>> {
  const reachable = new Set<string>();
  const pending = [...entryFiles];

  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || reachable.has(file)) continue;
    reachable.add(file);
    const source = await readFile(path.join(distRoot, file), "utf8");
    for (const match of source.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+)["']/g)) {
      const dependency = path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1]!));
      expect(dependency, `${file} import`).toMatch(/\.js$/);
      pending.push(dependency);
    }
  }

  return reachable;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderBuiltSelect(select: typeof import("@starwind-ui/vue/select")) {
  return h(
    select.SelectRoot,
    { defaultValue: "apple", modal: false },
    {
      default: () => [
        h(select.SelectLabel, null, { default: () => "Fruit" }),
        h(select.SelectTrigger, null, {
          default: () => [
            h(select.SelectValue, { placeholder: "Choose fruit" }),
            h(select.SelectIcon, null, { default: () => "Open" }),
          ],
        }),
        h(
          select.SelectPortal,
          { disabled: true },
          {
            default: () =>
              h(
                select.SelectPositioner,
                { alignItemWithTrigger: false },
                {
                  default: () =>
                    h(select.SelectPopup, null, {
                      default: () => [
                        h(select.SelectScrollUpArrow),
                        h(select.SelectList, null, {
                          default: () => [
                            h(select.SelectGroup, null, {
                              default: () => [
                                h(select.SelectGroupLabel, null, { default: () => "Available" }),
                                h(
                                  select.SelectItem,
                                  { value: "apple" },
                                  {
                                    default: () => [
                                      h(select.SelectItemText, null, { default: () => "Apple" }),
                                      h(select.SelectItemIndicator),
                                    ],
                                  },
                                ),
                              ],
                            }),
                            h(select.SelectSeparator),
                          ],
                        }),
                        h(select.SelectScrollDownArrow),
                      ],
                    }),
                },
              ),
          },
        ),
      ],
    },
  );
}

function renderBuiltPopover(popover: typeof import("@starwind-ui/vue/popover")) {
  return h(
    popover.PopoverRoot,
    { defaultOpen: true },
    {
      default: () => [
        h(popover.PopoverTrigger, null, { default: () => "Open Popover" }),
        h(
          popover.PopoverPortal,
          { disabled: true },
          {
            default: () =>
              h(popover.PopoverViewport, null, {
                default: () => [
                  h(popover.PopoverBackdrop),
                  h(popover.PopoverPositioner, null, {
                    default: () =>
                      h(popover.PopoverPopup, null, {
                        default: () => [
                          h(popover.PopoverArrow),
                          h(popover.PopoverTitle, null, { default: () => "Popover" }),
                          h(popover.PopoverDescription, null, { default: () => "Details" }),
                          h(popover.PopoverClose, null, { default: () => "Close" }),
                        ],
                      }),
                  }),
                ],
              }),
          },
        ),
      ],
    },
  );
}
