import ScrollArea, { scrollArea } from "./ScrollArea.astro";
import ScrollBar, { scrollBar, scrollBarThumb } from "./ScrollBar.astro";

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
