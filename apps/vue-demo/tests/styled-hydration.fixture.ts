import { createSSRApp, defineComponent, h, nextTick, ref } from "vue";
import { initThemeController } from "@starwind-ui/vue/theme";

import { Avatar, AvatarFallback, AvatarImage } from "../src/components/starwind-runtime/avatar";
import { Alert, AlertDescription, AlertTitle } from "../src/components/starwind-runtime/alert";
import { AspectRatio } from "../src/components/starwind-runtime/aspect-ratio";
import { Badge } from "../src/components/starwind-runtime/badge";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../src/components/starwind-runtime/breadcrumb";
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "../src/components/starwind-runtime/button-group";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../src/components/starwind-runtime/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "../src/components/starwind-runtime/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "../src/components/starwind-runtime/item";
import { Kbd, KbdGroup } from "../src/components/starwind-runtime/kbd";
import { Label } from "../src/components/starwind-runtime/label";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "../src/components/starwind-runtime/native-select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../src/components/starwind-runtime/pagination";
import { Prose } from "../src/components/starwind-runtime/prose";
import { Separator } from "../src/components/starwind-runtime/separator";
import { Skeleton } from "../src/components/starwind-runtime/skeleton";
import { Spinner } from "../src/components/starwind-runtime/spinner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFoot,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/components/starwind-runtime/table";
import { Textarea } from "../src/components/starwind-runtime/textarea";
import { Video } from "../src/components/starwind-runtime/video";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../src/components/starwind-runtime/accordion";
import { Button } from "../src/components/starwind-runtime/button";
import { Checkbox } from "../src/components/starwind-runtime/checkbox";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../src/components/starwind-runtime/carousel";
import { ColorPicker } from "../src/components/starwind-runtime/color-picker";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemText,
} from "../src/components/starwind-runtime/combobox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "../src/components/starwind-runtime/context-menu";
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
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
  DropdownTrigger,
} from "../src/components/starwind-runtime/dropdown";
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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../src/components/starwind-runtime/hover-card";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../src/components/starwind-runtime/navigation-menu";
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
  Sidebar,
  SidebarContent,
  SidebarProvider,
} from "../src/components/starwind-runtime/sidebar";
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
import { Toaster } from "../src/components/starwind-runtime/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../src/components/starwind-runtime/tooltip";

