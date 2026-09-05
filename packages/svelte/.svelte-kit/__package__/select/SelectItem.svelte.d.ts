import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    disabled?: boolean;
    ref?: (element: HTMLDivElement | null) => void;
    value: string;
};
declare const SelectItem: import("svelte").Component<Props, {}, "">;
type SelectItem = ReturnType<typeof SelectItem>;
export default SelectItem;
//# sourceMappingURL=SelectItem.svelte.d.ts.map