export type OverlayDismissalOptions = {
  contains?: (target: Node) => boolean;
  floating: HTMLElement;
  onEscapeKeyDown?: (event: KeyboardEvent) => boolean | void;
  onOutsidePointerDown?: (event: PointerEvent) => void;
  root: HTMLElement;
};

export type OverlayDismissalHandle = {
  destroy(): void;
};

type OverlayDismissalEntry = Required<Pick<OverlayDismissalOptions, "floating" | "root">> &
  Pick<OverlayDismissalOptions, "contains" | "onEscapeKeyDown" | "onOutsidePointerDown">;

const documentRegistries = new WeakMap<Document, OverlayDismissalRegistry>();

export function registerOverlayDismissal(options: OverlayDismissalOptions): OverlayDismissalHandle {
  const ownerDocument = options.root.ownerDocument;
  let registry = documentRegistries.get(ownerDocument);

  if (!registry) {
    registry = new OverlayDismissalRegistry(ownerDocument);
    documentRegistries.set(ownerDocument, registry);
  }

  return registry.register(options);
}

class OverlayDismissalRegistry {
  private readonly entries: OverlayDismissalEntry[] = [];
  private listening = false;

  constructor(private readonly ownerDocument: Document) {}

  register(options: OverlayDismissalOptions): OverlayDismissalHandle {
    this.pruneDisconnectedEntries();

    const entry: OverlayDismissalEntry = {
      contains: options.contains,
      floating: options.floating,
      onEscapeKeyDown: options.onEscapeKeyDown,
      onOutsidePointerDown: options.onOutsidePointerDown,
      root: options.root,
    };

    this.entries.push(entry);
    this.startListening();

    return {
      destroy: () => {
        const index = this.entries.indexOf(entry);
        if (index >= 0) {
          this.entries.splice(index, 1);
        }

        this.stopListeningIfIdle();
      },
    };
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    if (event.defaultPrevented) return;

    this.pruneDisconnectedEntries();
    const activeModalRealm = resolveActiveModalRealm(event, this.ownerDocument);

    for (const entry of this.getEntriesFromTopmost()) {
      if (
        activeModalRealm.hasModal &&
        (!activeModalRealm.owner ||
          (!activeModalRealm.owner.contains(entry.root) &&
            !activeModalRealm.owner.contains(entry.floating)))
      ) {
        continue;
      }
      if (entry.onEscapeKeyDown?.(event) || event.defaultPrevented) return;
    }
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (!isDocumentNode(event.target, this.ownerDocument)) return;

    this.pruneDisconnectedEntries();

    const entries = this.getEntriesFromTopmost();
    const containingEntries = this.getEntriesContainingTarget(entries, event.target);

    for (const entry of entries) {
      if (containingEntries.has(entry)) continue;
      if (!entry.onOutsidePointerDown) continue;

      entry.onOutsidePointerDown(event);
    }
  };

  private startListening(): void {
    if (this.listening) return;

    this.ownerDocument.addEventListener("keydown", this.handleKeyDown, { capture: true });
    this.ownerDocument.addEventListener("pointerdown", this.handlePointerDown);
    this.listening = true;
  }

  private stopListeningIfIdle(): void {
    if (!this.listening || this.entries.length > 0) return;

    this.ownerDocument.removeEventListener("keydown", this.handleKeyDown, { capture: true });
    this.ownerDocument.removeEventListener("pointerdown", this.handlePointerDown);
    this.listening = false;
  }

  private pruneDisconnectedEntries(): void {
    for (let index = this.entries.length - 1; index >= 0; index -= 1) {
      const entry = this.entries[index];
      if (entry.root.isConnected) continue;

      this.entries.splice(index, 1);
    }

    this.stopListeningIfIdle();
  }

  private getEntriesFromTopmost(): OverlayDismissalEntry[] {
    return [...this.entries].reverse();
  }

  private getEntriesContainingTarget(
    entries: OverlayDismissalEntry[],
    target: Node,
  ): Set<OverlayDismissalEntry> {
    const containingEntries = new Set(
      entries.filter((entry) => this.entryContainsTarget(entry, target)),
    );

    let addedOwner = true;
    while (addedOwner) {
      addedOwner = false;

      for (const entry of entries) {
        if (containingEntries.has(entry)) continue;

        const ownsContainingOverlay = Array.from(containingEntries).some((containedEntry) =>
          this.entryContainsTarget(entry, containedEntry.root),
        );
        if (!ownsContainingOverlay) continue;

        containingEntries.add(entry);
        addedOwner = true;
      }
    }

    return containingEntries;
  }

  private entryContainsTarget(entry: OverlayDismissalEntry, target: Node): boolean {
    return entry.contains
      ? entry.contains(target)
      : entry.root.contains(target) || entry.floating.contains(target);
  }
}

function isDocumentNode(value: EventTarget | null, ownerDocument: Document): value is Node {
  const NodeConstructor = ownerDocument.defaultView?.Node ?? Node;
  return value instanceof NodeConstructor;
}

function resolveActiveModalRealm(
  event: KeyboardEvent,
  ownerDocument: Document,
): { hasModal: boolean; owner: HTMLDialogElement | null } {
  const ElementConstructor = ownerDocument.defaultView?.Element;
  const eventTarget =
    ElementConstructor && event.target instanceof ElementConstructor ? event.target : null;
  const eventOwner = eventTarget?.closest<HTMLDialogElement>("dialog:modal") ?? null;
  if (eventOwner) return { hasModal: true, owner: eventOwner };

  const activeElement =
    ElementConstructor && ownerDocument.activeElement instanceof ElementConstructor
      ? ownerDocument.activeElement
      : null;
  const focusOwner = activeElement?.closest<HTMLDialogElement>("dialog:modal") ?? null;
  if (focusOwner) return { hasModal: true, owner: focusOwner };

  return {
    hasModal: ownerDocument.querySelector("dialog:modal") !== null,
    owner: null,
  };
}
