import assert from "node:assert/strict";
import type { Page } from "playwright";
import { starwindStyledContracts } from "../../../../contracts/styled/starwind.js";
import type { DirectionAssertionContext } from "../../assertion-receipts.js";
import type { DirectionCase, DirectionExpectation, Target } from "../../inventory.js";
import { waitHidden } from "../../waits.js";

type Value = string | number | boolean | { expression: string };
type Child = FixtureNode | string;
type FixtureNode = {
  component?: string;
  name: string;
  packageId?: string;
  props: Record<string, Value>;
  children: Child[];
};
type RawFactory = {
  component: string;
  factory: string;
  family: string;
};
type RowSpec = {
  id: string;
  root: string;
  tree: FixtureNode;
  focusSelector?: string;
  labelSelector?: string;
  motionPart?: string;
  rawFactories?: RawFactory[];
  implicitSlots?: string[];
  slotlessParts?: string[];
  physicalExceptions: string[];
  rowAssertions: string[];
};
type GeometryEvidence = {
  part: string;
  slot: string | null;
  direction: string;
  x: number;
  y: number;
  width: number;
  height: number;
  className: string;
  textAlign: string;
  transform: string;
};
type BaselineEvidence = {
  viewport: { width: number; height: number };
  geometry: GeometryEvidence[];
  roots: Record<string, GeometryEvidence>;
  focus: Record<string, unknown> | null;
  labels: Record<string, unknown>[];
  variants: Record<string, unknown>[];
  motion: Record<string, unknown>;
};

const text = (value: string): string => value;
const h = (
  name: string,
  props: Record<string, Value> = {},
  children: Child[] = [],
): FixtureNode => ({ name, props, children });
const p = (
  packageId: string,
  name: string,
  props: Record<string, Value> = {},
  children: Child[] = [],
): FixtureNode => ({ component: name, name, packageId, props, children });
const part = (
  name: string,
  props: Record<string, Value> = {},
  children: Child[] = [],
): FixtureNode => p("ROW", name, props, children);
const external = (
  packageId: string,
  name: string,
  props: Record<string, Value> = {},
  children: Child[] = [],
): FixtureNode => p(packageId, name, props, children);

const specs: RowSpec[] = [
  {
    id: "dropdown",
    root: "Dropdown",
    tree: part("Dropdown", { modal: false }, [
      part("DropdownTrigger", { "data-direction-focus": true, "data-direction-action": "open" }, [
        text("قائمة الحساب • Account 42"),
      ]),
      part("DropdownContent", { side: "right", align: "start" }, [
        part("DropdownLabel", { inset: true }, [text("הגדרות مساحة العمل")]),
        part("DropdownGroup", {}, [
          part("DropdownItem", { inset: true }, [
            text("الحساب الشخصي"),
            part("DropdownShortcut", {}, [text("Ctrl+K")]),
          ]),
          part("DropdownCheckboxItem", { defaultChecked: true }, [
            part("DropdownCheckboxItemIndicator", {}, [text("✓")]),
            text("התראות البريد"),
          ]),
          part("DropdownRadioGroup", { defaultValue: "compact", "aria-label": "Density" }, [
            part("DropdownRadioItem", { value: "compact" }, [
              part("DropdownRadioItemIndicator", {}, [text("•")]),
              text("Compact 24"),
            ]),
            part("DropdownRadioItem", { value: "spacious" }, [text("Spacious 48")]),
          ]),
          part("DropdownLinkItem", { href: "#rtl-documentation" }, [text("Documentation")]),
          part("DropdownSub", {}, [
            part("DropdownSubTrigger", { inset: true }, [text("خيارات إضافية")]),
            part("DropdownSubContent", { side: "left" }, [
              part("DropdownItem", {}, [text("إرسال رابط")]),
              part("DropdownSeparator"),
              part("DropdownItem", {}, [text("Copy Latin ID")]),
            ]),
          ]),
        ]),
        part("DropdownSeparator"),
        part("DropdownItem", { disabled: true, inset: true }, [text("غير متاح")]),
        part("DropdownItem", { class: "text-destructive" }, [text("حذف الحساب")]),
      ]),
    ]),
    focusSelector: '[data-direction-part="DropdownTrigger"]',
    motionPart: "DropdownContent",
    rawFactories: [{ component: "Dropdown", family: "menu", factory: "createMenu" }],
    physicalExceptions: [
      "Explicit popup sides are physical preferences. Collision handling may resolve the opposite physical side when needed to stay in the viewport.",
      "Resolved data-side and popup coordinates remain physical.",
    ],
    rowAssertions: [
      "dropdown-items-and-submenu",
      "dropdown-owner-direction",
      "dropdown-submenu-navigation",
      "dropdown-submenu-placement",
      "explicit-physical-popup-sides",
    ],
  },
  {
    id: "dropzone",
    root: "Dropzone",
    tree: part(
      "Dropzone",
      {
        id: "dropzone-root",
        multiple: true,
        accept: ".pdf,.txt",
        name: "files",
        "aria-label": "ملفات المشروع Starwind",
      },
      [
        part("DropzoneUploadIndicator", {}, [text("הנח קבצים כאן • report-final-01.pdf")]),
        part("DropzoneLoadingIndicator", {}, [text("جارٍ الرفع")]),
        part("DropzoneFilesList", {}, []),
      ],
    ),
    focusSelector: "[data-sw-dropzone]",
    rawFactories: [{ component: "Dropzone", family: "dropzone", factory: "createDropzone" }],
    physicalExceptions: [
      "File names, selection order, and FormData values remain in their native order.",
    ],
    rowAssertions: ["dropzone-accessible-root", "file-list-text-preserved"],
  },
  {
    id: "field",
    root: "FieldSet",
    tree: h("form", { name: "profile-fields" }, [
      part("FieldSet", {}, [
        part("FieldLegend", { variant: "legend" }, [text("بيانات الحساب Account 24")]),
        part("FieldGroup", { variant: "outline" }, [
          part("FieldTitle", {}, [text("פרטי משתמש")]),
          part("Field", { id: "profile-field", name: "displayName", orientation: "responsive" }, [
            part("FieldContent", {}, [
              part("FieldLabel", { for: "display-name", size: "sm" }, [text("اسم العرض")]),
              part("FieldControl", {
                id: "display-name",
                name: "displayName",
                type: "text",
                required: true,
                defaultValue: "مرحبا Starwind 42",
                "data-direction-focus": true,
                "aria-label": "اسم العرض",
              }),
              part("FieldDescription", { id: "display-name-help" }, [
                text("يظهر هذا الاسم في مساحة العمل."),
              ]),
              part("FieldError", { match: "valueMissing" }, [text("أدخل اسم العرض.")]),
              part("FieldValidity", { match: "valid" }, [text("القيمة صالحة")]),
            ]),
          ]),
          part("Field", { id: "resume-field", name: "resume", orientation: "horizontal" }, [
            part("FieldContent", {}, [
              part("FieldLabel", { for: "resume-file", size: "md" }, [text("ملف السيرة")]),
              part("FieldControl", {
                id: "resume-file",
                name: "resume",
                type: "file",
                accept: ".pdf,.txt",
                "aria-label": "Resume file",
              }),
              part("FieldDescription", {}, [text("PDF أو نص • profile-final.pdf")]),
            ]),
          ]),
          part("FieldItem", {}, [
            h("input", {
              type: "checkbox",
              id: "updates",
              name: "updates",
              value: "security",
              checked: true,
              "aria-label": "إشعارات البريد",
            }),
            h("label", { for: "updates" }, [text("הודעות אבטחה")]),
          ]),
          part("FieldSeparator", {}, [text("إعدادات إضافية")]),
        ]),
      ]),
      h("button", { type: "submit" }, [text("حفظ الملف")]),
      h("button", { type: "reset" }, [text("إعادة الضبط")]),
    ]),
    focusSelector: '[data-direction-part="FieldControl"]',
    labelSelector: '[data-direction-part="FieldLabel"]',
    rawFactories: [
      { component: "Field", family: "field", factory: "createField" },
      { component: "FieldSet", family: "fieldset", factory: "createFieldset" },
    ],
    physicalExceptions: [
      "Field grid columns remain in DOM order; form names and validation order remain stable.",
    ],
    rowAssertions: ["fieldset-and-field-labels", "field-control-value-and-validity"],
  },
  {
    id: "form",
    root: "Form",
    tree: part("Form", { name: "rtl-profile-form" }, [
      part("FormErrorSummary", { "aria-label": "أخطاء النموذج" }, [
        h("p", {}, [text("راجع البيانات قبل الإرسال.")]),
      ]),
      external("field", "FieldSet", {}, [
        external("field", "FieldLegend", {}, [text("بيانات المستخدم")]),
        external("field", "FieldGroup", {}, [
          external("field", "Field", { name: "email" }, [
            external("field", "FieldContent", {}, [
              external("field", "FieldLabel", { for: "contact-email" }, [
                text("כתובת דואר إلكتروني"),
              ]),
              external("field", "FieldControl", {
                id: "contact-email",
                name: "email",
                type: "email",
                required: true,
                defaultValue: "",
                "aria-label": "Email address",
                "data-direction-focus": true,
              }),
              external("field", "FieldError", { match: "valueMissing" }, [
                text("Enter an email address."),
              ]),
            ]),
          ]),
          external("field", "Field", { name: "username" }, [
            external("field", "FieldContent", {}, [
              external("field", "FieldLabel", { for: "contact-username" }, [text("שם משתמש")]),
              external("field", "FieldControl", {
                id: "contact-username",
                name: "username",
                type: "text",
                required: true,
                defaultValue: "alex-42",
                "aria-label": "Username",
              }),
              external("field", "FieldError", { match: "valueMissing" }, [
                text("Enter a username."),
              ]),
              external("field", "FieldDescription", {}, [
                text("الأحرف العربية واللاتينية مسموحة."),
              ]),
            ]),
          ]),
          h("div", { dir: "ltr" }, [h("code", {}, [text("Account ID: AC-204")])]),
          external("field", "FieldItem", {}, [
            h("input", {
              id: "terms-updates",
              type: "checkbox",
              name: "updates",
              value: "security",
              checked: true,
            }),
            h("label", { for: "terms-updates" }, [text("تنبيهات الأمان")]),
          ]),
        ]),
      ]),
      h("button", { type: "submit" }, [text("حفظ التغييرات")]),
      h("button", { type: "reset" }, [text("إعادة الضبط")]),
    ]),
    focusSelector: "[data-direction-focus]",
    labelSelector: '[data-direction-part="FieldLabel"]',
    rawFactories: [{ component: "Form", family: "form", factory: "createForm" }],
    physicalExceptions: [
      "Form control names, FormData entry order, and validation focus order remain stable.",
    ],
    rowAssertions: ["form-summary-start-alignment", "form-label-and-submission-order"],
  },
  {
    id: "hover-card",
    root: "HoverCard",
    tree: part("HoverCard", { openDelay: 0, closeDelay: 0 }, [
      part(
        "HoverCardTrigger",
        { href: "#profile", "data-direction-focus": true, "data-direction-action": "open" },
        [text("ملف المستخدم Alex 7")],
      ),
      part("HoverCardContent", { side: "right", align: "start" }, [
        h("strong", {}, [text("مها Cohen")]),
        h("p", {}, [text("مهندس واجهات Starwind UI")]),
        h("a", { href: "#profile-details" }, [text("פרטים נוספים")]),
      ]),
    ]),
    focusSelector: '[data-direction-part="HoverCardTrigger"]',
    motionPart: "HoverCardContent",
    rawFactories: [
      { component: "HoverCard", family: "preview-card", factory: "createPreviewCard" },
    ],
    physicalExceptions: [
      "Explicit side=right remains a physical popup side after collision handling.",
    ],
    rowAssertions: [
      "hover-card-focus-and-hover",
      "hover-card-owner-direction",
      "hover-card-physical-side",
    ],
  },
  {
    id: "image",
    root: "Image",
    tree: part("Image", {
      src: { expression: "fixtureImage" },
      alt: "نموذج واجهة Starwind • צילום בדיקה",
      width: 80,
      height: 60,
    }),
    physicalExceptions: [
      "The image aspect ratio and intrinsic dimensions remain direction-neutral.",
      "React, Vue, and Svelte are unavailable by the Astro assets contract.",
    ],
    rowAssertions: ["image-intrinsic-ratio", "image-alt-text-and-accessibility"],
  },
  {
    id: "input",
    root: "Input",
    tree: h("form", { name: "message-form" }, [
      part("Input", {
        id: "message",
        name: "message",
        type: "text",
        defaultValue: "مرحبا Starwind 42",
        placeholder: "اكتب رسالة",
        "aria-label": "رسالة",
        "data-direction-focus": true,
        size: "md",
      }),
      part("Input", {
        id: "attachment",
        name: "attachment",
        type: "file",
        accept: ".pdf,.txt",
        "aria-label": "ملف مرفق",
        "data-direction-file-input": true,
        size: "sm",
      }),
    ]),
    focusSelector: '[data-direction-part="Input"]',
    labelSelector: '[data-direction-part="Input"]',
    rawFactories: [{ component: "Input", family: "input", factory: "createInput" }],
    physicalExceptions: [
      "Input value, caret direction, selection, IME, and character order remain browser-owned.",
      "File-selector spacing follows the native control direction.",
    ],
    rowAssertions: ["native-input-value-caret-and-selection", "file-selector-gap"],
  },
  {
    id: "input-group",
    root: "InputGroup",
    slotlessParts: ["InputGroupText"],
    tree: h("form", { name: "input-group-search" }, [
      part("InputGroup", {}, [
        part("InputGroupAddon", { align: "inline-start" }, [
          part("InputGroupText", {}, [text("חיפוש")]),
        ]),
        part("InputGroupInput", {
          id: "search-query",
          name: "q",
          type: "search",
          defaultValue: "Starwind RTL 42",
          "aria-label": "بحث",
          "data-direction-focus": true,
        }),
        part("InputGroupAddon", { align: "inline-end" }, [
          part("InputGroupButton", { type: "button", "aria-label": "بحث الآن" }, [
            text("بحث"),
            external("kbd", "Kbd", {}, [text("⌘K")]),
          ]),
        ]),
      ]),
      part("InputGroup", {}, [
        part("InputGroupTextarea", {
          id: "search-notes",
          name: "notes",
          placeholder: "ملاحظات",
          defaultValue: "ملاحظات issue-42",
          "aria-label": "ملاحظات البحث",
        }),
        part("InputGroupAddon", { align: "block-end" }, [
          part("InputGroupText", {}, [text("المجموعات تعرض نتائج عربية وLatin.")]),
        ]),
      ]),
    ]),
    focusSelector: '[data-direction-part="InputGroupInput"]',
    rawFactories: [
      {
        component: "InputGroupInput",
        family: "input",
        factory: "createInput",
      },
    ],
    physicalExceptions: [
      "block-start and block-end stay on the block axis; DOM control order stays stable.",
      "Public inline-start and inline-end addon values describe logical alignment.",
      "Inline addon buttons may overlap an adjacent control by the joined-border negative margin.",
    ],
    rowAssertions: [
      "inline-addon-positions",
      "textarea-and-addon-focus",
      "control-order-preserved",
    ],
  },
  {
    id: "input-otp",
    root: "InputOtp",
    tree: h("form", { name: "otp-verification" }, [
      part(
        "InputOtp",
        {
          id: "one-time-code",
          name: "otp",
          maxLength: 6,
          defaultValue: "12",
          "aria-label": "رمز الدخول Latin digits",
          "data-direction-focus": true,
        },
        [
          part("InputOtpGroup", {}, [
            part("InputOtpSlot", { index: 0 }),
            part("InputOtpSlot", { index: 1 }),
            part("InputOtpSlot", { index: 2 }),
          ]),
          part("InputOtpSeparator", {}, [text("•")]),
          part("InputOtpGroup", {}, [
            part("InputOtpSlot", { index: 3 }),
            part("InputOtpSlot", { index: 4 }),
            part("InputOtpSlot", { index: 5 }),
          ]),
        ],
      ),
    ]),
    focusSelector: '[data-direction-part="InputOtp"]',
    rawFactories: [{ component: "InputOtp", family: "input-otp", factory: "createInputOtp" }],
    physicalExceptions: [
      "Code string, paste order, character indices, and hidden form value remain logical.",
      "Slot seams follow the visual direction while each stored character keeps its index.",
    ],
    rowAssertions: [
      "otp-physical-slot-order",
      "otp-spatial-arrows",
      "otp-value-and-form-data-order",
    ],
  },
  {
    id: "item",
    root: "ItemGroup",
    tree: part("ItemGroup", { variant: "outline" }, [
      part("Item", { variant: "default", size: "md" }, [
        part("ItemMedia", { variant: "icon" }, [text("◉")]),
        part("ItemContent", {}, [
          part("ItemHeader", {}, [
            part("ItemTitle", {}, [text("הגדרות פרופיל")]),
            part("ItemActions", {}, [
              h("a", { href: "#edit", "data-direction-focus": true }, [text("עריכה")]),
            ]),
          ]),
          part("ItemDescription", {}, [
            text("Configure Starwind UI with mixed RTL and Latin values "),
            h("code", { dir: "ltr" }, [text("issue-42")]),
          ]),
        ]),
        part("ItemFooter", {}, [text("עודכן לפני 2 דקות")]),
      ]),
      part("ItemSeparator"),
    ]),
    focusSelector: "[data-direction-focus]",
    physicalExceptions: [
      "Item actions retain their DOM order; media offsets remain on the block axis.",
    ],
    rowAssertions: ["item-actions-and-wrapping", "item-link-focus-and-dom-order"],
  },
  {
    id: "kbd",
    root: "KbdGroup",
    tree: part("KbdGroup", {}, [
      part("Kbd", {}, [text("Ctrl")]),
      h("span", { "aria-hidden": true }, [text("+")]),
      part("Kbd", {}, [text("Shift")]),
      h("span", { "aria-hidden": true }, [text("+")]),
      part("Kbd", {}, [text("K")]),
    ]),
    physicalExceptions: [
      "Caller-supplied shortcut character order and key glyph meanings remain unchanged.",
    ],
    rowAssertions: ["shortcut-label-sequence", "kbd-gap-in-mixed-direction-text"],
  },
  {
    id: "label",
    root: "Label",
    tree: h("div", {}, [
      part("Label", { for: "newsletter-email", size: "md" }, [
        text("الاشتراك في "),
        h("bdi", { dir: "ltr" }, [text("Starwind UI")]),
      ]),
      h("input", {
        id: "newsletter-email",
        type: "checkbox",
        name: "newsletter",
        value: "weekly",
        "data-direction-focus": true,
      }),
      part("Label", { for: "disabled-updates", size: "sm" }, [text("تحديثات اختيارية")]),
      h("input", { id: "disabled-updates", type: "checkbox", disabled: true }),
    ]),
    focusSelector: "[data-direction-focus]",
    labelSelector: '[data-direction-part="Label"]',
    physicalExceptions: ["Native label activation and nested LTR text retain browser behavior."],
    rowAssertions: ["label-control-association", "native-label-activation-and-disabled-style"],
  },
  {
    id: "native-select",
    root: "NativeSelect",
    tree: h("form", { name: "region-selection" }, [
      part(
        "NativeSelect",
        {
          id: "region",
          name: "region",
          size: "md",
          "aria-label": "اختر المنطقة",
        },
        [
          part("NativeSelectOption", { value: "middle-east" }, [
            text("الشرق الأوسط • Middle East"),
          ]),
          part("NativeSelectOptGroup", { label: "Europe" }, [
            part("NativeSelectOption", { value: "he-il" }, [text("ישראל")]),
            part("NativeSelectOption", { value: "de-de", disabled: true }, [text("Deutschland")]),
          ]),
          part("NativeSelectOption", { value: "us-en" }, [text("United States")]),
        ],
      ),
    ]),
    focusSelector: '[data-direction-part="NativeSelect"]',
    physicalExceptions: [
      "Native option order and selected values remain stable.",
      "The built-in downward chevron keeps its block-axis meaning.",
    ],
    rowAssertions: ["native-select-chevron-and-clearance", "native-option-order-and-selection"],
  },
  {
    id: "navigation-menu",
    root: "NavigationMenu",
    tree: h("div", {}, [
      part(
        "NavigationMenu",
        {
          "aria-label": "قائمة التنقل",
          "data-direction-horizontal-menu": true,
          orientation: "horizontal",
          openDelay: 0,
          closeDelay: 0,
          side: "bottom",
          align: "start",
          size: "sm",
        },
        [
          part("NavigationMenuList", {}, [
            part("NavigationMenuItem", { value: "products" }, [
              part(
                "NavigationMenuTrigger",
                { "data-direction-focus": true, "data-direction-action": "open" },
                [text("المنتجات")],
              ),
              part("NavigationMenuContent", {}, [
                part("NavigationMenuLink", { href: "#components" }, [
                  text("مكونات "),
                  h("span", { dir: "ltr" }, [text("Starwind")]),
                ]),
                part("NavigationMenuLink", { href: "#docs" }, [text("Documentation")]),
              ]),
            ]),
            part("NavigationMenuItem", { value: "resources" }, [
              part("NavigationMenuTrigger", {}, [text("משאבים")]),
              part("NavigationMenuContent", {}, [
                part("NavigationMenuLink", { href: "#guide" }, [text("دليل RTL")]),
              ]),
            ]),
            part("NavigationMenuItem", { value: "community" }, [
              part("NavigationMenuTrigger", {}, [text("المجتمع")]),
              part("NavigationMenuContent", {}, [
                part("NavigationMenuLink", { href: "#community" }, [text("مجتمع الدعم")]),
              ]),
            ]),
            part("NavigationMenuItem", { value: "archive" }, [
              part("NavigationMenuTrigger", { disabled: true }, [text("الأرشيف")]),
              part("NavigationMenuContent", {}, [
                part("NavigationMenuLink", { href: "#archive" }, [text("Archive")]),
              ]),
            ]),
            part("NavigationMenuIndicator"),
          ]),
        ],
      ),
      part(
        "NavigationMenu",
        {
          "aria-label": "روابط عمودية",
          "data-direction-vertical-menu": true,
          orientation: "vertical",
          openDelay: 0,
          closeDelay: 0,
        },
        [
          part("NavigationMenuList", {}, [
            part("NavigationMenuItem", { value: "vertical-products" }, [
              part("NavigationMenuTrigger", {}, [text("المنتجات العمودية")]),
              part("NavigationMenuContent", { "data-direction-vertical-menu-content": true }, [
                part("NavigationMenuLink", { href: "#vertical-components" }, [
                  text("المكونات العمودية"),
                ]),
              ]),
            ]),
            part("NavigationMenuItem", { value: "vertical-guides" }, [
              part("NavigationMenuTrigger", {}, [text("الأدلة العمودية")]),
              part("NavigationMenuContent", {}, [
                part("NavigationMenuLink", { href: "#vertical-guide" }, [text("دليل الاستخدام")]),
              ]),
            ]),
          ]),
        ],
      ),
    ]),
    focusSelector: '[data-direction-part="NavigationMenuTrigger"]',
    motionPart: "NavigationMenuContent",
    rawFactories: [
      {
        component: "NavigationMenu",
        family: "navigation-menu",
        factory: "createNavigationMenu",
      },
    ],
    implicitSlots: ["NavigationMenuPositioner"],
    physicalExceptions: [
      "Positioner coordinates and data-side values remain physical; align=start resolves to inline-start at the owning direction.",
      "Horizontal triggers follow physical visual movement; vertical triggers open toward inline-end; arbitrary popup content keeps sequential ArrowRight/ArrowDown and ArrowLeft/ArrowUp aliases.",
    ],
    rowAssertions: [
      "horizontal-trigger-keys",
      "navigation-menu-popup-arrow-aliases",
      "navigation-menu-vertical-trigger-inline-end",
      "navigation-menu-owner-direction",
      "positioner-physical-side",
      "positioner-viewport-bounds",
      "positioner-rtl-alignment-and-indicator",
    ],
  },
  {
    id: "pagination",
    root: "Pagination",
    tree: part("Pagination", { "aria-label": "التنقل بين الصفحات" }, [
      part("PaginationContent", {}, [
        part("PaginationItem", {}, [
          part("PaginationPrevious", { href: "#page-1", "aria-label": "Previous page" }),
        ]),
        part("PaginationItem", {}, [
          part(
            "PaginationLink",
            {
              href: "#page-2",
              isActive: true,
              "aria-label": "Page 2",
              "data-direction-focus": true,
            },
            [text("2")],
          ),
        ]),
        part("PaginationItem", {}, [part("PaginationEllipsis", { "aria-label": "More pages" })]),
        part("PaginationItem", {}, [
          part("PaginationNext", { href: "#page-3", "aria-label": "Next page" }),
        ]),
      ]),
    ]),
    focusSelector: '[data-direction-part="PaginationLink"]',
    physicalExceptions: ["Previous and Next labels and page-number DOM order remain logical."],
    rowAssertions: ["current-page-and-link-order", "previous-next-default-glyphs"],
  },
  {
    id: "popover",
    root: "Popover",
    tree: part("Popover", { closeOnEscape: true }, [
      part("PopoverTrigger", { "data-direction-focus": true, "data-direction-action": "open" }, [
        text("فتح التفاصيل • Open details"),
      ]),
      part("PopoverContent", { side: "left", align: "start" }, [
        part("PopoverHeader", {}, [
          part("PopoverTitle", {}, [text("تفاصيل الفاتورة")]),
          part("PopoverDescription", {}, [text("Invoice INV-204 • פרטי תשלום")]),
        ]),
      ]),
    ]),
    focusSelector: '[data-direction-part="PopoverTrigger"]',
    motionPart: "PopoverContent",
    rawFactories: [{ component: "Popover", family: "popover", factory: "createPopover" }],
    physicalExceptions: [
      "Explicit side=left and resulting data-side remain physical.",
      "Positioner x/y coordinates and physical transforms retain their meanings.",
    ],
    rowAssertions: [
      "popover-escape-and-focus-return",
      "popover-owner-direction",
      "explicit-physical-side-and-alignment",
    ],
  },
  {
    id: "progress",
    root: "Progress",
    tree: part("Progress", {
      min: 0,
      max: 100,
      value: 25,
      label: "اكتمال التحميل",
      variant: "primary",
    }),
    motionPart: "Progress",
    rawFactories: [{ component: "Progress", family: "progress", factory: "createProgress" }],
    physicalExceptions: [
      "Numeric min/max/value and ARIA value remain unchanged in both directions.",
      "Public physical geometry variables keep their coordinate meanings.",
    ],
    rowAssertions: [
      "progress-aria-and-value",
      "progress-fill-edge-at-25-percent",
      "progress-clipped-fill-edge",
    ],
  },
  {
    id: "prose",
    root: "Prose",
    tree: part("Prose", {}, [
      h("h2", {}, [text("إرشادات Starwind RTL")]),
      h("p", {}, [
        text("نص عربي مع "),
        h("code", { dir: "ltr" }, [text('import Button from "starwind-ui"')]),
        text(" وقيمة Hebrew קצרה."),
      ]),
      h("ul", {}, [
        h("li", {}, [text("المسافة المنطقية تبدأ من inline-start.")]),
        h("li", {}, [text("الحفاظ على قيمة issue-42.")]),
      ]),
      h("blockquote", {}, [h("p", {}, [text("הטקסט נשאר בסדר המקורי.")])]),
      h("table", {}, [
        h("thead", {}, [
          h("tr", {}, [h("th", {}, [text("المكوّن")]), h("th", {}, [text("Value")])]),
        ]),
        h("tbody", {}, [h("tr", {}, [h("td", {}, [text("تقدم")]), h("td", {}, [text("25%")])])]),
      ]),
      h("details", {}, [
        h("summary", {}, [text("تفاصيل إضافية")]),
        h("p", {}, [text("نص التفاصيل مفتوح في اتجاه السياق.")]),
      ]),
    ]),
    physicalExceptions: [
      "Table column and list item order remain in document order.",
      "Code content uses an explicit LTR island; details markers follow their local scope.",
    ],
    rowAssertions: ["prose-list-table-and-details-markers", "nested-ltr-code-island"],
  },
];

