import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLSpanElement | null) => void;
};
declare const SelectItemIndicator: import("svelte").Component<Props, {}, "">;
type SelectItemIndicator = ReturnType<typeof SelectItemIndicator>;
export default SelectItemIndicator;
//# sourceMappingURL=SelectItemIndicator.svelte.d.ts.map