<script setup lang="ts">
import { ref } from "vue";

import { Button } from "./starwind-runtime/button";
import { Checkbox } from "./starwind-runtime/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./starwind-runtime/select";

const styledChecked = ref(true);
const asChildValue = ref<string | null>("apple");
const childClicks = ref(0);
const wrapperClicks = ref(0);
</script>

<template>
  <section id="styled-review" class="review-card" data-testid="styled-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Generated Styled output and visual contracts</p>
        <h2>Styled variants</h2>
      </div>
    </div>

    <div class="demo-row" data-testid="styled-button-variants">
      <Button variant="default" size="sm">Default</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary" size="lg">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="error">Error</Button>
    </div>

    <div class="demo-row" data-testid="styled-checkbox-variants">
      <Checkbox
        v-model:checked="styledChecked"
        id="styled-checkbox"
        label="Styled primary checkbox"
        name="styled-checkbox"
        value="yes"
        variant="primary"
        size="lg"
        data-testid="styled-checkbox"
      />
      <output data-testid="styled-checkbox-state">checked: {{ styledChecked }}</output>
    </div>

    <article class="scenario">
      <h3>Standard Styled Select trigger</h3>
      <Select default-value="banana" :modal="false">
        <SelectTrigger data-testid="styled-select-standard-trigger">
          <SelectValue placeholder="Pick fruit" />
        </SelectTrigger>
        <SelectContent data-testid="styled-select-standard-content">
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>
    </article>

    <article class="scenario" data-testid="styled-select-scenario">
      <h3>Strict SelectTrigger asChild</h3>
      <Select v-model="asChildValue" :modal="false">
        <SelectTrigger
          as-child
          data-testid="styled-select-trigger-wrapper"
          @click="wrapperClicks += 1"
        >
          <button data-testid="styled-select-as-child" @click="childClicks += 1">
            Styled asChild trigger: {{ asChildValue }}
          </button>
        </SelectTrigger>
        <SelectContent :align-item-with-trigger="false" data-testid="styled-select-content">
          <SelectGroup>
            <SelectLabel>Styled fruit</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectSeparator />
          </SelectGroup>
        </SelectContent>
      </Select>
      <output data-testid="styled-select-listener-state">
        child-clicks={{ childClicks }}, wrapper-clicks={{ wrapperClicks }}
      </output>
      <p>
        The child remains the single semantic button, defaults to <code>type="button"</code>, and
        receives merged listeners, classes, Runtime attributes, and refs. This focused
        <code>asChild</code> example opts out of item alignment; the standard example above
        exercises the Styled default.
      </p>
    </article>
  </section>
</template>
