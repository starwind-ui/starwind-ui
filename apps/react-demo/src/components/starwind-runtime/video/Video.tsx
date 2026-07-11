import type * as React from "react";
import { video } from "./variants";

export type VideoProps = React.ComponentPropsWithoutRef<"video"> &
  React.ComponentPropsWithoutRef<"iframe"> & {
    src: string;
    title?: string;
    autoPlay?: boolean;
    muted?: boolean;
    loop?: boolean;
    controls?: boolean;
    poster?: string;
    ref?: React.Ref<HTMLVideoElement | HTMLIFrameElement>;
  };

function Video(props: VideoProps) {
  const {
    src,
    title = "Video",
    autoPlay: autoplay = false,
    muted = false,
    loop = false,
    controls = true,
    poster,
    srcDoc: srcdoc,
    ref,
    className,
    ...rest
  } = props;

  const videoType =
    src.includes("youtube.com/shorts/") || src.includes("youtu.be/shorts/")
      ? "youtube-shorts"
      : src.includes("youtube.com") ||
          src.includes("youtu.be") ||
          src.includes("youtube-nocookie.com")
        ? "youtube"
        : "native";
  const youtubeId =
    videoType !== "native"
      ? ([
          /youtube\.com\/shorts\/([^?&]+)/,
          /youtube\.com\/watch\?v=([^&]+)/,
          /youtube\.com\/embed\/([^?&]+)/,
          /youtu\.be\/([^?&]+)/,
          /youtube-nocookie\.com\/embed\/([^?&]+)/,
        ]
          .map((pattern) => src.match(pattern)?.[1])
          .find(Boolean) ?? null)
      : null;
  const isShort = videoType === "youtube-shorts";
  const embedUrl = youtubeId
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
    : null;
  const iframeSrc = srcdoc ? undefined : (embedUrl ?? undefined);

  if (videoType === "native" || !embedUrl) {
    return (
      <video
        data-sw-video
        className={video({ class: className })}
        src={src}
        autoPlay={autoplay}
        muted={muted}
        loop={loop}
        controls={controls}
        poster={poster}
        {...rest}
        ref={ref as React.Ref<HTMLVideoElement>}
        data-slot="video"
      >
        <track kind="captions" />
      </video>
    );
  }

  return (
    <iframe
      data-sw-video
      className={video({ class: className })}
      src={iframeSrc}
      srcDoc={srcdoc}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      data-video-type={isShort ? "youtube-shorts" : "youtube"}
      {...rest}
      ref={ref as React.Ref<HTMLIFrameElement>}
      data-slot="video"
    />
  );
}

export default Video;
