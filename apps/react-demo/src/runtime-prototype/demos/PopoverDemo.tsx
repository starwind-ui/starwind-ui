import { useState } from "react";
import { useRuntimePrototypeContext } from "../context";
import {
  Button,
  button,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../kit";

const alignments = ["start", "center", "end"] as const;
const sides = ["top", "right", "bottom", "left"] as const;

export function PopoverDemo() {
  const [asChildClickCount, setAsChildClickCount] = useState(0);
  const {
    controlledPopoverOpen,
    setControlledPopoverOpen,
    controlledPopoverChanges,
    setControlledPopoverChanges,
    canceledPopoverChanges,
    setCanceledPopoverChanges,
  } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Popover</h2>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Popover id="react-runtime-popover-default">
            <PopoverTrigger id="react-runtime-popover-native-trigger" className="cursor-help">
              Open React popover
            </PopoverTrigger>
            <PopoverContent
              id="react-runtime-popover-content"
              className="runtime-popover-custom"
              side="bottom"
              align="start"
            >
              <PopoverHeader>
                <PopoverTitle>React runtime popover</PopoverTitle>
                <PopoverDescription>
                  Popover composes generated primitive parts with Starwind floating content styling.
                </PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>

          <Popover
            id="react-runtime-popover-controlled"
            open={controlledPopoverOpen}
            onOpenChange={(open) => {
              setControlledPopoverOpen(open);
              setControlledPopoverChanges((count) => count + 1);
            }}
          >
            <PopoverTrigger className={button({ variant: "secondary" })}>
              Open controlled popover
            </PopoverTrigger>
            <PopoverContent id="react-runtime-popover-controlled-content" side="top" align="end">
              <PopoverHeader>
                <PopoverTitle>Controlled popover</PopoverTitle>
                <PopoverDescription>
                  React owns open state while the runtime handles placement and dismissal.
                </PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>

          <Popover
            id="react-runtime-popover-canceled"
            onOpenChange={(open, details) => {
              setCanceledPopoverChanges((count) => count + 1);
              if (open) details.cancel();
            }}
          >
            <PopoverTrigger className={button({ variant: "ghost" })}>
              Open canceled popover
            </PopoverTrigger>
            <PopoverContent id="react-runtime-popover-canceled-content">
              <PopoverTitle>Canceled popover</PopoverTitle>
            </PopoverContent>
          </Popover>

          <Popover id="react-runtime-popover-as-child">
            <PopoverTrigger asChild className="tracking-[0.123px]">
              <a
                id="react-runtime-popover-as-child-trigger"
                href="#react-runtime-popover-as-child"
                className="uppercase"
                style={{ wordSpacing: "1.234px" }}
                data-listener-count={asChildClickCount}
                onClick={() => setAsChildClickCount((count) => count + 1)}
              >
                As child popover
              </a>
            </PopoverTrigger>
            <PopoverContent id="react-runtime-popover-as-child-content" side="top" align="end">
              <PopoverHeader>
                <PopoverTitle>As child popover</PopoverTitle>
                <PopoverDescription>
                  The trigger is a supplied child link with runtime attributes applied.
                </PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
            <span id="react-runtime-popover-as-child-listener-count" className="sr-only">
              {asChildClickCount}
            </span>
          </Popover>

          <Popover id="react-runtime-popover-styled-child">
            <PopoverTrigger asChild className="tracking-[0.234px]">
              <Button
                id="react-runtime-popover-styled-child-trigger"
                variant="ghost"
                size="sm"
                className="uppercase"
              >
                Styled child popover
              </Button>
            </PopoverTrigger>
            <PopoverContent
              id="react-runtime-popover-styled-child-content"
              side="top"
              align="start"
            >
              <PopoverTitle>Styled child content</PopoverTitle>
            </PopoverContent>
          </Popover>

          <Popover id="react-runtime-popover-nested">
            <PopoverTrigger className={button({ variant: "outline", size: "sm" })}>
              Nested popover
            </PopoverTrigger>
            <PopoverContent id="react-runtime-popover-nested-content" side="bottom" align="start">
              <PopoverHeader>
                <PopoverTitle>Nested parent</PopoverTitle>
                <PopoverDescription>
                  Nested floating content stays scoped to its trigger.
                </PopoverDescription>
              </PopoverHeader>
              <div className="mt-3">
                <Popover id="react-runtime-popover-nested-child">
                  <PopoverTrigger className={button({ variant: "secondary", size: "sm" })}>
                    Open child
                  </PopoverTrigger>
                  <PopoverContent
                    id="react-runtime-popover-nested-child-content"
                    side="right"
                    align="start"
                  >
                    <PopoverHeader>
                      <PopoverTitle>Nested child</PopoverTitle>
                      <PopoverDescription>
                        Child popover opened from parent content.
                      </PopoverDescription>
                    </PopoverHeader>
                  </PopoverContent>
                </Popover>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-wrap gap-3">
          {alignments.map((align) => (
            <Popover key={align} id={`react-runtime-popover-align-${align}`}>
              <PopoverTrigger className={button({ variant: "outline", size: "sm" })}>
                Align {align}
              </PopoverTrigger>
              <PopoverContent
                id={`react-runtime-popover-align-${align}-content`}
                side="bottom"
                align={align}
                sideOffset={8}
              >
                <PopoverTitle>Align {align}</PopoverTitle>
              </PopoverContent>
            </Popover>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          {sides.map((side, index) => (
            <Popover key={side} id={`react-runtime-popover-side-${side}`}>
              <PopoverTrigger className={button({ variant: "secondary", size: "sm" })}>
                Side {side}
              </PopoverTrigger>
              <PopoverContent
                id={`react-runtime-popover-side-${side}-content`}
                className={index % 2 === 0 ? "duration-75" : "duration-200"}
                side={side}
                align="center"
                sideOffset={10}
              >
                <PopoverTitle>Side {side}</PopoverTitle>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </div>
      <p className="text-muted-foreground text-sm">
        Controlled popover open: {controlledPopoverOpen ? "yes" : "no"}; changes:{" "}
        <span id="react-popover-count">{controlledPopoverChanges}</span>; canceled:{" "}
        <span id="react-popover-canceled-count">{canceledPopoverChanges}</span>
      </p>
    </section>
  );
}
