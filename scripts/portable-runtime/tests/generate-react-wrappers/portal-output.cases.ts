import { compactCode } from "../source-comparison.js";
import type { GetTempRoot } from "./shared.js";
import {
  expect,
  generateReactPrimitiveWrappers,
  it,
  path,
  readGeneratedFile,
  readGeneratedTree,
} from "./shared.js";

const portalFamilies = [
  ["alert-dialog", "AlertDialogPortal", "AlertDialogRoot", "data-sw-alert-dialog-portal"],
  ["combobox", "ComboboxPortal", "ComboboxRoot", "data-sw-combobox-portal"],
  ["drawer", "DrawerPortal", "DrawerRoot", "data-sw-drawer-portal"],
  ["menu", "MenuPortal", "MenuRoot", "data-sw-menu-portal"],
  ["navigation-menu", "NavigationMenuPortal", "NavigationMenuRoot", "data-sw-nav-menu-portal"],
  ["popover", "PopoverPortal", "PopoverRoot", "data-sw-popover-portal"],
  ["preview-card", "PreviewCardPortal", "PreviewCardRoot", "data-sw-preview-card-portal"],
  ["select", "SelectPortal", "SelectRoot", "data-sw-select-portal"],
  ["tooltip", "TooltipPortal", "TooltipRoot", "data-sw-tooltip-portal"],
] as const;

