import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { aspectRatio, aspectRatioWrapper } from "./variants";

export type AspectRatioProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof aspectRatio> & {
    as?: React.ElementType;
    ratio?: number;
    ref?: React.Ref<HTMLElement>;
  };

function AspectRatio(props: AspectRatioProps) {
  const { ratio = 1, as: Tag = "div", ref, className, children, ...rest } = props;

  const wrapperStyle = { paddingBottom: `${100 / ratio}%` } as React.CSSProperties;

  return (
    <div className={aspectRatioWrapper()} style={wrapperStyle} data-slot="aspect-ratio-wrapper">
      <Tag
        className={aspectRatio({ class: className })}
        data-slot="aspect-ratio"
        {...rest}
        ref={ref}
      >
        {children}
      </Tag>
    </div>
  );
}

export default AspectRatio;
