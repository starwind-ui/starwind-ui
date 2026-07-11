import type * as React from "react";
import { skeleton } from "./variants";

export type SkeletonProps = Omit<React.ComponentPropsWithoutRef<"div">, "children"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function Skeleton(props: SkeletonProps) {
  const { ref, className, ...rest } = props;

  return (
    <div
      data-sw-skeleton
      className={skeleton({ class: className })}
      {...rest}
      ref={ref}
      data-slot="skeleton"
    />
  );
}

export default Skeleton;
