import type { DistConsumer } from "./dist-consumer.js";
import { verifyStyledNavigationComposition } from "./navigation-menu-browser.js";
export function verifyStyledNavigationMenuLifecycle(consumer: DistConsumer) {
  return verifyStyledNavigationComposition(consumer);
}
