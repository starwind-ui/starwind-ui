import { type Component, mount } from "svelte";
import { captureSubmits, markReady } from "../shared/harness";

const pages = import.meta.glob<{ default: Component }>("./*.svelte");
const name = new URLSearchParams(location.search).get("page");
const { default: Page } = await pages[`./${name}.svelte`]!();

captureSubmits();
mount(Page, { target: document.getElementById("app")! });
markReady();
