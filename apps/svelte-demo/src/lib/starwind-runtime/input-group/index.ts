import InputGroup from "./InputGroup.svelte";
import InputGroupAddon from "./InputGroupAddon.svelte";
import InputGroupButton from "./InputGroupButton.svelte";
import InputGroupInput from "./InputGroupInput.svelte";
import InputGroupText from "./InputGroupText.svelte";
import InputGroupTextarea from "./InputGroupTextarea.svelte";
import {
  inputGroup,
  inputGroupAddon,
  inputGroupButton,
  inputGroupInput,
  inputGroupText,
  inputGroupTextarea,
} from "./variants.js";
export type { InputGroupProps } from "./InputGroup.svelte";
export type { InputGroupAddonProps } from "./InputGroupAddon.svelte";
export type { InputGroupButtonProps } from "./InputGroupButton.svelte";
export type { InputGroupInputProps } from "./InputGroupInput.svelte";
export type { InputGroupTextProps } from "./InputGroupText.svelte";
export type { InputGroupTextareaProps } from "./InputGroupTextarea.svelte";
const InputGroupVariants = {
  inputGroup,
  inputGroupAddon,
  inputGroupButton,
  inputGroupInput,
  inputGroupText,
  inputGroupTextarea,
};
const InputGroupParts = {
  Root: InputGroup,
  Addon: InputGroupAddon,
  Button: InputGroupButton,
  Input: InputGroupInput,
  Text: InputGroupText,
  Textarea: InputGroupTextarea,
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
export default InputGroupParts;
