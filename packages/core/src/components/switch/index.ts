import Switch from "./Switch.astro";
import type { SwitchChangeEvent } from "./SwitchTypes";
import { switchButton, switchLabel, switchToggle } from "./variants";

const SwitchVariants = {
  switchButton,
  switchToggle,
  switchLabel,
};

export { Switch, type SwitchChangeEvent, SwitchVariants };

export default Switch;
