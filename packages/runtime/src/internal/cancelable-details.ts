import { dispatchCustomEvent } from "./events";

export type CancelableDetails = {
  cancel(): void;
  readonly isCanceled: boolean;
};

export function createCancelableDetails<TDetails extends object>(
  details: TDetails,
): TDetails & CancelableDetails {
  let canceled = false;

  return {
    ...details,
    cancel() {
      canceled = true;
    },
    get isCanceled() {
      return canceled;
    },
  };
}

export function dispatchCancelableDetailsEvent<TDetails extends CancelableDetails>(
  target: HTMLElement,
  type: string,
  details: TDetails,
  options: { cancelable?: boolean } = {},
): CustomEvent<TDetails> {
  const event = dispatchCustomEvent(target, type, details, {
    cancelable: options.cancelable ?? true,
  });

  if (event.defaultPrevented) {
    details.cancel();
  }

  return event;
}

export function runCancelableDetailsTransaction<TDetails extends CancelableDetails>({
  apply,
  details,
  eventType,
  notifyAccepted,
  notifyCallback,
  rollbackCanceled,
  target,
}: {
  apply?: () => void;
  details: TDetails;
  eventType: string;
  notifyAccepted?: (details: TDetails) => void;
  notifyCallback?: (details: TDetails) => void;
  rollbackCanceled?: () => void;
  target: HTMLElement;
}): boolean {
  notifyCallback?.(details);
  dispatchCancelableDetailsEvent(target, eventType, details);

  if (details.isCanceled) {
    rollbackCanceled?.();
    return false;
  }

  apply?.();
  commitCancelableDetails(details);
  notifyAccepted?.(details);
  return true;
}

function commitCancelableDetails(details: CancelableDetails): void {
  Object.defineProperty(details, "cancel", {
    configurable: true,
    value: () => {},
  });
}
