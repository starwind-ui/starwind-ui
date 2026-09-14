import type * as React from "react";
import { avatarGroup } from "./variants";

export type AvatarGroupProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function AvatarGroup(props: AvatarGroupProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div className={avatarGroup({ class: className })} {...rest} ref={ref} data-slot="avatar-group">
      {children}
    </div>
  );
}

export default AvatarGroup;
