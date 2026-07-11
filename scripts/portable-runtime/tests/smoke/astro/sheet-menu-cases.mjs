import { verifyAstroDialogCases } from "./sheet-menu/dialog-cases.mjs";
import { verifyAstroMenuCases } from "./sheet-menu/menu-cases.mjs";
import { verifyAstroPopoverCases } from "./sheet-menu/popover-cases.mjs";
import { verifyAstroSheetPortalCases } from "./sheet-menu/sheet-portals.mjs";

export async function verifyAstroSheetMenuCases({ page }) {
  await verifyAstroSheetPortalCases({ page });
  await verifyAstroMenuCases({ page });
  await verifyAstroPopoverCases({ page });
  await verifyAstroDialogCases({ page });
}
