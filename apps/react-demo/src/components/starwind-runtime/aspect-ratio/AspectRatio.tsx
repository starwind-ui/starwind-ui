import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { aspectRatio } from "./variants";

export type AspectRatioProps<T extends React.ElementType = "div"> = Omit<
  React.ComponentPropsWithoutRef<T>,
  "as" | "ratio" | "ref"
> &
  VariantProps<typeof aspectRatio> & {
    as?: T;
    ratio?: number;
    ref?: React.Ref<HTMLElement>;
  };

// Callers get props from the as element. The body reads them with a wide element type.
function AspectRatio<T extends React.ElementType = "div">(
  props: AspectRatioProps<T>,
): React.JSX.Element;
function AspectRatio(props: AspectRatioProps<React.ElementType>) {
  const { ratio = 1, as: Tag = "div", ref, className, style, children, ...rest } = props;

  const ratioStyle = { "--ratio": ratio, ...style } as React.CSSProperties;

  return (
    <Tag
      {...rest}
      className={aspectRatio({ class: className })}
      style={ratioStyle}
      data-slot="aspect-ratio"
      ref={ref}
    >
      {children}
    </Tag>
  );
}

export default AspectRatio;
