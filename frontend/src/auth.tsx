import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";

import {
  api,
  setToken,
  setUnauthorizedHandler,
  TOKEN_KEY,
  type User,
} from "@/src/api";

type AuthContextType = {
  user: User | null;
  // Aggiornato dal profilo dopo il salvataggio in /account.
  setUser: (user: User | null) => void;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (
    email: string,
    code: string,
    password: string
  ) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve essere usato dentro AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback(
    async (data: { session_token: string; user: User }) => {
      await SecureStore.setItemAsync(TOKEN_KEY, data.session_token);
      await SecureStore.setItemAsync(
        "cinestudio_user",
        JSON.stringify(data.user)
      );
      setToken(data.session_token);
      setUser(data.user);
    },
    []
  );

  const clearSession = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync("cinestudio_user");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });

    const bootstrap = async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!token) return;
        setToken(token);

        const cachedUser = await SecureStore.getItemAsync("cinestudio_user");
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser) as User);
          } catch {
            // Dati cache non validi: li ignoriamo
          }
        }

        try {
          const me = await api<User>("/auth/me");
          setUser(me);
          await SecureStore.setItemAsync(
            "cinestudio_user",
            JSON.stringify(me)
          );
        } catch {
          // Offline o errore di rete: manteniamo l'utente salvato
        }
      } catch {
        await clearSession();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api<{ session_token: string; user: User }>(
        "/auth/login",
        { method: "POST", body: { email, password } }
      );
      await persist(data);
    },
    [persist]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const data = await api<{ session_token: string; user: User }>(
        "/auth/register",
        { method: "POST", body: { email, password, name } }
      );
      await persist(data);
    },
    [persist]
  );

  const loginGoogle = useCallback(async () => {
    throw new Error("Accesso con Google non disponibile");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      await clearSession();
    }
  }, [clearSession]);

  const forgotPassword = useCallback(async (email: string) => {
    await api("/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
  }, []);

  const resetPassword = useCallback(
    async (email: string, code: string, password: string) => {
      await api("/auth/reset-password", {
        method: "POST",
        body: { email, code, password },
      });
      await login(email, password);
    },
    [login]
  );

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      login,
      register,
      loginGoogle,
      logout,
      forgotPassword,
      resetPassword,
    }),
    [
      user,
      setUser,
      loading,
      login,
      register,
      loginGoogle,
      logout,
      forgotPassword,
      resetPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
