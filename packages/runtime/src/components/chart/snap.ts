import type { ChartPoint, ChartTooltipAnchorContext, ChartTooltipPosition } from "@tanstack/charts";
import {
  type ChartTooltipPortalExtension,
  type ChartTooltipPortalPositionContext,
  portal,
} from "@tanstack/charts/tooltip/portal";

/** A snapped tooltip anchor. TanStack passes the anchor object to the portal unchanged. */
interface SnapAnchor extends ChartTooltipPosition {
  /** Half the snapped band width in scene pixels. The gap starts at the band edge. */
  h: number;
  /** True for a polar chart. The tooltip sits at the anchor with no band offset. */
  f?: boolean;
  /** True when the Runtime picks the side. A native `placement` sets the side order instead. */
  s?: boolean;
  /** True when the band is on y (horizontal bars). The tooltip sits above or below the band. */
  v?: boolean;
}

/**
 * The tooltip motion: the duration and the easing of every move after the first show. This is the
 * shadcn (Recharts) tooltip default. The move ends after the duration, which `parseInt` reads.
 */
const MOTION = "400ms ease";

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

/**
 * The default tooltip anchor. Cartesian charts snap to the hovered category (a band center or the
 * point x) and follow the pointer on the other axis inside the plot. A band on y (horizontal bars)
 * snaps y and follows the pointer x. Polar charts use the point furthest from the plot center, so
 * a pie slice, a slice of a nested pie ring or a radar axis has one place. A radial bar follows the
 * pointer angle on the ring of that point (the outermost focused ring), as the shadcn (Recharts)
 * radial chart does. The keyboard, which has no pointer, uses the top or the far end of the focused
 * group.
 */
export const snapAnchor =
  (side: boolean) =>
  (
    points: readonly ChartPoint<any, any, any>[],
    { pointer, plot, scales }: ChartTooltipAnchorContext<any, any, any>,
  ): SnapAnchor | undefined => {
    const first = points[0];
    const { x: sx, y: sy } = scales;
    if (!first) return;
    if (!sx || sx.type === "none") {
      const cx = plot.x + plot.width / 2;
      const cy = plot.y + plot.height / 2;
      const far = (point: ChartTooltipPosition) => (point.x - cx) ** 2 + (point.y - cy) ** 2;
      const best = points.reduce((a, b) => (far(b) > far(a) ? b : a));
      // Only a radial bar point has an angle interval. Its point is at the bar end, so the pointer
      // vector from the center is scaled to the radius of that point.
      const d = pointer && best.xInterval && far(pointer);
      const k = d ? Math.sqrt(far(best) / d) : 0;
      return k
        ? { x: cx + (pointer!.x - cx) * k, y: cy + (pointer!.y - cy) * k, h: 0, f: true }
        : { x: best.x, y: best.y, h: 0, f: true };
    }
    const v = !sx.bandwidth && !!sy?.bandwidth;
    const scale = v ? sy : sx;
    const at = scale.bandwidth
      ? (scale.viewport?.map ?? scale.map)(v ? first.yValue : first.xValue)
      : first.x;
    const main = Number.isFinite(at) ? at : v ? first.y : first.x;
    // The pointer follow rounds to whole scene pixels, as Recharts rounds its pointer, so a
    // sub-pixel pointer move gives the same place and starts no ease.
    const cross = v
      ? pointer
        ? clamp(Math.round(pointer.x), plot.x, plot.x + plot.width)
        : Math.max(...points.map((point) => point.x))
      : pointer
        ? clamp(Math.round(pointer.y), plot.y, plot.y + plot.height)
        : Math.min(...points.map((point) => point.y));
    return {
      x: v ? cross : main,
      y: v ? main : cross,
      h: scale.bandwidth / 2,
      s: side,
      v,
    };
  };

/**
 * TanStack's portal with snapped placement and motion. A snapped Cartesian tooltip sits a gap
 * beyond its band (beside a vertical bar band, below or above a horizontal one), takes the side with
 * less overflow past the plot and stays inside the plot on the other axis. The tooltip shows in
 * place. After that, every move in the same scene eases with `MOTION`, unless the user prefers
 * reduced motion. TanStack sets `left` and `top` with no transition, and one `translate` eases from
 * the place the tooltip shows at to the new place, so both axes share one timeline and a diagonal
 * move takes a straight line. A re-place during a move eases from where the tooltip shows. The ease
 * ends with the move, so a later re-place, for example after a body or container size change, does
 * not slide. A full hide, a scroll, a resize or a new scene stops the ease.
 */
