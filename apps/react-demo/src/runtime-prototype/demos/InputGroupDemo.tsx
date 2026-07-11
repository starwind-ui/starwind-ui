import {
  IconCopy,
  IconMail,
  IconSearch,
  IconSettings,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
  Kbd,
  Spinner,
} from "../kit";

export function InputGroupDemo() {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Input Group</h2>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">Basic Addon</p>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <IconMail className="size-4" />
            </InputGroupAddon>
            <InputGroupInput placeholder="Email" />
          </InputGroup>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">With Button</p>
          <InputGroup>
            <InputGroupInput placeholder="Search..." />
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-sm">
                <IconSearch className="size-4" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="space-y-2 lg:col-span-2">
          <p className="text-sm font-medium">Multiple Addons</p>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <IconSettings className="size-4" />
            </InputGroupAddon>
            <InputGroupAddon align="inline-start">
              <InputGroupText>$</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput placeholder="Amount" />
            <InputGroupAddon align="inline-end">
              <InputGroupText>.00</InputGroupText>
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <InputGroupButton variant="outline" size="sm">
                Action
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="space-y-2 lg:col-span-2">
          <p className="text-sm font-medium">Copy Link Example</p>
          <InputGroup>
            <InputGroupInput value="https://starwind-ui.com" readOnly />
            <InputGroupAddon align="inline-end">
              <InputGroupButton variant="outline" size="sm">
                <IconCopy className="size-4" />
                Copy
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Block Alignments</p>
          <div className="space-y-4">
            <InputGroup>
              <InputGroupAddon align="block-start">
                <InputGroupText>Top Label</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput placeholder="Input with top label" />
            </InputGroup>

            <InputGroup>
              <InputGroupInput placeholder="Input with bottom label" />
              <InputGroupAddon align="block-end">
                <InputGroupText>Bottom Label</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Text Addons</p>
          <div className="space-y-4">
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>$</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput placeholder="0.00" />
              <InputGroupAddon align="inline-end">
                <InputGroupText>USD</InputGroupText>
              </InputGroupAddon>
            </InputGroup>

            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>https://</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput placeholder="example.com" className="pl-0.5!" />
              <InputGroupAddon align="inline-end">
                <InputGroupText>.com</InputGroupText>
              </InputGroupAddon>
            </InputGroup>

            <InputGroup>
              <InputGroupInput placeholder="Enter your username" />
              <InputGroupAddon align="inline-end">
                <InputGroupText>@company.com</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Textarea Addon</p>
          <InputGroup>
            <InputGroupTextarea placeholder="Enter your message" />
            <InputGroupAddon align="block-end">
              <InputGroupText className="text-xs">120 characters left</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">With Kbd</p>
          <InputGroup>
            <InputGroupInput placeholder="Search..." />
            <InputGroupAddon>
              <IconSearch className="size-4" />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <Kbd>Ctrl K</Kbd>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="space-y-2 lg:col-span-2">
          <p className="text-sm font-medium">With Spinner</p>
          <div className="grid gap-4 lg:grid-cols-3">
            <InputGroup>
              <InputGroupInput placeholder="Searching..." />
              <InputGroupAddon align="inline-end">
                <Spinner />
              </InputGroupAddon>
            </InputGroup>

            <InputGroup>
              <InputGroupInput placeholder="Processing..." />
              <InputGroupAddon>
                <Spinner />
              </InputGroupAddon>
            </InputGroup>

            <InputGroup>
              <InputGroupInput placeholder="Saving changes..." />
              <InputGroupAddon align="inline-end">
                <InputGroupText>Saving...</InputGroupText>
                <Spinner />
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </div>
    </section>
  );
}
