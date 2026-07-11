import InputOtp from "./InputOtp";
import InputOtpGroup from "./InputOtpGroup";
import InputOtpSeparator from "./InputOtpSeparator";
import InputOtpSlot from "./InputOtpSlot";
import { inputOtp, inputOtpGroup, inputOtpSeparator, inputOtpSlot } from "./variants";

const REGEXP_ONLY_DIGITS = /^[0-9]+$/;
const REGEXP_ONLY_DIGITS_AND_CHARS = /^[A-Za-z0-9]+$/;
const InputOtpVariants = {
  inputOtp,
  inputOtpGroup,
  inputOtpSeparator,
  inputOtpSlot,
};

export {
  InputOtp,
  InputOtpGroup,
  InputOtpSeparator,
  InputOtpSlot,
  InputOtpVariants,
  REGEXP_ONLY_DIGITS,
  REGEXP_ONLY_DIGITS_AND_CHARS,
};

export default {
  Root: InputOtp,
  Group: InputOtpGroup,
  Separator: InputOtpSeparator,
  Slot: InputOtpSlot,
};
