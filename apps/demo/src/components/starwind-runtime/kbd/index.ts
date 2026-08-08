import Kbd from "./Kbd.astro";
import KbdGroup from "./KbdGroup.astro";
import { kbd, kbdGroup } from "./variants";

const KbdVariants = {
  kbd,
  kbdGroup,
};

const KbdParts = {
  Root: Kbd,
  Group: KbdGroup,
};

export { Kbd, KbdGroup, KbdVariants };

export default KbdParts;
