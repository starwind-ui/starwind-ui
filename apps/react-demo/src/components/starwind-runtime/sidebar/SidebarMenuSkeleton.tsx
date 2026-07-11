import type * as React from "react";
import { Skeleton } from "../skeleton";
import { sidebarMenuSkeleton } from "./variants";

export type SidebarMenuSkeletonProps = React.ComponentPropsWithoutRef<"div"> & {
  showIcon?: boolean;
  width?: string;
};

function SidebarMenuSkeleton(props: SidebarMenuSkeletonProps) {
  const { showIcon = false, width, className, ...rest } = props;

  const skeletonWidth = width ?? "70%";
  const skeletonStyle = { "--skeleton-width": skeletonWidth } as React.CSSProperties;

  return (
    <div
      className={sidebarMenuSkeleton({ class: className })}
      data-sidebar="menu-skeleton"
      {...rest}
      data-slot="sidebar-menu-skeleton"
    >
      {showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}

      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        style={skeletonStyle}
        data-sidebar="menu-skeleton-text"
      />
    </div>
  );
}

export default SidebarMenuSkeleton;
