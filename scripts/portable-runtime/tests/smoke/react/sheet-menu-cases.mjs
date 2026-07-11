import { verifyReactDialogCases } from "./sheet-menu/dialog-cases.mjs";
import { verifyReactMenuCases } from "./sheet-menu/menu-cases.mjs";
import { verifyReactPopoverCases } from "./sheet-menu/popover-cases.mjs";
import { verifyReactSheetPortalCases } from "./sheet-menu/sheet-portals.mjs";

export async function verifyReactSheetMenuCases({ page }) {
  await verifyReactSheetPortalCases({ page });
  await verifyReactMenuCases({ page });
  await verifyReactPopoverCases({ page });
  await verifyReactDialogCases({ page });
}
