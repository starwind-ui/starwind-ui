/**
 * Starwind Toast API
 *
 * A simple, framework-agnostic toast notification system.
 *
 * @example
 * ```ts
 * import { toast } from "@/components/starwind/toast";
 *
 * // Simple usage
 * toast("Hello world");
 * toast({ title: "Success", description: "Item saved" });
 *
 * // Variant shortcuts
 * toast.success("Saved successfully");
 * toast.error("Something went wrong");
 * toast.warning("Please check your input");
 * toast.info("New update available");
 * toast.loading("Processing...");
 *
 * // Promise handling
 * toast.promise(saveData(), {
 *   loading: "Saving...",
 *   success: "Saved!",
 *   error: "Failed to save",
 * });
 *
 * // Management
 * const id = toast("Processing...");
 * toast.update(id, { title: "Almost done..." });
 * toast.dismiss(id);
 * toast.dismiss(); // dismiss all
 * ```
 */

export type Variant = "default" | "success" | "error" | "warning" | "info" | "loading";

export interface ToastOptions {
  id?: string;
  title?: string;
  description?: string;
  variant?: Variant;
  /** Duration in ms. Set to 0 for infinite (no auto-dismiss). */
  duration?: number;
  /** Callback when toast close animation starts */
  onClose?: () => void;
  /** Callback when toast is removed from DOM */
  onRemove?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface PromiseStateOption {
  title?: string;
  description?: string;
  duration?: number;
}

export type PromiseStateValue<T> =
  | string
  | PromiseStateOption
  | ((data: T) => string | PromiseStateOption);

export interface PromiseOptions<T, E = Error> {
  loading: string | PromiseStateOption;
  success: PromiseStateValue<T>;
  error: PromiseStateValue<E>;
}

interface ToastManager {
  add(options: ToastOptions): string;
  update(id: string, options: Partial<ToastOptions>): void;
  close(id: string): void;
  closeAll(): void;
}

/**
 * Get the toast manager instance from the window
 */
function getManager(): ToastManager | null {
  if (typeof window === "undefined") return null;
  return (window as any).__starwind__.toast as ToastManager | null;
}

/**
 * Normalize a string or options object to ToastOptions
 */
function normalizeOption<T>(
  value: string | PromiseStateOption | ((data: T) => string | PromiseStateOption),
  data?: T,
): Omit<ToastOptions, "variant"> {
  const resolved = typeof value === "function" ? value(data as T) : value;
  if (typeof resolved === "string") {
    return { title: resolved };
  }
  return resolved;
}

/**
 * Create a toast notification
 */
function createToast(
  messageOrOptions: string | ToastOptions,
  extraOptions?: Omit<ToastOptions, "title">,
): string {
  let options: ToastOptions;
  if (typeof messageOrOptions === "string") {
    options = { title: messageOrOptions, ...extraOptions };
  } else {
    options = messageOrOptions;
  }

  const manager = getManager();
  if (manager) {
    return manager.add(options);
  }

  console.warn("Toast: No Toaster found. Add <Toaster /> to your layout.");
  return "";
}

/**
 * Create a toast with a specific variant
 */
function createVariantToast(
  variant: Variant,
  message: string,
  options?: Omit<ToastOptions, "variant">,
): string {
  return createToast({ ...options, title: message, variant });
}

/**
 * Toast API interface
 */
interface ToastAPI {
  (message: string, options?: Omit<ToastOptions, "title">): string;
  (options: ToastOptions): string;
  success(message: string, options?: Omit<ToastOptions, "variant">): string;
  error(message: string, options?: Omit<ToastOptions, "variant">): string;
  warning(message: string, options?: Omit<ToastOptions, "variant">): string;
  info(message: string, options?: Omit<ToastOptions, "variant">): string;
  loading(message: string, options?: Omit<ToastOptions, "variant">): string;
  promise<T, E = Error>(promise: Promise<T>, options: PromiseOptions<T, E>): Promise<T>;
  update(id: string, options: Partial<ToastOptions>): void;
  dismiss(id?: string): void;
}

/**
 * Main toast function with variant methods attached
 */
const toast = createToast as ToastAPI;

toast.success = (message: string, options?: Omit<ToastOptions, "variant">) =>
  createVariantToast("success", message, options);

toast.error = (message: string, options?: Omit<ToastOptions, "variant">) =>
  createVariantToast("error", message, options);

toast.warning = (message: string, options?: Omit<ToastOptions, "variant">) =>
  createVariantToast("warning", message, options);

toast.info = (message: string, options?: Omit<ToastOptions, "variant">) =>
  createVariantToast("info", message, options);

toast.loading = (message: string, options?: Omit<ToastOptions, "variant">) =>
  createVariantToast("loading", message, { ...options, duration: 0 });

toast.promise = async <T, E = Error>(
  promise: Promise<T>,
  options: PromiseOptions<T, E>,
): Promise<T> => {
  const loadingOpts = normalizeOption(options.loading);
  const id = createToast({
    ...loadingOpts,
    variant: "loading",
    duration: 0, // Don't auto-dismiss while loading
  });

  try {
    const data = await promise;
    const successOpts = normalizeOption(options.success, data);
    toast.update(id, { ...successOpts, variant: "success" });
    return data;
  } catch (error) {
    const errorOpts = normalizeOption(options.error, error as E);
    toast.update(id, { ...errorOpts, variant: "error" });
    throw error;
  }
};

toast.update = (id: string, options: Partial<ToastOptions>): void => {
  const manager = getManager();
  if (manager) {
    manager.update(id, options);
  } else {
    console.warn("Toast: No Toaster found. Add <Toaster /> to your layout.");
  }
};

toast.dismiss = (id?: string): void => {
  const manager = getManager();
  if (!manager) {
    // Can't dismiss if manager isn't ready
    return;
  }
  if (id) {
    manager.close(id);
  } else {
    manager.closeAll();
  }
};

export { toast };
