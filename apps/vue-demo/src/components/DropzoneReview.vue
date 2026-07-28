<script setup lang="ts">
import * as DropzonePrimitive from "@starwind-ui/vue/dropzone";
import { ref } from "vue";

import { Dropzone } from "./starwind-runtime/dropzone";

const primitiveFiles = ref<string[]>([]);
const styledFiles = ref<string[]>([]);
const uploading = ref(false);
const showStyled = ref(true);

function names(files: File[]): string[] {
  return files.map((file) => file.name);
}
</script>

<template>
  <section id="dropzone-review" class="review-card" data-testid="dropzone-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Native file input, Runtime drag state, and one-way upload state</p>
        <h2>Dropzone</h2>
      </div>
    </div>

    <div class="review-grid">
      <article class="scenario">
        <h3>Primitive accepted files</h3>
        <DropzonePrimitive.DropzoneRoot
          aria-label="Primitive image dropzone"
          @files-change="(files) => (primitiveFiles = names(files))"
        >
          <DropzonePrimitive.DropzoneUploadIndicator
            >Drop images here</DropzonePrimitive.DropzoneUploadIndicator
          >
          <DropzonePrimitive.DropzoneLoadingIndicator
            >Uploading…</DropzonePrimitive.DropzoneLoadingIndicator
          >
          <DropzonePrimitive.DropzoneFilesList aria-live="polite" />
          <DropzonePrimitive.DropzoneInput accept="image/*" multiple name="primitive-images" />
        </DropzonePrimitive.DropzoneRoot>
        <output data-testid="primitive-dropzone-files">{{
          primitiveFiles.join(", ") || "none"
        }}</output>
      </article>

      <article class="scenario">
        <h3>Styled upload presentation and remount</h3>
        <Dropzone
          v-if="showStyled"
          accept=".png,.jpg"
          :is-uploading="uploading"
          multiple
          name="styled-images"
          @files-change="(files) => (styledFiles = names(files))"
        />
        <output data-testid="styled-dropzone-files">{{ styledFiles.join(", ") || "none" }}</output>
        <button class="review-action" type="button" @click="uploading = !uploading">
          {{ uploading ? "Finish upload" : "Show uploading" }}
        </button>
        <button class="review-action" type="button" @click="showStyled = !showStyled">
          {{ showStyled ? "Unmount Dropzone" : "Remount Dropzone" }}
        </button>
      </article>
    </div>
  </section>
</template>
