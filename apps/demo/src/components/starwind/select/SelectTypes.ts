export interface SelectChangeEvent extends CustomEvent {
  detail: {
    value: string;
    selectId: string;
    label: string;
  };
}

export interface SelectEvent extends CustomEvent {
  detail:
    | { value: string; selectId: string; selectName?: string }
    | { value: string; selectId?: string; selectName: string };
}
