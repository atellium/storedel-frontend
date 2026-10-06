"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/features/auth/auth-guard";

const QR_SIZE = 1024;
const QR_SERVICE_URL = "https://api.qrserver.com/v1/create-qr-code/";
const APP_ICON_SRC = "/icons/app-icon.png";

export function StoreQrCodeSettingsView({ storeSlug }: { storeSlug: string }) {
  return (
    <AuthGuard>
      <StoreQrCodeSettingsContent storeSlug={storeSlug} />
    </AuthGuard>
  );
}

function StoreQrCodeSettingsContent({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const generateQrCode = useCallback(async () => {
    if (typeof window === "undefined") return;

    setStatus("loading");

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      window.location.origin;
    const nextStoreUrl = `${baseUrl}/${storeSlug}`;

    try {
      const [qrImage, appIcon] = await Promise.all([
        loadImage(getQrImageUrl(nextStoreUrl)),
        loadImage(APP_ICON_SRC),
      ]);
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");

      if (!canvas || !context) {
        setStatus("error");
        return;
      }

      canvas.width = QR_SIZE;
      canvas.height = QR_SIZE;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, QR_SIZE, QR_SIZE);
      context.drawImage(qrImage, 0, 0, QR_SIZE, QR_SIZE);

      const iconBoxSize = 220;
      const iconSize = 168;
      const iconBoxX = (QR_SIZE - iconBoxSize) / 2;
      const iconX = (QR_SIZE - iconSize) / 2;

      drawRoundedRect(context, iconBoxX, iconBoxX, iconBoxSize, iconBoxSize, 48);
      context.fillStyle = "#ffffff";
      context.fill();
      context.save();
      drawRoundedRect(context, iconX, iconX, iconSize, iconSize, 40);
      context.clip();
      context.drawImage(appIcon, iconX, iconX, iconSize, iconSize);
      context.restore();

      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [storeSlug]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void generateQrCode();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [generateQrCode]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || status !== "ready") return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${storeSlug}-store-qr.png`;
    link.click();
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] pb-10 text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="flex h-10 items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left text-base" aria-hidden="true" />
          </button>

          <h1 className="text-base font-bold text-gray-900">Store QR code</h1>

          <Link
            href={`/${storeSlug}`}
            aria-label="Public store"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-primary transition active:scale-95"
          >
            <i className="fa-solid fa-store text-sm" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="px-4 py-5">
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
            Store controls
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900">
            Download QR
          </h2>
        </div>

        <div className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mx-auto flex max-w-[320px] flex-col items-center">
            <div className="relative aspect-square w-full rounded-[20px] border border-gray-100 bg-gray-50 p-3">
              {status === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-500">
                  Generating QR...
                </div>
              )}
              {status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                  <p className="text-sm font-bold text-red-500">
                    Could not generate QR code.
                  </p>
                  <button
                    type="button"
                    onClick={() => void generateQrCode()}
                    className="mt-3 h-10 rounded-xl bg-primary px-4 text-xs font-bold uppercase tracking-wider text-white"
                  >
                    Retry
                  </button>
                </div>
              )}
              <canvas
                ref={canvasRef}
                className={`h-full w-full rounded-2xl bg-white ${status === "ready" ? "block" : "invisible"}`}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={status !== "ready"}
            onClick={handleDownload}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
          >
            <i className="fa-solid fa-download text-sm" aria-hidden="true" />
            Download QR Code
          </button>
        </div>
      </section>
    </main>
  );
}

function getQrImageUrl(value: string) {
  const url = new URL(QR_SERVICE_URL);
  url.searchParams.set("size", `${QR_SIZE}x${QR_SIZE}`);
  url.searchParams.set("margin", "36");
  url.searchParams.set("ecc", "H");
  url.searchParams.set("data", value);
  return url.toString();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${src}`));
    image.src = src;
  });
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