export const snapPortal: ChartTooltipPortalExtension = {
  id: "portal",
  create(context, options) {
    const inner = portal.create(context, options);
    const { element } = context;
    const view = element.ownerDocument.defaultView;
    const motion = view?.matchMedia?.("(prefers-reduced-motion: reduce)");
    // The latest context from the tooltip, and the last shown one.
    let current: ChartTooltipPortalPositionContext;
    let last: ChartTooltipPortalPositionContext | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // The frame callback that places the tooltip for the latest move, while one is pending, and
    // that move's context. TanStack's own re-places read `current`, so a queued move stays out of
    // it until it is placed.
    let frame = 0;
    let queued: ChartTooltipPortalPositionContext | undefined;
    const take = () => {
      if (queued) current = queued;
      queued = undefined;
    };
    const { style } = element;
    const still = () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      take();
      timer = undefined;
      frame = 0;
      style.transition = style.translate = "none";
    };
    // A full hide ends the shown session, so the next show is a first show.
    const reset = () => {
      last = undefined;
      still();
    };
    // Places the tooltip for the latest move and eases it from the place it shows at now, with the
    // timer that ends the ease. A placement that does not change keeps the running ease.
    const glide = () => {
      frame = 0;
      take();
      const { left, top } = style;
      const from = element.getBoundingClientRect();
      if (!inner.position(live)) return reset();
      if (style.left === left && style.top === top) return;
      still();
      const to = element.getBoundingClientRect();
      style.translate = `${from.left - to.left}px ${from.top - to.top}px`;
      void element.offsetLeft;
      style.transition = `translate ${MOTION}`;
      style.translate = "0px";
      timer = setTimeout(still, Number.parseInt(MOTION));
    };
    // A move places the tooltip in one frame callback, so several moves in a frame start one ease,
    // as the shadcn (Recharts) tooltip does. Each start begins the slow part of the ease again, so a
    // start on every pointer event keeps a moving tooltip almost still.
    const later = () => {
      frame ||= requestAnimationFrame(glide);
    };
    // Measures the shown tooltip and returns the placed context. The band offset and the plot
    // clamp apply when every side is on the band axis (`left` or `right` for a band on x, `top` or
    // `bottom` for a band on y). Another native placement keeps the band center, the pointer and the
    // configured gap, as TanStack places it.
    const place = (): ChartTooltipPortalPositionContext => {
      const anchor = current.anchor as SnapAnchor;
      const v = anchor.v;
      const sides = v ? ["top", "bottom"] : ["left", "right"];
      if (
        anchor.h === undefined ||
        anchor.f ||
        !(anchor.s || [current.placement].flat().every((side) => sides.includes(side!)))
      )
        return current;
      const k = current.surface.element.getBoundingClientRect().width / current.scene.width || 1;
      const plot = current.scene.chart;
      const offset = anchor.h * k + (current.offset ?? 10);
      // The band axis (`a`) and the other axis (`b`), in scene pixels.
      const [a, start, length, b, from, span] = v
        ? [anchor.y, plot.y, plot.height, anchor.x, plot.x, plot.width]
        : [anchor.x, plot.x, plot.width, anchor.y, plot.y, plot.height];
      const size = v ? element.offsetHeight : element.offsetWidth;
      const half = (v ? element.offsetWidth : element.offsetHeight) / 2 / k;
      // Client pixels past the plot edge after and before the band.
      const after = (a - start - length) * k + offset + size;
      const before = (start - a) * k + offset + size;
      const c = half * 2 > span ? from + span / 2 : clamp(b, from + half, from + span - half);
      return {
        ...current,
        offset,
        placement: !anchor.s
          ? current.placement
          : ((after > 0 && before < after ? sides : [sides[1], sides[0]]) as ["left", "right"]),
        anchor: v ? { x: c, y: a } : { x: a, y: c },
      };
    };
    // TanStack keeps this context and places the tooltip again after a scroll or a resize, so each
    // read gives the latest placement.
    const live: ChartTooltipPortalPositionContext = {
      get scene() {
        return current.scene;
      },
      get surface() {
        return current.surface;
      },
      get anchor() {
        return place().anchor;
      },
      get placement() {
        return place().placement;
      },
      get offset() {
        return place().offset;
      },
    };
    // A framework fills the tooltip body after the paint. Place it again before the next frame.
    const filled = new MutationObserver(
      () => last && (timer || frame ? later() : inner.position(live)),
    );
    filled.observe(element, { childList: true, subtree: true, characterData: true });
    view?.addEventListener("scroll", still, { capture: true, passive: true });
    view?.addEventListener("resize", still);
    still();
    return {
      ...inner,
      position(next) {
        const to = next.anchor;
        const from = last?.anchor;
        // Only a shown tooltip glides. A replay at the same anchor keeps the motion state, so a late
        // body fill after the first show stays in place.
        const move = from && last!.scene === next.scene && !motion?.matches;
        if (!move) still();
        if (move && (frame || from.x !== to.x || from.y !== to.y)) {
          last = queued = next;
          later();
          return true;
        }
        current = next;
        // A closed popover has no size. The first call opens it, so the second can measure it.
        if (!element.offsetWidth) inner.position(live);
        const visible = inner.position(live);
        if (visible) last = next;
        else reset();
        return visible;
      },
      hide() {
        reset();
        inner.hide();
      },
      destroy() {
        filled.disconnect();
        view?.removeEventListener("scroll", still, true);
        view?.removeEventListener("resize", still);
        clearTimeout(timer);
        cancelAnimationFrame(frame);
        style.removeProperty("transition");
        style.removeProperty("translate");
        inner.destroy();
      },
    };
  },
};
