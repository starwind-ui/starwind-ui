import { starwindStyledContracts } from "../../../contracts/styled/components/index.js";
import { getPrimitiveInventoryEntry } from "../../primitive-inventory.js";

export type SveltePrimitiveInventoryEntry = {
  component: string;
  kind: "primitive" | "manual-facade";
  testOwner: string;
};

export type SvelteStyledInventoryEntry = {
  component: string;
} & (
  | { status: "planned" }
  | { status: "implemented"; testOwner: string; demoOwner: string; hostOwner: string }
);

export type SvelteInventory = {
  primitives: readonly SveltePrimitiveInventoryEntry[];
  styled: readonly SvelteStyledInventoryEntry[];
};

const proofTests = "scripts/portable-runtime/tests/generate-svelte-proof";

export const svelteInventory = {
  primitives: [
    {
      component: "sidebar",
      kind: "primitive",
      testOwner: `${proofTests}/sidebar-lifecycle.test.ts`,
    },
    {
      component: "color-picker",
      kind: "primitive",
      testOwner: `${proofTests}/color-picker-lifecycle.test.ts`,
    },
    {
      component: "combobox",
      kind: "primitive",
      testOwner: `${proofTests}/combobox-lifecycle.test.ts`,
    },
    {
      component: "navigation-menu",
      kind: "primitive",
      testOwner: `${proofTests}/navigation-menu-lifecycle.test.ts`,
    },
    {
      component: "context-menu",
      kind: "primitive",
      testOwner: `${proofTests}/context-menu-lifecycle.test.ts`,
    },
    {
      component: "preview-card",
      kind: "primitive",
      testOwner: `${proofTests}/preview-card-lifecycle.test.ts`,
    },
    {
      component: "tooltip",
      kind: "primitive",
      testOwner: `${proofTests}/tooltip-lifecycle.test.ts`,
    },
    {
      component: "menu",
      kind: "primitive",
      testOwner: `${proofTests}/menu-lifecycle.test.ts`,
    },
    {
      component: "popover",
      kind: "primitive",
      testOwner: `${proofTests}/popover-lifecycle.test.ts`,
    },
    { component: "drawer", kind: "primitive", testOwner: `${proofTests}/drawer-lifecycle.test.ts` },
    {
      component: "alert-dialog",
      kind: "primitive",
      testOwner: `${proofTests}/alert-dialog-lifecycle.test.ts`,
    },
    { component: "tabs", kind: "primitive", testOwner: `${proofTests}/tabs.test.ts` },
    { component: "dropzone", kind: "primitive", testOwner: `${proofTests}/dropzone.test.ts` },
    {
      component: "input-otp",
      kind: "primitive",
      testOwner: `${proofTests}/input-otp.test.ts`,
    },
    {
      component: "field",
      kind: "primitive",
      testOwner: `${proofTests}/field-and-form-ownership.test.ts`,
    },
    {
      component: "toggle",
      kind: "primitive",
      testOwner: `${proofTests}/toggle-and-toggle-group.test.ts`,
    },
    {
      component: "toggle-group",
      kind: "primitive",
      testOwner: `${proofTests}/toggle-and-toggle-group.test.ts`,
    },

    {
      component: "radio",
      kind: "primitive",
      testOwner: `${proofTests}/radio-and-radio-group.test.ts`,
    },
    {
      component: "radio-group",
      kind: "primitive",
      testOwner: `${proofTests}/radio-and-radio-group.test.ts`,
    },
    {
      component: "checkbox-group",
      kind: "primitive",
      testOwner: `${proofTests}/checkbox-group-ownership.test.ts`,
    },
    {
      component: "switch",
      kind: "primitive",
      testOwner: `${proofTests}/switch-model-and-forms.test.ts`,
    },
    { component: "form", kind: "primitive", testOwner: `${proofTests}/form-and-fieldset.test.ts` },
    {
      component: "fieldset",
      kind: "primitive",
      testOwner: `${proofTests}/form-and-fieldset.test.ts`,
    },
    {
      component: "input",
      kind: "primitive",
      testOwner: `${proofTests}/input-native-model.test.ts`,
    },
    {
      component: "collapsible",
      kind: "primitive",
      testOwner: `${proofTests}/collapsible-lifecycle.test.ts`,
    },
    {
      component: "scroll-area",
      kind: "primitive",
      testOwner: `${proofTests}/scroll-area-lifecycle.test.ts`,
    },
    {
      component: "progress",
      kind: "primitive",
      testOwner: `${proofTests}/progress-lifecycle.test.ts`,
    },
    { component: "avatar", kind: "primitive", testOwner: `${proofTests}/avatar-lifecycle.test.ts` },
    { component: "button", kind: "primitive", testOwner: `${proofTests}/lifecycle.test.ts` },
    {
      component: "carousel",
      kind: "primitive",
      testOwner: `${proofTests}/carousel-lifecycle.test.ts`,
    },
    {
      component: "checkbox",
      kind: "primitive",
      testOwner: `${proofTests}/checkbox-lifecycle.test.ts`,
    },
    { component: "select", kind: "primitive", testOwner: `${proofTests}/select-lifecycle.test.ts` },
    {
      component: "accordion",
      kind: "primitive",
      testOwner: `${proofTests}/accordion-lifecycle.test.ts`,
    },
    { component: "dialog", kind: "primitive", testOwner: `${proofTests}/dialog-lifecycle.test.ts` },
    { component: "slider", kind: "primitive", testOwner: `${proofTests}/slider-lifecycle.test.ts` },
    { component: "toast", kind: "primitive", testOwner: `${proofTests}/toast-lifecycle.test.ts` },
    {
      component: "theme",
      kind: "manual-facade",
      testOwner: "packages/svelte/tests/package-build.ssr.test.ts",
    },
  ],
  styled: [
    {
      component: "sidebar",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/sidebar.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/sidebar",
      hostOwner: "packages/svelte/tests/styled-sidebar-consumer.ts",
    },
    {
      component: "color-picker",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/color-picker.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/color-picker",
      hostOwner: "packages/svelte/tests/styled-color-picker-consumer.ts",
    },
    {
      component: "toast",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/toast.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/toast",
      hostOwner: "packages/svelte/tests/styled-toast-consumer.ts",
    },
    {
      component: "carousel",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/carousel.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/carousel",
      hostOwner: "packages/svelte/tests/styled-carousel-consumer.ts",
    },
    {
      component: "combobox",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/combobox.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/combobox",
      hostOwner: "packages/svelte/tests/styled-combobox-consumer.ts",
    },
    {
      component: "navigation-menu",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/navigation-menu.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/navigation-menu",
      hostOwner: "packages/svelte/tests/styled-navigation-menu-consumer.ts",
    },
    {
      component: "context-menu",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/context-menu.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/context-menu",
      hostOwner: "packages/svelte/tests/styled-context-menu-consumer.ts",
    },
    {
      component: "hover-card",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/hover-card.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/hover-card",
      hostOwner: "packages/svelte/tests/styled-hover-card-consumer.ts",
    },
    {
      component: "tooltip",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/tooltip.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/tooltip",
      hostOwner: "packages/svelte/tests/styled-tooltip-consumer.ts",
    },
    {
      component: "dropdown",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/dropdown.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/dropdown",
      hostOwner: "packages/svelte/tests/styled-dropdown-consumer.ts",
    },
    {
      component: "popover",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/popover.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/popover",
      hostOwner: "packages/svelte/tests/styled-popover-consumer.ts",
    },
    {
      component: "sheet",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/sheet.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/sheet",
      hostOwner: "packages/svelte/tests/styled-sheet-consumer.ts",
    },
    {
      component: "alert-dialog",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/alert-dialog.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/alert-dialog",
      hostOwner: "packages/svelte/tests/styled-alert-dialog-consumer.ts",
    },
    {
      component: "tabs",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/tabs.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/tabs",
      hostOwner: "packages/svelte/tests/styled-tabs-consumer.ts",
    },
    {
      component: "slider",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/slider-styled.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/slider",
      hostOwner: "packages/svelte/tests/styled-slider-consumer.ts",
    },
    {
      component: "accordion",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/accordion-styled.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/accordion",
      hostOwner: "packages/svelte/tests/styled-accordion-consumer.ts",
    },
    {
      component: "dropzone",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/dropzone.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/dropzone",
      hostOwner: "packages/svelte/tests/styled-dropzone-consumer.ts",
    },
    {
      component: "input-otp",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/input-otp.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/input-otp",
      hostOwner: "packages/svelte/tests/styled-input-otp-consumer.ts",
    },
    {
      component: "field",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/field-and-form-ownership.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/field",
      hostOwner: "packages/svelte/tests/styled-field-consumer.ts",
    },
    {
      component: "toggle",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/toggle-and-toggle-group.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/toggle",
      hostOwner: "packages/svelte/tests/styled-toggle-consumer.ts",
    },
    {
      component: "toggle-group",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/toggle-and-toggle-group.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/toggle-group",
      hostOwner: "packages/svelte/tests/styled-toggle-consumer.ts",
    },

    {
      component: "radio-group",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/radio-and-radio-group.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/radio-group",
      hostOwner: "packages/svelte/tests/styled-radio-group-consumer.ts",
    },
    {
      component: "checkbox-group",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/checkbox-group-ownership.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/checkbox-group",
      hostOwner: "packages/svelte/tests/styled-checkbox-group-consumer.ts",
    },
    {
      component: "switch",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/switch-model-and-forms.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/switch",
      hostOwner: "packages/svelte/tests/styled-switch-consumer.ts",
    },
    {
      component: "input-group",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/input-group-composition.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/input-group",
      hostOwner: "packages/svelte/tests/styled-input-group-consumer.ts",
    },
    {
      component: "form",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/form-and-fieldset.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/form",
      hostOwner: "packages/svelte/tests/styled-form-consumer.ts",
    },
    {
      component: "input",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/input-native-model.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/input",
      hostOwner: "packages/svelte/tests/styled-input-consumer.ts",
    },
    {
      component: "collapsible",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/collapsible-vertical.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/collapsible",
      hostOwner: "packages/svelte/tests/styled-collapsible-consumer.ts",
    },
    {
      component: "scroll-area",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/scroll-area-vertical.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/scroll-area",
      hostOwner: "packages/svelte/tests/styled-scroll-area-consumer.ts",
    },
    {
      component: "progress",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/progress-vertical.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/progress",
      hostOwner: "packages/svelte/tests/styled-progress-consumer.ts",
    },
    {
      component: "avatar",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/avatar-vertical.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/avatar",
      hostOwner: "packages/svelte/tests/styled-avatar-consumer.ts",
    },
    {
      component: "video",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/video-source-branches.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/video",
      hostOwner: "packages/svelte/tests/styled-video-consumer.ts",
    },
    {
      component: "native-select",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/native-form-wrappers.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/native-select",
      hostOwner: "packages/svelte/tests/styled-native-form-consumer.ts",
    },
    {
      component: "textarea",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/native-form-wrappers.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/textarea",
      hostOwner: "packages/svelte/tests/styled-native-form-consumer.ts",
    },
    {
      component: "button",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/button.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/button",
      hostOwner: "packages/svelte/tests/styled-button-consumer.ts",
    },
    {
      component: "checkbox",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/checkbox.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/checkbox",
      hostOwner: "packages/svelte/tests/styled-checkbox-consumer.ts",
    },
    {
      component: "select",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/select.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/select",
      hostOwner: "packages/svelte/tests/styled-select-consumer.ts",
    },
    {
      component: "dialog",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/dialog.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/dialog",
      hostOwner: "packages/svelte/tests/styled-dialog-consumer.ts",
    },
    {
      component: "theme-toggle",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/theme.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/theme-toggle",
      hostOwner: "scripts/portable-runtime/tests/generate-svelte-styled/theme.test.ts",
    },
    {
      component: "separator",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/native-styled-foundation.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/separator",
      hostOwner: "packages/svelte/tests/styled-native-consumer.ts",
    },
    {
      component: "label",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/native-styled-foundation.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/label",
      hostOwner: "packages/svelte/tests/styled-native-consumer.ts",
    },
    {
      component: "skeleton",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/native-styled-foundation.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/skeleton",
      hostOwner: "packages/svelte/tests/styled-native-consumer.ts",
    },
    {
      component: "alert",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/static-content-parts.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/alert",
      hostOwner: "packages/svelte/tests/styled-static-consumer.ts",
    },
    {
      component: "card",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/static-content-parts.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/card",
      hostOwner: "packages/svelte/tests/styled-static-consumer.ts",
    },
    {
      component: "kbd",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/static-content-parts.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/kbd",
      hostOwner: "packages/svelte/tests/styled-static-consumer.ts",
    },
    {
      component: "table",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/static-content-parts.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/table",
      hostOwner: "packages/svelte/tests/styled-static-consumer.ts",
    },
    {
      component: "aspect-ratio",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/dynamic-native-components.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/aspect-ratio",
      hostOwner: "packages/svelte/tests/styled-dynamic-consumer.ts",
    },
    {
      component: "badge",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/dynamic-native-components.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/badge",
      hostOwner: "packages/svelte/tests/styled-dynamic-consumer.ts",
    },
    {
      component: "item",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/dynamic-native-components.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/item",
      hostOwner: "packages/svelte/tests/styled-dynamic-consumer.ts",
    },
    {
      component: "button-group",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/composed-navigation.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/button-group",
      hostOwner: "packages/svelte/tests/styled-navigation-consumer.ts",
    },
    {
      component: "pagination",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/composed-navigation.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/pagination",
      hostOwner: "packages/svelte/tests/styled-navigation-consumer.ts",
    },
    {
      component: "prose",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/prose-and-spinner.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/prose",
      hostOwner: "packages/svelte/tests/styled-prose-spinner-consumer.ts",
    },
    {
      component: "spinner",
      status: "implemented",
      testOwner: "scripts/portable-runtime/tests/generate-svelte-styled/prose-and-spinner.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/spinner",
      hostOwner: "packages/svelte/tests/styled-prose-spinner-consumer.ts",
    },
    {
      component: "breadcrumb",
      status: "implemented",
      testOwner:
        "scripts/portable-runtime/tests/generate-svelte-styled/breadcrumb-anchor-children.test.ts",
      demoOwner: "apps/svelte-demo/src/lib/starwind-runtime/breadcrumb",
      hostOwner: "packages/svelte/tests/styled-breadcrumb-consumer.ts",
    },
  ],
} as const satisfies SvelteInventory;

