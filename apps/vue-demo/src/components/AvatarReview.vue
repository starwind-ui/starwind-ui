<script setup lang="ts">
import * as AvatarPrimitive from "@starwind-ui/vue/avatar";
import { ref } from "vue";

import Avatar from "./starwind-runtime/avatar/Avatar.vue";
import AvatarFallback from "./starwind-runtime/avatar/AvatarFallback.vue";
import AvatarImage from "./starwind-runtime/avatar/AvatarImage.vue";

const loadedSource =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%236366f1'/%3E%3Ccircle cx='40' cy='31' r='15' fill='white'/%3E%3Cpath d='M14 78c3-20 14-30 26-30s23 10 26 30' fill='white'/%3E%3C/svg%3E";
const brokenSource = "data:image/png;base64,AAAA";
const avatarExamples = [
  { label: "SM", size: "sm", testId: "avatar-size-sm", variant: "secondary" },
  { label: "MD", size: "md", testId: "avatar-size-md", variant: "info" },
  { label: "LG", size: "lg", testId: "avatar-size-lg", variant: "success" },
] as const;
const showRemount = ref(true);
const primitiveStatus = ref("idle");
const styledStatus = ref("idle");
const styledRoot = ref<InstanceType<typeof Avatar> | null>(null);
const styledImage = ref<InstanceType<typeof AvatarImage> | null>(null);
const styledFallback = ref<InstanceType<typeof AvatarFallback> | null>(null);
</script>

<template>
  <section id="avatar-review" class="review-card" data-testid="avatar-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Display and media status</p>
        <h2>Avatar</h2>
      </div>
      <output data-testid="avatar-ref-state">
        refs: {{ styledRoot?.element?.tagName ?? "none" }}/{{
          styledImage?.element?.tagName ?? "none"
        }}/{{ styledFallback?.element?.tagName ?? "none" }}
      </output>
    </div>

    <div class="review-grid avatar-review-grid">
      <article class="scenario">
        <h3>Primitive loaded image</h3>
        <AvatarPrimitive.AvatarRoot data-testid="avatar-primitive-root">
          <AvatarPrimitive.AvatarImage
            :src="loadedSource"
            alt="Primitive profile"
            data-testid="avatar-primitive-image"
            @loading-status-change="(status) => (primitiveStatus = status)"
          />
          <AvatarPrimitive.AvatarFallback data-testid="avatar-primitive-fallback">
            PR
          </AvatarPrimitive.AvatarFallback>
        </AvatarPrimitive.AvatarRoot>
        <output data-testid="avatar-primitive-status">status: {{ primitiveStatus }}</output>
      </article>

      <article class="scenario">
        <h3>Styled loaded image</h3>
        <Avatar
          ref="styledRoot"
          data-avatar-attr="forwarded"
          data-testid="avatar-styled-loaded"
          size="lg"
          variant="primary"
        >
          <AvatarImage
            ref="styledImage"
            :src="loadedSource"
            alt="Styled profile"
            data-testid="avatar-styled-loaded-image"
            @loading-status-change="(status) => (styledStatus = status)"
          />
          <AvatarFallback ref="styledFallback" data-testid="avatar-styled-loaded-fallback">
            ST
          </AvatarFallback>
        </Avatar>
        <output data-testid="avatar-styled-status">status: {{ styledStatus }}</output>
      </article>

      <article class="scenario">
        <h3>Error fallback</h3>
        <Avatar data-testid="avatar-styled-error" size="md" variant="error">
          <AvatarImage :src="brokenSource" alt="Unavailable profile" />
          <AvatarFallback data-testid="avatar-error-fallback">ER</AvatarFallback>
        </Avatar>
      </article>

      <article class="scenario">
        <h3>Delayed fallback</h3>
        <Avatar data-testid="avatar-styled-delayed" size="sm" variant="warning">
          <AvatarImage :src="brokenSource" alt="Delayed unavailable profile" />
          <AvatarFallback :delay="160" data-testid="avatar-delayed-fallback">DL</AvatarFallback>
        </Avatar>
      </article>

      <article class="scenario">
        <h3>Variants and remount</h3>
        <div class="demo-row" data-testid="avatar-variants">
          <Avatar
            v-for="example in avatarExamples"
            :key="example.size"
            :data-testid="example.testId"
            :size="example.size"
            :variant="example.variant"
          >
            <AvatarFallback>{{ example.label }}</AvatarFallback>
          </Avatar>
          <Avatar v-if="showRemount" data-testid="avatar-remount-instance" variant="success">
            <AvatarImage :src="brokenSource" alt="Remount profile" />
            <AvatarFallback data-testid="avatar-remount-fallback">RM</AvatarFallback>
          </Avatar>
        </div>
        <button
          class="review-action"
          data-testid="avatar-remount-toggle"
          type="button"
          @click="showRemount = !showRemount"
        >
          {{ showRemount ? "Unmount Avatar" : "Remount Avatar" }}
        </button>
      </article>
    </div>
  </section>
</template>
