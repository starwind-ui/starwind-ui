import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const SelectSeparator: import("svelte").Component<Props, {}, "">;
type SelectSeparator = ReturnType<typeof SelectSeparator>;
export default SelectSeparator;
//# sourceMappingURL=SelectSeparator.svelte.d.ts.map