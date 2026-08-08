import Button from "./Button.astro";
import { button } from "./variants";

const ButtonVariants = {
  button,
};

const ButtonParts = {
  Root: Button,
};

export { Button, ButtonVariants };

export default ButtonParts;
