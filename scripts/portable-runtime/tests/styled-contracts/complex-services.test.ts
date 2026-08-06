import { describe, expect, it } from "vitest";

import { carouselStyledContract } from "../../contracts/styled/components/carousel.js";
import { colorPickerStyledContract } from "../../contracts/styled/components/color-picker.js";
import { sidebarStyledContract } from "../../contracts/styled/components/sidebar.js";
import { toastStyledContract } from "../../contracts/styled/components/toast.js";

describe("Vue complex-services Styled contracts", () => {
  it("exposes Carousel engine options and API delivery to Vue", () => {
    const root = carouselStyledContract.components.find(
      ({ exportName }) => exportName === "Carousel",
    );
    expect(root).toBeDefined();
    const renderedRoot = root?.render[0];
    expect(renderedRoot?.type).toBe("primitive");

    for (const name of ["plugins", "setApi"]) {
      expect(
        root?.props?.fields?.find((field) => field.name === name),
        `field ${name}`,
      ).toSatisfy(supportsVue);
      expect(
        root?.destructure?.props.find((prop) => prop.name === name),
        `destructure ${name}`,
      ).toSatisfy(supportsVue);
      expect(
        renderedRoot?.type === "primitive"
          ? renderedRoot.attrs?.find((attribute) => attribute.name === name)
          : undefined,
        `binding ${name}`,
      ).toSatisfy(supportsVue);
    }
  });

  it("exposes Sidebar controlled state and Vue-safe styles", () => {
    const provider = sidebarStyledContract.components.find(
      ({ exportName }) => exportName === "SidebarProvider",
    );
    const sidebar = sidebarStyledContract.components.find(
      ({ exportName }) => exportName === "Sidebar",
    );
    expect(provider).toBeDefined();
    expect(sidebar).toBeDefined();

    for (const name of ["open", "mobileOpen", "onOpenChange", "onMobileOpenChange"]) {
      expect(
        provider?.props?.fields?.find((field) => field.name === name),
        `field ${name}`,
      ).toSatisfy(supportsVue);
      expect(
        provider?.destructure?.props.find((prop) => prop.name === name),
        `destructure ${name}`,
      ).toSatisfy(supportsVue);
    }

    expect(
      provider?.variables?.find(
        ({ name, frameworks }) => name === "providerStyle" && frameworks?.includes("vue"),
      ),
      "providerStyle",
    ).toSatisfy(supportsVue);
    expect(
      sidebar?.variables?.find(
        ({ name, frameworks }) => name === "mobileStyle" && frameworks?.includes("vue"),
      ),
      "mobileStyle",
    ).toSatisfy(supportsVue);
  });

  it("exposes Color Picker value, open state, and detailed events to Vue", () => {
    expect(colorPickerStyledContract.frameworks).toContain("vue");
    const root = colorPickerStyledContract.components.find(
      ({ exportName }) => exportName === "ColorPicker",
    );
    expect(root).toBeDefined();
    for (const name of [
      "value",
      "open",
      "onValueChange",
      "onValueCommitted",
      "onFormatChange",
      "onOpenChange",
      "onCloseComplete",
    ]) {
      expect(
        root?.props?.fields?.find((field) => field.name === name),
        `field ${name}`,
      ).toSatisfy(supportsVue);
      expect(
        root?.destructure?.props.find((prop) => prop.name === name),
        `destructure ${name}`,
      ).toSatisfy(supportsVue);
    }
  });

  it("provides a Vue-safe Toast viewport style projection", () => {
    const toaster = toastStyledContract.components.find(
      ({ exportName }) => exportName === "Toaster",
    );
    expect(toaster).toBeDefined();
    expect(
      toaster?.variables?.find(
        ({ name, frameworks }) => name === "viewportStyle" && frameworks?.includes("vue"),
      ),
    ).toBeDefined();
  });
});

function supportsVue(value: { frameworks?: readonly string[] } | undefined): boolean {
  return Boolean(value && (!value.frameworks || value.frameworks.includes("vue")));
}
