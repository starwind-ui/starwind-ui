<script lang="ts">
  import { InputOtp, InputOtpGroup, InputOtpSlot } from "$lib/starwind-runtime/input-otp";
</script>

<div>
  <InputOtp aria-label="Verification code" maxLength={6}>
    <InputOtpGroup>
      <InputOtpSlot index={0} />
      <InputOtpSlot index={1} />
      <InputOtpSlot index={2} />
      <InputOtpSlot index={3} />
      <InputOtpSlot index={4} />
      <InputOtpSlot index={5} />
    </InputOtpGroup>
  </InputOtp>
</div>
