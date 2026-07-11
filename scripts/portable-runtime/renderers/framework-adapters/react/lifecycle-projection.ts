type ReactCallbackArgs = {
  body: string;
  dependencies?: readonly string[] | string;
  format?: "compact" | "expanded";
  indentation?: string;
  name: string;
  parameters: string;
};

type ReactComposedRefCallbackArgs = {
  elementType: string;
  format?: "compact" | "expanded";
  forwardedRefName?: string;
  indentation?: string;
  refName?: string;
  rootRefName?: string;
};

type ReactDisplayNameAndDefaultExportArgs = {
  displayName: string;
  exportName: string;
};

type ReactEffectArgs = {
  body: string;
  dependencies?: readonly string[] | string;
  hook?: string;
  indentation?: string;
};

type ReactRefSyncEffectArgs = {
  dependencies?: readonly string[];
  hook?: string;
  indentation?: string;
  refName: string;
  value: string;
};

type ReactRootRefArgs = {
  elementType: string;
  indentation?: string;
  rootRefName?: string;
};

type ReactControlledSyncCallbackArgs = {
  callbackName?: string;
  instanceRefName?: string;
  rootRefName?: string;
  setterMethod: string;
  setterOptions: string;
  setterValue: string;
  timerRefName?: string;
  valueRefName?: string;
};

type ReactLifecycleProjection = {
  printCallback(args: ReactCallbackArgs): string;
  printComposedRefCallback(args: ReactComposedRefCallbackArgs): string;
  printControlledSyncCallback(args: ReactControlledSyncCallbackArgs): string;
  printDisplayNameAndDefaultExport(args: ReactDisplayNameAndDefaultExportArgs): string;
  printEffect(args: ReactEffectArgs): string;
  printRefSyncEffect(args: ReactRefSyncEffectArgs): string;
  printRootRef(args: ReactRootRefArgs): string;
};

function printDependencyArray(dependencies: readonly string[] | string): string {
  return typeof dependencies === "string" ? dependencies : `[${dependencies.join(", ")}]`;
}

function indentBody(body: string, indentation: string): string {
  return body
    .split("\n")
    .map((line) => (line.length > 0 ? `${indentation}${line}` : ""))
    .join("\n");
}

function printRootRef({
  elementType,
  indentation = "    ",
  rootRefName = "rootRef",
}: ReactRootRefArgs): string {
  return `${indentation}const ${rootRefName} = React.useRef<${elementType}>(null);`;
}

function printComposedRefCallback({
  elementType,
  format = "expanded",
  forwardedRefName = "forwardedRef",
  indentation = "    ",
  refName = "composedRef",
  rootRefName = "rootRef",
}: ReactComposedRefCallbackArgs): string {
  if (format === "compact") {
    return [
      `${indentation}const ${refName} = React.useCallback((node: ${elementType} | null) => {`,
      `${indentation}  ${rootRefName}.current = node;`,
      `${indentation}  setRef(${forwardedRefName}, node);`,
      `${indentation}}, [${forwardedRefName}]);`,
    ].join("\n");
  }

  return [
    `${indentation}const ${refName} = React.useCallback(`,
    `${indentation}  (node: ${elementType} | null) => {`,
    `${indentation}    ${rootRefName}.current = node;`,
    `${indentation}    setRef(${forwardedRefName}, node);`,
    `${indentation}  },`,
    `${indentation}  [${forwardedRefName}],`,
    `${indentation});`,
  ].join("\n");
}

function printCallback({
  body,
  dependencies = [],
  format = "expanded",
  indentation = "    ",
  name,
  parameters,
}: ReactCallbackArgs): string {
  const dependencySource = printDependencyArray(dependencies);

  if (format === "compact") {
    return [
      `${indentation}const ${name} = React.useCallback(${parameters} => {`,
      indentBody(body, `${indentation}  `),
      `${indentation}}, ${dependencySource});`,
    ].join("\n");
  }

  return [
    `${indentation}const ${name} = React.useCallback(`,
    `${indentation}  ${parameters} => {`,
    indentBody(body, `${indentation}    `),
    `${indentation}  },`,
    `${indentation}  ${dependencySource},`,
    `${indentation});`,
  ].join("\n");
}

function printControlledSyncCallback({
  callbackName = "scheduleControlledSync",
  instanceRefName = "instanceRef",
  rootRefName = "rootRef",
  setterMethod,
  setterOptions,
  setterValue,
  timerRefName = "controlledSyncTimerRef",
  valueRefName = "valueRef",
}: ReactControlledSyncCallbackArgs): string {
  return printCallback({
    body: `if (${valueRefName}.current === undefined) return;\n\nif (${timerRefName}.current !== undefined) {\n  window.clearTimeout(${timerRefName}.current);\n}\n\n${timerRefName}.current = window.setTimeout(() => {\n  ${timerRefName}.current = undefined;\n  const root = ${rootRefName}.current;\n  const instance = ${instanceRefName}.current;\n  if (!root || !instance) return;\n\n  instance.${setterMethod}(${setterValue}, ${setterOptions});\n}, 0);`,
    dependencies: [],
    format: "compact",
    name: callbackName,
    parameters: "()",
  });
}

function printEffect({
  body,
  dependencies = [],
  hook = "React.useEffect",
  indentation = "    ",
}: ReactEffectArgs): string {
  const dependencySource = printDependencyArray(dependencies);
  const bodySource = indentBody(body, `${indentation}  `);

  return [`${indentation}${hook}(() => {`, bodySource, `${indentation}}, ${dependencySource});`].join(
    "\n",
  );
}

function printRefSyncEffect({
  dependencies,
  hook,
  indentation,
  refName,
  value,
}: ReactRefSyncEffectArgs): string {
  return printEffect({
    body: `${refName}.current = ${value};`,
    dependencies: dependencies ?? [value],
    hook,
    indentation,
  });
}

function printDisplayNameAndDefaultExport({
  displayName,
  exportName,
}: ReactDisplayNameAndDefaultExportArgs): string {
  return `${exportName}.displayName = "${displayName}";\n\nexport default ${exportName};`;
}

export const reactLifecycleProjection = {
  printCallback,
  printComposedRefCallback,
  printControlledSyncCallback,
  printDisplayNameAndDefaultExport,
  printEffect,
  printRefSyncEffect,
  printRootRef,
} satisfies ReactLifecycleProjection;
