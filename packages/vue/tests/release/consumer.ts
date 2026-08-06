import type { Component } from "vue";

import {
  AccordionRoot,
  AlertDialogRoot,
  AvatarRoot,
  ButtonRoot,
  CarouselRoot,
  CheckboxGroupRoot,
  CheckboxRoot,
  CollapsibleRoot,
  ColorPickerRoot,
  DialogRoot,
  DrawerRoot,
  DropzoneRoot,
  FieldRoot,
  FieldsetRoot,
  FormRoot,
  InputOtpRoot,
  InputRoot,
  PopoverRoot,
  ProgressRoot,
  RadioGroupRoot,
  RadioRoot,
  ScrollAreaRoot,
  SelectRoot,
  SidebarProvider,
  SliderRoot,
  SwitchRoot,
  TabsRoot,
  ToastRoot,
  ToggleRoot,
  ToggleGroupRoot,
} from "@starwind-ui/vue";
import {
  Dropzone,
  DropzoneFilesList,
  DropzoneInput,
  DropzoneLoadingIndicator,
  DropzoneRoot as DropzoneSubpath,
  DropzoneUploadIndicator,
  type DropzoneFilesChangeDetails,
} from "@starwind-ui/vue/dropzone";
import DropzoneDefault from "@starwind-ui/vue/dropzone";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldItem,
  FieldLabel,
  FieldRoot as FieldSubpath,
  FieldValidity,
  type InputValue as FieldInputValue,
  type InputValueChangeDetails as FieldInputValueChangeDetails,
} from "@starwind-ui/vue/field";
import FieldDefault from "@starwind-ui/vue/field";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionRoot as AccordionSubpath,
  AccordionTrigger,
  type AccordionValue,
  type AccordionValueChangeDetails,
} from "@starwind-ui/vue/accordion";
import AccordionDefault from "@starwind-ui/vue/accordion";
import {
  Tabs,
  TabsContext,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsRoot as TabsSubpath,
  TabsTab,
  type TabsOrientation,
  type TabsValue,
  type TabsValueChangeDetails,
  useTabsContext,
} from "@starwind-ui/vue/tabs";
import TabsDefault from "@starwind-ui/vue/tabs";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastRoot as ToastSubpath,
  ToastTemplate,
  ToastTitle,
  ToastTitleText,
  ToastViewport,
  toast,
  type ToastOptions,
  type ToastPromiseOptions,
} from "@starwind-ui/vue/toast";
import ToastDefault from "@starwind-ui/vue/toast";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogRoot as AlertDialogSubpath,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogViewport,
  type AlertDialogCloseCompleteDetails,
  type AlertDialogOpenChangeDetails,
} from "@starwind-ui/vue/alert-dialog";
import AlertDialogDefault from "@starwind-ui/vue/alert-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarRoot as AvatarSubpath,
  type AvatarImageLoadingStatus,
  type AvatarLoadingStatusChangeDetails,
} from "@starwind-ui/vue/avatar";
import AvatarDefault from "@starwind-ui/vue/avatar";
import { Button, ButtonRoot as ButtonSubpath } from "@starwind-ui/vue/button";
import ButtonDefault from "@starwind-ui/vue/button";
import {
  Carousel,
  CarouselContainer,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselRoot as CarouselSubpath,
  CarouselViewport,
  type CarouselInstance,
  type CarouselOptions,
  createCarousel,
} from "@starwind-ui/vue/carousel";
import CarouselDefault from "@starwind-ui/vue/carousel";
import {
  Checkbox,
  CheckboxIndicator,
  CheckboxRoot as CheckboxSubpath,
} from "@starwind-ui/vue/checkbox";
import CheckboxDefault from "@starwind-ui/vue/checkbox";
import {
  CheckboxGroup,
  CheckboxGroupRoot as CheckboxGroupSubpath,
  type CheckboxGroupContextValue,
  type CheckboxGroupValue,
  useCheckboxGroupContext,
} from "@starwind-ui/vue/checkbox-group";
import CheckboxGroupDefault from "@starwind-ui/vue/checkbox-group";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleRoot as CollapsibleSubpath,
  CollapsibleTrigger,
  type CollapsibleOpenChangeDetails,
} from "@starwind-ui/vue/collapsible";
import CollapsibleDefault from "@starwind-ui/vue/collapsible";
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerAreaInput,
  ColorPickerChannelSlider,
  ColorPickerChannelSliderInput,
  ColorPickerHiddenInput,
  ColorPickerRoot as ColorPickerSubpath,
  ColorPickerSwatch,
  type ColorPickerColor,
  type ColorPickerFormat,
  type ColorPickerValueChangeDetails,
  createColorPickerInitialState,
  parseColor,
  projectColorPickerInitialPart,
} from "@starwind-ui/vue/color-picker";
import ColorPickerDefault from "@starwind-ui/vue/color-picker";
import {
  Combobox,
  ComboboxInput,
  ComboboxItem,
  ComboboxRoot as ComboboxSubpath,
} from "@starwind-ui/vue/combobox";
import ComboboxDefault from "@starwind-ui/vue/combobox";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuRoot as ContextMenuSubpath,
  ContextMenuTrigger,
} from "@starwind-ui/vue/context-menu";
import ContextMenuDefault from "@starwind-ui/vue/context-menu";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot as DialogSubpath,
  DialogTitle,
  DialogTrigger,
  type DialogCloseCompleteDetails,
  type DialogOpenChangeDetails,
} from "@starwind-ui/vue/dialog";
import DialogDefault from "@starwind-ui/vue/dialog";
import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerDescription,
  DrawerPopup,
  DrawerPortal,
  DrawerRoot as DrawerSubpath,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
  type DrawerCloseCompleteDetails,
  type DrawerOpenChangeDetails,
} from "@starwind-ui/vue/drawer";
import DrawerDefault from "@starwind-ui/vue/drawer";
import {
  Fieldset,
  FieldsetLegend,
  FieldsetRoot as FieldsetSubpath,
} from "@starwind-ui/vue/fieldset";
import FieldsetDefault from "@starwind-ui/vue/fieldset";
import {
  Form,
  FormErrorSummary,
  FormRoot as FormSubpath,
  type FormValidationTiming,
} from "@starwind-ui/vue/form";
import FormDefault from "@starwind-ui/vue/form";
import { Input, InputRoot as InputSubpath, type InputValue } from "@starwind-ui/vue/input";
import InputDefault from "@starwind-ui/vue/input";
import {
  InputOtp,
  InputOtpGroup,
  InputOtpRoot as InputOtpSubpath,
  InputOtpSeparator,
  InputOtpSlot,
  type InputOtpValueChangeDetails,
} from "@starwind-ui/vue/input-otp";
import InputOtpDefault from "@starwind-ui/vue/input-otp";
import { Menu, MenuItem, MenuRoot as MenuSubpath, MenuTrigger } from "@starwind-ui/vue/menu";
import MenuDefault from "@starwind-ui/vue/menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuRoot as NavigationMenuSubpath,
  NavigationMenuTrigger,
} from "@starwind-ui/vue/navigation-menu";
import NavigationMenuDefault from "@starwind-ui/vue/navigation-menu";
import {
  Popover,
  PopoverArrow,
  PopoverBackdrop,
  PopoverClose,
  PopoverDescription,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverRoot as PopoverSubpath,
  PopoverTitle,
  PopoverTrigger,
  PopoverViewport,
  type PopoverCloseCompleteDetails,
  type PopoverOpenChangeDetails,
} from "@starwind-ui/vue/popover";
import PopoverDefault from "@starwind-ui/vue/popover";
import {
  PreviewCard,
  PreviewCardRoot as PreviewCardSubpath,
  PreviewCardTrigger,
} from "@starwind-ui/vue/preview-card";
import PreviewCardDefault from "@starwind-ui/vue/preview-card";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressRoot as ProgressSubpath,
  ProgressTrack,
  ProgressValue as ProgressValuePart,
} from "@starwind-ui/vue/progress";
import ProgressDefault from "@starwind-ui/vue/progress";
import {
  Radio,
  RadioIndicator,
  RadioRoot as RadioSubpath,
  type RadioCheckedChangeDetails,
} from "@starwind-ui/vue/radio";
import RadioDefault from "@starwind-ui/vue/radio";
import {
  RadioGroup,
  RadioGroupRoot as RadioGroupSubpath,
  type RadioGroupContextValue,
  type RadioGroupValue,
  useRadioGroupContext,
} from "@starwind-ui/vue/radio-group";
import RadioGroupDefault from "@starwind-ui/vue/radio-group";
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaRoot as ScrollAreaSubpath,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@starwind-ui/vue/scroll-area";
import ScrollAreaDefault from "@starwind-ui/vue/scroll-area";
import {
  Select,
  SelectGroup,
  SelectGroupLabel,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot as SelectSubpath,
  SelectScrollDownArrow,
  SelectScrollUpArrow,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  type SelectContextValue,
} from "@starwind-ui/vue/select";
import SelectDefault from "@starwind-ui/vue/select";
import {
  Sidebar,
  SidebarComponent,
  SidebarMenuButton,
  SidebarProvider as SidebarProviderSubpath,
  SidebarRail,
  SidebarTrigger,
  type SidebarContextValue,
  type SidebarMobileOpenChangeDetails,
  type SidebarOpenChangeDetails,
  type SidebarPersistenceStorage,
  useSidebarContext,
} from "@starwind-ui/vue/sidebar";
import SidebarDefault from "@starwind-ui/vue/sidebar";
import {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderLabel,
  SliderRoot as SliderSubpath,
  SliderThumb,
  SliderTrack,
  type SliderValue,
  type SliderValueChangeDetails,
  type SliderValueCommitDetails,
} from "@starwind-ui/vue/slider";
import SliderDefault from "@starwind-ui/vue/slider";
import {
  Switch,
  SwitchRoot as SwitchSubpath,
  SwitchThumb,
  type SwitchCheckedChangeDetails,
} from "@starwind-ui/vue/switch";
import SwitchDefault from "@starwind-ui/vue/switch";
import {
  Toggle,
  ToggleRoot as ToggleSubpath,
  type TogglePressedChangeDetails,
} from "@starwind-ui/vue/toggle";
import ToggleDefault from "@starwind-ui/vue/toggle";
import {
  ToggleGroup,
  ToggleGroupRoot as ToggleGroupSubpath,
  type ToggleGroupContextValue,
  type ToggleGroupValue,
  useToggleGroupContext,
} from "@starwind-ui/vue/toggle-group";
import ToggleGroupDefault from "@starwind-ui/vue/toggle-group";
import { Tooltip, TooltipRoot as TooltipSubpath, TooltipTrigger } from "@starwind-ui/vue/tooltip";
import TooltipDefault from "@starwind-ui/vue/tooltip";
import {
  getThemeInitScript,
  initThemeController,
  type ThemeInitScriptOptions,
} from "@starwind-ui/vue/theme";

