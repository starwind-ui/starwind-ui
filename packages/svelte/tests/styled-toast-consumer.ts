import { createStyledNativeConsumer } from "./styled-native-consumer.js";
export const createStyledToastConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, ["toast"]);

export const toastPositive = `<script lang="ts">
import Parts, { Toaster, ToastTemplate, ToastItem, ToastContent, ToastTitle, ToastDescription, ToastAction, ToastClose, ToastVariants, toast, type ToastApi, type ToastOptions, type ToastPromiseOptions, type ToasterProps, type ToastTemplateProps, type ToastItemProps, type ToastTitleProps, type ToastCloseProps } from "./toast/index.js";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
const api: ToastApi = toast;
const message: ToastOptions = { title: "Saved", description: "Changes saved", action: { label: "Undo", onClick() {} } };
const promise: ToastPromiseOptions<string> = { loading: "Saving", success: (value) => ({ title: value }), error: (error) => error.message };
const run = () => { const id: string = api(message); api.update(id, { title: "Updated" }); api.dismiss(id); void api.promise(Promise.resolve("Saved"), promise); };
const divRef = (node: HTMLDivElement | null) => { void node; };
const buttonRef = (node: HTMLButtonElement | null) => { void node; };
const templateRef = (node: HTMLTemplateElement | null) => { void node?.content; };
const attachment: Attachment<HTMLElement> = (node) => { void (node as HTMLTemplateElement).content; return () => {}; };
const viewport: ToasterProps = { position: "top-center", limit: 2, duration: 8000, gap: "12px", peek: "20px", ref: divRef, style: "width: 20rem" };
const template: ToastTemplateProps = { variant: "success", ref: templateRef, [createAttachmentKey()]: attachment };
const item: ToastItemProps = { variant: "success", ref: divRef, class: ["caller", { active: true }] };
const title: ToastTitleProps = { variant: "loading", ref: divRef };
const close: ToastCloseProps = { showIcon: false, ref: buttonRef };
void ToastVariants.toastItem({ variant: "warning" });
</script>
<Toaster {...viewport} />
<Parts.Viewport><ToastTemplate {...template}><ToastItem {...item}><ToastContent ref={divRef}><ToastTitle {...title}>{#snippet icon()}<span aria-hidden="true">!</span>{/snippet}Title</ToastTitle><ToastDescription ref={divRef}>Description</ToastDescription><ToastAction ref={buttonRef}>Action</ToastAction><ToastClose {...close}>Close</ToastClose></ToastContent></ToastItem></ToastTemplate></Parts.Viewport>
<Parts.Template /><Parts.Item /><Parts.Content /><Parts.Title /><Parts.Description /><Parts.Action onclick={(event)=>{ const button: HTMLButtonElement=event.currentTarget; void button; }} /><Parts.Close />
<button onclick={run}>Notify</button>`;
