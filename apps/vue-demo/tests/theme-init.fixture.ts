import { startVueDemo, type VueDemoHostDependencies } from "../src/main.js";

export function runVueThemeHostFixture(): string[] {
  const calls: string[] = [];
  const dependencies: VueDemoHostDependencies = {
    createApp: () => ({
      mount() {
        calls.push("app:mount");
      },
      unmount() {
        calls.push("app:unmount");
      },
    }),
    document: {} as Document,
    initThemeController: () => {
      calls.push("controller:init");
      return {
        destroy() {
          calls.push("controller:destroy");
        },
        syncControls() {
          calls.push("controller:sync");
        },
      };
    },
  };

  const app = startVueDemo(dependencies);
  app.unmount();
  app.unmount();
  return calls;
}

export type VueThemeHostFailureStage = "mount" | "sync" | "unmount";

export function runVueThemeHostFailureFixture(stage: VueThemeHostFailureStage): {
  calls: string[];
  error: unknown;
  expectedError: Error;
} {
  const calls: string[] = [];
  const expectedError = new Error(`${stage} failed`);
  let error: unknown;

  try {
    const app = startVueDemo({
      createApp: () => ({
        mount() {
          calls.push("app:mount");
          if (stage === "mount") throw expectedError;
        },
        unmount() {
          calls.push("app:unmount");
          if (stage === "unmount") throw expectedError;
        },
      }),
      document: {} as Document,
      initThemeController: () => {
        calls.push("controller:init");
        return {
          destroy() {
            calls.push("controller:destroy");
          },
          syncControls() {
            calls.push("controller:sync");
            if (stage === "sync") throw expectedError;
          },
        };
      },
    });

    try {
      app.unmount();
    } catch (caught) {
      error = caught;
    }
    app.unmount();
  } catch (caught) {
    error = caught;
  }

  return { calls, error, expectedError };
}
