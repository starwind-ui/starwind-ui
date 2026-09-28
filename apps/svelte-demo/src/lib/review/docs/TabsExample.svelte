<script lang="ts">
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/starwind-runtime/tabs";
</script>

<div>
  <Tabs defaultValue="astro" class="max-w-[400px] max-w-full">
    <TabsList>
      <TabsTrigger value="astro">Astro</TabsTrigger>
      <TabsTrigger value="next">Next.js</TabsTrigger>
    </TabsList>
    <TabsContent value="astro">
      Build fast websites, faster with Astro's next-gen island architecture.
    </TabsContent>
    <TabsContent value="next">
      The React framework for production-grade applications that scale.
    </TabsContent>
  </Tabs>
</div>
