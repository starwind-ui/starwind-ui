<script setup lang="ts">
import * as InputOtpPrimitive from "@starwind-ui/vue/input-otp";
import { ref } from "vue";

import {
  InputOtp,
  InputOtpGroup,
  InputOtpSeparator,
  InputOtpSlot,
} from "./starwind-runtime/input-otp";

const value = ref("12");
const cancelNext = ref(false);
const show = ref(true);

function handleChange(
  _value: string,
  detail: import("@starwind-ui/vue/input-otp").InputOtpValueChangeDetails,
): void {
  if (cancelNext.value) {
    detail.cancel();
    cancelNext.value = false;
  }
}
</script>

<template>
  <section id="input-otp-review" class="review-card" data-testid="input-otp-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Hidden native input, visual slots, and form reset</p>
        <h2>Input OTP</h2>
      </div>
    </div>

    <div class="review-grid">
      <article class="scenario">
        <h3>Primitive controlled and cancelable</h3>
        <InputOtpPrimitive.InputOtpRoot
          v-model="value"
          aria-label="Primitive verification code"
          name="primitive-code"
          @value-change="handleChange"
        >
          <InputOtpPrimitive.InputOtpGroup>
            <InputOtpPrimitive.InputOtpSlot v-for="index in 6" :key="index" :index="index - 1" />
          </InputOtpPrimitive.InputOtpGroup>
        </InputOtpPrimitive.InputOtpRoot>
        <output data-testid="input-otp-value">{{ value }}</output>
        <button class="review-action" type="button" @click="cancelNext = true">
          Cancel next edit
        </button>
      </article>

      <article class="scenario">
        <h3>Styled form and remount</h3>
        <form id="otp-review-form">
          <InputOtp
            v-if="show"
            default-value="123"
            form="otp-review-form"
            name="verification"
            required
          >
            <InputOtpGroup>
              <InputOtpSlot v-for="index in 3" :key="index" :index="index - 1" />
            </InputOtpGroup>
            <InputOtpSeparator />
            <InputOtpGroup>
              <InputOtpSlot v-for="index in 3" :key="index + 3" :index="index + 2" size="lg" />
            </InputOtpGroup>
          </InputOtp>
          <button class="review-action" type="reset">Reset code</button>
        </form>
        <button class="review-action" type="button" @click="show = !show">
          {{ show ? "Unmount Input OTP" : "Remount Input OTP" }}
        </button>
      </article>
    </div>
  </section>
</template>
