export async function verifyAstroAvatarLazyImageCase({ page, baseUrl, serverMode }) {
  await page.goto(new URL("/smoke/avatar-lazy-image/", baseUrl).toString(), {
    waitUntil: serverMode === "dev" ? "domcontentloaded" : "networkidle",
  });
  await page.getByRole("heading", { name: "Avatar lazy image smoke fixture" }).waitFor();

  const eagerRoot = page.locator("#avatar-eager-url");
  const eagerImage = eagerRoot.locator('[data-slot="avatar-image"]');
  await page.waitForFunction(
    () =>
      document.querySelector("#avatar-eager-url")?.getAttribute("data-image-loading-status") ===
      "loaded",
  );
  if ((await eagerImage.getAttribute("loading")) !== "eager") {
    throw new Error("Avatar URL image did not preserve an explicit eager loading policy.");
  }

  const errorRoot = page.locator("#avatar-error");
  await page.waitForFunction(
    () =>
      document.querySelector("#avatar-error")?.getAttribute("data-image-loading-status") ===
      "error",
  );
  const errorState = await errorRoot.evaluate((root) => {
    const image = root.querySelector('[data-slot="avatar-image"]');
    const fallback = root.querySelector('[data-slot="avatar-fallback"]');
    return {
      fallbackHidden: fallback instanceof HTMLElement ? fallback.hidden : null,
      imageHidden: image instanceof HTMLImageElement ? image.hidden : null,
      imageVisibility: image instanceof HTMLElement ? image.style.visibility : null,
    };
  });
  if (
    errorState.fallbackHidden !== false ||
    errorState.imageHidden !== false ||
    errorState.imageVisibility !== "hidden"
  ) {
    throw new Error(`Avatar error state drifted: ${JSON.stringify(errorState)}.`);
  }

  const lazyRoot = page.locator("#avatar-lazy-imported");
  const lazyImage = lazyRoot.locator('[data-slot="avatar-image"]');
  const initialState = await lazyImage.evaluate((image) => ({
    hidden: image instanceof HTMLImageElement ? image.hidden : null,
    loading: image instanceof HTMLImageElement ? image.loading : null,
    objectPosition: image instanceof HTMLElement ? image.style.objectPosition : null,
  }));
  if (
    initialState.hidden !== false ||
    initialState.loading !== "lazy" ||
    initialState.objectPosition !== "25% 75%"
  ) {
    throw new Error(
      `Imported Avatar did not preserve lazy loading, layout, and caller styles: ${JSON.stringify(initialState)}.`,
    );
  }

  await lazyRoot.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const root = document.querySelector("#avatar-lazy-imported");
    const image = root?.querySelector('[data-slot="avatar-image"]');
    return (
      root?.getAttribute("data-image-loading-status") === "loaded" &&
      image instanceof HTMLImageElement &&
      image.naturalWidth > 0
    );
  });

  const loadedState = await lazyRoot.evaluate((root) => {
    const image = root.querySelector('[data-slot="avatar-image"]');
    const fallback = root.querySelector('[data-slot="avatar-fallback"]');
    return {
      fallbackHidden: fallback instanceof HTMLElement ? fallback.hidden : null,
      imageHidden: image instanceof HTMLImageElement ? image.hidden : null,
      imageVisibility: image instanceof HTMLElement ? image.style.visibility : null,
      naturalWidth: image instanceof HTMLImageElement ? image.naturalWidth : 0,
    };
  });
  if (
    loadedState.fallbackHidden !== true ||
    loadedState.imageHidden !== false ||
    loadedState.imageVisibility !== "visible" ||
    loadedState.naturalWidth <= 0
  ) {
    throw new Error(`Imported lazy Avatar did not become visible: ${JSON.stringify(loadedState)}.`);
  }
}