/** Validate before output removal. Planned roots acquire verification owners when implemented. */
export function validateSvelteInventory(
  inventory: SvelteInventory = svelteInventory,
  options: {
    manualFacades?: readonly string[];
    requireStyledClosure?: boolean;
    requirePrimitiveClosure?: boolean;
    reviewSections?: readonly string[];
  } = {},
): void {
  for (const [layer, entries] of Object.entries(inventory)) {
    const seen = new Set<string>();
    for (const { component } of entries) {
      if (seen.has(component))
        throw new Error(`Svelte ${layer}: duplicate identity "${component}".`);
      seen.add(component);
    }
  }
  for (const entry of inventory.primitives) {
    const canonical = getPrimitiveInventoryEntry(entry.component);
    if (!canonical) throw new Error(`Svelte Primitive: unknown identity "${entry.component}".`);
    const expected = canonical.kind === "manual-helper-facade" ? "manual-facade" : "primitive";
    if (entry.kind !== expected) {
      throw new Error(
        `Svelte "${entry.component}": expected ${expected} ownership, received ${entry.kind}.`,
      );
    }
    requireOwner(entry.component, "testOwner", entry.testOwner);
  }
  if (options.requirePrimitiveClosure) {
    for (const entry of inventory.primitives)
      if (!svelteInventory.primitives.some((expected) => expected.component === entry.component))
        throw new Error(`Svelte Primitive "${entry.component}": unexpected owner at closure.`);
    for (const expected of svelteInventory.primitives) {
      if (
        !inventory.primitives.some(
          (entry) => entry.component === expected.component && entry.kind === expected.kind,
        )
      )
        throw new Error(`Svelte Primitive "${expected.component}": missing owner at closure.`);
    }
  }
  if (options.reviewSections) {
    const implemented = inventory.styled
      .filter((entry) => entry.status === "implemented")
      .map((entry) => entry.component);
    const seen = new Set<string>();
    for (const component of options.reviewSections) {
      if (seen.has(component))
        throw new Error(`Svelte Styled: duplicate review section "${component}".`);
      if (!implemented.includes(component))
        throw new Error(`Svelte Styled: unimplemented review section "${component}".`);
      seen.add(component);
    }
    for (const component of implemented) {
      if (!seen.has(component))
        throw new Error(`Svelte Styled: missing review section "${component}".`);
    }
  }
  if (options.manualFacades) {
    const expected = inventory.primitives
      .filter((entry) => entry.kind === "manual-facade")
      .map((entry) => entry.component);
    for (const component of new Set([...expected, ...options.manualFacades])) {
      if (expected.includes(component) !== options.manualFacades.includes(component)) {
        throw new Error(
          `Svelte manual facade "${component}": inventory and generator ownership disagree.`,
        );
      }
    }
  }
  if (options.requireStyledClosure) {
    for (const entry of inventory.styled)
      if (!svelteInventory.styled.some((expected) => expected.component === entry.component))
        throw new Error(`Svelte Styled "${entry.component}": unexpected root at closure.`);
    for (const { component } of svelteInventory.styled) {
      if (!inventory.styled.some((entry) => entry.component === component)) {
        throw new Error(`Svelte Styled "${component}": missing planned root at closure.`);
      }
    }
  }
  for (const entry of inventory.styled) {
    if (!starwindStyledContracts.some((contract) => contract.component === entry.component)) {
      throw new Error(`Svelte Styled: unknown identity "${entry.component}".`);
    }
    if (entry.status === "implemented") {
      for (const owner of ["testOwner", "demoOwner", "hostOwner"] as const) {
        requireOwner(entry.component, owner, entry[owner]);
      }
    } else if (options.requireStyledClosure) {
      throw new Error(
        `Svelte Styled "${entry.component}": planned output has no implemented verification owners.`,
      );
    }
  }
}

