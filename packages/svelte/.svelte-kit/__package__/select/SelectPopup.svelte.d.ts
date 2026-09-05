import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    align?: "start" | "center" | "end";
    alignOffset?: number;
    avoidCollisions?: boolean;
    ref?: (element: HTMLDivElement | null) => void;
    side?: "top" | "right" | "bottom" | "left";
    sideOffset?: number;
};
declare const SelectPopup: import("svelte").Component<Props, {}, "">;
type SelectPopup = ReturnType<typeof SelectPopup>;
export default SelectPopup;
//# sourceMappingURL=SelectPopup.svelte.d.ts.map