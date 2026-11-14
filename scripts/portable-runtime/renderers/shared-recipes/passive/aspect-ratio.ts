/** Native `aspect-ratio` value shared by the wrapper style serializers. */
export function aspectRatioValue(ratio = "ratio"): string {
  return `\${${ratio}}`;
}
