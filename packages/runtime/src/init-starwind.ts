import { createAccordion } from "./components/accordion";
import { createAlertDialog } from "./components/alert-dialog";
import { createAvatar } from "./components/avatar";
import { createButton } from "./components/button";
import { createCarousel } from "./components/carousel";
import { createCheckbox } from "./components/checkbox";
import { createCheckboxGroup } from "./components/checkbox-group";
import { createCollapsible } from "./components/collapsible";
import { createColorPicker } from "./components/color-picker";
import { createCombobox } from "./components/combobox";
import { createContextMenu } from "./components/context-menu";
import { createDialog } from "./components/dialog";
import { createDrawer } from "./components/drawer";
import { createDropzone } from "./components/dropzone";
import { createField } from "./components/field";
import { createFieldset } from "./components/fieldset";
import { createForm } from "./components/form";
import { createInput } from "./components/input";
import { createInputOtp } from "./components/input-otp";
import { createMenu } from "./components/menu";
import { createNavigationMenu } from "./components/navigation-menu";
import { createPopover } from "./components/popover";
import { createPreviewCard } from "./components/preview-card";
import { createProgress } from "./components/progress";
import { createRadio } from "./components/radio";
import { createRadioGroup } from "./components/radio-group";
import { createScrollArea } from "./components/scroll-area";
import { createSelect } from "./components/select";
import { initSidebarController } from "./components/sidebar";
import { createSlider } from "./components/slider";
import { createSwitch } from "./components/switch";
import { createTabs } from "./components/tabs";
import { createToastManager } from "./components/toast";
import { createToggle } from "./components/toggle";
import { createToggleGroup } from "./components/toggle-group";
import { createTooltip } from "./components/tooltip";
import { readBooleanAttribute } from "./internal/dom";
import { initThemeController } from "./theme/theme";

export type StarwindCleanup = {
  destroy(): void;
};

type StarwindInitializerEntry = {
  cleanupOrder: number;
  create: (element: HTMLElement, root: ParentNode) => StarwindCleanup | null;
  once?: boolean;
  selector: string;
};

type InitializedRuntimeController = {
  cleanupOrder: number;
  instance: StarwindCleanup;
  sequence: number;
};

