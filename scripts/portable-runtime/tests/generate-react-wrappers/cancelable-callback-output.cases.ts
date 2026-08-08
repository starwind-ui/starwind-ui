import ts from "typescript";

import { runtimeAdapterContracts } from "../../contracts/primitive/representatives.js";
import type {
  PrimitiveEventContract,
  RuntimeAdapterContract,
} from "../../contracts/primitive/types.js";
import type { GetTempRoot } from "./shared.js";
import { expect, generateReactPrimitiveWrappers, it, path, readGeneratedTree } from "./shared.js";

type CancelableContractEvent = {
  contract: RuntimeAdapterContract;
  event: PrimitiveEventContract & { cancelable: true };
};

export function defineReactCancelableCallbackOutputTests(getTempRoot: GetTempRoot): void {
  it("wires every cancelable React callback before accepted Runtime subscriptions", async () => {
    const tempRoot = getTempRoot();
    const outputDir = "generated/primitives/react";

    await generateReactPrimitiveWrappers({ outputDir, repoRoot: tempRoot });

    const outputRoot = path.join(tempRoot, outputDir);
    const generatedFiles = await readGeneratedTree(outputRoot);
    const cancelableEvents = getCancelableContractEvents(runtimeAdapterContracts);
    const earlyDomStatePublications: string[] = [];
    const earlyStatePublications: string[] = [];
    const constructionCallbackEvents: string[] = [];
    const domEventProjectionEvents: string[] = [];
    const missingConstructionCallbacks: string[] = [];
    const missingDomEventProjections: string[] = [];
    const subscriptionCallbacks: string[] = [];

    for (const { contract, event } of cancelableEvents) {
      const componentPrefix = `${contract.component}/`;
      let hasConstructionCallback = false;
      let hasDomEventProjection = false;

      for (const [relativePath, source] of Object.entries(generatedFiles)) {
        const isOwnedComponent = relativePath.startsWith(componentPrefix);
        const isReusedMenuProjection =
          contract.component === "context-menu" && relativePath.startsWith("menu/");
        if ((!isOwnedComponent && !isReusedMenuProjection) || !relativePath.endsWith(".tsx")) {
          continue;
        }

        const sourceFile = ts.createSourceFile(
          relativePath,
          source,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TSX,
        );

        const stateSetters = getReactStateSetters(sourceFile);
        const constructionCallback = findRuntimeConstructionCallback(
          sourceFile,
          event.callbackProp,
        );
        if (constructionCallback) {
          hasConstructionCallback = true;
          if (containsCalledIdentifier(constructionCallback, stateSetters)) {
            earlyStatePublications.push(`${contract.component}:${event.name}:${relativePath}`);
          }
        }

        if (
          event.domEvent &&
          source.includes(`addEventListener("${event.domEvent}"`) &&
          source.includes(`${event.callbackProp}Ref.current?.`)
        ) {
          hasDomEventProjection = true;
          const callbackIndex = source.indexOf(`${event.callbackProp}Ref.current?.`);
          const stateSetterIndex = source.indexOf("setUncontrolled", callbackIndex);
          const microtaskIndex = source.indexOf("queueMicrotask", callbackIndex);
          if (stateSetterIndex >= 0 && (microtaskIndex < 0 || stateSetterIndex < microtaskIndex)) {
            earlyDomStatePublications.push(`${contract.component}:${event.name}:${relativePath}`);
          }
        }

        visitRuntimeSubscriptions(sourceFile, event, () => {
          subscriptionCallbacks.push(`${contract.component}:${event.name}:${relativePath}`);
        });
      }

      if (event.emitsFrom === contract.runtime.rootPart) {
        if (!hasConstructionCallback) {
          missingConstructionCallbacks.push(`${contract.component}:${event.name}`);
        } else {
          constructionCallbackEvents.push(`${contract.component}:${event.name}`);
        }
      } else if (!hasDomEventProjection) {
        missingDomEventProjections.push(`${contract.component}:${event.name}`);
      } else {
        domEventProjectionEvents.push(`${contract.component}:${event.name}`);
      }
    }

    expect(cancelableEvents).toHaveLength(31);
    expect(new Set(cancelableEvents.map(({ contract }) => contract.component)).size).toBe(24);
    expect(constructionCallbackEvents).toHaveLength(27);
    expect(domEventProjectionEvents).toHaveLength(4);
    expect(missingConstructionCallbacks).toEqual([]);
    expect(missingDomEventProjections).toEqual([]);
    expect(earlyDomStatePublications).toEqual([]);
    expect(earlyStatePublications).toEqual([]);
    expect(subscriptionCallbacks).toEqual([]);
  });
}

