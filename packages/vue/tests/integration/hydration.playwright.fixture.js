import { createSSRApp, defineComponent, h, nextTick, ref } from "vue";

import { AvatarFallback, AvatarImage, AvatarRoot } from "/vue/avatar/index.js";
import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionRoot,
  AccordionTrigger,
} from "/vue/accordion/index.js";
import {
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogViewport,
} from "/vue/alert-dialog/index.js";
import { ButtonRoot } from "/vue/button/index.js";
import { CheckboxIndicator, CheckboxRoot } from "/vue/checkbox/index.js";
import { CheckboxGroupRoot } from "/vue/checkbox-group/index.js";
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "/vue/dialog/index.js";
import {
  DrawerBackdrop,
  DrawerClose,
  DrawerDescription,
  DrawerPopup,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
} from "/vue/drawer/index.js";
import { InputRoot } from "/vue/input/index.js";
import {
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldRoot,
  FieldValidity,
} from "/vue/field/index.js";
import {
  InputOtpGroup,
  InputOtpRoot,
  InputOtpSeparator,
  InputOtpSlot,
} from "/vue/input-otp/index.js";
import {
  ProgressIndicator,
  ProgressLabel,
  ProgressRoot,
  ProgressTrack,
  ProgressValue,
} from "/vue/progress/index.js";
import {
  PopoverClose,
  PopoverDescription,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from "/vue/popover/index.js";
import { RadioGroupRoot } from "/vue/radio-group/index.js";
import { RadioRoot } from "/vue/radio/index.js";
import { SwitchRoot } from "/vue/switch/index.js";
import { SwitchThumb } from "/vue/switch/index.js";
import { ToggleGroupRoot } from "/vue/toggle-group/index.js";
import { ToggleRoot } from "/vue/toggle/index.js";
import {
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "/vue/scroll-area/index.js";
import {
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "/vue/select/index.js";
import {
  SliderControl,
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from "/vue/slider/index.js";
import { TabsIndicator, TabsList, TabsPanel, TabsRoot, TabsTab } from "/vue/tabs/index.js";
import {
  DropzoneFilesList,
  DropzoneInput,
  DropzoneLoadingIndicator,
  DropzoneRoot,
  DropzoneUploadIndicator,
} from "/vue/dropzone/index.js";

export async function runHydrationChecks() {
  const host = document.querySelector("#hydration-host");
  const overlays = document.querySelector("#hydration-overlays");
  assert(host, "hydration host is missing");
  assert(overlays, "hydration overlay owner is missing");
  assert(host.querySelectorAll("[data-sw-button]").length === 1, "SSR duplicated Button");
  assert(
    host.querySelectorAll("[data-sw-checkbox]").length === 3,
    `SSR Checkbox count was ${host.querySelectorAll("[data-sw-checkbox]").length}`,
  );
  assert(
    host.querySelectorAll("[data-sw-checkbox-group]").length === 1,
    "SSR duplicated Checkbox Group",
  );
  assert(
    host.querySelectorAll("[data-sw-input]").length === 2,
    "SSR Input and FieldControl inventory drifted",
  );
  assert(host.querySelectorAll("[data-sw-radio]").length === 2, "SSR duplicated Radio");
  assert(host.querySelectorAll("[data-sw-radio-group]").length === 1, "SSR duplicated Radio Group");
  assert(host.querySelectorAll("[data-sw-switch]").length === 1, "SSR duplicated Switch");
  assert(host.querySelectorAll("[data-sw-toggle]").length === 2, "SSR duplicated Toggle");
  assert(
    host.querySelectorAll("[data-sw-toggle-group]").length === 1,
    "SSR duplicated Toggle Group",
  );
  assert(host.querySelectorAll("[data-sw-avatar]").length === 1, "SSR duplicated Avatar");
  assert(host.querySelectorAll("[data-sw-progress]").length === 1, "SSR duplicated Progress");
  assert(host.querySelectorAll("[data-sw-scroll-area]").length === 1, "SSR duplicated Scroll Area");
  assert(host.querySelectorAll("[data-sw-select]").length === 1, "SSR duplicated Select");
  assert(host.querySelectorAll("[data-sw-dialog]").length === 1, "SSR duplicated Dialog");
  assert(host.querySelectorAll("[data-sw-drawer]").length === 1, "SSR duplicated Drawer");
  assert(host.querySelectorAll("[data-sw-popover]").length === 1, "SSR duplicated Popover");
  assert(
    host.querySelectorAll("[data-sw-alert-dialog]").length === 1,
    "SSR duplicated Alert Dialog",
  );
  assert(host.querySelectorAll("[data-sw-accordion]").length === 1, "SSR duplicated Accordion");
  assert(host.querySelectorAll("[data-sw-tabs]").length === 1, "SSR duplicated Tabs");
  assert(host.querySelectorAll("[data-sw-field]").length === 1, "SSR duplicated Field");
  assert(host.querySelectorAll("[data-sw-slider]").length === 1, "SSR duplicated Slider");
  assert(host.querySelectorAll("[data-sw-slider-thumb]").length === 2, "SSR Slider thumb drift");
  assert(host.querySelectorAll("[data-sw-input-otp]").length === 1, "SSR duplicated Input OTP");
  assert(
    host.querySelectorAll("[data-sw-input-otp-input]").length === 1,
    "SSR duplicated Input OTP native input",
  );
  assert(host.querySelectorAll("[data-sw-dropzone]").length === 1, "SSR duplicated Dropzone");
  assert(
    host.querySelectorAll("[data-sw-dropzone-input]").length === 1,
    "SSR duplicated Dropzone native input",
  );
  assert(
    host.querySelectorAll("[data-sw-select-portal]").length === 1,
    "SSR portal content was not deterministic and inline",
  );
  assert(
    host.querySelectorAll("[data-sw-alert-dialog-portal]").length === 1,
    "SSR Alert Dialog portal was not deterministic and inline",
  );
  assert(
    host.querySelectorAll("[data-sw-popover-portal]").length === 1,
    "SSR Popover portal was not deterministic and inline",
  );
  assert(overlays.children.length === 0, "SSR moved portal content before hydration");

  const resources = trackFixtureResources(
    (target) =>
      target === host || target === overlays || host.contains(target) || overlays.contains(target),
  );

  let buttonClicks = 0;
  const warnings = [];
  const app = createSSRApp({
    render: () => renderFixture(() => (buttonClicks += 1)),
  });
  app.config.warnHandler = (message) => warnings.push(message);

  try {
    app.mount(host);
    await frame();

    assert(warnings.length === 0, `hydration warned: ${warnings.join(" | ")}`);
    assert(host.querySelectorAll("[data-sw-button]").length === 1, "hydration duplicated Button");
    assert(
      host.querySelectorAll("[data-sw-checkbox]").length === 3,
      "hydration duplicated Checkbox",
    );
    assert(
      host.querySelectorAll("[data-sw-checkbox-group]").length === 1,
      "hydration duplicated Checkbox Group",
    );
    assert(
      host.querySelectorAll("[data-sw-input]").length === 2,
      "hydration Input and FieldControl inventory drifted",
    );
    assert(host.querySelectorAll("[data-sw-radio]").length === 2, "hydration duplicated Radio");
    assert(
      host.querySelectorAll("[data-sw-radio-group]").length === 1,
      "hydration duplicated Radio Group",
    );
    assert(host.querySelectorAll("[data-sw-switch]").length === 1, "hydration duplicated Switch");
    assert(host.querySelectorAll("[data-sw-toggle]").length === 2, "hydration duplicated Toggle");
    assert(
      host.querySelectorAll("[data-sw-toggle-group]").length === 1,
      "hydration duplicated Toggle Group",
    );
    assert(host.querySelectorAll("[data-sw-select]").length === 1, "hydration duplicated Select");
    assert(host.querySelectorAll("[data-sw-dialog]").length === 1, "hydration duplicated Dialog");
    assert(host.querySelectorAll("[data-sw-drawer]").length === 1, "hydration duplicated Drawer");
    assert(host.querySelectorAll("[data-sw-popover]").length === 1, "hydration duplicated Popover");
    assert(
      host.querySelectorAll("[data-sw-alert-dialog]").length === 1,
      "hydration duplicated Alert Dialog",
    );
    assert(host.querySelectorAll("[data-sw-avatar]").length === 1, "hydration duplicated Avatar");
    assert(
      host.querySelectorAll("[data-sw-progress]").length === 1,
      "hydration duplicated Progress",
    );
    assert(
      host.querySelectorAll("[data-sw-scroll-area]").length === 1,
      "hydration duplicated Scroll Area",
    );
    assert(
      host.querySelectorAll("[data-sw-accordion]").length === 1,
      "hydration duplicated Accordion",
    );
    assert(host.querySelectorAll("[data-sw-tabs]").length === 1, "hydration duplicated Tabs");
    assert(host.querySelectorAll("[data-sw-field]").length === 1, "hydration duplicated Field");
    assert(host.querySelectorAll("[data-sw-slider]").length === 1, "hydration duplicated Slider");
    assert(
      host.querySelectorAll("[data-sw-input-otp]").length === 1,
      "hydration duplicated Input OTP",
    );
    assert(
      host.querySelectorAll("[data-sw-input-otp-input]").length === 1,
      "hydration duplicated Input OTP native input",
    );
    assert(
      host.querySelectorAll("[data-sw-dropzone]").length === 1,
      "hydration duplicated Dropzone",
    );
    assert(
      host.querySelectorAll("[data-sw-dropzone-input]").length === 1,
      "hydration duplicated Dropzone native input",
    );
    assert(
      host.querySelectorAll("[data-sw-select-portal]").length === 0,
      "hydration left Select portal content under its source owner",
    );
    assert(
      overlays.querySelectorAll(":scope > [data-sw-select-portal]").length === 1,
      "hydration did not move Select portal content to its declared owner",
    );
    assert(
      host.querySelectorAll("[data-sw-alert-dialog-portal]").length === 0,
      "hydration left Alert Dialog portal under its source owner",
    );
    assert(
      overlays.querySelectorAll(":scope > [data-sw-alert-dialog-portal]").length === 1,
      "hydration did not move Alert Dialog portal to its declared owner",
    );
    assert(
      host.querySelectorAll("[data-sw-popover-portal]").length === 0,
      "hydration left Popover portal under its source owner",
    );
    assert(
      overlays.querySelectorAll(":scope > [data-sw-popover-portal]").length === 1,
      "hydration did not move Popover portal to its declared owner",
    );

    host.querySelector("#hydrated-button").click();
    assert(buttonClicks === 1, `Button listener fired ${buttonClicks} times after hydration`);

    const input = host.querySelector("#hydrated-input");
    assert(input instanceof HTMLInputElement, "Input is missing after hydration");
    input.value = "accepted hydration";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await frame();
    assert(
      host.querySelector("#hydrated-input-state")?.textContent === "accepted hydration",
      "Input did not publish its accepted model",
    );

    const switchRoot = host.querySelector("[data-sw-switch]");
    assert(switchRoot instanceof HTMLElement, "Switch is missing after hydration");
    switchRoot.click();
    await frame();
    assert(switchRoot.getAttribute("aria-checked") === "true", "Switch did not accept activation");
    assert(
      host.querySelector("#hydrated-switch-state")?.textContent === "checked:true, updates:1",
      "Switch did not publish its accepted model",
    );
    host.querySelector("#cancel-hydrated-switch")?.dispatchEvent(new MouseEvent("click"));
    switchRoot.click();
    await frame();
    assert(switchRoot.getAttribute("aria-checked") === "true", "Switch changed after cancellation");
    assert(
      host.querySelector("#hydrated-switch-state")?.textContent === "checked:true, updates:1",
      "Switch published a canceled model update",
    );

    host.querySelector("#hydrated-accordion-beta")?.click();
    await frame();
    assert(
      host.querySelector("#hydrated-accordion-state")?.textContent === "beta",
      "Accordion did not publish its hydrated value",
    );
    assert(
      !host.querySelector('[data-sw-accordion-panel][data-value="beta"]')?.hidden,
      "Accordion panel did not become present",
    );

    const accountTab = host.querySelector("#hydrated-tabs-account");
    const passwordTab = host.querySelector("#hydrated-tabs-password");
    assert(accountTab instanceof HTMLElement, "Tabs account tab is missing");
    assert(passwordTab instanceof HTMLElement, "Tabs password tab is missing");
    accountTab.focus();
    accountTab.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    await frame();
    assert(document.activeElement === passwordTab, "Tabs keyboard focus did not advance");
    passwordTab.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    await frame();
    assert(
      host.querySelector("#hydrated-tabs-state")?.textContent === "password",
      "Tabs manual keyboard activation did not publish its value",
    );
    assert(
      !host.querySelector('[data-sw-tabs-panel][data-value="password"]')?.hidden,
      "Tabs panel did not become present",
    );

    const fieldControl = host.querySelector("#hydrated-field-control");
    const fieldForm = host.querySelector("#hydrated-field-form");
    const fieldError = host.querySelector('[data-sw-field-error][data-match="valueMissing"]');
    const fieldValidity = host.querySelector('[data-sw-field-validity][data-match="valid"]');
    assert(fieldControl instanceof HTMLInputElement, "Field control is missing");
    assert(fieldForm instanceof HTMLFormElement, "Field form is missing");
    assert(fieldError instanceof HTMLElement, "Field valueMissing message is missing");
    assert(fieldValidity instanceof HTMLElement, "Field valid message is missing");
    fieldForm.requestSubmit();
    await runtimeMutationTurn();
    assert(!fieldError.hidden, "Field invalid submission did not reveal its valueMissing state");
    assert(
      fieldError.textContent?.trim() === "Email is required",
      "Field invalid submission message drifted",
    );
    assert(fieldValidity.hidden, "Field invalid submission exposed its valid state");
    fieldControl.value = "reader@example.com";
    fieldControl.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await runtimeMutationTurn();
    assert(
      host.querySelector("#hydrated-field-state")?.textContent === "reader@example.com",
      "Field did not publish its hydrated value",
    );
    assert(fieldError.hidden, "Field valid input retained its valueMissing state");
    assert(!fieldValidity.hidden, "Field valid input did not reveal its valid state");
    assert(fieldValidity.textContent?.trim() === "Email is valid", "Field valid message drifted");
    host.querySelector("#hydrated-field-reset")?.click();
    await runtimeMutationTurn();
    assert(fieldControl.value === "", "Field native control did not reset to its authored default");

    host.querySelector("#hydrated-slider-add-thumb")?.click();
    await frame();
    const slider = host.querySelector("[data-sw-slider]");
    const sliderThumbs = host.querySelectorAll("[data-sw-slider-thumb]");
    const sliderInputs = host.querySelectorAll("[data-sw-slider-input]");
    assert(slider instanceof HTMLElement, "Slider is missing");
    assert(sliderThumbs.length === 3, "Slider did not refresh its dynamic thumbs");
    assert(sliderInputs.length === 3, "Slider did not refresh its native inputs");
    assert(
      [...sliderInputs].map((input) => input.name).join(",") === "range[0],range[1],range[2]",
      "Slider native input ownership drifted",
    );
    assert(
      [...sliderThumbs].every((thumb) => thumb.getBoundingClientRect().width > 0),
      "Slider thumb geometry stayed unresolved",
    );

    const otpInput = host.querySelector("[data-sw-input-otp-input]");
    assert(otpInput instanceof HTMLInputElement, "Input OTP native input is missing");
    otpInput.value = "123456";
    otpInput.dispatchEvent(new Event("input", { bubbles: true }));
    await frame();
    assert(
      host.querySelector("#hydrated-input-otp-state")?.textContent === "123456",
      "Input OTP did not publish its hydrated value",
    );
    assert(
      [...host.querySelectorAll("[data-sw-input-otp-char]")]
        .map((element) => element.textContent)
        .join("") === "123456",
      "Input OTP visual slots did not synchronize",
    );

    const dropzoneInput = host.querySelector("[data-sw-dropzone-input]");
    const dropzone = host.querySelector("[data-sw-dropzone]");
    assert(dropzoneInput instanceof HTMLInputElement, "Dropzone native input is missing");
    assert(dropzone instanceof HTMLElement, "Dropzone root is missing");
    dropzone.dispatchEvent(
      createDragEvent("drop", [
        new File(["image"], "photo.png", { type: "image/png" }),
        new File(["zip"], "archive.zip", { type: "application/zip" }),
      ]),
    );
    await frame();
    const dropzoneState = host.querySelector("#hydrated-dropzone-state")?.textContent;
    assert(
      dropzoneState === "photo.png",
      `Dropzone did not filter and publish deterministic files: ${dropzoneState}`,
    );

    const checkbox = host.querySelector("[data-sw-checkbox]");
    checkbox.click();
    await frame();
    assert(checkbox.getAttribute("aria-checked") === "true", "Checkbox did not update");
    const checkboxGroup = host.querySelector("[data-sw-checkbox-group]");
    checkboxGroup.querySelector('[data-value="beta"]').click();
    await frame();
    assert(
      checkboxGroup.getAttribute("data-value") === '["alpha","beta"]',
      "Checkbox Group did not update",
    );
    const radioGroup = host.querySelector("[data-sw-radio-group]");
    radioGroup.querySelector('[data-value="beta"]').click();
    await frame();
    assert(radioGroup.getAttribute("data-value") === "beta", "Radio Group did not update");
    assert(
      radioGroup.querySelector('[data-value="beta"]').getAttribute("aria-checked") === "true",
      "Radio did not receive group state",
    );
    const toggleGroup = host.querySelector("[data-sw-toggle-group]");
    toggleGroup.querySelector('[data-value="italic"]').click();
    await frame();
    assert(toggleGroup.getAttribute("data-value") === '["italic"]', "Toggle Group did not update");
    assert(
      toggleGroup.querySelector('[data-value="italic"]').getAttribute("aria-pressed") === "true",
      "Toggle did not receive group state",
    );

    const select = host.querySelector("[data-sw-select]");
    const trigger = host.querySelector("#hydrated-select-trigger");
    trigger.click();
    await frame();
    assert(trigger.getAttribute("aria-expanded") === "true", "Select did not open");
    overlays.querySelector('[data-sw-select-item][data-value="banana"]').click();
    await frame();
    assert(select.getAttribute("data-value") === "banana", "Select did not update its value");

    const dialog = host.querySelector("#hydrated-dialog");
    const dialogTrigger = host.querySelector("#hydrated-dialog-trigger");
    const dialogPopup = host.querySelector("#hydrated-dialog-popup");
    dialogTrigger.click();
    await frame();
    assert(dialogPopup.open, "Dialog did not open after hydration");
    assert(dialog.getAttribute("data-state") === "open", "Dialog model did not update");
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await waitFor(() => !dialogPopup.open, "Dialog did not close after hydration");

    const alertDialogTrigger = host.querySelector("#hydrated-alert-dialog-trigger");
    const alertDialogPopup = overlays.querySelector("#hydrated-alert-dialog-popup");
    alertDialogTrigger.click();
    await frame();
    assert(alertDialogPopup.open, "Alert Dialog did not open after hydration");
    overlays.querySelector("[data-sw-alert-dialog-backdrop]").click();
    assert(alertDialogPopup.open, "Alert Dialog dismissed from outside interaction");
    overlays.querySelector("[data-sw-alert-dialog-close]").click();
    await waitFor(() => !alertDialogPopup.open, "Alert Dialog did not close after hydration");

    const drawerTrigger = host.querySelector("#hydrated-drawer-trigger");
    const drawerPopup = overlays.querySelector("#hydrated-drawer-popup");
    assert(drawerTrigger, "Drawer trigger is missing after hydration");
    assert(drawerPopup, "Drawer popup did not Teleport to its declared owner");
    assert(drawerPopup.getAttribute("data-side") === "left", "Drawer side changed on hydration");
    drawerTrigger.click();
    await nextTick();
    assert(drawerPopup.open, "Drawer did not open after hydration");
    drawerPopup.querySelector("[data-sw-drawer-close]").click();
    await waitFor(() => !drawerPopup.open, "Drawer did not close after hydration");

    const popoverTrigger = host.querySelector("#hydrated-popover-trigger");
    const popoverPopup = overlays.querySelector("#hydrated-popover-popup");
    const popoverPositioner = overlays.querySelector("[data-sw-popover-positioner]");
    assert(popoverTrigger, "Popover trigger is missing after hydration");
    assert(popoverPopup, "Popover popup did not Teleport to its declared owner");
    assert(popoverPositioner, "Popover positioner is missing after hydration");
    popoverTrigger.click();
    await frame();
    assert(!popoverPopup.hidden, "Popover did not open after hydration");
    assert(popoverPopup.getAttribute("data-state") === "open", "Popover state did not update");
    assert(
      getComputedStyle(popoverPositioner).position === "fixed",
      "Popover positioning did not activate after hydration",
    );
    popoverPopup.querySelector("[data-sw-popover-close]").click();
    await frame();
    assert(popoverPopup.hidden, "Popover did not close after hydration");

    await waitFor(
      () =>
        host.querySelector("[data-sw-avatar]")?.getAttribute("data-image-loading-status") ===
        "loaded",
      "Avatar did not reach loaded state",
    );
    assert(!host.querySelector("[data-sw-avatar-image]").hidden, "Avatar image stayed hidden");
    assert(
      host.querySelector("[data-sw-avatar-fallback]").hidden,
      "Avatar fallback stayed visible",
    );

    host.querySelector("#hydrated-progress-update").click();
    await frame();
    const progress = host.querySelector("[data-sw-progress]");
    assert(
      progress.getAttribute("aria-valuenow") === "75",
      "Progress did not react to prop update",
    );
    assert(
      host.querySelector("[data-sw-progress-indicator]").style.transform === "translateX(-25%)",
      "Progress indicator did not react to prop update",
    );

    const viewport = host.querySelector("[data-sw-scroll-area-viewport]");
    const thumb = host.querySelector("[data-sw-scroll-area-thumb]");
    assert(viewport instanceof HTMLElement, "Scroll Area viewport is missing");
    assert(thumb instanceof HTMLElement, "Scroll Area thumb is missing");
    await waitFor(
      () => Number.parseFloat(getComputedStyle(thumb).height) > 0,
      "Scroll Area thumb was not measured",
    );
    viewport.scrollTop = 80;
    viewport.dispatchEvent(new Event("scroll"));
    await frame();
    assert(viewport.scrollTop === 80, "Scroll Area did not retain scrolling");
  } finally {
    app.unmount();
    await nextTick();
    try {
      resources.assertDisposed();
    } finally {
      resources.restore();
    }
  }

  assert(host.children.length === 0, "hydrated component markup leaked after unmount");
  assert(overlays.children.length === 0, "hydrated portal content leaked after unmount");
  assert(!document.body.hasAttribute("data-sw-scroll-locked"), "Dialog scroll lock leaked");
}

export function renderFixture(onButtonClick = () => undefined) {
  return h("main", null, [
    h(
      ButtonRoot,
      { focusableWhenDisabled: true, id: "hydrated-button", onClick: onButtonClick },
      { default: () => "Save" },
    ),
    h(
      CheckboxRoot,
      { defaultChecked: false, id: "hydrated-checkbox", label: "Accept terms" },
      { default: () => h(CheckboxIndicator, null, { default: () => "Selected" }) },
    ),
    h(
      CheckboxGroupRoot,
      { defaultValue: ["alpha"], id: "hydrated-checkbox-group" },
      {
        default: () => [h(CheckboxRoot, { value: "alpha" }), h(CheckboxRoot, { value: "beta" })],
      },
    ),
    h(
      RadioGroupRoot,
      { defaultValue: "alpha", id: "hydrated-radio-group" },
      {
        default: () => [h(RadioRoot, { value: "alpha" }), h(RadioRoot, { value: "beta" })],
      },
    ),
    h(FormsHydrationFixture),
    h(
      DialogRoot,
      { id: "hydrated-dialog" },
      {
        default: () => [
          h(DialogTrigger, { id: "hydrated-dialog-trigger" }, { default: () => "Open Dialog" }),
          h(DialogBackdrop),
          h(
            DialogPopup,
            { id: "hydrated-dialog-popup" },
            {
              default: () => [
                h(DialogTitle, null, { default: () => "Hydrated Dialog" }),
                h(DialogDescription, null, { default: () => "Hydration-safe overlay" }),
                h(DialogClose, null, { default: () => "Close" }),
              ],
            },
          ),
        ],
      },
    ),
    renderAlertDialog(),
    renderDrawer(),
    renderPopover(),
    h(
      ToggleGroupRoot,
      { defaultValue: ["bold"], id: "hydrated-toggle-group" },
      {
        default: () => [
          h(ToggleRoot, { value: "bold" }, { default: () => "Bold" }),
          h(ToggleRoot, { value: "italic" }, { default: () => "Italic" }),
        ],
      },
    ),
    h(CohortFixture),
    h(
      SelectRoot,
      { defaultValue: "apple", modal: false },
      {
        default: () => [
          h(
            SelectTrigger,
            { id: "hydrated-select-trigger" },
            { default: () => h(SelectValue, { placeholder: "Choose fruit" }) },
          ),
          h(
            SelectPortal,
            { container: "#hydration-overlays" },
            {
              default: () =>
                h(
                  SelectPositioner,
                  { alignItemWithTrigger: false },
                  {
                    default: () =>
                      h(SelectPopup, null, {
                        default: () =>
                          h(SelectList, null, {
                            default: () => [
                              renderItem("apple", "Apple"),
                              renderItem("banana", "Banana"),
                            ],
                          }),
                      }),
                  },
                ),
            },
          ),
        ],
      },
    ),
  ]);
}

function renderAlertDialog() {
  return h(
    AlertDialogRoot,
    { id: "hydrated-alert-dialog" },
    {
      default: () => [
        h(AlertDialogTrigger, { id: "hydrated-alert-dialog-trigger" }, { default: () => "Delete" }),
        h(
          AlertDialogPortal,
          { container: "#hydration-overlays" },
          {
            default: () =>
              h(AlertDialogViewport, null, {
                default: () => [
                  h(AlertDialogBackdrop),
                  h(
                    AlertDialogPopup,
                    { id: "hydrated-alert-dialog-popup" },
                    {
                      default: () => [
                        h(AlertDialogTitle, null, { default: () => "Confirm delete" }),
                        h(AlertDialogDescription, null, { default: () => "Cannot undo" }),
                        h(AlertDialogClose, null, { default: () => "Cancel" }),
                      ],
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

function renderDrawer() {
  return h(
    DrawerRoot,
    { id: "hydrated-drawer" },
    {
      default: () => [
        h(DrawerTrigger, { id: "hydrated-drawer-trigger" }, { default: () => "Open Drawer" }),
        h(
          DrawerPortal,
          { container: "#hydration-overlays" },
          {
            default: () =>
              h(DrawerViewport, null, {
                default: () => [
                  h(DrawerBackdrop),
                  h(
                    DrawerPopup,
                    { id: "hydrated-drawer-popup", side: "left" },
                    {
                      default: () => [
                        h(DrawerTitle, null, { default: () => "Hydrated Drawer" }),
                        h(DrawerDescription, null, {
                          default: () => "Hydration-safe side overlay",
                        }),
                        h(DrawerClose, null, { default: () => "Close" }),
                      ],
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

function renderPopover() {
  return h(
    PopoverRoot,
    { id: "hydrated-popover" },
    {
      default: () => [
        h(PopoverTrigger, { id: "hydrated-popover-trigger" }, { default: () => "Open Popover" }),
        h(
          PopoverPortal,
          { container: "#hydration-overlays" },
          {
            default: () =>
              h(
                PopoverPositioner,
                { align: "end", side: "right" },
                {
                  default: () =>
                    h(
                      PopoverPopup,
                      { id: "hydrated-popover-popup" },
                      {
                        default: () => [
                          h(PopoverTitle, null, { default: () => "Hydrated Popover" }),
                          h(PopoverDescription, null, {
                            default: () => "Hydration-safe floating overlay",
                          }),
                          h(PopoverClose, null, { default: () => "Close" }),
                        ],
                      },
                    ),
                },
              ),
          },
        ),
      ],
    },
  );
}

const FormsHydrationFixture = defineComponent({
  setup() {
    const inputValue = ref("server input");
    const switchChecked = ref(false);
    const switchUpdates = ref(0);
    const cancelNextSwitch = ref(false);

    return () => [
      h(InputRoot, {
        id: "hydrated-input",
        modelValue: inputValue.value,
        "onUpdate:modelValue": (value) => (inputValue.value = value),
      }),
      h("output", { id: "hydrated-input-state" }, inputValue.value),
      h(
        SwitchRoot,
        {
          defaultChecked: false,
          id: "hydrated-switch",
          onCheckedChange: (_checked, detail) => {
            if (!cancelNextSwitch.value) return;
            cancelNextSwitch.value = false;
            detail.cancel();
          },
          "onUpdate:checked": (checked) => {
            switchChecked.value = checked;
            switchUpdates.value += 1;
          },
        },
        { default: () => h(SwitchThumb) },
      ),
      h(
        "button",
        {
          id: "cancel-hydrated-switch",
          onClick: () => (cancelNextSwitch.value = true),
          type: "button",
        },
        "Cancel next Switch activation",
      ),
      h(
        "output",
        { id: "hydrated-switch-state" },
        `checked:${switchChecked.value}, updates:${switchUpdates.value}`,
      ),
    ];
  },
});

const CohortFixture = defineComponent({
  setup() {
    const accordionValue = ref("alpha");
    const tabsValue = ref("account");
    const fieldValue = ref("");
    const sliderValue = ref([20, 80]);
    const inputOtpValue = ref("12");
    const dropzoneFiles = ref([]);
    const progressValue = ref(40);
    return () => [
      h(
        AccordionRoot,
        {
          id: "hydrated-accordion",
          modelValue: accordionValue.value,
          "onUpdate:modelValue": (value) => (accordionValue.value = value),
        },
        () =>
          ["alpha", "beta"].map((value) =>
            h(AccordionItem, { key: value, value }, () => [
              h(AccordionHeader, null, () =>
                h(AccordionTrigger, { id: `hydrated-accordion-${value}` }, () =>
                  value.toUpperCase(),
                ),
              ),
              h(AccordionPanel, null, () => `${value} content`),
            ]),
          ),
      ),
      h("output", { id: "hydrated-accordion-state" }, accordionValue.value),
      h(
        TabsRoot,
        {
          id: "hydrated-tabs",
          modelValue: tabsValue.value,
          "onUpdate:modelValue": (value) => (tabsValue.value = value),
        },
        () => [
          h(TabsList, null, () => [
            h(TabsTab, { id: "hydrated-tabs-account", value: "account" }, () => "Account"),
            h(TabsTab, { id: "hydrated-tabs-password", value: "password" }, () => "Password"),
            h(TabsIndicator),
          ]),
          h(TabsPanel, { value: "account" }, () => "Account content"),
          h(TabsPanel, { value: "password" }, () => "Password content"),
        ],
      ),
      h("output", { id: "hydrated-tabs-state" }, tabsValue.value),
      h("form", { id: "hydrated-field-form" }, [
        h(FieldRoot, { name: "email" }, () => [
          h(FieldLabel, null, () => "Email"),
          h(FieldControl, {
            defaultValue: "",
            id: "hydrated-field-control",
            required: true,
            type: "email",
            "onUpdate:modelValue": (value) => (fieldValue.value = value),
          }),
          h(FieldDescription, null, () => "Used for hydration checks"),
          h(FieldError, { match: "valueMissing" }, () => "Email is required"),
          h(FieldValidity, { match: "valid" }, () => "Email is valid"),
        ]),
        h("button", { id: "hydrated-field-submit", type: "submit" }, "Submit field"),
        h("button", { id: "hydrated-field-reset", type: "reset" }, "Reset field"),
      ]),
      h("output", { id: "hydrated-field-state" }, fieldValue.value),
      h(
        SliderRoot,
        {
          id: "hydrated-slider",
          modelValue: sliderValue.value,
          name: "range",
          "onUpdate:modelValue": (value) => (sliderValue.value = value),
        },
        () =>
          h(SliderControl, { style: "position:relative;width:240px;height:32px" }, () => [
            h(
              SliderTrack,
              { style: "display:block;position:relative;width:240px;height:8px" },
              () => h(SliderIndicator),
            ),
            ...sliderValue.value.map((_value, index) =>
              h(SliderThumb, {
                index,
                key: index,
                style: "display:block;position:absolute;width:16px;height:16px",
              }),
            ),
          ]),
      ),
      h(
        "button",
        {
          id: "hydrated-slider-add-thumb",
          onClick: () => (sliderValue.value = [20, 50, 80]),
          type: "button",
        },
        "Add slider thumb",
      ),
      h("output", { id: "hydrated-slider-state" }, JSON.stringify(sliderValue.value)),
      h(
        InputOtpRoot,
        {
          id: "hydrated-input-otp",
          maxLength: 6,
          modelValue: inputOtpValue.value,
          name: "code",
          "onUpdate:modelValue": (value) => (inputOtpValue.value = value),
        },
        () =>
          h(InputOtpGroup, null, () => [
            ...Array.from({ length: 3 }, (_, index) => h(InputOtpSlot, { index, key: index })),
            h(InputOtpSeparator),
            ...Array.from({ length: 3 }, (_, offset) =>
              h(InputOtpSlot, { index: offset + 3, key: offset + 3 }),
            ),
          ]),
      ),
      h("output", { id: "hydrated-input-otp-state" }, inputOtpValue.value),
      h(
        DropzoneRoot,
        {
          id: "hydrated-dropzone",
          onFilesChange: (files) => (dropzoneFiles.value = files.map((file) => file.name)),
        },
        () => [
          h(DropzoneUploadIndicator),
          h(DropzoneLoadingIndicator),
          h(DropzoneFilesList),
          h(DropzoneInput, { accept: "image/*,.txt", multiple: true, name: "assets" }),
        ],
      ),
      h("output", { id: "hydrated-dropzone-state" }, dropzoneFiles.value.join(",")),
      h(
        AvatarRoot,
        { id: "hydrated-avatar" },
        {
          default: () => [
            h(AvatarImage, {
              alt: "Hydrated profile",
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'/%3E",
            }),
            h(AvatarFallback, null, { default: () => "HP" }),
          ],
        },
      ),
      h(
        ProgressRoot,
        { max: 100, min: 0, value: progressValue.value },
        {
          default: () => [
            h(ProgressLabel, null, { default: () => "Hydration progress" }),
            h(ProgressTrack, null, { default: () => h(ProgressIndicator) }),
            h(ProgressValue),
          ],
        },
      ),
      h(
        "button",
        {
          id: "hydrated-progress-update",
          onClick: () => (progressValue.value = 75),
          type: "button",
        },
        "Update progress",
      ),
      h(
        ScrollAreaRoot,
        { id: "hydrated-scroll-area", style: "height:120px;position:relative;width:200px" },
        {
          default: () => [
            h(
              ScrollAreaViewport,
              { style: "height:120px;width:200px" },
              {
                default: () =>
                  h(
                    ScrollAreaContent,
                    { style: "height:400px;width:600px" },
                    { default: () => "Hydrated scroll content" },
                  ),
              },
            ),
            h(
              ScrollAreaScrollbar,
              { keepMounted: true, style: "height:120px;width:10px" },
              {
                default: () =>
                  h(ScrollAreaThumb, { style: "height:var(--scroll-area-thumb-height)" }),
              },
            ),
            h(ScrollAreaCorner),
          ],
        },
      ),
    ];
  },
});

function renderItem(value, label) {
  return h(
    SelectItem,
    { value },
    {
      default: () => [
        h(SelectItemText, null, { default: () => label }),
        h(SelectItemIndicator, null, { default: () => "Selected" }),
      ],
    },
  );
}

function createDragEvent(type, files) {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  return new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer });
}

async function frame() {
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await nextTick();
}

async function runtimeMutationTurn() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await frame();
}

async function waitFor(predicate, message) {
  const deadline = performance.now() + 5_000;
  while (!predicate()) {
    if (performance.now() > deadline) throw new Error(message);
    await frame();
  }
}

function trackFixtureResources(isFixtureTarget) {
  const NativeAbortController = window.AbortController;
  const NativeMutationObserver = window.MutationObserver;
  const NativeResizeObserver = window.ResizeObserver;
  const nativeAddEventListener = EventTarget.prototype.addEventListener;
  const abortRecords = new Map();
  const signalOwners = new WeakMap();
  const signalListenerRecords = [];
  const mutationRecords = new Map();
  const resizeRecords = new Map();

  class TrackedAbortController extends NativeAbortController {
    constructor() {
      super();
      abortRecords.set(this, { abortCalls: 0 });
      signalOwners.set(this.signal, this);
    }
    abort(reason) {
      abortRecords.get(this).abortCalls += 1;
      return super.abort(reason);
    }
  }

  function createTrackedObserver(NativeObserver, records) {
    return class TrackedObserver extends NativeObserver {
      constructor(callback) {
        super(callback);
        records.set(this, {
          active: false,
          disposalCount: 0,
          duplicateDisposals: 0,
          relevant: false,
        });
      }
      observe(...args) {
        const record = records.get(this);
        record.active = true;
        record.relevant ||= isFixtureTarget(args[0]);
        return super.observe(...args);
      }
      disconnect() {
        const record = records.get(this);
        if (record.active) {
          record.active = false;
          record.disposalCount += 1;
        } else {
          record.duplicateDisposals += 1;
        }
        return super.disconnect();
      }
    };
  }

  window.AbortController = TrackedAbortController;
  window.MutationObserver = createTrackedObserver(NativeMutationObserver, mutationRecords);
  window.ResizeObserver = createTrackedObserver(NativeResizeObserver, resizeRecords);
  EventTarget.prototype.addEventListener = function addEventListener(type, listener, options) {
    const owner =
      options && typeof options === "object" && "signal" in options
        ? signalOwners.get(options.signal)
        : undefined;
    if (owner) signalListenerRecords.push({ owner, target: this, type });
    return nativeAddEventListener.call(this, type, listener, options);
  };

  return {
    assertDisposed() {
      const listenerOwners = new Set(signalListenerRecords.map((listener) => listener.owner));
      assert(listenerOwners.size > 0, "expected fixture-owned listener controllers");
      for (const controller of listenerOwners) {
        const record = abortRecords.get(controller);
        assert(record.abortCalls === 1, `AbortController disposed ${record.abortCalls} times`);
        assert(controller.signal.aborted, "AbortController signal remained active");
      }
      for (const listener of signalListenerRecords) {
        assert(listener.owner.signal.aborted, `listener ${listener.type} remained active`);
        assert(
          abortRecords.get(listener.owner).abortCalls === 1,
          `listener ${listener.type} owner disposed more than once`,
        );
      }
      assertObserverRecords("MutationObserver", mutationRecords);
      assertObserverRecords("ResizeObserver", resizeRecords);
    },
    restore() {
      EventTarget.prototype.addEventListener = nativeAddEventListener;
      window.AbortController = NativeAbortController;
      window.MutationObserver = NativeMutationObserver;
      window.ResizeObserver = NativeResizeObserver;
    },
  };
}

function assertObserverRecords(name, records) {
  const fixtureRecords = [...records.values()].filter((record) => record.relevant);
  assert(fixtureRecords.length > 0, `expected fixture-owned ${name} resources`);
  for (const record of fixtureRecords) {
    assert(!record.active, `${name} remained active after unmount`);
    assert(record.disposalCount > 0, `${name} was never disposed`);
    assert(record.duplicateDisposals === 0, `${name} was disposed twice without being observed`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
