export type VuePackageExportTarget = {
  import: `./dist/${string}.js`;
  types: `./dist/${string}.d.ts`;
};

export type VuePackageSubpath = {
  buildEntry: string;
  exportTarget: VuePackageExportTarget;
  source: string;
  subpath: "." | `./${string}`;
};

type VueRuntimePrimitiveInventoryEntry = {
  component: string;
  sourceFiles: readonly string[];
};

type VueManualFacadeInventoryEntry = {
  component: string;
  sourceFiles: readonly string[];
};

export type VueAdapterInventory = {
  manualFacades: readonly VueManualFacadeInventoryEntry[];
  packageSubpaths: readonly VuePackageSubpath[];
  runtimePrimitives: readonly VueRuntimePrimitiveInventoryEntry[];
  styledComponents: readonly string[];
};

function createComponentPackageSubpath(component: string): VuePackageSubpath {
  return {
    buildEntry: `${component}/index`,
    exportTarget: {
      import: `./dist/${component}/index.js`,
      types: `./dist/${component}/index.d.ts`,
    },
    source: `src/${component}/index.ts`,
    subpath: `./${component}`,
  };
}

export type VueInventoryDiagnostics = {
  packageExports: {
    conditionKeysMissing: string[];
    conditionKeysUnexpected: string[];
    extra: string[];
    mismatched: string[];
    missing: string[];
  };
  sourceFiles: {
    extra: string[];
    missing: string[];
  };
};

