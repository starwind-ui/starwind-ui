import { IconLoader2 as Loader2 } from "@tabler/icons-react";
import type * as React from "react";
import { spinner } from "./variants";

export type SpinnerProps = Omit<React.ComponentPropsWithoutRef<"svg">, "role" | "aria-label">;

function Spinner(props: SpinnerProps) {
  const { className, ...rest } = props;

  return (
    <Loader2
      role="status"
      aria-label="Loading"
      className={spinner({ class: className })}
      {...rest}
      data-slot="spinner"
    />
  );
}

export default Spinner;
