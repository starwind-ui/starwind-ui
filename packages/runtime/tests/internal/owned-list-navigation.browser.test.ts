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
});
