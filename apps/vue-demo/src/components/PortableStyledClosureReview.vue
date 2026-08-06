<script setup lang="ts">
import { ref } from "vue";

import { Alert, AlertDescription, AlertTitle } from "./starwind-runtime/alert";
import { AspectRatio } from "./starwind-runtime/aspect-ratio";
import { Badge } from "./starwind-runtime/badge";
import { Button } from "./starwind-runtime/button";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./starwind-runtime/breadcrumb";
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "./starwind-runtime/button-group";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./starwind-runtime/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./starwind-runtime/input-group";
import { Input } from "./starwind-runtime/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "./starwind-runtime/item";
import { Kbd, KbdGroup } from "./starwind-runtime/kbd";
import { Label } from "./starwind-runtime/label";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "./starwind-runtime/native-select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./starwind-runtime/pagination";
import { Prose } from "./starwind-runtime/prose";
import { Separator } from "./starwind-runtime/separator";
import { Skeleton } from "./starwind-runtime/skeleton";
import { Spinner } from "./starwind-runtime/spinner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFoot,
  TableHead,
  TableHeader,
  TableRow,
} from "./starwind-runtime/table";
import { Textarea } from "./starwind-runtime/textarea";
import { Video } from "./starwind-runtime/video";

const showCatalog = ref(true);
const alertRoot = ref<InstanceType<typeof Alert> | null>(null);
const itemRoot = ref<InstanceType<typeof Item> | null>(null);
const nativeSelectRoot = ref<InstanceType<typeof NativeSelect> | null>(null);
const textareaRoot = ref<InstanceType<typeof Textarea> | null>(null);
const videoRoot = ref<InstanceType<typeof Video> | null>(null);
</script>

