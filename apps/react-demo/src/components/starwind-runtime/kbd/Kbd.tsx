import type * as React from "react";
import { kbd } from "./variants";

export type KbdProps = React.ComponentPropsWithoutRef<"kbd"> & {
  ref?: React.Ref<HTMLElement>;
};

function Kbd(props: KbdProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <kbd data-sw-kbd className={kbd({ class: className })} {...rest} ref={ref} data-slot="kbd">
      {children}
    </kbd>
  );
}

export default Kbd;
