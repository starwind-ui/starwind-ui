<script lang="ts">
  import Label from "$lib/starwind-runtime/label";
</script>

<div class="grid gap-5">
  <div class="grid gap-2">
    <Label for="review-native-name" size="sm">Project name</Label><input
      id="review-native-name"
      class="rounded-md border border-border bg-background px-3 py-2"
      value="Starwind"
    />
  </div>
  <div class="grid gap-2">
    <Label for="review-native-disabled" size="md">Unavailable field</Label><input
      id="review-native-disabled"
      class="rounded-md border border-border bg-muted px-3 py-2"
      disabled
      value="Read only"
    />
  </div>
  <Label size="lg"><input type="checkbox" class="mr-2" />Include archived projects</Label>
</div>
