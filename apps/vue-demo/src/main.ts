import { initThemeController } from "@starwind-ui/vue/theme";
import { createApp } from "vue";

import App from "./App.vue";
import "./styles.css";

export type VueDemoApp = {
  mount(rootContainer: Element | string): unknown;
  unmount(): void;
};

type VueDemoThemeController = {
  destroy(): void;
  syncControls(): void;
};

export type VueDemoHostDependencies = {
  createApp?: () => VueDemoApp;
  document?: Document;
  initThemeController?: (document: Document) => VueDemoThemeController;
  mountTarget?: Element | string;
};

export function startVueDemo(dependencies: VueDemoHostDependencies = {}): VueDemoApp {
  const ownerDocument = dependencies.document ?? document;
  const controller = (dependencies.initThemeController ?? initThemeController)(ownerDocument);
  const app = (dependencies.createApp ?? (() => createApp(App)))();
  const unmount = app.unmount.bind(app);
  let controllerDestroyed = false;

  const destroyController = () => {
    if (controllerDestroyed) return;
    controllerDestroyed = true;
    controller.destroy();
  };

  app.unmount = () => {
    if (controllerDestroyed) return;

    try {
      unmount();
    } finally {
      destroyController();
    }
  };

  try {
    app.mount(dependencies.mountTarget ?? "#app");
    controller.syncControls();
  } catch (error) {
    destroyController();
    throw error;
  }

  return app;
}

if (typeof document !== "undefined") {
  const app = startVueDemo();
  import.meta.hot?.dispose(() => app.unmount());
}
