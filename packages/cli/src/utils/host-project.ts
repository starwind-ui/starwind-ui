import type { ProjectPackage } from "./host-planner.js";
import type { PackageManager } from "./package-manager.js";

export type HostProjectPreparation =
  | Readonly<{ status: "cancelled" | "declined" }>
  | (Readonly<{ status: "prepared" }> &
      (
        | Readonly<{
            applyIntegration: () => Promise<void>;
            integrationLabel: string;
            integrationResult: string;
          }>
        | Readonly<{
            applyIntegration?: undefined;
            integrationLabel?: undefined;
            integrationResult?: undefined;
          }>
      ));

export type HostProjectPlanBase = {
  componentDir: string;
  cssFile: string;
  hostLabel: string;
  prepare: (options: {
    packageManager: PackageManager;
    projectPackage: ProjectPackage;
    skipPrompts?: boolean;
  }) => Promise<HostProjectPreparation>;
  prepareStylesheet: (content: string) => string;
  requirements: (requirements: string[]) => string[];
  lockCssFile?: true;
  setup: (cssFile: string) => Promise<void>;
  setupLabel: string;
  setupResult: string;
  setupTypeScript: () => Promise<boolean>;
  utilsDir: string;
  validate: () => Promise<void>;
} & (
  | {
      setupCss: (cssFile: string) => Promise<boolean>;
      setupCssLabel: string;
      setupCssResult: string;
    }
  | { setupCss?: undefined; setupCssLabel?: undefined; setupCssResult?: undefined }
);