const directionScopes = [
  { id: "explicit-root-ltr", expected: "ltr", ancestorDir: "rtl", rootDir: "ltr" },
  { id: "explicit-root-rtl", expected: "rtl", ancestorDir: "ltr", rootDir: "rtl" },
  { id: "inherited-ltr", expected: "ltr", ancestorDir: "ltr" },
  { id: "inherited-rtl", expected: "rtl", ancestorDir: "rtl" },
  { id: "nested-opposite-ltr", expected: "ltr", parentDir: "rtl", wrapperDir: "ltr" },
  { id: "nested-opposite-rtl", expected: "rtl", parentDir: "ltr", wrapperDir: "rtl" },
  { id: "deep-alternating-ltr", expected: "ltr", chain: ["rtl", "ltr", "rtl", "ltr"] },
  { id: "deep-alternating-rtl", expected: "rtl", chain: ["ltr", "rtl", "ltr", "rtl"] },
  { id: "live-inherited-ltr", expected: "ltr", ancestorDir: "ltr", live: true },
] as const;

const rawRuntimeSpecs: Array<{ family: string; spec: RowSpec }> = [];
const rawRuntimeFamilies = new Set<string>();
for (const spec of specs)
  for (const factory of spec.rawFactories ?? [])
    if (!rawRuntimeFamilies.has(factory.family)) {
      rawRuntimeFamilies.add(factory.family);
      rawRuntimeSpecs.push({
        family: factory.family,
        spec: { ...spec, rawFactories: [factory] },
      });
    }

const contractsById = new Map(
  starwindStyledContracts.map((contract) => [contract.component, contract]),
);
const voidTags = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function rewriteScopedIds(key: string, value: Value, copyId: string): Value {
  if (typeof value !== "string") return value;
  if (key === "id") return value + "-" + copyId;
  if (key === "for" || key === "htmlFor") return value + "-" + copyId;
  if (key === "aria-labelledby" || key === "aria-controls" || key === "aria-describedby")
    return value
      .split(/\s+/)
      .map((id) => id + "-" + copyId)
      .join(" ");
  return value;
}

function withScopeProps(
  node: FixtureNode,
  spec: RowSpec,
  scopeId: string,
  rootDir?: string,
): Record<string, Value> {
  const props: Record<string, Value> = {};
  for (const [key, value] of Object.entries(node.props))
    props[key] = rewriteScopedIds(key, value, scopeId);
  props["data-direction-part"] = node.name;
  props["data-direction-copy"] = scopeId;
  props["data-direction-row"] = spec.id;
  if (node === spec.tree && rootDir) props.dir = rootDir;
  return props;
}

function renderValue(value: Value, target: Target, key: string): string {
  if (typeof value === "boolean") {
    if (!value) return "";
    return key.startsWith("aria-") || key.startsWith("data-") ? " " + key + '="true"' : " " + key;
  }
  if (typeof value === "number") {
    if (target === "vue") return " :" + key + '="' + value + '"';
    return " " + key + "={" + value + "}";
  }
  if (typeof value === "object") {
    if (target === "vue") return " :" + key + '="' + value.expression + '"';
    return " " + key + "={" + value.expression + "}";
  }
  const outputKey =
    target === "react" && key === "for"
      ? "htmlFor"
      : target === "react" && key === "class"
        ? "className"
        : key;
  return " " + outputKey + '="' + escapeAttribute(value) + '"';
}

function renderNode(
  node: FixtureNode,
  target: Target,
  spec: RowSpec,
  scopeId: string,
  rootDir?: string,
): string {
  const props = withScopeProps(node, spec, scopeId, rootDir);
  const tag = node.name;
  const attrs = Object.entries(props)
    .map(([key, value]) => renderValue(value, target, key))
    .join("");
  const children = node.children
    .map((child) => (typeof child === "string" ? child : renderNode(child, target, spec, scopeId)))
    .join("");
  const selfClosing =
    node.children.length === 0 && (voidTags.has(tag.toLowerCase()) || !!node.component);
  if (target === "react" || target === "astro" || target === "svelte")
    return selfClosing
      ? "<" + tag + attrs + " />"
      : "<" + tag + attrs + ">" + children + "</" + tag + ">";
  return selfClosing
    ? "<" + tag + attrs + " />"
    : "<" + tag + attrs + ">" + children + "</" + tag + ">";
}

function directionScopeMarkup(spec: RowSpec, target: Target): string {
  const parts: string[] = [];
  for (const scope of directionScopes) {
    const rootDir = "rootDir" in scope && spec.id !== "dropzone" ? scope.rootDir : undefined;
    const tree = renderNode(spec.tree, target, spec, scope.id, rootDir);
    let scopeMarkup: string;
    if ("chain" in scope) {
      const inner = '<section data-direction-scope="' + scope.id + '">' + tree + "</section>";
      scopeMarkup = scope.chain
        .slice()
        .reverse()
        .reduce((child, dir) => '<div dir="' + dir + '">' + child + "</div>", inner);
    } else if ("parentDir" in scope) {
      scopeMarkup =
        '<div dir="' +
        scope.parentDir +
        '"><section data-direction-scope="' +
        scope.id +
        '" dir="' +
        scope.wrapperDir +
        '">' +
        tree +
        "</section></div>";
    } else {
      const scopeDir =
        spec.id === "dropzone" && "rootDir" in scope ? scope.rootDir : scope.ancestorDir;
      scopeMarkup =
        '<section data-direction-scope="' +
        scope.id +
        '" dir="' +
        scopeDir +
        '">' +
        tree +
        "</section>";
    }
    parts.push(scopeMarkup);
  }
  return '<main data-direction-page="' + spec.id + '" dir="ltr">' + parts.join("") + "</main>";
}

function collectImports(node: FixtureNode, imports: Map<string, Set<string>>): void {
  if (node.component && node.packageId) {
    const names = imports.get(node.packageId) ?? new Set<string>();
    names.add(node.name);
    imports.set(node.packageId, names);
  }
  for (const child of node.children) if (typeof child !== "string") collectImports(child, imports);
}

function runtimeFactoryImports(spec: RowSpec): string {
  const imports = new Map<string, Map<string, string>>();
  for (const [index, item] of (spec.rawFactories ?? []).entries()) {
    const family = imports.get(item.family) ?? new Map<string, string>();
    family.set(item.factory, "__directionFactory" + index);
    imports.set(item.family, family);
  }
  return [...imports]
    .map(([family, exports]) => {
      const named = [...exports].map(([name, alias]) => name + " as " + alias).join(", ");
      return "import { " + named + ' } from "@starwind-ui/runtime/' + family + '";';
    })
    .join("\n");
}

