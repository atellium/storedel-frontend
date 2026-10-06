"use client";

import { useEffect } from "react";
import { enableNotifications } from "@/lib/notifications";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setLocation } from "@/store/slices/preferences-slice";

export function SitePermissionRequests() {
  const dispatch = useAppDispatch();
  const storedLocation = useAppSelector((state) => state.preferences.location);

  useEffect(() => {
    const requestPermissions = () => {
      requestLocationPermission({
        hasStoredLocation: Boolean(storedLocation),
        onLocation: (position) => {
          dispatch(
            setLocation({
              accuracy: position.coords.accuracy,
              fetchedAt: new Date().toISOString(),
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          );
        },
      });
      void requestNotificationPermission();
    };

    if (document.readyState === "complete") {
      requestPermissions();
      return;
    }

    window.addEventListener("load", requestPermissions, { once: true });

    return () => {
      window.removeEventListener("load", requestPermissions);
    };
  }, [dispatch, storedLocation]);

  return null;
}

function requestLocationPermission({
  hasStoredLocation,
  onLocation,
}: {
  hasStoredLocation: boolean;
  onLocation: (position: GeolocationPosition) => void;
}) {
  if (hasStoredLocation) return;
  if (!("geolocation" in navigator)) return;

  navigator.geolocation.getCurrentPosition(
    onLocation,
    () => undefined,
    {
      enableHighAccuracy: false,
      maximumAge: 300_000,
      timeout: 10_000,
    },
  );
}

async function requestNotificationPermission() {
  if (!("Notification" in window) || Notification.permission !== "default") {
    return;
  }

  try {
    await enableNotifications();
  } catch {
    // Permission may be denied or Firebase messaging may be unavailable.
  }
}
