import type { FormEvent } from "react";
import { useRuntimePrototypeContext } from "../context";
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  Input,
  Label,
} from "../kit";

const frameworks = [
  { label: "Astro", value: "astro" },
  { label: "Next.js", value: "next" },
  { label: "SvelteKit", value: "svelte" },
  { label: "SolidStart", value: "solid" },
];

function handleCreateProjectSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const values = Object.fromEntries(formData.entries());
  console.log(values);
}

function selectAstroFramework() {
  const frameworkCombobox = document.getElementById("react-runtime-project-framework-combobox");

  frameworkCombobox?.dispatchEvent(
    new CustomEvent("starwind:set-value", {
      detail: { value: "astro" },
    }),
  );

  console.log('Dispatched event to select "astro"');
}

export function CardDemo() {
  const { cardRefSlot, setCardRef } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Card</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card ref={setCardRef} size="sm" className="runtime-card-custom max-w-md">
          <CardHeader>
            <CardTitle>Portable card</CardTitle>
            <CardDescription>Generated styled card anatomy</CardDescription>
            <CardAction>
              <span className="bg-muted rounded-md px-2 py-1 text-xs">Ready</span>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Root size data flows into header, content, footer, title, and description styles.
            </p>
          </CardContent>
          <CardFooter>
            <span className="text-muted-foreground text-sm">Footer content</span>
          </CardFooter>
        </Card>

        <Card className="runtime-card-default max-w-md">
          <CardContent>Default card shell</CardContent>
        </Card>

        <Card className="runtime-card-image max-w-md overflow-hidden p-0">
          <img
            className="aspect-video w-full object-cover"
            src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=960&q=80"
            alt="Geometric building facade"
            loading="lazy"
          />
          <CardHeader>
            <CardTitle>Runtime preview</CardTitle>
            <CardDescription>Image card with generated card anatomy.</CardDescription>
            <CardAction>
              <Badge variant="info" size="sm">
                Live
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="justify-between">
            <span className="text-muted-foreground text-sm">Updated today</span>
            <Button size="sm" variant="outline">
              Open
            </Button>
          </CardFooter>
        </Card>

        <Card className="max-w-md md:col-span-2">
          <form
            id="react-runtime-create-project-form"
            className="flex flex-col gap-6"
            data-runtime-card-form
            onSubmit={handleCreateProjectSubmit}
          >
            <CardHeader>
              <CardTitle>Create project</CardTitle>
              <CardDescription>Deploy your new project in one-click.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="react-runtime-project-name" size="sm">
                  Name
                </Label>
                <Input
                  id="react-runtime-project-name"
                  name="name"
                  placeholder="Name of your project"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="react-runtime-project-framework" size="sm">
                  Framework
                </Label>
                <Combobox id="react-runtime-project-framework-combobox" name="framework" required>
                  <ComboboxInput
                    id="react-runtime-project-framework"
                    placeholder="Search framework"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No framework found.</ComboboxEmpty>
                    {frameworks.map((framework) => (
                      <ComboboxItem key={framework.value} value={framework.value}>
                        {framework.label}
                      </ComboboxItem>
                    ))}
                  </ComboboxContent>
                </Combobox>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="react-runtime-project-domain" size="sm">
                  Domain
                </Label>
                <Input
                  id="react-runtime-project-domain"
                  name="domain"
                  placeholder="runtime.starwind.dev"
                  defaultValue="runtime.starwind.dev"
                />
              </div>
            </CardContent>
            <CardFooter className="justify-between gap-3">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Deploy
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="max-w-md md:col-span-2">
          <Button type="button" variant="primary" onClick={selectAstroFramework}>
            Programmatically select "astro"
          </Button>
        </div>
      </div>
      <p className="sr-only" data-runtime-card-ref>
        {cardRefSlot}
      </p>
    </section>
  );
}
