"use client";

import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import {
  completeUploads,
  createUploads,
  uploadFileToStorage,
} from "@/features/uploads/uploads-service";
import type { StoreProductUpload } from "@/features/stores/types";

type ProductImageManagerProps = {
  uploads: StoreProductUpload[];
  onChange: (uploads: StoreProductUpload[]) => void;
};

export function ProductImageManager({ onChange, uploads }: ProductImageManagerProps) {
  const [status, setStatus] = useState<"idle" | "processing" | "uploading">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (files.length === 0 || status !== "idle") return;

    setStatus("processing");
    setMessage(null);

    try {
      const prepared = await Promise.all(files.map(prepareImage));
      setStatus("uploading");

      const pending = await createUploads(
        prepared.map((image) => ({
          mime_type: "image/webp",
          title: image.title,
        })),
      );

      await Promise.all(
        pending.map((upload, index) =>
          uploadFileToStorage(upload.upload_url, prepared[index].file),
        ),
      );

      const completed = await completeUploads(pending.map((upload) => upload.id));
      onChange([...uploads, ...completed]);
      setMessage("Images uploaded.");
    } catch {
      setMessage("Image upload failed. Existing images were kept.");
    } finally {
      setStatus("idle");
      event.target.value = "";
    }
  };

  return (
    <section className="rounded-xl bg-surface p-4">
      <h2 className="text-sm font-bold text-main">Images</h2>
      <label className="mt-3 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary bg-primary/5 px-4 py-5 text-center">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={status !== "idle"}
          className="sr-only"
        />
        <i className="fa-solid fa-cloud-arrow-up text-xl text-primary" aria-hidden="true" />
        <span className="mt-2 text-sm font-bold text-main">
          {status === "idle" ? "Select images" : status === "processing" ? "Preparing..." : "Uploading..."}
        </span>
      </label>

      {message && (
        <p className="mt-2 rounded-lg bg-background px-3 py-2 text-xs font-bold text-secondary">
          {message}
        </p>
      )}

      {uploads.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {uploads.map((upload, index) => (
            <div key={upload.id} className="overflow-hidden rounded-xl bg-background">
              <Image
                src={upload.url}
                alt={upload.title || "Product image"}
                width={320}
                height={320}
                className="aspect-square w-full object-cover"
              />
              <div className="p-2">
                <p className="truncate text-xs font-bold text-main">
                  {upload.title || `Image ${index + 1}`}
                </p>
                <button
                  type="button"
                  onClick={() => onChange(uploads.filter((item) => item.id !== upload.id))}
                  className="mt-1 text-xs font-bold text-primary"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

async function prepareImage(file: File) {
  const blob = await compressImageToWebp(file);
  return {
    file: new File([blob], `${file.name.replace(/\.[^/.]+$/, "") || "image"}.webp`, {
      type: "image/webp",
    }),
    title: file.name.replace(/\.[^/.]+$/, "") || "image",
  };
}

async function compressImageToWebp(file: File) {
  const image = await loadImage(file);
  const scale = Math.min(1, 640 / image.naturalWidth);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported.");
  context.drawImage(image, 0, 0, width, height);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Image conversion failed."))),
      "image/webp",
      0.82,
    );
  });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed."));
    };
    image.src = url;
  });
}
