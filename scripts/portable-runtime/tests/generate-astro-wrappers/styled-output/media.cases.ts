import { expect, readGeneratedFile } from "../shared.js";

export async function assertAstroStyledMediaOutput(outputRoot: string): Promise<void> {
  const avatarVariants = await readGeneratedFile(outputRoot, "avatar/variants.ts");
  const image = await readGeneratedFile(outputRoot, "image/Image.astro");
  const imageVariants = await readGeneratedFile(outputRoot, "image/variants.ts");
  const imageIndex = await readGeneratedFile(outputRoot, "image/index.ts");
  const video = await readGeneratedFile(outputRoot, "video/Video.astro");
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

  expect(image).not.toContain("../primitives");
  expect(image).toContain('import { Image as AstroImage } from "astro:assets";');
  expect(image).toContain(
    'type Props = Partial<import("astro/types").ComponentProps<typeof AstroImage>> & {',
  );
  expect(image).toContain("inferSize?: boolean;");
  expect(image).toContain('alt = ""');
  expect(image).toContain("inferSize = true");
  expect(image).toContain("src &&");
  expect(image).toContain("<AstroImage");
  expect(image).toContain("image({ class: className })");
  expect(image).toContain("src={src}");
  expect(image).toContain("alt={alt}");
  expect(image).toContain("inferSize={inferSize}");
  expect(image).toContain("{...(rest as any)}");
  expect(image).toContain('data-slot="image"');
  expect(image).not.toContain("@starwind-ui/runtime");
  expect(imageVariants).not.toContain("starwind-image");
  expect(imageVariants).toContain("h-auto w-full");
  expect(imageIndex).toContain("export default Image;");
  expect(imageIndex).not.toContain("Root: Image");

  expect(video).not.toContain("../primitives");
  expect(video).toContain('type Props = HTMLAttributes<"video"> & HTMLAttributes<"iframe"> & {');
  expect(video).toContain("src: string;");
  expect(video).toContain('title = "Video"');
  expect(video).toContain("autoplay = false");
  expect(video).toContain("muted = false");
  expect(video).toContain("loop = false");
  expect(video).toContain("controls = true");
  expect(video).toContain('src.includes("youtube.com/shorts/")');
  expect(video).toContain('src.includes("youtube-nocookie.com")');
  expect(video).toContain("URLSearchParams");
  expect(video).toContain("playlist");
  expect(video).toContain('videoType === "native" || !embedUrl');
  expect(video).toContain("<video");
  expect(video).toContain("class={video({ class: className })}");
  expect(video).toContain("autoplay={autoplay}");
  expect(video).toContain("muted={muted}");
  expect(video).toContain("loop={loop}");
  expect(video).toContain("controls={controls}");
  expect(video).toContain("poster={poster}");
  expect(video).toContain('<track kind="captions" />');
  expect(video).toContain("<iframe");
  expect(video).toContain("src={iframeSrc}");
  expect(video).toContain("srcdoc={srcdoc}");
  expect(video).toContain("title={title}");
  expect(video).toContain('referrerpolicy="strict-origin-when-cross-origin"');
  expect(video).toContain("allowfullscreen");
  expect(video).toContain('data-video-type={isShort ? "youtube-shorts" : "youtube"}');
  expect(video).toContain('data-slot="video"');
  expect(video).not.toContain("@starwind-ui/runtime");
  expect(videoVariants).not.toContain("starwind-video");
  expect(videoVariants).toContain("aspect-video h-auto w-full");
  expect(videoIndex).toContain("export default Video;");
  expect(videoIndex).not.toContain("Root: Video");

  assertGeneratedAstroVideoBehavior(video);
}

type GeneratedVideoSnapshot = {
  embedUrl: string | null;
  iframeSrc: string | null | undefined;
  isShort: boolean;
  rendersNative: boolean;
  videoType: "native" | "youtube" | "youtube-shorts";
  youtubeId: string | null;
};

function assertGeneratedAstroVideoBehavior(source: string): void {
  expect(evaluateAstroVideo(source, { src: "/videos/demo.mp4" })).toEqual({
    embedUrl: null,
    iframeSrc: undefined,
    isShort: false,
    rendersNative: true,
    videoType: "native",
    youtubeId: null,
  });

  expect(
    evaluateAstroVideo(source, {
      autoplay: true,
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

  expect(evaluateAstroVideo(source, { src: "https://youtu.be/abc123?si=share" })).toMatchObject({
    embedUrl: "https://www.youtube-nocookie.com/embed/abc123",
    rendersNative: false,
    videoType: "youtube",
    youtubeId: "abc123",
  });

  expect(
    evaluateAstroVideo(source, { src: "https://www.youtube.com/embed/embed123?start=30" }),
  ).toMatchObject({
    embedUrl: "https://www.youtube-nocookie.com/embed/embed123",
    rendersNative: false,
    videoType: "youtube",
    youtubeId: "embed123",
  });

  expect(
    evaluateAstroVideo(source, {
      src: "https://www.youtube-nocookie.com/embed/nocookie123?rel=0",
    }),
  ).toMatchObject({
    embedUrl: "https://www.youtube-nocookie.com/embed/nocookie123",
    rendersNative: false,
    videoType: "youtube",
    youtubeId: "nocookie123",
  });

  expect(evaluateAstroVideo(source, { src: "https://www.youtube.com/shorts/WVfUcdYugio" })).toEqual(
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
    evaluateAstroVideo(source, {
      src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      srcdoc: "<p>Runtime YouTube demo</p>",
    }),
  ).toMatchObject({
    embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    iframeSrc: undefined,
    rendersNative: false,
  });
}

function evaluateAstroVideo(
  source: string,
  props: Record<string, unknown>,
): GeneratedVideoSnapshot {
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1];
  expect(frontmatter).toBeDefined();

  const scriptStart = frontmatter!.indexOf("const {");
  expect(scriptStart).toBeGreaterThanOrEqual(0);

  const script = `const Astro = { props };
${frontmatter!.slice(scriptStart)}
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