const initializerEntries = [
  {
    cleanupOrder: 32,
    create: (_element, root) => initThemeController(root),
    once: true,
    selector: "[data-sw-theme-control], [data-sw-theme-toggle]",
  },
  {
    cleanupOrder: 16,
    create: (_element, root) => initSidebarController(root),
    once: true,
    selector: "[data-sw-sidebar-provider]",
  },
  {
    cleanupOrder: 0,
    create: (buttonRoot) =>
      buttonRoot instanceof HTMLButtonElement &&
      readBooleanAttribute(buttonRoot, "data-focusable-when-disabled", false)
        ? createButton(buttonRoot)
        : null,
    selector: "[data-sw-button][data-focusable-when-disabled]",
  },
  {
    cleanupOrder: 1,
    create: (formRoot) => createForm(formRoot),
    selector: "[data-sw-form]",
  },
  {
    cleanupOrder: 2,
    create: (fieldsetRoot) => createFieldset(fieldsetRoot),
    selector: "[data-sw-fieldset]",
  },
  {
    cleanupOrder: 2,
    create: (fieldRoot) => createField(fieldRoot),
    selector: "[data-sw-field]",
  },
  {
    cleanupOrder: 3,
    create: (inputRoot) => createInput(inputRoot),
    selector: "[data-sw-input]",
  },
  {
    cleanupOrder: 4,
    create: (inputOtpRoot) => createInputOtp(inputOtpRoot),
    selector: "[data-sw-input-otp]",
  },
  {
    cleanupOrder: 5,
    create: (sliderRoot) => createSlider(sliderRoot),
    selector: "[data-sw-slider]",
  },
  {
    cleanupOrder: 5,
    create: (colorPickerRoot) => createColorPicker(colorPickerRoot),
    selector: "[data-sw-color-picker]",
  },
  {
    cleanupOrder: 6,
    create: (switchRoot) => createSwitch(switchRoot),
    selector: "[data-sw-switch]",
  },
  {
    cleanupOrder: 6,
    create: (tabsRoot) => createTabs(tabsRoot),
    selector: "[data-sw-tabs]",
  },
  {
    cleanupOrder: 7,
    create: (toggleGroupRoot) => createToggleGroup(toggleGroupRoot),
    selector: "[data-sw-toggle-group]",
  },
  {
    cleanupOrder: 8,
    create: (toggleRoot) =>
      toggleRoot.hasAttribute("data-sw-theme-toggle") ? null : createToggle(toggleRoot),
    selector: "[data-sw-toggle]",
  },
  {
    cleanupOrder: 9,
    create: (avatarRoot) => createAvatar(avatarRoot),
    selector: "[data-sw-avatar]",
  },
  {
    cleanupOrder: 10,
    create: (checkboxGroupRoot) => createCheckboxGroup(checkboxGroupRoot),
    selector: "[data-sw-checkbox-group]",
  },
  {
    cleanupOrder: 11,
    create: (checkboxRoot) => createCheckbox(checkboxRoot),
    selector: "[data-sw-checkbox]",
  },
  {
    cleanupOrder: 12,
    create: (radioGroupRoot) => createRadioGroup(radioGroupRoot),
    selector: "[data-sw-radio-group]",
  },
  {
    cleanupOrder: 13,
    create: (radioRoot) => createRadio(radioRoot),
    selector: "[data-sw-radio]",
  },
  {
    cleanupOrder: 14,
    create: (scrollAreaRoot) => createScrollArea(scrollAreaRoot),
    selector: "[data-sw-scroll-area]",
  },
  {
    cleanupOrder: 15,
    create: (selectRoot) => createSelect(selectRoot),
    selector: "[data-sw-select]",
  },
  {
    cleanupOrder: 17,
    create: (comboboxRoot) => createCombobox(comboboxRoot),
    selector: "[data-sw-combobox]",
  },
  {
    cleanupOrder: 18,
    create: (accordionRoot) => createAccordion(accordionRoot),
    selector: "[data-sw-accordion]",
  },
  {
    cleanupOrder: 19,
    create: (collapsibleRoot) => createCollapsible(collapsibleRoot),
    selector: "[data-sw-collapsible]",
  },
  {
    cleanupOrder: 20,
    create: (dialogRoot) => createDialog(dialogRoot),
    selector: "[data-sw-dialog]",
  },
  {
    cleanupOrder: 21,
    create: (alertDialogRoot) => createAlertDialog(alertDialogRoot),
    selector: "[data-sw-alert-dialog]",
  },
  {
    cleanupOrder: 22,
    create: (drawerRoot) => createDrawer(drawerRoot),
    selector: "[data-sw-drawer]",
  },
  {
    cleanupOrder: 23,
    create: (dropzoneRoot) => createDropzone(dropzoneRoot),
    selector: "[data-sw-dropzone]",
  },
  {
    cleanupOrder: 24,
    create: (carouselRoot) =>
      carouselRoot.getAttribute("data-auto-init") === "false" ? null : createCarousel(carouselRoot),
    selector: "[data-sw-carousel]",
  },
  {
    cleanupOrder: 25,
    create: (contextMenuRoot) => createContextMenu(contextMenuRoot),
    selector: "[data-sw-context-menu]",
  },
  {
    cleanupOrder: 26,
    create: (menuRoot) =>
      menuRoot.hasAttribute("data-sw-context-menu") ? null : createMenu(menuRoot),
    selector: "[data-sw-menu]",
  },
  {
    cleanupOrder: 27,
    create: (navigationMenuRoot) => createNavigationMenu(navigationMenuRoot),
    selector: "[data-sw-nav-menu]",
  },
  {
    cleanupOrder: 27,
    create: (popoverRoot) => createPopover(popoverRoot),
    selector: "[data-sw-popover]",
  },
  {
    cleanupOrder: 28,
    create: (previewCardRoot) => createPreviewCard(previewCardRoot),
    selector: "[data-sw-preview-card]",
  },
  {
    cleanupOrder: 29,
    create: (progressRoot) => createProgress(progressRoot),
    selector: "[data-sw-progress]",
  },
  {
    cleanupOrder: 30,
    create: (tooltipRoot) => createTooltip(tooltipRoot),
    selector: "[data-sw-tooltip]",
  },
  {
    cleanupOrder: 31,
    create: (toastViewport) => createToastManager(toastViewport),
    selector: "[data-sw-toast-viewport]",
  },
] satisfies StarwindInitializerEntry[];

const initializerSelector = initializerEntries.map((entry) => entry.selector).join(", ");

export function initStarwind(root: ParentNode = document): StarwindCleanup {
  const initializedControllers = initializeRuntimeControllers(root);

  return {
    destroy() {
      [...initializedControllers]
        .sort((a, b) => a.cleanupOrder - b.cleanupOrder || a.sequence - b.sequence)
        .forEach((controller) => controller.instance.destroy());
    },
  };
}

function initializeRuntimeControllers(root: ParentNode): InitializedRuntimeController[] {
  const initializedControllers: InitializedRuntimeController[] = [];
  const initializedOnceEntries = new Set<StarwindInitializerEntry>();
  const candidates = Array.from(root.querySelectorAll<HTMLElement>(initializerSelector));

  initializerEntries.forEach((entry) => {
    candidates.forEach((candidate) => {
      if (entry.once && initializedOnceEntries.has(entry)) return;
      if (!candidate.matches(entry.selector)) return;

      const instance = entry.create(candidate, root);
      if (entry.once) initializedOnceEntries.add(entry);
      if (!instance) return;

      initializedControllers.push({
        cleanupOrder: entry.cleanupOrder,
        instance,
        sequence: initializedControllers.length,
      });
    });
  });

  return initializedControllers;
}
