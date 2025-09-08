import type { AlertVariant } from "@starwind-ui/core/components/alert/Alert.astro";
import Alert from "@starwind-ui/core/components/alert/Alert.astro";
import { ALERT_VARIANT_KEYS } from "@starwind-ui/core/components/alert/Alert.astro";
import AlertDescription from "@starwind-ui/core/components/alert/AlertDescription.astro";
import AlertTitle from "@starwind-ui/core/components/alert/AlertTitle.astro";
import {
  type ContainerRenderOptions,
  experimental_AstroContainer as AstroContainer,
} from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";

function expectAlertToHaveSemanticStructure(html: string) {
  expect(html).toContain("<div");
  expect(html).toContain("class=");
  expect(html).toContain("rounded-lg");
  expect(html).toContain("border");
  expect(html).toContain("p-4");
}

function expectAlertToHaveAccessibilityAttributes(
  html: string,
  titleID: string,
  descriptionID: string,
) {
  expect(html).toContain(`aria-labelledby="${titleID}"`);
  expect(html).toContain(`aria-describedby="${descriptionID}"`);
  expect(html).toContain('role="alert"');
  expect(html).toContain('aria-live="polite"');
}

function expectAlertToContainContent(html: string, ...content: string[]) {
  content.forEach(function assertAlertContainsContent(text) {
    expect(html).toContain(text);
  });
}

function expectGeneratedIDsToBeBasedOnContent(
  html: string,
  headingID: string,
  paragraphID: string,
) {
  expect(html).toContain(`id="${headingID}"`);
  expect(html).toContain(`id="${paragraphID}"`);
}

function expectGeneratedIDsToBeUsedForAriaAttributes(
  html: string,
  headingID: string,
  paragraphID: string,
) {
  expect(html).toContain(`aria-labelledby="${headingID}"`);
  expect(html).toContain(`aria-describedby="${paragraphID}"`);
  expect(html).toContain('role="alert"');
  expect(html).toContain('aria-live="polite"');
}

function expectGeneratedHeadingIDToBeUnique(html: string, headingID: string) {
  expect(html).toContain(`id="${headingID}"`);
}

function expectGeneratedHeadingIDToBeUsedForAriaLabelledBy(html: string, headingID: string) {
  expect(html).toContain(`aria-labelledby="${headingID}"`);
  expect(html).toContain('role="alert"');
  expect(html).toContain('aria-live="polite"');
}

function expectAlertToNotHaveAriaDescribedBy(html: string) {
  expect(html).not.toContain("aria-describedby");
}

function expectExistingHeadingIDToBePreserved(html: string, headingID: string) {
  expect(html).toContain(`id="${headingID}"`);
}

function expectGeneratedParagraphIDToBeUnique(html: string, paragraphID: string) {
  expect(html).toContain(`id="${paragraphID}"`);
}

function expectExistingHeadingIDToBeUsedForAriaLabelledBy(html: string, headingID: string) {
  expect(html).toContain(`aria-labelledby="${headingID}"`);
}

function expectGeneratedParagraphIDToBeUsedForAriaDescribedBy(html: string, paragraphID: string) {
  expect(html).toContain(`aria-describedby="${paragraphID}"`);
}

const ALERT_TEST_CONTENT = {
  IMPORTANT_NOTICE: "Important Notice",
  IMPORTANT_MESSAGE: "This is an important message.",
  WARNING: "Warning",
  CUSTOM_ALERT_LABEL: "Custom alert label",
  CUSTOM_TITLE: "custom-title",
  CUSTOM_DESCRIPTION: "custom-description",
  COMPLETE_ALERT: "Complete Alert",
  COMPLETE_DESCRIPTION: "This is a complete alert with both title and description.",
  ERROR_OCCURRED: "Error Occurred",
  ERROR_MESSAGE: "Something went wrong. Please try again.",
  ACCESSIBILITY_TEST: "Accessibility Test",
  ACCESSIBILITY_DESCRIPTION: "Testing proper accessibility structure.",
  ALERT_TITLE_TEXT: "Alert Title Text",
  ALERT_DESCRIPTION_CONTENT: "Alert description content goes here",
  CHECK_INPUT: "Check your input",
  VERIFY_CONNECTION: "Verify your connection",
  GENERATED_HEADING: "Generated Heading",
  GENERATED_PARAGRAPH: "This is a generated paragraph.",
} as const;

