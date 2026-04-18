export interface ColorPickerChangeEvent extends CustomEvent {
  detail: {
    value: string;
    selectId: string;
  };
}