function getCancelableContractEvents(
  contracts: readonly RuntimeAdapterContract[],
): CancelableContractEvent[] {
  return contracts.flatMap((contract) =>
    (contract.events ?? [])
      .filter(
        (event): event is PrimitiveEventContract & { cancelable: true } =>
          event.cancelable === true,
      )
      .map((event) => ({ contract, event })),
  );
}

function visitRuntimeSubscriptions(
  sourceFile: ts.SourceFile,
  event: PrimitiveEventContract,
  onAcceptedSubscriptionCallback: () => void,
): void {
  const callbackRefName = `${event.callbackProp}Ref`;

  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "subscribe" &&
      isStringLiteralWithValue(node.arguments[0], event.name) &&
      node.arguments[1] &&
      containsIdentifier(node.arguments[1], callbackRefName)
    ) {
      onAcceptedSubscriptionCallback();
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
}

function findRuntimeConstructionCallback(
  sourceFile: ts.SourceFile,
  callbackProp: string,
): ts.Expression | undefined {
  let callback: ts.Expression | undefined;

  const visit = (node: ts.Node): void => {
    if (callback) return;

    if (
      ts.isCallExpression(node) &&
      node.arguments[1] &&
      ts.isObjectLiteralExpression(node.arguments[1])
    ) {
      const property = node.arguments[1].properties.find(
        (candidate): candidate is ts.PropertyAssignment =>
          ts.isPropertyAssignment(candidate) && getPropertyName(candidate.name) === callbackProp,
      );
      if (property) callback = property.initializer;
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return callback;
}

function getReactStateSetters(sourceFile: ts.SourceFile): Set<string> {
  const stateSetters = new Set<string>();

  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isArrayBindingPattern(node.name) &&
      node.name.elements[1] &&
      ts.isBindingElement(node.name.elements[1]) &&
      ts.isIdentifier(node.name.elements[1].name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isPropertyAccessExpression(node.initializer.expression) &&
      node.initializer.expression.name.text === "useState"
    ) {
      stateSetters.add(node.name.elements[1].name.text);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  let foundWrapper = true;
  while (foundWrapper) {
    foundWrapper = false;
    const visitWrappers = (node: ts.Node): void => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer &&
        ts.isCallExpression(node.initializer) &&
        ts.isPropertyAccessExpression(node.initializer.expression) &&
        node.initializer.expression.name.text === "useCallback" &&
        containsCalledIdentifier(node.initializer, stateSetters) &&
        !stateSetters.has(node.name.text)
      ) {
        stateSetters.add(node.name.text);
        foundWrapper = true;
      }

      ts.forEachChild(node, visitWrappers);
    };
    visitWrappers(sourceFile);
  }

  return stateSetters;
}

function containsCalledIdentifier(node: ts.Node, identifiers: ReadonlySet<string>): boolean {
  if (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    identifiers.has(node.expression.text)
  ) {
    return true;
  }

  let found = false;
  ts.forEachChild(node, (child) => {
    if (!found && containsCalledIdentifier(child, identifiers)) found = true;
  });
  return found;
}

function getPropertyName(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return undefined;
}

function isStringLiteralWithValue(
  node: ts.Expression | undefined,
  value: string,
): node is ts.StringLiteral {
  return Boolean(node && ts.isStringLiteral(node) && node.text === value);
}

function containsIdentifier(node: ts.Node, identifier: string): boolean {
  if (ts.isIdentifier(node) && node.text === identifier) return true;

  let found = false;
  ts.forEachChild(node, (child) => {
    if (!found && containsIdentifier(child, identifier)) found = true;
  });
  return found;
}
