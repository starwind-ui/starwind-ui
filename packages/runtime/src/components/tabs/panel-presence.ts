import { PRESENCE_ENDING_ATTRIBUTE, PRESENCE_STARTING_ATTRIBUTE } from "../../internal/presence";

/** Owns one panel's visibility for the lifetime of its Tabs controller. */
export function createPanelPresence(element: HTMLElement, initialActive: boolean) {
  let active = initialActive;
  let cleanup = () => {};
  element.hidden = !active;
  element.removeAttribute(PRESENCE_STARTING_ATTRIBUTE);
  element.removeAttribute(PRESENCE_ENDING_ATTRIBUTE);

  function settle() {
    cleanup();
    cleanup = () => {};
    element.removeAttribute(PRESENCE_STARTING_ATTRIBUTE);
    element.removeAttribute(PRESENCE_ENDING_ATTRIBUTE);
    element.hidden = !active;
  }

  return {
    update(nextActive: boolean) {
      if (active === nextActive) return;
      cleanup();
      active = nextActive;
      element.removeAttribute(PRESENCE_STARTING_ATTRIBUTE);
      element.removeAttribute(PRESENCE_ENDING_ATTRIBUTE);
      if (active) {
        const wasHidden = element.hidden;
        element.hidden = false;
        if (!wasHidden) return;
        element.setAttribute(PRESENCE_STARTING_ATTRIBUTE, "");
        // Commit the starting style before releasing it on a later painted frame.
        element.getBoundingClientRect();
        let frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => {
            element.removeAttribute(PRESENCE_STARTING_ATTRIBUTE);
          });
        });
        cleanup = () => cancelAnimationFrame(frame);
        return;
      }

      element.setAttribute(PRESENCE_ENDING_ATTRIBUTE, "");
      // getAnimations flushes the style change. Only finite motion on this panel
      // delays hiding; a nested panel or an infinite spinner has its own lifetime.
      const animations = element.getAnimations().filter((animation) => {
        const effect = animation.effect;
        return (
          effect instanceof KeyframeEffect &&
          effect.target === element &&
          Number.isFinite(effect.getComputedTiming().endTime) &&
          animation.playState !== "finished" &&
          animation.playState !== "idle"
        );
      });
      const pending = new Set(animations);
      const complete = (event: Event) => {
        pending.delete(event.target as Animation);
        if (pending.size === 0) settle();
      };
      cleanup = () => {
        for (const animation of animations) {
          animation.removeEventListener("finish", complete);
          animation.removeEventListener("cancel", complete);
        }
      };
      for (const animation of animations) {
        animation.addEventListener("finish", complete);
        animation.addEventListener("cancel", complete);
      }
      if (pending.size === 0) settle();
    },
    destroy: settle,
  };
}
