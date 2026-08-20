import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import * as VuePackage from "@starwind-ui/vue";
import * as AccordionPackage from "@starwind-ui/vue/accordion";
import * as AlertDialogPackage from "@starwind-ui/vue/alert-dialog";
import * as AvatarPackage from "@starwind-ui/vue/avatar";
import * as ButtonPackage from "@starwind-ui/vue/button";
import * as CarouselPackage from "@starwind-ui/vue/carousel";
import * as CheckboxPackage from "@starwind-ui/vue/checkbox";
import * as CheckboxGroupPackage from "@starwind-ui/vue/checkbox-group";
import * as CollapsiblePackage from "@starwind-ui/vue/collapsible";
import * as ColorPickerPackage from "@starwind-ui/vue/color-picker";
import * as ComboboxPackage from "@starwind-ui/vue/combobox";
import * as ContextMenuPackage from "@starwind-ui/vue/context-menu";
import * as DialogPackage from "@starwind-ui/vue/dialog";
import * as DrawerPackage from "@starwind-ui/vue/drawer";
import * as DropzonePackage from "@starwind-ui/vue/dropzone";
import * as FieldPackage from "@starwind-ui/vue/field";
import * as FieldsetPackage from "@starwind-ui/vue/fieldset";
import * as FormPackage from "@starwind-ui/vue/form";
import * as InputPackage from "@starwind-ui/vue/input";
import * as InputOtpPackage from "@starwind-ui/vue/input-otp";
import * as MenuPackage from "@starwind-ui/vue/menu";
import * as NavigationMenuPackage from "@starwind-ui/vue/navigation-menu";
import * as PopoverPackage from "@starwind-ui/vue/popover";
import * as PreviewCardPackage from "@starwind-ui/vue/preview-card";
import * as ProgressPackage from "@starwind-ui/vue/progress";
import * as RadioGroupPackage from "@starwind-ui/vue/radio-group";
import * as RadioPackage from "@starwind-ui/vue/radio";
import * as ScrollAreaPackage from "@starwind-ui/vue/scroll-area";
import * as SelectPackage from "@starwind-ui/vue/select";
import * as SidebarPackage from "@starwind-ui/vue/sidebar";
import * as SliderPackage from "@starwind-ui/vue/slider";
import * as SwitchPackage from "@starwind-ui/vue/switch";
import * as TabsPackage from "@starwind-ui/vue/tabs";
import * as ThemePackage from "@starwind-ui/vue/theme";
import * as ToastPackage from "@starwind-ui/vue/toast";
import * as TogglePackage from "@starwind-ui/vue/toggle";
import * as ToggleGroupPackage from "@starwind-ui/vue/toggle-group";
import * as TooltipPackage from "@starwind-ui/vue/tooltip";
import { colorPickerChildren } from "../color-picker/tree.js";
import {
  Accordion as StyledAccordion,
  AccordionContent as StyledAccordionContent,
  AccordionItem as StyledAccordionItem,
  AccordionTrigger as StyledAccordionTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/accordion";
import * as StyledAccordionPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/accordion";
import {
  AlertDialog as StyledAlertDialog,
  AlertDialogAction as StyledAlertDialogAction,
  AlertDialogCancel as StyledAlertDialogCancel,
  AlertDialogContent as StyledAlertDialogContent,
  AlertDialogDescription as StyledAlertDialogDescription,
  AlertDialogTitle as StyledAlertDialogTitle,
  AlertDialogTrigger as StyledAlertDialogTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/alert-dialog";
import * as StyledAlertDialogPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/alert-dialog";
import {
  Avatar as StyledAvatar,
  AvatarFallback as StyledAvatarFallback,
  AvatarImage as StyledAvatarImage,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/avatar";
import * as StyledAvatarPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/avatar";
import { Button as StyledButton } from "../../../../apps/vue-demo/src/components/starwind-runtime/button";
import { Checkbox as StyledCheckbox } from "../../../../apps/vue-demo/src/components/starwind-runtime/checkbox";
import { CheckboxGroup as StyledCheckboxGroup } from "../../../../apps/vue-demo/src/components/starwind-runtime/checkbox-group";
import * as StyledCheckboxGroupPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/checkbox-group";
import {
  Collapsible as StyledCollapsible,
  CollapsibleContent as StyledCollapsibleContent,
  CollapsibleTrigger as StyledCollapsibleTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/collapsible";
import * as StyledCollapsiblePackage from "../../../../apps/vue-demo/src/components/starwind-runtime/collapsible";
import * as StyledComboboxPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/combobox";
import * as StyledContextMenuPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/context-menu";
import {
  Dialog as StyledDialog,
  DialogContent as StyledDialogContent,
  DialogDescription as StyledDialogDescription,
  DialogTitle as StyledDialogTitle,
  DialogTrigger as StyledDialogTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/dialog";
import * as StyledDialogPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/dialog";
import { Dropzone as StyledDropzone } from "../../../../apps/vue-demo/src/components/starwind-runtime/dropzone";
import * as StyledDropzonePackage from "../../../../apps/vue-demo/src/components/starwind-runtime/dropzone";
import * as StyledDropdownPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/dropdown";
import {
  Field as StyledField,
  FieldContent as StyledFieldContent,
  FieldControl as StyledFieldControl,
  FieldDescription as StyledFieldDescription,
  FieldError as StyledFieldError,
  FieldGroup as StyledFieldGroup,
  FieldItem as StyledFieldItem,
  FieldLabel as StyledFieldLabel,
  FieldLegend as StyledFieldLegend,
  FieldSeparator as StyledFieldSeparator,
  FieldSet as StyledFieldSet,
  FieldTitle as StyledFieldTitle,
  FieldValidity as StyledFieldValidity,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/field";
import * as StyledFieldPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/field";
import {
  Popover as StyledPopover,
  PopoverContent as StyledPopoverContent,
  PopoverDescription as StyledPopoverDescription,
  PopoverHeader as StyledPopoverHeader,
  PopoverTitle as StyledPopoverTitle,
  PopoverTrigger as StyledPopoverTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/popover";
import * as StyledPopoverPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/popover";
import * as StyledSheetPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/sheet";
import {
  Form as StyledForm,
  FormErrorSummary as StyledFormErrorSummary,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/form";
import { Input as StyledInput } from "../../../../apps/vue-demo/src/components/starwind-runtime/input";
import {
  InputOtp as StyledInputOtp,
  InputOtpGroup as StyledInputOtpGroup,
  InputOtpSlot as StyledInputOtpSlot,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/input-otp";
import { InputOtpSeparator as StyledInputOtpSeparator } from "../../../../apps/vue-demo/src/components/starwind-runtime/input-otp";
import * as StyledInputOtpPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/input-otp";
import * as StyledHoverCardPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/hover-card";
import * as StyledNavigationMenuPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/navigation-menu";
import { Progress as StyledProgress } from "../../../../apps/vue-demo/src/components/starwind-runtime/progress";
import * as StyledProgressPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/progress";
import {
  RadioGroup as StyledRadioGroup,
  RadioGroupItem as StyledRadioGroupItem,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/radio-group";
import * as StyledRadioGroupPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/radio-group";
import {
  ScrollArea as StyledScrollArea,
  ScrollAreaContent as StyledScrollAreaContent,
  ScrollAreaCorner as StyledScrollAreaCorner,
  ScrollAreaThumb as StyledScrollAreaThumb,
  ScrollAreaViewport as StyledScrollAreaViewport,
  ScrollBar as StyledScrollBar,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/scroll-area";
import * as StyledScrollAreaPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/scroll-area";
import { Slider as StyledSlider } from "../../../../apps/vue-demo/src/components/starwind-runtime/slider";
import * as StyledSliderPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/slider";
import {
  Select as StyledSelect,
  SelectContent as StyledSelectContent,
  SelectGroup as StyledSelectGroup,
  SelectItem as StyledSelectItem,
  SelectItemIndicator as StyledSelectItemIndicator,
  SelectItemText as StyledSelectItemText,
  SelectLabel as StyledSelectLabel,
  SelectScrollDownButton as StyledSelectScrollDownButton,
  SelectScrollUpButton as StyledSelectScrollUpButton,
  SelectSeparator as StyledSelectSeparator,
  SelectTrigger as StyledSelectTrigger,
  SelectValue as StyledSelectValue,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/select";
import { Switch as StyledSwitch } from "../../../../apps/vue-demo/src/components/starwind-runtime/switch";
import {
  Tabs as StyledTabs,
  TabsContent as StyledTabsContent,
  TabsList as StyledTabsList,
  TabsTrigger as StyledTabsTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/tabs";
import * as StyledTabsPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/tabs";
import { ThemeToggle as StyledThemeToggle } from "../../../../apps/vue-demo/src/components/starwind-runtime/theme-toggle";
import * as StyledThemeTogglePackage from "../../../../apps/vue-demo/src/components/starwind-runtime/theme-toggle";
import { Toggle as StyledToggle } from "../../../../apps/vue-demo/src/components/starwind-runtime/toggle";
import {
  ToggleGroup as StyledToggleGroup,
  ToggleGroupItem as StyledToggleGroupItem,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/toggle-group";
import * as StyledToggleGroupPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/toggle-group";
import * as StyledTooltipPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/tooltip";

const EXPECTED_COMBOBOX_EXPORTS = [
  "Combobox",
  "ComboboxClear",
  "ComboboxContext",
  "ComboboxEmpty",
  "ComboboxGroup",
  "ComboboxGroupLabel",
  "ComboboxIcon",
  "ComboboxInput",
  "ComboboxInputGroup",
  "ComboboxItem",
  "ComboboxItemContext",
  "ComboboxItemIndicator",
  "ComboboxItemText",
  "ComboboxLabel",
  "ComboboxList",
  "ComboboxPopup",
  "ComboboxPortal",
  "ComboboxPositioner",
  "ComboboxRoot",
  "ComboboxSeparator",
  "ComboboxTrigger",
  "ComboboxValue",
  "default",
  "useComboboxContext",
  "useComboboxItemContext",
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
const EXPECTED_SIDEBAR_EXPORTS = [
  "Sidebar",
  "SidebarComponent",
  "SidebarContext",
  "SidebarMenuButton",
  "SidebarProvider",
  "SidebarRail",
  "SidebarTrigger",
  "default",
  "useSidebarContext",
].sort();
const EXPECTED_MENU_EXPORTS = [
  "Menu",
  "MenuCheckboxItem",
  "MenuCheckboxItemIndicator",
  "MenuGroup",
  "MenuItem",
  "MenuLabel",
  "MenuLinkItem",
  "MenuPopup",
  "MenuPortal",
  "MenuPositioner",
  "MenuRadioGroup",
  "MenuRadioItem",
  "MenuRadioItemIndicator",
  "MenuRoot",
  "MenuSeparator",
  "MenuShortcut",
  "MenuSubmenuRoot",
  "MenuSubmenuTrigger",
  "MenuTrigger",
  "default",
].sort();
const EXPECTED_CONTEXT_MENU_EXPORTS = [
  "ContextMenu",
  "ContextMenuCheckboxItem",
  "ContextMenuCheckboxItemIndicator",
  "ContextMenuGroup",
  "ContextMenuItem",
  "ContextMenuLabel",
  "ContextMenuLinkItem",
  "ContextMenuPopup",
  "ContextMenuPortal",
  "ContextMenuPositioner",
  "ContextMenuRadioGroup",
  "ContextMenuRadioItem",
  "ContextMenuRadioItemIndicator",
  "ContextMenuRoot",
  "ContextMenuSeparator",
  "ContextMenuShortcut",
  "ContextMenuSubmenuRoot",
  "ContextMenuSubmenuTrigger",
  "ContextMenuTrigger",
  "default",
].sort();
const EXPECTED_NAVIGATION_MENU_EXPORTS = [
  "NavigationMenu",
  "NavigationMenuArrow",
  "NavigationMenuContent",
  "NavigationMenuIcon",
  "NavigationMenuItem",
  "NavigationMenuLink",
  "NavigationMenuList",
  "NavigationMenuPopup",
  "NavigationMenuPortal",
  "NavigationMenuPositioner",
  "NavigationMenuRoot",
  "NavigationMenuTrigger",
  "NavigationMenuViewport",
  "default",
].sort();
const EXPECTED_ACCORDION_EXPORTS = [
  "Accordion",
  "AccordionHeader",
  "AccordionItem",
  "AccordionPanel",
  "AccordionRoot",
  "AccordionTrigger",
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
const EXPECTED_AVATAR_EXPORTS = [
  "Avatar",
  "AvatarFallback",
  "AvatarImage",
  "AvatarRoot",
  "default",
].sort();
const EXPECTED_BUTTON_EXPORTS = ["Button", "ButtonRoot", "default"].sort();
const EXPECTED_CAROUSEL_EXPORTS = [
  "Carousel",
  "CarouselContainer",
  "CarouselItem",
  "CarouselNext",
  "CarouselPrevious",
  "CarouselRoot",
  "CarouselViewport",
  "createCarousel",
  "default",
].sort();
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
const EXPECTED_COLOR_PICKER_EXPORTS = [
  "ColorPicker",
  "ColorPickerArea",
  "ColorPickerAreaBackground",
  "ColorPickerAreaInput",
  "ColorPickerAreaThumb",
  "ColorPickerChannelInput",
  "ColorPickerChannelSlider",
  "ColorPickerChannelSliderInput",
  "ColorPickerChannelSliderThumb",
  "ColorPickerChannelSliderTrack",
  "ColorPickerClear",
  "ColorPickerControl",
  "ColorPickerEyeDropperTrigger",
  "ColorPickerFormatControl",
  "ColorPickerFormatSelect",
  "ColorPickerHiddenInput",
  "ColorPickerLabel",
  "ColorPickerRoot",
  "ColorPickerSwatch",
  "ColorPickerSwatchGroup",
  "ColorPickerTransparencyGrid",
  "ColorPickerValueInput",
  "ColorPickerValueSwatch",
  "ColorPickerValueText",
  "createColorPickerInitialState",
  "default",
  "parseColor",
  "projectColorPickerInitialPart",
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
const EXPECTED_INPUT_EXPORTS = ["Input", "InputRoot", "default"].sort();
const EXPECTED_INPUT_OTP_EXPORTS = [
  "InputOtp",
  "InputOtpGroup",
  "InputOtpRoot",
  "InputOtpSeparator",
  "InputOtpSlot",
  "default",
].sort();
const EXPECTED_FIELDSET_EXPORTS = ["Fieldset", "FieldsetLegend", "FieldsetRoot", "default"].sort();
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
const EXPECTED_PREVIEW_CARD_EXPORTS = [
  "PreviewCard",
  "PreviewCardArrow",
  "PreviewCardBackdrop",
  "PreviewCardPopup",
  "PreviewCardPortal",
  "PreviewCardPositioner",
  "PreviewCardRoot",
  "PreviewCardTrigger",
  "PreviewCardViewport",
  "default",
].sort();
const EXPECTED_TOOLTIP_EXPORTS = [
  "Tooltip",
  "TooltipArrow",
  "TooltipPopup",
  "TooltipPortal",
  "TooltipPositioner",
  "TooltipRoot",
  "TooltipTrigger",
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
const EXPECTED_TOAST_EXPORTS = [
  "Toast",
  "ToastAction",
  "ToastClose",
  "ToastContent",
  "ToastDescription",
  "ToastRoot",
  "ToastTemplate",
  "ToastTitle",
  "ToastTitleText",
  "ToastViewport",
  "default",
  "toast",
].sort();
const EXPECTED_TOGGLE_EXPORTS = ["Toggle", "ToggleRoot", "default"].sort();
const EXPECTED_TOGGLE_GROUP_EXPORTS = [
  "ToggleGroup",
  "ToggleGroupContext",
  "ToggleGroupRoot",
  "default",
  "useToggleGroupContext",
].sort();
const EXPECTED_STYLED_ACCORDION_EXPORTS = [
  "Accordion",
  "AccordionContent",
  "AccordionItem",
  "AccordionTrigger",
  "AccordionVariants",
  "default",
].sort();
const EXPECTED_STYLED_DROPZONE_EXPORTS = [
  "Dropzone",
  "DropzoneFilesList",
  "DropzoneLoadingIndicator",
  "DropzoneUploadIndicator",
  "DropzoneVariants",
  "default",
].sort();
const EXPECTED_STYLED_FIELD_EXPORTS = [
  "Field",
  "FieldContent",
  "FieldControl",
  "FieldDescription",
  "FieldError",
  "FieldGroup",
  "FieldItem",
  "FieldLabel",
  "FieldLegend",
  "FieldSeparator",
  "FieldSet",
  "FieldTitle",
  "FieldValidity",
  "FieldVariants",
  "default",
].sort();
const EXPECTED_STYLED_INPUT_OTP_EXPORTS = [
  "InputOtp",
  "InputOtpGroup",
  "InputOtpSeparator",
  "InputOtpSlot",
  "InputOtpVariants",
  "REGEXP_ONLY_DIGITS",
  "REGEXP_ONLY_DIGITS_AND_CHARS",
  "default",
].sort();
const EXPECTED_STYLED_SLIDER_EXPORTS = ["Slider", "SliderVariants", "default"].sort();
const EXPECTED_STYLED_TABS_EXPORTS = [
  "Tabs",
  "TabsContent",
  "TabsList",
  "TabsTrigger",
  "TabsVariants",
  "default",
].sort();

describe("Vue source package and Styled SSR inventory", () => {
  it("exposes the exact source root and subpath values", () => {
    expect(Object.keys(AccordionPackage).sort()).toEqual(EXPECTED_ACCORDION_EXPORTS);
    expect(Object.keys(AlertDialogPackage).sort()).toEqual(EXPECTED_ALERT_DIALOG_EXPORTS);
    expect(Object.keys(AvatarPackage).sort()).toEqual(EXPECTED_AVATAR_EXPORTS);
    expect(Object.keys(ButtonPackage).sort()).toEqual(EXPECTED_BUTTON_EXPORTS);
    expect(Object.keys(CarouselPackage).sort()).toEqual(EXPECTED_CAROUSEL_EXPORTS);
    expect(Object.keys(CheckboxPackage).sort()).toEqual(EXPECTED_CHECKBOX_EXPORTS);
    expect(Object.keys(CheckboxGroupPackage).sort()).toEqual(EXPECTED_CHECKBOX_GROUP_EXPORTS);
    expect(Object.keys(CollapsiblePackage).sort()).toEqual(EXPECTED_COLLAPSIBLE_EXPORTS);
    expect(Object.keys(ColorPickerPackage).sort()).toEqual(EXPECTED_COLOR_PICKER_EXPORTS);
    expect(Object.keys(ComboboxPackage).sort()).toEqual(EXPECTED_COMBOBOX_EXPORTS);
    expect(Object.keys(ContextMenuPackage).sort()).toEqual(EXPECTED_CONTEXT_MENU_EXPORTS);
    expect(Object.keys(DialogPackage).sort()).toEqual(EXPECTED_DIALOG_EXPORTS);
    expect(Object.keys(DrawerPackage).sort()).toEqual(EXPECTED_DRAWER_EXPORTS);
    expect(Object.keys(DropzonePackage).sort()).toEqual(EXPECTED_DROPZONE_EXPORTS);
    expect(Object.keys(FieldPackage).sort()).toEqual(EXPECTED_FIELD_EXPORTS);
    expect(Object.keys(FieldsetPackage).sort()).toEqual(EXPECTED_FIELDSET_EXPORTS);
    expect(Object.keys(FormPackage).sort()).toEqual(EXPECTED_FORM_EXPORTS);
    expect(Object.keys(InputPackage).sort()).toEqual(EXPECTED_INPUT_EXPORTS);
    expect(Object.keys(InputOtpPackage).sort()).toEqual(EXPECTED_INPUT_OTP_EXPORTS);
    expect(Object.keys(MenuPackage).sort()).toEqual(EXPECTED_MENU_EXPORTS);
    expect(Object.keys(NavigationMenuPackage).sort()).toEqual(EXPECTED_NAVIGATION_MENU_EXPORTS);
    expect(Object.keys(PopoverPackage).sort()).toEqual(EXPECTED_POPOVER_EXPORTS);
    expect(Object.keys(PreviewCardPackage).sort()).toEqual(EXPECTED_PREVIEW_CARD_EXPORTS);
    expect(Object.keys(ProgressPackage).sort()).toEqual(EXPECTED_PROGRESS_EXPORTS);
    expect(Object.keys(RadioPackage).sort()).toEqual(EXPECTED_RADIO_EXPORTS);
    expect(Object.keys(RadioGroupPackage).sort()).toEqual(EXPECTED_RADIO_GROUP_EXPORTS);
    expect(Object.keys(ScrollAreaPackage).sort()).toEqual(EXPECTED_SCROLL_AREA_EXPORTS);
    expect(Object.keys(SelectPackage).sort()).toEqual(EXPECTED_SELECT_EXPORTS);
    expect(Object.keys(SidebarPackage).sort()).toEqual(EXPECTED_SIDEBAR_EXPORTS);
    expect(Object.keys(SliderPackage).sort()).toEqual(EXPECTED_SLIDER_EXPORTS);
    expect(Object.keys(SwitchPackage).sort()).toEqual(EXPECTED_SWITCH_EXPORTS);
    expect(Object.keys(TabsPackage).sort()).toEqual(EXPECTED_TABS_EXPORTS);
    expect(Object.keys(ToastPackage).sort()).toEqual(EXPECTED_TOAST_EXPORTS);
    expect(Object.keys(TogglePackage).sort()).toEqual(EXPECTED_TOGGLE_EXPORTS);
    expect(Object.keys(ToggleGroupPackage).sort()).toEqual(EXPECTED_TOGGLE_GROUP_EXPORTS);
    expect(Object.keys(TooltipPackage).sort()).toEqual(EXPECTED_TOOLTIP_EXPORTS);
    expect(Object.keys(ThemePackage).sort()).toEqual(["getThemeInitScript", "initThemeController"]);
    expect(Object.keys(VuePackage).sort()).toEqual(
      [
        ...new Set([
          ...EXPECTED_AVATAR_EXPORTS,
          ...EXPECTED_ACCORDION_EXPORTS,
          ...EXPECTED_ALERT_DIALOG_EXPORTS,
          ...EXPECTED_BUTTON_EXPORTS,
          ...EXPECTED_CAROUSEL_EXPORTS,
          ...EXPECTED_CHECKBOX_EXPORTS,
          ...EXPECTED_CHECKBOX_GROUP_EXPORTS,
          ...EXPECTED_COLLAPSIBLE_EXPORTS,
          ...EXPECTED_COLOR_PICKER_EXPORTS,
          ...EXPECTED_COMBOBOX_EXPORTS,
          ...EXPECTED_CONTEXT_MENU_EXPORTS,
          ...EXPECTED_DIALOG_EXPORTS,
          ...EXPECTED_DRAWER_EXPORTS,
          ...EXPECTED_DROPZONE_EXPORTS,
          ...EXPECTED_FIELD_EXPORTS,
          ...EXPECTED_FIELDSET_EXPORTS,
          ...EXPECTED_FORM_EXPORTS,
          ...EXPECTED_INPUT_EXPORTS,
          ...EXPECTED_INPUT_OTP_EXPORTS,
          ...EXPECTED_MENU_EXPORTS,
          ...EXPECTED_NAVIGATION_MENU_EXPORTS,
          ...EXPECTED_POPOVER_EXPORTS,
          ...EXPECTED_PREVIEW_CARD_EXPORTS,
          ...EXPECTED_PROGRESS_EXPORTS,
          ...EXPECTED_RADIO_EXPORTS,
          ...EXPECTED_RADIO_GROUP_EXPORTS,
          ...EXPECTED_SCROLL_AREA_EXPORTS,
          ...EXPECTED_SELECT_EXPORTS,
          ...EXPECTED_SIDEBAR_EXPORTS,
          ...EXPECTED_SLIDER_EXPORTS,
          ...EXPECTED_SWITCH_EXPORTS,
          ...EXPECTED_TABS_EXPORTS,
          ...EXPECTED_TOAST_EXPORTS,
          ...EXPECTED_TOGGLE_EXPORTS,
          ...EXPECTED_TOGGLE_GROUP_EXPORTS,
          ...EXPECTED_TOOLTIP_EXPORTS,
          "getThemeInitScript",
          "initThemeController",
        ]),
      ]
        .filter((name) => name !== "default")
        .sort(),
    );
  });

  it("server-renders every Primitive component in valid public trees without browser globals", async () => {
    expect(globalThis).not.toHaveProperty("document");
    expect(globalThis).not.toHaveProperty("window");

    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h("main", null, [
              h(AccordionPackage.AccordionRoot, { defaultValue: "alpha" }, () =>
                h(AccordionPackage.AccordionItem, { value: "alpha" }, () => [
                  h(AccordionPackage.AccordionHeader, null, () =>
                    h(AccordionPackage.AccordionTrigger, null, () => "Alpha"),
                  ),
                  h(AccordionPackage.AccordionPanel, null, () => "Alpha content"),
                ]),
              ),
              h(CarouselPackage.CarouselRoot, { opts: { loop: true } }, () => [
                h(CarouselPackage.CarouselViewport, null, () =>
                  h(CarouselPackage.CarouselContainer, null, () => [
                    h(CarouselPackage.CarouselItem, null, () => "One"),
                    h(CarouselPackage.CarouselItem, null, () => "Two"),
                  ]),
                ),
                h(CarouselPackage.CarouselPrevious, null, () => "Previous"),
                h(CarouselPackage.CarouselNext, null, () => "Next"),
              ]),
              h(
                AvatarPackage.AvatarRoot,
                { id: "ssr-primitive-avatar" },
                {
                  default: () => [
                    h(AvatarPackage.AvatarImage, { alt: "Profile", src: "/avatar.png" }),
                    h(AvatarPackage.AvatarFallback, { delay: 100 }, { default: () => "AB" }),
                  ],
                },
              ),
              h(
                ButtonPackage.ButtonRoot,
                { id: "ssr-primitive-button" },
                { default: () => "Save" },
              ),
              h(
                CheckboxPackage.CheckboxRoot,
                { defaultChecked: true, name: "terms", value: "yes" },
                {
                  default: () =>
                    h(
                      CheckboxPackage.CheckboxIndicator,
                      { keepMounted: true },
                      { default: () => "Checked" },
                    ),
                },
              ),
              h(
                CheckboxGroupPackage.CheckboxGroupRoot,
                { defaultValue: ["grouped"] },
                {
                  default: () => h(CheckboxPackage.CheckboxRoot, { value: "grouped" }),
                },
              ),
              h(
                CollapsiblePackage.CollapsibleRoot,
                { defaultOpen: true },
                {
                  default: () => [
                    h(CollapsiblePackage.CollapsibleTrigger, null, { default: () => "Details" }),
                    h(CollapsiblePackage.CollapsiblePanel, null, { default: () => "Content" }),
                  ],
                },
              ),
              h(
                ColorPickerPackage.ColorPickerRoot,
                { defaultValue: "#336699", name: "accent" },
                colorPickerChildren,
              ),
              h(DialogPackage.DialogRoot, null, {
                default: () => [
                  h(DialogPackage.DialogTrigger, null, { default: () => "Open" }),
                  h(DialogPackage.DialogBackdrop),
                  h(DialogPackage.DialogPopup, null, {
                    default: () => [
                      h(DialogPackage.DialogTitle, null, { default: () => "Title" }),
                      h(DialogPackage.DialogDescription, null, {
                        default: () => "Description",
                      }),
                      h(DialogPackage.DialogClose, null, { default: () => "Close" }),
                    ],
                  }),
                ],
              }),
              h(AlertDialogPackage.AlertDialogRoot, null, {
                default: () => [
                  h(AlertDialogPackage.AlertDialogTrigger, null, { default: () => "Delete" }),
                  h(
                    AlertDialogPackage.AlertDialogPortal,
                    { disabled: true },
                    {
                      default: () =>
                        h(AlertDialogPackage.AlertDialogViewport, null, {
                          default: () => [
                            h(AlertDialogPackage.AlertDialogBackdrop),
                            h(AlertDialogPackage.AlertDialogPopup, null, {
                              default: () => [
                                h(AlertDialogPackage.AlertDialogTitle, null, {
                                  default: () => "Confirm",
                                }),
                                h(AlertDialogPackage.AlertDialogDescription, null, {
                                  default: () => "Cannot undo",
                                }),
                                h(AlertDialogPackage.AlertDialogClose, null, {
                                  default: () => "Cancel",
                                }),
                              ],
                            }),
                          ],
                        }),
                    },
                  ),
                ],
              }),
              h(InputPackage.InputRoot, { defaultValue: "query", name: "query" }),
              h(FieldPackage.FieldRoot, { name: "profile" }, () => [
                h(FieldPackage.FieldLabel, null, () => "Profile"),
                h(FieldPackage.FieldControl, { defaultValue: "Ada", required: true }),
                h(FieldPackage.FieldDescription, null, () => "Public name"),
                h(FieldPackage.FieldItem, null, () => "Input row"),
                h(FieldPackage.FieldError, { match: "valueMissing" }, () => "Required"),
                h(FieldPackage.FieldValidity, { match: "valid" }, () => "Ready"),
              ]),
              h(DropzonePackage.DropzoneRoot, null, () => [
                h(DropzonePackage.DropzoneUploadIndicator),
                h(DropzonePackage.DropzoneLoadingIndicator),
                h(DropzonePackage.DropzoneFilesList),
                h(DropzonePackage.DropzoneInput, { name: "files" }),
              ]),
              h(InputOtpPackage.InputOtpRoot, { defaultValue: "123456", name: "otp" }, () =>
                h(InputOtpPackage.InputOtpGroup, null, () => [
                  ...Array.from({ length: 3 }, (_, index) =>
                    h(InputOtpPackage.InputOtpSlot, { index, key: index }),
                  ),
                  h(InputOtpPackage.InputOtpSeparator),
                  ...Array.from({ length: 3 }, (_, offset) =>
                    h(InputOtpPackage.InputOtpSlot, { index: offset + 3, key: offset + 3 }),
                  ),
                ]),
              ),
              renderPrimitiveCombobox(),
              renderPrimitiveMenu(),
              renderPrimitiveContextMenu(),
              renderPrimitiveNavigationMenu(),
              h(FieldsetPackage.FieldsetRoot, null, {
                default: () => [
                  h(FieldsetPackage.FieldsetLegend, null, { default: () => "Details" }),
                  h(InputPackage.InputRoot, { name: "grouped" }),
                ],
              }),
              h(FormPackage.FormRoot, null, { default: () => h(FormPackage.FormErrorSummary) }),
              renderPrimitivePopover(),
              renderPrimitivePreviewCard(),
              renderPrimitiveTooltip(),
              renderPrimitiveProgress(),
              h(
                RadioGroupPackage.RadioGroupRoot,
                { defaultValue: "alpha", name: "primitive-radio" },
                {
                  default: () => [
                    h(
                      RadioPackage.RadioRoot,
                      { value: "alpha" },
                      { default: () => h(RadioPackage.RadioIndicator) },
                    ),
                    h(RadioPackage.RadioRoot, { value: "beta" }),
                  ],
                },
              ),
              renderPrimitiveScrollArea(),
              renderPrimitiveSelect(),
              h(SidebarPackage.SidebarProvider, { defaultOpen: false }, () => [
                h(SidebarPackage.SidebarComponent, { collapsible: "icon" }, () => "Sidebar"),
                h(SidebarPackage.SidebarTrigger, null, () => "Toggle"),
                h(SidebarPackage.SidebarRail),
                h(SidebarPackage.SidebarMenuButton, null, () => "Menu"),
              ]),
              h(SliderPackage.SliderRoot, { defaultValue: [20, 80], name: "price" }, () => [
                h(SliderPackage.SliderLabel, null, () => "Price"),
                h(SliderPackage.SliderControl, null, () => [
                  h(SliderPackage.SliderTrack, null, () => h(SliderPackage.SliderIndicator)),
                  h(SliderPackage.SliderThumb, { index: 0 }),
                  h(SliderPackage.SliderThumb, { index: 1 }),
                ]),
              ]),
              h(
                SwitchPackage.SwitchRoot,
                { defaultChecked: true, name: "notifications", value: "yes" },
                { default: () => h(SwitchPackage.SwitchThumb) },
              ),
              h(TabsPackage.TabsRoot, { defaultValue: "account" }, () => [
                h(TabsPackage.TabsList, null, () => [
                  h(TabsPackage.TabsTab, { value: "account" }, () => "Account"),
                  h(TabsPackage.TabsIndicator),
                ]),
                h(TabsPackage.TabsPanel, { value: "account" }, () => "Account content"),
              ]),
              h(
                TogglePackage.ToggleRoot,
                { defaultPressed: true, syncGroup: "ssr-toggles" },
                { default: () => "Pinned" },
              ),
              h(
                ToggleGroupPackage.ToggleGroupRoot,
                { defaultValue: ["bold"] },
                {
                  default: () => [
                    h(TogglePackage.ToggleRoot, { value: "bold" }),
                    h(TogglePackage.ToggleRoot, { value: "italic" }),
                  ],
                },
              ),
            ]),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    for (const part of [
      "avatar",
      "accordion",
      "accordion-item",
      "accordion-header",
      "accordion-trigger",
      "accordion-content",
      "alert-dialog",
      "alert-dialog-trigger",
      "alert-dialog-portal",
      "alert-dialog-viewport",
      "alert-dialog-backdrop",
      "alert-dialog-popup",
      "alert-dialog-title",
      "alert-dialog-description",
      "alert-dialog-close",
      "avatar-image",
      "avatar-fallback",
      "button",
      "checkbox",
      "checkbox-group",
      "checkbox-indicator",
      "collapsible",
      "collapsible-trigger",
      "collapsible-panel",
      "color-picker",
      "color-picker-label",
      "color-picker-control",
      "color-picker-value-input",
      "color-picker-value-swatch",
      "color-picker-value-text",
      "color-picker-area",
      "color-picker-area-background",
      "color-picker-area-thumb",
      "color-picker-area-input",
      "color-picker-channel-slider",
      "color-picker-channel-slider-track",
      "color-picker-channel-slider-thumb",
      "color-picker-channel-input",
      "color-picker-channel-field",
      "color-picker-format-select",
      "color-picker-format-control",
      "color-picker-swatch-group",
      "color-picker-swatch",
      "color-picker-eye-dropper",
      "color-picker-clear",
      "color-picker-hidden-input",
      "dialog",
      "dialog-trigger",
      "dialog-overlay",
      "dialog-content",
      "dialog-title",
      "dialog-description",
      "dialog-close",
      "input",
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
      "input-otp-slot",
      "combobox",
      "combobox-label",
      "combobox-input-group",
      "combobox-input",
      "combobox-trigger",
      "combobox-icon",
      "combobox-clear",
      "combobox-value",
      "combobox-portal",
      "combobox-positioner",
      "combobox-popup",
      "combobox-empty",
      "combobox-list",
      "combobox-group",
      "combobox-group-label",
      "combobox-item",
      "combobox-item-text",
      "combobox-item-indicator",
      "combobox-separator",
      "menu",
      "menu-trigger",
      "menu-portal",
      "menu-positioner",
      "menu-popup",
      "menu-item",
      "menu-link-item",
      "menu-checkbox-item",
      "menu-checkbox-item-indicator",
      "menu-radio-group",
      "menu-radio-item",
      "menu-radio-item-indicator",
      "menu-group",
      "menu-label",
      "menu-separator",
      "menu-shortcut",
      "menu-submenu-root",
      "menu-submenu-trigger",
      "context-menu",
      "context-menu-trigger",
      "nav-menu",
      "nav-menu-list",
      "nav-menu-item",
      "nav-menu-trigger",
      "nav-menu-icon",
      "nav-menu-content",
      "nav-menu-link",
      "nav-menu-portal",
      "nav-menu-positioner",
      "nav-menu-popup",
      "nav-menu-viewport",
      "nav-menu-arrow",
      "fieldset",
      "fieldset-legend",
      "form",
      "form-error-summary",
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
      "sidebar-provider",
      "sidebar",
      "sidebar-trigger",
      "sidebar-rail",
      "sidebar-menu-button",
      "slider",
      "slider-label",
      "slider-control",
      "slider-track",
      "slider-indicator",
      "slider-thumb",
      "switch",
      "switch-thumb",
      "tabs",
      "tabs-list",
      "tabs-tab",
      "tabs-indicator",
      "tabs-panel",
      "toggle",
      "toggle-group",
    ]) {
      expect(first, part).toContain(`data-sw-${part}`);
    }
    expectComponentMarkerCoverage(
      first,
      EXPECTED_ACCORDION_EXPORTS,
      ["Accordion", "default"],
      {
        AccordionHeader: "accordion-header",
        AccordionItem: "accordion-item",
        AccordionPanel: "accordion-content",
        AccordionRoot: "accordion",
        AccordionTrigger: "accordion-trigger",
      },
      "data-sw-",
    );
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
      "data-sw-",
    );
    expectComponentMarkerCoverage(
      first,
      EXPECTED_FIELD_EXPORTS,
      ["Field", "default"],
      {
        FieldControl: "field-control",
        FieldDescription: "field-description",
        FieldError: "field-error",
        FieldItem: "field-item",
        FieldLabel: "field-label",
        FieldRoot: "field",
        FieldValidity: "field-validity",
      },
      "data-sw-",
    );
    expectComponentMarkerCoverage(
      first,
      EXPECTED_SIDEBAR_EXPORTS,
      ["Sidebar", "SidebarContext", "default", "useSidebarContext"],
      {
        SidebarComponent: "sidebar",
        SidebarMenuButton: "sidebar-menu-button",
        SidebarProvider: "sidebar-provider",
        SidebarRail: "sidebar-rail",
        SidebarTrigger: "sidebar-trigger",
      },
      "data-sw-",
    );
    expectComponentMarkerCoverage(
      first,
      EXPECTED_COLOR_PICKER_EXPORTS,
      [
        "ColorPicker",
        "createColorPickerInitialState",
        "default",
        "parseColor",
        "projectColorPickerInitialPart",
      ],
      {
        ColorPickerArea: "color-picker-area",
        ColorPickerAreaBackground: "color-picker-area-background",
        ColorPickerAreaInput: "color-picker-area-input",
        ColorPickerAreaThumb: "color-picker-area-thumb",
        ColorPickerChannelInput: "color-picker-channel-field",
        ColorPickerChannelSlider: "color-picker-channel-slider",
        ColorPickerChannelSliderInput: "color-picker-channel-input",
        ColorPickerChannelSliderThumb: "color-picker-channel-slider-thumb",
        ColorPickerChannelSliderTrack: "color-picker-channel-slider-track",
        ColorPickerClear: "color-picker-clear",
        ColorPickerControl: "color-picker-control",
        ColorPickerEyeDropperTrigger: "color-picker-eye-dropper",
        ColorPickerFormatControl: "color-picker-format-control",
        ColorPickerFormatSelect: "color-picker-format-select",
        ColorPickerHiddenInput: "color-picker-hidden-input",
        ColorPickerLabel: "color-picker-label",
        ColorPickerRoot: "color-picker",
        ColorPickerSwatch: "color-picker-swatch",
        ColorPickerSwatchGroup: "color-picker-swatch-group",
        ColorPickerTransparencyGrid: "color-picker-transparency-grid",
        ColorPickerValueInput: "color-picker-value-input",
        ColorPickerValueSwatch: "color-picker-value-swatch",
        ColorPickerValueText: "color-picker-value-text",
      },
      "data-sw-",
    );
    expectComponentMarkerCoverage(
      first,
      EXPECTED_SLIDER_EXPORTS,
      ["Slider", "default"],
      {
        SliderControl: "slider-control",
        SliderIndicator: "slider-indicator",
        SliderLabel: "slider-label",
        SliderRoot: "slider",
        SliderThumb: "slider-thumb",
        SliderTrack: "slider-track",
      },
      "data-sw-",
    );
    expectComponentMarkerCoverage(
      first,
      EXPECTED_CAROUSEL_EXPORTS,
      ["Carousel", "createCarousel", "default"],
      {
        CarouselContainer: "carousel-container",
        CarouselItem: "carousel-item",
        CarouselNext: "carousel-next",
        CarouselPrevious: "carousel-previous",
        CarouselRoot: "carousel",
        CarouselViewport: "carousel-viewport",
      },
      "data-sw-",
    );
    expectComponentMarkerCoverage(
      first,
      EXPECTED_INPUT_OTP_EXPORTS,
      ["InputOtp", "default"],
      {
        InputOtpGroup: "input-otp-group",
        InputOtpRoot: "input-otp",
        InputOtpSeparator: "input-otp-separator",
        InputOtpSlot: "input-otp-slot",
      },
      "data-sw-",
    );
    expectComponentMarkerCoverage(
      first,
      EXPECTED_DROPZONE_EXPORTS,
      ["Dropzone", "default"],
      {
        DropzoneFilesList: "dropzone-files-list",
        DropzoneInput: "dropzone-input",
        DropzoneLoadingIndicator: "dropzone-loading-indicator",
        DropzoneRoot: "dropzone",
        DropzoneUploadIndicator: "dropzone-upload-indicator",
      },
      "data-sw-",
    );
    expectComponentMarkerCoverage(
      first,
      EXPECTED_COMBOBOX_EXPORTS,
      [
        "Combobox",
        "ComboboxContext",
        "ComboboxItemContext",
        "default",
        "useComboboxContext",
        "useComboboxItemContext",
      ],
      {
        ComboboxClear: "combobox-clear",
        ComboboxEmpty: "combobox-empty",
        ComboboxGroup: "combobox-group",
        ComboboxGroupLabel: "combobox-group-label",
        ComboboxIcon: "combobox-icon",
        ComboboxInput: "combobox-input",
        ComboboxInputGroup: "combobox-input-group",
        ComboboxItem: "combobox-item",
        ComboboxItemIndicator: "combobox-item-indicator",
        ComboboxItemText: "combobox-item-text",
        ComboboxLabel: "combobox-label",
        ComboboxList: "combobox-list",
        ComboboxPopup: "combobox-popup",
        ComboboxPortal: "combobox-portal",
        ComboboxPositioner: "combobox-positioner",
        ComboboxRoot: "combobox",
        ComboboxSeparator: "combobox-separator",
        ComboboxTrigger: "combobox-trigger",
        ComboboxValue: "combobox-value",
      },
      "data-sw-",
    );
    expectComponentMarkerCoverage(
      first,
      EXPECTED_MENU_EXPORTS,
      ["Menu", "default"],
      {
        MenuCheckboxItem: "menu-checkbox-item",
        MenuCheckboxItemIndicator: "menu-checkbox-item-indicator",
        MenuGroup: "menu-group",
        MenuItem: "menu-item",
        MenuLabel: "menu-label",
        MenuLinkItem: "menu-link-item",
        MenuPopup: "menu-popup",
        MenuPortal: "menu-portal",
        MenuPositioner: "menu-positioner",
        MenuRadioGroup: "menu-radio-group",
        MenuRadioItem: "menu-radio-item",
        MenuRadioItemIndicator: "menu-radio-item-indicator",
        MenuRoot: "menu",
        MenuSeparator: "menu-separator",
        MenuShortcut: "menu-shortcut",
        MenuSubmenuRoot: "menu-submenu-root",
        MenuSubmenuTrigger: "menu-submenu-trigger",
        MenuTrigger: "menu-trigger",
      },
      "data-sw-",
    );
    expectComponentMarkerCoverage(
      first,
      EXPECTED_CONTEXT_MENU_EXPORTS,
      ["ContextMenu", "default"],
      {
        ContextMenuCheckboxItem: "menu-checkbox-item",
        ContextMenuCheckboxItemIndicator: "menu-checkbox-item-indicator",
        ContextMenuGroup: "menu-group",
        ContextMenuItem: "menu-item",
        ContextMenuLabel: "menu-label",
        ContextMenuLinkItem: "menu-link-item",
        ContextMenuPopup: "menu-popup",
        ContextMenuPortal: "menu-portal",
        ContextMenuPositioner: "menu-positioner",
        ContextMenuRadioGroup: "menu-radio-group",
        ContextMenuRadioItem: "menu-radio-item",
        ContextMenuRadioItemIndicator: "menu-radio-item-indicator",
        ContextMenuRoot: "context-menu",
        ContextMenuSeparator: "menu-separator",
        ContextMenuShortcut: "menu-shortcut",
        ContextMenuSubmenuRoot: "menu-submenu-root",
        ContextMenuSubmenuTrigger: "menu-submenu-trigger",
        ContextMenuTrigger: "context-menu-trigger",
      },
      "data-sw-",
    );
    expectComponentMarkerCoverage(
      first,
      EXPECTED_NAVIGATION_MENU_EXPORTS,
      ["NavigationMenu", "default"],
      {
        NavigationMenuArrow: "nav-menu-arrow",
        NavigationMenuContent: "nav-menu-content",
        NavigationMenuIcon: "nav-menu-icon",
        NavigationMenuItem: "nav-menu-item",
        NavigationMenuLink: "nav-menu-link",
        NavigationMenuList: "nav-menu-list",
        NavigationMenuPopup: "nav-menu-popup",
        NavigationMenuPortal: "nav-menu-portal",
        NavigationMenuPositioner: "nav-menu-positioner",
        NavigationMenuRoot: "nav-menu",
        NavigationMenuTrigger: "nav-menu-trigger",
        NavigationMenuViewport: "nav-menu-viewport",
      },
      "data-sw-",
    );
  });

  it("server-renders every generated Styled component with its data-slot contract", async () => {
    expect(Object.keys(StyledAccordionPackage).sort()).toEqual(EXPECTED_STYLED_ACCORDION_EXPORTS);
    expect(Object.keys(StyledAlertDialogPackage).sort()).toEqual([
      "AlertDialog",
      "AlertDialogAction",
      "AlertDialogCancel",
      "AlertDialogContent",
      "AlertDialogDescription",
      "AlertDialogFooter",
      "AlertDialogHeader",
      "AlertDialogTitle",
      "AlertDialogTrigger",
      "AlertDialogVariants",
      "default",
    ]);
    expect(Object.keys(StyledAvatarPackage).sort()).toEqual([
      "Avatar",
      "AvatarFallback",
      "AvatarImage",
      "AvatarVariants",
      "default",
    ]);
    expect(Object.keys(StyledProgressPackage).sort()).toEqual([
      "Progress",
      "ProgressVariants",
      "default",
    ]);
    expect(Object.keys(StyledRadioGroupPackage).sort()).toEqual([
      "RadioGroup",
      "RadioGroupItem",
      "RadioGroupVariants",
      "default",
    ]);
    expect(Object.keys(StyledCheckboxGroupPackage).sort()).toEqual([
      "CheckboxGroup",
      "CheckboxGroupVariants",
      "default",
    ]);
    expect(Object.keys(StyledCollapsiblePackage).sort()).toEqual([
      "Collapsible",
      "CollapsibleContent",
      "CollapsibleTrigger",
      "CollapsibleVariants",
      "default",
    ]);
    expect(Object.keys(StyledComboboxPackage).sort()).toEqual([
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
      "ComboboxVariants",
      "default",
    ]);
    expect(Object.keys(StyledContextMenuPackage).sort()).toEqual([
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
      "ContextMenuVariants",
      "default",
    ]);
    expect(Object.keys(StyledDialogPackage).sort()).toEqual([
      "Dialog",
      "DialogClose",
      "DialogContent",
      "DialogDescription",
      "DialogFooter",
      "DialogHeader",
      "DialogTitle",
      "DialogTrigger",
      "DialogVariants",
      "default",
    ]);
    expect(Object.keys(StyledDropzonePackage).sort()).toEqual(EXPECTED_STYLED_DROPZONE_EXPORTS);
    expect(Object.keys(StyledDropdownPackage).sort()).toEqual([
      "Dropdown",
      "DropdownCheckboxItem",
      "DropdownCheckboxItemIndicator",
      "DropdownContent",
      "DropdownGroup",
      "DropdownItem",
      "DropdownLabel",
      "DropdownLinkItem",
      "DropdownRadioGroup",
      "DropdownRadioItem",
      "DropdownRadioItemIndicator",
      "DropdownSeparator",
      "DropdownShortcut",
      "DropdownSub",
      "DropdownSubContent",
      "DropdownSubTrigger",
      "DropdownTrigger",
      "DropdownVariants",
      "default",
    ]);
    expect(Object.keys(StyledFieldPackage).sort()).toEqual(EXPECTED_STYLED_FIELD_EXPORTS);
    expect(Object.keys(StyledInputOtpPackage).sort()).toEqual(EXPECTED_STYLED_INPUT_OTP_EXPORTS);
    expect(Object.keys(StyledHoverCardPackage).sort()).toEqual([
      "HoverCard",
      "HoverCardContent",
      "HoverCardTrigger",
      "HoverCardVariants",
      "default",
    ]);
    expect(Object.keys(StyledNavigationMenuPackage).sort()).toEqual([
      "NavigationMenu",
      "NavigationMenuContent",
      "NavigationMenuIndicator",
      "NavigationMenuItem",
      "NavigationMenuLink",
      "NavigationMenuList",
      "NavigationMenuPositioner",
      "NavigationMenuTrigger",
      "NavigationMenuVariants",
      "default",
      "navigationMenuTriggerStyle",
    ]);
    expect(Object.keys(StyledSliderPackage).sort()).toEqual(EXPECTED_STYLED_SLIDER_EXPORTS);
    expect(Object.keys(StyledPopoverPackage).sort()).toEqual([
      "Popover",
      "PopoverContent",
      "PopoverDescription",
      "PopoverHeader",
      "PopoverTitle",
      "PopoverTrigger",
      "PopoverVariants",
      "default",
    ]);
    expect(Object.keys(StyledSheetPackage).sort()).toEqual([
      "Sheet",
      "SheetClose",
      "SheetContent",
      "SheetDescription",
      "SheetFooter",
      "SheetHeader",
      "SheetTitle",
      "SheetTrigger",
      "SheetVariants",
      "default",
    ]);
    expect(Object.keys(StyledScrollAreaPackage).sort()).toEqual([
      "ScrollArea",
      "ScrollAreaContent",
      "ScrollAreaCorner",
      "ScrollAreaThumb",
      "ScrollAreaVariants",
      "ScrollAreaViewport",
      "ScrollBar",
      "default",
    ]);
    expect(Object.keys(StyledThemeTogglePackage).sort()).toEqual([
      "ThemeToggle",
      "ThemeToggleVariants",
      "default",
    ]);
    expect(Object.keys(StyledTabsPackage).sort()).toEqual(EXPECTED_STYLED_TABS_EXPORTS);
    expect(Object.keys(StyledToggleGroupPackage).sort()).toEqual([
      "ToggleGroup",
      "ToggleGroupItem",
      "ToggleGroupVariants",
      "default",
    ]);
    expect(Object.keys(StyledTooltipPackage).sort()).toEqual([
      "Tooltip",
      "TooltipContent",
      "TooltipTrigger",
      "TooltipVariants",
      "default",
    ]);
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h("main", null, [
              h(StyledAccordion, { defaultValue: "alpha" }, () =>
                h(StyledAccordionItem, { value: "alpha" }, () => [
                  h(StyledAccordionTrigger, null, () => "Alpha"),
                  h(StyledAccordionContent, null, () => "Alpha content"),
                ]),
              ),
              h(StyledButton, { variant: "primary" }, { default: () => "Save" }),
              h(StyledCheckbox, {
                defaultChecked: true,
                id: "styled-terms",
                label: "Accept terms",
              }),
              h(
                StyledCheckboxGroup,
                { defaultValue: ["styled-grouped"] },
                {
                  default: () => h(StyledCheckbox, { value: "styled-grouped" }),
                },
              ),
              h(
                StyledCollapsible,
                { defaultOpen: true },
                {
                  default: () => [
                    h(StyledCollapsibleTrigger, null, { default: () => "Details" }),
                    h(StyledCollapsibleContent, null, { default: () => "Content" }),
                  ],
                },
              ),
              h(StyledDialog, null, {
                default: () => [
                  h(StyledDialogTrigger, null, { default: () => "Open Dialog" }),
                  h(StyledDialogContent, null, {
                    default: () => [
                      h(StyledDialogTitle, null, { default: () => "Title" }),
                      h(StyledDialogDescription, null, { default: () => "Description" }),
                    ],
                  }),
                ],
              }),
              h(StyledAlertDialog, null, {
                default: () => [
                  h(StyledAlertDialogTrigger, null, { default: () => "Delete" }),
                  h(StyledAlertDialogContent, null, {
                    default: () => [
                      h(StyledAlertDialogTitle, null, { default: () => "Confirm" }),
                      h(StyledAlertDialogDescription, null, { default: () => "Cannot undo" }),
                      h(StyledAlertDialogCancel, null, { default: () => "Cancel" }),
                      h(StyledAlertDialogAction, null, { default: () => "Delete" }),
                    ],
                  }),
                ],
              }),
              h(StyledInput, { defaultValue: "Styled input" }),
              h(StyledFieldSet, null, () => [
                h(StyledFieldLegend, null, () => "Account"),
                h(StyledFieldGroup, null, () => [
                  h(StyledField, { name: "styled-email" }, () => [
                    h(StyledFieldLabel, null, () => "Email"),
                    h(StyledFieldContent, null, () => [
                      h(StyledFieldTitle, null, () => "Receipt email"),
                      h(StyledFieldDescription, null, () => "Used for receipts"),
                    ]),
                    h(StyledFieldControl, {
                      defaultValue: "reader@example.com",
                      required: true,
                    }),
                    h(StyledFieldItem, null, () => "Delivery address"),
                    h(StyledFieldError, { match: "valueMissing" }, () => "Required"),
                    h(StyledFieldValidity, { match: "valid" }, () => "Ready"),
                  ]),
                  h(StyledFieldSeparator, null, () => "or"),
                ]),
              ]),
              h(StyledDropzone, { name: "styled-files" }),
              h(StyledInputOtp, { defaultValue: "123456" }, () =>
                h(StyledInputOtpGroup, null, () => [
                  ...Array.from({ length: 3 }, (_, index) =>
                    h(StyledInputOtpSlot, { index, key: index }),
                  ),
                  h(StyledInputOtpSeparator),
                  ...Array.from({ length: 3 }, (_, offset) =>
                    h(StyledInputOtpSlot, { index: offset + 3, key: offset + 3 }),
                  ),
                ]),
              ),
              renderStyledCombobox(),
              renderStyledDropdown(),
              renderStyledContextMenu(),
              renderStyledNavigationMenu(),
              renderStyledHoverCard(),
              renderStyledTooltip(),
              h(StyledForm, null, { default: () => h(StyledFormErrorSummary) }),
              renderStyledPopover(),
              h(
                StyledAvatar,
                { size: "lg", variant: "success" },
                {
                  default: () => [
                    h(StyledAvatarImage, { alt: "Ada Lovelace", src: "/ada.png" }),
                    h(StyledAvatarFallback, { delay: 120 }, { default: () => "AL" }),
                  ],
                },
              ),
              h(StyledProgress, { label: "Upload", max: 80, min: 20, value: 50 }),
              h(
                StyledRadioGroup,
                { defaultValue: "alpha", legend: "Choice", name: "styled-radio" },
                {
                  default: () => [
                    h(StyledRadioGroupItem, { label: "Alpha", value: "alpha" }),
                    h(StyledRadioGroupItem, { label: "Beta", value: "beta" }),
                  ],
                },
              ),
              renderStyledScrollArea(),
              h(StyledScrollAreaViewport, null, {
                default: () => h(StyledScrollAreaContent, null, { default: () => "Part content" }),
              }),
              h(
                StyledScrollBar,
                { keepMounted: true, orientation: "horizontal" },
                {
                  default: () => h(StyledScrollAreaThumb),
                },
              ),
              h(StyledScrollAreaCorner),
              renderStyledSelect(),
              h(StyledSlider, { defaultValue: [20, 80], name: "styled-price" }),
              h(StyledSwitch, {
                defaultChecked: true,
                id: "styled-notifications",
                label: "Notifications",
              }),
              h(StyledTabs, { defaultValue: "account" }, () => [
                h(StyledTabsList, null, () =>
                  h(StyledTabsTrigger, { value: "account" }, () => "Account"),
                ),
                h(StyledTabsContent, { value: "account" }, () => "Account content"),
              ]),
              h(StyledThemeToggle, { "aria-label": "Change appearance" }),
              h(StyledToggle, { defaultPressed: true }, { default: () => "Pinned" }),
              h(
                StyledToggleGroup,
                { defaultValue: ["left"] },
                {
                  default: () => [
                    h(StyledToggleGroupItem, { value: "left" }, { default: () => "Left" }),
                    h(StyledToggleGroupItem, { value: "right" }, { default: () => "Right" }),
                  ],
                },
              ),
            ]),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first.match(/<a[^>]*href="#profile"/g)).toHaveLength(1);
    for (const slot of [
      "button",
      "alert-dialog",
      "alert-dialog-trigger",
      "alert-dialog-backdrop",
      "alert-dialog-content",
      "alert-dialog-title",
      "alert-dialog-description",
      "alert-dialog-cancel",
      "alert-dialog-action",
      "checkbox-wrapper",
      "checkbox",
      "checkbox-group",
      "checkbox-indicator",
      "checkbox-label",
      "collapsible",
      "collapsible-trigger",
      "collapsible-content",
      "dialog",
      "dialog-trigger",
      "dialog-backdrop",
      "dialog-content",
      "dialog-close",
      "dialog-title",
      "dialog-description",
      "popover",
      "popover-trigger",
      "popover-portal",
      "popover-content",
      "popover-header",
      "popover-title",
      "popover-description",
      "input",
      "field",
      "field-label",
      "field-control",
      "field-description",
      "field-error",
      "field-validity",
      "dropzone",
      "dropzone-upload-indicator",
      "dropzone-loading-indicator",
      "dropzone-files-list",
      "input-otp",
      "input-otp-group",
      "input-otp-slot",
      "input-otp-separator",
      "combobox",
      "combobox-label",
      "combobox-input-group",
      "combobox-input",
      "combobox-trigger",
      "combobox-clear",
      "combobox-value",
      "combobox-content",
      "combobox-list",
      "combobox-empty",
      "combobox-group",
      "combobox-group-label",
      "combobox-item",
      "combobox-item-text",
      "combobox-item-indicator",
      "combobox-separator",
      "dropdown",
      "dropdown-trigger",
      "dropdown-content",
      "dropdown-group",
      "dropdown-label",
      "dropdown-item",
      "dropdown-link-item",
      "dropdown-checkbox-item",
      "dropdown-checkbox-item-indicator",
      "dropdown-radio-group",
      "dropdown-radio-item",
      "dropdown-radio-item-indicator",
      "dropdown-separator",
      "dropdown-shortcut",
      "dropdown-sub",
      "dropdown-sub-trigger",
      "dropdown-sub-content",
      "context-menu",
      "context-menu-trigger",
      "context-menu-content",
      "context-menu-group",
      "context-menu-label",
      "context-menu-item",
      "context-menu-checkbox-item",
      "context-menu-checkbox-item-indicator",
      "context-menu-radio-group",
      "context-menu-radio-item",
      "context-menu-radio-item-indicator",
      "context-menu-separator",
      "context-menu-shortcut",
      "context-menu-sub",
      "context-menu-sub-trigger",
      "context-menu-sub-content",
      "navigation-menu",
      "navigation-menu-list",
      "navigation-menu-item",
      "navigation-menu-trigger",
      "navigation-menu-content",
      "navigation-menu-link",
      "navigation-menu-indicator",
      "navigation-menu-positioner",
      "hover-card",
      "hover-card-trigger",
      "hover-card-content",
      "tooltip",
      "tooltip-trigger",
      "tooltip-content",
      "avatar",
      "avatar-image",
      "avatar-fallback",
      "progress",
      "progress-track",
      "progress-indicator",
      "radio-group",
      "radio-group-item",
      "radio-group-item-control",
      "radio-group-item-indicator",
      "radio-group-item-wrapper",
      "scroll-area",
      "scroll-area-viewport",
      "scroll-area-content",
      "scroll-area-scrollbar",
      "scroll-area-thumb",
      "scroll-area-corner",
      "select",
      "select-trigger",
      "select-value",
      "select-content",
      "select-list",
      "select-group",
      "select-label",
      "select-item",
      "select-item-text",
      "select-item-indicator",
      "select-separator",
      "select-scroll-up-button",
      "select-scroll-down-button",
      "switch-wrapper",
      "switch-button",
      "switch-toggle",
      "switch-label",
      "slider",
      "slider-control",
      "slider-range",
      "slider-track",
      "slider-thumb",
      "tabs",
      "tabs-list",
      "tabs-trigger",
      "tabs-content",
      "theme-toggle",
      "toggle",
      "toggle-group",
      "toggle-group-item",
    ]) {
      expect(first, slot).toContain(`data-slot="${slot}"`);
    }
    expectComponentMarkerCoverage(
      first,
      EXPECTED_STYLED_ACCORDION_EXPORTS,
      ["AccordionVariants", "default"],
      {
        Accordion: "accordion",
        AccordionContent: "accordion-content",
        AccordionItem: "accordion-item",
        AccordionTrigger: "accordion-trigger",
      },
      'data-slot="',
      '"',
    );
    expectComponentMarkerCoverage(
      first,
      EXPECTED_STYLED_TABS_EXPORTS,
      ["TabsVariants", "default"],
      {
        Tabs: "tabs",
        TabsContent: "tabs-content",
        TabsList: "tabs-list",
        TabsTrigger: "tabs-trigger",
      },
      'data-slot="',
      '"',
    );
    expectComponentMarkerCoverage(
      first,
      EXPECTED_STYLED_FIELD_EXPORTS,
      ["FieldVariants", "default"],
      {
        Field: "field",
        FieldContent: "field-content",
        FieldControl: "field-control",
        FieldDescription: "field-description",
        FieldError: "field-error",
        FieldGroup: "field-group",
        FieldItem: "field-item",
        FieldLabel: "field-label",
        FieldLegend: "field-legend",
        FieldSeparator: "field-separator",
        FieldSet: "field-set",
        FieldTitle: "field-title",
        FieldValidity: "field-validity",
      },
      'data-slot="',
      '"',
    );
    expectComponentMarkerCoverage(
      first,
      EXPECTED_STYLED_SLIDER_EXPORTS,
      ["SliderVariants", "default"],
      { Slider: "slider" },
      'data-slot="',
      '"',
    );
    expectComponentMarkerCoverage(
      first,
      EXPECTED_STYLED_INPUT_OTP_EXPORTS,
      ["InputOtpVariants", "REGEXP_ONLY_DIGITS", "REGEXP_ONLY_DIGITS_AND_CHARS", "default"],
      {
        InputOtp: "input-otp",
        InputOtpGroup: "input-otp-group",
        InputOtpSeparator: "input-otp-separator",
        InputOtpSlot: "input-otp-slot",
      },
      'data-slot="',
      '"',
    );
    expectComponentMarkerCoverage(
      first,
      EXPECTED_STYLED_DROPZONE_EXPORTS,
      ["DropzoneVariants", "default"],
      {
        Dropzone: "dropzone",
        DropzoneFilesList: "dropzone-files-list",
        DropzoneLoadingIndicator: "dropzone-loading-indicator",
        DropzoneUploadIndicator: "dropzone-upload-indicator",
      },
      'data-slot="',
      '"',
    );
  });
});

function expectComponentMarkerCoverage(
  html: string,
  exactExports: string[],
  nonComponentExports: string[],
  componentMarkers: Record<string, string>,
  markerPrefix: string,
  markerSuffix = "",
) {
  expect(Object.keys(componentMarkers).sort()).toEqual(
    exactExports.filter((exportName) => !nonComponentExports.includes(exportName)).sort(),
  );
  for (const [exportName, marker] of Object.entries(componentMarkers)) {
    expect(html, exportName).toContain(`${markerPrefix}${marker}${markerSuffix}`);
  }
}

function renderStyledCombobox() {
  return h(
    StyledComboboxPackage.Combobox,
    { defaultValue: "banana", name: "styled-fruit" },
    {
      default: () => [
        h(StyledComboboxPackage.ComboboxLabel, null, { default: () => "Fruit" }),
        h(StyledComboboxPackage.ComboboxInputGroup, null, {
          default: () => [
            h(StyledComboboxPackage.ComboboxInput),
            h(StyledComboboxPackage.ComboboxTrigger),
            h(StyledComboboxPackage.ComboboxClear),
          ],
        }),
        h(StyledComboboxPackage.ComboboxValue, { placeholder: "Pick fruit" }),
        h(StyledComboboxPackage.ComboboxContent, null, {
          default: () => [
            h(StyledComboboxPackage.ComboboxEmpty, null, { default: () => "No results" }),
            h(StyledComboboxPackage.ComboboxGroup, null, {
              default: () => [
                h(StyledComboboxPackage.ComboboxGroupLabel, null, { default: () => "Fruit" }),
                h(
                  StyledComboboxPackage.ComboboxItem,
                  { value: "banana" },
                  {
                    default: () => [
                      h(StyledComboboxPackage.ComboboxItemText, null, {
                        default: () => "Banana",
                      }),
                      h(StyledComboboxPackage.ComboboxItemIndicator),
                    ],
                  },
                ),
              ],
            }),
            h(StyledComboboxPackage.ComboboxSeparator),
          ],
        }),
      ],
    },
  );
}

function renderStyledDropdown() {
  return h(StyledDropdownPackage.Dropdown, null, {
    default: () => [
      h(StyledDropdownPackage.DropdownTrigger, null, { default: () => "Actions" }),
      h(StyledDropdownPackage.DropdownContent, null, {
        default: () => [
          h(StyledDropdownPackage.DropdownGroup, null, {
            default: () => [
              h(StyledDropdownPackage.DropdownLabel, null, { default: () => "Commands" }),
              h(StyledDropdownPackage.DropdownItem, null, { default: () => "Edit" }),
              h(
                StyledDropdownPackage.DropdownLinkItem,
                { href: "/docs" },
                { default: () => "Docs" },
              ),
              h(StyledDropdownPackage.DropdownShortcut, null, { default: () => "E" }),
            ],
          }),
          h(StyledDropdownPackage.DropdownSeparator),
          h(
            StyledDropdownPackage.DropdownCheckboxItem,
            { defaultChecked: true },
            {
              default: () => ["Pinned", h(StyledDropdownPackage.DropdownCheckboxItemIndicator)],
            },
          ),
          h(
            StyledDropdownPackage.DropdownRadioGroup,
            { defaultValue: "list" },
            {
              default: () =>
                h(
                  StyledDropdownPackage.DropdownRadioItem,
                  { value: "list" },
                  {
                    default: () => ["List", h(StyledDropdownPackage.DropdownRadioItemIndicator)],
                  },
                ),
            },
          ),
          h(StyledDropdownPackage.DropdownSub, null, {
            default: () => [
              h(StyledDropdownPackage.DropdownSubTrigger, null, { default: () => "More" }),
              h(StyledDropdownPackage.DropdownSubContent, null, {
                default: () =>
                  h(StyledDropdownPackage.DropdownItem, null, {
                    default: () => "Duplicate",
                  }),
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function renderStyledContextMenu() {
  return h(StyledContextMenuPackage.ContextMenu, null, {
    default: () => [
      h(StyledContextMenuPackage.ContextMenuTrigger, null, { default: () => "Canvas" }),
      h(StyledContextMenuPackage.ContextMenuContent, null, {
        default: () => [
          h(StyledContextMenuPackage.ContextMenuGroup, null, {
            default: () => [
              h(StyledContextMenuPackage.ContextMenuLabel, null, { default: () => "Commands" }),
              h(StyledContextMenuPackage.ContextMenuItem, null, { default: () => "Rename" }),
              h(StyledContextMenuPackage.ContextMenuShortcut, null, { default: () => "R" }),
            ],
          }),
          h(StyledContextMenuPackage.ContextMenuSeparator),
          h(
            StyledContextMenuPackage.ContextMenuCheckboxItem,
            { defaultChecked: true },
            {
              default: () => [
                "Pinned",
                h(StyledContextMenuPackage.ContextMenuCheckboxItemIndicator),
              ],
            },
          ),
          h(
            StyledContextMenuPackage.ContextMenuRadioGroup,
            { defaultValue: "list" },
            {
              default: () =>
                h(
                  StyledContextMenuPackage.ContextMenuRadioItem,
                  { value: "list" },
                  {
                    default: () => [
                      "List",
                      h(StyledContextMenuPackage.ContextMenuRadioItemIndicator),
                    ],
                  },
                ),
            },
          ),
          h(StyledContextMenuPackage.ContextMenuSub, null, {
            default: () => [
              h(StyledContextMenuPackage.ContextMenuSubTrigger, null, {
                default: () => "More",
              }),
              h(StyledContextMenuPackage.ContextMenuSubContent, null, {
                default: () =>
                  h(StyledContextMenuPackage.ContextMenuItem, null, {
                    default: () => "Duplicate",
                  }),
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function renderStyledNavigationMenu() {
  return h(
    StyledNavigationMenuPackage.NavigationMenu,
    { defaultValue: "products" },
    {
      default: () => [
        h(StyledNavigationMenuPackage.NavigationMenuList, null, {
          default: () =>
            h(
              StyledNavigationMenuPackage.NavigationMenuItem,
              { value: "products" },
              {
                default: () => [
                  h(StyledNavigationMenuPackage.NavigationMenuTrigger, null, {
                    default: () => "Products",
                  }),
                  h(StyledNavigationMenuPackage.NavigationMenuContent, null, {
                    default: () =>
                      h(
                        StyledNavigationMenuPackage.NavigationMenuLink,
                        { href: "/products" },
                        {
                          default: () => "Products",
                        },
                      ),
                  }),
                ],
              },
            ),
        }),
        h(StyledNavigationMenuPackage.NavigationMenuIndicator),
        h(StyledNavigationMenuPackage.NavigationMenuPositioner),
      ],
    },
  );
}

function renderStyledHoverCard() {
  return h(
    StyledHoverCardPackage.HoverCard,
    { defaultOpen: true },
    {
      default: () => [
        h(
          StyledHoverCardPackage.HoverCardTrigger,
          { href: "#profile" },
          { default: () => "Profile" },
        ),
        h(StyledHoverCardPackage.HoverCardContent, null, { default: () => "Profile details" }),
      ],
    },
  );
}

function renderStyledTooltip() {
  return h(
    StyledTooltipPackage.Tooltip,
    { defaultOpen: true },
    {
      default: () => [
        h(StyledTooltipPackage.TooltipTrigger, null, {
          default: () => h("button", { type: "button" }, "Help"),
        }),
        h(StyledTooltipPackage.TooltipContent, null, { default: () => "Helpful details" }),
      ],
    },
  );
}

function renderPrimitiveProgress() {
  return h(
    ProgressPackage.ProgressRoot,
    { max: 200, min: 20, value: 80 },
    {
      default: () => [
        h(ProgressPackage.ProgressLabel, null, { default: () => "Export files" }),
        h(ProgressPackage.ProgressTrack, null, {
          default: () => h(ProgressPackage.ProgressIndicator),
        }),
        h(ProgressPackage.ProgressValue),
      ],
    },
  );
}

function renderPrimitiveCombobox() {
  return h(
    ComboboxPackage.ComboboxRoot,
    { defaultValue: "banana", name: "fruit" },
    {
      default: () => [
        h(ComboboxPackage.ComboboxLabel, null, { default: () => "Fruit" }),
        h(ComboboxPackage.ComboboxInputGroup, null, {
          default: () => [
            h(ComboboxPackage.ComboboxInput),
            h(ComboboxPackage.ComboboxTrigger, null, {
              default: () => h(ComboboxPackage.ComboboxIcon),
            }),
            h(ComboboxPackage.ComboboxClear),
          ],
        }),
        h(ComboboxPackage.ComboboxValue, { placeholder: "Pick fruit" }),
        h(
          ComboboxPackage.ComboboxPortal,
          { disabled: true },
          {
            default: () =>
              h(ComboboxPackage.ComboboxPositioner, null, {
                default: () =>
                  h(ComboboxPackage.ComboboxPopup, null, {
                    default: () => [
                      h(ComboboxPackage.ComboboxEmpty, null, { default: () => "No results" }),
                      h(ComboboxPackage.ComboboxList, null, {
                        default: () => [
                          h(ComboboxPackage.ComboboxGroup, null, {
                            default: () => [
                              h(ComboboxPackage.ComboboxGroupLabel, null, {
                                default: () => "Fruit",
                              }),
                              h(
                                ComboboxPackage.ComboboxItem,
                                { value: "banana" },
                                {
                                  default: () => [
                                    h(ComboboxPackage.ComboboxItemText, null, {
                                      default: () => "Banana",
                                    }),
                                    h(ComboboxPackage.ComboboxItemIndicator),
                                  ],
                                },
                              ),
                            ],
                          }),
                          h(ComboboxPackage.ComboboxSeparator),
                        ],
                      }),
                    ],
                  }),
              }),
          },
        ),
      ],
    },
  );
}

function renderPrimitivePopover() {
  return h(
    PopoverPackage.PopoverRoot,
    { defaultOpen: true },
    {
      default: () => [
        h(PopoverPackage.PopoverTrigger, null, { default: () => "Open Popover" }),
        h(
          PopoverPackage.PopoverPortal,
          { disabled: true },
          {
            default: () =>
              h(PopoverPackage.PopoverViewport, null, {
                default: () => [
                  h(PopoverPackage.PopoverBackdrop),
                  h(
                    PopoverPackage.PopoverPositioner,
                    { align: "end", side: "right" },
                    {
                      default: () =>
                        h(
                          PopoverPackage.PopoverPopup,
                          { align: "end", side: "right" },
                          {
                            default: () => [
                              h(PopoverPackage.PopoverArrow),
                              h(PopoverPackage.PopoverTitle, null, { default: () => "Popover" }),
                              h(PopoverPackage.PopoverDescription, null, {
                                default: () => "Details",
                              }),
                              h(PopoverPackage.PopoverClose, null, { default: () => "Close" }),
                            ],
                          },
                        ),
                    },
                  ),
                ],
              }),
          },
        ),
      ],
    },
  );
}

function renderPrimitivePreviewCard() {
  return h(
    PreviewCardPackage.PreviewCardRoot,
    { defaultOpen: true },
    {
      default: () => [
        h(
          PreviewCardPackage.PreviewCardTrigger,
          { href: "#profile" },
          { default: () => "Profile" },
        ),
        h(
          PreviewCardPackage.PreviewCardPortal,
          { disabled: true },
          {
            default: () => [
              h(PreviewCardPackage.PreviewCardBackdrop),
              h(PreviewCardPackage.PreviewCardPositioner, null, {
                default: () =>
                  h(PreviewCardPackage.PreviewCardViewport, null, {
                    default: () =>
                      h(PreviewCardPackage.PreviewCardPopup, null, {
                        default: () => ["Profile details", h(PreviewCardPackage.PreviewCardArrow)],
                      }),
                  }),
              }),
            ],
          },
        ),
      ],
    },
  );
}

function renderPrimitiveTooltip() {
  return h(
    TooltipPackage.TooltipRoot,
    { defaultOpen: true },
    {
      default: () => [
        h(TooltipPackage.TooltipTrigger, null, { default: () => "Help" }),
        h(
          TooltipPackage.TooltipPortal,
          { disabled: true },
          {
            default: () =>
              h(TooltipPackage.TooltipPositioner, null, {
                default: () =>
                  h(TooltipPackage.TooltipPopup, null, {
                    default: () => ["Helpful details", h(TooltipPackage.TooltipArrow)],
                  }),
              }),
          },
        ),
      ],
    },
  );
}

function renderStyledPopover() {
  return h(
    StyledPopover,
    { defaultOpen: true },
    {
      default: () => [
        h(StyledPopoverTrigger, null, { default: () => "Open Styled Popover" }),
        h(
          StyledPopoverContent,
          { align: "start", side: "top" },
          {
            default: () =>
              h(StyledPopoverHeader, null, {
                default: () => [
                  h(StyledPopoverTitle, null, { default: () => "Styled Popover" }),
                  h(StyledPopoverDescription, null, { default: () => "Details" }),
                ],
              }),
          },
        ),
      ],
    },
  );
}

function renderStyledScrollArea() {
  return h(
    StyledScrollArea,
    { overflowEdgeThreshold: 12, viewportClass: "ssr-viewport" },
    {
      default: () => "Scrollable content",
      scrollbar: () =>
        h(
          StyledScrollBar,
          { keepMounted: true, orientation: "horizontal" },
          { default: () => h(StyledScrollAreaThumb) },
        ),
    },
  );
}

function renderPrimitiveScrollArea() {
  return h(
    ScrollAreaPackage.ScrollAreaRoot,
    { overflowEdgeThreshold: { yStart: 20 } },
    {
      default: () => [
        h(ScrollAreaPackage.ScrollAreaViewport, null, {
          default: () =>
            h(ScrollAreaPackage.ScrollAreaContent, null, { default: () => "Scrollable content" }),
        }),
        h(ScrollAreaPackage.ScrollAreaScrollbar, null, {
          default: () => h(ScrollAreaPackage.ScrollAreaThumb),
        }),
        h(ScrollAreaPackage.ScrollAreaCorner),
      ],
    },
  );
}

function renderPrimitiveContextMenu() {
  return h(
    ContextMenuPackage.ContextMenuRoot,
    { defaultOpen: true },
    {
      default: () => [
        h(ContextMenuPackage.ContextMenuTrigger, null, { default: () => "Canvas" }),
        h(
          ContextMenuPackage.ContextMenuPortal,
          { disabled: true },
          {
            default: () =>
              h(ContextMenuPackage.ContextMenuPositioner, null, {
                default: () =>
                  h(ContextMenuPackage.ContextMenuPopup, null, {
                    default: () => [
                      h(ContextMenuPackage.ContextMenuGroup, null, {
                        default: () => [
                          h(ContextMenuPackage.ContextMenuLabel, null, {
                            default: () => "Commands",
                          }),
                          h(ContextMenuPackage.ContextMenuItem, null, { default: () => "Rename" }),
                          h(
                            ContextMenuPackage.ContextMenuLinkItem,
                            { href: "/docs" },
                            {
                              default: () => "Docs",
                            },
                          ),
                          h(ContextMenuPackage.ContextMenuShortcut, null, { default: () => "R" }),
                        ],
                      }),
                      h(ContextMenuPackage.ContextMenuSeparator),
                      h(
                        ContextMenuPackage.ContextMenuCheckboxItem,
                        { defaultChecked: true },
                        {
                          default: () => [
                            "Pinned",
                            h(ContextMenuPackage.ContextMenuCheckboxItemIndicator),
                          ],
                        },
                      ),
                      h(
                        ContextMenuPackage.ContextMenuRadioGroup,
                        { defaultValue: "list" },
                        {
                          default: () =>
                            h(
                              ContextMenuPackage.ContextMenuRadioItem,
                              { value: "list" },
                              {
                                default: () => [
                                  "List",
                                  h(ContextMenuPackage.ContextMenuRadioItemIndicator),
                                ],
                              },
                            ),
                        },
                      ),
                      h(ContextMenuPackage.ContextMenuSubmenuRoot, null, {
                        default: () => [
                          h(ContextMenuPackage.ContextMenuSubmenuTrigger, null, {
                            default: () => "More",
                          }),
                          h(
                            ContextMenuPackage.ContextMenuPortal,
                            { disabled: true },
                            {
                              default: () =>
                                h(ContextMenuPackage.ContextMenuPositioner, null, {
                                  default: () =>
                                    h(ContextMenuPackage.ContextMenuPopup, null, {
                                      default: () =>
                                        h(ContextMenuPackage.ContextMenuItem, null, {
                                          default: () => "Duplicate",
                                        }),
                                    }),
                                }),
                            },
                          ),
                        ],
                      }),
                    ],
                  }),
              }),
          },
        ),
      ],
    },
  );
}

function renderPrimitiveNavigationMenu() {
  return h(
    NavigationMenuPackage.NavigationMenuRoot,
    { defaultValue: "products" },
    {
      default: () => [
        h(NavigationMenuPackage.NavigationMenuList, null, {
          default: () =>
            h(
              NavigationMenuPackage.NavigationMenuItem,
              { value: "products" },
              {
                default: () => [
                  h(NavigationMenuPackage.NavigationMenuTrigger, null, {
                    default: () => ["Products", h(NavigationMenuPackage.NavigationMenuIcon)],
                  }),
                  h(NavigationMenuPackage.NavigationMenuContent, null, {
                    default: () =>
                      h(
                        NavigationMenuPackage.NavigationMenuLink,
                        { href: "/products" },
                        { default: () => "Products" },
                      ),
                  }),
                ],
              },
            ),
        }),
        h(
          NavigationMenuPackage.NavigationMenuPortal,
          { disabled: true },
          {
            default: () =>
              h(NavigationMenuPackage.NavigationMenuPositioner, null, {
                default: () =>
                  h(NavigationMenuPackage.NavigationMenuPopup, null, {
                    default: () =>
                      h(NavigationMenuPackage.NavigationMenuViewport, null, {
                        default: () => h(NavigationMenuPackage.NavigationMenuArrow),
                      }),
                  }),
              }),
          },
        ),
      ],
    },
  );
}

function renderPrimitiveMenu() {
  return h(MenuPackage.MenuRoot, null, {
    default: () => [
      h(MenuPackage.MenuTrigger, null, { default: () => "Actions" }),
      h(
        MenuPackage.MenuPortal,
        { disabled: true },
        {
          default: () =>
            h(MenuPackage.MenuPositioner, null, {
              default: () =>
                h(MenuPackage.MenuPopup, null, {
                  default: () => [
                    h(MenuPackage.MenuGroup, null, {
                      default: () => [
                        h(MenuPackage.MenuLabel, null, { default: () => "Commands" }),
                        h(MenuPackage.MenuItem, null, { default: () => "Edit" }),
                        h(MenuPackage.MenuLinkItem, { href: "/docs" }, { default: () => "Docs" }),
                        h(MenuPackage.MenuShortcut, null, { default: () => "E" }),
                      ],
                    }),
                    h(MenuPackage.MenuSeparator),
                    h(
                      MenuPackage.MenuCheckboxItem,
                      { defaultChecked: true },
                      {
                        default: () => [
                          "Pinned",
                          h(MenuPackage.MenuCheckboxItemIndicator, null, { default: () => "yes" }),
                        ],
                      },
                    ),
                    h(
                      MenuPackage.MenuRadioGroup,
                      { defaultValue: "list" },
                      {
                        default: () =>
                          h(
                            MenuPackage.MenuRadioItem,
                            { value: "list" },
                            {
                              default: () => [
                                "List",
                                h(MenuPackage.MenuRadioItemIndicator, null, {
                                  default: () => "yes",
                                }),
                              ],
                            },
                          ),
                      },
                    ),
                    h(MenuPackage.MenuSubmenuRoot, null, {
                      default: () => [
                        h(MenuPackage.MenuSubmenuTrigger, null, { default: () => "More" }),
                        h(
                          MenuPackage.MenuPortal,
                          { disabled: true },
                          {
                            default: () =>
                              h(
                                MenuPackage.MenuPositioner,
                                { side: "right" },
                                {
                                  default: () =>
                                    h(MenuPackage.MenuPopup, null, {
                                      default: () =>
                                        h(MenuPackage.MenuItem, null, {
                                          default: () => "Duplicate",
                                        }),
                                    }),
                                },
                              ),
                          },
                        ),
                      ],
                    }),
                  ],
                }),
            }),
        },
      ),
    ],
  });
}

function renderPrimitiveSelect() {
  return h(
    SelectPackage.SelectRoot,
    { defaultValue: "apple", name: "fruit" },
    {
      default: () => [
        h(SelectPackage.SelectLabel, null, { default: () => "Fruit" }),
        h(SelectPackage.SelectTrigger, null, {
          default: () => [
            h(SelectPackage.SelectValue, { placeholder: "Pick fruit" }),
            h(SelectPackage.SelectIcon, null, { default: () => "Open" }),
          ],
        }),
        h(
          SelectPackage.SelectPortal,
          { disabled: true },
          {
            default: () =>
              h(
                SelectPackage.SelectPositioner,
                { alignItemWithTrigger: false },
                {
                  default: () =>
                    h(SelectPackage.SelectPopup, null, {
                      default: () => [
                        h(SelectPackage.SelectScrollUpArrow, null, { default: () => "Up" }),
                        h(SelectPackage.SelectList, null, {
                          default: () => [
                            h(SelectPackage.SelectGroup, null, {
                              default: () => [
                                h(SelectPackage.SelectGroupLabel, null, {
                                  default: () => "Available",
                                }),
                                h(
                                  SelectPackage.SelectItem,
                                  { value: "apple" },
                                  {
                                    default: () => [
                                      h(SelectPackage.SelectItemText, null, {
                                        default: () => "Apple",
                                      }),
                                      h(SelectPackage.SelectItemIndicator, null, {
                                        default: () => "Selected",
                                      }),
                                    ],
                                  },
                                ),
                              ],
                            }),
                            h(SelectPackage.SelectSeparator),
                          ],
                        }),
                        h(SelectPackage.SelectScrollDownArrow, null, {
                          default: () => "Down",
                        }),
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

function renderStyledSelect() {
  return h(
    StyledSelect,
    { defaultValue: "apple", modal: false },
    {
      default: () => [
        h(StyledSelectTrigger, null, {
          default: () => h(StyledSelectValue, { placeholder: "Pick fruit" }),
        }),
        h(
          StyledSelectContent,
          { alignItemWithTrigger: false },
          {
            default: () => [
              h(StyledSelectScrollUpButton),
              h(StyledSelectGroup, null, {
                default: () => [
                  h(StyledSelectLabel, null, { default: () => "Available" }),
                  h(
                    StyledSelectItem,
                    { showIndicator: false, value: "apple" },
                    {
                      default: () => [
                        h(StyledSelectItemText, null, { default: () => "Apple" }),
                        h(StyledSelectItemIndicator, null, { default: () => "Selected" }),
                      ],
                    },
                  ),
                ],
              }),
              h(StyledSelectSeparator),
              h(StyledSelectScrollDownButton),
            ],
          },
        ),
      ],
    },
  );
}
