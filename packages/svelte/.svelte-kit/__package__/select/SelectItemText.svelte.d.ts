import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLSpanElement | null) => void;
};
declare const SelectItemText: import("svelte").Component<Props, {}, "">;
type SelectItemText = ReturnType<typeof SelectItemText>;
export default SelectItemText;
//# sourceMappingURL=SelectItemText.svelte.d.ts.map