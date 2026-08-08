import Alert from "./Alert";
import AlertDescription from "./AlertDescription";
import AlertTitle from "./AlertTitle";
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
