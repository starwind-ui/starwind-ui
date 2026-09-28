import type { DistConsumer } from "./dist-consumer.js";
import { verifyDrawerBrowser, type DrawerCase } from "./drawer-browser.js";

export function verifyStyledSheetBrowser(
  consumer: DistConsumer,
  configs: DrawerCase[],
  actions: string,
) {
  return verifyDrawerBrowser(consumer, configs, actions, true);
}
