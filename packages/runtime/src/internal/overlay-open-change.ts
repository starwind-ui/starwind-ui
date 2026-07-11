import {
  type CancelableDetails,
  createCancelableDetails,
  dispatchCancelableDetailsEvent,
} from "./cancelable-details";

export type OverlayOpenChangeRequest<TReason extends string, TTrigger = Element> = {
  event?: Event;
  reason: TReason;
  trigger?: TTrigger;
};

export type OverlayOpenChangeDetailsFields<TReason extends string> = {
  event?: Event;
  open: boolean;
  previousOpen: boolean;
  reason: TReason;
  trigger?: Element;
};

export type OverlayOpenChangeDetails<TReason extends string> =
  OverlayOpenChangeDetailsFields<TReason> & CancelableDetails;

export type OverlayOpenChangeShellContext<
  TReason extends string,
  TRequest extends OverlayOpenChangeRequest<TReason, unknown>,
  TDetails extends OverlayOpenChangeDetails<TReason>,
> = {
  details: TDetails;
  open: boolean;
  previousOpen: boolean;
  request: TRequest;
};

export type OverlayOpenChangeShellOptions<
  TReason extends string,
  TRequest extends OverlayOpenChangeRequest<TReason, unknown>,
  TDetails extends OverlayOpenChangeDetails<TReason> = OverlayOpenChangeDetails<TReason>,
> = {
  controlled: boolean;
  createDetails?: (details: OverlayOpenChangeDetailsFields<TReason>) => TDetails;
  eventType?: string;
  getTrigger?: (request: TRequest) => Element | undefined;
  onApplyControlledOpenState?: (
    context: OverlayOpenChangeShellContext<TReason, TRequest, TDetails>,
  ) => void;
  onApplyUncontrolledOpenState?: (
    context: OverlayOpenChangeShellContext<TReason, TRequest, TDetails>,
  ) => void;
  onBeforeOpenChange?: (context: {
    open: boolean;
    previousOpen: boolean;
    request: TRequest;
  }) => boolean | void;
  onNotifyOpenChangeSubscribers?: (details: TDetails) => void;
  onOpenChange?: (open: boolean, details: TDetails) => void;
  open: boolean;
  previousOpen: boolean;
  request: TRequest;
  root: HTMLElement;
};

export type OverlayOpenChangeShellResult<TDetails> =
  | { status: "applied"; details: TDetails }
  | { status: "blocked" }
  | { status: "canceled"; details: TDetails };

export function runOverlayOpenChangeShell<
  TReason extends string,
  TRequest extends OverlayOpenChangeRequest<TReason, unknown>,
  TDetails extends OverlayOpenChangeDetails<TReason> = OverlayOpenChangeDetails<TReason>,
>(
  options: OverlayOpenChangeShellOptions<TReason, TRequest, TDetails>,
): OverlayOpenChangeShellResult<TDetails> {
  const beforeResult = options.onBeforeOpenChange?.({
    open: options.open,
    previousOpen: options.previousOpen,
    request: options.request,
  });

  if (beforeResult === false) {
    return { status: "blocked" };
  }

  const details = (options.createDetails ?? createCancelableDetails)({
    event: options.request.event,
    open: options.open,
    previousOpen: options.previousOpen,
    reason: options.request.reason,
    trigger: resolveOpenChangeTrigger(options.request, options.getTrigger),
  }) as TDetails;
  const context = {
    details,
    open: options.open,
    previousOpen: options.previousOpen,
    request: options.request,
  };

  options.onOpenChange?.(options.open, details);
  dispatchCancelableDetailsEvent(
    options.root,
    options.eventType ?? "starwind:open-change",
    details,
  );

  if (details.isCanceled) {
    return { status: "canceled", details };
  }

  if (options.controlled) {
    options.onApplyControlledOpenState?.(context);
  } else {
    options.onApplyUncontrolledOpenState?.(context);
  }

  options.onNotifyOpenChangeSubscribers?.(details);

  return { status: "applied", details };
}

function resolveOpenChangeTrigger<
  TReason extends string,
  TRequest extends OverlayOpenChangeRequest<TReason, unknown>,
>(
  request: TRequest,
  getTrigger: ((request: TRequest) => Element | undefined) | undefined,
): Element | undefined {
  if (getTrigger) return getTrigger(request);

  return typeof Element !== "undefined" && request.trigger instanceof Element
    ? request.trigger
    : undefined;
}
