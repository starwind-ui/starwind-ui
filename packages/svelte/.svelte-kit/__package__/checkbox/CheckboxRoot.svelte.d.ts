export type CheckboxGroupContextValue = Readonly<{
    disabled: boolean;
    value: readonly string[];
}>;
export type CheckboxIndicatorContextValue = Readonly<{
    checked: boolean;
    disabled: boolean;
    indeterminate: boolean;
    readOnly: boolean;
    required: boolean;
}>;
export declare const CheckboxGroupContext: symbol;
export declare const CheckboxIndicatorContext: symbol;
import { type CheckboxCheckedChangeDetails } from "@starwind-ui/runtime/checkbox";
import { type Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
type RootElement = HTMLSpanElement | HTMLButtonElement;
type ContractOwnedNativeProp = "children" | "disabled" | "form" | "id" | "name" | "readonly" | "required" | "type" | "value";
type NonNativeProps = Omit<HTMLAttributes<HTMLElement>, ContractOwnedNativeProp>;
type NativeButtonProps = Omit<HTMLButtonAttributes, ContractOwnedNativeProp>;
type ButtonOnlyNativeProp = Exclude<keyof NativeButtonProps, keyof NonNativeProps>;
type StrictNonNativeProps = NonNativeProps & {
    [Prop in ButtonOnlyNativeProp]?: never;
};
type ContractProps = {
    children?: Snippet;
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    form?: string;
    id?: string;
    indeterminate?: boolean;
    name?: string;
    onCheckedChange?: (checked: boolean, detail: CheckboxCheckedChangeDetails) => void;
    readOnly?: boolean;
    ref?: (element: RootElement | null) => void;
    required?: boolean;
    uncheckedValue?: string;
    value?: string;
};
type Props = ContractProps & ((StrictNonNativeProps & {
    nativeButton?: false;
}) | (NativeButtonProps & {
    nativeButton: true;
}));
declare const CheckboxRoot: import("svelte").Component<Props, {}, "checked">;
type CheckboxRoot = ReturnType<typeof CheckboxRoot>;
export default CheckboxRoot;
//# sourceMappingURL=CheckboxRoot.svelte.d.ts.map