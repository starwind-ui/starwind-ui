import type * as React from "react";
import { kbdGroup } from "./variants";

export type KbdGroupProps = React.ComponentPropsWithoutRef<"kbd"> & {
  ref?: React.Ref<HTMLElement>;
};

function KbdGroup(props: KbdGroupProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <kbd
      data-sw-kbd-group
      className={kbdGroup({ class: className })}
      {...rest}
      ref={ref}
      data-slot="kbd-group"
    >
      {children}
    </kbd>
  );
}

export default KbdGroup;
