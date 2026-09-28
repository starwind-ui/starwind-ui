/** Percentage calculation shared by the native wrapper style serializers. */
export function aspectRatioPercentage(ratio = "ratio"): string {
  return `\${100 / ${ratio}}%`;
}
