import { writeGeneratedFile } from "../../shared.js";
import {
  type FrameworkAdapterPrimitiveOutputWriterOptions,
  writePrimitiveOutputFiles,
} from "../primitive-output-writer.js";
import type { AdapterOutputModel } from "../types.js";
import { vueFrameworkAdapter } from "./adapter.js";
import { assertVueSfcCompiles } from "./sfc-compiler.js";

export type VueAdapterOutputWriterOptions = FrameworkAdapterPrimitiveOutputWriterOptions & {
  componentHeader: string;
  moduleHeader: string;
  outputModel: AdapterOutputModel;
};

export async function writeVueAdapterOutput({
  componentHeader,
  componentName,
  outputModel,
  outputRoot,
  moduleHeader,
}: VueAdapterOutputWriterOptions): Promise<void> {
  await writePrimitiveOutputFiles({
    adapter: vueFrameworkAdapter,
    componentName,
    extension: "vue",
    outputModel,
    outputRoot,
    target: "vue",
    targetDisplayName: "Vue",
    transformPrintedFile: (file) =>
      file.path.endsWith(".vue")
        ? `${componentHeader}${file.contents}`
        : `${moduleHeader}${file.contents}`,
    writeFile: writeVuePrimitiveFile,
  });
}

export async function writeVuePrimitiveFile(
  dir: string,
  fileName: string,
  contents: string,
): Promise<void> {
  if (fileName.endsWith(".vue")) {
    assertVueSfcCompiles(contents, fileName);
  }
  await writeGeneratedFile(dir, fileName, contents);
}
