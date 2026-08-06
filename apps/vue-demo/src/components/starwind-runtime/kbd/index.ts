import Kbd from "./Kbd.vue";
import KbdGroup from "./KbdGroup.vue";
import { kbd, kbdGroup } from "./variants";

export type { KbdProps } from "./Kbd.vue";
export type { KbdGroupProps } from "./KbdGroup.vue";

const KbdVariants = { kbd, kbdGroup };

export { Kbd, KbdGroup, KbdVariants };

export default { Root: Kbd, Group: KbdGroup };
