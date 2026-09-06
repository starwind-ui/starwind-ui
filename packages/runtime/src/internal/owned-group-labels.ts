export type OwnedGroupLabels = {
  destroy(): void;
  reconcile(records?: MutationRecord[]): void;
  setRoot(root: HTMLElement): void;
};

export type OwnedGroupLabelsOptions = {
  groupSelector: string;
  headingSelector: string;
  ownerSelector: string;
  root: HTMLElement;
};

type ManagedGroup = {
  heading: HTMLElement;
  labelledBy: string;
  ownsHidden: boolean;
  ownsLabelledBy: boolean;
};

let generatedHeadingId = 0;

export function createOwnedGroupLabels(options: OwnedGroupLabelsOptions): OwnedGroupLabels {
  let root = options.root;
  const managedGroups = new Map<HTMLElement, ManagedGroup>();

  function isOwned(element: HTMLElement): boolean {
    return element.closest(options.ownerSelector) === root;
  }

  function release(group: HTMLElement, managed: ManagedGroup): void {
    if (managed.ownsLabelledBy && group.getAttribute("aria-labelledby") === managed.labelledBy) {
      group.removeAttribute("aria-labelledby");
    }
    if (managed.ownsHidden && managed.heading.getAttribute("aria-hidden") === "true") {
      managed.heading.removeAttribute("aria-hidden");
    }
    managedGroups.delete(group);
  }

  function getHeading(group: HTMLElement): HTMLElement | null {
    return (
      Array.from(group.querySelectorAll<HTMLElement>(options.headingSelector)).find(
        (heading) =>
          isOwned(heading) &&
          heading.closest(options.groupSelector) === group &&
          (heading.textContent ?? "").trim().length > 0,
      ) ?? null
    );
  }

  function getHeadingId(heading: HTMLElement): string {
    const authoredId = heading.id.trim();
    if (authoredId) return authoredId;

    const document = heading.ownerDocument;
    let id: string;
    do {
      generatedHeadingId += 1;
      id = `sw-group-heading-${generatedHeadingId}`;
    } while (document.getElementById(id));
    heading.id = id;
    return id;
  }

  function reconcile(records: MutationRecord[] = []): void {
    records.forEach((record) => {
      if (record.type !== "attributes" || !(record.target instanceof HTMLElement)) return;
      if (record.attributeName === "aria-labelledby") {
        const managed = managedGroups.get(record.target);
        if (
          managed?.ownsLabelledBy &&
          record.target.getAttribute("aria-labelledby") === managed.labelledBy
        ) {
          managed.ownsLabelledBy = false;
        }
      }
      if (record.attributeName === "aria-hidden") {
        for (const managed of managedGroups.values()) {
          if (
            managed.heading === record.target &&
            managed.ownsHidden &&
            record.target.getAttribute("aria-hidden") === "true"
          ) {
            managed.ownsHidden = false;
          }
        }
      }
    });

    const groups = Array.from(root.querySelectorAll<HTMLElement>(options.groupSelector)).filter(
      isOwned,
    );
    const currentGroups = new Set(groups);

    for (const [group, managed] of managedGroups) {
      if (!currentGroups.has(group)) release(group, managed);
    }

    groups.forEach((group) => {
      const previous = managedGroups.get(group);
      const labelledBy = group.getAttribute("aria-labelledby")?.trim() ?? "";
      const hasConsumerLabel = (group.getAttribute("aria-label")?.trim() ?? "").length > 0;
      const hasConsumerLabelledBy =
        labelledBy.length > 0 && (!previous?.ownsLabelledBy || labelledBy !== previous.labelledBy);

      if (hasConsumerLabel || hasConsumerLabelledBy) {
        if (previous) release(group, previous);
        return;
      }

      const heading = getHeading(group);
      if (!heading) {
        if (previous) release(group, previous);
        return;
      }

      const headingId = getHeadingId(heading);
      if (previous && previous.heading !== heading) release(group, previous);

      if (group.getAttribute("aria-labelledby") !== headingId) {
        group.setAttribute("aria-labelledby", headingId);
      }
      const hidden = heading.getAttribute("aria-hidden");
      const ownsHidden =
        hidden === null ||
        (hidden === "true" && previous?.heading === heading && previous.ownsHidden);
      if (hidden === null) heading.setAttribute("aria-hidden", "true");
      managedGroups.set(group, {
        heading,
        labelledBy: headingId,
        ownsHidden,
        ownsLabelledBy: true,
      });
    });
  }

  return {
    destroy() {
      for (const [group, managed] of managedGroups) release(group, managed);
    },
    reconcile,
    setRoot(nextRoot) {
      for (const [group, managed] of managedGroups) release(group, managed);
      root = nextRoot;
      reconcile();
    },
  };
}
