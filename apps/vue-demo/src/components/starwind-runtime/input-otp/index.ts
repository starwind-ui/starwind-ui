import InputOtp from "./InputOtp.vue";
import InputOtpGroup from "./InputOtpGroup.vue";
import InputOtpSeparator from "./InputOtpSeparator.vue";
import InputOtpSlot from "./InputOtpSlot.vue";
import { inputOtp, inputOtpGroup, inputOtpSeparator, inputOtpSlot } from "./variants";

export type { InputOtpProps } from "./InputOtp.vue";
export type { InputOtpGroupProps } from "./InputOtpGroup.vue";
export type { InputOtpSeparatorProps } from "./InputOtpSeparator.vue";
export type { InputOtpSlotProps } from "./InputOtpSlot.vue";

const REGEXP_ONLY_DIGITS = /^[0-9]+$/;
const REGEXP_ONLY_DIGITS_AND_CHARS = /^[A-Za-z0-9]+$/;

const InputOtpVariants = { inputOtp, inputOtpGroup, inputOtpSeparator, inputOtpSlot };

const InputOtpParts = {
  Root: InputOtp,
  Group: InputOtpGroup,
  Separator: InputOtpSeparator,
  Slot: InputOtpSlot,
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

export default InputOtpParts;
