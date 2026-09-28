<script lang="ts">
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "$lib/starwind-runtime/accordion";
</script>

<div class="w-full max-w-[500px]">
  <Accordion defaultValue="item-1">
    <AccordionItem value="item-1">
      <AccordionTrigger>What is Astro?</AccordionTrigger>
      <AccordionContent>
        Astro is an web framework for building fast, scalable, and secure websites.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-2">
      <AccordionTrigger>Why should I use Astro?</AccordionTrigger>
      <AccordionContent>
        Astro provides a set of features that make it an ideal choice for building fast, scalable,
        and secure websites.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-3">
      <AccordionTrigger>How do I get started with Astro?</AccordionTrigger>
      <AccordionContent>
        To get started with Astro, follow the instructions in the documentation.
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</div>
