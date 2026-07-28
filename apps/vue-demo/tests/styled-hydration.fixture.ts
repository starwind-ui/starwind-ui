import { createSSRApp, defineComponent, h, nextTick, ref } from "vue";
import { initThemeController } from "@starwind-ui/vue/theme";

import { Avatar, AvatarFallback, AvatarImage } from "../src/components/starwind-runtime/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../src/components/starwind-runtime/accordion";
import { Button } from "../src/components/starwind-runtime/button";
import { Checkbox } from "../src/components/starwind-runtime/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../src/components/starwind-runtime/dialog";
import { Input } from "../src/components/starwind-runtime/input";
import { Dropzone } from "../src/components/starwind-runtime/dropzone";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldValidity,
} from "../src/components/starwind-runtime/field";
import {
  InputOtp,
  InputOtpGroup,
  InputOtpSeparator,
  InputOtpSlot,
} from "../src/components/starwind-runtime/input-otp";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "../src/components/starwind-runtime/popover";
import { Progress } from "../src/components/starwind-runtime/progress";
import { RadioGroup, RadioGroupItem } from "../src/components/starwind-runtime/radio-group";
import { ScrollArea } from "../src/components/starwind-runtime/scroll-area";
import { Slider } from "../src/components/starwind-runtime/slider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "../src/components/starwind-runtime/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../src/components/starwind-runtime/select";
import { ThemeToggle } from "../src/components/starwind-runtime/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../src/components/starwind-runtime/tabs";
import { Toggle } from "../src/components/starwind-runtime/toggle";
import { ToggleGroup, ToggleGroupItem } from "../src/components/starwind-runtime/toggle-group";

export function renderStyledFixture(onButtonClick = () => undefined) {
  return h("main", null, [
    h(
      Button,
      {
        focusableWhenDisabled: true,
        id: "hydrated-styled-button",
        onClick: onButtonClick,
        variant: "secondary",
      },
      { default: () => "Save" },
    ),
    h(Checkbox, {
      defaultChecked: false,
      id: "hydrated-styled-checkbox",
      label: "Accept terms",
      variant: "outline",
    }),
    h(Input, {
      defaultValue: "hydrated input",
      id: "hydrated-styled-input",
      name: "query",
    }),
    h(
      Dialog,
      { id: "hydrated-styled-dialog" },
      {
        default: () => [
          h(
            DialogTrigger,
            { id: "hydrated-styled-dialog-trigger" },
            { default: () => "Open Dialog" },
          ),
          h(
            DialogContent,
            { id: "hydrated-styled-dialog-content" },
            {
              default: () => [
                h(DialogTitle, null, { default: () => "Hydrated Dialog" }),
                h(DialogDescription, null, { default: () => "Hydration-safe overlay" }),
              ],
            },
          ),
        ],
      },
    ),
    h(
      Sheet,
      { id: "hydrated-styled-sheet" },
      {
        default: () => [
          h(SheetTrigger, { id: "hydrated-styled-sheet-trigger" }, { default: () => "Open Sheet" }),
          h(
            SheetContent,
            { id: "hydrated-styled-sheet-content", side: "bottom" },
            {
              default: () => [
                h(SheetTitle, null, { default: () => "Hydrated Sheet" }),
                h(SheetDescription, null, { default: () => "Hydration-safe side overlay" }),
              ],
            },
          ),
        ],
      },
    ),
    h(
      Popover,
      { id: "hydrated-styled-popover" },
      {
        default: () => [
          h(
            PopoverTrigger,
            { id: "hydrated-styled-popover-trigger" },
            { default: () => "Open Popover" },
          ),
          h(
            PopoverContent,
            { align: "start", id: "hydrated-styled-popover-content", side: "right" },
            {
              default: () => [
                h(PopoverTitle, null, { default: () => "Hydrated Popover" }),
                h(PopoverDescription, null, {
                  default: () => "Hydration-safe floating overlay",
                }),
              ],
            },
          ),
        ],
      },
    ),
    h(
      RadioGroup,
      { defaultValue: "alpha", id: "hydrated-styled-radio-group" },
      {
        default: () => [
          h(RadioGroupItem, { value: "alpha" }),
          h(RadioGroupItem, { value: "beta" }),
        ],
      },
    ),
    h(StyledCohortFixture),
    h(
      Toggle,
      { defaultPressed: true, id: "hydrated-styled-toggle", variant: "outline" },
      { default: () => "Pinned" },
    ),
    h(
      ToggleGroup,
      { defaultValue: ["left"], id: "hydrated-styled-toggle-group" },
      {
        default: () => [
          h(ToggleGroupItem, { value: "left" }, { default: () => "Left" }),
          h(ToggleGroupItem, { value: "right" }, { default: () => "Right" }),
        ],
      },
    ),
    h(Tabs, { defaultValue: "account", id: "hydrated-styled-tabs" }, () => [
      h(TabsList, null, () => [
        h(TabsTrigger, { value: "account" }, () => "Account"),
        h(TabsTrigger, { value: "password" }, () => "Password"),
      ]),
      h(TabsContent, { value: "account" }, () => "Account content"),
      h(TabsContent, { value: "password" }, () => "Password content"),
    ]),
    h(
      Select,
      { defaultValue: "apple", modal: false },
      {
        default: () => [
          h(
            SelectTrigger,
            { asChild: true },
            {
              default: () => h("button", { id: "hydrated-styled-select" }, "Choose fruit"),
            },
          ),
          h(
            SelectContent,
            { alignItemWithTrigger: false },
            {
              default: () => [
                h(SelectItem, { value: "apple" }, { default: () => "Apple" }),
                h(SelectItem, { value: "banana" }, { default: () => "Banana" }),
              ],
            },
          ),
        ],
      },
    ),
  ]);
}

