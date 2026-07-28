<script setup lang="ts">
import { ref } from "vue";

import { CheckboxIndicator, CheckboxRoot } from "@starwind-ui/vue/checkbox";
import {
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldRoot,
  FieldValidity,
} from "@starwind-ui/vue/field";
import { FormRoot } from "@starwind-ui/vue/form";

const email = ref("");
const submitCount = ref(0);
const showTypeMessage = ref(false);
</script>

<template>
  <section id="field-review" class="review-card" data-testid="field-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Specialized coordinator</p>
        <h2>Field</h2>
      </div>
      <output data-testid="field-submit-count">submits: {{ submitCount }}</output>
    </div>

    <FormRoot
      class="scenario"
      validation-timing="submit"
      error-visibility="submit"
      @submit.prevent="submitCount += 1"
    >
      <FieldRoot name="reviewEmail" data-testid="field-email">
        <FieldLabel>Email</FieldLabel>
        <FieldControl v-model="email" data-testid="field-email-control" required type="email" />
        <FieldDescription>Runtime links this description and visible feedback.</FieldDescription>
        <FieldError match="valueMissing" message-source="validation">
          Enter an email address.
        </FieldError>
        <FieldError v-if="showTypeMessage" match="typeMismatch">
          Use a valid email address.
        </FieldError>
        <FieldValidity match="valid">Email is ready.</FieldValidity>
      </FieldRoot>

      <FieldRoot name="terms" data-testid="field-terms">
        <FieldLabel>Terms</FieldLabel>
        <CheckboxRoot required value="accepted" data-testid="field-terms-control">
          <CheckboxIndicator />
        </CheckboxRoot>
        <FieldError match="valueMissing">Accept the terms.</FieldError>
      </FieldRoot>

      <div class="demo-row">
        <button class="review-action" type="submit" data-testid="field-submit">Submit</button>
        <button class="review-action" type="reset" data-testid="field-reset">Reset</button>
        <button
          class="review-action"
          type="button"
          data-testid="field-dynamic-message"
          @click="showTypeMessage = !showTypeMessage"
        >
          Toggle dynamic message
        </button>
      </div>
    </FormRoot>
  </section>
</template>
