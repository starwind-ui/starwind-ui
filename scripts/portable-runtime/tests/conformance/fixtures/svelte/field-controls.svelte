<script lang="ts">
  import { Field as StyledField } from "@conformance/styled-svelte/field";
  import { Field } from "@starwind-ui/svelte/field";
  import FieldHeldControl from "./parts/FieldHeldControl.svelte";

  const kinds = ["sel", "cmb", "chk", "swi", "sld", "rad", "inp"] as const;
  const forms = (["p", "s"] as const).flatMap((style) =>
    kinds.flatMap((kind) =>
      [false, true].map((held) => ({
        style,
        kind,
        held,
        id: `${style}${kind}-${held ? "h" : "u"}`,
      })),
    ),
  );
</script>

<main>
  <form id="pcmb-n"><FieldHeldControl id="pcmb-n" kind="cmb" styled={false} held={true} /></form>
  {#each forms as form (form.id)}
    {@const Root = form.style === "p" ? Field.Root : StyledField}
    <form id={form.id}>
      <Root name="f">
        <FieldHeldControl id={form.id} kind={form.kind} styled={form.style === "s"} held={form.held} />
      </Root>
      <button type="submit" data-testid={`${form.id}-submit`}>Submit</button>
    </form>
  {/each}
</main>
