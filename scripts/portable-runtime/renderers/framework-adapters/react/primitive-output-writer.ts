import { writeGeneratedFile } from "../../shared.js";
import {
  type FrameworkAdapterPrimitiveOutputWriterOptions,
  writePrimitiveOutputFiles,
} from "../primitive-output-writer.js";
import { reactFrameworkAdapter } from "./adapter.js";

const REACT_IMPORT = 'import * as React from "react";';
const SET_REF_IMPORT = 'import { setRef } from "../internal/compose-refs";';
const LAYOUT_EFFECT_IMPORT =
  'import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";';
const PASSIVE_EFFECT_PLACEHOLDER = "__STARWIND_PASSIVE_REACT_EFFECT__";

export type ReactAdapterOutputWriterOptions = FrameworkAdapterPrimitiveOutputWriterOptions & {
  outputModel: Parameters<typeof writePrimitiveOutputFiles>[0]["outputModel"];
  tsHeader: string;
};

export async function writeReactAdapterOutput({
  componentName,
  ignoreOutputModelFilePaths,
  outputModel,
  outputRoot,
  tsHeader,
}: ReactAdapterOutputWriterOptions): Promise<void> {
  await writePrimitiveOutputFiles({
    adapter: reactFrameworkAdapter,
    componentName,
    extension: "tsx",
    ignoreOutputModelFilePaths,
    outputModel,
    outputRoot,
    target: "react",
    targetDisplayName: "React",
    transformPrintedFile: (file) => `${tsHeader}${file.contents}`,
    writeFile: writeReactPrimitiveFile,
  });
}

export async function writeReactPrimitiveFile(
  dir: string,
  fileName: string,
  contents: string,
): Promise<void> {
  await writeGeneratedFile(
    dir,
    fileName,
    applyReactRefCleanup(applyReactEffectTiming(contents)),
  );
}

export function renderUseIsomorphicLayoutEffectFile(tsHeader: string): string {
  return `${tsHeader}import * as React from "react";

export const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;
`;
}

export function renderUseClosePresenceFile(tsHeader: string): string {
  return `${tsHeader}import * as React from "react";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";

const PRESENCE_ENDING_ATTRIBUTE = "data-ending-style";

export type ClosePresenceOptions = {
  keepMounted?: boolean;
  open: boolean;
};

export type ClosePresenceState<T extends HTMLElement> = {
  hidden: boolean;
  present: boolean;
  ref: React.RefCallback<T>;
};

export function useClosePresence<T extends HTMLElement>({
  keepMounted = false,
  open,
}: ClosePresenceOptions): ClosePresenceState<T> {
  const elementRef = React.useRef<T | null>(null);
  const tokenRef = React.useRef(0);
  const timeoutRef = React.useRef<number | undefined>(undefined);
  const hasOpenedRef = React.useRef(open);
  const [present, setPresent] = React.useState(() => open || keepMounted);
  const [hidden, setHidden] = React.useState(() => !open);

  if (open) {
    hasOpenedRef.current = true;
  }

  const clearScheduledClose = React.useCallback(() => {
    tokenRef.current += 1;

    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const ref = React.useCallback((node: T | null) => {
    elementRef.current = node;
  }, []);

  useIsomorphicLayoutEffect(() => {
    return () => {
      clearScheduledClose();
      elementRef.current?.removeAttribute(PRESENCE_ENDING_ATTRIBUTE);
    };
  }, [clearScheduledClose]);

  useIsomorphicLayoutEffect(() => {
    const element = elementRef.current;
    clearScheduledClose();

    if (open) {
      element?.removeAttribute(PRESENCE_ENDING_ATTRIBUTE);
      setPresent(true);
      setHidden(false);
      return;
    }

    if (!hasOpenedRef.current) {
      element?.removeAttribute(PRESENCE_ENDING_ATTRIBUTE);
      setPresent(keepMounted);
      setHidden(true);
      return;
    }

    const token = tokenRef.current;
    setPresent(true);
    setHidden(false);

    const completeClose = () => {
      if (tokenRef.current !== token) return;

      element?.removeAttribute(PRESENCE_ENDING_ATTRIBUTE);
      setHidden(true);
      setPresent(keepMounted);
    };

    if (!element) {
      completeClose();
      return;
    }

    element.setAttribute(PRESENCE_ENDING_ATTRIBUTE, "");
    waitForElementAnimations(element, completeClose, (timeoutId) => {
      timeoutRef.current = timeoutId;
    });
  }, [clearScheduledClose, keepMounted, open]);

  return {
    hidden: open ? false : hidden,
    present: open || keepMounted || present,
    ref,
  };
}

function waitForElementAnimations(
  element: HTMLElement,
  onComplete: () => void,
  onTimeout: (timeoutId: number) => void,
): void {
  const animations = getElementAnimations(element);
  if (animations.length > 0) {
    Promise.allSettled(animations.map((animation) => animation.finished)).then(onComplete);
    return;
  }

  const timeoutMs = getStyleAnimationTimeoutMs(element);
  if (timeoutMs > 0) {
    onTimeout(window.setTimeout(onComplete, timeoutMs));
    return;
  }

  onComplete();
}

function getElementAnimations(element: HTMLElement): Animation[] {
  if (typeof element.getAnimations !== "function") return [];

  return element.getAnimations();
}

function getStyleAnimationTimeoutMs(element: HTMLElement): number {
  if (typeof window === "undefined" || typeof window.getComputedStyle !== "function") return 0;

  const styles = window.getComputedStyle(element);
  return Math.max(
    getMaxTimePairMs(styles.animationDuration, styles.animationDelay),
    getMaxTimePairMs(styles.transitionDuration, styles.transitionDelay),
  );
}

function getMaxTimePairMs(durationsValue: string, delaysValue: string): number {
  const durations = parseTimeListMs(durationsValue);
  const delays = parseTimeListMs(delaysValue);
  const itemCount = Math.max(durations.length, delays.length);
  let max = 0;

  for (let index = 0; index < itemCount; index += 1) {
    const duration = durations[index % durations.length] ?? 0;
    const delay = delays[index % delays.length] ?? 0;
    max = Math.max(max, duration + delay);
  }

  return max;
}

function parseTimeListMs(value: string): number[] {
  const times = value
    .split(",")
    .map((part) => parseTimeMs(part.trim()))
    .filter((time) => Number.isFinite(time));

  return times.length > 0 ? times : [0];
}

function parseTimeMs(value: string): number {
  if (value.endsWith("ms")) return Number.parseFloat(value);
  if (value.endsWith("s")) return Number.parseFloat(value) * 1000;
  return Number.parseFloat(value) || 0;
}
`;
}

