import type { Ui } from "../ui";

/**
 * One scenario states its actions and expected results once. Each target renders the named page
 * from its own small fixture, and the runner plays the scenario against all four targets.
 */
export type Scenario = {
  id: string;
  page: string;
  run(ui: Ui): Promise<void>;
};
