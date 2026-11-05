import { ref } from "vue";
import { parent } from "../../shared/harness";

export function useParent<T>(id: string, initial: T) {
  const value = ref(initial);
  parent(id, {
    write: (next) => {
      value.value = next as typeof value.value;
    },
    read: () => value.value,
  });
  return value;
}
