export type VueSfcSections = {
  /** The `generic` attribute value of `<script setup>`, when the component is generic. */
  generic?: string;
  imports: string;
  options: string;
  props: string;
  setup: string;
  template: string;
};

export function serializeVueSfc(sections: VueSfcSections): string {
  if (sections.generic) return serializeGenericVueSfc(sections, sections.generic);
  return `<script setup lang="ts">\n${sections.imports}${sections.imports ? "\n\n" : ""}${sections.options}${sections.props}\n${sections.setup}\n</script>\n\n<template>\n${sections.template}\n</template>\n`;
}

/**
 * A generic `<script setup>` cannot export types, so the imports and the props types move to a
 * plain module script. Each props type declares its own parameters.
 */
function serializeGenericVueSfc(sections: VueSfcSections, generic: string): string {
  return `<script lang="ts">\n${sections.imports}${sections.imports ? "\n\n" : ""}${sections.props}\n</script>\n\n<script setup lang="ts" generic="${generic}">\n${sections.options}${sections.setup}\n</script>\n\n<template>\n${sections.template}\n</template>\n`;
}
