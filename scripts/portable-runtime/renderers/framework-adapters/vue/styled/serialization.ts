export type VueSfcSections = {
  imports: string;
  options: string;
  props: string;
  setup: string;
  template: string;
};

export function serializeVueSfc(sections: VueSfcSections): string {
  return `<script setup lang="ts">\n${sections.imports}${sections.imports ? "\n\n" : ""}${sections.options}${sections.props}\n${sections.setup}\n</script>\n\n<template>\n${sections.template}\n</template>\n`;
}
