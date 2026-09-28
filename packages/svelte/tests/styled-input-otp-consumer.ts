import { createStyledNativeConsumer } from "./styled-native-consumer.js";

export const createStyledInputOtpConsumer = (root: string) =>
  createStyledNativeConsumer(root, ["input-otp", "field", "separator", "form"]);

export const inputOtpImports = `import Otp, { InputOtp, InputOtpGroup, InputOtpSlot, InputOtpSeparator, InputOtpVariants, REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS, type InputOtpProps, type InputOtpSlotProps } from "./input-otp/index.js";
import Primitive, { InputOtp as Namespace, InputOtpRoot, InputOtpGroup as Group, InputOtpSlot as Slot, InputOtpSeparator as Separator, type InputOtpValueChangeDetails } from "@starwind-ui/svelte/input-otp";
import { createInputOtp, type InputOtpOptions, type InputOtpInstance, type InputOtpValueChangeReason, type InputOtpSetValueOptions } from "@starwind-ui/runtime/input-otp";`;

export const inputOtpPositive = `<script lang="ts">
${inputOtpImports}
import { createAttachmentKey } from "svelte/attachments";
let value = $state<string>();
const reason: InputOtpValueChangeReason = "paste";
const options: InputOtpOptions = { defaultValue: "12", pattern: REGEXP_ONLY_DIGITS_AND_CHARS, maxLength: 6 };
const command: InputOtpSetValueOptions = { emit: false, reason };
const props: InputOtpProps = { size: "sm", name: "code", id: "code", form: "external", required: true, readOnly: false, pattern: REGEXP_ONLY_DIGITS,
 onValueChange(value, detail) { const text: string = value; const details: InputOtpValueChangeDetails = detail; details.cancel(); void text; },
 ref(node) { const owner: HTMLDivElement | null = node; if(owner) { const instance: InputOtpInstance = createInputOtp(owner); instance.setValue("12", command); } },
};
const slot: InputOtpSlotProps = { index: 0, ref(node) { const owner: HTMLDivElement | null = node; void owner; } };
const attached = { [createAttachmentKey()]: (node: HTMLDivElement) => { void node.dataset; return () => {}; } };
void [options, Namespace, InputOtpVariants.inputOtp(), InputOtpVariants.inputOtpSlot()];
</script>
<Otp.Root {...props} {...attached} bind:value oninput={event=>{const root: HTMLDivElement=event.currentTarget;void root;}}>
 <Otp.Group {...attached}><Otp.Slot {...slot} /><Otp.Slot index={1} /></Otp.Group><Otp.Separator />
 <Otp.Group><Otp.Slot index={2} /></Otp.Group>
</Otp.Root>
<InputOtp size="lg"><InputOtpGroup><InputOtpSlot index={0}/></InputOtpGroup><InputOtpSeparator>{#snippet icon()}<span>or</span>{/snippet}</InputOtpSeparator></InputOtp>
<Primitive.Root bind:value defaultValue="12" pattern="[0-9]" maxLength={3}><Primitive.Group><Primitive.Slot index={0}>{#snippet caret()}<span>caret</span>{/snippet}</Primitive.Slot></Primitive.Group><Primitive.Separator>or</Primitive.Separator></Primitive.Root>
<InputOtpRoot value=""><Group/><Slot index={1}/><Separator/></InputOtpRoot>`;
