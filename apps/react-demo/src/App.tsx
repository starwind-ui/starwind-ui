import { lazy, Suspense } from "react";

import { RuntimePrototypeProvider } from "./runtime-prototype/context";
import {
  AccordionDemo,
  AlertDemo,
  AlertDialogDemo,
  AspectRatioDemo,
  AvatarDemo,
  BadgeDemo,
  BreadcrumbDemo,
  ButtonDemo,
  ButtonGroupDemo,
  CardDemo,
  CarouselDemo,
  CheckboxDemo,
  CheckboxGroupDemo,
  CollapsibleDemo,
  ColorPickerDemo,
  ComboboxDemo,
  ContextMenuDemo,
  ControlledReactDemo,
  DialogDemo,
  DropdownDemo,
  DropzoneDemo,
  FieldDemo,
  HoverCardDemo,
  ImageDemo,
  InputDemo,
  InputGroupDemo,
  InputOTPDemo,
  IntroDemo,
  ItemDemo,
  KbdDemo,
  LabelDemo,
  NativeSelectDemo,
  NavigationMenuDemo,
  PaginationDemo,
  PopoverDemo,
  ProgressDemo,
  ProseDemo,
  RadioGroupDemo,
  ScrollAreaDemo,
  SelectDemo,
  SeparatorDemo,
  SheetDemo,
  SkeletonDemo,
  SliderDemo,
  SpinnerDemo,
  SwitchDemo,
  TableDemo,
  TabsDemo,
  TextareaDemo,
  ThemeToggleDemo,
  ToastDemo,
  ToggleDemo,
  ToggleGroupDemo,
  TooltipDemo,
  VideoDemo,
} from "./runtime-prototype/demos";
import { ThemeToggle } from "./runtime-prototype/kit";
import {
  RuntimeCollectionsDemoPage,
  RuntimeFormsDemoPage,
  RuntimeNestedSidebarDemoPage,
  RuntimeOverlaysDemoPage,
  RuntimeSidebarDemoPage,
} from "./runtime-prototype/pages";

// The chart page loads TanStack Charts, so it stays out of the bundle that every route loads.
const RuntimeChartsDemoPage = lazy(() =>
  import("./runtime-prototype/pages/RuntimeChartsDemoPage").then((module) => ({
    default: module.RuntimeChartsDemoPage,
  })),
);

// The chart gallery also loads TanStack Charts, so it has its own lazy chunk.
const RuntimeChartGalleryPage = lazy(() =>
  import("./runtime-prototype/pages/RuntimeChartGalleryPage").then((module) => ({
    default: module.RuntimeChartGalleryPage,
  })),
);

const navLinks = [
  { href: "/", label: "Runtime Prototype", paths: ["/", "/runtime-prototype"] },
  {
    href: "/pages/runtime-sidebar-demo",
    label: "Runtime Sidebar",
    paths: ["/pages/runtime-sidebar-demo", "/runtime-sidebar-demo"],
  },
  {
    href: "/pages/runtime-nested-sidebar",
    label: "Runtime Nested Sidebar",
    paths: ["/pages/runtime-nested-sidebar", "/runtime-nested-sidebar"],
  },
  {
    href: "/runtime-forms",
    label: "Runtime Forms",
    paths: ["/runtime-forms", "/pages/runtime-forms"],
  },
  {
    href: "/runtime-collections",
    label: "Runtime Collections",
    paths: ["/runtime-collections", "/pages/runtime-collections"],
  },
  {
    href: "/runtime-overlays",
    label: "Runtime Overlays",
    paths: ["/runtime-overlays", "/pages/runtime-overlays"],
  },
  {
    href: "/runtime-charts",
    label: "Runtime Charts",
    paths: ["/runtime-charts", "/pages/runtime-charts"],
  },
];

