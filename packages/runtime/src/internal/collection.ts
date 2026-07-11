export type DynamicCollectionObserver = {
  disconnect(): void;
  flush(): void;
};

export type DynamicCollectionObserverOptions = {
  attributeFilter?: string[];
  onChange: (mutations: MutationRecord[]) => void;
  root: HTMLElement;
};

const noopObserver: DynamicCollectionObserver = {
  disconnect() {},
  flush() {},
};

export function observeDynamicCollection({
  attributeFilter = [],
  onChange,
  root,
}: DynamicCollectionObserverOptions): DynamicCollectionObserver {
  if (typeof MutationObserver === "undefined") return noopObserver;

  let disconnected = false;
  const observer = new MutationObserver((mutations) => {
    if (disconnected) return;
    onChange(mutations);
  });

  observer.observe(root, {
    attributeFilter: attributeFilter.length > 0 ? attributeFilter : undefined,
    attributes: attributeFilter.length > 0,
    childList: true,
    subtree: true,
  });

  return {
    disconnect() {
      if (disconnected) return;

      disconnected = true;
      observer.disconnect();
    },
    flush() {
      observer.takeRecords();
    },
  };
}
