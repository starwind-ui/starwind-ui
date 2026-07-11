import type * as React from "react";

export type NativeSelectOptGroupProps = React.ComponentPropsWithoutRef<"optgroup"> & {
  ref?: React.Ref<HTMLOptGroupElement>;
};

function NativeSelectOptGroup(props: NativeSelectOptGroupProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <optgroup
      className={["bg-[Canvas] text-[CanvasText]", className].filter(Boolean).join(" ")}
      {...rest}
      ref={ref}
      data-slot="native-select-optgroup"
    >
      {children}
    </optgroup>
  );
}

export default NativeSelectOptGroup;