const PORTABLE_CLOSURE_EXPORTS = [
  "Alert",
  "AlertDescription",
  "AlertTitle",
  "AspectRatio",
  "Badge",
  "Breadcrumb",
  "BreadcrumbEllipsis",
  "BreadcrumbItem",
  "BreadcrumbLink",
  "BreadcrumbList",
  "BreadcrumbPage",
  "BreadcrumbSeparator",
  "ButtonGroup",
  "ButtonGroupSeparator",
  "ButtonGroupText",
  "Card",
  "CardAction",
  "CardContent",
  "CardDescription",
  "CardFooter",
  "CardHeader",
  "CardTitle",
  "InputGroup",
  "InputGroupAddon",
  "InputGroupButton",
  "InputGroupInput",
  "InputGroupText",
  "InputGroupTextarea",
  "Item",
  "ItemActions",
  "ItemContent",
  "ItemDescription",
  "ItemFooter",
  "ItemGroup",
  "ItemHeader",
  "ItemMedia",
  "ItemSeparator",
  "ItemTitle",
  "Kbd",
  "KbdGroup",
  "Label",
  "NativeSelect",
  "NativeSelectOptGroup",
  "NativeSelectOption",
  "Pagination",
  "PaginationContent",
  "PaginationEllipsis",
  "PaginationItem",
  "PaginationLink",
  "PaginationNext",
  "PaginationPrevious",
  "Prose",
  "Separator",
  "Skeleton",
  "Spinner",
  "Table",
  "TableBody",
  "TableCaption",
  "TableCell",
  "TableFoot",
  "TableHead",
  "TableHeader",
  "TableRow",
  "Textarea",
  "Video",
] as const;

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
    h(StyledMenusFloatingFixture),
    h(StyledComplexServicesFixture),
    h(PortableStyledClosureFixture),
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
  assertPortableClosureExports(host, "SSR");
  assert(
    Array.from(host.querySelectorAll("[data-sw-button]")).filter(
      (element) => !element.closest("#hydrated-portable-styled-closure"),
    ).length === 5,
    "Styled SSR Button inventory drifted",
  );
  assert(
    host.querySelectorAll(
      '#hydrated-styled-combobox [data-sw-button][data-slot="combobox-trigger"]',
    ).length === 1,
    "Styled SSR Combobox duplicated its InputGroupButton Trigger",
  );
  assert(
    host.querySelectorAll('#hydrated-styled-combobox [data-sw-button][data-slot="combobox-clear"]')
      .length === 1,
    "Styled SSR Combobox duplicated its InputGroupButton Clear",
  );
  assert(
    host.querySelectorAll("[data-sw-checkbox]").length === 1,
    "Styled SSR duplicated Checkbox",
  );
  assert(host.querySelectorAll("[data-sw-select]").length === 1, "Styled SSR duplicated Select");
  assert(host.querySelectorAll("[data-sw-dialog]").length === 1, "Styled SSR duplicated Dialog");
  assert(host.querySelectorAll("[data-sw-drawer]").length === 1, "Styled SSR duplicated Sheet");
  assert(host.querySelectorAll("[data-sw-popover]").length === 1, "Styled SSR duplicated Popover");
  assert(host.querySelectorAll("[data-sw-tooltip]").length === 1, "Styled SSR duplicated Tooltip");
  assert(
    host.querySelectorAll("[data-sw-preview-card]").length === 1,
    "Styled SSR duplicated Hover Card",
  );
  assert(
    host.querySelectorAll("[data-sw-menu]:not([data-sw-context-menu])").length === 1,
    "Styled SSR duplicated Dropdown",
  );
  assert(
    host.querySelectorAll("[data-sw-context-menu]").length === 1,
    "Styled SSR duplicated Context Menu",
  );
  assert(
    host.querySelectorAll("[data-sw-nav-menu]").length === 1,
    "Styled SSR duplicated Navigation Menu",
  );
  assert(
    host.querySelectorAll("[data-sw-combobox]").length === 1,
    "Styled SSR duplicated Combobox",
  );
  assert(
    host.querySelectorAll("[data-sw-carousel]").length === 1,
    "Styled SSR duplicated Carousel",
  );
  assert(
    host.querySelectorAll("[data-sw-sidebar-provider]").length === 1,
    "Styled SSR duplicated Sidebar",
  );
  assert(
    host.querySelectorAll("[data-sw-color-picker]").length === 1,
    "Styled SSR duplicated Color Picker",
  );
  assert(
    host.querySelectorAll("[data-sw-toast-viewport]").length === 1,
    "Styled SSR duplicated Toast viewport",
  );
  assert(
    Array.from(host.querySelectorAll("[data-sw-input]")).filter(
      (element) => !element.closest("#hydrated-portable-styled-closure"),
    ).length === 2,
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
        target.closest(
          "[data-sw-select-portal], [data-sw-popover-portal], [data-sw-tooltip-portal], [data-sw-preview-card-portal], [data-sw-menu-portal], [data-sw-nav-menu-portal], [data-sw-combobox-portal]",
        ) !== null),
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
    assertPortableClosureExports(host, "hydration");
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
      host.querySelectorAll(
        '#hydrated-styled-combobox [data-sw-button][data-slot="combobox-trigger"]',
      ).length === 1,
      "Styled hydration duplicated the Combobox InputGroupButton Trigger",
    );
    assert(
      host.querySelectorAll(
        '#hydrated-styled-combobox [data-sw-button][data-slot="combobox-clear"]',
      ).length === 1,
      "Styled hydration duplicated the Combobox InputGroupButton Clear",
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
      "#hydrated-styled-tooltip",
      "#hydrated-styled-hover-card",
      "#hydrated-styled-dropdown",
      "#hydrated-styled-context-menu",
      "#hydrated-styled-navigation-menu",
      "#hydrated-styled-combobox",
      "#hydrated-styled-carousel",
      "#hydrated-styled-sidebar",
      "#hydrated-styled-color-picker",
      "#hydrated-styled-toaster",
    ]) {
      assert(
        host.querySelectorAll(selector).length === 1,
        `Styled hydration duplicated ${selector}`,
      );
    }
    const uncontrolledFormat = host.querySelector<HTMLSelectElement>(
      '#hydrated-styled-color-picker [data-slot="color-picker-native-format-select"]',
    );
    const unrelatedColorUpdate = host.querySelector<HTMLButtonElement>(
      "#hydrated-styled-color-picker-unrelated-update",
    );
    assert(uncontrolledFormat, "Styled Color Picker native format control is missing");
    assert(unrelatedColorUpdate, "Styled Color Picker unrelated update control is missing");
    uncontrolledFormat.value = "hsl";
    uncontrolledFormat.dispatchEvent(new Event("change", { bubbles: true }));
    await frame();
    unrelatedColorUpdate.click();
    await frame();
    assert(
      uncontrolledFormat.value === "hsl",
      "Styled Color Picker reset its uncontrolled format after an unrelated render",
    );
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

    const tooltipTrigger = host.querySelector<HTMLElement>("#hydrated-styled-tooltip-trigger");
    const tooltipPopup = document.body.querySelector<HTMLElement>(
      "#hydrated-styled-tooltip-content",
    );
    assert(tooltipTrigger, "Styled Tooltip trigger is missing");
    assert(tooltipPopup, "Styled Tooltip content did not Teleport to body");
    tooltipTrigger.focus();
    await runtimeMutationTurn();
    assert(!tooltipPopup.hidden, "Styled Tooltip did not open after hydration");
    tooltipTrigger.blur();
    await runtimeMutationTurn();

    const dropdownTrigger = host.querySelector<HTMLButtonElement>(
      "#hydrated-styled-dropdown-trigger",
    );
    assert(dropdownTrigger, "Styled Dropdown trigger is missing");
    dropdownTrigger.click();
    await frame();
    assert(
      dropdownTrigger.getAttribute("aria-expanded") === "true",
      "Styled Dropdown did not open",
    );
    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );
    await frame();

    const navigationTrigger = host.querySelector<HTMLButtonElement>(
      "#hydrated-styled-navigation-trigger-guides",
    );
    assert(navigationTrigger, "Styled Navigation Menu trigger is missing");
    navigationTrigger.click();
    await frame();
    assert(
      navigationTrigger.getAttribute("aria-expanded") === "true",
      "Styled Navigation Menu did not open",
    );
    host.querySelector<HTMLButtonElement>("#hydrated-styled-navigation-add")?.click();
    await frame();
    assert(
      host.querySelectorAll("[data-sw-nav-menu-item]").length === 3,
      "Styled Navigation Menu did not refresh dynamic items",
    );

    const comboboxInput = host.querySelector<HTMLInputElement>("#hydrated-styled-combobox-input");
    assert(comboboxInput, "Styled Combobox input is missing");
    comboboxInput.click();
    await frame();
    host.querySelector<HTMLButtonElement>("#hydrated-styled-combobox-add")?.click();
    await frame();
    assert(
      document.body.querySelectorAll("[data-sw-combobox-item]").length === 3,
      "Styled Combobox did not refresh dynamic items",
    );
    comboboxInput.value = "cher";
    comboboxInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await frame();
    document.body
      .querySelector<HTMLElement>('[data-sw-combobox-item][data-value="cherry"]')
      ?.click();
    await frame();
    assert(
      host.querySelector("#hydrated-styled-combobox")?.getAttribute("data-value") === "cherry",
      "Styled Combobox did not select a hydrated dynamic item",
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
  for (const selector of [
    ":scope > [data-sw-tooltip-portal]",
    ":scope > [data-sw-preview-card-portal]",
    ":scope > [data-sw-menu-portal]",
    ":scope > [data-sw-nav-menu-portal]",
    ":scope > [data-sw-combobox-portal]",
  ]) {
    assert(
      document.body.querySelectorAll(selector).length === 0,
      `Styled floating portal leaked after unmount: ${selector}`,
    );
  }
  assert(!document.body.hasAttribute("data-sw-scroll-locked"), "Styled Dialog leaked scroll lock");
}

