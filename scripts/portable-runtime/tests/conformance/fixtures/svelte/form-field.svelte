<script lang="ts">
  import { Field as StyledField } from "@conformance/styled-svelte/field";
  import { Field } from "@starwind-ui/svelte/field";
  import FieldControl from "./parts/FieldControl.svelte";

  let tick = $state(0);
  const kinds = ["ps", "pc", "ss", "sc"] as const;
  const cases = [
    { name: "def", defaultValue: "a" },
    { name: "pick" },
    { name: "kid", defaultValue: "a", child: true },
    { name: "own", defaultValue: "a", own: "own" },
  ];
  const forms = kinds.flatMap((kind) =>
    cases.map((entry) => ({ ...entry, kind, id: `${kind}-${entry.name}` })),
  );
</script>

<main>
  <button type="button" data-testid="ff-tick" onclick={() => (tick += 1)}>Render again</button>
  {#each forms as form (form.id)}
    {@const Root = form.kind[0] === "p" ? Field.Root : StyledField}
    <form id={form.id}>
      <Root name="fruit">
        <FieldControl
          id={form.id}
          kind={form.kind}
          {tick}
          child={form.child}
          name={form.own}
          defaultValue={form.defaultValue}
        />
      </Root>
      <button type="submit" data-testid={`${form.id}-submit`}>Submit</button>
    </form>
  {/each}
</main>
