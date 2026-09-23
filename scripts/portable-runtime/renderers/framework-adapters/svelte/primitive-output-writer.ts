import { writeGeneratedFile } from "../../shared.js";
import {
  type FrameworkAdapterPrimitiveOutputWriterOptions,
  writePrimitiveOutputFiles,
} from "../primitive-output-writer.js";
import type { AdapterOutputModel } from "../types.js";
import { svelteFrameworkAdapter } from "./adapter.js";
import { projectSvelteGroupContextOutput } from "./group-context.js";

export type SvelteAdapterOutputWriterOptions = FrameworkAdapterPrimitiveOutputWriterOptions & {
  componentHeader: string;
  moduleHeader: string;
  outputModel: AdapterOutputModel;
};

export async function writeSvelteAdapterOutput({
  componentHeader,
  componentName,
  moduleHeader,
  outputModel,
  outputRoot,
}: SvelteAdapterOutputWriterOptions): Promise<void> {
  const projectedOutputModel = projectSvelteGroupContextOutput(outputModel);
  await writePrimitiveOutputFiles({
    adapter: svelteFrameworkAdapter,
    componentName,
    extension: "svelte",
    outputModel: projectedOutputModel,
    outputRoot,
    target: "svelte",
    targetDisplayName: "Svelte proof",
    transformPrintedFile: (file) =>
      file.path.endsWith(".svelte")
        ? `${componentHeader}${file.contents}`
        : `${moduleHeader}${file.contents}`,
    writeFile: writeGeneratedFile,
  });
}
