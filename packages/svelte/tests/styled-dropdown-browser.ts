import type { DistConsumer } from "./dist-consumer.js";
import { verifyStyledMenuComposition } from "./menu-browser.js";
export function verifyStyledDropdownLifecycle(consumer: DistConsumer) {
  return verifyStyledMenuComposition(consumer, false);
}
