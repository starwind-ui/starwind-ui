import { verifyAstroCoreControlCases } from "./form-control/core-controls.mjs";
import { verifyAstroDisplayControlCases } from "./form-control/display-controls.mjs";
import { verifyAstroFeedbackChoiceControlCases } from "./form-control/feedback-choice-controls.mjs";
import { verifyAstroSelectComboboxCases } from "./form-control/select-combobox.mjs";
import { verifyAstroTabsCases } from "./form-control/tabs-cases.mjs";
import { verifyAstroThemeToggleCases } from "./form-control/theme-toggle-cases.mjs";
import { verifyAstroToggleCases } from "./form-control/toggle-cases.mjs";
import { verifyDropzoneCases } from "../shared/dropzone.mjs";

export async function verifyAstroFormControlCases({ page }) {
  await verifyAstroCoreControlCases({ page });
  await verifyDropzoneCases({
    page,
    ids: {
      defaultName: "runtime-dropzone-default",
      defaultRoot: "runtime-dropzone-default",
      demo: "runtime-dropzone-demo",
      disabled: "runtime-dropzone-disabled",
      multiple: "runtime-dropzone-multiple",
      uploading: "runtime-dropzone-uploading",
    },
    label: "Astro",
  });
  await verifyAstroToggleCases({ page });
  await verifyAstroThemeToggleCases({ page });
  await verifyAstroTabsCases({ page });
  await verifyAstroDisplayControlCases({ page });
  await verifyAstroSelectComboboxCases({ page });
  await verifyAstroFeedbackChoiceControlCases({ page });
}
