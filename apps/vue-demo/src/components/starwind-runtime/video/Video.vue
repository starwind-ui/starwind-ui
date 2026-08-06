<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { computed, type HTMLAttributes, ref, useAttrs } from "vue";
import { video } from "./variants";

defineOptions({ inheritAttrs: false });

export type VideoProps = Omit<
  HTMLAttributes,
  "autoplay" | "class" | "controls" | "loop" | "muted" | "poster" | "src" | "srcdoc" | "title"
> &
  Omit<
    HTMLAttributes,
    "autoplay" | "class" | "controls" | "loop" | "muted" | "poster" | "src" | "srcdoc" | "title"
  > & {
    src: string;
    title?: string;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    controls?: boolean;
    poster?: string;
    srcdoc?: string;
    class?: ClassValue;
  };
type VideoDeclaredProps = {
  src: string;
  title?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  poster?: string;
  srcdoc?: string;
  class?: ClassValue;
} & /* @vue-ignore */ VideoProps;
const {
  src,
  title = "Video",
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  poster,
  srcdoc,
  class: className,
} = defineProps<VideoDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
const videoType = computed(() =>
  src.includes("youtube.com/shorts/") || src.includes("youtu.be/shorts/")
    ? "youtube-shorts"
    : src.includes("youtube.com") ||
        src.includes("youtu.be") ||
        src.includes("youtube-nocookie.com")
      ? "youtube"
      : "native",
);
const youtubeId = computed(() =>
  videoType.value !== "native"
    ? ([
        /youtube\.com\/shorts\/([^?&]+)/,
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtube\.com\/embed\/([^?&]+)/,
        /youtu\.be\/([^?&]+)/,
        /youtube-nocookie\.com\/embed\/([^?&]+)/,
      ]
        .map((pattern) => src.match(pattern)?.[1])
        .find(Boolean) ?? null)
    : null,
);
const isShort = computed(() => videoType.value === "youtube-shorts");
const embedUrl = computed(() =>
  youtubeId.value
    ? (() => {
        const params = new URLSearchParams();
        if (autoplay) params.set("autoplay", "1");
        if (muted) params.set("mute", "1");
        if (loop) {
          params.set("loop", "1");
          params.set("playlist", youtubeId.value);
        }
        if (!controls) params.set("controls", "0");

        const baseUrl = "https://www.youtube-nocookie.com/embed/" + youtubeId.value;
        const queryString = params.toString();
        return queryString ? baseUrl + "?" + queryString : baseUrl;
      })()
    : null,
);
const iframeSrc = computed(() => (srcdoc ? undefined : (embedUrl.value ?? undefined)));
const element = ref<HTMLVideoElement | HTMLIFrameElement | null>(null);
defineExpose({ element });
</script>

<template>
  <template v-if="videoType === 'native' || !embedUrl">
    <video
      ref="element"
      data-sw-video
      :class="video({ class: className })"
      :src="src"
      :autoplay="autoplay"
      :muted="muted"
      :loop="loop"
      :controls="controls"
      :poster="poster"
      v-bind="attrs"
      data-slot="video"
    >
      <track kind="captions" />
    </video>
  </template>
  <template v-else>
    <iframe
      ref="element"
      data-sw-video
      :class="video({ class: className })"
      :src="iframeSrc"
      :srcdoc="srcdoc"
      :title="title"
      allow="
        accelerometer;
        autoplay;
        clipboard-write;
        encrypted-media;
        gyroscope;
        picture-in-picture;
        web-share;
      "
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen
      :data-video-type="isShort ? 'youtube-shorts' : 'youtube'"
      v-bind="attrs"
      data-slot="video"
    />
  </template>
</template>
