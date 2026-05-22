import Toggle from "./Toggle.astro";
import type { ToggleChangeEvent, ToggleSyncEvent } from "./ToggleTypes";
import { toggle } from "./variants";

const ToggleVariants = { toggle };

export { Toggle, type ToggleChangeEvent, type ToggleSyncEvent, ToggleVariants };

export default Toggle;