function rawObservationScript(spec: RowSpec): string {
  if (!spec.rawFactories?.length) return "";
  const factoryCalls = spec.rawFactories
    .map((item, index) => {
      const selector =
        spec.id === "dropzone" && item.component === "Dropzone"
          ? "[data-sw-dropzone]"
          : '[data-direction-part="' + item.component + '"]';
      return [
        "const target" +
          index +
          " = clone.matches(" +
          JSON.stringify(selector) +
          ") ? clone : clone.querySelector(" +
          JSON.stringify(selector) +
          ");",
        "if (!target" +
          index +
          ') throw new Error("Missing raw factory target ' +
          item.component +
          '");',
        "controllers.push(__directionFactory" + index + "(target" + index + "));",
      ].join(" ");
    })
    .join(" ");
  const run = (mode: "factory" | "init", direction: "ltr" | "rtl") => {
    const resultId = spec.id + "-" + mode + "-" + direction;
    const setup = mode === "factory" ? factoryCalls : "cleanup = __directionInitStarwind(host);";
    const rootSelector = '[data-direction-part="' + spec.root + '"]';
    return [
      "{",
      'const host = document.createElement("section");',
      "host.dataset.directionRawResult = " + JSON.stringify(resultId) + ";",
      "host.dir = " + JSON.stringify(direction) + ";",
      'host.style.cssText = "position:fixed;left:-10000px;top:0;width:640px;opacity:0;pointer-events:none";',
      "const clone = source.cloneNode(true);",
      'clone.querySelectorAll("[data-direction-copy]").forEach((element) => element.removeAttribute("data-direction-copy"));',
      'clone.removeAttribute("data-direction-copy"); clone.removeAttribute("dir");',
      "const suffix = " + JSON.stringify("-" + mode + "-" + direction) + ";",
      'const idMap = new Map(); clone.querySelectorAll("[id]").forEach((element) => { const oldId = element.id; element.id = oldId + suffix; idMap.set(oldId, element.id); });',
      'clone.querySelectorAll("[for],[aria-controls],[aria-describedby],[aria-labelledby]").forEach((element) => { for (const name of ["for","aria-controls","aria-describedby","aria-labelledby"]) { const value = element.getAttribute(name); if (value) element.setAttribute(name, value.split(/\\s+/).map((token) => idMap.get(token) ?? token).join(" ")); } });',
      "host.append(clone); document.body.append(host);",
      "const controllers = []; let cleanup = null;",
      "try { " + setup,
      "const root = clone.matches(" +
        JSON.stringify(rootSelector) +
        ") ? clone : clone.querySelector(" +
        JSON.stringify(rootSelector) +
        ");",
      'if (!root) throw new Error("Missing raw component root");',
      "const rect = root.getBoundingClientRect(); const style = getComputedStyle(root);",
      'const controls = Array.from(root.matches("input,select,textarea,button") ? [root] : []).concat(Array.from(root.querySelectorAll("input,select,textarea,button")));',
      'const form = root instanceof HTMLFormElement ? root : root.closest("form") ?? root.querySelector("form");',
      'const text = root.textContent?.trim() ?? ""; const label = root.getAttribute("aria-label") ?? root.getAttribute("title") ?? "";',
      "const evidence = {mode:" +
        JSON.stringify(mode) +
        ",direction:" +
        JSON.stringify(direction) +
        ',rootTag:root.tagName.toLowerCase(),resolvedDirection:style.direction,bounds:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},text:text.slice(0,240),label,controlCount:controls.length,controls:controls.map((control) => ({tag:control.tagName.toLowerCase(),type:control instanceof HTMLInputElement ? control.type : "",name:control.name ?? "",value:control instanceof HTMLInputElement && control.type === "file" ? "[file]" : control.value ?? "",labels:Array.from(control.labels ?? []).map((entry) => entry.textContent?.trim() ?? "")})),formData:form instanceof HTMLFormElement ? Array.from(new FormData(form).entries()).map(([name,value]) => [name,typeof value === "string" ? value : value.name]) : []};',
      "if (style.direction !== " +
        JSON.stringify(direction) +
        ') throw new Error("Resolved direction mismatch: " + style.direction);',
      'if (rect.width <= 0 || rect.height <= 0 || style.display === "none" || style.visibility === "hidden") throw new Error("Raw root has no rendered bounds");',
      'if (!text && !label && controls.length === 0) throw new Error("Raw root has no visible or accessible content");',
      'host.dataset.directionRawEvidence = JSON.stringify(evidence); host.dataset.directionRawStatus = "passed";',
      '} catch (error) { host.dataset.directionRawStatus = "failed"; host.dataset.directionRawError = String(error); }',
      'finally { for (const controller of controllers) if (controller && typeof controller.destroy === "function") controller.destroy(); if (cleanup && typeof cleanup.destroy === "function") cleanup.destroy(); }',
      "}",
    ].join("\n");
  };
  const sourceSelector =
    spec.id === "dropzone"
      ? '[data-direction-scope="live-inherited-ltr"] [data-sw-dropzone]'
      : '[data-direction-scope="live-inherited-ltr"] [data-direction-part="' + spec.root + '"]';
  return [
    'import { initStarwind as __directionInitStarwind } from "@starwind-ui/runtime/init-starwind";',
    runtimeFactoryImports(spec),
    "function runDirectionRawObservations() {",
    "  if (document.querySelector('[data-direction-raw-result=\"" +
      spec.id +
      "-factory-ltr\"]')) return;",
    "  const source = document.querySelector(" + JSON.stringify(sourceSelector) + ");",
    '  if (!source) throw new Error("Raw HTML source is missing");',
    run("factory", "ltr"),
    run("factory", "rtl"),
    run("init", "ltr"),
    run("init", "rtl"),
    "}",
    "runDirectionRawObservations();",
  ]
    .filter(Boolean)
    .join("\n");
}
function sourceFor(spec: RowSpec, target: Target, includeRawObservations = true): string {
  const imports = new Map<string, Set<string>>();
  collectImports(spec.tree, imports);
  if (imports.has("ROW")) {
    imports.set(spec.id, imports.get("ROW")!);
    imports.delete("ROW");
  }
  const importsText = [...imports]
    .map(
      ([packageId, names]) =>
        "import { " +
        [...names].sort().join(", ") +
        ' } from "@direction/styled-' +
        target +
        "/" +
        packageId +
        '";',
    )
    .join("\n");
  const sheetImport = 'import "@direction/sheet";';
  const rawImports = includeRawObservations ? rawObservationScript(spec) : "";
  const markup = directionScopeMarkup(spec, target);
  if (target === "astro") {
    const imageImport =
      spec.id === "image" ? 'import fixtureImage from "@/assets/images/pricing-9.jpg";\n' : "";
    return (
      "---\n" +
      importsText +
      "\n" +
      sheetImport +
      "\n" +
      imageImport +
      "---\n" +
      '<html lang="ar" dir="ltr"><head><meta charset="utf-8"><title>RTL ' +
      spec.id +
      "</title></head><body>" +
      markup +
      (spec.id === "image" ? '<p dir="rtl">وصف الصورة • fixture-42</p>' : "") +
      (rawImports
        ? "<script>\n" +
          rawImports +
          '\ndocument.dispatchEvent(new Event("starwind:init"));\n' +
          'document.dispatchEvent(new Event("astro:after-swap"));\n' +
          "</script>"
        : "") +
      "</body></html>"
    );
  }
  if (target === "react") {
    const setup =
      'import { createRoot } from "react-dom/client";\n' +
      (rawImports ? 'import { useEffect } from "react";\n' : "") +
      sheetImport +
      "\n" +
      importsText +
      "\n" +
      rawImports;
    const body = rawImports
      ? "function App() { useEffect(() => { runDirectionRawObservations(); }, []); return (" +
        markup +
        "); }"
      : "function App() { return (" + markup + "); }";
    return setup + "\n" + body + '\ncreateRoot(document.getElementById("app")).render(<App />);';
  }
  if (target === "vue") {
    return (
      '<script setup lang="ts">\n' +
      (rawImports ? 'import { onMounted } from "vue";\n' : "") +
      importsText +
      "\n" +
      sheetImport +
      "\n" +
      rawImports +
      (rawImports ? "\nonMounted(() => runDirectionRawObservations());\n" : "") +
      "</script>\n<template>" +
      markup +
      "</template>"
    );
  }
  return (
    '<script lang="ts">\n' +
    (rawImports ? 'import { onMount } from "svelte";\n' : "") +
    importsText +
    "\n" +
    sheetImport +
    "\n" +
    rawImports +
    (rawImports ? "\nonMount(() => runDirectionRawObservations());\n" : "") +
    "</script>\n" +
    markup
  );
}

function getRootPart(spec: RowSpec, copy: string): string {
  if (spec.id === "dropzone") return '[id="dropzone-root-' + copy + '"]';
  return '[data-direction-part="' + spec.root + '"][data-direction-copy="' + copy + '"]';
}

function collectVariantNodes(node: FixtureNode, result: FixtureNode[] = []): FixtureNode[] {
  if (
    node.packageId === "ROW" &&
    ["variant", "size", "orientation"].some((key) => node.props[key] !== undefined)
  )
    result.push(node);
  for (const child of node.children)
    if (typeof child !== "string") collectVariantNodes(child, result);
  return result;
}

async function openSurfaceForCopy(page: Page, spec: RowSpec, copy: string): Promise<void> {
  if (spec.id === "dropdown") {
    const trigger = page.locator(
      '[data-direction-copy="' + copy + '"][data-direction-part="DropdownTrigger"]',
    );
    const popup = page.locator(
      '[data-direction-copy="' + copy + '"][data-direction-part="DropdownContent"]',
    );
    await trigger.click();
    await popup.waitFor({ state: "visible" });
    const submenuTrigger = page.locator(
      '[data-direction-copy="' + copy + '"][data-direction-part="DropdownSubTrigger"]',
    );
    await submenuTrigger.click();
    await page
      .locator('[data-direction-copy="' + copy + '"][data-direction-part="DropdownSubContent"]')
      .waitFor({ state: "visible" });
  } else if (spec.id === "hover-card") {
    const trigger = page.locator(
      '[data-direction-copy="' + copy + '"][data-direction-part="HoverCardTrigger"]',
    );
    await trigger.hover();
    await page
      .locator('[data-direction-copy="' + copy + '"][data-direction-part="HoverCardContent"]')
      .waitFor({ state: "visible" });
  } else if (spec.id === "popover") {
    const trigger = page.locator(
      '[data-direction-copy="' + copy + '"][data-direction-part="PopoverTrigger"]',
    );
    await trigger.click();
    await page
      .locator('[data-direction-copy="' + copy + '"][data-direction-part="PopoverContent"]')
      .waitFor({ state: "visible" });
  } else if (spec.id === "navigation-menu") {
    const trigger = page
      .locator('[data-direction-copy="' + copy + '"][data-direction-part="NavigationMenuTrigger"]')
      .first();
    await trigger.press("ArrowDown");
    await page
      .locator(
        '[data-direction-copy="' + copy + '"][data-direction-part="NavigationMenuContent"]:visible',
      )
      .first()
      .waitFor({ state: "visible" });
  }
}

async function closeSurfaceForCopy(page: Page, spec: RowSpec, copy: string): Promise<void> {
  if (spec.id === "dropdown") {
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await waitHidden(
      page.locator('[data-direction-copy="' + copy + '"][data-direction-part="DropdownContent"]'),
    );
  } else if (spec.id === "hover-card") {
    await page.mouse.move(0, 0);
    await waitHidden(
      page.locator('[data-direction-copy="' + copy + '"][data-direction-part="HoverCardContent"]'),
    );
  } else if (spec.id === "popover" || spec.id === "navigation-menu") {
    await page.keyboard.press("Escape");
    const contentPart = spec.id === "popover" ? "PopoverContent" : "NavigationMenuContent";
    await waitHidden(
      page
        .locator(
          '[data-direction-copy="' + copy + '"][data-direction-part="' + contentPart + '"]:visible',
        )
        .first(),
    );
  }
}

async function captureBaseline(page: Page, spec: RowSpec): Promise<BaselineEvidence> {
  await openSurfaceForCopy(page, spec, "live-inherited-ltr");
  const geometry = await page
    .locator('[data-direction-copy="live-inherited-ltr"][data-direction-part]')
    .evaluateAll((nodes) =>
      nodes
        .filter((node) => {
          const element = node as HTMLElement;
          const style = getComputedStyle(element);
          return (
            element.getClientRects().length > 0 &&
            style.display !== "none" &&
            style.visibility !== "hidden"
          );
        })
        .map((node) => {
          const element = node as HTMLElement;
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            part: element.dataset.directionPart ?? "",
            slot: element.getAttribute("data-slot"),
            direction: style.direction,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            className: element.getAttribute("class") ?? "",
            textAlign: style.textAlign,
            transform: style.transform,
          };
        }),
    );
  const roots: Record<string, GeometryEvidence> = {};
  for (const scope of directionScopes) {
    roots[scope.id] = await page
      .locator('[data-direction-scope="' + scope.id + '"] ' + getRootPart(spec, scope.id))
      .first()
      .evaluate((node) => {
        const element = node as HTMLElement;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          part: element.dataset.directionPart ?? "",
          slot: element.getAttribute("data-slot"),
          direction: style.direction,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          className: element.getAttribute("class") ?? "",
          textAlign: style.textAlign,
          transform: style.transform,
        };
      });
  }

  let focus: Record<string, unknown> | null = null;
  if (spec.focusSelector) {
    const locator = page
      .locator('[data-direction-scope="live-inherited-ltr"] ' + spec.focusSelector)
      .first();
    await locator.focus();
    focus = await locator.evaluate((node, allowFocusWithin) => {
      const element = node as HTMLElement;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const labels =
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
          ? Array.from(element.labels ?? []).map((label) => label.textContent?.trim() ?? "")
          : [];
      return {
        part: element.dataset.directionPart ?? "",
        tag: element.tagName.toLowerCase(),
        type: element instanceof HTMLInputElement ? element.type : null,
        active: allowFocusWithin
          ? element === document.activeElement || element.contains(document.activeElement)
          : element === document.activeElement,
        name:
          element.getAttribute("aria-label") ||
          labels.filter(Boolean).join(" ") ||
          element.getAttribute("title") ||
          element.innerText?.trim() ||
          "",
        labels,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
      };
    }, spec.id === "input-otp");
    await locator.evaluate((element) => (element as HTMLElement).blur());
  }

  const labels: Record<string, unknown>[] = [];
  if (spec.labelSelector) {
    const selector = '[data-direction-scope="live-inherited-ltr"] ' + spec.labelSelector;
    labels.push(
      ...(await page.locator(selector).evaluateAll((nodes) =>
        nodes.map((node) => {
          const element = node as HTMLElement;
          const target =
            element instanceof HTMLLabelElement && element.htmlFor
              ? element.ownerDocument.getElementById(element.htmlFor)
              : element instanceof HTMLInputElement || element instanceof HTMLSelectElement
                ? element
                : element.querySelector("input,select,textarea");
          return {
            text:
              element.textContent?.trim() ||
              element.getAttribute("aria-label") ||
              element.getAttribute("title") ||
              "",
            tag: element.tagName.toLowerCase(),
            for: element instanceof HTMLLabelElement ? element.htmlFor : null,
            controlTag: target?.tagName.toLowerCase() ?? null,
            controlType: target instanceof HTMLInputElement ? target.type : null,
            controlName: target?.getAttribute("aria-label") ?? target?.getAttribute("name") ?? "",
          };
        }),
      )),
    );
  }

  const variants: Record<string, unknown>[] = [];
  for (const node of collectVariantNodes(spec.tree)) {
    const locator = page
      .locator(
        '[data-direction-copy="live-inherited-ltr"][data-direction-part="' + node.name + '"]',
      )
      .first();
    variants.push(
      await locator.evaluate((element) => {
        const node = element as HTMLElement;
        const style = getComputedStyle(node);
        return {
          part: node.dataset.directionPart ?? "",
          slot: node.getAttribute("data-slot"),
          className: node.getAttribute("class") ?? "",
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          paddingInlineStart: style.paddingInlineStart,
          paddingInlineEnd: style.paddingInlineEnd,
          gap: style.gap,
        };
      }),
    );
  }

  const motionLocator = page
    .locator(
      '[data-direction-copy="live-inherited-ltr"][data-direction-part="' +
        (spec.motionPart ?? spec.root) +
        '"]',
    )
    .first();
  const readMotion = () =>
    motionLocator.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        animationName: style.animationName,
        animationDuration: style.animationDuration,
        transitionDuration: style.transitionDuration,
        transformOrigin: style.transformOrigin,
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      };
    });
  const normal = await readMotion();
  await page.emulateMedia({ reducedMotion: "reduce" });
  const reduced = await readMotion();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await closeSurfaceForCopy(page, spec, "live-inherited-ltr");

  return {
    viewport: page.viewportSize() ?? { width: 0, height: 0 },
    geometry,
    roots,
    focus,
    labels,
    variants,
    motion: { normal, reduced },
  } as BaselineEvidence;
}

function assertBaselineEvidence(evidence: BaselineEvidence, spec: RowSpec): void {
  assert(evidence.geometry.length > 0, spec.id + " has no rendered public parts");
  assert.equal(evidence.roots["live-inherited-ltr"]?.direction, "ltr");
  assert.equal(evidence.roots["explicit-root-rtl"]?.direction, "rtl");
  for (const root of Object.values(evidence.roots)) {
    assert(Number.isFinite(root.x) && Number.isFinite(root.y), spec.id + " root x/y is missing");
    assert(root.width > 0 && root.height > 0, spec.id + "/" + root.part + " has no bounds");
  }
  for (const row of evidence.geometry)
    assert(
      Number.isFinite(row.x) && Number.isFinite(row.y) && Number.isFinite(row.width + row.height),
      spec.id + "/" + row.part + " bounds are incomplete",
    );
  if (evidence.focus) {
    assert.equal(evidence.focus.active, true, spec.id + " focus baseline did not focus");
    assert(String(evidence.focus.name).trim().length > 0, spec.id + " focus baseline has no name");
    assert(Number(evidence.focus.width) > 0, spec.id + " focus target has no bounds");
  }
  for (const label of evidence.labels) {
    assert(String(label.text).trim().length > 0, spec.id + " label text is empty");
    assert(label.controlTag, spec.id + " label has no associated control");
  }
  for (const variant of evidence.variants) {
    assert(String(variant.className).length > 0, spec.id + " variant has no compiled class");
    assert(variant.slot, spec.id + " variant lost public slot identity");
  }
  const motion = evidence.motion as {
    normal?: { reducedMotion?: boolean };
    reduced?: { reducedMotion?: boolean };
  };
  assert.equal(motion.normal?.reducedMotion, false, spec.id + " normal motion was not captured");
  assert.equal(motion.reduced?.reducedMotion, true, spec.id + " reduced motion was not captured");
}

async function verifyPublicPartIdentity(
  page: Page,
  spec: RowSpec,
): Promise<Record<string, string[]>> {
  const contract = contractsById.get(spec.id);
  assert(contract, "Missing Styled contract " + spec.id);
  const implicit = new Set(spec.implicitSlots ?? []);
  const expected = contract.publicExports.filter((name) => !implicit.has(name));
  const observed: Record<string, string[]> = {};
  for (const scope of directionScopes) {
    try {
      await openSurfaceForCopy(page, spec, scope.id);
      const parts = await page
        .locator('[data-direction-copy="' + scope.id + '"][data-direction-part]')
        .evaluateAll((nodes) =>
          nodes.map((node) => ({
            part: (node as HTMLElement).dataset.directionPart ?? "",
            slot: (node as HTMLElement).getAttribute("data-slot"),
          })),
        );
      if (spec.id === "dropzone") {
        const root = page.locator(getRootPart(spec, scope.id)).first();
        parts.unshift({
          part: "Dropzone",
          slot: await root.getAttribute("data-slot"),
        });
      }
      const actual = new Set(parts.map((part) => part.part));
      for (const name of expected)
        assert(actual.has(name), spec.id + "/" + scope.id + " missed public part " + name);
      for (const name of expected) {
        const identity = parts.find((part) => part.part === name);
        if (!spec.slotlessParts?.includes(name))
          assert(
            identity?.slot,
            spec.id + "/" + scope.id + "/" + name + " lost data-slot identity",
          );
      }
      for (const name of implicit) {
        const slot = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
        const count = await page.locator('[data-slot="' + slot + '"]').count();
        assert(count >= directionScopes.length, spec.id + " missed implicit public slot " + name);
      }
      observed[scope.id] = parts.map((part) => part.part + ":" + (part.slot ?? ""));
    } finally {
      await closeSurfaceForCopy(page, spec, scope.id).catch(() => undefined);
    }
  }
  return observed;
}