const vueRuntimePrimitives = [
  {
    component: "accordion",
    sourceFiles: [
      "accordion/AccordionHeader.vue",
      "accordion/AccordionItem.vue",
      "accordion/AccordionItemContext.ts",
      "accordion/AccordionPanel.vue",
      "accordion/AccordionRoot.vue",
      "accordion/AccordionTrigger.vue",
      "accordion/index.ts",
    ],
  },
  {
    component: "alert-dialog",
    sourceFiles: [
      "alert-dialog/AlertDialogBackdrop.vue",
      "alert-dialog/AlertDialogClose.vue",
      "alert-dialog/AlertDialogDescription.vue",
      "alert-dialog/AlertDialogPopup.vue",
      "alert-dialog/AlertDialogPortal.vue",
      "alert-dialog/AlertDialogRoot.vue",
      "alert-dialog/AlertDialogTitle.vue",
      "alert-dialog/AlertDialogTrigger.vue",
      "alert-dialog/AlertDialogViewport.vue",
      "alert-dialog/index.ts",
    ],
  },
  {
    component: "avatar",
    sourceFiles: [
      "avatar/AvatarFallback.vue",
      "avatar/AvatarImage.vue",
      "avatar/AvatarRoot.vue",
      "avatar/index.ts",
    ],
  },
  {
    component: "button",
    sourceFiles: ["button/ButtonRoot.vue", "button/index.ts"],
  },
  {
    component: "carousel",
    sourceFiles: [
      "carousel/CarouselContainer.vue",
      "carousel/CarouselItem.vue",
      "carousel/CarouselNext.vue",
      "carousel/CarouselPrevious.vue",
      "carousel/CarouselRoot.vue",
      "carousel/CarouselTypes.ts",
      "carousel/CarouselViewport.vue",
      "carousel/index.ts",
    ],
  },
  {
    component: "checkbox",
    sourceFiles: [
      "checkbox/CheckboxIndicator.vue",
      "checkbox/CheckboxRoot.vue",
      "checkbox/index.ts",
    ],
  },
  {
    component: "checkbox-group",
    sourceFiles: [
      "checkbox-group/CheckboxGroupContext.ts",
      "checkbox-group/CheckboxGroupRoot.vue",
      "checkbox-group/index.ts",
    ],
  },
  {
    component: "collapsible",
    sourceFiles: [
      "collapsible/CollapsiblePanel.vue",
      "collapsible/CollapsibleRoot.vue",
      "collapsible/CollapsibleTrigger.vue",
      "collapsible/index.ts",
    ],
  },
  {
    component: "color-picker",
    sourceFiles: [
      "color-picker/ColorPickerArea.vue",
      "color-picker/ColorPickerAreaBackground.vue",
      "color-picker/ColorPickerAreaInput.vue",
      "color-picker/ColorPickerAreaThumb.vue",
      "color-picker/ColorPickerChannelInput.vue",
      "color-picker/ColorPickerChannelSlider.vue",
      "color-picker/ColorPickerChannelSliderInput.vue",
      "color-picker/ColorPickerChannelSliderThumb.vue",
      "color-picker/ColorPickerChannelSliderTrack.vue",
      "color-picker/ColorPickerClear.vue",
      "color-picker/ColorPickerContext.ts",
      "color-picker/ColorPickerControl.vue",
      "color-picker/ColorPickerEyeDropperTrigger.vue",
      "color-picker/ColorPickerFormatControl.vue",
      "color-picker/ColorPickerFormatSelect.vue",
      "color-picker/ColorPickerHiddenInput.vue",
      "color-picker/ColorPickerLabel.vue",
      "color-picker/ColorPickerRoot.vue",
      "color-picker/ColorPickerSwatch.vue",
      "color-picker/ColorPickerSwatchGroup.vue",
      "color-picker/ColorPickerTransparencyGrid.vue",
      "color-picker/ColorPickerValueInput.vue",
      "color-picker/ColorPickerValueSwatch.vue",
      "color-picker/ColorPickerValueText.vue",
      "color-picker/index.ts",
    ],
  },
  {
    component: "combobox",
    sourceFiles: [
      "combobox/ComboboxClear.vue",
      "combobox/ComboboxEmpty.vue",
      "combobox/ComboboxGroup.vue",
      "combobox/ComboboxGroupLabel.vue",
      "combobox/ComboboxIcon.vue",
      "combobox/ComboboxInput.vue",
      "combobox/ComboboxInputGroup.vue",
      "combobox/ComboboxItem.vue",
      "combobox/ComboboxItemIndicator.vue",
      "combobox/ComboboxItemText.vue",
      "combobox/ComboboxLabel.vue",
      "combobox/ComboboxList.vue",
      "combobox/ComboboxPopup.vue",
      "combobox/ComboboxPortal.vue",
      "combobox/ComboboxPositioner.vue",
      "combobox/ComboboxRoot.vue",
      "combobox/ComboboxSeparator.vue",
      "combobox/ComboboxTrigger.vue",
      "combobox/ComboboxValue.vue",
      "combobox/index.ts",
    ],
  },
  {
    component: "context-menu",
    sourceFiles: [
      "context-menu/ContextMenuRoot.vue",
      "context-menu/ContextMenuTrigger.vue",
      "context-menu/index.ts",
    ],
  },
  {
    component: "dialog",
    sourceFiles: [
      "dialog/DialogBackdrop.vue",
      "dialog/DialogClose.vue",
      "dialog/DialogDescription.vue",
      "dialog/DialogPopup.vue",
      "dialog/DialogRoot.vue",
      "dialog/DialogTitle.vue",
      "dialog/DialogTrigger.vue",
      "dialog/index.ts",
    ],
  },
  {
    component: "drawer",
    sourceFiles: [
      "drawer/DrawerBackdrop.vue",
      "drawer/DrawerClose.vue",
      "drawer/DrawerDescription.vue",
      "drawer/DrawerPopup.vue",
      "drawer/DrawerPortal.vue",
      "drawer/DrawerRoot.vue",
      "drawer/DrawerTitle.vue",
      "drawer/DrawerTrigger.vue",
      "drawer/DrawerViewport.vue",
      "drawer/index.ts",
    ],
  },
  {
    component: "dropzone",
    sourceFiles: [
      "dropzone/DropzoneFilesList.vue",
      "dropzone/DropzoneInput.vue",
      "dropzone/DropzoneLoadingIndicator.vue",
      "dropzone/DropzoneRoot.vue",
      "dropzone/DropzoneUploadIndicator.vue",
      "dropzone/index.ts",
    ],
  },
  {
    component: "field",
    sourceFiles: [
      "field/FieldControl.vue",
      "field/FieldDescription.vue",
      "field/FieldError.vue",
      "field/FieldItem.vue",
      "field/FieldLabel.vue",
      "field/FieldRoot.vue",
      "field/FieldValidity.vue",
      "field/index.ts",
    ],
  },
  {
    component: "fieldset",
    sourceFiles: ["fieldset/FieldsetLegend.vue", "fieldset/FieldsetRoot.vue", "fieldset/index.ts"],
  },
  {
    component: "form",
    sourceFiles: ["form/FormErrorSummary.vue", "form/FormRoot.vue", "form/index.ts"],
  },
  {
    component: "input",
    sourceFiles: ["input/InputRoot.vue", "input/index.ts"],
  },
  {
    component: "input-otp",
    sourceFiles: [
      "input-otp/InputOtpGroup.vue",
      "input-otp/InputOtpRoot.vue",
      "input-otp/InputOtpSeparator.vue",
      "input-otp/InputOtpSlot.vue",
      "input-otp/index.ts",
    ],
  },
  {
    component: "menu",
    sourceFiles: [
      "menu/MenuCheckboxItem.vue",
      "menu/MenuCheckboxItemIndicator.vue",
      "menu/MenuContext.ts",
      "menu/MenuGroup.vue",
      "menu/MenuItem.vue",
      "menu/MenuLabel.vue",
      "menu/MenuLinkItem.vue",
      "menu/MenuPopup.vue",
      "menu/MenuPortal.vue",
      "menu/MenuPositioner.vue",
      "menu/MenuRadioGroup.vue",
      "menu/MenuRadioItem.vue",
      "menu/MenuRadioItemIndicator.vue",
      "menu/MenuRoot.vue",
      "menu/MenuSeparator.vue",
      "menu/MenuShortcut.vue",
      "menu/MenuSubmenuRoot.vue",
      "menu/MenuSubmenuTrigger.vue",
      "menu/MenuTrigger.vue",
      "menu/index.ts",
    ],
  },
  {
    component: "navigation-menu",
    sourceFiles: [
      "navigation-menu/NavigationMenuArrow.vue",
      "navigation-menu/NavigationMenuContent.vue",
      "navigation-menu/NavigationMenuIcon.vue",
      "navigation-menu/NavigationMenuItem.vue",
      "navigation-menu/NavigationMenuLink.vue",
      "navigation-menu/NavigationMenuList.vue",
      "navigation-menu/NavigationMenuPopup.vue",
      "navigation-menu/NavigationMenuPortal.vue",
      "navigation-menu/NavigationMenuPositioner.vue",
      "navigation-menu/NavigationMenuRoot.vue",
      "navigation-menu/NavigationMenuTrigger.vue",
      "navigation-menu/NavigationMenuViewport.vue",
      "navigation-menu/index.ts",
    ],
  },
  {
    component: "popover",
    sourceFiles: [
      "popover/PopoverArrow.vue",
      "popover/PopoverBackdrop.vue",
      "popover/PopoverClose.vue",
      "popover/PopoverDescription.vue",
      "popover/PopoverPopup.vue",
      "popover/PopoverPortal.vue",
      "popover/PopoverPositioner.vue",
      "popover/PopoverRoot.vue",
      "popover/PopoverTitle.vue",
      "popover/PopoverTrigger.vue",
      "popover/PopoverViewport.vue",
      "popover/index.ts",
    ],
  },
  {
    component: "preview-card",
    sourceFiles: [
      "preview-card/PreviewCardArrow.vue",
      "preview-card/PreviewCardBackdrop.vue",
      "preview-card/PreviewCardPopup.vue",
      "preview-card/PreviewCardPortal.vue",
      "preview-card/PreviewCardPositioner.vue",
      "preview-card/PreviewCardRoot.vue",
      "preview-card/PreviewCardTrigger.vue",
      "preview-card/PreviewCardViewport.vue",
      "preview-card/index.ts",
    ],
  },
  {
    component: "progress",
    sourceFiles: [
      "progress/ProgressIndicator.vue",
      "progress/ProgressLabel.vue",
      "progress/ProgressRoot.vue",
      "progress/ProgressTrack.vue",
      "progress/ProgressValue.vue",
      "progress/index.ts",
    ],
  },
  {
    component: "radio",
    sourceFiles: ["radio/RadioIndicator.vue", "radio/RadioRoot.vue", "radio/index.ts"],
  },
  {
    component: "radio-group",
    sourceFiles: [
      "radio-group/RadioGroupContext.ts",
      "radio-group/RadioGroupRoot.vue",
      "radio-group/index.ts",
    ],
  },
  {
    component: "scroll-area",
    sourceFiles: [
      "scroll-area/ScrollAreaContent.vue",
      "scroll-area/ScrollAreaCorner.vue",
      "scroll-area/ScrollAreaRoot.vue",
      "scroll-area/ScrollAreaScrollbar.vue",
      "scroll-area/ScrollAreaThumb.vue",
      "scroll-area/ScrollAreaViewport.vue",
      "scroll-area/index.ts",
    ],
  },
  {
    component: "select",
    sourceFiles: [
      "select/SelectGroup.vue",
      "select/SelectGroupLabel.vue",
      "select/SelectIcon.vue",
      "select/SelectItem.vue",
      "select/SelectItemIndicator.vue",
      "select/SelectItemText.vue",
      "select/SelectLabel.vue",
      "select/SelectList.vue",
      "select/SelectPopup.vue",
      "select/SelectPortal.vue",
      "select/SelectPositioner.vue",
      "select/SelectRoot.vue",
      "select/SelectScrollDownArrow.vue",
      "select/SelectScrollUpArrow.vue",
      "select/SelectSeparator.vue",
      "select/SelectTrigger.vue",
      "select/SelectValue.vue",
      "select/index.ts",
    ],
  },
  {
    component: "sidebar",
    sourceFiles: [
      "sidebar/Sidebar.vue",
      "sidebar/SidebarContext.ts",
      "sidebar/SidebarMenuButton.vue",
      "sidebar/SidebarProvider.vue",
      "sidebar/SidebarRail.vue",
      "sidebar/SidebarTrigger.vue",
      "sidebar/index.ts",
    ],
  },
  {
    component: "slider",
    sourceFiles: [
      "slider/SliderControl.vue",
      "slider/SliderIndicator.vue",
      "slider/SliderLabel.vue",
      "slider/SliderRoot.vue",
      "slider/SliderThumb.vue",
      "slider/SliderTrack.vue",
      "slider/index.ts",
    ],
  },
  {
    component: "switch",
    sourceFiles: ["switch/SwitchRoot.vue", "switch/SwitchThumb.vue", "switch/index.ts"],
  },
  {
    component: "tabs",
    sourceFiles: [
      "tabs/TabsContext.ts",
      "tabs/TabsIndicator.vue",
      "tabs/TabsList.vue",
      "tabs/TabsPanel.vue",
      "tabs/TabsRoot.vue",
      "tabs/TabsTab.vue",
      "tabs/index.ts",
    ],
  },
  {
    component: "toast",
    sourceFiles: [
      "toast/ToastAction.vue",
      "toast/ToastClose.vue",
      "toast/ToastContent.vue",
      "toast/ToastDescription.vue",
      "toast/ToastRoot.vue",
      "toast/ToastTemplate.vue",
      "toast/ToastTitle.vue",
      "toast/ToastTitleText.vue",
      "toast/ToastViewport.vue",
      "toast/index.ts",
    ],
  },
  {
    component: "toggle",
    sourceFiles: ["toggle/ToggleRoot.vue", "toggle/index.ts"],
  },
  {
    component: "toggle-group",
    sourceFiles: [
      "toggle-group/ToggleGroupContext.ts",
      "toggle-group/ToggleGroupRoot.vue",
      "toggle-group/index.ts",
    ],
  },
  {
    component: "tooltip",
    sourceFiles: [
      "tooltip/TooltipArrow.vue",
      "tooltip/TooltipPopup.vue",
      "tooltip/TooltipPortal.vue",
      "tooltip/TooltipPositioner.vue",
      "tooltip/TooltipRoot.vue",
      "tooltip/TooltipTrigger.vue",
      "tooltip/index.ts",
    ],
  },
] as const satisfies readonly VueRuntimePrimitiveInventoryEntry[];

