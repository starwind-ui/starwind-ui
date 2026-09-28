import { createStyledNativeConsumer } from "./styled-native-consumer.js";
export const createStyledAvatarConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, ["avatar"]);

export const avatarImports = `import Avatar, { Avatar as Root, AvatarImage, AvatarFallback, AvatarVariants, type AvatarProps, type AvatarImageProps, type AvatarFallbackProps } from "./avatar/index.js";
import Primitive, { AvatarRoot as PrimitiveRoot, AvatarImage as PrimitiveImage, AvatarFallback as PrimitiveFallback, type AvatarImageLoadingStatus, type AvatarLoadingStatusChangeDetails } from "@starwind-ui/svelte/avatar";
import { Avatar as RootNamespace, type AvatarImageLoadingStatus as RootStatus } from "@starwind-ui/svelte";`;
export const avatarPositive = `<script lang="ts">
${avatarImports}
import { createAttachmentKey, type Attachment } from "svelte/attachments";
const spanRef = (node: HTMLSpanElement | null) => { void node; };
const imageRef = (node: HTMLImageElement | null) => { void node; };
const attachment: Attachment<HTMLImageElement> = (node) => { void node.decode; return () => {}; };
const attachmentProps = { [createAttachmentKey()]: attachment };
const props: AvatarProps = { size: "lg", variant: "success", ref: spanRef, class: ["caller", { active: true }] };
const image: AvatarImageProps = { alt: "Portrait", src: "/portrait.svg", loading: "lazy", decoding: "async", crossorigin: "anonymous", sizes: "40px", srcset: "/portrait.svg 1x", ref: imageRef };
const fallback: AvatarFallbackProps = { delay: 30, ref: spanRef };
const notify = (status: AvatarImageLoadingStatus, details: AvatarLoadingStatusChangeDetails) => { const root: RootStatus = status; void [root, details.previousStatus, details.event]; };
void [AvatarVariants.avatar({ variant: "primary", size: "sm" }), AvatarVariants.avatarImage(), AvatarVariants.avatarFallback(), RootNamespace];
</script>
<Avatar.Root {...props}><Avatar.Image {...image} {...attachmentProps} onLoadingStatusChange={notify} onclick={(event) => { const img: HTMLImageElement = event.currentTarget; void img; }} /><Avatar.Fallback {...fallback}>SW</Avatar.Fallback></Avatar.Root>
<Root><AvatarImage alt="Named portrait" /><AvatarFallback>AB</AvatarFallback></Root>
<Primitive.Root ref={spanRef}><Primitive.Image alt="Primitive portrait" ref={imageRef} onLoadingStatusChange={notify} /><Primitive.Fallback delay={0} ref={spanRef}>CD</Primitive.Fallback></Primitive.Root>
<PrimitiveRoot><PrimitiveImage alt="Direct" /><PrimitiveFallback>EF</PrimitiveFallback></PrimitiveRoot>`;
