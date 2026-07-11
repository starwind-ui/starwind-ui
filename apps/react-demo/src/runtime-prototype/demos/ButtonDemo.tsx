import { Button, IconCopy, IconPlus, IconSearch, IconSettings } from "../kit";

const buttonVariants = [
  "default",
  "primary",
  "secondary",
  "outline",
  "ghost",
  "info",
  "success",
  "warning",
  "error",
] as const;

export function ButtonDemo() {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Button</h2>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button id="react-runtime-button-default">Default</Button>
          <Button id="react-runtime-button-submit" type="submit">
            Submit
          </Button>
          {buttonVariants.slice(1).map((variant) => (
            <Button key={variant} variant={variant}>
              {variant.charAt(0).toUpperCase() + variant.slice(1)}
            </Button>
          ))}
          <Button id="react-runtime-button-disabled" disabled>
            Disabled
          </Button>
          <Button id="react-runtime-button-focusable-disabled" disabled focusableWhenDisabled>
            Focusable disabled
          </Button>
          <Button id="react-runtime-button-link" href="https://starwind.dev" target="_blank">
            Link
          </Button>
          <Button id="react-runtime-button-link-ghost" href="https://starwind.dev" variant="ghost">
            Link stays link
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button size="icon-sm" variant="outline" aria-label="Search">
            <IconSearch />
          </Button>
          <Button size="icon" variant="secondary" aria-label="Copy">
            <IconCopy />
          </Button>
          <Button size="icon-lg" variant="primary" aria-label="Add">
            <IconPlus />
          </Button>
          <Button variant="outline">
            <IconSettings className="size-4" />
            Settings
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button className="rounded-full px-6">Rounded override</Button>
          <Button variant="outline" className="border-dashed shadow-none">
            Dashed override
          </Button>
        </div>
      </div>
    </section>
  );
}