const vueManualFacades = [
  { component: "theme", sourceFiles: ["theme/index.ts"] },
] as const satisfies readonly VueManualFacadeInventoryEntry[];

const vuePortableStyledComponents = [
  "accordion",
  "alert-dialog",
  "avatar",
  "button",
  "carousel",
  "checkbox",
  "checkbox-group",
  "collapsible",
  "combobox",
  "color-picker",
  "context-menu",
  "dialog",
  "dropzone",
  "dropdown",
  "field",
  "sheet",
  "form",
  "hover-card",
  "input",
  "input-otp",
  "navigation-menu",
  "popover",
  "progress",
  "radio-group",
  "scroll-area",
  "select",
  "separator",
  "sidebar",
  "slider",
  "switch",
  "tabs",
  "theme-toggle",
  "toast",
  "toggle",
  "toggle-group",
  "tooltip",
  "alert",
  "aspect-ratio",
  "badge",
  "breadcrumb",
  "button-group",
  "card",
  "input-group",
  "item",
  "kbd",
  "label",
  "native-select",
  "pagination",
  "prose",
  "skeleton",
  "spinner",
  "table",
  "textarea",
  "video",
] as const;

export const vueAdapterInventory = {
  runtimePrimitives: vueRuntimePrimitives,
  manualFacades: vueManualFacades,
  styledComponents: vuePortableStyledComponents,
  packageSubpaths: [
    {
      buildEntry: "index",
      exportTarget: { import: "./dist/index.js", types: "./dist/index.d.ts" },
      source: "src/index.ts",
      subpath: ".",
    },
    ...[...vueRuntimePrimitives, ...vueManualFacades].map(({ component }) =>
      createComponentPackageSubpath(component),
    ),
  ],
} as const satisfies VueAdapterInventory;

