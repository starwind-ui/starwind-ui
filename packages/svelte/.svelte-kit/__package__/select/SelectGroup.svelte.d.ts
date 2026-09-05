import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const SelectGroup: import("svelte").Component<Props, {}, "">;
type SelectGroup = ReturnType<typeof SelectGroup>;
export default SelectGroup;
//# sourceMappingURL=SelectGroup.svelte.d.ts.map