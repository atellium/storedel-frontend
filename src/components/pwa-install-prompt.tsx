"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type StandaloneNavigator = Navigator & {
  standalone?: boolean;
};

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as StandaloneNavigator).standalone === true;

    if (isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;

    await installEvent.prompt();
    await installEvent.userChoice;

    setIsVisible(false);
    setInstallEvent(null);
  };

  if (!isVisible) return null;

  return (
    <div className="sticky top-0 z-[60] border-b border-border bg-white px-3 py-2 text-main shadow-sm">
      <div className="mx-auto flex w-full max-w-[640px] items-center gap-3">
        <Image
          src="/icons/app-icon.png"
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-xl"
        />
        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-main">
          For a better experience use our app.
        </p>
        <button
          type="button"
          onClick={handleInstall}
          className="h-9 shrink-0 rounded-lg bg-primary px-4 text-sm font-bold text-white"
        >
          Use app
        </button>
      </div>
    </div>
  );
}
