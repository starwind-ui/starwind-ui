import { readFile } from "node:fs/promises";

import { expect, it } from "vitest";

import * as runtimeAdapterContractExports from "../../contracts/primitive/representatives.js";
import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";
import { validateRuntimeAdapterContracts } from "../../contracts/primitive/validation.js";

const { runtimeAdapterContracts, representativeRuntimeAdapterContracts } =
  runtimeAdapterContractExports;

const CONTRACT_RUNTIME_ALIGNMENT_FILES = {
  avatar: "avatar/avatar.ts",
  progress: "progress/progress.ts",
  "scroll-area": "scroll-area/scroll-area.ts",
  "input-otp": "input-otp/input-otp.ts",
  carousel: "carousel/carousel.ts",
  tooltip: "tooltip/tooltip.ts",
  popover: "popover/popover.ts",
  "preview-card": "preview-card/preview-card.ts",
  dialog: "dialog/dialog.ts",
  "alert-dialog": ["alert-dialog/alert-dialog.ts", "dialog/dialog.ts"],
  drawer: ["drawer/drawer.ts", "dialog/dialog.ts"],
  dropzone: "dropzone/dropzone.ts",
  menu: "menu/menu.ts",
  "context-menu": ["context-menu/context-menu.ts", "menu/menu.ts"],
  select: "select/select.ts",
  sidebar: "sidebar/sidebar.ts",
  combobox: "combobox/combobox.ts",
  toast: "toast/toast.ts",
} as const;

const RUNTIME_CONTRACT_EXPORTS = [
  "buttonRuntimeAdapterContract",
  "toggleRuntimeAdapterContract",
  "fieldRuntimeAdapterContract",
  "inputRuntimeAdapterContract",
  "switchRuntimeAdapterContract",
  "checkboxRuntimeAdapterContract",
  "radioRuntimeAdapterContract",
  "sliderRuntimeAdapterContract",
  "collapsibleRuntimeAdapterContract",
  "toggleGroupRuntimeAdapterContract",
  "radioGroupRuntimeAdapterContract",
  "checkboxGroupRuntimeAdapterContract",
  "tabsRuntimeAdapterContract",
  "accordionRuntimeAdapterContract",
  "avatarRuntimeAdapterContract",
  "progressRuntimeAdapterContract",
  "scrollAreaRuntimeAdapterContract",
  "inputOtpRuntimeAdapterContract",
  "carouselRuntimeAdapterContract",
  "tooltipRuntimeAdapterContract",
  "popoverRuntimeAdapterContract",
  "previewCardRuntimeAdapterContract",
  "dialogRuntimeAdapterContract",
  "alertDialogRuntimeAdapterContract",
  "drawerRuntimeAdapterContract",
  "dropzoneRuntimeAdapterContract",
  "menuRuntimeAdapterContract",
  "contextMenuRuntimeAdapterContract",
  "selectRuntimeAdapterContract",
  "sidebarRuntimeAdapterContract",
  "comboboxRuntimeAdapterContract",
  "toastRuntimeAdapterContract",
] as const;

export {
  CONTRACT_RUNTIME_ALIGNMENT_FILES,
  expect,
  it,
  RUNTIME_CONTRACT_EXPORTS,
  representativeRuntimeAdapterContracts,
  runtimeAdapterContractExports,
  runtimeAdapterContracts,
  validateRuntimeAdapterContracts,
};

export function getRuntimeAdapterContract(component: string): RuntimeAdapterContract {
  const contract = representativeRuntimeAdapterContracts.find(
    (candidate) => candidate.component === component,
  );
  if (!contract) {
    throw new Error(`Missing runtime adapter contract for ${component}.`);
  }

  return contract;
}

export async function readRuntimeComponent(
  relativePath: string | readonly string[],
): Promise<string> {
  const relativePaths = Array.isArray(relativePath) ? relativePath : [relativePath];
  const sources = await Promise.all(
    relativePaths.map((entry) =>
      readFile(
        new URL(`../../../../packages/runtime/src/components/${entry}`, import.meta.url),
        "utf8",
      ),
    ),
  );

  return sources.join("\n");
}

export function cloneContract(contract: RuntimeAdapterContract): RuntimeAdapterContract {
  return JSON.parse(JSON.stringify(contract)) as RuntimeAdapterContract;
}
