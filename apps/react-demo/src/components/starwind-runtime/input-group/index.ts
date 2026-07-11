import InputGroup from "./InputGroup";
import InputGroupAddon from "./InputGroupAddon";
import InputGroupButton from "./InputGroupButton";
import InputGroupInput from "./InputGroupInput";
import InputGroupText from "./InputGroupText";
import InputGroupTextarea from "./InputGroupTextarea";
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
