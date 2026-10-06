"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ChangeEvent } from "react";
import { AuthGuard } from "@/features/auth/auth-guard";
import {
  completeUploads,
  createUploads,
  uploadFileToStorage,
  type CompletedUpload,
} from "./uploads-service";

type SelectedImage = {
  id: string;
  originalFile: File;
  compressedFile: File;
  previewUrl: string;
  title: string;
};

export function UploadsView() {
  return (
    <AuthGuard>
      <UploadsContent />
    </AuthGuard>
  );
}

function UploadsContent() {
  const router = useRouter();
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [completedUploads, setCompletedUploads] = useState<CompletedUpload[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "uploading">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const canUpload = images.length > 0 && status === "idle";
  const totalSize = useMemo(
    () => images.reduce((sum, image) => sum + image.compressedFile.size, 0),
    [images],
  );

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length === 0) return;

    setStatus("processing");
    setMessage(null);
    setCompletedUploads([]);

    try {
      const nextImages = await Promise.all(files.map(prepareImage));
      setImages((currentImages) => [...currentImages, ...nextImages]);
    } catch {
      setMessage("Could not process one or more images.");
    } finally {
      setStatus("idle");
      event.target.value = "";
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages((currentImages) => {
      const image = currentImages.find((item) => item.id === id);
      if (image) URL.revokeObjectURL(image.previewUrl);
      return currentImages.filter((item) => item.id !== id);
    });
  };

  const handleTitleChange = (id: string, title: string) => {
    setImages((currentImages) =>
      currentImages.map((image) =>
        image.id === id ? { ...image, title } : image,
      ),
    );
  };

  const handleUpload = async () => {
    if (!canUpload) return;

    setStatus("uploading");
    setMessage(null);
    setCompletedUploads([]);

    try {
      const pendingUploads = await createUploads(
        images.map((image) => ({
          mime_type: "image/webp",
          title: image.title.trim() || image.originalFile.name,
        })),
      );

      await Promise.all(
        pendingUploads.map((upload, index) =>
          uploadFileToStorage(upload.upload_url, images[index].compressedFile),
        ),
      );

      const completed = await completeUploads(
        pendingUploads.map((upload) => upload.id),
      );

      setCompletedUploads(completed);
      setMessage("Upload complete.");
    } catch {
      setMessage("Upload failed. Please try again.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="grid h-15 grid-cols-[auto_1fr_auto] items-center gap-3 px-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex size-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          </button>
          <h1 className="text-center text-lg font-bold text-gray-900">Uploads</h1>
          <Link
            href="/"
            className="inline-flex size-10 items-center justify-center rounded-full border border-gray-200 bg-white text-primary shadow-sm transition active:scale-95"
            aria-label="Home"
          >
            <i className="fa-solid fa-house" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="px-3 py-5">
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed border-primary/40 bg-white px-4 py-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition active:scale-[0.99]">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={status !== "idle"}
            className="sr-only"
          />
          <i className="fa-solid fa-cloud-arrow-up text-2xl text-primary" aria-hidden="true" />
          <span className="mt-3 text-sm font-bold text-gray-900">
            Select images
          </span>
          <span className="mt-1 text-xs font-semibold text-secondary">
            Images are resized to 640px max width and converted to WebP.
          </span>
        </label>

        {status === "processing" && (
          <div className="mt-4 rounded-[20px] border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-500 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            Preparing images...
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-[20px] border border-gray-100 bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm">
            {message}
          </div>
        )}

        {images.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-gray-900">
                {images.length} selected
              </h2>
              <p className="text-xs font-semibold text-secondary">
                {formatBytes(totalSize)}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
                >
                  <Image
                    src={image.previewUrl}
                    alt={image.originalFile.name}
                    width={320}
                    height={320}
                    unoptimized
                    className="aspect-square w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="truncate text-xs font-bold text-gray-900">
                      {image.originalFile.name}
                    </p>
                    <label
                      htmlFor={`title-${image.id}`}
                      className="mt-3 block text-xs font-bold text-gray-900"
                    >
                      Title
                    </label>
                    <input
                      id={`title-${image.id}`}
                      type="text"
                      value={image.title}
                      onChange={(event) =>
                        handleTitleChange(image.id, event.target.value)
                      }
                      placeholder="Image title"
                      disabled={status !== "idle"}
                      className="mt-1 h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-900 outline-none transition focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    <p className="mt-1 text-xs font-semibold text-secondary">
                      {formatBytes(image.originalFile.size)} →{" "}
                      {formatBytes(image.compressedFile.size)}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.id)}
                      disabled={status !== "idle"}
                      className="mt-2 text-xs font-bold text-primary disabled:text-secondary"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleUpload}
              disabled={!canUpload}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-sm transition active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-500 disabled:active:scale-100"
            >
              {status === "uploading" ? "Uploading..." : "Upload"}
            </button>
          </div>
        )}

        {completedUploads.length > 0 && (
          <div className="mt-5 rounded-[20px] border border-gray-100 bg-white px-4 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h2 className="text-sm font-bold text-gray-900">Completed uploads</h2>
            <div className="mt-3 space-y-3">
              {completedUploads.map((upload) => (
                <div key={upload.id} className="text-xs">
                  <p className="font-bold text-gray-900">{upload.title}</p>
                  <p className="mt-1 break-all font-semibold text-secondary">
                    {upload.object_key}
                  </p>
                  <a
                    href={upload.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex font-bold text-primary"
                  >
                    View image
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

async function prepareImage(file: File) {
  const compressedBlob = await compressImageToWebp(file);
  const compressedFile = new File(
    [compressedBlob],
    `${getFileNameWithoutExtension(file.name)}.webp`,
    { type: "image/webp" },
  );

  return {
    id: crypto.randomUUID(),
    originalFile: file,
    compressedFile,
    previewUrl: URL.createObjectURL(compressedFile),
    title: getFileNameWithoutExtension(file.name),
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
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Image conversion failed."));
      },
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

function getFileNameWithoutExtension(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "") || "image";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
