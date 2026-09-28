import Switch from "./Switch.svelte";
import { switchButton, switchLabel, switchToggle, switchWrapper } from "./variants.js";
export type { SwitchProps } from "./Switch.svelte";
const SwitchVariants = { switchButton, switchLabel, switchToggle, switchWrapper };
export { Switch, SwitchVariants };
export default Switch;
