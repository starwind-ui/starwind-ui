export interface ColorPickerChangeEvent extends CustomEvent {
  detail: {
    value: string;
    selectId: string;
  };
}

export interface ColorPickerEvent extends CustomEvent {
  detail:
    | { value: string; selectId: string; }
    | { value: string; selectId?: string; };
}
