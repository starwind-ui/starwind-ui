import Skeleton from "./Skeleton.astro";
import { tv } from "tailwind-variants";

const skeletonVariant = tv({
  base: "bg-accent animate-pulse rounded-md",
});

export { Skeleton, skeletonVariant };



export default Skeleton;
