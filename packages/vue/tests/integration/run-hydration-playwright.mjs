import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createSSRApp, Fragment, h } from "vue";
import { renderToString } from "vue/server-renderer";

import { AvatarFallback, AvatarImage, AvatarRoot } from "@starwind-ui/vue/avatar";
import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionRoot,
  AccordionTrigger,
} from "@starwind-ui/vue/accordion";
import {
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogViewport,
} from "@starwind-ui/vue/alert-dialog";
import { ButtonRoot } from "@starwind-ui/vue/button";
import { CheckboxIndicator, CheckboxRoot } from "@starwind-ui/vue/checkbox";
import { CheckboxGroupRoot } from "@starwind-ui/vue/checkbox-group";
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@starwind-ui/vue/dialog";
import {
  DrawerBackdrop,
  DrawerClose,
  DrawerDescription,
  DrawerPopup,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
} from "@starwind-ui/vue/drawer";
import { InputRoot } from "@starwind-ui/vue/input";
import {
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldRoot,
  FieldValidity,
} from "@starwind-ui/vue/field";
import {
  InputOtpGroup,
  InputOtpRoot,
  InputOtpSeparator,
  InputOtpSlot,
} from "@starwind-ui/vue/input-otp";
import {
  ProgressIndicator,
  ProgressLabel,
  ProgressRoot,
  ProgressTrack,
  ProgressValue,
} from "@starwind-ui/vue/progress";
import {
  PopoverClose,
  PopoverDescription,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from "@starwind-ui/vue/popover";
import { RadioGroupRoot } from "@starwind-ui/vue/radio-group";
import { RadioRoot } from "@starwind-ui/vue/radio";
import { SwitchRoot, SwitchThumb } from "@starwind-ui/vue/switch";
import { ToggleGroupRoot } from "@starwind-ui/vue/toggle-group";
import { ToggleRoot } from "@starwind-ui/vue/toggle";
import {
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@starwind-ui/vue/scroll-area";
import {
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@starwind-ui/vue/select";
import {
  SliderControl,
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from "@starwind-ui/vue/slider";
import { TabsIndicator, TabsList, TabsPanel, TabsRoot, TabsTab } from "@starwind-ui/vue/tabs";
import {
  DropzoneFilesList,
  DropzoneInput,
  DropzoneLoadingIndicator,
  DropzoneRoot,
  DropzoneUploadIndicator,
} from "@starwind-ui/vue/dropzone";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const repoRoot = path.resolve(packageRoot, "../..");
const vueDemoRequire = createRequire(path.join(repoRoot, "apps/vue-demo/package.json"));
const { chromium } = vueDemoRequire("playwright");
const runtimeRequire = createRequire(path.join(repoRoot, "packages/runtime/package.json"));
const floatingDomRoot = path.dirname(runtimeRequire.resolve("@floating-ui/dom/package.json"));
const floatingDomRequire = createRequire(path.join(floatingDomRoot, "package.json"));
const floatingCoreRoot = path.dirname(floatingDomRequire.resolve("@floating-ui/core/package.json"));
const floatingCoreRequire = createRequire(path.join(floatingCoreRoot, "package.json"));
const floatingUtilsRoot = path.dirname(
  floatingCoreRequire.resolve("@floating-ui/utils/package.json"),
);

const serverMarkup = await renderToString(createSSRApp({ render: renderFixture }));
const roots = {
  fixture: path.join(packageRoot, "tests/integration/hydration.playwright.fixture.js"),
  floatingCore: path.join(floatingCoreRoot, "dist/floating-ui.core.browser.mjs"),
  floatingDom: path.join(floatingDomRoot, "dist/floating-ui.dom.browser.mjs"),
  floatingUtils: path.join(floatingUtilsRoot, "dist/floating-ui.utils.mjs"),
  runtime: path.join(repoRoot, "packages/runtime/dist"),
  vue: path.join(packageRoot, "dist"),
  vueRuntime: path.join(packageRoot, "node_modules/vue/dist/vue.esm-browser.js"),
};

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    if (pathname === "/") {
      response.setHeader("content-type", "text/html; charset=utf-8");
      response.end(`<!doctype html>
<html>
  <body>
    <div id="hydration-host">${serverMarkup}</div>
    <div id="hydration-overlays"></div>
    <script type="importmap">
      {"imports":{"vue":"/vendor/vue.js","@starwind-ui/runtime/accordion":"/runtime/accordion.js","@starwind-ui/runtime/alert-dialog":"/runtime/alert-dialog.js","@starwind-ui/runtime/avatar":"/runtime/avatar.js","@starwind-ui/runtime/button":"/runtime/button.js","@starwind-ui/runtime/checkbox":"/runtime/checkbox.js","@starwind-ui/runtime/checkbox-group":"/runtime/checkbox-group.js","@starwind-ui/runtime/dialog":"/runtime/dialog.js","@starwind-ui/runtime/drawer":"/runtime/drawer.js","@starwind-ui/runtime/dropzone":"/runtime/dropzone.js","@starwind-ui/runtime/field":"/runtime/field.js","@starwind-ui/runtime/input":"/runtime/input.js","@starwind-ui/runtime/input-otp":"/runtime/input-otp.js","@starwind-ui/runtime/popover":"/runtime/popover.js","@starwind-ui/runtime/progress":"/runtime/progress.js","@starwind-ui/runtime/radio":"/runtime/radio.js","@starwind-ui/runtime/radio-group":"/runtime/radio-group.js","@starwind-ui/runtime/scroll-area":"/runtime/scroll-area.js","@starwind-ui/runtime/select":"/runtime/select.js","@starwind-ui/runtime/slider":"/runtime/slider.js","@starwind-ui/runtime/switch":"/runtime/switch.js","@starwind-ui/runtime/tabs":"/runtime/tabs.js","@starwind-ui/runtime/toggle":"/runtime/toggle.js","@starwind-ui/runtime/toggle-group":"/runtime/toggle-group.js","@floating-ui/dom":"/vendor/floating-ui-dom.mjs","@floating-ui/core":"/vendor/floating-ui-core.mjs","@floating-ui/utils":"/vendor/floating-ui-utils.mjs"}}
    </script>
    <script type="module">
      try {
        const { runHydrationChecks } = await import("/fixture.js");
        await runHydrationChecks();
        window.__STARWIND_HYDRATION_RESULT__ = { ok: true };
      } catch (error) {
        window.__STARWIND_HYDRATION_RESULT__ = { ok: false, error: error?.stack ?? String(error) };
      }
    </script>
  </body>
</html>`);
      return;
    }

    const file = resolveRequestFile(pathname);
    if (!file) {
      response.statusCode = 404;
      response.end("Not found");
      return;
    }
    response.setHeader("content-type", "text/javascript; charset=utf-8");
    response.end(await readFile(file));
  } catch (error) {
    response.statusCode = 500;
    response.end(error instanceof Error ? error.stack : String(error));
  }
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

const address = server.address();
if (!address || typeof address === "string") throw new Error("Hydration server did not bind.");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.stack ?? error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console.error: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    browserErrors.push(
      `request failed: ${request.url()} (${request.failure()?.errorText ?? "unknown error"})`,
    );
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      browserErrors.push(`HTTP ${response.status()}: ${response.url()}`);
  });

  await page.goto(`http://127.0.0.1:${address.port}/`);
  try {
    await page.waitForFunction(
      () => window.__STARWIND_HYDRATION_RESULT__ !== undefined,
      undefined,
      { timeout: 15_000 },
    );
  } catch (error) {
    if (browserErrors.length > 0) throw new Error(browserErrors.join("\n"), { cause: error });
    throw error;
  }
  const result = await page.evaluate(() => window.__STARWIND_HYDRATION_RESULT__);
  if (!result.ok) throw new Error(result.error);
  if (browserErrors.length > 0) throw new Error(browserErrors.join("\n"));
  console.log(`Vue built hydration checks passed in Chromium ${await browser.version()}.`);
} finally {
  await browser?.close();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

function renderFixture() {
  return h("main", null, [
    h(
      ButtonRoot,
      { focusableWhenDisabled: true, id: "hydrated-button" },
      { default: () => "Save" },
    ),
    h(
      CheckboxRoot,
      { defaultChecked: false, id: "hydrated-checkbox", label: "Accept terms" },
      { default: () => h(CheckboxIndicator, null, { default: () => "Selected" }) },
    ),
    h(
      CheckboxGroupRoot,
      { defaultValue: ["alpha"], id: "hydrated-checkbox-group" },
      {
        default: () => [h(CheckboxRoot, { value: "alpha" }), h(CheckboxRoot, { value: "beta" })],
      },
    ),
    h(
      RadioGroupRoot,
      { defaultValue: "alpha", id: "hydrated-radio-group" },
      {
        default: () => [h(RadioRoot, { value: "alpha" }), h(RadioRoot, { value: "beta" })],
      },
    ),
    h(Fragment, null, [
      h(InputRoot, { id: "hydrated-input", modelValue: "server input" }),
      h("output", { id: "hydrated-input-state" }, "server input"),
      h(
        SwitchRoot,
        { defaultChecked: false, id: "hydrated-switch" },
        { default: () => h(SwitchThumb) },
      ),
      h(
        "button",
        { id: "cancel-hydrated-switch", type: "button" },
        "Cancel next Switch activation",
      ),
      h("output", { id: "hydrated-switch-state" }, "checked:false, updates:0"),
    ]),
    h(
      DialogRoot,
      { id: "hydrated-dialog" },
      {
        default: () => [
          h(DialogTrigger, { id: "hydrated-dialog-trigger" }, { default: () => "Open Dialog" }),
          h(DialogBackdrop),
          h(
            DialogPopup,
            { id: "hydrated-dialog-popup" },
            {
              default: () => [
                h(DialogTitle, null, { default: () => "Hydrated Dialog" }),
                h(DialogDescription, null, { default: () => "Hydration-safe overlay" }),
                h(DialogClose, null, { default: () => "Close" }),
              ],
            },
          ),
        ],
      },
    ),
    renderAlertDialog(),
    renderDrawer(),
    renderPopover(),
    h(
      ToggleGroupRoot,
      { defaultValue: ["bold"], id: "hydrated-toggle-group" },
      {
        default: () => [
          h(ToggleRoot, { value: "bold" }, { default: () => "Bold" }),
          h(ToggleRoot, { value: "italic" }, { default: () => "Italic" }),
        ],
      },
    ),
    h(Fragment, null, [
      h(AccordionRoot, { id: "hydrated-accordion", modelValue: "alpha" }, () =>
        ["alpha", "beta"].map((value) =>
          h(AccordionItem, { key: value, value }, () => [
            h(AccordionHeader, null, () =>
              h(AccordionTrigger, { id: `hydrated-accordion-${value}` }, () => value.toUpperCase()),
            ),
            h(AccordionPanel, null, () => `${value} content`),
          ]),
        ),
      ),
      h("output", { id: "hydrated-accordion-state" }, "alpha"),
      h(TabsRoot, { id: "hydrated-tabs", modelValue: "account" }, () => [
        h(TabsList, null, () => [
          h(TabsTab, { id: "hydrated-tabs-account", value: "account" }, () => "Account"),
          h(TabsTab, { id: "hydrated-tabs-password", value: "password" }, () => "Password"),
          h(TabsIndicator),
        ]),
        h(TabsPanel, { value: "account" }, () => "Account content"),
        h(TabsPanel, { value: "password" }, () => "Password content"),
      ]),
      h("output", { id: "hydrated-tabs-state" }, "account"),
      h("form", { id: "hydrated-field-form" }, [
        h(FieldRoot, { name: "email" }, () => [
          h(FieldLabel, null, () => "Email"),
          h(FieldControl, {
            defaultValue: "",
            id: "hydrated-field-control",
            required: true,
            type: "email",
          }),
          h(FieldDescription, null, () => "Used for hydration checks"),
          h(FieldError, { match: "valueMissing" }, () => "Email is required"),
          h(FieldValidity, { match: "valid" }, () => "Email is valid"),
        ]),
        h("button", { id: "hydrated-field-submit", type: "submit" }, "Submit field"),
        h("button", { id: "hydrated-field-reset", type: "reset" }, "Reset field"),
      ]),
      h("output", { id: "hydrated-field-state" }, ""),
      h(SliderRoot, { id: "hydrated-slider", modelValue: [20, 80], name: "range" }, () =>
        h(SliderControl, { style: "position:relative;width:240px;height:32px" }, () => [
          h(SliderTrack, { style: "display:block;position:relative;width:240px;height:8px" }, () =>
            h(SliderIndicator),
          ),
          ...[20, 80].map((_value, index) =>
            h(SliderThumb, {
              index,
              key: index,
              style: "display:block;position:absolute;width:16px;height:16px",
            }),
          ),
        ]),
      ),
      h("button", { id: "hydrated-slider-add-thumb", type: "button" }, "Add slider thumb"),
      h("output", { id: "hydrated-slider-state" }, "[20,80]"),
      h(
        InputOtpRoot,
        {
          id: "hydrated-input-otp",
          maxLength: 6,
          modelValue: "12",
          name: "code",
        },
        () =>
          h(InputOtpGroup, null, () => [
            ...Array.from({ length: 3 }, (_, index) => h(InputOtpSlot, { index, key: index })),
            h(InputOtpSeparator),
            ...Array.from({ length: 3 }, (_, offset) =>
              h(InputOtpSlot, { index: offset + 3, key: offset + 3 }),
            ),
          ]),
      ),
      h("output", { id: "hydrated-input-otp-state" }, "12"),
      h(DropzoneRoot, { id: "hydrated-dropzone" }, () => [
        h(DropzoneUploadIndicator),
        h(DropzoneLoadingIndicator),
        h(DropzoneFilesList),
        h(DropzoneInput, { accept: "image/*,.txt", multiple: true, name: "assets" }),
      ]),
      h("output", { id: "hydrated-dropzone-state" }, ""),
      h(
        AvatarRoot,
        { id: "hydrated-avatar" },
        {
          default: () => [
            h(AvatarImage, {
              alt: "Hydrated profile",
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'/%3E",
            }),
            h(AvatarFallback, null, { default: () => "HP" }),
          ],
        },
      ),
      h(
        ProgressRoot,
        { max: 100, min: 0, value: 40 },
        {
          default: () => [
            h(ProgressLabel, null, { default: () => "Hydration progress" }),
            h(ProgressTrack, null, { default: () => h(ProgressIndicator) }),
            h(ProgressValue),
          ],
        },
      ),
      h("button", { id: "hydrated-progress-update", type: "button" }, "Update progress"),
      h(
        ScrollAreaRoot,
        { id: "hydrated-scroll-area", style: "height:120px;position:relative;width:200px" },
        {
          default: () => [
            h(
              ScrollAreaViewport,
              { style: "height:120px;width:200px" },
              {
                default: () =>
                  h(
                    ScrollAreaContent,
                    { style: "height:400px;width:600px" },
                    { default: () => "Hydrated scroll content" },
                  ),
              },
            ),
            h(
              ScrollAreaScrollbar,
              { keepMounted: true, style: "height:120px;width:10px" },
              {
                default: () =>
                  h(ScrollAreaThumb, { style: "height:var(--scroll-area-thumb-height)" }),
              },
            ),
            h(ScrollAreaCorner),
          ],
        },
      ),
    ]),
    h(
      SelectRoot,
      { defaultValue: "apple", modal: false },
      {
        default: () => [
          h(
            SelectTrigger,
            { id: "hydrated-select-trigger" },
            { default: () => h(SelectValue, { placeholder: "Choose fruit" }) },
          ),
          h(
            SelectPortal,
            { container: "#hydration-overlays" },
            {
              default: () =>
                h(
                  SelectPositioner,
                  { alignItemWithTrigger: false },
                  {
                    default: () =>
                      h(SelectPopup, null, {
                        default: () =>
                          h(SelectList, null, {
                            default: () => [
                              renderItem("apple", "Apple"),
                              renderItem("banana", "Banana"),
                            ],
                          }),
                      }),
                  },
                ),
            },
          ),
        ],
      },
    ),
  ]);
}

function renderAlertDialog() {
  return h(
    AlertDialogRoot,
    { id: "hydrated-alert-dialog" },
    {
      default: () => [
        h(AlertDialogTrigger, { id: "hydrated-alert-dialog-trigger" }, { default: () => "Delete" }),
        h(
          AlertDialogPortal,
          { container: "#hydration-overlays" },
          {
            default: () =>
              h(AlertDialogViewport, null, {
                default: () => [
                  h(AlertDialogBackdrop),
                  h(
                    AlertDialogPopup,
                    { id: "hydrated-alert-dialog-popup" },
                    {
                      default: () => [
                        h(AlertDialogTitle, null, { default: () => "Confirm delete" }),
                        h(AlertDialogDescription, null, { default: () => "Cannot undo" }),
                        h(AlertDialogClose, null, { default: () => "Cancel" }),
                      ],
                    },
                  ),
                ],
              }),
          },
        ),
      ],
    },
  );
}

function renderDrawer() {
  return h(
    DrawerRoot,
    { id: "hydrated-drawer" },
    {
      default: () => [
        h(DrawerTrigger, { id: "hydrated-drawer-trigger" }, { default: () => "Open Drawer" }),
        h(
          DrawerPortal,
          { container: "#hydration-overlays" },
          {
            default: () =>
              h(DrawerViewport, null, {
                default: () => [
                  h(DrawerBackdrop),
                  h(
                    DrawerPopup,
                    { id: "hydrated-drawer-popup", side: "left" },
                    {
                      default: () => [
                        h(DrawerTitle, null, { default: () => "Hydrated Drawer" }),
                        h(DrawerDescription, null, {
                          default: () => "Hydration-safe side overlay",
                        }),
                        h(DrawerClose, null, { default: () => "Close" }),
                      ],
                    },
                  ),
                ],
              }),
          },
        ),
      ],
    },
  );
}

function renderPopover() {
  return h(
    PopoverRoot,
    { id: "hydrated-popover" },
    {
      default: () => [
        h(PopoverTrigger, { id: "hydrated-popover-trigger" }, { default: () => "Open Popover" }),
        h(
          PopoverPortal,
          { container: "#hydration-overlays" },
          {
            default: () =>
              h(
                PopoverPositioner,
                { align: "end", side: "right" },
                {
                  default: () =>
                    h(
                      PopoverPopup,
                      { id: "hydrated-popover-popup" },
                      {
                        default: () => [
                          h(PopoverTitle, null, { default: () => "Hydrated Popover" }),
                          h(PopoverDescription, null, {
                            default: () => "Hydration-safe floating overlay",
                          }),
                          h(PopoverClose, null, { default: () => "Close" }),
                        ],
                      },
                    ),
                },
              ),
          },
        ),
      ],
    },
  );
}

function renderItem(value, label) {
  return h(
    SelectItem,
    { value },
    {
      default: () => [
        h(SelectItemText, null, { default: () => label }),
        h(SelectItemIndicator, null, { default: () => "Selected" }),
      ],
    },
  );
}

function resolveRequestFile(pathname) {
  if (pathname === "/fixture.js") return roots.fixture;
  if (pathname === "/vendor/floating-ui-core.mjs") return roots.floatingCore;
  if (pathname === "/vendor/floating-ui-dom.mjs") return roots.floatingDom;
  if (pathname === "/vendor/floating-ui-utils.mjs") return roots.floatingUtils;
  if (pathname === "/vendor/vue.js") return roots.vueRuntime;
  if (pathname.startsWith("/vue/")) return safeResolve(roots.vue, pathname.slice(5));
  if (pathname.startsWith("/runtime/")) return safeResolve(roots.runtime, pathname.slice(9));
}

function safeResolve(root, relativePath) {
  const resolved = path.resolve(root, relativePath);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return;
  return resolved;
}
