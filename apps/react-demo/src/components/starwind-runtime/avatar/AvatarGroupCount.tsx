import type * as React from "react";
import { avatarGroupCount } from "./variants";

export type AvatarGroupCountProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function AvatarGroupCount(props: AvatarGroupCountProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div
      className={avatarGroupCount({ class: className })}
      {...rest}
      ref={ref}
      data-slot="avatar-group-count"
    >
      {children}
    </div>
  );
}

export default AvatarGroupCount;