export function defineReactPortalOutputTests(getTempRoot: GetTempRoot): void {
  it("projects every public Portal part through the isolated React portal helper", async () => {
    const outputRoot = path.join(getTempRoot(), "generated/primitives/react");

    await generateReactPrimitiveWrappers({
      outputDir: "generated/primitives/react",
      repoRoot: getTempRoot(),
    });

    const helper = await readGeneratedFile(outputRoot, "internal/portal.tsx");
    expect(compactCode(helper)).toContain(compactCode('import { createPortal } from "react-dom";'));
    expect(compactCode(helper)).toContain(compactCode("export type ReactPortalContainer ="));
    expect(compactCode(helper)).toContain(compactCode("React.RefObject<HTMLElement | null>"));
    expect(compactCode(helper)).toContain(compactCode("useIsomorphicLayoutEffect(() =>"));
    expect(compactCode(helper)).toContain(compactCode("const token = React.useId()"));
    expect(compactCode(helper)).toContain(compactCode("new Map<PortalToken, PortalRecord>()"));
    expect(compactCode(helper)).toContain(compactCode("export function useReactPortalScope"));
    expect(compactCode(helper)).toContain(
      compactCode("export function useReactPortalRuntimeLifecycle"),
    );
    expect(compactCode(helper)).toContain(
      compactCode("if (cleanupRef.current || !scopeRef.current.isReady()) return"),
    );
    expect(compactCode(helper)).toContain(
      compactCode('const [phase, setPhase] = React.useState<"inline" | "placed">'),
    );
    expect(compactCode(helper)).toContain(compactCode("records.some((record) => !record.ready)"));
    expect(compactCode(helper)).toContain(
      compactCode("Object.freeze({ authoredParent: record.authoredParent"),
    );
    expect(compactCode(helper)).toContain(
      compactCode("createPortal(wrapper, placement.target, token)"),
    );
    expect(compactCode(helper)).toContain(
      compactCode("const portalDocumentObservers = new WeakMap<"),
    );
    expect(compactCode(helper)).toContain(
      compactCode("observePortalDocument(wrapper.ownerDocument, refreshPlacement)"),
    );
    expect(compactCode(helper)).toContain(
      compactCode(
        "observer.observe(ownerDocument.documentElement, { childList: true, subtree: true })",
      ),
    );
    expect(compactCode(helper)).toContain(compactCode("cleanupRegistration?.()"));
    expect(compactCode(helper)).not.toContain(compactCode("usePortalRuntimeRemount"));
    // Error reporting in the shared observer must not change placement scheduling.
    expect(compactCode(helper.slice(helper.indexOf("export const ReactPortal =")))).not.toContain(
      compactCode("queueMicrotask("),
    );
    expect(compactCode(helper)).not.toContain(compactCode("append("));
    expect(compactCode(helper)).not.toContain(compactCode("setInterval("));
    expect(compactCode(helper)).not.toContain(compactCode("requestAnimationFrame("));

    for (const [family, component, rootComponent, discoveryAttribute] of portalFamilies) {
      const portal = await readGeneratedFile(outputRoot, `${family}/${component}.tsx`);
      const root = await readGeneratedFile(outputRoot, `${family}/${rootComponent}.tsx`);

      expect(compactCode(portal)).toContain(
        compactCode('import { ReactPortal, type ReactPortalProps } from "../internal/portal";'),
      );
      expect(portal).toContain(`export type ${component}Props = ReactPortalProps;`);
      expect(compactCode(portal)).toContain(compactCode(`<ReactPortal`));
      expect(portal).toContain(`discoveryAttribute="${discoveryAttribute}"`);
      expect(compactCode(portal)).toContain(
        compactCode("resolvePlacement={resolvePortalPlacement}"),
      );
      expect(compactCode(portal)).toContain(compactCode("reportPlacement={reportPortalPlacement}"));
      expect(compactCode(root)).toContain(compactCode("useReactPortalScope"));
      expect(compactCode(root)).toContain(compactCode('from "../internal/portal";'));
      expect(compactCode(root)).toContain(
        compactCode("useReactPortalScope(rootRef, createPortalBinding)"),
      );
      expect(compactCode(root)).toContain(compactCode("portalScope"));
      expect(compactCode(root)).toContain(compactCode("portalScope.isReady()"));
      expect(root).toMatch(/refresh\w+PortalSurface\((?:root|rootRef.current)\)/);
      expect(compactCode(root)).toContain(
        compactCode("<ReactPortalScopeProvider scope={portalScope}>"),
      );
      if (family === "combobox" || family === "select") {
        expect(compactCode(root)).toContain(compactCode("portalRuntimeActivation,"));
        expect(compactCode(root)).not.toContain(
          compactCode("useReactPortalRuntimeLifecycle(portalScope"),
        );
      } else {
        expect(compactCode(root)).toContain(
          compactCode("const initializePortalRuntime = React.useCallback"),
        );
        expect(compactCode(root)).toContain(
          compactCode("useReactPortalRuntimeLifecycle(portalScope, initializePortalRuntime)"),
        );
      }
    }

    const button = await readGeneratedFile(outputRoot, "button/ButtonRoot.tsx");
    expect(compactCode(button)).not.toContain(compactCode("internal/portal"));
    expect(compactCode(button)).not.toContain(compactCode("react-dom"));

    const tree = await readGeneratedTree(outputRoot);
    for (const [indexPath, index] of Object.entries(tree)) {
      if (!indexPath.endsWith("/index.ts")) continue;
      const namespaceBody = /const \w+ = \{([\s\S]*?)\n\};/.exec(index)?.[1];
      const rootName = /^\s*Root:\s*(\w+),$/m.exec(namespaceBody ?? "")?.[1];
      const portalName = /^\s*Portal:\s*(\w+),$/m.exec(namespaceBody ?? "")?.[1];
      if (!rootName || !portalName) continue;

      const rootImport = new RegExp(`import ${rootName} from "([^"]+)";`).exec(index)?.[1];
      expect(rootImport, `${indexPath} must import its public Root`).toBeDefined();
      const rootPath = path.posix.normalize(
        path.posix.join(path.posix.dirname(indexPath), `${rootImport}.tsx`),
      );
      const root = tree[rootPath];
      expect(root, `${rootPath} must exist`).toBeDefined();
      expect(root, `${rootPath} must scope its public Portal`).toContain("useReactPortalScope");
      expect(root, `${rootPath} must publish its public Portal scope`).toContain(
        "<ReactPortalScopeProvider scope={portalScope}>",
      );
    }
  });
}