export async function runStyledHydrationChecks() {
  const host = document.querySelector<HTMLElement>("#styled-hydration-host");
  assert(host, "Styled hydration host is missing");
  assert(host.querySelectorAll("[data-sw-button]").length === 3, "Styled SSR duplicated Button");
  assert(
    host.querySelectorAll("[data-sw-checkbox]").length === 1,
    "Styled SSR duplicated Checkbox",
  );
  assert(host.querySelectorAll("[data-sw-select]").length === 1, "Styled SSR duplicated Select");
  assert(host.querySelectorAll("[data-sw-dialog]").length === 1, "Styled SSR duplicated Dialog");
  assert(host.querySelectorAll("[data-sw-drawer]").length === 1, "Styled SSR duplicated Sheet");
  assert(host.querySelectorAll("[data-sw-popover]").length === 1, "Styled SSR duplicated Popover");
  assert(
    host.querySelectorAll("[data-sw-input]").length === 2,
    "Styled SSR Input and FieldControl inventory drifted",
  );
  assert(host.querySelectorAll("[data-sw-avatar]").length === 1, "Styled SSR duplicated Avatar");
  assert(host.querySelectorAll("[data-sw-radio]").length === 2, "Styled SSR duplicated Radio");
  assert(
    host.querySelectorAll("[data-sw-radio-group]").length === 1,
    "Styled SSR duplicated Radio Group",
  );
  assert(
    host.querySelectorAll("[data-sw-progress]").length === 1,
    "Styled SSR duplicated Progress",
  );
  assert(
    host.querySelectorAll("[data-sw-scroll-area]").length === 1,
    "Styled SSR duplicated Scroll Area",
  );
  assert(
    host.querySelectorAll("[data-sw-theme-toggle]").length === 1,
    "Styled SSR duplicated Theme Toggle",
  );
  assert(host.querySelectorAll("[data-sw-toggle]").length === 4, "Styled SSR duplicated Toggle");
  assert(
    host.querySelectorAll("[data-sw-toggle-group]").length === 1,
    "Styled SSR duplicated Toggle Group",
  );
  assert(host.querySelectorAll("[data-sw-tabs]").length === 1, "Styled SSR duplicated Tabs");
  assert(
    host.querySelectorAll("[data-sw-accordion]").length === 1,
    "Styled SSR duplicated Accordion",
  );
  assert(host.querySelectorAll("[data-sw-field]").length === 1, "Styled SSR duplicated Field");
  assert(host.querySelectorAll("[data-sw-slider]").length === 1, "Styled SSR duplicated Slider");
  assert(
    host.querySelectorAll("[data-sw-slider-thumb]").length === 2,
    "Styled SSR Slider thumb inventory drifted",
  );
  assert(
    host.querySelectorAll("[data-sw-input-otp]").length === 1,
    "Styled SSR duplicated Input OTP",
  );
  assert(
    host.querySelectorAll("[data-sw-input-otp-input]").length === 1,
    "Styled SSR duplicated Input OTP native input",
  );
  assert(
    host.querySelectorAll("[data-sw-dropzone]").length === 1,
    "Styled SSR duplicated Dropzone",
  );
  assert(
    host.querySelectorAll("[data-sw-dropzone-input]").length === 1,
    "Styled SSR duplicated Dropzone native input",
  );
  assert(
    host.querySelectorAll("[data-sw-select-portal]").length === 1,
    "Styled SSR portal content was not deterministic and inline",
  );
  assert(
    host.querySelectorAll("[data-sw-popover-portal]").length === 1,
    "Styled Popover SSR portal content was not deterministic and inline",
  );

  const resources = trackFixtureResources(
    (target) =>
      target === host ||
      host.contains(target) ||
      (target instanceof Element &&
        target.closest("[data-sw-select-portal], [data-sw-popover-portal]") !== null),
  );
  let buttonClicks = 0;
  const warnings: string[] = [];
  localStorage.setItem("colorTheme", "light");
  document.documentElement.classList.remove("dark");
  const themeController = initThemeController(document);
  const app = createSSRApp({
    render: () => renderStyledFixture(() => (buttonClicks += 1)),
  });
  app.config.warnHandler = (message) => warnings.push(message);
  const serverToggle = host.querySelector<HTMLButtonElement>("#hydrated-styled-toggle");
  assert(serverToggle, "Styled Toggle SSR root is missing");
  assert(
    serverToggle.getAttribute("aria-pressed") === "true",
    "Styled Toggle SSR state was false before hydration",
  );

  try {
    app.mount(host);
    const hydratedToggle = host.querySelector<HTMLButtonElement>("#hydrated-styled-toggle");
    assert(hydratedToggle, "Styled Toggle root is missing after hydration mount");
    assert(
      hydratedToggle.getAttribute("aria-pressed") === "true",
      "Styled Toggle lost SSR state during hydration mount",
    );
    await frame();
    assert(warnings.length === 0, `Styled hydration warned: ${warnings.join(" | ")}`);
    assert(
      host.querySelectorAll("#hydrated-styled-button").length === 1,
      "Styled hydration duplicated Button",
    );
    assert(
      host.querySelectorAll("#hydrated-styled-checkbox").length === 1,
      "Styled hydration duplicated Checkbox",
    );
    assert(
      host.querySelectorAll("#hydrated-styled-input").length === 1,
      "Styled hydration duplicated Input",
    );
    assert(
      host.querySelectorAll("#hydrated-styled-dialog").length === 1,
      "Styled hydration duplicated Dialog",
    );
    assert(
      host.querySelectorAll("#hydrated-styled-popover").length === 1,
      "Styled hydration duplicated Popover",
    );
    assert(
      host.querySelectorAll("#hydrated-styled-select").length === 1,
      "Styled hydration duplicated Select",
    );
    for (const selector of [
      "#hydrated-styled-avatar",
      "#hydrated-styled-progress",
      "#hydrated-styled-radio-group",
      "#hydrated-styled-scroll-area",
      "#hydrated-styled-theme-toggle",
      "#hydrated-styled-toggle",
      "#hydrated-styled-toggle-group",
      "#hydrated-styled-tabs",
      "#hydrated-styled-accordion",
      "#hydrated-styled-field",
      "#hydrated-styled-slider",
      "#hydrated-styled-input-otp",
      "#hydrated-styled-dropzone",
    ]) {
      assert(
        host.querySelectorAll(selector).length === 1,
        `Styled hydration duplicated ${selector}`,
      );
    }
    assert(
      host.querySelectorAll("[data-sw-select-portal]").length === 0,
      "Styled hydration left Select portal content under its source owner",
    );
    assert(
      document.body.querySelectorAll(":scope > [data-sw-select-portal]").length === 1,
      "Styled hydration did not move Select portal content to body",
    );
    assert(
      host.querySelectorAll("[data-sw-popover-portal]").length === 0,
      "Styled hydration left Popover portal content under its source owner",
    );
    assert(
      document.body.querySelectorAll(":scope > [data-sw-popover-portal]").length === 1,
      "Styled hydration did not move Popover portal content to body",
    );

    host.querySelector<HTMLButtonElement>("#hydrated-styled-button")?.click();
    assert(buttonClicks === 1, `Styled Button listener fired ${buttonClicks} times`);

    const dialog = host.querySelector<HTMLElement>("#hydrated-styled-dialog");
    const dialogTrigger = host.querySelector<HTMLButtonElement>("#hydrated-styled-dialog-trigger");
    const dialogPopup = host.querySelector<HTMLDialogElement>("#hydrated-styled-dialog-content");
    assert(dialog, "Styled Dialog root is missing");
    assert(dialogTrigger, "Styled Dialog trigger is missing");
    assert(dialogPopup, "Styled Dialog popup is missing");
    dialogTrigger.click();
    await frame();
    assert(dialogPopup.open, "Styled Dialog did not open after hydration");
    assert(dialog.getAttribute("data-state") === "open", "Styled Dialog model did not update");
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await frame();
    assert(!dialogPopup.open, "Styled Dialog did not close after hydration");

    const sheet = host.querySelector<HTMLElement>("#hydrated-styled-sheet");
    const sheetTrigger = host.querySelector<HTMLButtonElement>("#hydrated-styled-sheet-trigger");
    const sheetPopup = host.querySelector<HTMLDialogElement>("#hydrated-styled-sheet-content");
    assert(sheet, "Styled Sheet root is missing");
    assert(sheetTrigger, "Styled Sheet trigger is missing");
    assert(sheetPopup, "Styled Sheet popup is missing");
    assert(sheetPopup.getAttribute("data-side") === "bottom", "Styled Sheet side changed");
    sheetTrigger.click();
    await frame();
    assert(sheetPopup.open, "Styled Sheet did not open after hydration");
    sheetPopup.querySelector<HTMLElement>('[data-slot="sheet-close"]')?.click();
    await frame();
    assert(!sheetPopup.open, "Styled Sheet did not close after hydration");

    const popover = host.querySelector<HTMLElement>("#hydrated-styled-popover");
    const popoverTrigger = host.querySelector<HTMLButtonElement>(
      "#hydrated-styled-popover-trigger",
    );
    const popoverPopup = document.body.querySelector<HTMLElement>(
      "#hydrated-styled-popover-content",
    );
    assert(popover, "Styled Popover root is missing");
    assert(popoverTrigger, "Styled Popover trigger is missing");
    assert(popoverPopup, "Styled Popover content did not Teleport to body");
    popoverTrigger.click();
    await frame();
    assert(!popoverPopup.hidden, "Styled Popover did not open after hydration");
    assert(popover.getAttribute("data-state") === "open", "Styled Popover model did not update");
    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );
    await frame();
    assert(popoverPopup.hidden, "Styled Popover did not close after hydration");

    const checkbox = host.querySelector<HTMLElement>("[data-sw-checkbox]");
    assert(checkbox, "Styled Checkbox root is missing");
    checkbox.click();
    await frame();
    assert(checkbox.getAttribute("aria-checked") === "true", "Styled Checkbox did not update");

    const radioGroup = host.querySelector<HTMLElement>("#hydrated-styled-radio-group");
    assert(radioGroup, "Styled Radio Group is missing");
    radioGroup.querySelector<HTMLElement>('[data-value="beta"]')?.click();
    await frame();
    assert(radioGroup.getAttribute("data-value") === "beta", "Styled Radio Group did not update");

    const select = host.querySelector<HTMLElement>("[data-sw-select]");
    const trigger = host.querySelector<HTMLButtonElement>("#hydrated-styled-select");
    assert(select, "Styled Select root is missing");
    assert(trigger, "Styled Select trigger is missing");
    assert(trigger.type === "button", "Styled Select asChild lost its default button type");
    trigger.click();
    await frame();
    assert(trigger.getAttribute("aria-expanded") === "true", "Styled Select did not open");
    document.body.querySelector<HTMLElement>('[data-sw-select-item][data-value="banana"]')?.click();
    await frame();
    assert(select.getAttribute("data-value") === "banana", "Styled Select did not update");

    await waitFor(
      () =>
        host.querySelector("[data-sw-avatar]")?.getAttribute("data-image-loading-status") ===
        "loaded",
      "Styled Avatar did not load",
    );
    host.querySelector<HTMLButtonElement>("#hydrated-styled-progress-update")?.click();
    await frame();
    assert(
      host.querySelector("#hydrated-styled-progress")?.getAttribute("aria-valuenow") === "75",
      "Styled Progress did not update",
    );
    const viewport = host.querySelector<HTMLElement>("[data-sw-scroll-area-viewport]");
    assert(viewport, "Styled Scroll Area viewport is missing");
    viewport.scrollTop = 80;
    viewport.dispatchEvent(new Event("scroll"));
    await frame();
    assert(viewport.scrollTop === 80, "Styled Scroll Area did not retain scrolling");

    const themeToggle = host.querySelector<HTMLButtonElement>("#hydrated-styled-theme-toggle");
    assert(themeToggle, "Styled Theme Toggle is missing");
    themeToggle.click();
    await frame();
    assert(
      document.documentElement.classList.contains("dark"),
      "Styled Theme Toggle did not apply dark mode",
    );
    assert(
      themeToggle.getAttribute("aria-pressed") === "true",
      "Styled Theme Toggle did not synchronize state",
    );

    const toggle = host.querySelector<HTMLButtonElement>("#hydrated-styled-toggle");
    assert(toggle, "Styled Toggle is missing");
    assert(toggle.getAttribute("aria-pressed") === "true", "Styled Toggle lost SSR state");
    toggle.click();
    await frame();
    assert(toggle.getAttribute("aria-pressed") === "false", "Styled Toggle did not update");

    const toggleGroup = host.querySelector<HTMLElement>("#hydrated-styled-toggle-group");
    assert(toggleGroup, "Styled Toggle Group is missing");
    toggleGroup.querySelector<HTMLElement>('[data-value="right"]')?.click();
    await frame();
    assert(
      toggleGroup.getAttribute("data-value") === '["right"]',
      "Styled Toggle Group did not update",
    );

    host.querySelector<HTMLButtonElement>("#hydrated-styled-accordion-beta")?.click();
    await frame();
    assert(
      host.querySelector("#hydrated-styled-accordion-state")?.textContent === "beta",
      "Styled Accordion did not publish its hydrated value",
    );
    assert(
      !host.querySelector<HTMLElement>(
        '#hydrated-styled-accordion [data-sw-accordion-panel][data-value="beta"]',
      )?.hidden,
      "Styled Accordion panel did not become present",
    );

    const fieldControl = host.querySelector<HTMLInputElement>("#hydrated-styled-field-control");
    const fieldForm = host.querySelector<HTMLFormElement>("#hydrated-styled-field-form");
    const fieldError = host.querySelector<HTMLElement>(
      '#hydrated-styled-field [data-sw-field-error][data-match="valueMissing"]',
    );
    const fieldValidity = host.querySelector<HTMLElement>(
      '#hydrated-styled-field [data-sw-field-validity][data-match="valid"]',
    );
    assert(fieldControl, "Styled Field control is missing");
    assert(fieldForm, "Styled Field form is missing");
    assert(fieldError, "Styled Field valueMissing message is missing");
    assert(fieldValidity, "Styled Field valid message is missing");
    fieldForm.requestSubmit();
    await runtimeMutationTurn();
    assert(
      !fieldError.hidden,
      "Styled Field invalid submission did not reveal its valueMissing state",
    );
    assert(
      fieldError.textContent?.trim() === "Email is required",
      "Styled Field invalid submission message drifted",
    );
    assert(fieldValidity.hidden, "Styled Field invalid submission exposed its valid state");
    fieldControl.value = "reader@example.com";
    fieldControl.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await runtimeMutationTurn();
    assert(
      host.querySelector("#hydrated-styled-field-state")?.textContent === "reader@example.com",
      "Styled Field did not publish its hydrated value",
    );
    assert(fieldError.hidden, "Styled Field valid input retained its valueMissing state");
    assert(!fieldValidity.hidden, "Styled Field valid input did not reveal its valid state");
    assert(
      fieldValidity.textContent?.trim() === "Email is valid",
      "Styled Field valid message drifted",
    );
    host.querySelector<HTMLButtonElement>("#hydrated-styled-field-reset")?.click();
    await runtimeMutationTurn();
    assert(
      fieldControl.value === "",
      "Styled Field native control did not reset to its authored default",
    );

    host.querySelector<HTMLButtonElement>("#hydrated-styled-slider-add-thumb")?.click();
    await frame();
    const sliderThumbs = host.querySelectorAll<HTMLElement>(
      "#hydrated-styled-slider [data-sw-slider-thumb]",
    );
    const sliderInputs = host.querySelectorAll<HTMLInputElement>(
      "#hydrated-styled-slider [data-sw-slider-input]",
    );
    assert(sliderThumbs.length === 3, "Styled Slider did not refresh dynamic thumbs");
    assert(sliderInputs.length === 3, "Styled Slider did not refresh native inputs");
    assert(
      [...sliderThumbs].every((thumb) => thumb.getBoundingClientRect().width > 0),
      "Styled Slider thumb geometry stayed unresolved",
    );

    const inputOtp = host.querySelector<HTMLInputElement>("[data-sw-input-otp-input]");
    assert(inputOtp, "Styled Input OTP native input is missing");
    inputOtp.value = "123456";
    inputOtp.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await frame();
    assert(
      host.querySelector("#hydrated-styled-input-otp-state")?.textContent === "123456",
      "Styled Input OTP did not publish its hydrated value",
    );
    assert(
      [...host.querySelectorAll("[data-sw-input-otp-char]")]
        .map((element) => element.textContent)
        .join("") === "123456",
      "Styled Input OTP visual slots did not synchronize",
    );

    const styledDropzone = host.querySelector<HTMLElement>("#hydrated-styled-dropzone");
    assert(styledDropzone, "Styled Dropzone root is missing");
    styledDropzone.dispatchEvent(
      createDragEvent("drop", [
        new File(["image"], "photo.png", { type: "image/png" }),
        new File(["zip"], "archive.zip", { type: "application/zip" }),
      ]),
    );
    await frame();
    assert(
      host.querySelector("#hydrated-styled-dropzone-state")?.textContent === "photo.png",
      "Styled Dropzone did not filter and publish deterministic files",
    );

    const tabs = host.querySelector<HTMLElement>("#hydrated-styled-tabs");
    assert(tabs, "Styled Tabs is missing");
    tabs.querySelector<HTMLElement>('[data-value="password"]')?.click();
    await frame();
    assert(tabs.getAttribute("data-value") === "password", "Styled Tabs did not update");
    assert(
      !tabs.querySelector<HTMLElement>('[data-sw-tabs-panel][data-value="password"]')?.hidden,
      "Styled Tabs panel did not become visible",
    );
  } finally {
    try {
      app.unmount();
      themeController.destroy();
      await nextTick();
      resources.assertDisposed();
    } finally {
      resources.restore();
    }
  }

  assert(host.children.length === 0, "Styled markup leaked after unmount");
  assert(
    document.body.querySelectorAll(":scope > [data-sw-select-portal]").length === 0,
    "Styled Select portal leaked after unmount",
  );
  assert(
    document.body.querySelectorAll(":scope > [data-sw-popover-portal]").length === 0,
    "Styled Popover portal leaked after unmount",
  );
  assert(!document.body.hasAttribute("data-sw-scroll-locked"), "Styled Dialog leaked scroll lock");
}

