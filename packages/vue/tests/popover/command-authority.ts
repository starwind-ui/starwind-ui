import { expect, it, vi } from "vitest";
import { createApp, nextTick, reactive, type VNode } from "vue";

export function testOverlayCommandAuthority(options: {
  name: string;
  tree: (props: Record<string, unknown>) => VNode;
  controller: (element: HTMLElement) => { getOpen(): boolean; destroy(): void };
  cleanups: Array<() => void>;
}) {
  async function settle() {
    await nextTick();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 60));
    await nextTick();
  }
  function fixture(initialOpen: boolean, controlled = false) {
    const state = reactive({
      open: controlled ? initialOpen : (undefined as boolean | undefined),
      escape: true,
      cancel: true,
    });
    const proposals: boolean[] = [],
      updates: boolean[] = [];
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () =>
        options.tree({
          defaultOpen: initialOpen,
          open: state.open,
          closeOnEscape: state.escape,
          modal: false,
          onOpenChange: (open: boolean, detail: { cancel(): void }) => {
            proposals.push(open);
            if (state.cancel) detail.cancel();
          },
          "onUpdate:open": (open: boolean) => updates.push(open),
        }),
    });
    app.mount(host);
    let alive = true;
    const dispose = () => {
      if (alive) {
        alive = false;
        app.unmount();
      }
    };
    options.cleanups.push(dispose);
    const root = host.querySelector<HTMLElement>(`[data-sw-${options.name}]`)!;
    const popup = () => document.querySelector<HTMLElement>(`[data-sw-${options.name}-popup]`)!;
    const read = () => {
      const open = options.controller(root).getOpen();
      expect(root.getAttribute("data-state")).toBe(open ? "open" : "closed");
      expect(popup().hidden).toBe(!open);
      return open;
    };
    const act = (open: boolean) =>
      document
        .querySelector<HTMLButtonElement>(
          `[data-sw-${options.name}-${open ? "trigger" : "close"}]`,
        )!
        .click();
    return { state, proposals, updates, root, popup, read, act, dispose };
  }
  it.each([false, true])(
    "applies first defined open=%s and retains accepted state after release",
    async (command) => {
      const f = fixture(!command);
      await settle();
      expect(f.read()).toBe(!command);
      f.state.open = command;
      await settle();
      expect(f.read()).toBe(command);
      expect(f.proposals).toEqual([]);
      expect(f.updates).toEqual([]);
      f.state.open = undefined;
      await settle();
      expect(f.read()).toBe(command);
      f.act(!command);
      await settle();
      expect(f.read()).toBe(command);
      expect(f.proposals).toEqual([!command]);
      expect(f.updates).toEqual([]);
      f.state.cancel = false;
      f.act(!command);
      await settle();
      expect(f.read()).toBe(!command);
      expect(f.updates).toEqual([!command]);
      f.state.escape = false;
      await settle();
      expect(f.read()).toBe(!command);
      expect(f.proposals).toEqual([!command, !command]);
      expect(f.updates).toEqual([!command]);
    },
  );
  it.each([false, true])(
    "applies latest controlled open=%s before reconnect settles",
    async (command) => {
      const f = fixture(!command, true);
      await settle();
      const original = options.controller(f.root);
      // Send parent feedback after teardown starts and before nextTick reconnects the owner.
      const destroy = original.destroy.bind(original);
      const spy = vi.spyOn(original, "destroy").mockImplementationOnce(() => {
        destroy();
        f.state.open = command;
      });
      options.cleanups.push(() => spy.mockRestore());
      f.state.escape = false;
      await settle();
      expect(options.controller(f.root)).not.toBe(original);
      expect(f.read()).toBe(command);
      expect(f.proposals).toEqual([]);
      expect(f.updates).toEqual([]);
    },
  );
  it("retires pending reconnect on teardown", async () => {
    const f = fixture(false);
    await settle();
    const popup = f.popup();
    f.state.open = true;
    f.state.escape = false;
    void nextTick(f.dispose);
    await settle();
    expect(f.root.isConnected).toBe(false);
    expect(popup.isConnected).toBe(false);
    expect(document.querySelector(`[data-sw-${options.name}-popup]`)).toBeNull();
    expect(f.proposals).toEqual([]);
    expect(f.updates).toEqual([]);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });
}
