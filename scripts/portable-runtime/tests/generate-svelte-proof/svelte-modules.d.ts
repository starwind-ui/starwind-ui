declare module "*.svelte" {
  import type { Component } from "svelte";

  export type CheckboxGroupContextValue = Readonly<{
    disabled: boolean;
    value: readonly string[];
  }>;
  export const CheckboxGroupContext: symbol;

  export type SelectContextValue = Readonly<{
    disabled: boolean;
    mounted: boolean;
    open: boolean;
    readOnly: boolean;
    registerPortal(owner: symbol, element: HTMLElement | null): void;
    required: boolean;
    selectedLabel: string | null;
    value: string | null;
  }>;
  export type SelectItemContextValue = Readonly<{
    disabled: boolean;
    value: string;
  }>;
  export const SelectContext: symbol;
  export const SelectItemContext: symbol;
  export function useSelectContext(part?: string): SelectContextValue;
  export function useSelectItemContext(part?: string): SelectItemContextValue;

  const component: Component<Record<string, unknown>>;
  export default component;
}

declare module "@starwind-ui/runtime/select" {
  export type SelectOpenChangeDetails = {
    cancel(): void;
    readonly isCanceled: boolean;
    open: boolean;
    previousOpen: boolean;
  };
  export type SelectValueChangeDetails = {
    cancel(): void;
    readonly isCanceled: boolean;
    previousValue: string | null;
    value: string | null;
  };
}
