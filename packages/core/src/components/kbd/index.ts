import Kbd from "./Kbd.astro";
import KbdGroup from "./KbdGroup.astro";
import { kbd, kbdGroup } from "./variants";

const KbdVariants = { kbd, kbdGroup };

export { Kbd, KbdGroup, KbdVariants };

export default {
  Root: Kbd,
  Group: KbdGroup,
};
