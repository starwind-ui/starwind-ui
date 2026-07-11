import AvatarPrimitive from "@starwind-ui/react/avatar";
import type * as React from "react";
import { avatarFallback } from "./variants";

export type AvatarFallbackProps = React.ComponentPropsWithoutRef<"span"> & {
  delay?: number;
  ref?: React.Ref<HTMLSpanElement>;
};

function AvatarFallback(props: AvatarFallbackProps) {
  const { delay, ref, className, children, ...rest } = props;

  return (
    <AvatarPrimitive.Fallback
      className={avatarFallback({ class: className })}
      delay={delay}
      {...rest}
      ref={ref}
      data-slot="avatar-fallback"
    >
      {children}
    </AvatarPrimitive.Fallback>
  );
}

export default AvatarFallback;
