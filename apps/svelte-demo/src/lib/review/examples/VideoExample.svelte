<script lang="ts">
  import Video from "$lib/starwind-runtime/video";
  import { Button } from "$lib/starwind-runtime/button";
  import recording from "../../../../../demo/src/assets/videos/starwind-pro_nav-3-responsive.mp4?url";
  let source = $state<"local" | "embed" | "shorts">("local");
  let inline = $state(true),
    loop = $state(false);
  const preview =
    '<!doctype html><html lang="en"><meta charset="utf-8"><style>body{margin:0;min-height:100vh;display:grid;place-content:center;background:#172554;color:#eff6ff;font:16px system-ui;text-align:center}span{font-size:42px}p{margin:12px}</style><span aria-hidden="true">▶</span><p>Studio walkthrough</p><p>Embedded preview</p></html>';
  const src = $derived(
    source === "local"
      ? recording
      : source === "shorts"
        ? "https://www.youtube.com/shorts/review-short"
        : "https://www.youtube.com/watch?v=review-video",
  );
</script>

<div class="space-y-4">
  <div class="flex flex-wrap gap-2" role="group" aria-label="Video source">
    <Button
      variant={source === "local" ? "primary" : "outline"}
      size="sm"
      aria-pressed={source === "local"}
      onclick={() => (source = "local")}>Local recording</Button
    >
    <Button
      variant={source === "embed" ? "primary" : "outline"}
      size="sm"
      aria-pressed={source === "embed"}
      onclick={() => (source = "embed")}>YouTube preview</Button
    >
    <Button
      variant={source === "shorts" ? "primary" : "outline"}
      size="sm"
      aria-pressed={source === "shorts"}
      onclick={() => (source = "shorts")}>Shorts preview</Button
    >
  </div>
  <Video
    {src}
    {loop}
    muted
    preload="metadata"
    title="Studio walkthrough"
    srcdoc={source !== "local" && inline ? preview : undefined}
    data-video-example
  />
  <div class="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
    <label class="flex items-center gap-2"
      ><input type="checkbox" bind:checked={loop} />Loop playback</label
    >
    <label class="flex items-center gap-2"
      ><input type="checkbox" bind:checked={inline} disabled={source === "local"} />Show inline
      preview</label
    >
  </div>
  <p class="m-0! text-sm text-muted-foreground" aria-live="polite" data-video-summary>
    {source === "local"
      ? "Local recording · Native playback controls"
      : source === "shorts"
        ? "Shorts · Embedded player"
        : "YouTube · Embedded player"}
  </p>
</div>
