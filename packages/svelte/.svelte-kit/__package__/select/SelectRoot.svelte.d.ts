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
export declare const SelectContext: symbol;
export declare const SelectItemContext: symbol;
export declare function useSelectContext(part?: string): SelectContextValue;
export declare function useSelectItemContext(part?: string): SelectItemContextValue;
import { type SelectOpenChangeDetails, type SelectValueChangeDetails } from "@starwind-ui/runtime/select";
import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type NativeProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "form" | "open" | "value">;
type Props = NativeProps & {
    children?: Snippet;
    autoComplete?: string;
    defaultOpen?: boolean;
    defaultValue?: string | null;
    disabled?: boolean;
    form?: string;
    highlightItemOnHover?: boolean;
    modal?: boolean;
    name?: string;
    open?: boolean;
    onOpenChange?: (open: boolean, detail: SelectOpenChangeDetails) => void;
    readOnly?: boolean;
    ref?: (element: HTMLDivElement | null) => void;
    required?: boolean;
    value?: string | null;
    onValueChange?: (value: string | null, detail: SelectValueChangeDetails) => void;
};
declare const SelectRoot: import("svelte").Component<Props, {
    close: () => void;
    show: () => void;
    updatePosition: () => void;
}, "open" | "value">;
type SelectRoot = ReturnType<typeof SelectRoot>;
export default SelectRoot;
//# sourceMappingURL=SelectRoot.svelte.d.ts.map