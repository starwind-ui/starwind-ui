import path from "node:path";

import type {
  AdapterOutputModel,
  AdapterPrintedFile,
  FrameworkAdapter,
  FrameworkAdapterTarget,
} from "./types.js";

export type FrameworkAdapterPrimitiveOutputWriterOptions = {
  componentName: string;
  ignoreOutputModelFilePaths?: readonly string[];
  outputRoot: string;
};

export type FrameworkAdapterPrimitiveOutputPolicyOptions =
  FrameworkAdapterPrimitiveOutputWriterOptions & {
    adapter: FrameworkAdapter;
    extension: string;
    outputModel: AdapterOutputModel;
    target: FrameworkAdapterTarget;
    targetDisplayName: string;
    transformPrintedFile: (file: AdapterPrintedFile) => string;
    writeFile: (dir: string, fileName: string, contents: string) => Promise<void>;
  };

export async function writePrimitiveOutputFiles({
  adapter,
  componentName,
  extension,
  ignoreOutputModelFilePaths = [],
  outputModel,
  outputRoot,
  target,
  targetDisplayName,
  transformPrintedFile,
  writeFile,
}: FrameworkAdapterPrimitiveOutputPolicyOptions): Promise<void> {
  const ignoredPaths = new Set(ignoreOutputModelFilePaths);
  const printedFiles = adapter
    .printOutput(outputModel)
    .filter((file) => !ignoredPaths.has(file.path));

  assertPrintedPathsMatchOutputModel({
    componentName,
    extension,
    ignoreOutputModelFilePaths,
    outputModel,
    printedFiles,
    target,
    targetDisplayName,
  });

  for (const file of printedFiles) {
    const location = getPrimitiveOutputFileLocation(outputRoot, file.path);
    await writeFile(location.dir, location.fileName, transformPrintedFile(file));
  }
}

export function assertPrintedPathsMatchOutputModel({
  componentName,
  extension,
  ignoreOutputModelFilePaths = [],
  outputModel,
  printedFiles,
  target,
  targetDisplayName,
}: {
  componentName: string;
  extension: string;
  ignoreOutputModelFilePaths?: readonly string[];
  outputModel: AdapterOutputModel;
  printedFiles: AdapterPrintedFile[];
  target: FrameworkAdapterTarget;
  targetDisplayName: string;
}): void {
  const modelPaths = outputModel.files
    .filter((file) => !file.target || file.target === target)
    .map((file) =>
      file.kind === "component" ? `${file.path}.${extension}` : file.path,
    );
  const ignoredPaths = new Set(ignoreOutputModelFilePaths);
  const unknownIgnoredPaths = ignoreOutputModelFilePaths.filter(
    (filePath) => !modelPaths.includes(filePath),
  );
  if (unknownIgnoredPaths.length > 0) {
    throw new Error(
      `${componentName} ${targetDisplayName} output model route ignored unknown paths: ${unknownIgnoredPaths.join(
        ", ",
      )}`,
    );
  }

  const expectedPaths = modelPaths.filter((filePath) => !ignoredPaths.has(filePath));
  const printedPaths = printedFiles.map((file) => file.path);

  if (arraysEqual(expectedPaths, printedPaths)) return;

  throw new Error(
    `${componentName} ${targetDisplayName} output model route printed unexpected paths: ${printedPaths.join(
      ", ",
    )}. Expected: ${expectedPaths.join(", ")}`,
  );
}

export function getPrimitiveOutputFileLocation(
  outputRoot: string,
  filePath: string,
): { dir: string; fileName: string } {
  const outputPath = path.join(outputRoot, filePath);

  return {
    dir: path.dirname(outputPath),
    fileName: path.basename(outputPath),
  };
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
