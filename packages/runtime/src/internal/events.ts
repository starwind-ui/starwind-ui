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

export type ScheduledStarwindInit = {
  cancel(): void;
};

type PendingStarwindInit = {
  canceled: boolean;
  root: Element;
};

const pendingStarwindInits = new WeakMap<Document, Set<PendingStarwindInit>>();

export function scheduleStarwindInit(root: Element): ScheduledStarwindInit {
  const pendingInit = { canceled: false, root };
  enqueueStarwindInit(root.ownerDocument, pendingInit);

  return {
    cancel() {
      pendingInit.canceled = true;
    },
  };
}

function enqueueStarwindInit(ownerDocument: Document, pendingInit: PendingStarwindInit): void {
  const pendingInits = pendingStarwindInits.get(ownerDocument) ?? new Set<PendingStarwindInit>();
  const shouldSchedule = pendingInits.size === 0;
  pendingInits.add(pendingInit);
  pendingStarwindInits.set(ownerDocument, pendingInits);

  if (!shouldSchedule) return;

  queueMicrotask(() => flushStarwindInits(ownerDocument, pendingInits));
}

function flushStarwindInits(ownerDocument: Document, pendingInits: Set<PendingStarwindInit>): void {
  const batch = [...pendingInits];
  pendingInits.clear();
  const roots: Element[] = [];

  batch.forEach((pendingInit) => {
    if (pendingInit.canceled || !pendingInit.root.isConnected) return;

    const currentDocument = pendingInit.root.ownerDocument;
    if (currentDocument !== ownerDocument) {
      enqueueStarwindInit(currentDocument, pendingInit);
      return;
    }

    roots.push(pendingInit.root);
  });

  roots
    .filter(
      (candidate, index) =>
        roots.indexOf(candidate) === index &&
        !roots.some(
          (possibleAncestor) =>
            possibleAncestor !== candidate && possibleAncestor.contains(candidate),
        ),
    )
    .forEach((candidate) => {
      const CustomEventConstructor = ownerDocument.defaultView?.CustomEvent ?? CustomEvent;
      ownerDocument.dispatchEvent(
        new CustomEventConstructor("starwind:init", {
          detail: { root: candidate },
        }),
      );
    });
}
