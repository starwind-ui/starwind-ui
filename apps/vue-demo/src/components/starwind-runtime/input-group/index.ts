import InputGroup from "./InputGroup.vue";
import InputGroupAddon from "./InputGroupAddon.vue";
import InputGroupButton from "./InputGroupButton.vue";
import InputGroupInput from "./InputGroupInput.vue";
import InputGroupText from "./InputGroupText.vue";
import InputGroupTextarea from "./InputGroupTextarea.vue";
import {
  inputGroup,
  inputGroupAddon,
  inputGroupButton,
  inputGroupInput,
  inputGroupText,
  inputGroupTextarea,
} from "./variants";

export type { InputGroupProps } from "./InputGroup.vue";
export type { InputGroupAddonProps } from "./InputGroupAddon.vue";
export type { InputGroupButtonProps } from "./InputGroupButton.vue";
export type { InputGroupInputProps } from "./InputGroupInput.vue";
export type { InputGroupTextProps } from "./InputGroupText.vue";
export type { InputGroupTextareaProps } from "./InputGroupTextarea.vue";

const InputGroupVariants = {
  inputGroup,
  inputGroupAddon,
  inputGroupButton,
  inputGroupInput,
  inputGroupText,
  inputGroupTextarea,
};

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
  InputGroupVariants,
};

export default {
  Root: InputGroup,
  Addon: InputGroupAddon,
  Button: InputGroupButton,
  Input: InputGroupInput,
  Text: InputGroupText,
  Textarea: InputGroupTextarea,
};
