import { verifyStyledComboboxComposition } from "./combobox-browser.js";
import type { DistConsumer } from "./dist-consumer.js";
export function verifyStyledComboboxLifecycle(consumer: DistConsumer) {
  return verifyStyledComboboxComposition(consumer);
}
