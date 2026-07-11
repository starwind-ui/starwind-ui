import type {
  AccordionValue,
  CheckboxGroupValue,
  RadioGroupValue,
  SliderValue,
  TabsValue,
  ToggleGroupValue,
} from "@starwind-ui/react";
import type { ChangeEvent, ReactNode } from "react";
import { createContext, useCallback, useContext, useRef, useState } from "react";

function useRuntimePrototypeState() {
  const [controlledCollapsibleOpen, setControlledCollapsibleOpen] = useState(false);
  const [controlledCollapsibleChanges, setControlledCollapsibleChanges] = useState(0);
  const [controlledAccordionValue, setControlledAccordionValue] =
    useState<AccordionValue>("controlled-shipping");
  const [controlledAccordionChanges, setControlledAccordionChanges] = useState(0);
  const [controlledCheckboxChecked, setControlledCheckboxChecked] = useState(false);
  const [controlledCheckboxChanges, setControlledCheckboxChanges] = useState(0);
  const [controlledCheckboxGroupValue, setControlledCheckboxGroupValue] =
    useState<CheckboxGroupValue>(["security"]);
  const [controlledCheckboxGroupChanges, setControlledCheckboxGroupChanges] = useState(0);
  const [controlledRadioGroupValue, setControlledRadioGroupValue] =
    useState<RadioGroupValue>("express");
  const [controlledRadioGroupChanges, setControlledRadioGroupChanges] = useState(0);
  const [controlledInputValue, setControlledInputValue] = useState("Ada");
  const [controlledInputChanges, setControlledInputChanges] = useState(0);
  const [controlledInputNativeChangeValue, setControlledInputNativeChangeValue] =
    useState("pending");
  const [rejectedInputChanges, setRejectedInputChanges] = useState(0);
  const [controlledInputOtpValue, setControlledInputOtpValue] = useState("12");
  const [controlledInputOtpChanges, setControlledInputOtpChanges] = useState(0);
  const [controlledSliderValue, setControlledSliderValue] = useState<SliderValue>(25);
  const [controlledSliderChanges, setControlledSliderChanges] = useState(0);
  const [controlledSelectValue, setControlledSelectValue] = useState("system");
  const [controlledSelectChanges, setControlledSelectChanges] = useState(0);
  const [controlledComboboxValue, setControlledComboboxValue] = useState("apple");
  const [controlledComboboxInputValue, setControlledComboboxInputValue] = useState("Apple");
  const [controlledComboboxOpen, setControlledComboboxOpen] = useState(false);
  const [controlledComboboxChanges, setControlledComboboxChanges] = useState(0);
  const [controlledSwitchChecked, setControlledSwitchChecked] = useState(false);
  const [controlledSwitchChanges, setControlledSwitchChanges] = useState(0);
  const [switchResetRenderCount, setSwitchResetRenderCount] = useState(0);
  const [controlledTogglePressed, setControlledTogglePressed] = useState(false);
  const [controlledToggleChanges, setControlledToggleChanges] = useState(0);
  const [controlledToggleGroupValue, setControlledToggleGroupValue] = useState<ToggleGroupValue>([
    "bold",
  ]);
  const [controlledToggleGroupChanges, setControlledToggleGroupChanges] = useState(0);
  const [toastActionCount, setToastActionCount] = useState(0);
  const [controlledTabsValue, setControlledTabsValue] = useState<TabsValue>("profile");
  const [controlledTabsChanges, setControlledTabsChanges] = useState(0);
  const [controlledAlertDialogOpen, setControlledAlertDialogOpen] = useState(false);
  const [controlledAlertDialogChanges, setControlledAlertDialogChanges] = useState(0);
  const [controlledSheetOpen, setControlledSheetOpen] = useState(false);
  const [controlledSheetChanges, setControlledSheetChanges] = useState(0);
  const [canceledSheetChanges, setCanceledSheetChanges] = useState(0);
  const [controlledDropdownOpen, setControlledDropdownOpen] = useState(false);
  const [controlledDropdownChanges, setControlledDropdownChanges] = useState(0);
  const [controlledContextMenuOpen, setControlledContextMenuOpen] = useState(false);
  const [controlledContextMenuChanges, setControlledContextMenuChanges] = useState(0);
  const [controlledPopoverOpen, setControlledPopoverOpen] = useState(false);
  const [controlledPopoverChanges, setControlledPopoverChanges] = useState(0);
  const [canceledPopoverChanges, setCanceledPopoverChanges] = useState(0);
  const [alertRefSlot, setAlertRefSlot] = useState("pending");
  const [avatarRefSlot, setAvatarRefSlot] = useState("pending");
  const [avatarStatus, setAvatarStatus] = useState("pending");
  const [cardRefSlot, setCardRefSlot] = useState("pending");
  const [breadcrumbRefSlot, setBreadcrumbRefSlot] = useState("pending");
  const [inputRefSlot, setInputRefSlot] = useState("pending");
  const [skeletonRefSlot, setSkeletonRefSlot] = useState("pending");
  const [switchRefSlot, setSwitchRefSlot] = useState("pending");
  const [toggleGroupRefSlot, setToggleGroupRefSlot] = useState("pending");
  const [toggleRefSlot, setToggleRefSlot] = useState("pending");
  const alertRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLSpanElement>(null);
  const breadcrumbRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skeletonRef = useRef<HTMLDivElement>(null);
  const switchRef = useRef<HTMLSpanElement | HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toggleGroupRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement | HTMLSpanElement>(null);
  const setAlertRef = useCallback((node: HTMLDivElement | null) => {
    alertRef.current = node;
    if (node) {
      setAlertRefSlot(node.dataset.slot ?? "missing");
    }
  }, []);
  const setAvatarRef = useCallback((node: HTMLSpanElement | null) => {
    avatarRef.current = node;
    if (node) {
      setAvatarRefSlot(node.dataset.slot ?? "missing");
    }
  }, []);
  const setCardRef = useCallback((node: HTMLDivElement | null) => {
    cardRef.current = node;
    if (node) {
      setCardRefSlot(node.dataset.slot ?? "missing");
    }
  }, []);
  const setBreadcrumbRef = useCallback((node: HTMLElement | null) => {
    breadcrumbRef.current = node;
    if (node) {
      setBreadcrumbRefSlot(node.dataset.slot ?? "missing");
    }
  }, []);
  const setInputRef = useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (node) {
      setInputRefSlot(node.dataset.slot ?? "missing");
    }
  }, []);
  const handleControlledInputValueChange = useCallback((value: string) => {
    setControlledInputValue(value);
    setControlledInputChanges((count) => count + 1);
  }, []);
  const handleControlledInputNativeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setControlledInputNativeChangeValue(event.currentTarget.value);
  }, []);
  const handleRejectedInputValueChange = useCallback(() => {
    setRejectedInputChanges((count) => count + 1);
  }, []);
  const handleControlledInputOtpValueChange = useCallback((value: string) => {
    setControlledInputOtpValue(value);
    setControlledInputOtpChanges((count) => count + 1);
  }, []);
  const setSkeletonRef = useCallback((node: HTMLDivElement | null) => {
    skeletonRef.current = node;
    if (node) {
      setSkeletonRefSlot(node.dataset.slot ?? "missing");
    }
  }, []);
  const setSwitchRef = useCallback((node: HTMLSpanElement | HTMLButtonElement | null) => {
    switchRef.current = node;
    if (node) {
      setSwitchRefSlot(node.dataset.slot ?? "missing");
    }
  }, []);
  const setToggleRef = useCallback((node: HTMLButtonElement | HTMLSpanElement | null) => {
    toggleRef.current = node;
    if (node) {
      setToggleRefSlot(node.dataset.slot ?? "missing");
    }
  }, []);
  const setToggleGroupRef = useCallback((node: HTMLDivElement | null) => {
    toggleGroupRef.current = node;
    if (node) {
      setToggleGroupRefSlot(node.dataset.slot ?? "missing");
    }
  }, []);

  return {
    controlledCollapsibleOpen,
    setControlledCollapsibleOpen,
    controlledCollapsibleChanges,
    setControlledCollapsibleChanges,
    controlledAccordionValue,
    setControlledAccordionValue,
    controlledAccordionChanges,
    setControlledAccordionChanges,
    controlledCheckboxChecked,
    setControlledCheckboxChecked,
    controlledCheckboxChanges,
    setControlledCheckboxChanges,
    controlledCheckboxGroupValue,
    setControlledCheckboxGroupValue,
    controlledCheckboxGroupChanges,
    setControlledCheckboxGroupChanges,
    controlledRadioGroupValue,
    setControlledRadioGroupValue,
    controlledRadioGroupChanges,
    setControlledRadioGroupChanges,
    controlledInputValue,
    setControlledInputValue,
    controlledInputChanges,
    setControlledInputChanges,
    controlledInputNativeChangeValue,
    setControlledInputNativeChangeValue,
    rejectedInputChanges,
    setRejectedInputChanges,
    controlledInputOtpValue,
    setControlledInputOtpValue,
    controlledInputOtpChanges,
    setControlledInputOtpChanges,
    controlledSliderValue,
    setControlledSliderValue,
    controlledSliderChanges,
    setControlledSliderChanges,
    controlledSelectValue,
    setControlledSelectValue,
    controlledSelectChanges,
    setControlledSelectChanges,
    controlledComboboxValue,
    setControlledComboboxValue,
    controlledComboboxInputValue,
    setControlledComboboxInputValue,
    controlledComboboxOpen,
    setControlledComboboxOpen,
    controlledComboboxChanges,
    setControlledComboboxChanges,
    controlledSwitchChecked,
    setControlledSwitchChecked,
    controlledSwitchChanges,
    setControlledSwitchChanges,
    switchResetRenderCount,
    setSwitchResetRenderCount,
    controlledTogglePressed,
    setControlledTogglePressed,
    controlledToggleChanges,
    setControlledToggleChanges,
    controlledToggleGroupValue,
    setControlledToggleGroupValue,
    controlledToggleGroupChanges,
    setControlledToggleGroupChanges,
    toastActionCount,
    setToastActionCount,
    controlledTabsValue,
    setControlledTabsValue,
    controlledTabsChanges,
    setControlledTabsChanges,
    controlledAlertDialogOpen,
    setControlledAlertDialogOpen,
    controlledAlertDialogChanges,
    setControlledAlertDialogChanges,
    controlledSheetOpen,
    setControlledSheetOpen,
    controlledSheetChanges,
    setControlledSheetChanges,
    canceledSheetChanges,
    setCanceledSheetChanges,
    controlledDropdownOpen,
    setControlledDropdownOpen,
    controlledDropdownChanges,
    setControlledDropdownChanges,
    controlledContextMenuOpen,
    setControlledContextMenuOpen,
    controlledContextMenuChanges,
    setControlledContextMenuChanges,
    controlledPopoverOpen,
    setControlledPopoverOpen,
    controlledPopoverChanges,
    setControlledPopoverChanges,
    canceledPopoverChanges,
    setCanceledPopoverChanges,
    alertRefSlot,
    setAlertRefSlot,
    avatarRefSlot,
    setAvatarRefSlot,
    avatarStatus,
    setAvatarStatus,
    cardRefSlot,
    setCardRefSlot,
    breadcrumbRefSlot,
    setBreadcrumbRefSlot,
    inputRefSlot,
    setInputRefSlot,
    skeletonRefSlot,
    setSkeletonRefSlot,
    switchRefSlot,
    setSwitchRefSlot,
    toggleGroupRefSlot,
    setToggleGroupRefSlot,
    toggleRefSlot,
    setToggleRefSlot,
    alertRef,
    avatarRef,
    breadcrumbRef,
    cardRef,
    inputRef,
    skeletonRef,
    switchRef,
    textareaRef,
    toggleGroupRef,
    toggleRef,
    setAlertRef,
    setAvatarRef,
    setCardRef,
    setBreadcrumbRef,
    setInputRef,
    handleControlledInputValueChange,
    handleControlledInputNativeChange,
    handleRejectedInputValueChange,
    handleControlledInputOtpValueChange,
    setSkeletonRef,
    setSwitchRef,
    setToggleRef,
    setToggleGroupRef,
  };
}

type RuntimePrototypeContextValue = ReturnType<typeof useRuntimePrototypeState>;

const RuntimePrototypeContext = createContext<RuntimePrototypeContextValue | null>(null);

export function RuntimePrototypeProvider({ children }: { children: ReactNode }) {
  const value = useRuntimePrototypeState();

  return (
    <RuntimePrototypeContext.Provider value={value}>{children}</RuntimePrototypeContext.Provider>
  );
}

export function useRuntimePrototypeContext() {
  const context = useContext(RuntimePrototypeContext);

  if (!context) {
    throw new Error("useRuntimePrototypeContext must be used within RuntimePrototypeProvider.");
  }

  return context;
}
