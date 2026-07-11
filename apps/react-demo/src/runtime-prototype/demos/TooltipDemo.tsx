import { useState } from "react";
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "../kit";

const sideExamples = [
  { side: "top", label: "Top" },
  { side: "right", label: "Right" },
  { side: "bottom", label: "Bottom" },
  { side: "left", label: "Left" },
] as const;

const alignExamples = [
  { align: "start", label: "Start" },
  { align: "center", label: "Center" },
  { align: "end", label: "End" },
] as const;

export function TooltipDemo() {
  const [controlledOpen, setControlledOpen] = useState(false);
  const [controlledDisabled, setControlledDisabled] = useState(true);

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Tooltip</h2>
      <div className="space-y-6">
        <div className="flex min-h-28 flex-wrap items-center justify-center gap-4 sm:px-20">
          {sideExamples.map(({ side, label }) => (
            <Tooltip
              key={side}
              id={`react-runtime-tooltip-side-${side}`}
              openDelay={0}
              closeDelay={0}
            >
              <TooltipTrigger>
                <Button
                  id={`react-runtime-tooltip-side-${side}-trigger`}
                  variant="outline"
                  size="sm"
                >
                  {label} side
                </Button>
              </TooltipTrigger>
              <TooltipContent
                id={`react-runtime-tooltip-side-${side}-content`}
                side={side}
                avoidCollisions={false}
                className="duration-0"
              >
                {label} tooltip
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="flex min-h-28 flex-wrap items-center justify-center gap-4 sm:px-20">
          {alignExamples.map(({ align, label }) => (
            <Tooltip
              key={align}
              id={`react-runtime-tooltip-align-${align}`}
              openDelay={0}
              closeDelay={0}
            >
              <TooltipTrigger>
                <Button
                  id={`react-runtime-tooltip-align-${align}-trigger`}
                  variant="secondary"
                  size="sm"
                >
                  {label} align
                </Button>
              </TooltipTrigger>
              <TooltipContent
                id={`react-runtime-tooltip-align-${align}-content`}
                side="bottom"
                align={align}
                avoidCollisions={false}
                className="duration-0"
              >
                {label} aligned tooltip
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="flex min-h-28 flex-wrap items-center justify-center gap-4 sm:px-20">
          <Tooltip id="react-runtime-tooltip-offset" openDelay={0} closeDelay={0}>
            <TooltipTrigger>
              <Button id="react-runtime-tooltip-offset-trigger" variant="ghost" size="sm">
                Offset placement
              </Button>
            </TooltipTrigger>
            <TooltipContent
              id="react-runtime-tooltip-offset-content"
              side="right"
              align="center"
              sideOffset={16}
              avoidCollisions={false}
              className="duration-0"
            >
              16px offset
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex min-h-28 flex-wrap items-center justify-center gap-4 sm:px-20">
          <Tooltip id="react-runtime-tooltip-default-open" defaultOpen>
            <TooltipTrigger asChild>
              <Button id="react-runtime-tooltip-default-open-trigger" variant="outline" size="sm">
                Default open
              </Button>
            </TooltipTrigger>
            <TooltipContent
              id="react-runtime-tooltip-default-open-content"
              side="top"
              align="center"
            >
              Ready on load
            </TooltipContent>
          </Tooltip>

          <Tooltip id="react-runtime-tooltip-animated" openDelay={250} closeDelay={300}>
            <TooltipTrigger asChild>
              <Button id="react-runtime-tooltip-animated-trigger" variant="secondary" size="sm">
                Animated timing
              </Button>
            </TooltipTrigger>
            <TooltipContent
              id="react-runtime-tooltip-animated-content"
              side="bottom"
              align="center"
              sideOffset={10}
              className="duration-[180ms]"
            >
              Opens and closes with motion
            </TooltipContent>
          </Tooltip>

          <Tooltip
            id="react-runtime-tooltip-dismissal"
            closeOnEscape={false}
            closeOnOutsideInteract={false}
            openDelay={150}
            closeDelay={150}
          >
            <TooltipTrigger asChild>
              <Button id="react-runtime-tooltip-dismissal-trigger" variant="outline" size="sm">
                Dismissal props
              </Button>
            </TooltipTrigger>
            <TooltipContent id="react-runtime-tooltip-dismissal-content" side="left" align="center">
              Escape and outside close are disabled
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex min-h-28 flex-wrap items-center justify-center gap-4 sm:px-20">
          <Tooltip id="react-runtime-tooltip-root-delay" openDelay={400} closeDelay={250}>
            <TooltipTrigger asChild>
              <Button id="react-runtime-tooltip-root-delay-trigger" variant="ghost" size="sm">
                Root timing
              </Button>
            </TooltipTrigger>
            <TooltipContent
              id="react-runtime-tooltip-root-delay-content"
              side="right"
              align="center"
            >
              Root-level delays
            </TooltipContent>
          </Tooltip>

          <Tooltip
            id="react-runtime-tooltip-no-hoverable"
            disableHoverableContent
            openDelay={200}
            closeDelay={300}
          >
            <TooltipTrigger asChild>
              <Button id="react-runtime-tooltip-no-hoverable-trigger" variant="secondary" size="sm">
                No hoverable content
              </Button>
            </TooltipTrigger>
            <TooltipContent
              id="react-runtime-tooltip-no-hoverable-content"
              side="bottom"
              align="end"
            >
              Content hover does not keep it open
            </TooltipContent>
          </Tooltip>

          <Tooltip id="react-runtime-tooltip-disabled" disabled open openDelay={0} closeDelay={0}>
            <TooltipTrigger asChild disabled>
              <Button
                id="react-runtime-tooltip-disabled-trigger"
                variant="outline"
                size="sm"
                disabled
              >
                Disabled
              </Button>
            </TooltipTrigger>
            <TooltipContent id="react-runtime-tooltip-disabled-content">
              Disabled tooltip
            </TooltipContent>
          </Tooltip>

          <Tooltip
            id="react-runtime-tooltip-disabled-toggle"
            disabled={controlledDisabled}
            open
            openDelay={0}
            closeDelay={0}
          >
            <TooltipTrigger asChild>
              <Button
                id="react-runtime-tooltip-disabled-toggle-trigger"
                variant="outline"
                size="sm"
              >
                Disabled gate
              </Button>
            </TooltipTrigger>
            <TooltipContent id="react-runtime-tooltip-disabled-toggle-content">
              Opens when enabled
            </TooltipContent>
          </Tooltip>

          <Button
            id="react-runtime-tooltip-disabled-toggle-enable"
            variant="ghost"
            size="sm"
            onClick={() => setControlledDisabled(false)}
          >
            Enable tooltip
          </Button>

          <Tooltip
            id="react-runtime-tooltip-controlled"
            open={controlledOpen}
            onOpenChange={(open) => setControlledOpen(open)}
            openDelay={150}
            closeDelay={200}
          >
            <TooltipTrigger asChild>
              <Button
                id="react-runtime-tooltip-controlled-trigger"
                variant="outline"
                size="sm"
                onClick={() => setControlledOpen((open) => !open)}
              >
                Controlled
              </Button>
            </TooltipTrigger>
            <TooltipContent id="react-runtime-tooltip-controlled-content" side="top" align="center">
              Controlled by React state
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </section>
  );
}
