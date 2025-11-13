import Toggle, { toggle } from "./Toggle.astro";
import type { ToggleChangeEvent, ToggleSyncEvent } from "./ToggleTypes";

const ToggleVariants = { toggle };

export { Toggle, type ToggleChangeEvent, type ToggleSyncEvent, ToggleVariants };

export default Toggle;
