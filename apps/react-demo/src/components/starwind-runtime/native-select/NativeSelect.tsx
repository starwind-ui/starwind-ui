import { IconChevronDown as ChevronDown } from "@tabler/icons-react";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { nativeSelect, nativeSelectIcon, nativeSelectWrapper } from "./variants";

export type NativeSelectProps = Omit<React.ComponentPropsWithoutRef<"select">, "size"> &
  VariantProps<typeof nativeSelect> & {
    ref?: React.Ref<HTMLSelectElement>;
    icon?: React.ReactNode;
  };

function NativeSelect(props: NativeSelectProps) {
  const { size, ref, className, children, icon, ...rest } = props;

  return (
    <div className={nativeSelectWrapper()} data-size={size} data-slot="native-select-wrapper">
      <select
        className={nativeSelect({ size, class: className })}
        {...rest}
        ref={ref}
        data-slot="native-select"
      >
        {children}
      </select>

      {icon ?? (
        <ChevronDown
          className={nativeSelectIcon({ size })}
          aria-hidden="true"
          data-slot="native-select-icon"
        />
      )}
    </div>
  );
}

export default NativeSelect;
