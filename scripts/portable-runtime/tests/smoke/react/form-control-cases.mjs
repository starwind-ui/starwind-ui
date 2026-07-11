import { verifyReactCoreControlCases } from "./form-control/core-controls.mjs";
import { verifyReactDisplayControlCases } from "./form-control/display-controls.mjs";
import { verifyReactFeedbackChoiceControlCases } from "./form-control/feedback-choice-controls.mjs";
import { verifyReactSelectComboboxCases } from "./form-control/select-combobox.mjs";
import { verifyReactTabsCases } from "./form-control/tabs-cases.mjs";
import { verifyReactThemeToggleCases } from "./form-control/theme-toggle-cases.mjs";
import { verifyReactToggleCases } from "./form-control/toggle-cases.mjs";
import { verifyDropzoneCases } from "../shared/dropzone.mjs";

export async function verifyReactFormControlCases({ page, messages }) {
  await verifyReactCoreControlCases({ page, messages });
  await verifyDropzoneCases({
    page,
    ids: {
      defaultName: "react-runtime-dropzone-default",
      defaultRoot: "react-runtime-dropzone-default",
      demo: "react-runtime-dropzone-demo",
      disabled: "react-runtime-dropzone-disabled",
      multiple: "react-runtime-dropzone-multiple",
      reactFilesText: "[data-runtime-dropzone-files]",
      uploading: "react-runtime-dropzone-uploading",
    },
    label: "React",
  });
  await verifyReactToggleCases({ page });
  await verifyReactThemeToggleCases({ page });
  await verifyReactDisplayControlCases({ page });
  await verifyReactSelectComboboxCases({ page });
  await verifyReactFeedbackChoiceControlCases({ page });
  await verifyReactTabsCases({ page });
}
