import type { DistConsumer } from "./dist-consumer.js";
import { type DrawerCase, verifyDrawerBrowser } from "./drawer-browser.js";

export function verifyStyledSheetBrowser(
  consumer: DistConsumer,
  configs: DrawerCase[],
  actions: string,
) {
  return verifyDrawerBrowser(consumer, configs, actions, true);
}
