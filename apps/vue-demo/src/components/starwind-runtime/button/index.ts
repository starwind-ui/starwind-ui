import Button from "./Button.vue";
import { button } from "./variants";

export type { ButtonProps } from "./Button.vue";

const ButtonVariants = { button };

const ButtonParts = { Root: Button };

export { Button, ButtonVariants };

export default ButtonParts;
