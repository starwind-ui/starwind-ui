export async function expectText(locator, expected) {
  const startedAt = Date.now();
  let actual;

  while (Date.now() - startedAt < 5000) {
    actual = (await locator.textContent())?.trim();
    if (actual === expected) return;

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Expected text ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`);
}
