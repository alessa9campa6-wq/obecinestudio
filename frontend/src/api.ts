import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import NetInfo from "@react-native-community/netinfo";

import { queryClient } from "@/src/query-client";
import { uploadForm } from "@/src/utils/upload";

const BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;
export const TOKEN_KEY = "auth_token";
const QUEUE_KEY = "cinestudio_offline_queue";
const MEDIA_QUEUE_KEY = "cinestudio_media_queue";

let token: string | null = null;
let onUnauthorized: () => void = () => {};

export const setToken = (t: string | null) => {
  token = t;
};
export const getToken = () => token;
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

// Il noleggio dichiarato nel profilo (facoltativo): serve a farsi trovare e a
// mostrare con cosa si lavora.
export type Rental = { nome?: string; citta?: string; telefono?: string; email?: string; sito?: string; attrezzatura?: string; note?: string };
export type User = { user_id: string; email: string; name: string; username?: string; picture?: string | null; role: string; profiles?: string[]; crew_role?: string; view_mode?: string; bio?: string; link?: string; rental?: Rental };
// Una persona trovata con la ricerca: serve a invitarla nel team per @nome.
export type Person = { user_id: string; username: string; name: string; picture?: string | null };
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
  owner_id?: string;
  members?: { user_id?: string; username?: string; name?: string; picture?: string | null; email: string; role: string; job?: string }[];
  my_role?: "owner" | "admin" | "editor" | "viewer";
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

type QueuedOp = {
  kind: "create" | "update" | "delete";
  path: string;
  body?: any;
  tempId?: string;
};

type PendingMedia = {
  localPath: string;
  uri: string;
  fileName: string;
  mimeType: string;
};

const tempId = () => "temp_" + Math.random().toString(36).slice(2) + Date.now().toString(36);

