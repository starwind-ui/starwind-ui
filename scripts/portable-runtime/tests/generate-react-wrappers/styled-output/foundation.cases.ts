import { expect, path, readFile, readGeneratedFile, readGeneratedTree } from "../shared.js";

export async function assertReactStyledFoundationOutput(outputRoot: string): Promise<void> {
  await expectNoStyledGeneratedHeader(outputRoot);

  const badge = await readGeneratedFile(outputRoot, "badge/Badge.tsx");
  const badgeVariants = await readGeneratedFile(outputRoot, "badge/variants.ts");
  const badgeIndex = await readGeneratedFile(outputRoot, "badge/index.ts");
  const buttonVariants = await readGeneratedFile(outputRoot, "button/variants.ts");
  const alertDialogVariants = await readGeneratedFile(outputRoot, "alert-dialog/variants.ts");
  const label = await readGeneratedFile(outputRoot, "label/Label.tsx");
  const labelVariants = await readGeneratedFile(outputRoot, "label/variants.ts");
  const labelIndex = await readGeneratedFile(outputRoot, "label/index.ts");
  const separator = await readGeneratedFile(outputRoot, "separator/Separator.tsx");
  const separatorVariants = await readGeneratedFile(outputRoot, "separator/variants.ts");
  const separatorIndex = await readGeneratedFile(outputRoot, "separator/index.ts");
  const scrollArea = await readGeneratedFile(outputRoot, "scroll-area/ScrollArea.tsx");
  const scrollAreaViewport = await readGeneratedFile(
    outputRoot,
    "scroll-area/ScrollAreaViewport.tsx",
  );
  const scrollAreaContent = await readGeneratedFile(
    outputRoot,
    "scroll-area/ScrollAreaContent.tsx",
  );
  const scrollBar = await readGeneratedFile(outputRoot, "scroll-area/ScrollBar.tsx");
  const scrollAreaThumb = await readGeneratedFile(outputRoot, "scroll-area/ScrollAreaThumb.tsx");
  const scrollAreaCorner = await readGeneratedFile(outputRoot, "scroll-area/ScrollAreaCorner.tsx");
  const scrollAreaStyles = await readGeneratedFile(outputRoot, "scroll-area/styles.css");
  const scrollAreaVariants = await readGeneratedFile(outputRoot, "scroll-area/variants.ts");
  const scrollAreaIndex = await readGeneratedFile(outputRoot, "scroll-area/index.ts");
  const kbd = await readGeneratedFile(outputRoot, "kbd/Kbd.tsx");
  const kbdGroup = await readGeneratedFile(outputRoot, "kbd/KbdGroup.tsx");
  const kbdVariants = await readGeneratedFile(outputRoot, "kbd/variants.ts");
  const kbdIndex = await readGeneratedFile(outputRoot, "kbd/index.ts");
  const textarea = await readGeneratedFile(outputRoot, "textarea/Textarea.tsx");
  const textareaVariants = await readGeneratedFile(outputRoot, "textarea/variants.ts");
  const textareaIndex = await readGeneratedFile(outputRoot, "textarea/index.ts");
  const skeleton = await readGeneratedFile(outputRoot, "skeleton/Skeleton.tsx");
  const skeletonVariants = await readGeneratedFile(outputRoot, "skeleton/variants.ts");
  const skeletonIndex = await readGeneratedFile(outputRoot, "skeleton/index.ts");
  const spinner = await readGeneratedFile(outputRoot, "spinner/Spinner.tsx");
  const spinnerVariants = await readGeneratedFile(outputRoot, "spinner/variants.ts");
  const spinnerIndex = await readGeneratedFile(outputRoot, "spinner/index.ts");
  const prose = await readGeneratedFile(outputRoot, "prose/Prose.tsx");
  const proseStyles = await readGeneratedFile(outputRoot, "prose/styles.css");
  const proseVariants = await readGeneratedFile(outputRoot, "prose/variants.ts");
  const proseIndex = await readGeneratedFile(outputRoot, "prose/index.ts");
  const themeToggle = await readGeneratedFile(outputRoot, "theme-toggle/ThemeToggle.tsx");
  const themeToggleVariants = await readGeneratedFile(outputRoot, "theme-toggle/variants.ts");
  const themeToggleIndex = await readGeneratedFile(outputRoot, "theme-toggle/index.ts");
  const sidebarProvider = await readGeneratedFile(outputRoot, "sidebar/SidebarProvider.tsx");
  const sidebar = await readGeneratedFile(outputRoot, "sidebar/Sidebar.tsx");
  const sidebarTrigger = await readGeneratedFile(outputRoot, "sidebar/SidebarTrigger.tsx");
  const sidebarRail = await readGeneratedFile(outputRoot, "sidebar/SidebarRail.tsx");
  const sidebarMenuButton = await readGeneratedFile(outputRoot, "sidebar/SidebarMenuButton.tsx");
  const sidebarStyles = await readGeneratedFile(outputRoot, "sidebar/styles.css");
  const sidebarVariants = await readGeneratedFile(outputRoot, "sidebar/variants.ts");
  const sidebarIndex = await readGeneratedFile(outputRoot, "sidebar/index.ts");
  const canonicalProse = await readFile(
    path.join(process.cwd(), "packages/core/src/components/prose/Prose.astro"),
    "utf8",
  );
  const toastStyles = await readGeneratedFile(outputRoot, "toast/styles.css");
  const toastVariants = await readGeneratedFile(outputRoot, "toast/variants.ts");
  const card = await readGeneratedFile(outputRoot, "card/Card.tsx");
  const cardHeader = await readGeneratedFile(outputRoot, "card/CardHeader.tsx");
  const cardTitle = await readGeneratedFile(outputRoot, "card/CardTitle.tsx");
  const cardDescription = await readGeneratedFile(outputRoot, "card/CardDescription.tsx");
  const cardContent = await readGeneratedFile(outputRoot, "card/CardContent.tsx");
  const cardFooter = await readGeneratedFile(outputRoot, "card/CardFooter.tsx");
  const cardAction = await readGeneratedFile(outputRoot, "card/CardAction.tsx");
  const cardVariants = await readGeneratedFile(outputRoot, "card/variants.ts");
  const cardIndex = await readGeneratedFile(outputRoot, "card/index.ts");
  const breadcrumb = await readGeneratedFile(outputRoot, "breadcrumb/Breadcrumb.tsx");
  const breadcrumbList = await readGeneratedFile(outputRoot, "breadcrumb/BreadcrumbList.tsx");
  const breadcrumbItem = await readGeneratedFile(outputRoot, "breadcrumb/BreadcrumbItem.tsx");
  const breadcrumbLink = await readGeneratedFile(outputRoot, "breadcrumb/BreadcrumbLink.tsx");
  const breadcrumbPage = await readGeneratedFile(outputRoot, "breadcrumb/BreadcrumbPage.tsx");
  const breadcrumbSeparator = await readGeneratedFile(
    outputRoot,
    "breadcrumb/BreadcrumbSeparator.tsx",
  );
  const breadcrumbEllipsis = await readGeneratedFile(
    outputRoot,
    "breadcrumb/BreadcrumbEllipsis.tsx",
  );
  const breadcrumbVariants = await readGeneratedFile(outputRoot, "breadcrumb/variants.ts");
  const breadcrumbIndex = await readGeneratedFile(outputRoot, "breadcrumb/index.ts");
  const alert = await readGeneratedFile(outputRoot, "alert/Alert.tsx");
  const alertTitle = await readGeneratedFile(outputRoot, "alert/AlertTitle.tsx");
  const alertDescription = await readGeneratedFile(outputRoot, "alert/AlertDescription.tsx");
  const alertVariants = await readGeneratedFile(outputRoot, "alert/variants.ts");
  const alertIndex = await readGeneratedFile(outputRoot, "alert/index.ts");
  const avatar = await readGeneratedFile(outputRoot, "avatar/Avatar.tsx");
  const avatarImage = await readGeneratedFile(outputRoot, "avatar/AvatarImage.tsx");
  const avatarFallback = await readGeneratedFile(outputRoot, "avatar/AvatarFallback.tsx");
  const avatarVariants = await readGeneratedFile(outputRoot, "avatar/variants.ts");
  const avatarIndex = await readGeneratedFile(outputRoot, "avatar/index.ts");

  expect(badge).not.toContain("../primitives");
  expect(badge).toContain("ref?: React.Ref<HTMLDivElement | HTMLAnchorElement>;");
  expect(badge).toContain('const Tag = rest.href ? "a" : "div";');
  expect(badge).toContain("variant, tone, appearance, eyebrow, size");
  expect(badge).toContain(
    "const usesComposedBadgeStyle = tone !== undefined || appearance !== undefined;",
  );
  expect(badge).toContain(
    "const resolvedVariant = (usesComposedBadgeStyle ? null : variant) as typeof variant;",
  );
  expect(badge).toContain(
    'const resolvedTone = usesComposedBadgeStyle ? (tone ?? "neutral") : undefined;',
  );
  expect(badge).toContain(
    'const resolvedAppearance = usesComposedBadgeStyle ? (appearance ?? "soft") : undefined;',
  );
  expect(badge).toContain("<Tag");
  expect(badge).toContain("data-sw-badge");
  expect(badge).toContain("ref={ref as React.Ref<HTMLDivElement> & React.Ref<HTMLAnchorElement>}");
  expect(badge).toContain("variant: resolvedVariant");
  expect(badge).toContain("tone: resolvedTone");
  expect(badge).toContain("appearance: resolvedAppearance");
  expect(badge).toContain("eyebrow");
  expect(badge).toContain("isLink: Boolean(rest.href)");
  expect(badge).not.toContain('from "@starwind-ui/runtime"');
  expect(badgeVariants).not.toContain("starwind-badge");
  expect(badgeVariants).toContain("inline-flex items-center gap-1.5");
  expect(badgeVariants).toContain('variant: "default",');
  expect(badgeVariants).toContain('size: "md",');
  expect(badgeVariants).toContain("isLink: false");
  expect(badgeVariants).toContain("hover:bg-primary/80");
  expect(badgeVariants).toContain("tone: {");
  expect(badgeVariants).toContain('primary: ""');
  expect(badgeVariants).toContain('"primary-accent": ""');
  expect(badgeVariants).toContain('secondary: ""');
  expect(badgeVariants).toContain('"secondary-accent": ""');
  expect(badgeVariants).toContain('info: ""');
  expect(badgeVariants).toContain('success: ""');
  expect(badgeVariants).toContain('warning: ""');
  expect(badgeVariants).toContain('error: ""');
  expect(badgeVariants).toContain("appearance: {");
  expect(badgeVariants).toContain('solid: ""');
  expect(badgeVariants).toContain('soft: ""');
  expect(badgeVariants).toContain('outline: ""');
  expect(badgeVariants).toContain('text: ""');
  expect(badgeVariants).toContain('frosted: ""');
  expect(badgeVariants).toContain('true: "uppercase tracking-wider"');
  expect(badgeVariants).toContain("eyebrow: false");
  expect(badgeVariants).toContain("hover:bg-background/90");
  expect(badgeVariants).toContain("hover:bg-primary-accent/80");
  expect(badgeVariants).toContain("hover:bg-secondary/20");
  expect(badgeVariants).toContain("hover:bg-info/10");
  expect(badgeVariants).toContain("hover:underline underline-offset-4");
  expect(badgeVariants).toContain("bg-primary-accent text-background");
  expect(badgeVariants).toContain("bg-primary/10 text-foreground");
  expect(badgeVariants).toContain("bg-primary-accent/10 text-primary-accent");
  expect(badgeVariants).toContain("bg-secondary/10 text-foreground");
  expect(badgeVariants).toContain("bg-secondary-accent/10 text-secondary-accent");
  expect(badgeVariants).toContain("bg-info/10 text-foreground");
  expect(badgeVariants).toContain("border-info text-foreground");
  expect(badgeVariants).toContain("rounded-none border-0 bg-transparent p-0 shadow-none");
  expect(badgeVariants).toContain("text-primary-accent focus-visible:ring-primary-accent/50");
  expect(badgeVariants).toContain("border bg-background/80 shadow-sm backdrop-blur-sm");
  expect(badgeVariants).toContain("border-primary/40 text-foreground");
  expect(badgeVariants).toContain("border-primary-accent/40 text-primary-accent");
  expect(badgeIndex).toContain("export default Badge;");
  expect(badgeIndex).not.toContain("Root: Badge");
  const secondaryButtonClass =
    "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] focus-visible:ring-secondary/50";
  expect(buttonVariants).toContain(secondaryButtonClass);
  expect(buttonVariants).not.toContain("hover:bg-secondary/90");
  expect(alertDialogVariants).toContain(secondaryButtonClass);
  expect(alertDialogVariants).not.toContain("hover:bg-secondary/90");
  expect(label).not.toContain("../primitives");
  expect(label).toContain("ref?: React.Ref<HTMLLabelElement>;");
  expect(label).toContain("<label");
  expect(label).toContain("data-sw-label");
  expect(label).toContain("ref={ref}");
  expect(label).toContain("label({ size, class: className })");
  expect(label).not.toContain('from "@starwind-ui/runtime"');
  expect(labelVariants).toContain("text-foreground leading-none font-medium");
  expect(labelVariants).toContain("peer-disabled:cursor-not-allowed");
  expect(labelIndex).toContain("export default Label;");
  expect(labelIndex).not.toContain("Root: Label");
  expect(separator).not.toContain("../primitives");
  expect(separator).toContain(
    'Omit<React.ComponentPropsWithoutRef<"div">, "role" | "aria-orientation">',
  );
  expect(separator).toContain('orientation = "horizontal"');
  expect(separator).toContain("data-sw-separator");
  expect(separator).toContain('role="separator"');
  expect(separator).toContain("aria-orientation={orientation}");
  expect(separator).toContain("data-orientation={orientation}");
  expect(separator).toContain("separator({ orientation, class: className })");
  expect(separator).toContain('"data-slot": dataSlot = "separator"');
  expect(separator).toContain("data-slot={dataSlot}");
  expect(separatorVariants).toContain("bg-border shrink-0");
  expect(separatorVariants).toContain('horizontal: "h-[1px] w-full"');
  expect(separatorVariants).toContain('vertical: "h-full w-[1px]"');
  expect(separatorIndex).toContain("const SeparatorVariants");
  expect(separatorIndex).toContain("export default Separator;");
  expect(separatorIndex).not.toContain("Root: Separator");
  expect(scrollArea).toContain('ScrollAreaPrimitive from "../primitives/react/scroll-area"');
  expect(scrollArea).toContain("<ScrollAreaPrimitive.Root");
  expect(scrollArea).toContain("<ScrollAreaPrimitive.Viewport");
  expect(scrollArea).toContain("<ScrollAreaPrimitive.Content");
  expect(scrollArea).toContain("{children}");
  expect(scrollArea).toContain("{scrollbar ??");
  expect(scrollArea).toContain("<ScrollAreaPrimitive.Scrollbar");
  expect(scrollArea).toContain("<ScrollAreaPrimitive.Thumb");
  expect(scrollArea).toContain("<ScrollAreaPrimitive.Corner");
  expect(scrollArea).toContain("viewportClassName");
  expect(scrollArea).toContain('data-slot="scroll-area"');
  expect(scrollAreaViewport).toContain("<ScrollAreaPrimitive.Viewport");
  expect(scrollAreaViewport).toContain("scrollAreaViewport({ class: className })");
  expect(scrollAreaContent).toContain("<ScrollAreaPrimitive.Content");
  expect(scrollBar).toContain("<ScrollAreaPrimitive.Scrollbar");
  expect(scrollBar).toContain('orientation = "vertical"');
  expect(scrollBar).toContain("<ScrollAreaPrimitive.Thumb");
  expect(scrollAreaThumb).toContain("<ScrollAreaPrimitive.Thumb");
  expect(scrollAreaCorner).toContain("<ScrollAreaPrimitive.Corner");
  expect(scrollAreaStyles).toContain("[data-sw-scroll-area-viewport]");
  expect(scrollAreaVariants).not.toContain("starwind-scroll-area");
  expect(scrollAreaVariants).toContain("relative overflow-hidden");
  expect(scrollAreaVariants).toContain("data-[orientation=horizontal]:h-2.5");
  expect(scrollAreaIndex).toContain("ScrollAreaViewport");
  expect(scrollAreaIndex).toContain("ScrollBar");
  expect(scrollAreaIndex).toContain("Root: ScrollArea");
  expect(kbd).not.toContain("../primitives");
  expect(kbd).toContain("ref?: React.Ref<HTMLElement>;");
  expect(kbd).toContain("<kbd");
  expect(kbd).toContain("data-sw-kbd");
  expect(kbd).toContain("ref={ref}");
  expect(kbd).toContain("className={kbd({ class: className })}");
  expect(kbd).toContain('data-slot="kbd"');
  expect(kbdGroup).toContain("<kbd");
  expect(kbdGroup).toContain("data-sw-kbd-group");
  expect(kbdGroup).toContain("ref?: React.Ref<HTMLElement>;");
  expect(kbdGroup).toContain("ref={ref}");
  expect(kbdGroup).toContain("className={kbdGroup({ class: className })}");
  expect(kbdGroup).toContain("{children}");
  expect(kbdGroup).toContain('data-slot="kbd-group"');
  expect(kbd).not.toContain('from "@starwind-ui/runtime"');
  expect(kbdVariants).toContain("pointer-events-none inline-flex h-5");
  expect(kbdVariants).toContain("inline-flex items-center gap-1");
  expect(kbdIndex).toContain("Root: Kbd");
  expect(kbdIndex).toContain("Group: KbdGroup");
  expect(textarea).not.toContain("../primitives");
  expect(textarea).toContain("<textarea");
  expect(textarea).toContain('React.ComponentPropsWithoutRef<"textarea">');
  expect(textarea).toContain('"children"');
  expect(textarea).toContain('"data-slot"?: string;');
  expect(textarea).toContain("ref?: React.Ref<HTMLTextAreaElement>;");
  expect(textarea).toContain('"data-slot": dataSlot = "textarea"');
  expect(textarea).toContain("textarea({ size, class: className })");
  expect(textarea).toContain("ref={ref}");
  expect(textarea).toContain("data-slot={dataSlot}");
  expect(textarea).toMatch(/data-slot=\{dataSlot\}[\s\S]*\{\.\.\.rest\}/);
  expect(textarea).not.toContain('from "@starwind-ui/runtime"');
  expect(textareaVariants).toContain("border-input dark:bg-input/30");
  expect(textareaVariants).toContain("disabled:cursor-not-allowed");
  expect(textareaIndex).toContain("export default Textarea;");
  expect(textareaIndex).not.toContain("Root: Textarea");
  expect(skeleton).not.toContain("../primitives");
  expect(skeleton).toContain("<div");
  expect(skeleton).toContain('React.ComponentPropsWithoutRef<"div">');
  expect(skeleton).toContain('"children"');
  expect(skeleton).toContain("ref?: React.Ref<HTMLDivElement>;");
  expect(skeleton).toContain("const { ref, className, ...rest } = props;");
  expect(skeleton).toContain("skeleton({ class: className })");
  expect(skeleton).toContain("ref={ref}");
  expect(skeleton).toContain('data-slot="skeleton"');
  expect(skeleton).not.toContain('from "@starwind-ui/runtime"');
  expect(skeletonVariants).toContain("bg-muted animate-pulse rounded-md");
  expect(skeletonIndex).toContain("export default Skeleton;");
  expect(skeletonIndex).not.toContain("Root: Skeleton");
  expect(spinner).not.toContain("../primitives");
  expect(spinner).toContain('import { IconLoader2 as Loader2 } from "@tabler/icons-react";');
  expect(spinner).toContain('role="status"');
  expect(spinner).toContain('aria-label="Loading"');
  expect(spinner).toContain("spinner({ class: className })");
  expect(spinner).toContain('data-slot="spinner"');
  expect(spinnerVariants).toContain("size-4 animate-spin");
  expect(spinnerIndex).toContain("export default Spinner;");
  expect(spinnerIndex).not.toContain("Root: Spinner");
  expect(prose).not.toContain("../primitives");
  expect(prose).toContain('import "./styles.css";');
  expect(prose).toContain('React.ComponentPropsWithoutRef<"div">');
  expect(prose).toContain("ref?: React.Ref<HTMLDivElement>;");
  expect(prose).toContain("<div");
  expect(prose).toContain("data-sw-prose");
  expect(prose).toContain("prose({ class: className })");
  expect(prose).toContain("ref={ref}");
  expect(prose).toContain('data-slot="prose"');
  expect(proseStyles).toBe(`${extractGlobalStyle(canonicalProse).replace(/[ \t]+$/gm, "")}\n`);
  expect(proseStyles).not.toMatch(/[ \t]+$/m);
  expect(proseVariants).toContain("sw-prose max-w-[65ch]");
  expect(proseIndex).toContain("export default Prose;");
  expect(proseIndex).not.toContain("Root: Prose");
  expect(themeToggle).not.toContain("../primitives");
  expect(themeToggle).toContain('import * as React from "react";');
  expect(themeToggle).toContain(
    'import { IconMoon as Moon, IconSun as Sun } from "@tabler/icons-react";',
  );
  expect(themeToggle).toContain(
    'import { initThemeController } from "@starwind-ui/runtime/theme";',
  );
  expect(themeToggle).not.toContain('from "@starwind-ui/runtime"');
  expect(themeToggle).not.toContain('import { Toggle } from "../toggle";');
  expect(themeToggle).toContain('React.ComponentPropsWithoutRef<"button">');
  expect(themeToggle).toContain("ref?: React.Ref<HTMLButtonElement>;");
  expect(themeToggle).toContain("<button");
  expect(themeToggle).toContain('type="button"');
  expect(themeToggle).toContain("lightIcon?: React.ReactNode;");
  expect(themeToggle).toContain("darkIcon?: React.ReactNode;");
  expect(themeToggle).toContain('ariaLabel = "Toggle theme"');
  expect(themeToggle).toContain('variant = "outline"');
  expect(themeToggle).toContain('size = "md"');
  expect(themeToggle).toContain('syncGroup = "starwind-theme"');
  expect(themeToggle).toContain("const initialPressed = pressed ?? defaultPressed ?? false;");
  expect(themeToggle).toContain('aria-pressed={initialPressed ? "true" : "false"}');
  expect(themeToggle).toContain("themeToggle({ variant, size, class: className })");
  expect(themeToggle).toContain("data-sw-toggle");
  expect(themeToggle).toContain("data-sw-theme-toggle");
  expect(themeToggle).toContain("data-sw-theme-control");
  expect(themeToggle).toContain('data-theme-on="dark"');
  expect(themeToggle).toContain('data-theme-off="light"');
  expect(themeToggle).toContain("data-sync-group={syncGroup}");
  expect(themeToggle).toContain("ref={ref}");
  expect(themeToggle).toContain("{lightIcon ??");
  expect(themeToggle).toContain("{darkIcon ??");
  expect(themeToggle).toContain("data-theme-icon");
  expect(themeToggle).toContain('aria-hidden="true"');
  expect(themeToggle).toContain("React.useEffect(() =>");
  expect(themeToggle).toContain("initThemeController();");
  expect(themeToggle).toContain("}, []);");
  expect(themeToggleVariants).not.toContain("starwind-theme-toggle");
  expect(themeToggleVariants).toContain("data-[state=on]:bg-transparent");
  expect(themeToggleIndex).toContain("export default ThemeToggle;");
  expect(themeToggleIndex).not.toContain("Root: ThemeToggle");
  expect(sidebarProvider).toContain('SidebarPrimitive from "../primitives/react/sidebar"');
  expect(sidebarProvider).not.toContain("@starwind-ui/runtime/sidebar");
  expect(sidebarProvider).toContain("<SidebarPrimitive.Provider");
  expect(sidebarProvider).toContain("defaultOpen={defaultOpen}");
  expect(sidebarProvider).toContain("defaultMobileOpen={defaultMobileOpen}");
  expect(sidebarProvider).toContain("open={open}");
  expect(sidebarProvider).toContain("mobileOpen={mobileOpen}");
  expect(sidebarProvider).toContain("onOpenChange={onOpenChange}");
  expect(sidebarProvider).toContain("onMobileOpenChange={onMobileOpenChange}");
  expect(sidebarProvider).toContain("persistOpen={persistOpen}");
  expect(sidebarProvider).toContain("persistenceStorage={persistenceStorage}");
  expect(sidebar).toContain("import { Sheet, SheetContent, SheetDescription");
  expect(sidebar).toContain("<SidebarPrimitive.Sidebar");
  expect(sidebar).toContain("data-collapsible-mode={collapsible}");
  expect(sidebar).toContain('data-slot="sidebar-mobile"');
  expect(sidebar).toContain("<SheetContent");
  expect(sidebarTrigger).toContain(
    'import { IconLayoutSidebar as LayoutSidebar } from "@tabler/icons-react";',
  );
  expect(sidebarTrigger).toContain('SidebarPrimitive from "../primitives/react/sidebar"');
  expect(sidebarTrigger).toContain("<SidebarPrimitive.Trigger");
  expect(sidebarTrigger).toContain("asChild");
  expect(sidebarTrigger).toContain('aria-label="Toggle Sidebar"');
  expect(sidebarTrigger).toContain("<LayoutSidebar");
  expect(sidebarRail).toContain('SidebarPrimitive from "../primitives/react/sidebar"');
  expect(sidebarRail).toContain("<SidebarPrimitive.Rail");
  expect(sidebarRail).toContain("tabIndex={-1}");
  expect(sidebarMenuButton).toContain('import "./styles.css";');
  expect(sidebarMenuButton).toContain("<Tooltip");
  expect(sidebarMenuButton).toContain("<TooltipTrigger");
  expect(sidebarMenuButton).toContain('className="w-full"');
  expect(sidebarMenuButton).toContain('SidebarPrimitive from "../primitives/react/sidebar"');
  expect(sidebarMenuButton).toContain("<SidebarPrimitive.MenuButton");
  expect(sidebarMenuButton).toContain("asChild");
  expect(sidebarMenuButton).toContain("data-tooltip={tooltip}");
  expect(sidebarMenuButton).toContain("href={href}");
  expect(sidebarMenuButton).toContain("data-sw-sidebar-tooltip-content");
  expect(sidebarStyles).toContain(
    ':root:not([data-starwind-sidebar-tooltips="enabled"]) [data-sw-sidebar-tooltip-content] {',
  );
  expect(sidebarStyles).not.toContain(".starwind-sidebar-tooltip-content");
  expect(sidebar).not.toContain("starwind-sidebar-mobile");
  expect(sidebarMenuButton).not.toContain("starwind-sidebar-menu-button-tooltip");
  expect(sidebarVariants).not.toContain("starwind-sidebar");
  expect(sidebarVariants).toContain("group-data-[collapsible=icon]:w-(--sidebar-width-icon)");
  expect(sidebarVariants).toContain("transition-[margin,opacity]");
  expect(sidebarVariants).toContain("group-data-[collapsible=icon]:pointer-events-none");
  expect(sidebarVariants).toContain("group-data-[collapsible=icon]:-mt-10");
  expect(sidebarIndex).toContain("SidebarProvider");
  expect(sidebarIndex).toContain("MenuButton: SidebarMenuButton");
  expect(toastStyles).toContain('[data-sw-toast-viewport] [data-slot="toast"]');
  expect(toastStyles).not.toContain(".starwind-toast-viewport");
  expect(toastVariants).not.toContain("starwind-toast");
  expect(card).not.toContain("../primitives");
  expect(card).toContain("<div");
  expect(card).toContain("VariantProps<typeof card>");
  expect(card).toContain("ref?: React.Ref<HTMLDivElement>;");
  expect(card).toContain('const { size = "default", ref, className, children, ...rest } = props;');
  expect(card).toContain("card({ size, class: className })");
  expect(card).toContain("data-size={size}");
  expect(card).toContain("ref={ref}");
  expect(card).toContain('data-slot="card"');
  expect(cardHeader).toContain("<div");
  expect(cardHeader).toContain("cardHeader({ class: className })");
  expect(cardHeader).toContain("ref={ref}");
  expect(cardHeader).toContain('data-slot="card-header"');
  expect(cardTitle).toContain("<div");
  expect(cardTitle).toContain("cardTitle({ class: className })");
  expect(cardTitle).toContain("ref={ref}");
  expect(cardTitle).toContain('data-slot="card-title"');
  expect(cardDescription).toContain("<div");
  expect(cardDescription).toContain("cardDescription({ class: className })");
  expect(cardDescription).toContain("ref={ref}");
  expect(cardDescription).toContain('data-slot="card-description"');
  expect(cardContent).toContain("<div");
  expect(cardContent).toContain("cardContent({ class: className })");
  expect(cardContent).toContain("ref={ref}");
  expect(cardContent).toContain('data-slot="card-content"');
  expect(cardFooter).toContain("<div");
  expect(cardFooter).toContain("cardFooter({ class: className })");
  expect(cardFooter).toContain("ref={ref}");
  expect(cardFooter).toContain('data-slot="card-footer"');
  expect(cardAction).toContain("<div");
  expect(cardAction).toContain("cardAction({ class: className })");
  expect(cardAction).toContain('data-slot="card-action"');
  expect(card).not.toContain('from "@starwind-ui/runtime"');
  expect(cardVariants).toContain("bg-card text-card-foreground group/card");
  expect(cardVariants).toContain("gap-(--card-spacing)");
  expect(cardVariants).toContain("py-(--card-spacing)");
  expect(cardVariants).toContain('default: "[--card-spacing:--spacing(5)]"');
  expect(cardVariants).toMatch(
    /sm: "(?:text-sm \[--card-spacing:--spacing\(4\)\]|\[--card-spacing:--spacing\(4\)\] text-sm)"/,
  );
  expect(cardVariants).toContain('base: "px-(--card-spacing)"');
  expect(cardVariants).toContain(
    'base: "bg-muted/50 flex items-center rounded-b-xl border-t p-(--card-spacing)"',
  );
  expect(cardVariants).toContain(
    '"@container/card-header grid auto-rows-min items-start gap-1 px-(--card-spacing)"',
  );
  expect(cardVariants).not.toContain("group-data-[size=sm]/card:px-4");
  expect(cardVariants).not.toContain("group-data-[size=sm]/card:p-4");
  expect(cardIndex).toContain("Root: Card");
  expect(cardIndex).toContain("Header: CardHeader");
  expect(cardIndex).toContain("Title: CardTitle");
  expect(cardIndex).toContain("Description: CardDescription");
  expect(cardIndex).toContain("Content: CardContent");
  expect(cardIndex).toContain("Footer: CardFooter");
  expect(cardIndex).toContain("Action: CardAction");
  expect(breadcrumb).not.toContain("../primitives");
  expect(breadcrumb).toContain("ref?: React.Ref<HTMLElement>;");
  expect(breadcrumb).toContain("<nav");
  expect(breadcrumb).toContain('aria-label="breadcrumb"');
  expect(breadcrumb).toContain("data-sw-breadcrumb");
  expect(breadcrumb).toContain("ref={ref}");
  expect(breadcrumb).toContain('data-slot="breadcrumb"');
  expect(breadcrumbList).toContain("<ol");
  expect(breadcrumbList).toContain("breadcrumbList({ class: className })");
  expect(breadcrumbList).toContain('data-slot="breadcrumb-list"');
  expect(breadcrumbItem).toContain("<li");
  expect(breadcrumbItem).toContain("breadcrumbItem({ class: className })");
  expect(breadcrumbItem).toContain('data-slot="breadcrumb-item"');
  expect(breadcrumbLink).toContain("asChild?: boolean;");
  expect(breadcrumbLink).toContain("if (asChild)");
  expect(breadcrumbLink).toContain("return children;");
  expect(breadcrumbLink).toContain("<a");
  expect(breadcrumbLink).toContain("breadcrumbLink({ class: className })");
  expect(breadcrumbLink).toContain('data-slot="breadcrumb-link"');
  expect(breadcrumbPage).toContain('role="link"');
  expect(breadcrumbPage).toContain('aria-disabled="true"');
  expect(breadcrumbPage).toContain('aria-current="page"');
  expect(breadcrumbPage).toContain("breadcrumbPage({ class: className })");
  expect(breadcrumbSeparator).toContain(
    'import { IconChevronRight as ChevronRight } from "@tabler/icons-react";',
  );
  expect(breadcrumbSeparator).toContain('role="presentation"');
  expect(breadcrumbSeparator).toContain('aria-hidden="true"');
  expect(breadcrumbSeparator).toContain("<ChevronRight />");
  expect(breadcrumbEllipsis).toContain('import { IconDots as Dots } from "@tabler/icons-react";');
  expect(breadcrumbEllipsis).toContain("icon?: React.ReactNode;");
  expect(breadcrumbEllipsis).toContain("icon ??");
  expect(breadcrumbEllipsis).toContain("<Dots />");
  expect(breadcrumbEllipsis).toContain('<span className="sr-only">More</span>');
  expect(breadcrumb).not.toContain('from "@starwind-ui/runtime"');
  expect(breadcrumbVariants).toContain("text-muted-foreground flex flex-wrap items-center");
  expect(breadcrumbVariants).toContain("hover:text-foreground transition-colors");
  expect(breadcrumbIndex).toContain("Root: Breadcrumb");
  expect(breadcrumbIndex).toContain("List: BreadcrumbList");
  expect(breadcrumbIndex).toContain("Ellipsis: BreadcrumbEllipsis");
  expect(breadcrumbIndex).toContain("Item: BreadcrumbItem");
  expect(breadcrumbIndex).toContain("Link: BreadcrumbLink");
  expect(breadcrumbIndex).toContain("Separator: BreadcrumbSeparator");
  expect(breadcrumbIndex).toContain("Page: BreadcrumbPage");
  expect(alert).not.toContain("../primitives");
  expect(alert).toContain("ref?: React.Ref<HTMLDivElement>;");
  expect(alert).toContain("const inferredRole =");
  expect(alert).toContain('variant === "error" || variant === "warning" ? "alert" : "status"');
  expect(alert).toContain("<div");
  expect(alert).toContain("data-sw-alert");
  expect(alert).toContain("alert({ variant, class: className })");
  expect(alert).toContain("role={inferredRole}");
  expect(alert).toContain("ref={ref}");
  expect(alert).toContain('data-slot="alert"');
  expect(alertTitle).toContain("<h5");
  expect(alertTitle).toContain("data-sw-alert-title");
  expect(alertTitle).toContain("alertTitle({ class: className })");
  expect(alertTitle).toContain("ref={ref}");
  expect(alertTitle).toContain('data-slot="alert-title"');
  expect(alertDescription).toContain("<p");
  expect(alertDescription).toContain("data-sw-alert-description");
  expect(alertDescription).toContain("alertDescription({ class: className })");
  expect(alertDescription).toContain("ref={ref}");
  expect(alertDescription).toContain('data-slot="alert-description"');
  expect(alert).not.toContain('from "@starwind-ui/runtime"');
  expect(alertVariants).toContain("text-foreground relative w-full rounded-lg border p-4");
  expect(alertVariants).toContain("border-warning bg-warning/7");
  expect(alertIndex).toContain("Root: Alert");
  expect(alertIndex).toContain("Title: AlertTitle");
  expect(alertIndex).toContain("Description: AlertDescription");
  expect(avatar).toContain('AvatarPrimitive from "../primitives/react/avatar"');
  expect(avatar).toContain("<AvatarPrimitive.Root");
  expect(avatar).toContain("VariantProps<typeof avatar>");
  expect(avatar).toContain("ref?: React.Ref<HTMLSpanElement>;");
  expect(avatar).toContain("avatar({ variant, size, class: className })");
  expect(avatar).toContain('data-slot="avatar"');
  expect(avatarImage).toContain("<AvatarPrimitive.Image");
  expect(avatarImage).toContain("avatarImage({ class: className })");
  expect(avatarImage).toContain("alt: string;");
  expect(avatarImage).toContain("onLoadingStatusChange?:");
  expect(avatarImage).toContain('data-slot="avatar-image"');
  expect(avatarFallback).toContain("<AvatarPrimitive.Fallback");
  expect(avatarFallback).toContain("delay?: number");
  expect(avatarFallback).toContain("avatarFallback({ class: className })");
  expect(avatarFallback).toContain('data-slot="avatar-fallback"');
  expect(avatar).not.toContain('from "@starwind-ui/runtime"');
  expect(avatarVariants).toContain("text-foreground bg-muted relative inline-flex overflow-hidden");
  expect(avatarVariants).toContain("border-warning");
  expect(avatarIndex).toContain("Root: Avatar");
  expect(avatarIndex).toContain("Image: AvatarImage");
  expect(avatarIndex).toContain("Fallback: AvatarFallback");
}

