// Archivio dei messaggi di Boris, fuori dai componenti: la chat si chiude e si
// riapre continuamente (è un Modal), quindi lo stato non può vivere dentro
// BorisChat o sparirebbe a ogni chiusura. Ogni conversazione ha un suo "scope":
// "home" per l'assistente generale, "project:<id>" per un progetto. Così la chat
// della home e quella di un progetto non si mescolano, e la conversazione viene
// anche salvata sul telefono (sopravvive alla chiusura dell'app).

import AsyncStorage from "@react-native-async-storage/async-storage";

export type ChatMsg = { role: "user" | "assistant"; content: string; error?: boolean };

const VUOTO: ChatMsg[] = [];
const memoria = new Map<string, ChatMsg[]>();
const ascoltatori = new Map<string, Set<() => void>>();
const giaLette = new Set<string>();
const inCorso = new Map<string, Promise<void>>();

export const chatScope = (projectId: string | null | undefined): string => (projectId ? `project:${projectId}` : "home");

const chiave = (scope: string) => `boris:chat:${scope}`;

function notifica(scope: string): void {
  ascoltatori.get(scope)?.forEach((fn) => fn());
}

/** Messaggi attuali di una conversazione (riferimento stabile finché non cambiano). */
export function messaggiDi(scope: string): ChatMsg[] {
  return memoria.get(scope) ?? VUOTO;
}

function salva(scope: string, msgs: ChatMsg[]): void {
  memoria.set(scope, msgs);
  notifica(scope);
  // Il salvataggio non deve bloccare l'interfaccia: se fallisce, i messaggi
  // restano comunque in memoria per questa sessione.
  void AsyncStorage.setItem(chiave(scope), JSON.stringify(msgs.slice(-200))).catch(() => {});
}

export function scriviMessaggi(scope: string, msgs: ChatMsg[]): void {
  salva(scope, msgs);
}

/** Legge dal telefono la conversazione, una volta sola per sessione. */
export function caricaChat(scope: string): Promise<void> {
  if (giaLette.has(scope)) return Promise.resolve();
  const gia = inCorso.get(scope);
  if (gia) return gia;
  giaLette.add(scope);
  const p = AsyncStorage.getItem(chiave(scope))
    .then((grezzo) => {
      if (!grezzo) return;
      // Se nel frattempo sono arrivati messaggi nuovi, non li sovrascriviamo.
      if (messaggiDi(scope).length) return;
      try {
        const letti = JSON.parse(grezzo);
        if (Array.isArray(letti) && letti.length) salva(scope, letti as ChatMsg[]);
      } catch {
        // Dati illeggibili: si riparte da una chat vuota.
      }
    })
    .catch(() => {})
    .finally(() => inCorso.delete(scope));
  inCorso.set(scope, p);
  return p;
}

/** Cancella la conversazione (pulsante "Nuova chat"). */
export function svuotaChat(scope: string): void {
  memoria.set(scope, VUOTO);
  notifica(scope);
  void AsyncStorage.removeItem(chiave(scope)).catch(() => {});
}

export function iscrivi(scope: string, fn: () => void): () => void {
  let set = ascoltatori.get(scope);
  if (!set) {
    set = new Set();
    ascoltatori.set(scope, set);
  }
  set.add(fn);
  return () => {
    set!.delete(fn);
    if (!set!.size) ascoltatori.delete(scope);
  };
}
