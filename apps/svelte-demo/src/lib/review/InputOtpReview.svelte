<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./fixtures/InputOtpReview.svelte";
  import source from "./fixtures/InputOtpReview.svelte?raw";
</script>

<section
  data-styled-review="input-otp"
  id="input-otp-review"
  class="review-card min-w-0"
  aria-labelledby="input-otp-heading"
>
  <div class="section-heading">
    <h2 id="input-otp-heading">Input OTP</h2>
    <span class="component-label">input-otp</span>
  </div>
  <p>Type or paste a code. The native input supplies its value to the form.</p>
  <DocsExample component="input-otp" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
