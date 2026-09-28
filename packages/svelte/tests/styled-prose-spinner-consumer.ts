import { createStyledNativeConsumer } from "./styled-native-consumer.js";
export const proseSpinnerRoots = ["prose", "spinner"] as const;
export const proseSpinnerImports = `import Prose, {Prose as NamedProse, ProseVariants, type ProseProps} from "./prose/index.js";
import Spinner, {Spinner as NamedSpinner, SpinnerVariants, type SpinnerProps} from "./spinner/index.js";`;
export const createStyledProseSpinnerConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, proseSpinnerRoots);
export const proseSpinnerPositive = `<script lang="ts">
${proseSpinnerImports}
let proseRef=$state<HTMLDivElement>(), spinnerRef=$state<SVGSVGElement>();
const prose:ProseProps={id:"article",lang:"en",dir:"ltr",class:["reading",{active:true}],style:"--prose-spacing:1.5em",ref:proseRef,onpointerdown(event){const owner:HTMLDivElement=event.currentTarget;void owner;}};
const spinner:SpinnerProps={id:"spinner",viewBox:"0 0 48 48",width:24,height:"24",fill:"none",stroke:"currentColor","stroke-width":3,"aria-hidden":false,focusable:"false",class:["size-6",{loading:true}],style:"color:blue",ref:spinnerRef,onpointerdown(event){const owner:SVGSVGElement=event.currentTarget;void owner;}};
void [ProseVariants.prose(),SpinnerVariants.spinner()];
</script>
<Prose {...prose}><h2>Guide</h2><p>Read <a href="#next">the next page</a>.</p><ul><li>Entry</li></ul></Prose><NamedProse>Alias</NamedProse>
<Spinner {...spinner}/><NamedSpinner aria-hidden={false}/>`;
