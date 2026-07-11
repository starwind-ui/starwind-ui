import { IconSelector } from "@tabler/icons-react";

import { Button, button, Collapsible, CollapsibleContent, CollapsibleTrigger } from "../kit";

export function CollapsibleDemo() {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Collapsible</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Collapsible className="w-full max-w-[350px] space-y-2" defaultOpen>
          <div className="flex items-center justify-between space-x-4 px-4">
            <h4 className="text-sm font-semibold">@starwind-ui starred 3 repositories</h4>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <IconSelector className="size-4" />
                <span className="sr-only">Runtime notes</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <div className="rounded-md border px-4 py-2 font-mono text-sm">astro</div>
          <CollapsibleContent className="space-y-2">
            <div className="rounded-md border px-4 py-2 font-mono text-sm">tailwindcss</div>
            <div className="rounded-md border px-4 py-2 font-mono text-sm">starwind-ui</div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="rounded-md border p-4">
          <CollapsibleTrigger asChild className={button({ variant: "secondary", size: "sm" })}>
            <button id="react-runtime-collapsible-as-child-trigger" type="button">
              As child notes
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent
            id="react-runtime-collapsible-as-child-content"
            className="text-muted-foreground mt-3 text-sm"
          >
            This trigger is supplied as a child element while the runtime owns the state.
          </CollapsibleContent>
        </Collapsible>
      </div>
    </section>
  );
}
