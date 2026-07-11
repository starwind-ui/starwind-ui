import { verifyThemeToggleCases } from "../../shared/theme-toggle.mjs";

export async function verifyAstroThemeToggleCases({ page }) {
  await verifyThemeToggleCases({
    label: "Astro",
    page,
    ids: {
      custom: "runtime-theme-toggle-custom",
      darkButton: "runtime-theme-value-dark",
      demo: "runtime-theme-toggle-demo",
      primary: "runtime-theme-toggle-primary",
      secondary: "runtime-theme-toggle-secondary",
      select: "runtime-theme-native-select",
      switch: "runtime-theme-switch",
      systemButton: "runtime-theme-value-system",
    },
  });
}
