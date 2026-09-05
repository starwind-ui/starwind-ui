import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    container?: string | HTMLElement;
    disabled?: boolean;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const SelectPortal: import("svelte").Component<Props, {}, "">;
type SelectPortal = ReturnType<typeof SelectPortal>;
export default SelectPortal;
//# sourceMappingURL=SelectPortal.svelte.d.ts.map