async function verifyScopeDirections(page: Page, spec: RowSpec): Promise<void> {
  for (const scope of directionScopes) {
    const root = page.locator(getRootPart(spec, scope.id)).first();
    const parts = await page
      .locator(
        '[data-direction-scope="' +
          scope.id +
          '"] [data-direction-copy="' +
          scope.id +
          '"][data-direction-part]',
      )
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          part: (node as HTMLElement).dataset.directionPart ?? "",
          direction: getComputedStyle(node).direction,
          expectedDir: (() => {
            const element = node as HTMLElement;
            const scopeElement = element.closest("[data-direction-scope]");
            const directionBoundary = element.closest("[dir]");
            return scopeElement && directionBoundary && scopeElement.contains(directionBoundary)
              ? directionBoundary.getAttribute("dir")
              : null;
          })(),
        })),
      );
    assert.equal(
      await root.evaluate((element) => getComputedStyle(element).direction),
      scope.expected,
    );
    for (const part of parts) {
      const expected =
        part.expectedDir === "ltr" || part.expectedDir === "rtl"
          ? part.expectedDir
          : scope.expected;
      assert.equal(
        part.direction,
        expected,
        spec.id + "/" + scope.id + "/" + part.part + " resolved direction",
      );
    }
  }
}

type FloatingEvidence = {
  engine: string;
  side: string | null;
  align: string | null;
  direction: string;
  popup: { x: number; y: number; width: number; height: number };
  trigger: { x: number; y: number; width: number; height: number };
  viewport: { width: number; height: number };
  transformOrigin: string;
  withinViewport: boolean;
  physicalSideMatchesBounds: boolean;
};

async function floatingEvidence(
  trigger: ReturnType<Page["locator"]>,
  popup: ReturnType<Page["locator"]>,
  page: Page,
): Promise<FloatingEvidence> {
  const viewport = page.viewportSize() ?? { width: 0, height: 0 };
  return page.evaluate(
    ({ triggerSelector, popupSelector, viewportSize }) => {
      const trigger = document.querySelector(triggerSelector) as HTMLElement | null;
      const popup = document.querySelector(popupSelector) as HTMLElement | null;
      if (!trigger || !popup) throw new Error("Floating trigger or popup is missing");
      const triggerRect = trigger.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();
      const triggerCenterX = triggerRect.left + triggerRect.width / 2;
      const triggerCenterY = triggerRect.top + triggerRect.height / 2;
      const popupCenterX = popupRect.left + popupRect.width / 2;
      const popupCenterY = popupRect.top + popupRect.height / 2;
      const side = popup.getAttribute("data-side");
      const physicalSideMatchesBounds =
        side === "left"
          ? popupCenterX < triggerCenterX
          : side === "right"
            ? popupCenterX > triggerCenterX
            : side === "top"
              ? popupCenterY < triggerCenterY
              : side === "bottom"
                ? popupCenterY > triggerCenterY
                : false;
      return {
        engine: "chromium",
        side,
        align: popup.getAttribute("data-align"),
        direction: getComputedStyle(popup).direction,
        popup: {
          x: popupRect.x,
          y: popupRect.y,
          width: popupRect.width,
          height: popupRect.height,
        },
        trigger: {
          x: triggerRect.x,
          y: triggerRect.y,
          width: triggerRect.width,
          height: triggerRect.height,
        },
        viewport: viewportSize,
        transformOrigin: getComputedStyle(popup).transformOrigin,
        withinViewport:
          popupRect.left >= -1 &&
          popupRect.top >= -1 &&
          popupRect.right <= viewportSize.width + 1 &&
          popupRect.bottom <= viewportSize.height + 1,
        physicalSideMatchesBounds,
      };
    },
    {
      triggerSelector: await trigger.evaluate((element) => {
        const id = element.id;
        if (!id) {
          const marker = "data-direction-evidence-trigger";
          const token = crypto.randomUUID();
          element.setAttribute(marker, token);
          return "[" + marker + '="' + token + '"]';
        }
        return "#" + CSS.escape(id);
      }),
      popupSelector: await popup.evaluate((element) => {
        const marker = "data-direction-evidence-popup";
        const token = crypto.randomUUID();
        element.setAttribute(marker, token);
        return "[" + marker + '="' + token + '"]';
      }),
      viewportSize: viewport,
    },
  );
}

function assertFloatingEvidence(evidence: FloatingEvidence, label: string): void {
  assert(
    ["top", "right", "bottom", "left"].includes(evidence.side ?? ""),
    label + " has no physical data-side: " + JSON.stringify(evidence),
  );
  assert(
    evidence.popup.width > 0 && evidence.popup.height > 0,
    label + " has no popup bounds: " + JSON.stringify(evidence),
  );
  assert(
    evidence.withinViewport,
    label + " popup crosses the viewport boundary: " + JSON.stringify(evidence),
  );
  assert(
    evidence.physicalSideMatchesBounds,
    label + " data-side disagrees with measured coordinates: " + JSON.stringify(evidence),
  );
}

async function openDropdown(
  page: Page,
  copy: string,
): Promise<{
  trigger: ReturnType<Page["locator"]>;
  popup: ReturnType<Page["locator"]>;
}> {
  const trigger = page.locator(
    '[data-direction-copy="' + copy + '"] [data-slot="dropdown-trigger"]',
  );
  const popup = page.locator(
    '[data-direction-part="DropdownContent"][data-direction-copy="' + copy + '"]',
  );
  await trigger.click();
  await popup.waitFor({ state: "visible" });
  return { trigger, popup };
}

async function verifyDropdownItemsAndSubmenu(
  page: Page,
  _spec: RowSpec,
): Promise<Record<string, unknown>> {
  const { trigger, popup } = await openDropdown(page, "explicit-root-rtl");
  const plain = popup.locator('[data-slot="dropdown-item"]').first();
  const checkbox = popup.locator('[data-slot="dropdown-checkbox-item"]');
  const radioGroup = popup.locator('[data-slot="dropdown-radio-group"]');
  const radioItems = popup.locator('[data-slot="dropdown-radio-item"]');
  const shortcut = popup.locator('[data-slot="dropdown-shortcut"]');
  const subTrigger = popup.locator('[data-slot="dropdown-sub-trigger"]');
  const destructive = popup.locator(".text-destructive");
  const before = {
    plainInset: await plain.evaluate((element) => getComputedStyle(element).paddingInlineStart),
    checkbox: await checkbox.getAttribute("aria-checked"),
    radioValue: await radioGroup.getAttribute("data-value"),
    shortcut: (await shortcut.innerText()).trim(),
    destructiveClass: await destructive.getAttribute("class"),
    nestedTrigger: (await subTrigger.count()) === 1,
    submenuTriggerText: (await subTrigger.innerText()).trim(),
  };
  assert(Number.parseFloat(before.plainInset) > 0, "Dropdown inset item lost inline spacing");
  assert.equal(before.checkbox, "true", "Dropdown checkbox initial state changed");
  assert.equal(before.radioValue, "compact", "Dropdown radio selection changed");
  assert(before.shortcut.includes("Ctrl+K"), "Dropdown shortcut text was lost");
  assert(
    String(before.destructiveClass).includes("text-destructive"),
    "Destructive item style missing",
  );
  assert.equal(before.nestedTrigger, true, "Dropdown submenu trigger is missing");

  await checkbox.click();
  const toggled = await checkbox.getAttribute("aria-checked");
  assert.equal(toggled, "false", "Dropdown checkbox did not toggle");
  await radioItems.nth(1).click();
  const selected = await radioGroup.getAttribute("data-value");
  assert.equal(selected, "spacious", "Dropdown radio item did not select");
  await trigger.press("Escape");
  await waitHidden(popup);
  return { ...before, toggled, selected };
}

async function verifyDropdownOwnerDirection(page: Page): Promise<Record<string, unknown>> {
  const { trigger, popup } = await openDropdown(page, "explicit-root-rtl");
  const evidence = await floatingEvidence(trigger, popup, page);
  try {
    assert.equal(
      evidence.direction,
      "rtl",
      "SPEC-AC-11 owner09: Dropdown portal owner direction expected rtl; observed " +
        JSON.stringify(evidence),
    );
  } finally {
    await page.keyboard.press("Escape").catch(() => undefined);
    await waitHidden(popup).catch(() => undefined);
  }
  return evidence;
}

async function verifyDropdownSubmenuNavigation(page: Page): Promise<Record<string, unknown>> {
  const { popup } = await openDropdown(page, "explicit-root-rtl");
  const subTrigger = popup.locator('[data-slot="dropdown-sub-trigger"]');
  const subPopup = page.locator(
    '[data-direction-part="DropdownSubContent"][data-direction-copy="explicit-root-rtl"]',
  );
  await subTrigger.focus();
  await subTrigger.press("ArrowLeft");
  await page.waitForTimeout(50);
  const navigation = await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    const popup = document.querySelector(
      '[data-direction-part="DropdownSubContent"][data-direction-copy="explicit-root-rtl"]',
    ) as HTMLElement | null;
    const trigger = document.querySelector(
      '[data-direction-part="DropdownSubTrigger"][data-direction-copy="explicit-root-rtl"]',
    ) as HTMLElement | null;
    return {
      opened: !!popup && !popup.hidden,
      activeText: active?.textContent?.trim() ?? "",
      popupDirection: popup ? getComputedStyle(popup).direction : null,
      triggerExpanded: trigger?.getAttribute("aria-expanded") ?? null,
    };
  });
  try {
    assert.equal(
      navigation.opened,
      true,
      "SPEC-AC-06 ticket14 owner14: RTL ArrowLeft did not open the Dropdown submenu: " +
        JSON.stringify(navigation),
    );
    const focusedFirstItem = await subPopup
      .locator("[data-sw-menu-item]:not([data-disabled])")
      .first()
      .evaluate((element) => document.activeElement === element);
    assert.equal(
      focusedFirstItem,
      true,
      "RTL ArrowLeft did not focus the first enabled child item",
    );
    await page.keyboard.press("Escape");
    await waitHidden(subPopup);
    const focusReturned = await subTrigger.evaluate(
      (element) => document.activeElement === element,
    );
    assert.equal(
      focusReturned,
      true,
      "Dropdown Escape did not return focus to its submenu trigger",
    );
    return { ...navigation, focusedFirstItem, focusReturned };
  } finally {
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.keyboard.press("Escape").catch(() => undefined);
    await waitHidden(popup).catch(() => undefined);
  }
}

async function verifyDropdownSubmenuPlacement(page: Page): Promise<FloatingEvidence> {
  const { trigger, popup } = await openDropdown(page, "explicit-root-rtl");
  const subTrigger = popup.locator('[data-slot="dropdown-sub-trigger"]');
  await subTrigger.click();
  const subPopup = page.locator(
    '[data-direction-part="DropdownSubContent"][data-direction-copy="explicit-root-rtl"]',
  );
  await subPopup.waitFor({ state: "visible" });
  const evidence = await floatingEvidence(subTrigger, subPopup, page);
  await page.keyboard.press("Escape");
  await waitHidden(subPopup);
  await trigger.press("Escape");
  await waitHidden(popup);
  assertFloatingEvidence(evidence, "Dropdown submenu");
  assert(
    evidence.side === "left" ||
      (evidence.side === "right" && evidence.trigger.x - evidence.popup.width < 0),
    "Dropdown submenu side=left flipped without a physical viewport collision: " +
      JSON.stringify(evidence),
  );
  return evidence;
}

async function verifyDropdownPhysicalSide(page: Page): Promise<Record<string, FloatingEvidence>> {
  const ltr = await openDropdown(page, "inherited-ltr");
  const ltrEvidence = await floatingEvidence(ltr.trigger, ltr.popup, page);
  await ltr.trigger.press("Escape");
  await waitHidden(ltr.popup);
  assertFloatingEvidence(ltrEvidence, "Dropdown LTR popup");
  assert(
    ltrEvidence.side === "right" ||
      (ltrEvidence.side === "left" &&
        ltrEvidence.trigger.x + ltrEvidence.trigger.width + ltrEvidence.popup.width >
          ltrEvidence.viewport.width),
    "Dropdown side=right flipped without a viewport collision: " + JSON.stringify(ltrEvidence),
  );
  const rtl = await openDropdown(page, "explicit-root-rtl");
  const rtlEvidence = await floatingEvidence(rtl.trigger, rtl.popup, page);
  await rtl.trigger.press("Escape");
  await waitHidden(rtl.popup);
  assertFloatingEvidence(rtlEvidence, "Dropdown RTL popup");
  assert(
    rtlEvidence.side === "right" ||
      (rtlEvidence.side === "left" &&
        rtlEvidence.trigger.x + rtlEvidence.trigger.width + rtlEvidence.popup.width >
          rtlEvidence.viewport.width),
    "Dropdown side=right flipped without a viewport collision: " + JSON.stringify(rtlEvidence),
  );
  return { ltr: ltrEvidence, rtl: rtlEvidence };
}

async function verifyHoverCardFocusAndHover(page: Page): Promise<Record<string, unknown>> {
  const scope = page.locator('[data-direction-scope="explicit-root-rtl"]');
  const trigger = scope.locator('[data-direction-part="HoverCardTrigger"]');
  const popup = page.locator(
    '[data-direction-part="HoverCardContent"][data-direction-copy="explicit-root-rtl"]',
  );
  await trigger.focus();
  assert.equal(
    await trigger.evaluate((element) => document.activeElement === element),
    true,
    "HoverCard trigger did not receive keyboard focus",
  );
  await trigger.hover();
  await popup.waitFor({ state: "visible" });
  const state = await popup.evaluate((element) => ({
    direction: getComputedStyle(element).direction,
    text: element.textContent?.trim() ?? "",
    side: element.getAttribute("data-side"),
    align: element.getAttribute("data-align"),
  }));
  assert(state.text.includes("مها Cohen"), "HoverCard content lost its visible profile text");
  return { focusable: true, ...state };
}

async function verifyHoverCardPortalDirection(page: Page): Promise<FloatingEvidence> {
  const trigger = page.locator(
    '[data-direction-scope="explicit-root-rtl"] [data-direction-part="HoverCardTrigger"]',
  );
  const popup = page.locator(
    '[data-direction-part="HoverCardContent"][data-direction-copy="explicit-root-rtl"]',
  );
  await trigger.hover();
  await popup.waitFor({ state: "visible" });
  const evidence = await floatingEvidence(trigger, popup, page);
  assert.equal(
    evidence.direction,
    "rtl",
    "SPEC-AC-11 owner09: HoverCard portal expected owner direction rtl; observed " +
      JSON.stringify(evidence),
  );
  return evidence;
}

async function verifyHoverCardPhysicalPlacement(page: Page): Promise<FloatingEvidence> {
  const trigger = page.locator(
    '[data-direction-scope="explicit-root-rtl"] [data-direction-part="HoverCardTrigger"]',
  );
  const popup = page.locator(
    '[data-direction-part="HoverCardContent"][data-direction-copy="explicit-root-rtl"]',
  );
  await trigger.hover();
  await popup.waitFor({ state: "visible" });
  const evidence = await floatingEvidence(trigger, popup, page);
  assertFloatingEvidence(evidence, "HoverCard popup");
  assert(
    evidence.side === "right" ||
      (evidence.side === "left" &&
        evidence.trigger.x + evidence.trigger.width + evidence.popup.width >
          evidence.viewport.width),
    "HoverCard side=right flipped without a physical viewport collision: " +
      JSON.stringify(evidence),
  );
  return evidence;
}

async function verifyPopoverEscapeAndFocus(page: Page): Promise<Record<string, unknown>> {
  const scope = page.locator('[data-direction-scope="explicit-root-rtl"]');
  const trigger = scope.locator('[data-direction-part="PopoverTrigger"]');
  const popup = page.locator(
    '[data-direction-part="PopoverContent"][data-direction-copy="explicit-root-rtl"]',
  );
  await trigger.click();
  await popup.waitFor({ state: "visible" });
  await page.keyboard.press("Escape");
  await waitHidden(popup);
  const focusReturned = await trigger.evaluate((element) => document.activeElement === element);
  assert.equal(focusReturned, true, "Popover did not return focus to its trigger after Escape");
  return { focusReturned, state: await scope.getAttribute("data-state") };
}

async function verifyPopoverOwnerDirection(page: Page): Promise<FloatingEvidence> {
  const trigger = page.locator(
    '[data-direction-scope="explicit-root-rtl"] [data-direction-part="PopoverTrigger"]',
  );
  const popup = page.locator(
    '[data-direction-part="PopoverContent"][data-direction-copy="explicit-root-rtl"]',
  );
  await trigger.click();
  await popup.waitFor({ state: "visible" });
  const evidence = await floatingEvidence(trigger, popup, page);
  try {
    assert.equal(
      evidence.direction,
      "rtl",
      "SPEC-AC-11 owner09: Popover portal expected owner direction rtl; observed " +
        JSON.stringify(evidence),
    );
  } finally {
    await page.keyboard.press("Escape").catch(() => undefined);
    await waitHidden(popup).catch(() => undefined);
  }
  return evidence;
}

async function verifyPopoverPhysicalPlacement(
  page: Page,
): Promise<Record<string, FloatingEvidence>> {
  const placements: Record<string, FloatingEvidence> = {};
  for (const copy of ["inherited-ltr", "explicit-root-rtl"]) {
    const trigger = page.locator(
      '[data-direction-scope="' + copy + '"] [data-direction-part="PopoverTrigger"]',
    );
    const popup = page.locator(
      '[data-direction-part="PopoverContent"][data-direction-copy="' + copy + '"]',
    );
    await trigger.click();
    await popup.waitFor({ state: "visible" });
    const evidence = await floatingEvidence(trigger, popup, page);
    assertFloatingEvidence(evidence, "Popover " + copy);
    assert(
      evidence.side === "left" ||
        (evidence.side === "right" && evidence.trigger.x - evidence.popup.width < 0),
      "Popover side=left flipped without a physical viewport collision: " +
        JSON.stringify(evidence),
    );
    assert.equal(evidence.align, "start");
    const topAligned = Math.abs(evidence.popup.y - evidence.trigger.y) <= 2;
    assert(topAligned, "Popover align=start did not align to the physical block start");
    placements[copy] = evidence;
    await page.keyboard.press("Escape");
    await waitHidden(popup);
  }
  return placements;
}

