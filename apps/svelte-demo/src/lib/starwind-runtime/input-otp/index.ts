import InputOtp from "./InputOtp.svelte";
import InputOtpGroup from "./InputOtpGroup.svelte";
import InputOtpSlot from "./InputOtpSlot.svelte";
import InputOtpSeparator from "./InputOtpSeparator.svelte";
import { inputOtp, inputOtpGroup, inputOtpSeparator, inputOtpSlot } from "./variants.js";
export type { InputOtpProps } from "./InputOtp.svelte";
export type { InputOtpGroupProps } from "./InputOtpGroup.svelte";
export type { InputOtpSlotProps } from "./InputOtpSlot.svelte";
export type { InputOtpSeparatorProps } from "./InputOtpSeparator.svelte";
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
