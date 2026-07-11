import type {
  ComponentGroupMetadata,
  DocsPageStatus,
  PrimitiveDocsEnrichment,
  StyledDocsAnnotation,
} from "./types.js";

const componentPage = (slug: string, status: DocsPageStatus = "published") => ({
  status,
  path: `/docs/components/${slug}/`,
});

export const componentGroups = [
  {
    id: "form-input",
    title: "Form & Input",
    description: "Collect and validate user input.",
    order: 10,
    aliases: ["forms", "inputs", "controls"],
  },
  {
    id: "navigation",
    title: "Navigation",
    description: "Move users through pages, sections, and app states.",
    order: 20,
    aliases: ["menus", "routing"],
  },
  {
    id: "overlay-disclosure",
    title: "Overlay & Disclosure",
    description: "Reveal additional information or contextual actions.",
    order: 30,
    aliases: ["overlays", "disclosure", "dialogs"],
  },
  {
    id: "feedback-status",
    title: "Feedback & Status",
    description: "Communicate progress, outcomes, and loading states.",
    order: 40,
    aliases: ["feedback", "status", "loading"],
  },
  {
    id: "layout-structure",
    title: "Layout & Structure",
    description: "Build consistent spatial structure and content organization.",
    order: 50,
    aliases: ["layout", "structure"],
  },
  {
    id: "content-media",
    title: "Content & Media",
    description: "Present media, rich text, and supporting UI metadata.",
    order: 60,
    aliases: ["content", "media"],
  },
] as const satisfies readonly ComponentGroupMetadata[];

