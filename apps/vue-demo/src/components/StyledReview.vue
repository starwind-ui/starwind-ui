<script setup lang="ts">
import { ref } from "vue";

import { Button } from "./starwind-runtime/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./starwind-runtime/alert-dialog";
import { Checkbox } from "./starwind-runtime/checkbox";
import { CheckboxGroup } from "./starwind-runtime/checkbox-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./starwind-runtime/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./starwind-runtime/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "./starwind-runtime/sheet";
import { Form, FormErrorSummary } from "./starwind-runtime/form";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSeparator,
  FieldValidity,
} from "./starwind-runtime/field";
import { Input } from "./starwind-runtime/input";
import {
  InputOtp,
  InputOtpGroup,
  InputOtpSeparator,
  InputOtpSlot,
} from "./starwind-runtime/input-otp";
import { Dropzone } from "./starwind-runtime/dropzone";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./starwind-runtime/popover";
import { RadioGroup, RadioGroupItem } from "./starwind-runtime/radio-group";
import { Switch } from "./starwind-runtime/switch";
import { Slider } from "./starwind-runtime/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./starwind-runtime/tabs";
import { Toggle } from "./starwind-runtime/toggle";
import { ToggleGroup, ToggleGroupItem } from "./starwind-runtime/toggle-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./starwind-runtime/select";

const styledChecked = ref(true);
const styledCollapsibleOpen = ref(false);
const styledCollapsibleChanges = ref(0);
const styledDialogOpen = ref(false);
const styledSheetOpen = ref(false);
const styledCustomSheetOpen = ref(false);
const styledSheetSide = ref<"top" | "right" | "bottom" | "left">("right");
const styledSheetSides = ["top", "right", "bottom", "left"] as const;
const styledAlertDialogOpen = ref(false);
const styledGroupValue = ref(["styled-alpha"]);
const asChildValue = ref<string | null>("apple");
const childClicks = ref(0);
const wrapperClicks = ref(0);
const styledInput = ref("Styled input");
const styledInputOtp = ref("12");
const styledDropzoneFiles = ref<string[]>([]);
const styledFieldValue = ref("");
const styledPopoverOpen = ref(false);
const styledRadioValue = ref("styled-alpha");
const styledSwitch = ref(false);
const styledSwitchChanges = ref(0);
const styledSliderValue = ref<number | number[]>([25, 75]);
const styledTabsValue = ref<import("@starwind-ui/vue/tabs").TabsValue>("styled-account");
const styledToggle = ref(false);
const styledToggleChanges = ref(0);
const styledToggleGroupValue = ref(["styled-left"]);
const styledToggleGroupSpacing = ref(1);
</script>

