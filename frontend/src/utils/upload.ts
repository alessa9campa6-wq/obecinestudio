import { Platform } from "react-native";
import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";

export type LocalFile = {
  uri: string;
  name?: string;
  mimeType?: string;
};

export type UploadOptions = {
  files: Record<string, LocalFile>;
  fields?: Record<string, string>;
  method?: "POST" | "PUT";
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export function fileNameFor(file: LocalFile): string {
  return (
    file.name ||
    file.uri.split("?")[0].split("/").pop() ||
    "file"
  );
}

export async function toFormDataPart(
  file: LocalFile
): Promise<Blob> {
  if (Platform.OS !== "web") {
    return new File(file.uri);
  }

  const response = await fetch(file.uri);
  const blob = await response.blob();

  return file.mimeType && file.mimeType !== blob.type
    ? new Blob([blob], { type: file.mimeType })
    : blob;
}

export async function uploadForm(
  url: string,
  opts: UploadOptions
): Promise<Response> {
  const form = new FormData();

  for (const [key, value] of Object.entries(opts.fields ?? {})) {
    form.append(key, value);
  }

  for (const [field, file] of Object.entries(opts.files)) {
    const part = await toFormDataPart(file);
    form.append(field, part, fileNameFor(file));
  }

  const init = {
    method: opts.method ?? "POST",
    body: form,
    headers: opts.headers,
    signal: opts.signal,
  };

  return Platform.OS === "web"
    ? fetch(url, init)
    : expoFetch(url, init);
}