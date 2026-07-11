import { useState } from "react";
import { Button, HoverCard, HoverCardContent, HoverCardTrigger } from "../kit";

const sideExamples = [
  { side: "top", label: "Top" },
  { side: "right", label: "Right" },
  { side: "bottom", label: "Bottom" },
  { side: "left", label: "Left" },
] as const;

export function HoverCardDemo() {
  const [controlledOpen, setControlledOpen] = useState(false);

  return (
    <section className="space-y-4" id="react-runtime-hover-card-demo">
      <h2 className="font-heading text-xl font-semibold">Hover Card</h2>
      <div className="space-y-6">
        <div className="flex min-h-36 flex-wrap items-center justify-center gap-4 sm:px-20">
          {sideExamples.map(({ side, label }) => (
            <HoverCard
              key={side}
              id={`react-runtime-hover-card-side-${side}`}
              openDelay={0}
              closeDelay={0}
            >
              <HoverCardTrigger asChild>
                <Button
                  id={`react-runtime-hover-card-side-${side}-trigger`}
                  variant="outline"
                  size="sm"
                >
                  {label} side
                </Button>
              </HoverCardTrigger>
              <HoverCardContent
                id={`react-runtime-hover-card-side-${side}-content`}
                side={side}
                avoidCollisions={false}
                className="duration-0"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{label} preview</p>
                  <p className="text-muted-foreground text-sm">
                    Content follows the requested side and remains hoverable.
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>

        <div className="flex min-h-36 flex-wrap items-center justify-center gap-4 sm:px-20">
          <HoverCard id="react-runtime-hover-card-aligned" openDelay={100} closeDelay={250}>
            <HoverCardTrigger asChild>
              <Button id="react-runtime-hover-card-aligned-trigger" variant="secondary" size="sm">
                End aligned
              </Button>
            </HoverCardTrigger>
            <HoverCardContent
              id="react-runtime-hover-card-aligned-content"
              side="bottom"
              align="end"
              sideOffset={12}
              className="duration-[160ms]"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">Aligned preview</p>
                <p className="text-muted-foreground text-sm">
                  Offset and close timing use root props.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>

          <HoverCard
            id="react-runtime-hover-card-no-hoverable"
            disableHoverableContent
            openDelay={150}
            closeDelay={300}
          >
            <HoverCardTrigger asChild>
              <Button id="react-runtime-hover-card-no-hoverable-trigger" variant="ghost" size="sm">
                Non-hoverable
              </Button>
            </HoverCardTrigger>
            <HoverCardContent
              id="react-runtime-hover-card-no-hoverable-content"
              side="top"
              align="center"
              className="duration-[160ms]"
            >
              <p className="text-sm">Leaving the trigger starts the close timer immediately.</p>
            </HoverCardContent>
          </HoverCard>

          <HoverCard
            id="react-runtime-hover-card-controlled"
            open={controlledOpen}
            data-runtime-controlled-hover-card={controlledOpen ? "open" : "closed"}
            onOpenChange={(open) => setControlledOpen(open)}
            openDelay={120}
            closeDelay={200}
          >
            <HoverCardTrigger asChild>
              <Button id="react-runtime-hover-card-controlled-trigger" variant="outline" size="sm">
                Controlled
              </Button>
            </HoverCardTrigger>
            <HoverCardContent
              id="react-runtime-hover-card-controlled-content"
              side="right"
              align="start"
              className="duration-[140ms]"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">Controlled preview</p>
                <p className="text-muted-foreground text-sm">
                  React owns open state while the runtime handles placement.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>

          <HoverCard id="react-runtime-hover-card-as-child" openDelay={0} closeDelay={150}>
            <HoverCardTrigger asChild>
              <a
                id="react-runtime-hover-card-as-child-trigger"
                href="#react-runtime-hover-card-as-child"
                className="text-primary text-sm font-medium underline-offset-4 hover:underline"
              >
                As child link
              </a>
            </HoverCardTrigger>
            <HoverCardContent
              id="react-runtime-hover-card-as-child-content"
              side="left"
              align="end"
              className="duration-[120ms]"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">Linked trigger</p>
                <p className="text-muted-foreground text-sm">
                  Runtime attributes transfer to the supplied anchor.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
    </section>
  );
}
