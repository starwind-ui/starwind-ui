/** Measures the tab's border box in the list's local padding-box coordinates. */
export function getTabsIndicatorGeometry(tab: HTMLElement, list: HTMLElement) {
  const tabSize = getBorderBox(tab);
  const listSize = getBorderBox(list);
  const tabOffset = getLayoutOffset(tab);
  const listOffset = getLayoutOffset(list);
  let left = tabOffset.left - listOffset.left - list.clientLeft;
  let top = tabOffset.top - listOffset.top - list.clientTop;

  // The indicator shares the list's scroll. Intermediate scrollers move only the tab.
  for (let node = tab.parentElement; node && node !== list; node = node.parentElement) {
    left -= node.scrollLeft;
    top -= node.scrollTop;
  }

  const listRect = list.getBoundingClientRect();
  const tabRect = tab.getBoundingClientRect();
  const scaleX = listRect.width / listSize.width;
  const scaleY = listRect.height / listSize.height;
  const rectLeft = (tabRect.left - listRect.left) / scaleX + list.scrollLeft - list.clientLeft;
  const rectTop = (tabRect.top - listRect.top) / scaleY + list.scrollTop - list.clientTop;

  // Each offset parent can lose half a pixel. A fixed tolerance rejects valid
  // rectangle measurements once enough fractional layout offsets accumulate.
  const roundingAllowance = 2 + (tabOffset.depth + listOffset.depth) / 2;
  const projection = getSharedProjection(tab, list);
  const agreesWithLayout = (x: number, y: number) =>
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    Math.abs(x - left) <= roundingAllowance &&
    Math.abs(y - top) <= roundingAllowance;
  if (
    projection &&
    projection.a > 0 &&
    projection.d > 0 &&
    projection.b === 0 &&
    projection.c === 0 &&
    scaleX > 0 &&
    scaleY > 0 &&
    agreesWithLayout(rectLeft, rectTop) &&
    Math.abs(tabRect.width / scaleX - tabSize.width) <= 1 &&
    Math.abs(tabRect.height / scaleY - tabSize.height) <= 1
  ) {
    left = rectLeft;
    top = rectTop;
  } else if (projection) {
    // A shared 2D transform preserves the layout slot. Recover its origin from
    // the projected box corners to refine the rounded layout fallback. This is
    // bounded to one shared affine projection; independent tab transforms and
    // perspective retain the offset-parent fallback.
    const { a, b, c, d } = projection;
    const determinant = a * d - b * c;
    const projectsBox = (size: { width: number; height: number }, rect: DOMRect) =>
      Math.abs(Math.abs(a) * size.width + Math.abs(c) * size.height - rect.width) <= 1 &&
      Math.abs(Math.abs(b) * size.width + Math.abs(d) * size.height - rect.height) <= 1;
    if (
      Math.abs(determinant) > Number.EPSILON &&
      projectsBox(tabSize, tabRect) &&
      projectsBox(listSize, listRect)
    ) {
      const dx =
        tabRect.left -
        listRect.left -
        Math.min(0, a * tabSize.width) -
        Math.min(0, c * tabSize.height) +
        Math.min(0, a * listSize.width) +
        Math.min(0, c * listSize.height);
      const dy =
        tabRect.top -
        listRect.top -
        Math.min(0, b * tabSize.width) -
        Math.min(0, d * tabSize.height) +
        Math.min(0, b * listSize.width) +
        Math.min(0, d * listSize.height);
      const slotLeft = (d * dx - c * dy) / determinant + list.scrollLeft - list.clientLeft;
      const slotTop = (a * dy - b * dx) / determinant + list.scrollTop - list.clientTop;
      if (agreesWithLayout(slotLeft, slotTop)) {
        left = slotLeft;
        top = slotTop;
      }
    }
  }

  return {
    left,
    top,
    right: listSize.width - left - tabSize.width,
    bottom: listSize.height - top - tabSize.height,
    width: tabSize.width,
    height: tabSize.height,
  };
}

function getBorderBox(element: HTMLElement) {
  const style = getComputedStyle(element);
  const extra = (names: string[]) =>
    names.reduce((sum, name) => sum + (Number.parseFloat(style.getPropertyValue(name)) || 0), 0);
  const width =
    Number.parseFloat(style.width) +
    (style.boxSizing === "border-box"
      ? 0
      : extra(["padding-left", "padding-right", "border-left-width", "border-right-width"]));
  const height =
    Number.parseFloat(style.height) +
    (style.boxSizing === "border-box"
      ? 0
      : extra(["padding-top", "padding-bottom", "border-top-width", "border-bottom-width"]));
  return {
    width:
      Number.isFinite(width) && Math.abs(width - element.offsetWidth) <= 1
        ? width
        : element.offsetWidth,
    height:
      Number.isFinite(height) && Math.abs(height - element.offsetHeight) <= 1
        ? height
        : element.offsetHeight,
  };
}

function getLayoutOffset(element: HTMLElement) {
  let left = 0;
  let top = 0;
  let depth = 0;
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.offsetParent as HTMLElement | null
  ) {
    depth++;
    left += node.offsetLeft;
    top += node.offsetTop;
    const parent = node.offsetParent as HTMLElement | null;
    left += parent?.clientLeft ?? 0;
    top += parent?.clientTop ?? 0;
  }
  return { left, top, depth };
}

function getSharedProjection(tab: HTMLElement, list: HTMLElement): DOMMatrix | null {
  let shared = false;
  let projection = new DOMMatrix();
  for (let node: HTMLElement | null = tab; node; node = node.parentElement) {
    if (node === list) shared = true;
    const style = getComputedStyle(node);
    const transformed =
      style.transform !== "none" ||
      style.translate !== "none" ||
      style.rotate !== "none" ||
      style.scale !== "none";
    // Transforms below the list affect the tab independently of the indicator.
    if (!shared && transformed) return null;
    if (style.perspective !== "none" || style.rotate !== "none") return null;
    const matrix = new DOMMatrix(style.transform === "none" ? undefined : style.transform);
    if (!matrix.is2D) return null;
    const scales = style.scale === "none" ? [1] : style.scale.split(" ").map(Number);
    if (scales.length > 2 || scales.some((value) => !Number.isFinite(value))) return null;
    const scaled = new DOMMatrix().scale(scales[0], scales[1] ?? scales[0]).multiply(matrix);
    projection = scaled.multiply(projection);
  }
  return shared ? projection : null;
}
