// Sessione: token di accesso e utente in cache.
//
// Su telefono finiscono nel Keychain; su web (quindi anche nell'app desktop
// per Mac) il Keychain non esiste e ci pensa AsyncStorage, tramite la variante
// web dello storage. Qui non serve chiedere su quale piattaforma siamo: Metro
// carica session.web.ts quando il codice gira nel browser.
import * as SecureStore from "expo-secure-store";

import { TOKEN_KEY, type User } from "@/src/api";
import { storage } from "@/src/utils/storage";

const USER_KEY = "cinestudio_user";

export async function readToken(): Promise<string | null> {
  const saved = await storage.secureGet<string | null>(TOKEN_KEY, null);
  if (saved) return saved;
  // Token scritto dalle versioni precedenti dell'app (stringa nuda, senza la
  // serializzazione usata adesso): lo leggo e lo riscrivo nel formato nuovo,
  // così chi era già dentro non deve rifare l'accesso.
  try {
    const legacy = await SecureStore.getItemAsync(TOKEN_KEY);
    if (legacy) {
      await storage.secureSet(TOKEN_KEY, legacy);
      return legacy;
    }
  } catch {
    // niente da recuperare
  }
  return null;
}

export async function writeToken(token: string): Promise<void> {
  await storage.secureSet(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await storage.secureRemove(TOKEN_KEY);
}

export async function readCachedUser(): Promise<User | null> {
  const saved = await storage.secureGet<string | null>(USER_KEY, null);
  if (saved) {
    try {
      return JSON.parse(saved) as User;
    } catch {
      return null;
    }
  }
  try {
    const legacy = await SecureStore.getItemAsync(USER_KEY);
    if (legacy) {
      const user = JSON.parse(legacy) as User;
      await storage.secureSet(USER_KEY, legacy);
      return user;
    }
  } catch {
    // cache non valida: la ricarichiamo da /auth/me
  }
  return null;
}

export async function writeCachedUser(user: User): Promise<void> {
  await storage.secureSet(USER_KEY, JSON.stringify(user));
}

export async function clearCachedUser(): Promise<void> {
  await storage.secureRemove(USER_KEY);
}
