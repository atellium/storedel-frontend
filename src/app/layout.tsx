import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { PwaServiceWorker } from "@/components/pwa-service-worker";
import { ProductCategoryProvider } from "@/features/product-categories/product-category-provider";
import { StoreProvider } from "@/store/provider";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Storedel",
  description: "Shop from nearby stores with Storedel.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Storedel",
  },
  applicationName: "Storedel",
  icons: {
    icon: "/icons/app-icon.png",
    apple: "/icons/app-icon.png",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/fontawesome/css/all.css" />
      </head>
      <body className="min-h-full flex flex-col">
        <PwaServiceWorker />
        <PwaInstallPrompt />
        <StoreProvider>
          <ProductCategoryProvider>{children}</ProductCategoryProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
