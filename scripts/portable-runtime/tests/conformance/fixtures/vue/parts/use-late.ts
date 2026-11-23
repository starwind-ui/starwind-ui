import { type Ref, ref, shallowRef } from "vue";
import { parent } from "../../shared/harness";

/** A color input arrives as a fresh Color object on every write. An invalid string stays as is. */
export function shown(value: unknown): unknown {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as { toString(format: string): string }).toString("hex")
    : value;
}

/**
 * A parent that holds a model, starting `undefined`. Each scenario write also changes `tick`,
 * so a write of the same value still reaches the component as a stale rerender.
 */
export function useLate(
  id: string,
  initial?: unknown,
  adapt = (next: unknown) => next,
  // biome-ignore lint/suspicious/noExplicitAny: fixture values differ per component.
): { value: Ref<any>; tick: Ref<number> } {
  const value = shallowRef<unknown>(initial);
  const tick = ref(0);
  parent(id, {
    write: (next) => {
      value.value = adapt(next);
      tick.value += 1;
    },
    read: () => shown(value.value),
  });
  return { value, tick };
}
