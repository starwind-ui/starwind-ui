import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const CarouselItem: import("svelte").Component<Props, {}, "">;
type CarouselItem = ReturnType<typeof CarouselItem>;
export default CarouselItem;
//# sourceMappingURL=CarouselItem.svelte.d.ts.map