export const vueRuntimePrimitiveComponents = vueAdapterInventory.runtimePrimitives.map(
  ({ component }) => component,
);

export const vueManualPrimitiveComponents = vueAdapterInventory.manualFacades.map(
  ({ component }) => component,
);

export const vuePrimitiveComponents = [
  ...vueRuntimePrimitiveComponents,
  ...vueManualPrimitiveComponents,
] as const;

export const vueStyledComponents = [...vueAdapterInventory.styledComponents] as const;

export const vuePackageSubpaths = [...vueAdapterInventory.packageSubpaths] as const;

export const vuePackageExports = Object.fromEntries(
  vuePackageSubpaths.map(({ exportTarget, subpath }) => [subpath, exportTarget]),
) as Record<string, VuePackageExportTarget>;

export const vueBuildEntryPoints = Object.fromEntries(
  vuePackageSubpaths.map(({ buildEntry, source }) => [buildEntry, source]),
) as Record<string, string>;

export const vueGeneratedSourceFiles = [
  "_internal/as-child.ts",
  "_internal/portal.ts",
  "index.ts",
  ...vueAdapterInventory.runtimePrimitives.flatMap(({ sourceFiles }) => sourceFiles),
  ...vueAdapterInventory.manualFacades.flatMap(({ sourceFiles }) => sourceFiles),
].sort();