<template>
  <section id="styled-review" class="review-card" data-testid="styled-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Generated Styled output and visual contracts</p>
        <h2>Styled variants</h2>
      </div>
    </div>

    <div class="demo-row" data-testid="styled-button-variants">
      <Button variant="default" size="sm">Default</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary" size="lg">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="error">Error</Button>
    </div>

    <div class="demo-row" data-testid="styled-checkbox-variants">
      <Checkbox
        v-model:checked="styledChecked"
        id="styled-checkbox"
        label="Styled primary checkbox"
        name="styled-checkbox"
        value="yes"
        variant="primary"
        size="lg"
        data-testid="styled-checkbox"
      />
      <output data-testid="styled-checkbox-state">checked: {{ styledChecked }}</output>
    </div>

    <div class="demo-row" data-testid="styled-checkbox-group">
      <CheckboxGroup v-model="styledGroupValue">
        <Checkbox value="styled-alpha" label="Styled alpha" />
        <Checkbox value="styled-beta" label="Styled beta" />
      </CheckboxGroup>
      <output data-testid="styled-checkbox-group-state">
        {{ JSON.stringify(styledGroupValue) }}
      </output>
    </div>

    <div class="scenario" data-testid="styled-collapsible-scenario">
      <h3>Styled controlled Collapsible</h3>
      <Collapsible
        v-model:open="styledCollapsibleOpen"
        class="rounded-md border p-3"
        data-testid="styled-collapsible"
        @open-change="styledCollapsibleChanges += 1"
      >
        <CollapsibleTrigger class="review-action" data-testid="styled-collapsible-trigger">
          Toggle Styled Collapsible
        </CollapsibleTrigger>
        <CollapsibleContent class="pt-3 text-sm" data-testid="styled-collapsible-content">
          Styled disclosure content with Runtime-owned presence.
        </CollapsibleContent>
      </Collapsible>
      <output data-testid="styled-collapsible-state">
        open: {{ styledCollapsibleOpen }}, changes: {{ styledCollapsibleChanges }}
      </output>
    </div>

    <div class="scenario" data-testid="styled-dialog-scenario">
      <h3>Styled controlled Dialog</h3>
      <Dialog v-model:open="styledDialogOpen">
        <DialogTrigger class="review-action" data-testid="styled-dialog-trigger">
          Open Styled Dialog
        </DialogTrigger>
        <DialogContent data-testid="styled-dialog-content">
          <template #backdrop>
            <div
              class="fixed inset-0 z-40 bg-sky-950/70"
              data-slot="dialog-backdrop"
              data-sw-dialog-overlay
              data-testid="styled-dialog-custom-backdrop"
              hidden
            />
          </template>
          <DialogTitle>Styled Vue Dialog</DialogTitle>
          <DialogDescription>
            Generated backdrop, motion, close affordance, and nested-dialog styling.
          </DialogDescription>
        </DialogContent>
      </Dialog>
      <output data-testid="styled-dialog-state">open: {{ styledDialogOpen }}</output>
    </div>

    <div class="scenario" data-testid="styled-popover-scenario">
      <h3>Styled controlled Popover</h3>
      <Popover v-model:open="styledPopoverOpen">
        <PopoverTrigger class="review-action" data-testid="styled-popover-trigger">
          Open Styled Popover
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          :side-offset="10"
          data-testid="styled-popover-content"
        >
          <PopoverHeader>
            <PopoverTitle>Styled Vue Popover</PopoverTitle>
            <PopoverDescription>
              Generated Styled composition on the Vue Primitive adapter.
            </PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
      <output data-testid="styled-popover-state">open: {{ styledPopoverOpen }}</output>
    </div>

    <div class="scenario" data-testid="styled-alert-dialog-scenario">
      <h3>Styled controlled Alert Dialog</h3>
      <AlertDialog v-model:open="styledAlertDialogOpen">
        <AlertDialogTrigger class="review-action" data-testid="styled-alert-dialog-trigger">
          Delete account
        </AlertDialogTrigger>
        <AlertDialogContent data-testid="styled-alert-dialog-content">
          <template #backdrop>
            <div
              class="fixed inset-0 z-40 bg-rose-950/70"
              data-slot="alert-dialog-backdrop"
              data-sw-alert-dialog-backdrop
              data-testid="styled-alert-dialog-backdrop"
              hidden
            />
          </template>
          <AlertDialogTitle>Delete account?</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          <div class="flex justify-end gap-2">
            <AlertDialogCancel data-testid="styled-alert-dialog-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction data-testid="styled-alert-dialog-action">Confirm</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <output data-testid="styled-alert-dialog-state">open: {{ styledAlertDialogOpen }}</output>
    </div>

    <div class="scenario" data-testid="styled-sheet-scenario">
      <h3>Styled controlled Sheet</h3>
      <div class="demo-row">
        <button
          v-for="value in styledSheetSides"
          :key="value"
          class="review-action"
          :data-testid="`styled-sheet-side-${value}`"
          @click="styledSheetSide = value"
        >
          {{ value }}
        </button>
      </div>
      <Sheet v-model:open="styledSheetOpen">
        <SheetTrigger class="review-action" data-testid="styled-sheet-trigger">
          Open {{ styledSheetSide }} Sheet
        </SheetTrigger>
        <SheetContent :side="styledSheetSide" data-testid="styled-sheet-content">
          <template #backdrop>
            <div
              class="fixed inset-0 z-40 bg-indigo-950/65"
              data-sw-drawer-backdrop
              data-slot="sheet-backdrop"
              data-testid="styled-sheet-backdrop"
              hidden
            />
          </template>
          <SheetTitle>Styled Vue Sheet</SheetTitle>
          <SheetDescription>
            Generated side motion, custom backdrop and default generated close icon on Drawer
            Runtime.
          </SheetDescription>
        </SheetContent>
      </Sheet>
      <output data-testid="styled-sheet-state">
        open: {{ styledSheetOpen }}, side: {{ styledSheetSide }}
      </output>
      <Sheet v-model:open="styledCustomSheetOpen">
        <SheetTrigger class="review-action" data-testid="styled-custom-sheet-trigger">
          Open custom-icon Sheet
        </SheetTrigger>
        <SheetContent side="right" data-testid="styled-custom-sheet-content">
          <template #icon>
            <span aria-hidden="true" data-testid="styled-custom-sheet-icon">custom ×</span>
          </template>
          <SheetTitle>Custom icon Sheet</SheetTitle>
          <SheetDescription
            >The close affordance still supports an explicit icon slot.</SheetDescription
          >
        </SheetContent>
      </Sheet>
      <output data-testid="styled-custom-sheet-state">open: {{ styledCustomSheetOpen }}</output>
    </div>

    <div class="demo-row" data-testid="styled-input-variants">
      <Input
        v-model="styledInput"
        aria-label="Styled small input"
        data-testid="styled-input-small"
        size="sm"
      />
      <Input
        default-value="Large input"
        aria-label="Styled large input"
        data-testid="styled-input-large"
        size="lg"
      />
      <output data-testid="styled-input-state">value: {{ styledInput }}</output>
    </div>

    <div class="demo-row" data-testid="styled-input-otp">
      <InputOtp v-model="styledInputOtp" name="styled-code">
        <InputOtpGroup>
          <InputOtpSlot v-for="index in 3" :key="index" :index="index - 1" size="sm" />
        </InputOtpGroup>
        <InputOtpSeparator />
        <InputOtpGroup>
          <InputOtpSlot v-for="index in 3" :key="index + 3" :index="index + 2" size="sm" />
        </InputOtpGroup>
      </InputOtp>
      <output data-testid="styled-input-otp-state">{{ styledInputOtp }}</output>
    </div>

    <div class="demo-row" data-testid="styled-dropzone">
      <Dropzone
        accept="image/*"
        multiple
        name="styled-review-images"
        @files-change="(files) => (styledDropzoneFiles = files.map((file) => file.name))"
      />
      <output data-testid="styled-dropzone-state">
        {{ styledDropzoneFiles.join(", ") || "no files" }}
      </output>
    </div>

    <div class="demo-row" data-testid="styled-radio-group">
      <RadioGroup
        v-model="styledRadioValue"
        legend="Styled choice"
        name="styled-radio-choice"
        orientation="horizontal"
      >
        <RadioGroupItem value="styled-alpha" aria-label="Styled alpha" />
        <RadioGroupItem value="styled-beta" aria-label="Styled beta" />
      </RadioGroup>
      <output data-testid="styled-radio-group-state">value: {{ styledRadioValue }}</output>
    </div>

    <Form
      action="/review"
      class="scenario"
      data-testid="styled-form"
      enctype="multipart/form-data"
      method="post"
      novalidate
      target="_self"
      validation-timing="submit"
    >
      <FormErrorSummary data-testid="styled-form-summary" />
      <div data-name="styledEmail" data-sw-field>
        <label data-sw-field-label>Styled email</label>
        <Input data-sw-field-control data-testid="styled-form-input" name="styledEmail" required />
        <p data-match="valueMissing" data-sw-field-error>Enter a styled email.</p>
      </div>
      <Button type="submit">Validate styled form</Button>
    </Form>

    <div class="scenario" data-testid="styled-field">
      <Field name="styledFieldEmail">
        <FieldLabel>Styled Field email</FieldLabel>
        <FieldControl
          v-model="styledFieldValue"
          data-testid="styled-field-control"
          required
          type="email"
        />
        <FieldDescription>Generated Styled Field composition.</FieldDescription>
        <FieldError match="valueMissing">Enter a styled Field email.</FieldError>
        <FieldValidity match="valid">Styled Field is valid.</FieldValidity>
      </Field>
      <FieldSeparator>or</FieldSeparator>
      <output data-testid="styled-field-state">value: {{ styledFieldValue }}</output>
    </div>

    <div class="demo-row" data-testid="styled-switch-variants">
      <Switch
        v-model:checked="styledSwitch"
        id="styled-switch"
        label="Styled primary switch"
        name="styled-switch"
        value="yes"
        variant="primary"
        size="lg"
        data-testid="styled-switch"
        @checked-change="styledSwitchChanges += 1"
      />
      <output data-testid="styled-switch-state">
        checked: {{ styledSwitch }}, changes: {{ styledSwitchChanges }}
      </output>
    </div>

    <div class="demo-row" data-testid="styled-tabs">
      <Tabs v-model="styledTabsValue">
        <TabsList>
          <TabsTrigger value="styled-account">Account</TabsTrigger>
          <TabsTrigger value="styled-password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="styled-account">Styled account settings</TabsContent>
        <TabsContent value="styled-password">Styled password settings</TabsContent>
      </Tabs>
      <output data-testid="styled-tabs-state">value: {{ styledTabsValue }}</output>
    </div>

    <div class="demo-row" data-testid="styled-toggle-variants">
      <Toggle
        v-model:pressed="styledToggle"
        aria-label="Styled outline toggle"
        data-testid="styled-toggle"
        size="lg"
        variant="outline"
        @pressed-change="styledToggleChanges += 1"
      >
        Styled Toggle
      </Toggle>
      <output data-testid="styled-toggle-state">
        pressed: {{ styledToggle }}, changes: {{ styledToggleChanges }}
      </output>
    </div>

    <div class="demo-row" data-testid="styled-slider-variants">
      <Slider v-model="styledSliderValue" name="styled-range" variant="primary" />
      <Slider :default-value="45" orientation="vertical" variant="secondary" />
      <output data-testid="styled-slider-state">{{ JSON.stringify(styledSliderValue) }}</output>
    </div>

    <div class="demo-row" data-testid="styled-toggle-group">
      <ToggleGroup
        v-model="styledToggleGroupValue"
        aria-label="Styled text alignment"
        data-testid="styled-toggle-group-control"
        size="lg"
        :spacing="styledToggleGroupSpacing"
        style="outline: 2px solid rgb(14, 165, 233); outline-offset: 2px"
        variant="outline"
      >
        <ToggleGroupItem value="styled-left">Left</ToggleGroupItem>
        <ToggleGroupItem value="styled-center">Center</ToggleGroupItem>
        <ToggleGroupItem value="styled-right">Right</ToggleGroupItem>
      </ToggleGroup>
      <output data-testid="styled-toggle-group-state">
        value: {{ JSON.stringify(styledToggleGroupValue) }}, spacing:
        {{ styledToggleGroupSpacing }}
      </output>
      <button
        class="review-action"
        data-testid="styled-toggle-group-spacing"
        type="button"
        @click="styledToggleGroupSpacing = styledToggleGroupSpacing === 1 ? 4 : 1"
      >
        Change Toggle Group spacing
      </button>
    </div>

    <article class="scenario">
      <h3>Standard Styled Select trigger</h3>
      <Select default-value="banana" :modal="false">
        <SelectTrigger data-testid="styled-select-standard-trigger">
          <SelectValue placeholder="Pick fruit" />
        </SelectTrigger>
        <SelectContent data-testid="styled-select-standard-content">
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>
    </article>

    <article class="scenario" data-testid="styled-select-scenario">
      <h3>Strict SelectTrigger asChild</h3>
      <Select v-model="asChildValue" :modal="false">
        <SelectTrigger
          as-child
          data-testid="styled-select-trigger-wrapper"
          @click="wrapperClicks += 1"
        >
          <button data-testid="styled-select-as-child" @click="childClicks += 1">
            Styled asChild trigger: {{ asChildValue }}
          </button>
        </SelectTrigger>
        <SelectContent :align-item-with-trigger="false" data-testid="styled-select-content">
          <SelectGroup>
            <SelectLabel>Styled fruit</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectSeparator />
          </SelectGroup>
        </SelectContent>
      </Select>
      <output data-testid="styled-select-listener-state">
        child-clicks={{ childClicks }}, wrapper-clicks={{ wrapperClicks }}
      </output>
      <p>
        The child remains the single semantic button, defaults to <code>type="button"</code>, and
        receives merged listeners, classes, Runtime attributes, and refs. This focused
        <code>asChild</code> example opts out of item alignment; the standard example above
        exercises the Styled default.
      </p>
    </article>
  </section>
</template>
