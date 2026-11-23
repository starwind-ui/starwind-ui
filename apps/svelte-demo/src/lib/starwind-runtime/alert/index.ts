import Alert from "./Alert.svelte";
import AlertDescription from "./AlertDescription.svelte";
import AlertTitle from "./AlertTitle.svelte";
import { alert, alertDescription, alertTitle } from "./variants.js";

export type { AlertProps } from "./Alert.svelte";
export type { AlertDescriptionProps } from "./AlertDescription.svelte";
export type { AlertTitleProps } from "./AlertTitle.svelte";

const AlertVariants = { alert, alertDescription, alertTitle };
const AlertParts = { Root: Alert, Description: AlertDescription, Title: AlertTitle };

export { Alert, AlertDescription, AlertTitle, AlertVariants };
export default AlertParts;
