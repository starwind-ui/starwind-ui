export interface ToggleChangeEvent extends CustomEvent {
  detail: {
    pressed: boolean;
    toggleId: string;
    syncGroup?: string;
  };
}

export interface ToggleSyncEvent extends CustomEvent {
  detail: {
    pressed: boolean;
    sourceId: string;
  };
}
