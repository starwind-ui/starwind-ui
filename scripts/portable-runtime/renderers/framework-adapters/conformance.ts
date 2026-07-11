import type {
  AdapterOutputModel,
  AdapterPrintedFile,
  FrameworkAdapter,
} from "./types.js";

export function defineFrameworkAdapter<TAdapter extends FrameworkAdapter>(adapter: TAdapter): TAdapter {
  return adapter;
}

export function printAdapterOutput(
  adapter: FrameworkAdapter,
  model: AdapterOutputModel,
): AdapterPrintedFile[] {
  return adapter.printOutput(model);
}

export function printFrameworkAdapterConformanceFixture(
  adapter: FrameworkAdapter,
): AdapterPrintedFile[] {
  return printAdapterOutput(adapter, createFrameworkAdapterConformanceFixture());
}

export function createFrameworkAdapterConformanceFixture(): AdapterOutputModel {
  return {
    files: [
      {
        component: {
          context: [
            {
              name: "ConformanceContext",
              role: "provider",
              value: { code: "contextValue" },
            },
            {
              name: "ConformanceContext",
              role: "consumer",
              value: { code: "parentContext" },
            },
          ],
          defaults: [
            {
              prop: "value",
              value: { code: '"initial"' },
            },
          ],
          events: [
            {
              handlerProp: "onValueChange",
              runtimeEvent: "valuechange",
              targetPart: "root",
            },
          ],
          exports: {
            kind: "namespace",
            members: [{ from: "./ConformanceRoot", name: "ConformanceRoot" }],
            namespace: "Conformance",
          },
          imports: [
            {
              id: "runtime",
              kind: "value",
              members: [{ imported: "createConformance" }],
              source: "@starwind-ui/runtime/conformance",
            },
            {
              id: "helper",
              kind: "value",
              members: [{ imported: "normalizeConformanceValue" }],
              source: "./normalizeConformanceValue",
            },
          ],
          lifecycle: {
            cleanup: { code: "instance.destroy()" },
            factory: "createConformance",
            factoryImport: {
              id: "runtime",
              kind: "value",
              members: [{ imported: "createConformance" }],
              source: "@starwind-ui/runtime/conformance",
            },
            mount: { code: "createConformance(rootRef, options)" },
            options: [{ name: "value", source: "prop" }],
            rootRef: "rootRef",
          },
          name: "ConformanceRoot",
          portals: [
            {
              children: [
                {
                  attrs: [{ name: "data-slot", value: "overlay" }],
                  children: [{ kind: "slot", name: "overlay" }],
                  defaultElement: "div",
                  events: [],
                  kind: "element",
                  part: "overlay",
                  refs: [],
                },
              ],
              sourcePart: "overlay",
              target: "body",
            },
          ],
          props: [
            {
              attributes: [{ name: "data-value", value: { code: "value" } }],
              kind: "state",
              name: "value",
              type: "string",
            },
            {
              attributes: [{ name: "disabled", value: true }],
              kind: "boolean",
              name: "disabled",
              type: "boolean",
            },
            {
              kind: "string",
              name: "tone",
              type: '"neutral" | "strong"',
            },
          ],
          refs: [{ id: "rootRef", part: "root", public: true }],
          render: {
            attrs: [
              { name: "data-slot", value: "root" },
              { name: "aria-disabled", value: { code: "disabled ? 'true' : undefined" } },
            ],
            children: [{ kind: "slot" }],
            defaultElement: "button",
            events: [
              {
                handlerProp: "onValueChange",
                runtimeEvent: "valuechange",
                targetPart: "root",
              },
            ],
            kind: "element",
            part: "root",
            refs: [{ id: "rootRef", part: "root", public: true }],
          },
          stateSync: [
            {
              setter: "setValue",
              state: "value",
              valueProp: "value",
            },
          ],
          typeFacades: [
            {
              body: { code: "type ConformanceRootProps = AdapterProps" },
              exports: ["ConformanceRootProps"],
              name: "ConformanceRootProps",
            },
          ],
        },
        kind: "component",
        path: "conformance/ConformanceRoot",
      },
      {
        body: { code: "return value ?? 'initial';" },
        imports: [],
        kind: "helper",
        name: "normalizeConformanceValue",
        path: "conformance/normalizeConformanceValue.ts",
      },
      {
        exports: {
          kind: "namespace",
          members: [{ from: "./ConformanceRoot", name: "ConformanceRoot" }],
          namespace: "Conformance",
        },
        imports: [
          {
            id: "component",
            kind: "value",
            members: [{ imported: "ConformanceRoot" }],
            source: "./ConformanceRoot",
          },
        ],
        kind: "index",
        path: "conformance/index.ts",
        typeFacades: [
          {
            body: { code: "export type { ConformanceRootProps } from './ConformanceRoot';" },
            exports: ["ConformanceRootProps"],
            name: "ConformanceRootProps",
          },
        ],
      },
      {
        exports: {
          kind: "named",
          members: [{ from: "./ConformanceRoot", name: "ConformanceRootPublicTypes" }],
          namespace: "ConformanceRootTypes",
        },
        imports: [
          {
            id: "component-types",
            kind: "type",
            members: [{ imported: "ConformanceRootProps" }],
            source: "./ConformanceRoot",
          },
        ],
        kind: "type-facade",
        path: "conformance/types.ts",
        typeFacades: [
          {
            body: { code: "export type ConformanceRootPublicTypes = ConformanceRootProps;" },
            exports: ["ConformanceRootPublicTypes"],
            name: "ConformanceRootPublicTypes",
          },
        ],
      },
    ],
  };
}