<template>
  <section
    id="portable-styled-closure-review"
    class="review-card"
    data-testid="portable-styled-closure-review"
  >
    <div class="section-heading">
      <div>
        <p class="eyebrow">Order 11 complete portable surface</p>
        <h2>Portable Styled closure</h2>
        <p>All 19 groups and 65 component exports in one responsive catalog.</p>
      </div>
      <div>
        <button
          class="review-action"
          data-testid="portable-closure-remount"
          type="button"
          @click="showCatalog = !showCatalog"
        >
          {{ showCatalog ? "Unmount catalog" : "Remount catalog" }}
        </button>
        <output data-testid="portable-closure-ref-state">
          refs:
          {{
            [
              alertRoot?.element?.tagName ?? "none",
              itemRoot?.element?.tagName ?? "none",
              nativeSelectRoot?.element?.tagName ?? "none",
              textareaRoot?.element?.tagName ?? "none",
              videoRoot?.element?.tagName ?? "none",
            ].join("/")
          }}
        </output>
      </div>
    </div>

    <div
      v-if="showCatalog"
      class="review-grid"
      data-testid="portable-closure-grid"
      data-closure-group-count="19"
    >
      <article class="scenario" data-closure-group="alert">
        <h3>Alert</h3>
        <Alert
          ref="alertRoot"
          data-forwarded="alert"
          data-testid="portable-alert"
          variant="warning"
        >
          <AlertTitle>Review checkpoint</AlertTitle>
          <AlertDescription>Generated status anatomy keeps its public slots.</AlertDescription>
        </Alert>
      </article>

      <article class="scenario" data-closure-group="aspect-ratio">
        <h3>Aspect Ratio</h3>
        <AspectRatio
          :ratio="16 / 9"
          as="figure"
          class="overflow-hidden rounded-lg bg-sky-950 text-white"
          data-forwarded="aspect-ratio"
          data-testid="portable-aspect-ratio"
        >
          <div class="grid h-full place-items-center">16:9 media frame</div>
        </AspectRatio>
      </article>

      <article class="scenario" data-closure-group="badge">
        <h3>Badge</h3>
        <div class="demo-row" data-testid="portable-badges">
          <Badge variant="success">Ready</Badge>
          <Badge href="#portable-styled-closure-review" tone="info" appearance="outline">
            Linked badge
          </Badge>
        </div>
      </article>

      <article class="scenario" data-closure-group="breadcrumb">
        <h3>Breadcrumb</h3>
        <Breadcrumb aria-label="Portable catalog path" data-testid="portable-breadcrumb">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbEllipsis /></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Closure</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </article>

      <article class="scenario" data-closure-group="button-group">
        <h3>Button Group</h3>
        <ButtonGroup data-testid="portable-button-group">
          <Button type="button" variant="outline">Previous</Button>
          <ButtonGroupSeparator />
          <ButtonGroupText>2 of 5</ButtonGroupText>
          <ButtonGroupSeparator />
          <Button type="button" variant="outline">Next</Button>
        </ButtonGroup>
      </article>

      <article class="scenario" data-closure-group="card">
        <h3>Card</h3>
        <Card data-testid="portable-card" size="sm">
          <CardHeader>
            <CardTitle>Portable review</CardTitle>
            <CardDescription>Complete generated anatomy</CardDescription>
            <CardAction><Badge variant="info">Vue</Badge></CardAction>
          </CardHeader>
          <CardContent>Contracts project into editable Vue components.</CardContent>
          <CardFooter>Private verification surface</CardFooter>
        </Card>
      </article>

      <article class="scenario" data-closure-group="input-group">
        <h3>Input Group</h3>
        <div class="grid gap-3">
          <InputGroup data-testid="portable-input-group">
            <InputGroupAddon align="inline-start"
              ><InputGroupText>@</InputGroupText></InputGroupAddon
            >
            <InputGroupInput aria-label="Workspace handle" placeholder="workspace" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="button" variant="outline">Copy</InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupTextarea aria-label="Release notes" placeholder="Release notes" />
          </InputGroup>
        </div>
      </article>

      <article class="scenario" data-closure-group="item">
        <h3>Item</h3>
        <ItemGroup data-testid="portable-item-group">
          <Item ref="itemRoot" as="article" data-forwarded="item" variant="outline">
            <ItemHeader>Catalog record</ItemHeader>
            <ItemMedia variant="icon">SW</ItemMedia>
            <ItemContent>
              <ItemTitle>Generated Vue item</ItemTitle>
              <ItemDescription
                >Dynamic root, slots, variants, and native attributes.</ItemDescription
              >
            </ItemContent>
            <ItemActions><Badge variant="success">Verified</Badge></ItemActions>
            <ItemSeparator />
            <ItemFooter>Order 11</ItemFooter>
          </Item>
        </ItemGroup>
      </article>

      <article class="scenario" data-closure-group="kbd">
        <h3>Keyboard</h3>
        <KbdGroup data-testid="portable-kbd-group">
          <Kbd>Ctrl</Kbd><span aria-hidden="true">+</span><Kbd>K</Kbd>
        </KbdGroup>
      </article>

      <article class="scenario" data-closure-group="label">
        <h3>Label</h3>
        <div class="grid gap-2">
          <Label for="portable-labelled-input" data-testid="portable-label">Project name</Label>
          <Input
            id="portable-labelled-input"
            data-testid="portable-labelled-input"
            default-value="Starwind"
            name="project"
          />
        </div>
      </article>

      <article class="scenario" data-closure-group="native-select">
        <h3>Native Select</h3>
        <NativeSelect
          id="portable-region"
          ref="nativeSelectRoot"
          aria-label="Deployment region"
          data-forwarded="native-select"
          data-testid="portable-native-select"
          name="region"
          value="eu"
        >
          <NativeSelectOptGroup label="Americas">
            <NativeSelectOption value="us">United States</NativeSelectOption>
          </NativeSelectOptGroup>
          <NativeSelectOptGroup label="Europe">
            <NativeSelectOption value="eu">Europe</NativeSelectOption>
          </NativeSelectOptGroup>
          <template #icon>
            <span
              aria-hidden="true"
              class="text-foreground pointer-events-none absolute top-1/2 right-3 grid size-4 -translate-y-1/2 place-items-center opacity-50"
              data-slot="native-select-icon"
              data-testid="portable-native-select-icon"
              >⌄</span
            >
          </template>
        </NativeSelect>
      </article>

      <article class="scenario" data-closure-group="pagination">
        <h3>Pagination</h3>
        <Pagination aria-label="Catalog pages" data-testid="portable-pagination">
          <PaginationContent>
            <PaginationItem
              ><PaginationPrevious href="#portable-styled-closure-review"
            /></PaginationItem>
            <PaginationItem
              ><PaginationLink href="#portable-styled-closure-review" :is-active="true"
                >1</PaginationLink
              ></PaginationItem
            >
            <PaginationItem><PaginationEllipsis /></PaginationItem>
            <PaginationItem
              ><PaginationLink href="#portable-styled-closure-review"
                >4</PaginationLink
              ></PaginationItem
            >
            <PaginationItem
              ><PaginationNext href="#portable-styled-closure-review"
            /></PaginationItem>
          </PaginationContent>
        </Pagination>
      </article>

      <article class="scenario" data-closure-group="prose">
        <h3>Prose</h3>
        <Prose class="text-sm" data-testid="portable-prose">
          <h4>Contract-backed content</h4>
          <p>The prose wrapper keeps semantic content and local typography.</p>
          <ul>
            <li>SSR-safe markup</li>
            <li>Theme-aware tokens</li>
          </ul>
        </Prose>
      </article>

      <article class="scenario" data-closure-group="separator">
        <h3>Separator</h3>
        <div class="grid gap-3" data-testid="portable-separators">
          <span>Before</span><Separator /><span>After</span>
          <div class="flex h-8 items-center gap-3">
            <span>Left</span><Separator orientation="vertical" /><span>Right</span>
          </div>
        </div>
      </article>

      <article class="scenario" data-closure-group="skeleton">
        <h3>Skeleton</h3>
        <div class="grid gap-2" data-testid="portable-skeletons">
          <Skeleton class="h-4 w-3/4" /><Skeleton class="h-4 w-1/2" />
        </div>
      </article>

      <article class="scenario" data-closure-group="spinner">
        <h3>Spinner</h3>
        <Spinner class="size-7" data-forwarded="spinner" data-testid="portable-spinner" />
      </article>

      <article class="scenario" data-closure-group="table">
        <h3>Table</h3>
        <Table data-testid="portable-table">
          <TableCaption>Portable component coverage</TableCaption>
          <TableHeader
            ><TableRow
              ><TableHead>Group</TableHead><TableHead>Status</TableHead></TableRow
            ></TableHeader
          >
          <TableBody
            ><TableRow
              ><TableCell>Closure</TableCell><TableCell>Ready</TableCell></TableRow
            ></TableBody
          >
          <TableFoot
            ><TableRow><TableCell>Exports</TableCell><TableCell>65</TableCell></TableRow></TableFoot
          >
        </Table>
      </article>

      <article class="scenario" data-closure-group="textarea">
        <h3>Textarea</h3>
        <Textarea
          id="portable-notes"
          ref="textareaRoot"
          aria-label="Portable review notes"
          data-forwarded="textarea"
          data-testid="portable-textarea"
          name="notes"
          placeholder="Add review notes"
          rows="3"
        />
      </article>

      <article class="scenario" data-closure-group="video">
        <h3>Video</h3>
        <Video
          ref="videoRoot"
          aria-label="Portable video preview"
          class="max-h-52 bg-slate-950"
          data-forwarded="video"
          data-testid="portable-video"
          preload="none"
          src="data:video/mp4;base64,AAAA"
        />
      </article>
    </div>
  </section>
</template>
