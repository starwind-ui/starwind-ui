import { type ComponentType, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { captureSubmits, markReady } from "../shared/harness";

const pages = import.meta.glob<{ default: ComponentType }>(["./*.tsx", "!./entry.tsx"]);
const name = new URLSearchParams(location.search).get("page");
const { default: Page } = await pages[`./${name}.tsx`]!();

captureSubmits();
createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);
markReady();
