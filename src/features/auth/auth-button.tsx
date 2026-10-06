"use client";

import { useRouter } from "next/navigation";
import {
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hideSiteLoader, showSiteLoader } from "@/store/slices/ui-slice";
import { AuthModal } from "./auth-modal";
import { hasAuthTokens } from "./token";

type AuthButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "type"
> & {
  href: string;
  children: ReactNode;
};

export function AuthButton({ href, children, ...linkProps }: AuthButtonProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const isAuthenticated = Boolean(user) && hasAuthTokens();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (isAuthenticated) {
      dispatch(showSiteLoader("Please wait..."));
      router.push(href);
      window.setTimeout(() => {
        dispatch(hideSiteLoader());
      }, 1500);
      return;
    }

    setIsAuthModalOpen(true);
  };

  return (
    <>
      <button type="button" onClick={handleClick} {...linkProps}>
        {children}
      </button>

      <AuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        redirectTo={href}
      />
    </>
  );
}
