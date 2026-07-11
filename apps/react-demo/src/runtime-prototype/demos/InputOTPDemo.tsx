import type { FormEvent } from "react";
import { useState } from "react";
import { useRuntimePrototypeContext } from "../context";
import {
  Button,
  InputOtp,
  InputOtpGroup,
  InputOtpSeparator,
  InputOtpSlot,
  Label,
  REGEXP_ONLY_DIGITS_AND_CHARS,
} from "../kit";

export function InputOTPDemo() {
  const {
    controlledInputOtpValue,
    controlledInputOtpChanges,
    handleControlledInputOtpValueChange,
  } = useRuntimePrototypeContext();
  const [formOutput, setFormOutput] = useState("Input OTP form data: pending");

  const handleOtpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entries = Array.from(new FormData(event.currentTarget).entries()).map(
      ([name, value]) => `${name}: ${value}`,
    );
    setFormOutput(`Input OTP form data: ${entries.join(", ")}`);
  };

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Input OTP</h2>
      <form
        data-runtime-input-otp-form
        className="grid gap-6 sm:grid-cols-2"
        onSubmit={handleOtpSubmit}
      >
        <div className="grid gap-2">
          <Label htmlFor="react-runtime-input-otp-default" size="sm">
            One-time code
          </Label>
          <InputOtp
            id="react-runtime-input-otp-default"
            name="react-runtime-input-otp-default"
            defaultValue="12"
          >
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
        <div className="grid gap-2">
          <Label htmlFor="react-runtime-input-otp-controlled" size="sm">
            Controlled code
          </Label>
          <InputOtp
            id="react-runtime-input-otp-controlled"
            name="react-runtime-input-otp-controlled"
            value={controlledInputOtpValue}
            onValueChange={handleControlledInputOtpValueChange}
            pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
          >
            <InputOtpGroup>
              <InputOtpSlot index={0} size="sm" />
              <InputOtpSlot index={1} size="sm" />
              <InputOtpSlot index={2} size="sm" />
            </InputOtpGroup>
            <InputOtpSeparator />
            <InputOtpGroup>
              <InputOtpSlot index={3} size="sm" />
              <InputOtpSlot index={4} size="sm" />
              <InputOtpSlot index={5} size="sm" />
            </InputOtpGroup>
          </InputOtp>
          <p data-runtime-input-otp-value>Input OTP value: {controlledInputOtpValue}</p>
          <p data-runtime-input-otp-count>Input OTP changes: {controlledInputOtpChanges}</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="react-runtime-input-otp-disabled" size="sm">
            Disabled code
          </Label>
          <InputOtp
            id="react-runtime-input-otp-disabled"
            name="react-runtime-input-otp-disabled"
            defaultValue="654321"
            disabled
          >
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
        <div className="grid content-end gap-2">
          <Button type="submit" variant="outline" size="sm">
            Submit OTP
          </Button>
          <output className="text-muted-foreground text-sm" data-runtime-input-otp-output>
            {formOutput}
          </output>
        </div>
      </form>
    </section>
  );
}
