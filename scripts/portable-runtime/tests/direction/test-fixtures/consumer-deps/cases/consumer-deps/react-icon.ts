import assert from "node:assert/strict";

import type { DirectionCase, DirectionExpectation } from "../../../../inventory.js";

export const cases: DirectionCase[] = [
  {
    id: "consumer-react-icon",
    row: "context-menu",
    acceptance: ["SPEC-AC-14"],
    fixtures: {
      react: {
        source: `import { createRoot } from "react-dom/client";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuCheckboxItem } from "@direction/styled-react/context-menu";
import "@direction/sheet";
function App() { return <ContextMenu><ContextMenuTrigger data-consumer-trigger>Open menu</ContextMenuTrigger><ContextMenuContent><ContextMenuCheckboxItem defaultChecked data-consumer-checkbox>Checked option</ContextMenuCheckboxItem></ContextMenuContent></ContextMenu>; }
createRoot(document.getElementById("app")!).render(<App />);`,
        exports: [
          "ContextMenu",
          "ContextMenuTrigger",
          "ContextMenuContent",
          "ContextMenuCheckboxItem",
        ],
        assertions: ["trigger-visible", "icon-package-compiled"],
      },
    },
  },
];

export const expectations: DirectionExpectation[] = [
  {
    id: "consumer-react-icon",
    layer: "styled",
    async run(page, _target, ctx) {
      const trigger = page.locator("[data-consumer-trigger]");
      await ctx.check("trigger-visible", () => trigger.waitFor({ state: "visible" }));
      await ctx.check("icon-package-compiled", async () => {
        await trigger.click({ button: "right" });
        const icon = page.locator("[data-consumer-checkbox] svg");
        await icon.waitFor({ state: "visible" });
        const count = await icon.count();
        ctx.observe("visibleIconCount", count);
        assert(count > 0, "Context Menu icon was not rendered");
      });
    },
  },
];