async function verifyNavigationMenuKeys(page: Page): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> = {};
  for (const direction of ["ltr", "rtl"] as const) {
    const triggers = page
      .locator(`[data-direction-scope="explicit-root-${direction}"]`)
      .locator('[data-direction-part="NavigationMenu"][data-direction-horizontal-menu]')
      .locator('[data-direction-part="NavigationMenuTrigger"]');
    assert.equal(await triggers.count(), 4, "NavigationMenu trigger set is incomplete");
    const first = triggers.nth(0);
    const middle = triggers.nth(1);
    const lastEnabled = triggers.nth(2);
    const centers = await Promise.all(
      [first, middle, lastEnabled].map(async (trigger) => {
        const bounds = await trigger.boundingBox();
        assert(bounds, "NavigationMenu trigger has no bounds");
        return bounds.x + bounds.width / 2;
      }),
    );
    assert.equal(Math.sign(centers[1]! - centers[0]!), direction === "rtl" ? -1 : 1);

    await lastEnabled.focus();
    await lastEnabled.press("Home");
    const homeTarget = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.textContent?.trim() ?? "",
    );
    assert.equal(homeTarget, "المنتجات", "NavigationMenu Home lost the first logical trigger");
    await first.press("End");
    const endTarget = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.textContent?.trim() ?? "",
    );
    assert.equal(endTarget, "المجتمع", "NavigationMenu End did not skip the disabled trigger");

    await middle.focus();
    await middle.press("ArrowRight");
    const right = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement;
      const bounds = active.getBoundingClientRect();
      return { text: active.textContent?.trim() ?? "", center: bounds.left + bounds.width / 2 };
    });
    assert(
      right.center > centers[1]!,
      "NavigationMenu ArrowRight missed the physical right trigger",
    );
    assert(Math.abs(right.center - (direction === "rtl" ? centers[0]! : centers[2]!)) < 0.01);

    await middle.focus();
    await middle.press("ArrowLeft");
    const left = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement;
      const bounds = active.getBoundingClientRect();
      return { text: active.textContent?.trim() ?? "", center: bounds.left + bounds.width / 2 };
    });
    assert(left.center < centers[1]!, "NavigationMenu ArrowLeft missed the physical left trigger");
    assert(Math.abs(left.center - (direction === "rtl" ? centers[2]! : centers[0]!)) < 0.01);
    results[direction] = { centers, homeTarget, endTarget, right, left };
  }
  return results;
}

async function verifyNavigationMenuVerticalTriggerInlineEnd(
  page: Page,
): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> = {};
  for (const direction of ["ltr", "rtl"] as const) {
    const copy = "explicit-root-" + direction;
    const root = page.locator(
      '[data-direction-scope="' + copy + '"] [data-direction-vertical-menu="true"]',
    );
    const trigger = root.locator('[data-direction-part="NavigationMenuTrigger"]').first();
    const content = page.locator(
      '[data-direction-copy="' + copy + '"][data-direction-vertical-menu-content="true"]:visible',
    );
    const key = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
    await trigger.press(key);
    await content.waitFor({ state: "visible", timeout: 200 }).catch(() => undefined);
    const state = {
      direction,
      key,
      expected: "open toward inline-end",
      expanded: await trigger.getAttribute("aria-expanded"),
      popupVisible: await content.isVisible().catch(() => false),
      popup: await content
        .evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return {
            slot: element.getAttribute("data-slot"),
            direction: getComputedStyle(element).direction,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          };
        })
        .catch(() => null),
      activeText: await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.textContent?.trim() ?? "",
      ),
    };
    results[direction] = state;
    if (state.popupVisible || state.expanded === "true") {
      await page.keyboard.press("Escape").catch(() => undefined);
      await waitHidden(content, 500).catch(() => undefined);
    }
  }
  assert(
    Object.values(results).every(
      (state) =>
        typeof state === "object" &&
        state !== null &&
        (state as { expanded?: string; popupVisible?: boolean }).expanded === "true" &&
        (state as { popupVisible?: boolean }).popupVisible === true,
    ),
    "SPEC-AC-05 ticket13: vertical NavigationMenu trigger must open toward inline-end in both directions: " +
      JSON.stringify(results),
  );
  return results;
}

async function verifyNavigationMenuPopupArrowAliases(page: Page): Promise<Record<string, unknown>> {
  const trigger = page
    .locator(
      '[data-direction-scope="explicit-root-rtl"] [data-direction-part="NavigationMenuTrigger"]',
    )
    .first();
  await trigger.press("ArrowDown");
  const content = page
    .locator(
      '[data-direction-part="NavigationMenuContent"][data-direction-copy="explicit-root-rtl"]:visible',
    )
    .first();
  await content.waitFor({ state: "visible" });
  const links = content.locator('[data-direction-part="NavigationMenuLink"]');
  assert.equal(await links.count(), 2, "NavigationMenu popup links are incomplete");
  try {
    await links.first().focus();
    await links.first().press("ArrowRight");
    const rightTarget = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.textContent?.trim() ?? "",
    );
    assert.equal(
      rightTarget,
      "Documentation",
      "NavigationMenu popup ArrowRight lost its sequential next alias",
    );
    await links.nth(1).press("ArrowLeft");
    const leftTarget = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.textContent?.trim() ?? "",
    );
    assert.equal(
      leftTarget,
      "مكونات Starwind",
      "NavigationMenu popup ArrowLeft lost its sequential previous alias",
    );
    return { rightTarget, leftTarget };
  } finally {
    await page.keyboard.press("Escape").catch(() => undefined);
    await waitHidden(content).catch(() => undefined);
  }
}

async function openNavigationMenuPositioner(page: Page) {
  const trigger = page
    .locator(
      '[data-direction-scope="explicit-root-rtl"] [data-direction-part="NavigationMenuTrigger"]',
    )
    .first();
  await trigger.press("ArrowDown");
  const positioner = page.locator(
    '[data-slot="navigation-menu-positioner"][data-state="open"]:visible',
  );
  await positioner.waitFor({ state: "visible" });
  return { trigger, positioner };
}

async function closeNavigationMenuPositioner(
  page: Page,
  positioner: ReturnType<Page["locator"]>,
): Promise<void> {
  await page.keyboard.press("Escape").catch(() => undefined);
  await waitHidden(positioner).catch(() => undefined);
}

async function verifyNavigationMenuPhysicalSide(page: Page): Promise<FloatingEvidence> {
  const { trigger, positioner } = await openNavigationMenuPositioner(page);
  const evidence = await floatingEvidence(trigger, positioner, page);
  await closeNavigationMenuPositioner(page, positioner);
  assert.equal(
    evidence.side,
    "bottom",
    "NavigationMenu explicit physical side changed: " + JSON.stringify(evidence),
  );
  assert(
    evidence.physicalSideMatchesBounds,
    "NavigationMenu data-side disagrees with physical coordinates: " + JSON.stringify(evidence),
  );
  return evidence;
}

async function verifyNavigationMenuViewportBounds(page: Page): Promise<FloatingEvidence> {
  const { trigger, positioner } = await openNavigationMenuPositioner(page);
  const evidence = await floatingEvidence(trigger, positioner, page);
  await closeNavigationMenuPositioner(page, positioner);
  assert(
    evidence.popup.width > 0 && evidence.popup.height > 0,
    "NavigationMenu positioner has no physical bounds: " + JSON.stringify(evidence),
  );
  assert(
    evidence.withinViewport,
    "NavigationMenu positioner crosses the viewport boundary: " + JSON.stringify(evidence),
  );
  return evidence;
}

async function verifyNavigationMenuInlineStart(page: Page): Promise<Record<string, unknown>> {
  const { trigger, positioner } = await openNavigationMenuPositioner(page);
  const evidence = await floatingEvidence(trigger, positioner, page);
  const indicator = page.locator(
    '[data-direction-copy="explicit-root-rtl"] [data-direction-part="NavigationMenuIndicator"]',
  );
  const indicatorState = await indicator.evaluate((element) => ({
    display: getComputedStyle(element).display,
    x: element.getBoundingClientRect().x,
    width: element.getBoundingClientRect().width,
    transform: getComputedStyle(element).transform,
  }));
  await closeNavigationMenuPositioner(page, positioner);
  // A trigger at the viewport edge leaves the popup at the 8px viewport padding.
  const expectedX = Math.min(
    evidence.trigger.x + evidence.trigger.width,
    evidence.viewport.width - 8,
  );
  const actualX = evidence.popup.x + evidence.popup.width;
  assert(
    evidence.physicalSideMatchesBounds,
    "NavigationMenu data-side disagrees with physical coordinates: " + JSON.stringify(evidence),
  );
  assert(
    Math.abs(actualX - expectedX) <= 3,
    "NavigationMenu align=start missed the RTL inline-start edge: " + JSON.stringify(evidence),
  );
  assert(
    indicatorState.display !== "none",
    "NavigationMenu indicator is missing from the rendered list",
  );
  assert(indicatorState.width >= 0, "NavigationMenu indicator has invalid bounds");
  return {
    requestedAlign: "start",
    resolvedPhysicalEdge: "right",
    evidence,
    indicator: indicatorState,
  };
}

async function verifyNavigationMenuOwnerDirection(page: Page): Promise<FloatingEvidence> {
  const trigger = page
    .locator(
      '[data-direction-scope="explicit-root-rtl"] [data-direction-part="NavigationMenuTrigger"]',
    )
    .first();
  const popup = page
    .locator(
      '[data-direction-part="NavigationMenuContent"][data-direction-copy="explicit-root-rtl"]:visible',
    )
    .first();
  await trigger.press("ArrowDown");
  await popup.waitFor({ state: "visible" });
  const evidence = await floatingEvidence(trigger, popup, page);
  try {
    assert.equal(
      evidence.direction,
      "rtl",
      "SPEC-AC-11 owner09: NavigationMenu portal expected owner direction rtl; observed " +
        JSON.stringify(evidence),
    );
  } finally {
    await page.keyboard.press("Escape").catch(() => undefined);
    await waitHidden(popup).catch(() => undefined);
  }
  return evidence;
}

async function verifyDropzoneAccessibleRoot(page: Page): Promise<Record<string, unknown>> {
  const root = page.locator('[data-direction-scope="explicit-root-rtl"] [data-sw-dropzone]');
  await root.focus();
  const rootRole = await root.getAttribute("role");
  const name = await root.getAttribute("aria-label");
  const labelText = (await root.innerText()).trim();
  const accessibleButton = page.getByRole("button", { name: /report-final-01\.pdf/ });
  assert.equal(rootRole, "button", "Dropzone is missing its keyboard-accessible root role");
  assert(
    (await accessibleButton.count()) > 0,
    "Dropzone's labelled button is missing from the accessibility tree: " +
      JSON.stringify({ role: rootRole, ariaLabel: name, labelText }),
  );
  await root.evaluate((element) => element.setAttribute("data-is-uploading", "true"));
  await page.waitForFunction((selector) => {
    const element = document.querySelector(selector);
    return element?.hasAttribute("data-is-uploading");
  }, '[data-direction-scope="explicit-root-rtl"] [data-sw-dropzone]');
  const loadingVisible = await root.locator("[data-sw-dropzone-loading-indicator]").isVisible();
  await root.evaluate((element) => element.setAttribute("data-is-uploading", "false"));
  const input = root.locator("[data-sw-dropzone-input]");
  const inputAccept = await input.getAttribute("accept");
  assert.equal(inputAccept, ".pdf,.txt", "Dropzone file chooser lost its accepted extensions");
  return {
    rootRole,
    name,
    labelText,
    accessibleButtonCount: await accessibleButton.count(),
    loadingVisible,
    inputAccept,
    focused: await root.evaluate((element) => element === document.activeElement),
  };
}

async function verifyDropzoneFiles(page: Page): Promise<Record<string, unknown>> {
  const root = page.locator('[data-direction-scope="explicit-root-rtl"] [data-sw-dropzone]');
  const acceptedNames = ["ملف-نهائي-42.pdf", "notes-Starwind-very-long-name.txt"];
  const dropped = await root.evaluate((element, fileNames) => {
    const files = fileNames.map(
      (name, index) => new File(["fixture-" + index], name, { type: "text/plain" }),
    );
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    element.dispatchEvent(
      new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }),
    );
    const input = element.querySelector("[data-sw-dropzone-input]") as HTMLInputElement | null;
    const list = element.querySelector("[data-sw-dropzone-files-list]");
    return {
      names: Array.from(input?.files ?? []).map((file) => file.name),
      rendered: Array.from(list?.querySelectorAll("span") ?? []).map(
        (node) => node.textContent?.trim() ?? "",
      ),
      rejected: element.hasAttribute("data-rejected"),
    };
  }, acceptedNames);
  assert.deepEqual(dropped.names, acceptedNames, "Dropzone changed native file order");
  assert(
    dropped.rendered.join(" ").includes(acceptedNames[0]!),
    "Dropzone omitted the Arabic file name",
  );
  assert(
    dropped.rendered.join(" ").includes(acceptedNames[1]!),
    "Dropzone omitted the long file name",
  );

  const rejected = await root.evaluate((element) => {
    const file = new File(["bad"], "image.png", { type: "image/png" });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    element.dispatchEvent(
      new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }),
    );
    return element.hasAttribute("data-rejected");
  });
  assert.equal(rejected, true, "Dropzone did not mark the rejected file");
  return { files: dropped.names, rendered: dropped.rendered, rejected };
}

async function verifyFieldsetAndLabels(
  page: Page,
  _spec: RowSpec,
): Promise<Record<string, unknown>> {
  const scope = page.locator('[data-direction-scope="live-inherited-ltr"]');
  const fieldset = scope.locator('[data-direction-part="FieldSet"]');
  const labels = await fieldset.locator('[data-direction-part="FieldLabel"]').evaluateAll((nodes) =>
    nodes.map((node) => {
      const label = node as HTMLLabelElement;
      const control = label.htmlFor ? label.ownerDocument.getElementById(label.htmlFor) : null;
      return {
        text: label.textContent?.trim() ?? "",
        htmlFor: label.htmlFor,
        controlId: control?.id ?? null,
        controlType: control instanceof HTMLInputElement ? control.type : null,
        associated:
          control instanceof HTMLInputElement
            ? Array.from(control.labels ?? []).includes(label)
            : false,
      };
    }),
  );
  const layout = await page.evaluate(() => {
    const field = document.querySelector(
      '[data-direction-scope="live-inherited-ltr"] [data-direction-part="Field"]',
    ) as HTMLElement | null;
    const group = document.querySelector(
      '[data-direction-scope="live-inherited-ltr"] [data-direction-part="FieldGroup"]',
    ) as HTMLElement | null;
    const legend = document.querySelector(
      '[data-direction-scope="live-inherited-ltr"] [data-direction-part="FieldLegend"]',
    ) as HTMLElement | null;
    const fieldset = document.querySelector(
      '[data-direction-scope="live-inherited-ltr"] [data-direction-part="FieldSet"]',
    ) as HTMLElement | null;
    return {
      fieldDisplay: field ? getComputedStyle(field).display : "",
      groupBorder: group ? getComputedStyle(group).borderTopWidth : "",
      legendTag: legend?.tagName.toLowerCase() ?? "",
      legendId: legend?.id ?? "",
      legendText: legend?.textContent?.trim() ?? "",
      fieldsetLabelledby: fieldset?.getAttribute("aria-labelledby") ?? "",
    };
  });
  assert.equal(await fieldset.evaluate((element) => element.tagName.toLowerCase()), "fieldset");
  assert.equal(layout.legendTag, "div", "Fieldset Legend part changed its public div element");
  assert(
    layout.legendId && layout.fieldsetLabelledby.split(/\s+/).includes(layout.legendId),
    "Fieldset root lost its Runtime-managed legend name",
  );
  assert(
    layout.legendId && layout.fieldsetLabelledby.split(/\s+/).includes(layout.legendId),
    "Fieldset root lost its runtime legend association",
  );
  assert(layout.legendText.includes("بيانات الحساب"), "FieldSet legend text changed");
  assert.equal(layout.fieldDisplay, "grid", "Responsive Field did not enter its wide layout");
  assert(Number.parseFloat(layout.groupBorder) > 0, "Outlined FieldGroup lost its border");
  assert.equal(labels.length, 2, "Field labels or file label are missing");
  for (const label of labels) {
    assert(label.text.length > 0, "Field label text is empty");
    assert.equal(label.htmlFor, label.controlId, "Field label lost its scoped control association");
    assert.equal(label.associated, true, "Field control does not expose its native label");
  }
  const fileInput = fieldset.locator('input[type="file"]');
  const fileStyle = await fileInput.evaluate((element) => {
    const style = getComputedStyle(element, "::file-selector-button");
    return {
      marginInlineEnd: style.marginInlineEnd,
      marginLeft: style.marginLeft,
      marginRight: style.marginRight,
      accept: (element as HTMLInputElement).accept,
    };
  });
  assert.equal(fileStyle.accept, ".pdf,.txt");
  assert(
    Number.parseFloat(fileStyle.marginInlineEnd) > 0,
    "Field file chooser lost inline-end spacing",
  );
  const rtlFileStyle = await page
    .locator('[data-direction-scope="explicit-root-rtl"] input[type="file"]')
    .evaluate((element) => getComputedStyle(element, "::file-selector-button").marginInlineEnd);
  assert(Number.parseFloat(rtlFileStyle) > 0, "Field file chooser lost inline-end spacing in RTL");

  const responsive = await page.evaluate(async () => {
    const field = document.querySelector(
      '[data-direction-scope="live-inherited-ltr"] [data-direction-part="Field"]',
    ) as HTMLElement;
    window.dispatchEvent(new Event("resize"));
    return getComputedStyle(field).display;
  });
  await page.setViewportSize({ width: 375, height: 900 });
  const narrow = await page
    .locator('[data-direction-scope="live-inherited-ltr"] [data-direction-part="Field"]')
    .first()
    .evaluate((element) => getComputedStyle(element).display);
  await page.setViewportSize({ width: 1280, height: 900 });
  assert.equal(responsive, "grid");
  assert.equal(narrow, "flex", "Responsive Field did not stack at the narrow viewport");
  return { labels, responsive, narrow, groupBorder: layout.groupBorder, fileStyle, rtlFileStyle };
}

