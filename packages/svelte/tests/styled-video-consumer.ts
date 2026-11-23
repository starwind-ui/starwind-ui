import { createStyledNativeConsumer } from "./styled-native-consumer.js";

export const videoImports = `import Video, {Video as NamedVideo, VideoVariants, type VideoProps} from "./video/index.js";`;
export const createStyledVideoConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, ["video"]);
export const videoPositive = `<script lang="ts">
${videoImports}
import {createAttachmentKey,type Attachment} from "svelte/attachments";
let videoRef=$state<HTMLVideoElement|HTMLIFrameElement>();
const props:VideoProps={src:"/clip.mp4",title:"Recording",autoplay:false,muted:true,loop:true,controls:true,poster:"/poster.svg",preload:"metadata",playsinline:true,crossorigin:"anonymous",width:640,height:360,class:["media",{selected:true}],style:"max-width:40rem",ref:videoRef,onpointerdown(event){const owner:HTMLVideoElement|HTMLIFrameElement=event.currentTarget;void owner;}};
const embedded:VideoProps={src:"https://youtu.be/example",srcdoc:"<p>Local preview</p>",loading:"lazy",allowfullscreen:false,allow:"fullscreen",referrerpolicy:"origin",sandbox:"allow-same-origin",onload(event){const owner:Element=event.currentTarget;void owner;}};
const attachment:Attachment<HTMLVideoElement|HTMLIFrameElement>=node=>{const owner:HTMLVideoElement|HTMLIFrameElement=node;void owner;return()=>{};};
const symbols={[createAttachmentKey()]:attachment};void VideoVariants.video({class:"rounded-lg"});
</script>
<Video {...props} {...symbols}/><NamedVideo {...embedded}/><Video src="/clip.mp4">Inherited children remain unused.</Video>`;
/** Expected values preserve every source form in the existing contract. */
export const videoSourceCases = [
  { name: "local", src: "/clip.mp4", tag: "VIDEO" },
  {
    name: "watch",
    src: "https://www.youtube.com/watch?v=watch-id&start=4",
    tag: "IFRAME",
    id: "watch-id",
    kind: "youtube",
  },
  {
    name: "embed",
    src: "https://www.youtube.com/embed/embed-id?start=4",
    tag: "IFRAME",
    id: "embed-id",
    kind: "youtube",
  },
  {
    name: "short-link",
    src: "https://youtu.be/link-id?t=4",
    tag: "IFRAME",
    id: "link-id",
    kind: "youtube",
  },
  {
    name: "private",
    src: "https://www.youtube-nocookie.com/embed/private-id?start=4",
    tag: "IFRAME",
    id: "private-id",
    kind: "youtube",
  },
  {
    name: "shorts",
    src: "https://www.youtube.com/shorts/short-id?feature=share",
    tag: "IFRAME",
    id: "short-id",
    kind: "youtube-shorts",
  },
  {
    name: "short-link-path",
    src: "https://youtu.be/shorts/path-id?feature=share",
    tag: "IFRAME",
    id: "shorts/path-id",
    kind: "youtube-shorts",
  },
  { name: "invalid-empty", src: "https://www.youtube.com/watch?v=", tag: "VIDEO" },
  { name: "invalid-page", src: "https://www.youtube.com/channel/missing-video", tag: "VIDEO" },
  {
    name: "invalid-order",
    src: "https://www.youtube.com/watch?feature=share&v=late-id",
    tag: "VIDEO",
  },
] as const;
