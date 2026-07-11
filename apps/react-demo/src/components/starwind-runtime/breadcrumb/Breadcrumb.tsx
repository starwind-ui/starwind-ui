import type * as React from "react";

export type BreadcrumbProps = React.ComponentPropsWithoutRef<"nav"> & {
  ref?: React.Ref<HTMLElement>;
};

function Breadcrumb(props: BreadcrumbProps) {
  const { ref, className, children, ...rest } = props;

  return (
    <nav
      data-sw-breadcrumb
      aria-label="breadcrumb"
      className={className}
      {...rest}
      ref={ref}
      data-slot="breadcrumb"
    >
      {children}
    </nav>
  );
}

export default Breadcrumb;
