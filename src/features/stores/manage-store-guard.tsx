"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { AuthGuard } from "@/features/auth/auth-guard";
import { hasAuthTokens } from "@/features/auth/token";
import { useAppSelector } from "@/store/hooks";
import { getMyStores } from "./stores-service";

type ManageStoreGuardProps = {
  children: ReactNode;
};

export function ManageStoreGuard({ children }: ManageStoreGuardProps) {
  return (
    <AuthGuard>
      <ManageStoreAccessCheck>{children}</ManageStoreAccessCheck>
    </AuthGuard>
  );
}

function ManageStoreAccessCheck({ children }: ManageStoreGuardProps) {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [status, setStatus] = useState<"checking" | "allowed">("checking");
  const isAuthenticated = Boolean(user) && hasAuthTokens();

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    getMyStores()
      .then((stores) => {
        if (!isMounted) return;

        if (stores.length === 0) {
          router.replace("/stores");
          return;
        }

        setStatus("allowed");
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("allowed");
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, router]);

  if (status === "checking") {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-background px-4 py-6 text-main">
        <div className="rounded-xl bg-surface px-4 py-5 text-sm font-semibold text-secondary">
          Loading store access...
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
