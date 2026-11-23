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
  ToggleGroupRoot,
  ToggleRoot,
} from "@starwind-ui/vue";
import AccordionDefault, {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionRoot as AccordionSubpath,
  AccordionTrigger,
  type AccordionValue,
  type AccordionValueChangeDetails,
} from "@starwind-ui/vue/accordion";
import AlertDialogDefault, {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  type AlertDialogCloseCompleteDetails,
  AlertDialogDescription,
  type AlertDialogOpenChangeDetails,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogRoot as AlertDialogSubpath,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogViewport,
} from "@starwind-ui/vue/alert-dialog";
import AvatarDefault, {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarImageLoadingStatus,
  type AvatarLoadingStatusChangeDetails,
  AvatarRoot as AvatarSubpath,
} from "@starwind-ui/vue/avatar";
import ButtonDefault, { Button, ButtonRoot as ButtonSubpath } from "@starwind-ui/vue/button";
import CarouselDefault, {
  Carousel,
  CarouselContainer,
  type CarouselInstance,
  CarouselItem,
  CarouselNext,
  type CarouselOptions,
  CarouselPrevious,
  CarouselRoot as CarouselSubpath,
  CarouselViewport,
  createCarousel,
} from "@starwind-ui/vue/carousel";
import CheckboxDefault, {
  Checkbox,
  CheckboxIndicator,
  CheckboxRoot as CheckboxSubpath,
} from "@starwind-ui/vue/checkbox";
import CheckboxGroupDefault, {
  CheckboxGroup,
  type CheckboxGroupContextValue,
  CheckboxGroupRoot as CheckboxGroupSubpath,
  type CheckboxGroupValue,
  useCheckboxGroupContext,
} from "@starwind-ui/vue/checkbox-group";
import CollapsibleDefault, {
  Collapsible,
  type CollapsibleOpenChangeDetails,
  CollapsiblePanel,
  CollapsibleRoot as CollapsibleSubpath,
  CollapsibleTrigger,
} from "@starwind-ui/vue/collapsible";
import ColorPickerDefault, {
  ColorPicker,
  ColorPickerArea,
  ColorPickerAreaInput,
  ColorPickerChannelSlider,
  ColorPickerChannelSliderInput,
  type ColorPickerColor,
  type ColorPickerFormat,
  ColorPickerHiddenInput,
  ColorPickerRoot as ColorPickerSubpath,
  ColorPickerSwatch,
  type ColorPickerValueChangeDetails,
  createColorPickerInitialState,
  parseColor,
  projectColorPickerInitialPart,
} from "@starwind-ui/vue/color-picker";
import ComboboxDefault, {
  Combobox,
  ComboboxInput,
  ComboboxItem,
  ComboboxRoot as ComboboxSubpath,
} from "@starwind-ui/vue/combobox";
import ContextMenuDefault, {
  ContextMenu,
  ContextMenuItem,
  ContextMenuRoot as ContextMenuSubpath,
  ContextMenuTrigger,
} from "@starwind-ui/vue/context-menu";
import DialogDefault, {
  Dialog,
  DialogBackdrop,
  DialogClose,
  type DialogCloseCompleteDetails,
  DialogDescription,
  type DialogOpenChangeDetails,
  DialogPopup,
  DialogRoot as DialogSubpath,
  DialogTitle,
  DialogTrigger,
} from "@starwind-ui/vue/dialog";
import DrawerDefault, {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  type DrawerCloseCompleteDetails,
  DrawerDescription,
  type DrawerOpenChangeDetails,
  DrawerPopup,
  DrawerPortal,
  DrawerRoot as DrawerSubpath,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
} from "@starwind-ui/vue/drawer";
import DropzoneDefault, {
  Dropzone,
  type DropzoneFilesChangeDetails,
  DropzoneFilesList,
  DropzoneInput,
  DropzoneLoadingIndicator,
  DropzoneRoot as DropzoneSubpath,
  DropzoneUploadIndicator,
} from "@starwind-ui/vue/dropzone";
import FieldDefault, {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  type InputValue as FieldInputValue,
  type InputValueChangeDetails as FieldInputValueChangeDetails,
  FieldItem,
  FieldLabel,
  FieldRoot as FieldSubpath,
  FieldValidity,
} from "@starwind-ui/vue/field";
import FieldsetDefault, {
  Fieldset,
  FieldsetLegend,
  FieldsetRoot as FieldsetSubpath,
} from "@starwind-ui/vue/fieldset";
import FormDefault, {
  Form,
  FormErrorSummary,
  FormRoot as FormSubpath,
  type FormValidationTiming,
} from "@starwind-ui/vue/form";
import InputDefault, {
  Input,
  InputRoot as InputSubpath,
  type InputValue,
} from "@starwind-ui/vue/input";
import InputOtpDefault, {
  InputOtp,
  InputOtpGroup,
  InputOtpSeparator,
  InputOtpSlot,
  InputOtpRoot as InputOtpSubpath,
  type InputOtpValueChangeDetails,
} from "@starwind-ui/vue/input-otp";
import MenuDefault, {
  Menu,
  MenuItem,
  MenuRoot as MenuSubpath,
  MenuTrigger,
} from "@starwind-ui/vue/menu";
import NavigationMenuDefault, {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuRoot as NavigationMenuSubpath,
  NavigationMenuTrigger,
} from "@starwind-ui/vue/navigation-menu";
import PopoverDefault, {
  Popover,
  PopoverArrow,
  PopoverBackdrop,
  PopoverClose,
  type PopoverCloseCompleteDetails,
  PopoverDescription,
  type PopoverOpenChangeDetails,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverRoot as PopoverSubpath,
  PopoverTitle,
  PopoverTrigger,
  PopoverViewport,
} from "@starwind-ui/vue/popover";
import PreviewCardDefault, {
  PreviewCard,
  PreviewCardRoot as PreviewCardSubpath,
  PreviewCardTrigger,
} from "@starwind-ui/vue/preview-card";
import ProgressDefault, {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressRoot as ProgressSubpath,
  ProgressTrack,
  ProgressValue as ProgressValuePart,
} from "@starwind-ui/vue/progress";
import RadioDefault, {
  Radio,
  type RadioCheckedChangeDetails,
  RadioIndicator,
  RadioRoot as RadioSubpath,
} from "@starwind-ui/vue/radio";
import RadioGroupDefault, {
  RadioGroup,
  type RadioGroupContextValue,
  RadioGroupRoot as RadioGroupSubpath,
  type RadioGroupValue,
  useRadioGroupContext,
} from "@starwind-ui/vue/radio-group";
import ScrollAreaDefault, {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaRoot as ScrollAreaSubpath,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@starwind-ui/vue/scroll-area";
import SelectDefault, {
  Select,
  type SelectContextValue,
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
  SelectScrollDownArrow,
  SelectScrollUpArrow,
  SelectSeparator,
  SelectRoot as SelectSubpath,
  SelectTrigger,
  SelectValue,
} from "@starwind-ui/vue/select";
import SidebarDefault, {
  Sidebar,
  SidebarComponent,
  type SidebarContextValue,
  SidebarMenuButton,
  type SidebarMobileOpenChangeDetails,
  type SidebarOpenChangeDetails,
  type SidebarPersistenceStorage,
  SidebarProvider as SidebarProviderSubpath,
  SidebarRail,
  SidebarTrigger,
  useSidebarContext,
} from "@starwind-ui/vue/sidebar";
import SliderDefault, {
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
import SwitchDefault, {
  Switch,
  type SwitchCheckedChangeDetails,
  SwitchRoot as SwitchSubpath,
  SwitchThumb,
} from "@starwind-ui/vue/switch";
import TabsDefault, {
  Tabs,
  TabsContext,
  TabsIndicator,
  TabsList,
  type TabsOrientation,
  TabsPanel,
  TabsRoot as TabsSubpath,
  TabsTab,
  type TabsValue,
  type TabsValueChangeDetails,
  useTabsContext,
} from "@starwind-ui/vue/tabs";
import {
  getThemeInitScript,
  initThemeController,
  type ThemeInitScriptOptions,
} from "@starwind-ui/vue/theme";
import ToastDefault, {
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  type ToastOptions,
  type ToastPromiseOptions,
  ToastRoot as ToastSubpath,
  ToastTemplate,
  ToastTitle,
  ToastTitleText,
  ToastViewport,
  toast,
} from "@starwind-ui/vue/toast";
import ToggleDefault, {
  Toggle,
  type TogglePressedChangeDetails,
  ToggleRoot as ToggleSubpath,
} from "@starwind-ui/vue/toggle";
import ToggleGroupDefault, {
  ToggleGroup,
  type ToggleGroupContextValue,
  ToggleGroupRoot as ToggleGroupSubpath,
  type ToggleGroupValue,
  useToggleGroupContext,
} from "@starwind-ui/vue/toggle-group";
import TooltipDefault, {
  Tooltip,
  TooltipRoot as TooltipSubpath,
  TooltipTrigger,
} from "@starwind-ui/vue/tooltip";
import type { Component } from "vue";

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

// Public context types carry state only. Runtime wiring stays internal to the parts.
declare const publicSelectContext: SelectContextValue;
declare const publicComboboxContext: import("@starwind-ui/vue/combobox").ComboboxContextValue;
declare const publicTabsContext: ReturnType<typeof useTabsContext>;
void publicSelectContext.selectedLabel;
void publicComboboxContext.inputValue;
void publicTabsContext.orientation;
// @ts-expect-error Select keeps registerPortal internal.
void publicSelectContext.registerPortal;
// @ts-expect-error Select keeps requestRefresh internal.
void publicSelectContext.requestRefresh;
// @ts-expect-error Select keeps mounted internal.
void publicSelectContext.mounted;
// @ts-expect-error Select keeps its root element internal.
void publicSelectContext.element;
// @ts-expect-error Combobox keeps registerPortal internal.
void publicComboboxContext.registerPortal;
// @ts-expect-error Combobox keeps mounted internal.
void publicComboboxContext.mounted;
// @ts-expect-error Combobox keeps its root element internal.
void publicComboboxContext.element;
// @ts-expect-error Tabs keeps refresh internal.
void publicTabsContext.refresh;
