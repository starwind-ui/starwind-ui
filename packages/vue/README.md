# `@starwind-ui/vue`

This package provides the public beta of Starwind UI Primitive adapters for Vue 3.5 or newer. The
adapters connect Vue components to the shared framework-neutral Runtime.

The Vue adapter is in beta. Its API can change during the `0.x` release series. Install beta
releases with the `beta` npm tag:

```bash
npm install @starwind-ui/vue@beta vue@^3.5
```

## Use an adapter

```vue
<script setup lang="ts">
import Button from "@starwind-ui/vue/button";
</script>

<template>
  <Button.Root type="button">Save</Button.Root>
</template>
```

The package ships precompiled ESM and declarations. Vue remains a peer dependency, and the adapter
uses the tested `@starwind-ui/runtime` 1.2.0 release.

## Beta feedback

Report Vue beta issues through the
[Starwind UI issue tracker](https://github.com/starwind-ui/starwind-ui/issues).

## License

Licensed under the [MIT license](https://github.com/starwind-ui/starwind-ui/blob/main/LICENSE).