function requireOwner(component: string, owner: string, value: string): void {
  if (!value?.trim()) throw new Error(`Svelte "${component}": missing ${owner}.`);
}

export const SVELTE_PRIMITIVE_COMPONENTS = svelteInventory.primitives
  .filter((entry) => entry.kind === "primitive")
  .map((entry) => entry.component);
export const SVELTE_MANUAL_FACADES = svelteInventory.primitives
  .filter((entry) => entry.kind === "manual-facade")
  .map((entry) => entry.component);
export const SVELTE_PACKAGE_COMPONENTS = svelteInventory.primitives.map((entry) => entry.component);
export const SVELTE_STYLED_ROOTS = svelteInventory.styled.map((entry) => entry.component);
export function getImplementedSvelteStyledRoots(
  inventory: SvelteInventory = svelteInventory,
): string[] {
  validateSvelteInventory(inventory);
  return inventory.styled
    .filter((entry) => entry.status === "implemented")
    .map((entry) => entry.component);
}

export type SveltePackageExportTarget = {
  default: `./dist/${string}.js`;
  svelte: `./dist/${string}.js`;
  types: `./dist/${string}.d.ts`;
};

function createPackageExportTarget(component?: string): SveltePackageExportTarget {
  const entry = component ? `${component}/index` : "index";
  return {
    types: `./dist/${entry}.d.ts`,
    svelte: `./dist/${entry}.js`,
    default: `./dist/${entry}.js`,
  };
}