function closureProps(exportName: string, props: Record<string, unknown> = {}) {
  return { ...props, "data-closure-export": exportName };
}

const PortableStyledClosureFixture = defineComponent({
  name: "PortableStyledClosureFixture",
  setup: () => () =>
    h("section", { id: "hydrated-portable-styled-closure" }, [
      h(Alert, closureProps("Alert", { variant: "warning" }), {
        default: () => [
          h(AlertTitle, closureProps("AlertTitle"), () => "Hydrated alert"),
          h(AlertDescription, closureProps("AlertDescription"), () => "Portable status"),
        ],
      }),
      h(
        AspectRatio,
        closureProps("AspectRatio", { as: "figure", ratio: 16 / 9 }),
        () => "Hydrated aspect ratio",
      ),
      h(Badge, closureProps("Badge", { variant: "success" }), () => "Ready"),
      h(Breadcrumb, closureProps("Breadcrumb", { "aria-label": "Hydrated path" }), () =>
        h(BreadcrumbList, closureProps("BreadcrumbList"), () => [
          h(BreadcrumbItem, closureProps("BreadcrumbItem"), () =>
            h(BreadcrumbLink, closureProps("BreadcrumbLink", { href: "/" }), () => "Home"),
          ),
          h(BreadcrumbSeparator, closureProps("BreadcrumbSeparator")),
          h(BreadcrumbItem, { id: "hydrated-breadcrumb-more" }, () =>
            h(BreadcrumbEllipsis, closureProps("BreadcrumbEllipsis")),
          ),
          h(BreadcrumbSeparator, { id: "hydrated-breadcrumb-current-separator" }),
          h(BreadcrumbItem, { id: "hydrated-breadcrumb-current" }, () =>
            h(BreadcrumbPage, closureProps("BreadcrumbPage"), () => "Closure"),
          ),
        ]),
      ),
      h(ButtonGroup, closureProps("ButtonGroup"), () => [
        h("button", { type: "button" }, "Previous"),
        h(ButtonGroupSeparator, closureProps("ButtonGroupSeparator")),
        h(ButtonGroupText, closureProps("ButtonGroupText"), () => "2 of 5"),
      ]),
      h(Card, closureProps("Card", { size: "sm" }), () => [
        h(CardHeader, closureProps("CardHeader"), () => [
          h(CardTitle, closureProps("CardTitle"), () => "Hydrated card"),
          h(CardDescription, closureProps("CardDescription"), () => "Portable anatomy"),
          h(CardAction, closureProps("CardAction"), () => "Vue"),
        ]),
        h(CardContent, closureProps("CardContent"), () => "SSR content"),
        h(CardFooter, closureProps("CardFooter"), () => "Order 11"),
      ]),
      h(InputGroup, closureProps("InputGroup"), () => [
        h(InputGroupAddon, closureProps("InputGroupAddon", { align: "inline-start" }), () =>
          h(InputGroupText, closureProps("InputGroupText"), () => "@"),
        ),
        h(
          InputGroupInput,
          closureProps("InputGroupInput", { "aria-label": "Hydrated handle", value: "starwind" }),
        ),
        h(InputGroupButton, closureProps("InputGroupButton", { type: "button" }), () => "Copy"),
      ]),
      h(InputGroup, { id: "hydrated-input-group-textarea" }, () =>
        h(
          InputGroupTextarea,
          closureProps("InputGroupTextarea", { "aria-label": "Hydrated release notes" }),
        ),
      ),
      h(ItemGroup, closureProps("ItemGroup"), () =>
        h(Item, closureProps("Item", { as: "article", variant: "outline" }), () => [
          h(ItemHeader, closureProps("ItemHeader"), () => "Catalog record"),
          h(ItemMedia, closureProps("ItemMedia", { variant: "icon" }), () => "SW"),
          h(ItemContent, closureProps("ItemContent"), () => [
            h(ItemTitle, closureProps("ItemTitle"), () => "Hydrated item"),
            h(ItemDescription, closureProps("ItemDescription"), () => "Portable content"),
          ]),
          h(ItemActions, closureProps("ItemActions"), () => "Verified"),
          h(ItemSeparator, closureProps("ItemSeparator")),
          h(ItemFooter, closureProps("ItemFooter"), () => "Order 11"),
        ]),
      ),
      h(KbdGroup, closureProps("KbdGroup"), () => [
        h(Kbd, closureProps("Kbd"), () => "Ctrl"),
        h("span", "+"),
        h(Kbd, { id: "hydrated-kbd-secondary" }, () => "K"),
      ]),
      h(Label, closureProps("Label", { for: "hydrated-labelled-input" }), () => "Project"),
      h("input", { id: "hydrated-labelled-input", value: "Starwind" }),
      h(
        NativeSelect,
        closureProps("NativeSelect", {
          "aria-label": "Hydrated deployment region",
          value: "eu",
        }),
        {
          default: () => [
            h(NativeSelectOptGroup, closureProps("NativeSelectOptGroup", { label: "Europe" }), () =>
              h(
                NativeSelectOption,
                closureProps("NativeSelectOption", { value: "eu" }),
                () => "Europe",
              ),
            ),
          ],
          icon: () => h("span", { "data-hydrated-select-icon": "" }, "⌄"),
        },
      ),
      h(Pagination, closureProps("Pagination", { "aria-label": "Hydrated pages" }), () =>
        h(PaginationContent, closureProps("PaginationContent"), () => [
          h(PaginationItem, closureProps("PaginationItem"), () =>
            h(PaginationPrevious, closureProps("PaginationPrevious", { href: "#" })),
          ),
          h(PaginationItem, { id: "hydrated-page-one" }, () =>
            h(
              PaginationLink,
              closureProps("PaginationLink", { href: "#", isActive: true }),
              () => "1",
            ),
          ),
          h(PaginationItem, { id: "hydrated-page-more" }, () =>
            h(PaginationEllipsis, closureProps("PaginationEllipsis")),
          ),
          h(PaginationItem, { id: "hydrated-page-next" }, () =>
            h(PaginationNext, closureProps("PaginationNext", { href: "#" })),
          ),
        ]),
      ),
      h(Prose, closureProps("Prose"), () => [
        h("h2", "Hydrated prose"),
        h("p", "Semantic server-rendered content."),
      ]),
      h(Separator, closureProps("Separator")),
      h(Skeleton, closureProps("Skeleton", { class: "h-4 w-24" })),
      h(Spinner, closureProps("Spinner")),
      h(Table, closureProps("Table"), () => [
        h(TableCaption, closureProps("TableCaption"), () => "Hydrated inventory"),
        h(TableHeader, closureProps("TableHeader"), () =>
          h(TableRow, closureProps("TableRow"), () => [
            h(TableHead, closureProps("TableHead"), () => "Group"),
            h(TableHead, { id: "hydrated-table-status-head" }, () => "Status"),
          ]),
        ),
        h(TableBody, closureProps("TableBody"), () =>
          h(TableRow, { id: "hydrated-table-body-row" }, () => [
            h(TableCell, closureProps("TableCell"), () => "Closure"),
            h(TableCell, { id: "hydrated-table-ready-cell" }, () => "Ready"),
          ]),
        ),
        h(TableFoot, closureProps("TableFoot"), () =>
          h(TableRow, { id: "hydrated-table-foot-row" }, () =>
            h(TableCell, { colspan: 2 }, () => "65 exports"),
          ),
        ),
      ]),
      h(
        Textarea,
        closureProps("Textarea", {
          "aria-label": "Hydrated review notes",
          name: "notes",
          rows: 3,
        }),
      ),
      h(
        Video,
        closureProps("Video", {
          "aria-label": "Hydrated video preview",
          preload: "none",
          src: "data:video/mp4;base64,AAAA",
        }),
      ),
    ]),
});

