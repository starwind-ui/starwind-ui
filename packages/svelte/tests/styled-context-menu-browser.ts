import type { DistConsumer } from "./dist-consumer.js";
import { verifyStyledMenuComposition } from "./menu-browser.js";
export function verifyStyledContextMenuLifecycle(consumer: DistConsumer) {
  return verifyStyledMenuComposition(consumer, true);
}
