import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const SelectScrollUpArrow: import("svelte").Component<Props, {}, "">;
type SelectScrollUpArrow = ReturnType<typeof SelectScrollUpArrow>;
export default SelectScrollUpArrow;
//# sourceMappingURL=SelectScrollUpArrow.svelte.d.ts.map