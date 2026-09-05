import { type Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
type Props = Omit<HTMLButtonAttributes, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLButtonElement | null) => void;
};
declare const CarouselNext: import("svelte").Component<Props, {}, "">;
type CarouselNext = ReturnType<typeof CarouselNext>;
export default CarouselNext;
//# sourceMappingURL=CarouselNext.svelte.d.ts.map