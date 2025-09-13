import Switch, { switchButton, switchLabel, switchToggle } from "./Switch.astro";
import type { SwitchChangeEvent } from "./SwitchTypes";

const SwitchVariants = {
  switchButton,
  switchToggle,
  switchLabel,
};

export { Switch, type SwitchChangeEvent, SwitchVariants };

export default Switch;