async function getQueue(): Promise<QueuedOp[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function setQueue(ops: QueuedOp[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
}

async function getMediaQueue(): Promise<PendingMedia[]> {
  const raw = await AsyncStorage.getItem(MEDIA_QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function setMediaQueue(items: PendingMedia[]) {
  await AsyncStorage.setItem(MEDIA_QUEUE_KEY, JSON.stringify(items));
}

export function localMediaUri(path: string) {
  return FileSystem.documentDirectory + path.replace("local://media/", "media/");
}

export async function saveLocalMedia(asset: { uri: string; fileName?: string | null; mimeType?: string | null }): Promise<string> {
  const dir = FileSystem.documentDirectory + "media/";
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const ext = asset.fileName?.includes(".") ? asset.fileName.split(".").pop() : "jpg";
  const name = tempId() + "." + (ext ?? "jpg");
  const dest = dir + name;
  await FileSystem.copyAsync({ from: asset.uri, to: dest });
  const localPath = "local://media/" + name;
  const queue = await getMediaQueue();
  queue.push({
    localPath,
    uri: dest,
    fileName: name,
    mimeType: asset.mimeType ?? "image/jpeg",
  });
  await setMediaQueue(queue);
  return localPath;
}

async function rawRequest<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
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

async function uploadPendingMedia(): Promise<Map<string, string>> {
  const queue = await getMediaQueue();
  const map = new Map<string, string>();
  const remaining: PendingMedia[] = [];

  for (const m of queue) {
    try {
      const serverPath = await uploadImage({
        uri: m.uri,
        fileName: m.fileName,
        mimeType: m.mimeType,
      });
      map.set(m.localPath, serverPath);
      await FileSystem.deleteAsync(m.uri, { idempotent: true });
    } catch {
      remaining.push(m);
    }
  }

  await setMediaQueue(remaining);
  return map;
}

let syncing = false;

export async function syncOfflineQueue() {
  if (syncing) return;
  syncing = true;
  try {
    await runSync();
  } finally {
    syncing = false;
  }
}

async function runSync() {
  const mediaMap = await uploadPendingMedia();
  const ops = await getQueue();
  if (!ops.length) return;

  const remaining: QueuedOp[] = [];
  const idMap = new Map<string, string>();

  const resolveBody = (body: any) => {
    if (!body) return body;
    const json = JSON.stringify(body).replace(/local:\/\/media\/[A-Za-z0-9._-]+/g, (m) => mediaMap.get(m) ?? m);
    if (json.includes("local://media/")) return null;
    return JSON.parse(json);
  };

  for (const op of ops) {
    try {
      const body = resolveBody(op.body);
      if (body === null && op.body) {
        remaining.push(op);
        continue;
      }
      if (op.kind === "create") {
        const created = await rawRequest<Item>("POST", op.path, body);
        if (op.tempId) idMap.set(op.tempId, created.id);
      } else if (op.kind === "update") {
        const realId = op.tempId ? idMap.get(op.tempId) ?? op.tempId : op.tempId ?? "";
        const path = op.path.replace(/temp_[a-z0-9]+/, realId);
        await rawRequest("PUT", path, body);
      } else {
        const realId = op.tempId ? idMap.get(op.tempId) ?? op.tempId : op.tempId ?? "";
        const path = op.path.replace(/temp_[a-z0-9]+/, realId);
        await rawRequest("DELETE", path);
      }
    } catch {
      remaining.push(op);
    }
  }

  await setQueue(remaining);
  void queryClient.invalidateQueries();
}

export function initOfflineSync() {
  void NetInfo.fetch().then((state) => {
    if (state.isConnected) void syncOfflineQueue();
  });
  return NetInfo.addEventListener((state) => {
    if (state.isConnected) void syncOfflineQueue();
  });
}

async function handleOffline(method: string, path: string, body: unknown): Promise<any> {
  const now = new Date().toISOString();

  const createMatch = path.match(/^\/projects\/([^/]+)\/items$/);
  if (method === "POST" && createMatch) {
    const pid = createMatch[1];
    const b = body as { module: string; title: string; data?: Record<string, any> };
    const id = tempId();
    const item: Item = {
      id,
      project_id: pid,
      module: b.module,
      title: b.title,
      data: b.data ?? {},
      order: 0,
      created_at: now,
      updated_at: now,
    };
    const ops = await getQueue();
    ops.push({ kind: "create", path, body: { ...b, data: item.data }, tempId: id });
    await setQueue(ops);
    return item;
  }

  const itemMatch = path.match(/^\/items\/([^/]+)$/);
  if (itemMatch) {
    const id = itemMatch[1];
    const ops = await getQueue();

    if (method === "PUT") {
      if (id.startsWith("temp_")) {
        const op = ops.find((o) => o.kind === "create" && o.tempId === id);
        if (op) op.body = { ...op.body, ...(body as any) };
        await setQueue(ops);
      } else {
        ops.push({ kind: "update", path, body, tempId: id });
        await setQueue(ops);
      }
      return { ok: true };
    }

    if (method === "DELETE") {
      if (id.startsWith("temp_")) {
        await setQueue(ops.filter((o) => !(o.kind === "create" && o.tempId === id)));
      } else {
        ops.push({ kind: "delete", path, tempId: id });
        await setQueue(ops);
      }
      return { ok: true };
    }
  }

  throw new Error("Questa azione richiede una connessione internet");
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = opts.method ?? "GET";

  if (method !== "GET") {
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      return handleOffline(method, path, opts.body) as Promise<T>;
    }
  }

  return rawRequest<T>(method, path, opts.body);
}

export const fileUrl = (path: string) => {
  if (path.startsWith("local://")) return localMediaUri(path);
  return `${BASE}/files/${path}?token=${token ?? ""}`;
};

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

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type AssistantReply = { reply: string; azioni?: string[] };

// Goes through api() so it gets login handling, clear errors and the "needs internet" message offline.
// `struttura` è il catalogo di moduli/campi del progetto (vedi strutturaPer): senza,
// il backend tiene l'assistente in sola lettura e non applica nessuna modifica.
export async function askAssistantConAzioni(
  message: string,
  history: ChatTurn[] = [],
  projectId?: string | null,
  struttura: unknown[] = []
): Promise<AssistantReply> {
  return api<AssistantReply>("/assistant", {
    method: "POST",
    body: { message, history, project_id: projectId ?? null, struttura },
  });
}
