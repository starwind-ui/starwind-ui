import * as React from "react";

/**
 * The shared body of a passive Primitive part. It has the same order as the generated source:
 * discovery attributes, then the forwarded ref, then consumer props.
 */
export function createPassivePart(tag: string, attributes: Record<string, unknown>) {
  const Tag = tag as "div";
  return React.forwardRef<HTMLDivElement, Record<string, unknown>>((props, forwardedRef) => (
    <Tag {...attributes} ref={forwardedRef} {...props} />
  ));
}
