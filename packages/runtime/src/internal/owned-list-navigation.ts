export type OwnedListNavigationAdapter = {
  clear(items: HTMLElement[], activeItem: HTMLElement | null): void;
  highlight(item: HTMLElement, previousItem: HTMLElement | null, options: { focus: boolean }): void;
  reconcile(activeItem: HTMLElement | null): void;
};

export type OwnedListNavigation = {
  readonly activeIndex: number;
  readonly activeItem: HTMLElement | null;
  clear(): void;
  destroy(): void;
  getIndex(item: HTMLElement, options?: { force?: boolean }): number;
  getItems(options?: { force?: boolean }): HTMLElement[];
  getNavigableItems(options?: { force?: boolean }): HTMLElement[];
  highlightIndex(
    index: number,
    options?: { direction?: 1 | -1; focus?: boolean; force?: boolean },
  ): HTMLElement | null;
  highlightItem(item: HTMLElement, options?: { focus?: boolean; force?: boolean }): boolean;
  highlightRelative(
    delta: 1 | -1,
    options?: { focus?: boolean; force?: boolean },
  ): HTMLElement | null;
  invalidate(): void;
  reconcile(options?: { force?: boolean }): HTMLElement | null;
  refresh(): HTMLElement[];
  resetTypeahead(): void;
  setRoot(root: HTMLElement): void;
  start(): void;
  stop(): void;
  typeahead(key: string, options?: { focus?: boolean; force?: boolean }): HTMLElement | null;
};

export type OwnedListNavigationOptions = {
  adapter: OwnedListNavigationAdapter;
  attributeFilter?: string[];
  beforeDiscover?: (root: HTMLElement) => void;
  getText?: (item: HTMLElement) => string;
  isHighlighted?: (item: HTMLElement) => boolean;
  isNavigable?: (item: HTMLElement) => boolean;
  isOwned?: (item: HTMLElement) => boolean;
  indexMode?: "all" | "navigable";
  itemSelector: string;
  mutationMode?: "dirty" | "refresh";
  onMutation?: (items: HTMLElement[]) => void;
  onRefresh?: (items: HTMLElement[]) => void;
  ownerSelector?: string;
  root: HTMLElement;
};

export function createRovingFocusNavigationAdapter(options: {
  renderHighlight: (item: HTMLElement, highlighted: boolean) => void;
}): OwnedListNavigationAdapter {
  return {
    clear(items, activeItem) {
      items.forEach((item) => options.renderHighlight(item, false));
      if (activeItem && !items.includes(activeItem)) {
        options.renderHighlight(activeItem, false);
      }
    },
    highlight(item, previousItem, { focus }) {
      if (previousItem !== item) {
        if (previousItem) options.renderHighlight(previousItem, false);
        options.renderHighlight(item, true);
      }
      if (focus && document.activeElement !== item) item.focus();
    },
    reconcile(activeItem) {
      void activeItem;
    },
  };
}

export function createActiveDescendantNavigationAdapter(options: {
  input: HTMLElement;
  renderHighlight: (item: HTMLElement, highlighted: boolean) => void;
}): OwnedListNavigationAdapter {
  return {
    clear(items, activeItem) {
      items.forEach((item) => options.renderHighlight(item, false));
      if (activeItem && !items.includes(activeItem)) {
        options.renderHighlight(activeItem, false);
      }
      options.input.removeAttribute("aria-activedescendant");
    },
    highlight(item, previousItem) {
      if (previousItem !== item) {
        if (previousItem) options.renderHighlight(previousItem, false);
        options.renderHighlight(item, true);
        options.input.setAttribute("aria-activedescendant", item.id);
      }
    },
    reconcile(activeItem) {
      if (activeItem) {
        options.input.setAttribute("aria-activedescendant", activeItem.id);
      } else {
        options.input.removeAttribute("aria-activedescendant");
      }
    },
  };
}

