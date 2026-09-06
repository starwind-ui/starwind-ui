import { beforeEach, describe, expect, it } from "vitest";

import { createOwnedGroupLabels } from "../../src/internal/owned-group-labels";

describe("owned group labels", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("connects each owned group to its first non-empty heading", () => {
    const popup = document.createElement("div");
    popup.setAttribute("data-popup", "");
    popup.innerHTML = `
      <div data-group>
        <div data-heading> </div>
        <div data-heading id="fruit-heading">Fruit</div>
        <div data-heading>Extra information</div>
      </div>
      <div data-popup>
        <div data-group><div data-heading>Nested popup heading</div></div>
      </div>
    `;
    document.body.append(popup);

    const labels = createOwnedGroupLabels({
      groupSelector: "[data-group]",
      headingSelector: "[data-heading]",
      ownerSelector: "[data-popup]",
      root: popup,
    });

    labels.reconcile();

    const group = popup.querySelector<HTMLElement>("[data-group]")!;
    const headings = group.querySelectorAll<HTMLElement>("[data-heading]");
    expect(group).toHaveAttribute("aria-labelledby", "fruit-heading");
    expect(headings[0]).not.toHaveAttribute("aria-hidden");
    expect(headings[1]).toHaveAttribute("aria-hidden", "true");
    expect(headings[2]).not.toHaveAttribute("aria-hidden");
    expect(popup.querySelectorAll("[data-group]")[1]).not.toHaveAttribute("aria-labelledby");
  });

  it("preserves consumer names and explicit heading visibility", () => {
    document.body.innerHTML = `
      <div data-popup>
        <div data-group aria-label="Authored name"><div data-heading>First</div></div>
        <div data-group aria-labelledby="authored-heading">
          <div data-heading id="authored-heading">Second</div>
        </div>
        <div data-group><div data-heading aria-hidden="false">Third</div></div>
      </div>
    `;
    const popup = document.querySelector<HTMLElement>("[data-popup]")!;
    const labels = createOwnedGroupLabels({
      groupSelector: "[data-group]",
      headingSelector: "[data-heading]",
      ownerSelector: "[data-popup]",
      root: popup,
    });

    labels.reconcile();

    const groups = popup.querySelectorAll<HTMLElement>("[data-group]");
    expect(groups[0]).not.toHaveAttribute("aria-labelledby");
    expect(groups[1]).toHaveAttribute("aria-labelledby", "authored-heading");
    expect(groups[2]).toHaveAccessibleName("Third");
    expect(groups[2].querySelector("[data-heading]")).toHaveAttribute("aria-hidden", "false");
  });

  it("updates managed references and restores only attributes it still owns", () => {
    document.body.innerHTML = `
      <div data-popup>
        <div data-group>
          <div data-heading>First</div>
          <div data-heading id="second-heading">Second</div>
        </div>
      </div>
    `;
    const popup = document.querySelector<HTMLElement>("[data-popup]")!;
    const group = popup.querySelector<HTMLElement>("[data-group]")!;
    const headings = group.querySelectorAll<HTMLElement>("[data-heading]");
    const labels = createOwnedGroupLabels({
      groupSelector: "[data-group]",
      headingSelector: "[data-heading]",
      ownerSelector: "[data-popup]",
      root: popup,
    });

    labels.reconcile();
    const generatedId = headings[0].id;
    expect(generatedId).toMatch(/^sw-group-heading-/);

    headings[0].textContent = "";
    labels.reconcile();
    expect(group).toHaveAttribute("aria-labelledby", "second-heading");
    expect(headings[0]).not.toHaveAttribute("aria-hidden");

    headings[1].id = "updated-heading";
    labels.reconcile();
    expect(group).toHaveAttribute("aria-labelledby", "updated-heading");

    group.setAttribute("aria-labelledby", "consumer-heading");
    headings[1].setAttribute("aria-hidden", "false");
    labels.reconcile();
    labels.destroy();

    expect(group).toHaveAttribute("aria-labelledby", "consumer-heading");
    expect(headings[1]).toHaveAttribute("aria-hidden", "false");
    expect(headings[0]).toHaveAttribute("id", generatedId);
  });

  it("starts automatic naming after a consumer removes an authored name", () => {
    document.body.innerHTML = `
      <div data-popup><div data-group aria-label="Consumer"><div data-heading>Automatic</div></div></div>
    `;
    const popup = document.querySelector<HTMLElement>("[data-popup]")!;
    const group = popup.querySelector<HTMLElement>("[data-group]")!;
    const labels = createOwnedGroupLabels({
      groupSelector: "[data-group]",
      headingSelector: "[data-heading]",
      ownerSelector: "[data-popup]",
      root: popup,
    });
    labels.reconcile();
    group.removeAttribute("aria-label");
    labels.reconcile();

    expect(group).toHaveAccessibleName("Automatic");
    labels.destroy();
  });

  it("reuses generated heading IDs across initialization and avoids document collisions", () => {
    document.body.innerHTML = `
      <div data-popup><div data-group><div data-heading>First</div></div></div>
      <div data-popup><div data-group><div data-heading>Second</div></div></div>
    `;
    const popups = document.querySelectorAll<HTMLElement>("[data-popup]");
    const createLabels = (root: HTMLElement) =>
      createOwnedGroupLabels({
        groupSelector: "[data-group]",
        headingSelector: "[data-heading]",
        ownerSelector: "[data-popup]",
        root,
      });
    const first = createLabels(popups[0]!);
    const second = createLabels(popups[1]!);
    first.reconcile();
    second.reconcile();
    const headings = document.querySelectorAll<HTMLElement>("[data-heading]");
    const firstId = headings[0].id;

    expect(headings[1].id).not.toBe(firstId);
    first.destroy();
    const replacement = createLabels(popups[0]!);
    replacement.reconcile();
    expect(headings[0].id).toBe(firstId);
    expect(popups[0].querySelector("[data-group]")).toHaveAttribute("aria-labelledby", firstId);

    replacement.destroy();
    second.destroy();
  });
});
