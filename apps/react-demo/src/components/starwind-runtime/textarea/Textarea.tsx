import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { textarea } from "./variants";

export type TextareaProps = Omit<React.ComponentPropsWithoutRef<"textarea">, "children"> &
  VariantProps<typeof textarea> & {
    "data-slot"?: string;
    ref?: React.Ref<HTMLTextAreaElement>;
  };

function Textarea(props: TextareaProps) {
  const { size, ref, "data-slot": dataSlot = "textarea", className, ...rest } = props;

  return (
    <textarea
      data-sw-textarea
      className={textarea({ size, class: className })}
      data-slot={dataSlot}
      {...rest}
      ref={ref}
    />
  );
}

export default Textarea;
