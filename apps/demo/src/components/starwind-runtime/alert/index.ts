import Alert from "./Alert.astro";
import AlertDescription from "./AlertDescription.astro";
import AlertTitle from "./AlertTitle.astro";
import { alert, alertDescription, alertTitle } from "./variants";

const AlertVariants = {
  alert,
  alertDescription,
  alertTitle,
};

const AlertParts = {
  Root: Alert,
  Description: AlertDescription,
  Title: AlertTitle,
};

export { Alert, AlertDescription, AlertTitle, AlertVariants };

export default AlertParts;
