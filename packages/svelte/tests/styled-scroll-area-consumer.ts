import { createStyledNativeConsumer } from "./styled-native-consumer.js";
export const createStyledScrollAreaConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, ["scroll-area"]);
export const scrollAreaImports = `import Styled, { ScrollArea, ScrollAreaViewport, ScrollAreaContent, ScrollBar, ScrollAreaThumb, ScrollAreaCorner, ScrollAreaVariants, type ScrollAreaProps } from "./scroll-area/index.js";
import Primitive, { ScrollAreaRoot, ScrollAreaViewport as Viewport, ScrollAreaContent as Content, ScrollAreaScrollbar, ScrollAreaThumb as Thumb, ScrollAreaCorner as Corner, type ScrollAreaOverflowEdgeThreshold } from "@starwind-ui/svelte/scroll-area";`;
export const scrollAreaPositive = `<script lang="ts">
${scrollAreaImports}
import { createAttachmentKey, type Attachment } from "svelte/attachments";
const ref = (node: HTMLDivElement | null) => { void node; };
const attachment: Attachment<HTMLDivElement> = node => { void node.style; return () => {}; };
const attrs = { [createAttachmentKey()]: attachment };
const threshold: ScrollAreaOverflowEdgeThreshold = { xStart: 5, yEnd: 10 };
const props: ScrollAreaProps = { overflowEdgeThreshold: threshold, autoViewport: false, viewportClass: "scrolling", ref, class: ["caller", { active: true }] };
void [ScrollAreaVariants.scrollArea(), ScrollAreaVariants.scrollAreaViewport(), ScrollAreaVariants.scrollAreaContent(), ScrollAreaVariants.scrollAreaScrollbar(), ScrollAreaVariants.scrollAreaThumb(), ScrollAreaVariants.scrollAreaCorner()];
</script>
<Styled.Root {...props} {...attrs} onclick={event => { const node: HTMLDivElement = event.currentTarget; void node; }}><Styled.Viewport {ref}><Styled.Content {ref}>Content</Styled.Content></Styled.Viewport>{#snippet scrollbar()}<Styled.Scrollbar orientation="horizontal" keepMounted {ref}><Styled.Thumb {ref}/></Styled.Scrollbar>{/snippet}</Styled.Root>
<ScrollArea viewportClass="custom">Automatic</ScrollArea>
<ScrollArea autoViewport={false}><ScrollAreaViewport {ref}><ScrollAreaContent {ref}>Manual</ScrollAreaContent></ScrollAreaViewport>{#snippet scrollbar()}<ScrollBar orientation="horizontal" {ref}><ScrollAreaThumb {ref}/></ScrollBar><ScrollAreaCorner {ref}/>{/snippet}</ScrollArea>
<Primitive.Root overflowEdgeThreshold={threshold} {ref}><Primitive.Viewport {ref}><Primitive.Content {ref}>Primitive</Primitive.Content></Primitive.Viewport><Primitive.Scrollbar {ref}><Primitive.Thumb {ref}/></Primitive.Scrollbar><Primitive.Corner {ref}/></Primitive.Root>
<ScrollAreaRoot overflowEdgeThreshold={3} {ref}><Viewport {ref}><Content {ref}/></Viewport><ScrollAreaScrollbar orientation="horizontal" {ref}><Thumb {ref}/></ScrollAreaScrollbar><Corner {ref}/></ScrollAreaRoot>`;
