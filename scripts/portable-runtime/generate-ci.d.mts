export type GenerateCiTask = { args: string[]; name: string };

export const GENERATE_CI_TASKS: GenerateCiTask[];

export function runGenerateCiTasks(options?: {
  concurrency?: number;
  log?: (message: string) => void;
  tasks?: GenerateCiTask[];
  verbose?: boolean;
}): Promise<string[]>;
