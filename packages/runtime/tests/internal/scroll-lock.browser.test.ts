import { beforeEach, describe, expect, it, vi } from "vitest";

import { lockDocumentScroll } from "../../src/internal/scroll-lock";

describe("lockDocumentScroll", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.removeAttribute("data-sw-scroll-locked");
    document.body.removeAttribute("style");
  });

  it("reference-counts locks and restores modified body styles after the final release", () => {
    document.body.style.setProperty("overflow", "clip", "important");
    document.body.style.setProperty("--sw-scrollbar-width", "12px", "important");
    document.body.setAttribute("data-sw-scroll-locked", "external");

    const firstLock = lockDocumentScroll(document);
    const secondLock = lockDocumentScroll(document);

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.style.getPropertyPriority("overflow")).toBe("");
    expect(document.body.style.getPropertyValue("--sw-scrollbar-width")).toBe("0px");
    expect(document.body.style.getPropertyPriority("--sw-scrollbar-width")).toBe("");
    expect(document.body.getAttribute("data-sw-scroll-locked")).toBe("");

    firstLock.release();
    firstLock.release();

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.style.getPropertyPriority("overflow")).toBe("");
    expect(document.body.getAttribute("data-sw-scroll-locked")).toBe("");

    secondLock.release();

    expect(document.body.style.overflow).toBe("clip");
    expect(document.body.style.getPropertyPriority("overflow")).toBe("important");
    expect(document.body.style.getPropertyValue("--sw-scrollbar-width")).toBe("12px");
    expect(document.body.style.getPropertyPriority("--sw-scrollbar-width")).toBe("important");
    expect(document.body.getAttribute("data-sw-scroll-locked")).toBe("external");
  });

  it("measures scrollbar compensation before the first lock writes and reuses it for nested locks", () => {
    const measurements: Array<{
      lockMarker: boolean;
      overflow: string;
      scrollbarWidth: string;
    }> = [];
    const clientWidth = vi
      .spyOn(document.documentElement, "clientWidth", "get")
      .mockImplementation(() => {
        measurements.push({
          lockMarker: document.body.hasAttribute("data-sw-scroll-locked"),
          overflow: document.body.style.overflow,
          scrollbarWidth: document.body.style.getPropertyValue("--sw-scrollbar-width"),
        });
        return window.innerWidth - 16;
      });

    const firstLock = lockDocumentScroll(document);
    const secondLock = lockDocumentScroll(document);
    const appliedScrollbarWidth = document.body.style.getPropertyValue("--sw-scrollbar-width");
    firstLock.release();
    secondLock.release();
    clientWidth.mockRestore();

    expect(measurements).toEqual([
      {
        lockMarker: false,
        overflow: "",
        scrollbarWidth: "",
      },
    ]);
    expect(appliedScrollbarWidth).toBe("16px");
  });

  it("tracks independent lock state per document", () => {
    const otherDocument = document.implementation.createHTMLDocument("isolated");
    otherDocument.body.style.overflow = "auto";

    const currentDocumentLock = lockDocumentScroll(document);
    const otherDocumentLock = lockDocumentScroll(otherDocument);

    expect(document.body.style.overflow).toBe("hidden");
    expect(otherDocument.body.style.overflow).toBe("hidden");

    currentDocumentLock.release();

    expect(document.body.style.overflow).toBe("");
    expect(otherDocument.body.style.overflow).toBe("hidden");

    otherDocumentLock.release();

    expect(otherDocument.body.style.overflow).toBe("auto");
  });
});