export const sveltePackageExports = Object.fromEntries([
  [".", createPackageExportTarget()],
  ...SVELTE_PACKAGE_COMPONENTS.map((component) => [
    `./${component}`,
    createPackageExportTarget(component),
  ]),
]) as Record<string, SveltePackageExportTarget>;

/** Handwritten review owners for the implemented private Styled slice. */
export const SVELTE_REVIEW_OWNERS = {
  sidebar: "apps/svelte-demo/src/lib/review/SidebarReview.svelte",
  "color-picker": "apps/svelte-demo/src/lib/review/ColorPickerReview.svelte",
  toast: "apps/svelte-demo/src/lib/review/ToastReview.svelte",
  carousel: "apps/svelte-demo/src/lib/review/CarouselReview.svelte",
  combobox: "apps/svelte-demo/src/lib/review/ComboboxReview.svelte",
  "navigation-menu": "apps/svelte-demo/src/lib/review/NavigationMenuReview.svelte",
  dropdown: "apps/svelte-demo/src/lib/review/DropdownReview.svelte",
  "context-menu": "apps/svelte-demo/src/lib/review/ContextMenuReview.svelte",
  popover: "apps/svelte-demo/src/lib/review/PopoverReview.svelte",
  "hover-card": "apps/svelte-demo/src/lib/review/HoverCardReview.svelte",
  tooltip: "apps/svelte-demo/src/lib/review/TooltipReview.svelte",
  sheet: "apps/svelte-demo/src/lib/review/SheetReview.svelte",
  tabs: "apps/svelte-demo/src/lib/review/TabsReview.svelte",
  slider: "apps/svelte-demo/src/lib/review/SliderReview.svelte",
  accordion: "apps/svelte-demo/src/lib/review/AccordionReview.svelte",
  dropzone: "apps/svelte-demo/src/lib/review/DropzoneReview.svelte",
  "input-otp": "apps/svelte-demo/src/lib/review/InputOtpReview.svelte",
  field: "apps/svelte-demo/src/lib/review/FieldReview.svelte",
  input: "apps/svelte-demo/src/lib/review/InputReview.svelte",
  form: "apps/svelte-demo/src/lib/review/FormReview.svelte",
  "input-group": "apps/svelte-demo/src/lib/review/InputGroupReview.svelte",
  switch: "apps/svelte-demo/src/lib/review/SwitchReview.svelte",
  "checkbox-group": "apps/svelte-demo/src/lib/review/CheckboxGroupReview.svelte",
  "radio-group": "apps/svelte-demo/src/lib/review/RadioGroupReview.svelte",
  toggle: "apps/svelte-demo/src/lib/review/ToggleReview.svelte",
  "toggle-group": "apps/svelte-demo/src/lib/review/ToggleGroupReview.svelte",
  collapsible: "apps/svelte-demo/src/lib/review/CollapsibleReview.svelte",
  "scroll-area": "apps/svelte-demo/src/lib/review/ScrollAreaReview.svelte",
  progress: "apps/svelte-demo/src/lib/review/ProgressReview.svelte",
  avatar: "apps/svelte-demo/src/lib/review/AvatarReview.svelte",
  video: "apps/svelte-demo/src/lib/review/VideoReview.svelte",
  "native-select": "apps/svelte-demo/src/lib/review/NativeSelectReview.svelte",
  textarea: "apps/svelte-demo/src/lib/review/TextareaReview.svelte",
  prose: "apps/svelte-demo/src/lib/review/ProseReview.svelte",
  spinner: "apps/svelte-demo/src/lib/review/SpinnerReview.svelte",
  "button-group": "apps/svelte-demo/src/lib/review/ButtonGroupReview.svelte",
  pagination: "apps/svelte-demo/src/lib/review/PaginationReview.svelte",
  breadcrumb: "apps/svelte-demo/src/lib/review/BreadcrumbReview.svelte",
  "aspect-ratio": "apps/svelte-demo/src/lib/review/AspectRatioReview.svelte",
  badge: "apps/svelte-demo/src/lib/review/BadgeReview.svelte",
  item: "apps/svelte-demo/src/lib/review/ItemReview.svelte",
  alert: "apps/svelte-demo/src/lib/review/AlertReview.svelte",
  card: "apps/svelte-demo/src/lib/review/CardReview.svelte",
  kbd: "apps/svelte-demo/src/lib/review/KbdReview.svelte",
  table: "apps/svelte-demo/src/lib/review/TableReview.svelte",

  separator: "apps/svelte-demo/src/lib/review/SeparatorReview.svelte",
  label: "apps/svelte-demo/src/lib/review/LabelReview.svelte",
  skeleton: "apps/svelte-demo/src/lib/review/SkeletonReview.svelte",
  button: "apps/svelte-demo/src/lib/review/ButtonReview.svelte",
  checkbox: "apps/svelte-demo/src/lib/review/CheckboxReview.svelte",
  select: "apps/svelte-demo/src/lib/review/SelectReview.svelte",
  "alert-dialog": "apps/svelte-demo/src/lib/review/AlertDialogReview.svelte",
  dialog: "apps/svelte-demo/src/lib/review/DialogReview.svelte",
  "theme-toggle": "apps/svelte-demo/src/lib/review/ThemeReview.svelte",
} as const;

