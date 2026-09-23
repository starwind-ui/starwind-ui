<script lang="ts">
  import ColorPickerReview from "$lib/review/ColorPickerReview.svelte";
  import ToastReview from "$lib/review/ToastReview.svelte";
  import CarouselReview from "$lib/review/CarouselReview.svelte";
  import ComboboxReview from "$lib/review/ComboboxReview.svelte";
  import NavigationMenuReview from "$lib/review/NavigationMenuReview.svelte";
  import ContextMenuReview from "$lib/review/ContextMenuReview.svelte";
  import DropdownReview from "$lib/review/DropdownReview.svelte";
  import SliderReview from "$lib/review/SliderReview.svelte";
  import TabsReview from "$lib/review/TabsReview.svelte";
  import AccordionReview from "$lib/review/AccordionReview.svelte";
  import DropzoneReview from "$lib/review/DropzoneReview.svelte";
  import InputOtpReview from "$lib/review/InputOtpReview.svelte";
  import FieldReview from "$lib/review/FieldReview.svelte";
  import ToggleReview from "$lib/review/ToggleReview.svelte";
  import ToggleGroupReview from "$lib/review/ToggleGroupReview.svelte";
  import InputGroupReview from "$lib/review/InputGroupReview.svelte";
  import FormReview from "$lib/review/FormReview.svelte";
  import InputReview from "$lib/review/InputReview.svelte";
  import CollapsibleReview from "$lib/review/CollapsibleReview.svelte";
  import ScrollAreaReview from "$lib/review/ScrollAreaReview.svelte";
  import ProgressReview from "$lib/review/ProgressReview.svelte";
  import AvatarReview from "$lib/review/AvatarReview.svelte";
  import VideoReview from "$lib/review/VideoReview.svelte";
  import NativeSelectReview from "$lib/review/NativeSelectReview.svelte";
  import TextareaReview from "$lib/review/TextareaReview.svelte";
  import ProseReview from "$lib/review/ProseReview.svelte";
  import SpinnerReview from "$lib/review/SpinnerReview.svelte";
  import ButtonGroupReview from "$lib/review/ButtonGroupReview.svelte";
  import PaginationReview from "$lib/review/PaginationReview.svelte";
  import BreadcrumbReview from "$lib/review/BreadcrumbReview.svelte";
  import AspectRatioReview from "$lib/review/AspectRatioReview.svelte";
  import BadgeReview from "$lib/review/BadgeReview.svelte";
  import ItemReview from "$lib/review/ItemReview.svelte";

  import AlertReview from "$lib/review/AlertReview.svelte";
  import CardReview from "$lib/review/CardReview.svelte";
  import KbdReview from "$lib/review/KbdReview.svelte";
  import TableReview from "$lib/review/TableReview.svelte";

  import SeparatorReview from "$lib/review/SeparatorReview.svelte";
  import LabelReview from "$lib/review/LabelReview.svelte";
  import SkeletonReview from "$lib/review/SkeletonReview.svelte";
  import HoverCardReview from "$lib/review/HoverCardReview.svelte";
  import TooltipReview from "$lib/review/TooltipReview.svelte";
  import PopoverReview from "$lib/review/PopoverReview.svelte";
  import SheetReview from "$lib/review/SheetReview.svelte";
  import AlertDialogReview from "$lib/review/AlertDialogReview.svelte";
  import DialogReview from "$lib/review/DialogReview.svelte";
  import ThemeReview from "$lib/review/ThemeReview.svelte";
  import SelectReview from "$lib/review/SelectReview.svelte";
  import RadioGroupReview from "$lib/review/RadioGroupReview.svelte";
  import CheckboxGroupReview from "$lib/review/CheckboxGroupReview.svelte";
  import SwitchReview from "$lib/review/SwitchReview.svelte";
  import CheckboxReview from "$lib/review/CheckboxReview.svelte";
  import ButtonReview from "$lib/review/ButtonReview.svelte";
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
  const reviews = {
    "color-picker": ColorPickerReview,
    toast: ToastReview,
    carousel: CarouselReview,
    combobox: ComboboxReview,
    "navigation-menu": NavigationMenuReview,
    "context-menu": ContextMenuReview,
    dropdown: DropdownReview,
    slider: SliderReview,
    tabs: TabsReview,
    accordion: AccordionReview,
    dropzone: DropzoneReview,
    "input-otp": InputOtpReview,
    field: FieldReview,
    "input-group": InputGroupReview,
    form: FormReview,
    input: InputReview,
    collapsible: CollapsibleReview,
    "scroll-area": ScrollAreaReview,
    progress: ProgressReview,
    avatar: AvatarReview,
    video: VideoReview,
    "native-select": NativeSelectReview,
    textarea: TextareaReview,
    prose: ProseReview,
    spinner: SpinnerReview,
    "button-group": ButtonGroupReview,
    pagination: PaginationReview,
    breadcrumb: BreadcrumbReview,
    "aspect-ratio": AspectRatioReview,
    badge: BadgeReview,
    item: ItemReview,

    alert: AlertReview,
    card: CardReview,
    kbd: KbdReview,
    table: TableReview,

    separator: SeparatorReview,
    label: LabelReview,
    skeleton: SkeletonReview,
    button: ButtonReview,
    checkbox: CheckboxReview,
    switch: SwitchReview,
    "radio-group": RadioGroupReview,
    toggle: ToggleReview,
    "toggle-group": ToggleGroupReview,
    "checkbox-group": CheckboxGroupReview,
    select: SelectReview,
    dialog: DialogReview,
    sheet: SheetReview,
    popover: PopoverReview,
    "hover-card": HoverCardReview,
    tooltip: TooltipReview,
    "alert-dialog": AlertDialogReview,
    "theme-toggle": ThemeReview,
  } satisfies Record<PageData["catalog"][number]["component"], import("svelte").Component>;
  const label = (name: string) =>
    name
      .split("-")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
</script>

<svelte:head><title>Component catalog · Starwind Svelte</title></svelte:head>
<main id="main" class="review-shell">
  <header class="review-hero">
    <p class="eyebrow">Styled components</p>
    <h1>Component catalog</h1>
    <p>
      Compare {data.catalog.length} inline components in light and dark. Sidebar has a dedicated page.
      Use Tab to check focus, then try each labeled example.
    </p>
    <a href="/review/portals/">Explore portal compositions ↗</a>
    <nav class="catalog-nav" aria-label="Styled components">
      {#each data.catalog as entry (entry.component)}
        <a href={`#${entry.component}-review`} data-styled-component={entry.component}>
          {label(entry.component)}
        </a>
      {/each}
      {#each data.pages as entry (entry.component)}
        <a href={entry.href} data-styled-component={entry.component}>{label(entry.component)} ↗</a>
      {/each}
    </nav>
  </header>

  <div class="grid gap-6">
    {#each data.catalog as entry (entry.component)}
      {@const Review = reviews[entry.component]}
      <Review />
    {/each}
  </div>
</main>
