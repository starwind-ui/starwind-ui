import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AlertDialogPortal from "../src/alert-dialog/AlertDialogPortal";
import ComboboxPortal from "../src/combobox/ComboboxPortal";
import DrawerPortal from "../src/drawer/DrawerPortal";
import MenuPortal from "../src/menu/MenuPortal";
import NavigationMenuPortal from "../src/navigation-menu/NavigationMenuPortal";
import PopoverPortal from "../src/popover/PopoverPortal";
import PreviewCardPortal from "../src/preview-card/PreviewCardPortal";
import SelectPortal from "../src/select/SelectPortal";
import TooltipPortal from "../src/tooltip/TooltipPortal";

const portalParts = [
  ["alert-dialog", AlertDialogPortal, "data-sw-alert-dialog-portal"],
  ["combobox", ComboboxPortal, "data-sw-combobox-portal"],
  ["drawer", DrawerPortal, "data-sw-drawer-portal"],
  ["menu", MenuPortal, "data-sw-menu-portal"],
  ["navigation-menu", NavigationMenuPortal, "data-sw-nav-menu-portal"],
  ["popover", PopoverPortal, "data-sw-popover-portal"],
  ["preview-card", PreviewCardPortal, "data-sw-preview-card-portal"],
  ["select", SelectPortal, "data-sw-select-portal"],
  ["tooltip", TooltipPortal, "data-sw-tooltip-portal"],
] as const;

describe("React Portal server projection", () => {
  it("renders all nine public wrappers inline with deterministic pending placement", () => {
    const html = renderToString(
      <main data-ticket08-ssr-root>
        {portalParts.map(([family, Portal]) => (
          <Portal container={`#${family}-target`} key={family}>
            <span>{`${family} content`}</span>
          </Portal>
        ))}
      </main>,
    );

    expect(html).toContain('<main data-ticket08-ssr-root="true">');
    for (const [family, , attribute] of portalParts) {
      expect(html).toContain(`${attribute}=\"\"`);
      expect(html).toContain(`data-container=\"#${family}-target\"`);
      expect(html).toContain('data-placement="pending"');
      expect(html).toContain('data-sw-portal-placement="framework"');
      expect(html).toContain(`${family} content`);
    }
  });

  it("keeps disabled Portal output inline and ready", () => {
    const html = renderToString(
      <PopoverPortal disabled container="#outside">
        Inline content
      </PopoverPortal>,
    );

    expect(html).toContain('data-disabled=""');
    expect(html).toContain('data-placement="ready"');
    expect(html).toContain("Inline content");
  });
});
