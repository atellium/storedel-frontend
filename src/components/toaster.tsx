"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hideToast } from "@/store/slices/ui-slice";

const toastStyles = {
  error: {
    icon: "fa-circle-exclamation",
    iconClass: "bg-red-50 text-red-600",
    ringClass: "ring-red-100",
  },
  info: {
    icon: "fa-circle-info",
    iconClass: "bg-blue-50 text-blue-600",
    ringClass: "ring-blue-100",
  },
  success: {
    icon: "fa-circle-check",
    iconClass: "bg-emerald-50 text-emerald-600",
    ringClass: "ring-emerald-100",
  },
};

export function Toaster() {
  const dispatch = useAppDispatch();
  const toast = useAppSelector((state) => state.ui.toast);

  useEffect(() => {
    if (!toast?.visible) return;

    const timeoutId = window.setTimeout(() => {
      dispatch(hideToast());
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [dispatch, toast?.id, toast?.visible]);

  if (!toast) return null;

  const style = toastStyles[toast.type];

  return (
    <div
      className={`fixed inset-x-0 top-4 z-[80] mx-auto w-[calc(100%-24px)] max-w-[420px] transition duration-200 ${
        toast.visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-3 pointer-events-none opacity-0"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className={`flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-xl ring-1 ${style.ringClass}`}>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${style.iconClass}`}>
          <i className={`fa-solid ${style.icon} text-sm`} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-gray-900">{toast.title}</p>
          {toast.message && (
            <p className="mt-0.5 text-xs font-semibold leading-5 text-gray-500">
              {toast.message}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => dispatch(hideToast())}
          aria-label="Dismiss notification"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
        >
          <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