const components: Component[] = [
  AccordionRoot,
  AccordionSubpath,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Accordion.Root,
  Accordion.Item,
  Accordion.Header,
  Accordion.Trigger,
  Accordion.Panel,
  AccordionDefault.Root,
  AlertDialogRoot,
  AlertDialogSubpath,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogViewport,
  AlertDialog.Root,
  AlertDialog.Portal,
  AlertDialogDefault.Root,
  AvatarRoot,
  AvatarSubpath,
  AvatarImage,
  AvatarFallback,
  Avatar.Root,
  Avatar.Image,
  Avatar.Fallback,
  AvatarDefault.Root,
  AvatarDefault.Image,
  AvatarDefault.Fallback,
  ButtonRoot,
  ButtonSubpath,
  Button.Root,
  ButtonDefault.Root,
  CarouselRoot,
  CarouselSubpath,
  CarouselContainer,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselViewport,
  Carousel.Root,
  CarouselDefault.Root,
  CheckboxRoot,
  CheckboxSubpath,
  CheckboxIndicator,
  Checkbox.Root,
  Checkbox.Indicator,
  CheckboxDefault.Root,
  CheckboxDefault.Indicator,
  CheckboxGroupRoot,
  CheckboxGroupSubpath,
  CheckboxGroup.Root,
  CheckboxGroupDefault.Root,
  CollapsibleRoot,
  CollapsibleSubpath,
  CollapsiblePanel,
  CollapsibleTrigger,
  Collapsible.Root,
  Collapsible.Trigger,
  Collapsible.Panel,
  CollapsibleDefault.Root,
  CollapsibleDefault.Trigger,
  ColorPickerRoot,
  ColorPickerSubpath,
  ColorPickerArea,
  ColorPickerAreaInput,
  ColorPickerChannelSlider,
  ColorPickerChannelSliderInput,
  ColorPickerHiddenInput,
  ColorPickerSwatch,
  ColorPicker.Root,
  ColorPickerDefault.Root,
  CollapsibleDefault.Panel,
  ComboboxSubpath,
  ComboboxInput,
  ComboboxItem,
  Combobox.Root,
  ComboboxDefault.Root,
  ContextMenuSubpath,
  ContextMenuTrigger,
  ContextMenuItem,
  ContextMenu.Root,
  ContextMenuDefault.Root,
  DialogRoot,
  DrawerRoot,
  DropzoneRoot,
  DropzoneSubpath,
  DropzoneFilesList,
  DropzoneInput,
  DropzoneLoadingIndicator,
  DropzoneUploadIndicator,
  Dropzone.Root,
  Dropzone.Input,
  DropzoneDefault.Root,
  FieldRoot,
  FieldSubpath,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldItem,
  FieldLabel,
  FieldValidity,
  Field.Root,
  Field.Control,
  Field.Description,
  Field.Error,
  Field.Item,
  Field.Label,
  Field.Validity,
  FieldDefault.Root,
  FieldDefault.Control,
  FieldDefault.Description,
  FieldDefault.Error,
  FieldDefault.Item,
  FieldDefault.Label,
  FieldDefault.Validity,
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerDescription,
  DrawerPopup,
  DrawerPortal,
  DrawerSubpath,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
  DrawerDefault.Root,
  DialogSubpath,
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
  Dialog.Root,
  Dialog.Backdrop,
  Dialog.Close,
  Dialog.Description,
  Dialog.Popup,
  Dialog.Title,
  Dialog.Trigger,
  DialogDefault.Root,
  DialogDefault.Backdrop,
  DialogDefault.Close,
  DialogDefault.Description,
  DialogDefault.Popup,
  DialogDefault.Title,
  DialogDefault.Trigger,
  FieldsetRoot,
  FieldsetSubpath,
  FieldsetLegend,
  Fieldset.Root,
  Fieldset.Legend,
  FieldsetDefault.Root,
  FieldsetDefault.Legend,
  FormRoot,
  FormSubpath,
  FormErrorSummary,
  Form.Root,
  Form.ErrorSummary,
  FormDefault.Root,
  FormDefault.ErrorSummary,
  InputRoot,
  InputSubpath,
  Input.Root,
  InputDefault.Root,
  InputOtpRoot,
  InputOtpSubpath,
  InputOtpGroup,
  InputOtpSeparator,
  InputOtpSlot,
  InputOtp.Root,
  InputOtp.Group,
  InputOtp.Separator,
  InputOtp.Slot,
  InputOtpDefault.Root,
  InputOtpDefault.Group,
  InputOtpDefault.Separator,
  InputOtpDefault.Slot,
  MenuSubpath,
  MenuTrigger,
  MenuItem,
  Menu.Root,
  MenuDefault.Root,
  NavigationMenuSubpath,
  NavigationMenuTrigger,
  NavigationMenuItem,
  NavigationMenu.Root,
  NavigationMenuDefault.Root,
  ProgressRoot,
  ProgressSubpath,
  ProgressTrack,
  ProgressIndicator,
  ProgressValuePart,
  ProgressLabel,
  Progress.Root,
  Progress.Track,
  Progress.Indicator,
  Progress.Value,
  Progress.Label,
  ProgressDefault.Root,
  ProgressDefault.Track,
  ProgressDefault.Indicator,
  ProgressDefault.Value,
  ProgressDefault.Label,
  PopoverRoot,
  PopoverSubpath,
  PopoverArrow,
  PopoverBackdrop,
  PopoverClose,
  PopoverDescription,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverTitle,
  PopoverTrigger,
  PopoverViewport,
  Popover.Root,
  Popover.Arrow,
  Popover.Backdrop,
  Popover.Close,
  Popover.Description,
  Popover.Popup,
  Popover.Portal,
  Popover.Positioner,
  Popover.Title,
  Popover.Trigger,
  Popover.Viewport,
  PopoverDefault.Root,
  PopoverDefault.Arrow,
  PopoverDefault.Backdrop,
  PopoverDefault.Close,
  PopoverDefault.Description,
  PopoverDefault.Popup,
  PopoverDefault.Portal,
  PopoverDefault.Positioner,
  PopoverDefault.Title,
  PopoverDefault.Trigger,
  PopoverDefault.Viewport,
  PreviewCardSubpath,
  PreviewCardTrigger,
  PreviewCard.Root,
  PreviewCardDefault.Root,
  RadioRoot,
  RadioSubpath,
  RadioIndicator,
  Radio.Root,
  Radio.Indicator,
  RadioDefault.Root,
  RadioDefault.Indicator,
  RadioGroupRoot,
  RadioGroupSubpath,
  RadioGroup.Root,
  RadioGroupDefault.Root,
  ScrollAreaRoot,
  ScrollAreaSubpath,
  ScrollAreaViewport,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaCorner,
  ScrollArea.Root,
  ScrollArea.Viewport,
  ScrollArea.Content,
  ScrollArea.Scrollbar,
  ScrollArea.Thumb,
  ScrollArea.Corner,
  ScrollAreaDefault.Root,
  ScrollAreaDefault.Viewport,
  ScrollAreaDefault.Content,
  ScrollAreaDefault.Scrollbar,
  ScrollAreaDefault.Thumb,
  ScrollAreaDefault.Corner,
  SelectRoot,
  SelectSubpath,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectPortal,
  SelectPositioner,
  SelectPopup,
  SelectList,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
  SelectSeparator,
  SelectScrollUpArrow,
  SelectScrollDownArrow,
  Select.Root,
  Select.Label,
  Select.Trigger,
  Select.Value,
  Select.Icon,
  Select.Portal,
  Select.Positioner,
  Select.Popup,
  Select.List,
  Select.Group,
  Select.GroupLabel,
  Select.Item,
  Select.ItemText,
  Select.ItemIndicator,
  Select.Separator,
  Select.ScrollUpArrow,
  Select.ScrollDownArrow,
  SelectDefault.Root,
  SwitchRoot,
  SwitchSubpath,
  SwitchThumb,
  Switch.Root,
  Switch.Thumb,
  SwitchDefault.Root,
  SwitchDefault.Thumb,
  TabsRoot,
  TabsSubpath,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
  Tabs.Root,
  Tabs.Indicator,
  Tabs.List,
  Tabs.Panel,
  Tabs.Tab,
  TabsDefault.Root,
  TabsDefault.Indicator,
  TabsDefault.List,
  TabsDefault.Panel,
  TabsDefault.Tab,
  ToastRoot,
  ToastSubpath,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastTemplate,
  ToastTitle,
  ToastTitleText,
  ToastViewport,
  Toast.Root,
  Toast.Viewport,
  ToastDefault.Root,
  ToggleRoot,
  ToggleSubpath,
  Toggle.Root,
  ToggleDefault.Root,
  ToggleGroupRoot,
  ToggleGroupSubpath,
  ToggleGroup.Root,
  ToggleGroupDefault.Root,
  TooltipSubpath,
  TooltipTrigger,
  Tooltip.Root,
  TooltipDefault.Root,
  SelectDefault.Label,
  SelectDefault.Trigger,
  SelectDefault.Value,
  SelectDefault.Icon,
  SelectDefault.Portal,
  SelectDefault.Positioner,
  SelectDefault.Popup,
  SelectDefault.List,
  SelectDefault.Group,
  SelectDefault.GroupLabel,
  SelectDefault.Item,
  SelectDefault.ItemText,
  SelectDefault.ItemIndicator,
  SelectDefault.Separator,
  SelectDefault.ScrollUpArrow,
  SelectDefault.ScrollDownArrow,
  SidebarProvider,
  SidebarProviderSubpath,
  SidebarComponent,
  SidebarTrigger,
  SidebarRail,
  SidebarMenuButton,
  Sidebar.Provider,
  Sidebar.Sidebar,
  Sidebar.Trigger,
  Sidebar.Rail,
  Sidebar.MenuButton,
  SidebarDefault.Provider,
  SliderRoot,
  SliderSubpath,
  SliderControl,
  SliderIndicator,
  SliderLabel,
  SliderThumb,
  SliderTrack,
  Slider.Root,
  Slider.Control,
  Slider.Indicator,
  Slider.Label,
  Slider.Thumb,
  Slider.Track,
  SliderDefault.Root,
  SliderDefault.Control,
  SliderDefault.Indicator,
  SliderDefault.Label,
  SliderDefault.Thumb,
  SliderDefault.Track,
];
const context: SelectContextValue | undefined = undefined;
const sidebarContext = undefined as SidebarContextValue | undefined;
const sidebarOpenDetail = undefined as SidebarOpenChangeDetails | undefined;
const sidebarMobileOpenDetail = undefined as SidebarMobileOpenChangeDetails | undefined;
const sidebarStorage: SidebarPersistenceStorage = "localStorage";
const accordionValue: AccordionValue = "alpha";
const accordionDetail = undefined as AccordionValueChangeDetails | undefined;
const tabsOrientation: TabsOrientation = "horizontal";
const tabsValue: TabsValue = "account";
const tabsDetail = undefined as TabsValueChangeDetails | undefined;
const toastOptions: ToastOptions = { duration: 0, title: "Release toast" };
const toastPromiseOptions: ToastPromiseOptions<string> = {
  error: "Failed",
  loading: "Loading",
  success: "Loaded",
};
const themeOptions: ThemeInitScriptOptions = { defaultTheme: "system" };
const avatarStatus: AvatarImageLoadingStatus = "idle";
const formValidationTiming: FormValidationTiming = "submit";
const inputValue: InputValue = "release input";
const fieldInputValue: FieldInputValue = "release field";
const fieldInputDetail = undefined as FieldInputValueChangeDetails | undefined;
const inputOtpDetail = undefined as InputOtpValueChangeDetails | undefined;
const sliderValue: SliderValue = [20, 80];
const carouselOptions: CarouselOptions = { orientation: "horizontal" };
const carouselInstance = undefined as CarouselInstance | undefined;
const sliderChangeDetail = undefined as SliderValueChangeDetails | undefined;
const sliderCommitDetail = undefined as SliderValueCommitDetails | undefined;
const popoverCloseDetail = undefined as PopoverCloseCompleteDetails | undefined;
const popoverOpenDetail = undefined as PopoverOpenChangeDetails | undefined;
const avatarDetail: AvatarLoadingStatusChangeDetails = {
  previousStatus: avatarStatus,
  status: "loading",
};
const switchDetail = undefined as SwitchCheckedChangeDetails | undefined;
const toggleDetail = undefined as TogglePressedChangeDetails | undefined;
const toggleGroupContext = undefined as ToggleGroupContextValue | undefined;
const toggleGroupValue: ToggleGroupValue = ["alpha"];
const checkboxGroupContext = undefined as CheckboxGroupContextValue | undefined;
const checkboxGroupValue: CheckboxGroupValue = [];
const collapsibleDetail = undefined as CollapsibleOpenChangeDetails | undefined;
const colorPickerColor = undefined as ColorPickerColor | undefined;
const colorPickerFormat: ColorPickerFormat = "hex";
const colorPickerDetail = undefined as ColorPickerValueChangeDetails | undefined;
const dialogCloseDetail = undefined as DialogCloseCompleteDetails | undefined;
const dialogOpenDetail = undefined as DialogOpenChangeDetails | undefined;
const drawerCloseDetail = undefined as DrawerCloseCompleteDetails | undefined;
const drawerOpenDetail = undefined as DrawerOpenChangeDetails | undefined;
const dropzoneDetail = undefined as DropzoneFilesChangeDetails | undefined;
const alertDialogCloseDetail = undefined as AlertDialogCloseCompleteDetails | undefined;
const alertDialogOpenDetail = undefined as AlertDialogOpenChangeDetails | undefined;
const radioDetail = undefined as RadioCheckedChangeDetails | undefined;
const radioGroupContext = undefined as RadioGroupContextValue | undefined;
const radioGroupValue: RadioGroupValue = "alpha";

