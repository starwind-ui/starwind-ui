import type { DistConsumer } from "./dist-consumer.js";
import { verifyAlertDialogBrowser, type AlertDialogCase } from "./alert-dialog-browser.js";

export function verifyStyledAlertDialogBrowser(
  consumer: DistConsumer,
  configs: AlertDialogCase[],
  actions: string,
) {
  return verifyAlertDialogBrowser(consumer, configs, actions, true);
}