const StyledCohortFixture = defineComponent({
  setup() {
    const accordionValue = ref<string | string[]>("alpha");
    const fieldValue = ref("");
    const sliderValue = ref<number | number[]>([20, 80]);
    const inputOtpValue = ref("12");
    const dropzoneFiles = ref<string[]>([]);
    const progressValue = ref(40);
    return () => [
      h(
        Accordion,
        {
          id: "hydrated-styled-accordion",
          modelValue: accordionValue.value,
          "onUpdate:modelValue": (value: string | string[]) => (accordionValue.value = value),
        },
        () =>
          ["alpha", "beta"].map((value) =>
            h(AccordionItem, { key: value, value }, () => [
              h(AccordionTrigger, { id: `hydrated-styled-accordion-${value}` }, () =>
                value.toUpperCase(),
              ),
              h(AccordionContent, null, () => `${value} content`),
            ]),
          ),
      ),
      h("output", { id: "hydrated-styled-accordion-state" }, String(accordionValue.value)),
      h("form", { id: "hydrated-styled-field-form" }, [
        h(Field, { id: "hydrated-styled-field", name: "styled-email" }, () => [
          h(FieldLabel, null, () => "Email"),
          h(FieldControl, {
            defaultValue: "",
            id: "hydrated-styled-field-control",
            required: true,
            type: "email",
            "onUpdate:modelValue": (value: string) => (fieldValue.value = value),
          }),
          h(FieldDescription, null, () => "Used for Styled hydration"),
          h(FieldError, { match: "valueMissing" }, () => "Email is required"),
          h(FieldValidity, { match: "valid" }, () => "Email is valid"),
        ]),
        h("button", { id: "hydrated-styled-field-submit", type: "submit" }, "Submit field"),
        h("button", { id: "hydrated-styled-field-reset", type: "reset" }, "Reset field"),
      ]),
      h("output", { id: "hydrated-styled-field-state" }, fieldValue.value),
      h(Slider, {
        id: "hydrated-styled-slider",
        modelValue: sliderValue.value,
        name: "styled-range",
        "onUpdate:modelValue": (value: number | number[]) => (sliderValue.value = value),
      }),
      h(
        "button",
        {
          id: "hydrated-styled-slider-add-thumb",
          onClick: () => (sliderValue.value = [20, 50, 80]),
          type: "button",
        },
        "Add styled slider thumb",
      ),
      h("output", { id: "hydrated-styled-slider-state" }, JSON.stringify(sliderValue.value)),
      h(
        InputOtp,
        {
          id: "hydrated-styled-input-otp",
          maxLength: 6,
          modelValue: inputOtpValue.value,
          name: "styled-code",
          "onUpdate:modelValue": (value: string) => (inputOtpValue.value = value),
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
      h("output", { id: "hydrated-styled-input-otp-state" }, inputOtpValue.value),
      h(Dropzone, {
        accept: "image/*,.txt",
        id: "hydrated-styled-dropzone",
        multiple: true,
        name: "styled-assets",
        onFilesChange: (files: File[]) => (dropzoneFiles.value = files.map((file) => file.name)),
      }),
      h("output", { id: "hydrated-styled-dropzone-state" }, dropzoneFiles.value.join(",")),
      h(
        Avatar,
        { id: "hydrated-styled-avatar" },
        {
          default: () => [
            h(AvatarImage, {
              alt: "Styled hydrated profile",
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'/%3E",
            }),
            h(AvatarFallback, null, { default: () => "SH" }),
          ],
        },
      ),
      h(Progress, {
        id: "hydrated-styled-progress",
        label: "Styled hydration progress",
        value: progressValue.value,
      }),
      h(
        "button",
        {
          id: "hydrated-styled-progress-update",
          onClick: () => (progressValue.value = 75),
          type: "button",
        },
        "Update styled progress",
      ),
      h(
        ScrollArea,
        { id: "hydrated-styled-scroll-area", overflowEdgeThreshold: 8 },
        { default: () => h("div", { class: "hydrated-scroll-content" }, "Styled scroll content") },
      ),
      h(ThemeToggle, {
        "aria-label": "Toggle hydrated theme",
        id: "hydrated-styled-theme-toggle",
      }),
    ];
  },
});

async function frame() {
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await nextTick();
}

async function runtimeMutationTurn() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await frame();
}

function createDragEvent(type: string, files: File[]): DragEvent {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  return new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer });
}

