"use client";

import { type ReactNode } from "react";
import { useAppSelector } from "@/store/hooks";
import { hasAuthTokens } from "./token";
import { AuthModal } from "./auth-modal";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const { user } = useAppSelector((state) => state.auth);
  const isAuthenticated = Boolean(user) && hasAuthTokens();

  if (!isAuthenticated) {
    return <AuthModal open onClose={() => undefined} />;
  }

  return <>{children}</>;
}
