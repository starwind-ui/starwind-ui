import { type AlertDialogCase, verifyAlertDialogBrowser } from "./alert-dialog-browser.js";
import type { DistConsumer } from "./dist-consumer.js";

export function verifyStyledAlertDialogBrowser(
  consumer: DistConsumer,
  configs: AlertDialogCase[],
  actions: string,
) {
  return verifyAlertDialogBrowser(consumer, configs, actions, true);
}
