import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const SliderControl: import("svelte").Component<Props, {}, "">;
type SliderControl = ReturnType<typeof SliderControl>;
export default SliderControl;
//# sourceMappingURL=SliderControl.svelte.d.ts.map