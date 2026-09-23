<script lang="ts">
  import { Button } from "$lib/starwind-runtime/button";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/starwind-runtime/card";
  import { Input } from "$lib/starwind-runtime/input";
  import { Label } from "$lib/starwind-runtime/label";
  import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
  } from "$lib/starwind-runtime/select";
</script>

<Card class="w-[360px] max-w-full">
  <CardHeader>
    <CardTitle>Create project</CardTitle>
    <CardDescription>Deploy your new project in one-click.</CardDescription>
  </CardHeader>
  <CardContent class="flex flex-col gap-4">
    <div class="flex w-full flex-col gap-2">
      <Label for="docs-card-project-name">Name</Label>
      <Input type="text" id="docs-card-project-name" placeholder="Name of your project" />
    </div>
    <div class="flex w-full flex-col gap-2">
      <Label for="docs-card-project-framework">Framework</Label>
      <Select name="framework" required>
        <SelectTrigger id="docs-card-project-framework" class="w-full">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Frameworks</SelectLabel>
            <SelectItem value="astro">Astro</SelectItem>
            <SelectItem value="next">Next.js</SelectItem>
            <SelectItem value="svelte">SvelteKit</SelectItem>
            <SelectItem value="solid">SolidStart</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  </CardContent>
  <CardFooter class="flex justify-between">
    <Button variant="outline">Cancel</Button>
    <Button type="submit">Deploy</Button>
  </CardFooter>
</Card>
