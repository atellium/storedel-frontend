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

export type FullScreenModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  closeLabel?: string;
};

const subscribeToMount = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const modalHistoryKey = "__comynityFullScreenModal";

function getCurrentUrl() {
  return new URL(window.location.href);
}

export function FullScreenModal({
  open,
  onClose,
  children,
  title,
  description,
  className = "",
}: FullScreenModalProps) {
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

  // Handle History API (Back Button Support)
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = open;

    if (open && !wasOpen) {
      const url = getCurrentUrl();
      if (url.searchParams.get("rmodal") !== "true") {
        url.searchParams.set("rmodal", "true");
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
      if (url.searchParams.get("rmodal") !== "true") return;

      url.searchParams.delete("rmodal");

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

  // Listen for Back Button (PopState)
  useEffect(() => {
    const handlePopState = () => {
      if (
        wasOpenRef.current &&
        getCurrentUrl().searchParams.get("rmodal") !== "true"
      ) {
        onCloseRef.current();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Focus Trap & Scroll Lock
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
    : {
        type: "spring" as const,
        damping: 25,
        stiffness: 200,
      };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-9999 flex justify-center pointer-events-none">
          {/* Invisible backdrop to capture clicks outside the modal without dimming the screen */}
          <div
            className="absolute inset-0 pointer-events-auto  "
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            aria-label={title ? undefined : "Modal"}
            className={`pointer-events-auto relative flex h-dvh max-h-dvh w-full max-w-[640px] flex-col bg-surface shadow-xl dark:bg-surface-dark  ${className}`}
            initial="closed"
            animate="open"
            exit="closed"
            variants={{
              open: { x: 0 },
              closed: { x: "100%" },
            }}
            transition={panelTransition}
            onClick={(event) => event.stopPropagation()}
          >
            {/* Accessibility Tags */}
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

            {/* Sticky Header with Back/Close Button */}
            {/* <div className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
                            <button
                                ref={closeButtonRef}
                                type="button"
                                aria-label={closeLabel}
                                onClick={onClose}
                                className="flex size-10 shrink-0 -ml-2 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                            >
                                <X className="size-5" aria-hidden="true" />
                            </button>
                            {title && (
                                <h2 className="truncate text-[16px] font-extrabold text-slate-900">
                                    {title}
                                </h2>
                            )}
                        </div> */}

            {/* Scrollable Content Area */}
            <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain pb-safe-bottom">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default FullScreenModal;
