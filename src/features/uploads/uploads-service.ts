import { privateApiClient } from "@/lib/api-client";

export type CreateUploadFile = {
  mime_type: string;
  title: string;
};

export type PendingUpload = {
  id: string;
  object_key: string;
  upload_url: string;
  mime_type: string;
  expires_in: number;
};

export type CompletedUpload = {
  id: string;
  object_key: string;
  url: string;
  mime_type: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function createUploads(files: CreateUploadFile[]) {
  const response = await privateApiClient.post<{ results: PendingUpload[] }>(
    "/api/uploads/",
    { files },
  );

  return response.data.results;
}

export async function uploadFileToStorage(uploadUrl: string, file: Blob) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "image/webp",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Upload failed.");
  }
}

export async function completeUploads(uploadIds: string[]) {
  const response = await privateApiClient.post<{
    results: CompletedUpload[];
    completed_at: string;
  }>("/api/uploads/complete/", {
    upload_ids: uploadIds,
  });

  return response.data.results;
}
