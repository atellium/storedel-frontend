"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

export type BottomSheetModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  closeLabel?: string;
  closeOnBackdropClick?: boolean;
};

const subscribeToMount = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
const modalHistoryKey = "__comynityBottomSheet";

function getCurrentUrl() {
  return new URL(window.location.href);
}

export function BottomSheetModal({
  open,
  onClose,
  children,
  title,
  description,
  className = "",
  closeOnBackdropClick = true,
}: BottomSheetModalProps) {
  const mounted = useSyncExternalStore(
    subscribeToMount,
    getClientSnapshot,
    getServerSnapshot,
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const wasOpenRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = open;

    if (open && !wasOpen) {
      const url = getCurrentUrl();
      if (url.searchParams.get("modal") !== "true") {
        url.searchParams.set("modal", "true");
        window.history.pushState(
          {
            ...(window.history.state ?? {}),
            [modalHistoryKey]: true,
          },
          "",
          `${url.pathname}${url.search}${url.hash}`,
        );
      }
      return;
    }

    if (!open && wasOpen) {
      const url = getCurrentUrl();
      if (url.searchParams.get("modal") !== "true") return;

      url.searchParams.delete("modal");

      if (window.history.state?.[modalHistoryKey]) {
        window.history.replaceState(
          window.history.state,
          "",
          `${url.pathname}${url.search}${url.hash}`,
        );
        window.history.back();
        return;
      }

      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    }
  }, [open]);

  useEffect(() => {
    const handlePopState = () => {
      if (
        wasOpenRef.current &&
        getCurrentUrl().searchParams.get("modal") !== "true"
      ) {
        onCloseRef.current();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [open]);

  if (!mounted) return null;

  const panelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "tween" as const, duration: 0.25, ease: "easeOut" as const };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-9999 flex items-end justify-center  "
          initial="closed"
          animate="open"
          exit="closed"
        >
          <motion.button
            type="button"
            aria-label="Close modal backdrop"
            className="absolute inset-0 cursor-default bg-black/60"
            onClick={closeOnBackdropClick ? onClose : undefined}
            variants={{
              open: { opacity: 1 },
              closed: { opacity: 0 },
            }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            aria-label={title ? undefined : "Modal"}
            className={`relative z-10 w-full max-w-[640px]  ${className}`}
            variants={{
              open: { opacity: 1, x: 0, y: 0, scale: 1 },
              closed: { opacity: 1, x: 0, y: "100%", scale: 1 },
            }}
            transition={panelTransition}
            onClick={(event) => event.stopPropagation()}
          >
            {title && (
              <span id={titleId} className="sr-only">
                {title}
              </span>
            )}
            {description && (
              <span id={descriptionId} className="sr-only">
                {description}
              </span>
            )}
            <div className="mb-3 flex justify-center">
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="inline-flex size-10 items-center justify-center rounded-full bg-white text-main shadow-lg"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            <div className="flex max-h-[90dvh] flex-col overflow-hidden rounded-t-2xl bg-surface shadow-2xl dark:bg-surface-dark  ">
              <div className="min-h-0 overflow-y-auto overscroll-contain">
                {children}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default BottomSheetModal;