const vueStyledComponentSet: ReadonlySet<string> = new Set(vueStyledComponents);

export function isVueInventoryStyledComponent(component: string): boolean {
  return vueStyledComponentSet.has(component);
}

export function validateVueInventorySnapshot({
  packageExports,
  sourceFiles,
}: {
  packageExports: Record<string, unknown>;
  sourceFiles: readonly string[];
}): VueInventoryDiagnostics {
  const expectedExportNames = Object.keys(vuePackageExports);
  const actualExportNames = Object.keys(packageExports);
  const expectedSourceFiles = new Set(vueGeneratedSourceFiles);
  const actualSourceFiles = new Set(sourceFiles);

  const conditionKeysMissing: string[] = [];
  const conditionKeysUnexpected: string[] = [];
  const mismatched = expectedExportNames.flatMap((subpath) => {
    const expected = vuePackageExports[subpath];
    const actual = packageExports[subpath];
    if (!expected || !Object.hasOwn(packageExports, subpath)) return [];

    const actualTarget = isStringRecord(actual) ? actual : {};
    const expectedConditionKeys = Object.keys(expected) as Array<keyof VuePackageExportTarget>;
    const actualConditionKeys = Object.keys(actualTarget);
    conditionKeysMissing.push(
      ...expectedConditionKeys
        .filter((field) => !Object.hasOwn(actualTarget, field))
        .map((field) => `${subpath}: ${field}`),
    );
    conditionKeysUnexpected.push(
      ...actualConditionKeys
        .filter((field) => !Object.hasOwn(expected, field))
        .map((field) => `${subpath}: ${field}`),
    );

    return expectedConditionKeys.flatMap((field) => {
      if (!Object.hasOwn(actualTarget, field) || actualTarget[field] === expected[field]) return [];
      return [
        `${subpath} ${field}: expected ${JSON.stringify(expected[field])}, received ${JSON.stringify(actualTarget[field])}`,
      ];
    });
  });

  return {
    packageExports: {
      conditionKeysMissing: conditionKeysMissing.sort(),
      conditionKeysUnexpected: conditionKeysUnexpected.sort(),
      extra: actualExportNames.filter((name) => !Object.hasOwn(vuePackageExports, name)).sort(),
      mismatched: mismatched.sort(),
      missing: expectedExportNames.filter((name) => !Object.hasOwn(packageExports, name)).sort(),
    },
    sourceFiles: {
      extra: [...actualSourceFiles].filter((file) => !expectedSourceFiles.has(file)).sort(),
      missing: [...expectedSourceFiles].filter((file) => !actualSourceFiles.has(file)).sort(),
    },
  };
}

