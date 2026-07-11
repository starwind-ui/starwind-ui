import Alert from "./Alert";
import AlertDescription from "./AlertDescription";
import AlertTitle from "./AlertTitle";
import { alert, alertDescription, alertTitle } from "./variants";

const AlertVariants = {
  alert,
  alertDescription,
  alertTitle,
};

export { Alert, AlertDescription, AlertTitle, AlertVariants };

export default {
  Root: Alert,
  Description: AlertDescription,
  Title: AlertTitle,
};