const StyledComplexServicesFixture = defineComponent({
  name: "StyledComplexServicesFixture",
  setup() {
    const sidebarOpen = ref(true);
    const colorValue = ref("#2563eb");
    const colorLabel = ref("Hydrated color");
    return () =>
      h("section", { id: "hydrated-styled-complex-services" }, [
        h(Carousel, { id: "hydrated-styled-carousel" }, () => [
          h(CarouselContent, null, () => [
            h(CarouselItem, null, () => "Hydrated slide one"),
            h(CarouselItem, null, () => "Hydrated slide two"),
          ]),
          h(CarouselPrevious, { id: "hydrated-styled-carousel-previous" }),
          h(CarouselNext, { id: "hydrated-styled-carousel-next" }),
        ]),
        h(
          SidebarProvider,
          {
            id: "hydrated-styled-sidebar",
            open: sidebarOpen.value,
            "onUpdate:open": (value: boolean) => (sidebarOpen.value = value),
          },
          () => [
            h(Sidebar, { collapsible: "none" }, () => [
              h(SidebarContent, null, () => "Hydrated sidebar content"),
            ]),
          ],
        ),
        h(ColorPicker, {
          defaultValue: colorValue.value,
          formatControl: "native",
          id: "hydrated-styled-color-picker",
          inline: true,
          label: colorLabel.value,
          showEyeDropper: false,
        }),
        h(
          "button",
          {
            id: "hydrated-styled-color-picker-unrelated-update",
            onClick: () => (colorLabel.value = `${colorLabel.value} updated`),
            type: "button",
          },
          "Update hydrated color label",
        ),
        h(Toaster, { id: "hydrated-styled-toaster", limit: 2 }),
      ]);
  },
});

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