export const styledDocsAnnotations: Record<string, StyledDocsAnnotation> = {
  accordion: {
    groupId: "overlay-disclosure",
    docsPage: componentPage("accordion"),
    foundation: { type: "direct-primitive" },
  },
  alert: {
    groupId: "feedback-status",
    docsPage: componentPage("alert"),
    foundation: { type: "styled-only" },
  },
  "alert-dialog": {
    groupId: "overlay-disclosure",
    docsPage: componentPage("alert-dialog"),
    foundation: { type: "direct-primitive" },
  },
  "aspect-ratio": {
    groupId: "layout-structure",
    docsPage: componentPage("aspect-ratio"),
    foundation: { type: "styled-only" },
  },
  avatar: {
    groupId: "content-media",
    docsPage: componentPage("avatar"),
    foundation: { type: "direct-primitive" },
  },
  badge: {
    groupId: "content-media",
    docsPage: componentPage("badge"),
    foundation: { type: "styled-only" },
    styledApi: {
      Badge: {
        props: {
          appearance: {
            description:
              "Selects whether the Badge uses solid, soft, outlined, text, or frosted chrome.",
          },
          eyebrow: {
            description: "Applies uppercase tracking for compact eyebrow labels.",
          },
          tone: {
            description: "Selects the semantic color family used by composed Badge appearances.",
          },
        },
      },
    },
  },
  breadcrumb: {
    groupId: "navigation",
    docsPage: componentPage("breadcrumb"),
    foundation: { type: "styled-only" },
  },
  button: {
    groupId: "form-input",
    docsPage: componentPage("button"),
    foundation: {
      type: "mixed-conditional",
      reason: "The styled surface can render as a primitive button or as a styled link.",
    },
  },
  "button-group": {
    groupId: "form-input",
    docsPage: componentPage("button-group"),
    foundation: { type: "styled-only" },
  },
  carousel: {
    groupId: "content-media",
    docsPage: componentPage("carousel"),
    foundation: { type: "direct-primitive" },
  },
  card: {
    groupId: "layout-structure",
    docsPage: componentPage("card"),
    foundation: { type: "styled-only" },
  },
  checkbox: {
    groupId: "form-input",
    docsPage: componentPage("checkbox"),
    foundation: { type: "direct-primitive" },
  },
  "checkbox-group": {
    groupId: "form-input",
    docsPage: componentPage("checkbox-group"),
    foundation: { type: "direct-primitive" },
  },
  combobox: {
    groupId: "form-input",
    docsPage: componentPage("combobox"),
    foundation: { type: "direct-primitive" },
  },
  collapsible: {
    groupId: "overlay-disclosure",
    docsPage: componentPage("collapsible"),
    foundation: { type: "direct-primitive" },
  },
  "context-menu": {
    groupId: "overlay-disclosure",
    docsPage: componentPage("context-menu"),
    foundation: { type: "direct-primitive" },
  },
  dialog: {
    groupId: "overlay-disclosure",
    docsPage: componentPage("dialog"),
    foundation: { type: "direct-primitive" },
  },
  dropdown: {
    groupId: "navigation",
    docsPage: componentPage("dropdown"),
    foundation: {
      type: "renamed-primitive",
      reason: "The styled docs use the Dropdown name while the behavior primitive is menu.",
    },
    aliases: ["Dropdown"],
  },
  dropzone: {
    groupId: "form-input",
    docsPage: componentPage("dropzone"),
    foundation: { type: "direct-primitive" },
  },
  field: {
    groupId: "form-input",
    docsPage: componentPage("field"),
    foundation: {
      type: "composite",
      reason: "The styled field layer combines field and fieldset primitives.",
    },
    styledApi: {
      Field: {
        props: {
          errorVisibility: {
            description:
              "Overrides when errors become visible for controls coordinated by this Field.",
          },
        },
      },
    },
  },
  form: {
    groupId: "form-input",
    docsPage: componentPage("form"),
    foundation: { type: "direct-primitive" },
  },
  "hover-card": {
    groupId: "overlay-disclosure",
    docsPage: componentPage("hover-card"),
    foundation: {
      type: "renamed-primitive",
      reason: "The styled docs use Hover Card while the primitive is preview-card.",
    },
    aliases: ["preview-card", "Preview Card"],
  },
  image: {
    groupId: "content-media",
    docsPage: componentPage("image"),
    foundation: {
      type: "styled-only",
      reason: "Image is an Astro-specific styled integration and has no Starwind primitive.",
    },
    frameworkAvailability: {
      react: {
        status: "framework-native",
        reason: "React projects should use the framework or app router image primitive instead.",
      },
    },
    aliases: ["astro:assets", "Picture", "responsive image"],
  },
  input: {
    groupId: "form-input",
    docsPage: componentPage("input"),
    foundation: { type: "direct-primitive" },
  },
  "input-group": {
    groupId: "form-input",
    docsPage: componentPage("input-group"),
    foundation: { type: "styled-only" },
  },
  "input-otp": {
    groupId: "form-input",
    docsPage: componentPage("input-otp"),
    foundation: { type: "direct-primitive" },
  },
  item: {
    groupId: "layout-structure",
    docsPage: componentPage("item"),
    foundation: { type: "styled-only" },
  },
  kbd: {
    groupId: "content-media",
    docsPage: componentPage("kbd"),
    foundation: { type: "styled-only" },
  },
  label: {
    groupId: "form-input",
    docsPage: componentPage("label"),
    foundation: { type: "styled-only" },
  },
  "native-select": {
    groupId: "form-input",
    docsPage: componentPage("native-select"),
    foundation: { type: "styled-only" },
  },
  "navigation-menu": {
    groupId: "navigation",
    docsPage: componentPage("navigation-menu"),
    foundation: { type: "direct-primitive" },
    aliases: ["Navigation Menu", "mega menu", "navbar menu"],
  },
  pagination: {
    groupId: "navigation",
    docsPage: componentPage("pagination"),
    foundation: { type: "styled-only" },
  },
  popover: {
    groupId: "overlay-disclosure",
    docsPage: componentPage("popover"),
    foundation: { type: "direct-primitive" },
  },
  progress: {
    groupId: "feedback-status",
    docsPage: componentPage("progress"),
    foundation: { type: "direct-primitive" },
  },
  prose: {
    groupId: "content-media",
    docsPage: componentPage("prose"),
    foundation: { type: "styled-only" },
  },
  "radio-group": {
    groupId: "form-input",
    docsPage: componentPage("radio-group"),
    foundation: {
      type: "composite",
      reason: "The styled radio group combines group-level behavior with individual radio items.",
    },
  },
  "scroll-area": {
    groupId: "layout-structure",
    docsPage: componentPage("scroll-area"),
    foundation: { type: "direct-primitive" },
  },
  select: {
    groupId: "form-input",
    docsPage: componentPage("select"),
    foundation: { type: "direct-primitive" },
    styledApi: {
      SelectTrigger: {
        props: {
          placeholder: {
            description:
              "Provides fallback text for the value element generated inside the trigger.",
          },
        },
      },
    },
  },
  separator: {
    groupId: "layout-structure",
    docsPage: componentPage("separator"),
    foundation: { type: "styled-only" },
  },
  sheet: {
    groupId: "overlay-disclosure",
    docsPage: componentPage("sheet"),
    foundation: {
      type: "renamed-primitive",
      reason: "The styled docs use Sheet while the behavior primitive is drawer.",
    },
    aliases: ["drawer", "Drawer"],
  },
  sidebar: {
    groupId: "navigation",
    docsPage: componentPage("sidebar"),
    foundation: { type: "direct-primitive" },
    styledApi: {
      SidebarMenuButton: {
        props: {
          tooltip: {
            description: "Provides collapsed-sidebar tooltip text for this menu button.",
          },
        },
      },
    },
  },
  skeleton: {
    groupId: "feedback-status",
    docsPage: componentPage("skeleton"),
    foundation: { type: "styled-only" },
  },
  slider: {
    groupId: "form-input",
    docsPage: componentPage("slider"),
    foundation: { type: "direct-primitive" },
  },
  spinner: {
    groupId: "feedback-status",
    docsPage: componentPage("spinner"),
    foundation: { type: "styled-only" },
  },
  switch: {
    groupId: "form-input",
    docsPage: componentPage("switch"),
    foundation: { type: "direct-primitive" },
  },
  table: {
    groupId: "layout-structure",
    docsPage: componentPage("table"),
    foundation: { type: "styled-only" },
  },
  tabs: {
    groupId: "navigation",
    docsPage: componentPage("tabs"),
    foundation: { type: "direct-primitive" },
  },
  textarea: {
    groupId: "form-input",
    docsPage: componentPage("textarea"),
    foundation: { type: "styled-only" },
  },
  "theme-toggle": {
    groupId: "navigation",
    docsPage: componentPage("theme-toggle"),
    foundation: { type: "styled-only" },
    styledApi: {
      ThemeToggle: {
        props: {
          syncGroup: {
            description: "Synchronizes pressed state across Theme Toggles in the same named group.",
          },
        },
      },
    },
  },
  toast: {
    groupId: "feedback-status",
    docsPage: componentPage("toast"),
    foundation: { type: "direct-primitive" },
  },
  toggle: {
    groupId: "form-input",
    docsPage: componentPage("toggle"),
    foundation: { type: "direct-primitive" },
  },
  "toggle-group": {
    groupId: "form-input",
    docsPage: componentPage("toggle-group"),
    foundation: {
      type: "composite",
      reason: "The styled toggle group combines group-level behavior with individual toggle items.",
    },
  },
  tooltip: {
    groupId: "overlay-disclosure",
    docsPage: componentPage("tooltip"),
    foundation: { type: "direct-primitive" },
  },
  video: {
    groupId: "content-media",
    docsPage: componentPage("video"),
    foundation: { type: "styled-only" },
  },
};

