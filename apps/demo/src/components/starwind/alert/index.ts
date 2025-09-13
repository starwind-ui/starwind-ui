import Alert, { alert } from "./Alert.astro";
import AlertDescription, { alertDescription } from "./AlertDescription.astro";
import AlertTitle, { alertTitle } from "./AlertTitle.astro";

const AlertVariants = { alert, alertDescription, alertTitle };

export { Alert, AlertDescription, AlertTitle, AlertVariants };

export default {
  Root: Alert,
  Description: AlertDescription,
  Title: AlertTitle,
};
