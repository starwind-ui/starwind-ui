import { useState } from "react";
import { Button, ScrollArea, ScrollBar, scrollAreaCells, scrollAreaItems } from "../kit";

const horizontalItems = ["Runtime", "Astro", "React", "Combobox", "Popover", "Toast", "Carousel"];

export function ScrollAreaDemo() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Scroll Area</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">Vertical list</h3>
          <ScrollArea
            id="react-runtime-scroll-area-default"
            className="h-40 w-full max-w-md rounded-md border"
            viewportClassName="p-4"
          >
            <div className="space-y-2">
              {scrollAreaItems.map((item) => (
                <div key={item} className="bg-muted/50 rounded-md px-3 py-2 text-sm">
                  {item}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">Two-axis content</h3>
          <ScrollArea
            id="react-runtime-scroll-area-both"
            className="h-40 w-full max-w-md rounded-md border"
            viewportClassName="p-4"
            scrollbar={
              <>
                <ScrollBar id="react-runtime-scroll-area-both-vertical-scrollbar" />
                <ScrollBar
                  id="react-runtime-scroll-area-both-horizontal-scrollbar"
                  orientation="horizontal"
                />
              </>
            }
          >
            <div className="grid w-[36rem] grid-cols-3 gap-3">
              {scrollAreaCells.map((cell, index) => (
                <div
                  key={`${cell}-${index}`}
                  className="bg-muted/50 rounded-md px-3 py-2 text-sm font-medium"
                >
                  {cell}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">Horizontal</h3>
          <ScrollArea
            id="react-runtime-scroll-area-horizontal"
            className="w-full max-w-md rounded-md border"
            viewportClassName="p-4"
            scrollbar={
              <ScrollBar
                id="react-runtime-scroll-area-horizontal-scrollbar"
                orientation="horizontal"
              />
            }
          >
            <div className="flex w-max gap-3">
              {horizontalItems.map((item) => (
                <div
                  key={item}
                  className="bg-muted/50 w-36 shrink-0 rounded-md px-3 py-6 text-center text-sm font-medium"
                >
                  {item}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">Horizontal RTL</h3>
          <ScrollArea
            id="react-runtime-scroll-area-horizontal-rtl"
            dir="rtl"
            className="w-full max-w-md rounded-md border"
            viewportClassName="p-4"
            scrollbar={
              <ScrollBar
                id="react-runtime-scroll-area-horizontal-rtl-scrollbar"
                orientation="horizontal"
              />
            }
          >
            <div className="flex w-max gap-3">
              {horizontalItems.map((item) => (
                <div
                  key={item}
                  className="bg-muted/50 w-36 shrink-0 rounded-md px-3 py-6 text-center text-sm font-medium"
                >
                  {item}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-base font-semibold">Dynamic content</h3>
            <Button
              id="react-runtime-scroll-area-dynamic-toggle"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExpanded((value) => !value)}
            >
              Toggle rows
            </Button>
          </div>
          <ScrollArea
            id="react-runtime-scroll-area-dynamic"
            className="h-36 w-full max-w-md rounded-md border"
            viewportClassName="p-4"
          >
            <div className="space-y-2">
              {scrollAreaItems.slice(0, 4).map((item) => (
                <div key={item} className="bg-muted/50 rounded-md px-3 py-2 text-sm">
                  {item}
                </div>
              ))}
              {expanded ? (
                <div className="space-y-2" data-runtime-scroll-area-extra>
                  {scrollAreaItems.slice(4).map((item) => (
                    <div key={item} className="bg-muted/50 rounded-md px-3 py-2 text-sm">
                      {item}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </div>
      </div>
    </section>
  );
}
