import ScrollArea from "./ScrollArea.astro";
import ScrollAreaContent from "./ScrollAreaContent.astro";
import ScrollAreaCorner from "./ScrollAreaCorner.astro";
import ScrollAreaThumb from "./ScrollAreaThumb.astro";
import ScrollAreaViewport from "./ScrollAreaViewport.astro";
import ScrollBar from "./ScrollBar.astro";
import {
  scrollArea,
  scrollAreaContent,
  scrollAreaCorner,
  scrollAreaScrollbar,
  scrollAreaThumb,
  scrollAreaViewport,
} from "./variants";

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
