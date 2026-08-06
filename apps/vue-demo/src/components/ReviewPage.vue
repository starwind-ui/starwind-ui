<script setup lang="ts">
import { ref } from "vue";

import AvatarReview from "./AvatarReview.vue";
import AccordionReview from "./AccordionReview.vue";
import AlertDialogReview from "./AlertDialogReview.vue";
import ButtonReview from "./ButtonReview.vue";
import CheckboxReview from "./CheckboxReview.vue";
import CollapsibleReview from "./CollapsibleReview.vue";
import ComplexServicesStyledReview from "./ComplexServicesStyledReview.vue";
import DialogReview from "./DialogReview.vue";
import DrawerReview from "./DrawerReview.vue";
import DropzoneReview from "./DropzoneReview.vue";
import FormReview from "./FormReview.vue";
import FieldReview from "./FieldReview.vue";
import InputReview from "./InputReview.vue";
import InputOtpReview from "./InputOtpReview.vue";
import MenusFloatingStyledReview from "./MenusFloatingStyledReview.vue";
import PopoverReview from "./PopoverReview.vue";
import PortableStyledClosureReview from "./PortableStyledClosureReview.vue";
import ProgressReview from "./ProgressReview.vue";
import RadioGroupReview from "./RadioGroupReview.vue";
import ScrollAreaReview from "./ScrollAreaReview.vue";
import SelectReview from "./SelectReview.vue";
import SliderReview from "./SliderReview.vue";
import StyledReview from "./StyledReview.vue";
import SwitchReview from "./SwitchReview.vue";
import TabsReview from "./TabsReview.vue";
import ThemeToggle from "./starwind-runtime/theme-toggle/ThemeToggle.vue";
import ToggleReview from "./ToggleReview.vue";
import ToggleGroupReview from "./ToggleGroupReview.vue";

const secondaryToggle = ref<InstanceType<typeof ThemeToggle> | null>(null);
const showSecondaryToggle = ref(true);
const themeClickCount = ref(0);
</script>

<template>
  <main class="review-shell" data-testid="vue-review-route">
    <header class="review-hero">
      <p class="eyebrow">Internal, non-shipping checkpoint</p>
      <h1>Starwind Vue adapter review</h1>
      <p>
        Primitive and generated Styled output for the verified Vue 3.5 vertical slice plus Theme,
        Avatar, Progress, and Scroll Area cohort.
      </p>
      <nav aria-label="Review sections">
        <a href="#button-review">Button</a>
        <a href="#accordion-review">Accordion</a>
        <a href="#avatar-review">Avatar</a>
        <a href="#checkbox-review">Checkbox</a>
        <a href="#collapsible-review">Collapsible</a>
        <a href="#dialog-review">Dialog</a>
        <a href="#drawer-review">Drawer</a>
        <a href="#dropzone-review">Dropzone</a>
        <a href="#alert-dialog-review">Alert Dialog</a>
        <a href="#input-review">Input</a>
        <a href="#input-otp-review">Input OTP</a>
        <a href="#form-review">Fieldset and Form</a>
        <a href="#field-review">Field</a>
        <a href="#progress-review">Progress</a>
        <a href="#popover-review">Popover</a>
        <a href="#radio-group-review">Radio Group</a>
        <a href="#scroll-area-review">Scroll Area</a>
        <a href="#select-review">Select</a>
        <a href="#slider-review">Slider</a>
        <a href="#switch-review">Switch</a>
        <a href="#tabs-review">Tabs</a>
        <a href="#toggle-review">Toggle</a>
        <a href="#toggle-group-review">Toggle Group</a>
        <a href="#styled-review">Styled</a>
        <a href="#styled-tooltip-review">Tooltip</a>
        <a href="#styled-hover-card-review">Hover Card</a>
        <a href="#styled-dropdown-review">Dropdown</a>
        <a href="#styled-context-menu-review">Context Menu</a>
        <a href="#styled-navigation-menu-review">Navigation Menu</a>
        <a href="#styled-combobox-review">Combobox</a>
        <a href="#styled-carousel-review">Carousel</a>
        <a href="#styled-sidebar-review">Sidebar</a>
        <a href="#styled-color-picker-review">Color Picker</a>
        <a href="#styled-toast-review">Toast</a>
        <a href="#portable-styled-closure-review">Portable Styled closure</a>
      </nav>
    </header>

    <section class="review-card" data-testid="theme-toggle-review">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Persistent document controller</p>
          <h2>Theme Toggle</h2>
        </div>
        <output data-testid="theme-toggle-click-count">clicks: {{ themeClickCount }}</output>
      </div>
      <div class="demo-row">
        <ThemeToggle
          v-if="showSecondaryToggle"
          id="review-theme-toggle"
          ref="secondaryToggle"
          aria-label="Toggle review theme"
          class="review-theme-toggle"
          data-forwarded="theme-toggle"
          data-testid="review-theme-toggle"
          @click="themeClickCount += 1"
        >
          <template #light-icon
            ><span
              class="hidden group-data-[state=off]:data-ready:inline"
              aria-hidden="true"
              data-custom-light-icon
              data-theme-icon
              >☀</span
            ></template
          >
          <template #dark-icon
            ><span
              class="hidden group-data-[state=on]:data-ready:inline"
              aria-hidden="true"
              data-custom-dark-icon
              data-theme-icon
              >☾</span
            ></template
          >
        </ThemeToggle>
        <button
          class="review-action"
          data-testid="theme-toggle-remount"
          type="button"
          @click="showSecondaryToggle = !showSecondaryToggle"
        >
          {{ showSecondaryToggle ? "Unmount review toggle" : "Remount review toggle" }}
        </button>
        <output data-testid="theme-toggle-ref-tag">
          ref: {{ secondaryToggle?.element?.tagName ?? "none" }}
        </output>
      </div>
    </section>

    <AccordionReview />
    <ButtonReview />
    <AvatarReview />
    <CheckboxReview />
    <CollapsibleReview />
    <DialogReview />
    <DrawerReview />
    <DropzoneReview />
    <AlertDialogReview />
    <InputReview />
    <InputOtpReview />
    <FormReview />
    <FieldReview />
    <ProgressReview />
    <PopoverReview />
    <RadioGroupReview />
    <ScrollAreaReview />
    <SelectReview />
    <SliderReview />
    <SwitchReview />
    <TabsReview />
    <ToggleReview />
    <ToggleGroupReview />
    <StyledReview />
    <MenusFloatingStyledReview />
    <ComplexServicesStyledReview />
    <PortableStyledClosureReview />
  </main>
</template>
