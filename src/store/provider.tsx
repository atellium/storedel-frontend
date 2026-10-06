"use client";

import { type ReactNode } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { DeviceTokenRegistration } from "@/components/device-token-registration";
import { SitePermissionRequests } from "@/components/site-permission-requests";
import { SiteLoader } from "@/components/site-loader";
import { Toaster } from "@/components/toaster";
import { persistor, store } from "./store";

export function StoreProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
        <SitePermissionRequests />
        <DeviceTokenRegistration />
        <Toaster />
        <SiteLoader />
      </PersistGate>
    </Provider>
  );
}