export function createOwnedListNavigation(
  options: OwnedListNavigationOptions,
): OwnedListNavigation {
  let activeItem: HTMLElement | null = null;
  let dirty = true;
  let destroyed = false;
  let indexByItem = new Map<HTMLElement, number>();
  let items: HTMLElement[] = [];
  let navigableItems: HTMLElement[] | null = null;
  let observer: MutationObserver | null = null;
  let root = options.root;
  let typeaheadBuffer = "";
  let typeaheadTimer: number | null = null;

  const isOwned =
    options.isOwned ??
    ((item: HTMLElement) =>
      options.ownerSelector ? item.closest(options.ownerSelector) === root : true);
  const isNavigable = options.isNavigable ?? (() => true);
  const getText = options.getText ?? ((item) => (item.textContent ?? "").trim());

  function discover(): HTMLElement[] {
    options.beforeDiscover?.(root);
    items = Array.from(root.querySelectorAll<HTMLElement>(options.itemSelector)).filter(isOwned);
    indexByItem = new Map(items.map((item, index) => [item, index] as const));
    navigableItems = null;
    dirty = false;
    options.onRefresh?.(items);
    return items;
  }

  function getItems({ force = false }: { force?: boolean } = {}): HTMLElement[] {
    if (observer && observer.takeRecords().length > 0) {
      handleMutation();
    }
    if (force || dirty) return discover();
    return items;
  }

  function getNavigableItems({ force = false }: { force?: boolean } = {}): HTMLElement[] {
    const currentItems = getItems({ force });
    if (force || navigableItems === null) {
      navigableItems = currentItems.filter(isNavigable);
    }
    return navigableItems;
  }

  function reconcile({ force = false }: { force?: boolean } = {}): HTMLElement | null {
    const currentItems = getNavigableItems({ force });
    const candidate =
      activeItem ?? currentItems.find((item) => options.isHighlighted?.(item)) ?? null;
    if (candidate && !currentItems.includes(candidate)) {
      options.adapter.clear([], candidate);
      activeItem = null;
    } else {
      activeItem = candidate;
    }
    options.adapter.reconcile(activeItem);
    return activeItem;
  }

  function highlightItem(
    item: HTMLElement,
    { focus = false, force = false }: { focus?: boolean; force?: boolean } = {},
  ): boolean {
    const currentItems = getNavigableItems({ force });
    if (!currentItems.includes(item)) return false;
    options.adapter.highlight(item, activeItem, { focus });
    activeItem = item;
    return true;
  }

  function highlightIndex(
    index: number,
    {
      direction = 1,
      focus = false,
      force = false,
    }: { direction?: 1 | -1; focus?: boolean; force?: boolean } = {},
  ): HTMLElement | null {
    const currentItems = getItems({ force });
    if (currentItems.length === 0 || currentItems.every((item) => !isNavigable(item))) return null;

    let nextIndex = normalizeIndex(index, currentItems.length);
    for (let offset = 0; offset < currentItems.length; offset += 1) {
      const item = currentItems[nextIndex]!;
      if (isNavigable(item)) {
        highlightItem(item, { focus });
        return item;
      }
      nextIndex = normalizeIndex(nextIndex + direction, currentItems.length);
    }
    return null;
  }

  function highlightRelative(
    delta: 1 | -1,
    { focus = false, force = false }: { focus?: boolean; force?: boolean } = {},
  ): HTMLElement | null {
    const currentItems = getNavigableItems({ force });
    if (currentItems.length === 0) return null;
    const currentIndex = activeItem ? currentItems.indexOf(activeItem) : -1;
    const nextIndex =
      currentIndex < 0 ? (delta > 0 ? 0 : currentItems.length - 1) : currentIndex + delta;
    const item = currentItems[normalizeIndex(nextIndex, currentItems.length)]!;
    highlightItem(item, { focus });
    return item;
  }

  function clear(): void {
    const currentItems = items;
    options.adapter.clear(currentItems, activeItem);
    activeItem = null;
  }

  function typeahead(
    key: string,
    { focus = false, force = false }: { focus?: boolean; force?: boolean } = {},
  ): HTMLElement | null {
    const currentItems = getNavigableItems({ force });
    if (currentItems.length === 0) return null;
    typeaheadBuffer += key.toLocaleLowerCase();
    clearTypeaheadTimer(false);
    typeaheadTimer = window.setTimeout(() => {
      typeaheadTimer = null;
      typeaheadBuffer = "";
    }, 500);
    const characters = [...typeaheadBuffer];
    const search = characters.every((character) => character === characters[0])
      ? characters[0]!
      : typeaheadBuffer;
    const currentIndex = activeItem ? currentItems.indexOf(activeItem) : -1;
    const startIndex = Math.max(0, currentIndex + 1);
    const orderedItems = [...currentItems.slice(startIndex), ...currentItems.slice(0, startIndex)];
    const match = orderedItems.find((item) => getText(item).toLocaleLowerCase().startsWith(search));
    if (!match) return null;
    highlightItem(match, { focus });
    return match;
  }

  function clearTypeaheadTimer(resetBuffer = true): void {
    if (typeaheadTimer !== null) window.clearTimeout(typeaheadTimer);
    typeaheadTimer = null;
    if (resetBuffer) typeaheadBuffer = "";
  }

  function handleMutation(): void {
    if (destroyed) return;
    dirty = true;
    navigableItems = null;
    if (options.mutationMode === "refresh") {
      const nextItems = discover();
      reconcile();
      options.onMutation?.(nextItems);
    }
  }

  function start(): void {
    if (destroyed || observer || typeof MutationObserver === "undefined") return;
    observer = new MutationObserver(handleMutation);
    observer.observe(root, {
      attributeFilter:
        options.attributeFilter && options.attributeFilter.length > 0
          ? options.attributeFilter
          : undefined,
      attributes: Boolean(options.attributeFilter?.length),
      childList: true,
      subtree: true,
    });
  }

  function stop(): void {
    observer?.disconnect();
    observer = null;
    dirty = true;
    navigableItems = null;
  }

  return {
    get activeIndex() {
      if (!activeItem) return -1;
      return options.indexMode === "all"
        ? getItems().indexOf(activeItem)
        : getNavigableItems().indexOf(activeItem);
    },
    get activeItem() {
      return activeItem;
    },
    clear,
    destroy() {
      if (destroyed) return;
      stop();
      clearTypeaheadTimer();
      clear();
      indexByItem.clear();
      items = [];
      navigableItems = null;
      destroyed = true;
    },
    getIndex(item, { force = false } = {}) {
      getItems({ force });
      return indexByItem.get(item) ?? -1;
    },
    getItems,
    getNavigableItems,
    highlightIndex,
    highlightItem,
    highlightRelative,
    invalidate() {
      dirty = true;
      navigableItems = null;
    },
    reconcile,
    refresh() {
      return discover();
    },
    resetTypeahead: clearTypeaheadTimer,
    setRoot(nextRoot) {
      const wasStarted = observer !== null;
      stop();
      root = nextRoot;
      if (wasStarted) start();
    },
    start,
    stop,
    typeahead,
  };
}

function normalizeIndex(index: number, length: number): number {
  return ((index % length) + length) % length;
}