async function verifyFieldControlValidity(page: Page): Promise<Record<string, unknown>> {
  const form = page.locator('[data-direction-scope="live-inherited-ltr"] form');
  const control = form.locator('[data-direction-part="FieldControl"]').first();
  const error = form.locator('[data-direction-part="FieldError"]').first();
  const validity = form.locator('[data-direction-part="FieldValidity"]').first();
  const initial = await control.evaluate((element) => ({
    value: (element as HTMLInputElement).value,
    valid: (element as HTMLInputElement).validity.valid,
    form: (element as HTMLInputElement).form?.name ?? null,
  }));
  assert.equal(initial.value, "مرحبا Starwind 42");
  assert.equal(initial.valid, true);
  assert.equal(await validity.isVisible(), true, "Valid feedback is missing for the valid field");
  await control.fill("");
  await form.locator('button[type="submit"]').click();
  await error.waitFor({ state: "visible" });
  const invalid = await control.evaluate((element) => ({
    value: (element as HTMLInputElement).value,
    invalid: element.getAttribute("aria-invalid"),
    describedBy: element.getAttribute("aria-describedby"),
    valid: (element as HTMLInputElement).validity.valid,
  }));
  assert.equal(invalid.valid, false, "Required FieldControl remained valid when empty");
  assert.equal(invalid.invalid, "true", "FieldControl omitted its invalid state");
  assert(invalid.describedBy?.includes("field-error"), "FieldControl did not associate its error");
  assert((await error.textContent())?.includes("أدخل اسم العرض"), "Field error message is missing");
  await control.fill("مها-42");
  await validity.waitFor({ state: "visible" });
  const valid = await control.evaluate((element) => ({
    value: (element as HTMLInputElement).value,
    invalid: element.getAttribute("aria-invalid"),
    valid: (element as HTMLInputElement).validity.valid,
  }));
  assert.equal(valid.value, "مها-42");
  assert.equal(valid.valid, true);
  await form.locator('button[type="reset"]').click();
  await page.waitForFunction(
    () =>
      (
        document.querySelector(
          '[data-direction-scope="live-inherited-ltr"] [data-direction-part="FieldControl"]',
        ) as HTMLInputElement | null
      )?.value === "مرحبا Starwind 42",
  );
  const resetValue = await control.inputValue();
  assert.equal(resetValue, "مرحبا Starwind 42", "Field reset lost its default value");
  const fileOrder = await form.evaluate((element) =>
    Array.from(new FormData(element as HTMLFormElement).keys()),
  );
  assert.deepEqual(fileOrder, ["displayName", "resume", "updates"], "Field FormData order changed");
  return { initial, invalid, valid, resetValue, fileOrder };
}

async function verifyFormSummaryAlignment(page: Page): Promise<Record<string, unknown>> {
  const form = page.locator(
    '[data-direction-scope="explicit-root-rtl"] [data-direction-part="Form"]',
  );
  const summary = form.locator('[data-direction-part="FormErrorSummary"]');
  const email = form.locator('[data-direction-part="FieldControl"]').nth(0);
  const username = form.locator('[data-direction-part="FieldControl"]').nth(1);
  const summaryInitial = await summary.evaluate((element) => ({
    textAlign: getComputedStyle(element).textAlign,
    hidden: (element as HTMLElement).hidden,
    direction: getComputedStyle(element).direction,
  }));
  await username.fill("");
  await form.locator('button[type="submit"]').click();
  const entries = summary.locator("[data-sw-form-error-summary-item]");
  await entries.first().waitFor({ state: "visible" });
  await page.waitForFunction(
    () => document.querySelectorAll("[data-sw-form-error-summary-item]").length >= 2,
  );
  const results = await summary.evaluate((element) => {
    const root = element as HTMLElement;
    const entries = Array.from(
      root.querySelectorAll<HTMLElement>("[data-sw-form-error-summary-item]"),
    );
    const rect = root.getBoundingClientRect();
    return {
      hidden: root.hidden,
      textAlign: getComputedStyle(root).textAlign,
      direction: getComputedStyle(root).direction,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      entries: entries.map((entry) => ({
        text: entry.textContent?.trim() ?? "",
        name: entry.dataset.fieldName ?? "",
        index: entry.dataset.fieldIndex ?? "",
        direction: getComputedStyle(entry).direction,
        textAlign: getComputedStyle(entry).textAlign,
      })),
    };
  });
  assert.equal(results.hidden, false, "Form error summary stayed hidden after invalid submit");
  assert.equal(results.entries.length, 2, "Form summary did not list both invalid fields");
  assert(results.entries[0]!.text.includes("כתובת דואר"), "First summary entry lost its label");
  assert(results.entries[1]!.text.includes("שם משתמש"), "Second summary entry lost its label");
  assert.equal(results.entries[0]!.name, "email");
  assert.equal(results.entries[1]!.name, "username");
  assert.equal(results.direction, "rtl");
  assert(
    results.entries.every(
      (entry) => entry.direction === "rtl" && ["start", "right"].includes(entry.textAlign),
    ),
    "SPEC-AC-12 ticket23 owner23: Form summary links do not align to RTL inline-start: " +
      JSON.stringify(results),
  );
  return { summaryInitial, results, emailInvalid: await email.getAttribute("aria-invalid") };
}

async function verifyFormOrderFocusReset(page: Page): Promise<Record<string, unknown>> {
  const form = page.locator(
    '[data-direction-scope="live-inherited-ltr"] [data-direction-part="Form"]',
  );
  const controls = form.locator('[data-direction-part="FieldControl"]');
  const username = controls.nth(1);
  const labels = await form.locator('[data-direction-part="FieldLabel"]').evaluateAll((nodes) =>
    nodes.map((node) => {
      const label = node as HTMLLabelElement;
      const target = label.htmlFor ? label.ownerDocument.getElementById(label.htmlFor) : null;
      return {
        text: label.textContent?.trim() ?? "",
        for: label.htmlFor,
        targetId: target?.id ?? "",
        hasLabel:
          target instanceof HTMLInputElement && Array.from(target.labels ?? []).includes(label),
      };
    }),
  );
  assert.equal(labels.length, 2, "Form field labels are missing");
  for (const label of labels) {
    assert(label.text.length > 0, "Form field label text is missing");
    assert.equal(label.for, label.targetId, "Form field label association changed");
    assert.equal(label.hasLabel, true, "Native form control lost its label");
  }
  await username.fill("");
  const namesBefore = await form.evaluate((element) =>
    Array.from(new FormData(element as HTMLFormElement).keys()),
  );
  assert.deepEqual(namesBefore, ["email", "username", "updates"], "FormData field order changed");
  await form.locator('button[type="submit"]').click();
  const entries = form.locator("[data-sw-form-error-summary-item]");
  await entries.nth(1).waitFor({ state: "visible" });
  await entries.nth(1).click();
  await page.waitForFunction(() => {
    const input = document.querySelector(
      '[data-direction-scope="live-inherited-ltr"] [data-direction-part="FieldControl"][name="username"]',
    );
    return input === document.activeElement;
  });
  const focusedName = await page.evaluate(
    () => (document.activeElement as HTMLInputElement | null)?.name ?? "",
  );
  assert.equal(focusedName, "username", "Form summary did not focus the chosen invalid field");
  await form.locator('button[type="reset"]').click();
  await page.waitForFunction(() => {
    const root = document.querySelector(
      '[data-direction-scope="live-inherited-ltr"] [data-direction-part="FormErrorSummary"]',
    ) as HTMLElement | null;
    const control = document.querySelector(
      '[data-direction-scope="live-inherited-ltr"] [data-direction-part="FieldControl"][name="username"]',
    ) as HTMLInputElement | null;
    return !!root?.hidden && control?.value === "alex-42";
  });
  const afterReset = await form.evaluate((element) => ({
    summaryHidden: (
      element.querySelector('[data-direction-part="FormErrorSummary"]') as HTMLElement
    ).hidden,
    values: Array.from(new FormData(element as HTMLFormElement).entries()).map(([name, value]) => [
      name,
      typeof value === "string" ? value : value.name,
    ]),
  }));
  assert.equal(afterReset.summaryHidden, true, "Form reset did not clear summary feedback");
  assert.deepEqual(
    afterReset.values.map(([name]) => name),
    ["email", "username", "updates"],
  );
  assert.equal(afterReset.values[1]![1], "alex-42", "Form reset lost the initial username");
  return { namesBefore, focusedName, afterReset, labels };
}

async function verifyInputGroupAddonPositions(page: Page): Promise<Record<string, unknown>> {
  const snapshots: Record<string, unknown>[] = [];
  for (const copy of ["live-inherited-ltr", "explicit-root-rtl"]) {
    const state = await page.evaluate(
      ({
        groupSelector,
        inputSelector,
        startSelector,
        endSelector,
        blockSelector,
        textareaSelector,
      }) => {
        return Object.fromEntries(
          Object.entries({
            group: groupSelector,
            input: inputSelector,
            start: startSelector,
            end: endSelector,
            blockEnd: blockSelector,
            textarea: textareaSelector,
          }).map(([name, selector]) => {
            const element = document.querySelector(selector) as HTMLElement | null;
            if (!element) throw new Error("Missing InputGroup selector " + selector);
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return [
              name,
              {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                direction: style.direction,
                gap: style.gap,
              },
            ];
          }),
        );
      },
      {
        groupSelector: '[data-direction-scope="' + copy + '"] [data-direction-part="InputGroup"]',
        inputSelector:
          '[data-direction-scope="' + copy + '"] [data-direction-part="InputGroupInput"]',
        startSelector:
          '[data-direction-scope="' +
          copy +
          '"] [data-direction-part="InputGroupAddon"][data-align="inline-start"]',
        endSelector:
          '[data-direction-scope="' +
          copy +
          '"] [data-direction-part="InputGroupAddon"][data-align="inline-end"]',
        blockSelector:
          '[data-direction-scope="' +
          copy +
          '"] [data-direction-part="InputGroupAddon"][data-align="block-end"]',
        textareaSelector:
          '[data-direction-scope="' + copy + '"] [data-direction-part="InputGroupTextarea"]',
      },
    );
    const isRtl = state.group.direction === "rtl";
    if (isRtl) {
      assert(
        state.start.x >= state.input.x + state.input.width - 1,
        "InputGroup inline-start addon left its RTL start edge: " + JSON.stringify(state),
      );
      assert(
        state.end.x + state.end.width <= state.input.x + 8,
        "InputGroup inline-end addon left its RTL end edge: " + JSON.stringify(state),
      );
    } else {
      assert(
        state.start.x + state.start.width <= state.input.x + 1,
        "InputGroup inline-start addon left its LTR start edge: " + JSON.stringify(state),
      );
      assert(
        state.end.x >= state.input.x + state.input.width - 1,
        "InputGroup inline-end addon left its LTR end edge: " + JSON.stringify(state),
      );
    }
    assert(
      state.blockEnd.y >= state.textarea.y + state.textarea.height - 1,
      "InputGroup block-end addon left the block end: " + JSON.stringify(state),
    );
    snapshots.push({ copy, ...state });
  }
  const form = page.locator('[data-direction-scope="live-inherited-ltr"] form');
  const names = await form.evaluate((element) =>
    Array.from(new FormData(element as HTMLFormElement).keys()),
  );
  assert.deepEqual(names, ["q", "notes"], "InputGroup native control order changed");
  return { snapshots, names };
}

async function verifyInputGroupTextareaAndFocus(page: Page): Promise<Record<string, unknown>> {
  const scope = page.locator('[data-direction-scope="live-inherited-ltr"]');
  const textarea = scope.locator('[data-direction-part="InputGroupTextarea"]');
  const button = scope.locator('[data-direction-part="InputGroupButton"]');
  await textarea.focus();
  const focusedTextarea = await textarea.evaluate((element) => document.activeElement === element);
  assert.equal(focusedTextarea, true, "InputGroup textarea did not receive focus");
  const textareaState = await textarea.evaluate((element) => ({
    value: (element as HTMLTextAreaElement).value,
    selectionStart: (element as HTMLTextAreaElement).selectionStart,
    selectionEnd: (element as HTMLTextAreaElement).selectionEnd,
    label: element.getAttribute("aria-label"),
  }));
  assert(textareaState.value.includes("issue-42"), "InputGroup textarea value changed");
  assert(textareaState.label?.includes("ملاحظات"), "InputGroup textarea label is missing");
  await button.focus();
  assert.equal(await button.evaluate((element) => document.activeElement === element), true);
  return { textarea: textareaState, focusedButton: await button.getAttribute("aria-label") };
}

