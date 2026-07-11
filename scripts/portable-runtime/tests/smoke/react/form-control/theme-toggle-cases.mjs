import { verifyThemeToggleCases } from "../../shared/theme-toggle.mjs";

export async function verifyReactThemeToggleCases({ page }) {
  await verifyThemeToggleCases({
    label: "React",
    page,
    ids: {
      custom: "react-runtime-theme-toggle-custom",
      darkButton: "react-runtime-theme-value-dark",
      demo: "react-runtime-theme-toggle-demo",
      primary: "react-runtime-theme-toggle-primary",
      secondary: "react-runtime-theme-toggle-secondary",
      select: "react-runtime-theme-native-select",
      switch: "react-runtime-theme-switch",
      rerenderButton: "react-runtime-theme-rerender",
      systemButton: "react-runtime-theme-value-system",
    },
  });
}