export function hasVueInventoryDiagnostics(diagnostics: VueInventoryDiagnostics): boolean {
  return (
    diagnostics.packageExports.extra.length > 0 ||
    diagnostics.packageExports.conditionKeysMissing.length > 0 ||
    diagnostics.packageExports.conditionKeysUnexpected.length > 0 ||
    diagnostics.packageExports.mismatched.length > 0 ||
    diagnostics.packageExports.missing.length > 0 ||
    diagnostics.sourceFiles.extra.length > 0 ||
    diagnostics.sourceFiles.missing.length > 0
  );
}

export function formatVueInventoryDiagnostics(diagnostics: VueInventoryDiagnostics): string {
  const lines = ["Vue adapter inventory drift detected:"];
  const entries: Array<[string, readonly string[]]> = [
    ["package exports missing", diagnostics.packageExports.missing],
    ["package exports extra", diagnostics.packageExports.extra],
    ["package export condition keys missing", diagnostics.packageExports.conditionKeysMissing],
    [
      "package export condition keys unexpected",
      diagnostics.packageExports.conditionKeysUnexpected,
    ],
    ["package export paths mismatched", diagnostics.packageExports.mismatched],
    ["generated source files missing", diagnostics.sourceFiles.missing],
    ["generated source files extra", diagnostics.sourceFiles.extra],
  ];
  for (const [label, values] of entries) {
    if (values.length > 0) lines.push(`- ${label}: ${values.join(", ")}`);
  }
  return lines.join("\n");
}

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function assertVueInventorySnapshot(
  snapshot: Parameters<typeof validateVueInventorySnapshot>[0],
): void {
  const diagnostics = validateVueInventorySnapshot(snapshot);
  if (hasVueInventoryDiagnostics(diagnostics)) {
    throw new Error(formatVueInventoryDiagnostics(diagnostics));
  }
}
