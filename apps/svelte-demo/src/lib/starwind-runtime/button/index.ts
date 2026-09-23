import Button from "./Button.svelte";
import { button } from "./variants.js";
export type { ButtonProps } from "./Button.svelte";
const ButtonVariants = { button };
const ButtonParts = { Root: Button };
export { Button, ButtonVariants };
export default ButtonParts;
