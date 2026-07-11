export async function verifyVideoCases({ page, ids, label }) {
  const expectedPoster = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
  const videoState = await page.evaluate((ids) => {
    const root = document.getElementById(ids.demo);
    const native = document.getElementById(ids.native);
    const youtube = document.getElementById(ids.youtube);
    const shorts = document.getElementById(ids.shorts);

    const readVideo = (element) => ({
      allow: element?.getAttribute("allow") ?? null,
      allowFullscreen: element instanceof HTMLIFrameElement ? element.allowFullscreen : null,
      className: element?.getAttribute("class") ?? null,
      controls: element instanceof HTMLVideoElement ? element.controls : null,
      dataVideoType: element?.getAttribute("data-video-type") ?? null,
      hasDataSwVideo: element instanceof HTMLElement ? element.hasAttribute("data-sw-video") : null,
      loop: element instanceof HTMLVideoElement ? element.loop : null,
      muted: element instanceof HTMLVideoElement ? element.muted : null,
      poster: element instanceof HTMLVideoElement ? element.getAttribute("poster") : null,
      referrerPolicy: element?.getAttribute("referrerpolicy") ?? null,
      slot: element?.getAttribute("data-slot") ?? null,
      src: element?.getAttribute("src") ?? null,
      srcdoc: element?.getAttribute("srcdoc") ?? null,
      tagName: element?.tagName ?? null,
      title: element?.getAttribute("title") ?? null,
    });

    return {
      count: root?.querySelectorAll('[data-slot="video"][data-sw-video]').length ?? 0,
      native: readVideo(native),
      shorts: readVideo(shorts),
      youtube: readVideo(youtube),
    };
  }, ids);

  if (
    videoState.count !== 3 ||
    videoState.native.tagName !== "VIDEO" ||
    videoState.native.slot !== "video" ||
    videoState.native.hasDataSwVideo !== true ||
    videoState.native.className?.includes("aspect-video") !== true ||
    videoState.native.src !== "data:video/mp4;base64,AAAA" ||
    videoState.native.controls !== true ||
    videoState.native.loop !== true ||
    videoState.native.muted !== true ||
    videoState.native.poster !== expectedPoster ||
    videoState.youtube.tagName !== "IFRAME" ||
    videoState.youtube.slot !== "video" ||
    videoState.youtube.hasDataSwVideo !== true ||
    videoState.youtube.className?.includes("aspect-video") !== true ||
    videoState.youtube.dataVideoType !== "youtube" ||
    videoState.youtube.title !== "Runtime YouTube demo" ||
    videoState.youtube.src !== null ||
    videoState.youtube.srcdoc !== "<p>Runtime YouTube demo</p>" ||
    videoState.youtube.allowFullscreen !== true ||
    videoState.youtube.allow?.includes("picture-in-picture") !== true ||
    videoState.youtube.referrerPolicy !== "strict-origin-when-cross-origin" ||
    videoState.shorts.tagName !== "IFRAME" ||
    videoState.shorts.slot !== "video" ||
    videoState.shorts.hasDataSwVideo !== true ||
    videoState.shorts.dataVideoType !== "youtube-shorts" ||
    videoState.shorts.title !== "Runtime Shorts demo" ||
    videoState.shorts.src !== null ||
    videoState.shorts.srcdoc !== "<p>Runtime Shorts demo</p>" ||
    videoState.shorts.allowFullscreen !== true ||
    videoState.shorts.allow?.includes("picture-in-picture") !== true ||
    videoState.shorts.referrerPolicy !== "strict-origin-when-cross-origin"
  ) {
    throw new Error(
      `Expected ${label} Video demo to render native video, YouTube embeds, and Shorts embeds with data hooks, got ${JSON.stringify(
        videoState,
      )}.`,
    );
  }
}
