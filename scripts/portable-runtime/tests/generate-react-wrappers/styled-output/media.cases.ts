import { expect, path, readdir, readGeneratedFile } from "../shared.js";

export async function assertReactStyledMediaOutput(outputRoot: string): Promise<void> {
  await expect(readGeneratedFile(outputRoot, "image/Image.tsx")).rejects.toThrow();
  await expect(readdir(path.join(outputRoot, "image"))).rejects.toThrow();

  const avatarVariants = await readGeneratedFile(outputRoot, "avatar/variants.ts");
  const video = await readGeneratedFile(outputRoot, "video/Video.tsx");
  const videoVariants = await readGeneratedFile(outputRoot, "video/variants.ts");
  const videoIndex = await readGeneratedFile(outputRoot, "video/index.ts");

  expect(avatarVariants).toContain(
    'base: "text-foreground bg-muted relative inline-flex overflow-hidden rounded-full border-2"',
  );
  expect(avatarVariants).toContain('sm: "h-8 w-8 text-xs"');
  expect(avatarVariants).toContain('md: "h-10 w-10 text-sm"');
  expect(avatarVariants).toContain('lg: "h-12 w-12 text-base"');
  expect(avatarVariants).toContain(
    'base: "absolute inset-0.5 flex items-center justify-center rounded-full font-medium"',
  );
  expect(avatarVariants).toContain('base: "relative z-1 h-full w-full object-cover"');

  expect(video).not.toContain("../primitives");
  expect(video).toContain('React.ComponentPropsWithoutRef<"video">');
  expect(video).toContain('React.ComponentPropsWithoutRef<"iframe">');
  expect(video).toContain("src: string;");
  expect(video).toContain("ref?: React.Ref<HTMLVideoElement | HTMLIFrameElement>;");
  expect(video).toContain('title = "Video"');
  expect(video).toContain("autoPlay: autoplay = false");
  expect(video).toContain("muted = false");
  expect(video).toContain("loop = false");
  expect(video).toContain("controls = true");
  expect(video).toContain('src.includes("youtube.com/shorts/")');
  expect(video).toContain('src.includes("youtube-nocookie.com")');
  expect(video).toContain("URLSearchParams");
  expect(video).toContain("playlist");
  expect(video).toContain('videoType === "native" || !embedUrl');
  expect(video).toContain("<video");
  expect(video).toContain("className={video({ class: className })}");
  expect(video).toContain("autoPlay={autoplay}");
  expect(video).toContain("muted={muted}");
  expect(video).toContain("loop={loop}");
  expect(video).toContain("controls={controls}");
  expect(video).toContain("poster={poster}");
  expect(video).toContain("ref={ref as React.Ref<HTMLVideoElement>}");
  expect(video).toContain("<track");
  expect(video).toContain('kind="captions"');
  expect(video).toContain("<iframe");
  expect(video).toContain("src={iframeSrc}");
  expect(video).toContain("srcDoc={srcdoc}");
  expect(video).toContain("title={title}");
  expect(video).toContain('referrerPolicy="strict-origin-when-cross-origin"');
  expect(video).toContain("allowFullScreen");
  expect(video).toContain('data-video-type={isShort ? "youtube-shorts" : "youtube"}');
  expect(video).toContain("ref={ref as React.Ref<HTMLIFrameElement>}");
  expect(video).toContain('data-slot="video"');
  expect(video).not.toContain('from "@starwind-ui/runtime"');
  expect(videoVariants).not.toContain("starwind-video");
  expect(videoVariants).toContain("aspect-video h-auto w-full");
  expect(videoIndex).toContain("export default Video;");
  expect(videoIndex).not.toContain("Root: Video");

  assertGeneratedReactVideoBehavior(video);
}

type GeneratedVideoSnapshot = {
  embedUrl: string | null;
  iframeSrc: string | null | undefined;
  isShort: boolean;
  rendersNative: boolean;
  videoType: "native" | "youtube" | "youtube-shorts";
  youtubeId: string | null;
};

function assertGeneratedReactVideoBehavior(source: string): void {
  expect(evaluateReactVideo(source, { src: "/videos/demo.mp4" })).toEqual({
    embedUrl: null,
    iframeSrc: undefined,
    isShort: false,
    rendersNative: true,
    videoType: "native",
    youtubeId: null,
  });

  expect(
    evaluateReactVideo(source, {
      autoPlay: true,
      controls: false,
      loop: true,
      muted: true,
      src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10",
    }),
  ).toEqual({
    embedUrl:
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ&controls=0",
    iframeSrc:
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ&controls=0",
    isShort: false,
    rendersNative: false,
    videoType: "youtube",
    youtubeId: "dQw4w9WgXcQ",
  });

  expect(evaluateReactVideo(source, { src: "https://youtu.be/abc123?si=share" })).toMatchObject({
    embedUrl: "https://www.youtube-nocookie.com/embed/abc123",
    rendersNative: false,
    videoType: "youtube",
    youtubeId: "abc123",
  });

  expect(
    evaluateReactVideo(source, { src: "https://www.youtube.com/embed/embed123?start=30" }),
  ).toMatchObject({
    embedUrl: "https://www.youtube-nocookie.com/embed/embed123",
    rendersNative: false,
    videoType: "youtube",
    youtubeId: "embed123",
  });

  expect(
    evaluateReactVideo(source, {
      src: "https://www.youtube-nocookie.com/embed/nocookie123?rel=0",
    }),
  ).toMatchObject({
    embedUrl: "https://www.youtube-nocookie.com/embed/nocookie123",
    rendersNative: false,
    videoType: "youtube",
    youtubeId: "nocookie123",
  });

  expect(evaluateReactVideo(source, { src: "https://www.youtube.com/shorts/WVfUcdYugio" })).toEqual(
    {
      embedUrl: "https://www.youtube-nocookie.com/embed/WVfUcdYugio",
      iframeSrc: "https://www.youtube-nocookie.com/embed/WVfUcdYugio",
      isShort: true,
      rendersNative: false,
      videoType: "youtube-shorts",
      youtubeId: "WVfUcdYugio",
    },
  );

  expect(
    evaluateReactVideo(source, {
      src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      srcDoc: "<p>Runtime YouTube demo</p>",
    }),
  ).toMatchObject({
    embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    iframeSrc: undefined,
    rendersNative: false,
  });
}

function evaluateReactVideo(
  source: string,
  props: Record<string, unknown>,
): GeneratedVideoSnapshot {
  const functionMarker = "function Video(props: VideoProps) {";
  const bodyStart = source.indexOf(functionMarker) + functionMarker.length;
  expect(bodyStart).toBeGreaterThanOrEqual(functionMarker.length);

  const renderStart = source.indexOf("\n\n  if (", bodyStart);
  expect(renderStart).toBeGreaterThan(bodyStart);

  const script = `${source.slice(bodyStart, renderStart)}
return {
  embedUrl,
  iframeSrc,
  isShort,
  rendersNative: videoType === "native" || !embedUrl,
  videoType,
  youtubeId,
};`;

  return new Function("props", script)(props) as GeneratedVideoSnapshot;
}
