<script lang="ts">
  import { Input } from "$lib/starwind-runtime/input";
  import { Label } from "$lib/starwind-runtime/label";
</script>

<div class="w-[400px] max-w-full">
  <div class="space-y-2">
    <Label for="docs-label-demo-input">Email</Label>
    <Input id="docs-label-demo-input" type="email" placeholder="Enter your email" />
  </div>
</div>
