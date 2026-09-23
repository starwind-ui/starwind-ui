import type { DistConsumer } from "./dist-consumer.js";
import { verifyStyledComboboxComposition } from "./combobox-browser.js";
export function verifyStyledComboboxLifecycle(consumer: DistConsumer) {
  return verifyStyledComboboxComposition(consumer);
}
