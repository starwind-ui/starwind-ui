import type * as React from "react";
import "./styles.css";
import { prose } from "./variants";

export type ProseProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

function Prose(props: ProseProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <div
      data-sw-prose
      className={prose({ class: className })}
      {...rest}
      ref={ref}
      data-slot="prose"
    >
      {children}
    </div>
  );
}

export default Prose;
