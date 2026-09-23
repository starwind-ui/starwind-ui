import type { DistConsumer } from "./dist-consumer.js";
import { verifyPopoverBrowser, type PopoverCase } from "./popover-browser.js";

export function verifyStyledPopoverBrowser(
  consumer: DistConsumer,
  configs: PopoverCase[],
  actions: string,
) {
  return verifyPopoverBrowser(consumer, configs, actions, true);
}
