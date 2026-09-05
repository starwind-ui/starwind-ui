import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    children?: Snippet<[label: string | null, value: string | null]>;
    placeholder?: string;
    ref?: (element: HTMLSpanElement | null) => void;
};
declare const SelectValue: import("svelte").Component<Props, {}, "">;
type SelectValue = ReturnType<typeof SelectValue>;
export default SelectValue;
//# sourceMappingURL=SelectValue.svelte.d.ts.map