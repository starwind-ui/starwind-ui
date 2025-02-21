import Dialog from "./Dialog.astro";
import DialogClose from "./DialogClose.astro";
import DialogContent from "./DialogContent.astro";
import DialogDescription from "./DialogDescription.astro";
import DialogFooter from "./DialogFooter.astro";
import DialogHeader from "./DialogHeader.astro";
import DialogTitle from "./DialogTitle.astro";
import DialogTrigger from "./DialogTrigger.astro";

export {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
	DialogClose,
};

export default {
	Root: Dialog,
	Trigger: DialogTrigger,
	Content: DialogContent,
	Header: DialogHeader,
	Footer: DialogFooter,
	Title: DialogTitle,
	Description: DialogDescription,
	Close: DialogClose,
};
