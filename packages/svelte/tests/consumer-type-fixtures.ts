import { styledSidebarPositive } from "./styled-sidebar-consumer.js";
import { styledColorPickerPositive } from "./styled-color-picker-consumer.js";
import { toastPositive } from "./styled-toast-consumer.js";
import { carouselPositive } from "./styled-carousel-consumer.js";
import { positiveStyledButtonConsumer } from "./styled-button-consumer.js";
import { positiveStyledCheckboxConsumer } from "./styled-checkbox-consumer.js";
import { positiveStyledDialogConsumer } from "./styled-dialog-consumer.js";
import { positiveStyledSelectConsumer } from "./styled-select-consumer.js";
import { positiveStyledComboboxConsumer } from "./styled-combobox-consumer.js";

import { positiveStyledNavigationMenuConsumer } from "./styled-navigation-menu-consumer.js";

import { positiveStyledContextMenuConsumer } from "./styled-context-menu-consumer.js";

import { positiveStyledDropdownConsumer } from "./styled-dropdown-consumer.js";

import { positiveStyledHoverCardConsumer } from "./styled-hover-card-consumer.js";

import { positiveStyledTooltipConsumer } from "./styled-tooltip-consumer.js";

import { positiveStyledPopoverConsumer } from "./styled-popover-consumer.js";

import { positiveStyledSheetConsumer } from "./styled-sheet-consumer.js";

import { positiveStyledAlertDialogConsumer } from "./styled-alert-dialog-consumer.js";

import { tabsPositive } from "./styled-tabs-consumer.js";

import { sliderPositive } from "./styled-slider-consumer.js";

import { accordionPositive } from "./styled-accordion-consumer.js";

import { dropzonePositive } from "./styled-dropzone-consumer.js";

import { inputOtpPositive } from "./styled-input-otp-consumer.js";

import { fieldPositive } from "./styled-field-consumer.js";

import { togglePositive } from "./styled-toggle-consumer.js";

import { radioGroupPositive } from "./styled-radio-group-consumer.js";

import { checkboxGroupPositive } from "./styled-checkbox-group-consumer.js";

import { switchPositive } from "./styled-switch-consumer.js";

import { inputGroupPositive } from "./styled-input-group-consumer.js";

import { formPositive } from "./styled-form-consumer.js";

import { inputPositive } from "./styled-input-consumer.js";

import { collapsiblePositive } from "./styled-collapsible-consumer.js";

import { scrollAreaPositive } from "./styled-scroll-area-consumer.js";

import { progressPositive } from "./styled-progress-consumer.js";

import { avatarPositive } from "./styled-avatar-consumer.js";

import { videoPositive } from "./styled-video-consumer.js";

import { nativeFormPositive } from "./styled-native-form-consumer.js";

import { proseSpinnerPositive } from "./styled-prose-spinner-consumer.js";

import { navigationPositive } from "./styled-navigation-consumer.js";

import { breadcrumbPositive, BREADCRUMB_ROUTER_LINK } from "./styled-breadcrumb-consumer.js";

import { dynamicStyledPositive } from "./styled-dynamic-consumer.js";

import { staticStyledPositive } from "./styled-static-consumer.js";

import { nativeStyledPositive } from "./styled-native-consumer.js";

