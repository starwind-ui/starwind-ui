import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    align?: "start" | "center" | "end";
    alignOffset?: number;
    alignItemWithTrigger?: boolean;
    avoidCollisions?: boolean;
    ref?: (element: HTMLDivElement | null) => void;
    side?: "top" | "right" | "bottom" | "left";
    sideOffset?: number;
};
declare const SelectPositioner: import("svelte").Component<Props, {}, "">;
type SelectPositioner = ReturnType<typeof SelectPositioner>;
export default SelectPositioner;
//# sourceMappingURL=SelectPositioner.svelte.d.ts.map