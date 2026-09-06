import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createActiveDescendantNavigationAdapter,
  createOwnedListNavigation,
  createRovingFocusNavigationAdapter,
} from "../../src/internal/owned-list-navigation";

describe("owned list navigation", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("keeps roving focus on owned items across mutation and disabled-item navigation", () => {
    const popup = document.createElement("div");
    popup.innerHTML = `
      <button data-item>Alpha</button>
      <button data-item data-disabled>Beta</button>
      <div data-nested><button data-item>Nested</button></div>
    `;
    document.body.append(popup);
    const renderHighlight = (item: HTMLElement, highlighted: boolean) => {
      item.tabIndex = highlighted ? 0 : -1;
      item.toggleAttribute("data-highlighted", highlighted);
    };
    const navigation = createOwnedListNavigation({
      adapter: createRovingFocusNavigationAdapter({ renderHighlight }),
      isNavigable: (item) => !item.hasAttribute("data-disabled"),
      isOwned: (item) => item.closest("[data-nested]") === null,
      itemSelector: "[data-item]",
      root: popup,
    });

    navigation.highlightIndex(0, { focus: true });
    expect(document.activeElement?.textContent).toBe("Alpha");

    const gamma = document.createElement("button");
    gamma.textContent = "Gamma";
    gamma.setAttribute("data-item", "");
    popup.prepend(gamma);
    navigation.highlightRelative(1, { focus: true, force: true });

    expect(document.activeElement?.textContent).toBe("Gamma");
    expect(navigation.activeItem?.textContent).toBe("Gamma");
    navigation.destroy();
  });

  it("keeps DOM focus on the input while active descendant and typeahead reconcile", async () => {
    const input = document.createElement("input");
    const popup = document.createElement("div");
    popup.innerHTML = `
      <div id="alpha" data-item>Alpha</div>
      <div id="beta" data-item hidden>Beta</div>
      <div id="gamma" data-item>Gamma</div>
    `;
    document.body.append(input, popup);
    const onMutation = vi.fn();
    const navigation = createOwnedListNavigation({
      adapter: createActiveDescendantNavigationAdapter({
        input,
        renderHighlight(item, highlighted) {
          item.toggleAttribute("data-highlighted", highlighted);
        },
      }),
      getText: (item) => item.textContent ?? "",
      isNavigable: (item) => !item.hidden,
      itemSelector: "[data-item]",
      mutationMode: "refresh",
      onMutation,
      root: popup,
    });
    navigation.start();
    input.focus();

    navigation.highlightIndex(0);
    navigation.typeahead("g");

    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("aria-activedescendant")).toBe("gamma");
    popup.querySelector("#gamma")?.remove();
    navigation.reconcile({ force: true });
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);

    navigation.highlightIndex(0);
    const mutationCountBeforeDestroy = onMutation.mock.calls.length;
    navigation.destroy();
    expect(popup.querySelector("#alpha")?.hasAttribute("data-highlighted")).toBe(false);
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);

    popup.append(document.createElement("div"));
    await Promise.resolve();
    expect(onMutation).toHaveBeenCalledTimes(mutationCountBeforeDestroy);
  });

  it("reconciles group-only mutations without refreshing a dirty item cache", async () => {
    document.body.innerHTML = `
      <div data-popup>
        <div data-group><div data-heading>Actions</div><button data-item>Edit</button></div>
      </div>
    `;
    const popup = document.querySelector<HTMLElement>("[data-popup]")!;
    const group = popup.querySelector<HTMLElement>("[data-group]")!;
    const heading = popup.querySelector<HTMLElement>("[data-heading]")!;
    const onRefresh = vi.fn();
    const navigation = createOwnedListNavigation({
      adapter: createRovingFocusNavigationAdapter({ renderHighlight: () => undefined }),
      groupLabels: {
        groupSelector: "[data-group]",
        headingSelector: "[data-heading]",
        ownerSelector: "[data-popup]",
      },
      itemSelector: "[data-item]",
      mutationMode: "dirty",
      onRefresh,
      ownerSelector: "[data-popup]",
      root: popup,
    });
    navigation.refresh();
    navigation.start();

    heading.textContent = "Project actions";
    await Promise.resolve();
    await Promise.resolve();

    expect(group).toHaveAccessibleName("Project actions");
    expect(onRefresh).toHaveBeenCalledTimes(1);
    navigation.destroy();
  });

  it("relinquishes ownership when consumers rewrite managed values", async () => {
    const setup = () => {
      const popup = document.createElement("div");
      popup.setAttribute("data-popup", "");
      popup.innerHTML = `<div data-group><div data-heading>Actions</div></div>`;
      document.body.append(popup);
      const navigation = createOwnedListNavigation({
        adapter: createRovingFocusNavigationAdapter({ renderHighlight: () => undefined }),
        groupLabels: {
          groupSelector: "[data-group]",
          headingSelector: "[data-heading]",
          ownerSelector: "[data-popup]",
        },
        itemSelector: "[data-item]",
        root: popup,
      });
      navigation.refresh();
      navigation.start();
      return {
        group: popup.querySelector<HTMLElement>("[data-group]")!,
        heading: popup.querySelector<HTMLElement>("[data-heading]")!,
        navigation,
      };
    };

    const labelled = setup();
    const managedLabelledBy = labelled.group.getAttribute("aria-labelledby")!;
    labelled.group.setAttribute("aria-labelledby", managedLabelledBy);
    await Promise.resolve();
    await Promise.resolve();
    labelled.navigation.destroy();
    expect(labelled.group).toHaveAttribute("aria-labelledby", managedLabelledBy);
    expect(labelled.heading).not.toHaveAttribute("aria-hidden");

    const hidden = setup();
    hidden.heading.setAttribute("aria-hidden", "true");
    await Promise.resolve();
    await Promise.resolve();
    hidden.navigation.destroy();
    expect(hidden.group).not.toHaveAttribute("aria-labelledby");
    expect(hidden.heading).toHaveAttribute("aria-hidden", "true");
  });

  it.each(["destroy", "setRoot", "refresh"] as const)(
    "consumes pending same-value adoption before synchronous %s",
    (boundary) => {
      const setup = () => {
        const popup = document.createElement("div");
        popup.setAttribute("data-popup", "");
        popup.innerHTML = `<div data-group><div data-heading>Actions</div></div>`;
        document.body.append(popup);
        const navigation = createOwnedListNavigation({
          adapter: createRovingFocusNavigationAdapter({ renderHighlight: () => undefined }),
          groupLabels: {
            groupSelector: "[data-group]",
            headingSelector: "[data-heading]",
            ownerSelector: "[data-popup]",
          },
          itemSelector: "[data-item]",
          root: popup,
        });
        navigation.refresh();
        navigation.start();
        return {
          group: popup.querySelector<HTMLElement>("[data-group]")!,
          heading: popup.querySelector<HTMLElement>("[data-heading]")!,
          navigation,
        };
      };
      const crossBoundary = (navigation: ReturnType<typeof createOwnedListNavigation>) => {
        if (boundary === "setRoot") {
          const replacement = document.createElement("div");
          replacement.setAttribute("data-popup", "");
          document.body.append(replacement);
          navigation.setRoot(replacement);
        } else if (boundary === "refresh") {
          navigation.refresh();
        }
        navigation.destroy();
      };

      const labelled = setup();
      const managedLabelledBy = labelled.group.getAttribute("aria-labelledby")!;
      labelled.group.setAttribute("aria-labelledby", managedLabelledBy);
      crossBoundary(labelled.navigation);
      expect(labelled.group).toHaveAttribute("aria-labelledby", managedLabelledBy);

      const hidden = setup();
      hidden.heading.setAttribute("aria-hidden", "true");
      crossBoundary(hidden.navigation);
      expect(hidden.heading).toHaveAttribute("aria-hidden", "true");
    },
  );

  it("tracks live heading order within nested ownership boundaries", async () => {
    document.body.innerHTML = `
      <div data-popup>
        <div data-group id="outer-group">
          <div data-heading id="first-heading">First</div>
          <div data-group id="inner-group"><div data-heading>Inner</div></div>
          <div data-heading id="second-heading">Second</div>
          <div data-popup><div data-group id="nested-popup-group"><div data-heading>Nested popup</div></div></div>
        </div>
      </div>
    `;
    const popup = document.querySelector<HTMLElement>("[data-popup]")!;
    const outer = document.querySelector<HTMLElement>("#outer-group")!;
    const inner = document.querySelector<HTMLElement>("#inner-group")!;
    const nestedPopupGroup = document.querySelector<HTMLElement>("#nested-popup-group")!;
    const first = document.querySelector<HTMLElement>("#first-heading")!;
    const second = document.querySelector<HTMLElement>("#second-heading")!;
    const navigation = createOwnedListNavigation({
      adapter: createRovingFocusNavigationAdapter({ renderHighlight: () => undefined }),
      groupLabels: {
        groupSelector: "[data-group]",
        headingSelector: "[data-heading]",
        ownerSelector: "[data-popup]",
      },
      itemSelector: "[data-item]",
      root: popup,
    });
    navigation.refresh();
    navigation.start();

    expect(outer).toHaveAccessibleName("First");
    expect(inner).toHaveAccessibleName("Inner");
    expect(nestedPopupGroup).not.toHaveAttribute("aria-labelledby");

    const inserted = document.createElement("div");
    inserted.id = "inserted-heading";
    inserted.setAttribute("data-heading", "");
    inserted.textContent = "Inserted";
    outer.prepend(inserted);
    await Promise.resolve();
    await Promise.resolve();
    expect(outer).toHaveAccessibleName("Inserted");
    expect(first).not.toHaveAttribute("aria-hidden");

    inserted.remove();
    first.textContent = "";
    await Promise.resolve();
    await Promise.resolve();
    expect(outer).toHaveAccessibleName("Second");
    expect(second).toHaveAttribute("aria-hidden", "true");

    second.remove();
    await Promise.resolve();
    await Promise.resolve();
    expect(outer).not.toHaveAttribute("aria-labelledby");
    expect(inner).toHaveAccessibleName("Inner");
    navigation.destroy();
  });

  it("disconnects replaced roots and preserves generated IDs across reinitialization", async () => {
    document.body.innerHTML = `
      <div data-popup id="first-popup"><div data-group><div data-heading>First</div></div></div>
      <div data-popup id="second-popup"><div data-group><div data-heading>Second</div></div></div>
    `;
    const firstPopup = document.querySelector<HTMLElement>("#first-popup")!;
    const secondPopup = document.querySelector<HTMLElement>("#second-popup")!;
    const createNavigation = (root: HTMLElement) =>
      createOwnedListNavigation({
        adapter: createRovingFocusNavigationAdapter({ renderHighlight: () => undefined }),
        groupLabels: {
          groupSelector: "[data-group]",
          headingSelector: "[data-heading]",
          ownerSelector: "[data-popup]",
        },
        itemSelector: "[data-item]",
        root,
      });
    const navigation = createNavigation(firstPopup);
    navigation.refresh();
    navigation.start();
    const firstHeading = firstPopup.querySelector<HTMLElement>("[data-heading]")!;
    const firstId = firstHeading.id;

    navigation.setRoot(secondPopup);
    const secondGroup = secondPopup.querySelector<HTMLElement>("[data-group]")!;
    const secondHeading = secondPopup.querySelector<HTMLElement>("[data-heading]")!;
    const secondId = secondHeading.id;
    expect(firstPopup.querySelector("[data-group]")).not.toHaveAttribute("aria-labelledby");
    expect(firstHeading.id).toBe(firstId);
    expect(secondGroup).toHaveAccessibleName("Second");

    firstHeading.textContent = "Changed while disconnected";
    await Promise.resolve();
    await Promise.resolve();
    expect(firstPopup.querySelector("[data-group]")).not.toHaveAttribute("aria-labelledby");

    navigation.destroy();
    const replacement = createNavigation(secondPopup);
    replacement.refresh();
    expect(secondHeading.id).toBe(secondId);
    expect(secondGroup).toHaveAccessibleName("Second");
    replacement.destroy();
  });
});