const StyledMenusFloatingFixture = defineComponent({
  setup() {
    const navigationItems = ref([
      { label: "Guides", value: "guides" },
      { label: "Examples", value: "examples" },
    ]);
    const navigationValue = ref<string | null>(null);
    const comboboxItems = ref([
      { label: "Apple", value: "apple" },
      { label: "Banana", value: "banana" },
    ]);
    const comboboxValue = ref<string | null>("apple");
    return () => [
      h(Tooltip, { id: "hydrated-styled-tooltip", openDelay: 0 }, () => [
        h(TooltipTrigger, null, () =>
          h("button", { id: "hydrated-styled-tooltip-trigger" }, "Tooltip trigger"),
        ),
        h(TooltipContent, { id: "hydrated-styled-tooltip-content" }, () => "Tooltip content"),
      ]),
      h(HoverCard, { closeDelay: 0, id: "hydrated-styled-hover-card", openDelay: 0 }, () => [
        h(
          HoverCardTrigger,
          { id: "hydrated-styled-hover-card-trigger" },
          () => "Hover Card trigger",
        ),
        h(
          HoverCardContent,
          { id: "hydrated-styled-hover-card-content" },
          () => "Hover Card content",
        ),
      ]),
      h(Dropdown, { id: "hydrated-styled-dropdown" }, () => [
        h(DropdownTrigger, { id: "hydrated-styled-dropdown-trigger" }, () => "Dropdown trigger"),
        h(DropdownContent, { id: "hydrated-styled-dropdown-content" }, () => [
          h(DropdownItem, null, () => "Rename"),
          h(DropdownSub, null, () => [
            h(DropdownSubTrigger, null, () => "Move"),
            h(DropdownSubContent, null, () => h(DropdownItem, null, () => "Archive")),
          ]),
        ]),
      ]),
      h(ContextMenu, { id: "hydrated-styled-context-menu" }, () => [
        h(ContextMenuTrigger, { id: "hydrated-styled-context-menu-trigger" }, () => "Canvas"),
        h(ContextMenuContent, { id: "hydrated-styled-context-menu-content" }, () => [
          h(ContextMenuItem, null, () => "Rename"),
          h(ContextMenuSub, null, () => [
            h(ContextMenuSubTrigger, null, () => "Insert"),
            h(ContextMenuSubContent, null, () => h(ContextMenuItem, null, () => "Frame")),
          ]),
        ]),
      ]),
      h(
        NavigationMenu,
        {
          id: "hydrated-styled-navigation-menu",
          modelValue: navigationValue.value,
          "onUpdate:modelValue": (value: string | null) => (navigationValue.value = value),
        },
        () =>
          h(NavigationMenuList, null, () =>
            navigationItems.value.map((item) =>
              h(NavigationMenuItem, { key: item.value, value: item.value }, () => [
                h(
                  NavigationMenuTrigger,
                  { id: `hydrated-styled-navigation-trigger-${item.value}` },
                  () => item.label,
                ),
                h(NavigationMenuContent, null, () =>
                  h(NavigationMenuLink, { href: `#${item.value}` }, () => item.label),
                ),
              ]),
            ),
          ),
      ),
      h(
        "button",
        {
          id: "hydrated-styled-navigation-add",
          onClick: () => navigationItems.value.push({ label: "Patterns", value: "patterns" }),
          type: "button",
        },
        "Add navigation item",
      ),
      h(
        Combobox,
        {
          id: "hydrated-styled-combobox",
          modelValue: comboboxValue.value,
          "onUpdate:modelValue": (value: string | null) => (comboboxValue.value = value),
        },
        () => [
          h(ComboboxInput, { id: "hydrated-styled-combobox-input", showClear: true }),
          h(ComboboxContent, { id: "hydrated-styled-combobox-content" }, () =>
            comboboxItems.value.map((item) =>
              h(ComboboxItem, { key: item.value, value: item.value }, () =>
                h(ComboboxItemText, null, () => item.label),
              ),
            ),
          ),
        ],
      ),
      h(
        "button",
        {
          id: "hydrated-styled-combobox-add",
          onClick: () => comboboxItems.value.push({ label: "Cherry", value: "cherry" }),
          type: "button",
        },
        "Add combobox item",
      ),
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

function assertPortableClosureExports(root: ParentNode, phase: string): void {
  const actual = Array.from(root.querySelectorAll<HTMLElement>("[data-closure-export]"))
    .map((element) => element.dataset.closureExport ?? "")
    .sort();
  const expected = [...PORTABLE_CLOSURE_EXPORTS].sort();
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `Portable closure ${phase} export inventory drifted: ${JSON.stringify(actual)}`,
  );
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
