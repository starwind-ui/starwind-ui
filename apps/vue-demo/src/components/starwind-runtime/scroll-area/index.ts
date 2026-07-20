import ScrollArea from "./ScrollArea.vue";
import ScrollAreaContent from "./ScrollAreaContent.vue";
import ScrollAreaCorner from "./ScrollAreaCorner.vue";
import ScrollAreaThumb from "./ScrollAreaThumb.vue";
import ScrollAreaViewport from "./ScrollAreaViewport.vue";
import ScrollBar from "./ScrollBar.vue";
import {
  scrollArea,
  scrollAreaContent,
  scrollAreaCorner,
  scrollAreaScrollbar,
  scrollAreaThumb,
  scrollAreaViewport,
} from "./variants";

export type { ScrollAreaProps } from "./ScrollArea.vue";
export type { ScrollAreaContentProps } from "./ScrollAreaContent.vue";
export type { ScrollAreaCornerProps } from "./ScrollAreaCorner.vue";
export type { ScrollAreaThumbProps } from "./ScrollAreaThumb.vue";
export type { ScrollAreaViewportProps } from "./ScrollAreaViewport.vue";
export type { ScrollBarProps } from "./ScrollBar.vue";

const ScrollAreaVariants = {
  scrollArea,
  scrollAreaContent,
  scrollAreaCorner,
  scrollAreaScrollbar,
  scrollAreaThumb,
  scrollAreaViewport,
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

export default {
  Root: ScrollArea,
  Viewport: ScrollAreaViewport,
  Content: ScrollAreaContent,
  Scrollbar: ScrollBar,
  Thumb: ScrollAreaThumb,
  Corner: ScrollAreaCorner,
};
