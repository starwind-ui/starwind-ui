import InputOtp, { inputOtp } from "./InputOtp.astro";
import InputOtpGroup, { inputOtpGroup } from "./InputOtpGroup.astro";
import InputOtpSeparator, { inputOtpSeparator } from "./InputOtpSeparator.astro";
import InputOtpSlot, { inputOtpSlot } from "./InputOtpSlot.astro";
import type { InputOtpChangeEvent } from "./InputOtpTypes";

const REGEXP_ONLY_DIGITS_AND_CHARS = /^[A-Za-z0-9]+$/;
const REGEXP_ONLY_DIGITS = /^[0-9]+$/;

const InputOtpVariants = {
  inputOtp,
  inputOtpGroup,
  inputOtpSeparator,
  inputOtpSlot,
};

export {
  InputOtp,
  type InputOtpChangeEvent,
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
