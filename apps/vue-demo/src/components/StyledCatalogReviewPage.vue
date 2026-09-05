<script setup lang="ts">
import AccordionReview from "./AccordionReview.vue";
import AvatarReview from "./AvatarReview.vue";
import ComplexServicesStyledReview from "./ComplexServicesStyledReview.vue";
import MenusFloatingStyledReview from "./MenusFloatingStyledReview.vue";
import PortableStyledClosureReview from "./PortableStyledClosureReview.vue";
import ProgressReview from "./ProgressReview.vue";
import ScrollAreaReview from "./ScrollAreaReview.vue";
import StyledReview from "./StyledReview.vue";
import ThemeToggle from "./starwind-runtime/theme-toggle/ThemeToggle.vue";

const styledComponents = [
  "accordion",
  "alert",
  "alert-dialog",
  "aspect-ratio",
  "avatar",
  "badge",
  "breadcrumb",
  "button",
  "button-group",
  "card",
  "carousel",
  "checkbox",
  "checkbox-group",
  "collapsible",
  "color-picker",
  "combobox",
  "context-menu",
  "dialog",
  "dropdown",
  "dropzone",
  "field",
  "form",
  "hover-card",
  "input",
  "input-group",
  "input-otp",
  "item",
  "kbd",
  "label",
  "native-select",
  "navigation-menu",
  "pagination",
  "popover",
  "progress",
  "prose",
  "radio-group",
  "scroll-area",
  "select",
  "separator",
  "sheet",
  "sidebar",
  "skeleton",
  "slider",
  "spinner",
  "switch",
  "table",
  "tabs",
  "textarea",
  "theme-toggle",
  "toast",
  "toggle",
  "toggle-group",
  "tooltip",
  "video",
] as const;
</script>

<template>
  <main class="review-shell" data-testid="vue-styled-review-route">
    <header class="review-hero">
      <p class="eyebrow">Vue 3.5 public beta</p>
      <h1>Starwind Vue Styled review</h1>
      <p>
        Review every generated Styled component in light and dark modes. Use the theme control in
        the header, then try the actions and confirm that each visible state is clear.
      </p>
      <nav aria-label="Styled review groups">
        <a href="#theme-toggle-review">Theme Toggle</a>
        <a href="#styled-review">Forms and overlays</a>
        <a href="#styled-menus-floating-review">Menus and floating UI</a>
        <a href="#styled-complex-services-review">Complex services</a>
        <a href="/review/sidebar">Full-page Sidebar</a>
        <a href="#portable-styled-closure-review">Portable catalog</a>
        <a href="#accordion-review">Accordion</a>
        <a href="#avatar-review">Avatar</a>
        <a href="#progress-review">Progress</a>
        <a href="#scroll-area-review">Scroll Area</a>
      </nav>
    </header>

    <section class="review-card" data-testid="styled-catalog-inventory">
      <div class="section-heading">
        <div>
          <p class="eyebrow">54 generated component groups</p>
          <h2>Catalog coverage</h2>
        </div>
      </div>
      <ul class="demo-row" aria-label="Styled components in this review">
        <li
          v-for="component in styledComponents"
          :key="component"
          :data-styled-component="component"
          data-testid="styled-catalog-entry"
        >
          {{ component }}
        </li>
      </ul>
    </section>

    <section id="theme-toggle-review" class="review-card" data-testid="styled-theme-toggle-review">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Light and dark appearance</p>
          <h2>Theme Toggle</h2>
        </div>
      </div>
      <div class="demo-row">
        <ThemeToggle
          id="styled-review-theme-toggle"
          aria-label="Toggle Styled review theme"
          data-testid="styled-review-theme-toggle"
        />
        <p>Switch themes and scan the full catalog for contrast, borders, focus, and overlays.</p>
      </div>
    </section>

    <StyledReview />
    <MenusFloatingStyledReview docs-navigation />
    <ComplexServicesStyledReview separate-sidebar-review />
    <PortableStyledClosureReview />
    <AccordionReview styled-only />
    <AvatarReview styled-only />
    <ProgressReview styled-only />
    <ScrollAreaReview styled-only />
  </main>
</template>