async function waitFor(predicate: () => boolean, message: string): Promise<void> {
  const deadline = performance.now() + 5_000;
  while (!predicate()) {
    if (performance.now() > deadline) throw new Error(message);
    await frame();
  }
}

type ObserverRecord = {
  active: boolean;
  disposalCount: number;
  duplicateDisposals: number;
  relevant: boolean;
};

function trackFixtureResources(isFixtureTarget: (target: Node) => boolean) {
  const NativeAbortController = window.AbortController;
  const NativeMutationObserver = window.MutationObserver;
  const NativeResizeObserver = window.ResizeObserver;
  const nativeAddEventListener = EventTarget.prototype.addEventListener;
  const abortRecords = new Map<AbortController, { abortCalls: number }>();
  const signalOwners = new WeakMap<AbortSignal, AbortController>();
  const signalListenerRecords: Array<{
    owner: AbortController;
    target: EventTarget;
    type: string;
  }> = [];
  const mutationRecords = new Map<MutationObserver, ObserverRecord>();
  const resizeRecords = new Map<ResizeObserver, ObserverRecord>();

  class TrackedAbortController extends NativeAbortController {
    constructor() {
      super();
      abortRecords.set(this, { abortCalls: 0 });
      signalOwners.set(this.signal, this);
    }
    override abort(reason?: unknown): void {
      const record = abortRecords.get(this);
      assert(record, "Tracked AbortController record is missing");
      record.abortCalls += 1;
      super.abort(reason);
    }
  }

  class TrackedMutationObserver extends NativeMutationObserver {
    constructor(callback: MutationCallback) {
      super(callback);
      mutationRecords.set(this, {
        active: false,
        disposalCount: 0,
        duplicateDisposals: 0,
        relevant: false,
      });
    }
    override observe(target: Node, options: MutationObserverInit): void {
      const record = mutationRecords.get(this);
      assert(record, "Tracked MutationObserver record is missing");
      record.active = true;
      record.relevant ||= isFixtureTarget(target);
      super.observe(target, options);
    }
    override disconnect(): void {
      updateObserverDisposal("MutationObserver", mutationRecords.get(this));
      super.disconnect();
    }
  }

  class TrackedResizeObserver extends NativeResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      super(callback);
      resizeRecords.set(this, {
        active: false,
        disposalCount: 0,
        duplicateDisposals: 0,
        relevant: false,
      });
    }
    override observe(target: Element, options?: ResizeObserverOptions): void {
      const record = resizeRecords.get(this);
      assert(record, "Tracked ResizeObserver record is missing");
      record.active = true;
      record.relevant ||= isFixtureTarget(target);
      super.observe(target, options);
    }
    override disconnect(): void {
      updateObserverDisposal("ResizeObserver", resizeRecords.get(this));
      super.disconnect();
    }
  }

  window.AbortController = TrackedAbortController;
  window.MutationObserver = TrackedMutationObserver;
  window.ResizeObserver = TrackedResizeObserver;
  EventTarget.prototype.addEventListener = function addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    const owner =
      options && typeof options === "object" && options.signal
        ? signalOwners.get(options.signal)
        : undefined;
    if (owner) signalListenerRecords.push({ owner, target: this, type });
    nativeAddEventListener.call(this, type, listener, options);
  };

  return {
    assertDisposed(): void {
      const listenerOwners = new Set(signalListenerRecords.map((listener) => listener.owner));
      assert(listenerOwners.size > 0, "expected fixture-owned listener controllers");
      for (const controller of listenerOwners) {
        const record = abortRecords.get(controller);
        assert(record, "Tracked listener controller record is missing");
        assert(record.abortCalls === 1, `AbortController disposed ${record.abortCalls} times`);
        assert(controller.signal.aborted, "AbortController signal remained active");
      }
      for (const listener of signalListenerRecords) {
        assert(listener.owner.signal.aborted, `listener ${listener.type} remained active`);
        assert(
          abortRecords.get(listener.owner)?.abortCalls === 1,
          `listener ${listener.type} owner disposed more than once`,
        );
      }
      assertObserverRecords("MutationObserver", mutationRecords);
      assertObserverRecords("ResizeObserver", resizeRecords);
    },
    restore(): void {
      EventTarget.prototype.addEventListener = nativeAddEventListener;
      window.AbortController = NativeAbortController;
      window.MutationObserver = NativeMutationObserver;
      window.ResizeObserver = NativeResizeObserver;
    },
  };
}

function updateObserverDisposal(name: string, record: ObserverRecord | undefined): void {
  assert(record, `Tracked ${name} record is missing`);
  if (record.active) {
    record.active = false;
    record.disposalCount += 1;
  } else {
    record.duplicateDisposals += 1;
  }
}

function assertObserverRecords(
  name: string,
  records: ReadonlyMap<MutationObserver | ResizeObserver, ObserverRecord>,
): void {
  const fixtureRecords = [...records.values()].filter((record) => record.relevant);
  assert(fixtureRecords.length > 0, `expected fixture-owned ${name} resources`);
  for (const record of fixtureRecords) {
    assert(!record.active, `${name} remained active after unmount`);
    assert(record.disposalCount > 0, `${name} was never disposed`);
    assert(record.duplicateDisposals === 0, `${name} was disposed twice without being observed`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
