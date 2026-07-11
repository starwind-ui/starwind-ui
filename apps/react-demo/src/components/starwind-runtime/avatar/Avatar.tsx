import AvatarPrimitive from "@starwind-ui/react/avatar";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { avatar } from "./variants";

export type AvatarProps = React.ComponentPropsWithoutRef<"span"> &
  VariantProps<typeof avatar> & {
    ref?: React.Ref<HTMLSpanElement>;
  };

function Avatar(props: AvatarProps) {
  const { variant, size, ref, className, children, ...rest } = props;

  return (
    <AvatarPrimitive.Root
      className={avatar({ variant, size, class: className })}
      {...rest}
      ref={ref}
      data-slot="avatar"
    >
      {children}
    </AvatarPrimitive.Root>
  );
}

export default Avatar;
