import ScrollArea from "./ScrollArea.astro";
import ScrollBar from "./ScrollBar.astro";
import { scrollArea, scrollBar, scrollBarThumb } from "./variants";
const ScrollAreaVariants = {
  scrollArea,
  scrollBar,
  scrollBarThumb,
};

export { ScrollArea, ScrollAreaVariants, ScrollBar };

export default {
  Root: ScrollArea,
  ScrollBar,
};
