export async function verifyDialogEntryAnimationGestures({
  backdrop,
  content,
  expectedDuration,
  label,
  page,
  trigger,
}) {
  for (const gesture of [
    { holdMs: 0, name: "quick-release" },
    { holdMs: 500, name: "held-release" },
  ]) {
    await content.waitFor({ state: "attached" });
    await trigger.scrollIntoViewIfNeeded();
    const box = await trigger.boundingBox();
    if (!box) throw new Error(`Expected ${label} trigger to have a bounding box.`);

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    if (gesture.holdMs > 0) await page.waitForTimeout(gesture.holdMs);

    const openBeforeRelease = await content.evaluate(
      (element) => element instanceof HTMLDialogElement && element.open,
    );
    if (openBeforeRelease) {
      throw new Error(`Expected ${label} ${gesture.name} to remain closed before release.`);
    }

    const observationKey = `sw-dialog-entry-${label}-${gesture.name}-${Date.now()}`;
    await content.evaluate(
      (element, { backdropElement, key, presentationDelayMs }) => {
        const observations = (window.__swDialogEntryObservations ??= {});
        const backdrop = document.querySelector(backdropElement);
        const record = {
          done: false,
          presentationStates: [],
          releaseTime: null,
          samples: [],
          showModalReturnedAt: null,
          startedAt: performance.now(),
        };
        observations[key] = record;
        const originalShowModal = element.showModal;
        if (element instanceof HTMLDialogElement && typeof originalShowModal === "function") {
          element.showModal = function () {
            const root = element.closest(
              "[data-sw-dialog], [data-sw-alert-dialog], [data-sw-drawer]",
            );
            const trigger = root?.querySelector(
              "[data-sw-dialog-trigger], [data-sw-alert-dialog-trigger], [data-sw-drawer-trigger]",
            );
            record.presentationStates.push({
              backdropHidden: backdrop instanceof HTMLElement ? backdrop.hidden : null,
              backdropState: backdrop?.getAttribute("data-state"),
              contentHidden: element.hidden,
              contentState: element.getAttribute("data-state"),
              rootState: root?.getAttribute("data-state"),
              triggerExpanded: trigger?.getAttribute("aria-expanded"),
              triggerState: trigger?.getAttribute("data-state"),
            });
            element.showModal = originalShowModal;
            const result = originalShowModal.call(this);
            const presentationDelayEnd = performance.now() + presentationDelayMs;
            while (performance.now() < presentationDelayEnd) {
              // Simulate expensive native top-layer presentation before the browser can paint.
            }
            record.showModalReturnedAt = performance.now();
            return result;
          };
        }
        let finishedFrames = 0;
        let sawRunning = false;

        const readVisual = (target) => {
          if (!(target instanceof HTMLElement)) return null;
          const style = getComputedStyle(target);
          return {
            animationName: style.animationName,
            opacity: Number.parseFloat(style.opacity),
            scale: style.scale,
            starting: target.hasAttribute("data-starting-style"),
            transform: style.transform,
            translate: style.translate,
          };
        };
        const sample = (now) => {
          const animations = [
            ...element.getAnimations(),
            ...(backdrop instanceof HTMLElement ? backdrop.getAnimations() : []),
          ];
          const running = animations.filter((animation) => animation.playState === "running");
          sawRunning ||= running.length > 0;
          if (record.releaseTime !== null && sawRunning && running.length === 0)
            finishedFrames += 1;
          else finishedFrames = 0;

          record.samples.push({
            animations: animations.map((animation) => ({
              currentTime: typeof animation.currentTime === "number" ? animation.currentTime : null,
              duration: animation.effect?.getComputedTiming().duration ?? null,
              playState: animation.playState,
            })),
            backdrop: readVisual(backdrop),
            content: readVisual(element),
            contentOpen: element instanceof HTMLDialogElement ? element.open : null,
            contentState: element.getAttribute("data-state"),
            now,
          });

          if (finishedFrames >= 2 || now - record.startedAt > 4000) {
            record.done = true;
            return;
          }
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      },
      {
        backdropElement: backdrop,
        key: observationKey,
        presentationDelayMs: expectedDuration + 50,
      },
    );
    await page.evaluate((key) => {
      window.__swDialogEntryObservations[key].releaseTime = performance.now();
    }, observationKey);
    await page.mouse.up();
    await page.waitForFunction(
      (key) => window.__swDialogEntryObservations?.[key]?.done === true,
      observationKey,
      { timeout: 5000 },
    );

    const result = await page.evaluate((key) => {
      const record = window.__swDialogEntryObservations[key];
      delete window.__swDialogEntryObservations[key];
      return record;
    }, observationKey);
    assertEntryProgress({ expectedDuration, gesture: gesture.name, label, result });
    await page.keyboard.press("Escape");
    await content.waitFor({ state: "hidden" });
  }
}

function assertEntryProgress({ expectedDuration, gesture, label, result }) {
  const afterRelease = result.samples.filter((sample) => sample.now >= result.releaseTime);
  const afterPresentation = afterRelease.filter(
    (sample) => sample.now >= result.showModalReturnedAt,
  );
  const running = afterRelease.filter((sample) =>
    sample.animations.some((animation) => animation.playState === "running"),
  );
  const finalSample = afterRelease.at(-1);
  const contentProgress = running.some((sample) =>
    visualDiffers(sample.content, finalSample.content),
  );
  const backdropProgress = running.some((sample) =>
    visualDiffers(sample.backdrop, finalSample.backdrop),
  );
  const coherentPresentation = result.presentationStates.some(
    (state) =>
      state.backdropHidden === false &&
      state.backdropState === "open" &&
      state.contentHidden === false &&
      state.contentState === "open" &&
      state.rootState === "open" &&
      state.triggerExpanded === "true" &&
      state.triggerState === "open",
  );
  const stagedPresentation = afterPresentation.some(
    (sample) =>
      sample.content?.starting === true &&
      sample.backdrop?.starting === true &&
      sample.content.animationName === "none" &&
      sample.backdrop.animationName === "none",
  );
  const animationAfterStaging = afterPresentation.some(
    (sample) =>
      sample.content?.starting === false &&
      sample.backdrop?.starting === false &&
      sample.content.animationName !== "none" &&
      sample.backdrop.animationName !== "none" &&
      sample.animations.some(
        (animation) =>
          animation.playState === "running" &&
          animation.currentTime !== null &&
          typeof animation.duration === "number" &&
          animation.currentTime < animation.duration,
      ),
  );
  const presentationDelayCompleted =
    result.showModalReturnedAt !== null &&
    result.showModalReturnedAt - result.releaseTime >= expectedDuration;

  if (
    !coherentPresentation ||
    !presentationDelayCompleted ||
    !stagedPresentation ||
    !animationAfterStaging ||
    running.length === 0 ||
    !contentProgress ||
    !backdropProgress ||
    finalSample?.contentOpen !== true ||
    finalSample?.contentState !== "open" ||
    (finalSample?.content?.opacity ?? 0) < 0.98 ||
    (finalSample?.backdrop?.opacity ?? 0) < 0.98
  ) {
    throw new Error(
      `Expected ${label} ${gesture} to expose full entry progress, got ${JSON.stringify({
        animationAfterStaging,
        backdropProgress,
        coherentPresentation,
        contentProgress,
        finalSample,
        presentationDelayCompleted,
        presentationStates: result.presentationStates,
        runningSamples: running.length,
        stagedPresentation,
      })}.`,
    );
  }
}

function visualDiffers(sample, finalSample) {
  if (!sample || !finalSample) return false;
  return (
    Math.abs(sample.opacity - finalSample.opacity) > 0.02 ||
    sample.transform !== finalSample.transform ||
    sample.translate !== finalSample.translate ||
    sample.scale !== finalSample.scale
  );
}