export function renderComposeRefsFile(tsHeader: string): string {
  return `${tsHeader}import * as React from "react";

export type AsChildProps = React.HTMLAttributes<HTMLElement> &
  React.RefAttributes<HTMLElement> &
  Record<string, unknown>;

export type RefCapableElementProps = AsChildProps & {
  href?: string;
};

export type AsChildMergeOptions = {
  eventOrder?: "child-first" | "parent-first";
  protectedProps?: AsChildProps;
};

export function getElementRef(
  element: React.ReactElement<RefCapableElementProps>,
): React.Ref<HTMLElement> | undefined {
  if (Number.parseInt(React.version, 10) >= 19) {
    return element.props.ref;
  }

  return (element as React.ReactElement<RefCapableElementProps> & { ref?: React.Ref<HTMLElement> })
    .ref;
}

export function getAsChildElement(
  children: React.ReactNode,
): React.ReactElement<RefCapableElementProps> | null {
  const childArray = React.Children.toArray(children);
  if (childArray.length !== 1) return null;

  const child = childArray[0];
  return React.isValidElement<RefCapableElementProps>(child) ? child : null;
}

export function mergeAsChildProps(
  parentProps: AsChildProps,
  childProps: AsChildProps,
  options: AsChildMergeOptions = {},
): AsChildProps {
  const { eventOrder = "child-first", protectedProps } = options;
  const mergedProps: AsChildProps = { ...parentProps, ...childProps };
  const className = mergeAsChildClassName(parentProps.className, childProps.className);
  const style = mergeAsChildStyle(parentProps.style, childProps.style);

  if (className) {
    mergedProps.className = className;
  } else {
    delete mergedProps.className;
  }

  if (style) {
    mergedProps.style = style;
  } else {
    delete mergedProps.style;
  }

  Object.keys(parentProps).forEach((propName) => {
    if (!isAsChildEventHandler(propName)) return;

    const parentHandler = getAsChildEventHandler(parentProps[propName]);
    const childHandler = getAsChildEventHandler(childProps[propName]);
    if (!parentHandler || !childHandler) return;

    mergedProps[propName] = composeAsChildEventHandlers(
      parentHandler,
      childHandler,
      eventOrder,
    );
  });

  if (protectedProps) {
    Object.assign(mergedProps, protectedProps);
  }

  return mergedProps;
}

export function useComposedRefs<T>(
  outerRef: React.Ref<T> | undefined,
  innerRef: React.Ref<T> | undefined,
): React.RefCallback<T> {
  return React.useCallback(
    (value) => {
      const cleanups = [setRef(outerRef, value), setRef(innerRef, value)].filter(
        (cleanup): cleanup is RefCleanup => typeof cleanup === "function",
      );

      return () => {
        cleanups.reverse().forEach((cleanup) => cleanup());
      };
    },
    [outerRef, innerRef],
  );
}

function mergeAsChildClassName(
  parentClassName: string | undefined,
  childClassName: string | undefined,
): string | undefined {
  return [parentClassName, childClassName].filter(Boolean).join(" ") || undefined;
}

function mergeAsChildStyle(
  parentStyle: React.CSSProperties | undefined,
  childStyle: React.CSSProperties | undefined,
): React.CSSProperties | undefined {
  if (parentStyle && childStyle) return { ...parentStyle, ...childStyle };
  return childStyle ?? parentStyle;
}

function isAsChildEventHandler(propName: string): boolean {
  return /^on[A-Z]/.test(propName);
}

function getAsChildEventHandler(value: unknown): ((...args: unknown[]) => unknown) | undefined {
  return typeof value === "function" ? (value as (...args: unknown[]) => unknown) : undefined;
}

function composeAsChildEventHandlers(
  parentHandler: (...args: unknown[]) => unknown,
  childHandler: (...args: unknown[]) => unknown,
  eventOrder: NonNullable<AsChildMergeOptions["eventOrder"]>,
): (...args: unknown[]) => void {
  return (...args) => {
    if (eventOrder === "parent-first") {
      parentHandler(...args);
      if (!isDefaultPrevented(args[0])) {
        childHandler(...args);
      }
      return;
    }

    childHandler(...args);
    if (!isDefaultPrevented(args[0])) {
      parentHandler(...args);
    }
  };
}

function isDefaultPrevented(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const event = value as { defaultPrevented?: boolean };
  return event.defaultPrevented === true;
}

type RefCleanup = () => void;

export function setRef<T>(
  ref: React.Ref<T> | undefined,
  value: T | null,
): RefCleanup | undefined {
  if (!ref) return undefined;

  if (typeof ref === "function") {
    const cleanup = ref(value);
    return typeof cleanup === "function" ? cleanup : () => ref(null);
  }

  ref.current = value;
  return () => {
    ref.current = null;
  };
}
`;
}

