import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    index?: number;
    ref?: (element: HTMLDivElement | null) => void;
    inputRef?: (element: HTMLInputElement | null) => void;
};
declare const SliderThumb: import("svelte").Component<Props, {}, "">;
type SliderThumb = ReturnType<typeof SliderThumb>;
export default SliderThumb;
//# sourceMappingURL=SliderThumb.svelte.d.ts.map