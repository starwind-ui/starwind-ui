import type { DistConsumer } from "./dist-consumer.js";
import { type PopoverCase, verifyPopoverBrowser } from "./popover-browser.js";

export function verifyStyledPopoverBrowser(
  consumer: DistConsumer,
  configs: PopoverCase[],
  actions: string,
) {
  return verifyPopoverBrowser(consumer, configs, actions, true);
}