/** Additional captures include the open native/floating surface outside its review section. */
export const SVELTE_REVIEW_OVERLAY_SCENES = [
  "combobox-open",
  "combobox-empty",
  "nested-sheet-combobox-open",
  "navigation-menu-open",
  "alert-dialog-open",
  "sheet-right-open",
  "sheet-left-open",
  "sheet-top-open",
  "sheet-bottom-open",
  "dropdown-open",
  "context-menu-open",
  "context-menu-submenu-open",
  "dropdown-submenu-open",
  "nested-sheet-dropdown-open",
  "popover-open",
  "tooltip-open",
  "hover-card-open",
  "nested-sheet-popover-open",
] as const;

/** Every first docs preview and each required open surface has a source owner. */
export const SVELTE_REVIEW_DOCS_CAPTURE_OWNERS = {
  sidebar: "apps/svelte-demo/src/lib/review/docs/SidebarDocsExample.svelte",
  "color-picker": "apps/svelte-demo/src/lib/review/docs/ColorPickerDocsExample.svelte",
  toast: "apps/svelte-demo/src/lib/review/docs/ToastDocsExample.svelte",
  accordion: "apps/svelte-demo/src/lib/review/docs/AccordionExample.svelte",
  alert: "apps/svelte-demo/src/lib/review/docs/AlertExample.svelte",
  "alert-dialog": "apps/svelte-demo/src/lib/review/docs/AlertDialogExample.svelte",
  "aspect-ratio": "apps/svelte-demo/src/lib/review/docs/AspectRatioExample.svelte",
  avatar: "apps/svelte-demo/src/lib/review/docs/AvatarExample.svelte",
  badge: "apps/svelte-demo/src/lib/review/docs/BadgeExample.svelte",
  breadcrumb: "apps/svelte-demo/src/lib/review/docs/BreadcrumbExample.svelte",
  button: "apps/svelte-demo/src/lib/review/docs/ButtonExample.svelte",
  "button-group": "apps/svelte-demo/src/lib/review/docs/ButtonGroupExample.svelte",
  card: "apps/svelte-demo/src/lib/review/docs/CardExample.svelte",
  checkbox: "apps/svelte-demo/src/lib/review/docs/CheckboxExample.svelte",
  "checkbox-group": "apps/svelte-demo/src/lib/review/docs/CheckboxGroupExample.svelte",
  collapsible: "apps/svelte-demo/src/lib/review/docs/CollapsibleExample.svelte",
  carousel: "apps/svelte-demo/src/lib/review/docs/CarouselDocsExample.svelte",
  combobox: "apps/svelte-demo/src/lib/review/docs/ComboboxDocsExample.svelte",
  "context-menu": "apps/svelte-demo/src/lib/review/docs/ContextMenuDocsExample.svelte",
  dialog: "apps/svelte-demo/src/lib/review/docs/DialogExample.svelte",
  dropdown: "apps/svelte-demo/src/lib/review/docs/DropdownDocsExample.svelte",
  dropzone: "apps/svelte-demo/src/lib/review/docs/DropzoneExample.svelte",
  field: "apps/svelte-demo/src/lib/review/docs/FieldExample.svelte",
  form: "apps/svelte-demo/src/lib/review/docs/FormExample.svelte",
  "hover-card": "apps/svelte-demo/src/lib/review/docs/HoverCardExample.svelte",
  input: "apps/svelte-demo/src/lib/review/docs/InputExample.svelte",
  "input-group": "apps/svelte-demo/src/lib/review/docs/InputGroupExample.svelte",
  "input-otp": "apps/svelte-demo/src/lib/review/docs/InputOtpExample.svelte",
  item: "apps/svelte-demo/src/lib/review/docs/ItemExample.svelte",
  kbd: "apps/svelte-demo/src/lib/review/docs/KbdExample.svelte",
  label: "apps/svelte-demo/src/lib/review/docs/LabelExample.svelte",
  "native-select": "apps/svelte-demo/src/lib/review/docs/NativeSelectExample.svelte",
  "navigation-menu": "apps/svelte-demo/src/lib/review/docs/NavigationMenuDocsExample.svelte",
  pagination: "apps/svelte-demo/src/lib/review/docs/PaginationExample.svelte",
  popover: "apps/svelte-demo/src/lib/review/docs/PopoverExample.svelte",
  progress: "apps/svelte-demo/src/lib/review/docs/ProgressExample.svelte",
  prose: "apps/svelte-demo/src/lib/review/docs/ProseExample.svelte",
  "radio-group": "apps/svelte-demo/src/lib/review/docs/RadioGroupExample.svelte",
  "scroll-area": "apps/svelte-demo/src/lib/review/docs/ScrollAreaExample.svelte",
  select: "apps/svelte-demo/src/lib/review/docs/SelectExample.svelte",
  separator: "apps/svelte-demo/src/lib/review/docs/SeparatorExample.svelte",
  sheet: "apps/svelte-demo/src/lib/review/docs/SheetExample.svelte",
  skeleton: "apps/svelte-demo/src/lib/review/docs/SkeletonExample.svelte",
  slider: "apps/svelte-demo/src/lib/review/docs/SliderExample.svelte",
  spinner: "apps/svelte-demo/src/lib/review/docs/SpinnerExample.svelte",
  switch: "apps/svelte-demo/src/lib/review/docs/SwitchExample.svelte",
  table: "apps/svelte-demo/src/lib/review/docs/TableExample.svelte",
  tabs: "apps/svelte-demo/src/lib/review/docs/TabsExample.svelte",
  textarea: "apps/svelte-demo/src/lib/review/docs/TextareaExample.svelte",
  "theme-toggle": "apps/svelte-demo/src/lib/review/docs/ThemeToggleExample.svelte",
  toggle: "apps/svelte-demo/src/lib/review/docs/ToggleExample.svelte",
  "toggle-group": "apps/svelte-demo/src/lib/review/docs/ToggleGroupExample.svelte",
  tooltip: "apps/svelte-demo/src/lib/review/docs/TooltipExample.svelte",
  video: "apps/svelte-demo/src/lib/review/docs/VideoExample.svelte",
  "alert-dialog-open": "apps/svelte-demo/src/lib/review/docs/AlertDialogExample.svelte",
  "dialog-open": "apps/svelte-demo/src/lib/review/docs/DialogExample.svelte",
  "sheet-open": "apps/svelte-demo/src/lib/review/docs/SheetExample.svelte",
  "popover-open": "apps/svelte-demo/src/lib/review/docs/PopoverExample.svelte",
  "tooltip-open": "apps/svelte-demo/src/lib/review/docs/TooltipExample.svelte",
  "hover-card-open": "apps/svelte-demo/src/lib/review/docs/HoverCardExample.svelte",
  "combobox-open": "apps/svelte-demo/src/lib/review/docs/ComboboxDocsExample.svelte",
  "navigation-menu-open": "apps/svelte-demo/src/lib/review/docs/NavigationMenuDocsExample.svelte",
  "dropdown-open": "apps/svelte-demo/src/lib/review/docs/DropdownDocsExample.svelte",
  "context-menu-open": "apps/svelte-demo/src/lib/review/docs/ContextMenuDocsExample.svelte",
} as const;
