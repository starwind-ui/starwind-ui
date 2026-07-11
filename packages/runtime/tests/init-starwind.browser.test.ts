import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initStarwind } from "../src/init-starwind";

type TrackedCleanup = ReturnType<typeof initStarwind>;

const activeCleanups: TrackedCleanup[] = [];

function initStarwindForTest(...args: Parameters<typeof initStarwind>): TrackedCleanup {
  const cleanup = initStarwind(...args);
  let destroyed = false;
  const trackedCleanup = {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cleanup.destroy();
    },
  };

  activeCleanups.push(trackedCleanup);
  return trackedCleanup;
}

describe("initStarwind", () => {
  afterEach(() => {
    activeCleanups.splice(0).forEach((cleanup) => cleanup.destroy());
  });

  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.style.overflow = "";
    document.documentElement.className = "";
    localStorage.clear();
  });

  it("initializes accordions under the provided root", () => {
    document.body.innerHTML = `
      <section id="target">
        <div data-sw-accordion>
          <div data-sw-accordion-item data-value="one">
            <button data-sw-accordion-trigger>One</button>
            <div data-sw-accordion-content>One content</div>
          </div>
        </div>
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);
    document.querySelector<HTMLButtonElement>("[data-sw-accordion-trigger]")!.click();

    expect(document.querySelector<HTMLElement>("[data-sw-accordion-content]")!.hidden).toBe(false);
  });

  it("initializes buttons under the provided root", () => {
    document.body.innerHTML = `
      <section id="target">
        <button data-sw-button>Save</button>
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);

    expect(document.querySelector<HTMLButtonElement>("[data-sw-button]")!.type).toBe("button");
  });

  it("scans the provided root once for initializer candidates", () => {
    document.body.innerHTML = `
      <section id="target">
        <button data-sw-button>Save</button>
        <button data-sw-toggle>Bold</button>
      </section>
      <button id="outside" data-sw-button>Outside</button>
    `;
    const target = document.querySelector<HTMLElement>("#target")!;
    const querySelectorAll = vi.spyOn(target, "querySelectorAll");

    initStarwindForTest(target);

    expect(querySelectorAll).toHaveBeenCalledTimes(1);
    expect(String(querySelectorAll.mock.calls[0]?.[0])).toContain("[data-sw-button]");
    expect(String(querySelectorAll.mock.calls[0]?.[0])).toContain("[data-sw-toggle]");
    expect(target.querySelector<HTMLButtonElement>("[data-sw-button]")!.type).toBe("button");
    expect(document.querySelector<HTMLButtonElement>("#outside")!.type).toBe("submit");
  });

  it("preserves querySelectorAll root-element exclusion behavior", () => {
    document.body.innerHTML = `
      <button id="target" data-sw-button>Save</button>
    `;

    initStarwindForTest(document.querySelector("#target")!);

    expect(document.querySelector<HTMLButtonElement>("#target")!.type).toBe("submit");
  });

  it("initializes inputs under the provided root", () => {
    document.body.innerHTML = `
      <section id="target">
        <input data-sw-input value="Ada" />
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);

    const input = document.querySelector<HTMLInputElement>("[data-sw-input]")!;
    expect(input.hasAttribute("data-filled")).toBe(true);

    input.value = "";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));

    expect(input.hasAttribute("data-filled")).toBe(false);
    expect(input.hasAttribute("data-dirty")).toBe(true);
  });

  it("initializes fields before their owned controls", async () => {
    document.body.innerHTML = `
      <section id="target">
        <div data-sw-field data-name="displayName">
          <label data-sw-field-label>Display name</label>
          <input data-sw-field-control data-sw-input required value="" />
          <p data-sw-field-description>Shown in shared spaces.</p>
          <div data-sw-field-error data-match="valueMissing">Enter a display name.</div>
        </div>
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const label = document.querySelector<HTMLLabelElement>("[data-sw-field-label]")!;
    const description = document.querySelector<HTMLElement>("[data-sw-field-description]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;

    expect(input.name).toBe("displayName");
    expect(label.htmlFor).toBe(input.id);
    expect(input.getAttribute("aria-describedby")?.split(/\s+/)).toEqual(
      expect.arrayContaining([description.id, error.id]),
    );
    expect(field.hasAttribute("data-invalid")).toBe(true);

    input.value = "Ada";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(field.hasAttribute("data-valid")).toBe(true);
    expect(field.hasAttribute("data-dirty")).toBe(true);
  });

  it("initializes field-owned rich controls through the shared raw HTML initializer", () => {
    document.body.innerHTML = `
      <section id="target">
        <form>
          <div data-sw-field data-name="theme">
            <div data-sw-select data-default-value="dark" data-required>
              <button data-sw-select-trigger type="button">
                <span data-sw-select-value data-placeholder="Pick theme"></span>
              </button>
              <input data-sw-select-input type="hidden" />
              <div data-sw-select-positioner data-side="bottom" data-align="start">
                <div data-sw-select-popup hidden>
                  <div data-sw-select-list>
                    <div data-sw-select-item data-value="light">
                      <span data-sw-select-item-text>Light</span>
                    </div>
                    <div data-sw-select-item data-value="dark">
                      <span data-sw-select-item-text>Dark</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div data-sw-field data-name="country">
            <div data-sw-combobox data-default-value="ca" data-required>
              <div data-sw-combobox-input-group>
                <input data-sw-combobox-input />
                <button data-sw-combobox-trigger type="button">Open</button>
              </div>
              <input data-sw-combobox-hidden-input type="hidden" />
              <div data-sw-combobox-positioner data-side="bottom" data-align="start">
                <div data-sw-combobox-popup hidden>
                  <div data-sw-combobox-list>
                    <div data-sw-combobox-item data-value="us">
                      <span data-sw-combobox-item-text>United States</span>
                    </div>
                    <div data-sw-combobox-item data-value="ca">
                      <span data-sw-combobox-item-text>Canada</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div data-sw-field data-name="volume">
            <div data-sw-slider data-default-value="25">
              <div data-sw-slider-control>
                <div data-sw-slider-track>
                  <div data-sw-slider-indicator></div>
                </div>
                <div data-sw-slider-thumb>
                  <input data-sw-slider-input />
                </div>
              </div>
            </div>
          </div>
        </form>
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);

    const form = document.querySelector<HTMLFormElement>("form")!;
    const select = document.querySelector<HTMLElement>("[data-sw-select]")!;
    const combobox = document.querySelector<HTMLElement>("[data-sw-combobox]")!;
    const slider = document.querySelector<HTMLElement>("[data-sw-slider]")!;
    const selectInput = select.querySelector<HTMLInputElement>("[data-sw-select-input]")!;
    const comboboxInput = combobox.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!;
    const comboboxHiddenInput = combobox.querySelector<HTMLInputElement>(
      "[data-sw-combobox-hidden-input]",
    )!;
    const sliderInput = slider.querySelector<HTMLInputElement>("[data-sw-slider-input]")!;

    expect(selectInput.name).toBe("theme");
    expect(selectInput.value).toBe("dark");
    expect(selectInput.required).toBe(true);
    expect(comboboxHiddenInput.name).toBe("country");
    expect(comboboxHiddenInput.value).toBe("ca");
    expect(comboboxHiddenInput.required).toBe(true);
    expect(comboboxInput.value).toBe("Canada");
    expect(sliderInput.name).toBe("volume");
    expect(slider.getAttribute("data-value")).toBe("0");
    expect(sliderInput.value).toBe("0");
    expect(Object.fromEntries(new FormData(form).entries())).toEqual({
      country: "ca",
      theme: "dark",
      volume: "0",
    });
  });

  it("initializes input OTPs under the provided root", () => {
    document.body.innerHTML = `
      <section id="target">
        <div data-sw-input-otp data-default-value="12" data-max-length="4">
          <input data-sw-input-otp-input name="code" value="12" />
          <div data-sw-input-otp-group>
            <div data-sw-input-otp-slot><span data-sw-input-otp-char></span><div data-sw-input-otp-caret hidden></div></div>
            <div data-sw-input-otp-slot><span data-sw-input-otp-char></span><div data-sw-input-otp-caret hidden></div></div>
            <div data-sw-input-otp-slot><span data-sw-input-otp-char></span><div data-sw-input-otp-caret hidden></div></div>
            <div data-sw-input-otp-slot><span data-sw-input-otp-char></span><div data-sw-input-otp-caret hidden></div></div>
          </div>
        </div>
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);

    const root = document.querySelector<HTMLElement>("[data-sw-input-otp]")!;
    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "3" }));

    expect(root.getAttribute("data-value")).toBe("123");
    expect(
      Array.from(document.querySelectorAll("[data-sw-input-otp-char]")).map(
        (element) => element.textContent,
      ),
    ).toEqual(["1", "2", "3", ""]);
  });

  it("initializes switches under the provided root", () => {
    document.body.innerHTML = `
      <section id="target">
        <span data-sw-switch data-name="notifications">
          <span data-sw-switch-thumb></span>
        </span>
        <input data-sw-switch-input />
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);
    document.querySelector<HTMLElement>("[data-sw-switch]")!.click();

    const switchRoot = document.querySelector<HTMLElement>("[data-sw-switch]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-switch-input]")!;
    expect(switchRoot.getAttribute("aria-checked")).toBe("true");
    expect(input.checked).toBe(true);
  });

  it("initializes radio groups before their child radios", () => {
    document.body.innerHTML = `
      <section id="target">
        <div data-sw-radio-group data-default-value="ssd" data-name="storage">
          <span data-sw-radio data-value="ssd">
            <span data-sw-radio-indicator data-keep-mounted></span>
            <input data-sw-radio-input />
          </span>
          <span data-sw-radio data-value="hdd">
            <span data-sw-radio-indicator data-keep-mounted></span>
            <input data-sw-radio-input />
          </span>
        </div>
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);

    const group = document.querySelector<HTMLElement>("[data-sw-radio-group]")!;
    const ssd = document.querySelector<HTMLElement>('[data-sw-radio][data-value="ssd"]')!;
    const hdd = document.querySelector<HTMLElement>('[data-sw-radio][data-value="hdd"]')!;

    hdd.click();

    expect(group.getAttribute("data-value")).toBe("hdd");
    expect(ssd.getAttribute("aria-checked")).toBe("false");
    expect(hdd.getAttribute("aria-checked")).toBe("true");
  });

  it("initializes toggles under the provided root", () => {
    document.body.innerHTML = `
      <section id="target">
        <button data-sw-toggle>Bold</button>
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);
    document.querySelector<HTMLButtonElement>("[data-sw-toggle]")!.click();

    const toggleRoot = document.querySelector<HTMLButtonElement>("[data-sw-toggle]")!;
    expect(toggleRoot.getAttribute("aria-pressed")).toBe("true");
    expect(toggleRoot.getAttribute("data-state")).toBe("on");
  });

  it("initializes theme toggles before regular toggle state is read", () => {
    localStorage.setItem("colorTheme", "dark");
    document.body.innerHTML = `
      <section id="target">
        <button data-sw-theme-toggle data-sw-toggle aria-pressed="false" data-state="off">
          Theme
        </button>
      </section>
    `;

    const cleanup = initStarwindForTest(document.querySelector("#target")!);
    const toggleRoot = document.querySelector<HTMLButtonElement>("[data-sw-theme-toggle]")!;
    const onToggleChange = vi.fn();
    toggleRoot.addEventListener("starwind-toggle:change", onToggleChange);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(toggleRoot.getAttribute("aria-pressed")).toBe("true");
    expect(toggleRoot.getAttribute("data-state")).toBe("on");

    toggleRoot.click();

    expect(localStorage.getItem("colorTheme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(toggleRoot.getAttribute("aria-pressed")).toBe("false");
    expect(toggleRoot.getAttribute("data-state")).toBe("off");
    expect(onToggleChange).toHaveBeenCalledTimes(1);
    expect(onToggleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ pressed: false }),
      }),
    );

    cleanup.destroy();
    toggleRoot.removeEventListener("starwind-toggle:change", onToggleChange);
    localStorage.clear();
  });

  it("cleanup destroys initialized toggles", () => {
    document.body.innerHTML = `
      <button data-sw-toggle>Bold</button>
    `;

    const toggle = document.querySelector<HTMLButtonElement>("[data-sw-toggle]")!;
    const cleanup = initStarwindForTest();

    toggle.click();
    expect(toggle.getAttribute("aria-pressed")).toBe("true");

    cleanup.destroy();
    toggle.click();

    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });

  it("initializes toggle groups before their child toggles", () => {
    document.body.innerHTML = `
      <section id="target">
        <div data-sw-toggle-group data-default-value='["bold"]'>
          <button data-sw-toggle data-value="bold">Bold</button>
          <button data-sw-toggle data-value="italic">Italic</button>
        </div>
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);

    const group = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const bold = document.querySelector<HTMLButtonElement>('[data-value="bold"]')!;
    const italic = document.querySelector<HTMLButtonElement>('[data-value="italic"]')!;

    italic.click();

    expect(group.getAttribute("data-value")).toBe('["italic"]');
    expect(bold.getAttribute("aria-pressed")).toBe("false");
    expect(italic.getAttribute("aria-pressed")).toBe("true");
  });

  it("cleanup destroys initialized toggle groups", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group data-default-value='["bold"]'>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
      </div>
    `;

    const cleanup = initStarwindForTest();
    cleanup.destroy();

    document
      .querySelector<HTMLButtonElement>('[data-value="italic"]')!
      .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(
      document.querySelector<HTMLElement>("[data-sw-toggle-group]")!.getAttribute("data-value"),
    ).toBe('["bold"]');
  });

  it("cleanup destroys initialized buttons", () => {
    document.body.innerHTML = `
      <div data-sw-button data-native="false">Open</div>
    `;

    const button = document.querySelector<HTMLElement>("[data-sw-button]")!;
    const onClick = vi.fn();
    const cleanup = initStarwindForTest();
    button.addEventListener("click", onClick);

    button.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    expect(onClick).toHaveBeenCalledTimes(1);

    cleanup.destroy();
    button.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("initializes menus under the provided root", () => {
    document.body.innerHTML = `
      <section id="target">
        <div data-sw-menu>
          <button data-sw-menu-trigger>Open menu</button>
          <div data-sw-menu-popup>
            <div data-sw-menu-item>Account</div>
          </div>
        </div>
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);
    document.querySelector<HTMLButtonElement>("[data-sw-menu-trigger]")!.click();

    expect(document.querySelector<HTMLElement>("[data-sw-menu-popup]")!.hidden).toBe(false);
  });

  it("initializes tooltips under the provided root", () => {
    document.body.innerHTML = `
      <section id="target">
        <div data-sw-tooltip data-open-delay="0">
          <button data-sw-tooltip-trigger>Show tip</button>
          <div data-sw-tooltip-popup>Tip content</div>
        </div>
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);
    document
      .querySelector<HTMLButtonElement>("[data-sw-tooltip-trigger]")!
      .dispatchEvent(new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }));

    expect(document.querySelector<HTMLElement>("[data-sw-tooltip-popup]")!.hidden).toBe(false);
  });

  it("initializes progress bars under the provided root", async () => {
    document.body.innerHTML = `
      <section id="target">
        <div data-sw-progress data-value="25">
          <div data-sw-progress-track>
            <div data-sw-progress-indicator></div>
          </div>
        </div>
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);

    const root = document.querySelector<HTMLElement>("[data-sw-progress]")!;
    const indicator = document.querySelector<HTMLElement>("[data-sw-progress-indicator]")!;
    expect(root).toHaveAttribute("aria-valuenow", "25");
    expect(indicator.style.transform).toBe("translateX(-75%)");

    root.setAttribute("data-value", "60");
    await waitForMicrotasks();

    expect(root).toHaveAttribute("aria-valuenow", "60");
    expect(indicator.style.transform).toBe("translateX(-40%)");
  });

  it("initializes scroll areas under the provided root", async () => {
    document.body.innerHTML = `
      <section id="target">
        <div data-sw-scroll-area style="height: 100px; position: relative; width: 160px;">
          <div data-sw-scroll-area-viewport style="height: 100px; overflow: scroll; width: 160px;">
            <div data-sw-scroll-area-content style="height: 320px; width: 120px;">Scrollable content</div>
          </div>
          <div data-sw-scroll-area-scrollbar data-orientation="vertical" style="height: 100px; position: absolute; right: 0; top: 0; width: 10px;">
            <div data-sw-scroll-area-thumb></div>
          </div>
        </div>
      </section>
    `;

    const cleanup = initStarwindForTest(document.querySelector("#target")!);
    await waitForFloatingPosition();

    const root = document.querySelector<HTMLElement>("[data-sw-scroll-area]")!;
    const viewport = document.querySelector<HTMLElement>("[data-sw-scroll-area-viewport]")!;
    const scrollbar = document.querySelector<HTMLElement>("[data-sw-scroll-area-scrollbar]")!;

    expect(viewport.tabIndex).toBe(0);
    expect(scrollbar.style.display).toBe("flex");
    expect(root.hasAttribute("data-overflow-y-end")).toBe(true);

    cleanup.destroy();
    const afterDestroy = viewport.scrollTop;
    scrollbar.dispatchEvent(
      new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 40 }),
    );

    expect(viewport.scrollTop).toBe(afterDestroy);
  });

  it("initializes selects under the provided root", async () => {
    document.body.innerHTML = `
      <section id="target">
        <div data-sw-select data-default-value="system" data-name="theme">
          <button data-sw-select-trigger>
            <span data-sw-select-value data-placeholder="Pick theme"></span>
          </button>
          <input data-sw-select-input type="hidden" />
          <div data-sw-select-positioner data-side="bottom" data-align="start">
            <div data-sw-select-popup hidden>
              <div data-sw-select-list>
                <div data-sw-select-item data-value="light"><span data-sw-select-item-text>Light</span></div>
                <div data-sw-select-item data-value="system"><span data-sw-select-item-text>System</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);

    expect(document.querySelector<HTMLElement>("[data-sw-select-value]")!.textContent).toBe(
      "System",
    );

    document.querySelector<HTMLButtonElement>("[data-sw-select-trigger]")!.click();
    await waitForFloatingPosition();
    document.querySelector<HTMLElement>('[data-sw-select-item][data-value="light"]')!.click();

    expect(
      document.querySelector<HTMLElement>("[data-sw-select]")!.getAttribute("data-value"),
    ).toBe("light");
    expect(document.querySelector<HTMLInputElement>("[data-sw-select-input]")!.value).toBe("light");
  });

  it("initializes comboboxes under the provided root", async () => {
    document.body.innerHTML = `
      <section id="target">
        <div data-sw-combobox data-default-value="banana" data-name="fruit">
          <div data-sw-combobox-input-group>
            <input data-sw-combobox-input placeholder="Pick fruit" />
            <button data-sw-combobox-trigger type="button">Open</button>
            <button data-sw-combobox-clear type="button">Clear</button>
          </div>
          <input data-sw-combobox-hidden-input type="hidden" />
          <div data-sw-combobox-positioner data-side="bottom" data-align="start">
            <div data-sw-combobox-popup hidden>
              <div data-sw-combobox-empty hidden>No fruit found.</div>
              <div data-sw-combobox-list>
                <div data-sw-combobox-item data-value="apple"><span data-sw-combobox-item-text>Apple</span></div>
                <div data-sw-combobox-item data-value="banana"><span data-sw-combobox-item-text>Banana</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);

    expect(document.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!.value).toBe(
      "Banana",
    );

    document.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!.value = "app";
    document
      .querySelector<HTMLInputElement>("[data-sw-combobox-input]")!
      .dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForFloatingPosition();
    document.querySelector<HTMLElement>('[data-sw-combobox-item][data-value="apple"]')!.click();

    expect(
      document.querySelector<HTMLElement>("[data-sw-combobox]")!.getAttribute("data-value"),
    ).toBe("apple");
    expect(document.querySelector<HTMLInputElement>("[data-sw-combobox-hidden-input]")!.value).toBe(
      "apple",
    );
  });

  it("initializes toast viewports under the provided root", () => {
    document.body.innerHTML = `
      <section id="target">
        <div data-sw-toast-viewport data-duration="0">
          <template data-sw-toast-template="default">
            <div data-sw-toast-root data-slot="toast" data-state="open">
              <div data-sw-toast-content data-slot="toast-content">
                <div data-sw-toast-title data-slot="toast-title">
                  <span data-sw-toast-title-text>Title</span>
                </div>
                <div data-sw-toast-description data-slot="toast-description">Description</div>
                <button data-sw-toast-action data-slot="toast-action" type="button">Action</button>
              </div>
              <button data-sw-toast-close data-slot="toast-close" type="button">Close</button>
            </div>
          </template>
        </div>
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);
    const manager = window.__starwindRuntime__?.toast;
    const id = manager?.add({ description: "World", duration: 0, title: "Hello" });

    expect(id).toBe("toast-1");
    expect(
      document.querySelector<HTMLElement>(`[data-toast-id="${id}"] [data-sw-toast-title-text]`)
        ?.textContent,
    ).toBe("Hello");
    expect(
      document.querySelector<HTMLElement>(`[data-toast-id="${id}"] [data-sw-toast-description]`)
        ?.textContent,
    ).toBe("World");
  });

  it("initializes context menus without also binding regular menu trigger events", async () => {
    document.body.innerHTML = `
      <section id="target">
        <div data-sw-context-menu data-sw-menu>
          <div data-sw-context-menu-trigger data-sw-menu-trigger>Right click area</div>
          <div data-sw-menu-popup>
            <div data-sw-menu-item>Account</div>
          </div>
        </div>
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);

    document.querySelector<HTMLElement>("[data-sw-context-menu-trigger]")!.click();
    expect(document.querySelector<HTMLElement>("[data-sw-menu-popup]")!.hidden).toBe(true);

    document.querySelector<HTMLElement>("[data-sw-context-menu-trigger]")!.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: 80,
        clientY: 90,
      }),
    );
    await waitForFloatingPosition();

    expect(document.querySelector<HTMLElement>("[data-sw-menu-popup]")!.hidden).toBe(false);
  });

  it("does not initialize carousels with auto init disabled", () => {
    document.body.innerHTML = `
      <section id="target">
        <div data-sw-carousel data-auto-init="false">
          <div data-sw-carousel-viewport>
            <div data-sw-carousel-container>
              <div data-sw-carousel-item>One</div>
            </div>
          </div>
        </div>
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);

    expect(document.querySelector<HTMLElement>("[data-sw-carousel]")!.getAttribute("role")).toBe(
      null,
    );
  });

  it("returns a cleanup handle", () => {
    document.body.innerHTML = `
      <div data-sw-accordion>
        <div data-sw-accordion-item data-value="one">
          <button data-sw-accordion-trigger>One</button>
          <div data-sw-accordion-content>One content</div>
        </div>
      </div>
    `;

    const cleanup = initStarwindForTest();
    cleanup.destroy();

    document.querySelector<HTMLButtonElement>("[data-sw-accordion-trigger]")!.click();

    expect(document.querySelector<HTMLElement>("[data-sw-accordion-content]")!.hidden).toBe(true);
  });

  it("initializes collapsibles under the provided root", () => {
    document.body.innerHTML = `
      <section id="target">
        <div data-sw-collapsible>
          <button data-sw-collapsible-trigger>Toggle details</button>
          <div data-sw-collapsible-panel>Details</div>
        </div>
      </section>
    `;

    initStarwindForTest(document.querySelector("#target")!);
    expect(document.querySelector<HTMLElement>("[data-sw-collapsible-panel]")!.hidden).toBe(true);

    document.querySelector<HTMLButtonElement>("[data-sw-collapsible-trigger]")!.click();

    expect(document.querySelector<HTMLElement>("[data-sw-collapsible-panel]")!.hidden).toBe(false);
  });

  it("cleanup destroys initialized collapsibles", () => {
    document.body.innerHTML = `
      <div data-sw-collapsible>
        <button data-sw-collapsible-trigger>Toggle details</button>
        <div data-sw-collapsible-panel>Details</div>
      </div>
    `;

    const cleanup = initStarwindForTest();
    cleanup.destroy();

    document.querySelector<HTMLButtonElement>("[data-sw-collapsible-trigger]")!.click();

    expect(document.querySelector<HTMLElement>("[data-sw-collapsible-panel]")!.hidden).toBe(true);
  });

  it("initializes dialogs under the provided root", () => {
    document.body.innerHTML = `
      <section id="target">
        <div data-sw-dialog>
          <button data-sw-dialog-trigger>Open dialog</button>
          <div data-sw-dialog-overlay hidden></div>
          <dialog data-sw-dialog-content>
            <h2 data-sw-dialog-title>Title</h2>
            <button data-sw-dialog-close>Close</button>
          </dialog>
        </div>
      </section>
    `;

    const cleanup = initStarwindForTest(document.querySelector("#target")!);
    document.querySelector<HTMLButtonElement>("[data-sw-dialog-trigger]")!.click();

    expect(document.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!.open).toBe(true);

    cleanup.destroy();
  });

  it("cleanup destroys initialized dialogs and restores body scroll", () => {
    document.body.innerHTML = `
      <div data-sw-dialog>
        <button data-sw-dialog-trigger>Open dialog</button>
        <div data-sw-dialog-overlay hidden></div>
        <dialog data-sw-dialog-content>
          <h2 data-sw-dialog-title>Title</h2>
          <button data-sw-dialog-close>Close</button>
        </dialog>
      </div>
    `;

    const cleanup = initStarwindForTest();
    document.querySelector<HTMLButtonElement>("[data-sw-dialog-trigger]")!.click();

    expect(document.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!.open).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    cleanup.destroy();
    document.querySelector<HTMLButtonElement>("[data-sw-dialog-trigger]")!.click();

    expect(document.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!.open).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });
});

async function waitForMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

async function waitForMacrotask(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function waitForFloatingPosition(): Promise<void> {
  await waitForMicrotasks();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await waitForMicrotasks();
}
