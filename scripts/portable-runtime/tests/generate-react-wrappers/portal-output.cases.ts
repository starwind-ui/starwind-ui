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
    expect(helper).toContain('import { createPortal } from "react-dom";');
    expect(helper).toContain("export type ReactPortalContainer =");
    expect(helper).toContain("React.RefObject<HTMLElement | null>");
    expect(helper).toContain("useIsomorphicLayoutEffect(() =>");
    expect(helper).toContain("const token = React.useId()");
    expect(helper).toContain("new Map<PortalToken, PortalRecord>()");
    expect(helper).toContain("export function useReactPortalScope");
    expect(helper).toContain("export function useReactPortalRuntimeLifecycle");
    expect(helper).toContain("if (cleanupRef.current || !scopeRef.current.isReady()) return");
    expect(helper).toContain('const [phase, setPhase] = React.useState<"inline" | "placed">');
    expect(helper).toContain("records.some((record) => !record.ready)");
    expect(helper).toContain("Object.freeze({ authoredParent: record.authoredParent");
    expect(helper).toContain("createPortal(wrapper, placement.target, token)");
    expect(helper).toContain("const observer = new MutationObserver(refreshPlacement)");
    expect(helper).toContain("observer.observe(mutationRoot, { childList: true, subtree: true })");
    expect(helper).toContain("cleanupRegistration?.()");
    expect(helper).not.toContain("usePortalRuntimeRemount");
    expect(helper).not.toContain("queueMicrotask(");
    expect(helper).not.toContain("append(");
    expect(helper).not.toContain("setInterval(");
    expect(helper).not.toContain("requestAnimationFrame(");

    for (const [family, component, rootComponent, discoveryAttribute] of portalFamilies) {
      const portal = await readGeneratedFile(outputRoot, `${family}/${component}.tsx`);
      const root = await readGeneratedFile(outputRoot, `${family}/${rootComponent}.tsx`);

      expect(portal).toContain(
        'import { ReactPortal, type ReactPortalProps } from "../internal/portal";',
      );
      expect(portal).toContain(`export type ${component}Props = ReactPortalProps;`);
      expect(portal).toContain(`<ReactPortal`);
      expect(portal).toContain(`discoveryAttribute="${discoveryAttribute}"`);
      expect(portal).toContain("resolvePlacement={resolvePortalPlacement}");
      expect(portal).toContain("reportPlacement={reportPortalPlacement}");
      expect(root).toContain("useReactPortalScope");
      expect(root).toContain('from "../internal/portal";');
      expect(root).toContain(
        "const portalScope = useReactPortalScope(rootRef, createPortalBinding)",
      );
      expect(root).toContain("const portalRuntimeActivation = portalScope.activation");
      expect(root).toContain("if (!portalScope.isReady()) return");
      expect(root).toContain("PortalSurface(root)");
      expect(root).toContain("<ReactPortalScopeProvider scope={portalScope}>");
      if (family === "combobox" || family === "select") {
        expect(root).toContain("portalRuntimeActivation,");
        expect(root).not.toContain("useReactPortalRuntimeLifecycle(portalScope");
      } else {
        expect(root).toContain("const initializePortalRuntime = React.useCallback");
        expect(root).toContain(
          "useReactPortalRuntimeLifecycle(portalScope, initializePortalRuntime)",
        );
      }
    }

    const button = await readGeneratedFile(outputRoot, "button/ButtonRoot.tsx");
    expect(button).not.toContain("internal/portal");
    expect(button).not.toContain("react-dom");

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
