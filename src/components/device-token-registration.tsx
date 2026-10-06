"use client";

import { useEffect } from "react";
import { hasAuthTokens } from "@/features/auth/token";
import {
  listenForForegroundNotifications,
  registerCurrentDeviceToken,
} from "@/lib/notifications";
import { useAppSelector } from "@/store/hooks";

export function DeviceTokenRegistration() {
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user || !hasAuthTokens()) return;

    void registerCurrentDeviceToken();
  }, [user]);

  useEffect(() => {
    if (!user || !hasAuthTokens()) return;

    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    listenForForegroundNotifications().then((nextUnsubscribe) => {
      if (!isMounted) {
        nextUnsubscribe();
        return;
      }

      unsubscribe = nextUnsubscribe;
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [user]);

  return null;
}
