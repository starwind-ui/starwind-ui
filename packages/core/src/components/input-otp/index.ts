import InputOtp, { inputOtp } from "./InputOtp.astro";
import InputOtpGroup, { inputOtpGroup } from "./InputOtpGroup.astro";
import InputOtpSeparator, { inputOtpSeparator } from "./InputOtpSeparator.astro";
import InputOtpSlot, { inputOtpSlot } from "./InputOtpSlot.astro";
import type { InputOtpChangeEvent } from "./InputOtpTypes";

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
};

export default {
  Root: InputOtp,
  Group: InputOtpGroup,
  Separator: InputOtpSeparator,
  Slot: InputOtpSlot,
};

