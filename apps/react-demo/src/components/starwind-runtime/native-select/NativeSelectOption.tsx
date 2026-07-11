import type * as React from "react";

export type NativeSelectOptionProps = React.ComponentPropsWithoutRef<"option"> & {
  ref?: React.Ref<HTMLOptionElement>;
};

function NativeSelectOption(props: NativeSelectOptionProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <option
      className={["bg-[Canvas] text-[CanvasText]", className].filter(Boolean).join(" ")}
      {...rest}
      ref={ref}
      data-slot="native-select-option"
    >
      {children}
    </option>
  );
}

export default NativeSelectOption;
