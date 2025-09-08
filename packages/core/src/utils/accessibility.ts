/**
 * Utility functions for accessibility features
 */

import GithubSlugger from "github-slugger";

const slugger = new GithubSlugger();

interface AccessibilityAttributes {
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-label"?: string;
  "aria-live"?: "polite";
  role?: "alert";
  [key: string]: string | undefined;
}

/**
 * Regex patterns for extracting HTML elements and their attributes
 */
const REGEX_PATTERNS = {
  // Matches heading elements (h1-h6) with id attribute - captures tag name and id value
  HEADING_WITH_ID: /<(h[1-6])(?:\s[^>]*)?id\s*=\s*["']([^"']+)["'][^>]*>/g,
  // Matches paragraph elements with id attribute - captures tag name and id value
  PARAGRAPH_WITH_ID: /<(p)(?:\s[^>]*)?id\s*=\s*["']([^"']+)["'][^>]*>/g,
  // Matches heading elements (h1-h6) with text content - captures tag name and text
  HEADING_WITH_TEXT: /<(h[1-6])(?:\s[^>]*)?[^>]*>([^<]+)<\/h[1-6]>/g,
  // Matches paragraph elements with text content - captures tag name and text
  PARAGRAPH_WITH_TEXT: /<(p)(?:\s[^>]*)?[^>]*>([^<]+)<\/p>/g,
  // Matches heading elements (h1-h6) for ID insertion - captures tag name and attributes
  HEADING_FOR_ID_INSERTION: /<(h[1-6])(?:\s[^>]*)?([^>]*)>/g,
  // Matches paragraph elements for ID insertion - captures tag name and attributes
  PARAGRAPH_FOR_ID_INSERTION: /<(p)(?:\s[^>]*)?([^>]*)>/g,
} as const;

/**
 * Extracts the first value from a regex pattern match in HTML content
 * @param html - The HTML content to search
 * @param pattern - The regex pattern to match
 * @param captureGroup - The capture group index to extract (default: 2)
 * @param shouldTrim - Whether to trim the extracted match (default: false)
 * @returns The extracted match from the regex pattern, or undefined if no match found
 */
function extractFirstMatch(
  html: string,
  pattern: RegExp,
  captureGroup: number = 2,
  shouldTrim: boolean = false,
): string | undefined {
  let extractedMatch: string | undefined;
  if (html) {
    const matches = html.matchAll(pattern);
    let foundMatch = false;
    for (const match of matches) {
      if (!foundMatch) {
        extractedMatch = match[captureGroup];
        if (shouldTrim && extractedMatch) {
          extractedMatch = extractedMatch.trim();
        }
        foundMatch = true;
      }
    }
  }
  return extractedMatch;
}

/**
 * Generates a new ID for an element based on its text content
 * @param elementText - The text content of the element
 * @param maxCharacters - The maximum number of characters to use for the ID
 * @returns A generated ID with the format "slugified-text"
 */
function generateElementID(elementText: string, maxCharacters: number = 6): string {
  return slugger.slug(elementText.slice(0, maxCharacters));
}

/**
 * Gets the ID for the first element of a specific type, generating one if needed
 * @param content - The HTML content
 * @param idPattern - The regex pattern for elements with IDs
 * @param textPattern - The regex pattern for elements with text
 * @returns The element ID, or undefined if no element found
 */
function getElementID(content: string, idPattern: RegExp, textPattern: RegExp): string | undefined {
  const existingID = extractFirstMatch(content, idPattern);
  let elementID: string | undefined;

  if (existingID) {
    elementID = existingID;
  } else {
    const elementText = extractFirstMatch(content, textPattern, 2, true);
    if (elementText) {
      elementID = generateElementID(elementText);
    }
  }

  return elementID;
}

/**
 * Adds an ID to the first element matching the pattern if it doesn't already have one
 * @param content - The HTML content
 * @param pattern - The regex pattern for elements to match
 * @param id - The ID to add
 * @returns The updated HTML content
 */
function addIDToFirstElement(content: string, pattern: RegExp, id: string): string {
  let updatedContent = content;
  const matches = content.matchAll(pattern);
  let foundTarget = false;

  for (const match of matches) {
    if (!foundTarget) {
      const tagName = match[1];
      const attributes = match[2];

      if (!attributes.includes("id=")) {
        const replacement = `<${tagName}${attributes} id="${id}">`;
        updatedContent = content.replace(match[0], replacement);
        foundTarget = true;
      }
    }
  }

  return updatedContent;
}

/**
 * Assigns heading-related aria attributes
 * @param accessibilityAttributes - The accessibility attributes object to modify
 * @param headingID - The heading element ID
 * @param existingProps - Existing HTML attributes to check for manual aria attributes
 */
function assignHeadingAttributes(
  accessibilityAttributes: AccessibilityAttributes,
  headingID: string | undefined,
  existingProps: AccessibilityAttributes,
): void {
  if (headingID && !(existingProps["aria-labelledby"] || existingProps["aria-label"])) {
    accessibilityAttributes["aria-labelledby"] = headingID;
    accessibilityAttributes["role"] = "alert";
    accessibilityAttributes["aria-live"] = "polite";
  }
}

/**
 * Assigns paragraph-related aria attributes
 * @param accessibilityAttributes - The accessibility attributes object to modify
 * @param paragraphID - The paragraph element ID
 * @param existingProps - Existing HTML attributes to check for manual aria attributes
 */
function assignParagraphAttributes(
  accessibilityAttributes: AccessibilityAttributes,
  paragraphID: string | undefined,
  existingProps: AccessibilityAttributes,
): void {
  if (paragraphID && !existingProps["aria-describedby"]) {
    accessibilityAttributes["aria-describedby"] = paragraphID;
  }
}

/**
 * Generates or extracts IDs for heading and paragraph elements, and assigns aria attributes
 * This function is designed to be used in Astro components
 * @param slotContent - The rendered slot content as a string
 * @param attributes - Existing HTML attributes to check for manual aria attributes
 * @returns An object with aria attributes and updated HTML content with generated IDs
 */
export function assignElementToFirstHeading(
  slotContent: string,
  attributes: AccessibilityAttributes = {},
): { attributes: AccessibilityAttributes; content: string } {
  const accessibilityAttributes: AccessibilityAttributes = {};
  let content = slotContent;

  if (slotContent?.length > 0) {
    const firstHeadingID = getElementID(
      slotContent,
      REGEX_PATTERNS.HEADING_WITH_ID,
      REGEX_PATTERNS.HEADING_WITH_TEXT,
    );
    const firstParagraphID = getElementID(
      slotContent,
      REGEX_PATTERNS.PARAGRAPH_WITH_ID,
      REGEX_PATTERNS.PARAGRAPH_WITH_TEXT,
    );

    if (firstHeadingID && !extractFirstMatch(slotContent, REGEX_PATTERNS.HEADING_WITH_ID)) {
      content = addIDToFirstElement(
        content,
        REGEX_PATTERNS.HEADING_FOR_ID_INSERTION,
        firstHeadingID,
      );
    }

    if (firstParagraphID && !extractFirstMatch(slotContent, REGEX_PATTERNS.PARAGRAPH_WITH_ID)) {
      content = addIDToFirstElement(
        content,
        REGEX_PATTERNS.PARAGRAPH_FOR_ID_INSERTION,
        firstParagraphID,
      );
    }

    assignHeadingAttributes(accessibilityAttributes, firstHeadingID, attributes);
    assignParagraphAttributes(accessibilityAttributes, firstParagraphID, attributes);
  }

  return { attributes: accessibilityAttributes, content };
}
