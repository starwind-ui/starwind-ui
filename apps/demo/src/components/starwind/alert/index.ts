import Alert from "./Alert.astro";
import AlertDescription from "./AlertDescription.astro";
import AlertTitle from "./AlertTitle.astro";
import { alertVariants } from "./variants";

export { Alert, AlertDescription, AlertTitle, alertVariants };

export default {
  Root: Alert,
  Description: AlertDescription,
  Title: AlertTitle,
};
