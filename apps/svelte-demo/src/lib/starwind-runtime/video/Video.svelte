<script module lang="ts">
  import type { SvelteHTMLElements } from "svelte/elements";
  import { cx } from "tailwind-variants";
  import { video } from "./variants.js";

  export type VideoProps = SvelteHTMLElements["video"] & SvelteHTMLElements["iframe"] & { src: string; title?: string; autoplay?: boolean; muted?: boolean; loop?: boolean; controls?: boolean; poster?: string; srcdoc?: string; ref?: HTMLVideoElement | HTMLIFrameElement; };
</script>

<script lang="ts">
  let {
    "src": src,
    "title": title = "Video",
    "autoplay": autoplay = false,
    "muted": muted = false,
    "loop": loop = false,
    "controls": controls = true,
    "poster": poster,
    "srcdoc": srcdoc,
    "class": className,
    ref = $bindable(),
    "children": children,
    ...rest
  }: VideoProps = $props();

  let videoType = $derived(src.includes("youtube.com/shorts/") || src.includes("youtu.be/shorts/")
    ? "youtube-shorts"
    : src.includes("youtube.com") ||
        src.includes("youtu.be") ||
        src.includes("youtube-nocookie.com")
      ? "youtube"
      : "native");

  let youtubeId = $derived(videoType !== "native"
    ? ([
        /youtube\.com\/shorts\/([^?&]+)/,
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtube\.com\/embed\/([^?&]+)/,
        /youtu\.be\/([^?&]+)/,
        /youtube-nocookie\.com\/embed\/([^?&]+)/,
      ]
        .map((pattern) => src.match(pattern)?.[1])
        .find(Boolean) ?? null)
    : null);

  let isShort = $derived(videoType === "youtube-shorts");

  let embedUrl = $derived(youtubeId
    ? (() => {
        const params = new URLSearchParams();
        if (autoplay) params.set("autoplay", "1");
        if (muted) params.set("mute", "1");
        if (loop) {
          params.set("loop", "1");
          params.set("playlist", youtubeId);
        }
        if (!controls) params.set("controls", "0");

        const baseUrl = "https://www.youtube-nocookie.com/embed/" + youtubeId;
        const queryString = params.toString();
        return queryString ? baseUrl + "?" + queryString : baseUrl;
      })()
    : null);

  let iframeSrc = $derived(srcdoc ? undefined : (embedUrl ?? undefined));
</script>

{#if videoType === "native" || !embedUrl}
  <video
    data-sw-video
    class={video({ "class": cx(className) })}
    src={src}
    autoplay={autoplay}
    muted={muted}
    loop={loop}
    controls={controls}
    poster={poster}
    {...rest}
    data-slot={"video"}
    bind:this={ref}
  >
    <track
      kind={"captions"}
    />
  </video>
{:else}
  <iframe
    data-sw-video
    class={video({ "class": cx(className) })}
    src={iframeSrc}
    srcdoc={srcdoc}
    title={title}
    allow={"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"}
    referrerpolicy={"strict-origin-when-cross-origin"}
    allowfullscreen
    data-video-type={isShort ? "youtube-shorts" : "youtube"}
    {...rest}
    data-slot={"video"}
    bind:this={ref}
  >

  </iframe>
{/if}