async function verifyItemActionsAndWrapping(page: Page): Promise<Record<string, unknown>[]> {
  await page.setViewportSize({ width: 375, height: 900 });
  const snapshots: Record<string, unknown>[] = [];
  for (const copy of ["live-inherited-ltr", "explicit-root-rtl"]) {
    const state = await page.evaluate(
      ({ itemSelector, actionSelector, descriptionSelector }) => {
        const item = document.querySelector(itemSelector) as HTMLElement;
        const action = document.querySelector(actionSelector) as HTMLElement;
        const description = document.querySelector(descriptionSelector) as HTMLElement;
        const itemRect = item.getBoundingClientRect();
        const actionRect = action.getBoundingClientRect();
        const descriptionRect = description.getBoundingClientRect();
        return {
          direction: getComputedStyle(item).direction,
          item: { x: itemRect.x, y: itemRect.y, width: itemRect.width, height: itemRect.height },
          action: {
            x: actionRect.x,
            y: actionRect.y,
            width: actionRect.width,
            height: actionRect.height,
          },
          description: {
            x: descriptionRect.x,
            y: descriptionRect.y,
            width: descriptionRect.width,
            height: descriptionRect.height,
          },
          actionGap: getComputedStyle(action.parentElement as HTMLElement).gap,
          codeDirection: getComputedStyle(description.querySelector("code") as HTMLElement)
            .direction,
        };
      },
      {
        itemSelector: '[data-direction-copy="' + copy + '"] [data-direction-part="Item"]',
        actionSelector:
          '[data-direction-copy="' + copy + '"] [data-direction-part="ItemActions"] a',
        descriptionSelector:
          '[data-direction-copy="' + copy + '"] [data-direction-part="ItemDescription"]',
      },
    );
    const itemCenter = state.item.x + state.item.width / 2;
    const actionCenter = state.action.x + state.action.width / 2;
    assert(state.item.width <= 375, "Item overflows the narrow viewport");
    assert(state.description.height > 0, "Item description did not wrap at narrow width");
    assert(state.action.height > 0, "Item action has no measurable bounds");
    assert.equal(state.codeDirection, "ltr", "Nested Item code lost its LTR direction");
    assert(
      state.direction === "rtl" ? actionCenter <= itemCenter : actionCenter >= itemCenter,
      "Item action is not at the visual inline end",
    );
    snapshots.push({ copy, ...state });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  return snapshots;
}

async function verifyItemLinkAndDomOrder(page: Page): Promise<Record<string, unknown>> {
  const scope = page.locator('[data-direction-scope="explicit-root-rtl"]');
  const link = scope.locator('[data-direction-part="ItemActions"] a');
  await link.focus();
  assert.equal(await link.evaluate((element) => document.activeElement === element), true);
  const state = await scope.locator('[data-direction-part="Item"]').evaluate((item) => ({
    partOrder: Array.from(item.querySelectorAll("[data-direction-part]")).map(
      (node) => (node as HTMLElement).dataset.directionPart,
    ),
    linkText:
      item.querySelector('[data-direction-part="ItemActions"] a')?.textContent?.trim() ?? "",
    nestedCode: {
      text: item.querySelector("code")?.textContent?.trim() ?? "",
      direction: item.querySelector("code")
        ? getComputedStyle(item.querySelector("code") as HTMLElement).direction
        : "",
    },
  }));
  assert(state.partOrder.indexOf("ItemTitle") < state.partOrder.indexOf("ItemActions"));
  assert(state.partOrder.indexOf("ItemActions") < state.partOrder.indexOf("ItemDescription"));
  assert.equal(state.linkText, "עריכה");
  assert.equal(state.nestedCode.direction, "ltr");
  return state;
}

async function verifyLabelControlActivation(page: Page): Promise<Record<string, unknown>> {
  const scope = page.locator('[data-direction-scope="live-inherited-ltr"]');
  const label = scope.locator('[data-direction-part="Label"]').first();
  const control = scope.locator('input[type="checkbox"][name="newsletter"]');
  const initial = await control.isChecked();
  assert.equal(initial, false, "Label checkbox should start unchecked");
  const association = await label.evaluate((element) => {
    const label = element as HTMLLabelElement;
    const control = label.ownerDocument.getElementById(label.htmlFor) as HTMLInputElement | null;
    return {
      text: label.textContent?.trim() ?? "",
      htmlFor: label.htmlFor,
      controlId: control?.id ?? null,
      labels: control
        ? Array.from(control.labels ?? []).map((entry) => entry.textContent?.trim() ?? "")
        : [],
      bdiDirection: label.querySelector("bdi")
        ? getComputedStyle(label.querySelector("bdi") as HTMLElement).direction
        : "",
    };
  });
  assert.equal(association.htmlFor, association.controlId, "Label for/id association changed");
  assert(
    association.labels.some((text) => text.includes("Starwind UI")),
    "Native control lost its label text",
  );
  assert.equal(association.bdiDirection, "ltr", "Label's nested LTR token changed direction");
  await label.evaluate((element) => (element as HTMLLabelElement).click());
  assert.equal(
    await control.isChecked(),
    true,
    "Clicking Label did not toggle the native checkbox",
  );
  return { ...association, initial, activated: await control.isChecked() };
}

async function verifyLabelDisabledStyle(page: Page): Promise<Record<string, unknown>> {
  const scope = page.locator('[data-direction-scope="live-inherited-ltr"]');
  const label = scope.locator('[data-direction-part="Label"]').nth(1);
  const control = scope.locator("#disabled-updates-live-inherited-ltr");
  const style = await label.evaluate((element) => ({
    opacity: getComputedStyle(element).opacity,
    cursor: getComputedStyle(element).cursor,
  }));
  assert(Number(style.opacity) <= 0.71, "Disabled Label did not show its disabled opacity");
  assert.equal(await control.isDisabled(), true);
  await label.evaluate((element) => (element as HTMLLabelElement).click());
  assert.equal(await control.isChecked(), false, "Disabled Label activated its control");
  return { style, disabled: await control.isDisabled(), checked: await control.isChecked() };
}

async function verifyImageIntrinsicRatio(page: Page): Promise<Record<string, unknown>> {
  const image = page.locator('[data-direction-part="Image"]').first();
  await image.waitFor({ state: "visible" });
  const state = await image.evaluate((element) => {
    const image = element as HTMLImageElement;
    const rect = image.getBoundingClientRect();
    return {
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      width: rect.width,
      height: rect.height,
      ratio: image.naturalWidth / image.naturalHeight,
    };
  });
  assert(state.naturalWidth > 0 && state.naturalHeight > 0, "Image fixture did not load");
  assert.equal(state.ratio, 4 / 3, "Image intrinsic ratio changed");
  return state;
}

async function verifyImageAltText(page: Page): Promise<Record<string, unknown>> {
  const image = page.locator('[data-direction-part="Image"]').first();
  const state = await image.evaluate((element) => ({
    alt: (element as HTMLImageElement).alt,
    role: element.getAttribute("role"),
    hidden: element.getAttribute("aria-hidden"),
  }));
  assert(
    state.alt.includes("Starwind") && state.alt.includes("צילום"),
    "Image alternative text lost mixed-script content",
  );
  assert.equal(state.hidden, null, "Meaningful Image became hidden from assistive technology");
  return state;
}

async function verifyInputValueAndSelection(page: Page): Promise<Record<string, unknown>> {
  const input = page.locator(
    '[data-direction-scope="live-inherited-ltr"] input[type="text"][name="message"]',
  );
  await input.focus();
  await input.evaluate((element) => (element as HTMLInputElement).setSelectionRange(2, 7));
  const state = await input.evaluate((element) => ({
    value: (element as HTMLInputElement).value,
    selectionStart: (element as HTMLInputElement).selectionStart,
    selectionEnd: (element as HTMLInputElement).selectionEnd,
    direction: getComputedStyle(element).direction,
    active: element === document.activeElement,
  }));
  assert.equal(state.value, "مرحبا Starwind 42");
  assert.equal(state.selectionStart, 2);
  assert.equal(state.selectionEnd, 7);
  assert.equal(state.active, true);
  const names = await page
    .locator('[data-direction-scope="live-inherited-ltr"] form')
    .evaluate((form) => Array.from(new FormData(form as HTMLFormElement).keys()));
  assert.deepEqual(names, ["message", "attachment"], "Native Input FormData order changed");
  return { ...state, names };
}

async function verifyInputFileSelectorGap(page: Page): Promise<Record<string, unknown>> {
  const margins: Record<string, string> = {};
  for (const copy of ["inherited-ltr", "explicit-root-rtl"]) {
    const file = page.locator('[data-direction-scope="' + copy + '"] input[type="file"]');
    margins[copy] = await file.evaluate(
      (element) => getComputedStyle(element, "::file-selector-button").marginInlineEnd,
    );
    assert(
      Number.parseFloat(margins[copy]!) > 0,
      "Input file chooser lost logical inline-end spacing in " + copy,
    );
  }
  return margins;
}

async function verifyOtpPhysicalSlotOrder(page: Page): Promise<Record<string, unknown>> {
  const slots = page.locator(
    '[data-direction-scope="explicit-root-rtl"] [data-direction-part="InputOtpSlot"]',
  );
  const state = await slots.evaluateAll((nodes) =>
    nodes.map((node) => {
      const element = node as HTMLElement;
      const rect = element.getBoundingClientRect();
      return { index: element.getAttribute("data-index"), x: rect.x, y: rect.y, width: rect.width };
    }),
  );
  assert.deepEqual(
    state.map((item) => item.index),
    ["0", "1", "2", "3", "4", "5"],
    "OTP character indices changed",
  );
  assert(
    state[0]!.x > state[5]!.x,
    "RTL OTP visual order does not start at the physical inline-start edge",
  );
  return { slots: state, direction: "rtl" };
}

async function verifyOtpValueOrder(page: Page): Promise<Record<string, unknown>> {
  const slots = page.locator(
    '[data-direction-scope="explicit-root-rtl"] [data-direction-part="InputOtpSlot"]',
  );
  assert.equal(await slots.count(), 6, "OTP fixture must render six slots");
  const state = await page
    .locator('[data-direction-scope="explicit-root-rtl"] [data-direction-part="InputOtp"]')
    .evaluate((element) => {
      const input = element.querySelector("[data-sw-input-otp-input]") as HTMLInputElement | null;
      const form = element.closest("form");
      return {
        value: input?.value,
        formData: form instanceof HTMLFormElement ? Array.from(new FormData(form).entries()) : [],
      };
    });
  assert.equal(state.value, "12", "OTP value order changed");
  assert.deepEqual(state.formData, [["otp", "12"]], "OTP form value order changed");
  return state;
}

async function verifyOtpSpatialArrows(page: Page): Promise<Record<string, unknown>> {
  const root = page.locator(
    '[data-direction-scope="explicit-root-rtl"] [data-direction-part="InputOtp"]',
  );
  const input = root.locator("[data-sw-input-otp-input]");
  const slots = root.locator('[data-direction-part="InputOtpSlot"]');
  const positions = await slots.evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        index: Number((node as HTMLElement).dataset.index),
        x: rect.x,
        center: rect.x + rect.width / 2,
        visible: rect.width > 0 && rect.height > 0,
      };
    }),
  );
  const readActiveIndex = () =>
    slots.evaluateAll((nodes) => {
      const active = nodes.find((node) => node.getAttribute("data-active") === "true");
      return active ? Number((active as HTMLElement).dataset.index) : null;
    });
  const moveToStartOfEmptyRange = async () => {
    await input.evaluate((node) => (node as HTMLInputElement).blur());
    await root.focus();
    await input.waitFor({ state: "attached" });
    await page.waitForFunction(() => document.activeElement?.matches("[data-sw-input-otp-input]"));
    return readActiveIndex();
  };
  const findPhysicalNeighbor = (currentIndex: number, direction: "left" | "right") => {
    const current = positions.find((slot) => slot.index === currentIndex);
    assert(current, "InputOtp active slot is missing from measured bounds");
    const candidates = positions.filter(
      (slot) =>
        slot.visible &&
        (direction === "left" ? slot.center < current.center : slot.center > current.center),
    );
    candidates.sort((a, b) => (direction === "left" ? b.center - a.center : a.center - b.center));
    return candidates[0]?.index ?? currentIndex;
  };

  const leftStart = await moveToStartOfEmptyRange();
  assert.equal(leftStart, 2, "InputOtp fixture should activate the first empty character slot");
  const leftExpected = findPhysicalNeighbor(leftStart, "left");
  await input.press("ArrowLeft");
  const leftActual = await readActiveIndex();
  const afterLeftValue = await input.inputValue();

  const rightStart = await moveToStartOfEmptyRange();
  assert.equal(rightStart, 2, "InputOtp focus did not restore the first empty character slot");
  const rightExpected = findPhysicalNeighbor(rightStart, "right");
  await input.press("ArrowRight");
  const rightActual = await readActiveIndex();
  const final = await root.evaluate((element) => {
    const input = element.querySelector("[data-sw-input-otp-input]") as HTMLInputElement;
    const form = element.closest("form");
    return {
      value: input.value,
      formData: form instanceof HTMLFormElement ? Array.from(new FormData(form).entries()) : [],
    };
  });
  const evidence = {
    direction: "rtl",
    positions,
    left: { start: leftStart, expected: leftExpected, actual: leftActual },
    right: { start: rightStart, expected: rightExpected, actual: rightActual },
    afterLeftValue,
    final,
  };
  assert.equal(
    leftActual,
    leftExpected,
    "SPEC-AC-13 ticket13 owner13: InputOtp ArrowLeft did not move to the physical left slot: " +
      JSON.stringify(evidence),
  );
  assert.equal(
    rightActual,
    rightExpected,
    "SPEC-AC-13 ticket13 owner13: InputOtp ArrowRight did not move to the physical right slot: " +
      JSON.stringify(evidence),
  );
  assert.equal(final.value, "12", "OTP spatial arrows changed the stored code");
  assert.deepEqual(final.formData, [["otp", "12"]], "OTP arrows changed the hidden form value");
  return evidence;
}

async function verifyKbdSequence(page: Page): Promise<Record<string, unknown>> {
  const group = page.locator('[data-direction-part="KbdGroup"]').first();
  const sequence = (await group.innerText()).replace(/\s+/g, "").replaceAll("+", "");
  assert.equal(sequence, "CtrlShiftK", "Shortcut key order changed");
  return { sequence };
}

async function verifyKbdGap(page: Page): Promise<Record<string, unknown>> {
  const group = page.locator(
    '[data-direction-scope="explicit-root-rtl"] [data-direction-part="KbdGroup"]',
  );
  const state = await group.evaluate((element) => ({
    direction: getComputedStyle(element).direction,
    columnGap: getComputedStyle(element).columnGap,
    text: element.textContent?.trim() ?? "",
  }));
  assert(Number.parseFloat(state.columnGap) > 0, "KbdGroup lost its key spacing");
  assert(state.text.includes("Ctrl") && state.text.includes("Shift") && state.text.includes("K"));
  return state;
}

async function verifyNativeSelectChevron(page: Page): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> = {};
  for (const copy of ["inherited-ltr", "explicit-root-rtl"]) {
    const state = await page.evaluate(
      ({ selectSelector, iconSelector }) => {
        const select = document.querySelector(selectSelector) as HTMLElement;
        const icon = document.querySelector(iconSelector) as HTMLElement;
        const selectRect = select.getBoundingClientRect();
        const iconRect = icon.getBoundingClientRect();
        const style = getComputedStyle(select);
        return {
          direction: style.direction,
          paddingInlineEnd: style.paddingInlineEnd,
          select: { x: selectRect.x, width: selectRect.width },
          icon: { x: iconRect.x, width: iconRect.width },
        };
      },
      {
        selectSelector: '[data-direction-scope="' + copy + '"] [data-slot="native-select"]',
        iconSelector: '[data-direction-scope="' + copy + '"] [data-slot="native-select-icon"]',
      },
    );
    const center = state.select.x + state.select.width / 2;
    const iconCenter = state.icon.x + state.icon.width / 2;
    assert(
      Number.parseFloat(state.paddingInlineEnd) > 0,
      "SPEC-AC-12 ticket23 owner23: NativeSelect chevron clearance missing at logical inline-end in " +
        copy,
    );
    assert(
      state.direction === "rtl" ? iconCenter < center : iconCenter > center,
      "SPEC-AC-12 ticket23 owner23: NativeSelect chevron is not at logical inline-end in " +
        copy +
        ": " +
        JSON.stringify(state),
    );
    results[copy] = state;
  }
  return results;
}

async function verifyNativeSelectOrderAndSelection(page: Page): Promise<Record<string, unknown>> {
  const select = page.locator('[data-direction-scope="live-inherited-ltr"] select');
  const before = await select.evaluate((element) => ({
    values: Array.from((element as HTMLSelectElement).options).map((option) => option.value),
    value: (element as HTMLSelectElement).value,
    disabled: (element as HTMLSelectElement).options[2]?.disabled,
  }));
  assert.deepEqual(before.values, ["middle-east", "he-il", "de-de", "us-en"]);
  assert.equal(before.value, "middle-east");
  assert.equal(before.disabled, true);
  const selected = await select.selectOption("he-il");
  assert.deepEqual(selected, ["he-il"], "NativeSelect could not select a grouped option");
  const after = await select.evaluate((element) => ({
    value: (element as HTMLSelectElement).value,
    formData: Array.from(new FormData((element as HTMLSelectElement).form!).entries()),
  }));
  assert.equal(after.value, "he-il");
  assert.deepEqual(after.formData, [["region", "he-il"]], "NativeSelect form value changed");
  return { before, selected, after };
}

async function verifyPaginationOrder(page: Page): Promise<Record<string, unknown>> {
  const scope = page.locator('[data-direction-scope="live-inherited-ltr"]');
  const links = await scope
    .locator(
      '[data-direction-part="PaginationLink"], [data-direction-part="PaginationPrevious"], [data-direction-part="PaginationNext"]',
    )
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        part: (node as HTMLElement).dataset.directionPart,
        text: node.textContent?.trim() ?? "",
        href: node.getAttribute("href"),
        current: node.getAttribute("aria-current"),
      })),
    );
  assert.deepEqual(
    links.map((item) => item.part),
    ["PaginationPrevious", "PaginationLink", "PaginationNext"],
  );
  assert.equal(links[1]!.text, "2");
  assert.equal(links[1]!.current, "page");
  return { links };
}

async function verifyPaginationGlyphs(page: Page): Promise<Record<string, unknown>> {
  const scope = page.locator('[data-direction-scope="explicit-root-rtl"]');
  const previous = scope.locator('[data-direction-part="PaginationPrevious"]');
  const next = scope.locator('[data-direction-part="PaginationNext"]');
  const state = {
    previous: {
      label: await previous.getAttribute("aria-label"),
      href: await previous.getAttribute("href"),
      svg: await previous.locator("svg").count(),
    },
    next: {
      label: await next.getAttribute("aria-label"),
      href: await next.getAttribute("href"),
      svg: await next.locator("svg").count(),
    },
  };
  assert(
    state.previous.label?.toLowerCase().includes("previous"),
    "Previous page control lost its accessible previous-page name",
  );
  assert(
    state.next.label?.toLowerCase().includes("next"),
    "Next page control lost its accessible next-page name",
  );
  assert(state.previous.href?.includes("page-1") && state.next.href?.includes("page-3"));
  assert.equal(state.previous.svg, 1, "Previous page glyph is missing");
  assert.equal(state.next.svg, 1, "Next page glyph is missing");
  return state;
}

async function verifyProgressValue(page: Page): Promise<Record<string, unknown>> {
  const progress = page.locator(
    '[data-direction-scope="live-inherited-ltr"] [data-slot="progress"]',
  );
  const state = await progress.evaluate((element) => ({
    value: element.getAttribute("aria-valuenow"),
    min: element.getAttribute("aria-valuemin"),
    max: element.getAttribute("aria-valuemax"),
    label: element.getAttribute("aria-label"),
    role: element.getAttribute("role"),
  }));
  assert.deepEqual(state, {
    value: "25",
    min: "0",
    max: "100",
    label: "اكتمال التحميل",
    role: "progressbar",
  });
  return state;
}

async function verifyProgressFillEdge(page: Page): Promise<Record<string, unknown>> {
  const state = await verifyProgressClippedFillEdge(page);
  for (const scope of ["inherited-ltr", "explicit-root-rtl"]) {
    const indicator = page.locator(
      `[data-direction-scope="${scope}"] [data-slot="progress-indicator"]`,
    );
    assert.equal(
      await indicator.evaluate((node: HTMLElement) => node.style.transform),
      "translateX(-75%)",
    );
  }
  return state;
}

async function verifyProgressClippedFillEdge(page: Page): Promise<Record<string, unknown>> {
  const states = await page.evaluate(() => {
    return Object.fromEntries(
      ["inherited-ltr", "explicit-root-rtl"].map((copy) => {
        const root = document.querySelector(
          '[data-direction-scope="' + copy + '"] [data-slot="progress"]',
        ) as HTMLElement;
        const track = root.querySelector('[data-slot="progress-track"]') as HTMLElement;
        const indicator = root.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
        const rootRect = root.getBoundingClientRect();
        const trackRect = track.getBoundingClientRect();
        const indicatorRect = indicator.getBoundingClientRect();
        const clippedStart = Math.max(rootRect.left, indicatorRect.left);
        const clippedEnd = Math.min(rootRect.right, indicatorRect.right);
        const visibleWidth = Math.max(0, clippedEnd - clippedStart);
        return [
          copy === "inherited-ltr" ? "ltr" : "rtl",
          {
            direction: getComputedStyle(root).direction,
            clipOverflowX: getComputedStyle(root).overflowX,
            root: {
              x: rootRect.x,
              width: rootRect.width,
              left: rootRect.left,
              right: rootRect.right,
            },
            track: { x: trackRect.x, width: trackRect.width },
            indicator: {
              x: indicatorRect.x,
              width: indicatorRect.width,
              transform: getComputedStyle(indicator).transform,
              inlineTransform: indicator.style.transform,
            },
            clippedFill: {
              start: clippedStart,
              end: clippedEnd,
              width: visibleWidth,
              edgeGap:
                getComputedStyle(root).direction === "rtl"
                  ? rootRect.right - clippedEnd
                  : clippedStart - rootRect.left,
            },
          },
        ];
      }),
    );
  });
  for (const direction of ["ltr", "rtl"] as const) {
    const state = states[direction];
    const root = state.root as { width: number };
    const fill = state.clippedFill as {
      width: number;
      edgeGap: number;
      start: number;
      end: number;
    };
    assert(
      ["hidden", "clip"].includes(state.clipOverflowX as string),
      "Progress did not clip the transformed indicator to its root: " + JSON.stringify(state),
    );
    assert(
      Math.abs(fill.width - root.width * 0.25) <= 2,
      "SPEC-AC-09 ticket22 owner22: Progress did not paint a clipped 25% fill: " +
        JSON.stringify(state),
    );
    assert(
      fill.edgeGap <= 2,
      "SPEC-AC-09 ticket22 owner22: Progress clipped fill starts at the wrong physical edge in " +
        direction +
        ": " +
        JSON.stringify(state),
    );
  }
  return states;
}