const TEST_IDS = {
  ALERT_TITLE: "alert-title",
  ALERT_DESCRIPTION: "alert-description",
  WARNING_TITLE: "warning-title",
  COMPLETE_TITLE: "complete-title",
  COMPLETE_DESCRIPTION: "complete-description",
  ERROR_TITLE: "error-title",
  ERROR_DESCRIPTION: "error-description",
  ACCESSIBILITY_TITLE: "accessibility-title",
  ACCESSIBILITY_DESCRIPTION: "accessibility-description",
} as const;

interface AlertComponentProps {
  variant?: AlertVariant;
  class?: string;
  id?: string;
  "data-testid"?: string;
}

type AlertRenderOptions = ContainerRenderOptions & AlertComponentProps;

describe("Alert Component Integration Tests", function describeAlertComponentIntegrationTests() {
  let container: AstroContainer;

  beforeAll(async function setupContainer() {
    container = await AstroContainer.create();
  });

  describe("Alert Component Variants", function describeAlertVariantRendering() {
    ALERT_VARIANT_KEYS.forEach(function testEachAlertVariant(variant) {
      it(`should not render ${variant} variant when empty`, async function testAlertVariantRendering() {
        const renderedHTML = await container.renderToString(Alert, {
          variant: variant,
        } as AlertRenderOptions);

        expect(renderedHTML).toBe("");
      });
    });
  });

  describe("Alert Accessibility Features", function describeAlertAccessibilityBehavior() {
    it("should not render alert when no slot content", async function testEmptyAlertAccessibility() {
      const emptyAlertHTML = await container.renderToString(Alert);

      expect(emptyAlertHTML).toBe("");
    });

    it("should render alert with accessibility attributes when heading is present", async function testAlertWithHeadingAccessibility() {
      const headingSlotContent = `<h2 id="${TEST_IDS.ALERT_TITLE}">${ALERT_TEST_CONTENT.IMPORTANT_NOTICE}</h2><p id="${TEST_IDS.ALERT_DESCRIPTION}">${ALERT_TEST_CONTENT.IMPORTANT_MESSAGE}</p>`;
      const alertWithHeadingHTML = await container.renderToString(Alert, {
        slots: {
          default: headingSlotContent,
        },
      } as AlertRenderOptions);

      expect(alertWithHeadingHTML).toContain(`aria-labelledby="${TEST_IDS.ALERT_TITLE}"`);
      expect(alertWithHeadingHTML).toContain(`aria-describedby="${TEST_IDS.ALERT_DESCRIPTION}"`);
      expect(alertWithHeadingHTML).toContain('role="alert"');
      expect(alertWithHeadingHTML).toContain('aria-live="polite"');
      expect(alertWithHeadingHTML).toContain(ALERT_TEST_CONTENT.IMPORTANT_NOTICE);
      expect(alertWithHeadingHTML).toContain(ALERT_TEST_CONTENT.IMPORTANT_MESSAGE);
    });

    it("should render alert with only heading accessibility when no paragraph is present", async function testAlertWithHeadingOnlyAccessibility() {
      const headingOnlySlotContent = `<h3 id="${TEST_IDS.WARNING_TITLE}">${ALERT_TEST_CONTENT.WARNING}</h3>`;
      const alertWithHeadingOnlyHTML = await container.renderToString(Alert, {
        slots: {
          default: headingOnlySlotContent,
        },
      } as AlertRenderOptions);

      expect(alertWithHeadingOnlyHTML).toContain(`aria-labelledby="${TEST_IDS.WARNING_TITLE}"`);
      expect(alertWithHeadingOnlyHTML).toContain('role="alert"');
      expect(alertWithHeadingOnlyHTML).toContain('aria-live="polite"');
      expect(alertWithHeadingOnlyHTML).not.toContain("aria-describedby");
      expect(alertWithHeadingOnlyHTML).toContain(ALERT_TEST_CONTENT.WARNING);
    });

    it("should render alert with proper structure for accessibility", async function testAlertAccessibilityStructure() {
      const accessibilitySlotContent = `<h2 id="${TEST_IDS.ACCESSIBILITY_TITLE}">${ALERT_TEST_CONTENT.ACCESSIBILITY_TEST}</h2><p id="${TEST_IDS.ACCESSIBILITY_DESCRIPTION}">${ALERT_TEST_CONTENT.ACCESSIBILITY_DESCRIPTION}</p>`;
      const alertWithAccessibilityHTML = await container.renderToString(Alert, {
        slots: {
          default: accessibilitySlotContent,
        },
      } as AlertRenderOptions);

      expectAlertToHaveSemanticStructure(alertWithAccessibilityHTML);
      expectAlertToHaveAccessibilityAttributes(
        alertWithAccessibilityHTML,
        TEST_IDS.ACCESSIBILITY_TITLE,
        TEST_IDS.ACCESSIBILITY_DESCRIPTION,
      );
      expectAlertToContainContent(
        alertWithAccessibilityHTML,
        ALERT_TEST_CONTENT.ACCESSIBILITY_TEST,
        ALERT_TEST_CONTENT.ACCESSIBILITY_DESCRIPTION,
      );
    });

    it("should not assign aria-labelledby when manual aria-label is provided", async function testAlertWithManualAriaLabel() {
      const manualLabelSlotContent = `<h2 id="${TEST_IDS.ALERT_TITLE}">${ALERT_TEST_CONTENT.IMPORTANT_NOTICE}</h2><p id="${TEST_IDS.ALERT_DESCRIPTION}">${ALERT_TEST_CONTENT.IMPORTANT_MESSAGE}</p>`;
      const alertWithManualLabelHTML = await container.renderToString(Alert, {
        props: {
          "aria-label": ALERT_TEST_CONTENT.CUSTOM_ALERT_LABEL,
        },
        slots: {
          default: manualLabelSlotContent,
        },
      } as AlertRenderOptions);

      expect(alertWithManualLabelHTML).toContain(
        `aria-label="${ALERT_TEST_CONTENT.CUSTOM_ALERT_LABEL}"`,
      );
      expect(alertWithManualLabelHTML).not.toContain(`aria-labelledby="${TEST_IDS.ALERT_TITLE}"`);
      expect(alertWithManualLabelHTML).not.toContain('role="alert"');
      expect(alertWithManualLabelHTML).not.toContain('aria-live="polite"');
      expect(alertWithManualLabelHTML).toContain(
        `aria-describedby="${TEST_IDS.ALERT_DESCRIPTION}"`,
      );
    });

    it("should not assign aria-labelledby when manual aria-labelledby is provided", async function testAlertWithManualAriaLabelledBy() {
      const manualLabelledBySlotContent = `<h2 id="${TEST_IDS.ALERT_TITLE}">${ALERT_TEST_CONTENT.IMPORTANT_NOTICE}</h2><p id="${TEST_IDS.ALERT_DESCRIPTION}">${ALERT_TEST_CONTENT.IMPORTANT_MESSAGE}</p>`;
      const alertWithManualLabelledByHTML = await container.renderToString(Alert, {
        props: {
          "aria-labelledby": ALERT_TEST_CONTENT.CUSTOM_TITLE,
        },
        slots: {
          default: manualLabelledBySlotContent,
        },
      } as AlertRenderOptions);

      expect(alertWithManualLabelledByHTML).toContain(
        `aria-labelledby="${ALERT_TEST_CONTENT.CUSTOM_TITLE}"`,
      );
      expect(alertWithManualLabelledByHTML).not.toContain(
        `aria-labelledby="${TEST_IDS.ALERT_TITLE}"`,
      );
      expect(alertWithManualLabelledByHTML).not.toContain('role="alert"');
      expect(alertWithManualLabelledByHTML).not.toContain('aria-live="polite"');
      expect(alertWithManualLabelledByHTML).toContain(
        `aria-describedby="${TEST_IDS.ALERT_DESCRIPTION}"`,
      );
    });

    it("should not assign aria-describedby when manual aria-describedby is provided", async function testAlertWithManualAriaDescribedBy() {
      const alertWithManualDescribedByHTML = await container.renderToString(Alert, {
        props: {
          "aria-describedby": "custom-description",
        },
        slots: {
          default:
            '<h2 id="alert-title">Important Notice</h2><p id="alert-description">This is an important message.</p>',
        },
      } as AlertRenderOptions);

      expect(alertWithManualDescribedByHTML).toContain('aria-labelledby="alert-title"');
      expect(alertWithManualDescribedByHTML).toContain('aria-describedby="custom-description"');
      expect(alertWithManualDescribedByHTML).not.toContain('aria-describedby="alert-description"');
      expect(alertWithManualDescribedByHTML).toContain('role="alert"');
      expect(alertWithManualDescribedByHTML).toContain('aria-live="polite"');
    });

    it("should generate IDs for heading and paragraph elements when they don't exist", async function testAlertWithGeneratedIDs() {
      const contentWithoutIDs = `<h2>${ALERT_TEST_CONTENT.GENERATED_HEADING}</h2><p>${ALERT_TEST_CONTENT.GENERATED_PARAGRAPH}</p>`;
      const alertWithGeneratedIDsHTML = await container.renderToString(Alert, {
        slots: {
          default: contentWithoutIDs,
        },
      } as AlertRenderOptions);

      expectGeneratedIDsToBeBasedOnContent(alertWithGeneratedIDsHTML, "genera", "this-i");
      expectGeneratedIDsToBeUsedForAriaAttributes(alertWithGeneratedIDsHTML, "genera", "this-i");
      expectAlertToContainContent(
        alertWithGeneratedIDsHTML,
        ALERT_TEST_CONTENT.GENERATED_HEADING,
        ALERT_TEST_CONTENT.GENERATED_PARAGRAPH,
      );
    });

    it("should generate ID for heading only when paragraph doesn't exist", async function testAlertWithGeneratedHeadingIDOnly() {
      const headingOnlyContent = `<h3>${ALERT_TEST_CONTENT.GENERATED_HEADING}</h3>`;
      const alertWithGeneratedHeadingHTML = await container.renderToString(Alert, {
        slots: {
          default: headingOnlyContent,
        },
      } as AlertRenderOptions);

      expectGeneratedHeadingIDToBeUnique(alertWithGeneratedHeadingHTML, "genera-1");
      expectGeneratedHeadingIDToBeUsedForAriaLabelledBy(alertWithGeneratedHeadingHTML, "genera-1");
      expectAlertToNotHaveAriaDescribedBy(alertWithGeneratedHeadingHTML);
      expectAlertToContainContent(
        alertWithGeneratedHeadingHTML,
        ALERT_TEST_CONTENT.GENERATED_HEADING,
      );
    });

    it("should not override existing IDs when generating new ones", async function testAlertPreservesExistingIDs() {
      const contentWithExistingIDs = `<h2 id="${TEST_IDS.ALERT_TITLE}">${ALERT_TEST_CONTENT.IMPORTANT_NOTICE}</h2><p>${ALERT_TEST_CONTENT.GENERATED_PARAGRAPH}</p>`;
      const alertWithMixedIDsHTML = await container.renderToString(Alert, {
        slots: {
          default: contentWithExistingIDs,
        },
      } as AlertRenderOptions);

      expectExistingHeadingIDToBePreserved(alertWithMixedIDsHTML, TEST_IDS.ALERT_TITLE);
      expectGeneratedParagraphIDToBeUnique(alertWithMixedIDsHTML, "this-i-1");
      expectExistingHeadingIDToBeUsedForAriaLabelledBy(alertWithMixedIDsHTML, TEST_IDS.ALERT_TITLE);
      expectGeneratedParagraphIDToBeUsedForAriaDescribedBy(alertWithMixedIDsHTML, "this-i-1");
      expectAlertToContainContent(
        alertWithMixedIDsHTML,
        ALERT_TEST_CONTENT.IMPORTANT_NOTICE,
        ALERT_TEST_CONTENT.GENERATED_PARAGRAPH,
      );
    });
  });

  describe("AlertTitle Component", function describeAlertTitleRendering() {
    it("should render AlertTitle with correct structure", async function testAlertTitleStructure() {
      const titleHTML = await container.renderToString(AlertTitle);

      expect(titleHTML).toContain("<h5");
      expect(titleHTML).toContain("class=");
      expect(titleHTML).toContain("mb-2");
      expect(titleHTML).toContain("flex");
      expect(titleHTML).toContain("items-center");
      expect(titleHTML).toContain("gap-2");
      expect(titleHTML).toContain("text-lg");
      expect(titleHTML).toContain("font-medium");
    });

    it("should render AlertTitle with slot content", async function testAlertTitleWithSlot() {
      const alertTitleText = ALERT_TEST_CONTENT.ALERT_TITLE_TEXT;
      const titleWithSlotHTML = await container.renderToString(AlertTitle, {
        slots: {
          default: alertTitleText,
        },
      });

      expect(titleWithSlotHTML).toContain("<h5");
      expect(titleWithSlotHTML).toContain(alertTitleText);
    });
  });

  describe("AlertDescription Component", function describeAlertDescriptionRendering() {
    it("should render AlertDescription with correct structure", async function testAlertDescriptionStructure() {
      const descriptionHTML = await container.renderToString(AlertDescription);

      expect(descriptionHTML).toContain("<div");
      expect(descriptionHTML).toContain("class=");
      expect(descriptionHTML).toContain("leading-relaxed");
    });

    it("should render AlertDescription with slot content", async function testAlertDescriptionWithSlot() {
      const descriptionWithSlotHTML = await container.renderToString(AlertDescription, {
        slots: {
          default: "Alert description content goes here",
        },
      });

      expect(descriptionWithSlotHTML).toContain("<div");
      expect(descriptionWithSlotHTML).toContain("class=");
      expect(descriptionWithSlotHTML).toContain("leading-relaxed");
      expect(descriptionWithSlotHTML).toContain("Alert description content goes here");
    });
  });

  describe("Alert Component Composition", function describeAlertCompositionPatterns() {
    it("should render complete alert with title and description", async function testCompleteAlertComposition() {
      const completeAlertHTML = await container.renderToString(Alert, {
        slots: {
          default:
            '<h2 id="complete-title">Complete Alert</h2><p id="complete-description">This is a complete alert with both title and description.</p>',
        },
      } as AlertRenderOptions);

      expect(completeAlertHTML).toContain("<div");
      expect(completeAlertHTML).toContain("class=");
      expect(completeAlertHTML).toContain("rounded-lg");
      expect(completeAlertHTML).toContain("border");
      expect(completeAlertHTML).toContain("p-4");
      expect(completeAlertHTML).toContain('aria-labelledby="complete-title"');
      expect(completeAlertHTML).toContain('aria-describedby="complete-description"');
      expect(completeAlertHTML).toContain('role="alert"');
      expect(completeAlertHTML).toContain("Complete Alert");
      expect(completeAlertHTML).toContain("complete alert with both title and description");
    });

    it("should handle complex nested content with accessibility", async function testComplexNestedContent() {
      const complexAlertHTML = await container.renderToString(Alert, {
        variant: "error",
        slots: {
          default:
            '<h3 id="error-title">Error Occurred</h3><p id="error-description">Something went wrong. Please try again.</p><ul><li>Check your input</li><li>Verify your connection</li></ul>',
        },
      } as AlertRenderOptions);

      expect(complexAlertHTML).toContain("<div");
      expect(complexAlertHTML).toContain("class=");
      expect(complexAlertHTML).toContain("rounded-lg");
      expect(complexAlertHTML).toContain("border");
      expect(complexAlertHTML).toContain("p-4");
      expect(complexAlertHTML).toContain('aria-labelledby="error-title"');
      expect(complexAlertHTML).toContain('aria-describedby="error-description"');
      expect(complexAlertHTML).toContain('role="alert"');
      expect(complexAlertHTML).toContain("Error Occurred");
      expect(complexAlertHTML).toContain("Something went wrong");
      expect(complexAlertHTML).toContain("<ul>");
      expect(complexAlertHTML).toContain("<li>");
    });

    it("should not render when empty", async function testEmptyContentHandling() {
      const emptyContentHTML = await container.renderToString(Alert);

      expect(emptyContentHTML).toBe("");
    });
  });

  describe("Alert Component Props", function describeAlertPropsHandling() {
    it("should not render Alert when empty", async function testAlertBasicStructure() {
      const alertStructureHTML = await container.renderToString(Alert);

      expect(alertStructureHTML).toBe("");
    });

    it("should not render Alert with different variants when empty", async function testAlertVariantRendering() {
      const successVariantHTML = await container.renderToString(Alert, {
        variant: "success",
      } as AlertRenderOptions);

      expect(successVariantHTML).toBe("");
    });
  });
});
