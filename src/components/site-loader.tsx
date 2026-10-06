"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hideSiteLoader } from "@/store/slices/ui-slice";

export function SiteLoader() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { label, visible } = useAppSelector((state) => state.ui.siteLoader);

  useEffect(() => {
    dispatch(hideSiteLoader());
  }, [dispatch, pathname]);

  useEffect(() => {
    if (!visible) return;

    const timeoutId = window.setTimeout(() => {
      dispatch(hideSiteLoader());
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [dispatch, visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white/90 text-main backdrop-blur-sm">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary" />
      <p className="mt-4 text-sm font-semibold text-secondary">{label}</p>
    </div>
  );
}
