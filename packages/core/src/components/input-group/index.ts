import InputGroup from "./InputGroup.astro";
import InputGroupAddon from "./InputGroupAddon.astro";
import InputGroupButton from "./InputGroupButton.astro";
import InputGroupInput from "./InputGroupInput.astro";
import InputGroupText from "./InputGroupText.astro";
import InputGroupTextarea from "./InputGroupTextarea.astro";
import {
  inputGroup,
  inputGroupAddon,
  inputGroupButton,
  inputGroupInput,
  inputGroupText,
  inputGroupTextarea,
} from "./variants";
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
