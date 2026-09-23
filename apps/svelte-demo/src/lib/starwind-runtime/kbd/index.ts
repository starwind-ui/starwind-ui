import Kbd from "./Kbd.svelte";
import KbdGroup from "./KbdGroup.svelte";
import { kbd, kbdGroup } from "./variants.js";
export type { KbdProps } from "./Kbd.svelte";
export type { KbdGroupProps } from "./KbdGroup.svelte";
const KbdVariants = { kbd, kbdGroup };
const KbdParts = { Root: Kbd, Group: KbdGroup };
export { Kbd, KbdGroup, KbdVariants };
export default KbdParts;