const LOCAL_SET_REF_FUNCTION = `function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {
  if (!ref) return;

  if (typeof ref === "function") {
    ref(value);
    return;
  }

  ref.current = value;
}`;

export function applyReactRefCleanup(contents: string): string {
  if (!contents.includes(LOCAL_SET_REF_FUNCTION)) return contents;

  const importAnchor = contents.includes(LAYOUT_EFFECT_IMPORT) ? LAYOUT_EFFECT_IMPORT : REACT_IMPORT;
  const imports =
    importAnchor === LAYOUT_EFFECT_IMPORT
      ? `${SET_REF_IMPORT}\n${LAYOUT_EFFECT_IMPORT}`
      : `${REACT_IMPORT}\n${SET_REF_IMPORT}`;

  return contents
    .replace(importAnchor, imports)
    .replaceAll(LOCAL_SET_REF_FUNCTION, "")
    .replace(
      /^(\s*)setRef\(([^\n;]+)\);(?=\r?\n\s*},)/gm,
      "$1return setRef($2);",
    );
}

export function applyReactEffectTiming(contents: string): string {
  if (!contents.includes(REACT_IMPORT)) return contents;

  let next = protectMarkedPassiveEffects(contents);

  if (next.includes("React.useLayoutEffect")) {
    next = ensureIsomorphicLayoutEffectImport(next);
    next = next.replace(/\bReact\.useLayoutEffect\b/g, "useIsomorphicLayoutEffect");
  }

  if (usesRuntimeControllerEffect(next)) {
    next = ensureIsomorphicLayoutEffectImport(next);
    next = next.replace(/\bReact\.useEffect\b/g, "useIsomorphicLayoutEffect");
  }

  return restoreMarkedPassiveEffects(next);
}

function ensureIsomorphicLayoutEffectImport(contents: string): string {
  return contents.includes(LAYOUT_EFFECT_IMPORT)
    ? contents
    : contents.replace(REACT_IMPORT, `${REACT_IMPORT}\n${LAYOUT_EFFECT_IMPORT}`);
}

function usesRuntimeControllerEffect(contents: string): boolean {
  return contents.includes("React.useEffect") && contents.includes(".destroy()");
}

function protectMarkedPassiveEffects(contents: string): string {
  return contents.replace(
    /React\.useEffect\(\s*\/\* @starwind-passive-effect \*\/\s*/g,
    `${PASSIVE_EFFECT_PLACEHOLDER}(`,
  );
}

function restoreMarkedPassiveEffects(contents: string): string {
  return contents.replaceAll(PASSIVE_EFFECT_PLACEHOLDER, "React.useEffect");
}
