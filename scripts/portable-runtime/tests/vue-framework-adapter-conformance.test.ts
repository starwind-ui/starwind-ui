import { compileScript, compileTemplate, parse } from "@vue/compiler-sfc";
import { describe, expect, it } from "vitest";
import {
  printFrameworkAdapterConformanceFixture,
  vueFrameworkAdapter,
  vueFrameworkAdapterReadiness,
} from "../renderers/framework-adapters/index.js";
import { vueAdapterPublicContract } from "../renderers/framework-adapters/vue/index.js";

function printConformanceComponent(): string {
  const component = printFrameworkAdapterConformanceFixture(vueFrameworkAdapter).find((file) =>
    file.path.endsWith("/ConformanceRoot.vue"),
  );
  if (!component) throw new Error("Vue conformance output must include ConformanceRoot.vue.");
  return component.contents;
}

describe("Vue Framework Adapter conformance projection", () => {
  it("projects the typed model and synchronous cancellation contract in the approved order", () => {
    const source = printConformanceComponent();

    expect(source).toContain("modelValue?: string;");
    expect(source).toContain("defaultValue?: string;");
    expect(source).toContain("valueChange: [value: string, detail: VueChangeDetail<string>];");
    expect(source).toContain('"update:modelValue": [value: string];');

    const detailedEmit = source.indexOf('emit("valueChange", value, detail);');
    const cancellation = source.indexOf("if (detail.isCanceled) return;");
    const acceptance = source.indexOf("uncontrolledValue.value = value;");
    const modelUpdate = source.indexOf('emit("update:modelValue", value);');
    expect(detailedEmit).toBeGreaterThan(-1);
    expect(detailedEmit).toBeLessThan(cancellation);
    expect(cancellation).toBeLessThan(acceptance);
    expect(acceptance).toBeLessThan(modelUpdate);
    expect(source).not.toContain("detail.defaultPrevented");
    expect(source).not.toContain("onValueChange?:");
    expect(source).not.toContain('emit("valueChange", event);');
  });

  it("forwards attrs once, preserves lazy slots, and enforces strict native asChild composition", () => {
    const source = printConformanceComponent();

    expect(source).toContain("defineOptions({ inheritAttrs: false });");
    expect(source.match(/v-bind="\$attrs"/g)).toHaveLength(1);
    expect(source).toContain("const children = slots.default?.() ?? [];");
    expect(source).toContain('typeof value.type === "string"');
    expect(source).toContain(
      'throw new TypeError("ConformanceRoot asChild requires exactly one native element VNode.")',
    );
    expect(source).toContain("mergeProps(defaultedProps, consumerProps, protectedProps)");
    expect(source).toContain(
      "cloneVNode(child, mergeProps(defaultedProps, consumerProps, protectedProps), true)",
    );
    expect(source).toContain("ref: setRootElement");
    expect(source).toContain("type ComponentPublicInstance,");
    expect(source).toContain("const rootRef = ref<HTMLElement | null>(null);");
    expect(source).toContain(
      "function setRootElement(element: Element | ComponentPublicInstance | null): void {",
    );
    expect(source).toContain("rootRef.value = element instanceof HTMLElement ? element : null;");
    expect(source).not.toContain("element as HTMLElement");
    expect(source).not.toContain("child.ref");
  });

  it("projects every typed context role and exposes only the contracted semantic element", () => {
    const source = printConformanceComponent();

    expect(source).toContain(
      'const ConformanceContextKey: InjectionKey<ConformanceContextValue> = Symbol("StarwindConformanceContext");',
    );
    expect(source).toContain(
      "const contextValue: ConformanceContextValue = { value: renderedValue };",
    );
    expect(source).toContain("provide(ConformanceContextKey, contextValue);");
    expect(source).toContain("const parentContext = inject(ConformanceContextKey);");
    expect(source).toContain("if (!parentContext)");
    expect(source).toContain("must be used within a ConformanceContext provider");
    expect(source).toContain("defineExpose({\n  element: rootRef,\n});");
    const exposeStart = source.indexOf("defineExpose({");
    const exposedBlock = source.slice(exposeStart, source.indexOf("});", exposeStart) + 3);
    expect(exposedBlock).toBe("defineExpose({\n  element: rootRef,\n});");
  });

  it("keeps setup browser-free, owns the mounted controller, and delays Teleport activation", () => {
    const source = printConformanceComponent();
    const mountStart = source.indexOf("onMounted(() => {");
    const construction = source.indexOf("const createdInstance = createConformance(");

    expect(construction).toBeGreaterThan(mountStart);
    expect(source.slice(0, mountStart)).not.toContain("createConformance(");
    expect(source).toContain("const ownedInstance = instance;");
    expect(source).toContain("ownedInstance.destroy();");
    expect(source).toContain("if (instance === ownedInstance) instance = undefined;");
    expect(source).toContain("mounted.value = false;");
    expect(source).toContain(`:to="props.container ?? 'body'"`);
    expect(source).toContain(':disabled="props.disabled || !mounted"');
    expect(source).not.toContain('<Teleport to="body">');
    expect(source).not.toMatch(/\b(window|document)\b/);
  });

  it("synchronizes controlled state only after mount, skips equal values, and suppresses emission", () => {
    const source = printConformanceComponent();

    expect(source).toContain(
      "if (value === undefined || !instance || Object.is(value, lastRuntimeValue)) return;",
    );
    expect(source).toContain("instance.setValue(value, { emit: false });");
    expect(source).toContain('const uncontrolledValue = ref<string>(props.defaultValue ?? "");');
    expect(source).not.toContain("watchEffect");
  });

  it("compiles the generated script and template without mounting or browser dependencies", () => {
    const source = printConformanceComponent();
    const parsed = parse(source, { filename: "ConformanceRoot.vue" });

    expect(parsed.errors).toEqual([]);
    expect(() => compileScript(parsed.descriptor, { id: "vue-conformance" })).not.toThrow();
    const template = compileTemplate({
      filename: "ConformanceRoot.vue",
      id: "vue-conformance",
      source: parsed.descriptor.template?.content ?? "",
    });
    expect(template.errors).toEqual([]);
  });

  it("keeps Vue Tier 0 with every public-support flag unchanged", () => {
    expect(vueFrameworkAdapterReadiness.publicSupport).toBe(vueAdapterPublicContract.publicSupport);
    expect(vueFrameworkAdapterReadiness.publicSupport).toEqual({
      cliRegistry: false,
      demoIntegration: false,
      packageExports: false,
      publicDocsClaim: false,
      status: "non-shipping-tracer",
    });
  });
});
