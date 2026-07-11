import ScrollArea from "./ScrollArea";
import ScrollAreaContent from "./ScrollAreaContent";
import ScrollAreaCorner from "./ScrollAreaCorner";
import ScrollAreaThumb from "./ScrollAreaThumb";
import ScrollAreaViewport from "./ScrollAreaViewport";
import ScrollBar from "./ScrollBar";
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
