import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

import { api, setToken, setUnauthorizedHandler, TOKEN_KEY, User } from "@/src/api";
import { storage } from "@/src/utils/storage";

WebBrowser.maybeCompleteAuthSession();

type AuthRes = { session_token: string; user: User };
type Ctx = {
  user: User | null | undefined;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
};

const AuthContext = createContext<Ctx>(null as unknown as Ctx);
export const useAuth = () => useContext(AuthContext);

const usedSessionIds = new Set<string>();
const extractSid = (url: string | null) => {
  const m = url?.match(/[?#&]session_id=([^&#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  const clear = useCallback(async () => {
    setToken(null);
    await storage.secureRemove(TOKEN_KEY);
    setUser(null);
  }, []);

  const persist = useCallback(async (res: AuthRes) => {
    setToken(res.session_token);
    await storage.secureSet(TOKEN_KEY, res.session_token);
    setUser(res.user);
  }, []);

  const exchange = useCallback(
    async (sid: string) => {
      if (usedSessionIds.has(sid)) return false;
      usedSessionIds.add(sid);
      try {
        await persist(await api<AuthRes>("/auth/session", { method: "POST", body: { session_id: sid } }));
        return true;
      } catch {
        return false;
      }
    },
    [persist],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clear();
    });
    let sub: { remove: () => void } | undefined;
    (async () => {
      let handled = false;
      if (Platform.OS === "web") {
        const sid = extractSid(window.location.href);
        if (sid) {
          handled = await exchange(sid);
          if (handled) {
            const u = new URL(window.location.href);
            u.searchParams.delete("session_id");
            u.hash = u.hash.replace(/session_id=[^&]*&?/, "").replace(/^#$/, "");
            window.history.replaceState(window.history.state, "", u.toString());
          }
        }
      } else {
        const sid = extractSid(await Linking.getInitialURL());
        if (sid) handled = await exchange(sid);
        sub = Linking.addEventListener("url", ({ url }) => {
          const s = extractSid(url);
          if (s) exchange(s);
        });
      }
      if (handled) return;
      const stored = await storage.secureGet(TOKEN_KEY, null);
      if (typeof stored === "string" && stored) {
        setToken(stored);
        try {
          setUser(await api<User>("/auth/me"));
        } catch {
          await clear();
        }
      } else {
        setUser(null);
      }
    })();
    return () => sub?.remove();
  }, [clear, exchange]);

  const login = async (email: string, password: string) =>
    persist(await api<AuthRes>("/auth/login", { method: "POST", body: { email, password } }));

  const register = async (email: string, password: string, name: string) =>
    persist(await api<AuthRes>("/auth/register", { method: "POST", body: { email, password, name } }));

  const loginGoogle = async () => {
    const redirect = Platform.OS === "web" ? window.location.origin + "/" : Linking.createURL("");
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirect)}`;
    if (Platform.OS === "web") {
      window.location.href = authUrl;
      return;
    }
    let captured: string | null = null;
    const s = Linking.addEventListener("url", ({ url }) => {
      captured = url;
    });
    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirect);
      const url = (result.type === "success" ? result.url : null) ?? captured ?? (await Linking.getInitialURL());
      const sid = extractSid(url);
      if (sid) await exchange(sid);
    } finally {
      s.remove();
    }
  };

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {}
    await clear();
  };

  return <AuthContext.Provider value={{ user, login, register, loginGoogle, logout, setUser }}>{children}</AuthContext.Provider>;
}
