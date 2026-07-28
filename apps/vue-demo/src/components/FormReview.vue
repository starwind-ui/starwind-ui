<script setup lang="ts">
import { ref } from "vue";

import { FieldsetLegend, FieldsetRoot } from "@starwind-ui/vue/fieldset";
import { FormErrorSummary, FormRoot } from "@starwind-ui/vue/form";
import { InputRoot } from "@starwind-ui/vue/input";

const disabled = ref(false);
const showCompany = ref(false);
const submitCount = ref(0);
</script>

<template>
  <section id="form-review" class="review-card" data-testid="form-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Native grouping and Runtime-owned validation</p>
        <h2>Fieldset and Form</h2>
      </div>
      <output data-testid="form-submit-count">submits: {{ submitCount }}</output>
    </div>

    <FormRoot
      class="scenario"
      data-testid="primitive-form"
      validation-timing="submit"
      @submit.prevent="submitCount += 1"
    >
      <FormErrorSummary class="form-summary" data-testid="primitive-form-summary" />
      <FieldsetRoot :disabled="disabled" data-testid="primitive-fieldset">
        <FieldsetLegend>Account details</FieldsetLegend>
        <div data-name="email" data-sw-field>
          <label data-sw-field-label>Email</label>
          <InputRoot
            data-sw-field-control
            data-testid="primitive-form-email"
            name="email"
            required
            type="email"
          />
          <p data-match="valueMissing" data-sw-field-error>Enter an email address.</p>
          <p data-match="typeMismatch" data-sw-field-error>Use a valid email address.</p>
        </div>
        <div v-if="showCompany" data-name="company" data-sw-field>
          <label data-sw-field-label>Company</label>
          <InputRoot data-sw-field-control name="company" />
        </div>
      </FieldsetRoot>
      <div class="demo-row">
        <button class="review-action" data-testid="primitive-form-submit" type="submit">
          Submit
        </button>
        <button class="review-action" data-testid="primitive-form-reset" type="reset">Reset</button>
        <button
          class="review-action"
          data-testid="primitive-fieldset-toggle"
          type="button"
          @click="disabled = !disabled"
        >
          {{ disabled ? "Enable fieldset" : "Disable fieldset" }}
        </button>
        <button
          class="review-action"
          data-testid="primitive-form-company-toggle"
          type="button"
          @click="showCompany = !showCompany"
        >
          {{ showCompany ? "Remove company" : "Add company" }}
        </button>
      </div>
    </FormRoot>
  </section>
</template>
