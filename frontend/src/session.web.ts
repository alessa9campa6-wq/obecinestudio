// Sessione sul web (browser e app desktop per Mac): niente Keychain, quindi
// token e utente stanno in AsyncStorage. Stesse funzioni di session.ts.
import { TOKEN_KEY, type User } from "@/src/api";
import { storage } from "@/src/utils/storage";

const USER_KEY = "cinestudio_user";

export async function readToken(): Promise<string | null> {
  return storage.secureGet<string | null>(TOKEN_KEY, null);
}

export async function writeToken(token: string): Promise<void> {
  await storage.secureSet(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await storage.secureRemove(TOKEN_KEY);
}

export async function readCachedUser(): Promise<User | null> {
  const saved = await storage.secureGet<string | null>(USER_KEY, null);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as User;
  } catch {
    return null;
  }
}

export async function writeCachedUser(user: User): Promise<void> {
  await storage.secureSet(USER_KEY, JSON.stringify(user));
}

export async function clearCachedUser(): Promise<void> {
  await storage.secureRemove(USER_KEY);
}
