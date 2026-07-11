import { accordionRuntimeAdapterContract } from "./components/accordion.js";
import { alertDialogRuntimeAdapterContract } from "./components/alert-dialog.js";
import { avatarRuntimeAdapterContract } from "./components/avatar.js";
import { buttonRuntimeAdapterContract } from "./components/button.js";
import { carouselRuntimeAdapterContract } from "./components/carousel.js";
import { checkboxRuntimeAdapterContract } from "./components/checkbox.js";
import { checkboxGroupRuntimeAdapterContract } from "./components/checkbox-group.js";
import { collapsibleRuntimeAdapterContract } from "./components/collapsible.js";
import { comboboxRuntimeAdapterContract } from "./components/combobox.js";
import { contextMenuRuntimeAdapterContract } from "./components/context-menu.js";
import { dialogRuntimeAdapterContract } from "./components/dialog.js";
import { drawerRuntimeAdapterContract } from "./components/drawer.js";
import { dropzoneRuntimeAdapterContract } from "./components/dropzone.js";
import { fieldRuntimeAdapterContract } from "./components/field.js";
import { fieldsetRuntimeAdapterContract } from "./components/fieldset.js";
import { formRuntimeAdapterContract } from "./components/form.js";
import { inputRuntimeAdapterContract } from "./components/input.js";
import { inputOtpRuntimeAdapterContract } from "./components/input-otp.js";
import { menuRuntimeAdapterContract } from "./components/menu.js";
import { navigationMenuRuntimeAdapterContract } from "./components/navigation-menu.js";
import { popoverRuntimeAdapterContract } from "./components/popover.js";
import { previewCardRuntimeAdapterContract } from "./components/preview-card.js";
import { progressRuntimeAdapterContract } from "./components/progress.js";
import { radioRuntimeAdapterContract } from "./components/radio.js";
import { radioGroupRuntimeAdapterContract } from "./components/radio-group.js";
import { scrollAreaRuntimeAdapterContract } from "./components/scroll-area.js";
import { selectRuntimeAdapterContract } from "./components/select.js";
import { sidebarRuntimeAdapterContract } from "./components/sidebar.js";
import { sliderRuntimeAdapterContract } from "./components/slider.js";
import { switchRuntimeAdapterContract } from "./components/switch.js";
import { tabsRuntimeAdapterContract } from "./components/tabs.js";
import { toastRuntimeAdapterContract } from "./components/toast.js";
import { toggleRuntimeAdapterContract } from "./components/toggle.js";
import { toggleGroupRuntimeAdapterContract } from "./components/toggle-group.js";
import { tooltipRuntimeAdapterContract } from "./components/tooltip.js";
import type { RuntimeAdapterContract } from "./types.js";

export {
  accordionRuntimeAdapterContract,
  alertDialogRuntimeAdapterContract,
  avatarRuntimeAdapterContract,
  buttonRuntimeAdapterContract,
  carouselRuntimeAdapterContract,
  checkboxGroupRuntimeAdapterContract,
  checkboxRuntimeAdapterContract,
  collapsibleRuntimeAdapterContract,
  comboboxRuntimeAdapterContract,
  contextMenuRuntimeAdapterContract,
  dialogRuntimeAdapterContract,
  drawerRuntimeAdapterContract,
  dropzoneRuntimeAdapterContract,
  fieldRuntimeAdapterContract,
  fieldsetRuntimeAdapterContract,
  formRuntimeAdapterContract,
  inputOtpRuntimeAdapterContract,
  inputRuntimeAdapterContract,
  menuRuntimeAdapterContract,
  navigationMenuRuntimeAdapterContract,
  popoverRuntimeAdapterContract,
  previewCardRuntimeAdapterContract,
  progressRuntimeAdapterContract,
  radioGroupRuntimeAdapterContract,
  radioRuntimeAdapterContract,
  scrollAreaRuntimeAdapterContract,
  selectRuntimeAdapterContract,
  sidebarRuntimeAdapterContract,
  sliderRuntimeAdapterContract,
  switchRuntimeAdapterContract,
  tabsRuntimeAdapterContract,
  toastRuntimeAdapterContract,
  toggleGroupRuntimeAdapterContract,
  toggleRuntimeAdapterContract,
  tooltipRuntimeAdapterContract,
};

export const runtimeAdapterContracts = [
  buttonRuntimeAdapterContract,
  carouselRuntimeAdapterContract,
  toggleRuntimeAdapterContract,
  fieldRuntimeAdapterContract,
  fieldsetRuntimeAdapterContract,
  formRuntimeAdapterContract,
  inputRuntimeAdapterContract,
  switchRuntimeAdapterContract,
  checkboxRuntimeAdapterContract,
  radioRuntimeAdapterContract,
  sliderRuntimeAdapterContract,
  collapsibleRuntimeAdapterContract,
  toggleGroupRuntimeAdapterContract,
  radioGroupRuntimeAdapterContract,
  checkboxGroupRuntimeAdapterContract,
  tabsRuntimeAdapterContract,
  accordionRuntimeAdapterContract,
  avatarRuntimeAdapterContract,
  progressRuntimeAdapterContract,
  scrollAreaRuntimeAdapterContract,
  inputOtpRuntimeAdapterContract,
  tooltipRuntimeAdapterContract,
  popoverRuntimeAdapterContract,
  previewCardRuntimeAdapterContract,
  dialogRuntimeAdapterContract,
  alertDialogRuntimeAdapterContract,
  drawerRuntimeAdapterContract,
  dropzoneRuntimeAdapterContract,
  menuRuntimeAdapterContract,
  navigationMenuRuntimeAdapterContract,
  contextMenuRuntimeAdapterContract,
  selectRuntimeAdapterContract,
  sidebarRuntimeAdapterContract,
  comboboxRuntimeAdapterContract,
  toastRuntimeAdapterContract,
] as const satisfies readonly RuntimeAdapterContract[];

export const representativeRuntimeAdapterContracts = runtimeAdapterContracts;
