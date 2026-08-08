import Alert from "./Alert.vue";
import AlertDescription from "./AlertDescription.vue";
import AlertTitle from "./AlertTitle.vue";
import { alert, alertDescription, alertTitle } from "./variants";

export type { AlertProps } from "./Alert.vue";
export type { AlertDescriptionProps } from "./AlertDescription.vue";
export type { AlertTitleProps } from "./AlertTitle.vue";

const AlertVariants = { alert, alertDescription, alertTitle };

const AlertParts = { Root: Alert, Description: AlertDescription, Title: AlertTitle };

export { Alert, AlertDescription, AlertTitle, AlertVariants };

export default AlertParts;