export const primitiveDocsEnrichment: Record<string, PrimitiveDocsEnrichment> = {
  checkbox: {
    summary:
      "Checkbox coordinates a visible boolean control, indicator presence, and hidden form inputs for boolean form state.",
    behaviorNotes: [
      "The Runtime owns checked and indeterminate state after hydration.",
      "Checkbox can consume Checkbox Group context for disabled state and submitted values.",
    ],
    parts: {
      root: {
        description:
          "The focusable checkbox control. It owns the Runtime instance and carries ARIA, checked, indeterminate, disabled, and form option state.",
        props: {
          checked: "Controls the checked state when a framework adapter owns it.",
          defaultChecked: "Sets the initial uncontrolled checked state.",
          disabled: "Prevents interaction and marks the control disabled.",
          form: "Associates the hidden native input with an external form.",
          id: "Sets the hidden native input id.",
          indeterminate: "Sets the mixed visual state independently from checked state.",
          name: "Sets the submitted form field name.",
          nativeButton: "Renders the root as a native button instead of a span.",
          onCheckedChange: "Receives checked-change details before state commits.",
          readOnly: "Marks the checkbox readonly for assistive technology.",
          required: "Marks the form control as required.",
          uncheckedValue: "Value submitted by the runtime-created unchecked input.",
          value: "Value submitted by the checked input.",
        },
        dataAttributes: {
          "data-sw-checkbox": "Runtime discovery hook for the checkbox root.",
          "data-checked": "Present when the checkbox is checked.",
          "data-default-checked": "Initial uncontrolled checked state.",
          "data-disabled": "Present when the checkbox is disabled.",
          "data-indeterminate": "Present when the checkbox is in the mixed state.",
          "data-unchecked": "Present when the checkbox is unchecked.",
        },
      },
      indicator: {
        description: "The visual indicator rendered inside the root for checked or mixed state.",
        props: {
          keepMounted: "Keeps the indicator element mounted when unchecked.",
        },
        dataAttributes: {
          "data-sw-checkbox-indicator": "Runtime discovery hook for the indicator part.",
          "data-keep-mounted": "Marks that the indicator should stay mounted when unchecked.",
          "data-unchecked": "Present while the checkbox is unchecked.",
        },
      },
      input: {
        description:
          "The hidden native checkbox input synchronized by the Runtime for form submission.",
        dataAttributes: {
          "data-sw-checkbox-input": "Runtime discovery hook for the hidden checked input.",
        },
      },
      uncheckedInput: {
        description:
          "The hidden unchecked input created or synchronized by the Runtime when unchecked values are needed.",
        dataAttributes: {
          "data-sw-checkbox-unchecked-input":
            "Runtime discovery hook for the hidden unchecked input.",
        },
      },
    },
  },
  menu: {
    sections: [
      {
        title: "Menu Behavior",
        content:
          "Menu uses a trigger, popup, and item parts to coordinate open state, keyboard navigation, floating placement, and item activation from one Runtime-owned root.",
      },
    ],
  },
  "navigation-menu": {
    summary:
      "Navigation Menu coordinates a single active top-level item, shared viewport content, hover timing, keyboard movement, and link close behavior for site navigation.",
    behaviorNotes: [
      "Use explicit item values when controlling state, using defaultValue, or writing stable tests.",
      "The Runtime moves active content into one shared viewport and reflects activation direction for transitions.",
      "Navigation Menu roots nested inside content panels are intentionally not initialized; use static links or lists for second-level panels.",
    ],
    usageGuidelines: [
      {
        title: "Use Navigation Menu for top-level site or product navigation.",
        description:
          "Use it when a row or column of triggers reveals rich panels that share one viewport.",
      },
      {
        title: "Use Menu or Popover for isolated actions.",
        description:
          "Navigation Menu is value-driven and viewport-driven, so it is heavier than a single contextual popup.",
      },
    ],
    sections: [
      {
        title: "Shared Viewport",
        content:
          "Content panels are authored inside items, then moved into the shared viewport while active so the popup can animate size and direction consistently.",
      },
      {
        title: "Deferred Base UI Parity",
        content:
          "Backdrop, provider-level delay grouping, nested Navigation Menu roots, responsive drawer behavior, actions refs, and open-change-complete callbacks are not part of the v1 Navigation Menu contract.",
      },
    ],
    parts: {
      root: {
        description:
          "The navigation landmark that owns the active value, orientation, hover timing, dismissal options, and Runtime instance.",
        props: {
          value: "Controls the active item value when a framework adapter owns state.",
          defaultValue: "Sets the initial uncontrolled active item value.",
          openDelay: "Sets the default hover-open delay in milliseconds.",
          closeDelay: "Sets the default hover-close delay in milliseconds.",
          orientation: "Sets horizontal or vertical trigger keyboard movement.",
        },
        dataAttributes: {
          "data-sw-nav-menu": "Runtime discovery hook for the Navigation Menu root.",
          "data-default-value": "Initial uncontrolled active item value.",
          "data-state": "Reflects whether any item is open.",
        },
      },
      trigger: {
        description:
          "The button or asChild control that opens, closes, and keyboard-targets a content panel.",
        props: {
          asChild: "Merges trigger behavior into the slotted child control.",
          disabled: "Prevents trigger interaction and removes it from roving trigger movement.",
          openDelay: "Overrides root hover-open timing for this trigger.",
          closeDelay: "Overrides root hover-close timing for this trigger.",
        },
        dataAttributes: {
          "data-sw-nav-menu-trigger": "Runtime discovery hook for the trigger part.",
          "data-state": "Reflects whether this trigger's item is open.",
        },
      },
      content: {
        description:
          "The authored item panel. The Runtime moves the active content into the shared viewport.",
        dataAttributes: {
          "data-sw-nav-menu-content": "Runtime discovery hook for the content part.",
          "data-state": "Reflects whether this content panel is active.",
        },
      },
      link: {
        description:
          "A navigation link inside content. Links close the active menu by default and can mark current-page state.",
        props: {
          active: "Marks the link as active and sets aria-current.",
          closeOnClick: "Controls whether clicking the link closes the menu.",
        },
        dataAttributes: {
          "data-sw-nav-menu-link": "Runtime discovery hook for the link part.",
          "data-active": "Present when the link is active.",
          "data-close-on-click": "Set to false to keep the menu open after link activation.",
        },
      },
      positioner: {
        description: "The floating positioning part for the shared popup.",
        props: {
          side: "Sets the preferred side for the popup.",
          align: "Sets popup alignment relative to the active trigger.",
          sideOffset: "Sets the distance between the popup and trigger.",
          avoidCollisions: "Allows the popup to shift or flip to remain visible.",
        },
        dataAttributes: {
          "data-sw-nav-menu-positioner": "Runtime discovery hook for the positioner part.",
          "data-side": "Reflects the resolved floating side.",
          "data-align": "Reflects the resolved floating alignment.",
        },
      },
      viewport: {
        description:
          "The shared visible container that receives active item content and carries measured size state.",
        dataAttributes: {
          "data-sw-nav-menu-viewport": "Runtime discovery hook for the viewport part.",
          "data-state": "Reflects whether any content is visible.",
        },
      },
    },
  },
};
