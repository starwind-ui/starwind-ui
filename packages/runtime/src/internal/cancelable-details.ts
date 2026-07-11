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
