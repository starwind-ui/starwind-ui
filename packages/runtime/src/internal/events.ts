export function dispatchCustomEvent<TDetail>(
  target: HTMLElement,
  type: string,
  detail: TDetail,
  options: { cancelable?: boolean } = {},
): CustomEvent<TDetail> {
  const event = new CustomEvent<TDetail>(type, {
    bubbles: true,
    cancelable: options.cancelable ?? false,
    detail,
  });

  target.dispatchEvent(event);
  return event;
}