async function verifyProseMarkersAndTable(page: Page): Promise<Record<string, unknown>> {
  const prose = page.locator('[data-direction-part="Prose"]').first();
  const state = await prose.evaluate((element) => {
    const list = element.querySelector("ul");
    const firstItem = list?.querySelector("li");
    const tableCells = Array.from(element.querySelectorAll("th,td")).map(
      (cell) => cell.textContent?.trim() ?? "",
    );
    const details = element.querySelector("details");
    const summary = details?.querySelector("summary");
    return {
      listStyle: list ? getComputedStyle(list).listStyleType : "none",
      markerDisplay: firstItem ? getComputedStyle(firstItem, "::marker").display : "none",
      tableCells,
      detailsOpen: details?.open ?? false,
      summaryText: summary?.textContent?.trim() ?? "",
      summaryDisplay: summary ? getComputedStyle(summary).display : "none",
    };
  });
  assert.notEqual(state.listStyle, "none", "Prose list marker was removed");
  assert(state.tableCells.length >= 4 && state.tableCells[0]?.includes("المكوّن"));
  assert.equal(state.summaryText, "تفاصيل إضافية");
  assert.equal(state.detailsOpen, false);
  return state;
}

async function verifyProseCodeIsland(page: Page): Promise<Record<string, unknown>> {
  const code = page.locator('[data-direction-part="Prose"] code[dir="ltr"]').first();
  const state = await code.evaluate((element) => ({
    direction: getComputedStyle(element).direction,
    text: element.textContent?.trim() ?? "",
  }));
  assert.equal(state.direction, "ltr");
  assert(state.text.includes("import Button") && state.text.includes("starwind-ui"));
  return state;
}

async function flipLiveDirection(page: Page, spec: RowSpec): Promise<Record<string, unknown>> {
  const live = page.locator('[data-direction-scope="live-inherited-ltr"]');
  const rootSelector = getRootPart(spec, "live-inherited-ltr");
  const root = page.locator(rootSelector).first();
  let focus = spec.focusSelector
    ? page.locator('[data-direction-scope="live-inherited-ltr"] ' + spec.focusSelector).first()
    : root;
  const focusable = async (locator: typeof focus) =>
    (await locator.count()) > 0 &&
    (await locator.evaluate(
      (node) =>
        node instanceof HTMLInputElement ||
        node instanceof HTMLSelectElement ||
        node instanceof HTMLTextAreaElement ||
        node instanceof HTMLButtonElement ||
        node instanceof HTMLAnchorElement ||
        (node as HTMLElement).tabIndex >= 0,
    ));
  if (!(await focusable(focus)))
    focus = page
      .locator(
        '[data-direction-scope="live-inherited-ltr"] input, [data-direction-scope="live-inherited-ltr"] select, [data-direction-scope="live-inherited-ltr"] textarea, [data-direction-scope="live-inherited-ltr"] button, [data-direction-scope="live-inherited-ltr"] a, [data-direction-scope="live-inherited-ltr"] [tabindex]',
      )
      .first();
  if (await focusable(focus)) {
    await focus.focus();
    await focus.evaluate((node) => {
      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
        try {
          node.setSelectionRange(1, Math.min(node.value.length, 4));
        } catch {
          // File inputs do not expose a text selection range.
        }
      }
    });
  }
  const snapshot = () =>
    page.evaluate(
      ({ selector, rootPart }) => {
        const element = document.querySelector(selector) as HTMLElement | null;
        if (!element) throw new Error("Live direction root is missing");
        const form = element.closest("form") ?? element.querySelector("form");
        const controls = Array.from(
          element.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
            "input,select,textarea",
          ),
        );
        return {
          controls: controls.map((control) => ({
            tag: control.tagName.toLowerCase(),
            name: control.name,
            value:
              control instanceof HTMLInputElement && control.type === "file"
                ? "[file]"
                : control.value,
            checked: control instanceof HTMLInputElement ? control.checked : null,
            selectedIndex: control instanceof HTMLSelectElement ? control.selectedIndex : null,
            selectionStart:
              control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement
                ? control.selectionStart
                : null,
            selectionEnd:
              control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement
                ? control.selectionEnd
                : null,
          })),
          activeTag:
            document.activeElement instanceof HTMLElement ? document.activeElement.tagName : null,
          activeName:
            document.activeElement instanceof HTMLElement
              ? ((document.activeElement as HTMLInputElement).name ?? "")
              : "",
          formData:
            form instanceof HTMLFormElement
              ? Array.from(new FormData(form).entries()).map(([name, value]) => [
                  name,
                  typeof value === "string" ? value : value.name,
                ])
              : [],
          partOrder: [
            element,
            ...Array.from(element.querySelectorAll<HTMLElement>("[data-direction-part]")),
          ]
            .filter(
              (part) =>
                part.getClientRects().length > 0 &&
                getComputedStyle(part).display !== "none" &&
                getComputedStyle(part).visibility !== "hidden",
            )
            .map((part) => part.dataset.directionPart ?? (part === element ? rootPart : "")),
        };
      },
      { selector: rootSelector, rootPart: spec.root },
    );
  const baseline = await snapshot();
  const changes: Record<string, unknown>[] = [];
  for (const direction of ["rtl", "ltr", "rtl", "ltr"]) {
    await live.evaluate((element, next) => element.setAttribute("dir", next), direction);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    assert.equal(
      await root.evaluate((element) => getComputedStyle(element).direction),
      direction,
      spec.id + " live scope failed to resolve " + direction,
    );
    const current = await snapshot();
    assert.deepEqual(
      current,
      baseline,
      spec.id + " changed native values, focus, or DOM order at " + direction,
    );
    changes.push({
      direction,
      controls: current.controls.length,
      partCount: current.partOrder.length,
    });
  }
  await live.evaluate((element) => element.setAttribute("dir", "ltr"));
  return { baseline, changes };
}

async function verifyRawObservations(
  page: Page,
  spec: RowSpec,
): Promise<Record<string, unknown>[]> {
  if (!spec.rawFactories?.length) return [];
  await page.waitForFunction(
    (id) =>
      ["factory-ltr", "factory-rtl", "init-ltr", "init-rtl"].every((suffix) =>
        document.querySelector('[data-direction-raw-result="' + id + "-" + suffix + '"]'),
      ),
    spec.id,
    { timeout: 5000 },
  );
  const results = await page.evaluate(
    (id) =>
      ["factory-ltr", "factory-rtl", "init-ltr", "init-rtl"].map((suffix) => {
        const element = document.querySelector(
          '[data-direction-raw-result="' + id + "-" + suffix + '"]',
        ) as HTMLElement | null;
        return {
          id: element?.dataset.directionRawResult,
          kind: suffix.startsWith("factory") ? "factory" : "initStarwind",
          direction: suffix.endsWith("rtl") ? "rtl" : "ltr",
          status: element?.dataset.directionRawStatus,
          error: element?.dataset.directionRawError ?? null,
          evidence: element?.dataset.directionRawEvidence
            ? JSON.parse(element.dataset.directionRawEvidence)
            : null,
        };
      }),
    spec.id,
  );
  for (const result of results) {
    assert.equal(
      result.status,
      "passed",
      spec.id + " Raw HTML " + result.kind + "/" + result.direction + " failed: " + result.error,
    );
    assert.equal(
      result.evidence?.resolvedDirection,
      result.direction,
      spec.id + " raw evidence direction mismatch",
    );
    assert(
      Number(result.evidence?.bounds?.width) > 0 && Number(result.evidence?.bounds?.height) > 0,
      spec.id + " raw evidence has no bounds",
    );
    assert(
      Number(result.evidence?.controlCount) > 0 ||
        String(result.evidence?.text || result.evidence?.label).length > 0,
      spec.id + " raw evidence has no visible semantics",
    );
  }
  return results;
}

async function runRowAssertion(page: Page, spec: RowSpec, name: string): Promise<unknown> {
  switch (name) {
    case "dropdown-items-and-submenu":
      return verifyDropdownItemsAndSubmenu(page, spec);
    case "dropdown-owner-direction":
      return verifyDropdownOwnerDirection(page);
    case "dropdown-submenu-navigation":
      return verifyDropdownSubmenuNavigation(page);
    case "dropdown-submenu-placement":
      return verifyDropdownSubmenuPlacement(page);
    case "explicit-physical-popup-sides":
      return verifyDropdownPhysicalSide(page);
    case "dropzone-accessible-root":
      return verifyDropzoneAccessibleRoot(page);
    case "file-list-text-preserved":
      return verifyDropzoneFiles(page);
    case "fieldset-and-field-labels":
      return verifyFieldsetAndLabels(page, spec);
    case "field-control-value-and-validity":
      return verifyFieldControlValidity(page);
    case "form-summary-start-alignment":
      return verifyFormSummaryAlignment(page);
    case "form-label-and-submission-order":
      return verifyFormOrderFocusReset(page);
    case "hover-card-focus-and-hover":
      return verifyHoverCardFocusAndHover(page);
    case "hover-card-owner-direction":
      return verifyHoverCardPortalDirection(page);
    case "hover-card-physical-side":
      return verifyHoverCardPhysicalPlacement(page);
    case "image-intrinsic-ratio":
      return verifyImageIntrinsicRatio(page);
    case "image-alt-text-and-accessibility":
      return verifyImageAltText(page);
    case "native-input-value-caret-and-selection":
      return verifyInputValueAndSelection(page);
    case "file-selector-gap":
      return verifyInputFileSelectorGap(page);
    case "inline-addon-positions":
      return verifyInputGroupAddonPositions(page);
    case "textarea-and-addon-focus":
      return verifyInputGroupTextareaAndFocus(page);
    case "control-order-preserved": {
      const names = await page
        .locator('[data-direction-scope="live-inherited-ltr"] form')
        .evaluate((form) => Array.from(new FormData(form as HTMLFormElement).keys()));
      assert.deepEqual(names, ["q", "notes"], "InputGroup native control order changed");
      return { names };
    }
    case "otp-physical-slot-order":
      return verifyOtpPhysicalSlotOrder(page);
    case "otp-spatial-arrows":
      return verifyOtpSpatialArrows(page);
    case "otp-value-and-form-data-order":
      return verifyOtpValueOrder(page);
    case "item-actions-and-wrapping":
      return verifyItemActionsAndWrapping(page);
    case "item-link-focus-and-dom-order":
      return verifyItemLinkAndDomOrder(page);
    case "shortcut-label-sequence":
      return verifyKbdSequence(page);
    case "kbd-gap-in-mixed-direction-text":
      return verifyKbdGap(page);
    case "label-control-association":
      return verifyLabelControlActivation(page);
    case "native-label-activation-and-disabled-style":
      return verifyLabelDisabledStyle(page);
    case "native-select-chevron-and-clearance":
      return verifyNativeSelectChevron(page);
    case "native-option-order-and-selection":
      return verifyNativeSelectOrderAndSelection(page);
    case "horizontal-trigger-keys":
      return verifyNavigationMenuKeys(page);
    case "navigation-menu-popup-arrow-aliases":
      return verifyNavigationMenuPopupArrowAliases(page);
    case "navigation-menu-vertical-trigger-inline-end":
      return verifyNavigationMenuVerticalTriggerInlineEnd(page);
    case "navigation-menu-owner-direction":
      return verifyNavigationMenuOwnerDirection(page);
    case "positioner-physical-side":
      return verifyNavigationMenuPhysicalSide(page);
    case "positioner-viewport-bounds":
      return verifyNavigationMenuViewportBounds(page);
    case "positioner-rtl-alignment-and-indicator":
      return verifyNavigationMenuInlineStart(page);
    case "current-page-and-link-order":
      return verifyPaginationOrder(page);
    case "previous-next-default-glyphs":
      return verifyPaginationGlyphs(page);
    case "popover-escape-and-focus-return":
      return verifyPopoverEscapeAndFocus(page);
    case "popover-owner-direction":
      return verifyPopoverOwnerDirection(page);
    case "explicit-physical-side-and-alignment":
      return verifyPopoverPhysicalPlacement(page);
    case "progress-aria-and-value":
      return verifyProgressValue(page);
    case "progress-fill-edge-at-25-percent":
      return verifyProgressFillEdge(page);
    case "progress-clipped-fill-edge":
      return verifyProgressClippedFillEdge(page);
    case "prose-list-table-and-details-markers":
      return verifyProseMarkersAndTable(page);
    case "nested-ltr-code-island":
      return verifyProseCodeIsland(page);
    default:
      throw new Error("No executable row assertion for " + spec.id + ":" + name);
  }
}

export const cases: DirectionCase[] = specs
  .map((spec) => {
    const contract = contractsById.get(spec.id);
    assert(contract, "Missing Styled contract " + spec.id);
    const targets: Target[] = spec.id === "image" ? ["astro"] : ["astro", "react", "vue", "svelte"];
    const acceptance = ["SPEC-AC-01", "SPEC-AC-02", "SPEC-AC-14"];
    if (["dropdown", "hover-card", "navigation-menu", "popover"].includes(spec.id))
      acceptance.push("SPEC-AC-11");
    if (spec.id === "dropdown") acceptance.push("SPEC-AC-06");
    if (spec.id === "navigation-menu") acceptance.push("SPEC-AC-05", "SPEC-AC-12");
    if (spec.id === "native-select") acceptance.push("SPEC-AC-09", "SPEC-AC-12");
    if (spec.id === "progress") acceptance.push("SPEC-AC-09");
    if (spec.id === "prose") acceptance.push("SPEC-AC-12");
    if (spec.id === "form" || spec.id === "item") acceptance.push("SPEC-AC-12");
    if (["input", "input-group", "input-otp", "label", "field"].includes(spec.id))
      acceptance.push("SPEC-AC-13");
    const fixture = (target: Target) => ({
      source: sourceFor(spec, target, false),
      exports: contract.publicExports,
      assertions: [
        "ltr-bounds-focus-labels-variants-normal-and-reduced-motion-captured-first",
        "public-parts-and-data-slot-identity",
        "explicit-inherited-nested-and-deep-direction-scopes",
        "live-direction-flip-preserves-native-values-and-dom-order",
        ...spec.rowAssertions,
      ],
    });
    return {
      id: spec.id,
      row: spec.id,
      acceptance,
      fixtures: Object.fromEntries(targets.map((target) => [target, fixture(target)])),
      physicalExceptions: spec.physicalExceptions,
    };
  })
  .concat(
    rawRuntimeSpecs.map(({ family, spec }) => ({
      id: "runtime:" + family,
      row: "runtime:" + family,
      acceptance: [
        "SPEC-AC-01",
        "SPEC-AC-02",
        "SPEC-AC-14",
        ...(family === "menu" || family === "preview-card" || family === "popover"
          ? ["SPEC-AC-11"]
          : []),
        ...(family === "menu" ? ["SPEC-AC-06"] : []),
        ...(family === "popover" || family === "preview-card" ? ["SPEC-AC-12"] : []),
        ...(family === "input" ? ["SPEC-AC-13"] : []),
        ...(family === "progress" ? ["SPEC-AC-09"] : []),
      ],
      fixtures: {
        astro: {
          source: sourceFor(spec, "astro"),
          exports: [],
          assertions: ["raw-public-factory", "initStarwind-raw-markup"],
        },
      },
      physicalExceptions:
        family === "input-otp"
          ? [
              "Raw factory and initStarwind receipts cover construction, resolved root direction, visible semantics, and root bounds. Full Raw OTP spatial-arrow evidence belongs to ticket13; separate four-target Styled receipts are input-otp/otp-spatial-arrows and input-otp/otp-value-and-form-data-order.",
            ]
          : family === "navigation-menu"
            ? [
                "Raw factory and initStarwind receipts cover construction, resolved root direction, visible semantics, and root bounds. Full Raw horizontal-trigger and vertical inline-end behavior belongs to ticket13; separate four-target Styled receipts are navigation-menu/horizontal-trigger-keys, navigation-menu/vertical-trigger-inline-end, and navigation-menu/navigation-menu-popup-arrow-aliases.",
              ]
            : spec.physicalExceptions,
      rawEntrypoints: ["factory", "initStarwind"],
    })),
  );

export const expectations: DirectionExpectation[] = [
  ...specs.map((spec) => ({
    id: spec.id,
    layer: "styled" as const,
    async run(page: Page, target: Target, context?: DirectionAssertionContext) {
      assert(target === "astro" || target === "react" || target === "vue" || target === "svelte");
      assert(context, "The assertion receipt context is required for " + spec.id);
      page.setDefaultTimeout(4000);
      await page.waitForSelector('[data-direction-scope="live-inherited-ltr"]');
      await context.check(
        "ltr-bounds-focus-labels-variants-normal-and-reduced-motion-captured-first",
        async () => {
          const baseline = await captureBaseline(page, spec);
          context.observe(
            "ltr-bounds-focus-labels-variants-normal-and-reduced-motion-captured-first",
            baseline,
          );
          assertBaselineEvidence(baseline, spec);
        },
      );
      await context.check("public-parts-and-data-slot-identity", async () => {
        const evidence = await verifyPublicPartIdentity(page, spec);
        context.observe("public-parts-and-data-slot-identity", evidence);
      });
      await context.check("explicit-inherited-nested-and-deep-direction-scopes", async () => {
        await verifyScopeDirections(page, spec);
        context.observe(
          "explicit-inherited-nested-and-deep-direction-scopes",
          directionScopes.map(({ id, expected }) => ({ id, expected })),
        );
      });
      await context.check("live-direction-flip-preserves-native-values-and-dom-order", async () => {
        const evidence = await flipLiveDirection(page, spec);
        context.observe("live-direction-flip-preserves-native-values-and-dom-order", evidence);
      });
      for (const name of spec.rowAssertions)
        await context.check(name, async () => {
          const evidence = await runRowAssertion(page, spec, name);
          context.observe(name, evidence);
        });
    },
  })),
  ...rawRuntimeSpecs.map(({ family, spec }) => ({
    id: "runtime:" + family,
    layer: "raw-html" as const,
    async run(page: Page, target: Target, context?: DirectionAssertionContext) {
      assert.equal(target, "astro", "Raw Runtime proof compiles native HTML in Astro");
      assert(context, "The assertion receipt context is required for runtime:" + family);
      page.setDefaultTimeout(4000);
      await page.waitForFunction(
        (selector) => document.querySelector(selector) !== null,
        '[data-direction-raw-result="' + spec.id + '-factory-ltr"]',
      );
      await context.check("raw-public-factory", async () => {
        const evidence = (await verifyRawObservations(page, spec)).filter(
          (item) => item.kind === "factory",
        );
        context.observe("raw-public-factory", evidence);
      });
      await context.check("initStarwind-raw-markup", async () => {
        const evidence = (await verifyRawObservations(page, spec)).filter(
          (item) => item.kind === "initStarwind",
        );
        context.observe("initStarwind-raw-markup", evidence);
      });
    },
  })),
];
