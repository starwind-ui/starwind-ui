import { describe, expect, it } from "vitest";
import { cloneVNode, createApp, nextTick, ref, type VNode } from "vue";

type Proposal = { cancel(): void; readonly isCanceled: boolean };

type AcceptedModelCase<T> = {
  name: string;
  model: string;
  proposal: string;
  domEvent: string;
  initial: T;
  accepted: T;
  tree: () => VNode;
  root: string;
  act: (root: HTMLElement) => void | Promise<void>;
  read: (root: HTMLElement) => T;
  normalize?: (value: unknown) => T;
};

/** Exercise the generated public model, proposal, DOM event and rendered state together. */
export function testAcceptedModelPublication<T>(testCase: AcceptedModelCase<T>): void {
  describe(`${testCase.name} accepted model publication`, () => {
    for (const bound of [false, true]) {
      for (const veto of ["callback", "dom"] as const) {
        it(`${bound ? "bound" : "unbound"} ${testCase.model} waits for ${veto} acceptance`, async () => {
          const parent = ref<unknown>(testCase.initial);
          const commanded = ref(bound);
          const updates: T[] = [];
          const order: string[] = [];
          const domSnapshots: number[] = [];
          const proposals: Proposal[] = [];
          let cancel = true;
          const host = document.createElement("div");
          document.body.append(host);
          const app = createApp({
            render: () =>
              cloneVNode(testCase.tree(), {
                ...(commanded.value ? { [testCase.model]: parent.value } : {}),
                [testCase.proposal]: (_value: unknown, detail: Proposal) => {
                  order.push("proposal");
                  proposals.push(detail);
                  if (cancel && veto === "callback") detail.cancel();
                },
                [`onUpdate:${testCase.model}`]: (value: unknown) => {
                  order.push("update");
                  updates.push(testCase.normalize ? testCase.normalize(value) : (value as T));
                  if (bound) parent.value = value;
                },
              }),
          });
          app.mount(host);
          try {
            await settleAcceptedModel();
            const root = host.querySelector<HTMLElement>(testCase.root)!;
            expect(root).not.toBeNull();
            const onDom = (event: Event) => {
              // Descendant events belong to their own state owner.
              if (event.target !== root) return;
              order.push("dom");
              domSnapshots.push(updates.length);
              if (cancel && veto === "dom") event.preventDefault();
            };
            root.addEventListener(testCase.domEvent, onDom);
            await testCase.act(root);
            await settleAcceptedModel();
            expect(proposals).toHaveLength(1);
            expect(proposals[0]!.isCanceled).toBe(true);
            expect(updates).toEqual([]);
            expect(parent.value).toEqual(testCase.initial);
            expect(testCase.read(root)).toEqual(testCase.initial);
            expect(order).toEqual(["proposal", "dom"]);
            expect(domSnapshots).toEqual([0]);

            cancel = false;
            order.length = 0;
            await testCase.act(root);
            await settleAcceptedModel();
            expect(updates).toEqual([testCase.accepted]);
            expect(testCase.read(root)).toEqual(testCase.accepted);
            expect(order).toEqual(["proposal", "dom", "update"]);
            expect(domSnapshots).toEqual([0, 0]);

            if (bound) {
              // A later explicit parent command remains authoritative even while interactions veto.
              cancel = true;
              parent.value = testCase.initial;
              await settleAcceptedModel();
              expect(testCase.read(root)).toEqual(testCase.initial);
              parent.value = testCase.accepted;
              await settleAcceptedModel();
              expect(testCase.read(root)).toEqual(testCase.accepted);
              expect(updates).toEqual([testCase.accepted]);
            }
            root.removeEventListener(testCase.domEvent, onDom);
          } finally {
            app.unmount();
            host.remove();
          }
        });
      }
    }
  });
}

export async function settleAcceptedModel(): Promise<void> {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 35));
  await nextTick();
}
