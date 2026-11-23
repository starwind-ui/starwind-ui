import ScrollArea from "./ScrollArea.svelte";
import ScrollAreaContent from "./ScrollAreaContent.svelte";
import ScrollAreaCorner from "./ScrollAreaCorner.svelte";
import ScrollAreaThumb from "./ScrollAreaThumb.svelte";
import ScrollAreaViewport from "./ScrollAreaViewport.svelte";
import ScrollBar from "./ScrollBar.svelte";
import {
  scrollArea,
  scrollAreaContent,
  scrollAreaCorner,
  scrollAreaScrollbar,
  scrollAreaThumb,
  scrollAreaViewport,
} from "./variants.js";

export type { ScrollAreaProps } from "./ScrollArea.svelte";
export type { ScrollAreaContentProps } from "./ScrollAreaContent.svelte";
export type { ScrollAreaCornerProps } from "./ScrollAreaCorner.svelte";
export type { ScrollAreaThumbProps } from "./ScrollAreaThumb.svelte";
export type { ScrollAreaViewportProps } from "./ScrollAreaViewport.svelte";
export type { ScrollBarProps } from "./ScrollBar.svelte";

const ScrollAreaVariants = {
  scrollArea,
  scrollAreaContent,
  scrollAreaCorner,
  scrollAreaScrollbar,
  scrollAreaThumb,
  scrollAreaViewport,
};
const ScrollAreaParts = {
  Root: ScrollArea,
  Viewport: ScrollAreaViewport,
  Content: ScrollAreaContent,
  Scrollbar: ScrollBar,
  Thumb: ScrollAreaThumb,
  Corner: ScrollAreaCorner,
};

export {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaThumb,
  ScrollAreaVariants,
  ScrollAreaViewport,
  ScrollBar,
};
export default ScrollAreaParts;