void components;
void accordionValue;
void accordionDetail;
void TabsContext;
void useTabsContext;
void tabsOrientation;
void tabsValue;
void tabsDetail;
void toastOptions;
void toastPromiseOptions;
void toast;
void context;
void sidebarContext;
void sidebarOpenDetail;
void sidebarMobileOpenDetail;
void sidebarStorage;
void useSidebarContext;
void avatarDetail;
void formValidationTiming;
void inputValue;
void fieldInputValue;
void fieldInputDetail;
void inputOtpDetail;
void sliderValue;
void carouselOptions;
void carouselInstance;
void createCarousel;
void sliderChangeDetail;
void sliderCommitDetail;
void popoverCloseDetail;
void popoverOpenDetail;
void switchDetail;
void toggleDetail;
void toggleGroupContext;
void toggleGroupValue;
void checkboxGroupContext;
void checkboxGroupValue;
void collapsibleDetail;
void colorPickerColor;
void colorPickerFormat;
void colorPickerDetail;
void createColorPickerInitialState;
void parseColor;
void projectColorPickerInitialPart;
void dialogCloseDetail;
void dialogOpenDetail;
void drawerCloseDetail;
void drawerOpenDetail;
void dropzoneDetail;
void alertDialogCloseDetail;
void alertDialogOpenDetail;
void radioDetail;
void radioGroupContext;
void radioGroupValue;
void useRadioGroupContext;
void useCheckboxGroupContext;
void useToggleGroupContext;
void getThemeInitScript(themeOptions);
void initThemeController;