const runtimeSidebarPaths = new Set(["/pages/runtime-sidebar-demo", "/runtime-sidebar-demo"]);
const runtimeNestedSidebarPaths = new Set([
  "/pages/runtime-nested-sidebar",
  "/runtime-nested-sidebar",
]);
const runtimeFormsPaths = new Set(["/runtime-forms", "/pages/runtime-forms"]);
const runtimeCollectionsPaths = new Set(["/runtime-collections", "/pages/runtime-collections"]);
const runtimeOverlaysPaths = new Set(["/runtime-overlays", "/pages/runtime-overlays"]);
const runtimeChartsPaths = new Set(["/runtime-charts", "/pages/runtime-charts"]);
const runtimeChartGalleryPath = /^\/runtime-charts\/([a-z]+)$/;

function App() {
  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  const chartGalleryType = runtimeChartGalleryPath.exec(pathname)?.[1];
  const isRuntimeSidebarPage =
    runtimeSidebarPaths.has(pathname) || runtimeNestedSidebarPaths.has(pathname);

  return (
    <RuntimePrototypeProvider>
      {isRuntimeSidebarPage ? null : <AppNav pathname={pathname} />}

      {runtimeSidebarPaths.has(pathname) ? (
        <RuntimeSidebarDemoPage />
      ) : runtimeNestedSidebarPaths.has(pathname) ? (
        <RuntimeNestedSidebarDemoPage />
      ) : runtimeFormsPaths.has(pathname) ? (
        <RuntimeFormsDemoPage />
      ) : runtimeCollectionsPaths.has(pathname) ? (
        <RuntimeCollectionsDemoPage />
      ) : runtimeOverlaysPaths.has(pathname) ? (
        <RuntimeOverlaysDemoPage />
      ) : runtimeChartsPaths.has(pathname) ? (
        <Suspense fallback={null}>
          <RuntimeChartsDemoPage />
        </Suspense>
      ) : chartGalleryType ? (
        <Suspense fallback={null}>
          <RuntimeChartGalleryPage type={chartGalleryType} />
        </Suspense>
      ) : (
        <div className="min-h-[calc(100lvh-4.25rem)]">
          <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
            <IntroDemo />

            <CollapsibleDemo />

            <ColorPickerDemo />

            <ControlledReactDemo />

            <ButtonGroupDemo />

            <ItemDemo />

            <NativeSelectDemo />

            <PaginationDemo />

            <TableDemo />

            <AspectRatioDemo />

            <VideoDemo />

            <ImageDemo />

            <CarouselDemo />

            <ButtonDemo />

            <CheckboxDemo />

            <CheckboxGroupDemo />

            <RadioGroupDemo />

            <BadgeDemo />

            <LabelDemo />

            <InputDemo />

            <DropzoneDemo />

            <InputGroupDemo />

            <SpinnerDemo />

            <FieldDemo />

            <InputOTPDemo />

            <SliderDemo />

            <SwitchDemo />

            <ToggleDemo />

            <ThemeToggleDemo />

            <ToggleGroupDemo />

            <TabsDemo />

            <TextareaDemo />

            <SkeletonDemo />

            <CardDemo />

            <BreadcrumbDemo />

            <SeparatorDemo />

            <ScrollAreaDemo />

            <NavigationMenuDemo />

            <SelectDemo />

            <ComboboxDemo />

            <ToastDemo />

            <AlertDemo />

            <AvatarDemo />

            <KbdDemo />

            <TooltipDemo />

            <HoverCardDemo />

            <ProgressDemo />

            <ProseDemo />

            <AccordionDemo />

            <AlertDialogDemo />

            <SheetDemo />

            <DropdownDemo />

            <ContextMenuDemo />

            <PopoverDemo />

            <DialogDemo />
          </main>
        </div>
      )}
    </RuntimePrototypeProvider>
  );
}

function AppNav({ pathname }: { pathname: string }) {
  return (
    <header className="bg-background sticky top-0 z-50 border-b py-3 shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-8 gap-y-3">
          <a href="/" className="text-2xl font-semibold hover:opacity-80">
            Starwind UI React
          </a>

          <nav className="flex flex-wrap items-center gap-4" aria-label="React demo pages">
            {navLinks.map((link) => {
              const isActive = link.paths.includes(pathname);

              return (
                <a
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "text-sm transition-colors",
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>
        </div>

        <ThemeToggle id="react-demo-app-theme-toggle" />
      </div>
    </header>
  );
}

export default App;