export async function assertReactBadgeToneAppearanceFoundationOutput(
  outputRoot: string,
): Promise<void> {
  const badge = await readGeneratedFile(outputRoot, "badge/Badge.tsx");
  const badgeVariants = await readGeneratedFile(outputRoot, "badge/variants.ts");
  const badgeIndex = await readGeneratedFile(outputRoot, "badge/index.ts");

  expect(badge).not.toContain("../primitives");
  expect(badge).toContain("ref?: React.Ref<HTMLDivElement | HTMLAnchorElement>;");
  expect(badge).toContain('const Tag = rest.href ? "a" : "div";');
  expect(badge).toContain("variant, tone, appearance, eyebrow, size");
  expect(badge).toContain(
    "const usesComposedBadgeStyle = tone !== undefined || appearance !== undefined;",
  );
  expect(badge).toContain(
    "const resolvedVariant = (usesComposedBadgeStyle ? null : variant) as typeof variant;",
  );
  expect(badge).toContain(
    'const resolvedTone = usesComposedBadgeStyle ? (tone ?? "neutral") : undefined;',
  );
  expect(badge).toContain(
    'const resolvedAppearance = usesComposedBadgeStyle ? (appearance ?? "soft") : undefined;',
  );
  expect(badge).toContain("<Tag");
  expect(badge).toContain("data-sw-badge");
  expect(badge).toContain("ref={ref as React.Ref<HTMLDivElement> & React.Ref<HTMLAnchorElement>}");
  expect(badge).toContain("variant: resolvedVariant");
  expect(badge).toContain("tone: resolvedTone");
  expect(badge).toContain("appearance: resolvedAppearance");
  expect(badge).toContain("eyebrow");
  expect(badge).toContain("isLink: Boolean(rest.href)");
  expect(badge).not.toContain('from "@starwind-ui/runtime"');
  expect(badgeVariants).not.toContain("starwind-badge");
  expect(badgeVariants).toContain("inline-flex items-center gap-1.5");
  expect(badgeVariants).toContain('variant: "default",');
  expect(badgeVariants).toContain('size: "md",');
  expect(badgeVariants).toContain("isLink: false");
  expect(badgeVariants).toContain("hover:bg-primary/80");
  expect(badgeVariants).toContain("tone: {");
  expect(badgeVariants).toContain('primary: ""');
  expect(badgeVariants).toContain('"primary-accent": ""');
  expect(badgeVariants).toContain('secondary: ""');
  expect(badgeVariants).toContain('"secondary-accent": ""');
  expect(badgeVariants).toContain('info: ""');
  expect(badgeVariants).toContain('success: ""');
  expect(badgeVariants).toContain('warning: ""');
  expect(badgeVariants).toContain('error: ""');
  expect(badgeVariants).toContain("appearance: {");
  expect(badgeVariants).toContain('solid: ""');
  expect(badgeVariants).toContain('soft: ""');
  expect(badgeVariants).toContain('outline: ""');
  expect(badgeVariants).toContain('text: ""');
  expect(badgeVariants).toContain('frosted: ""');
  expect(badgeVariants).toContain('true: "uppercase tracking-wider"');
  expect(badgeVariants).toContain("eyebrow: false");
  expect(badgeVariants).toContain("hover:bg-background/90");
  expect(badgeVariants).toContain("hover:bg-primary-accent/80");
  expect(badgeVariants).toContain("hover:bg-secondary/20");
  expect(badgeVariants).toContain("hover:bg-info/10");
  expect(badgeVariants).toContain("hover:underline underline-offset-4");
  expect(badgeVariants).toContain("bg-primary-accent text-background");
  expect(badgeVariants).toContain("bg-primary/10 text-foreground");
  expect(badgeVariants).toContain("bg-primary-accent/10 text-primary-accent");
  expect(badgeVariants).toContain("bg-secondary/10 text-foreground");
  expect(badgeVariants).toContain("bg-secondary-accent/10 text-secondary-accent");
  expect(badgeVariants).toContain("bg-info/10 text-foreground");
  expect(badgeVariants).toContain("border-info text-foreground");
  expect(badgeVariants).toContain("rounded-none border-0 bg-transparent p-0 shadow-none");
  expect(badgeVariants).toContain("text-primary-accent focus-visible:ring-primary-accent/50");
  expect(badgeVariants).toContain("border bg-background/80 shadow-sm backdrop-blur-sm");
  expect(badgeVariants).toContain("border-primary/40 text-foreground");
  expect(badgeVariants).toContain("border-primary-accent/40 text-primary-accent");
  expect(badgeIndex).toContain("export default Badge;");
  expect(badgeIndex).not.toContain("Root: Badge");
}

function extractGlobalStyle(source: string): string {
  const match = source.match(/<style is:global>\r?\n([\s\S]*?)\r?\n<\/style>/);
  expect(match).not.toBeNull();

  return match![1]
    .split(/\r?\n/)
    .map((line) => (line.startsWith("  ") ? line.slice(2) : line))
    .join("\n")
    .trimEnd();
}

async function expectNoStyledGeneratedHeader(outputRoot: string): Promise<void> {
  const tree = await readGeneratedTree(outputRoot);
  const forbiddenSnippets = [
    "Generated by scripts/portable-runtime/generate-",
    "Do not edit by hand",
    "update the contract/template instead",
  ];

  for (const [relativePath, source] of Object.entries(tree)) {
    for (const snippet of forbiddenSnippets) {
      expect(source, `${relativePath} should be consumer-editable`).not.toContain(snippet);
    }
  }
}
