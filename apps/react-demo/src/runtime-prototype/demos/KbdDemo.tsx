import { Button, Kbd, KbdGroup, Tooltip, TooltipContent, TooltipTrigger } from "../kit";

export function KbdDemo() {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Kbd</h2>
      <div className="flex flex-wrap items-center gap-4">
        <Kbd>Esc</Kbd>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
        <Tooltip id="react-runtime-tooltip-default" openDelay={0} closeDelay={25}>
          <TooltipTrigger>
            <Button variant="outline" size="sm">
              Shortcut help
            </Button>
          </TooltipTrigger>
          <TooltipContent
            id="react-runtime-tooltip-content"
            className="flex items-center gap-2"
            side="top"
          >
            <span>Press</span>
            <Kbd>?</Kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    </section>
  );
}
