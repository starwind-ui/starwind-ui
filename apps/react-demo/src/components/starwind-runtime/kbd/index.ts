import Kbd from "./Kbd";
import KbdGroup from "./KbdGroup";
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
