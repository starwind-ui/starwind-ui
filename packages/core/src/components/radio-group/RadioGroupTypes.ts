export interface RadioGroupChangeEvent extends CustomEvent {
  detail: {
    value: string;
    radioGroupId?: string;
  };
}
