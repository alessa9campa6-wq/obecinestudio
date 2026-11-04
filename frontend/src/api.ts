import { uploadForm } from "@/src/utils/upload";

const BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;
export const TOKEN_KEY = "auth_token";

let token: string | null = null;
let onUnauthorized: () => void = () => {};

export const setToken = (t: string | null) => {
  token = t;
};
export const getToken = () => token;
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

export type User = { user_id: string; email: string; name: string; picture?: string | null; role: string };
export type Project = {
  id: string;
  title: string;
  type: string;
  logline: string;
  genre: string;
  status: string;
  director: string;
  client?: string;
  modules?: string[];
  cover_path?: string | null;
  created_at: string;
  updated_at: string;
};
export type Item = {
  id: string;
  project_id: string;
  module: string;
  title: string;
  data: Record<string, any>;
  order: number;
  created_at: string;
  updated_at: string;
};

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch(BASE + path, {
    method: opts.method ?? "GET",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (r.status === 401 && token && !path.startsWith("/auth/")) onUnauthorized();
  if (!r.ok) {
    let msg: unknown;
    try {
      msg = (await r.json()).detail;
    } catch {}
    if (Array.isArray(msg)) {
      const field = msg[0]?.loc?.slice(-1)[0];
      throw new Error(field === "password" ? "La password deve avere almeno 6 caratteri" : "Controlla i dati inseriti");
    }
    throw new Error(typeof msg === "string" ? msg : `Errore ${r.status}`);
  }
  return r.json();
}

export const fileUrl = (path: string) => `${BASE}/files/${path}?token=${token ?? ""}`;

export async function uploadImage(asset: { uri: string; fileName?: string | null; mimeType?: string | null }): Promise<string> {
  const res = await uploadForm(`${BASE}/upload`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    files: { file: { uri: asset.uri, name: asset.fileName ?? "image.jpg", mimeType: asset.mimeType ?? "image/jpeg" } },
  });
  if (!res.ok) {
    if (res.status === 402) throw new Error("Spazio di archiviazione esaurito");
    throw new Error("Caricamento non riuscito");
  }
  return (await res.json()).path;
}