/** One negative witness per generated API shape or specialized branch. */
export const styledNegativeConsumers: Record<string, string> = {
  "StyledButtonOwnChild.svelte": `<script lang="ts">import {Button} from "./button/index.js";</script>{#snippet child()}Invalid{/snippet}<Button {child}>Invalid</Button>`,
  "StyledSidebarModels.svelte": `<script lang="ts">import S from "./sidebar/index.js";</script><S.Root open="true" onMobileOpenChange={(next:string)=>{void next;}}/>`,
  "StyledSidebarAnchorRef.svelte": `<script lang="ts">import S from "./sidebar/index.js";</script><S.MenuButton href="" ref={(node:HTMLButtonElement|null)=>{void node;}}/>`,
  "StyledSidebarChild.svelte": `<script lang="ts">import S from "./sidebar/index.js";import type {ButtonChildPayload} from "@starwind-ui/svelte/sidebar";</script>{#snippet child(payload:ButtonChildPayload)}<button {...payload.props}></button>{/snippet}<S.MenuButton href="#page" {child}/>`,
  "StyledColorPickerFormat.svelte": `<script lang="ts">import Picker from "./color-picker/index.js";</script><Picker.Root format="cmyk"/>`,
  "StyledColorPickerCallback.svelte": `<script lang="ts">import Picker from "./color-picker/index.js";</script><Picker.Root onOpenChange={(value:string)=>{void value;}}/>`,
  "StyledColorPickerRecipe.svelte": `<script lang="ts">import {ColorPickerVariants} from "./color-picker/index.js";ColorPickerVariants.colorPickerChannelInput({size:"invalid"});</script>`,
  "ToastPosition.svelte": `<script lang="ts">import { Toaster } from "./toast/index.js";</script><Toaster position="center" />`,
  "ToastFacade.svelte": `<script lang="ts">import { toast } from "./toast/index.js"; toast({ action: { label: "Undo", onClick: "invalid" } });</script>`,
  "CarouselVariant.svelte": `<script lang="ts">import { CarouselNext } from "./carousel/index.js";</script><CarouselNext variant="invalid" />`,
  "CarouselRecipe.svelte": `<script lang="ts">import { CarouselVariants } from "./carousel/index.js"; CarouselVariants.carouselControl({ size: "invalid" });</script>`,
  "StyledComboboxInputValue.svelte":
    '<script lang="ts">import Box from "./combobox/index.js";</script><Box.Root inputValue={null}/>',
  "StyledComboboxArray.svelte":
    '<script lang="ts">import Box from "./combobox/index.js";</script><Box.Root value={["astro"]}/>',
  "StyledComboboxInputCallback.svelte":
    '<script lang="ts">import Box from "./combobox/index.js";</script><Box.Root onInputValueChange={(value:boolean)=>{void value;}}/>',
  "StyledComboboxValueDetail.svelte":
    '<script lang="ts">import Box from "./combobox/index.js";</script><Box.Root onValueChange={(_value,detail:string)=>{void detail;}}/>',
  "StyledComboboxBinding.svelte":
    '<script lang="ts">import Box from "./combobox/index.js";let value=$state(["astro"]);</script><Box.Root bind:value/>',
  "StyledComboboxHiddenInput.svelte":
    '<script lang="ts">import Box from "./combobox/index.js";</script><Box.HiddenInput/>',
  "StyledNavigationMenuValue.svelte":
    '<script lang="ts">import Menu from "./navigation-menu/index.js";</script><Menu.Root value={false} />',
  "StyledNavigationMenuItem.svelte":
    '<script lang="ts">import Menu from "./navigation-menu/index.js";</script><Menu.Item value={null} />',
  "StyledNavigationMenuPositioner.svelte":
    '<script lang="ts">import Menu from "./navigation-menu/index.js";</script><Menu.Positioner side="middle"/>',
  "StyledNavigationMenuInvalidBinding.svelte":
    '<script lang="ts">import Menu from "./navigation-menu/index.js"; let value=$state(false);</script><Menu.Root bind:value />',
  "StyledContextMenuChild.svelte":
    '<script lang="ts">import Menu from "./context-menu/index.js";</script><Menu.Trigger child={42} />',
  "StyledContextMenuAsChild.svelte":
    '<script lang="ts">import Menu from "./context-menu/index.js";</script><Menu.Trigger asChild />',
  "StyledContextMenuRadioRequired.svelte":
    '<script lang="ts">import Menu from "./context-menu/index.js";</script><Menu.RadioItem />',
  "StyledContextMenuLinkItem.svelte":
    '<script lang="ts">import Menu from "./context-menu/index.js";</script><Menu.LinkItem href="#missing" />',
  "StyledContextMenuHover.svelte":
    '<script lang="ts">import Menu from "./context-menu/index.js";</script><Menu.Root openOnHover />',
  "DropdownCheckedDetail.svelte":
    '<script lang="ts">import Menu from "./dropdown/index.js";</script><Menu.CheckboxItem onCheckedChange={(_next, detail: boolean) => { void detail; }} />',
  "StyledHoverCardRootDisabled.svelte":
    '<script lang="ts">import HoverCard from "./hover-card/index.js";</script><HoverCard.Root disabled />',
  "StyledHoverCardAnchorPayload.svelte":
    '<script lang="ts">import HoverCard from "./hover-card/index.js";</script><HoverCard.Trigger>{#snippet child({ props }: { props: { disabled: boolean } })}<a href="#wrong">{String(props.disabled)}</a>{/snippet}</HoverCard.Trigger>',
  "StyledTooltipLowerTabindex.svelte":
    '<script lang="ts">import Tooltip from "./tooltip/index.js";</script><Tooltip.Content tabindex={0} />',
  "StyledSheetSide.svelte":
    '<script lang="ts">import Sheet from "./sheet/index.js";</script><Sheet.Content side="center" />',
  "StyledAlertDialogVariant.svelte":
    '<script lang="ts">import AlertDialog from "./alert-dialog/index.js";</script><AlertDialog.Cancel variant="invalid" />',
  "StyledCheckboxModel.svelte":
    '<script lang="ts">import { Button } from "./button/index.js"; import Checkbox from "./checkbox/index.js"; import Select from "./select/index.js"; import Dialog from "./dialog/index.js"; import { ThemeToggle } from "./theme-toggle/index.js";</script><Checkbox checked="mixed" />',
  "StyledSelectSnippet.svelte":
    '<script lang="ts">import { Button } from "./button/index.js"; import Checkbox from "./checkbox/index.js"; import Select from "./select/index.js"; import Dialog from "./dialog/index.js"; import { ThemeToggle } from "./theme-toggle/index.js";</script><Select.Value>{#snippet children(label: number)}{label}{/snippet}</Select.Value>',
  "StyledDialogRef.svelte":
    '<script lang="ts">import { Button } from "./button/index.js"; import Checkbox from "./checkbox/index.js"; import Select from "./select/index.js"; import Dialog from "./dialog/index.js"; import { ThemeToggle } from "./theme-toggle/index.js";</script><Dialog.Content ref={(node: HTMLDivElement | null) => { void node; }} />',
  "StyledThemePressed.svelte":
    '<script lang="ts">import { Button } from "./button/index.js"; import Checkbox from "./checkbox/index.js"; import Select from "./select/index.js"; import Dialog from "./dialog/index.js"; import { ThemeToggle } from "./theme-toggle/index.js";</script><ThemeToggle pressed="yes" />',
  "NativeSeparatorRole.svelte":
    '<script lang="ts">import Separator, { Separator as NamedSeparator, SeparatorVariants, type SeparatorProps } from "./separator/index.js";\nimport Label, { Label as NamedLabel, LabelVariants, type LabelProps } from "./label/index.js";\nimport Skeleton, { Skeleton as NamedSkeleton, SkeletonVariants, type SkeletonProps } from "./skeleton/index.js";</script><Separator role="presentation" />',
  "NativeSkeletonChildren.svelte":
    '<script lang="ts">import Separator, { Separator as NamedSeparator, SeparatorVariants, type SeparatorProps } from "./separator/index.js";\nimport Label, { Label as NamedLabel, LabelVariants, type LabelProps } from "./label/index.js";\nimport Skeleton, { Skeleton as NamedSkeleton, SkeletonVariants, type SkeletonProps } from "./skeleton/index.js";</script><Skeleton>Hidden</Skeleton>',
  "StaticTableHeadScope.svelte":
    '<script lang="ts">import AlertParts, { Alert, type AlertProps, AlertTitle, type AlertTitleProps, AlertDescription, type AlertDescriptionProps, AlertVariants } from "./alert/index.js";\nimport CardParts, { Card, type CardProps, CardHeader, type CardHeaderProps, CardTitle, type CardTitleProps, CardDescription, type CardDescriptionProps, CardContent, type CardContentProps, CardFooter, type CardFooterProps, CardAction, type CardActionProps, CardVariants } from "./card/index.js";\nimport KbdParts, { Kbd, type KbdProps, KbdGroup, type KbdGroupProps, KbdVariants } from "./kbd/index.js";\nimport TableParts, { Table, type TableProps, TableHeader, type TableHeaderProps, TableBody, type TableBodyProps, TableFoot, type TableFootProps, TableRow, type TableRowProps, TableHead, type TableHeadProps, TableCell, type TableCellProps, TableCaption, type TableCaptionProps, TableVariants } from "./table/index.js";</script><TableHead scope="wrong" />',
  "StaticCardSize.svelte":
    '<script lang="ts">import AlertParts, { Alert, type AlertProps, AlertTitle, type AlertTitleProps, AlertDescription, type AlertDescriptionProps, AlertVariants } from "./alert/index.js";\nimport CardParts, { Card, type CardProps, CardHeader, type CardHeaderProps, CardTitle, type CardTitleProps, CardDescription, type CardDescriptionProps, CardContent, type CardContentProps, CardFooter, type CardFooterProps, CardAction, type CardActionProps, CardVariants } from "./card/index.js";\nimport KbdParts, { Kbd, type KbdProps, KbdGroup, type KbdGroupProps, KbdVariants } from "./kbd/index.js";\nimport TableParts, { Table, type TableProps, TableHeader, type TableHeaderProps, TableBody, type TableBodyProps, TableFoot, type TableFootProps, TableRow, type TableRowProps, TableHead, type TableHeadProps, TableCell, type TableCellProps, TableCaption, type TableCaptionProps, TableVariants } from "./table/index.js";</script><Card size="lg" />',
  "DynamicAspectRatioSvg.svelte":
    '<script lang="ts">import AspectRatioDefault, { AspectRatio, type AspectRatioProps, AspectRatioVariants } from "./aspect-ratio/index.js";\nimport BadgeDefault, { Badge, type BadgeProps, BadgeVariants } from "./badge/index.js";\nimport ItemParts, { Item, type ItemProps, ItemActions, type ItemActionsProps, ItemContent, type ItemContentProps, ItemDescription, type ItemDescriptionProps, ItemFooter, type ItemFooterProps, ItemGroup, type ItemGroupProps, ItemHeader, type ItemHeaderProps, ItemMedia, type ItemMediaProps, ItemSeparator, type ItemSeparatorProps, ItemTitle, type ItemTitleProps, ItemVariants } from "./item/index.js";</script><AspectRatio as="svg" />',
  "DynamicBadgeAs.svelte":
    '<script lang="ts">import AspectRatioDefault, { AspectRatio, type AspectRatioProps, AspectRatioVariants } from "./aspect-ratio/index.js";\nimport BadgeDefault, { Badge, type BadgeProps, BadgeVariants } from "./badge/index.js";\nimport ItemParts, { Item, type ItemProps, ItemActions, type ItemActionsProps, ItemContent, type ItemContentProps, ItemDescription, type ItemDescriptionProps, ItemFooter, type ItemFooterProps, ItemGroup, type ItemGroupProps, ItemHeader, type ItemHeaderProps, ItemMedia, type ItemMediaProps, ItemSeparator, type ItemSeparatorProps, ItemTitle, type ItemTitleProps, ItemVariants } from "./item/index.js";</script><Badge as="button" />',
  "DynamicBadgeHref.svelte":
    '<script lang="ts">import AspectRatioDefault, { AspectRatio, type AspectRatioProps, AspectRatioVariants } from "./aspect-ratio/index.js";\nimport BadgeDefault, { Badge, type BadgeProps, BadgeVariants } from "./badge/index.js";\nimport ItemParts, { Item, type ItemProps, ItemActions, type ItemActionsProps, ItemContent, type ItemContentProps, ItemDescription, type ItemDescriptionProps, ItemFooter, type ItemFooterProps, ItemGroup, type ItemGroupProps, ItemHeader, type ItemHeaderProps, ItemMedia, type ItemMediaProps, ItemSeparator, type ItemSeparatorProps, ItemTitle, type ItemTitleProps, ItemVariants } from "./item/index.js";</script><Badge href={123} />',
  "DynamicItemMediaVariant.svelte":
    '<script lang="ts">import AspectRatioDefault, { AspectRatio, type AspectRatioProps, AspectRatioVariants } from "./aspect-ratio/index.js";\nimport BadgeDefault, { Badge, type BadgeProps, BadgeVariants } from "./badge/index.js";\nimport ItemParts, { Item, type ItemProps, ItemActions, type ItemActionsProps, ItemContent, type ItemContentProps, ItemDescription, type ItemDescriptionProps, ItemFooter, type ItemFooterProps, ItemGroup, type ItemGroupProps, ItemHeader, type ItemHeaderProps, ItemMedia, type ItemMediaProps, ItemSeparator, type ItemSeparatorProps, ItemTitle, type ItemTitleProps, ItemVariants } from "./item/index.js";</script><ItemMedia variant="wrong" />',
  "BreadcrumbAsChild.svelte":
    '<script lang="ts">import { BreadcrumbLink } from "./breadcrumb/index.js";</script><BreadcrumbLink asChild="yes">Docs</BreadcrumbLink>',
  "BreadcrumbChildren.svelte":
    '<script lang="ts">import { BreadcrumbLink } from "./breadcrumb/index.js";</script><BreadcrumbLink asChild>{#snippet children(value: number)}{value}{/snippet}</BreadcrumbLink>',
  "BreadcrumbSeparatorChildren.svelte":
    '<script lang="ts">import { BreadcrumbSeparator } from "./breadcrumb/index.js";</script><BreadcrumbSeparator>{#snippet children(value: number)}{value}{/snippet}</BreadcrumbSeparator>',
  "NavigationPreviousIconArgs.svelte":
    '<script lang="ts">import Parts0, { ButtonGroup, type ButtonGroupProps, ButtonGroupSeparator, type ButtonGroupSeparatorProps, ButtonGroupText, type ButtonGroupTextProps, ButtonGroupVariants } from "./button-group/index.js";\nimport Parts1, { Pagination, type PaginationProps, PaginationContent, type PaginationContentProps, PaginationItem, type PaginationItemProps, PaginationLink, type PaginationLinkProps, PaginationPrevious, type PaginationPreviousProps, PaginationNext, type PaginationNextProps, PaginationEllipsis, type PaginationEllipsisProps, PaginationVariants } from "./pagination/index.js";</script><PaginationPrevious>{#snippet icon(value:number)}{value}{/snippet}</PaginationPrevious>',
  "NavigationGroupOrientation.svelte":
    '<script lang="ts">import Parts0, { ButtonGroup, type ButtonGroupProps, ButtonGroupSeparator, type ButtonGroupSeparatorProps, ButtonGroupText, type ButtonGroupTextProps, ButtonGroupVariants } from "./button-group/index.js";\nimport Parts1, { Pagination, type PaginationProps, PaginationContent, type PaginationContentProps, PaginationItem, type PaginationItemProps, PaginationLink, type PaginationLinkProps, PaginationPrevious, type PaginationPreviousProps, PaginationNext, type PaginationNextProps, PaginationEllipsis, type PaginationEllipsisProps, PaginationVariants } from "./pagination/index.js";</script><ButtonGroup orientation="diagonal"/>',
  "NativeFormTextareaValue.svelte":
    '<script lang="ts">import NativeSelect, {NativeSelect as NamedSelect, NativeSelectOption, NativeSelectOptGroup, NativeSelectVariants, type NativeSelectProps, type NativeSelectOptionProps, type NativeSelectOptGroupProps} from "./native-select/index.js";\nimport Textarea, {Textarea as NamedTextarea, TextareaVariants, type TextareaProps} from "./textarea/index.js"; let number=$state(1);</script><Textarea value={42}/>',
  "NativeFormTextareaBinding.svelte":
    '<script lang="ts">import NativeSelect, {NativeSelect as NamedSelect, NativeSelectOption, NativeSelectOptGroup, NativeSelectVariants, type NativeSelectProps, type NativeSelectOptionProps, type NativeSelectOptGroupProps} from "./native-select/index.js";\nimport Textarea, {Textarea as NamedTextarea, TextareaVariants, type TextareaProps} from "./textarea/index.js"; let number=$state(1);</script><Textarea bind:value={number}/>',
  "NativeFormSelectDefault.svelte":
    '<script lang="ts">import NativeSelect, {NativeSelect as NamedSelect, NativeSelectOption, NativeSelectOptGroup, NativeSelectVariants, type NativeSelectProps, type NativeSelectOptionProps, type NativeSelectOptGroupProps} from "./native-select/index.js";\nimport Textarea, {Textarea as NamedTextarea, TextareaVariants, type TextareaProps} from "./textarea/index.js"; let number=$state(1);</script><NamedSelect defaultValue="wrong"/>',
  "NativeFormOptionRef.svelte":
    '<script lang="ts">import NativeSelect, {NativeSelect as NamedSelect, NativeSelectOption, NativeSelectOptGroup, NativeSelectVariants, type NativeSelectProps, type NativeSelectOptionProps, type NativeSelectOptGroupProps} from "./native-select/index.js";\nimport Textarea, {Textarea as NamedTextarea, TextareaVariants, type TextareaProps} from "./textarea/index.js"; let number=$state(1);</script><NativeSelectOption ref={(node:HTMLSelectElement|null)=>{void node;}}/>',
  "NativeFormGroupAttr.svelte":
    '<script lang="ts">import NativeSelect, {NativeSelect as NamedSelect, NativeSelectOption, NativeSelectOptGroup, NativeSelectVariants, type NativeSelectProps, type NativeSelectOptionProps, type NativeSelectOptGroupProps} from "./native-select/index.js";\nimport Textarea, {Textarea as NamedTextarea, TextareaVariants, type TextareaProps} from "./textarea/index.js"; let number=$state(1);</script><NativeSelectOptGroup label="Group" value="wrong"/>',
  "VideoMissingSource.svelte":
    '<script lang="ts">import Video, {Video as NamedVideo, VideoVariants, type VideoProps} from "./video/index.js";</script><Video/>',
  "VideoSource.svelte":
    '<script lang="ts">import Video, {Video as NamedVideo, VideoVariants, type VideoProps} from "./video/index.js";</script><Video src={42}/>',
  "VideoRef.svelte":
    '<script lang="ts">import Video, {Video as NamedVideo, VideoVariants, type VideoProps} from "./video/index.js";</script><Video src="/clip.mp4" ref={(node:HTMLDivElement|null)=>{void node;}}/>',
  "VideoReactSrcdoc.svelte":
    '<script lang="ts">import Video, {Video as NamedVideo, VideoVariants, type VideoProps} from "./video/index.js";</script><Video src="https://youtu.be/id" srcDoc="<p>Wrong casing</p>"/>',
  "AvatarRequiredAlt.svelte":
    '<script lang="ts">import Avatar, { Avatar as Root, AvatarImage, AvatarFallback, AvatarVariants, type AvatarProps, type AvatarImageProps, type AvatarFallbackProps } from "./avatar/index.js";\nimport Primitive, { AvatarRoot as PrimitiveRoot, AvatarImage as PrimitiveImage, AvatarFallback as PrimitiveFallback, type AvatarImageLoadingStatus, type AvatarLoadingStatusChangeDetails } from "@starwind-ui/svelte/avatar";\nimport { Avatar as RootNamespace, type AvatarImageLoadingStatus as RootStatus } from "@starwind-ui/svelte";</script>\n<Avatar.Image />',
  "ToggleGroupScalar.svelte":
    '<script lang="ts">import Toggle from "./toggle/index.js";import Group from "./toggle-group/index.js";import {ToggleRoot} from "@starwind-ui/svelte/toggle";import {ToggleGroupRoot} from "@starwind-ui/svelte/toggle-group";</script><Group.Root value="a"/>',
  "RadioMissingValue.svelte":
    '<script lang="ts">import Styled,{RadioGroup,RadioGroupItem,RadioGroupVariants,type RadioGroupProps,type RadioGroupItemProps} from "./radio-group/index.js";import Radio,{RadioRoot,RadioIndicator,type RadioCheckedChangeDetails} from "@starwind-ui/svelte/radio";import Group,{RadioGroupRoot,type RadioGroupValue,type RadioGroupValueChangeDetails} from "@starwind-ui/svelte/radio-group";</script><Radio.Root />',
  "RadioSpanButtonProp.svelte":
    '<script lang="ts">import Styled,{RadioGroup,RadioGroupItem,RadioGroupVariants,type RadioGroupProps,type RadioGroupItemProps} from "./radio-group/index.js";import Radio,{RadioRoot,RadioIndicator,type RadioCheckedChangeDetails} from "@starwind-ui/svelte/radio";import Group,{RadioGroupRoot,type RadioGroupValue,type RadioGroupValueChangeDetails} from "@starwind-ui/svelte/radio-group";</script><Radio.Root value="a" formaction="/bad" />',
  "SwitchRequiredId.svelte":
    '<script lang="ts">import Switch, { Switch as NamedSwitch, SwitchVariants, type SwitchProps } from "./switch/index.js";import Primitive, { SwitchRoot, SwitchThumb, type SwitchCheckedChangeDetails } from "@starwind-ui/svelte/switch";</script><Switch />',
  "CheckboxGroupModel.svelte":
    '<script lang="ts">import Group, { CheckboxGroup, CheckboxGroupVariants, type CheckboxGroupProps } from "./checkbox-group/index.js";\nimport Primitive, { CheckboxGroupRoot, type CheckboxGroupValue, type CheckboxGroupValueChangeDetails } from "@starwind-ui/svelte/checkbox-group";\nimport Checkbox from "./checkbox/index.js";</script><Group value="first" />',
  "InputGroupTextareaArray.svelte":
    '<script lang="ts">import Group, { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea, InputGroupVariants, type InputGroupProps, type InputGroupAddonProps, type InputGroupButtonProps, type InputGroupInputProps, type InputGroupTextProps, type InputGroupTextareaProps } from "./input-group/index.js";\nlet value=$state("");</script><InputGroupTextarea value={["wrong"]} />',
  "SliderValue.svelte":
    '<script lang="ts">import Slider,{Slider as NamedSlider,SliderVariants,type SliderProps} from "./slider/index.js";\nimport Primitive,{type SliderValue,type SliderValueChangeDetails,type SliderValueCommitDetails} from "@starwind-ui/svelte/slider";\nimport {createAttachmentKey} from "svelte/attachments";let text=$state("20");</script><Slider value="20"/>',
  "SliderArray.svelte":
    '<script lang="ts">import Slider,{Slider as NamedSlider,SliderVariants,type SliderProps} from "./slider/index.js";\nimport Primitive,{type SliderValue,type SliderValueChangeDetails,type SliderValueCommitDetails} from "@starwind-ui/svelte/slider";\nimport {createAttachmentKey} from "svelte/attachments";let text=$state("20");</script><Slider value={["20"]}/>',
  "SliderBinding.svelte":
    '<script lang="ts">import Slider,{Slider as NamedSlider,SliderVariants,type SliderProps} from "./slider/index.js";\nimport Primitive,{type SliderValue,type SliderValueChangeDetails,type SliderValueCommitDetails} from "@starwind-ui/svelte/slider";\nimport {createAttachmentKey} from "svelte/attachments";let text=$state("20");</script><Slider bind:value={text}/>',
  "SliderChange.svelte":
    '<script lang="ts">import Slider,{Slider as NamedSlider,SliderVariants,type SliderProps} from "./slider/index.js";\nimport Primitive,{type SliderValue,type SliderValueChangeDetails,type SliderValueCommitDetails} from "@starwind-ui/svelte/slider";\nimport {createAttachmentKey} from "svelte/attachments";let text=$state("20");</script><Slider onValueChange={(next:string)=>{}}/>',
  "AccordionValue.svelte":
    '<script lang="ts">import Accordion, { Accordion as StyledRoot, AccordionItem, AccordionTrigger, AccordionContent, AccordionVariants, type AccordionProps, type AccordionItemProps } from "./accordion/index.js";\nimport Primitive, { type AccordionValue, type AccordionValueChangeDetails } from "@starwind-ui/svelte/accordion";\nimport { createAccordion } from "@starwind-ui/runtime/accordion";let number=$state(7);</script><Accordion.Root value={7}/>',
  "AccordionArray.svelte":
    '<script lang="ts">import Accordion, { Accordion as StyledRoot, AccordionItem, AccordionTrigger, AccordionContent, AccordionVariants, type AccordionProps, type AccordionItemProps } from "./accordion/index.js";\nimport Primitive, { type AccordionValue, type AccordionValueChangeDetails } from "@starwind-ui/svelte/accordion";\nimport { createAccordion } from "@starwind-ui/runtime/accordion";let number=$state(7);</script><Accordion.Root value={[7]}/>',
  "AccordionCallback.svelte":
    '<script lang="ts">import Accordion, { Accordion as StyledRoot, AccordionItem, AccordionTrigger, AccordionContent, AccordionVariants, type AccordionProps, type AccordionItemProps } from "./accordion/index.js";\nimport Primitive, { type AccordionValue, type AccordionValueChangeDetails } from "@starwind-ui/svelte/accordion";\nimport { createAccordion } from "@starwind-ui/runtime/accordion";let number=$state(7);</script><Accordion.Root onValueChange={(next:number)=>{void next;}}/>',
  "TabsTriggerValue.svelte":
    '<script lang="ts">import Tabs,{Tabs as StyledTabs,TabsList,TabsTrigger,TabsContent,TabsVariants,type TabsProps} from "./tabs/index.js";import Primitive,{type TabsValue,type TabsOrientation,type TabsValueChangeDetails} from "@starwind-ui/svelte/tabs";import {createTabs} from "@starwind-ui/runtime/tabs";import {createAttachmentKey} from "svelte/attachments";let number=$state(1);</script><Tabs.Trigger/>',
  "TabsRootSnippet.svelte":
    '<script lang="ts">import Tabs,{Tabs as StyledTabs,TabsList,TabsTrigger,TabsContent,TabsVariants,type TabsProps} from "./tabs/index.js";import Primitive,{type TabsValue,type TabsOrientation,type TabsValueChangeDetails} from "@starwind-ui/svelte/tabs";import {createTabs} from "@starwind-ui/runtime/tabs";import {createAttachmentKey} from "svelte/attachments";let number=$state(1);</script><Tabs.Root>{#snippet children(value:number)}{value}{/snippet}</Tabs.Root>',
  "DropzoneFilesModel.svelte":
    '<script lang="ts">import Dropzone, { Dropzone as StyledRoot, DropzoneFilesList, DropzoneLoadingIndicator, DropzoneUploadIndicator, DropzoneVariants, type DropzoneProps } from "./dropzone/index.js";\nimport Primitive, { Dropzone as Namespace, DropzoneRoot, DropzoneInput, DropzoneFilesList as FilesList, DropzoneLoadingIndicator as LoadingIndicator, DropzoneUploadIndicator as UploadIndicator, type DropzoneFilesChangeDetails } from "@starwind-ui/svelte/dropzone";\nimport { createDropzone, type DropzoneInstance, type DropzoneOptions, type DropzoneSetFilesOptions } from "@starwind-ui/runtime/dropzone";</script><Primitive.Root files={[]}/>',
  "DropzoneCallback.svelte":
    '<script lang="ts">import Dropzone, { Dropzone as StyledRoot, DropzoneFilesList, DropzoneLoadingIndicator, DropzoneUploadIndicator, DropzoneVariants, type DropzoneProps } from "./dropzone/index.js";\nimport Primitive, { Dropzone as Namespace, DropzoneRoot, DropzoneInput, DropzoneFilesList as FilesList, DropzoneLoadingIndicator as LoadingIndicator, DropzoneUploadIndicator as UploadIndicator, type DropzoneFilesChangeDetails } from "@starwind-ui/svelte/dropzone";\nimport { createDropzone, type DropzoneInstance, type DropzoneOptions, type DropzoneSetFilesOptions } from "@starwind-ui/runtime/dropzone";</script><Primitive.Root onFilesChange={(files: string[])=>{void files;}}/>',
  "InputOtpSlotChildren.svelte":
    '<script lang="ts">import Otp, { InputOtp, InputOtpGroup, InputOtpSlot, InputOtpSeparator, InputOtpVariants, REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS, type InputOtpProps, type InputOtpSlotProps } from "./input-otp/index.js";\nimport Primitive, { InputOtp as Namespace, InputOtpRoot, InputOtpGroup as Group, InputOtpSlot as Slot, InputOtpSeparator as Separator, type InputOtpValueChangeDetails } from "@starwind-ui/svelte/input-otp";\nimport { createInputOtp, type InputOtpOptions, type InputOtpInstance, type InputOtpValueChangeReason, type InputOtpSetValueOptions } from "@starwind-ui/runtime/input-otp";let number=$state(1);</script><Primitive.Slot>character</Primitive.Slot>',
  "InputOtpValue.svelte":
    '<script lang="ts">import Otp, { InputOtp, InputOtpGroup, InputOtpSlot, InputOtpSeparator, InputOtpVariants, REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS, type InputOtpProps, type InputOtpSlotProps } from "./input-otp/index.js";\nimport Primitive, { InputOtp as Namespace, InputOtpRoot, InputOtpGroup as Group, InputOtpSlot as Slot, InputOtpSeparator as Separator, type InputOtpValueChangeDetails } from "@starwind-ui/svelte/input-otp";\nimport { createInputOtp, type InputOtpOptions, type InputOtpInstance, type InputOtpValueChangeReason, type InputOtpSetValueOptions } from "@starwind-ui/runtime/input-otp";let number=$state(1);</script><Primitive.Root value={1}/>',
  "FieldValidityMatch.svelte":
    '<script lang="ts">import Field, { Field as Root, FieldContent, FieldControl, FieldDescription, FieldError, FieldGroup, FieldItem, FieldLabel, FieldLegend, FieldSeparator, FieldSet, FieldTitle, FieldValidity, FieldVariants, type FieldControlProps } from "./field/index.js";\nimport PrimitiveField, { FieldRoot, FieldLabel as PrimitiveLabel, FieldControl as PrimitiveControl, FieldDescription as PrimitiveDescription, FieldItem as PrimitiveItem, FieldError as PrimitiveError, FieldValidity as PrimitiveValidity, type InputValue, type InputValueChangeDetails } from "@starwind-ui/svelte/field";\nimport { createField, type FieldInstance, type FieldOptions } from "@starwind-ui/runtime/field"; let state=$state(false);</script><PrimitiveValidity match="unknown" />',
  "FieldStateBinding.svelte":
    '<script lang="ts">import Field, { Field as Root, FieldContent, FieldControl, FieldDescription, FieldError, FieldGroup, FieldItem, FieldLabel, FieldLegend, FieldSeparator, FieldSet, FieldTitle, FieldValidity, FieldVariants, type FieldControlProps } from "./field/index.js";\nimport PrimitiveField, { FieldRoot, FieldLabel as PrimitiveLabel, FieldControl as PrimitiveControl, FieldDescription as PrimitiveDescription, FieldItem as PrimitiveItem, FieldError as PrimitiveError, FieldValidity as PrimitiveValidity, type InputValue, type InputValueChangeDetails } from "@starwind-ui/svelte/field";\nimport { createField, type FieldInstance, type FieldOptions } from "@starwind-ui/runtime/field"; let state=$state(false);</script><Field.Root bind:dirty={state} />',
  "FieldControlValue.svelte":
    '<script lang="ts">import Field, { Field as Root, FieldContent, FieldControl, FieldDescription, FieldError, FieldGroup, FieldItem, FieldLabel, FieldLegend, FieldSeparator, FieldSet, FieldTitle, FieldValidity, FieldVariants, type FieldControlProps } from "./field/index.js";\nimport PrimitiveField, { FieldRoot, FieldLabel as PrimitiveLabel, FieldControl as PrimitiveControl, FieldDescription as PrimitiveDescription, FieldItem as PrimitiveItem, FieldError as PrimitiveError, FieldValidity as PrimitiveValidity, type InputValue, type InputValueChangeDetails } from "@starwind-ui/svelte/field";\nimport { createField, type FieldInstance, type FieldOptions } from "@starwind-ui/runtime/field"; let state=$state(false);</script><Field.Control value={{}} />',
  "FormAdvancedOption.svelte":
    '<script lang="ts">import StyledForm, { Form, FormErrorSummary, FormVariants, type FormProps, type FormErrorSummaryProps } from "./form/index.js";\nimport PrimitiveForm, { FormRoot, FormErrorSummary as PrimitiveSummary, createForm, createFormSchemaValidator, validateFormSchema, type FormExternalErrorOptions, type FormExternalErrors, type FormInstance, type FormOptions, type FormResetValidationOptions, type FormSchemaResult, type FormValidateOptions, type FormValidationCause, type FormValidationOutcome, type FormValidationTiming, type FormValues } from "@starwind-ui/svelte/form";\nimport Fieldset, { FieldsetRoot, FieldsetLegend } from "@starwind-ui/svelte/fieldset";\nlet value = $state(false);</script><Form fieldValidators={{}} />',
  "FormSubmitCallback.svelte":
    '<script lang="ts">import StyledForm, { Form, FormErrorSummary, FormVariants, type FormProps, type FormErrorSummaryProps } from "./form/index.js";\nimport PrimitiveForm, { FormRoot, FormErrorSummary as PrimitiveSummary, createForm, createFormSchemaValidator, validateFormSchema, type FormExternalErrorOptions, type FormExternalErrors, type FormInstance, type FormOptions, type FormResetValidationOptions, type FormSchemaResult, type FormValidateOptions, type FormValidationCause, type FormValidationOutcome, type FormValidationTiming, type FormValues } from "@starwind-ui/svelte/form";\nimport Fieldset, { FieldsetRoot, FieldsetLegend } from "@starwind-ui/svelte/fieldset";\nlet value = $state(false);</script><Form onsubmit={(event: KeyboardEvent) => { void event; }} />',
  "FormFacadeName.svelte":
    '<script lang="ts">import { FormState } from "@starwind-ui/svelte/form";</script>',
  "InputValue.svelte":
    '<script lang="ts">import Input, { Input as NamedInput, InputVariants, type InputProps } from "./input/index.js";\nimport Primitive, { InputRoot, type InputValue, type InputValueChangeDetails } from "@starwind-ui/svelte/input";</script><Primitive.Root value={true} />',
  "ProgressFormat.svelte":
    '<script lang="ts">import Progress, { Progress as NamedProgress, ProgressVariants, type ProgressProps } from "./progress/index.js";\nimport Primitive, { ProgressRoot, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue } from "@starwind-ui/svelte/progress";\nimport { ProgressValue as RootValue } from "@starwind-ui/svelte";\nlet value = $state<number | null>(25);</script>\n<Primitive.Root format={{ style: "unknown" }} />',
  "ScrollAreaThreshold.svelte":
    '<script lang="ts">import Styled, { ScrollArea, ScrollAreaViewport, ScrollAreaContent, ScrollBar, ScrollAreaThumb, ScrollAreaCorner, ScrollAreaVariants, type ScrollAreaProps } from "./scroll-area/index.js";\nimport Primitive, { ScrollAreaRoot, ScrollAreaViewport as Viewport, ScrollAreaContent as Content, ScrollAreaScrollbar, ScrollAreaThumb as Thumb, ScrollAreaCorner as Corner, type ScrollAreaOverflowEdgeThreshold } from "@starwind-ui/svelte/scroll-area";\nlet overflowEdgeThreshold = $state(5);</script>\n<Primitive.Root overflowEdgeThreshold="5"/>',
  "CollapsibleUntilFound.svelte":
    '<script lang="ts">import Styled, { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleVariants, type CollapsibleProps, type ButtonChildPayload as StyledChildPayload, type ButtonChildProps as StyledChildProps } from "./collapsible/index.js";\nimport Primitive, { CollapsibleRoot, CollapsibleTrigger as Trigger, CollapsiblePanel, type CollapsibleOpenChangeDetails, type ButtonChildProps, type ButtonChildPayload } from "@starwind-ui/svelte/collapsible";\nimport Button from "@starwind-ui/svelte/button";\nlet disabled = $state(false);</script>\n<CollapsibleContent hiddenUntilFound="yes"/>',
};

