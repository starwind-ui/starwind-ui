import type {
  ComponentGroupMetadata,
  DocsPageStatus,
  PrimitiveDocsEnrichment,
  StyledDocsAnnotation,
} from "./types.js";
import { colorPickerPrimitiveDocsAuthoredExamples } from "./examples.js";

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
  "color-picker": {
    groupId: "form-input",
    docsPage: componentPage("color-picker"),
    foundation: { type: "direct-primitive" },
    styledApi: {
      ColorPickerRoot: {
        props: {
          format: { description: "Sets the editable color format." },
          dir: { description: "Sets the picker direction explicitly." },
        },
      },
      ColorPickerTrigger: {
        props: {
          showValueText: { description: "Shows the formatted value beside the trigger swatch." },
        },
      },
      ColorPickerContent: {
        props: {
          alpha: { description: "Includes alpha controls in the picker content." },
          showEyeDropper: { description: "Shows the EyeDropper trigger when supported." },
        },
      },
      ColorPickerSliders: {
        props: { alpha: { description: "Includes an alpha channel slider." } },
      },
      ColorPickerChannelSlider: {
        props: { channel: { description: "Selects the channel rendered by this slider." } },
      },
      ColorPickerChannelInput: {
        props: { channel: { description: "Selects the channel edited by this input." } },
      },
      ColorPickerInput: {
        props: {
          formatControl: {
            description:
              "Chooses the composite Select or progressively enhanced native format control.",
          },
        },
      },
    },
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
  "color-picker": {
    summary:
      "Color Picker coordinates color parsing, two-dimensional area input, channel controls, editable values, presets, and native form submission.",
    behaviorNotes: [
      "Runtime owns parsing, immutable color values, editing drafts, pointer and keyboard interactions, accessibility reflection, and form synchronization.",
      "Value changes are cancellable before commit; committed-value and format events run after the accepted state is reflected.",
      "FormatSelect is the native progressive-enhancement path. FormatControl wraps one Runtime-backed Select without making Select a required Color Picker Runtime dependency.",
      "Programmatic updates, controlled framework props, refresh, and form reset synchronize native and composite format controls without duplicate format or Select value events.",
    ],
    usageGuidelines: [
      {
        title: "Compose only the controls your picker needs.",
        description:
          "Area, channel, text-entry, format, swatch, clear, and EyeDropper parts share one Root state model and can be arranged for the product workflow.",
      },
      {
        title: "Use HiddenInput for native forms.",
        description:
          "It is the sole submitting control and carries the accepted canonical color string, name, form association, and required state.",
      },
      {
        title: "Choose one format-control path.",
        description:
          "Use FormatSelect for native progressive enhancement or place one Select Root inside FormatControl for a composite popup. Both edit the same hex, rgb, hsl, or hsb format state.",
      },
      {
        title: "Start with the styled Color Picker for product UI.",
        description:
          "The related styled component composes Popover, Select, and Native Select around this Primitive contract; use the Primitive parts when you need custom anatomy.",
      },
    ],
    sections: [
      {
        title: "Format Controls",
        content:
          'FormatSelect is a native `<select>` and remains useful before JavaScript initializes. FormatControl is the discovery wrapper for one composite Select Root; Select continues to own popup, focus, keyboard, and item behavior. Do not render both paths for the same user-facing control.\n\n::example{id="composite-format-control"}\n\nUse the native path when browser-native interaction and progressive enhancement are the priority.\n\n::example{id="native-format-select"}',
      },
      {
        title: "State, Events, and Commands",
        content:
          "The `value` and `format` state models are reflected across every owned part. Listen for cancellable `starwind:value-change`, committed `starwind:value-committed`, and post-commit `starwind:format-change` events on Root. Use the controller setters for application state; `setValue` and `setFormat` accept `{ emit: false }` for silent synchronization. For a composite control, Color Picker internally sends `starwind:set-value`, `starwind:set-disabled`, and `starwind:set-readonly` commands to the nested Select. A canceled Select value change is ignored, and its nested value event does not escape as a Color Picker value event.",
      },
      {
        title: "Forms and Reset",
        content:
          "HiddenInput is the sole submitted color field. Keep `name`, `form`, and `required` on Color Picker Root rather than either format control; Runtime removes form ownership from the composite Select. Native form reset restores the initial value and format, clears drafts, and silently reconciles both native and composite controls.",
      },
      {
        title: "Styling Color Thumbs",
        content:
          "Runtime writes `--sw-color-picker-area-thumb-color` on AreaThumb and `--sw-color-picker-channel-thumb-color` on ChannelSliderThumb. The area value is opaque, ordinary channel thumbs use the accepted color, alpha preserves transparency, and empty values clear both variables. Paint an inner layer from these variables so the thumb remains visible at track boundaries without changing its position or interaction geometry.",
      },
      {
        title: "Accessibility",
        content:
          "Area and channel controls expose native range inputs for keyboard operation. Swatches are native buttons with selected state reflected through `aria-pressed`. Give FormatSelect an accessible label; for FormatControl, label the nested Select Trigger and let Select own combobox and listbox semantics. Supply localized value and color descriptions with `getAriaValueText`, `getAreaRoleDescription`, and `getColorDescription` when the defaults do not fit your interface.",
      },
    ],
    authoredExamples: colorPickerPrimitiveDocsAuthoredExamples,
    frameworkNotes: {
      astro: [
        "Use Root's render projection when non-default initial state must be reflected coherently across descendant area, channel, swatch, and hidden-input parts before hydration.",
      ],
      react: [
        "Value and format can be controlled; adapters synchronize them through non-emitting Runtime setters while preserving cancellable Runtime change details.",
      ],
      "raw-html": [
        "Render the documented data-sw-* anatomy, then initialize one createColorPicker controller from the root element. Initialize a nested Select controller as well when using FormatControl.",
      ],
    },
    parts: {
      root: {
        description:
          "Owns the Color Picker Runtime controller and shared value, format, interaction, locale, and form options.",
      },
      label: { description: "Labels the color picker." },
      control: { description: "Groups the visible picker controls." },
      valueInput: { description: "Accepts and validates a complete color string draft." },
      valueSwatch: { description: "Displays the currently accepted color." },
      valueText: { description: "Displays the currently accepted color as text." },
      area: {
        description: "Coordinates two color channels across horizontal and vertical axes.",
        props: {
          xChannel: "Selects the channel controlled by the horizontal axis.",
          yChannel: "Selects the channel controlled by the vertical axis.",
        },
      },
      areaBackground: { description: "Paints the two-dimensional color-area background." },
      areaThumb: { description: "Shows the accepted position in the color area." },
      areaInput: {
        description: "Provides a native range input for one color-area axis.",
        props: { axis: "Selects the controlled area axis.", step: "Sets the range step." },
      },
      channelSlider: {
        description: "Coordinates one color channel along a horizontal or vertical track.",
        props: {
          channel: "Selects the controlled color channel.",
          orientation: "Sets the slider orientation.",
        },
      },
      channelSliderTrack: { description: "Paints the selected channel's range." },
      channelSliderThumb: { description: "Shows the accepted channel position." },
      channelSliderInput: {
        description: "Provides the native range input for a channel slider.",
        props: { step: "Sets the range step." },
      },
      channelInput: {
        description: "Accepts and validates a numeric channel draft.",
        props: { channel: "Selects the edited color channel." },
      },
      formatSelect: {
        description:
          "The progressively enhanced native select for hex, rgb, hsl, and hsb editing formats.",
        dataAttributes: {
          "data-sw-color-picker-format-select":
            "Runtime discovery hook for the native format control.",
        },
      },
      formatControl: {
        description:
          "Wraps one Runtime-backed Select Root as the composite format control without reimplementing Select behavior.",
        dataAttributes: {
          "data-sw-color-picker-format-control":
            "Runtime discovery hook for the composite format-control wrapper.",
          "data-format": "The accepted hex, rgb, hsl, or hsb editing format.",
          "data-disabled": "Present when Color Picker disables the composite Select.",
          "data-readonly": "Present when Color Picker makes the composite Select read-only.",
        },
      },
      transparencyGrid: {
        description: "Provides a checkerboard surface beneath translucent colors.",
      },
      swatchGroup: { description: "Groups preset color swatches." },
      swatch: {
        description: "Selects a preset color with native button semantics.",
        props: {
          swatchValue: "Sets the preset color.",
          swatchDisabled: "Disables this swatch.",
        },
      },
      eyeDropperTrigger: {
        description: "Opens the platform EyeDropper when that capability is available.",
      },
      clear: { description: "Clears the value when empty values are allowed." },
      hiddenInput: { description: "The sole hidden native input used for form submission." },
    },
    props: {
      value: "Controls the accepted color value.",
      defaultValue: "Sets the initial uncontrolled color value.",
      format: "Controls the color string format.",
      alpha: "Enables alpha-channel editing.",
      allowEmpty: "Allows the accepted value to be null.",
      disabled: "Disables every interactive picker part.",
      readOnly: "Prevents edits while preserving focus and value inspection.",
      name: "Sets the submitted form field name.",
      form: "Associates the hidden input with an external form.",
      required: "Marks the hidden form input as required.",
      locale: "Sets the locale used for accessible color descriptions.",
      dir: "Sets left-to-right or right-to-left direction explicitly.",
      getAriaValueText: "Customizes accessible range value text.",
      getAreaRoleDescription: "Customizes the color-area role description.",
      getColorDescription: "Customizes the accessible description of a color.",
      onValueChange: "Receives cancellable continuous value-change details before commit.",
      onValueCommitted: "Receives the accepted value when an interaction commits.",
      onFormatChange: "Receives the accepted format after it changes.",
    },
    stateModels: {
      value: "The accepted immutable color value, or null when empty values are allowed.",
      format: "The accepted color string format used by editable and display parts.",
    },
    events: {
      valueChange: "Cancelable continuous change emitted before a proposed value commits.",
      valueCommitted: "Emitted after an accepted interaction value commits.",
      formatChange: "Emitted after the accepted string format changes.",
    },
    setters: {
      setValue: "Synchronizes the accepted value and can suppress event emission.",
      setFormat: "Synchronizes the accepted format and can suppress event emission.",
      setDisabled: "Updates disabled state across every interactive part.",
      setReadOnly: "Updates readonly state across editable parts.",
      setName: "Updates the hidden input's form field name.",
      setOptions:
        "Refreshes mutable locale, direction, accessibility, alpha, empty, and form options.",
    },
  },
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
