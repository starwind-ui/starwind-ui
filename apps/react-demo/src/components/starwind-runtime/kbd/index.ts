import Kbd from "./Kbd";
import KbdGroup from "./KbdGroup";
import { kbd, kbdGroup } from "./variants";

const KbdVariants = {
  kbd,
  kbdGroup,
};

export { Kbd, KbdGroup, KbdVariants };

export default {
  Root: Kbd,
  Group: KbdGroup,
};