export const styledPositiveConsumers: Record<string, string> = {
  "StyledSidebarPositive.svelte": styledSidebarPositive,
  "ToastPositive.svelte": toastPositive,
  "StyledColorPickerPositive.svelte": styledColorPickerPositive,
  "CarouselPositive.svelte": carouselPositive,
  "ThemePositive.svelte": `<script lang="ts">
import ThemeToggle, { ThemeToggleVariants, type ThemeToggleProps } from "./theme-toggle/index.js";
const props: ThemeToggleProps = { pressed: false, defaultPressed: true, syncGroup: "theme", value: "appearance", disabled: false, class: ["demo", { active: true }], variant: "outline", size: "sm" };
const ref = (element: HTMLButtonElement | null) => { void element; };
void ThemeToggleVariants.themeToggle;
</script>
<ThemeToggle {...props} {ref} onclick={(event) => { const button: HTMLButtonElement = event.currentTarget; void button; }}>
{#snippet lightIcon()}<span>Light</span>{/snippet}
{#snippet darkIcon()}<span>Dark</span>{/snippet}
</ThemeToggle>
<ThemeToggle>Switch appearance</ThemeToggle>`,
  "ButtonPositive.svelte": positiveStyledButtonConsumer,
  "CheckboxPositive.svelte": positiveStyledCheckboxConsumer,
  "DialogPositive.svelte": positiveStyledDialogConsumer,
  "SelectPositive.svelte": positiveStyledSelectConsumer,
  "ComboboxPositive.svelte": positiveStyledComboboxConsumer,
  "NavigationMenuPositive.svelte": positiveStyledNavigationMenuConsumer,
  "ContextMenuPositive.svelte": positiveStyledContextMenuConsumer,
  "DropdownPositive.svelte": positiveStyledDropdownConsumer,
  "HoverCardPositive.svelte": positiveStyledHoverCardConsumer,
  "TooltipPositive.svelte": positiveStyledTooltipConsumer,
  "PopoverPositive.svelte": positiveStyledPopoverConsumer,
  "SheetPositive.svelte": positiveStyledSheetConsumer,
  "AlertDialogPositive.svelte": positiveStyledAlertDialogConsumer,
  "NativePositive.svelte": nativeStyledPositive,
  "VideoPositive.svelte": videoPositive,
  "CollapsiblePositive.svelte": collapsiblePositive,
  "ScrollAreaPositive.svelte": scrollAreaPositive,
  "TogglePositive.svelte": togglePositive,
  "RadioGroupPositive.svelte": radioGroupPositive,
  "CheckboxGroupPositive.svelte": checkboxGroupPositive,
  "SwitchPositive.svelte": switchPositive,
  "InputGroupPositive.svelte": inputGroupPositive,
  "SliderPositive.svelte": sliderPositive,
  "AccordionPositive.svelte": accordionPositive,
  "TabsPositive.svelte": tabsPositive,
  "DropzonePositive.svelte": dropzonePositive,
  "InputOtpPositive.svelte": inputOtpPositive,
  "FieldPositive.svelte": fieldPositive,
  "FormPositive.svelte": formPositive,
  "InputPositive.svelte": inputPositive,
  "ProgressPositive.svelte": progressPositive,
  "AvatarPositive.svelte": avatarPositive,
  "StaticPositive.svelte": staticStyledPositive,
  "DynamicPositive.svelte": dynamicStyledPositive,
  "NavigationPositive.svelte": navigationPositive,
  "ProseSpinnerPositive.svelte": proseSpinnerPositive,
  "NativeFormPositive.svelte": nativeFormPositive,
  "BreadcrumbPositive.svelte": breadcrumbPositive,
  "BreadcrumbRouterLink.svelte": BREADCRUMB_ROUTER_LINK,
};
