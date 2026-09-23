<script lang="ts">
  import Card from "$lib/starwind-runtime/card";
  import { Button } from "$lib/starwind-runtime/button";
  let saved = $state(false);
</script>

<div class="grid items-start gap-5 md:grid-cols-2">
  <Card.Root size="md">
    <Card.Header>
      <Card.Title>Workspace overview</Card.Title>
      <Card.Description>Keep the project details close to your work.</Card.Description>
      <Card.Action
        ><Button size="sm" variant="ghost" onclick={() => (saved = !saved)}
          >{saved ? "Saved" : "Save"}</Button
        ></Card.Action
      >
    </Card.Header>
    <Card.Content
      ><p>12 active projects</p>
      <p class="mt-2 text-sm text-muted-foreground">
        Your team has completed 8 reviews this week.
      </p></Card.Content
    >
    <Card.Footer
      ><p class="text-sm" aria-live="polite">
        {saved ? "Saved to your workspace." : "Updated a few minutes ago."}
      </p></Card.Footer
    >
  </Card.Root>
  <Card.Root size="sm">
    <Card.Header
      ><Card.Title>Compact card</Card.Title><Card.Description
        >Use a small card for secondary details.</Card.Description
      ></Card.Header
    >
    <Card.Content><p>3 reviews need your attention.</p></Card.Content>
    <Card.Footer><p class="text-sm text-muted-foreground">Next review: tomorrow</p></Card.Footer>
  </Card.Root>
</div>
