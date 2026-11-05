import { type Component, createApp } from "vue";
import { captureSubmits, markReady } from "../shared/harness";

const pages = import.meta.glob<{ default: Component }>("./*.vue");
const name = new URLSearchParams(location.search).get("page");
const { default: Page } = await pages[`./${name}.vue`]!();

captureSubmits();
createApp(Page).mount("#app");
markReady();
