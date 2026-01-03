export interface InputOtpChangeEvent extends CustomEvent {
  detail: {
    value: string;
    inputOtpId?: string;
  };
}
