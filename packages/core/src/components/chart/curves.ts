// Shared curve-path builders for the cartesian line/area charts.
//
// These faithfully reproduce the d3-shape curves that Recharts uses, so an
// Astro-rendered path matches shadcn's SVG geometry exactly:
//   - "natural"  → d3 curveNatural   (natural cubic spline)
//   - "monotone" → d3 curveMonotoneX (Fritsch–Carlson monotone cubic)
//   - "linear"   → straight segments
//   - "step"     → step-after
//
// LineChart and AreaChart both consumed byte-for-byte copies of this math; it
// now lives here once. NOTE: LineChart.astro's client-side <script> keeps its
// OWN copy of linePath/stepPath/monotonePath for the dense-data resize reflow —
// a browser-runtime scope that can't import this module. If you change a curve
// formula here, mirror it there (and vice versa) or the two will silently drift.
// Everything operates on a plain {x, y} point. Segment
// builders return path data WITHOUT a leading "M" (the area builder needs to
// splice segments mid-path); `buildPath` adds the opening moveto for line use.

export type Point = { x: number; y: number };

export type CurveType = "linear" | "monotone" | "natural" | "step";

// Straight line segments: "L…L…" (no leading M).
function linearSegments(pts: Point[]): string {
  return pts
    .slice(1)
    .map((p) => `L${p.x},${p.y}`)
    .join(" ");
}

// Step-after: horizontal to the next x, then vertical to the next y.
function stepSegments(pts: Point[]): string {
  return pts
    .slice(1)
    .map((p) => `H${p.x} V${p.y}`)
    .join(" ");
}

// d3-shape curveNatural: solve the tridiagonal system for a natural cubic
// spline's bezier control points. Returns [firstControls, secondControls].
function naturalControl(v: number[]): [number[], number[]] {
  const m = v.length - 1;
  const a: number[] = new Array(m);
  const b: number[] = new Array(m);
  const r: number[] = new Array(m);
  a[0] = 0;
  b[0] = 2;
  r[0] = v[0] + 2 * v[1];
  for (let i = 1; i < m - 1; i++) {
    a[i] = 1;
    b[i] = 4;
    r[i] = 4 * v[i] + 2 * v[i + 1];
  }
  a[m - 1] = 2;
  b[m - 1] = 7;
  r[m - 1] = 8 * v[m - 1] + v[m];
  for (let i = 1; i < m; i++) {
    const t = a[i] / b[i - 1];
    b[i] -= t;
    r[i] -= t * r[i - 1];
  }
  a[m - 1] = r[m - 1] / b[m - 1];
  for (let i = m - 2; i >= 0; i--) a[i] = (r[i] - a[i + 1]) / b[i];
  b[m - 1] = (v[m] + a[m - 1]) / 2;
  for (let i = 0; i < m - 1; i++) b[i] = 2 * v[i + 1] - a[i + 1];
  return [a, b];
}

function naturalSegments(pts: Point[]): string {
  if (pts.length < 2) return "";
  const [ax, bx] = naturalControl(pts.map((p) => p.x));
  const [ay, by] = naturalControl(pts.map((p) => p.y));
  return pts
    .slice(1)
    .map(
      (p, i) =>
        `C${ax[i].toFixed(1)},${ay[i].toFixed(1)} ${bx[i].toFixed(1)},${by[i].toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`,
    )
    .join(" ");
}

// d3-shape curveMonotoneX (Fritsch–Carlson), matching Recharts type="monotone".
function monotoneSegments(pts: Point[]): string {
  if (pts.length < 2) return "";
  const n = pts.length;
  const dxs = pts.slice(0, -1).map((p, i) => pts[i + 1].x - p.x);
  const dys = pts.slice(0, -1).map((p, i) => pts[i + 1].y - p.y);
  const tan: number[] = new Array(n).fill(0);
  tan[0] = dxs[0] ? dys[0] / dxs[0] : 0;
  tan[n - 1] = dxs[n - 2] ? dys[n - 2] / dxs[n - 2] : 0;
  for (let i = 1; i < n - 1; i++) {
    const s0 = dxs[i - 1] ? dys[i - 1] / dxs[i - 1] : 0;
    const s1 = dxs[i] ? dys[i] / dxs[i] : 0;
    tan[i] = s0 * s1 <= 0 ? 0 : (s0 + s1) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    const s = dxs[i] ? dys[i] / dxs[i] : 0;
    if (Math.abs(s) < 1e-10) {
      tan[i] = tan[i + 1] = 0;
      continue;
    }
    const a = tan[i] / s;
    const b = tan[i + 1] / s;
    const h = Math.sqrt(a * a + b * b);
    if (h > 3) {
      tan[i] = (3 / h) * a * s;
      tan[i + 1] = (3 / h) * b * s;
    }
  }
  return pts
    .slice(1)
    .map((p, i) => {
      const dx = dxs[i];
      const cp1x = (pts[i].x + dx / 3).toFixed(1);
      const cp1y = (pts[i].y + (tan[i] * dx) / 3).toFixed(1);
      const cp2x = (p.x - dx / 3).toFixed(1);
      const cp2y = (p.y - (tan[i + 1] * dx) / 3).toFixed(1);
      return `C${cp1x},${cp1y} ${cp2x},${cp2y} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");
}

/** Path segments for `pts` in the given curve style, WITHOUT a leading moveto. */
export function curveSegments(pts: Point[], curve: CurveType): string {
  if (pts.length < 2) return "";
  if (curve === "linear") return linearSegments(pts);
  if (curve === "step") return stepSegments(pts);
  if (curve === "natural") return naturalSegments(pts);
  return monotoneSegments(pts);
}

/** A complete open path ("M…" + segments) for a line stroke. */
export function buildPath(pts: Point[], curve: CurveType): string {
  if (!pts.length) return "";
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
  return `M${pts[0].x},${pts[0].y} ${curveSegments(pts, curve)}`;
}

/**
 * A closed area path: the top curve forward, then the bottom curve reversed and
 * closed. Seam is exact for monotone/linear (the same curve reversed).
 */
export function buildArea(topPts: Point[], bottomPts: Point[], curve: CurveType): string {
  const topD = buildPath(topPts, curve);
  if (!topD) return "";
  const rev = [...bottomPts].reverse();
  return `${topD} L${rev[0].x},${rev[0].y} ${curveSegments(rev, curve)} Z`;
}
