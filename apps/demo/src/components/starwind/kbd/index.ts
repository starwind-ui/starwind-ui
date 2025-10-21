import Kbd, { kbd } from "./Kbd.astro";
import KbdGroup, { kbdGroup } from "./KbdGroup.astro";

const KbdVariants = { kbd, kbdGroup };

export { Kbd, KbdGroup, KbdVariants };

export default {
  Root: Kbd,
  Group: KbdGroup,
};
